/**
 * 🥇 GoldEntryEngine — หาจุดเข้า "สวย"
 * Beautiful Entry = Trend + Structure + Price location + Risk สอดคล้องกัน โดยไม่ต้องไล่ราคา
 *
 * 5 Setups: Trend Pullback · Breakout Retest · Liquidity Sweep Reversal · Compression Breakout · Macro Confirmation
 *
 * - เขียน logic ฝั่ง LONG ครั้งเดียว แล้ว SHORT ใช้การ "กลับด้านราคา" (mirror) → กฎเหมือนกันทุกประการ
 * - ใช้เฉพาะ candles 1H/4H → backtest เรียกฟังก์ชันเดียวกับ live ได้ (ไม่มี look-ahead)
 * - Stop อยู่หลังโครงสร้าง (swing) · TP อยู่ที่แนวต้านจริง · Chase level = ราคาที่ R:R ถึง TP2 เหลือ 1.5
 */

import type { Candle } from '../../types/index.js';
import type { GoldSetupCandidate, GoldEntryZone, GoldSetupType, TradeSide } from './gold_types.js';
import { lastAtr, emaSeries, findSwings, donchian, bandwidthSeries, percentileRank, rsiSeries, round2, clamp, last } from './gold_indicators.js';

export type EntryParams = { minRiskAtr: number; maxRiskAtr: number; minRR: number; chaseRR: number; zoneHalfAtr: number };

export const ENTRY_PARAMS: EntryParams = {
  minRiskAtr: 0.8,      // stop ห่างจาก best entry อย่างน้อย 0.8 ATR(4H)
  maxRiskAtr: 2.5,
  minRR: 1.8,           // R:R ขั้นต่ำถึง TP2 สำหรับ READY
  chaseRR: 1.5,         // ราคาที่ R:R ถึง TP2 เหลือ 1.5 = ห้ามไล่
  zoneHalfAtr: 0.25,
};

export interface EntryInput {
  h1: Candle[];
  h4: Candle[];
  side: TradeSide;
  macroEvent?: { minutesSince: number; eventTime: number } | null;
  flowBias?: number; // -100..100 (ทองฝั่ง bullish)
}

const mirrorCandle = (k: Candle): Candle => ({ time: k.time, open: -k.open, high: -k.low, low: -k.high, close: -k.close, volume: k.volume });

function mirrorZone(z: GoldEntryZone): GoldEntryZone {
  return {
    ...z, side: 'SHORT',
    entryLow: -z.entryHigh, entryHigh: -z.entryLow, bestEntry: -z.bestEntry, chaseLevel: -z.chaseLevel,
    stopLoss: -z.stopLoss, tp1: -z.tp1, tp2: -z.tp2, tp3: -z.tp3,
  };
}

export class GoldEntryEngine {
  static detect(input: EntryInput, params: EntryParams = ENTRY_PARAMS): GoldSetupCandidate[] {
    const short = input.side === 'SHORT';
    const h1 = short ? input.h1.map(mirrorCandle) : input.h1;
    const h4 = short ? input.h4.map(mirrorCandle) : input.h4;
    const flow = short ? -(input.flowBias ?? 0) : (input.flowBias ?? 0);

    const out = GoldEntryEngine.detectLong(h1, h4, input.macroEvent ?? null, flow, short, params);
    return out.map(c => short ? {
      ...c, side: 'SHORT' as const,
      zone: c.zone ? mirrorZone(c.zone) : null,
      triggerLevel: c.triggerLevel != null ? -c.triggerLevel : null,
      descTh: c.descTh.replace(/@(-?[\d.]+)/g, (_m, v) => `$${round2(-parseFloat(v))}`),
    } : { ...c, descTh: c.descTh.replace(/@(-?[\d.]+)/g, (_m, v) => `$${round2(parseFloat(v))}`) });
  }

