/**
 * 🎯 Alpha Flow Dynamics V1.2 — Smart Money Radar Engine
 *
 * หน้าที่: ตรวจจับการเคลื่อนไหวของ "รายใหญ่" (Smart Money / Institutional Footprint)
 *
 * ✅ Order Blocks (OB)  — กล่องดักราคา จากแท่งที่ก่อน impulse move
 * ✅ Fair Value Gaps (FVG) — ช่องว่างราคาที่รายใหญ่ทิ้งไว้ (Imbalance)
 * ✅ Trend Tunnel       — EMA Envelope อุโมงค์บอกเทรนด์
 * ✅ MTF Dashboard      — สรุปผล 15m / 30m / 1H / 4H / 1D ไว้ในตัวเดียว
 *
 * Version: 1.2 | Author: Alpha Flow Dynamics System
 */

import type { Candle } from '../../types/index.js';
import type { GoldTimeframes } from './gold_market_data.engine.js';
import {
  findSwings, emaSeries, lastEma, atrSeries, lastAtr,
  rsiSeries, clamp, last, round2,
} from './gold_indicators.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OBType = 'BULLISH' | 'BEARISH';
export type OBStatus = 'FRESH' | 'TESTED' | 'MITIGATED';
export type FVGType = 'BULLISH' | 'BEARISH';
export type FVGStatus = 'OPEN' | 'PARTIAL' | 'FILLED';
export type TrendDir = 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
export type MTFSignal = 'BUY' | 'SELL' | 'NEUTRAL';

export interface OrderBlock {
  id: string;
  type: OBType;
  status: OBStatus;
  /** ด้านบนของกล่อง OB */
  high: number;
  /** ด้านล่างของกล่อง OB */
  low: number;
  /** Midpoint */
  mid: number;
  /** % ที่ราคาปัจจุบันเข้า OB (0 = ยังไม่ถึง, 100 = เข้าหมดแล้ว) */
  touchPct: number;
  /** ไทม์เฟรมต้นทาง */
  timeframe: string;
  /** Strength (0–100) — คำนวณจากขนาด impulse หลัง OB */
  strength: number;
  /** Volume multiplier เปรียบเทียบ average */
  volumeRatio: number;
  /** Impulse size เป็น ATR multiple */
  impulseAtr: number;
  /** กี่แท่งนับจากปัจจุบัน */
  barsAgo: number;
  /** คำอธิบายภาษาไทย */
  descTh: string;
}

export interface FairValueGap {
  id: string;
  type: FVGType;
  status: FVGStatus;
  /** ขอบบน FVG */
  upper: number;
  /** ขอบล่าง FVG */
  lower: number;
  /** ขนาด FVG เป็น USD */
  size: number;
  /** ขนาดเป็น ATR % */
  sizeAtrPct: number;
  /** % ที่ถูก fill แล้ว */
  fillPct: number;
  /** ไทม์เฟรม */
  timeframe: string;
  /** กี่แท่งที่แล้ว */
  barsAgo: number;
  descTh: string;
}

export interface TrendTunnel {
  timeframe: string;
  direction: TrendDir;
  /** EMA ตรงกลาง */
  ema: number;
  /** แถบบน (EMA + k×ATR) */
  upper: number;
  /** แถบล่าง (EMA − k×ATR) */
  lower: number;
  /** % ราคาอยู่ในอุโมงค์ (0=ล่าง, 50=กลาง, 100=บน) */
  positionPct: number;
  /** Slope ของ EMA (บวก=ขาขึ้น) */
  slope: number;
  /** Angle เป็นองศา (ประมาณ) */
  angleDeg: number;
  descTh: string;
}

export interface MTFRow {
  timeframe: string;
  signal: MTFSignal;
  trend: TrendDir;
  rsi: number | null;
  /** Stochastic %K/%D */
  stochK: number | null;
  stochD: number | null;
  /** ราคาเทียบ EMA20 */
  vsEma20: 'ABOVE' | 'BELOW' | 'AT';
  /** BOS/CHOCH ล่าสุด */
  lastEvent: string | null;
  descTh: string;
}

