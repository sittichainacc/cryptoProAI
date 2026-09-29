/**
 * 🥇 GoldTechnicalEngine — Multi-Timeframe Technical Analysis
 * 5m timing · 15m intraday · 1H short-term · 4H primary swing · 1D main trend · 1W macro structure
 * ไม่สรุปแบบ "RSI > 70 = ขาย" — ประเมินร่วมกับ trend / structure / extension
 */

import type { Candle } from '../../types/index.js';
import type { GoldTechnicalResult, GoldTimeframeBias, GoldRsiTimeframe, GoldMtfRsiMatrix, GoldVolatilityRegime } from './gold_types.js';
import type { GoldTimeframes } from './gold_market_data.engine.js';
import { GoldStructureEngine } from './gold_structure.engine.js';
import {
  emaSeries, lastEma, rsiSeries, atrSeries, lastAtr, percentileRank, findSwings, donchian,
  bandwidthSeries, vwap, volumeProfile, clamp, last, round2, biasLabel,
} from './gold_indicators.js';

const TF_WEIGHTS: Record<string, number> = { '15m': 0.1, '1H': 0.15, '4H': 0.3, '1D': 0.3, '1W': 0.15 };

export class GoldTechnicalEngine {
  static evaluate(tf: GoldTimeframes): GoldTechnicalResult {
    const price = last(tf.m5.length ? tf.m5 : tf.h1).close;
    const atr4h = lastAtr(tf.h4);
    const atrD = lastAtr(tf.d1);

    // ── Trend alignment ต่อ timeframe ──
    const perTimeframe: GoldTimeframeBias[] = [
      GoldTechnicalEngine.tfBias('15m', tf.m15),
      GoldTechnicalEngine.tfBias('1H', tf.h1),
      GoldTechnicalEngine.tfBias('4H', tf.h4),
      GoldTechnicalEngine.tfBias('1D', tf.d1),
      GoldTechnicalEngine.tfBias('1W', tf.w1),
    ].filter((x): x is GoldTimeframeBias => x !== null);
    const trendBias = perTimeframe.reduce((s, t) => s + (t.bias === 'BULLISH' ? 100 : t.bias === 'BEARISH' ? -100 : 0) * (TF_WEIGHTS[t.timeframe] ?? 0), 0)
      / (perTimeframe.reduce((s, t) => s + (TF_WEIGHTS[t.timeframe] ?? 0), 0) || 1);
    const trendDir = trendBias >= 35 ? 'BULLISH' as const : trendBias <= -35 ? 'BEARISH' as const : 'MIXED' as const;
    const htf = perTimeframe.filter(t => t.timeframe === '4H' || t.timeframe === '1D');
    const trendDesc = trendDir === 'MIXED'
      ? `Timeframe ขัดแย้งกัน (${perTimeframe.map(t => `${t.timeframe} ${t.bias === 'BULLISH' ? '↑' : t.bias === 'BEARISH' ? '↓' : '→'}`).join(' · ')})`
      : `${htf.map(t => t.timeframe).join('/')} ${trendDir === 'BULLISH' ? 'ขาขึ้น' : 'ขาลง'} — EMA20/50 เรียงตัว${trendDir === 'BULLISH' ? 'ขึ้น' : 'ลง'}`;

    // ── Structure (4H primary) ──
    const structure = GoldStructureEngine.evaluate(tf.h4, '4H');

    // ── RSI matrix ──
    const rsiMatrix = GoldTechnicalEngine.buildRsiMatrix(tf);

    // ── Breakout (Donchian 20 บน 4H) ──
    const dc = donchian(tf.h4, 20);
    const lastClose4h = last(tf.h4).close;
    const upBreak = lastClose4h > dc.high, dnBreak = lastClose4h < dc.low;
    const breakout = {
      isBreakout: upBreak || dnBreak,
      direction: upBreak ? 'BULLISH' as const : dnBreak ? 'BEARISH' as const : 'NEUTRAL' as const,
      level: round2(upBreak ? dc.high : dnBreak ? dc.low : 0),
      donchianHigh: round2(dc.high), donchianLow: round2(dc.low),
      score: upBreak ? 80 : dnBreak ? 20 : 50,
      descTh: upBreak ? `4H ปิดทะลุกรอบ 20 แท่ง ${round2(dc.high)} — รอ Retest ยืนยัน`
        : dnBreak ? `4H ปิดหลุดกรอบ 20 แท่ง ${round2(dc.low)}`
          : `ยังอยู่ในกรอบ 4H ${round2(dc.low)} – ${round2(dc.high)}`,
    };

    // ── Mean reversion / extension จาก EMA20 4H ──
    const ema20_4h = lastEma(tf.h4.map(k => k.close), 20) ?? price;
    const devAtr = atr4h > 0 ? (price - ema20_4h) / atr4h : 0;
    const meanReversion = {
      deviationAtr: round2(devAtr),
      score: Math.round(clamp(100 - Math.abs(devAtr) * 28, 0, 100)),
      descTh: Math.abs(devAtr) < 0.8 ? `ราคาใกล้ EMA20 4H (${devAtr >= 0 ? '+' : ''}${devAtr.toFixed(1)} ATR) — ตำแหน่งเข้าไม่ต้องไล่ราคา`
        : Math.abs(devAtr) < 2 ? `ราคาห่าง EMA20 4H ${devAtr.toFixed(1)} ATR — ปานกลาง`
          : `ราคายืดตัว ${devAtr.toFixed(1)} ATR จาก EMA20 4H — เสี่ยงไล่ราคา`,
    };

    // ── Momentum (ROC 5 วัน + acceleration) ──
    const dCloses = tf.d1.map(k => k.close);
    const roc = (i: number) => dCloses.length > i + 5 ? ((dCloses[dCloses.length - 1 - i] / dCloses[dCloses.length - 6 - i]) - 1) * 100 : 0;
    const roc5 = roc(0), rocPrev = roc(5);
    const acceleration = roc5 - rocPrev > 0.8 ? 'ACCELERATING' as const : roc5 - rocPrev < -0.8 ? 'DECELERATING' as const : 'STEADY' as const;
    const momentum = {
      score: Math.round(clamp(50 + roc5 * 8, 0, 100)),
      roc5d: round2(roc5),
      acceleration,
      descTh: `ROC 5 วัน ${roc5 >= 0 ? '+' : ''}${roc5.toFixed(2)}% — ${acceleration === 'ACCELERATING' ? 'Momentum เร่งตัว' : acceleration === 'DECELERATING' ? 'Momentum ชะลอ' : 'Momentum คงที่'}`,
    };

    // ── Volatility ──
    const atrDSeries = atrSeries(tf.d1, 14);
    const atrPct = atrDSeries.map((a, i) => a == null ? NaN : a / tf.d1[i].close);
    const atrPercentile = percentileRank(atrPct, 250);
    const rets = dCloses.slice(-21).map((v, i, a) => i === 0 ? 0 : Math.log(v / a[i - 1])).slice(1);
    const mean = rets.reduce((s, v) => s + v, 0) / (rets.length || 1);
    const realizedVol = Math.sqrt(rets.reduce((s, v) => s + (v - mean) ** 2, 0) / (rets.length || 1)) * Math.sqrt(252) * 100;
    const bw = bandwidthSeries(tf.h4.map(k => k.close));
    const squeeze = percentileRank(bw, 120) <= 20;
    const volRegime: GoldVolatilityRegime = atrPercentile < 20 ? 'LOW' : atrPercentile < 75 ? 'NORMAL' : atrPercentile < 93 ? 'HIGH' : 'EXTREME';
    const volatility = {
      atr4h: round2(atr4h), atrDaily: round2(atrD), realizedVol: round2(realizedVol), atrPercentile, regime: volRegime, squeeze,
      descTh: `ATR 1D $${atrD.toFixed(1)} (percentile ${atrPercentile} ใน 1 ปี) · Realized Vol ${realizedVol.toFixed(1)}%${squeeze ? ' · 4H Bollinger บีบตัว (Compression)' : ''}`,
    };

    // ── Volume profile 30 วัน (4H) ──
    const vpRaw = volumeProfile(tf.h4.slice(-180));
    const volumeProfileResult = { ...vpRaw, descTh: `POC 30 วัน $${vpRaw.poc} — ${price > vpRaw.poc ? 'ราคาอยู่เหนือ POC (ผู้ซื้อคุมตลาด)' : 'ราคาอยู่ใต้ POC (ผู้ขายคุมตลาด)'}` };

    // ── Support / Resistance จาก swing 4H + 1D ──
    const sr = GoldTechnicalEngine.supportResistance(tf, price, atr4h);

    // ── VWAP: session + anchored (จาก swing สำคัญบน 1D) ──
    const sessionVwap = round2(vwap(GoldTechnicalEngine.currentSession(tf.h1)));
    const dSwings = findSwings(tf.d1.slice(-120), 3, 3);
    const anchor = trendBias >= 0 ? [...dSwings].reverse().find(s => s.type === 'L') : [...dSwings].reverse().find(s => s.type === 'H');
    const d1Slice = tf.d1.slice(-120);
    const anchorTime = anchor ? d1Slice[anchor.index].time : tf.h1[0].time;
    const anchoredVwap = round2(vwap(tf.h1.filter(k => k.time >= anchorTime)));
    const anchorLabel = anchor ? `Anchored จาก Swing ${anchor.type === 'L' ? 'Low' : 'High'} ${new Date(anchorTime * 1000).toISOString().slice(0, 10)}` : 'Anchored 6 เดือน';

    // ── Fibonacci (swing ล่าสุดบน 1D) ──
    const lastH = [...dSwings].reverse().find(s => s.type === 'H');
    const lastL = [...dSwings].reverse().find(s => s.type === 'L');
    const swingHigh = lastH?.price ?? Math.max(...d1Slice.map(k => k.high));
    const swingLow = lastL?.price ?? Math.min(...d1Slice.map(k => k.low));
    const fr = swingHigh - swingLow;
    const upLeg = (lastL?.index ?? 0) < (lastH?.index ?? 0); // ขาล่าสุดเป็นขาขึ้น → retracement วัดจาก high ลงมา
    const fibAt = (r: number) => round2(upLeg ? swingHigh - fr * r : swingLow + fr * r);
    const levels = { fib236: fibAt(0.236), fib382: fibAt(0.382), fib500: fibAt(0.5), fib618: fibAt(0.618), fib786: fibAt(0.786) };

    // ── Overall ──
    const bias = clamp(trendBias * 0.45 + structure.bias * 0.25 + (momentum.score - 50) * 2 * 0.15 + (breakout.score - 50) * 2 * 0.15, -100, 100);
    const overallBias = biasLabel(bias, 20);

    return {
      trendAlignment: { score: Math.round(50 + trendBias / 2), direction: trendDir, descTh: trendDesc, perTimeframe },
      structure, breakout, meanReversion, momentum, volatility, rsiMatrix,
      volumeProfile: volumeProfileResult,
      supportResistance: sr,
      vwap: { sessionVwap, anchoredVwap, anchorLabel, deviation: round2(((price - sessionVwap) / sessionVwap) * 100), descTh: `Session VWAP $${sessionVwap} · ${anchorLabel} $${anchoredVwap}` },
      fibonacci: { swingHigh: round2(swingHigh), swingLow: round2(swingLow), levels, descTh: `Swing ${upLeg ? 'ขาขึ้น' : 'ขาลง'} $${round2(swingLow)} → $${round2(swingHigh)} · Fib 61.8% $${levels.fib618}` },
      bias: Math.round(bias),
      overallScore: Math.round(50 + bias / 2),
      overallBias,
      summaryTh: overallBias === 'BULLISH' ? 'เทคนิคัลโดยรวมเป็นบวก — แนวโน้มและโครงสร้างสนับสนุนฝั่ง Long'
        : overallBias === 'BEARISH' ? 'เทคนิคัลโดยรวมเป็นลบ — แนวโน้มและโครงสร้างสนับสนุนฝั่ง Short'
          : 'เทคนิคัลยังไม่ชัดเจน — Timeframe และโครงสร้างขัดแย้งกัน',
    };
  }

