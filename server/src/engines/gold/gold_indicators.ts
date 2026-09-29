/**
 * 🥇 Gold Indicator Toolkit — pure functions on candle arrays
 * ใช้ร่วมกันทั้ง live engines และ backtest (ห้ามมี side effect / random)
 */

import type { Candle } from '../../types/index.js';
import { IndicatorsEngine } from '../indicators.engine.js';

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const last = <T>(arr: T[]): T => arr[arr.length - 1];

export function emaSeries(values: number[], period: number): (number | null)[] {
  return IndicatorsEngine.calculateEMA(values, period);
}

export function lastEma(values: number[], period: number): number | null {
  const s = emaSeries(values, period);
  return s[s.length - 1] ?? null;
}

/** Wilder RSI series */
export function rsiSeries(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let ag = gain / period, al = loss / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

/** Wilder ATR series */
export function atrSeries(c: Candle[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(c.length).fill(null);
  if (c.length <= period) return out;
  const tr = c.map((k, i) => i === 0 ? k.high - k.low : Math.max(k.high - k.low, Math.abs(k.high - c[i - 1].close), Math.abs(k.low - c[i - 1].close)));
  let atr = tr.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = atr;
  for (let i = period + 1; i < c.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    out[i] = atr;
  }
  return out;
}

export function lastAtr(c: Candle[], period = 14): number {
  const s = atrSeries(c, period);
  return s[s.length - 1] ?? (c.length ? last(c).high - last(c).low : 0);
}

/** Percentile rank of the last value within the lookback window (0-100) */
export function percentileRank(values: number[], lookback: number): number {
  const w = values.slice(-lookback).filter(v => Number.isFinite(v));
  if (w.length < 2) return 50;
  const x = last(w);
  return Math.round((w.filter(v => v <= x).length / w.length) * 100);
}

export interface Swing { index: number; price: number; type: 'H' | 'L' }

/** Fractal pivots: bar is a swing high/low if it is the extreme of `left` bars before and `right` bars after */
export function findSwings(c: Candle[], left = 3, right = 3): Swing[] {
  const out: Swing[] = [];
  for (let i = left; i < c.length - right; i++) {
    let isH = true, isL = true;
    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue;
      if (c[j].high >= c[i].high) isH = false;
      if (c[j].low <= c[i].low) isL = false;
    }
    if (isH) out.push({ index: i, price: c[i].high, type: 'H' });
    if (isL) out.push({ index: i, price: c[i].low, type: 'L' });
  }
  return out;
}

export function donchian(c: Candle[], period: number, excludeLast = true): { high: number; low: number } {
  const w = excludeLast ? c.slice(-period - 1, -1) : c.slice(-period);
  return { high: Math.max(...w.map(k => k.high)), low: Math.min(...w.map(k => k.low)) };
}

/** Bollinger bandwidth series (upper-lower)/middle */
export function bandwidthSeries(closes: number[], period = 20, mult = 2): number[] {
  const out: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    const w = closes.slice(i - period + 1, i + 1);
    const m = w.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / period);
    out.push((2 * mult * sd) / m);
  }
  return out;
}

export function vwap(c: Candle[]): number {
  let pv = 0, v = 0;
  for (const k of c) { const tp = (k.high + k.low + k.close) / 3; pv += tp * k.volume; v += k.volume; }
  return v > 0 ? pv / v : (c.length ? last(c).close : 0);
}

/** Close Location Value × volume — proxy สำหรับ aggressive buy/sell เมื่อไม่มี tick data */
export function clvDelta(k: Candle): number {
  const range = k.high - k.low;
  if (range <= 0) return 0;
  return (((k.close - k.low) - (k.high - k.close)) / range) * k.volume;
}

/** Volume profile — POC / HVN / LVN จาก typical price */
export function volumeProfile(c: Candle[], bins = 40): { poc: number; hvn: number[]; lvn: number[] } {
  if (c.length === 0) return { poc: 0, hvn: [], lvn: [] };
  const hi = Math.max(...c.map(k => k.high)), lo = Math.min(...c.map(k => k.low));
  const step = (hi - lo) / bins || 1;
  const vol = new Array(bins).fill(0);
  for (const k of c) {
    // กระจาย volume ตามช่วงราคาที่แท่งเทียนครอบคลุม
    const a = Math.max(0, Math.floor((k.low - lo) / step));
    const b = Math.min(bins - 1, Math.floor((k.high - lo) / step));
    const share = k.volume / (b - a + 1);
    for (let i = a; i <= b; i++) vol[i] += share;
  }
  const mid = (i: number) => round2(lo + (i + 0.5) * step);
  const pocIdx = vol.indexOf(Math.max(...vol));
  const avg = vol.reduce((x, y) => x + y, 0) / bins;
  const hvn: number[] = [], lvn: number[] = [];
  for (let i = 1; i < bins - 1; i++) {
    if (vol[i] > vol[i - 1] && vol[i] > vol[i + 1] && vol[i] > avg * 1.3 && i !== pocIdx) hvn.push(mid(i));
    if (vol[i] < vol[i - 1] && vol[i] < vol[i + 1] && vol[i] < avg * 0.6) lvn.push(mid(i));
  }
  return { poc: mid(pocIdx), hvn: hvn.slice(-4), lvn: lvn.slice(-4) };
}

export function pctChange(from: number | undefined | null, to: number | undefined | null): number | null {
  if (from == null || to == null || from === 0) return null;
  return ((to - from) / from) * 100;
}

export function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 10) return null;
  const x = a.slice(-n), y = b.slice(-n);
  const mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

/** Daily returns aligned by UTC date between two daily series */
export function alignedReturns(a: Candle[], b: Candle[]): { ra: number[]; rb: number[] } {
  const day = (t: number) => Math.floor(t / 86400);
  const mb = new Map(b.map(k => [day(k.time), k.close]));
  const pairs: [number, number][] = [];
  for (const k of a) { const v = mb.get(day(k.time)); if (v != null) pairs.push([k.close, v]); }
  const ra: number[] = [], rb: number[] = [];
  for (let i = 1; i < pairs.length; i++) {
    ra.push(pairs[i][0] / pairs[i - 1][0] - 1);
    rb.push(pairs[i][1] / pairs[i - 1][1] - 1);
  }
  return { ra, rb };
}

/** Map bias (-100..100) → 0..100 score for a given direction */
export function alignedScore(bias: number, side: 'LONG' | 'SHORT'): number {
  return Math.round(clamp(50 + (side === 'LONG' ? bias : -bias) / 2, 0, 100));
}

export function biasLabel(bias: number, threshold = 15): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  return bias >= threshold ? 'BULLISH' : bias <= -threshold ? 'BEARISH' : 'NEUTRAL';
}

/** "3h 24m" / "2d 6h" / "12m" */
export function formatCountdown(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  if (m >= 1440) return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}
