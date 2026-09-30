/**
 * 🥇 GoldDecisionEngine — Orchestrator
 * Data Hub → Regime → Technical/Structure → Order Flow → Macro → Intermarket → News → Fundamental
 *   → Event Gate → Risk → Entry → Conviction (Pillars + Hard Gates) → Decision → Position → Explanation
 *
 * หลักการ: ไม่แจก Signal ตลอดเวลา — NO TRADE เมื่อความได้เปรียบไม่ชัด
 * คะแนนสูงด้านหนึ่งต้องไม่กลบความเสี่ยงอีกด้าน (Minimum Pillar Gate)
 */

import type { Candle } from '../../types/index.js';
import type {
  GoldSignalResponse, GoldTradingMode, GoldConvictionScore, GoldPillarScore, GoldTradePlan, GoldSignalState,
  GoldSignalStateInfo, GoldTechnicalResult, GoldOrderFlowResult, GoldMacroResult, GoldIntermarketResult,
  GoldNewsResult, GoldFundamentalResult, GoldRiskResult, GoldEventRiskResult, GoldRegimeResult, GoldSetupCandidate,
  GoldPriceData, TradeSide, GoldPosition, GoldBacktestResult, GoldDataQuality, GoldValidationStatus, GoldSignalResponse as _R,
} from './gold_types.js';
import { FedCalendarProvider, fallbackCalendar } from './gold_calendar.provider.js';
import { GoldDataQualityEngine } from './gold_data_quality.engine.js';
import { GoldMarketDataEngine, type GoldTimeframes } from './gold_market_data.engine.js';
import { fetchTreasuryYields, fetchBls, fetchCalendar, fetchCot, fetchGoldNews, getSourceStatuses } from './gold_data_hub.js';
import { GoldTechnicalEngine } from './gold_technical.engine.js';
import { GoldOrderFlowEngine } from './gold_orderflow.engine.js';
import { GoldMacroEngine } from './gold_macro.engine.js';
import { GoldIntermarketEngine } from './gold_intermarket.engine.js';
import { GoldNewsEngine } from './gold_news.engine.js';
import { GoldFundamentalEngine } from './gold_fundamental.engine.js';
import { GoldEventEngine } from './gold_event.engine.js';
import { GoldRegimeEngine } from './gold_regime.engine.js';
import { GoldRiskEngine } from './gold_risk.engine.js';
import { GoldEntryEngine } from './gold_entry.engine.js';
import { GoldPositionEngine, type UserPositionInput } from './gold_position.engine.js';
import { GoldExplanationEngine } from './gold_explanation.engine.js';
import { GoldBacktestEngine } from './gold_backtest.engine.js';
import { ThaiGoldAdapter } from './thai_gold.adapter.js';
import { alignedScore, round2, last, pctChange, clamp } from './gold_indicators.js';

export const DECISION_PARAMS = {
  directionThreshold: 12,   // |directional bias| ขั้นต่ำก่อนพิจารณาทิศทาง
  readyConviction: 65,      // Conviction ขั้นต่ำสำหรับ READY
  gatedScoreCap: 40,        // ถ้าไม่ผ่าน gate คะแนนรวมถูกจำกัด
  maxExtensionAtr: 2.5,     // ห่าง EMA20 4H ตามทิศเทรดเกินนี้ = ไล่ราคา
  minDataConfidence: 55,    // Data Confidence ต่ำกว่านี้ → ไม่ออก READY
};

const STATE_INFO: Record<GoldSignalState, { emoji: string; color: string; labelTh: string }> = {
  LONG_READY: { emoji: '🟢', color: '#10B981', labelTh: '🟢 สัญญาณเข้าพร้อม — พร้อมเข้าซื้อ' },
  SHORT_READY: { emoji: '⚪', color: '#6B7280', labelTh: 'ระบบมุ่งเน้นเฉพาะขาขึ้น (LONG ONLY)' },
  WAIT_FOR_PULLBACK: { emoji: '🟡', color: '#F59E0B', labelTh: '⏳ รอราคาย่อ — รอจังหวะพักตัวเข้าโซน' },
  WAIT_FOR_BREAKOUT: { emoji: '🟡', color: '#EAB308', labelTh: '⏳ รอทะลุแนว — รอยืนยันการ Breakout' },
  WAIT_FOR_NEWS: { emoji: '🟡', color: '#F59E0B', labelTh: '⚠️ รอข่าวสำคัญ — งดเปิดออเดอร์ใหม่' },
  REVERSAL_WATCH: { emoji: '🟡', color: '#F59E0B', labelTh: '👀 เฝ้าระวังกลับตัว — ไม่ไล่ราคา' },
  HOLD_LONG: { emoji: '🟢', color: '#10B981', labelTh: '🟢 ถือสถานะ Long ต่อ' },
  HOLD_SHORT: { emoji: '⚪', color: '#6B7280', labelTh: 'ระบบมุ่งเน้นเฉพาะขาขึ้น (LONG ONLY)' },
  PROTECT_PROFIT: { emoji: '🟠', color: '#F97316', labelTh: '🛡️ ป้องกันกำไร — เลื่อน Stop มาที่ทุน' },
  TAKE_PARTIAL_PROFIT: { emoji: '🟡', color: '#EAB308', labelTh: '🎯 ทยอยทำกำไรบางส่วน' },
  EXIT: { emoji: '🔴', color: '#EF4444', labelTh: '🔴 ปิดสถานะ (EXIT)' },
  EMERGENCY_EXIT: { emoji: '🚨', color: '#DC2626', labelTh: '🚨 ปิดสถานะทันที (EMERGENCY EXIT)' },
  NO_TRADE: { emoji: '🔴', color: '#EF4444', labelTh: '🔴 งดเทรด — รอจังหวะขาขึ้นที่ได้เปรียบ' },
};