export interface SmartMoneyBias {
  /** -100 (full bear) … +100 (full bull) */
  score: number;
  /** ฝั่งที่ SM เอนเอียง */
  side: 'LONG' | 'SHORT' | 'NEUTRAL';
  /** จำนวน OB Bullish Fresh ≥ 3 = signal */
  bullishOB: number;
  /** จำนวน OB Bearish Fresh */
  bearishOB: number;
  /** จำนวน FVG Bullish Open */
  bullishFVG: number;
  /** จำนวน FVG Bearish Open */
  bearishFVG: number;
  /** รวมคะแนนจากแต่ละปัจจัย */
  factors: { name: string; score: number; descTh: string }[];
  interpretationTh: string;
}

export interface AlphaFlowResult {
  /** ชื่อ indicator */
  name: 'Alpha Flow Dynamics V1.2';
  /** Order Blocks ที่ตรวจพบ (เรียงจากใหม่ไปเก่า) */
  orderBlocks: OrderBlock[];
  /** Fair Value Gaps ที่ตรวจพบ */
  fvgs: FairValueGap[];
  /** อุโมงค์เทรนด์ต่อ timeframe */
  trendTunnels: TrendTunnel[];
  /** MTF Dashboard */
  mtfDashboard: MTFRow[];
  /** Smart Money Bias สรุป */
  smartMoneyBias: SmartMoneyBias;
  /** ราคาปัจจุบัน */
  price: number;
  /** ATR 4H ใช้เป็น reference unit */
  atr4h: number;
  /** สรุปสั้น 1 ประโยค */
  summaryTh: string;
  generatedAt: string;
}

// ─── Engine ────────────────────────────────────────────────────────────────────

export class AlphaFlowEngine {
  /**
   * จุดหลัก — รับ GoldTimeframes แล้วส่งคืน AlphaFlowResult
   */
  static evaluate(tf: GoldTimeframes): AlphaFlowResult {
    const price = last(tf.m15.length ? tf.m15 : tf.h1).close;
    const atr4h = lastAtr(tf.h4, 14);
    const atrH1 = lastAtr(tf.h1, 14);

    // สร้าง 30m จาก 15m (aggregate 2 แท่ง)
    const m30 = AlphaFlowEngine.aggregateM30(tf.m15);

    // 1. Order Blocks
    const obH1 = AlphaFlowEngine.detectOrderBlocks(tf.h1, '1H', price, atrH1, 5);
    const ob4H = AlphaFlowEngine.detectOrderBlocks(tf.h4, '4H', price, atr4h, 4);
    const obD1 = AlphaFlowEngine.detectOrderBlocks(tf.d1, '1D', price, lastAtr(tf.d1, 14), 3);
    const orderBlocks = [...obH1, ...ob4H, ...obD1]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);

    // 2. Fair Value Gaps
    const fvgM15 = AlphaFlowEngine.detectFVGs(tf.m15, '15m', price, atrH1, 6);
    const fvgH1 = AlphaFlowEngine.detectFVGs(tf.h1, '1H', price, atrH1, 5);
    const fvg4H = AlphaFlowEngine.detectFVGs(tf.h4, '4H', price, atr4h, 4);
    const fvgs = [...fvgM15, ...fvgH1, ...fvg4H]
      .filter(f => f.status !== 'FILLED')
      .sort((a, b) => b.sizeAtrPct - a.sizeAtrPct)
      .slice(0, 12);

    // 3. Trend Tunnels
    const trendTunnels: TrendTunnel[] = [
      AlphaFlowEngine.buildTunnel(tf.m15, '15m', price, atrH1, 1.5),
      AlphaFlowEngine.buildTunnel(m30, '30m', price, atrH1, 1.5),
      AlphaFlowEngine.buildTunnel(tf.h1, '1H', price, atrH1, 1.8),
      AlphaFlowEngine.buildTunnel(tf.h4, '4H', price, atr4h, 2.0),
      AlphaFlowEngine.buildTunnel(tf.d1, '1D', price, lastAtr(tf.d1, 14), 2.2),
    ].filter((t): t is TrendTunnel => t !== null);

