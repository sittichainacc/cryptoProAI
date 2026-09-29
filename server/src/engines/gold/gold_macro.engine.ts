/**
 * 🥇 GoldMacroEngine (+ FedIntelligence / Inflation / LaborMarket / Yield)
 *
 * แหล่งข้อมูล:
 *  - Nominal 3M/2Y/10Y + 10Y Real Yield (TIPS) : U.S. Treasury (primary)
 *  - CPI / Core CPI / NFP / Unemployment / AHE : U.S. BLS (primary)
 *  - Consensus (forecast) : economic calendar รายสัปดาห์ → ใช้คำนวณ Surprise เมื่อมีข่าวออกในสัปดาห์นี้
 *  - Fed expectations : market-implied จาก 2Y − 3M spread และการเปลี่ยนแปลงของ 2Y
 *    (ไม่ใช่ CME FedWatch — FedWatch ไม่มี public API ฟรี)
 */

import type { GoldMacroResult, MacroDataPoint, GoldRealYieldRegime, GoldMacroRegime, Bias3 } from './gold_types.js';
import type { YieldPoint, BlsObservation, CalendarEvent, BLS_SERIES } from './gold_data_hub.js';
import type { FomcMeeting } from './gold_calendar.provider.js';
import { clamp, round2, formatCountdown } from './gold_indicators.js';


type Bls = Record<keyof typeof BLS_SERIES, BlsObservation[]>;

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const periodLabel = (o: BlsObservation) => `${MONTHS_TH[o.month - 1]} ${o.year}`;

function yoy(obs: BlsObservation[], idxFromEnd = 0): number | null {
  const cur = obs[obs.length - 1 - idxFromEnd];
  if (!cur) return null;
  const prev = obs.find(o => o.year === cur.year - 1 && o.month === cur.month);
  return prev ? ((cur.value / prev.value) - 1) * 100 : null;
}

const parseForecast = (s: string): number | null => {
  const m = s?.match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
};

