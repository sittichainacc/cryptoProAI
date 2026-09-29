/**
 * 🥇 GoldMarketDataEngine
 * รวบรวมราคาทอง Multi-Timeframe (COMEX GC) + ราคาทองไทย + Intermarket daily series
 * แล้วคำนวณ XAU/USD spot โดยปรับ basis ระหว่าง COMEX กับ Gold Spot ที่สมาคมค้าทองคำประกาศ
 */

import type { Candle } from '../../types/index.js';
import type { GoldPriceData } from './gold_types.js';
import { fetchSeries, fetchThaiGold, aggregateCandles, type ThaiGoldQuote } from './gold_data_hub.js';
import { round2, last } from './gold_indicators.js';

export interface GoldTimeframes {
  m5: Candle[];
  m15: Candle[];
  h1: Candle[];
  h4: Candle[];
  d1: Candle[];
  w1: Candle[];
}

export const INTERMARKET_SYMBOLS = {
  dxy: { symbol: 'DX-Y.NYB', name: 'DXY (US Dollar Index)' },
  silver: { symbol: 'SI=F', name: 'XAG/USD (Silver Futures)' },
  vix: { symbol: '^VIX', name: 'VIX' },
  usdJpy: { symbol: 'JPY=X', name: 'USD/JPY' },
  usdThb: { symbol: 'USDTHB=X', name: 'USD/THB' },
  sp500: { symbol: '^GSPC', name: 'S&P 500' },
  wti: { symbol: 'CL=F', name: 'WTI Crude' },
} as const;

export type IntermarketKey = keyof typeof INTERMARKET_SYMBOLS;

export interface GoldMarketSnapshot {
  tf: GoldTimeframes;
  thai: ThaiGoldQuote | null;
  intermarket: Record<IntermarketKey, Candle[] | null>;
  price: GoldPriceData;
}

const GOLD = 'GC=F';

export class GoldMarketDataEngine {
  static async load(): Promise<GoldMarketSnapshot> {
    const [m5, m15, h1, d1, w1, thai] = await Promise.all([
      fetchSeries(GOLD, '5m', '5d', 'COMEX Gold 5m'),
      fetchSeries(GOLD, '15m', '1mo', 'COMEX Gold 15m'),
      fetchSeries(GOLD, '1h', '6mo', 'COMEX Gold 1H/4H'),
      fetchSeries(GOLD, '1d', '2y', 'COMEX Gold Daily'),
      fetchSeries(GOLD, '1wk', '5y', 'COMEX Gold Weekly'),
      fetchThaiGold(),
    ]);

    if (!h1 || !d1) {
      throw new Error('ไม่สามารถดึงข้อมูลราคา COMEX Gold ได้ในขณะนี้ — ระบบจะไม่ออกสัญญาณจากข้อมูลที่ไม่ครบ');
    }

    const imEntries = await Promise.all(
      (Object.keys(INTERMARKET_SYMBOLS) as IntermarketKey[]).map(async k => {
        const s = await fetchSeries(INTERMARKET_SYMBOLS[k].symbol, '1d', '6mo', INTERMARKET_SYMBOLS[k].name);
        return [k, s?.candles ?? null] as const;
      }),
    );
    const intermarket = Object.fromEntries(imEntries) as Record<IntermarketKey, Candle[] | null>;

    const tf: GoldTimeframes = {
      m5: m5?.candles ?? [],
      m15: m15?.candles ?? [],
      h1: h1.candles,
      h4: aggregateCandles(h1.candles, 4),
      d1: d1.candles,
      w1: w1?.candles ?? [],
    };

    const price = GoldMarketDataEngine.buildPrice(tf, m5?.last ?? h1.last, thai, intermarket.usdThb);
    return { tf, thai, intermarket, price };
  }

  private static buildPrice(tf: GoldTimeframes, comexLast: number, thai: ThaiGoldQuote | null, usdThbDaily: Candle[] | null): GoldPriceData {
    const fine = tf.m5.length ? tf.m5 : tf.h1;
    const lastTime = last(fine).time;

    // ── Basis: COMEX close ณ เวลาที่สมาคมฯ ประกาศ − Gold Spot ที่สมาคมฯ ใช้ ──
    let basis = 0;
    let spotIsEstimated = true;
    let spotSource = 'COMEX GC=F (ไม่มี spot อ้างอิง — ใช้ราคา futures)';
    if (thai?.goldSpot && /^\d{4}-\d{2}-\d{2}T/.test(thai.asTime)) {
      const announcedUtc = Date.parse(thai.asTime + '+07:00') / 1000;
      const ref = [...tf.h1, ...tf.m5].filter(k => k.time <= announcedUtc).sort((a, b) => b.time - a.time)[0];
      if (ref) {
        const b = ref.close - thai.goldSpot;
        // basis ของ GC ปกติเป็นบวกเล็กน้อย (contango) — ถ้าผิดปกติมากไม่ใช้
        if (Math.abs(b) / thai.goldSpot < 0.02) {
          basis = b;
          spotSource = 'ประมาณจาก COMEX GC − basis (อ้างอิง Gold Spot สมาคมค้าทองคำ)';
        }
      }
    }
    const spot = comexLast - basis;

    // ── 24h change / range จาก 1H candles ──
    const dayAgo = lastTime - 24 * 3600;
    const window = tf.h1.filter(k => k.time > dayAgo);
    const ref24 = [...tf.h1].reverse().find(k => k.time <= dayAgo) ?? tf.h1[0];
    const prev = ref24.close - basis;
    const high = Math.max(...window.map(k => k.high), comexLast) - basis;
    const low = Math.min(...window.map(k => k.low), comexLast) - basis;

    const usdThb = thai?.usdThb ?? (usdThbDaily?.length ? last(usdThbDaily).close : null);

    return {
      xauUsd: round2(spot),
      xauUsdChange24h: round2(spot - prev),
      xauUsdChange24hPct: round2(((spot - prev) / prev) * 100),
      xauUsdHigh24h: round2(high),
      xauUsdLow24h: round2(low),
      spotIsEstimated,
      comexPrice: round2(comexLast),
      comexBasis: round2(basis),
      thaiGoldBarBuy: thai?.barBuy ?? null,
      thaiGoldBarSell: thai?.barSell ?? null,
      thaiGoldOrnamentBuy: thai?.ornamentBuy ?? null,
      thaiGoldOrnamentSell: thai?.ornamentSell ?? null,
      thaiGoldChange: thai?.changeFromPrevDay ?? null,
      thaiGoldAsTime: thai?.asTime ?? null,
      thaiGoldRound: thai?.round ?? null,
      usdThb: usdThb != null ? round2(usdThb) : null,
      goldSpotSource: spotSource,
      thaiGoldSource: thai?.source ?? 'ไม่พร้อมใช้งาน',
      marketOpen: Date.now() / 1000 - lastTime < 20 * 60,
      lastCandleTime: lastTime,
    };
  }
}
