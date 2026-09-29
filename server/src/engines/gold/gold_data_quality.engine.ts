/**
 * 🥇 GoldDataQualityEngine — ระบบต้องรู้ว่าตัวเอง "รู้ไม่ครบแค่ไหน"
 *
 * ต่อหมวดข้อมูล: Coverage (มีครบไหม) × Freshness (สดไหม) × Source Quality (น่าเชื่อถือแค่ไหน)
 * Data Confidence = Coverage × Freshness × Quality (ถ่วงตามน้ำหนักการตัดสินใจ)
 * → ใช้ลด Effective Confidence และเป็น gate ของ READY
 */

import type { GoldDataCategory, GoldDataQuality, GoldFundamentalResult, GoldOrderFlowResult, GoldPriceData, GoldIntermarketResult, GoldSourceStatus } from './gold_types.js';
import type { GoldTimeframes } from './gold_market_data.engine.js';
import type { YieldPoint, BlsObservation, CalendarEvent, RawNewsItem, CotReport } from './gold_data_hub.js';
import type { CalendarHealth } from './gold_calendar.provider.js';
import { clamp } from './gold_indicators.js';

const W: Record<string, number> = {
  price: 0.18, technical: 0.18, macro: 0.16, intermarket: 0.10, events: 0.10, orderflow: 0.10, fundamental: 0.10, news: 0.08,
};

const ageFresh = (hours: number, full: number, half: number) => hours <= full ? 100 : hours <= half ? 75 : hours <= half * 3 ? 50 : 25;