const THAI_LABELS: Partial<Record<GoldSignalState, string>> = {
  LONG_READY: 'พร้อมซื้อทองคำแท่ง',
  WAIT_FOR_PULLBACK: 'รอซื้อทองคำแท่ง (รอราคาย่อ)',
  WAIT_FOR_BREAKOUT: 'รอซื้อทองคำแท่ง (รอยืนยันขาขึ้น)',
  NO_TRADE: 'ยังไม่ใช่จังหวะซื้อทองคำแท่ง',
  HOLD_LONG: 'ถือทองคำแท่งต่อ',
};

/** ตัดข้อความซ้ำหัวข้อเดียวกัน (ส่วนก่อน " — ") */
function dedupeByTopic(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter(x => { const k = x.split(' — ')[0]; if (seen.has(k)) return false; seen.add(k); return true; });
}

function shiftTf(tf: GoldTimeframes, d: number): GoldTimeframes {
  if (d === 0) return tf;
  const s = (c: Candle[]) => c.map(k => ({ ...k, open: k.open + d, high: k.high + d, low: k.low + d, close: k.close + d }));
  return { m5: s(tf.m5), m15: s(tf.m15), h1: s(tf.h1), h4: s(tf.h4), d1: s(tf.d1), w1: s(tf.w1) };
}

export class GoldDecisionEngine {
  static readonly ENGINE_VERSION = 'gold-v2.1.0';