  static tfBias(label: string, c: Candle[]): GoldTimeframeBias | null {
    if (c.length < 55) return null;
    const closes = c.map(k => k.close);
    const e20 = lastEma(closes, 20), e50 = lastEma(closes, 50), e200 = c.length >= 200 ? lastEma(closes, 200) : null;
    const close = last(closes);
    let bias: GoldTimeframeBias['bias'] = 'NEUTRAL';
    if (e20 != null && e50 != null) {
      if (close > e20 && e20 > e50) bias = 'BULLISH';
      else if (close < e20 && e20 < e50) bias = 'BEARISH';
    }
    return { timeframe: label, bias, close: round2(close), ema20: e20 && round2(e20), ema50: e50 && round2(e50), ema200: e200 && round2(e200) };
  }

  private static rsiLabel(v: number): { label: string; color: string } {
    if (v >= 78) return { label: 'ร้อนแรงเกิน', color: '#EF4444' };
    if (v >= 70) return { label: 'แข็งแรงมาก', color: '#F97316' };
    if (v >= 62) return { label: 'แข็งแรง', color: '#22C55E' };
    if (v >= 55) return { label: 'Momentum ดี', color: '#22C55E' };
    if (v >= 45) return { label: 'ปกติ', color: '#3B82F6' };
    if (v >= 38) return { label: 'อ่อนแรง', color: '#F59E0B' };
    if (v >= 25) return { label: 'อ่อนแรงมาก', color: '#F97316' };
    return { label: 'Oversold', color: '#EF4444' };
  }

