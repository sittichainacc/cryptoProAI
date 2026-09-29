/**
 * 🥇 GoldPositionEngine (+ ProfitProtection + Exit)
 * เมื่อผู้ใช้มี Position แล้ว หน้าจอเปลี่ยนจาก "เข้าตรงไหน" เป็น "ถือต่อ / ทยอยขาย / ป้องกันกำไร / ออก"
 *
 * Trailing: < 1R = stop เดิม · ≥ 1R = Breakeven · หลัง TP1 = max(BE, ราคา − 1.5 ATR, swing 4H) · หลัง TP2 = ราคา − 1.0 ATR
 */

import type { Candle } from '../../types/index.js';
import type { GoldPosition, GoldSignalState, GoldPriceData, GoldTradingMode, GoldConvictionScore, GoldStructureResult, GoldRegimeResult, GoldEntryZone, TradeSide } from './gold_types.js';
import { GoldEntryEngine } from './gold_entry.engine.js';
import { ThaiGoldAdapter } from './thai_gold.adapter.js';
import { findSwings, lastAtr, clamp, round2, last } from './gold_indicators.js';

export interface UserPositionInput {
  side: TradeSide;
  entryPrice: number;      // หน่วยตามโหมด (USD หรือ บาท/บาททองคำ สำหรับทองไทย)
  stopLoss?: number | null;
  entryTime?: number | null; // unix ms
}

