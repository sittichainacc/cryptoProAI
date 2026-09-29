/**
 * 🥇 Gold Calendar Providers
 *
 * 1) FedCalendarProvider — parse ปฏิทิน FOMC จาก federalreserve.gov (ทุกปีที่เว็บเผยแพร่)
 *    → cache (memory + disk) → manual fallback · มีสถานะ health ให้ Admin เห็น ถ้า parse พังต้องไม่เงียบ
 *
 * 2) EconomicHistoryProvider — ประวัติข่าวเศรษฐกิจสหรัฐย้อนหลัง ~2 ปี (actual / consensus / previous)
 *    จาก Nasdaq economic calendar API → ใช้ทำ Event Study และระบุ event state ใน Backtest
 *    - API คืนข่าวของ "วันก่อนหน้า" วันที่ query (ตรวจสอบอัตโนมัติด้วยวัน FOMC จากปฏิทิน Fed)
 *    - เวลาในฟิลด์ "gmt" เป็นเวลา ET จริง (CPI 08:30, FOMC 14:00)
 *    - วันที่เก่ากว่า 7 วันถือว่าข้อมูลนิ่งแล้ว เก็บ disk ไม่ดึงซ้ำ
 */

import { readStore, writeStore, etToUtcMs } from './gold_store.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

// ═══════════════════════════════════════════════════════════
// Fed FOMC calendar
// ═══════════════════════════════════════════════════════════
export interface FomcMeeting {
  decisionUtc: number;   // วันที่ 2 ของการประชุม 14:00 ET
  pressUtc: number;      // Press conference 14:30 ET
  hasProjections: boolean; // * = มี SEP / Dot plot
  label: string;         // เช่น "September 15-16*"
}

export interface CalendarHealth {
  source: string;
  status: 'HEALTHY' | 'STALE' | 'FALLBACK' | 'FAILED';
  lastSync: string | null;
  coverageThrough: string | null;
  message: string;
}

/** Fallback เมื่อเว็บ Fed ใช้งานไม่ได้ (อัปเดตล่าสุดจากปฏิทินที่ Fed เผยแพร่ 2026–2027) */
const MANUAL_FOMC: [number, number, number, boolean][] = [
  [2026, 1, 28, false], [2026, 3, 18, true], [2026, 4, 29, false], [2026, 6, 17, true],
  [2026, 7, 29, false], [2026, 9, 16, true], [2026, 10, 28, false], [2026, 12, 9, true],
  [2027, 1, 27, false], [2027, 3, 17, true], [2027, 4, 28, false], [2027, 6, 9, true],
  [2027, 7, 28, false], [2027, 9, 15, true], [2027, 10, 27, false], [2027, 12, 8, true],
];

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const meeting = (y: number, m: number, d: number, proj: boolean, label: string): FomcMeeting => ({
  decisionUtc: etToUtcMs(y, m, d, 14, 0), pressUtc: etToUtcMs(y, m, d, 14, 30), hasProjections: proj, label,
});

export function parseFomcCalendar(html: string): FomcMeeting[] {
  const out: FomcMeeting[] = [];
  const parts = html.split(/<h4><a id="\d+">(\d{4}) FOMC Meetings<\/a><\/h4>/);
  for (let i = 1; i < parts.length; i += 2) {
    const year = +parts[i];
    const re = /fomc-meeting__month[^>]*><strong>([^<]+)<\/strong><\/div>\s*<div class="fomc-meeting__date[^>]*>([^<]+)<\/div>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(parts[i + 1]))) {
      const monthTxt = m[1].trim(), dateTxt = m[2].trim();
      if (/notation|unscheduled|conference call/i.test(dateTxt)) continue;
      const dm = dateTxt.match(/(\d{1,2})\s*-\s*(\d{1,2})(\*)?/);
      if (!dm) continue;
      const months = monthTxt.split('/').map(s => MONTHS[s.trim().slice(0, 3).toLowerCase()]);
      if (months.some(x => !x)) continue;
      // "Apr/May 30-1" → วันตัดสินใจอยู่เดือนที่สอง / ปีถัดไปถ้า Dec/Jan
      const decMonth = months[months.length - 1];
      const decYear = months.length > 1 && decMonth < months[0] ? year + 1 : year;
      out.push(meeting(decYear, decMonth, +dm[2], !!dm[3], `${monthTxt} ${dateTxt}`));
    }
  }
  return out.sort((a, b) => a.decisionUtc - b.decisionUtc);
}

