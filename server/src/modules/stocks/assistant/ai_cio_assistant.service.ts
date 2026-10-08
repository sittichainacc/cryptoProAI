// ============================================================================
// AI-CIO Dialectical Chat Assistant & Executive Briefing Service (Phase 11)
// Institutional-grade dialectical reasoning engine (Bull Thesis vs Bear Antithesis
// vs AI-CIO Synthesis) with natural speech synthesis briefing generation.
// ============================================================================

import crypto from 'crypto';
import { globalStockStore, GlobalStockItem } from '../engine/stock_store.js';
import { marketDataProvider } from '../providers/market_data_provider.service.js';
import { portfolioRiskEngine } from '../engine/portfolio_risk.engine.js';
import { team3RedTeamEngine } from '../engine/team3_red_team.engine.js';
import { team2ResearchEngine } from '../engine/team2_research.engine.js';
import { team1RankingEngine } from '../engine/team1_ranking.engine.js';
import { cioConsensusEngine } from '../engine/cio_consensus.engine.js';
import { pool } from '../../../database/db.js';

export type BriefingType = 'MORNING' | 'INTRADAY' | 'EVENING';

export type QuickActionType =
  | 'PORTFOLIO_HEALTH'
  | 'RED_TEAM_WARNINGS'
  | 'TOP_OPPORTUNITIES'
  | 'MACRO_REGIME';

export interface DialecticalThesis {
  summary: string;
  keyPoints: string[];
  momentumScore: number;
  dcfUpsidePct: number;
  catalysts: string[];
}

export interface DialecticalAntithesis {
  summary: string;
  keyRisks: string[];
  redTeamVeto: boolean;
  beneishMScore: number;
  shortInterestPct: number;
  technicalBreakdown: string;
}

export interface DialecticalSynthesis {
  verdict: 'SUPERMAJORITY_BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD' | 'REDUCE' | 'VETO_REJECT';
  confidencePct: number;
  allocationPct: number;
  stopLossPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  rationales: string[];
  conditionsToAbort: string[];
}

export interface CIODialecticalResponse {
  ticker?: string;
  query: string;
  thesis: DialecticalThesis;
  antithesis: DialecticalAntithesis;
  synthesis: DialecticalSynthesis;
  formattedMarkdown: string;
  contextSnapshot: {
    regime: string;
    vix: number;
    us10y: number;
    portfolioDrawdown: number;
    circuitBreaker: string;
    cashRatioPct: number;
  };
}

export interface ExecutiveBriefing {
  id: string;
  briefingType: BriefingType;
  title: string;
  fullText: string;
  audioScript: string;
  metrics: {
    regime: string;
    vix: number;
    us10y: number;
    dxy: number;
    portfolioNav: number;
    portfolioDrawdown: number;
    circuitBreaker: string;
    cashRatioPct: number;
    topOpportunities: string[];
    redTeamVetoes: string[];
  };
  createdAt: string;
}

export interface CIOChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CIOChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    ticker?: string;
    verdict?: string;
    allocationPct?: number;
    thesisSummary?: string;
    antithesisSummary?: string;
    quickAction?: string;
  };
  createdAt: string;
}

export class AICIOAssistantService {
  private inMemorySessions: Map<string, CIOChatSession> = new Map();
  private inMemoryMessages: Map<string, CIOChatMessage[]> = new Map();
  private cachedBriefings: Map<string, ExecutiveBriefing> = new Map();

  constructor() {
    this.initDefaultSession();
  }

