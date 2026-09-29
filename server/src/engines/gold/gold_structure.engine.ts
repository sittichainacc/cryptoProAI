/**
 * 🥇 GoldStructureEngine — Market Structure (HH/HL, LH/LL, BOS, CHOCH)
 */

import type { Candle } from '../../types/index.js';
import type { GoldStructureResult } from './gold_types.js';
import { findSwings, clamp, last, round2 } from './gold_indicators.js';

export class GoldStructureEngine {
  static evaluate(c: Candle[], label = '4H'): GoldStructureResult {
    const swings = findSwings(c.slice(-200), 3, 3);
    const highs = swings.filter(s => s.type === 'H');
    const lows = swings.filter(s => s.type === 'L');

    if (highs.length < 2 || lows.length < 2) {
      return { pattern: 'ข้อมูลไม่พอ', trend: 'NEUTRAL', lastSwingHigh: null, lastSwingLow: null, event: null, bias: 0, score: 50, descTh: `โครงสร้าง ${label} ยังระบุไม่ได้` };
    }

    const [h1, h2] = highs.slice(-2).map(s => s.price);
    const [l1, l2] = lows.slice(-2).map(s => s.price);
    const hh = h2 > h1, hl = l2 > l1;

    let trend: GoldStructureResult['trend'] = 'NEUTRAL';
    let pattern = 'Mixed / Range';
    if (hh && hl) { trend = 'BULLISH'; pattern = 'HH / HL — Bullish Structure'; }
    else if (!hh && !hl) { trend = 'BEARISH'; pattern = 'LH / LL — Bearish Structure'; }
    else if (hh && !hl) pattern = 'HH / LL — Expanding Range';
    else pattern = 'LH / HL — Contracting Range';

    const close = last(c).close;
    let event: GoldStructureResult['event'] = null;
    if (close > h2) event = trend === 'BEARISH' ? 'CHOCH_UP' : 'BOS_UP';
    else if (close < l2) event = trend === 'BULLISH' ? 'CHOCH_DOWN' : 'BOS_DOWN';

    let bias = trend === 'BULLISH' ? 50 : trend === 'BEARISH' ? -50 : 0;
    if (event === 'BOS_UP') bias += 30;
    if (event === 'CHOCH_UP') bias += 45;
    if (event === 'BOS_DOWN') bias -= 30;
    if (event === 'CHOCH_DOWN') bias -= 45;
    // ราคายังอยู่ในโครงสร้างไหม: ต่ำกว่า HL ล่าสุด = โครงสร้างขาขึ้นเสียหาย
    if (trend === 'BULLISH' && close < l2) bias -= 20;
    if (trend === 'BEARISH' && close > h2) bias += 20;
    bias = clamp(bias, -100, 100);

    const eventTh: Record<string, string> = {
      BOS_UP: `ราคาปิดเหนือ Swing High ${round2(h2)} (Break of Structure ขาขึ้น)`,
      BOS_DOWN: `ราคาปิดใต้ Swing Low ${round2(l2)} (Break of Structure ขาลง)`,
      CHOCH_UP: `CHOCH — ขาลงเปลี่ยนเป็นขาขึ้น ราคาปิดเหนือ ${round2(h2)}`,
      CHOCH_DOWN: `CHOCH — ขาขึ้นเปลี่ยนเป็นขาลง ราคาปิดใต้ ${round2(l2)}`,
    };

    const descTh = event
      ? eventTh[event]
      : trend === 'BULLISH'
        ? `${label}: Higher High / Higher Low — โครงสร้างขาขึ้นยังอยู่ ตราบใดที่ไม่หลุด ${round2(l2)}`
        : trend === 'BEARISH'
          ? `${label}: Lower High / Lower Low — โครงสร้างขาลง ตราบใดที่ไม่ผ่าน ${round2(h2)}`
          : `${label}: โครงสร้างผสม เคลื่อนไหวในกรอบ ${round2(l2)} – ${round2(h2)}`;

    return {
      pattern, trend,
      lastSwingHigh: round2(h2), lastSwingLow: round2(l2),
      event, bias, score: Math.round(50 + bias / 2), descTh,
    };
  }
}