  static async generateSignal(params: { mode?: GoldTradingMode; position?: UserPositionInput | null } = {}): Promise<GoldSignalResponse> {
    const mode = params.mode ?? 'XAU_USD_SPOT';

    // ═══ 1. Data ═══
    const [snap, yields, bls, primaryCalendar, cot, newsRaw, fed] = await Promise.all([
      GoldMarketDataEngine.load(), fetchTreasuryYields(), fetchBls(), fetchCalendar(), fetchCot(), fetchGoldNews(), FedCalendarProvider.get(),
    ]);
    const bt = GoldBacktestEngine.peek();
    // ปฏิทินหลักใช้ไม่ได้ → ใช้ปฏิทินสำรองจากประวัติ Nasdaq (ถ้าโหลดแล้ว)
    const calendar = primaryCalendar ?? fallbackCalendar(Date.now() - 7 * 86400_000, Date.now() + 8 * 86400_000);
    const calendarFallback = !primaryCalendar && !!calendar;
    const price = snap.price;
    // วิเคราะห์ในหน่วยราคาของโหมด: COMEX = ราคา futures, อื่น ๆ = spot (COMEX − basis)
    const tf = shiftTf(snap.tf, mode === 'COMEX_FUTURES' ? 0 : -price.comexBasis);

    // ═══ 2. Engines ═══
    const technical = GoldTechnicalEngine.evaluate(tf);
    const orderFlow = GoldOrderFlowEngine.evaluate(snap.tf.h1, snap.tf.d1, cot);
    const macro = GoldMacroEngine.evaluate(yields, bls, calendar, fed.meetings);
    const intermarket = GoldIntermarketEngine.evaluate(snap.intermarket, snap.tf.d1, macro);
    const news = GoldNewsEngine.evaluate(newsRaw);
    const fundamental = GoldFundamentalEngine.evaluate(macro, intermarket, orderFlow, news);
    const eventRisk = GoldEventEngine.evaluate(calendar, fed.meetings, bt?.eventStudy?.rows ?? null);
    const regime = GoldRegimeEngine.evaluate({ d1: tf.d1, technical, macro, intermarket, news });
    const dataQuality = GoldDataQualityEngine.evaluate({
      price, tf: snap.tf, intermarket, yields, bls, calendar, cot, news: newsRaw,
      newsReliability: news.latestEvents.length ? news.latestEvents.reduce((a, n) => a + n.reliability, 0) / news.latestEvents.length : 0,
      fundamental, orderFlow, fedHealth: fed.health, sources: getSourceStatuses(),
    });

    // ═══ 3. Direction (LONG ONLY — มุ่งเน้นเฉพาะขาขึ้น ไม่เทรดขาลง) ═══
    const directionalBias = GoldDecisionEngine.directionalBias(technical, orderFlow, macro, intermarket, news, fundamental);
    const direction: TradeSide | null = directionalBias >= DECISION_PARAMS.directionThreshold ? 'LONG' : null;
    // สัญญาณทองคำมุ่งเน้นเฉพาะฝั่งซื้อ/ขาขึ้นเท่านั้น (LONG ONLY) ทุกโหมดเทรด
    const evalSide: TradeSide = 'LONG';
    const risk = GoldRiskEngine.evaluate({ price, mode, technical, macro, intermarket, eventRisk, news, side: 'LONG' });

    // ═══ 4. Entry setups ═══
    const lastHigh = eventRisk.recentEvents.find(e => e.impact === 'HIGH');
    const setups = GoldEntryEngine.detect({
      h1: tf.h1, h4: tf.h4, side: 'LONG', flowBias: orderFlow.bias,
      macroEvent: lastHigh ? { minutesSince: -lastHigh.countdownMinutes, eventTime: Date.parse(lastHigh.timeIso) / 1000 } : null,
    });
    // ผูกผล validation เข้ากับการตัดสินใจจริง (setup ที่ถูก REJECT หรือ REJECT ใน regime ปัจจุบัน ห้าม READY)
    const d1Bias = technical.trendAlignment.perTimeframe.find(x => x.timeframe === '1D')?.bias;
    const trendKey = d1Bias === 'BULLISH' ? 'Bull' : d1Bias === 'BEARISH' ? 'Bear' : 'Sideways';
    for (const s of setups) {
      const b = bt?.bySetup.find(x => x.label === s.type);
      const cell = bt?.setupByTrend.find(c => c.setup === s.type && c.trend === trendKey && c.side === '*');
      s.track = b ? { trades: b.trades, winRateTp1: b.winRateTp1, expectancyR: b.expectancyR, hasEdge: b.status !== 'REJECT' && cell?.status !== 'REJECT' } : null;
    }

    // ═══ 5. Conviction ═══
    const conviction = GoldDecisionEngine.conviction(evalSide, direction, directionalBias, { technical, orderFlow, macro, intermarket, news, fundamental, risk, eventRisk, best: setups[0] ?? null }, dataQuality.dataConfidence);

    // ═══ 6. Decision ═══
    const tradePlan = GoldDecisionEngine.decide({ mode, price, tf, direction, evalSide, conviction, setups, regime, technical, orderFlow, macro, intermarket, eventRisk, risk, bt, dataQuality, trendKey, fundamental });
    const validation = GoldDecisionEngine.validation(bt, tradePlan.setups.find(x => x.type === tradePlan.setupType) ?? null, trendKey);

    // ═══ Alerts (ให้ Admin เห็น ไม่เงียบ) ═══
    const alerts: _R['alerts'] = [];
    if (fed.health.status !== 'HEALTHY') alerts.push({ level: fed.health.status === 'STALE' ? 'WARN' : 'ERROR', messageTh: `ปฏิทิน FOMC (${fed.health.status}): ${fed.health.message}` });
    if (!bt) alerts.push({ level: 'WARN', messageTh: 'Validation / Backtest กำลังคำนวณ — สัญญาณยังไม่ได้ผูกกับผลตรวจสอบย้อนหลัง' });
    else if (!bt.eventStudy) alerts.push({ level: 'WARN', messageTh: 'โหลดประวัติข่าวเศรษฐกิจไม่ได้ — Event window ใช้ค่าเริ่มต้น' });
    for (const src of getSourceStatuses().filter(x => x.status === 'UNAVAILABLE')) {
      alerts.push({ level: 'WARN', messageTh: `แหล่งข้อมูลใช้งานไม่ได้: ${src.label} (${src.source})${src.id === 'calendar' ? (calendarFallback ? ' — ใช้ปฏิทินสำรองจาก Nasdaq แทน' : ' — ไม่มีปฏิทินสำรอง Event Gate เหลือเฉพาะ FOMC') : ''}` });
    }
    if (dataQuality.level === 'LOW') alerts.push({ level: 'WARN', messageTh: `Data Confidence ต่ำ (${dataQuality.dataConfidence}) — ${dataQuality.noteTh}` });

    // ═══ 7. Position ═══
    let position: GoldPosition | null = null;
    if (params.position && params.position.entryPrice > 0) {
      position = GoldPositionEngine.evaluate({
        input: params.position, mode, price, h1: tf.h1, h4: tf.h4,
        conviction, structure: technical.structure, regime, planEntry: tradePlan.entry, eventBlocked: eventRisk.isBlocked,
      });
      if (position) {
        const info = STATE_INFO[position.action];
        tradePlan.signal = { state: position.action, ...info, labelTh: mode === 'THAI_GOLD_BAR' && THAI_LABELS[position.action] ? THAI_LABELS[position.action]! : info.labelTh, descTh: position.actionDescTh };
        tradePlan.nowActionTh = position.actionDescTh;
      }
    }

    return {
      price, mode, regime, technical, orderFlow, macro, intermarket, news, fundamental, risk, eventRisk,
      conviction, tradePlan, position, validation, dataQuality, alerts,
      dataSources: getSourceStatuses(),
      generatedAt: new Date().toISOString(),
      engineVersion: GoldDecisionEngine.ENGINE_VERSION,
      disclaimerTh: 'ระบบนี้ไม่ได้อ้างว่าแม่นยำ 100% — ออกแบบให้เลือกเทรดเฉพาะจังหวะที่ข้อมูลหลายด้านสอดคล้องกัน และ NO TRADE เมื่อความได้เปรียบไม่ชัด · ข้อมูลตลาดบางส่วนล่าช้า (delayed) · ไม่ใช่คำแนะนำการลงทุน',
    };
  }

  static directionalBias(t: GoldTechnicalResult, f: GoldOrderFlowResult, m: GoldMacroResult, i: GoldIntermarketResult, n: GoldNewsResult, fu: GoldFundamentalResult): number {
    // Order Flow เป็น proxy → น้ำหนักต่ำ (และ bias ถูกหักด้วย confidence แล้ว) · Fundamental หดตาม coverage · ข่าวหดตามจำนวน
    const parts: [number, number][] = [
      [t.bias, 0.28], [t.structure.bias, 0.12], [f.bias, 0.06], [m.bias, 0.18], [i.bias, 0.15],
      [n.bias * Math.min(1, n.latestEvents.length / 10), 0.05],
      [fu.overallScore != null ? fu.bias * (fu.coveragePct / 100) : 0, 0.10],
    ];
    const w = parts.reduce((s, p) => s + p[1], 0);
    return Math.round(parts.reduce((s, p) => s + p[0] * p[1], 0) / w);
  }

