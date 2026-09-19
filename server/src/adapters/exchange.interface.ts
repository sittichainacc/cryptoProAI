import { Candle } from '../types/index.js';

export interface NormalizedTicker {
  symbol: string;
  last: number;
  high24h: number;
  low24h: number;
  percentChange: number;
  volume24h: number;
  quoteVolume24h: number;
}

export interface IExchangeAdapter {
  name: string;
  fetchTickers(): Promise<Record<string, NormalizedTicker>>;
  fetchOHLCV(symbol: string, resolution: string, fromTimestampSec: number, toTimestampSec: number): Promise<Candle[]>;
}