export class GoldDataQualityEngine {
  static evaluate(p: {
    price: GoldPriceData; tf: GoldTimeframes; intermarket: GoldIntermarketResult;
    yields: YieldPoint[] | null; bls: Record<string, BlsObservation[]> | null; calendar: CalendarEvent[] | null;
    cot: CotReport[] | null; news: RawNewsItem[] | null; newsReliability: number;
    fundamental: GoldFundamentalResult; orderFlow: GoldOrderFlowResult; fedHealth: CalendarHealth; sources: GoldSourceStatus[];
  }): GoldDataQuality {
    const cats: GoldDataCategory[] = [];
    const now = Date.now();
    const staleYahoo = p.sources.filter(s => s.source.startsWith('Yahoo') && s.status !== 'LIVE').length;

    // Price
    const tfs = [p.tf.m5, p.tf.m15, p.tf.h1, p.tf.h4, p.tf.d1, p.tf.w1];
    const candleAgeH = (now / 1000 - p.price.lastCandleTime) / 3600;
    const priceFresh = p.price.marketOpen ? ageFresh(candleAgeH, 0.34, 1) : 90;
    cats.push({
      key: 'price', nameTh: 'ราคา (COMEX / Spot / ทองไทย)',
      coverage: Math.round((tfs.filter(c => c.length > 0).length / 6) * 85 + (p.price.thaiGoldBarSell != null ? 15 : 0)),
      freshness: priceFresh, quality: 80,
      noteTh: `COMEX delayed · Spot ประมาณจาก basis${p.price.marketOpen ? '' : ' · ตลาดปิด'}`,
    });

    // Technical
    const techTfs = [p.tf.m15, p.tf.h1, p.tf.h4, p.tf.d1, p.tf.w1].filter(c => c.length >= 55).length;
    cats.push({ key: 'technical', nameTh: 'เทคนิคัล Multi-Timeframe', coverage: Math.round((techTfs / 5) * 100), freshness: priceFresh, quality: 85, noteTh: `${techTfs}/5 timeframe มีข้อมูลพอคำนวณ` });

    // Macro
    const y = p.yields?.[p.yields.length - 1];
    const yCount = y ? [y.y3m, y.y2, y.y10].filter(v => v != null).length + ([...(p.yields ?? [])].reverse().find(v => v.real10 != null) ? 1 : 0) : 0;
    const blsCount = p.bls ? Object.values(p.bls).filter(a => a.length > 0).length : 0;
    const yAgeDays = y ? (now - Date.parse(y.date)) / 86400_000 : Infinity;
    cats.push({
      key: 'macro', nameTh: 'Macro / Fed / Yields',
      coverage: Math.round((yCount / 4) * 50 + (blsCount / 5) * 35 + (p.calendar ? 15 : 0)),
      freshness: y ? ageFresh(yAgeDays * 24, 96, 168) : 0, quality: 100,
      noteTh: `Treasury ${yCount}/4 · BLS ${blsCount}/5 series · ${y ? `yield ณ ${y.date}` : 'ไม่มี yield'}`,
    });

    // Intermarket
    const imAvail = p.intermarket.items.filter(i => i.available).length;
    cats.push({ key: 'intermarket', nameTh: 'Intermarket', coverage: Math.round((imAvail / Math.max(1, p.intermarket.items.length)) * 100), freshness: staleYahoo ? 70 : 100, quality: 80, noteTh: `${imAvail}/${p.intermarket.items.length} ตลาด` });

    // Event calendar
    const fedScore = { HEALTHY: 50, STALE: 30, FALLBACK: 20, FAILED: 0 }[p.fedHealth.status];
    cats.push({
      key: 'events', nameTh: 'ปฏิทินข่าว / FOMC', coverage: (p.calendar ? 50 : 0) + fedScore, freshness: 100, quality: 90,
      noteTh: `FOMC: ${p.fedHealth.status} · ปฏิทินรายสัปดาห์: ${p.calendar ? 'มี' : 'ไม่มี'}`,
    });

    // Order flow proxy
    const cotAgeH = p.cot?.[0] ? (now - Date.parse(p.cot[0].date)) / 3600_000 : Infinity;
    cats.push({
      key: 'orderflow', nameTh: 'Order Flow (Proxy)',
      coverage: 50, freshness: Math.round((priceFresh + (Number.isFinite(cotAgeH) ? ageFresh(cotAgeH, 24 * 10, 24 * 17) : 0)) / 2),
      quality: p.orderFlow.confidenceScore,
      noteTh: 'มี Volume + CVD proxy + COT · ขาด tick / aggressor / bid-ask / depth',
    });

    // Fundamental
    const wgc = p.fundamental.components.find(c => c.source.includes('World Gold Council'));
    cats.push({
      key: 'fundamental', nameTh: 'ปัจจัยพื้นฐาน (WGC + live)', coverage: p.fundamental.coveragePct,
      freshness: wgc?.asOf ? 80 : 50, quality: 90,
      noteTh: wgc?.asOf ? `WGC ${wgc.asOf}` : 'ข้อมูล WGC ยังไม่ได้กรอก',
    });

    // News
    const newest = (p.news ?? []).map(n => Date.parse(n.pubDate)).filter(Number.isFinite).sort((a, b) => b - a)[0];
    cats.push({
      key: 'news', nameTh: 'ข่าว', coverage: Math.round(clamp(((p.news?.length ?? 0) / 15) * 100, 0, 100)),
      freshness: newest ? ageFresh((now - newest) / 3600_000, 6, 24) : 0, quality: Math.round(p.newsReliability || 55),
      noteTh: `${p.news?.length ?? 0} ข่าว · ทิศทางจาก lexicon (rule-based)`,
    });

    const wsum = (f: (c: GoldDataCategory) => number) => cats.reduce((s, c) => s + f(c) * (W[c.key] ?? 0), 0) / cats.reduce((s, c) => s + (W[c.key] ?? 0), 0);
    const overallCoverage = Math.round(wsum(c => c.coverage));
    const freshness = Math.round(wsum(c => c.freshness));
    const sourceQuality = Math.round(wsum(c => c.quality));
    const dataConfidence = Math.round((overallCoverage * freshness * sourceQuality) / 10000);
    const level = dataConfidence >= 75 ? 'HIGH' as const : dataConfidence >= 55 ? 'MEDIUM' as const : 'LOW' as const;
    const weakest = [...cats].sort((a, b) => a.coverage * a.quality - b.coverage * b.quality).slice(0, 2).map(c => c.nameTh);

    return {
      categories: cats, overallCoverage, freshness, sourceQuality, dataConfidence, level,
      noteTh: `Data Confidence ${dataConfidence}/100 (${level}) — จุดอ่อน: ${weakest.join(', ')}`,
    };
  }
}
