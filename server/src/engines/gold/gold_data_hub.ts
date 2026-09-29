/**
 * 🥇 Gold Data Hub
 * ดึงข้อมูลจริงจากแหล่งข้อมูลหลัก (Primary Source ก่อน) พร้อม cache และสถานะความสดของข้อมูล
 *
 * Source hierarchy:
 *  - ทองไทย / Gold Spot / USDTHB : สมาคมค้าทองคำ (goldtraders.or.th API) → fallback api.chnwt.dev
 *  - COMEX Gold Futures (GC=F) candles/volume : Yahoo Finance chart API (delayed)
 *  - Nominal & Real Yield : U.S. Treasury Daily Yield Curve CSV
 *  - CPI / NFP / Unemployment / AHE : U.S. BLS Public API v1
 *  - Economic calendar (forecast/previous) : ForexFactory weekly JSON
 *  - Futures positioning : CFTC COT (Legacy, Gold COMEX 088691)
 *  - News : Google News RSS (headline discovery only — primary confirmation required)
 *
 * ทุก fetch ล้มเหลวได้ → คืน null และระบบ downstream ต้องไม่เอาไปคิดคะแนน (ห้ามสุ่มแทน)
 */

import type { Candle } from '../../types/index.js';
import type { GoldSourceStatus } from './gold_types.js';
import { readStore, writeStore } from './gold_store.js';

const UA = 'Mozilla/5.0 (compatible; CryptoPro-GoldEngine/1.0)';

interface CacheEntry<T> { value: T; at: number }
const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Cached fetch wrapper — keeps last good value if a refresh fails (served as STALE) */
async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T | null>): Promise<{ value: T | null; ageSec: number; stale: boolean }> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return { value: hit.value, ageSec: Math.round((now - hit.at) / 1000), stale: false };

  let p = inflight.get(key) as Promise<T | null> | undefined;
  if (!p) {
    p = loader().catch((err) => {
      console.warn(`[GoldDataHub] ${key} failed: ${err?.message ?? err}`);
      return null;
    });
    inflight.set(key, p);
    p.finally(() => inflight.delete(key));
  }
  const value = await p;
  if (value !== null && value !== undefined) {
    cache.set(key, { value, at: Date.now() });
    return { value, ageSec: 0, stale: false };
  }
  if (hit) return { value: hit.value, ageSec: Math.round((now - hit.at) / 1000), stale: true };
  return { value: null, ageSec: 0, stale: true };
}

async function getJson(url: string, timeoutMs = 10000): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function getText(url: string, timeoutMs = 10000): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

// ─────────────────────────────────────────────
// Status registry — ให้ UI แสดงว่าข้อมูลส่วนไหน LIVE / STALE / UNAVAILABLE
// ─────────────────────────────────────────────
const statusRegistry = new Map<string, GoldSourceStatus>();

function record(id: string, label: string, source: string, r: { value: unknown; ageSec: number; stale: boolean }, note?: string) {
  statusRegistry.set(id, {
    id, label, source,
    status: r.value === null ? 'UNAVAILABLE' : r.stale ? 'STALE' : 'LIVE',
    ageSec: r.ageSec,
    note,
  });
}

export function getSourceStatuses(): GoldSourceStatus[] {
  return [...statusRegistry.values()];
}

// ─────────────────────────────────────────────
// Thai Gold — สมาคมค้าทองคำ
// ─────────────────────────────────────────────
export interface ThaiGoldQuote {
  barBuy: number;       // ทองคำแท่ง รับซื้อ (บาทละ)
  barSell: number;      // ทองคำแท่ง ขายออก
  ornamentBuy: number;  // ทองรูปพรรณ รับซื้อ
  ornamentSell: number; // ทองรูปพรรณ ขายออก
  goldSpot: number | null;  // Gold Spot ที่สมาคมใช้อ้างอิง
  usdThb: number | null;    // บาท/ดอลลาร์ ที่สมาคมใช้อ้างอิง
  changeFromPrevDay: number | null;
  asTime: string;           // เวลาประกาศ (เวลาไทย)
  round: number | null;     // ครั้งที่ประกาศ
  source: string;
}

const num = (s: unknown): number => typeof s === 'number' ? s : parseFloat(String(s).replace(/,/g, ''));