  private static conviction(side: TradeSide, direction: TradeSide | null, directionalBias: number, e: {
    technical: GoldTechnicalResult; orderFlow: GoldOrderFlowResult; macro: GoldMacroResult; intermarket: GoldIntermarketResult;
    news: GoldNewsResult; fundamental: GoldFundamentalResult; risk: GoldRiskResult; eventRisk: GoldEventRiskResult; best: GoldSetupCandidate | null;
  }, dataConfidence: number): GoldConvictionScore {
    const a = (bias: number) => alignedScore(bias, side);
    const impactScore = (key: string) => {
      const it = e.intermarket.items.find(x => x.key === key);
      if (!it?.available) return null;
      return a(it.goldImpact === 'BULLISH' ? 50 : it.goldImpact === 'BEARISH' ? -50 : 0);
    };
    const riskItem = (name: string) => e.risk.items.find(x => x.name === name)?.score ?? 50;

    const P = (name: string, nameTh: string, score: number | null, weight: number, minGate: number | null): GoldPillarScore => ({
      name, nameTh, score, weight, minGate, isGatePass: score == null || minGate == null || score >= minGate,
    });
    const pillars: GoldPillarScore[] = [
      P('Technical', 'เทคนิคัล', a(e.technical.bias), 0.16, 45),
      P('Market Structure', 'โครงสร้างตลาด', a(e.technical.structure.bias), 0.10, 40),
      P('Order Flow', 'Order Flow (Proxy)', a(e.orderFlow.bias), 0.05, 30),
      P('Macro/Fed', 'มหภาค / Fed', a(e.macro.bias), 0.12, 35),
      P('USD', 'ดอลลาร์', impactScore('dxy'), 0.07, 25),
      P('Real Yield', 'Real Yield', impactScore('realYield'), 0.07, 25),
      P('Intermarket', 'Intermarket', a(e.intermarket.bias), 0.08, 30),
      P('Fundamental', 'ปัจจัยพื้นฐานทอง', e.fundamental.overallScore != null ? a(e.fundamental.bias * (e.fundamental.coveragePct / 100)) : null, 0.06, null),
      P('News', 'ข่าวสาร', e.news.latestEvents.length ? a(e.news.bias * Math.min(1, e.news.latestEvents.length / 10)) : null, 0.04, null),
      P('Entry', 'คุณภาพจุดเข้า', e.best?.ready ? e.best.quality : e.best ? Math.min(45, e.best.quality) : 20, 0.10, null),
      P('Risk', 'ความเสี่ยงรวม', 100 - e.risk.overall, 0.05, 25),
      P('Event Risk', 'ความเสี่ยงข่าว', 100 - riskItem('Macro Event Risk'), 0.03, 25),
      P('Execution', 'การส่งคำสั่ง', 100 - riskItem('Execution Risk'), 0.02, 25),
    ];

    // ข้อมูลที่ขาด = กลาง (50) ไม่ใช่ตัดทิ้ง → คะแนนไม่ดูดีเพราะตัวแปรลบหายไป
    const avail = pillars.filter(p => p.score != null);
    const wSum = avail.reduce((s, p) => s + p.weight, 0);
    const wAll = pillars.reduce((s, p) => s + p.weight, 0);
    const raw = Math.round(pillars.reduce((s, p) => s + (p.score ?? 50) * p.weight, 0) / wAll);
    const blocked = pillars.filter(p => !p.isGatePass);
    const isAllGatesPass = blocked.length === 0 && (directionalBias >= 0);
    const totalScore = isAllGatesPass ? raw : Math.min(raw, DECISION_PARAMS.gatedScoreCap);

    return {
      side: 'LONG', direction: direction ?? 'LONG', directionalBias,
      pillars, rawScore: raw, totalScore, isAllGatesPass,
      blockedPillars: [
        ...blocked.map(p => `${p.nameTh} (${p.score} < ${p.minGate})`),
        ...(directionalBias <= -DECISION_PARAMS.directionThreshold ? ['ภาพรวมตลาดเป็นขาลง — ระบบมุ่งเน้นเฉพาะจังหวะขาขึ้น (LONG ONLY)'] : direction === null ? ['ทิศทางรวมยังไม่ชัดเจน'] : []),
      ],
      dataCoveragePct: Math.round((wSum / wAll) * 100),
      effectiveScore: Math.round(totalScore * (dataConfidence / 100)),
    };
  }

