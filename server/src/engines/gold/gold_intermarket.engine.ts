/**
 * 🥇 GoldIntermarketEngine (+ DollarEngine)
 * ทองไม่ควรวิเคราะห์แยกเดี่ยว — วัดทิศทางของตลาดที่เกี่ยวข้องจากข้อมูลจริง (5 วัน / 20 วัน)
 * และ correlation 60 วันกับทอง เพื่อตรวจว่าความสัมพันธ์ปกติยังทำงานอยู่หรือไม่
 */

import type { Candle } from '../../types/index.js';
import type { GoldIntermarketResult, IntermarketItem, GoldMacroResult, Bias3 } from './gold_types.js';
import type { IntermarketKey } from './gold_market_data.engine.js';
import { pctChange, pearson, alignedReturns, clamp, round2, biasLabel, last } from './gold_indicators.js';

type Series = Record<IntermarketKey, Candle[] | null>;

const chg = (c: Candle[] | null, n: number) => c && c.length > n ? pctChange(c[c.length - 1 - n].close, last(c).close) : null;
const arrow = (v: number | null, th: number): IntermarketItem['direction'] => v == null ? '→' : v > th ? '↑' : v < -th ? '↓' : '→';

export class GoldIntermarketEngine {
  static evaluate(series: Series, goldDaily: Candle[], macro: GoldMacroResult): GoldIntermarketResult {
    const items: IntermarketItem[] = [];
    let bias = 0;

    const corr = (c: Candle[] | null) => {
      if (!c) return null;
      const { ra, rb } = alignedReturns(goldDaily.slice(-70), c.slice(-70));
      const r = pearson(ra.slice(-60), rb.slice(-60));
      return r == null ? null : round2(r);
    };

    const add = (key: string, name: string, c: Candle[] | null, fmt: (v: number) => string, rule: (c5: number | null, c20: number | null, level: number) => { impact: Bias3; weight: number; desc: string }) => {
      if (!c || c.length < 25) {
        items.push({ key, name, value: '—', change5dPct: null, change20dPct: null, direction: '→', goldImpact: 'NEUTRAL', correlation60d: null, descTh: 'ไม่มีข้อมูล', available: false });
        return;
      }
      const c5 = chg(c, 5), c20 = chg(c, 20);
      const r = rule(c5, c20, last(c).close);
      bias += (r.impact === 'BULLISH' ? 1 : r.impact === 'BEARISH' ? -1 : 0) * r.weight;
      items.push({
        key, name, value: fmt(last(c).close),
        change5dPct: c5 != null ? round2(c5) : null, change20dPct: c20 != null ? round2(c20) : null,
        direction: arrow(c5, key === 'vix' ? 5 : 0.3), goldImpact: r.impact, correlation60d: corr(c), descTh: r.desc, available: true,
      });
    };

    // DXY — ความสัมพันธ์ผกผันหลัก
    add('dxy', 'DXY', series.dxy, v => v.toFixed(2), (c5, c20) => {
      const m = (c5 ?? 0) * 0.6 + (c20 ?? 0) * 0.4;
      return m < -0.4 ? { impact: 'BULLISH', weight: 25, desc: 'ดอลลาร์อ่อนค่า → สนับสนุนทอง' }
        : m > 0.4 ? { impact: 'BEARISH', weight: 25, desc: 'ดอลลาร์แข็งค่า → กดดันทอง' }
          : { impact: 'NEUTRAL', weight: 0, desc: 'ดอลลาร์ทรงตัว' };
    });

    // Real Yield (Treasury)
    if (macro.realYield10y != null) {
      const chgBp = macro.realYieldChange20dBp;
      const impact: Bias3 = macro.realYieldTrend === 'FALLING' ? 'BULLISH' : macro.realYieldTrend === 'RISING' ? 'BEARISH' : 'NEUTRAL';
      bias += impact === 'BULLISH' ? 25 : impact === 'BEARISH' ? -25 : 0;
      items.push({
        key: 'realYield', name: 'Real Yield 10Y (TIPS)', value: `${macro.realYield10y.toFixed(2)}%`,
        change5dPct: null, change20dPct: null, direction: macro.realYieldTrend === 'FALLING' ? '↓' : macro.realYieldTrend === 'RISING' ? '↑' : '→',
        goldImpact: impact, correlation60d: null,
        descTh: `${chgBp != null ? `${chgBp >= 0 ? '+' : ''}${chgBp}bp ใน 20 วัน — ` : ''}${impact === 'BULLISH' ? 'ต้นทุนการถือทองลดลง' : impact === 'BEARISH' ? 'ต้นทุนการถือทองสูงขึ้น' : 'ทรงตัว'}`,
        available: true,
      });
    } else {
      items.push({ key: 'realYield', name: 'Real Yield 10Y (TIPS)', value: '—', change5dPct: null, change20dPct: null, direction: '→', goldImpact: 'NEUTRAL', correlation60d: null, descTh: 'ไม่มีข้อมูล', available: false });
    }

    // Fed pricing
    {
      const impact: Bias3 = macro.fedBias === 'DOVISH' ? 'BULLISH' : macro.fedBias === 'HAWKISH' ? 'BEARISH' : 'NEUTRAL';
      bias += impact === 'BULLISH' ? 12 : impact === 'BEARISH' ? -12 : 0;
      items.push({
        key: 'fed', name: 'Fed Expectations (2Y−3M)', value: macro.policySpread2y3m != null ? `${macro.policySpread2y3m}bp` : '—',
        change5dPct: null, change20dPct: null, direction: macro.fedBias === 'DOVISH' ? '↓' : macro.fedBias === 'HAWKISH' ? '↑' : '→',
        goldImpact: impact, correlation60d: null, descTh: macro.rateCutExpectation, available: macro.policySpread2y3m != null,
      });
    }

    // Silver — การยืนยันจากโลหะมีค่า
    add('silver', 'XAG/USD (Silver)', series.silver, v => `$${v.toFixed(2)}`, (c5) => {
      const g5 = chg(goldDaily, 5) ?? 0;
      if (c5 == null) return { impact: 'NEUTRAL', weight: 0, desc: '—' };
      if (c5 > 0.5 && g5 > 0) return { impact: 'BULLISH', weight: 8, desc: 'Silver ขึ้นพร้อมทอง → ยืนยันแรงซื้อโลหะมีค่า' };
      if (c5 < -0.5 && g5 < 0) return { impact: 'BEARISH', weight: 8, desc: 'Silver ลงพร้อมทอง → ยืนยันแรงขาย' };
      return { impact: 'NEUTRAL', weight: 0, desc: 'Silver ไม่ยืนยันทิศทางทอง (Divergence)' };
    });

    // VIX — safe haven
    add('vix', 'VIX', series.vix, v => v.toFixed(1), (c5, _c20, lvl) =>
      lvl > 25 && (c5 ?? 0) > 0 ? { impact: 'BULLISH', weight: 10, desc: 'ความกลัวในตลาดสูง → Safe-haven demand' }
        : lvl > 20 ? { impact: 'BULLISH', weight: 5, desc: 'ความผันผวนสูงกว่าปกติ → หนุนทองเล็กน้อย' }
          : { impact: 'NEUTRAL', weight: 0, desc: 'ความผันผวนตลาดหุ้นปกติ' });

    // USD/JPY — risk-off proxy
    add('usdJpy', 'USD/JPY', series.usdJpy, v => v.toFixed(2), (c5) =>
      (c5 ?? 0) < -1 ? { impact: 'BULLISH', weight: 6, desc: 'เยนแข็งค่า → Risk-off / ดอลลาร์อ่อน' }
        : (c5 ?? 0) > 1 ? { impact: 'BEARISH', weight: 6, desc: 'เยนอ่อนค่า → ดอลลาร์แข็ง' }
          : { impact: 'NEUTRAL', weight: 0, desc: 'ทรงตัว' });

    // USD/THB — กระทบทองไทยเท่านั้น (ไม่นับเข้า bias ทองโลก)
    add('usdThb', 'USD/THB', series.usdThb, v => v.toFixed(2), (c5) => ({
      impact: 'NEUTRAL', weight: 0,
      desc: (c5 ?? 0) < -0.3 ? 'บาทแข็งค่า → ทองไทยอาจขึ้นน้อยกว่าทองโลก' : (c5 ?? 0) > 0.3 ? 'บาทอ่อนค่า → ทองไทยได้แรงหนุนเพิ่ม' : 'ค่าเงินบาททรงตัว',
    }));

    // S&P 500
    add('sp500', 'S&P 500', series.sp500, v => v.toLocaleString('en-US', { maximumFractionDigits: 0 }), (c5) =>
      (c5 ?? 0) < -3 ? { impact: 'BULLISH', weight: 6, desc: 'หุ้นลงแรง → เงินไหลเข้าสินทรัพย์ปลอดภัย' }
        : { impact: 'NEUTRAL', weight: 0, desc: (c5 ?? 0) > 2 ? 'หุ้นแข็งแรง (Risk-on) — ผลต่อทองจำกัด' : 'หุ้นทรงตัว' });

    // WTI — inflation expectations
    add('wti', 'WTI Crude', series.wti, v => `$${v.toFixed(2)}`, (_c5, c20) =>
      (c20 ?? 0) > 8 ? { impact: 'BULLISH', weight: 5, desc: 'น้ำมันขึ้นแรง → คาดการณ์เงินเฟ้อสูง → หนุนทอง' }
        : (c20 ?? 0) < -10 ? { impact: 'BEARISH', weight: 3, desc: 'น้ำมันลงแรง → คาดการณ์เงินเฟ้อลด' }
          : { impact: 'NEUTRAL', weight: 0, desc: 'น้ำมันไม่มีผลเด่น' });

    // Gold/Silver ratio
    if (series.silver && series.silver.length > 25) {
      const ratio = last(goldDaily).close / last(series.silver).close;
      const ratio20 = goldDaily[goldDaily.length - 21]?.close / series.silver[series.silver.length - 21].close;
      const rc = pctChange(ratio20, ratio);
      items.push({
        key: 'gsRatio', name: 'Gold/Silver Ratio', value: ratio.toFixed(1), change5dPct: null, change20dPct: rc != null ? round2(rc) : null,
        direction: arrow(rc, 2), goldImpact: 'NEUTRAL', correlation60d: null,
        descTh: rc != null && rc > 3 ? 'Ratio สูงขึ้น → ทองแข็งกว่าเงิน (โหมดป้องกันความเสี่ยง)' : rc != null && rc < -3 ? 'Ratio ลดลง → โลหะมีค่ามี risk appetite' : 'อยู่ในช่วงปกติ',
        available: true,
      });
    }

    bias = clamp(bias, -100, 100);
    const overallBias = biasLabel(bias, 15);
    const dxyItem = items.find(i => i.key === 'dxy');
    const corrNote = dxyItem?.correlation60d != null && dxyItem.correlation60d > 0.1 ? ' · ⚠ ช่วงนี้ทองกับดอลลาร์เคลื่อนที่ทางเดียวกัน (ความสัมพันธ์ปกติอ่อนลง)' : '';
    const drivers = items.filter(i => i.goldImpact !== 'NEUTRAL').map(i => `${i.name} ${i.goldImpact === 'BULLISH' ? '✓' : '✕'}`).slice(0, 4).join(' · ');

    return {
      items,
      bias: Math.round(bias),
      score: Math.round(50 + bias / 2),
      overallBias,
      summaryTh: `${overallBias === 'BULLISH' ? 'Intermarket สนับสนุนทอง' : overallBias === 'BEARISH' ? 'Intermarket กดดันทอง' : 'Intermarket เป็นกลาง/สัญญาณผสม'}${drivers ? ` — ${drivers}` : ''}${corrNote}`,
    };
  }
}
