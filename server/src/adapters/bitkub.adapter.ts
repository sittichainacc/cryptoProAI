import { Candle } from '../types/index.js';
import { IExchangeAdapter, NormalizedTicker } from './exchange.interface.js';

// Known coin names for display purposes
const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB',
  XRP: 'Ripple', ADA: 'Cardano', DOT: 'Polkadot', DOGE: 'Dogecoin',
  SHIB: 'Shiba Inu', AVAX: 'Avalanche', LINK: 'Chainlink', UNI: 'Uniswap',
  MATIC: 'Polygon', POL: 'Polygon', ATOM: 'Cosmos', LTC: 'Litecoin',
  ETC: 'Ethereum Classic', XLM: 'Stellar', ALGO: 'Algorand', VET: 'VeChain',
  FIL: 'Filecoin', AAVE: 'Aave', CAKE: 'PancakeSwap', SAND: 'The Sandbox',
  MANA: 'Decentraland', GALA: 'Gala Games', AXS: 'Axie Infinity',
  IMX: 'ImmutableX', GRT: 'The Graph', KAVA: 'Kava', SUI: 'Sui',
  SEI: 'Sei Network', ARB: 'Arbitrum', JUP: 'Jupiter', FET: 'Fetch.ai',
  CRV: 'Curve DAO', IO: 'io.net', ACH: 'Alchemy Pay',
  NEAR: 'NEAR Protocol', WLD: 'Worldcoin', COMP: 'Compound',
  SNX: 'Synthetix', ZRX: '0x Protocol', YFI: 'Yearn Finance',
  BAL: 'Balancer', SUSHI: 'SushiSwap', MKR: 'Maker',
  ENS: 'Ethereum Name Service', OP: 'Optimism', RENDER: 'Render',
  TAO: 'Bittensor', TON: 'Toncoin', APT: 'Aptos', PEPE: 'Pepe',
  BONK: 'Bonk', FLOKI: 'Floki', WIF: 'dogwifhat',
  TRX: 'TRON', XTZ: 'Tezos', EOS: 'EOS', BAT: 'Basic Attention Token',
  ZIL: 'Zilliqa', IOTA: 'IOTA', NEO: 'NEO', ONT: 'Ontology',
  WAVES: 'Waves', ICX: 'ICON', ZEN: 'Horizen', DASH: 'Dash',
  ZEC: 'Zcash', XEM: 'NEM', QTUM: 'Qtum', LSK: 'Lisk',
  REP: 'Augur', KNC: 'Kyber Network', RLC: 'iExec RLC',
  STORJ: 'Storj', CVC: 'Civic', BNT: 'Bancor', ANT: 'Aragon',
  BAND: 'Band Protocol', CHZ: 'Chiliz', FLOW: 'Flow',
  HBAR: 'Hedera', ICP: 'Internet Computer', INJ: 'Injective',
  LDO: 'Lido DAO', PEPE2: 'Pepe 2.0',
};

export interface BitkubCoinInfo {
  symbol: string;
  name: string;
  bitkubSymbol: string;
  binanceSymbol: string;
  last: number;      // USD price
  percentChange: number;
  volume24h: number; // USD volume
  high24h: number;
  low24h: number;
}

export class BitkubAdapter implements IExchangeAdapter {
  name = 'bitkub';
  private baseUrl = 'https://api.bitkub.com';

  async fetchTickers(): Promise<Record<string, NormalizedTicker>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market/ticker`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Bitkub ticker error status ${response.status}`);
      }
      const data = await response.json() as Record<string, {
        last: number;
        high24hr: number;
        low24hr: number;
        percentChange: number;
        baseVolume: number;
        quoteVolume: number;
      }>;

      const normalized: Record<string, NormalizedTicker> = {};
      for (const [key, item] of Object.entries(data)) {
        normalized[key] = {
          symbol: key,
          last: Number(item.last),
          high24h: Number(item.high24hr),
          low24h: Number(item.low24hr),
          percentChange: Number(item.percentChange),
          volume24h: Number(item.baseVolume),
          quoteVolume24h: Number(item.quoteVolume),
        };
      }
      return normalized;
    } catch (err) {
      console.warn('[BitkubAdapter] Failed to fetch tickers:', (err as Error).message);
      return {};
    }
  }

  /**
   * Fetch ALL coins listed on Bitkub from their ticker API dynamically.
   * Returns normalized coin info for each THB_XXX pair.
   */
  async fetchAllBitkubCoins(usdThbRate: number): Promise<BitkubCoinInfo[]> {
    try {
      const tickers = await this.fetchTickers();
      const coins: BitkubCoinInfo[] = [];

      for (const [key, ticker] of Object.entries(tickers)) {
        if (!key.startsWith('THB_')) continue;
        const symbol = key.replace('THB_', '');
        // Skip stablecoins
        if (['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD'].includes(symbol)) continue;
        if (ticker.last <= 0) continue;

        coins.push({
          symbol,
          name: COIN_NAMES[symbol] ?? symbol,
          bitkubSymbol: key,
          binanceSymbol: `${symbol}USDT`,
          last: ticker.last / usdThbRate,
          percentChange: ticker.percentChange,
          volume24h: ticker.quoteVolume24h / usdThbRate,
          high24h: ticker.high24h / usdThbRate,
          low24h: ticker.low24h / usdThbRate,
        });
      }

      return coins.sort((a, b) => b.volume24h - a.volume24h);
    } catch (err) {
      console.warn('[BitkubAdapter] fetchAllBitkubCoins failed:', (err as Error).message);
      return [];
    }
  }

  async fetchOHLCV(symbol: string, resolution: string, fromSec: number, toSec: number): Promise<Candle[]> {
    try {
      const formattedSymbol = symbol.startsWith('THB_') 
        ? `${symbol.replace('THB_', '')}_THB` 
        : symbol;

      let resParam = resolution;
      if (resolution === '1h') resParam = '60';
      if (resolution === '4h') resParam = '240';
      if (resolution === '15m') resParam = '15';
      if (resolution === '5m') resParam = '5';
      if (resolution === '1m') resParam = '1';
      if (resolution === '1D' || resolution === '1d') resParam = '1D';

      const url = `${this.baseUrl}/tradingview/history?symbol=${formattedSymbol}&resolution=${resParam}&from=${fromSec}&to=${toSec}`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json() as {
        s: string;
        t: number[];
        o: number[];
        h: number[];
        l: number[];
        c: number[];
        v: number[];
      };

      if (data.s !== 'ok' || !data.t) return [];

      const candles: Candle[] = [];
      for (let i = 0; i < data.t.length; i++) {
        candles.push({
          time: data.t[i],
          open: Number(data.o[i]),
          high: Number(data.h[i]),
          low: Number(data.l[i]),
          close: Number(data.c[i]),
          volume: Number(data.v[i]),
        });
      }
      return candles;
    } catch (err) {
      console.warn('[BitkubAdapter] OHLCV fetch failed:', (err as Error).message);
      return [];
    }
  }
}