    // 4. MTF Dashboard
    const mtfDashboard: MTFRow[] = [
      AlphaFlowEngine.buildMTFRow(tf.m15, '15m', price),
      AlphaFlowEngine.buildMTFRow(m30, '30m', price),
      AlphaFlowEngine.buildMTFRow(tf.h1, '1H', price),
      AlphaFlowEngine.buildMTFRow(tf.h4, '4H', price),
      AlphaFlowEngine.buildMTFRow(tf.d1, '1D', price),
    ].filter((r): r is MTFRow => r !== null);

    // 5. Smart Money Bias
    const smartMoneyBias = AlphaFlowEngine.calcSmartMoneyBias(
      orderBlocks, fvgs, trendTunnels, mtfDashboard, price, atr4h,
    );

    // 6. Summary
    const side = smartMoneyBias.side;
    const summaryTh = side === 'LONG'
      ? `Alpha Flow V1.2 ตรวจจับ Smart Money เน้น Long — OB Bull ${smartMoneyBias.bullishOB} โซน · FVG Bull ${smartMoneyBias.bullishFVG} ช่อง · Bias +${smartMoneyBias.score}`
      : side === 'SHORT'
        ? `Alpha Flow V1.2 ตรวจจับ Smart Money เน้น Short — OB Bear ${smartMoneyBias.bearishOB} โซน · FVG Bear ${smartMoneyBias.bearishFVG} ช่อง · Bias ${smartMoneyBias.score}`
        : `Alpha Flow V1.2 ตลาดยังอยู่ในโซน Neutral — รอสัญญาณชัดขึ้น (Bias ${smartMoneyBias.score})`;

