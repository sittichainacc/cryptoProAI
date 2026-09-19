import { BitkubAdapter } from '../adapters/bitkub.adapter.js';
import { BinanceAdapter } from '../adapters/binance.adapter.js';
import { marketStore } from '../database/store.js';
import { INITIAL_COINS } from '../config/sectors.js';

export class MarketService {
  private bitkubAdapter = new BitkubAdapter();
  private binanceAdapter = new BinanceAdapter();
  private isPolling = false;
  private pollIntervalMs = 20000; // Poll every 20 seconds
  private lastFetchStatus: 'Live' | 'Delayed' | 'Stale' = 'Live';

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
      // 1. Fetch Bitkub Tickers
      const bitkubTickers = await this.bitkubAdapter.fetchTickers();
      
      // 2. Fetch Binance Tickers (for global & USDT pairs)
      const binanceTickers = await this.binanceAdapter.fetchTickers();

      let updatedCount = 0;

      for (const coin of INITIAL_COINS) {
        let price: number | null = null;
        let change24h: number | null = null;
        let volume24h: number | null = null;
        let high24h: number | null = null;
        let low24h: number | null = null;

        // Prefer Bitkub if coin is listed on Bitkub
        if (coin.bitkubSymbol && bitkubTickers[coin.bitkubSymbol]) {
          const bk = bitkubTickers[coin.bitkubSymbol];
          // Convert THB to USD approximately (e.g. /34) for unified display if USD selected or keep THB
          // Let's store USD equivalent or native THB
          // If quoteAsset is USDT, we prefer Binance price; if THB we can use Bitkub
          if (coin.quoteAsset === 'THB') {
            // Convert to approximate USD for global comparison or keep
            // 1 USD ~ 34.5 THB
            price = bk.last / 34.5;
            change24h = bk.percentChange;
            volume24h = bk.quoteVolume24h / 34.5;
            high24h = bk.high24h / 34.5;
            low24h = bk.low24h / 34.5;
          }
        }

        // Check Binance
        if (coin.binanceSymbol && binanceTickers[coin.binanceSymbol]) {
          const bn = binanceTickers[coin.binanceSymbol];
          price = bn.last;
          change24h = bn.percentChange;
          volume24h = bn.quoteVolume24h;
          high24h = bn.high24h;
          low24h = bn.low24h;
        }

        if (price !== null && change24h !== null) {
          marketStore.updateTicker(coin.symbol, {
            price,
            change24h,
            volume24h: volume24h ?? undefined,
            high24h: high24h ?? undefined,
            low24h: low24h ?? undefined,
          });
          updatedCount++;
        }
      }

      // 3. Fetch Live Fear & Greed Index from Alternative.me (Zero auth required)
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

      this.lastFetchStatus = 'Live';
      // console.log(`[MarketService] Market data synced: ${updatedCount} coins updated.`);
    } catch (err) {
      console.warn('[MarketService] Sync failed:', (err as Error).message);
      this.lastFetchStatus = 'Delayed';
    }
  }

  getStatus() {
    return {
      status: this.lastFetchStatus,
      lastUpdated: new Date().toISOString(),
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
