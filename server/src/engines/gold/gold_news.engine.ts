/**
 * 🥇 GoldNewsEngine — News Intelligence
 * แยกทุกข่าวเป็น Source Reliability / Category / Impact / Freshness / Novelty / Priced-in / Direction / Horizon
 * Direction ใช้ lexicon เฉพาะทอง (rule-based, ตรวจสอบได้) — ไม่ใช่ sentiment ทั่วไป
 * Primary source (Fed/BLS/Treasury/WGC) มีน้ำหนักเหนือข่าวที่อ้างต่อกันมา
 */

import type { GoldNewsItem, GoldNewsResult, Bias3 } from './gold_types.js';
import type { RawNewsItem } from './gold_data_hub.js';
import { clamp, biasLabel } from './gold_indicators.js';

const RELIABILITY: [RegExp, number, boolean][] = [
  [/federal reserve|federalreserve\.gov/i, 100, true],
  [/bureau of labor|bls\.gov|treasury\.gov|bea\.gov/i, 100, true],
  [/world gold council|gold\.org|lbma|cme group|cftc/i, 95, true],
  [/reuters/i, 92, false], [/bloomberg/i, 92, false],
  [/wall street journal|wsj|financial times|\bft\b/i, 88, false],
  [/cnbc|associated press|\bap\b|barron/i, 82, false],
  [/marketwatch|kitco|nikkei|economic times|yahoo finance|investing\.com|fxstreet/i, 72, false],
];

const CATEGORY: [RegExp, string, number, string][] = [
  // regex, category, base impact, horizon
  [/\bfed\b|fomc|powell|rate (cut|hike)|interest rate|monetary polic/i, 'Fed/Monetary Policy', 90, 'Hours → Weeks'],
  [/\bcpi\b|inflation|\bpce\b|payroll|jobs report|unemployment|labor market/i, 'Inflation/Labor', 85, 'Hours → Days'],
  [/treasury|yield|bond/i, 'Treasury/Yields', 75, 'Hours → Days'],
  [/dollar|\bdxy\b|greenback/i, 'US Dollar', 70, 'Hours → Days'],
  [/war|missile|attack|sanction|geopolit|conflict|tension|invasion|ceasefire/i, 'Geopolitics', 75, 'Hours → Weeks'],
  [/central bank.*(gold|buy|reserve)|pboc|gold reserve/i, 'Central Bank Demand', 70, 'Weeks → Months'],
  [/\betf\b|spdr|gld|holdings/i, 'ETF Flows', 60, 'Days → Weeks'],
  [/bank (failure|stress|run)|banking crisis|credit event|default/i, 'Financial Stress', 85, 'Days → Weeks'],
  [/china|india|jewel|wedding|diwali|import/i, 'China/India Demand', 55, 'Weeks → Months'],
  [/mine|mining|supply|output|production/i, 'Mine Supply', 45, 'Months'],
];

const BULLISH_TERMS = /rate cut|cuts? rates|dovish|easing|safe[- ]haven|record high|all[- ]time high|gold (rises|rallies|jumps|climbs|gains|surges|soars|hits)|weaker dollar|dollar (falls|slips|weakens|drops)|yields? (fall|drop|slip|ease)|inflation (cools|eases|slows)|central banks? (buy|add|boost)|(war|conflict|tension|sanction)s? (escalat|intensif)|banking (stress|crisis)|recession fear|jobs? (miss|weak|slow)|inflows?/i;
const BEARISH_TERMS = /rate hike|hikes? rates|hawkish|tightening|gold (falls|slips|drops|declines|slides|tumbles|sinks|retreats|eases)|stronger dollar|dollar (rises|climbs|strengthens|jumps|gains)|yields? (rise|jump|climb|surge)|inflation (heats|accelerates|hot)|profit[- ]taking|ceasefire|peace (deal|talks)|outflows?|strong jobs|jobs? beat/i;