  private static decide(p: {
    mode: GoldTradingMode; price: GoldPriceData; tf: GoldTimeframes; direction: TradeSide | null; evalSide: TradeSide;
    conviction: GoldConvictionScore; setups: GoldSetupCandidate[]; regime: GoldRegimeResult; technical: GoldTechnicalResult;
    orderFlow: GoldOrderFlowResult; macro: GoldMacroResult; intermarket: GoldIntermarketResult; eventRisk: GoldEventRiskResult; risk: GoldRiskResult;
    bt: GoldBacktestResult | null; dataQuality: GoldDataQuality; trendKey: string; fundamental: GoldFundamentalResult;
  }): GoldTradePlan {
    const { mode, price, tf, direction, conviction, setups, regime, technical: t, orderFlow, macro, intermarket, eventRisk, risk, bt, dataQuality } = p;
    const cur = last(tf.h1).close;
    const thaiMode = mode === 'THAI_GOLD_BAR';
    const evalSide: TradeSide = 'LONG';
    const long = true; // มุ่งเน้นเฉพาะขาขึ้น (LONG ONLY)
    const noEdge = setups.filter(s => s.ready && s.track && !s.track.hasEdge);
    const best = setups.find(s => s.ready && s.track?.hasEdge !== false) ?? null;
    const compression = setups.find(s => s.type === 'COMPRESSION_BREAKOUT' && !s.ready) ?? null;
    const exhaustionAgainst = regime.state === 'EXHAUSTION' && t.rsiMatrix.hasOverboughtRisk;

    const nonEventBlocked = conviction.pillars.filter(x => !x.isGatePass && x.name !== 'Event Risk');
    const reasonsAgainst: string[] = noEdge.map(s => `Setup ${GoldExplanationEngine.setupName(s.type)} ถูก REJECT จาก validation (${s.track!.expectancyR}R จาก ${s.track!.trades} เทรด หรือติดลบใน regime ${p.trendKey}) — ไม่ใช้เป็นสัญญาณเข้า`);
    const validationRejected = bt?.validation.status === 'REJECTED';
    const lowData = dataQuality.dataConfidence < DECISION_PARAMS.minDataConfidence;
    let state: GoldSignalState;
    let chosen: GoldSetupCandidate | null = null;

    if (eventRisk.isBlocked) {
      state = 'WAIT_FOR_NEWS';
      chosen = best;
    } else if (regime.state === 'SHOCK') {
      state = 'NO_TRADE';
      reasonsAgainst.push('ตลาดผันผวนรุนแรงผิดปกติ (Shock)');
    } else if (conviction.directionalBias <= -DECISION_PARAMS.directionThreshold) {
      // 🛑 ภาพรวมตลาดเป็นขาลง — ระบบมุ่งเน้นเฉพาะขาขึ้น (LONG ONLY) จึงไม่ออก Short และงดเทรด
      state = 'NO_TRADE';
      reasonsAgainst.push('ภาพรวมตลาดทองคำอยู่ในทิศทางขาลง — ระบบมุ่งเน้นเฉพาะจังหวะขาขึ้น (LONG ONLY) ไม่เปิด Short ควรรอการสร้างฐานราคาหรือสัญญาณกลับตัวชัดเจนก่อน');
    } else if (direction === null) {
      state = compression ? 'WAIT_FOR_BREAKOUT' : 'NO_TRADE';
      chosen = compression;
      reasonsAgainst.push(`ปัจจัยหลายด้านขัดแย้งกัน (Directional bias ${conviction.directionalBias})`);
    } else if (validationRejected) {
      state = 'NO_TRADE';
      reasonsAgainst.push('Backtest/Validation ไม่พบ edge (REJECTED) — ระบบงดออกสัญญาณเข้าจนกว่าจะปรับโมเดล');
    } else if (nonEventBlocked.length > 0) {
      state = 'NO_TRADE';
      reasonsAgainst.push(...nonEventBlocked.map(x => `${x.nameTh} ไม่ผ่านเกณฑ์ขั้นต่ำ (${x.score}/${x.minGate})`));
    } else if (exhaustionAgainst) {
      state = 'REVERSAL_WATCH';
      chosen = best;
    } else if (best) {
      chosen = best;
      const stretched = t.meanReversion.deviationAtr >= DECISION_PARAMS.maxExtensionAtr;
      if (best.extended) state = 'WAIT_FOR_PULLBACK';
      else if (stretched) {
        state = 'WAIT_FOR_PULLBACK';
        reasonsAgainst.push(`ราคายืดตัว ${Math.abs(t.meanReversion.deviationAtr)} ATR จาก EMA20 4H — ไม่ไล่ราคา`);
      }
      else if (conviction.totalScore < DECISION_PARAMS.readyConviction) {
        state = 'WAIT_FOR_PULLBACK';
        reasonsAgainst.push(`Conviction ${conviction.totalScore} ยังต่ำกว่าเกณฑ์ READY (${DECISION_PARAMS.readyConviction})`);
      } else if (best.zone && cur < best.zone.entryLow) {
        state = 'REVERSAL_WATCH';
        reasonsAgainst.push('ราคาทะลุโซนเข้าไปแล้ว — รอยืนกลับในโซนก่อน');
      } else if (lowData) {
        state = 'NO_TRADE';
        reasonsAgainst.push(`Data Confidence ${dataQuality.dataConfidence} ต่ำกว่าเกณฑ์ ${DECISION_PARAMS.minDataConfidence} — ข้อมูลไม่พอสำหรับสัญญาณเข้า`);
      } else {
        state = 'LONG_READY';
      }
    } else if (compression) {
      state = 'WAIT_FOR_BREAKOUT';
      chosen = compression;
    } else {
      chosen = setups[0] ?? null;
      state = chosen?.zone ? 'WAIT_FOR_PULLBACK' : 'NO_TRADE';
      if (!chosen) reasonsAgainst.push('ไม่พบ Setup ที่เข้าเงื่อนไข');
    }

    const entry = (state === 'NO_TRADE' ? null : chosen?.zone) ?? null;
    const waitLevels = {
      pullbackTo: entry?.bestEntry ?? t.supportResistance.supports[0] ?? null,
      breakoutAbove: compression?.triggerLevel != null ? compression.triggerLevel : t.breakout.donchianHigh,
      breakdownBelow: null, // ไม่มีขาลง
    };

    // ═══ การจัดเกรดสัญญาณเข้า (สีเขียว ไป แดง และ สีทองกระพริบเมื่อดีที่สุด) ═══
    const isBestGold = Boolean(
      state === 'LONG_READY' &&
      conviction.totalScore >= 70 &&
      conviction.isAllGatesPass &&
      chosen?.inZone &&
      best?.track?.hasEdge !== false
    );

    const tier: 'BEST_GOLD' | 'READY_GREEN' | 'WAIT_AMBER' | 'NO_TRADE_RED' = 
      isBestGold ? 'BEST_GOLD'
      : state === 'LONG_READY' ? 'READY_GREEN'
      : (state === 'WAIT_FOR_PULLBACK' || state === 'WAIT_FOR_BREAKOUT' || state === 'WAIT_FOR_NEWS' || state === 'REVERSAL_WATCH') ? 'WAIT_AMBER'
      : 'NO_TRADE_RED';

    const info = STATE_INFO[state];
    const signalColor = isBestGold ? '#F59E0B' : (tier === 'READY_GREEN' ? '#10B981' : (tier === 'WAIT_AMBER' ? '#F59E0B' : '#EF4444'));
    const signalEmoji = isBestGold ? '👑' : (tier === 'READY_GREEN' ? '🟢' : (tier === 'WAIT_AMBER' ? '🟡' : '🔴'));
    const signalLabel = isBestGold 
      ? '👑 สัญญาณทองระดับดีที่สุด (SUPREME GOLD)'
      : (state === 'LONG_READY' 
          ? (thaiMode ? '🟢 พร้อมซื้อทองคำแท่ง' : '🟢 สัญญาณเข้าพร้อม (READY TO BUY)')
          : (thaiMode && THAI_LABELS[state] ? `${THAI_LABELS[state]}` : info.labelTh));

    const signal: GoldSignalStateInfo = {
      state,
      ...info,
      tier,
      isBestGold,
      color: signalColor,
      emoji: signalEmoji,
      labelTh: signalLabel,
      descTh: isBestGold 
        ? 'เข้าเกณฑ์จังหวะสะสมดีที่สุด: ราคาอยู่ในโซน Confluence สำคัญ เสาหลักทุกมิติยืนยันแข็งแกร่ง และความคุ้มค่า R:R สูงสุด'
        : GoldDecisionEngine.stateDesc(state, true, thaiMode),
    };

    const g5 = pctChange(tf.d1[tf.d1.length - 6]?.close, last(tf.d1).close);
    const thaiGoldEntry = thaiMode && entry && entry.side === 'LONG' ? ThaiGoldAdapter.buildPlan(entry, price, intermarket, g5) : null;

    // ทุกโหมดมองจากมุมผู้ซื้อขาขึ้น (LONG ONLY)
    const viewSide: TradeSide = 'LONG';
    const whyNow = GoldDecisionEngine.whyNow(viewSide, t, orderFlow, macro, intermarket, regime, eventRisk, chosen);
    const whyNot = [...reasonsAgainst, ...GoldDecisionEngine.whyNot(viewSide, t, orderFlow, macro, intermarket, eventRisk, risk, chosen, cur)];
    // ข้อจำกัดของข้อมูลและ validation — ให้ผู้ใช้เห็นเงื่อนไข ไม่ใช่แค่ป้าย READY
    const nearLvl = viewSide === 'LONG' ? t.supportResistance.resistances[0] : t.supportResistance.supports[0];
    if (nearLvl != null && Math.abs(nearLvl - cur) < t.volatility.atr4h) whyNot.push(`${viewSide === 'LONG' ? 'แนวต้าน' : 'แนวรับ'}ใกล้ $${nearLvl} (ห่าง ${round2(Math.abs(nearLvl - cur) / (t.volatility.atr4h || 1))} ATR)`);
    if (orderFlow.confidence !== 'HIGH') whyNot.push(`Order Flow เป็น proxy จาก OHLCV (ความเชื่อมั่น ${orderFlow.confidence})`);
    if (p.fundamental.coveragePct < 60) whyNot.push(`ข้อมูลปัจจัยพื้นฐานครอบคลุมเพียง ${p.fundamental.coveragePct}%`);
    const watchOut = GoldDecisionEngine.watchOut(eventRisk, risk, t, price, orderFlow);
    const whatChanges = GoldDecisionEngine.whatChanges(viewSide, t, entry, macro);
    const thaiWatch = thaiMode && ThaiGoldAdapter.isAvailable(price)
      ? t.supportResistance.supports.slice(0, 3).map(v => ({ usd: v, baht: ThaiGoldAdapter.toBarSell(v, price) }))
      : null;

    return {
      signal, direction: 'LONG',
      entry, priceUnit: mode === 'COMEX_FUTURES' ? 'USD_COMEX' : 'USD_SPOT',
      setupType: chosen?.type ?? 'NONE', setups,
      confidence: conviction.totalScore,
      nowActionTh: GoldExplanationEngine.nowAction(state, evalSide, entry, cur, mode, thaiGoldEntry, compression?.triggerLevel ?? null),
      whyNow, whyNot: dedupeByTopic(whyNot), watchOut, whatChanges, waitLevels,
      aiExplanationTh: GoldExplanationEngine.explain({ state, side: evalSide, entry, setup: chosen, regime, technical: t, macro, flow: orderFlow, inter: intermarket, event: eventRisk, mode, thai: thaiGoldEntry, waitLevels, reasonsAgainst, thaiWatch }),
      thaiGoldEntry,
    };
  }