  static buildRsiMatrix(tf: GoldTimeframes): GoldMtfRsiMatrix {
    const src: [string, Candle[]][] = [['5m', tf.m5], ['15m', tf.m15], ['1H', tf.h1], ['4H', tf.h4], ['1D', tf.d1], ['1W', tf.w1]];
    const timeframes: GoldRsiTimeframe[] = src.map(([timeframe, c]) => {
      const s = c.length > 15 ? rsiSeries(c.map(k => k.close)) : [];
      const v = s.length ? s[s.length - 1] : null;
      if (v == null) return { timeframe, value: null, label: 'ไม่มีข้อมูล', color: '#6B7280' };
      const { label, color } = GoldTechnicalEngine.rsiLabel(v);
      return { timeframe, value: Math.round(v), label, color };
    });
    const get = (t: string) => timeframes.find(x => x.timeframe === t)?.value ?? null;
    const core = ['1H', '4H', '1D'].map(get).filter((v): v is number => v != null);

    const hasOverboughtRisk = core.filter(v => v >= 72).length >= 2 || core.some(v => v >= 80);
    const hasOversoldRisk = core.filter(v => v <= 28).length >= 2 || core.some(v => v <= 20);

    // Divergence บน 4H: เทียบ 2 swing ล่าสุด
    const h4 = tf.h4.slice(-150);
    const r4 = rsiSeries(h4.map(k => k.close));
    const sw = findSwings(h4, 3, 3);
    const sh = sw.filter(s => s.type === 'H').slice(-2);
    const sl = sw.filter(s => s.type === 'L').slice(-2);
    const hasBearishDivergence = sh.length === 2 && sh[1].price > sh[0].price && (r4[sh[1].index] ?? 0) < (r4[sh[0].index] ?? 0) - 3;
    const hasBullishDivergence = sl.length === 2 && sl[1].price < sl[0].price && (r4[sl[1].index] ?? 100) > (r4[sl[0].index] ?? 100) + 3;

    const avg = core.length ? core.reduce((s, v) => s + v, 0) / core.length : 50;
    let overallStatus = 'NEUTRAL';
    let interpretationTh = 'RSI อยู่ในช่วงปกติ ไม่มีสัญญาณสุดโต่ง';
    if (hasOverboughtRisk) {
      overallStatus = 'OVEREXTENSION RISK';
      interpretationTh = 'RSI หลาย Timeframe ร้อนแรง — ไม่เหมาะสำหรับการไล่ซื้อ รอ Pullback (ไม่ได้แปลว่าต้องขาย)';
    } else if (hasOversoldRisk) {
      overallStatus = 'OVERSOLD — REVERSAL WATCH';
      interpretationTh = 'RSI หลาย Timeframe ต่ำมาก — ไม่เหมาะไล่ขาย เฝ้าดูสัญญาณกลับตัว';
    } else if (avg >= 55) {
      overallStatus = 'HEALTHY MOMENTUM';
      interpretationTh = 'ยังไม่พบ Overbought ที่รุนแรง และ RSI 1H/4H/1D สนับสนุนแนวโน้มขาขึ้น';
    } else if (avg <= 45) {
      overallStatus = 'WEAK MOMENTUM';
      interpretationTh = 'RSI หลาย Timeframe ต่ำกว่า 50 — แรงซื้อยังอ่อน';
    }
    if (hasBearishDivergence) interpretationTh += ' · ⚠ พบ Bearish Divergence บน 4H (ราคาทำ High ใหม่ แต่ RSI ต่ำลง)';
    if (hasBullishDivergence) interpretationTh += ' · พบ Bullish Divergence บน 4H (ราคาทำ Low ใหม่ แต่ RSI สูงขึ้น)';

    return { timeframes, overallStatus, interpretationTh, hasOverboughtRisk, hasOversoldRisk, hasBearishDivergence, hasBullishDivergence };
  }

