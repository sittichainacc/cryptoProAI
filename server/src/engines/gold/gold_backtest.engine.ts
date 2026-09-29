/**
 * 🥇 GoldBacktestEngine V2 — Validation ก่อนใช้เป็นสัญญาณจริง
 *
 * - Walk-forward simulation ของ GoldEntryEngine ตัวเดียวกับ live (ไม่มี look-ahead)
 * - Parameter grid 9 configs → walk-forward (expanding / rolling / final holdout), parameter stability
 * - PSR / DSR / PBO (CSCV) / White's Reality Check / bootstrap CI
 * - Calibration: quality score เทียบผลจริง + isotonic fit (เปิดใช้ความน่าจะเป็นเฉพาะเมื่อผ่านเกณฑ์)
 * - Matrix: SETUP × TREND × DIRECTION × SESSION × EVENT STATE พร้อมสถานะ Promote / Conditional / Need data / Reject
 * - Exit policy: Fixed TP/SL vs Partial+BE vs Partial+Trail
 * - Event study: learned event window แยกตามประเภทข่าว
 *
 * ข้อจำกัด: ทดสอบชั้น Technical/Entry — Macro/News/COT ไม่มีข้อมูล point-in-time ย้อนหลังฟรี
 */

import type { Candle } from '../../types/index.js';
import type {
  GoldBacktestResult, GoldBacktestBucket, GoldSetupType, TradeSide, ValidationTag, GoldMatrixCell,
  GoldWalkForwardFold, GoldCalibrationRow, GoldCalibrationSlice, GoldExitPolicyResult, GoldValidationSummary,
} from './gold_types.js';
import { fetchSeries, aggregateCandles } from './gold_data_hub.js';
import { GoldEntryEngine, ENTRY_PARAMS, type EntryParams } from './gold_entry.engine.js';
import { FedCalendarProvider, EconomicHistoryProvider, HIGH_IMPACT_TYPES, type EconEvent } from './gold_calendar.provider.js';
import { GoldEventStudyEngine } from './gold_event_study.engine.js';
import { emaSeries, atrSeries, percentileRank, round2 } from './gold_indicators.js';
import { mean, std, bootstrapCI, psr, dsr, pboCscv, realityCheck, spearman, isotonicFit } from './gold_stats.js';

const COST_PER_SIDE = 0.35;
const FILL_WINDOW_H = 24;
const MAX_HOLD_H = 240;
const FOLDS = 8;

const GRID: { id: string; params: EntryParams }[] = [];
// พารามิเตอร์ที่มีผลจริงต่อ trade set (minRR แทบไม่ bind เพราะ TP2 ≥ 2R อยู่แล้ว)
const cfgId = (p: EntryParams) => `Zone ±${p.zoneHalfAtr} ATR · MaxRisk ${p.maxRiskAtr} ATR`;
for (const zoneHalfAtr of [0.15, 0.25, 0.35]) for (const maxRiskAtr of [2.0, 2.5, 3.0]) {
  const params = { ...ENTRY_PARAMS, zoneHalfAtr, maxRiskAtr };
  GRID.push({ id: cfgId(params), params });
}
const DEFAULT_ID = cfgId(ENTRY_PARAMS);

type Policy = 'FIXED' | 'PARTIAL_BE' | 'PARTIAL_TRAIL';
const POLICIES: Policy[] = ['FIXED', 'PARTIAL_BE', 'PARTIAL_TRAIL'];
const POLICY_TH: Record<Policy, string> = {
  FIXED: 'Fixed TP2 / SL (ง่ายสุด)',
  PARTIAL_BE: 'ปิด 50% ที่ TP1 + เลื่อน Stop มาทุน (ระบบปัจจุบัน)',
  PARTIAL_TRAIL: 'ปิด 50% ที่ TP1 + Trailing 1.5 ATR ไป TP3',
};

export interface BtTrade {
  cfg: string; setup: GoldSetupType; side: TradeSide; quality: number;
  entryTime: number; exitTime: number;
  trend: 'Bull' | 'Bear' | 'Sideways'; vol: 'Low' | 'Normal' | 'High';
  session: 'Asia' | 'London' | 'NewYork' | 'Late'; eventState: 'Post-event' | 'Pre-event' | 'Clear';
  r: number; tp1First: boolean; tp2Hit: boolean; mfeR: number; maeR: number;
  policy: Record<Policy, { r: number; mfe: number }>;
}

let cache: { at: number; value: GoldBacktestResult } | null = null;
let running: Promise<GoldBacktestResult> | null = null;

