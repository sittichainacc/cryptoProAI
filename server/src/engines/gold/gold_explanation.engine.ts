/**
 * 🥇 GoldExplanationEngine — แปลผลเป็นภาษาคน
 * ตอบ: ตอนนี้ทำอะไร → เข้าแถวไหน → ผิดออกตรงไหน → กำไรตรงไหน → อะไรจะทำให้แผนเปลี่ยน
 */

import type {
  GoldSignalState, GoldEntryZone, GoldRegimeResult, GoldMacroResult, GoldOrderFlowResult, GoldIntermarketResult,
  GoldEventRiskResult, GoldTechnicalResult, GoldTradingMode, ThaiGoldPlan, GoldSetupCandidate, TradeSide,
} from './gold_types.js';

const usd = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const thb = (v: number) => `${v.toLocaleString('th-TH')} บาท`;

const SETUP_TH: Record<string, string> = {
  TREND_PULLBACK: 'Trend Pullback (ย่อในเทรนด์)',
  BREAKOUT_RETEST: 'Breakout Retest (ทะลุแล้วกลับมาทดสอบ)',
  LIQUIDITY_SWEEP_REVERSAL: 'Liquidity Sweep Reversal (กวาด Stop แล้วกลับตัว)',
  COMPRESSION_BREAKOUT: 'Compression Breakout (บีบตัวแล้วระเบิด)',
  MACRO_CONFIRMATION_ENTRY: 'Macro Confirmation (หลังข่าวและ Flow ยืนยัน)',
  NONE: '—',
};

export class GoldExplanationEngine {
  static setupName(t: string) { return SETUP_TH[t] ?? t; }

  static nowAction(state: GoldSignalState, side: TradeSide | null, e: GoldEntryZone | null, price: number, mode: GoldTradingMode, thai: ThaiGoldPlan | null, trigger: number | null): string {
    const buy = side === 'LONG' ? 'ซื้อ' : 'ขาย (Short)';
    const inZone = e && price >= e.entryLow && price <= e.entryHigh;
    if (mode === 'THAI_GOLD_BAR') {
      if (thai) {
        if (state === 'LONG_READY') return inZone ? `ซื้อทองคำแท่งได้ในโซน ${thb(thai.buyZoneLow)} – ${thb(thai.buyZoneHigh)}` : `รอซื้อทองคำแท่งในโซน ${thb(thai.buyZoneLow)} – ${thb(thai.buyZoneHigh)} — ไม่ไล่ซื้อเหนือ ${thb(thai.chaseAbove)}`;
        if (state === 'WAIT_FOR_PULLBACK') return `ยังไม่ซื้อ — รอราคาย่อมาที่ ${thb(thai.buyZoneLow)} – ${thb(thai.buyZoneHigh)}`;
      }
      if (state === 'NO_TRADE') return 'ยังไม่ใช่จังหวะซื้อทองคำแท่ง — ภาพรวมทองโลกพักฐาน/ปรับฐาน แนะนำถือเงินสด รอราคาย่อเข้าโซนรับที่ได้เปรียบ';
      if (state === 'WAIT_FOR_BREAKOUT') return 'ยังไม่ซื้อทองคำแท่ง — ราคากำลังบีบตัวในกรอบ รอยืนยันการทะลุกรอบก่อน';
    }
    switch (state) {
      case 'LONG_READY':
      case 'SHORT_READY':
        return inZone ? `${buy}ได้ในโซน ${usd(e!.entryLow)} – ${usd(e!.entryHigh)}` : `รอ${buy}บริเวณ Entry Zone ${usd(e!.entryLow)} – ${usd(e!.entryHigh)} — ไม่ไล่ราคา${side === 'LONG' ? 'เหนือ' : 'ต่ำกว่า'} ${usd(e!.chaseLevel)}`;
      case 'WAIT_FOR_PULLBACK': return e ? `ยังไม่เข้า — รอราคา${side === 'LONG' ? 'ย่อ' : 'เด้ง'}มาที่ ${usd(e.entryLow)} – ${usd(e.entryHigh)}` : 'ยังไม่เข้า — รอราคาย่อเข้าแนวรับ';
      case 'WAIT_FOR_BREAKOUT': return trigger ? `ยังไม่เข้า — รอราคาปิด 4H ${side === 'SHORT' ? 'ต่ำกว่า' : 'เหนือ'} ${usd(trigger)} ก่อน` : 'ยังไม่เข้า — รอ Breakout ยืนยัน';
      case 'WAIT_FOR_NEWS': return 'ยังไม่เปิด Position ใหม่ — รอข่าวสำคัญผ่านไปและราคายืนยันทิศทาง';
      case 'REVERSAL_WATCH': return 'ไม่ไล่ราคา — เฝ้าดูสัญญาณกลับตัว';
      case 'NO_TRADE': return 'ไม่เทรด — ความได้เปรียบยังไม่ชัดเจน';
      default: return '';
    }
  }

