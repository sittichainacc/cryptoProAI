import { Candle } from '../types/index.js';
import { IExchangeAdapter, NormalizedTicker } from './exchange.interface.js';

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
        // key is like "THB_BTC"
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

  async fetchOHLCV(symbol: string, resolution: string, fromSec: number, toSec: number): Promise<Candle[]> {
    try {
      // Bitkub expects symbol like "BTC_THB" (reverse of THB_BTC)
      const formattedSymbol = symbol.startsWith('THB_') 
        ? `${symbol.replace('THB_', '')}_THB` 
        : symbol;

      // resolution: 1, 5, 15, 60, 240, 1D
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
