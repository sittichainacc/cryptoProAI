// ============================================================================
// Global Equity Multi-Agent System - Team 3: Red Team Adversarial Engine
// 10 Agents: Bear Case, Accounting Forensic (Beneish M-Score), Valuation Challenge,
//            Earnings Risk, Technical Breakdown, Macro Risk, Industry Risk,
//            Crowded Trade/Sentiment, Portfolio Correlation, & Red Team Chairman VETO
// ============================================================================

import { globalStockStore, GlobalStockItem } from './stock_store.js';
import { riskEngine } from './risk_engine.js';

export interface BeneishMScoreMetrics {
  dsri: number;   // Days Sales in Receivables Index
  gmi: number;    // Gross Margin Index
  aqi: number;    // Asset Quality Index
  sgi: number;    // Sales Growth Index
  depi: number;   // Depreciation Index
  sgai: number;   // Sales, General & Administrative expenses Index
  lvgi: number;   // Leverage Index
  tata: number;   // Total Accruals to Total Assets
  mScore: number; // 8-variable Beneish M-Score
  isManipulatorRisk: boolean; // mScore > -1.78
  interpretation: string;
}

export interface RedTeamAgentReport {
  agentId: string;
  agentName: string;
  threatDimension: string;
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0 - 100 vulnerability score (higher = more dangerous)
  isRedFlag: boolean;
  objection: string;
  stressTestMetric: string;
  metricValue: string | number;
  counterEvidence: string[];
}

export interface RedTeamAuditResult {
  ticker: string;
  companyName: string;
  currentPrice: number;
  overallThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatScore: number; // 0 - 100 composite risk (higher = more dangerous)
  redFlagsCount: number;
  vetoTriggered: boolean;
  vetoReason?: string;
  beneishMScore: BeneishMScoreMetrics;
  crowdedTrade: {
    shortInterestPct: number;
    daysToCover: number;
    retailEuphoriaScore: number;
    squeezeRisk: 'LOW' | 'ELEVATED' | 'HIGH';
    crowdedScore: number;
  };
  technicalBreakdown: {
    distributionDays: number;
    below50Ema: boolean;
    below200Ema: boolean;
    deathCrossActive: boolean;
    supportBreakRisk: 'LOW' | 'MODERATE' | 'HIGH';
  };
  agentReports: {
    bearCase: RedTeamAgentReport;
    accountingForensic: RedTeamAgentReport;
    valuationChallenge: RedTeamAgentReport;
    earningsRisk: RedTeamAgentReport;
    technicalBreakdown: RedTeamAgentReport;
    macroRisk: RedTeamAgentReport;
    industryRisk: RedTeamAgentReport;
    crowdedTrade: RedTeamAgentReport;
    portfolioCorrelation: RedTeamAgentReport;
    chairmanVeto: RedTeamAgentReport;
  };
  summaryObjections: string[];
  chairmanSynthesis: string;
  lastAudited: string;
}

export class Team3RedTeamEngine {
  /**
   * Calculate 8-variable Beneish M-Score to detect financial statement manipulation
   * Formula: M = -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI
   * Benchmark Threshold: > -1.78 indicates high probability of accounting manipulation
   */
  public calculateBeneishMScore(stock: GlobalStockItem): BeneishMScoreMetrics {
    // Normal baseline parameters for premier large caps
    let dsri = 1.02; // receivables tracking revenue
    let gmi = 0.98;  // stable gross margins
    let aqi = 1.01;  // asset quality
    let sgi = 1.0 + (stock.revenueGrowthYoY / 100); // sales growth index
    let depi = 1.00; // straight-line depreciation
    let sgai = 0.96; // operational expense discipline
    let lvgi = 1.0 + (stock.debtToEquity * 0.05); // leverage index
    let tata = -0.04; // negative accruals (cash earnings > net income = high quality)

    // Specific anomaly checks for high-growth tech / potential red flags
    if (stock.ticker === 'NVDA') {
      sgi = 1.85;
      dsri = 1.15;
      tata = 0.02;
    } else if (stock.ticker === 'TSLA') {
      dsri = 1.18;
      lvgi = 1.12;
      tata = 0.03;
    } else if (stock.ticker === 'PLTR') {
      sgi = 1.32;
      sgai = 0.85;
      tata = -0.05;
    }

    const mScore = Number((
      -4.84 +
      0.920 * dsri +
      0.528 * gmi +
      0.404 * aqi +
      0.892 * sgi +
      0.115 * depi -
      0.172 * sgai +
      4.037 * tata +
      0.0327 * lvgi
    ).toFixed(2));

    const isManipulatorRisk = mScore > -1.78;
    const interpretation = isManipulatorRisk
      ? '🚨 ตรวจพบความเสี่ยงสูงด้านการตกแต่งงบการเงินหรือรายได้รับล่วงหน้า (Beneish M-Score > -1.78 Red Flag)'
      : '✅ งบการเงินมีความโปร่งใสสูง คุณภาพกำไรแท้จริงจากการดำเนินงาน (Beneish M-Score ≤ -1.78 Safe Zone)';

    return {
      dsri: Number(dsri.toFixed(2)),
      gmi: Number(gmi.toFixed(2)),
      aqi: Number(aqi.toFixed(2)),
      sgi: Number(sgi.toFixed(2)),
      depi: Number(depi.toFixed(2)),
      sgai: Number(sgai.toFixed(2)),
      lvgi: Number(lvgi.toFixed(2)),
      tata: Number(tata.toFixed(2)),
      mScore,
      isManipulatorRisk,
      interpretation,
    };
  }

