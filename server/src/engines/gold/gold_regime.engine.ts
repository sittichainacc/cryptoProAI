/**
 * 🥇 GoldRegimeEngine
 * ก่อนหาจุดเข้าต้องตอบก่อนว่า "ทองอยู่ในตลาดประเภทไหน"
 * Trend / Volatility / Macro / USD / Real Yield / Safe Haven / State
 */

import type { Candle } from '../../types/index.js';
import type {
  GoldRegimeResult, GoldRegimeFactor, GoldTrendRegime, GoldUsdRegime, GoldSafeHavenRegime, GoldStateRegime,
  GoldTechnicalResult, GoldMacroResult, GoldIntermarketResult, GoldNewsResult,
} from './gold_types.js';
import { lastAtr, lastEma, last } from './gold_indicators.js';

export class GoldRegimeEngine {
  static evaluate(p: { d1: Candle[]; technical: GoldTechnicalResult; macro: GoldMacroResult; intermarket: GoldIntermarketResult; news: GoldNewsResult }): GoldRegimeResult {
    const { d1, technical: t, macro, intermarket, news } = p;
    const close = last(d1).close;

    // 1. Trend
    const ts = t.trendAlignment.score;
    const ema200 = lastEma(d1.map(k => k.close), 200);
    let trend: GoldTrendRegime = 'SIDEWAYS';
    if (ts >= 80 && (ema200 == null || close > ema200) && t.structure.trend !== 'BEARISH') trend = 'STRONG_BULL';
    else if (ts >= 62) trend = 'BULL';
    else if (ts <= 20 && (ema200 == null || close < ema200) && t.structure.trend !== 'BULLISH') trend = 'STRONG_BEAR';
    else if (ts <= 38) trend = 'BEAR';
    const bull = trend === 'BULL' || trend === 'STRONG_BULL';
    const bear = trend === 'BEAR' || trend === 'STRONG_BEAR';

    // 2. Volatility
    const volatility = t.volatility.regime;

    // 3-5. Macro / USD / Real yield
    const macroR = macro.fedBias;
    const dxy = intermarket.items.find(i => i.key === 'dxy');
    const d20 = dxy?.change20dPct ?? 0, d5 = dxy?.change5dPct ?? 0;
    const usd: GoldUsdRegime = !dxy?.available ? 'NEUTRAL' : (d20 <= -1 || d5 <= -0.8) ? 'WEAKENING' : (d20 >= 1 || d5 >= 0.8) ? 'STRENGTHENING' : 'NEUTRAL';
    const realYield = macro.realYieldTrend;

    // 6. Safe haven
    const vixItem = intermarket.items.find(i => i.key === 'vix');
    const vix = vixItem?.available ? parseFloat(vixItem.value) : 0;
    const safeHaven: GoldSafeHavenRegime = vix > 30 || news.geopoliticalIntensity >= 85 ? 'EXTREME'
      : vix > 20 || news.geopoliticalIntensity >= 55 ? 'ELEVATED' : 'NORMAL';

    // 7. State
    const atrPrev = lastAtr(d1.slice(0, -1));
    const lastBar = last(d1);
    const prevClose = d1[d1.length - 2]?.close ?? lastBar.open;
    const trueRange = Math.max(lastBar.high - lastBar.low, Math.abs(lastBar.high - prevClose), Math.abs(lastBar.low - prevClose));
    const high5 = Math.max(...d1.slice(-5).map(k => k.high));
    const low5 = Math.min(...d1.slice(-5).map(k => k.low));
    const dev = t.meanReversion.deviationAtr;
    const rsi = t.rsiMatrix;

    let state: GoldStateRegime = 'TREND';
    if (volatility === 'EXTREME' || (atrPrev > 0 && trueRange > atrPrev * 2.3)) state = 'SHOCK';
    else if (trend === 'SIDEWAYS') state = t.breakout.isBreakout ? 'BREAKOUT' : 'RANGE';
    else if (bull && rsi.hasOverboughtRisk && (rsi.hasBearishDivergence || dev > 2.5)) state = 'EXHAUSTION';
    else if (bear && rsi.hasOversoldRisk && (rsi.hasBullishDivergence || dev < -2.5)) state = 'EXHAUSTION';
    else if ((bull && t.breakout.direction === 'BULLISH') || (bear && t.breakout.direction === 'BEARISH')) state = 'BREAKOUT';
    else if ((bull && t.structure.event === 'CHOCH_DOWN') || (bear && t.structure.event === 'CHOCH_UP')) state = 'RECOVERY';
    else if (bull && high5 - close > t.volatility.atr4h && dev <= 0.6) state = 'PULLBACK';
    else if (bear && close - low5 > t.volatility.atr4h && dev >= -0.6) state = 'PULLBACK';

    // Factors
    const f = (name: string, value: string, good: boolean, neutral: boolean): GoldRegimeFactor =>
      ({ name, value, isBullish: good, icon: neutral ? '—' : good ? '✓' : '✕' });
    const factors: GoldRegimeFactor[] = [
      f('USD', usd === 'WEAKENING' ? 'อ่อนค่า' : usd === 'STRENGTHENING' ? 'แข็งค่า' : 'ทรงตัว', usd === 'WEAKENING', usd === 'NEUTRAL'),
      f('Real Yield', realYield === 'FALLING' ? 'ลดลง' : realYield === 'RISING' ? 'เพิ่มขึ้น' : 'คงที่', realYield === 'FALLING', realYield === 'STABLE'),
      f('Fed Bias', macroR === 'DOVISH' ? 'Dovish' : macroR === 'HAWKISH' ? 'Hawkish' : 'Neutral', macroR === 'DOVISH', macroR === 'NEUTRAL'),
      f('Gold Structure', t.structure.trend === 'BULLISH' ? 'Bullish' : t.structure.trend === 'BEARISH' ? 'Bearish' : 'Mixed', t.structure.trend === 'BULLISH', t.structure.trend === 'NEUTRAL'),
      f('Safe Haven Flow', safeHaven === 'NORMAL' ? 'Normal' : safeHaven === 'ELEVATED' ? 'Elevated' : 'Extreme', safeHaven !== 'NORMAL', safeHaven === 'NORMAL'),
      { name: 'Volatility', value: volatility === 'LOW' ? 'ต่ำ' : volatility === 'NORMAL' ? 'ปกติ' : volatility === 'HIGH' ? 'สูง' : 'สูงมาก', isBullish: volatility === 'LOW' || volatility === 'NORMAL', icon: volatility === 'LOW' || volatility === 'NORMAL' ? '✓' : '⚠' },
    ];

    // Confidence = ความสอดคล้องของปัจจัยกับทิศทาง trend (deterministic)
    const directional = factors.slice(0, 5).filter(x => x.icon !== '—');
    const agree = directional.filter(x => bull ? x.isBullish : bear ? !x.isBullish : false).length;
    const confidence = trend === 'SIDEWAYS'
      ? Math.round(40 + (state === 'RANGE' ? 15 : 0))
      : Math.round(45 + (directional.length ? agree / directional.length : 0.5) * 45 + (trend.startsWith('STRONG') ? 8 : 0));

    const trendLabel: Record<GoldTrendRegime, string> = { STRONG_BULL: 'STRONG BULLISH', BULL: 'BULLISH', SIDEWAYS: 'SIDEWAYS', BEAR: 'BEARISH', STRONG_BEAR: 'STRONG BEARISH' };
    const stateLabel: Record<GoldStateRegime, string> = { TREND: 'TRENDING', PULLBACK: 'PULLBACK', BREAKOUT: 'BREAKOUT', EXHAUSTION: 'EXHAUSTION', SHOCK: 'SHOCK', RECOVERY: 'REVERSAL RISK', RANGE: 'RANGE' };

    return {
      trend, volatility, macro: macroR, usd, realYield, safeHaven, state,
      confidence: Math.min(98, confidence),
      labelTh: `${trendLabel[trend]} — ${stateLabel[state]}`,
      adviceTh: GoldRegimeEngine.advice(trend, state, usd, realYield, macroR),
      factors,
    };
  }

