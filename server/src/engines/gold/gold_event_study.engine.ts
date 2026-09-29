/**
 * 🥇 GoldEventStudyEngine — เรียนรู้ Event Window แยกตามประเภทข่าว จากปฏิกิริยาราคาทองจริง
 *
 * ต่อเหตุการณ์ (CPI / NFP / FOMC / Press Conference / PCE / PPI / ...):
 *  - volExpansion        range แท่งข่าว เทียบ range ปกติของชั่วโมงเดียวกัน
 *  - holdThroughStopRisk โอกาสที่ stop 1 ATR(4H) ถูกกวาดถ้าถือผ่านข่าว
 *  - whipsawRate         ทิศชั่วโมงแรกกลับด้านภายใน 4 ชม. (false breakout)
 *  - hoursToStabilize    ชั่วโมงจนความผันผวนกลับสู่ระดับปกติ
 *  - reactionAccuracy    ทองไปทางที่ surprise (actual − consensus) ชี้หรือไม่
 *  - waitTable           เข้าตามทิศหลังรอ w ชม. → expectancy / stop-out เทียบ baseline วันปกติ
 * → recommended pre/post window = ช่วงรอที่ stop-out กลับมาใกล้ baseline
 *
 * ข้อจำกัด: ข้อมูลฟรีย้อนหลัง 2 ปีมีแค่แท่ง 1H → window ละเอียดสุด 1 ชม.
 * (การเทียบ 5/15/30 นาทีต้องใช้ intraday ย้อนหลังที่เสียเงิน) · ไม่มี bid/ask จึงวัด spread/slippage ไม่ได้
 */

import type { Candle } from '../../types/index.js';
import type { GoldEventStudyRow } from './gold_types.js';
import { type EconEvent, type EconEventType, EVENT_TYPE_TH, HIGH_IMPACT_TYPES } from './gold_calendar.provider.js';
import { aggregateCandles } from './gold_data_hub.js';
import { atrSeries, round2 } from './gold_indicators.js';

const WAITS = [1, 2, 3, 4, 6, 8];
const STOP_ATR = 1.0, TARGET_ATR = 1.5, HORIZON = 24;
const DEFAULT_WINDOWS: Record<string, { pre: number; post: number }> = {
  FOMC: { pre: 120, post: 90 }, FOMC_PRESS: { pre: 60, post: 90 }, DEFAULT: { pre: 60, post: 30 },
};

const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const tr = (c: Candle[], i: number) => i === 0 ? c[i].high - c[i].low : Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));

export class GoldEventStudyEngine {
  static defaultWindow(type: string | null) {
    return DEFAULT_WINDOWS[type ?? ''] ?? DEFAULT_WINDOWS.DEFAULT;
  }