  /** LONG logic (SHORT ใช้ผ่าน mirror) — ใน descTh ใช้ @ราคา เพื่อให้แปลงกลับด้านได้ */
  private static detectLong(h1: Candle[], h4: Candle[], macroEvent: EntryInput['macroEvent'], flow: number, short: boolean, P: EntryParams): GoldSetupCandidate[] {
    const w = (long: string, sh: string) => short ? sh : long;
    if (h4.length < 120 || h1.length < 50) return [];
    const atr = lastAtr(h4);
    if (!(atr > 0)) return [];
    const price = last(h1).close;
    const closes4 = h4.map(k => k.close);
    const e20s = emaSeries(closes4, 20), e50s = emaSeries(closes4, 50);
    const ema20 = last(e20s) ?? price, ema50 = last(e50s) ?? price;
    const ema50Prev = e50s[e50s.length - 11] ?? ema50;
    const trendUp = ema20 > ema50 && ema50 > ema50Prev && price > ema50;

    const swings = findSwings(h4.slice(-150), 3, 3);
    const resistances = swings.filter(s => s.type === 'H' && s.price > price).map(s => s.price).sort((a, b) => a - b);
    const lowsBelow = (lvl: number) => swings.filter(s => s.type === 'L' && s.price < lvl).map(s => s.price).sort((a, b) => b - a);
    const rsi1h = last(rsiSeries(h1.map(k => k.close))) ?? 50;

    const candidates: GoldSetupCandidate[] = [];
    const push = (type: GoldSetupType, ready: boolean, qualityBase: number, center: number | null, structuralStop: number | null, trigger: number | null, desc: string) => {
      const zone = center != null && structuralStop != null ? GoldEntryEngine.buildZone(center, structuralStop, atr, resistances, P) : null;
      const inZone = !!zone && price >= zone.entryLow - atr * 0.05 && price <= zone.entryHigh + atr * 0.05;
      const extended = !!zone && price > zone.chaseLevel;
      let quality = qualityBase;
      if (zone) {
        quality += clamp((zone.riskReward - P.minRR) * 8, -20, 15);
        if (inZone) quality += 10;
        if (extended) quality -= 20;
      }
      if (flow > 15) quality += 6; else if (flow < -15) quality -= 10;
      const rrOk = !zone || zone.riskReward >= P.minRR;
      candidates.push({ type, side: 'LONG', ready: ready && rrOk, quality: Math.round(clamp(quality, 0, 100)), inZone, extended, zone, triggerLevel: trigger, descTh: desc });
    };

    // 1) TREND PULLBACK — เทรนด์ 4H ดี รอย่อเข้า EMA20 / แนวรับ
    if (trendUp) {
      const support = lowsBelow(price).find(l => l > ema20 - atr * 1.2 && l < price);
      const center = support != null && support > ema20 ? (support + ema20) / 2 : ema20;
      const stop = lowsBelow(center - atr * 0.3)[0] ?? center - atr * 1.3;
      const rsiOk = rsi1h >= 35 && rsi1h <= 62;
      push('TREND_PULLBACK', true, 58 + (rsiOk ? 8 : -5), center, stop, null,
        `เทรนด์ 4H ${w('ขึ้น (EMA20 > EMA50) — รอย่อเข้าโซน EMA20/แนวรับ', 'ลง (EMA20 < EMA50) — รอเด้งเข้าโซน EMA20/แนวต้าน')} @${round2(center)}`);
    }

    // 2) BREAKOUT RETEST — ทะลุกรอบ 20 แท่งภายใน 12 แท่งล่าสุด แล้วกลับมาทดสอบ
    for (let back = 1; back <= 12; back++) {
      const i = h4.length - back;
      if (i < 25) break;
      const dc = donchian(h4.slice(0, i + 1), 20);
      if (h4[i].close > dc.high) {
        const level = dc.high;
        const after = h4.slice(i + 1);
        const held = after.every(k => k.close > level - atr * 0.5) && price > level - atr * 0.3;
        const retested = after.some(k => k.low <= level + atr * 0.4);
        if (held) {
          const stop = Math.min(level - atr * 0.9, ...after.map(k => k.low).concat(h4[i].low));
          push('BREAKOUT_RETEST', retested || price <= level + atr * 0.5, 62 + (retested ? 8 : 0), level + atr * 0.1, stop, null,
            `${w('ทะลุ', 'หลุด')}กรอบ @${round2(level)} เมื่อ ${back} แท่ง 4H ก่อน — ${retested ? w('Retest แล้วยืนเหนือแนวได้', 'Retest แล้วยืนใต้แนวได้') : 'รอ Retest แนวที่' + w('ทะลุ', 'หลุด')}`);
        }
        break;
      }
    }

    // 3) LIQUIDITY SWEEP REVERSAL — กวาด swing low แล้วปิดกลับขึ้นมา (1H)
    const priorLows = swings.filter(s => s.type === 'L').slice(-4);
    const recent1h = h1.slice(-6);
    for (const sl of priorLows.reverse()) {
      const sweepBar = recent1h.find(k => k.low < sl.price && k.close > sl.price);
      if (sweepBar && price > sl.price) {
        const sweepLow = Math.min(...recent1h.map(k => k.low));
        push('LIQUIDITY_SWEEP_REVERSAL', true, 60 + (trendUp ? 8 : 0), sl.price + atr * 0.2, sweepLow, null,
          `กวาด Liquidity ${w('ใต้', 'เหนือ')} @${round2(sl.price)} แล้วปิดกลับ${w('เหนือ', 'ใต้')}แนว — สัญญาณ Stop Hunt`);
        break;
      }
    }

    // 4) COMPRESSION BREAKOUT — Bollinger 4H บีบตัว แล้วรอหลุดกรอบ
    const bw = bandwidthSeries(closes4);
    const squeezed = [0, 1, 2].some(k => percentileRank(bw.slice(0, bw.length - k), 120) <= 20);
    if (squeezed) {
      const box = donchian(h4, 12);
      const brokeUp = last(h4).close > box.high;
      const mid = (box.high + box.low) / 2;
      push('COMPRESSION_BREAKOUT', brokeUp && flow > -15, 55 + (trendUp ? 8 : 0), brokeUp ? box.high : null, brokeUp ? Math.min(mid, box.high - atr) : null, box.high,
        brokeUp ? `Volatility บีบตัวแล้ว${w('ทะลุ', 'หลุด')}กรอบ @${round2(box.high)} — Volatility กำลังขยาย`
          : `Volatility บีบตัวในกรอบ @${round2(box.low)} – @${round2(box.high)} — รอ Breakout`);
    }

    // 5) MACRO CONFIRMATION — หลังข่าวแรง 30–240 นาที ราคาและ Flow ไปทางเดียวกัน
    if (macroEvent && macroEvent.minutesSince >= 30 && macroEvent.minutesSince <= 240) {
      const pre = [...h1].reverse().find(k => k.time <= macroEvent.eventTime);
      const post = h1.filter(k => k.time > macroEvent.eventTime);
      const atr1h = lastAtr(h1);
      if (pre && post.length >= 1 && price - pre.close > atr1h * 0.8 && flow > 10) {
        const postLow = Math.min(...post.map(k => k.low));
        push('MACRO_CONFIRMATION_ENTRY', true, 64, price - atr * 0.25, postLow - atr * 0.1, null,
          `หลังข่าวราคาขยับ${w('ขึ้น', 'ลง')} $${round2(price - pre.close)} และ Order Flow ยืนยัน — เข้าได้เมื่อ${w('ย่อ', 'เด้ง')}เล็กน้อย`);
      }
    }

    return candidates.sort((a, b) => Number(b.ready) - Number(a.ready) || Number(b.inZone) - Number(a.inZone) || b.quality - a.quality);
  }