export async function fetchThaiGold(): Promise<ThaiGoldQuote | null> {
  const r = await cached<ThaiGoldQuote>('thai-gold', 60_000, async () => {
    try {
      const d = await getJson('https://www.goldtraders.or.th/api/GoldPrices/Latest?readjson=false');
      if (!d?.bL_SellPrice) throw new Error('bad payload');
      return {
        barBuy: num(d.bL_BuyPrice), barSell: num(d.bL_SellPrice),
        ornamentBuy: num(d.oM965_BuyPrice), ornamentSell: num(d.oM965_SellPrice),
        goldSpot: d.goldSpot ? num(d.goldSpot) : null,
        usdThb: d.bahtPerUSD ? num(d.bahtPerUSD) : null,
        changeFromPrevDay: d.priceChangeFromPrevDayLast != null ? num(d.priceChangeFromPrevDayLast) : null,
        asTime: String(d.asTime), round: d.seq ?? null,
        source: 'สมาคมค้าทองคำ (goldtraders.or.th)',
      };
    } catch (primaryErr) {
      // Secondary: community mirror of the same association price
      const d = await getJson('https://api.chnwt.dev/thai-gold-api/latest');
      const p = d?.response?.price;
      if (!p?.gold_bar) throw primaryErr;
      return {
        barBuy: num(p.gold_bar.buy), barSell: num(p.gold_bar.sell),
        ornamentBuy: num(p.gold.buy), ornamentSell: num(p.gold.sell),
        goldSpot: null, usdThb: null, changeFromPrevDay: null,
        asTime: `${d.response.update_date} ${d.response.update_time}`, round: null,
        source: 'api.chnwt.dev (mirror สมาคมค้าทองคำ)',
      };
    }
  });
  record('thai-gold', 'ราคาทองไทย', r.value?.source ?? 'สมาคมค้าทองคำ', r);
  return r.value;
}

// ─────────────────────────────────────────────
// Yahoo Finance chart API — candles
// ─────────────────────────────────────────────
export interface MarketSeries {
  symbol: string;
  candles: Candle[];
  last: number;
  prevClose: number | null;
  exchangeTime: number;
}

async function loadYahoo(symbol: string, interval: string, range: string): Promise<MarketSeries | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const d = await getJson(url, 15000);
  const res = d?.chart?.result?.[0];
  if (!res?.timestamp) throw new Error(`no data for ${symbol}`);
  const q = res.indicators.quote[0];
  const candles: Candle[] = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({ time: res.timestamp[i], open: o, high: h, low: l, close: c, volume: q.volume?.[i] ?? 0 });
  }
  if (candles.length === 0) throw new Error(`empty candles for ${symbol}`);
  return {
    symbol,
    candles,
    last: res.meta.regularMarketPrice ?? candles[candles.length - 1].close,
    prevClose: res.meta.chartPreviousClose ?? null,
    exchangeTime: res.meta.regularMarketTime ?? candles[candles.length - 1].time,
  };
}

const YAHOO_TTL: Record<string, number> = { '5m': 60_000, '15m': 120_000, '1h': 300_000, '1d': 900_000, '1wk': 3_600_000 };

export async function fetchSeries(symbol: string, interval: '5m' | '15m' | '1h' | '1d' | '1wk', range: string, label?: string): Promise<MarketSeries | null> {
  const key = `yahoo:${symbol}:${interval}:${range}`;
  const r = await cached<MarketSeries>(key, YAHOO_TTL[interval] ?? 300_000, () => loadYahoo(symbol, interval, range));
  if (label) record(key, label, 'Yahoo Finance (delayed)', r);
  return r.value;
}

/** Aggregate 1h candles into 4h candles (aligned to UTC 4h buckets) */
export function aggregateCandles(candles: Candle[], hours: number): Candle[] {
  const bucketSec = hours * 3600;
  const out: Candle[] = [];
  for (const c of candles) {
    const b = Math.floor(c.time / bucketSec) * bucketSec;
    const last = out[out.length - 1];
    if (last && last.time === b) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume += c.volume;
    } else {
      out.push({ time: b, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume });
    }
  }
  return out;
}

// ─────────────────────────────────────────────
// U.S. Treasury — Daily Nominal & Real Yield Curve (primary source)
// ─────────────────────────────────────────────
export interface YieldPoint { date: string; y3m?: number; y2?: number; y10?: number; real10?: number }