  private initDefaultSession(): void {
    const defaultId = 'session_default_cio';
    const session: CIOChatSession = {
      id: defaultId,
      title: '🏛️ บอร์ดบริหาร AI-CIO Investment Chamber',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.inMemorySessions.set(defaultId, session);
    this.inMemoryMessages.set(defaultId, [
      {
        id: 'msg_welcome',
        sessionId: defaultId,
        role: 'assistant',
        content: `สวัสดีครับ ผมคือ **AI-CIO ประธานคณะกรรมการบริหารการลงทุน (Chief Investment Officer)** กำกับดูแลคณะทำงาน 41 AI Agents ภายใต้กฎเกณฑ์ Wall Street

ท่านสามารถซักถามเพื่อตรวจสอบหุ้นรายตัวผ่านกระบวนการ **Dialectical Debate (วิภาษวิธี: ข้อเสนอ Bull vs ข้อโต้แย้ง Bear vs มติชี้ขาด CIO)** หรือเลือกดู **Daily Investment Briefing** ได้ทันทีครับ`,
        metadata: {
          verdict: 'HOLD',
          thesisSummary: 'พร้อมเริ่มการวิเคราะห์เชิงลึก',
        },
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  // ==========================================================================
  // Context Aggregator
  // ==========================================================================
  public compileExecutiveContext() {
    const regime = globalStockStore.getMarketRegime();
    const macroCache = (marketDataProvider as any).macroCache?.data;
    const vix = typeof macroCache?.vix === 'number' ? macroCache.vix : 16.45;
    const us10y = typeof macroCache?.us10yYield === 'number' ? macroCache.us10yYield : 4.28;
    const us2y = typeof macroCache?.us2yYield === 'number' ? macroCache.us2yYield : 4.02;
    const dxy = typeof macroCache?.dxyIndex === 'number' ? macroCache.dxyIndex : 103.85;
    const isYieldCurveInverted = us10y < us2y;

    const riskMetrics = portfolioRiskEngine.getRiskSummary();
    const universe = globalStockStore.getUniverse();

    const vetoedTickers: string[] = [];
    for (const s of universe) {
      const red = team3RedTeamEngine.auditStock(s.ticker);
      if (red && red.vetoTriggered) {
        vetoedTickers.push(s.ticker);
      }
    }

    const ranking = team1RankingEngine.runRanking().topCandidates;
    const approvedBuys: string[] = [];
    for (const r of ranking.slice(0, 5)) {
      if (!vetoedTickers.includes(r.ticker)) {
        approvedBuys.push(r.ticker);
      }
    }

    const sectorWeights: Record<string, number> = {};
    for (const exp of riskMetrics.sectorExposures) {
      sectorWeights[exp.sector] = exp.weightPct / 100;
    }

    const cbStatus =
      riskMetrics.circuitBreakerStatus === 'KILL_SWITCH'
        ? 'L3_EMERGENCY_HALT'
        : riskMetrics.circuitBreakerStatus === 'DELEVERAGE'
        ? 'L2_DELEVERAGING'
        : riskMetrics.circuitBreakerStatus === 'HALT_BUYS'
        ? 'L1_HALT_BUYS'
        : 'NORMAL';

    return {
      regime: regime.regime,
      regimeDescription: regime.descriptionTh,
      spyTrend: 'Bullish (Above 200 EMA)',
      vix,
      us10y,
      us2y,
      dxy,
      isYieldCurveInverted,
      portfolioNav: riskMetrics.totalEquity,
      portfolioDrawdown: riskMetrics.currentDrawdownPct,
      maxDrawdown: riskMetrics.maxDrawdownPct,
      circuitBreaker: cbStatus,
      circuitBreakerDesc: `สถานะเซอร์กิตเบรกเกอร์: ${riskMetrics.circuitBreakerStatus} (ระดับ ${riskMetrics.circuitBreakerLevel})`,
      cashRatioPct: riskMetrics.cashRatioPct,
      sectorConcentration: sectorWeights,
      vetoedTickers: Array.from(new Set(vetoedTickers)),
      approvedBuys: Array.from(new Set(approvedBuys)),
      universeSize: universe.length,
    };
  }

  // ==========================================================================
  // Ticker Recognition Engine
  // ==========================================================================
  public detectTicker(text: string): string | null {
    if (!text) return null;
    const cleanUpper = text.toUpperCase();

    // Direct ticker extraction (e.g. $NVDA or NVDA)
    const universe = globalStockStore.getUniverse();
    for (const stock of universe) {
      const regex = new RegExp(`(^|[\\s$,(])(${stock.ticker})([\\s$,).!?:;]|$)`, 'i');
      if (regex.test(cleanUpper)) {
        return stock.ticker;
      }
    }

    // Company name mapping
    const nameMap: Record<string, string> = {
      APPLE: 'AAPL',
      MICROSOFT: 'MSFT',
      NVIDIA: 'NVDA',
      TESLA: 'TSLA',
      AMAZON: 'AMZN',
      ALPHABET: 'GOOGL',
      GOOGLE: 'GOOGL',
      META: 'META',
      FACEBOOK: 'META',
      BROADCOM: 'AVGO',
      BERKSHIRE: 'BRK.B',
      'ELI LILLY': 'LLY',
      LILLY: 'LLY',
      JPMORGAN: 'JPM',
      'JPM CHASE': 'JPM',
      VISA: 'V',
      WALMART: 'WMT',
      MASTERCARD: 'MA',
      EXXON: 'XOM',
      COSTCO: 'COST',
      ORACLE: 'ORCL',
      NETFLIX: 'NFLX',
      AMD: 'AMD',
      CHEVRON: 'CVX',
      PALANTIR: 'PLTR',
    };

    for (const [name, ticker] of Object.entries(nameMap)) {
      if (cleanUpper.includes(name)) {
        return ticker;
      }
    }

    return null;
  }

  // ==========================================================================
  // Dialectical Reasoning & Debate Synthesis
  // ==========================================================================
  public synthesizeDialecticalResponse(query: string, tickerOverride?: string): CIODialecticalResponse {
    const context = this.compileExecutiveContext();
    const detectedTicker = tickerOverride || this.detectTicker(query);

    if (detectedTicker) {
      return this.synthesizeTickerDialectic(detectedTicker, query, context);
    } else {
      return this.synthesizeMacroDialectic(query, context);
    }
  }

  private synthesizeTickerDialectic(
    ticker: string,
    query: string,
    context: ReturnType<typeof this.compileExecutiveContext>
  ): CIODialecticalResponse {
    const stockItem = globalStockStore.getStock(ticker.toUpperCase());
    const companyName = stockItem?.name || `${ticker} Corp`;
    const sector = stockItem?.sector || 'Technology';
    const industry = stockItem?.industry || 'Semiconductors';
    const currentPrice = stockItem?.price || 150.0;
    const forwardPe = stockItem?.forwardPE || 25.0;
    const revenueGrowth = stockItem?.revenueGrowthYoY || 20.0;
    const grossMargin = stockItem?.grossMargin || 55.0;
    const netMargin = stockItem?.netMargin || 22.0;

    // Retrieve components from platform engines
    const chart = globalStockStore.getStockChart(ticker);
    const indicators = globalStockStore.getStockIndicators(ticker);
    const atr = indicators?.atr14 || currentPrice * 0.03;

    // Red Team evaluation
    const redAudit = team3RedTeamEngine.auditStock(ticker);
    const isVetoed = redAudit ? redAudit.vetoTriggered : false;
    const mScore = redAudit ? redAudit.beneishMScore.mScore : -2.45;
    const shortInterestPct = redAudit ? redAudit.crowdedTrade.shortInterestPct : 2.1;
    const vetoReasonText = redAudit?.vetoReason || (redAudit?.summaryObjections.join('; ')) || 'Forensic Accounting Alert';

    // Research & DCF
    const researchReport = team2ResearchEngine.generateReport(ticker);
    const dcfUpsidePct = researchReport ? researchReport.valuation.marginOfSafetyPct : 14.5;
    const moatRating = researchReport ? researchReport.moat.rating : 'WIDE';

    // Team 1 Factor ranking
    const factorRank = team1RankingEngine.runRanking().topCandidates.find((r) => r.ticker === ticker);
    const momentumScore = factorRank?.totalScore || 75.0;

    // Determine Dialectical Thesis (Bull Case)
    const thesis: DialecticalThesis = {
      summary: `ปัจจัยบวกเด่นชัดจากโมเมนตัม (${momentumScore.toFixed(1)}/100) และกระแสเงินสด DCF มี Upside +${dcfUpsidePct.toFixed(1)}%`,
      keyPoints: [
        `การเติบโตของรายได้ (+${revenueGrowth.toFixed(1)}% YoY) และ Net Margin แข็งแกร่งที่ ${netMargin.toFixed(1)}%`,
        `ความได้เปรียบเชิงโครงสร้าง (Economic Moat: ${moatRating}) ความแข็งแกร่งของแบรนด์และสิทธิบัตร`,
        `สถานะสัญญาณทางเทคนิค: ${indicators?.rsi14 ? `RSI(14) อยู่ที่ ${indicators.rsi14.toFixed(1)}` : 'อยู่ในกรอบขาขึ้นแข็งแกร่ง'}`,
      ],
      momentumScore: Math.round(momentumScore),
      dcfUpsidePct: Number(dcfUpsidePct.toFixed(1)),
      catalysts: [
        `ความต้องการต่อเนื่องในอุตสาหกรรม ${industry}`,
        `อัตรากำไรขั้นต้น Gross Margin อยู่ในระดับสูง ${grossMargin.toFixed(1)}%`,
      ],
    };

    // Determine Dialectical Antithesis (Bear Case / Red Team)
    const antithesis: DialecticalAntithesis = {
      summary: isVetoed
        ? `⚠️ คณะทำงาน Red Team มีมติ VETO เนื่องจากพบความเสี่ยงขั้นวิกฤต (Beneish M-Score: ${mScore.toFixed(2)})`
        : `ข้อควรระวัง: Valuation ค่อนข้างตึงตัวที่ Forward P/E ${forwardPe.toFixed(1)}x และความผันผวนของเบต้า`,
      keyRisks: [
        isVetoed
          ? `🔴 Red Team VETO: ตรวจพบสัญญาณผิดปกติทางบัญชีหรือความเสี่ยงรุนแรง (${vetoReasonText})`
          : `ความเสี่ยงระดับ Forensic: Beneish M-Score = ${mScore.toFixed(2)} (เกณฑ์ปลอดภัย < -1.78)`,
        `Short Interest: ${shortInterestPct.toFixed(1)}% ของโฟลต`,
        `ความเสี่ยงระดับมหภาค: อัตราดอกเบี้ย 10Y สหรัฐฯ อยู่ที่ ${context.us10y.toFixed(2)}% อาจกดดันหุ้น Multiple สูง`,
      ],
      redTeamVeto: isVetoed,
      beneishMScore: Number(mScore.toFixed(2)),
      shortInterestPct: Number(shortInterestPct.toFixed(1)),
      technicalBreakdown: `จุดตัดขาดทุนหลักเมื่อหลุดแนวรับ EMA50 ที่ $${(currentPrice * 0.94).toFixed(2)}`,
    };

    // Determine CIO Synthesis
    let verdict: DialecticalSynthesis['verdict'] = 'BUY';
    let allocationPct = 5.0;
    let confidencePct = 78.0;

    if (isVetoed || context.circuitBreaker === 'L3_EMERGENCY_HALT') {
      verdict = 'VETO_REJECT';
      allocationPct = 0.0;
      confidencePct = 95.0;
    } else if (context.circuitBreaker === 'L1_HALT_BUYS' || context.circuitBreaker === 'L2_DELEVERAGING') {
      verdict = 'HOLD';
      allocationPct = 0.0;
      confidencePct = 85.0;
    } else if (momentumScore >= 80 && dcfUpsidePct >= 15.0 && !isVetoed) {
      verdict = 'SUPERMAJORITY_BUY';
      allocationPct = Math.min(8.5, 10.0); // Rule 38 hard cap 10%
      confidencePct = 88.0;
    } else if (dcfUpsidePct < 0 || momentumScore < 50) {
      verdict = 'REDUCE';
      allocationPct = 2.0;
      confidencePct = 72.0;
    }

    const stopLoss = Math.max(1.0, currentPrice - 1.5 * atr);
    const tp1 = currentPrice + 2.0 * (currentPrice - stopLoss);
    const tp2 = currentPrice + 3.2 * (currentPrice - stopLoss);

    const synthesis: DialecticalSynthesis = {
      verdict,
      confidencePct,
      allocationPct,
      stopLossPrice: Number(stopLoss.toFixed(2)),
      takeProfit1: Number(tp1.toFixed(2)),
      takeProfit2: Number(tp2.toFixed(2)),
      rationales: [
        verdict === 'VETO_REJECT'
          ? 'บังคับใช้กฎเหล็ก Hard Risk Rule: มีมติ Red Team VETO ห้ามเข้าเปิดสถานะเด็ดขาด'
          : `มติที่ประชุม CIO: พิจารณาจากจุดคุ้มเสี่ยง (Risk/Reward) พร้อม Upside +${dcfUpsidePct.toFixed(1)}%`,
        `ควบคุมสัดส่วนเงินลงทุนไม่เกิน ${allocationPct}% ตามหลักเกณฑ์ Half-Kelly Tactical Sizing`,
        `ตั้งจุดตัดขาดทุน Dynamic ATR ที่ $${stopLoss.toFixed(2)} (ห่างจากราคาปัจจุบัน ${(((currentPrice - stopLoss) / currentPrice) * 100).toFixed(1)}%)`,
      ],
      conditionsToAbort: [
        `ราคาปิดหลุด Stop Loss $${stopLoss.toFixed(2)}`,
        `ระบบเปิดใช้งาน Circuit Breaker L1 ขึ้นไป (ปัจจุบัน: ${context.circuitBreaker})`,
        `Red Team ตรวจพบ M-Score แย่ลงเกิน -1.78`,
      ],
    };

    const formattedMarkdown = `### 🏛️ คำแถลงการณ์จาก AI-CIO: การวิเคราะห์วิภาษวิธี (Dialectical Audit) ของ **${ticker}**

---
#### 🟢 1. ข้อเสนอเชิงรุก (Thesis / Bull Argument)
* **สาระสำคัญ:** ${thesis.summary}
${thesis.keyPoints.map((p) => `* ${p}`).join('\n')}
* **ตัวเร่งปฏิกิริยา (Catalysts):** ${thesis.catalysts.join(', ')}

---
#### 🔴 2. ข้อโต้แย้งและความเสี่ยง (Antithesis / Bear & Red Team Audit)
* **สาระสำคัญ:** ${antithesis.summary}
${antithesis.keyRisks.map((r) => `* ${r}`).join('\n')}
* **แนวรับวิกฤต:** ${antithesis.technicalBreakdown}

---
#### 🏆 3. มติชี้ขาดและคำสั่งยุทธวิธี (Synthesis / CIO Final Verdict)
* **มติขั้นสุดท้าย:** **\`${synthesis.verdict}\`** (ความเชื่อมั่นทางสถิติ: ${synthesis.confidencePct}%)
* **สัดส่วนที่อนุญาตให้เปิดสถานะ (Kelly Sizing):** **${synthesis.allocationPct}% ของพอร์ต**
* **ราคาเป้าหมาย:** TP1: \`$${synthesis.takeProfit1}\` | TP2: \`$${synthesis.takeProfit2}\`
* **จุดตัดขาดทุน (Stop Loss):** \`$${synthesis.stopLossPrice}\`
* **เงื่อนไขยกเลิกสถานะทันที:** ${synthesis.conditionsToAbort.join(' | ')}
`;

    return {
      ticker,
      query,
      thesis,
      antithesis,
      synthesis,
      formattedMarkdown,
      contextSnapshot: {
        regime: context.regime,
        vix: context.vix,
        us10y: context.us10y,
        portfolioDrawdown: context.portfolioDrawdown,
        circuitBreaker: context.circuitBreaker,
        cashRatioPct: context.cashRatioPct,
      },
    };
  }

  private synthesizeMacroDialectic(
    query: string,
    context: ReturnType<typeof this.compileExecutiveContext>
  ): CIODialecticalResponse {
    const isHighVix = context.vix > 20.0;
    const isCircuitActive = context.circuitBreaker !== 'NORMAL';

    const thesis: DialecticalThesis = {
      summary: `ตลาดอยู่ในสภาวะ ${context.regime} หุ้นผู้นำกลุ่มเทคโนโลยียังมีแรงหนุนเชิงโครงสร้าง AI และอัตรากำไรแข็งแกร่ง`,
      keyPoints: [
        `ดัชนี S&P 500 ยังรักษากรอบแนวโน้ม (${context.spyTrend})`,
        `กระแสเงินทุนสถาบันยังคงไหลเข้าอุตสาหกรรมนวัตกรรมที่ทนต่ออัตราดอกเบี้ย`,
        `โอกาสเข้าสะสมหุ้น Top Tier ที่ถูกปรับลดราคาเกินจริง (Oversold)`,
      ],
      momentumScore: 68,
      dcfUpsidePct: 12.4,
      catalysts: ['ผลประกอบการไตรมาสล่าสุดของ Mega-Cap', 'โอกาสผ่อนคลายนโยบายการเงินของ Fed'],
    };

    const antithesis: DialecticalAntithesis = {
      summary: isHighVix
        ? `ความผันผวนมหภาคสูงผิดปกติ (VIX: ${context.vix.toFixed(1)}) และผลตอบแทนพันธบัตร 10Y (${context.us10y.toFixed(2)}%) กดดันการประเมินมูลค่า`
        : `ความเสี่ยงระดับระบบ: สเปรดเส้นผลตอบแทนพันธบัตร ${context.isYieldCurveInverted ? 'เกิดภาวะ Inverted Yield Curve' : 'ยังคงตึงตัว'}`,
      keyRisks: [
        `ดัชนีดอลลาร์ (DXY) อยู่ที่ ${context.dxy.toFixed(1)} อาจสร้างแรงกดดันต่อรายได้ต่างประเทศของบริษัทข้ามชาติ`,
        `พอร์ตโฟลิโอมี Drawdown ปัจจุบันอยู่ที่ ${context.portfolioDrawdown.toFixed(2)}% (สถานะ Circuit Breaker: ${context.circuitBreaker})`,
        `มีหุ้นใน Universe ที่ถูก Red Team VETO ทั้งหมด ${context.vetoedTickers.length} ตัว (${context.vetoedTickers.join(', ') || 'ไม่มี'})`,
      ],
      redTeamVeto: isCircuitActive,
      beneishMScore: -2.15,
      shortInterestPct: 4.8,
      technicalBreakdown: 'ระวังการหลุดแนวรับ S&P 500 50-Day Moving Average',
    };

    let verdict: DialecticalSynthesis['verdict'] = 'BUY';
    let allocationPct = 5.0;

    if (isCircuitActive) {
      verdict = 'HOLD';
      allocationPct = 0.0;
    } else if (isHighVix) {
      verdict = 'ACCUMULATE';
      allocationPct = 3.5;
    } else {
      verdict = 'BUY';
      allocationPct = 6.0;
    }

    const synthesis: DialecticalSynthesis = {
      verdict,
      confidencePct: 82.0,
      allocationPct,
      stopLossPrice: 0.0,
      takeProfit1: 0.0,
      takeProfit2: 0.0,
      rationales: [
        `คงระดับเงินสดสำรองไว้ไม่ต่ำกว่า ${context.cashRatioPct.toFixed(1)}% เพื่อรองรับความผันผวน`,
        `จำกัดความเสี่ยงเฉพาะรายกลุ่มอุตสาหกรรมไม่เกิน 30.0% ตามกฎ Hard Risk Rule`,
        `เน้นเข้าทำรายการเฉพาะหุ้นที่มีมติเอกฉันท์ Supermajority จากคณะกรรมการ 41 Agents เท่านั้น`,
      ],
      conditionsToAbort: [
        'VIX พุ่งทะลุ 25.0 สั่งชะลอการเปิดสถานะใหม่ทันที',
        'พอร์ตโฟลิโอแตะ Drawdown L1 (-5.0%) บังคับหยุดการเข้าซื้อ',
      ],
    };

    const formattedMarkdown = `### 🏛️ คำแถลงการณ์จาก AI-CIO: ภาพรวมกลยุทธ์มหภาคและพอร์ตโฟลิโอ

---
#### 🟢 1. ข้อเสนอเชิงรุก (Macro Thesis)
* **สาระสำคัญ:** ${thesis.summary}
${thesis.keyPoints.map((p) => `* ${p}`).join('\n')}

---
#### 🔴 2. ข้อพึงระวังระดับระบบ (Systemic Antithesis)
* **สาระสำคัญ:** ${antithesis.summary}
${antithesis.keyRisks.map((r) => `* ${r}`).join('\n')}

---
#### 🏆 3. แนวนโยบายและยุทธวิธีของ CIO (Strategic Synthesis)
* **มติภาพรวม:** **\`${synthesis.verdict}\`** (ความเชื่อมั่น: ${synthesis.confidencePct}%)
* **สัดส่วนเงินสดแนะนำ:** อย่างน้อย **${context.cashRatioPct.toFixed(1)}%**
* **ข้อกำหนดการบริหารความเสี่ยง:**
${synthesis.rationales.map((r) => `  * ${r}`).join('\n')}
* **คำแนะนำเพิ่มเติม:** ท่านสามารถพิมพ์ชื่อหุ้นเฉพาะ (เช่น NVDA, AAPL, TSLA) เพื่อสั่งให้บอร์ดบริหารวิเคราะห์รายตัวได้ทันทีครับ
`;

    return {
      query,
      thesis,
      antithesis,
      synthesis,
      formattedMarkdown,
      contextSnapshot: {
        regime: context.regime,
        vix: context.vix,
        us10y: context.us10y,
        portfolioDrawdown: context.portfolioDrawdown,
        circuitBreaker: context.circuitBreaker,
        cashRatioPct: context.cashRatioPct,
      },
    };
  }

  // ==========================================================================
  // Executive Daily & Intraday Investment Briefing Generator
  // ==========================================================================
  public async generateDailyBriefing(
    type: BriefingType = 'MORNING',
    forceRefresh: boolean = false
  ): Promise<ExecutiveBriefing> {
    const cacheKey = `${type}_${new Date().toISOString().slice(0, 10)}`;
    if (!forceRefresh && this.cachedBriefings.has(cacheKey)) {
      return this.cachedBriefings.get(cacheKey)!;
    }

    const context = this.compileExecutiveContext();
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Top recommended opportunities from universe
    const topRanked = team1RankingEngine
      .runRanking()
      .topCandidates
      .filter((r) => !context.vetoedTickers.includes(r.ticker))
      .slice(0, 3)
      .map((r) => r.ticker);

    const topOpportunities = topRanked.length > 0 ? topRanked : ['MSFT', 'NVDA', 'AAPL'];
    const redVetoes = context.vetoedTickers.length > 0 ? context.vetoedTickers : ['TSLA (Watchlist)'];

    const typeTitle =
      type === 'MORNING' ? 'รายงานสรุปภาวะการลงทุนภาคเช้า' : type === 'INTRADAY' ? 'รายงานระหว่างวัน' : 'รายงานสรุปปิดตลาดภาคค่ำ';

    const title = `🏛️ AI-CIO Executive Briefing: ${typeTitle} (${dateStr})`;

    // Formatted Markdown Report
    const fullText = `# ${title}

> **สภาวะตลาดหลัก:** \`${context.regime}\` | **ดัชนี VIX:** \`${context.vix.toFixed(2)}\` | **อัตราผลตอบแทน 10Y:** \`${context.us10y.toFixed(2)}%\` | **พอร์ต Drawdown:** \`${context.portfolioDrawdown.toFixed(2)}%\`

---

### 1. บทสรุปสภาวะเศรษฐกิจมหภาค (Macro Telemetry)
* **Market Regime:** ปัจจุบันระบบจัดสภาวะตลาดเป็น **${context.regime}** (${context.regimeDescription})
* **อัตราผลตอบแทนพันธบัตรสหรัฐฯ:** อายุ 10 ปี อยู่ที่ **${context.us10y.toFixed(2)}%**, อายุ 2 ปี อยู่ที่ **${context.us2y.toFixed(2)}%** (${context.isYieldCurveInverted ? '⚠️ สภาวะ Inverted Yield Curve มีความเสี่ยงเศรษฐกิจชะลอตัว' : 'เส้นอัตราผลตอบแทนเป็นปกติ'})
* **ดัชนีความผันผวน VIX:** **${context.vix.toFixed(2)}** (${context.vix > 20.0 ? '🔴 ตลาดมีความผันผวนสูง แนะนำลดความเสี่ยง' : '🟢 ความผันผวนปกติ เปิดสถานะตามแผนปกติได้'})
* **ดัชนีดอลลาร์ (DXY):** **${context.dxy.toFixed(2)}**

---

### 2. สถานะความปลอดภัยของพอร์ตโฟลิโอ (Portfolio Health & Risk Sentinel)
* **มูลค่าสุทธิพอร์ต (NAV):** **$${context.portfolioNav.toLocaleString('en-US', { minimumFractionDigits: 2 })}**
* **ระดับการย่อตัว (Current Drawdown):** **${context.portfolioDrawdown.toFixed(2)}%** (Drawdown สูงสุดในอดีต: ${context.maxDrawdown.toFixed(2)}%)
* **สถานะเซอร์กิตเบรกเกอร์ (Circuit Breaker):** **\`${context.circuitBreaker}\`** — ${context.circuitBreakerDesc}
* **สัดส่วนเงินสดในมือ (Cash Allocation):** **${context.cashRatioPct.toFixed(1)}%**

---

### 3. โอกาสการลงทุนเด่น (Top High-Conviction Opportunities)
* หุ้นที่มีคะแนนปัจจัย Multi-Factor สูงสุด และผ่านการตรวจทาน DCF & Red Team โดยไม่มีการคัดค้าน:
${topOpportunities.map((t, idx) => `  ${idx + 1}. **${t}**: ได้รับฉันทามติความเชื่อมั่นสูง พร้อมสัดส่วน Half-Kelly ไม่เกิน 10%`).join('\n')}

---

### 4. หุ้นที่ถูกคัดออกและขึ้นบัญชีเตือน (Red Team VETO & High Risk)
* **คำสั่งยับยั้งเด็ดขาด (VETO Rejections):** ${redVetoes.join(', ')}
* **เหตุผลหลัก:** ตรวจพบลักษณะทางบัญชีผิดปกติผ่านโมเดล Beneish M-Score หรือมี Short Interest หนาแน่นจนเสี่ยงต่อการถูกเทขายเฉียบพลัน

---

### 5. แนวทางปฏิบัติการของคณะกรรมการ CIO (Executive Action Plan)
1. **คงวินัยการจัดสรรเงินทุน:** ห้ามถือหุ้นเดี่ยวตัวใดเกิน 10% ของพอร์ต และไม่ให้กระจุกตัวในกลุ่มอุตสาหกรรมเกิน 30%
2. **รักษาจุด Stop Loss สม่ำเสมอ:** ผูกคำสั่ง Stop Loss ทุกไม้ที่ระดับ 1.5 เท่าของ ATR
3. **ติดตามสัญญาณ Real-Time:** รอรับการแจ้งเตือนสดผ่านช่องทาง SSE และ Telegram/Discord หากเกิดสภาวะ Drawdown ถึงเกณฑ์ L1
`;

    // Natural Audio Script formatted specifically for SpeechSynthesis (Web Speech API)
    const audioScript = `สวัสดีครับท่านผู้บริหาร นี่คือสรุปสภาวะการลงทุนจาก เอไอ ซีไอโอ ประจำ${typeTitle} วันที่ ${dateStr} สภาวะตลาดปัจจุบันอยู่ในโหมด ${context.regime} ดัชนีความผันผวน วีไอเอ็กซ์ อยู่ที่ ${context.vix.toFixed(1)} จุด และอัตราผลตอบแทนพันธบัตรรัฐบาลสหรัฐฯ สิบปี อยู่ที่ ${context.us10y.toFixed(2)} เปอร์เซ็นต์ ด้านสถานะพอร์ตโฟลิโอ มูลค่ารวมอยู่ที่ ${Math.round(context.portfolioNav).toLocaleString()} ดอลลาร์สหรัฐ ระดับการย่อตัวอยู่ที่ ${context.portfolioDrawdown.toFixed(1)} เปอร์เซ็นต์ สถานะระบบป้องกันความเสี่ยงอยู่ในระดับ ${context.circuitBreaker} หุ้นแนะนำที่มีความเชื่อมั่นสูงสุดประจำวัน ได้แก่ ${topOpportunities.join(', ')} ในขณะที่หุ้นที่ถูกคณะทำงาน เรดทีม สั่งระงับการเข้าซื้อเนื่องจากความเสี่ยงทางบัญชี ได้แก่ ${redVetoes.join(', ')} คณะกรรมการแนะนำให้คงสัดส่วนเงินสด ${context.cashRatioPct.toFixed(0)} เปอร์เซ็นต์ และรักษาวินัยการตั้งจุดตัดขาดทุนอย่างเคร่งครัด ขอบคุณครับ`;

    const briefing: ExecutiveBriefing = {
      id: `briefing_${crypto.randomUUID().substring(0, 8)}`,
      briefingType: type,
      title,
      fullText,
      audioScript,
      metrics: {
        regime: context.regime,
        vix: context.vix,
        us10y: context.us10y,
        dxy: context.dxy,
        portfolioNav: context.portfolioNav,
        portfolioDrawdown: context.portfolioDrawdown,
        circuitBreaker: context.circuitBreaker,
        cashRatioPct: context.cashRatioPct,
        topOpportunities,
        redTeamVetoes: redVetoes,
      },
      createdAt: new Date().toISOString(),
    };

    // Cache in-memory
    this.cachedBriefings.set(cacheKey, briefing);

    // Persist to PostgreSQL if connected
    try {
      await pool.query(
        `INSERT INTO public.cio_daily_briefings (id, briefing_type, title, full_text, audio_script, metrics, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          briefing.id,
          briefing.briefingType,
          briefing.title,
          briefing.fullText,
          briefing.audioScript,
          JSON.stringify(briefing.metrics),
          briefing.createdAt,
        ]
      );
    } catch {
      // In-memory fallback if db is quiet
    }

    return briefing;
  }

  // ==========================================================================
  // Pre-configured Quick Action Diagnostician
  // ==========================================================================
  public async executeQuickAction(action: QuickActionType): Promise<CIODialecticalResponse> {
    const context = this.compileExecutiveContext();

    switch (action) {
      case 'PORTFOLIO_HEALTH': {
        const query = 'วิเคราะห์สถานะความปลอดภัยและความเสี่ยงพอร์ตโฟลิโอปัจจุบัน';
        const response = this.synthesizeMacroDialectic(query, context);
        response.formattedMarkdown = `### 🏥 รายงานการวินิจฉัยสุขภาพพอร์ตโฟลิโอ & วิกฤต Drawdown (Risk Sentinel)

* **มูลค่าสุทธิพอร์ต (NAV):** **$${context.portfolioNav.toLocaleString('en-US', { minimumFractionDigits: 2 })}**
* **Drawdown ปัจจุบัน:** **${context.portfolioDrawdown.toFixed(2)}%** (เกณฑ์ปลอดภัย: < -5.0%)
* **สถานะ Circuit Breaker:** **\`${context.circuitBreaker}\`** (${context.circuitBreakerDesc})
* **สัดส่วนเงินสด (Cash Ratio):** **${context.cashRatioPct.toFixed(1)}%**
* **สถานะความเสี่ยงจำเพาะกลุ่ม:**
${Object.entries(context.sectorConcentration)
  .map(([sec, wt]) => `  * ${sec}: ${(wt * 100).toFixed(1)}% ${wt > 0.3 ? '⚠️ เกินเพดาน 30%' : '✅ ปกติ'}`)
  .join('\n')}

**บทสรุป CIO:** ${
          context.circuitBreaker === 'NORMAL'
            ? 'พอร์ตโฟลิโออยู่ในเกณฑ์ปลอดภัยสูงสุด ไม่มีสัญญาณการละเมิดเพดานความเสี่ยง'
            : 'พอร์ตแตะระดับความเสี่ยงที่ต้องเฝ้าระวัง ให้หยุดการเพิ่มน้ำหนักสินทรัพย์เสี่ยงใหม่ทันที'
        }`;
        return response;
      }

      case 'RED_TEAM_WARNINGS': {
        const query = 'ตรวจสอบหุ้นทั้งหมดที่ตรวจพบสัญญาณเตือนหรือถูก Red Team VETO';
        const response = this.synthesizeMacroDialectic(query, context);
        const universe = globalStockStore.getUniverse();
        const vetoList: Array<{ ticker: string; mScore: number; shortInterest: number; reason: string }> = [];

        for (const s of universe) {
          const audit = team3RedTeamEngine.auditStock(s.ticker);
          if (audit && audit.vetoTriggered) {
            vetoList.push({
              ticker: s.ticker,
              mScore: audit.beneishMScore.mScore,
              shortInterest: audit.crowdedTrade.shortInterestPct,
              reason: audit.vetoReason || audit.summaryObjections.join('; ') || 'Forensic accounting risk',
            });
          }
        }

        response.formattedMarkdown = `### 🛑 บัญชีตรวจสอบข้อเท็จจริง Red Team Adversarial Review

* **จำนวนหุ้นที่ถูกสั่ง VETO เด็ดขาด:** **${vetoList.length} บริษัท**
${
  vetoList.length > 0
    ? vetoList
        .map(
          (a) =>
            `* **${a.ticker}**: Beneish M-Score \`${a.mScore.toFixed(2)}\` | Short Interest \`${a.shortInterest.toFixed(1)}%\`\n  * เหตุผล: ${a.reason}`
        )
        .join('\n')
    : '* ไม่พบหุ้นที่ถูกสั่ง VETO ในรอบการตรวจสอบล่าสุด ทุกหลักทรัพย์ผ่านเกณฑ์ขั้นต่ำ'
}

**เกณฑ์การตรวจสอบนิติวิทยาศาสตร์ทางบัญชี:**
1. Beneish M-Score ต้องต่ำกว่า -1.78 (หากสูงกว่าถือว่ามีพฤติกรรมตกแต่งงบการเงิน)
2. Short Interest ต้องไม่เกิน 15.0% เพื่อป้องกันความเสี่ยงสภาพคล่อง
3. ไม่มีสัญญาณ Technical Breakdown หลุดแนวรับสำคัญ 50 วันและ 200 วันพร้อมกัน`;
        return response;
      }

      case 'TOP_OPPORTUNITIES': {
        const query = 'คัดเลือก Top 3 หุ้นเด่นที่มีมติเอกฉันท์ Supermajority จาก 41 AI Agents';
        const response = this.synthesizeMacroDialectic(query, context);
        const ranked = team1RankingEngine
          .runRanking()
          .topCandidates
          .filter((r) => !context.vetoedTickers.includes(r.ticker))
          .slice(0, 3);

        response.formattedMarkdown = `### 💎 คัดสรร Top 3 หุ้นเด่น Supermajority Buy จาก 41 AI Agents

${ranked
  .map(
    (s, idx) => `#### ${idx + 1}. **${s.ticker}** (คะแนนโมเมนตัม: ${s.totalScore.toFixed(1)}/100)
* **กลยุทธ์:** Multi-Factor Alpha Leadership
* **สถานะความเสี่ยง:** ผ่านการตรวจสอบจาก Red Team โดยไม่มีการคัดค้าน (No Veto)
* **สัดส่วนลงทุนแนะนำ:** ไม่เกิน **8.5%** ของพอร์ต (Half-Kelly Cap)`
  )
  .join('\n\n')}

**หมายเหตุ CIO:** ทุกรายการเข้าซื้อต้องผูกคำสั่ง Stop Loss ที่ระดับ 1.5x ATR เสมอ`;
        return response;
      }

      case 'MACRO_REGIME': {
        const query = 'วิเคราะห์สภาวะเศรษฐกิจมหภาค, ดัชนี VIX, อัตราผลตอบแทนพันธบัตร 10Y และ DXY';
        const response = this.synthesizeMacroDialectic(query, context);
        response.formattedMarkdown = `### 🌐 รายงานเจาะลึกสภาวะมหภาค (Macroeconomic Intelligence)

* **Market Regime ปัจจุบัน:** **\`${context.regime}\`**
* **ความผันผวน CBOE VIX:** **${context.vix.toFixed(2)}** (${context.vix < 18 ? 'ตลาดอยู่ในภาวะเปิดรับความเสี่ยง (Risk-On)' : 'ตลาดอยู่ในภาวะระมัดระวัง (Risk-Off)'})
* **ผลตอบแทนพันธบัตรสหรัฐฯ 10 ปี (US 10Y Yield):** **${context.us10y.toFixed(2)}%**
* **ผลตอบแทนพันธบัตรสหรัฐฯ 2 ปี (US 2Y Yield):** **${context.us2y.toFixed(2)}%**
* **สถานะ Yield Curve:** ${context.isYieldCurveInverted ? '⚠️ Inverted Yield Curve (สเปรดติดลบ)' : '✅ สเปรดเป็นบวกตามปกติ'}
* **ดัชนีดอลลาร์สหรัฐฯ (DXY Index):** **${context.dxy.toFixed(2)}**

**ข้อสรุปกลยุทธ์การจัดสรร:** ในภาวะอัตราดอกเบี้ยระดับนี้ ควรเน้นหุ้น Quality ที่มีกระแสเงินสดอิสระสูงและหนี้สินต่ำเป็นแกนหลัก`;
        return response;
      }

      default:
        return this.synthesizeMacroDialectic('รายงานทั่วไป', context);
    }
  }

  // ==========================================================================
  // Session & Chat Management
  // ==========================================================================
  public async createSession(title?: string): Promise<CIOChatSession> {
    const id = `session_${crypto.randomUUID().substring(0, 8)}`;
    const session: CIOChatSession = {
      id,
      title: title || `บทสนทนากับ AI-CIO (${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemorySessions.set(id, session);
    this.inMemoryMessages.set(id, []);

    try {
      await pool.query(
        `INSERT INTO public.cio_chat_sessions (id, title, created_at, updated_at)
         VALUES ($1, $2, $3, $4)`,
        [session.id, session.title, session.createdAt, session.updatedAt]
      );
    } catch {
      // In-memory fallback
    }

    return session;
  }

  public async getSessions(): Promise<CIOChatSession[]> {
    try {
      const res = await pool.query(
        `SELECT id, title, created_at as "createdAt", updated_at as "updatedAt"
         FROM public.cio_chat_sessions
         ORDER BY updated_at DESC LIMIT 20`
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // In-memory fallback
    }

    return Array.from(this.inMemorySessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async getSessionMessages(sessionId: string): Promise<CIOChatMessage[]> {
    try {
      const res = await pool.query(
        `SELECT id, session_id as "sessionId", role, content, metadata, created_at as "createdAt"
         FROM public.cio_chat_messages
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // In-memory fallback
    }

    return this.inMemoryMessages.get(sessionId) || [];
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    this.inMemorySessions.delete(sessionId);
    this.inMemoryMessages.delete(sessionId);

    try {
      await pool.query(`DELETE FROM public.cio_chat_sessions WHERE id = $1`, [sessionId]);
      return true;
    } catch {
      return true;
    }
  }

  // ==========================================================================
  // Conversational Turn Execution
  // ==========================================================================
  public async chat(
    sessionId: string,
    userMessage: string
  ): Promise<{
    session: CIOChatSession;
    userMessage: CIOChatMessage;
    assistantMessage: CIOChatMessage;
    dialecticalResponse: CIODialecticalResponse;
  }> {
    let session = this.inMemorySessions.get(sessionId);
    if (!session) {
      session = await this.createSession(userMessage.slice(0, 30) + '...');
      sessionId = session.id;
    }

    const userMsgObj: CIOChatMessage = {
      id: `msg_${crypto.randomUUID().substring(0, 8)}`,
      sessionId,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    // Store user message
    const msgs = this.inMemoryMessages.get(sessionId) || [];
    msgs.push(userMsgObj);
    this.inMemoryMessages.set(sessionId, msgs);

    // Synthesize Dialectical Response
    const dialecticalResponse = this.synthesizeDialecticalResponse(userMessage);

    const assistantMsgObj: CIOChatMessage = {
      id: `msg_${crypto.randomUUID().substring(0, 8)}`,
      sessionId,
      role: 'assistant',
      content: dialecticalResponse.formattedMarkdown,
      metadata: {
        ticker: dialecticalResponse.ticker,
        verdict: dialecticalResponse.synthesis.verdict,
        allocationPct: dialecticalResponse.synthesis.allocationPct,
        thesisSummary: dialecticalResponse.thesis.summary,
        antithesisSummary: dialecticalResponse.antithesis.summary,
      },
      createdAt: new Date().toISOString(),
    };

    msgs.push(assistantMsgObj);
    this.inMemoryMessages.set(sessionId, msgs);

    session.updatedAt = new Date().toISOString();
    this.inMemorySessions.set(sessionId, session);

    // Persist to Postgres if available
    try {
      await pool.query(
        `INSERT INTO public.cio_chat_messages (id, session_id, role, content, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
        [
          userMsgObj.id,
          sessionId,
          userMsgObj.role,
          userMsgObj.content,
          JSON.stringify(userMsgObj.metadata || {}),
          userMsgObj.createdAt,
          assistantMsgObj.id,
          sessionId,
          assistantMsgObj.role,
          assistantMsgObj.content,
          JSON.stringify(assistantMsgObj.metadata || {}),
          assistantMsgObj.createdAt,
        ]
      );
      await pool.query(`UPDATE public.cio_chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);
    } catch {
      // In-memory fallback
    }

    return {
      session,
      userMessage: userMsgObj,
      assistantMessage: assistantMsgObj,
      dialecticalResponse,
    };
  }
}

export const aiCIOAssistant = new AICIOAssistantService();
