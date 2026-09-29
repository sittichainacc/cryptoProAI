/**
 * 🥇 GoldRiskEngine — Gold Risk Radar (0-100, สูง = เสี่ยง)
 * คำนวณจากข้อมูลจริงทั้งหมด (deterministic) — overall ให้น้ำหนักความเสี่ยงสูงสุดด้วย
 * เพื่อไม่ให้ค่าเฉลี่ยกลบความเสี่ยงตัวใดตัวหนึ่งที่สูงมาก
 */

import type { GoldRiskResult, GoldRiskItem, GoldEventRiskResult, GoldIntermarketResult, GoldMacroResult, GoldTechnicalResult, GoldNewsResult, GoldPriceData, GoldTradingMode, TradeSide } from './gold_types.js';
import { clamp } from './gold_indicators.js';

const level = (s: number): GoldRiskItem['level'] => s < 25 ? 'LOW' : s < 45 ? 'NORMAL' : s < 65 ? 'ELEVATED' : s < 85 ? 'HIGH' : 'EXTREME';

export class GoldRiskEngine {
  static evaluate(p: {
    price: GoldPriceData; mode: GoldTradingMode; technical: GoldTechnicalResult; macro: GoldMacroResult;
    intermarket: GoldIntermarketResult; eventRisk: GoldEventRiskResult; news: GoldNewsResult;
    side: TradeSide; // ประเมินต่อฝั่งที่จะเทรด (USD แข็ง = เสี่ยงต่อ Long แต่หนุน Short)
  }): GoldRiskResult {
    const { price, mode, technical: t, macro, intermarket, eventRisk, news } = p;
    const s = p.side === 'LONG' ? 1 : -1;
    const sideTh = p.side === 'LONG' ? 'Long' : 'Short';
    const items: GoldRiskItem[] = [];
    const add = (name: string, nameTh: string, score: number, descTh: string) => {
      const s = Math.round(clamp(score, 0, 100));
      items.push({ name, nameTh, score: s, level: level(s), descTh });
    };

    // Macro event
    const nh = eventRisk.nextHighImpact;
    const mins = nh?.countdownMinutes ?? Infinity;
    add('Macro Event Risk', 'ความเสี่ยงเหตุการณ์มหภาค',
      eventRisk.isBlocked ? 92 : mins < 360 ? 65 : mins < 1440 ? 45 : mins < 4320 ? 30 : 15,
      nh ? `${nh.eventName} อีก ${nh.countdown}` : 'ไม่มีข่าว High Impact ในสัปดาห์นี้');

    // USD
    const dxy = intermarket.items.find(i => i.key === 'dxy');
    const d5 = dxy?.change5dPct ?? 0;
    add('USD Risk', 'ความเสี่ยงดอลลาร์', dxy?.available ? 35 + s * d5 * 30 : 40,
      dxy?.available ? `DXY 5 วัน ${d5 >= 0 ? '+' : ''}${d5}% (ต่อฝั่ง ${sideTh})` : 'ไม่มีข้อมูล DXY');

    // Real yield
    const ry = macro.realYieldChange20dBp;
    add('Real Yield Risk', 'ความเสี่ยง Real Yield', ry != null ? 35 + s * ry * 1.8 : 40,
      ry != null ? `Real Yield 20 วัน ${ry >= 0 ? '+' : ''}${ry}bp (ต่อฝั่ง ${sideTh})` : 'ไม่มีข้อมูล');

    // Technical extension
    const dev = Math.abs(t.meanReversion.deviationAtr);
    add('Technical Extension', 'ความเสี่ยงราคายืดตัว',
      15 + dev * 22 + (t.rsiMatrix.hasOverboughtRisk || t.rsiMatrix.hasOversoldRisk ? 20 : 0) + (t.rsiMatrix.hasBearishDivergence || t.rsiMatrix.hasBullishDivergence ? 10 : 0),
      `ห่าง EMA20 4H ${t.meanReversion.deviationAtr} ATR · RSI ${t.rsiMatrix.overallStatus}`);

    // Volatility
    add('Volatility Risk', 'ความเสี่ยงความผันผวน', t.volatility.atrPercentile * 0.9 + 5,
      `ATR percentile ${t.volatility.atrPercentile} · Realized Vol ${t.volatility.realizedVol}%`);

    // Geopolitical (proxy จากข่าว + VIX)
    const vix = intermarket.items.find(i => i.key === 'vix');
    const vixLvl = vix?.available ? parseFloat(vix.value) : 18;
    add('Geopolitical Risk', 'ความเสี่ยงภูมิรัฐศาสตร์', news.geopoliticalIntensity * 0.7 + clamp((vixLvl - 14) * 2.5, 0, 30),
      `ข่าวภูมิรัฐศาสตร์ ${news.geopoliticalIntensity}/100 · VIX ${vix?.available ? vix.value : '—'}`);

    // Execution
    let exec = price.marketOpen ? 15 : 55;
    let execDesc = price.marketOpen ? 'ตลาด COMEX เปิด สภาพคล่องปกติ' : 'ตลาด COMEX ปิด/ข้อมูลไม่อัปเดต — ราคาอาจ Gap';
    const hourUtc = new Date().getUTCHours();
    if (price.marketOpen && hourUtc >= 21 && hourUtc < 23) { exec += 15; execDesc = 'ช่วงเปลี่ยน Session สภาพคล่องบาง'; }
    if (mode === 'THAI_GOLD_BAR' && price.thaiGoldBarSell && price.thaiGoldBarBuy) {
      const spreadPct = ((price.thaiGoldBarSell - price.thaiGoldBarBuy) / price.thaiGoldBarSell) * 100;
      exec += spreadPct * 25;
      execDesc += ` · Spread ทองแท่ง ${spreadPct.toFixed(2)}%`;
    }
    add('Execution Risk', 'ความเสี่ยงการส่งคำสั่ง', exec, execDesc);

    const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
    const max = Math.max(...items.map(i => i.score));
    const overall = Math.round(avg * 0.6 + max * 0.4);
    const overallLevel = overall < 25 ? 'LOW' as const : overall < 40 ? 'MODERATE_LOW' as const : overall < 55 ? 'MODERATE' as const : overall < 70 ? 'MODERATE_HIGH' as const : 'HIGH' as const;
    const th = { LOW: 'ต่ำ', MODERATE_LOW: 'ต่ำ-ปานกลาง', MODERATE: 'ปานกลาง', MODERATE_HIGH: 'ปานกลาง-สูง', HIGH: 'สูง' }[overallLevel];
    const top = [...items].sort((a, b) => b.score - a.score)[0];

    return { items, overall, overallLevel, summaryTh: `ความเสี่ยงโดยรวม ${overall}/100 (${th}) — สูงสุด: ${top.nameTh} ${top.score}` };
  }
}