export function statusOf(n: number, exp: number, ciLow: number | null, minN = 30): ValidationTag {
  if (n < minN) return 'NEED_MORE_DATA';
  if (exp <= 0) return 'REJECT';
  if (ciLow != null && ciLow > 0 && exp >= 0.1) return 'PROMOTE';
  return 'CONDITIONAL';
}

export class GoldBacktestEngine {
  static async run(): Promise<GoldBacktestResult> {
    if (cache && Date.now() - cache.at < 12 * 3600_000) return cache.value;
    if (running) return running;
    running = GoldBacktestEngine.compute().then(v => { cache = { at: Date.now(), value: v }; return v; }).finally(() => { running = null; });
    return running;
  }

  /** คืนผลที่ cache ไว้ทันที (ไม่รอ) และสั่งคำนวณใหม่เบื้องหลังถ้าหมดอายุ */
  static peek(): GoldBacktestResult | null {
    if (!cache || Date.now() - cache.at >= 12 * 3600_000) GoldBacktestEngine.run().catch(err => console.warn('[GoldBacktest]', err.message));
    return cache?.value ?? null;
  }

  private static async compute(): Promise<GoldBacktestResult> {
    const t0 = Date.now();
    const series = await fetchSeries('GC=F', '1h', '730d', 'COMEX Gold 1H (Backtest 2Y)');
    if (!series || series.candles.length < 2000) throw new Error('ข้อมูลย้อนหลังไม่พอสำหรับ Backtest');
    const h1 = series.candles;
    const h4 = aggregateCandles(h1, 4);
    const d1 = aggregateCandles(h1, 24);

    let events: EconEvent[] = [];
    try {
      const fed = await FedCalendarProvider.get();
      events = await EconomicHistoryProvider.get(fed.meetings);
    } catch (err: any) {
      console.warn('[GoldBacktest] event history unavailable:', err.message);
    }
    const highTimes = events.filter(e => HIGH_IMPACT_TYPES.includes(e.type)).map(e => e.timeUtc / 1000).sort((a, b) => a - b);

    // ── Precompute regime lookups ──
    const closes4 = h4.map(k => k.close);
    const e20 = emaSeries(closes4, 20), e50 = emaSeries(closes4, 50), e200 = emaSeries(closes4, 200);
    const atr4 = atrSeries(h4, 14);
    const atrPct = atr4.map((a, i) => a == null ? NaN : a / h4[i].close);
    const volPct = atrPct.map((_, i) => i < 50 ? 50 : percentileRank(atrPct.slice(Math.max(0, i - 299), i + 1), 300));
    const dCl = d1.map(k => k.close);
    const d20 = emaSeries(dCl, 20), d50 = emaSeries(dCl, 50);
    const dailyTrend = (t: number): BtTrade['trend'] => {
      let j = -1;
      for (let lo = 0, hi = d1.length - 1; lo <= hi;) { const m = (lo + hi) >> 1; if (d1[m].time + 86400 <= t) { j = m; lo = m + 1; } else hi = m - 1; }
      const a = j >= 0 ? d20[j] : null, b = j >= 0 ? d50[j] : null;
      if (a == null || b == null) return 'Sideways';
      return d1[j].close > a && a > b ? 'Bull' : d1[j].close < a && a < b ? 'Bear' : 'Sideways';
    };
    const sessionOf = (t: number): BtTrade['session'] => {
      const h = new Date(t * 1000).getUTCHours();
      return h >= 23 || h < 7 ? 'Asia' : h < 12 ? 'London' : h < 20 ? 'NewYork' : 'Late';
    };
    const eventStateOf = (t: number): BtTrade['eventState'] => {
      const prev = [...highTimes].reverse().find(x => x <= t);
      const next = highTimes.find(x => x > t);
      if (prev != null && t - prev < 4 * 3600) return 'Post-event';
      if (next != null && next - t < 24 * 3600) return 'Pre-event';
      if (prev != null && t - prev < 12 * 3600) return 'Post-event';
      return 'Clear';
    };

    // ── Run every config ──
    const byCfg = new Map<string, BtTrade[]>();
    for (const g of GRID) {
      byCfg.set(g.id, GoldBacktestEngine.simulateConfig(g, h1, h4, e20, e50, e200, atr4, volPct, dailyTrend, sessionOf, eventStateOf));
    }
    const trades = byCfg.get(DEFAULT_ID)!;
    if (trades.length < 30) throw new Error(`Backtest ได้เพียง ${trades.length} เทรด — ไม่พอสำหรับ validation`);

    const tStart = h4[250].time, tEnd = h4[h4.length - 1].time;
    const foldOf = (t: number) => Math.min(FOLDS - 1, Math.floor(((t - tStart) / (tEnd - tStart)) * FOLDS));
    const foldLabel = (a: number, b: number) => {
      const f = (x: number) => new Date((tStart + (x / FOLDS) * (tEnd - tStart)) * 1000).toISOString().slice(0, 7);
      return `${f(a)} → ${f(b + 1)}`;
    };

    // ── Walk-forward ──
    const pick = (folds: number[]) => {
      let best = DEFAULT_ID, bestExp = -Infinity;
      for (const [id, ts] of byCfg) {
        const tr = ts.filter(x => folds.includes(foldOf(x.entryTime)));
        if (tr.length < 15) continue;
        const e = mean(tr.map(x => x.r));
        if (e > bestExp) { bestExp = e; best = id; }
      }
      return { id: best, exp: bestExp === -Infinity ? 0 : bestExp };
    };
    const runWf = (trainOf: (k: number) => number[], from: number, to: number) => {
      const folds: GoldWalkForwardFold[] = []; const oos: BtTrade[] = [];
      for (let k = from; k <= to; k++) {
        const train = trainOf(k);
        const p = pick(train);
        const test = byCfg.get(p.id)!.filter(x => foldOf(x.entryTime) === k);
        oos.push(...test);
        folds.push({ fold: k + 1, trainPeriod: foldLabel(Math.min(...train), Math.max(...train)), testPeriod: foldLabel(k, k), chosenConfig: p.id, trainExpectancyR: round2(p.exp), testTrades: test.length, testExpectancyR: round2(mean(test.map(x => x.r))) });
      }
      return { folds, oos };
    };
    const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const expanding = runWf(k => range(0, k - 1), 1, FOLDS - 2);
    const rolling = runWf(k => range(Math.max(0, k - 2), k - 1), 2, FOLDS - 2);
    const hold = runWf(() => range(0, FOLDS - 2), FOLDS - 1, FOLDS - 1);
    const modal = (() => { const c = new Map<string, number>(); for (const f of expanding.folds) c.set(f.chosenConfig, (c.get(f.chosenConfig) ?? 0) + 1); return Math.max(...c.values()) / expanding.folds.length; })();

    // ── Buckets ──
    const bucket = (label: string, ts: BtTrade[], minN = 30, iters = 1000): GoldBacktestBucket => {
      const n = ts.length;
      if (!n) return { label, trades: 0, winRateTp1: 0, winRateTp2: 0, expectancyR: 0, ciLowR: null, ciHighR: null, profitFactor: null, avgMfeR: 0, avgMaeR: 0, maxDrawdownR: 0, status: 'NEED_MORE_DATA' };
      const rs = ts.map(x => x.r);
      const ci = bootstrapCI(rs, iters);
      const pos = rs.filter(r => r > 0).reduce((a, b) => a + b, 0), neg = -rs.filter(r => r < 0).reduce((a, b) => a + b, 0);
      const exp = mean(rs);
      return {
        label, trades: n,
        winRateTp1: Math.round((ts.filter(x => x.tp1First).length / n) * 1000) / 10,
        winRateTp2: Math.round((ts.filter(x => x.tp2Hit).length / n) * 1000) / 10,
        expectancyR: round2(exp), ciLowR: ci ? round2(ci[0]) : null, ciHighR: ci ? round2(ci[1]) : null,
        profitFactor: neg > 0 ? round2(pos / neg) : null,
        avgMfeR: round2(mean(ts.map(x => x.mfeR))), avgMaeR: round2(mean(ts.map(x => x.maeR))),
        maxDrawdownR: round2(maxDD(ts, x => x.r)),
        status: statusOf(n, exp, ci ? ci[0] : null, minN),
      };
    };
    const groupBy = (ts: BtTrade[], key: (t: BtTrade) => string, minN = 30) => {
      const m = new Map<string, BtTrade[]>();
      for (const t of ts) { const k = key(t); m.set(k, [...(m.get(k) ?? []), t]); }
      return [...m.entries()].map(([k, v]) => bucket(k, v, minN)).sort((a, b) => b.trades - a.trades);
    };

    const overall = bucket('ทั้งหมด', trades, 30, 2000);
    const bySetup = groupBy(trades, t => t.setup).map(b => {
      // Promote ต้องผ่าน out-of-sample ด้วย
      const oos = expanding.oos.filter(x => x.setup === b.label);
      if (b.status === 'PROMOTE' && oos.length >= 10 && mean(oos.map(x => x.r)) <= 0) return { ...b, status: 'CONDITIONAL' as ValidationTag };
      return b;
    });
    const sixMonthsAgo = tEnd - 182 * 86400;
    const mid = (tStart + tEnd) / 2;
    const byDimension = [
      { dimension: 'ทิศทาง (Direction)', buckets: groupBy(trades, t => t.side) },
      { dimension: 'แนวโน้มรายวัน (Regime)', buckets: groupBy(trades, t => t.trend) },
      { dimension: 'ความผันผวน (Volatility)', buckets: groupBy(trades, t => t.vol) },
      { dimension: 'Session', buckets: groupBy(trades, t => t.session) },
      { dimension: 'สถานะข่าว (Event State)', buckets: groupBy(trades, t => t.eventState) },
      { dimension: 'ช่วงเวลา', buckets: [bucket('ครึ่งแรก', trades.filter(t => t.entryTime < mid)), bucket('ครึ่งหลัง', trades.filter(t => t.entryTime >= mid)), bucket('6 เดือนล่าสุด', trades.filter(t => t.entryTime >= sixMonthsAgo))] },
    ];

    const cell = (ts: BtTrade[], k: Partial<GoldMatrixCell>, minN: number): GoldMatrixCell => {
      const rs = ts.map(x => x.r);
      return {
        setup: k.setup ?? '*', trend: k.trend ?? '*', side: k.side ?? '*', session: k.session ?? '*', eventState: k.eventState ?? '*', vol: k.vol ?? '*',
        trades: ts.length, expectancyR: round2(mean(rs)), winRateTp1: Math.round((ts.filter(x => x.tp1First).length / Math.max(1, ts.length)) * 1000) / 10,
        status: statusOf(ts.length, mean(rs), bootstrapCI(rs, 500)?.[0] ?? null, minN),
      };
    };
    const groupCells = (keys: (keyof GoldMatrixCell)[], minN: number, minShow: number) => {
      const m = new Map<string, BtTrade[]>();
      for (const t of trades) {
        const id = keys.map(k => String((t as any)[k])).join('|');
        m.set(id, [...(m.get(id) ?? []), t]);
      }
      return [...m.entries()].filter(([, v]) => v.length >= minShow).map(([id, v]) => {
        const vals = id.split('|');
        return cell(v, Object.fromEntries(keys.map((k, i) => [k, vals[i]])) as Partial<GoldMatrixCell>, minN);
      }).sort((a, b) => b.trades - a.trades);
    };
    const setupByTrend = [...groupCells(['setup', 'trend'], 20, 1), ...groupCells(['setup', 'side'], 20, 1)];
    const matrix = groupCells(['setup', 'trend', 'side', 'session', 'eventState'], 10, 6).slice(0, 40);

    // ── Stats ── (ตัด config ที่ได้ trade set เหมือนกันออก ไม่ให้นับการทดลองซ้ำ)
    const rs = trades.map(x => x.r);
    const seen = new Set<string>();
    const distinct = [...byCfg.values()].filter(ts => {
      const sig = ts.map(x => `${x.entryTime}:${x.r.toFixed(3)}`).join('|');
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
    const sharpes = distinct.map(ts => { const r = ts.map(x => x.r); return std(r) ? mean(r) / std(r) : 0; });
    const blockPerf = distinct.map(ts => Array.from({ length: FOLDS }, (_, b) => mean(ts.filter(x => foldOf(x.entryTime) === b).map(x => x.r))));
    const days = Math.ceil((tEnd - tStart) / 86400) + 1;
    const daily = distinct.map(ts => {
      const arr = new Array(days).fill(0);
      for (const x of ts) { const d = Math.floor((x.exitTime - tStart) / 86400); if (d >= 0 && d < days) arr[d] += x.r; }
      return arr;
    });
    const stats = {
      psr: round2(psr(rs)), dsr: round2(dsr(rs, sharpes)), pbo: round2(pboCscv(blockPerf)),
      realityCheckP: round2(realityCheck(daily)), configsTested: distinct.length, sharpePerTrade: round2(std(rs) ? mean(rs) / std(rs) : 0),
    };

    // ── Calibration ──
    const q = trades.map(t => t.quality);
    const fitTp1 = isotonicFit(q, trades.map(t => (t.tp1First ? 1 : 0)));
    const fitTp2 = isotonicFit(q, trades.map(t => (t.tp2Hit ? 1 : 0)));
    const fitR = isotonicFit(q, rs);
    const bands: [number, number, string][] = [[0, 60, '< 60'], [60, 70, '60–69'], [70, 80, '70–79'], [80, 90, '80–89'], [90, 101, '90–100']];
    const monotonicCheck = (ts: BtTrade[], minN: number) => {
      const rows = bands.map(([lo, hi]) => ts.filter(t => t.quality >= lo && t.quality < hi)).filter(g => g.length >= minN);
      for (let i = 1; i < rows.length; i++) {
        const w0 = rows[i - 1].filter(t => t.tp1First).length / rows[i - 1].length, w1 = rows[i].filter(t => t.tp1First).length / rows[i].length;
        const r0 = mean(rows[i - 1].map(t => t.r)), r1 = mean(rows[i].map(t => t.r));
        if (w1 < w0 - 0.03 || r1 < r0 - 0.05) return false;
      }
      return rows.length >= 2;
    };
    const spear = spearman(q, rs);
    const monotonic = monotonicCheck(trades, 15);
    const calibrated = monotonic && (spear ?? 0) >= 0.1 && trades.length >= 150;
    const calRows: GoldCalibrationRow[] = bands.map(([lo, hi, label]) => {
      const g = trades.filter(t => t.quality >= lo && t.quality < hi);
      const midQ = Math.min(99, (lo + hi) / 2);
      return {
        bucket: label, trades: g.length,
        winRateTp1: g.length ? Math.round((g.filter(t => t.tp1First).length / g.length) * 1000) / 10 : 0,
        winRateTp2: g.length ? Math.round((g.filter(t => t.tp2Hit).length / g.length) * 1000) / 10 : 0,
        expectancyR: round2(mean(g.map(t => t.r))),
        calibratedPTp1: calibrated ? Math.round(fitTp1(midQ) * 1000) / 10 : null,
        calibratedPTp2: calibrated ? Math.round(fitTp2(midQ) * 1000) / 10 : null,
        calibratedExpR: calibrated ? round2(fitR(midQ)) : null,
      };
    });
    const sliceDefs: [string, (t: BtTrade) => boolean][] = [
      ['LONG', t => t.side === 'LONG'], ['SHORT', t => t.side === 'SHORT'],
      ['Bull', t => t.trend === 'Bull'], ['Bear', t => t.trend === 'Bear'], ['Sideways', t => t.trend === 'Sideways'],
      ['High Vol', t => t.vol === 'High'], ['Normal/Low Vol', t => t.vol !== 'High'],
      ...[...new Set(trades.map(t => t.setup))].map(s => [s, (t: BtTrade) => t.setup === s] as [string, (t: BtTrade) => boolean]),
    ];
    const slices: GoldCalibrationSlice[] = sliceDefs.map(([name, f]) => {
      const g = trades.filter(f);
      const sp = spearman(g.map(t => t.quality), g.map(t => t.r));
      return { slice: name, trades: g.length, spearmanQualityVsR: sp != null ? round2(sp) : null, monotonic: monotonicCheck(g, 10) };
    });

    // ── Exit policies ──
    const exitPolicies: GoldExitPolicyResult[] = POLICIES.map(pol => {
      const r = trades.map(t => t.policy[pol].r);
      const wins = r.filter(x => x > 0), losses = r.filter(x => x <= 0);
      const mfe = trades.map(t => t.policy[pol].mfe);
      return {
        policy: pol, labelTh: POLICY_TH[pol], trades: r.length, expectancyR: round2(mean(r)),
        winRate: Math.round((wins.length / r.length) * 1000) / 10,
        avgWinR: round2(mean(wins)), avgLossR: round2(mean(losses)),
        mfeCapture: round2(mean(mfe) > 0 ? mean(r) / mean(mfe) : 0),
        givebackR: round2(mean(mfe.map((m, i) => m - r[i]))),
        maxDrawdownR: round2(maxDD(trades, x => x.policy[pol].r)),
      };
    });

    // ── Event study ──
    const eventRows = events.length ? GoldEventStudyEngine.run(h1, events) : [];

    // ── Validation verdict ──
    const wfOos = expanding.oos.length ? mean(expanding.oos.map(x => x.r)) : null;
    const wfCi = bootstrapCI(expanding.oos.map(x => x.r), 2000);
    const holdR = hold.oos.length ? mean(hold.oos.map(x => x.r)) : null;
    const foldExps = expanding.folds.filter(f => f.testTrades >= 5).map(f => f.testExpectancyR);
    const pctPos = foldExps.length ? foldExps.filter(v => v > 0).length / foldExps.length : 0;
    const h1Exp = mean(trades.filter(t => t.entryTime < mid).map(t => t.r)), h2Exp = mean(trades.filter(t => t.entryTime >= mid).map(t => t.r));
    const stability: GoldValidationSummary['stability'] = pctPos >= 0.75 && Math.abs(h1Exp - h2Exp) < 0.2 ? 'HIGH' : pctPos >= 0.6 ? 'MEDIUM' : pctPos >= 0.45 ? 'MEDIUM_LOW' : 'LOW';
    const recent = trades.filter(t => t.entryTime >= sixMonthsAgo);

    const reasons: string[] = [];
    const chk = (ok: boolean, msg: string) => { if (!ok) reasons.push(msg); return ok; };
    const passes = [
      chk(trades.length >= 150, `จำนวนเทรด ${trades.length} < 150`),
      chk(wfOos != null && wfOos > 0 && !!wfCi && wfCi[0] > 0, `Walk-forward OOS ${wfOos != null ? round2(wfOos) : '—'}R — ช่วงความเชื่อมั่นยังคร่อม 0`),
      chk(holdR != null && holdR > 0, `Final holdout ${holdR != null ? round2(holdR) : '—'}R ไม่เป็นบวก`),
      chk(stats.pbo < 0.3, `PBO ${stats.pbo} ≥ 0.30 (เสี่ยง overfit)`),
      chk(stats.dsr >= 0.95, `DSR ${stats.dsr} < 0.95 (edge ไม่แน่นหนาหลังหักผลการลองหลาย config)`),
      chk(stats.realityCheckP < 0.1, `Reality Check p=${stats.realityCheckP} ≥ 0.10`),
      chk(calibrated, 'Quality score ยังไม่ calibrated (คะแนนสูงไม่ได้ชนะบ่อยกว่า)'),
      chk(stability === 'HIGH' || stability === 'MEDIUM', `ความเสถียร ${stability} (fold ที่เป็นบวก ${Math.round(pctPos * 100)}%)`),
    ];
    const rejected = (wfOos != null && wfOos <= 0 && (holdR ?? 0) <= 0) || (overall.expectancyR <= 0);
    const status: GoldValidationSummary['status'] = passes.every(Boolean) ? 'PRODUCTION' : rejected ? 'REJECTED' : 'RESEARCH_CONDITIONAL';

    console.log(`[GoldBacktest] V2 done in ${Date.now() - t0}ms — ${trades.length} trades, status ${status}`);

    return {
      generatedAt: new Date().toISOString(),
      period: { from: new Date(tStart * 1000).toISOString().slice(0, 10), to: new Date(tEnd * 1000).toISOString().slice(0, 10) },
      timeframe: '4H setup · 1H execution (COMEX GC)',
      costPerSideUsd: COST_PER_SIDE,
      validation: {
        status,
        statusTh: status === 'PRODUCTION' ? '🟢 PRODUCTION — ผ่านเกณฑ์ validation' : status === 'REJECTED' ? '🔴 REJECTED — ไม่พบ edge' : '🟡 RESEARCH / CONDITIONAL',
        historicalExpectancyR: overall.expectancyR,
        recentExpectancyR: round2(mean(recent.map(t => t.r))),
        walkForwardOosR: wfOos != null ? round2(wfOos) : null,
        holdoutR: holdR != null ? round2(holdR) : null,
        stability, sampleSize: trades.length, calibrated, reasonsTh: reasons,
      },
      overall, bySetup, byDimension, setupByTrend, matrix,
      walkForward: { expanding: expanding.folds, rolling: rolling.folds, holdout: hold.folds[0] ?? null, configStability: round2(modal) },
      parameterGrid: [...byCfg.entries()].map(([id, ts]) => ({ config: id, trades: ts.length, expectancyR: round2(mean(ts.map(x => x.r))), isDefault: id === DEFAULT_ID })),
      stats,
      calibration: { rows: calRows, spearman: spear != null ? round2(spear) : null, monotonic, calibrated, slices },
      exitPolicies,
      eventStudy: events.length ? { rows: eventRows, eventsLoaded: events.length, granularityNote: 'ใช้แท่ง 1H ย้อนหลัง 2 ปี → window ละเอียดสุด 1 ชม. · ไม่มี bid/ask จึงไม่วัด spread/slippage' } : null,
      methodNoteTh: [
        'ใช้ Entry Engine ตัวเดียวกับระบบจริง · ณ แต่ละแท่ง 4H ใช้ข้อมูลถึงแท่งนั้นเท่านั้น (ไม่มี look-ahead)',
        'ทิศทางใน backtest ใช้ EMA20/50/200 บน 4H แทน Decision Engine เต็มรูปแบบ เพราะ Macro/News/COT ไม่มีข้อมูล point-in-time ย้อนหลัง',
        `หักต้นทุน $${COST_PER_SIDE}/oz ต่อขา · SL และ TP ในแท่งเดียวกันนับว่าโดน SL ก่อน`,
        `Walk-forward: แบ่ง ${FOLDS} ช่วงเวลา · Expanding = train ทุกช่วงก่อนหน้า · Rolling = train 2 ช่วงล่าสุด · ช่วงสุดท้ายเป็น final holdout ที่ไม่ใช้เลือก config`,
        `PSR/DSR คิดจาก R ต่อเทรด · DSR หักผลของการลอง ${stats.configsTested} configs ที่ให้ผลต่างกัน (จาก grid ${GRID.length}) · PBO ใช้ CSCV ${FOLDS} blocks · Reality Check ใช้ stationary bootstrap บนผลรายวัน`,
        'Quality score ไม่ใช่ความน่าจะเป็น — ระบบเปิดใช้ "Calibrated probability" เฉพาะเมื่อคะแนนสูงชนะบ่อยกว่าอย่างสม่ำเสมอ',
        'ผลในอดีตไม่รับประกันอนาคต',
      ],
    };
  }

  private static simulateConfig(
    g: { id: string; params: EntryParams }, h1: Candle[], h4: Candle[],
    e20: (number | null)[], e50: (number | null)[], e200: (number | null)[], atr4: (number | null)[], volPct: number[],
    dailyTrend: (t: number) => BtTrade['trend'], sessionOf: (t: number) => BtTrade['session'], eventStateOf: (t: number) => BtTrade['eventState'],
  ): BtTrade[] {
    const out: BtTrade[] = [];
    let h1Ptr = 0, busyUntil = 0;
    for (let i = 250; i < h4.length - 1; i++) {
      const barEnd = h4[i].time + 4 * 3600;
      if (barEnd <= busyUntil) continue;
      const a = e20[i], b = e50[i], c = e200[i];
      if (a == null || b == null || c == null) continue;
      const side: TradeSide | null = a > b && b > c ? 'LONG' : a < b && b < c ? 'SHORT' : null;
      if (!side) continue;
      while (h1Ptr < h1.length && h1[h1Ptr].time < barEnd) h1Ptr++;
      const cands = GoldEntryEngine.detect({ h1: h1.slice(Math.max(0, h1Ptr - 400), h1Ptr), h4: h4.slice(Math.max(0, i - 299), i + 1), side, flowBias: 0 }, g.params);
      const best = cands.find(x => x.ready && !x.extended && x.zone && x.type !== 'MACRO_CONFIRMATION_ENTRY');
      if (!best?.zone) continue;
      const sim = GoldBacktestEngine.simulate(h1, h1Ptr, best.zone, side, best.inZone, atr4[i] ?? 0);
      if (!sim) continue;
      out.push({
        cfg: g.id, setup: best.type, side, quality: best.quality,
        entryTime: sim.entryTime, exitTime: sim.exitTime,
        trend: dailyTrend(barEnd), vol: volPct[i] > 75 ? 'High' : volPct[i] < 25 ? 'Low' : 'Normal',
        session: sessionOf(sim.entryTime), eventState: eventStateOf(sim.entryTime),
        r: sim.policy.PARTIAL_BE.r, tp1First: sim.tp1First, tp2Hit: sim.tp2Hit, mfeR: sim.mfeR, maeR: sim.maeR,
        policy: sim.policy,
      });
      busyUntil = sim.exitTime;
    }
    return out;
  }

  private static simulate(h1: Candle[], start: number, z: { bestEntry: number; stopLoss: number; tp1: number; tp2: number; tp3: number }, side: TradeSide, inZone: boolean, atr: number) {
    const d = side === 'LONG' ? 1 : -1;
    let fillIdx = -1, fill = 0;
    if (inZone && start < h1.length) { fillIdx = start; fill = h1[start].open; }
    else {
      for (let j = start; j < Math.min(h1.length, start + FILL_WINDOW_H); j++) {
        const k = h1[j];
        if ((side === 'LONG' && k.low <= z.stopLoss) || (side === 'SHORT' && k.high >= z.stopLoss)) return null;
        if ((side === 'LONG' && k.low <= z.bestEntry) || (side === 'SHORT' && k.high >= z.bestEntry)) {
          fillIdx = j; fill = side === 'LONG' ? Math.min(k.open, z.bestEntry) : Math.max(k.open, z.bestEntry);
          break;
        }
      }
    }
    if (fillIdx < 0) return null;
    const risk = Math.abs(fill - z.stopLoss);
    if (risk <= 0) return null;
    const costR = (2 * COST_PER_SIDE) / risk;
    const end = Math.min(h1.length, fillIdx + MAX_HOLD_H);
    const fav = (k: Candle) => (side === 'LONG' ? k.high - fill : fill - k.low) / risk;
    const adv = (k: Candle) => (side === 'LONG' ? fill - k.low : k.high - fill) / risk;
    const hit = (k: Candle, lvl: number, favourable: boolean) => favourable
      ? (side === 'LONG' ? k.high >= lvl : k.low <= lvl)
      : (side === 'LONG' ? k.low <= lvl : k.high >= lvl);
    const R = (px: number) => ((px - fill) * d) / risk;

    const run = (pol: Policy) => {
      let stop = z.stopLoss, half = false, r = 0, mfe = 0, mae = 0, exitTime = h1[fillIdx].time, tp1First = false, tp2Hit = false;
      let peak = fill;
      for (let j = fillIdx; j < end; j++) {
        const k = h1[j];
        mfe = Math.max(mfe, fav(k)); mae = Math.max(mae, adv(k)); exitTime = k.time;
        if (hit(k, stop, false)) { r += (half ? 0.5 : 1) * R(stop); return { r: r - costR, mfe, mae, exitTime, tp1First, tp2Hit }; }
        if (pol === 'FIXED') {
          if (hit(k, z.tp1, true)) tp1First = true;
          if (hit(k, z.tp2, true)) { tp2Hit = true; return { r: R(z.tp2) - costR, mfe, mae, exitTime, tp1First, tp2Hit }; }
          continue;
        }
        if (!half && hit(k, z.tp1, true)) { half = true; tp1First = true; r += 0.5 * R(z.tp1); stop = fill; }
        if (pol === 'PARTIAL_BE') {
          if (half && hit(k, z.tp2, true)) { tp2Hit = true; r += 0.5 * R(z.tp2); return { r: r - costR, mfe, mae, exitTime, tp1First, tp2Hit }; }
        } else if (half) {
          if (hit(k, z.tp2, true)) tp2Hit = true;
          if (hit(k, z.tp3, true)) { r += 0.5 * R(z.tp3); return { r: r - costR, mfe, mae, exitTime, tp1First, tp2Hit }; }
          peak = side === 'LONG' ? Math.max(peak, k.close) : Math.min(peak, k.close);
          const trail = peak - d * atr * 1.5;
          stop = side === 'LONG' ? Math.max(stop, trail) : Math.min(stop, trail);
        }
      }
      const lastK = h1[end - 1];
      r += (half ? 0.5 : 1) * R(lastK.close);
      return { r: r - costR, mfe, mae, exitTime: lastK.time, tp1First, tp2Hit };
    };

    const res = { FIXED: run('FIXED'), PARTIAL_BE: run('PARTIAL_BE'), PARTIAL_TRAIL: run('PARTIAL_TRAIL') };
    const p = res.PARTIAL_BE;
    return {
      entryTime: h1[fillIdx].time, exitTime: p.exitTime, tp1First: p.tp1First, tp2Hit: p.tp2Hit || res.FIXED.tp2Hit,
      mfeR: p.mfe, maeR: p.mae,
      policy: {
        FIXED: { r: res.FIXED.r, mfe: res.FIXED.mfe },
        PARTIAL_BE: { r: p.r, mfe: p.mfe },
        PARTIAL_TRAIL: { r: res.PARTIAL_TRAIL.r, mfe: res.PARTIAL_TRAIL.mfe },
      },
    };
  }
}

function maxDD<T extends { entryTime: number }>(ts: T[], r: (t: T) => number): number {
  let eq = 0, peak = 0, dd = 0;
  for (const x of [...ts].sort((a, b) => a.entryTime - b.entryTime)) { eq += r(x); peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq); }
  return dd;
}
