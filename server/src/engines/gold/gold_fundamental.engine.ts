/**
 * 🥇 GoldFundamentalEngine — Macro-demand fundamentals ของทอง (0-100)
 * Live: Real Yield (opportunity cost), USD regime, Futures positioning (COT), Geopolitical demand (news)
 * Manual (WGC รายไตรมาส): Central banks, ETF, Bar/Coin, China, India, Mine supply, Recycling
 */

import type { GoldFundamentalResult, GoldFundamentalComponent, GoldMacroResult, GoldIntermarketResult, GoldOrderFlowResult, GoldNewsResult } from './gold_types.js';
import { GOLD_FUNDAMENTAL_INPUTS as WGC } from './gold_fundamental.config.js';
import { clamp } from './gold_indicators.js';

export class GoldFundamentalEngine {
  static evaluate(macro: GoldMacroResult, inter: GoldIntermarketResult, flow: GoldOrderFlowResult, news: GoldNewsResult): GoldFundamentalResult {
    const c: GoldFundamentalComponent[] = [];

    // Real yield level: ยิ่งสูง ต้นทุนการถือทองยิ่งสูง
    if (macro.realYield10y != null) {
      const s = Math.round(clamp(75 - macro.realYield10y * 12 - (macro.realYieldChange20dBp ?? 0) * 0.5, 5, 95));
      c.push({ key: 'realYield', name: 'Real Yield (ต้นทุนถือทอง)', score: s, trend: macro.realYieldTrend === 'FALLING' ? 'ลดลง' : macro.realYieldTrend === 'RISING' ? 'เพิ่มขึ้น' : 'ทรงตัว',
        descTh: `10Y TIPS ${macro.realYield10y.toFixed(2)}% — ${s >= 55 ? 'เอื้อต่อการถือทอง' : s <= 45 ? 'ต้นทุนการถือทองสูง' : 'กลาง ๆ'}`, source: 'U.S. Treasury', asOf: macro.yieldsAsOf });
    }

    const dxy = inter.items.find(i => i.key === 'dxy');
    if (dxy?.available) {
      const s = Math.round(clamp(50 - (dxy.change20dPct ?? 0) * 8, 5, 95));
      c.push({ key: 'usd', name: 'USD Regime', score: s, trend: dxy.direction === '↓' ? 'อ่อนค่า' : dxy.direction === '↑' ? 'แข็งค่า' : 'ทรงตัว',
        descTh: `DXY ${dxy.value} (20 วัน ${dxy.change20dPct != null ? `${dxy.change20dPct >= 0 ? '+' : ''}${dxy.change20dPct}%` : '—'})`, source: 'ICE DXY via Yahoo', asOf: null });
    }

    if (flow.cot) {
      // Positioning สูงมาก = demand จาก spec เต็มแล้ว (ความเสี่ยง), ต่ำ = ยังมีที่ให้เพิ่ม
      const p = flow.cot.specNetPercentile26w;
      const s = Math.round(clamp(50 + (flow.cot.specNetChangeWeek > 0 ? 10 : -10) - (p - 50) * 0.4, 5, 95));
      c.push({ key: 'positioning', name: 'Futures Positioning (COT)', score: s, trend: flow.cot.specNetChangeWeek > 0 ? 'Spec เพิ่ม Long' : 'Spec ลด Long',
        descTh: `Speculator net ${flow.cot.specNet.toLocaleString()} สัญญา (percentile ${p} ใน 26 สัปดาห์)`, source: 'CFTC COT', asOf: flow.cot.reportDate });
    }

    c.push({ key: 'geopolitical', name: 'Geopolitical Demand', score: Math.round(clamp(45 + news.geopoliticalIntensity * 0.45, 5, 95)),
      trend: news.geopoliticalIntensity >= 50 ? 'สูง' : news.geopoliticalIntensity >= 25 ? 'ปานกลาง' : 'ต่ำ',
      descTh: `ความเข้มข้นข่าวภูมิรัฐศาสตร์ ${news.geopoliticalIntensity}/100 (จากข่าว 48 ชม.)`, source: 'News Intelligence', asOf: null });

    const manual: [keyof typeof WGC, string][] = [
      ['centralBankDemand', 'Central Bank Demand'], ['etfFlow', 'ETF Flow'], ['barCoinDemand', 'Bar/Coin Demand'],
      ['chinaDemand', 'China Demand'], ['indiaDemand', 'India Demand'], ['mineSupply', 'Mine Supply'], ['recycling', 'Recycling'],
    ];
    for (const [k, name] of manual) {
      const v = WGC[k] as { score: number | null; trend: string; noteTh: string };
      c.push({ key: k, name, score: v.score, trend: v.trend, descTh: v.noteTh, source: 'World Gold Council (manual)', asOf: WGC.asOf });
    }

    const scored = c.filter(x => x.score != null);
    const overallScore = scored.length ? Math.round(scored.reduce((s, x) => s + (x.score as number), 0) / scored.length) : null;
    const coveragePct = Math.round((scored.length / c.length) * 100);
    const bias = overallScore != null ? (overallScore - 50) * 2 : 0;

    return {
      components: c, coveragePct, overallScore, bias,
      summaryTh: overallScore == null ? 'ไม่มีข้อมูลปัจจัยพื้นฐาน'
        : `ปัจจัยพื้นฐาน ${overallScore >= 58 ? 'เป็นบวกต่อทอง' : overallScore <= 42 ? 'เป็นลบต่อทอง' : 'เป็นกลาง'} (${overallScore}/100 · ครอบคลุมข้อมูล ${coveragePct}%${WGC.asOf ? ` · WGC ${WGC.asOf}` : ' · ข้อมูล WGC ยังไม่ได้อัปเดต'})`,
    };
  }
}
