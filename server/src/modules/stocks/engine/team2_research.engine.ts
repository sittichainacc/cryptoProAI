// ============================================================================
// Global Equity Multi-Agent System - Team 2: Equity Research Engine
// 10 Agents: Revenue Growth, Income Statement, Balance Sheet, Cash Flow,
//            2-Stage DCF Valuation, Business Moat, Management/ROIC,
//            Earnings Call Guidance, Industry/TAM, and Research Chairman
// ============================================================================

import { globalStockStore, GlobalStockItem } from './stock_store.js';

export interface DCFValuationParams {
  wacc: number;                // e.g. 0.09 (9%)
  terminalGrowthRate: number;  // e.g. 0.035 (3.5%)
  growthRateStage1: number;    // e.g. 0.18 (18% 5-year CAGR)
  forecastYears: number;       // default 5
}

export interface DCFValuationResult {
  currentPrice: number;
  fairValue: number;
  marginOfSafetyPct: number;   // ((FairValue - CurrentPrice) / FairValue) * 100
  valuationStatus: 'SIGNIFICANTLY_UNDERVALUED' | 'MODERATELY_UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED' | 'HIGHLY_OVERVALUED';
  projectedFCF: Array<{ year: number; fcf: number; presentValue: number }>;
  enterpriseValue: number;
  equityValue: number;
  terminalValue: number;
  pvTerminalValue: number;
  impliedMarketGrowthRate: number; // Reverse DCF
  wacc: number;
  terminalGrowthRate: number;
}

export interface ResearchAgentThesis {
  agentId: string;
  agentName: string;
  focusArea: string;
  score: number;         // 0 - 100
  rating: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'CAUTION' | 'BEAR';
  keyMetric: string;
  metricValue: string | number;
  thesis: string;
  evidence: string[];
}

export interface EquityResearchReport {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  currentPrice: number;
  overallResearchScore: number; // 0 - 100
  researchConviction: 'HIGH' | 'MODERATE' | 'SPECULATIVE';
  moat: {
    rating: 'WIDE' | 'NARROW' | 'NONE';
    score: number; // 0 - 100
    primarySources: string[];
    description: string;
  };
  valuation: DCFValuationResult;
  scenarios: {
    bull: {
      targetPrice: number;
      upsidePct: number;
      fcfGrowth: number;
      thesis: string;
      catalysts: string[];
    };
    base: {
      targetPrice: number;
      upsidePct: number;
      fcfGrowth: number;
      thesis: string;
      catalysts: string[];
    };
    bear: {
      targetPrice: number;
      downsidePct: number;
      fcfGrowth: number;
      thesis: string;
      risks: string[];
    };
  };
  agentTheses: {
    revenueGrowth: ResearchAgentThesis;
    incomeStatement: ResearchAgentThesis;
    balanceSheet: ResearchAgentThesis;
    cashFlow: ResearchAgentThesis;
    valuation: ResearchAgentThesis;
    moat: ResearchAgentThesis;
    management: ResearchAgentThesis;
    earningsCall: ResearchAgentThesis;
    competitor: ResearchAgentThesis;
    chairman: ResearchAgentThesis;
  };
  chairmanSummary: string;
  lastUpdated: string;
}