    return {
      name: 'Alpha Flow Dynamics V1.2',
      orderBlocks,
      fvgs,
      trendTunnels,
      mtfDashboard,
      smartMoneyBias,
      price,
      atr4h: round2(atr4h),
      summaryTh,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Order Block Detection ────────────────────────────────────────────────

  /**
   * ตรวจหา Order Block จาก impulse move
   * หลักการ: แท่งก่อน impulse ที่แรง (≥ minImpulseAtr × ATR) = OB
   */
  static detectOrderBlocks(
    candles: Candle[],
    tf: string,
    price: number,
    atr: number,
    maxBlocks: number,
    minImpulseAtr = 1.8,
  ): OrderBlock[] {
    if (candles.length < 10 || atr <= 0) return [];
    const results: OrderBlock[] = [];
    const slice = candles.slice(-Math.min(candles.length, 150));

    // คำนวณ avg volume
    const volumes = slice.map(k => k.volume).filter(v => v > 0);
    const avgVol = volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : 1;

    // หา OB: สแกนหา impulse (≥ minImpulseAtr ATR ใน 1 แท่ง) แล้วดูแท่งก่อนหน้า
    for (let i = 2; i < slice.length - 1; i++) {
      const curr = slice[i];
      const prev = slice[i - 1];
      const bodySize = Math.abs(curr.close - curr.open);
      const impulseSize = bodySize / (atr || 1);

      if (impulseSize < minImpulseAtr) continue;

      const isBullCandle = curr.close > curr.open; // impulse ขาขึ้น → OB = BEARISH (ก่อนหน้าเป็นแท่งลง)
      const isBearCandle = curr.close < curr.open; // impulse ขาลง  → OB = BULLISH (ก่อนหน้าเป็นแท่งขึ้น)

      if (!isBullCandle && !isBearCandle) continue;

      const obCandle = prev; // แท่ง OB คือแท่งก่อน impulse
      const obType: OBType = isBullCandle ? 'BEARISH' : 'BULLISH';

      // OB กล่อง: ใช้ body ของแท่ง OB
      const obHigh = Math.max(obCandle.open, obCandle.close);
      const obLow = Math.min(obCandle.open, obCandle.close);
      const obMid = (obHigh + obLow) / 2;

      // คำนวณสถานะ
      let status: OBStatus = 'FRESH';
      let touchPct = 0;
      if (obType === 'BULLISH') {
        if (price < obHigh && price >= obLow) {
          touchPct = ((obHigh - price) / (obHigh - obLow)) * 100;
          status = 'TESTED';
        } else if (price < obLow) {
          status = 'MITIGATED';
          touchPct = 100;
        }
      } else {
        if (price > obLow && price <= obHigh) {
          touchPct = ((price - obLow) / (obHigh - obLow)) * 100;
          status = 'TESTED';
        } else if (price > obHigh) {
          status = 'MITIGATED';
          touchPct = 100;
        }
      }

      if (status === 'MITIGATED') continue; // ไม่สนใจ OB ที่ถูก invalidate แล้ว

      // Strength: impulse size + volume spike + freshness
      const volRatio = avgVol > 0 ? obCandle.volume / avgVol : 1;
      const strength = Math.round(clamp(
        impulseSize * 25 + Math.min(volRatio * 10, 30) + (status === 'FRESH' ? 15 : 0),
        0, 100,
      ));

      const barsAgo = slice.length - 1 - i;
      const descTh = `${obType === 'BULLISH' ? '🟦 Bull OB' : '🟥 Bear OB'} ${tf} $${round2(obLow)}–$${round2(obHigh)} · Impulse ${impulseSize.toFixed(1)}×ATR · ${status === 'FRESH' ? 'ยังไม่ถูกทดสอบ' : 'ถูกทดสอบแล้ว'} · ${barsAgo} แท่งที่แล้ว`;

      results.push({
        id: `ob_${tf}_${i}`,
        type: obType,
        status,
        high: round2(obHigh),
        low: round2(obLow),
        mid: round2(obMid),
        touchPct: Math.round(touchPct),
        timeframe: tf,
        strength,
        volumeRatio: round2(volRatio),
        impulseAtr: round2(impulseSize),
        barsAgo,
        descTh,
      });

      if (results.length >= maxBlocks * 2) break;
    }

    // เรียงตาม strength และจำกัดจำนวน
    return results
      .sort((a, b) => b.strength - a.strength || a.barsAgo - b.barsAgo)
      .slice(0, maxBlocks);
  }

  // ─── Fair Value Gap Detection ─────────────────────────────────────────────

  /**
   * ตรวจหา FVG: แท่ง[i-1].high < แท่ง[i+1].low  = Bullish FVG
   *             แท่ง[i-1].low  > แท่ง[i+1].high = Bearish FVG
   */
  static detectFVGs(
    candles: Candle[],
    tf: string,
    price: number,
    atr: number,
    maxFvgs: number,
    minSizeAtrPct = 0.15,
  ): FairValueGap[] {
    if (candles.length < 5 || atr <= 0) return [];
    const results: FairValueGap[] = [];
    const slice = candles.slice(-Math.min(candles.length, 100));

    for (let i = 1; i < slice.length - 1; i++) {
      const prev = slice[i - 1];
      const next = slice[i + 1];

      const bullGap = next.low - prev.high; // บวก = Bullish FVG
      const bearGap = prev.low - next.high; // บวก = Bearish FVG

      if (bullGap > atr * minSizeAtrPct) {
        // Bullish FVG: ช่องว่างขาขึ้น (demand imbalance)
        const upper = next.low;
        const lower = prev.high;
        const size = upper - lower;
        const sizeAtrPct = size / atr;

        let status: FVGStatus = 'OPEN';
        let fillPct = 0;
        if (price <= upper && price >= lower) {
          fillPct = ((upper - price) / size) * 100;
          status = 'PARTIAL';
        } else if (price < lower) {
          status = 'FILLED';
          fillPct = 100;
        }

        const barsAgo = slice.length - 1 - i;
        results.push({
          id: `fvg_bull_${tf}_${i}`,
          type: 'BULLISH',
          status,
          upper: round2(upper),
          lower: round2(lower),
          size: round2(size),
          sizeAtrPct: round2(sizeAtrPct),
          fillPct: Math.round(fillPct),
          timeframe: tf,
          barsAgo,
          descTh: `🔵 Bull FVG ${tf} $${round2(lower)}–$${round2(upper)} (${sizeAtrPct.toFixed(2)}×ATR) · ${status === 'OPEN' ? 'ยังเปิดอยู่' : status === 'PARTIAL' ? `เติม ${Math.round(fillPct)}%` : 'เติมแล้ว'}`,
        });
      }

      if (bearGap > atr * minSizeAtrPct) {
        // Bearish FVG: ช่องว่างขาลง (supply imbalance)
        const upper = prev.low;
        const lower = next.high;
        const size = upper - lower;
        const sizeAtrPct = size / atr;

        let status: FVGStatus = 'OPEN';
        let fillPct = 0;
        if (price >= lower && price <= upper) {
          fillPct = ((price - lower) / size) * 100;
          status = 'PARTIAL';
        } else if (price > upper) {
          status = 'FILLED';
          fillPct = 100;
        }

        const barsAgo = slice.length - 1 - i;
        results.push({
          id: `fvg_bear_${tf}_${i}`,
          type: 'BEARISH',
          status,
          upper: round2(upper),
          lower: round2(lower),
          size: round2(size),
          sizeAtrPct: round2(sizeAtrPct),
          fillPct: Math.round(fillPct),
          timeframe: tf,
          barsAgo,
          descTh: `🔴 Bear FVG ${tf} $${round2(lower)}–$${round2(upper)} (${sizeAtrPct.toFixed(2)}×ATR) · ${status === 'OPEN' ? 'ยังเปิดอยู่' : status === 'PARTIAL' ? `เติม ${Math.round(fillPct)}%` : 'เติมแล้ว'}`,
        });
      }
    }

    return results
      .filter(f => f.status !== 'FILLED')
      .sort((a, b) => b.sizeAtrPct - a.sizeAtrPct)
      .slice(0, maxFvgs);
  }

  // ─── Trend Tunnel ─────────────────────────────────────────────────────────

  static buildTunnel(
    candles: Candle[],
    tf: string,
    price: number,
    atr: number,
    multiplier: number,
  ): TrendTunnel | null {
    if (candles.length < 30 || atr <= 0) return null;
    const closes = candles.map(k => k.close);

    const emaArr = emaSeries(closes, 20);
    const currentEma = emaArr[emaArr.length - 1];
    const prevEma = emaArr[emaArr.length - 6]; // slope ดูย้อนหลัง 5 แท่ง

    if (currentEma == null || prevEma == null) return null;

    const upper = currentEma + multiplier * atr;
    const lower = currentEma - multiplier * atr;
    const range = upper - lower;
    const positionPct = range > 0 ? clamp(((price - lower) / range) * 100, 0, 100) : 50;
    const slope = currentEma - prevEma;
    // แปลง slope เป็นองศาคร่าว ๆ (ใช้ ATR เป็น scale)
    const angleDeg = Math.round(Math.atan2(slope, atr * 0.3) * (180 / Math.PI));

    let direction: TrendDir;
    if (slope > atr * 0.08 && price > currentEma) direction = 'STRONG_BULL';
    else if (slope > atr * 0.02 && price > currentEma) direction = 'BULL';
    else if (slope < -atr * 0.08 && price < currentEma) direction = 'STRONG_BEAR';
    else if (slope < -atr * 0.02 && price < currentEma) direction = 'BEAR';
    else direction = 'NEUTRAL';

    const dirLabel: Record<TrendDir, string> = {
      STRONG_BULL: '🟢 ขาขึ้นแรง',
      BULL: '🟩 ขาขึ้น',
      NEUTRAL: '⬜ Sideways',
      BEAR: '🟥 ขาลง',
      STRONG_BEAR: '🔴 ขาลงแรง',
    };

    const posLabel = positionPct >= 70 ? 'ใกล้ขอบบน (ระวัง Resistance)'
      : positionPct <= 30 ? 'ใกล้ขอบล่าง (โอกาส Support)'
        : 'อยู่กลางอุโมงค์';

    return {
      timeframe: tf,
      direction,
      ema: round2(currentEma),
      upper: round2(upper),
      lower: round2(lower),
      positionPct: Math.round(positionPct),
      slope: round2(slope),
      angleDeg,
      descTh: `${dirLabel[direction]} · ราคา${posLabel} · EMA20=${round2(currentEma)} · Tunnel $${round2(lower)}–$${round2(upper)}`,
    };
  }

  // ─── MTF Dashboard Row ────────────────────────────────────────────────────

  static buildMTFRow(candles: Candle[], tf: string, price: number): MTFRow | null {
    if (candles.length < 20) return null;
    const closes = candles.map(k => k.close);

    // RSI
    const rsiArr = rsiSeries(closes);
    const rsiVal = rsiArr.length ? (rsiArr[rsiArr.length - 1] ?? null) : null;
    const rsi = rsiVal != null ? Math.round(rsiVal) : null;

    // Stochastic %K/%D (14,3,3 Fast)
    const { k: stochK, d: stochD } = AlphaFlowEngine.stochastic(candles, 14, 3);

    // EMA20
    const ema20 = lastEma(closes, 20);
    const vsEma20: MTFRow['vsEma20'] = ema20 == null ? 'AT'
      : price > ema20 * 1.001 ? 'ABOVE'
        : price < ema20 * 0.999 ? 'BELOW'
          : 'AT';

    // Trend
    const ema50 = lastEma(closes, 50);
    let direction: TrendDir = 'NEUTRAL';
    if (ema20 && ema50) {
      if (price > ema20 && ema20 > ema50) {
        const atr = lastAtr(candles, 14);
        direction = price - ema50 > atr * 1.5 ? 'STRONG_BULL' : 'BULL';
      } else if (price < ema20 && ema20 < ema50) {
        const atr = lastAtr(candles, 14);
        direction = ema50 - price > atr * 1.5 ? 'STRONG_BEAR' : 'BEAR';
      }
    }

    // BOS / CHOCH last event (simplified)
    const swings = findSwings(candles.slice(-60), 3, 3);
    const highs = swings.filter(s => s.type === 'H');
    const lows = swings.filter(s => s.type === 'L');
    let lastEvent: string | null = null;
    if (highs.length >= 2 && lows.length >= 2) {
      const [h1, h2] = highs.slice(-2).map(s => s.price);
      const [l1, l2] = lows.slice(-2).map(s => s.price);
      if (price > h2) lastEvent = h2 > h1 ? 'BOS↑' : 'CHOCH↑';
      else if (price < l2) lastEvent = l2 < l1 ? 'BOS↓' : 'CHOCH↓';
    }

    // Signal
    let signal: MTFSignal = 'NEUTRAL';
    const rsiScore = rsi != null ? (rsi >= 55 ? 1 : rsi <= 45 ? -1 : 0) : 0;
    const trendScore = direction === 'STRONG_BULL' || direction === 'BULL' ? 1 : direction === 'STRONG_BEAR' || direction === 'BEAR' ? -1 : 0;
    const stochScore = stochK != null ? (stochK > 50 ? 1 : stochK < 50 ? -1 : 0) : 0;
    const totalScore = rsiScore + trendScore + stochScore;
    if (totalScore >= 2) signal = 'BUY';
    else if (totalScore <= -2) signal = 'SELL';

    const trendLabelTh: Record<TrendDir, string> = {
      STRONG_BULL: 'ขาขึ้นแรง', BULL: 'ขาขึ้น', NEUTRAL: 'Sideways', BEAR: 'ขาลง', STRONG_BEAR: 'ขาลงแรง',
    };

    return {
      timeframe: tf,
      signal,
      trend: direction,
      rsi,
      stochK: stochK != null ? Math.round(stochK) : null,
      stochD: stochD != null ? Math.round(stochD) : null,
      vsEma20,
      lastEvent,
      descTh: `${tf}: ${trendLabelTh[direction]} · RSI ${rsi ?? 'N/A'} · Stoch ${stochK != null ? Math.round(stochK) : 'N/A'}/${stochD != null ? Math.round(stochD) : 'N/A'} · ${signal === 'BUY' ? '✅ Buy' : signal === 'SELL' ? '🔴 Sell' : '⬜ Neutral'}${lastEvent ? ' · ' + lastEvent : ''}`,
    };
  }

  // ─── Smart Money Bias ─────────────────────────────────────────────────────

  static calcSmartMoneyBias(
    obs: OrderBlock[],
    fvgs: FairValueGap[],
    tunnels: TrendTunnel[],
    mtf: MTFRow[],
    price: number,
    atr4h: number,
  ): SmartMoneyBias {
    const bullOBs = obs.filter(o => o.type === 'BULLISH' && o.status !== 'MITIGATED');
    const bearOBs = obs.filter(o => o.type === 'BEARISH' && o.status !== 'MITIGATED');
    const bullFVGs = fvgs.filter(f => f.type === 'BULLISH' && f.status !== 'FILLED');
    const bearFVGs = fvgs.filter(f => f.type === 'BEARISH' && f.status !== 'FILLED');

    // 1. OB proximity score: ถ้าราคาใกล้ Bull OB = positive
    let obScore = 0;
    for (const ob of bullOBs) {
      const dist = (price - ob.high) / (atr4h || 1);
      if (dist >= -1 && dist <= 0.5) obScore += ob.strength * 0.3; // ราคาอยู่ใกล้/ใน Bull OB
    }
    for (const ob of bearOBs) {
      const dist = (ob.low - price) / (atr4h || 1);
      if (dist >= -1 && dist <= 0.5) obScore -= ob.strength * 0.3;
    }
    obScore = clamp(obScore, -30, 30);

    // 2. FVG pull score: FVG ล่างราคา = support / FVG บนราคา = resistance
    let fvgScore = 0;
    for (const fvg of bullFVGs) {
      if (fvg.upper < price) fvgScore += fvg.sizeAtrPct * 8; // support อยู่ข้างล่าง
    }
    for (const fvg of bearFVGs) {
      if (fvg.lower > price) fvgScore -= fvg.sizeAtrPct * 8; // resistance อยู่ข้างบน
    }
    fvgScore = clamp(fvgScore, -25, 25);

    // 3. Trend alignment score
    let trendScore = 0;
    const weights: Record<string, number> = { '15m': 0.1, '30m': 0.1, '1H': 0.2, '4H': 0.35, '1D': 0.25 };
    for (const t of tunnels) {
      const w = weights[t.timeframe] ?? 0.1;
      const s = t.direction === 'STRONG_BULL' ? 30 : t.direction === 'BULL' ? 15 : t.direction === 'STRONG_BEAR' ? -30 : t.direction === 'BEAR' ? -15 : 0;
      trendScore += s * w;
    }
    trendScore = clamp(trendScore, -30, 30);

    // 4. MTF signal score
    let mtfScore = 0;
    const mtfW: Record<string, number> = { '15m': 0.05, '30m': 0.1, '1H': 0.2, '4H': 0.35, '1D': 0.3 };
    for (const row of mtf) {
      const w = mtfW[row.timeframe] ?? 0.1;
      const s = row.signal === 'BUY' ? 25 : row.signal === 'SELL' ? -25 : 0;
      mtfScore += s * w;
    }
    mtfScore = clamp(mtfScore, -15, 15);

    const totalScore = Math.round(clamp(obScore + fvgScore + trendScore + mtfScore, -100, 100));
    const side: SmartMoneyBias['side'] = totalScore >= 20 ? 'LONG' : totalScore <= -20 ? 'SHORT' : 'NEUTRAL';

    const factors = [
      { name: 'Order Block Proximity', score: Math.round(obScore), descTh: `Bull OB ${bullOBs.length} โซน · Bear OB ${bearOBs.length} โซน` },
      { name: 'FVG Pull Score', score: Math.round(fvgScore), descTh: `Bull FVG ${bullFVGs.length} · Bear FVG ${bearFVGs.length}` },
      { name: 'Trend Alignment', score: Math.round(trendScore), descTh: tunnels.map(t => `${t.timeframe}=${t.direction}`).join(' · ') },
      { name: 'MTF Signal', score: Math.round(mtfScore), descTh: mtf.map(r => `${r.timeframe}=${r.signal}`).join(' · ') },
    ];

    const interpretationTh = side === 'LONG'
      ? `Smart Money เน้น Long — มี Order Block และ FVG Bullish หนุนอยู่ใต้ราคา · เทรนด์หลักเป็นขาขึ้น · รอ Pullback เข้า OB เพื่อ Long`
      : side === 'SHORT'
        ? `Smart Money เน้น Short — มี Order Block และ FVG Bearish กดอยู่เหนือราคา · เทรนด์หลักเป็นขาลง · รอ Retracement เข้า OB เพื่อ Short`
        : `ตลาด Neutral — OB/FVG ทั้งสองฝั่งใกล้เคียงกัน · ยังไม่มีสัญญาณชัดจาก Smart Money · ระวังการ Trap`;

    return {
      score: totalScore,
      side,
      bullishOB: bullOBs.length,
      bearishOB: bearOBs.length,
      bullishFVG: bullFVGs.length,
      bearishFVG: bearFVGs.length,
      factors,
      interpretationTh,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Fast Stochastic (14, 3, 3) */
  static stochastic(candles: Candle[], kPeriod = 14, dSmooth = 3): { k: number | null; d: number | null } {
    if (candles.length < kPeriod + dSmooth) return { k: null, d: null };

    const kValues: number[] = [];
    for (let i = kPeriod - 1; i < candles.length; i++) {
      const window = candles.slice(i - kPeriod + 1, i + 1);
      const high = Math.max(...window.map(c => c.high));
      const low = Math.min(...window.map(c => c.low));
      const close = candles[i].close;
      const k = high !== low ? ((close - low) / (high - low)) * 100 : 50;
      kValues.push(k);
    }

    const smoothK = AlphaFlowEngine.smaLast(kValues, dSmooth);
    const dValues: number[] = [];
    for (let i = dSmooth - 1; i < kValues.length; i++) {
      dValues.push(AlphaFlowEngine.smaLast(kValues.slice(0, i + 1), dSmooth) ?? 50);
    }
    const smoothD = dValues.length >= dSmooth
      ? AlphaFlowEngine.smaLast(dValues, dSmooth)
      : null;

    return {
      k: smoothK != null ? round2(smoothK) : null,
      d: smoothD != null ? round2(smoothD) : null,
    };
  }

  private static smaLast(arr: number[], period: number): number | null {
    if (arr.length < period) return null;
    const w = arr.slice(-period);
    return w.reduce((a, b) => a + b, 0) / period;
  }

  /** Aggregate 15m candles → 30m */
  static aggregateM30(m15: Candle[]): Candle[] {
    if (!m15.length) return [];
    const out: Candle[] = [];
    // จัดกลุ่มทุก 2 แท่ง
    for (let i = 0; i + 1 < m15.length; i += 2) {
      const a = m15[i], b = m15[i + 1];
      out.push({
        time: a.time,
        open: a.open,
        high: Math.max(a.high, b.high),
        low: Math.min(a.low, b.low),
        close: b.close,
        volume: (a.volume || 0) + (b.volume || 0),
      });
    }
    return out;
  }
}