  /** แนวรับ/ต้านจาก swing 4H + 1D รวมกลุ่มที่ใกล้กันภายใน 0.35 ATR */
  static supportResistance(tf: GoldTimeframes, price: number, atr4h: number): GoldTechnicalResult['supportResistance'] {
    const h4 = tf.h4.slice(-150), d1 = tf.d1.slice(-150);
    const levels = [...findSwings(h4, 3, 3), ...findSwings(d1, 3, 3)].map(s => s.price);
    const cluster = (arr: number[]) => {
      const out: number[] = [];
      for (const v of arr) if (!out.some(o => Math.abs(o - v) < atr4h * 0.35)) out.push(v);
      return out;
    };
    let supports = cluster(levels.filter(v => v < price - atr4h * 0.1).sort((a, b) => b - a)).slice(0, 3).map(round2);
    let resistances = cluster(levels.filter(v => v > price + atr4h * 0.1).sort((a, b) => a - b)).slice(0, 3).map(round2);
    // ไม่มี swing เหนือราคา (เช่น All-Time High) → ใช้ระดับจิตวิทยาทุก $50
    if (resistances.length < 3) {
      let r = Math.ceil((Math.max(price, ...resistances) + atr4h * 0.3) / 50) * 50;
      while (resistances.length < 3) { resistances.push(r); r += 50; }
    }
    if (supports.length < 3) {
      let s = Math.floor((Math.min(price, ...supports) - atr4h * 0.3) / 50) * 50;
      while (supports.length < 3) { supports.push(s); s -= 50; }
    }
    return { supports, resistances, descTh: `แนวรับใกล้สุด $${supports[0]} · แนวต้านใกล้สุด $${resistances[0]}` };
  }

  /** Session ปัจจุบันของ CME (เริ่มหลังช่องว่างเวลาพักตลาด > 1 ชม.) */
  static currentSession(h1: Candle[]): Candle[] {
    for (let i = h1.length - 1; i > 0; i--) {
      if (h1[i].time - h1[i - 1].time > 3600) return h1.slice(i);
    }
    return h1.slice(-23);
  }

  /** EMA series helper สำหรับ engine อื่น */
  static ema(c: Candle[], p: number) { return emaSeries(c.map(k => k.close), p); }
}