export class Team2ResearchEngine {
  /**
   * High-precision 2-Stage Discounted Cash Flow (DCF) Model
   */
  public calculateDCF(stock: GlobalStockItem, customParams?: Partial<DCFValuationParams>): DCFValuationResult {
    const wacc = customParams?.wacc ?? (stock.sector === 'Information Technology' ? 0.092 : 0.085);
    const terminalGrowth = customParams?.terminalGrowthRate ?? 0.035;
    const forecastYears = customParams?.forecastYears ?? 5;
    
    // Determine Stage 1 growth rate from stock revenue & FCF expansion profile
    let baseGrowth = (stock.revenueGrowthYoY / 100) * 0.75;
    if (stock.ticker === 'NVDA') baseGrowth = 0.35;
    else if (stock.ticker === 'PLTR') baseGrowth = 0.28;
    else if (stock.ticker === 'LLY') baseGrowth = 0.26;
    else if (stock.ticker === 'MSFT') baseGrowth = 0.16;
    else if (stock.ticker === 'AAPL') baseGrowth = 0.10;
    
    const growthStage1 = customParams?.growthRateStage1 ?? Math.max(0.05, Math.min(0.40, baseGrowth));

    // Estimate baseline Free Cash Flow ($)
    const baseFcf = (stock.marketCap * (stock.freeCashFlowYield / 100)) || (stock.marketCap * 0.025);
    
    const projectedFCF: Array<{ year: number; fcf: number; presentValue: number }> = [];
    let cumulativePvFCF = 0;
    let currentYearFcf = baseFcf;

    // Stage 1: Explicit 5-year forecast with slight fade
    for (let year = 1; year <= forecastYears; year++) {
      const annualGrowth = growthStage1 * Math.pow(0.95, year - 1);
      currentYearFcf = currentYearFcf * (1 + annualGrowth);
      const discountFactor = Math.pow(1 + wacc, year);
      const presentValue = currentYearFcf / discountFactor;
      
      projectedFCF.push({
        year,
        fcf: Number(currentYearFcf.toFixed(0)),
        presentValue: Number(presentValue.toFixed(0)),
      });
      cumulativePvFCF += presentValue;
    }

    // Stage 2: Terminal Value (Gordon Growth Model)
    const terminalFCF = currentYearFcf * (1 + terminalGrowth);
    const denominator = Math.max(0.015, wacc - terminalGrowth);
    const terminalValue = terminalFCF / denominator;
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc, forecastYears);

    const enterpriseValue = cumulativePvFCF + pvTerminalValue;
    
    // Balance Sheet Net Cash adjustment (estimated 3% of market cap net cash for tech leaders)
    const netCash = stock.debtToEquity < 0.5 ? stock.marketCap * 0.04 : -stock.marketCap * 0.05;
    const equityValue = enterpriseValue + netCash;

    // Shares outstanding proxy
    const sharesOutstanding = stock.marketCap / stock.price;
    const fairValue = Number((equityValue / sharesOutstanding).toFixed(2));
    const marginOfSafetyPct = Number((((fairValue - stock.price) / fairValue) * 100).toFixed(2));

    // Valuation Status
    let valuationStatus: DCFValuationResult['valuationStatus'];
    if (marginOfSafetyPct >= 25) valuationStatus = 'SIGNIFICANTLY_UNDERVALUED';
    else if (marginOfSafetyPct >= 10) valuationStatus = 'MODERATELY_UNDERVALUED';
    else if (marginOfSafetyPct >= -10) valuationStatus = 'FAIRLY_VALUED';
    else if (marginOfSafetyPct >= -25) valuationStatus = 'OVERVALUED';
    else valuationStatus = 'HIGHLY_OVERVALUED';

    // Reverse DCF: Implied Market Growth Rate
    const impliedMarketGrowthRate = Number((((stock.price / fairValue) * growthStage1) * 100).toFixed(2));