  static explain(p: {
    state: GoldSignalState; side: TradeSide | null; entry: GoldEntryZone | null; setup: GoldSetupCandidate | null;
    regime: GoldRegimeResult; technical: GoldTechnicalResult; macro: GoldMacroResult; flow: GoldOrderFlowResult;
    inter: GoldIntermarketResult; event: GoldEventRiskResult; mode: GoldTradingMode; thai: ThaiGoldPlan | null;
    waitLevels: { pullbackTo: number | null; breakoutAbove: number | null; breakdownBelow: number | null };
    reasonsAgainst: string[];
    thaiWatch?: { usd: number; baht: number }[] | null;
  }): string {
    const { state, side, entry: e, setup, regime, technical: t, macro, flow, inter, event, mode, thai, waitLevels } = p;
    const out: string[] = [];
    const long = side === 'LONG';
    const dxy = inter.items.find(i => i.key === 'dxy');

    const context: string[] = [];
    const htf = t.trendAlignment.perTimeframe.filter(x => x.timeframe === '4H' || x.timeframe === '1D');
    if (htf.length) context.push(`ภาพ ${htf.map(x => x.timeframe).join(' และ ')} ${htf.every(x => x.bias === 'BULLISH') ? 'ยังเป็นขาขึ้น' : htf.every(x => x.bias === 'BEARISH') ? 'เป็นขาลง' : 'ยังไม่ไปทางเดียวกัน'}`);
    if (dxy?.goldImpact === 'BULLISH') context.push('ดอลลาร์อ่อนลง');
    if (dxy?.goldImpact === 'BEARISH') context.push('ดอลลาร์แข็งขึ้น');
    if (macro.realYieldTrend === 'FALLING') context.push('Real Yield ลดลง');
    if (macro.realYieldTrend === 'RISING') context.push('Real Yield สูงขึ้น');
    if (flow.state.includes('ACCUMULATION')) context.push('COMEX Order Flow มีแรงสะสมซื้อ');
    if (flow.state.includes('DISTRIBUTION')) context.push('COMEX Order Flow มีแรงขาย');

    if ((state === 'LONG_READY' || state === 'SHORT_READY') && e) {
      if (mode === 'THAI_GOLD_BAR' && thai) {
        out.push(`ตอนนี้สามารถรอซื้อทองคำแท่งในโซน ${thb(thai.buyZoneLow)} – ${thb(thai.buyZoneHigh)} (ราคาขายออก) ได้`);
      } else {
        out.push(`ตอนนี้สามารถรอ${long ? 'ซื้อ' : 'ขาย Short'}ในโซน ${usd(e.entryLow)} – ${usd(e.entryHigh)} ได้ (Setup: ${GoldExplanationEngine.setupName(setup?.type ?? 'NONE')})`);
      }
      if (context.length) out.push(context.join(' ') + '');
      if (mode === 'THAI_GOLD_BAR' && thai) {
        out.push(`ไม่แนะนำไล่ซื้อหากราคาขายออกเกิน ${thb(thai.chaseAbove)} เพราะ Risk/Reward จะเริ่มไม่คุ้ม`);
        out.push(`หากซื้อแล้ว ให้ถือตามแผนตราบใดที่ราคารับซื้อไม่ต่ำกว่า ${thb(thai.invalidation)} · เป้าหมายแรก ${thb(thai.tp1)} (ราคารับซื้อ) ถึงแล้วทยอยขายบางส่วน`);
      } else {
        out.push(`ไม่แนะนำไล่${long ? 'ซื้อหากราคาขึ้นเกิน' : 'ขายหากราคาลงต่ำกว่า'} ${usd(e.chaseLevel)} เพราะ Risk/Reward จะเริ่มไม่คุ้ม`);
        out.push(`หากเข้าแล้ว ให้ถือแผนเดิมตราบใดที่ราคาไม่${long ? 'หลุด' : 'ผ่าน'} ${usd(e.stopLoss)} · ถึง TP1 ${usd(e.tp1)} ให้ทยอยทำกำไรบางส่วนและยก Stop มาที่ทุน`);
      }
      if (event.nextHighImpact && event.nextHighImpact.countdownMinutes < 24 * 60) out.push(`ระวัง: ${event.nextHighImpact.eventName} อีก ${event.nextHighImpact.countdown} — พิจารณาลดขนาด Position`);
    } else if (state === 'WAIT_FOR_PULLBACK') {
      out.push(`ทิศทางโดยรวม${long ? 'เป็นบวก' : 'เป็นลบ'} แต่ราคาตอนนี้ไม่ได้อยู่ในตำแหน่งที่คุ้มค่าจะเข้า`);
      if (context.length) out.push(context.join(' '));
      if (mode === 'THAI_GOLD_BAR' && thai) out.push(`รอราคาทองคำแท่งย่อมาที่ ${thb(thai.buyZoneLow)} – ${thb(thai.buyZoneHigh)} จะได้ R:R ที่ดีกว่า`);
      else if (e) out.push(`รอราคา${long ? 'ย่อ' : 'เด้ง'}มาที่ ${usd(e.entryLow)} – ${usd(e.entryHigh)} จะได้ R:R 1:${e.riskReward}`);
      if (t.rsiMatrix.hasOverboughtRisk && long) out.push('RSI หลาย Timeframe ร้อนแรง — ไม่ได้แปลว่าต้องขาย แต่ไม่ควรไล่ซื้อ');
    } else if (state === 'WAIT_FOR_BREAKOUT') {
      out.push('ราคายังอยู่ในกรอบ ยังไม่มีจุดเข้าที่ได้เปรียบ');
      if (waitLevels.breakoutAbove) out.push(`รอให้ 4H ปิดเหนือ ${usd(waitLevels.breakoutAbove)} แล้วค่อยพิจารณาเข้าหลัง Retest`);
      if (waitLevels.breakdownBelow) out.push(`หากหลุด ${usd(waitLevels.breakdownBelow)} ภาพจะเปลี่ยนเป็นลบ`);
    } else if (state === 'WAIT_FOR_NEWS') {
      out.push(event.blockReasonTh || 'มีข่าวสำคัญใกล้เกินไป');
      out.push('ข่าวระดับนี้ทำให้ราคาวิ่งทั้งสองทางได้แรงในไม่กี่นาที — รอ 2–3 แท่งเทียนหลังข่าวให้ทิศทางและ Order Flow ยืนยันก่อน');
    } else if (state === 'REVERSAL_WATCH') {
      out.push(`ราคา${regime.state === 'EXHAUSTION' ? 'มีสัญญาณหมดแรง' : 'สวนทางแผนเดิม'} — ${t.rsiMatrix.interpretationTh}`);
      out.push('ไม่เปิดใหม่ในทิศทางเดิม รอดูว่าโครงสร้างจะเปลี่ยน (CHOCH) หรือกลับมายืนในแนวโน้มเดิม');
    } else {
      out.push('ไม่มีจังหวะที่ดีพอสำหรับการเปิด Position ใหม่ในขณะนี้');
      if (p.reasonsAgainst.length) out.push('เหตุผล: ' + p.reasonsAgainst.slice(0, 4).join(' · '));
      const lv: string[] = [];
      if (waitLevels.pullbackTo) lv.push(`รอ ${usd(waitLevels.pullbackTo)}`);
      if (waitLevels.breakoutAbove) lv.push(`หรือ Breakout ${usd(waitLevels.breakoutAbove)}`);
      if (lv.length && mode !== 'THAI_GOLD_BAR') out.push(`แนะนำ: ${lv.join(' ')}`);
      if (mode === 'THAI_GOLD_BAR' && p.thaiWatch?.length) {
        out.push(`ระดับที่ควรเฝ้าดูสำหรับการซื้อทองคำแท่ง: ${p.thaiWatch.map(w => `${usd(w.usd)} ≈ ${thb(w.baht)}`).join(' · ')} — รอให้ภาพรวมกลับเป็นบวกก่อน`);
        out.push('หากมีทองอยู่แล้ว: ไม่จำเป็นต้องขายทั้งหมดเพราะสัญญาณระยะสั้น แต่ควรกำหนดจุดตัดขาดทุน/ลดสัดส่วนไว้ล่วงหน้า (กรอกราคาที่ซื้อในช่องติดตาม Position เพื่อให้ระบบคำนวณ)');
      }
      out.push('บางช่วงผลลัพธ์ที่ดีที่สุดคือ "ไม่เทรด" — รอจังหวะที่ข้อมูลหลายด้านสอดคล้องกัน');
    }
    return out.join('\n\n');
  }
}