  static buildZone(center: number, structuralStop: number, atr: number, resistances: number[], P: EntryParams = ENTRY_PARAMS): GoldEntryZone {
    const half = atr * P.zoneHalfAtr;
    const entryLow = center - half, entryHigh = center + half, best = center;
    let stop = Math.min(structuralStop - atr * 0.25, entryLow - atr * 0.5);
    const risk = clamp(best - stop, atr * P.minRiskAtr, atr * P.maxRiskAtr);
    stop = best - risk;

    const res = resistances.filter(r => r > best).sort((a, b) => a - b);
    const tp1 = res.find(r => r >= best + risk * 1.0) ?? best + risk * 1.5;
    const tp2 = res.find(r => r >= Math.max(tp1 + risk * 0.8, best + risk * 2.0)) ?? Math.max(best + risk * 2.5, tp1 + risk);
    const tp3 = res.find(r => r >= Math.max(tp2 + risk, best + risk * 3.5)) ?? Math.max(best + risk * 4, tp2 + risk);
    const rr = (tp2 - best) / risk;
    const chase = Math.max(entryHigh, (tp2 + P.chaseRR * stop) / (1 + P.chaseRR));

    const days = ((tp2 - best) / (atr * 2.45)) * 1.5;
    const holdingPeriod = days <= 1.5 ? 'ภายในวัน – 2 วัน' : days <= 5 ? '1–5 วัน' : days <= 10 ? '3–10 วัน' : '1–3 สัปดาห์';

    return {
      side: 'LONG',
      entryLow: round2(entryLow), entryHigh: round2(entryHigh), bestEntry: round2(best), chaseLevel: round2(chase),
      stopLoss: round2(stop), tp1: round2(tp1), tp2: round2(tp2), tp3: round2(tp3),
      riskReward: Math.round(rr * 10) / 10, holdingPeriod,
    };
  }
}