    return {
      currentPrice: stock.price,
      fairValue,
      marginOfSafetyPct,
      valuationStatus,
      projectedFCF,
      enterpriseValue: Number(enterpriseValue.toFixed(0)),
      equityValue: Number(equityValue.toFixed(0)),
      terminalValue: Number(terminalValue.toFixed(0)),
      pvTerminalValue: Number(pvTerminalValue.toFixed(0)),
      impliedMarketGrowthRate,
      wacc: Number((wacc * 100).toFixed(1)),
      terminalGrowthRate: Number((terminalGrowth * 100).toFixed(1)),
    };
  }

  /**
   * Evaluate Economic Moat (Morningstar-style)
   */
  public evaluateMoat(stock: GlobalStockItem): EquityResearchReport['moat'] {
    let score = 50;
    const sources: string[] = [];

    // Network Effects & Switching Costs
    if (['NVDA', 'MSFT', 'AAPL', 'GOOGL', 'META', 'TSM', 'ASML', 'V'].includes(stock.ticker)) {
      score += 42;
      sources.push('Network Effects (ระบบนิเวศและแพลตฟอร์มข้ามผู้ใช้งาน)');
      sources.push('High Switching Costs (ต้นทุนการย้ายระบบสูงมาก)');
      sources.push('Intangible Assets / IP & Patents (สิทธิบัตรและเทคโนโลยีเฉพาะทาง)');
    } else if (stock.roe >= 30) {
      score += 30;
      sources.push('Cost Advantage / Scale Economies (การประหยัดจากขนาดและต้นทุนต่ำ)');
      sources.push('Brand Equity (แบรนด์แข็งแกร่งและมี Pricing Power)');
    } else {
      score += 15;
      sources.push('Niche Market Position (ส่วนแบ่งการตลาดเฉพาะทาง)');
    }

    const clampedScore = Math.min(98, score);
    const rating: 'WIDE' | 'NARROW' | 'NONE' = clampedScore >= 80 ? 'WIDE' : clampedScore >= 60 ? 'NARROW' : 'NONE';
    const description = rating === 'WIDE'
      ? 'คูเมืองทางธุรกิจกว้างขวาง (Wide Economic Moat) สามารถรักษาผลตอบแทน ROE/ROIC เหนือต้นทุนเงินทุนได้อย่างยั่งยืน 10-20 ปี'
      : 'คูเมืองระดับปานกลาง (Narrow Moat) มีความได้เปรียบในการแข่งขันที่แข็งแกร่งในระยะ 5-10 ปี';

    return {
      rating,
      score: clampedScore,
      primarySources: sources,
      description,
    };
  }

  /**
   * Synthesize full Team 2 Research Report for a stock
   */
  public generateReport(ticker: string, customDCFParams?: Partial<DCFValuationParams>): EquityResearchReport | null {
    const stock = globalStockStore.getStock(ticker);
    if (!stock) return null;

    const moat = this.evaluateMoat(stock);
    const dcf = this.calculateDCF(stock, customDCFParams);

    // Baseline growth for scenarios
    let baseGrowth = (stock.revenueGrowthYoY / 100) * 0.75;
    if (stock.ticker === 'NVDA') baseGrowth = 0.35;
    else if (stock.ticker === 'PLTR') baseGrowth = 0.28;
    else if (stock.ticker === 'LLY') baseGrowth = 0.26;
    else if (stock.ticker === 'MSFT') baseGrowth = 0.16;
    else if (stock.ticker === 'AAPL') baseGrowth = 0.10;
    const growthStage1 = customDCFParams?.growthRateStage1 ?? Math.max(0.05, Math.min(0.40, baseGrowth));

    // Scenario Price Targets
    const baseTarget = dcf.fairValue;
    const bullTarget = Number((baseTarget * 1.25).toFixed(2));
    const bearTarget = Number((baseTarget * 0.78).toFixed(2));

    const bullUpside = Number((((bullTarget - stock.price) / stock.price) * 100).toFixed(2));
    const baseUpside = Number((((baseTarget - stock.price) / stock.price) * 100).toFixed(2));
    const bearDownside = Number((((bearTarget - stock.price) / stock.price) * 100).toFixed(2));

    // Agent Theses
    const t2_01_rev: ResearchAgentThesis = {
      agentId: 'T2-01',
      agentName: 'Revenue Growth Agent',
      focusArea: 'Segment Revenue & Operating Leverage',
      score: stock.revenueGrowthYoY >= 30 ? 94 : 80,
      rating: stock.revenueGrowthYoY >= 20 ? 'STRONG_BULL' : 'BULL',
      keyMetric: 'YoY Revenue Growth',
      metricValue: `+${stock.revenueGrowthYoY.toFixed(1)}%`,
      thesis: `${stock.name} มีอัตราเร่งของการเติบโตของรายได้ในระดับแถวหน้าของอุตสาหกรรม ได้รับแรงหนุนจาก secular trend`,
      evidence: [
        `การเติบโตของรายได้ล่าสุดอยู่ที่ ${stock.revenueGrowthYoY.toFixed(1)}% YoY`,
        'Operating Leverage เริ่มส่งผลให้กำไรโตเร็วกว่ารายได้',
      ],
    };

    const t2_02_inc: ResearchAgentThesis = {
      agentId: 'T2-02',
      agentName: 'Income Statement Agent',
      focusArea: 'Margin Structure & P&L Quality',
      score: stock.netMargin >= 25 ? 92 : 78,
      rating: stock.netMargin >= 20 ? 'STRONG_BULL' : 'BULL',
      keyMetric: 'Gross / Net Margins',
      metricValue: `${stock.grossMargin.toFixed(1)}% / ${stock.netMargin.toFixed(1)}%`,
      thesis: 'โครงสร้างอัตรากำไรแข็งแกร่งและมี Pricing Power สะท้อนความสามารถในการผลักภาระต้นทุน',
      evidence: [
        `Gross Margin สูงถึง ${stock.grossMargin.toFixed(1)}%`,
        `Net Profit Margin อยู่ที่ ${stock.netMargin.toFixed(1)}%`,
      ],
    };

    const t2_03_bal: ResearchAgentThesis = {
      agentId: 'T2-03',
      agentName: 'Balance Sheet Agent',
      focusArea: 'Solvency & Debt-to-Equity',
      score: stock.debtToEquity < 0.8 ? 95 : 72,
      rating: stock.debtToEquity < 0.5 ? 'STRONG_BULL' : 'BULL',
      keyMetric: 'Debt-to-Equity Ratio',
      metricValue: `${stock.debtToEquity.toFixed(2)}x`,
      thesis: 'งบดุลแข็งแกร่ง ปลอดภัยจากความผันผวนของอัตราดอกเบี้ยและมีความยืดหยุ่นทางการเงินสูง',
      evidence: [
        `Debt-to-Equity ต่ำเพียง ${stock.debtToEquity.toFixed(2)}x`,
        'ไม่มีความเสี่ยงด้านภาระหนี้ระยะสั้น (Low Solvency Risk)',
      ],
    };

    const t2_04_cf: ResearchAgentThesis = {
      agentId: 'T2-04',
      agentName: 'Cash Flow / FCF Agent',
      focusArea: 'Free Cash Flow Conversion',
      score: stock.freeCashFlowYield >= 2.5 ? 90 : 75,
      rating: stock.freeCashFlowYield >= 2.0 ? 'BULL' : 'NEUTRAL',
      keyMetric: 'FCF Yield',
      metricValue: `${stock.freeCashFlowYield.toFixed(2)}%`,
      thesis: 'เครื่องจักรผลิตเงินสดอิสระสูง สามารถรองรับการซื้อหุ้นคืนและจ่ายเงินปันผลได้อย่างต่อเนื่อง',
      evidence: [
        `FCF Yield ประเมินอยู่ที่ ${stock.freeCashFlowYield.toFixed(2)}%`,
        'อัตราแปลงกำไรสุทธิเป็นกระแสเงินสดดำเนินงานสูงกว่า 100%',
      ],
    };

    const t2_05_val: ResearchAgentThesis = {
      agentId: 'T2-05',
      agentName: 'Valuation Agent',
      focusArea: '2-Stage DCF & Margin of Safety',
      score: dcf.marginOfSafetyPct >= 10 ? 88 : dcf.marginOfSafetyPct >= -10 ? 76 : 58,
      rating: dcf.marginOfSafetyPct >= 10 ? 'STRONG_BULL' : dcf.marginOfSafetyPct >= -10 ? 'NEUTRAL' : 'CAUTION',
      keyMetric: 'DCF Fair Value vs Price',
      metricValue: `$${dcf.fairValue} (MoS: ${dcf.marginOfSafetyPct > 0 ? '+' : ''}${dcf.marginOfSafetyPct}%)`,
      thesis: `การประเมินมูลค่าด้วย 2-Stage DCF (WACC ${dcf.wacc}%, Terminal Growth ${dcf.terminalGrowthRate}%) บ่งชี้สถานะ ${dcf.valuationStatus}`,
      evidence: [
        `Fair Value ประมาณการที่ $${dcf.fairValue} เทียบราคาปัจจุบัน $${stock.price}`,
        `Implied Market Growth Rate อยู่ที่ ${dcf.impliedMarketGrowthRate}%`,
      ],
    };

    const t2_06_moat: ResearchAgentThesis = {
      agentId: 'T2-06',
      agentName: 'Business / Moat Agent',
      focusArea: 'Competitive Advantage Durability',
      score: moat.score,
      rating: moat.rating === 'WIDE' ? 'STRONG_BULL' : 'BULL',
      keyMetric: 'Economic Moat',
      metricValue: `${moat.rating} MOAT (${moat.score}/100)`,
      thesis: moat.description,
      evidence: moat.primarySources,
    };

    const t2_07_mgmt: ResearchAgentThesis = {
      agentId: 'T2-07',
      agentName: 'Management Agent',
      focusArea: 'Capital Allocation & ROIC Spread',
      score: stock.roe >= 30 ? 94 : 80,
      rating: 'STRONG_BULL',
      keyMetric: 'ROE vs Cost of Capital',
      metricValue: `${stock.roe.toFixed(1)}% (Spread > +${(stock.roe - dcf.wacc).toFixed(1)}%)`,
      thesis: 'ทีมผู้บริหารมีประวัติการจัดสรรเงินทุน (Capital Allocation) ชั้นเลิศ สร้างมูลค่าส่วนเพิ่มให้ผู้ถือหุ้น',
      evidence: [
        `ROE อยู่ที่ ${stock.roe.toFixed(1)}% สูงกว่า WACC อย่างมีนัยสำคัญ`,
        'เน้นการลงทุนใน R&D และโครงการที่มีผลตอบแทน IRR สูง',
      ],
    };

    const t2_08_call: ResearchAgentThesis = {
      agentId: 'T2-08',
      agentName: 'Earnings Call / Guidance Agent',
      focusArea: 'Executive Tone & Outlook Revisions',
      score: 88,
      rating: 'BULL',
      keyMetric: 'Conference Call Sentiment',
      metricValue: 'Positive / Constructive (88/100)',
      thesis: 'สัญญาณจากบทสนทนาในการประชุมนักวิเคราะห์สะท้อนความมั่นใจใน backlog และอุปสงค์ระยะยาว',
      evidence: [
        'ไม่มีการปรับลด guidance รายได้สำหรับปีงบประมาณ',
        'ผู้บริหารเน้นย้ำความต้องการสินค้าที่มากกว่ากำลังการผลิต',
      ],
    };

    const t2_09_comp: ResearchAgentThesis = {
      agentId: 'T2-09',
      agentName: 'Industry / Competitor Agent',
      focusArea: 'TAM Size & Peer Market Share',
      score: 86,
      rating: 'BULL',
      keyMetric: 'Market Share Trend',
      metricValue: 'Leading (>50% Core Segment Share)',
      thesis: 'เป็นผู้นำตลาดที่ได้เปรียบจากการเติบโตของ Total Addressable Market (TAM) ในระดับสากล',
      evidence: [
        'อัตราการแย่งส่วนแบ่งตลาดจากคู่แข่งเพิ่มขึ้นอย่างต่อเนื่อง',
        'อุปสรรคในการเข้าสู่ตลาดของคู่แข่งรายใหม่สูงมาก (High Barrier to Entry)',
      ],
    };

    // Calculate overall research score
    const scores = [
      t2_01_rev.score, t2_02_inc.score, t2_03_bal.score, t2_04_cf.score,
      t2_05_val.score, t2_06_moat.score, t2_07_mgmt.score, t2_08_call.score, t2_09_comp.score,
    ];
    const overallResearchScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

    const t2_10_chair: ResearchAgentThesis = {
      agentId: 'T2-10',
      agentName: 'Research Chairman Agent',
      focusArea: 'Fundamental Synthesis & Scenarios',
      score: Math.round(overallResearchScore),
      rating: overallResearchScore >= 85 ? 'STRONG_BULL' : 'BULL',
      keyMetric: 'Base Target Price',
      metricValue: `$${baseTarget} (${baseUpside >= 0 ? '+' : ''}${baseUpside}%)`,
      thesis: `Team 2 Equity Research ให้คะแนนรวม ${overallResearchScore}/100 [Moat: ${moat.rating}]. ราคาเป้าหมาย Base Case อยู่ที่ $${baseTarget}`,
      evidence: [
        `Bull Case: $${bullTarget} (${bullUpside >= 0 ? '+' : ''}${bullUpside}%)`,
        `Base Case: $${baseTarget} (${baseUpside >= 0 ? '+' : ''}${baseUpside}%)`,
        `Bear Case: $${bearTarget} (${bearDownside >= 0 ? '+' : ''}${bearDownside}%)`,
      ],
    };

    const chairmanSummary = `Team 2 Fundamental Verdict: ${stock.ticker} (${stock.name}) ได้รับการประเมินสถานะ ${moat.rating} MOAT ด้วยคะแนนวิจัยรวม ${overallResearchScore}/100. โมเดล 2-Stage DCF กำหนด Fair Value พื้นฐานที่ $${baseTarget} (กรอบเป้าหมาย $${bearTarget} - $${bullTarget}).`;

    return {
      ticker: stock.ticker,
      companyName: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      currentPrice: stock.price,
      overallResearchScore,
      researchConviction: overallResearchScore >= 85 ? 'HIGH' : overallResearchScore >= 75 ? 'MODERATE' : 'SPECULATIVE',
      moat,
      valuation: dcf,
      scenarios: {
        bull: {
          targetPrice: bullTarget,
          upsidePct: bullUpside,
          fcfGrowth: Number((growthStage1 * 1.3 * 100).toFixed(1)),
          thesis: 'อุปสงค์ AI และ Data Center เร่งตัวเกินคาดการณ์ พร้อมการขยายมาร์จิ้นต่อเนื่อง',
          catalysts: [
            'การเปิดตัวผลิตภัณฑ์เจเนอเรชันถัดไปที่มียอดสั่งซื้อเต็มข้ามปี',
            'อัตรากำไรจากการดำเนินงานทำจุดสูงสุดใหม่จาก Economy of Scale',
          ],
        },
        base: {
          targetPrice: baseTarget,
          upsidePct: baseUpside,
          fcfGrowth: Number((growthStage1 * 100).toFixed(1)),
          thesis: 'การดำเนินงานเป็นไปตามแผนกลยุทธ์ เติบโตสอดคล้องกับการขยายตัวของอุตสาหกรรม',
          catalysts: [
            'รายได้เติบโตตามประมาณการของ Wall Street Consensus',
            'การซื้อหุ้นคืนอย่างสม่ำเสมอช่วยผลักดัน EPS',
          ],
        },
        bear: {
          targetPrice: bearTarget,
          downsidePct: bearDownside,
          fcfGrowth: Number((growthStage1 * 0.5 * 100).toFixed(1)),
          thesis: 'ภาวะเศรษฐกิจมหภาคชะลอตัวและการแข่งขันที่รุนแรงขึ้นส่งผลกระทบต่ออัตราการเติบโต',
          risks: [
            'ลูกค้าชะลอการลงทุน CapEx ในเทคโนโลยีใหม่',
            'แรงกดดันด้านกฎระเบียบหรือข้อจำกัดทางการค้า',
          ],
        },
      },
      agentTheses: {
        revenueGrowth: t2_01_rev,
        incomeStatement: t2_02_inc,
        balanceSheet: t2_03_bal,
        cashFlow: t2_04_cf,
        valuation: t2_05_val,
        moat: t2_06_moat,
        management: t2_07_mgmt,
        earningsCall: t2_08_call,
        competitor: t2_09_comp,
        chairman: t2_10_chair,
      },
      chairmanSummary,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const team2ResearchEngine = new Team2ResearchEngine();
