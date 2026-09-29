/**
 * 🥇 GoldEventEngine — Event Risk Gate
 * ก่อน CPI/FOMC/NFP ระบบต้องไม่บอก "เข้าเลย" เพียงเพราะกราฟสวย · หลังข่าวรอให้ราคายืนยันทิศทาง
 *
 * Window แยกตามประเภทข่าว — เรียนรู้จาก Event Study (ปฏิกิริยาราคาทองจริงย้อนหลัง 2 ปี)
 * ถ้ายังไม่มีผล study / ตัวอย่างน้อย → ใช้ค่าเริ่มต้นแบบ conservative และระบุว่าเป็น DEFAULT
 * FOMC มาจาก FedCalendarProvider (federalreserve.gov) ไม่ hard-code รายปี
 */

import type { GoldEventRisk, GoldEventRiskResult, GoldEventStudyRow } from './gold_types.js';
import type { CalendarEvent } from './gold_data_hub.js';
import type { FomcMeeting } from './gold_calendar.provider.js';
import { GoldEventStudyEngine } from './gold_event_study.engine.js';
import { formatCountdown } from './gold_indicators.js';

const GOLD_RELEVANT = /CPI|PCE|Non-Farm|Unemployment|Hourly Earnings|FOMC|Federal Funds|Fed Chair|Powell|GDP|Retail Sales|ISM|PMI|Jobless|JOLTS|PPI|Consumer Confidence|Treasury/i;

const TYPE_OF: [RegExp, string][] = [
  [/^ADP/i, 'OTHER'],
  [/CPI/i, 'CPI'],
  [/Non-Farm|Unemployment Rate|Average Hourly Earnings/i, 'NFP'],
  [/FOMC Press Conference/i, 'FOMC_PRESS'],
  [/FOMC Statement|Federal Funds Rate|FOMC Rate Decision/i, 'FOMC'],
  [/PCE/i, 'PCE'],
  [/PPI/i, 'PPI'],
  [/Retail Sales/i, 'RETAIL_SALES'],
  [/GDP/i, 'GDP'],
  [/ISM/i, 'ISM'],
  [/Unemployment Claims|Jobless/i, 'JOBLESS_CLAIMS'],
];

const REASON: [RegExp, string][] = [
  [/CPI|PCE|PPI/i, 'ข้อมูลเงินเฟ้อกระทบคาดการณ์ Fed และ Real Yield โดยตรง'],
  [/Non-Farm|Unemployment|Hourly Earnings|Jobless|JOLTS/i, 'ตัวเลขแรงงานกระทบคาดการณ์ดอกเบี้ยและดอลลาร์'],
  [/FOMC|Federal Funds|Fed Chair|Powell/i, 'การตัดสินใจ/ถ้อยแถลงของ Fed — ความผันผวนสูงสุดของทอง'],
  [/GDP|Retail Sales|ISM|PMI|Consumer Confidence/i, 'ข้อมูลเศรษฐกิจกระทบมุมมองการเติบโตและดอลลาร์'],
];

type Built = GoldEventRisk & { t: number; isFomc: boolean };

