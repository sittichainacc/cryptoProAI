/**
 * 🥇 ThaiGoldAdapter — แปลงแผนทองโลก (XAU/USD) เป็นแผนทองคำแท่งไทย 96.5%
 *
 * ราคาอ้างอิงหลัก = สมาคมค้าทองคำ (ไม่คำนวณจาก XAU/USD อย่างเดียว)
 * ใช้ XAU/USD × USD/THB × K + Local Premium ที่วัดจากราคาประกาศจริง เพื่อแปลง "ระดับราคา" เท่านั้น
 *   K = 15.244 g × 0.965 / 31.1035 g ≈ 0.47295 (ทอง 1 บาท 96.5% ต่อ 1 troy oz)
 *
 * ฝั่งซื้อใช้ "ราคาขายออก" ของร้าน · TP/จุดยกเลิกใช้ "ราคารับซื้อ" (เงินที่ได้จริงเมื่อขายคืน) → รวม spread แล้ว
 */

import type { GoldPriceData, GoldEntryZone, ThaiGoldPlan, GoldIntermarketResult } from './gold_types.js';

const K = (15.244 * 0.965) / 31.1035;
const round50 = (n: number) => Math.round(n / 50) * 50;

export class ThaiGoldAdapter {
  static readonly K = K;

  static isAvailable(p: GoldPriceData): boolean {
    return p.thaiGoldBarSell != null && p.thaiGoldBarBuy != null && p.usdThb != null;
  }

  /** Local premium (บาท) = ราคาขายออกจริง − ราคาทฤษฎีจาก spot × FX */
  static premium(p: GoldPriceData): number {
    return (p.thaiGoldBarSell ?? 0) - p.xauUsd * (p.usdThb ?? 0) * K;
  }

  /** XAU spot level → ราคาขายออกทองแท่ง (บาท) */
  static toBarSell(level: number, p: GoldPriceData): number {
    return round50(level * (p.usdThb ?? 0) * K + ThaiGoldAdapter.premium(p));
  }

  /** XAU spot level → ราคารับซื้อทองแท่ง (บาท) */
  static toBarBuy(level: number, p: GoldPriceData): number {
    return ThaiGoldAdapter.toBarSell(level, p) - ThaiGoldAdapter.spread(p);
  }

  /** ราคาขายออก (บาท) → XAU spot เทียบเท่า */
  static fromBarSell(baht: number, p: GoldPriceData): number {
    return (baht - ThaiGoldAdapter.premium(p)) / ((p.usdThb ?? 1) * K);
  }

  static spread(p: GoldPriceData): number {
    return (p.thaiGoldBarSell ?? 0) - (p.thaiGoldBarBuy ?? 0);
  }

  static buildPlan(entry: GoldEntryZone, p: GoldPriceData, inter: GoldIntermarketResult, gold5dPct: number | null): ThaiGoldPlan | null {
    if (!ThaiGoldAdapter.isAvailable(p) || entry.side !== 'LONG') return null;
    const spread = ThaiGoldAdapter.spread(p);
    const warnings: string[] = [];

    const thb = inter.items.find(i => i.key === 'usdThb');
    const thb5 = thb?.change5dPct ?? null;
    if (thb5 != null && thb5 < -0.3 && (gold5dPct ?? 0) > 0) warnings.push('Gold Spot ขึ้น แต่เงินบาทแข็งค่า → ราคาทองไทยอาจขึ้นน้อยกว่าทองโลก');
    else if (thb5 != null && thb5 < -0.3) warnings.push(`เงินบาทแข็งค่า ${thb5}% ใน 5 วัน → กดราคาทองไทยเพิ่มจากทองโลก`);
    else if (thb5 != null && thb5 > 0.3) warnings.push(`เงินบาทอ่อนค่า +${thb5}% ใน 5 วัน → ทองไทยได้แรงหนุนเพิ่ม (หากบาทกลับแข็งจะกดราคาทองไทย)`);

    const breakevenMovePct = Math.round((spread / (p.thaiGoldBarSell ?? 1)) * 10000) / 100;
    warnings.push(`ซื้อที่ราคาขายออก ขายคืนที่ราคารับซื้อ — ราคาต้องขึ้นอย่างน้อย ${spread.toLocaleString()} บาท (${breakevenMovePct}%) จึงเริ่มมีกำไร`);
    warnings.push('สมาคมฯ ประกาศราคาเป็นรอบ ๆ ระหว่างวัน — ระดับราคาไทยเป็นค่าประมาณจากทองโลกและค่าเงิน ณ ขณะนี้');

    return {
      side: 'BUY',
      buyZoneLow: ThaiGoldAdapter.toBarSell(entry.entryLow, p),
      buyZoneHigh: ThaiGoldAdapter.toBarSell(entry.entryHigh, p),
      bestBuy: ThaiGoldAdapter.toBarSell(entry.bestEntry, p),
      chaseAbove: ThaiGoldAdapter.toBarSell(entry.chaseLevel, p),
      invalidation: ThaiGoldAdapter.toBarBuy(entry.stopLoss, p),
      tp1: ThaiGoldAdapter.toBarBuy(entry.tp1, p),
      tp2: ThaiGoldAdapter.toBarBuy(entry.tp2, p),
      tp3: ThaiGoldAdapter.toBarBuy(entry.tp3, p),
      spreadBaht: spread,
      breakevenMovePct,
      warningTh: warnings,
    };
  }
}