let fedMem: { meetings: FomcMeeting[]; at: number; health: CalendarHealth } | null = null;
let fedInflight: Promise<void> | null = null;

async function syncFed(): Promise<void> {
  try {
    const res = await fetch('https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const meetings = parseFomcCalendar(await res.text());
    const future = meetings.filter(x => x.decisionUtc > Date.now());
    if (meetings.length < 8 || future.length === 0) throw new Error(`parse ได้เพียง ${meetings.length} การประชุม (อนาคต ${future.length}) — โครงสร้างหน้าเว็บอาจเปลี่ยน`);
    const health: CalendarHealth = {
      source: 'Federal Reserve (federalreserve.gov)', status: 'HEALTHY', lastSync: new Date().toISOString(),
      coverageThrough: new Date(meetings[meetings.length - 1].decisionUtc).toISOString().slice(0, 10),
      message: `ซิงก์ ${meetings.length} การประชุม`,
    };
    fedMem = { meetings, at: Date.now(), health };
    writeStore('fomc-calendar', fedMem);
  } catch (err: any) {
    console.error(`[FedCalendar] ⚠ sync failed: ${err.message}`);
    const disk = fedMem ?? readStore<typeof fedMem>('fomc-calendar');
    if (disk?.meetings?.length) {
      fedMem = { ...disk, health: { ...disk.health, status: 'STALE', message: `ซิงก์ไม่สำเร็จ (${err.message}) — ใช้ข้อมูลที่ซิงก์ล่าสุด` } };
    } else {
      const meetings = MANUAL_FOMC.map(([y, m, d, p]) => meeting(y, m, d, p, `${y}-${m}-${d}`));
      fedMem = {
        meetings, at: Date.now(),
        health: {
          source: 'Manual fallback (ในโค้ด)', status: 'FALLBACK', lastSync: null,
          coverageThrough: new Date(meetings[meetings.length - 1].decisionUtc).toISOString().slice(0, 10),
          message: `ดึงปฏิทิน Fed ไม่ได้ (${err.message}) — ใช้รายการสำรอง`,
        },
      };
    }
  }
}

export const FedCalendarProvider = {
  async get(): Promise<{ meetings: FomcMeeting[]; health: CalendarHealth }> {
    const fresh = fedMem && fedMem.health.status === 'HEALTHY' && Date.now() - fedMem.at < 24 * 3600_000;
    if (!fresh) {
      if (!fedInflight) fedInflight = syncFed().finally(() => { fedInflight = null; });
      await fedInflight;
    }
    const f = fedMem!;
    // ปฏิทินครอบคลุมไม่ถึง 60 วันข้างหน้า = เตือน
    const coverEnd = f.meetings[f.meetings.length - 1]?.decisionUtc ?? 0;
    if (coverEnd < Date.now() + 60 * 86400_000 && f.health.status === 'HEALTHY') {
      f.health = { ...f.health, status: 'STALE', message: 'ปฏิทิน FOMC ครอบคลุมไม่ถึง 60 วันข้างหน้า — ตรวจสอบหน้าเว็บ Fed' };
    }
    return { meetings: f.meetings, health: f.health };
  },
};

// ═══════════════════════════════════════════════════════════
// Economic history (Nasdaq calendar)
// ═══════════════════════════════════════════════════════════
export type EconEventType = 'CPI' | 'NFP' | 'FOMC' | 'FOMC_PRESS' | 'PCE' | 'PPI' | 'RETAIL_SALES' | 'GDP' | 'ISM' | 'JOBLESS_CLAIMS';

export const EVENT_TYPE_TH: Record<EconEventType, string> = {
  CPI: 'CPI (เงินเฟ้อ)', NFP: 'Non-Farm Payrolls', FOMC: 'FOMC Statement / ดอกเบี้ย', FOMC_PRESS: 'Powell Press Conference',
  PCE: 'Core PCE', PPI: 'PPI', RETAIL_SALES: 'Retail Sales', GDP: 'GDP', ISM: 'ISM PMI', JOBLESS_CLAIMS: 'Jobless Claims',
};

export const HIGH_IMPACT_TYPES: EconEventType[] = ['CPI', 'NFP', 'FOMC', 'FOMC_PRESS', 'PCE', 'PPI', 'RETAIL_SALES', 'GDP', 'ISM'];

/** ข้อมูลออกสูงกว่าคาด → ทอง: -1 = กดดัน, +1 = หนุน */
const HIGHER_IS_GOLD: Record<EconEventType, number> = {
  CPI: -1, NFP: -1, FOMC: -1, FOMC_PRESS: 0, PCE: -1, PPI: -1, RETAIL_SALES: -1, GDP: -1, ISM: -1, JOBLESS_CLAIMS: 1,
};

const CLASSIFY: [RegExp, EconEventType][] = [
  [/^(Core )?CPI$/i, 'CPI'],
  [/^Nonfarm Payrolls$/i, 'NFP'],
  [/^Fed Interest Rate Decision$/i, 'FOMC'],
  [/^FOMC Press Conference$/i, 'FOMC_PRESS'],
  [/^Core PCE Price Index$/i, 'PCE'],
  [/^(Core )?PPI$/i, 'PPI'],
  [/^(Core )?Retail Sales$/i, 'RETAIL_SALES'],
  [/^GDP( \(QoQ\))?$/i, 'GDP'],
  [/^ISM (Manufacturing|Non-Manufacturing|Services) PMI$/i, 'ISM'],
  [/^Initial Jobless Claims$/i, 'JOBLESS_CLAIMS'],
];

export interface EconEvent {
  type: EconEventType;
  timeUtc: number;          // ms
  actual: string | null;
  consensus: string | null;
  previous: string | null;
  surprise: number | null;  // actual − consensus (หน่วยตามรายการหลัก)
  goldExpected: -1 | 0 | 1 | null; // ทิศทางทองที่ "ควร" เป็นจาก surprise
}

interface RawRow { gmt: string; eventName: string; actual: string; consensus: string; previous: string }
type RawStore = Record<string, { at: number; rows: RawRow[] }>;

const clean = (s: string | undefined) => { const v = (s ?? '').replace(/&nbsp;/g, '').trim(); return v === '' ? null : v; };
const toNum = (s: string | null): number | null => {
  if (!s) return null;
  const m = s.replace(/,/g, '').match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
};
const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);