async function loadTreasuryCsv(type: 'daily_treasury_yield_curve' | 'daily_treasury_real_yield_curve', year: number): Promise<Record<string, number>[]> {
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=${type}&field_tdr_date_value=${year}&page&_format=csv`;
  const text = await getText(url, 20000);
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const row: Record<string, number> = {};
    header.forEach((h, i) => {
      if (h === 'Date') {
        const [m, d, y] = cols[i].split('/');
        row.__date = Date.UTC(+y, +m - 1, +d);
      } else {
        const v = parseFloat(cols[i]);
        if (!Number.isNaN(v)) row[h] = v;
      }
    });
    return row;
  });
}

export async function fetchTreasuryYields(): Promise<YieldPoint[] | null> {
  const r = await cached<YieldPoint[]>('treasury', 3 * 3600_000, async () => {
    const year = new Date().getUTCFullYear();
    const load = async (type: 'daily_treasury_yield_curve' | 'daily_treasury_real_yield_curve') => {
      const rows = await loadTreasuryCsv(type, year);
      // ต้นปีข้อมูลน้อย → เติมปีก่อนเพื่อให้คำนวณ trend 20 วันได้
      return rows.length < 30 ? [...rows, ...(await loadTreasuryCsv(type, year - 1))] : rows;
    };
    const [nominal, real] = await Promise.all([load('daily_treasury_yield_curve'), load('daily_treasury_real_yield_curve')]);
    const byDate = new Map<number, YieldPoint>();
    for (const n of nominal) byDate.set(n.__date, { date: new Date(n.__date).toISOString().slice(0, 10), y3m: n['3 Mo'], y2: n['2 Yr'], y10: n['10 Yr'] });
    for (const rr of real) {
      const p = byDate.get(rr.__date) ?? { date: new Date(rr.__date).toISOString().slice(0, 10) };
      p.real10 = rr['10 YR'];
      byDate.set(rr.__date, p);
    }
    const out = [...byDate.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
    if (out.length === 0) throw new Error('no treasury rows');
    return out;
  });
  record('treasury', 'US Treasury Nominal/Real Yield', 'U.S. Treasury', r);
  return r.value;
}

// ─────────────────────────────────────────────
// U.S. BLS — CPI, Core CPI, NFP, Unemployment, AHE (primary source)
// ─────────────────────────────────────────────
export const BLS_SERIES = {
  cpi: 'CUUR0000SA0',        // CPI-U NSA (YoY) — v1 คืนข้อมูล ~3 ปีล่าสุด พอสำหรับ YoY
  coreCpi: 'CUUR0000SA0L1E', // Core CPI NSA (YoY)
  payrolls: 'CES0000000001', // Total nonfarm, SA (thousands)
  unemployment: 'LNS14000000',
  ahe: 'CES0500000003',      // Avg hourly earnings, private
} as const;

export interface BlsObservation { year: number; month: number; value: number }

export async function fetchBls(): Promise<Record<keyof typeof BLS_SERIES, BlsObservation[]> | null> {
  const r = await cached<Record<keyof typeof BLS_SERIES, BlsObservation[]>>('bls', 6 * 3600_000, async () => {
    // v1 API (ไม่ต้องใช้ key) จำกัด 25 request/วัน/IP → ดึงทุก series ใน request เดียว
    const keys = Object.keys(BLS_SERIES) as (keyof typeof BLS_SERIES)[];
    const res = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/', {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: keys.map(k => BLS_SERIES[k]) }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
    const d: any = await res.json();
    if (d.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${d.message?.join(' ')}`);
    const out = {} as Record<keyof typeof BLS_SERIES, BlsObservation[]>;
    for (const k of keys) {
      const series = d.Results.series.find((s: any) => s.seriesID === BLS_SERIES[k]);
      out[k] = (series?.data ?? [])
        .filter((x: any) => /^M(0[1-9]|1[0-2])$/.test(x.period))
        .map((x: any) => ({ year: +x.year, month: +x.period.slice(1), value: parseFloat(x.value) }))
        .sort((a: BlsObservation, b: BlsObservation) => a.year - b.year || a.month - b.month);
    }
    return out;
  });
  record('bls', 'CPI / NFP / Unemployment', 'U.S. BLS', r);
  return r.value;
}