  private static advice(trend: GoldTrendRegime, state: GoldStateRegime, usd: GoldUsdRegime, ry: string, macro: string): string {
    const parts: string[] = [];
    parts.push(trend.includes('BULL') ? 'ทองอยู่ในแนวโน้มขาขึ้น' : trend.includes('BEAR') ? 'ทองอยู่ในแนวโน้มขาลง' : 'ทองเคลื่อนไหวในกรอบ Sideways');
    const st: Partial<Record<GoldStateRegime, string>> = {
      PULLBACK: 'กำลังย่อตัว — เฝ้าหาจุดเข้าตามแนวโน้มหลัก',
      BREAKOUT: 'เพิ่งทะลุแนวสำคัญ — รอ Retest ยืนยันก่อนเข้า',
      EXHAUSTION: 'มีสัญญาณหมดแรง — ไม่ไล่ราคา ระวังการกลับตัว',
      SHOCK: 'ตลาดผันผวนรุนแรงผิดปกติ — ไม่ควรเร่งเปิด Position',
      RECOVERY: 'โครงสร้างเริ่มเปลี่ยนทิศ (CHOCH) — แนวโน้มเดิมอ่อนแรง',
      RANGE: 'ราคาแกว่งในกรอบ — รอ Breakout หรือซื้อขายที่ขอบกรอบ',
    };
    if (st[state]) parts.push(st[state]!);
    if (usd === 'WEAKENING') parts.push('ดอลลาร์อ่อนค่าหนุนทอง');
    if (usd === 'STRENGTHENING') parts.push('ดอลลาร์แข็งค่ากดดันทอง');
    if (ry === 'FALLING') parts.push('Real Yield ลดลงเป็นบวกต่อทอง');
    if (ry === 'RISING') parts.push('Real Yield เพิ่มขึ้นกดดันทอง');
    if (macro === 'DOVISH') parts.push('ตลาดคาด Fed ผ่อนคลาย');
    if (macro === 'HAWKISH') parts.push('ตลาดคาด Fed เข้มงวด');
    return parts.join(' — ');
  }
}