export class GoldNewsEngine {
  static evaluate(raw: RawNewsItem[] | null, now = Date.now()): GoldNewsResult {
    if (!raw || raw.length === 0) {
      return { latestEvents: [], overallSentiment: 'NEUTRAL', sentimentScore: 50, geopoliticalIntensity: 0, bias: 0, summaryTh: 'ไม่มีข้อมูลข่าวในขณะนี้ — ไม่นำข่าวมาคิดคะแนน', methodNote: '' };
    }

    const items: GoldNewsItem[] = raw.map(n => {
      const text = `${n.title} ${n.source}`;
      const rel = RELIABILITY.find(([re]) => re.test(n.source)) ?? [/./, 55, false] as [RegExp, number, boolean];
      const cat = CATEGORY.find(([re]) => re.test(n.title));
      const ts = Date.parse(n.pubDate) || now;
      const ageH = Math.max(0, (now - ts) / 3600_000);
      const freshness = Math.round(clamp(100 - ageH * 2.5, 0, 100));
      const bull = BULLISH_TERMS.test(text), bear = BEARISH_TERMS.test(text);
      const goldEffect: Bias3 = bull && !bear ? 'BULLISH' : bear && !bull ? 'BEARISH' : 'NEUTRAL';
      // ข่าวที่ซ้ำหัวข้อกันเยอะ = ไม่ใหม่ และตลาดน่าจะรับรู้แล้ว
      const key = n.title.toLowerCase().split(/\W+/).filter(w => w.length > 4).slice(0, 5);
      const similar = raw.filter(o => o !== n && key.filter(w => o.title.toLowerCase().includes(w)).length >= 3).length;
      const novelty = Math.round(clamp(100 - similar * 20, 10, 100));
      const pricedIn = Math.round(clamp(ageH * 3 + similar * 10, 0, 95));
      return {
        headline: n.title, source: n.source || 'Unknown', link: n.link,
        reliability: rel[1], isPrimarySource: rel[2],
        impact: cat?.[2] ?? 35, category: cat?.[1] ?? 'General', horizon: cat?.[3] ?? 'Hours',
        freshness, novelty, pricedIn, goldEffect, timestampIso: new Date(ts).toISOString(),
      };
    });

    // น้ำหนักข่าว = reliability × impact × freshness × (1 − priced-in)
    const weightOf = (i: GoldNewsItem) => (i.reliability / 100) * (i.impact / 100) * (i.freshness / 100) * (1 - i.pricedIn / 100);
    const ranked = items.filter(i => i.freshness > 0).sort((a, b) => weightOf(b) - weightOf(a));
    const top = ranked.slice(0, 12);

    let num = 0, den = 0;
    for (const i of ranked.slice(0, 30)) {
      const w = weightOf(i);
      den += w;
      num += w * (i.goldEffect === 'BULLISH' ? 1 : i.goldEffect === 'BEARISH' ? -1 : 0);
    }
    const bias = den > 0 ? clamp((num / den) * 100, -100, 100) : 0;
    const geo = items.filter(i => i.category === 'Geopolitics' && i.freshness > 40);
    const geopoliticalIntensity = Math.round(clamp(geo.length * 12 + geo.filter(i => i.reliability >= 88).length * 8, 0, 100));
    const overallSentiment = biasLabel(bias, 20);
    const cats = [...new Set(top.filter(i => i.goldEffect !== 'NEUTRAL').map(i => i.category))].slice(0, 3).join(', ');

    return {
      latestEvents: top,
      overallSentiment,
      sentimentScore: Math.round(50 + bias / 2),
      geopoliticalIntensity,
      bias: Math.round(bias),
      summaryTh: `${overallSentiment === 'BULLISH' ? 'ข่าวโดยรวมเป็นบวกต่อทอง' : overallSentiment === 'BEARISH' ? 'ข่าวโดยรวมเป็นลบต่อทอง' : 'ข่าวเป็นกลาง/ผสม'}${cats ? ` — ประเด็นหลัก: ${cats}` : ''}`,
      methodNote: 'จัดอันดับด้วย reliability × impact × freshness × (1 − priced-in) · ทิศทางจาก lexicon เฉพาะทอง (rule-based) · ข่าวสำคัญควรยืนยันกับแหล่งข้อมูลหลัก (Fed/BLS/Treasury)',
    };
  }
}