  static run(h1: Candle[], events: EconEvent[]): GoldEventStudyRow[] {
    if (h1.length < 500) return [];
    const h4 = aggregateCandles(h1, 4);
    const atr4 = atrSeries(h4, 14);
    // ATR 4H ของแท่ง 4H ล่าสุดที่ปิดแล้ว ณ เวลา t (binary search)
    const h4Close = h4.map(k => k.time + 4 * 3600);
    const atr4Fast = (t: number) => {
      let lo = 0, hi = h4Close.length - 1, ans = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (h4Close[mid] <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
      for (let i = ans; i >= 0; i--) if (atr4[i] != null) return atr4[i] as number;
      return null;
    };

    // baseline range ต่อชั่วโมง (UTC) — median ของ 20 แท่งล่าสุดในชั่วโมงเดียวกันก่อนหน้า
    const byHour = new Map<number, number[]>();
    const baseline: number[] = new Array(h1.length).fill(NaN);
    for (let i = 1; i < h1.length; i++) {
      const hr = new Date(h1[i].time * 1000).getUTCHours();
      const arr = byHour.get(hr) ?? [];
      baseline[i] = arr.length >= 5 ? median(arr.slice(-20)) : NaN;
      arr.push(tr(h1, i));
      byHour.set(hr, arr);
    }

    const barIndex = (tSec: number) => {
      let lo = 0, hi = h1.length - 1, ans = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (h1[mid].time <= tSec) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
      return ans >= 0 && tSec - h1[ans].time < 3600 ? ans : -1;
    };

    const simulate = (entryIdx: number, dir: number, stop: number) => {
      const entry = h1[entryIdx].close;
      for (let j = entryIdx + 1; j < Math.min(h1.length, entryIdx + 1 + HORIZON); j++) {
        const adverse = dir > 0 ? entry - h1[j].low : h1[j].high - entry;
        const fav = dir > 0 ? h1[j].high - entry : entry - h1[j].low;
        if (adverse >= stop) return { r: -1, stopped: true };
        if (fav >= stop * (TARGET_ATR / STOP_ATR)) return { r: TARGET_ATR / STOP_ATR, stopped: false };
      }
      const last = h1[Math.min(h1.length - 1, entryIdx + HORIZON)];
      return { r: ((last.close - entry) * dir) / stop, stopped: false };
    };

    // ช่วงเวลาที่มีข่าว High impact ±24 ชม. (ไว้ตัดออกจาก baseline)
    const highTimes = events.filter(e => HIGH_IMPACT_TYPES.includes(e.type)).map(e => e.timeUtc / 1000);
    const nearHigh = (t: number) => highTimes.some(x => Math.abs(x - t) < 24 * 3600);

    const types = [...HIGH_IMPACT_TYPES, 'JOBLESS_CLAIMS'] as EconEventType[];
    const rows: GoldEventStudyRow[] = [];

    for (const type of types) {
      const evs = events.filter(e => e.type === type);
      const volX: number[] = [], stopRisk: number[] = [], whip: number[] = [], stab: number[] = [], preRamp: number[] = [];
      let reactOk = 0, reactN = 0;
      const wait = new Map<number, { r: number[]; stops: number }>(WAITS.map(w => [w, { r: [], stops: 0 }]));
      const hoursUsed = new Set<number>();
      const offsetsMin: number[] = [];
      let n = 0;

      for (const e of evs) {
        const tSec = e.timeUtc / 1000;
        const i = barIndex(tSec);
        if (i < 25 || i + HORIZON + 10 >= h1.length) continue;
        // แท่งก่อนหน้าต้องต่อเนื่อง (ไม่ใช่ช่วงตลาดปิด)
        if (h1[i].time - h1[i - 1].time > 3600) continue;
        const atr = atr4Fast(h1[i].time);
        const base = baseline[i];
        if (!atr || !Number.isFinite(base) || base <= 0) continue;
        n++;
        hoursUsed.add(new Date(h1[i].time * 1000).getUTCHours());
        offsetsMin.push((tSec - h1[i].time) / 60);
        const pre = h1[i - 1].close;

        volX.push(tr(h1, i) / base);
        if (Number.isFinite(baseline[i - 1]) && baseline[i - 1] > 0) preRamp.push(tr(h1, i - 1) / baseline[i - 1]);

        const hi = Math.max(h1[i].high, h1[i + 1].high), lo = Math.min(h1[i].low, h1[i + 1].low);
        stopRisk.push(((pre - lo >= atr ? 1 : 0) + (hi - pre >= atr ? 1 : 0)) / 2);

        const first = Math.sign(h1[i].close - pre);
        const after4 = Math.sign(h1[i + 4].close - pre);
        if (first !== 0 && Math.abs(h1[i].close - pre) > base * 0.3) whip.push(after4 !== first ? 1 : 0);

        let k = 1;
        for (; k <= 12; k++) {
          const b1 = baseline[i + k], b2 = baseline[i + k + 1];
          if (Number.isFinite(b1) && Number.isFinite(b2) && tr(h1, i + k) <= b1 * 1.3 && tr(h1, i + k + 1) <= b2 * 1.3) break;
        }
        stab.push(k);

        if (e.goldExpected != null && e.goldExpected !== 0 && after4 !== 0) {
          reactN++;
          if (after4 === e.goldExpected) reactOk++;
        }

        for (const w of WAITS) {
          const idx = i + w - 1;
          const dir = Math.sign(h1[idx].close - pre);
          if (dir === 0) continue;
          const s = simulate(idx, dir, atr * STOP_ATR);
          const cell = wait.get(w)!;
          cell.r.push(s.r);
          if (s.stopped) cell.stops++;
        }
      }
      if (n === 0) continue;

      // Baseline: กติกาเดียวกัน ณ ชั่วโมงเดียวกัน แต่วันที่ไม่มีข่าวใหญ่ ±24 ชม.
      const bR: number[] = []; let bStops = 0;
      for (let i = 2; i < h1.length - HORIZON - 1; i++) {
        if (!hoursUsed.has(new Date(h1[i].time * 1000).getUTCHours())) continue;
        if (h1[i].time - h1[i - 1].time > 3600 || nearHigh(h1[i].time)) continue;
        const atr = atr4Fast(h1[i].time);
        if (!atr) continue;
        const dir = Math.sign(h1[i].close - h1[i - 1].close);
        if (dir === 0) continue;
        const s = simulate(i, dir, atr * STOP_ATR);
        bR.push(s.r);
        if (s.stopped) bStops++;
      }
      const baselineExp = bR.length ? bR.reduce((a, b) => a + b, 0) / bR.length : 0;
      const baselineStop = bR.length ? (bStops / bR.length) * 100 : 0;

      const waitTable = WAITS.map(w => {
        const c = wait.get(w)!;
        return { waitH: w, trades: c.r.length, expectancyR: round2(c.r.length ? c.r.reduce((a, b) => a + b, 0) / c.r.length : 0), stopOutRate: Math.round(c.r.length ? (c.stops / c.r.length) * 100 : 0) };
      });

      const confidence = n >= 20 ? 'HIGH' as const : n >= 10 ? 'MEDIUM' as const : 'LOW' as const;
      const offsetMin = Math.round(median(offsetsMin));
      const def = GoldEventStudyEngine.defaultWindow(type);
      let postMin = def.post, preMin = def.pre, note = '';
      if (confidence !== 'LOW') {
        const ok = waitTable.find(r => r.trades >= 5 && r.stopOutRate <= baselineStop + 5 && r.expectancyR >= baselineExp - 0.1);
        const w = ok?.waitH ?? 8;
        postMin = Math.max(15, w * 60 - offsetMin);
        const ramp = median(preRamp);
        preMin = ramp >= 1.25 ? 120 : 60;
        note = ok
          ? `รอ ~${w} ชม. หลังเริ่มแท่งข่าว stop-out (${ok.stopOutRate}%) กลับใกล้วันปกติ (${Math.round(baselineStop)}%)`
          : `แม้รอ 8 ชม. stop-out ยังสูงกว่าวันปกติ — ควรรอนานหรือลดขนาด`;
        if (median(stopRisk) >= 0.25 || stopRisk.reduce((a, b) => a + b, 0) / stopRisk.length >= 0.3) note += ' · ไม่ควรถือ Position ขนาดเต็มผ่านข่าวนี้';
      } else {
        note = `ตัวอย่างน้อย (${n} เหตุการณ์) — ใช้ค่าเริ่มต้น`;
      }

      rows.push({
        type, nameTh: EVENT_TYPE_TH[type], events: n,
        volExpansion: round2(median(volX)),
        holdThroughStopRisk: Math.round((stopRisk.reduce((a, b) => a + b, 0) / stopRisk.length) * 100),
        whipsawRate: whip.length ? Math.round((whip.reduce((a, b) => a + b, 0) / whip.length) * 100) : 0,
        hoursToStabilize: median(stab),
        reactionAccuracy: reactN >= 5 ? Math.round((reactOk / reactN) * 100) : null,
        reactionSamples: reactN,
        waitTable,
        baselineExpectancyR: round2(baselineExp),
        baselineStopOutRate: Math.round(baselineStop),
        recommendedPreMin: preMin,
        recommendedPostMin: postMin,
        confidence,
        noteTh: note,
      });
    }
    return rows;
  }
}
