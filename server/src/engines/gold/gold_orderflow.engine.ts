/**
 * 🥇 GoldOrderFlowEngine — COMEX Gold Futures เป็นตัวแทน Order Flow
 * Spot Gold ไม่มี centralized order book → ใช้ COMEX GC (volume) + CFTC COT (OI/positioning)
 *
 * ข้อจำกัดที่ต้องบอกผู้ใช้ตรง ๆ:
 *  - CVD ที่นี่เป็น proxy (Close-Location-Value × Volume) จากแท่ง 1H ไม่ใช่ tick-level aggressor data
 *  - Open Interest มาจาก COT รายสัปดาห์ (ไม่ใช่ OI รายวันของ CME)
 *  - Large trades / order book imbalance ต้องใช้ CME market data feed แบบเสียเงิน → แสดงว่าไม่มีข้อมูล
 */

import type { Candle } from '../../types/index.js';
import type { GoldOrderFlowResult, GoldOrderFlowState } from './gold_types.js';
import type { CotReport } from './gold_data_hub.js';
import { clvDelta, clamp, round2, lastAtr, last } from './gold_indicators.js';

export class GoldOrderFlowEngine {
  static evaluate(h1: Candle[], d1: Candle[], cot: CotReport[] | null): GoldOrderFlowResult {
    // ── Volume 24h & RVOL (เทียบ 24h ย้อนหลัง 20 ช่วง) ──
    const lastT = last(h1).time;
    const vol24 = (end: number) => h1.filter(k => k.time > end - 86400 && k.time <= end).reduce((s, k) => s + k.volume, 0);
    const volNow = vol24(lastT);
    const hist: number[] = [];
    for (let i = 1; i <= 20; i++) { const v = vol24(lastT - i * 86400); if (v > 0) hist.push(v); }
    const avgVol = hist.length ? hist.reduce((s, v) => s + v, 0) / hist.length : 0;
    const rvol = avgVol > 0 && volNow > 0 ? round2(volNow / avgVol) : null;

    // ── CVD proxy 24h + 5 วัน ──
    const last24 = h1.filter(k => k.time > lastT - 86400);
    const last5d = h1.filter(k => k.time > lastT - 5 * 86400);
    const cvd24 = last24.reduce((s, k) => s + clvDelta(k), 0);
    const cvd5d = last5d.reduce((s, k) => s + clvDelta(k), 0);
    const vol5d = last5d.reduce((s, k) => s + k.volume, 0) || 1;
    const cvdRatio24 = volNow > 0 ? cvd24 / volNow : 0;   // -1..1
    const cvdRatio5d = cvd5d / vol5d;
    const cvdDirection = cvdRatio24 > 0.06 ? 'POSITIVE' as const : cvdRatio24 < -0.06 ? 'NEGATIVE' as const : 'NEUTRAL' as const;

    const px24 = last24.length ? (last(last24).close / last24[0].open - 1) * 100 : 0;
    const cvdDivergence = (px24 > 0.3 && cvdRatio24 < -0.04) || (px24 < -0.3 && cvdRatio24 > 0.04);

    // ── Absorption: volume สูงแต่ range แคบ ──
    const atr1h = lastAtr(h1);
    const avgBarVol = last5d.reduce((s, k) => s + k.volume, 0) / (last5d.length || 1);
    const absorption = last24.slice(-8).some(k => k.volume > avgBarVol * 2 && (k.high - k.low) < atr1h * 0.6);

    // ── COT ──
    let cotBlock: GoldOrderFlowResult['cot'] = null;
    let cotBias = 0;
    if (cot && cot.length > 0) {
      const latest = cot[0];
      const nets = cot.map(r => r.specNet);
      const pctile = Math.round((nets.filter(n => n <= latest.specNet).length / nets.length) * 100);
      // ราคา COMEX วันที่ของรายงานเทียบสัปดาห์ก่อน
      const at = (dateStr: string) => { const t = Date.parse(dateStr) / 1000 + 86400; return [...d1].reverse().find(k => k.time <= t)?.close ?? null; };
      const pNow = at(latest.date), pPrev = cot[1] ? at(cot[1].date) : null;
      const pChg = pNow && pPrev ? round2((pNow / pPrev - 1) * 100) : null;
      let priceVsOi = 'ไม่มีข้อมูลเพียงพอ';
      if (pChg != null) {
        const up = pChg > 0, oiUp = latest.oiChange > 0;
        priceVsOi = up && oiUp ? 'Price ↑ OI ↑ = เงินใหม่เข้าฝั่งซื้อ'
          : up && !oiUp ? 'Price ↑ OI ↓ = Short Covering (แรงซื้อไม่ใช่เงินใหม่)'
            : !up && oiUp ? 'Price ↓ OI ↑ = เงินใหม่เข้าฝั่งขาย'
              : 'Price ↓ OI ↓ = Long Liquidation';
        cotBias += up && oiUp ? 25 : up ? 8 : oiUp ? -25 : -8;
      }
      cotBias += clamp(latest.specNetChange / 1500, -15, 15);
      // Positioning แออัด = ความเสี่ยงกลับตัว (contrarian)
      if (pctile >= 90) cotBias -= 10;
      if (pctile <= 10) cotBias += 10;
      cotBlock = {
        reportDate: latest.date, openInterest: latest.openInterest, oiChangeWeek: latest.oiChange,
        specNet: latest.specNet, specNetChangeWeek: latest.specNetChange, specNetPercentile26w: pctile,
        priceChangeWeekPct: pChg, priceVsOi,
      };
    }

    // ── รวม bias ──
    const flowBias = clamp(cvdRatio24 * 250 * 0.45 + cvdRatio5d * 250 * 0.3, -75, 75);
    const volBoost = rvol && rvol > 1.2 ? 1.2 : rvol && rvol < 0.7 ? 0.7 : 1;
    let bias = clamp(flowBias * volBoost + cotBias, -100, 100);
    if (cvdDivergence) bias *= 0.5;

    const state: GoldOrderFlowState = bias >= 45 ? 'STRONG_ACCUMULATION' : bias >= 15 ? 'ACCUMULATION'
      : bias <= -45 ? 'STRONG_DISTRIBUTION' : bias <= -15 ? 'DISTRIBUTION' : 'NEUTRAL';

    // ── ความเชื่อมั่นของ proxy: ไม่มี tick data → เพดาน MEDIUM ──
    const cotAgeDays = cotBlock ? (Date.now() - Date.parse(cotBlock.reportDate)) / 86400_000 : Infinity;
    const confidenceScore = Math.min(55, 30 + (rvol != null ? 10 : 0) + (cotAgeDays <= 10 ? 15 : cotAgeDays <= 17 ? 8 : 0));
    const confidence: GoldOrderFlowResult['confidence'] = confidenceScore >= 50 ? 'MEDIUM' : 'LOW';
    const effBias = bias * (confidenceScore / 100);

    const priceVsVolume = `ราคา 24h ${px24 >= 0 ? '+' : ''}${px24.toFixed(2)}% · Volume ${rvol != null ? `${rvol}x ค่าเฉลี่ย` : 'ไม่มีข้อมูล'}`;
    const interp: Record<GoldOrderFlowState, string> = {
      STRONG_ACCUMULATION: 'แรงซื้อเด่นชัด — แท่งเทียนส่วนใหญ่ปิดใกล้ High พร้อม volume สูง',
      ACCUMULATION: 'มีแรงสะสมซื้อมากกว่าขาย',
      NEUTRAL: 'กระแสเงินทรงตัว ไม่มีฝั่งใดคุมตลาดชัดเจน',
      DISTRIBUTION: 'มีแรงขายสะสมมากกว่าซื้อ',
      STRONG_DISTRIBUTION: 'แรงขายหนัก — แท่งเทียนส่วนใหญ่ปิดใกล้ Low พร้อม volume สูง',
    };
    let interpretationTh = interp[state];
    if (cotBlock?.priceVsOi && cotBlock.priceVsOi !== 'ไม่มีข้อมูลเพียงพอ') interpretationTh += ` · COT สัปดาห์ล่าสุด: ${cotBlock.priceVsOi}`;
    if (cvdDivergence) interpretationTh += ' · ⚠ CVD Divergence: ราคาและแรงซื้อขายสวนทางกัน';
    if (absorption) interpretationTh += ' · พบ Absorption (volume สูงแต่ราคาไม่ไป)';
    if (cotBlock && cotBlock.specNetPercentile26w >= 90) interpretationTh += ' · ⚠ Speculator net long สูงสุดในรอบ 6 เดือน (Crowded)';

    return {
      state,
      comexVolume24h: volNow || null,
      rvol,
      cvdProxy24h: Math.round(cvd24),
      cvdDirection, cvdDivergence, absorption,
      cot: cotBlock,
      largeTrades: null,
      priceVsVolume,
      interpretationTh,
      methodNote: 'ORDER FLOW PROXY — ประมาณจาก OHLCV: CVD = Close-Location × Volume (1H, COMEX GC delayed) · OI/Positioning = CFTC COT รายสัปดาห์ · ไม่มี tick / aggressor / bid-ask / depth จึงถูกจำกัดน้ำหนักในการตัดสินใจ',
      confidence, confidenceScore,
      rawBias: Math.round(bias),
      bias: Math.round(effBias),
      score: Math.round(50 + effBias / 2),
    };
  }
}