export class GoldEventEngine {
  static evaluate(calendar: CalendarEvent[] | null, fomc: FomcMeeting[], learned: GoldEventStudyRow[] | null, now = Date.now()): GoldEventRiskResult {
    const all: Built[] = [];
    const windowFor = (type: string | null, impact: 'HIGH' | 'MEDIUM') => {
      const row = learned?.find(r => r.type === type);
      if (row && row.confidence !== 'LOW') return { pre: row.recommendedPreMin, post: row.recommendedPostMin, src: 'LEARNED' as const };
      if (impact === 'MEDIUM') return { pre: 15, post: 10, src: 'DEFAULT' as const };
      const d = GoldEventStudyEngine.defaultWindow(type);
      return { pre: d.pre, post: d.post, src: 'DEFAULT' as const };
    };
    const build = (name: string, t: number, impact: 'HIGH' | 'MEDIUM', forecast: string | null, previous: string | null, isFomc: boolean): Built => {
      const type = TYPE_OF.find(([re]) => re.test(name))?.[1] ?? null;
      const w = windowFor(type === 'OTHER' ? null : type, impact);
      const minutes = Math.round((t - now) / 60000);
      let recommendation: GoldEventRisk['recommendation'] = 'CLEAR';
      if (minutes > 0 && minutes <= w.pre) recommendation = impact === 'HIGH' ? 'WAIT' : 'CAUTION';
      else if (minutes <= 0 && -minutes <= w.post) recommendation = impact === 'HIGH' ? 'CONFIRMING' : 'CAUTION';
      else if (minutes > 0 && minutes <= 24 * 60 && impact === 'HIGH') recommendation = 'CAUTION';
      const reason = REASON.find(([re]) => re.test(name))?.[1] ?? 'ข่าวเศรษฐกิจสหรัฐที่มีผลต่อดอลลาร์';
      return {
        eventName: name, timeIso: new Date(t).toISOString(), countdown: formatCountdown(minutes), countdownMinutes: minutes,
        impact, forecast, previous, recommendation,
        reasonTh: recommendation === 'WAIT' ? `${reason} — ไม่ควรเปิด Position ใหม่`
          : recommendation === 'CONFIRMING' ? `${reason} — กำลังรอราคายืนยันทิศทางหลังข่าว`
            : recommendation === 'CAUTION' ? `${reason} — ลดขนาด Position / ระวัง Stop ถูกกวาด`
              : reason,
        eventType: type === 'OTHER' ? null : type,
        windowPreMin: w.pre, windowPostMin: w.post, windowSource: w.src,
        t, isFomc,
      };
    };

    for (const e of calendar ?? []) {
      if (e.country !== 'USD' || !GOLD_RELEVANT.test(e.title)) continue;
      if (e.impact !== 'High' && e.impact !== 'Medium') continue;
      const t = Date.parse(e.date);
      if (Number.isNaN(t)) continue;
      all.push(build(e.title, t, e.impact === 'High' ? 'HIGH' : 'MEDIUM', e.forecast || null, e.previous || null, /FOMC|Federal Funds/i.test(e.title)));
    }
    // FOMC จากปฏิทิน Fed — Statement 14:00 ET + Press Conference 14:30 ET
    for (const m of fomc) {
      if (m.decisionUtc < now - 12 * 3600_000 || m.decisionUtc > now + 45 * 86400_000) continue;
      if (!all.some(x => x.isFomc && Math.abs(x.t - m.decisionUtc) < 3 * 3600_000)) {
        all.push(build(`FOMC Statement / Rate Decision${m.hasProjections ? ' + Dot Plot' : ''}`, m.decisionUtc, 'HIGH', null, null, true));
      }
      if (!all.some(x => /Press Conference/i.test(x.eventName) && Math.abs(x.t - m.pressUtc) < 3 * 3600_000)) {
        all.push(build('FOMC Press Conference (Powell)', m.pressUtc, 'HIGH', null, null, true));
      }
    }
    all.sort((a, b) => a.t - b.t);

    const upcoming = all.filter(e => e.countdownMinutes > 0).slice(0, 8);
    const recent = all.filter(e => e.countdownMinutes <= 0 && e.countdownMinutes > -24 * 60).reverse().slice(0, 5);

    const pre = upcoming.find(e => e.recommendation === 'WAIT');
    const post = recent.find(e => e.recommendation === 'CONFIRMING');
    const isBlocked = !!(pre || post);
    const blockPhase = pre ? 'PRE_EVENT' as const : post ? 'POST_EVENT' as const : null;
    const blockReasonTh = pre
      ? `⚠ ${pre.eventName} อีก ${pre.countdown} — ไม่แนะนำเปิด Position ใหม่ (window ${pre.windowPreMin} นาทีก่อนข่าว${pre.windowSource === 'LEARNED' ? ' จากสถิติย้อนหลัง' : ''})`
      : post
        ? `${post.eventName} ประกาศแล้วเมื่อ ${post.countdown} ที่แล้ว — รอราคายืนยันทิศทางอีก ~${Math.max(0, post.windowPostMin + post.countdownMinutes)} นาที${post.windowSource === 'LEARNED' ? ' (จากสถิติ stop-out หลังข่าวประเภทนี้)' : ''}`
        : '';

    const nextHigh = upcoming.find(e => e.impact === 'HIGH') ?? null;
    const overallRisk = isBlocked ? 'HIGH' as const : nextHigh && nextHigh.countdownMinutes < 6 * 60 ? 'MEDIUM' as const : 'LOW' as const;
    const learnedTypes = (learned ?? []).filter(r => r.confidence !== 'LOW');
    const strip = ({ t: _t, isFomc: _f, ...rest }: Built): GoldEventRisk => rest;

    return {
      upcomingEvents: upcoming.map(strip),
      recentEvents: recent.map(strip),
      nextHighImpact: nextHigh ? strip(nextHigh) : null,
      isBlocked, blockPhase, blockReasonTh, overallRisk,
      windowNote: learnedTypes.length
        ? `Window แยกตามประเภทข่าว เรียนรู้จากสถิติ: ${learnedTypes.slice(0, 5).map(r => `${r.type} ${r.recommendedPreMin}/${r.recommendedPostMin} นาที`).join(' · ')}`
        : 'ยังไม่มีผล Event Study — ใช้ window เริ่มต้น (High 60/30 นาที · FOMC 120/90 นาที)',
    };
  }
}