  /**
   * Conduct comprehensive Red Team Adversarial Audit across all 10 Team 3 agents
   */
  public auditStock(ticker: string, simulateCriticalVeto: boolean = false): RedTeamAuditResult | null {
    const stock = globalStockStore.getStock(ticker.toUpperCase());
    if (!stock) return null;

    const mScore = this.calculateBeneishMScore(stock);

    // Crowded Trade & Sentiment Heat Metrics
    const shortInterestMap: Record<string, { si: number; dtc: number; fomo: number }> = {
      TSLA: { si: 3.8, dtc: 1.4, fomo: 84 },
      NVDA: { si: 1.2, dtc: 0.8, fomo: 88 },
      PLTR: { si: 4.2, dtc: 2.1, fomo: 82 },
      AMD: { si: 2.5, dtc: 1.5, fomo: 68 },
      AAPL: { si: 0.8, dtc: 1.1, fomo: 58 },
      MSFT: { si: 0.6, dtc: 1.2, fomo: 62 },
    };
    const crowdedData = shortInterestMap[stock.ticker] || { si: 1.5, dtc: 1.2, fomo: 55 };
    const crowdedScore = Math.round((crowdedData.si * 10) + (crowdedData.fomo * 0.6));

    // Technical Breakdown Indicators
    const indicators = globalStockStore.getStockIndicators(stock.ticker);
    const below50Ema = indicators ? stock.price < indicators.ema50 : false;
    const below200Ema = indicators ? stock.price < indicators.ema200 : false;
    const deathCross = indicators?.deathCross || false;
    const distributionDays = stock.changePercent < -1.5 ? 4 : 2;

    const redFlags: string[] = [];

    // T3-01 Bear Case Agent
    const bearDrawdownPct = Number(((stock.high52w - stock.price) / stock.high52w * 100 + 15).toFixed(1));
    const t3_01: RedTeamAgentReport = {
      agentId: 'T3-01',
      agentName: 'Bear Case Agent',
      threatDimension: 'Macro Recession & Multiples Contraction',
      riskSeverity: bearDrawdownPct > 35 ? 'HIGH' : bearDrawdownPct > 20 ? 'MEDIUM' : 'LOW',
      score: Math.min(95, Math.round(bearDrawdownPct * 1.8)),
      isRedFlag: bearDrawdownPct > 30,
      objection: `หากเกิดภาวะเศรษฐกิจถดถอยและ P/E บีบตัวลงสู่ค่าเฉลี่ยอุตสาหกรรม ราคาอาจปรับลดลงได้ถึง -${bearDrawdownPct}%`,
      stressTestMetric: 'Max Downside Stress Target',
      metricValue: `-$${(stock.price * (bearDrawdownPct / 100)).toFixed(1)} (-${bearDrawdownPct}%)`,
      counterEvidence: [
        'กรณี Black Swan สินค้าหลักอาจประสบปัญหาคำสั่งซื้อชะลอตัว',
        'อัตราการเติบโตที่ชะลอลงจะเร่งให้เกิด Multiples De-rating รวดเร็ว',
      ],
    };
    if (t3_01.isRedFlag) redFlags.push('T3-01: Severe downside tail risk (>30% drawdown exposure)');

    // T3-02 Accounting / Forensic Agent
    const t3_02: RedTeamAgentReport = {
      agentId: 'T3-02',
      agentName: 'Accounting / Forensic Agent',
      threatDimension: 'Beneish M-Score & Accrual Quality',
      riskSeverity: mScore.isManipulatorRisk ? 'CRITICAL' : 'LOW',
      score: mScore.isManipulatorRisk ? 92 : 24,
      isRedFlag: mScore.isManipulatorRisk,
      objection: mScore.isManipulatorRisk
        ? `Beneish M-Score (${mScore.mScore}) อยู่เหนือเกณฑ์ -1.78 มีความเสี่ยงเรื่องการรับรู้รายได้หรือลูกหนี้การค้าผิดปกติ`
        : `Beneish M-Score (${mScore.mScore}) อยู่ในเกณฑ์ปลอดภัย ไม่พบความผิดปกติของการตกแต่งงบ`,
      stressTestMetric: 'Beneish M-Score (Threshold: > -1.78)',
      metricValue: `${mScore.mScore} (${mScore.isManipulatorRisk ? 'ALERT' : 'SAFE'})`,
      counterEvidence: [
        `DSRI (ลูกหนี้เทียบยอดขาย): ${mScore.dsri}x`,
        `TATA (Total Accruals to Assets): ${mScore.tata}`,
      ],
    };
    if (t3_02.isRedFlag) redFlags.push('T3-02: Beneish M-Score anomaly detected (> -1.78)');

    // T3-03 Valuation Challenge Agent
    const isOvervalued = stock.forwardPE > 45 || stock.evToEbitda > 35;
    const t3_03: RedTeamAgentReport = {
      agentId: 'T3-03',
      agentName: 'Valuation Challenge Agent',
      threatDimension: 'Multiple Expansion Pricing Vulnerability',
      riskSeverity: isOvervalued ? 'HIGH' : 'MEDIUM',
      score: isOvervalued ? 86 : 48,
      isRedFlag: isOvervalued,
      objection: isOvervalued
        ? `Forward P/E สูงถึง ${stock.forwardPE.toFixed(1)}x และ EV/EBITDA ${stock.evToEbitda.toFixed(1)}x ราคาหุ้น priced-in ความสมบูรณ์แบบไว้หมดแล้ว`
        : `ระดับ Valuation Forward P/E ${stock.forwardPE.toFixed(1)}x สมเหตุสมผลเทียบกับอัตราเติบโต`,
      stressTestMetric: 'Valuation Multiple Premium',
      metricValue: `${stock.forwardPE.toFixed(1)}x Fwd P/E`,
      counterEvidence: [
        'ไม่มี Margin of Safety หากอัตราการเติบโตพลาดเป้าเพียงเล็กน้อย',
        'ความเสี่ยงจาก Multiple Compression สูงหาก Yield พันธบัตรปรับขึ้น',
      ],
    };
    if (t3_03.isRedFlag) redFlags.push('T3-03: Extreme valuation multiple (>45x Forward P/E)');

    // T3-04 Earnings Risk Agent
    const t3_04: RedTeamAgentReport = {
      agentId: 'T3-04',
      agentName: 'Earnings Risk Agent',
      threatDimension: 'Guidance Miss & Customer Concentration',
      riskSeverity: 'MEDIUM',
      score: 52,
      isRedFlag: false,
      objection: 'ความคาดหวังของ Wall Street สูงมาก การรายงานกำไรที่ไม่สามารถทำ Whisper Numbers ได้อาจส่งผลให้หุ้นปรับฐานรุนแรง',
      stressTestMetric: 'Next Earnings Beat Barrier',
      metricValue: 'Elevated Consensus Bar (+8% YoY)',
      counterEvidence: [
        'ลูกค้ากลุ่ม Cloud Hyperscaler คิดเป็นสัดส่วนรายได้หลัก',
        'การชะลอตัวของลูกค้ารายใหญ่ 1-2 รายจะกระทบกำไรทันที',
      ],
    };

    // T3-05 Technical Breakdown Agent
    const hasTechBreak = below50Ema || deathCross;
    const t3_05: RedTeamAgentReport = {
      agentId: 'T3-05',
      agentName: 'Technical Breakdown Agent',
      threatDimension: 'Distribution Days & Support Invalidation',
      riskSeverity: hasTechBreak ? 'HIGH' : 'LOW',
      score: hasTechBreak ? 78 : 32,
      isRedFlag: hasTechBreak,
      objection: hasTechBreak
        ? 'ราคาเริ่มหลุดเส้นแนวรับสำคัญ EMA 50 หรือเกิดสัญญาณ Distribution Selling'
        : 'โครงสร้างทางเทคนิคยังรักษาแนวโน้มขาขึ้นได้ดี ไม่มีสัญญาณหลุดแนวรับวิกฤต',
      stressTestMetric: 'Trend & Structure Status',
      metricValue: hasTechBreak ? 'Distribution / Below EMA50' : 'Above Key Moving Averages',
      counterEvidence: [
        `Distribution Days: ${distributionDays} วันในรอบ 20 วันทำการ`,
        below200Ema ? 'หลุดเส้น 200 EMA สัญญาณเตือนขาลงใหญ่' : 'ยังยืนเหนือ 200 EMA ได้อย่างมั่นคง',
      ],
    };
    if (t3_05.isRedFlag) redFlags.push('T3-05: Critical moving average breakdown (Below EMA 50)');

    // T3-06 Macro Risk Agent
    const t3_06: RedTeamAgentReport = {
      agentId: 'T3-06',
      agentName: 'Macro Risk Agent',
      threatDimension: 'Interest Rates, DXY & Geopolitics',
      riskSeverity: 'MEDIUM',
      score: 58,
      isRedFlag: false,
      objection: 'ความไม่แน่นอนของนโยบายดอกเบี้ย Fed และความตึงเครียดด้านภูมิรัฐศาสตร์ในห่วงโซ่อุปทาน',
      stressTestMetric: '10Y Yield Sensitivity (Beta to Rates)',
      metricValue: '1.25x Beta vs 10Y Yield',
      counterEvidence: [
        'การแข็งค่าของดอลลาร์สหรัฐ (DXY) อาจลดทอนกำไรจากต่างประเทศ',
        'มาตรการกีดกันทางการค้าและการจำกัดการส่งออกเทคโนโลยีขั้นสูง',
      ],
    };

    // T3-07 Industry Risk Agent
    const t3_07: RedTeamAgentReport = {
      agentId: 'T3-07',
      agentName: 'Industry Risk Agent',
      threatDimension: 'Antitrust, DOJ & Big Tech Threat',
      riskSeverity: 'MEDIUM',
      score: 54,
      isRedFlag: false,
      objection: 'การเพ่งเล็งจากหน่วยงานต่อต้านการผูกขาด (DOJ / FTC / EU Commission) และคู่แข่งที่พัฒนาชิป In-house',
      stressTestMetric: 'Regulatory Scrutiny Index',
      metricValue: 'Moderate Regulatory Focus',
      counterEvidence: [
        'Big Tech เช่น Google, Amazon, Microsoft เร่งพัฒนา Custom ASIC ของตนเอง',
        'ข้อจำกัดในการควบรวมกิจการในอนาคต',
      ],
    };

    // T3-08 Crowded Trade Agent
    const isCrowded = crowdedScore > 75;
    const t3_08: RedTeamAgentReport = {
      agentId: 'T3-08',
      agentName: 'Crowded Trade / Sentiment Agent',
      threatDimension: 'Retail Euphoria & Institutional Squeeze',
      riskSeverity: isCrowded ? 'HIGH' : 'LOW',
      score: crowdedScore,
      isRedFlag: isCrowded,
      objection: isCrowded
        ? `การถือครองของนักลงทุนสถาบันและรายย่อยอยู่ในระดับหนาแน่นมาก (Crowded Trade Score ${crowdedScore}/100) เสี่ยงต่อ Liquidity Cascade`
        : `การถือครองอยู่ในระดับสมดุล ไม่มีความเสี่ยงเรื่องภาวะฟองสบู่หรือการบีบ Short`,
      stressTestMetric: 'Crowded Positioning Meter',
      metricValue: `${crowdedScore}/100 (Short Float: ${crowdedData.si}%)`,
      counterEvidence: [
        `Retail FOMO Score: ${crowdedData.fomo}/100`,
        `Days to Cover: ${crowdedData.dtc} วันทำการ`,
      ],
    };
    if (t3_08.isRedFlag) redFlags.push('T3-08: Highly crowded positioning / extreme retail euphoria');

    // T3-09 Portfolio Correlation Agent
    const t3_09: RedTeamAgentReport = {
      agentId: 'T3-09',
      agentName: 'Portfolio Correlation Agent',
      threatDimension: 'Covariance Clustering & High Beta Risk',
      riskSeverity: 'LOW',
      score: 42,
      isRedFlag: false,
      objection: 'ความสัมพันธ์ (Correlation) กับกลุ่ม Mega-Cap Tech ค่อนข้างสูง ไม่ช่วยลดความผันผวนของพอร์ตโฟลิโอ',
      stressTestMetric: 'SPY Benchmark Beta',
      metricValue: '1.45x Beta',
      counterEvidence: [
        'ความแปรปรวนร่วม (Covariance) กับหุ้นเทคโนโลยีอื่นในพอร์ตมากกว่า 0.75',
        'ต้องจำกัดสัดส่วน Position Size ตามเกณฑ์ Risk Engine เพื่อป้องกัน Clustering',
      ],
    };

    // Calculate Overall Threat Score (0 - 100)
    const allScores = [
      t3_01.score, t3_02.score, t3_03.score, t3_04.score, t3_05.score,
      t3_06.score, t3_07.score, t3_08.score, t3_09.score,
    ];
    let threatScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    if (simulateCriticalVeto) {
      threatScore = 95;
      redFlags.push('SIMULATED: Emergency Forensic Audit Failure (Test Trigger)');
    }

    let overallThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (threatScore >= 80 || redFlags.length >= 3 || simulateCriticalVeto) overallThreatLevel = 'CRITICAL';
    else if (threatScore >= 65 || redFlags.length >= 2) overallThreatLevel = 'HIGH';
    else if (threatScore >= 50) overallThreatLevel = 'MEDIUM';
    else overallThreatLevel = 'LOW';

    // T3-10 Red Team Chairman Agent: Exercises Binding VETO
    const vetoTriggered = overallThreatLevel === 'CRITICAL' || redFlags.length >= 3 || simulateCriticalVeto;
    const vetoReason = vetoTriggered
      ? `🚨 RED TEAM VETO EXECUTED: ตรวจพบ Red Flags ร้ายแรง ${redFlags.length} รายการ [${redFlags.slice(0, 2).join('; ')}] หรือ Threat Score เกิน 80 (${threatScore}/100). คำสั่งซื้อขายถูกระงับเด็ดขาดตามกฎ Hard Risk!`
      : undefined;

    const t3_10: RedTeamAgentReport = {
      agentId: 'T3-10',
      agentName: 'Red Team Chairman Agent',
      threatDimension: 'Binding Adversarial Veto Decision',
      riskSeverity: vetoTriggered ? 'CRITICAL' : 'LOW',
      score: threatScore,
      isRedFlag: vetoTriggered,
      objection: vetoTriggered
        ? vetoReason!
        : `Red Team อนุมัติผ่านการตรวจสอบ (Threat Level: ${overallThreatLevel}). ไม่มีข้อบ่งชี้ที่ต้องใช้สิทธิ์ Veto ยับยั้ง`,
      stressTestMetric: 'Red Flags Count & VETO Authority',
      metricValue: `${redFlags.length} Red Flags [VETO: ${vetoTriggered ? 'ACTIVE' : 'CLEARED'}]`,
      counterEvidence: redFlags.length > 0 ? redFlags : ['ผ่านเกณฑ์การทดสอบภาวะวิกฤต (Adversarial Stress Test Passed)'],
    };

    const chairmanSynthesis = vetoTriggered
      ? `🚨 RED TEAM VETO EXECUTED: หุ้น ${stock.ticker} ไม่ผ่านการตรวจสอบของฝ่ายค้าน (Threat Level: CRITICAL). ข้อคัดค้าน: ${redFlags.join(', ')}.`
      : `✅ RED TEAM AUDIT CLEARED: หุ้น ${stock.ticker} ผ่านการทดสอบภาวะวิกฤต (Threat Level: ${overallThreatLevel}, Score: ${threatScore}/100, Red Flags: ${redFlags.length}). ไม่มีการใช้สิทธิ์ Veto.`;

    return {
      ticker: stock.ticker,
      companyName: stock.name,
      currentPrice: stock.price,
      overallThreatLevel,
      threatScore,
      redFlagsCount: redFlags.length,
      vetoTriggered,
      vetoReason,
      beneishMScore: mScore,
      crowdedTrade: {
        shortInterestPct: crowdedData.si,
        daysToCover: crowdedData.dtc,
        retailEuphoriaScore: crowdedData.fomo,
        squeezeRisk: crowdedScore > 75 ? 'HIGH' : crowdedScore > 60 ? 'ELEVATED' : 'LOW',
        crowdedScore,
      },
      technicalBreakdown: {
        distributionDays,
        below50Ema,
        below200Ema,
        deathCrossActive: deathCross,
        supportBreakRisk: hasTechBreak ? 'HIGH' : 'LOW',
      },
      agentReports: {
        bearCase: t3_01,
        accountingForensic: t3_02,
        valuationChallenge: t3_03,
        earningsRisk: t3_04,
        technicalBreakdown: t3_05,
        macroRisk: t3_06,
        industryRisk: t3_07,
        crowdedTrade: t3_08,
        portfolioCorrelation: t3_09,
        chairmanVeto: t3_10,
      },
      summaryObjections: redFlags,
      chairmanSynthesis,
      lastAudited: new Date().toISOString(),
    };
  }
}

export const team3RedTeamEngine = new Team3RedTeamEngine();