export class GoldPositionEngine {
  static evaluate(p: {
    input: UserPositionInput; mode: GoldTradingMode; price: GoldPriceData;
    h1: Candle[]; h4: Candle[]; conviction: GoldConvictionScore; structure: GoldStructureResult; regime: GoldRegimeResult;
    planEntry: GoldEntryZone | null; eventBlocked: boolean;
  }): GoldPosition | null {
    const { mode, price, h1, h4, conviction, structure, regime, planEntry, eventBlocked } = p;
    const thai = mode === 'THAI_GOLD_BAR';
    if (thai && !ThaiGoldAdapter.isAvailable(price)) return null;
    const side: TradeSide = thai ? 'LONG' : p.input.side;
    const dir = side === 'LONG' ? 1 : -1;

    // ── แปลงทุกอย่างเป็นหน่วยราคาที่ engine ใช้ (USD) ──
    const toUsd = (v: number) => thai ? ThaiGoldAdapter.fromBarSell(v, price) : v;
    const entry = toUsd(p.input.entryPrice);
    const cur = last(h1).close;
    const atr = lastAtr(h4);

    // ── Stop & targets ──
    let zone: GoldEntryZone;
    const swings = findSwings(h4.slice(-150), 3, 3);
    if (planEntry && planEntry.side === side && Math.abs(planEntry.bestEntry - entry) < atr * 1.5 && p.input.stopLoss == null) {
      const shift = entry - planEntry.bestEntry;
      zone = { ...planEntry, stopLoss: planEntry.stopLoss + shift, tp1: planEntry.tp1 + shift, tp2: planEntry.tp2 + shift, tp3: planEntry.tp3 + shift };
    } else if (side === 'LONG') {
      const sl = p.input.stopLoss != null ? toUsd(p.input.stopLoss + (thai ? ThaiGoldAdapter.spread(price) : 0)) + atr * 0.25
        : swings.filter(s => s.type === 'L' && s.price < entry - atr * 0.25).map(s => s.price).sort((a, b) => b - a)[0] ?? entry - atr * 1.3;
      zone = GoldEntryEngine.buildZone(entry, sl, atr, swings.filter(s => s.type === 'H').map(s => s.price));
      if (p.input.stopLoss != null) zone.stopLoss = toUsd(p.input.stopLoss + (thai ? ThaiGoldAdapter.spread(price) : 0));
    } else {
      const sh = p.input.stopLoss != null ? p.input.stopLoss - atr * 0.25
        : swings.filter(s => s.type === 'H' && s.price > entry + atr * 0.25).map(s => s.price).sort((a, b) => a - b)[0] ?? entry + atr * 1.3;
      const m = GoldEntryEngine.buildZone(-entry, -sh, atr, swings.filter(s => s.type === 'L').map(s => -s.price));
      zone = { ...m, side: 'SHORT', stopLoss: -m.stopLoss, tp1: -m.tp1, tp2: -m.tp2, tp3: -m.tp3, bestEntry: entry, entryLow: -m.entryHigh, entryHigh: -m.entryLow, chaseLevel: -m.chaseLevel };
      if (p.input.stopLoss != null) zone.stopLoss = p.input.stopLoss;
    }
    const initialStop = zone.stopLoss;
    const risk = Math.max(Math.abs(entry - initialStop), atr * 0.3);
    // ทองไทย: มูลค่าจริง = ราคารับซื้อ → หัก spread ออกจากกำไร และจุดคุ้มทุนต้องรวม spread
    const costUsd = thai ? ThaiGoldAdapter.spread(price) / ((price.usdThb ?? 1) * ThaiGoldAdapter.K) : 0;
    const breakeven = entry + dir * costUsd;
    const profitR = ((cur - entry) * dir - costUsd) / risk;

    // ── MFE / MAE ──
    let mfeR: number | null = null, maeR: number | null = null;
    let maxFav = cur;
    if (p.input.entryTime) {
      const since = h1.filter(k => k.time * 1000 >= p.input.entryTime! - 3600_000);
      if (since.length) {
        const hi = Math.max(...since.map(k => k.high)), lo = Math.min(...since.map(k => k.low));
        maxFav = side === 'LONG' ? hi : lo;
        mfeR = round2(Math.max(0, (side === 'LONG' ? hi - entry : entry - lo) / risk));
        maeR = round2(Math.max(0, (side === 'LONG' ? entry - lo : hi - entry) / risk));
      }
    }
    const reached = (lvl: number) => (maxFav - lvl) * dir >= 0 || (cur - lvl) * dir >= 0;
    const tp1Hit = reached(zone.tp1), tp2Hit = reached(zone.tp2), tp3Hit = reached(zone.tp3);

    // ── Trailing stop ──
    const better = (a: number, b: number) => side === 'LONG' ? Math.max(a, b) : Math.min(a, b);
    let trailing = initialStop;
    const bestR = Math.max(profitR, mfeR ?? profitR);
    if (bestR >= 1) trailing = better(trailing, breakeven);
    if (tp1Hit) {
      const swing = side === 'LONG'
        ? swings.filter(s => s.type === 'L' && s.price < cur).map(s => s.price).sort((a, b) => b - a)[0]
        : swings.filter(s => s.type === 'H' && s.price > cur).map(s => s.price).sort((a, b) => a - b)[0];
      trailing = better(trailing, cur - dir * atr * 1.5);
      if (swing != null) trailing = better(trailing, swing - dir * atr * 0.2);
    }
    if (tp2Hit) trailing = better(trailing, cur - dir * atr * 1.0);

    // ── Thesis health ──
    let health = 50 + dir * conviction.directionalBias / 2;
    if ((side === 'LONG' && structure.event === 'CHOCH_DOWN') || (side === 'SHORT' && structure.event === 'CHOCH_UP')) health -= 20;
    if ((side === 'LONG' && structure.event === 'BOS_UP') || (side === 'SHORT' && structure.event === 'BOS_DOWN')) health += 8;
    if (((cur - initialStop) * dir) / risk < 0.3) health -= 15;
    if (eventBlocked) health -= 5;
    const thesisHealth = Math.round(clamp(health, 0, 100));

    // ── Action ──
    const hold: GoldSignalState = side === 'LONG' ? 'HOLD_LONG' : 'HOLD_SHORT';
    let action: GoldSignalState = hold;
    let desc = 'ถือต่อ — แผนเดิมยังใช้ได้';
    const steps: string[] = [];
    const fmt = (v: number) => thai ? `${ThaiGoldAdapter.toBarBuy(v, price).toLocaleString()} บาท (ราคารับซื้อ)` : `$${round2(v)}`;
    const breachedInitial = (initialStop - cur) * dir >= 0;
    const breachedTrail = (trailing - cur) * dir >= 0;
    const shockAgainst = regime.state === 'SHOCK' && ((side === 'LONG' && conviction.directionalBias < -20) || (side === 'SHORT' && conviction.directionalBias > 20));

    if ((breachedInitial && Math.abs(cur - initialStop) > atr * 0.5) || shockAgainst) {
      action = 'EMERGENCY_EXIT';
      desc = shockAgainst ? 'ตลาดผันผวนรุนแรงสวนทาง Position — ปิดทันที' : 'ราคาทะลุ Stop Loss ไปไกลแล้ว — ปิดทันที อย่ารอให้กลับ';
      steps.push('ปิด Position ทั้งหมดทันที', 'ไม่เปิดใหม่จนกว่าระบบจะออกสัญญาณ READY อีกครั้ง');
    } else if (breachedInitial || breachedTrail) {
      action = 'EXIT';
      desc = breachedTrail && !breachedInitial ? `ราคาหลุด Trailing Stop ${fmt(trailing)} — ปิดเพื่อล็อกผลลัพธ์` : `ราคาถึง Stop Loss ${fmt(initialStop)} — ปิดตามแผน`;
      steps.push('ปิด Position ตามแผน', 'บันทึกผลเพื่อทบทวน');
    } else if (thesisHealth < 35) {
      action = 'EXIT';
      desc = 'เหตุผลที่เข้าเทรดเปลี่ยนไปแล้ว (Thesis Health ต่ำ) — ควรปิดหรือลดขนาด';
      steps.push('ปิดหรือลด Position อย่างน้อยครึ่งหนึ่ง', `หากยังถือ ใช้ Stop ${fmt(trailing)}`);
    } else if (tp2Hit || profitR >= 2.5) {
      action = 'PROTECT_PROFIT';
      desc = 'กำไรมากแล้ว — ทยอยขายเพิ่มและยก Trailing Stop';
      steps.push('ทยอยปิดเพิ่ม (รวมแล้วราว 70–80%)', `Trailing Stop ใหม่: ${fmt(trailing)}`, `ถือส่วนที่เหลือไป TP3 ${fmt(zone.tp3)}`, `หากหลุด ${fmt(trailing)} ปิดส่วนที่เหลือ`);
    } else if (tp1Hit || profitR >= 1.2) {
      action = 'TAKE_PARTIAL_PROFIT';
      desc = 'ถึง TP1 แล้ว — ทยอยทำกำไรบางส่วน และยก Stop ป้องกันเงินต้น';
      steps.push('ทยอยปิด 30–50% (หากยังไม่ได้ทำ)', `ยก Stop เป็น ${fmt(trailing)}`, `เป้าต่อไป TP2 ${fmt(zone.tp2)}`);
    } else {
      const toTp1 = Math.abs(zone.tp1 - cur) / risk;
      desc = toTp1 < 0.3 ? 'ถือต่อ — TP1 ใกล้ถึง ยังไม่จำเป็นต้องขายทั้งหมด' : 'ถือต่อ — แผนเดิมยังใช้ได้';
      steps.push(`Stop: ${fmt(trailing)}`, `TP1: ${fmt(zone.tp1)}`, bestR >= 1 ? 'Stop ถูกยกมาที่จุดคุ้มทุนแล้ว' : `เมื่อกำไรถึง 1R (${fmt(entry + dir * risk)}) ให้ยก Stop มาที่ทุน`);
    }

    const out = (v: number) => thai ? ThaiGoldAdapter.toBarBuy(v, price) : round2(v);
    const curOut = thai ? (price.thaiGoldBarBuy as number) : round2(cur);
    const profitPct = thai
      ? ((curOut - p.input.entryPrice) / p.input.entryPrice) * 100
      : ((cur - p.input.entryPrice) / p.input.entryPrice) * 100 * dir;

    return {
      side, unit: thai ? 'THB' : 'USD',
      entryPrice: p.input.entryPrice, currentPrice: curOut,
      profitPct: round2(profitPct), profitR: round2(profitR), mfeR, maeR,
      initialStop: out(initialStop), trailingStop: out(trailing),
      tp1: out(zone.tp1), tp2: out(zone.tp2), tp3: out(zone.tp3),
      thesisHealth, action, actionDescTh: desc, actionStepsTh: steps,
      tp1Hit, tp2Hit, tp3Hit,
    };
  }
}