let histMem: RawStore | null = null;
let histInflight: Promise<RawStore> | null = null;

async function fetchDay(date: string): Promise<RawRow[]> {
  const res = await fetch(`https://api.nasdaq.com/api/calendar/economicevents?date=${date}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*', Origin: 'https://www.nasdaq.com', Referer: 'https://www.nasdaq.com/' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j: any = await res.json();
  return (j?.data?.rows ?? []).filter((r: any) => r.country === 'United States').map((r: any) => ({
    gmt: r.gmt, eventName: String(r.eventName ?? '').trim(), actual: r.actual, consensus: r.consensus, previous: r.previous,
  }));
}

async function syncHistory(days: number): Promise<RawStore> {
  const store: RawStore = histMem ?? readStore<RawStore>('econ-history') ?? {};
  const now = Date.now();
  const todo: string[] = [];
  for (let i = -8; i <= days; i++) {
    const d = new Date(now - i * 86400_000);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 1) continue; // query วันอาทิตย์/จันทร์ = ข่าววันเสาร์/อาทิตย์
    const key = ymd(d.getTime());
    const hit = store[key];
    const settled = i > 7; // เก่ากว่า 7 วัน = ข้อมูลนิ่ง
    if (!hit || (!settled && now - hit.at > 6 * 3600_000)) todo.push(key);
  }
  let fails = 0;
  for (let i = 0; i < todo.length; i += 6) {
    const batch = todo.slice(i, i + 6);
    await Promise.all(batch.map(async key => {
      try { store[key] = { at: Date.now(), rows: await fetchDay(key) }; } catch { fails++; }
    }));
    if (fails > 20) { console.warn('[EconHistory] too many failures — stop'); break; }
    await new Promise(r => setTimeout(r, 150));
    if (i % 60 === 0 && i > 0) writeStore('econ-history', store);
  }
  if (todo.length) {
    writeStore('econ-history', store);
    console.log(`[EconHistory] synced ${todo.length - fails}/${todo.length} days`);
  }
  histMem = store;
  return store;
}

/** วันที่ข่าวจริง = วันที่ query + offset (ตรวจกับวัน FOMC จากปฏิทิน Fed) */
function detectOffset(store: RawStore, fomc: FomcMeeting[]): number {
  const fomcDays = new Set(fomc.map(m => ymd(m.decisionUtc - 4 * 3600_000)));
  const score: Record<number, number> = { [-1]: 0, [0]: 0 };
  for (const [key, v] of Object.entries(store)) {
    if (!v.rows.some(r => /Fed Interest Rate Decision/i.test(r.eventName))) continue;
    for (const off of [-1, 0]) if (fomcDays.has(ymd(Date.parse(key) + off * 86400_000))) score[off]++;
  }
  return score[0] > score[-1] ? 0 : -1;
}

export const EconomicHistoryProvider = {
  status: { lastSync: null as string | null, days: 0, offsetDays: -1, events: 0 },
  latest: null as EconEvent[] | null,

  async get(fomc: FomcMeeting[], days = 760): Promise<EconEvent[]> {
    if (!histInflight) histInflight = syncHistory(days).finally(() => { histInflight = null; });
    const store = await histInflight;
    const offset = detectOffset(store, fomc);
    const events = new Map<string, EconEvent & { rows: RawRow[] }>();

    for (const [key, v] of Object.entries(store)) {
      const base = new Date(Date.parse(key) + offset * 86400_000);
      for (const r of v.rows) {
        const type = CLASSIFY.find(([re]) => re.test(r.eventName))?.[1];
        const tm = r.gmt?.match(/^(\d{1,2}):(\d{2})$/);
        if (!type || !tm) continue;
        const t = etToUtcMs(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), +tm[1], +tm[2]);
        const id = `${type}:${t}`;
        const e = events.get(id) ?? { type, timeUtc: t, actual: null, consensus: null, previous: null, surprise: null, goldExpected: null, rows: [] };
        e.rows.push(r);
        // รายการหลัก = แถวแรกที่มีทั้ง actual และ consensus
        if (e.surprise == null) {
          const a = toNum(clean(r.actual)), c = toNum(clean(r.consensus));
          if (a != null && c != null) {
            e.actual = clean(r.actual); e.consensus = clean(r.consensus); e.previous = clean(r.previous);
            e.surprise = Math.round((a - c) * 1000) / 1000;
            const dir = HIGHER_IS_GOLD[type];
            e.goldExpected = e.surprise === 0 || dir === 0 ? 0 : (Math.sign(e.surprise) * dir) as -1 | 1;
          } else if (e.actual == null) {
            e.actual = clean(r.actual); e.previous = clean(r.previous);
          }
        }
        events.set(id, e);
      }
    }
    let list = [...events.values()].map(({ rows: _r, ...e }) => e).sort((a, b) => a.timeUtc - b.timeUtc);

    // FOMC: ปฏิทิน Fed เป็นแหล่งหลัก — ตัดรายการที่วันไม่ตรง แล้วเติมการประชุมที่ Nasdaq ไม่มี
    const onFed = (t: number, key: 'decisionUtc' | 'pressUtc') => fomc.some(m => Math.abs(m[key] - t) < 12 * 3600_000);
    list = list.filter(e => e.type === 'FOMC' ? onFed(e.timeUtc, 'decisionUtc') : e.type === 'FOMC_PRESS' ? onFed(e.timeUtc, 'pressUtc') : true);
    const oldest = list[0]?.timeUtc ?? Date.now();
    for (const m of fomc) {
      if (m.decisionUtc < oldest || m.decisionUtc > Date.now() + 60 * 86400_000) continue;
      if (!list.some(e => e.type === 'FOMC' && Math.abs(e.timeUtc - m.decisionUtc) < 12 * 3600_000)) list.push({ type: 'FOMC', timeUtc: m.decisionUtc, actual: null, consensus: null, previous: null, surprise: null, goldExpected: null });
      if (!list.some(e => e.type === 'FOMC_PRESS' && Math.abs(e.timeUtc - m.pressUtc) < 12 * 3600_000)) list.push({ type: 'FOMC_PRESS', timeUtc: m.pressUtc, actual: null, consensus: null, previous: null, surprise: null, goldExpected: null });
    }
    list.sort((a, b) => a.timeUtc - b.timeUtc);

    // ข่าวประเภทเดียวกันห่างกัน < 36 ชม. = รายการซ้ำ (ประกาศล่วงหน้า/เลื่อนวัน) → เก็บรายการที่มี actual, ถ้ามีทั้งคู่เก็บรายการหลัง
    const deduped: EconEvent[] = [];
    for (const e of list) {
      const prevIdx = deduped.map(x => x.type).lastIndexOf(e.type);
      const prev = prevIdx >= 0 ? deduped[prevIdx] : null;
      if (prev && e.timeUtc - prev.timeUtc < 36 * 3600_000 && e.type !== 'JOBLESS_CLAIMS') {
        if (e.actual != null || prev.actual == null) deduped[prevIdx] = e;
        continue;
      }
      deduped.push(e);
    }
    list = deduped;
    EconomicHistoryProvider.status = { lastSync: new Date().toISOString(), days: Object.keys(store).length, offsetDays: offset, events: list.length };
    EconomicHistoryProvider.latest = list;
    return list;
  },
};

const CAL_TITLE: Record<EconEventType, string> = {
  CPI: 'CPI m/m', NFP: 'Non-Farm Employment Change', FOMC: 'FOMC Statement', FOMC_PRESS: 'FOMC Press Conference',
  PCE: 'Core PCE Price Index m/m', PPI: 'PPI m/m', RETAIL_SALES: 'Retail Sales m/m', GDP: 'GDP q/q', ISM: 'ISM PMI', JOBLESS_CLAIMS: 'Unemployment Claims',
};

/**
 * ปฏิทินสำรองจากประวัติ Nasdaq (มีวันที่ + consensus ล่วงหน้า ~8 วัน)
 * ใช้เมื่อ feed ปฏิทินรายสัปดาห์หลักใช้งานไม่ได้ — รูปแบบเดียวกับ CalendarEvent ของ Data Hub
 */
export function fallbackCalendar(fromMs: number, toMs: number): { title: string; country: string; date: string; impact: string; forecast: string; previous: string }[] | null {
  const list = EconomicHistoryProvider.latest;
  if (!list?.length) return null;
  return list.filter(e => e.timeUtc >= fromMs && e.timeUtc <= toMs && e.type !== 'FOMC' && e.type !== 'FOMC_PRESS').map(e => ({
    title: CAL_TITLE[e.type], country: 'USD', date: new Date(e.timeUtc).toISOString(),
    impact: HIGH_IMPACT_TYPES.includes(e.type) ? 'High' : 'Medium',
    forecast: e.consensus ?? '', previous: e.previous ?? '',
  }));
}
