import { Candle } from '../types/index.js';
import { IExchangeAdapter, NormalizedTicker } from './exchange.interface.js';

export class BinanceAdapter implements IExchangeAdapter {
  name = 'binance';
  private baseUrl = 'https://api.binance.com';

  async fetchTickers(): Promise<Record<string, NormalizedTicker>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/ticker/24hr`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Binance ticker error status ${response.status}`);
      }
      const data = await response.json() as Array<{
        symbol: string;
        lastPrice: string;
        highPrice: string;
        lowPrice: string;
        priceChangePercent: string;
        volume: string;
        quoteVolume: string;
      }>;

      const normalized: Record<string, NormalizedTicker> = {};
      for (const item of data) {
        if (item.symbol.endsWith('USDT')) {
          normalized[item.symbol] = {
            symbol: item.symbol,
            last: parseFloat(item.lastPrice),
            high24h: parseFloat(item.highPrice),
            low24h: parseFloat(item.lowPrice),
            percentChange: parseFloat(item.priceChangePercent),
            volume24h: parseFloat(item.volume),
            quoteVolume24h: parseFloat(item.quoteVolume),
          };
        }
      }
      return normalized;
    } catch (err) {
      console.warn('[BinanceAdapter] Failed to fetch tickers:', (err as Error).message);
      return {};
    }
  }

  async fetchOHLCV(symbol: string, interval: string, fromSec: number, toSec: number): Promise<Candle[]> {
    try {
      let intParam = interval;
      if (interval === '1h' || interval === '60') intParam = '1h';
      if (interval === '4h' || interval === '240') intParam = '4h';
      if (interval === '15m' || interval === '15') intParam = '15m';
      if (interval === '5m' || interval === '5') intParam = '5m';
      if (interval === '1D' || interval === '1d') intParam = '1d';

      const url = `${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${intParam}&startTime=${fromSec * 1000}&endTime=${toSec * 1000}&limit=500`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const raw = await response.json() as any[];
      if (!Array.isArray(raw)) return [];

      return raw.map((item: any) => ({
        time: Math.floor(item[0] / 1000),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));
    } catch (err) {
      console.warn('[BinanceAdapter] OHLCV fetch error:', (err as Error).message);
      return [];
    }
  }
}