  static validation(bt: GoldBacktestResult | null, setup: GoldSetupCandidate | null, trendKey: string): GoldValidationStatus {
    if (!bt) {
      return {
        available: false, status: 'VALIDATING', statusTh: '⏳ กำลังคำนวณ Validation', historicalExpectancyR: null, recentExpectancyR: null,
        walkForwardOosR: null, stability: null, sampleSize: 0, setupStatus: null, setupRegimeStatus: null, setupTrack: null,
        winProbability: { calibrated: false, pTp1: null, pTp2: null, expectedR: null, noteTh: 'รอผล Backtest' },
      };
    }
    const v = bt.validation;
    const sb = setup ? bt.bySetup.find(b => b.label === setup.type) ?? null : null;
    const cell = setup ? bt.setupByTrend.find(c => c.setup === setup.type && c.trend === trendKey && c.side === '*') ?? null : null;
    let win: GoldValidationStatus['winProbability'];
    if (bt.calibration.calibrated && setup) {
      const q = setup.quality;
      const row = bt.calibration.rows.find(r => {
        const [lo, hi] = r.bucket.startsWith('<') ? [0, 60] : r.bucket.split('–').map(Number);
        return q >= lo && q <= (hi ?? 100);
      });
      win = { calibrated: true, pTp1: row?.calibratedPTp1 ?? null, pTp2: row?.calibratedPTp2 ?? null, expectedR: row?.calibratedExpR ?? null, noteTh: `Calibrated (isotonic) จาก ${v.sampleSize} เทรดย้อนหลัง` };
    } else {
      win = {
        calibrated: false, pTp1: null, pTp2: null, expectedR: null,
        noteTh: `Not calibrated — คะแนนสูงยังไม่ได้ชนะบ่อยกว่าในอดีต${sb ? ` · อัตราฐานของ Setup นี้: ถึง TP1 ${sb.winRateTp1}% · ${sb.expectancyR >= 0 ? '+' : ''}${sb.expectancyR}R/เทรด (${sb.trades} เทรด)` : ''}`,
      };
    }
    return {
      available: true, status: v.status, statusTh: v.statusTh,
      historicalExpectancyR: v.historicalExpectancyR, recentExpectancyR: v.recentExpectancyR, walkForwardOosR: v.walkForwardOosR,
      stability: v.stability, sampleSize: v.sampleSize,
      setupStatus: sb?.status ?? null, setupRegimeStatus: cell?.status ?? null,
      setupTrack: sb ? { trades: sb.trades, winRateTp1: sb.winRateTp1, expectancyR: sb.expectancyR } : null,
      winProbability: win,
    };
  }

