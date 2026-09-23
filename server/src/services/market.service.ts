import { BitkubAdapter } from '../adapters/bitkub.adapter.js';
import { BinanceAdapter } from '../adapters/binance.adapter.js';
import { marketStore } from '../database/store.js';
import { INITIAL_COINS } from '../config/sectors.js';
import { TechnicalScoringEngine } from '../engines/scoring.engine.js';
import { AIEngine } from '../engines/ai.engine.js';

export class MarketService {
  private bitkubAdapter = new BitkubAdapter();
  private binanceAdapter = new BinanceAdapter();
  private isPolling = false;
  private pollIntervalMs = 20000; // Poll every 20 seconds
  private lastFetchStatus: 'Live' | 'Delayed' | 'Stale' = 'Live';
  
  // Track which symbols are currently on Bitkub
  private bitkubSymbols: Set<string> = new Set();

  constructor() {}

  async start() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log('[MarketService] Starting market data poller...');
    
    // Initial fetch
    await this.syncMarketData();

    // Loop
    setInterval(async () => {
      await this.syncMarketData();
    }, this.pollIntervalMs);
  }

  async syncMarketData() {
    try {
      // 1. Fetch Bitkub Tickers (all coins)
      const bitkubTickers = await this.bitkubAdapter.fetchTickers();
      
      // Update real live USD/THB rate from Bitkub's THB_USDT pair
      if (bitkubTickers['THB_USDT'] && bitkubTickers['THB_USDT'].last > 0) {
        marketStore.setUsdThbRate(bitkubTickers['THB_USDT'].last);
      }
      const liveUsdThbRate = marketStore.getUsdThbRate();

      // 2. Get all dynamic Bitkub coins
      const bitkubDynamicCoins = await this.bitkubAdapter.fetchAllBitkubCoins(liveUsdThbRate);
      
      // Track current Bitkub symbols for auto-removal of delisted coins
      const newBitkubSymbols = new Set(bitkubDynamicCoins.map(c => c.symbol));
      
      // Remove coins that are no longer on Bitkub (auto-delist)
      if (this.bitkubSymbols.size > 0) {
        for (const oldSymbol of this.bitkubSymbols) {
          if (!newBitkubSymbols.has(oldSymbol)) {
            console.log(`[MarketService] Coin delisted from Bitkub: ${oldSymbol}`);
            marketStore.removeTicker(oldSymbol);
          }
        }
      }
      this.bitkubSymbols = newBitkubSymbols;

      // 3. Fetch Binance Tickers (for supplemental data)
      const binanceTickers = await this.binanceAdapter.fetchTickers();

      // 4. Update/Add all Bitkub coins dynamically
      for (const bkCoin of bitkubDynamicCoins) {
        let price = bkCoin.last;
        let change24h = bkCoin.percentChange;
        let volume24h = bkCoin.volume24h;
        let high24h = bkCoin.high24h;
        let low24h = bkCoin.low24h;

        // Prefer Binance data if available for better accuracy
        const binanceKey = bkCoin.binanceSymbol;
        if (binanceTickers[binanceKey]) {
          const bn = binanceTickers[binanceKey];
          price = bn.last;
          change24h = bn.percentChange;
          volume24h = bn.quoteVolume24h;
          high24h = bn.high24h;
          low24h = bn.low24h;
        }

        if (price > 0) {
          marketStore.updateOrAddBitkubTicker(bkCoin.symbol, bkCoin.name, {
            price,
            change24h,
            volume24h,
            high24h,
            low24h,
          });
        }
      }

      // 5. Fetch Real Global Metrics from CoinGecko (Free public endpoint)
      try {
        const cgRes = await fetch('https://api.coingecko.com/api/v3/global');
        if (cgRes.ok) {
          const cgData = await cgRes.json() as {
            data: {
              total_market_cap: { usd: number; thb: number };
              total_volume: { usd: number; thb: number };
              market_cap_percentage: { btc: number };
              market_cap_change_percentage_24h_usd: number;
              volume_change_percentage_24h_usd?: number;
            };
          };
          if (cgData?.data) {
            const d = cgData.data;
            marketStore.updateGlobalKPIs({
              totalMarketCap: d.total_market_cap?.usd ?? 2.73e12,
              totalMarketCapThb: d.total_market_cap?.thb ?? (d.total_market_cap?.usd * liveUsdThbRate),
              volume24h: d.total_volume?.usd ?? 79.4e9,
              volume24hThb: d.total_volume?.thb ?? (d.total_volume?.usd * liveUsdThbRate),
              btcDominance: Number((d.market_cap_percentage?.btc ?? 58.9).toFixed(1)),
              marketCapChange24h: Number((d.market_cap_change_percentage_24h_usd ?? -4.58).toFixed(2)),
              volumeChange24h: Number((d.volume_change_percentage_24h_usd ?? -35.9).toFixed(1)),
            });
          }
        }
      } catch (cgErr) {
        // keep current cached global KPIs
      }

      // 6. Fetch Live Fear & Greed Index from Alternative.me
      try {
        const fngRes = await fetch('https://api.alternative.me/fng/?limit=1');
        if (fngRes.ok) {
          const fngData = await fngRes.json() as { data: Array<{ value: string; value_classification: string }> };
          if (fngData?.data?.[0]) {
            const val = parseInt(fngData.data[0].value, 10);
            const sentiment = fngData.data[0].value_classification;
            if (!isNaN(val)) {
              marketStore.updateFearAndGreed(val, sentiment);
            }
          }
        }
      } catch {
        // keep current value
      }

      // 7. Pre-warm top coin candles in cache
      try {
        await marketStore.getCandles('BTC');
      } catch {}

      console.log(`[MarketService] Synced ${bitkubDynamicCoins.length} Bitkub coins`);
      this.lastFetchStatus = 'Live';
    } catch (err) {
      console.warn('[MarketService] Sync failed:', (err as Error).message);
      this.lastFetchStatus = 'Delayed';
    }
  }

  getBitkubSymbols(): string[] {
    return Array.from(this.bitkubSymbols);
  }

  getStatus() {
    return {
      status: this.lastFetchStatus,
      lastUpdated: new Date().toISOString(),
      bitkubCoinsCount: this.bitkubSymbols.size,
      exchanges: {
        bitkub: { name: 'Bitkub', status: 'Connected', isPrimary: true },
        binance: { name: 'Binance', status: 'Connected', isPrimary: false },
        bybit: { name: 'Bybit', status: 'Ready to connect', isPrimary: false },
        okx: { name: 'OKX', status: 'Ready to connect', isPrimary: false },
        kucoin: { name: 'KuCoin', status: 'Ready to connect', isPrimary: false },
      },
    };
  }
}

export const marketService = new MarketService();