export class GoldMacroEngine {
  static evaluate(yields: YieldPoint[] | null, bls: Bls | null, calendar: CalendarEvent[] | null, fomc: FomcMeeting[]): GoldMacroResult {
    // ── Yields ──
    const y = yields?.filter(p => p.y2 != null || p.real10 != null) ?? [];
    const latest = y[y.length - 1];
    const ago = y[Math.max(0, y.length - 21)];
    const us2y = latest?.y2 ?? null, us10y = latest?.y10 ?? null, us3m = latest?.y3m ?? null;
    const real10 = [...y].reverse().find(p => p.real10 != null)?.real10 ?? null;
    const real10Ago = ago?.real10 ?? null;
    const realChg = real10 != null && real10Ago != null ? Math.round((real10 - real10Ago) * 100) : null;
    const y2Chg = us2y != null && ago?.y2 != null ? Math.round((us2y - ago.y2) * 100) : null;
    const spread = us2y != null && us3m != null ? Math.round((us2y - us3m) * 100) : null;

    const realYieldTrend: GoldRealYieldRegime = realChg == null ? 'STABLE' : realChg <= -10 ? 'FALLING' : realChg >= 10 ? 'RISING' : 'STABLE';

    // ── Fed bias (market-implied) ──
    const fedVal = clamp(-(spread ?? 0) * 0.6 - (y2Chg ?? 0) * 1.5, -100, 100);
    const fedBias: GoldMacroRegime = spread == null && y2Chg == null ? 'NEUTRAL' : fedVal >= 20 ? 'DOVISH' : fedVal <= -20 ? 'HAWKISH' : 'NEUTRAL';
    const rateCutExpectation = spread == null ? 'ไม่มีข้อมูล'
      : spread < -10 ? `ตลาดคาดลดดอกเบี้ยราว ${Math.max(1, Math.round(-spread / 25))} ครั้ง (2Y ต่ำกว่า 3M ${-spread}bp)`
        : spread > 10 ? `ตลาดไม่คาดลดดอกเบี้ย — 2Y สูงกว่า 3M ${spread}bp (เสี่ยงดอกเบี้ยสูงนาน/ขึ้นดอกเบี้ย)`
          : `ตลาดคาดดอกเบี้ยทรงตัว (2Y−3M ${spread}bp)`;

    // ── Economic data (BLS) + surprise ──
    const events: MacroDataPoint[] = [];
    let dataBias = 0;
    const cal = (calendar ?? []).filter(e => e.country === 'USD' && Date.parse(e.date) < Date.now());
    const findCal = (re: RegExp, releaseMonthOf: BlsObservation) => cal.find(e => {
      if (!re.test(e.title)) return false;
      const d = new Date(e.date);
      // ข้อมูลเดือน M ประกาศในเดือน M+1
      const expected = releaseMonthOf.month === 12 ? { y: releaseMonthOf.year + 1, m: 1 } : { y: releaseMonthOf.year, m: releaseMonthOf.month + 1 };
      return d.getUTCFullYear() === expected.y && d.getUTCMonth() + 1 === expected.m;
    });

    const push = (p: Omit<MacroDataPoint, 'surprise' | 'surpriseBasis' | 'goldImpact' | 'reasonTh'> & { actualN: number; prevN: number; forecastN: number | null; higherIsBullishGold: boolean; unit: string; reasonUp: string; reasonDown: string; weight: number }) => {
      const basis = p.forecastN != null ? 'CONSENSUS' as const : 'PREVIOUS' as const;
      const ref = p.forecastN ?? p.prevN;
      const diff = p.actualN - ref;
      const tol = p.unit === 'K' ? 25 : 0.05;
      const dir = Math.abs(diff) <= tol ? 0 : diff > 0 ? 1 : -1;
      const bullish = dir === 0 ? 0 : (dir > 0) === p.higherIsBullishGold ? 1 : -1;
      const goldImpact: Bias3 = bullish > 0 ? 'BULLISH' : bullish < 0 ? 'BEARISH' : 'NEUTRAL';
      dataBias += bullish * p.weight * (basis === 'CONSENSUS' ? 1 : 0.5);
      events.push({
        name: p.name, period: p.period, expected: p.expected, actual: p.actual, previous: p.previous,
        surprise: `${diff >= 0 ? '+' : ''}${p.unit === 'K' ? Math.round(diff) + 'K' : diff.toFixed(2) + p.unit}`,
        surpriseBasis: basis, goldImpact,
        reasonTh: (dir === 0 ? 'ใกล้เคียง' + (basis === 'CONSENSUS' ? 'คาดการณ์' : 'เดือนก่อน') + ' — ผลกระทบจำกัด' : dir > 0 ? p.reasonUp : p.reasonDown)
          + (basis === 'PREVIOUS' ? ' (เทียบเดือนก่อน — ไม่มี consensus ในสัปดาห์นี้)' : ''),
        source: p.source,
      });
    };

    let cpiLatest: MacroDataPoint | null = null, coreCpiLatest: MacroDataPoint | null = null;
    let nfpLatest: MacroDataPoint | null = null, unemploymentLatest: MacroDataPoint | null = null;

    if (bls) {
      const cpiNow = yoy(bls.cpi), cpiPrev = yoy(bls.cpi, 1);
      if (cpiNow != null && cpiPrev != null) {
        const o = bls.cpi[bls.cpi.length - 1];
        const c = findCal(/^CPI y\/y/i, o);
        push({ name: 'CPI (YoY)', period: periodLabel(o), expected: c?.forecast || null, actual: `${cpiNow.toFixed(1)}%`, previous: `${cpiPrev.toFixed(1)}%`,
          actualN: round2(cpiNow), prevN: round2(cpiPrev), forecastN: c ? parseForecast(c.forecast) : null, higherIsBullishGold: false, unit: '%', weight: 12,
          reasonUp: 'เงินเฟ้อสูงกว่า → Fed ลดดอกเบี้ยยากขึ้น → Yield/Real Yield ขึ้น → กดดันทอง',
          reasonDown: 'เงินเฟ้อต่ำกว่า → คาดหวังลดดอกเบี้ยเพิ่ม → Real Yield ลง → สนับสนุนทอง', source: 'U.S. BLS' });
        cpiLatest = events[events.length - 1];
      }
      const coreNow = yoy(bls.coreCpi), corePrev = yoy(bls.coreCpi, 1);
      if (coreNow != null && corePrev != null) {
        const o = bls.coreCpi[bls.coreCpi.length - 1];
        const c = findCal(/^Core CPI y\/y/i, o);
        push({ name: 'Core CPI (YoY)', period: periodLabel(o), expected: c?.forecast || null, actual: `${coreNow.toFixed(1)}%`, previous: `${corePrev.toFixed(1)}%`,
          actualN: round2(coreNow), prevN: round2(corePrev), forecastN: c ? parseForecast(c.forecast) : null, higherIsBullishGold: false, unit: '%', weight: 12,
          reasonUp: 'Core CPI เร่งตัว → Fed Hawkish ขึ้น → กดดันทอง',
          reasonDown: 'Core CPI ชะลอ → Fed มีช่องลดดอกเบี้ย → สนับสนุนทอง', source: 'U.S. BLS' });
        coreCpiLatest = events[events.length - 1];
      }
      const pay = bls.payrolls;
      if (pay.length >= 3) {
        const o = pay[pay.length - 1];
        const now = o.value - pay[pay.length - 2].value, prev = pay[pay.length - 2].value - pay[pay.length - 3].value;
        const c = findCal(/Non-Farm Employment Change/i, o);
        push({ name: 'Non-Farm Payrolls', period: periodLabel(o), expected: c?.forecast || null, actual: `${Math.round(now)}K`, previous: `${Math.round(prev)}K`,
          actualN: now, prevN: prev, forecastN: c ? parseForecast(c.forecast) : null, higherIsBullishGold: false, unit: 'K', weight: 10,
          reasonUp: 'ตลาดแรงงานแข็งแรงกว่า → Fed ไม่รีบลดดอกเบี้ย → USD/Yield ขึ้น → กดดันทอง',
          reasonDown: 'ตลาดแรงงานชะลอ → Fed มีเหตุผลลดดอกเบี้ย → สนับสนุนทอง', source: 'U.S. BLS' });
        nfpLatest = events[events.length - 1];
      }
      const un = bls.unemployment;
      if (un.length >= 2) {
        const o = un[un.length - 1];
        const c = findCal(/Unemployment Rate/i, o);
        push({ name: 'Unemployment Rate', period: periodLabel(o), expected: c?.forecast || null, actual: `${o.value.toFixed(1)}%`, previous: `${un[un.length - 2].value.toFixed(1)}%`,
          actualN: o.value, prevN: un[un.length - 2].value, forecastN: c ? parseForecast(c.forecast) : null, higherIsBullishGold: true, unit: '%', weight: 8,
          reasonUp: 'อัตราว่างงานเพิ่ม → เศรษฐกิจชะลอ → คาดลดดอกเบี้ย → สนับสนุนทอง',
          reasonDown: 'อัตราว่างงานลด → Fed ไม่รีบลดดอกเบี้ย → กดดันทอง', source: 'U.S. BLS' });
        unemploymentLatest = events[events.length - 1];
      }
      const aheNow = yoy(bls.ahe), ahePrev = yoy(bls.ahe, 1);
      if (aheNow != null && ahePrev != null) {
        const o = bls.ahe[bls.ahe.length - 1];
        push({ name: 'Avg Hourly Earnings (YoY)', period: periodLabel(o), expected: null, actual: `${aheNow.toFixed(1)}%`, previous: `${ahePrev.toFixed(1)}%`,
          actualN: round2(aheNow), prevN: round2(ahePrev), forecastN: null, higherIsBullishGold: false, unit: '%', weight: 5,
          reasonUp: 'ค่าจ้างเร่งตัว → แรงกดดันเงินเฟ้อ → กดดันทอง',
          reasonDown: 'ค่าจ้างชะลอ → แรงกดดันเงินเฟ้อลด → สนับสนุนทอง', source: 'U.S. BLS' });
      }
    }

    // ── Next FOMC ──
    const now = Date.now();
    const next = fomc.map(m => m.decisionUtc).find(t => t > now) ?? null;

    // ── Macro bias: Real Yield เป็นตัวแปรหลักของทอง ──
    const realPart = realChg != null ? clamp(-realChg * 2, -50, 50) : 0;
    const bias = clamp(realPart + fedVal * 0.35 + clamp(dataBias, -25, 25), -100, 100);
    const macroSentiment = bias >= 20 ? 'BULLISH_GOLD' as const : bias <= -20 ? 'BEARISH_GOLD' as const : 'NEUTRAL' as const;

    const parts: string[] = [];
    if (real10 != null) parts.push(`Real Yield 10Y ${real10.toFixed(2)}% (${realChg != null ? `${realChg >= 0 ? '+' : ''}${realChg}bp ใน 20 วัน` : 'ไม่มี trend'})`);
    parts.push(`Fed ${fedBias === 'DOVISH' ? 'มีแนวโน้ม Dovish' : fedBias === 'HAWKISH' ? 'มีแนวโน้ม Hawkish' : 'ทรงตัว'} ตามการประเมินของตลาดพันธบัตร`);
    const summaryTh = `${macroSentiment === 'BULLISH_GOLD' ? 'ปัจจัยมหภาคสนับสนุนทอง' : macroSentiment === 'BEARISH_GOLD' ? 'ปัจจัยมหภาคกดดันทอง' : 'ปัจจัยมหภาคเป็นกลาง'} — ${parts.join(' · ')}`;

    return {
      fedBias,
      fedBiasConfidence: Math.round(clamp(Math.abs(fedVal), 0, 100)),
      rateCutExpectation,
      policySpread2y3m: spread,
      cpiLatest, nfpLatest, coreCpiLatest, unemploymentLatest,
      us10yYield: us10y, us2yYield: us2y, us3mYield: us3m,
      realYield10y: real10, realYieldChange20dBp: realChg, realYieldTrend,
      breakeven10y: us10y != null && real10 != null ? round2(us10y - real10) : null,
      nextFomcDate: next ? new Date(next).toISOString() : null,
      nextFomcCountdown: next ? formatCountdown((next - now) / 60000) : null,
      macroSentiment,
      bias: Math.round(bias),
      score: Math.round(50 + bias / 2),
      summaryTh,
      recentEvents: events,
      yieldsAsOf: latest?.date ?? null,
    };
  }
}