  private static stateDesc(s: GoldSignalState, long: boolean, thai: boolean): string {
    const m: Partial<Record<GoldSignalState, string>> = {
      LONG_READY: thai ? 'สัญญาณเข้าพร้อม: ซื้อทองคำแท่งได้ในโซนที่กำหนด ไม่ไล่ซื้อเหนือราคาที่ระบุ' : 'สัญญาณเข้าพร้อม: ราคาอยู่ในโซนที่ได้เปรียบ สามารถเปิดสถานะ Long ได้ ไม่ไล่ราคาเกิน Chase Level',
      SHORT_READY: 'ระบบมุ่งเน้นเฉพาะกลยุทธ์ขาขึ้น (LONG ONLY)',
      WAIT_FOR_PULLBACK: 'ทิศทางขาขึ้นแข็งแรง แต่ราคายังไม่อยู่ในตำแหน่งที่คุ้มค่า — รอราคาย่อเข้าโซนสะสม',
      WAIT_FOR_BREAKOUT: 'ราคาอยู่ในกรอบบีบตัว — รอยืนยันการทะลุกรอบขาขึ้นก่อน',
      WAIT_FOR_NEWS: 'มีข่าวสำคัญใกล้เกินไป — รอข่าวสำคัญผ่านไปและราคายืนยันทิศทางก่อน',
      REVERSAL_WATCH: 'ราคาหมดแรง/ทดสอบแนวรับ — เฝ้าดูการกลับตัว ไม่ไล่ราคา',
      NO_TRADE: 'ความได้เปรียบยังไม่ชัดเจนหรือตลาดเป็นขาลง — แนะนำถือเงินสด รอจังหวะขาขึ้นที่คุ้มค่า',
    };
    return m[s] ?? '';
  }

  private static whyNow(side: TradeSide, t: GoldTechnicalResult, f: GoldOrderFlowResult, m: GoldMacroResult, i: GoldIntermarketResult, r: GoldRegimeResult, ev: GoldEventRiskResult, setup: GoldSetupCandidate | null): string[] {
    const L = side === 'LONG';
    const out: string[] = [];
    const htf = t.trendAlignment.perTimeframe.filter(x => x.timeframe === '4H' || x.timeframe === '1D');
    if (htf.length && htf.every(x => x.bias === (L ? 'BULLISH' : 'BEARISH'))) out.push(`${htf.map(x => x.timeframe).join(' / ')} Trend ${L ? 'ขาขึ้น' : 'ขาลง'}`);
    if (t.structure.trend === (L ? 'BULLISH' : 'BEARISH')) out.push(`โครงสร้าง 4H ${t.structure.pattern.split(' — ')[0]}`);
    if (setup?.inZone) out.push('ราคาอยู่ในโซนเข้า (ไม่ต้องไล่ราคา)');
    if ((L ? !t.rsiMatrix.hasOverboughtRisk : !t.rsiMatrix.hasOversoldRisk) && Math.abs(t.meanReversion.deviationAtr) < 1.5) out.push('ไม่ Overextended (RSI ไม่สุดโต่ง ราคาไม่ไกล EMA20)');
    if (f.state.includes(L ? 'ACCUMULATION' : 'DISTRIBUTION')) out.push(`COMEX Flow เป็น ${L ? 'Accumulation' : 'Distribution'}`);
    const dxy = i.items.find(x => x.key === 'dxy');
    if (dxy?.goldImpact === (L ? 'BULLISH' : 'BEARISH')) out.push(L ? 'USD อ่อนค่า' : 'USD แข็งค่า');
    if (m.realYieldTrend === (L ? 'FALLING' : 'RISING')) out.push(`Real Yield ${L ? 'ลดลง' : 'เพิ่มขึ้น'}`);
    if (m.macroSentiment === (L ? 'BULLISH_GOLD' : 'BEARISH_GOLD')) out.push('Macro สนับสนุน');
    if (!ev.isBlocked && (ev.nextHighImpact?.countdownMinutes ?? Infinity) > 360) out.push('ไม่มี High Impact Event ใกล้เกินไป');
    if (setup?.zone && setup.zone.riskReward >= 1.8) out.push(`R:R 1:${setup.zone.riskReward} ผ่านเกณฑ์`);
    if (r.safeHaven !== 'NORMAL' && L) out.push('Safe-haven demand สูง');
    return out;
  }