// ─────────────────────────────────────────────
// Economic calendar — this week (forecast = consensus)
// ─────────────────────────────────────────────
export interface CalendarEvent { title: string; country: string; date: string; impact: 'High' | 'Medium' | 'Low' | 'Holiday' | string; forecast: string; previous: string }

export async function fetchCalendar(): Promise<CalendarEvent[] | null> {
  // feed นี้ rate-limit เข้ม (429) → เก็บลง disk เพื่อไม่ต้องดึงใหม่ทุกครั้งที่ server restart
  const disk = readStore<{ at: number; events: CalendarEvent[] }>('ff-calendar');
  if (disk && Date.now() - disk.at < 30 * 60_000 && !cache.has('calendar')) cache.set('calendar', { value: disk.events, at: disk.at });
  const r = await cached<CalendarEvent[]>('calendar', 30 * 60_000, async () => {
    try {
      const d = await getJson('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
      if (!Array.isArray(d)) throw new Error('bad calendar');
      writeStore('ff-calendar', { at: Date.now(), events: d });
      return d as CalendarEvent[];
    } catch (err) {
      // ใช้สำเนาบน disk ได้ถ้ายังอยู่ในสัปดาห์เดียวกัน (≤ 12 ชม.)
      if (disk && Date.now() - disk.at < 12 * 3600_000) return disk.events;
      throw err;
    }
  });
  record('calendar', 'ปฏิทินเศรษฐกิจ (Consensus)', 'ForexFactory weekly feed', r);
  return r.value;
}

// ─────────────────────────────────────────────
// CFTC Commitments of Traders — Gold (COMEX) Legacy Futures Only
// ─────────────────────────────────────────────
export interface CotReport {
  date: string;
  openInterest: number;
  oiChange: number;
  specLong: number;
  specShort: number;
  specNet: number;
  specNetChange: number;
  commNet: number;
}

export async function fetchCot(): Promise<CotReport[] | null> {
  const r = await cached<CotReport[]>('cot', 6 * 3600_000, async () => {
    const url = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=088691&$order=report_date_as_yyyy_mm_dd%20DESC&$limit=26';
    const rows = await getJson(url, 15000);
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('no COT rows');
    return rows.map((x: any) => {
      const specLong = +x.noncomm_positions_long_all, specShort = +x.noncomm_positions_short_all;
      return {
        date: String(x.report_date_as_yyyy_mm_dd).slice(0, 10),
        openInterest: +x.open_interest_all,
        oiChange: +x.change_in_open_interest_all,
        specLong, specShort, specNet: specLong - specShort,
        specNetChange: (+x.change_in_noncomm_long_all) - (+x.change_in_noncomm_short_all),
        commNet: (+x.comm_positions_long_all) - (+x.comm_positions_short_all),
      };
    });
  });
  record('cot', 'CFTC COT (Gold)', 'CFTC', r, 'รายงานรายสัปดาห์ (ข้อมูลวันอังคาร เผยแพร่วันศุกร์)');
  return r.value;
}

// ─────────────────────────────────────────────
// News — Google News RSS (discovery layer)
// ─────────────────────────────────────────────
export interface RawNewsItem { title: string; link: string; source: string; pubDate: string }

function decodeXml(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export async function fetchGoldNews(): Promise<RawNewsItem[] | null> {
  const r = await cached<RawNewsItem[]>('news', 10 * 60_000, async () => {
    const queries = ['gold price', 'Federal Reserve rates', 'central bank gold'];
    const all: RawNewsItem[] = [];
    for (const q of queries) {
      const xml = await getText(`https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:2d')}&hl=en-US&gl=US&ceid=US:en`);
      const items = xml.split('<item>').slice(1);
      for (const it of items.slice(0, 15)) {
        const pick = (tag: string) => { const m = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? decodeXml(m[1]) : ''; };
        const source = pick('source');
        let title = pick('title');
        if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
        all.push({ title, link: pick('link'), source, pubDate: pick('pubDate') });
      }
    }
    const seen = new Set<string>();
    return all.filter(n => { const k = n.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  });
  record('news', 'ข่าวทอง/Fed', 'Google News RSS', r, 'ใช้ค้นหาข่าว — น้ำหนักตาม reliability ของแหล่งข่าว');
  return r.value;
}