  private static whyNot(side: TradeSide, t: GoldTechnicalResult, f: GoldOrderFlowResult, m: GoldMacroResult, i: GoldIntermarketResult, ev: GoldEventRiskResult, risk: GoldRiskResult, setup: GoldSetupCandidate | null, cur: number): string[] {
    const L = side === 'LONG';
    const out: string[] = [];
    if (setup?.zone && !setup.inZone) {
      const dist = Math.abs(cur - setup.zone.bestEntry);
      out.push(`ราคาห่าง Best Entry ${round2(dist)} (${round2(dist / (t.volatility.atr4h || 1))} ATR)`);
    }
    if (setup?.extended) out.push(`ราคาเลย Chase Level แล้ว — R:R ไม่คุ้ม`);
    const ext = L ? t.meanReversion.deviationAtr : -t.meanReversion.deviationAtr;
    if (ext >= 2) out.push(`ราคายืดตัว ${Math.abs(t.meanReversion.deviationAtr)} ATR จาก EMA20 4H — เสี่ยงเด้งสวน`);
    if (L && t.rsiMatrix.hasOverboughtRisk) out.push('RSI หลาย TF ร้อนแรง — เสี่ยงไล่ราคา');
    if (!L && t.rsiMatrix.hasOversoldRisk) out.push('RSI หลาย TF ต่ำมาก — เสี่ยงไล่ขาย');
    if (L && t.rsiMatrix.hasBearishDivergence) out.push('Bearish Divergence บน 4H');
    if (!L && t.rsiMatrix.hasBullishDivergence) out.push('Bullish Divergence บน 4H');
    if (m.realYieldTrend === (L ? 'RISING' : 'FALLING')) out.push(`Real Yield ${L ? 'กำลังพุ่ง' : 'กำลังลด'} (${m.realYieldChange20dBp}bp/20 วัน)`);
    const dxy = i.items.find(x => x.key === 'dxy');
    if (dxy?.goldImpact === (L ? 'BEARISH' : 'BULLISH')) out.push(L ? 'USD แข็งค่าเร็ว' : 'USD อ่อนค่า');
    if (m.fedBias === (L ? 'HAWKISH' : 'DOVISH')) out.push(`ตลาดคาด Fed ${L ? 'Hawkish' : 'Dovish'}`);
    if (f.cvdDivergence) out.push('CVD Divergence');
    if (f.state.includes(L ? 'DISTRIBUTION' : 'ACCUMULATION')) out.push(`Order Flow สวนทาง (${f.state})`);
    if (ev.isBlocked) out.push(ev.blockReasonTh);
    if (risk.overall >= 60) out.push(`ความเสี่ยงรวมสูง (${risk.overall}/100)`);
    return out;
  }

  private static watchOut(ev: GoldEventRiskResult, risk: GoldRiskResult, t: GoldTechnicalResult, price: GoldPriceData, f: GoldOrderFlowResult): string[] {
    const out: string[] = [];
    for (const e of ev.upcomingEvents.filter(e => e.impact === 'HIGH').slice(0, 3)) out.push(`${e.eventName} — อีก ${e.countdown}`);
    for (const r of risk.items.filter(x => x.score >= 60 && x.name !== 'Macro Event Risk')) out.push(`${r.nameTh}: ${r.descTh}`);
    out.push(`แนวต้านใกล้สุด $${t.supportResistance.resistances[0]} · แนวรับใกล้สุด $${t.supportResistance.supports[0]}`);
    if (!price.marketOpen) out.push('ตลาด COMEX ปิด/ข้อมูลไม่อัปเดต — ระวังราคา Gap ตอนเปิด');
    if (f.cot && f.cot.specNetPercentile26w >= 90) out.push('Speculator ถือ Long แออัด — เสี่ยง Long liquidation');
    return out;
  }

  private static whatChanges(side: TradeSide, t: GoldTechnicalResult, entry: { stopLoss: number } | null, m: GoldMacroResult): string[] {
    const L = side === 'LONG';
    const out: string[] = [];
    if (entry) out.push(`ราคาปิด 4H ${L ? 'ต่ำกว่า' : 'สูงกว่า'} $${entry.stopLoss} (Invalidation)`);
    if (L && t.structure.lastSwingLow) out.push(`โครงสร้าง 4H แตก — หลุด Swing Low $${t.structure.lastSwingLow}`);
    if (!L && t.structure.lastSwingHigh) out.push(`โครงสร้าง 4H แตก — ผ่าน Swing High $${t.structure.lastSwingHigh}`);
    out.push(L ? 'CVD/Order Flow เปลี่ยนเป็น Distribution' : 'CVD/Order Flow เปลี่ยนเป็น Accumulation');
    out.push(L ? `Real Yield พุ่งแรง (> +15bp จาก ${m.realYield10y ?? '—'}%)` : 'Real Yield ร่วงแรง');
    out.push(L ? 'USD Breakout ขึ้น (DXY 5 วัน > +1%)' : 'USD อ่อนค่าแรง');
    out.push('Critical Macro / Geopolitical Event');
    return out;
  }
}
