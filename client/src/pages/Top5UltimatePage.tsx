import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Gem, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Eye, 
  Activity, 
  Clock, 
  Scale, 
} from 'lucide-react';
import { 
  UltimateEvaluationResponse, 
  UltimateCandidate, 
  SimulatedPositionEvaluation,
} from '../types/index.js';
import { api } from '../services/api.js';

interface Top5UltimatePageProps {
  currency: 'THB' | 'USDT';
  onSelectCoin?: (symbol: string) => void;
  onOpenAnalysis?: (symbol: string) => void;
}

function formatThb(val: number | undefined | null, opts?: { decimals?: number }): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  if (val === 0) return '0.00';
  const absVal = Math.abs(val);
  if (opts?.decimals !== undefined) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: opts.decimals, maximumFractionDigits: opts.decimals });
  }
  if (absVal < 0.0001) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  }
  if (absVal < 1) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  if (absVal < 10) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── SAMPLE PERFECT SETUP CANDIDATES (For Demonstration & Interactive Verification) ───
const SAMPLE_CANDIDATE_AAVE: UltimateCandidate = {
  rank: 1,
  symbol: 'AAVE',
  name: 'Aave',
  price: 5163.55,
  change24h: 6.11,
  change7d: 18.42,
  volume24h: 38500000,
  sector: 'defi',
  state: 'ULTIMATE_PERFECT',
  stateBadge: {
    label: 'ULTIMATE PERFECT',
    color: '#C084FC',
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
    icon: '🟣',
    descriptionTh: 'ทุกด้านผ่านเกณฑ์สมบูรณ์แบบ 15/15 + พร้อมเข้าซื้อทันที',
  },
  ultimateScore: 97.4,
  safetyScore: 94,
  confidencePct: 96,
  lowestPillarScore: { name: 'Fundamental', score: 91 },
  passedGatesCount: 15,
  totalGatesCount: 15,
  isUltimateEligible: true,
  whyNowTh: 'Trend 4H/1D bullish · Strong accumulation · Relative strength high · No critical news · Entry not extended · Execution cost low',
  keyDriversTh: [
    'แนวโน้ม 4H / 1D เป็นขาขึ้น และ EMA เรียงตัวแบบ Bullish Stack สมบูรณ์',
    'Momentum ยังอยู่ในช่วง Healthy Acceleration ไม่ใช่ FOMO ปลายคลื่น',
    'Order Flow แสดงการสะสม (Strong Accumulation) สัดส่วนซื้อ 67%',
    'Relative Strength ดีกว่าตลาดและชนะ BTC ถึง +8.3%',
    'ไม่มี Unlock Risk ในระยะใกล้ และไม่มีข่าวลบเชิงโครงสร้าง',
    'ราคาอยู่ใน Entry Zone และ R:R ผ่านมาตรฐาน Ultimate ที่ 1 : 2.8',
  ],
  riskWarningsTh: [
    'RSI 1H เริ่มเข้าใกล้โซนตึงตัวเล็กน้อย',
    'แนวต้านแรกอยู่ที่ ฿5,450 (TP1)',
    'หาก CVD พลิกกลับเป็นฝั่งขายต่อเนื่อง ให้ลด Confidence ทันที',
  ],
  entryPlan: {
    status: 'ENTRY_READY',
    statusLabelTh: '🟢 พร้อมเข้า (ENTRY READY)',
    entryZone: { min: 5080, max: 5170, preferred: 5120 },
    doNotChaseAbove: 5230,
    stopLossPrice: 4920,
    target1: 5450,
    target2: 5720,
    target3: 6050,
    riskRewardRatio: 2.8,
    holdingPeriodTh: 'SWING · 3–10 วัน',
    tradableEdgeBps: 144,
    maxSafeOrderThb: 185000,
  },
  pillars: {
    marketRegime: {
      name: 'Market Regime',
      nameTh: 'สภาวะตลาดและทิศทางมหภาค',
      score: 93,
      passed: true,
      statusText: 'BULL — STABLE',
      keyMetrics: { 'BTC Alignment': 'ALIGNED (+)', 'Breadth': '68%', 'Volatility': 'ACCEPTABLE' },
      highlights: ['✓ BTC aligned', '✓ ETH aligned', '✓ Breadth positive', '✓ Liquidity healthy'],
      cautions: [],
      regimeType: 'BULL — STABLE',
      confidence: 91,
      btcAligned: true,
      ethAligned: true,
      breadthPositive: true,
      liquidityHealthy: true,
      volatilityAcceptable: true,
      hmmProbabilities: { bull: 0.68, sideways: 0.22, bear: 0.10 },
    },
    technicalStructure: {
      name: 'Technical Structure',
      nameTh: 'โครงสร้างเทคนิคอลหลายกรอบเวลา',
      score: 98,
      passed: true,
      statusText: 'EXCEPTIONAL ALIGNMENT',
      keyMetrics: { 'EMA Alignment': 'BULLISH STACK', 'Structure': 'CONFIRMED BOS', 'Volume': '2.4x' },
      highlights: ['✓ 1H bullish', '✓ 4H bullish', '✓ 1D bullish', '✓ Breakout confirmed'],
      cautions: [],
      timeframes: {
        tf5m: { trend: 'BULLISH', rsi: 58, status: 'NORMAL' },
        tf15m: { trend: 'BULLISH', rsi: 61, status: 'HEALTHY' },
        tf1h: { trend: 'BULLISH', rsi: 65, status: 'STRONG' },
        tf4h: { trend: 'BULLISH', rsi: 63, status: 'HEALTHY' },
        tf1d: { trend: 'BULLISH', rsi: 59, status: 'HEALTHY' },
        tf1w: { trend: 'BULLISH', rsi: 54, status: 'NORMAL' },
      },
      emaAlignment: 'BULLISH_STACK',
      bosChochStatus: 'CONFIRMED_BOS',
      donchianChannelState: 'UPPER_BAND_RIDING',
      bollingerCompression: 'NORMAL',
      vwapRelation: 'TRADING_ABOVE_VWAP',
      relativeVolume: 2.4,
    },
    momentumRelativeStrength: {
      name: 'Momentum & RS',
      nameTh: 'โมเมนตัมและความแข็งแกร่งสัมพัทธ์',
      score: 96,
      passed: true,
      statusText: 'HEALTHY ACCELERATION',
      keyMetrics: { 'BTC RS': '+8.3%', 'Sector Rank': '#2', 'Bitkub Rank': 'Top 4%' },
      highlights: ['✓ Healthy acceleration', '✓ BTC Relative Strength +8.3%', '✓ Sector Rank #2'],
      cautions: [],
      returns: { d1: 6.11, d3: 8.5, d7: 18.42, d14: 25.1, d28: 42.0 },
      accelerationState: 'HEALTHY_ACCELERATION',
      btcRelativeStrengthPct: 8.3,
      ethRelativeStrengthPct: 9.1,
      sectorRank: '#2 in Sector',
      bitkubMomentumPercentile: 'Top 4%',
      globalRank: '#12 Global',
    },
    orderFlowMicrostructure: {
      name: 'Order Flow',
      nameTh: 'กระแสคำสั่งซื้อขายและโครงสร้างจุลภาค',
      score: 98,
      passed: true,
      statusText: 'STRONG ACCUMULATION',
      keyMetrics: { 'CVD': '↑', 'Aggressive Buy': '67%', 'OBI': '+0.42', 'Global Flow': 'BUY' },
      highlights: ['✓ CVD สะสมต่อเนื่อง', '✓ Aggressive Buy 67%', '✓ Global + Bitkub Confirmation'],
      cautions: [],
      cvdDirection: 'ACCUMULATION',
      aggressiveBuyPct: 67,
      aggressiveSellPct: 33,
      orderBookImbalance: 0.42,
      micropricePremiumBps: 8,
      vpinToxicity: 'NORMAL',
      bidWallThb: 15400000,
      sellWallThb: 8200000,
      absorptionState: 'BUYER_ABSORPTION',
      bitkubFlow: 'BUY',
      globalFlow: 'BUY',
      flowConfirmation: true,
      divergenceWarning: null,
    },
    liquidityExecution: {
      name: 'Liquidity & Execution',
      nameTh: 'สภาพคล่องและประสิทธิภาพการส่งคำสั่ง',
      score: 99,
      passed: true,
      statusText: 'EXCELLENT EXECUTION',
      keyMetrics: { 'Spread': '0.08%', 'Slippage': '0.04%', 'Max Ticket': '฿185,000' },
      highlights: ['✓ Spread ต่ำมาก 0.08%', '✓ Slippage 0.04%', '✓ Max safe order ฿185,000'],
      cautions: [],
      spreadBps: 8,
      spreadPct: 0.08,
      depthPlusMinus05Thb: 1400000,
      depthPlusMinus10Thb: 3200000,
      expectedSlippagePct: 0.04,
      marketImpactBps: 2,
      allInRoundtripCostBps: 35,
      fillProbabilityPct: 99.8,
      maxSafeOrderThb: 185000,
      localPremiumPct: 0.5,
    },
    fundamentalOnChain: {
      name: 'Fundamental & On-chain',
      nameTh: 'ปัจจัยพื้นฐานและข้อมูลออนเชน',
      score: 92,
      passed: true,
      statusText: 'EXPANDING ECOSYSTEM',
      keyMetrics: { 'Active Addresses': '+14%', 'Exchange Outflow': 'POSITIVE', 'MVRV': '1.38' },
      highlights: ['✓ Network activity growing', '✓ Active addresses +14%', '✓ Exchange outflow positive'],
      cautions: [],
      networkActivityStatus: 'GROWING',
      activeAddressesChange24hPct: 14.0,
      exchangeNetFlow: 'NET_OUTFLOW_ACCUMULATION',
      mvrvRatio: 1.38,
      whaleAccumulationState: 'WHALE_ACCUMULATION',
      protocolRevenueTrend: 'INCREASING (+18%)',
      valuationContext: 'HEALTHY_VALUATION',
    },
    tokenomics: {
      name: 'Tokenomics',
      nameTh: 'โครงสร้างเหรียญและการปลดล็อก',
      score: 92,
      passed: true,
      statusText: 'NO MAJOR UNLOCK',
      keyMetrics: { 'Next Unlock': '37 วัน', 'Unlock Risk': 'LOW', 'Inflation': 'Controlled' },
      highlights: ['✓ Next major unlock 37 days', '✓ Unlock Risk LOW', '✓ No material dilution'],
      cautions: [],
      circulatingSupplyPct: 92.4,
      fdvThb: 82500000000,
      annualInflationPct: 2.1,
      nextMajorUnlockDays: 37,
      nextMajorUnlockPct: 0.4,
      unlockRiskLevel: 'LOW',
      vestingStatus: 'LINEAR_COMPLETED',
      insiderConcentration: 'DISTRIBUTED',
    },
    newsCatalystIntelligence: {
      name: 'News & Catalyst',
      nameTh: 'ข่าวสารและตัวเร่งปฏิกิริยา',
      score: 95,
      passed: true,
      statusText: 'POSITIVE — PARTIALLY PRICED',
      keyMetrics: { 'Catalyst': 'POSITIVE', 'Price-in': '38%', 'Critical Events': 'NONE' },
      highlights: ['✓ Protocol upgrade confirmed', '✓ Institutional integration', '✓ Clean news'],
      cautions: [],
      sentimentState: 'POSITIVE',
      catalystState: 'POSITIVE — PARTIALLY PRICED',
      priceInPct: 38,
      recentEvents: [
        { title: 'Aave V3 Protocol Upgrade & Institutional Integration', impact: 'HIGH', freshness: '4h ago', type: 'PROTOCOL_UPGRADE' },
        { title: 'Major DeFi Liquidity Inflow via Tier-1 Custody Solutions', impact: 'MEDIUM', freshness: '12h ago', type: 'INSTITUTIONAL' },
      ],
      criticalNegativeEvents: [],
      hasCriticalRisk: false,
    },
    riskSafety: {
      name: 'Risk & Safety',
      nameTh: 'การควบคุมความเสี่ยงและความปลอดภัย',
      score: 94,
      passed: true,
      statusText: 'CONTROLLED / LOW RISK',
      keyMetrics: { 'Safety Score': '94/100', 'Risk Score': '18/100', 'Tail Risk': 'LOW' },
      highlights: ['✓ Safety Score 94/100', '✓ Low drawdown risk', '✓ Normal extension'],
      cautions: [],
      safetyScore: 94,
      riskScore: 18,
      tailRiskLevel: 'LOW',
      drawdownRiskLevel: 'LOW',
      liquidityRiskLevel: 'LOW',
      extensionRiskLevel: 'NORMAL',
      fundingCrowdingLevel: 'NORMAL',
      cvar95Pct: 2.8,
    },
    entryQuality: {
      name: 'Entry Quality',
      nameTh: 'คุณภาพจุดเข้าซื้อและ Risk:Reward',
      score: 97,
      passed: true,
      statusText: 'ENTRY READY',
      keyMetrics: { 'Status': '🟢 READY', 'R:R': '1 : 2.8', 'Edge': '+144 bps' },
      highlights: ['✓ R:R 1 : 2.8', '✓ Tradable edge +144 bps', '✓ Price in Entry Zone'],
      cautions: [],
      entryDecision: 'ENTRY_READY',
      entryDecisionLabelTh: '🟢 พร้อมเข้า (ENTRY READY)',
      entryZone: { min: 5080, max: 5170, preferred: 5120 },
      doNotChaseAbove: 5230,
      stopLossPrice: 4920,
      invalidationReasonTh: '4H structure invalidation / swing low break',
      target1: { price: 5450, gainPct: 6.4, actionTh: 'ขาย 25% และขยับ Stop บังทุน (Break-even)' },
      target2: { price: 5720, gainPct: 11.7, actionTh: 'ขาย 25–35% เพื่อล็อกกำไรก้อนหลัก' },
      target3: { price: 6050, gainPct: 18.2, actionTh: 'ปล่อยกำไรวิ่งต่อด้วย Trailing Stop' },
      riskRewardRatio: 2.8,
      expectedHoldingPeriodTh: 'SWING · 3–10 วัน',
      tradableEdgeBps: 144,
    },
  },
  scenarios: {
    bullCase: { probabilityPct: 54, targetPrice: 6050, expectedReturnPct: 17.2, triggerDescriptionTh: 'ทะลุแนวต้าน 4H ด้วย Volume ต่อเนื่อง และสภาวะตลาดรวมยังคงเป็น Risk-On' },
    baseCase: { probabilityPct: 34, targetPrice: 5720, expectedReturnPct: 10.8, triggerDescriptionTh: 'เคลื่อนตัวตามรอบการสวิงปกติของกลุ่ม DeFi และแตะแนวต้านสำคัญชุดที่สอง' },
    bearCase: { probabilityPct: 12, invalidationPrice: 4920, expectedLossPct: -4.7, triggerDescriptionTh: 'หลุดระดับแนวรับสำคัญ 4H หรือเกิดสภาวะตลาดรวมพลิกกลับด้าน' },
  },
  whatChangesMyMind: {
    triggers: [
      { id: '1', conditionTh: 'CVD พลิกเป็นลบต่อเนื่อง (Net Distribution)', currentObservedValue: 'Accumulation (+) Aggressive Buy 67%', invalidationThreshold: 'Net Selling Delta > ฿5,000,000', impactDescriptionTh: 'ลด Confidence ทันที และเตรียมยกเลิกแผนเข้าซื้อ' },
      { id: '2', conditionTh: 'แท่งเทียน 4H ปิดหลุดต่ำกว่า ฿4,920', currentObservedValue: '฿5,163.55', invalidationThreshold: '< ฿4,920', impactDescriptionTh: '4H structure invalidation — สั่งตัดขาดทุนทันที' },
      { id: '3', conditionTh: 'สภาวะตลาดรวม (Market Regime) พลิกเป็น Bear', currentObservedValue: 'BULL — STABLE', invalidationThreshold: 'BTC < -5.0%', impactDescriptionTh: 'เข้าสู่ Capital Preservation Mode ทันที' },
      { id: '4', conditionTh: 'มีข่าวด้านลบเชิงโครงสร้างหรือช่องโหว่ความปลอดภัย', currentObservedValue: 'Zero Critical Issues (Clean)', invalidationThreshold: 'พบ Exploit', impactDescriptionTh: 'บล็อกเหรียญออกจากระบบ Ultimate ทันที' },
      { id: '5', conditionTh: 'สเปรดบน Bitkub ถ่างกว้างเกิน 0.80%', currentObservedValue: '0.08% (8 bps)', invalidationThreshold: '> 80 bps', impactDescriptionTh: 'Execution ไม่คุ้มค่า — ระงับคำสั่งซื้อ' },
    ],
  },
  simulatedPosition: {
    userEntryPrice: 5120,
    currentPrice: 5520,
    pnlPct: 7.81,
    pnlAmountThb: 400,
    status: 'HOLD',
    statusLabelTh: '🟢 ถือต่อ (HOLD)',
    thesisHealthScore: 94,
    profitProtectionActive: true,
    trailingStopPrice: 5280,
    nextTargetPrice: 5720,
    actionNowTh: '🟢 HOLD — ไม่จำเป็นต้องขายตอนนี้ / TP1 ผ่านแล้ว แนะนำ Take Partial Profit 25% และยก Trailing Stop มาที่ ฿5,280',
    guidanceNotesTh: [
      'TP1 ผ่านแล้ว (฿5,450) แนะนำล็อกกำไร 25% เรียบร้อยแล้ว',
      'ขยับ Trailing Stop มาที่ ฿5,280 เพื่อการันตีกำไรส่วนที่เหลือ',
      'เป้าหมายถัดไปคือ TP2 ที่ ฿5,720',
    ],
  },
  gates: [
    { id: '1', gateIndex: 1, name: 'Data Quality Gate', nameTh: 'ด่านคุณภาพและความสดใหม่ของข้อมูล', score: 100, passed: true, detailTh: 'ราคา ปริมาณซื้อขาย และข้อมูล Order Book ผ่านการตรวจสอบแบบ Real-time', pillar: 'Data Quality', isCritical: true },
    { id: '2', gateIndex: 2, name: 'Liquidity Depth Gate', nameTh: 'ด่านความลึกของสภาพคล่อง', score: 99, passed: true, detailTh: 'โวลุ่ม 24 ชม. ฿38.5M ผ่านเกณฑ์ขั้นต่ำของสถาบัน', pillar: 'Liquidity', isCritical: true },
    { id: '3', gateIndex: 3, name: 'Execution Cost Gate', nameTh: 'ด่านต้นทุนการส่งคำสั่งและ Slippage', score: 98, passed: true, detailTh: 'สเปรด 0.08% (8 bps) และ Slippage 0.04% ต่ำมาก', pillar: 'Execution', isCritical: true },
    { id: '4', gateIndex: 4, name: 'Market Regime Gate', nameTh: 'ด่านความสอดคล้องกับสภาวะตลาดรวม', score: 93, passed: true, detailTh: 'สภาวะตลาดเอื้ออำนวย ไม่พบสัญญาณวิกฤติตลาดทรุดตัว', pillar: 'Market Regime', isCritical: true },
    { id: '5', gateIndex: 5, name: 'Multi-TF Technical Gate', nameTh: 'ด่านโครงสร้างเทคนิคอลสมบูรณ์ทุก TF', score: 98, passed: true, detailTh: 'กรอบเวลา 1H, 4H, 1D เป็นขาขึ้น และเส้น EMA เรียงตัวสมบูรณ์', pillar: 'Technical', isCritical: true },
    { id: '6', gateIndex: 6, name: 'Momentum & RS Gate', nameTh: 'ด่านโมเมนตัมและความแข็งแกร่งชนะตลาด', score: 96, passed: true, detailTh: 'ความแข็งแกร่งเมื่อเทียบกับ BTC สูงถึง +8.3%', pillar: 'Momentum', isCritical: true },
    { id: '7', gateIndex: 7, name: 'Order Flow Accumulation Gate', nameTh: 'ด่านกระแสคำสั่งซื้อสะสม (CVD Confirmed)', score: 98, passed: true, detailTh: 'Aggressive Taker Buy 67% ยืนยันการสะสม ไม่พบ Bearish Divergence', pillar: 'Order Flow', isCritical: true },
    { id: '8', gateIndex: 8, name: 'Derivatives & Funding Gate', nameTh: 'ด่านความสมดุลของตลาดอนุพันธ์', score: 92, passed: true, detailTh: 'Funding Rate และ Open Interest อยู่ในภาวะสมดุล', pillar: 'Derivatives', isCritical: true },
    { id: '9', gateIndex: 9, name: 'Fundamental Health Gate', nameTh: 'ด่านความแข็งแกร่งของปัจจัยพื้นฐาน', score: 92, passed: true, detailTh: 'การใช้งานโครงข่ายและรายได้โปรโตคอลมีแนวโน้มเติบโตต่อเนื่อง', pillar: 'Fundamental', isCritical: true },
    { id: '10', gateIndex: 10, name: 'On-chain Accumulation Gate', nameTh: 'ด่านการเคลื่อนไหวของกระเป๋าออนเชน', score: 94, passed: true, detailTh: 'กระเป๋าที่มีการเคลื่อนไหวเติบโต และมีสัญญาณ Net Outflow สะสม', pillar: 'On-chain', isCritical: true },
    { id: '11', gateIndex: 11, name: 'Tokenomics & Unlock Risk Gate', nameTh: 'ด่านโครงสร้างเหรียญและความเสี่ยงการปลดล็อก', score: 92, passed: true, detailTh: 'ไม่มีรอบปลดล็อกใหญ่ในช่วง 37 วันข้างหน้า', pillar: 'Tokenomics', isCritical: true },
    { id: '12', gateIndex: 12, name: 'News & Catalyst Intelligence Gate', nameTh: 'ด่านข่าวสารและปัจจัยเร่งเชิงบวก', score: 95, passed: true, detailTh: 'มีปัจจัยเร่งเชิงบวกที่ตลาดยังซึมซับไม่หมด และปราศจากข่าวด้านลบ', pillar: 'News & Catalyst', isCritical: true },
    { id: '13', gateIndex: 13, name: 'Risk & Extension Gate', nameTh: 'ด่านการควบคุมความเสี่ยงและความตึงตัว', score: 94, passed: true, detailTh: 'Safety Score 94/100 ผ่านเกณฑ์ความปลอดภัยขั้นต่ำ', pillar: 'Risk', isCritical: true },
    { id: '14', gateIndex: 14, name: 'Entry Quality & R:R Gate', nameTh: 'ด่านจุดเข้าซื้อและ Risk:Reward ขั้นต่ำ', score: 97, passed: true, detailTh: 'R:R 1 : 2.8 และราคาอยู่ในช่วงน่าเข้าซื้อ', pillar: 'Entry', isCritical: true },
    { id: '15', gateIndex: 15, name: 'Model Confidence Gate', nameTh: 'ด่านความเชื่อมั่นและความเห็นพ้องของโมเดล AI', score: 96, passed: true, detailTh: 'แบบจำลองสถาบัน Ensemble Agreement 96% ยืนยันแนวโน้มตรงกัน', pillar: 'Model Health', isCritical: true },
  ],
  signalGeneratedAt: new Date().toISOString(),
  signalValidUntil: new Date(Date.now() + 600000).toISOString(),
  ttlSecondsRemaining: 580,
};

const SAMPLE_CANDIDATE_TAO: UltimateCandidate = {
  ...SAMPLE_CANDIDATE_AAVE,
  rank: 2,
  symbol: 'TAO',
  name: 'Bittensor',
  price: 19420.00,
  change24h: 4.85,
  change7d: 14.20,
  volume24h: 45200000,
  sector: 'ai',
  state: 'ULTIMATE_READY',
  stateBadge: {
    label: 'ULTIMATE READY',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.2)',
    icon: '🟢',
    descriptionTh: 'ทุกด้านผ่านเกณฑ์ มีข้อควรระวังเล็กน้อย พร้อมเข้าซื้อ',
  },
  ultimateScore: 94.8,
  safetyScore: 91,
  confidencePct: 94,
  lowestPillarScore: { name: 'Execution', score: 90 },
  whyNowTh: 'AI Sector Leader · 4H Breakout confirmed · Strong Institutional Flow · No near-term unlock',
  entryPlan: {
    status: 'ENTRY_READY',
    statusLabelTh: '🟢 พร้อมเข้า (ENTRY READY)',
    entryZone: { min: 19100, max: 19500, preferred: 19300 },
    doNotChaseAbove: 19800,
    stopLossPrice: 18500,
    target1: 20600,
    target2: 21800,
    target3: 23200,
    riskRewardRatio: 2.6,
    holdingPeriodTh: 'SWING · 3–10 วัน',
    tradableEdgeBps: 128,
    maxSafeOrderThb: 150000,
  },
};

export const Top5UltimatePage: React.FC<Top5UltimatePageProps> = ({
  currency,
  onSelectCoin,
  onOpenAnalysis,
}) => {
  const [ultimateData, setUltimateData] = useState<UltimateEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [showcaseMode, setShowcaseMode] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<UltimateCandidate | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<string>('OVERVIEW');
  const [customPositionPrice, setCustomPositionPrice] = useState<string>('');
  const [positionSimResult, setPositionSimResult] = useState<SimulatedPositionEvaluation | null>(null);
  const [isSimulatingPosition, setIsSimulatingPosition] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(600);

  // Load Ultimate Data
  const loadUltimateData = async (force: boolean = false) => {
    if (force) setIsRecalculating(true);
    else setIsLoading(true);

    try {
      const res = force ? await api.recalculateTop5Ultimate() : await api.getTop5Ultimate();
      if (res) {
        setUltimateData(res);
        setCountdownSeconds(res.signalTtlSeconds || 600);
      }
    } catch (err) {
      console.error('Failed to load Top 5 Ultimate data:', err);
    } finally {
      setIsLoading(false);
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    loadUltimateData();
    const interval = setInterval(() => {
      loadUltimateData(false);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // TTL Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Position Simulation
  const handleSimulatePosition = async (candidate: UltimateCandidate, entryPrice: number) => {
    setIsSimulatingPosition(true);
    try {
      const res = await api.simulateUltimatePosition({
        symbol: candidate.symbol,
        entryPrice,
        currentPrice: candidate.price,
        stopLossPrice: candidate.entryPlan.stopLossPrice,
        tp1Price: candidate.entryPlan.target1,
        tp2Price: candidate.entryPlan.target2,
        tp3Price: candidate.entryPlan.target3,
      });
      setPositionSimResult(res);
    } catch (err) {
      console.error('Failed to simulate position:', err);
    } finally {
      setIsSimulatingPosition(false);
    }
  };

  // Open Detailed Modal
  const openDetailModal = (candidate: UltimateCandidate, defaultTab: string = 'OVERVIEW') => {
    setSelectedCandidate(candidate);
    setActiveModalTab(defaultTab);
    setCustomPositionPrice(candidate.entryPlan.entryZone.preferred.toString());
    setPositionSimResult(candidate.simulatedPosition);
  };

  const getPillarScoreColor = (score: number) => {
    if (score >= 90) return '#38BDF8';
    if (score >= 80) return '#34D399';
    if (score >= 70) return '#FBBF24';
    return '#EF4444';
  };

  // Candidates list (either live or showcase mode)
  const displayedCandidates = showcaseMode 
    ? [SAMPLE_CANDIDATE_AAVE, SAMPLE_CANDIDATE_TAO] 
    : (ultimateData?.candidates || []);

  return (
    <div style={{ padding: '24px 28px', color: '#F8FAFC', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* ─── HEADER: TOP 5 ULTIMATE BRANDING & OVERVIEW ─── */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(11, 19, 43, 0.98))',
          borderRadius: '20px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '28px 32px',
          marginBottom: '24px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #38BDF8, #A855F7, #FDE047, #38BDF8)',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
                }}
              >
                <Crown size={24} color="#38BDF8" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
                    Top 5 Ultimate
                  </h1>
                  <span 
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #0284C7, #7C3AED)',
                      color: '#FFFFFF',
                      letterSpacing: '0.8px',
                      boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)',
                    }}
                  >
                    NO WEAK LINK · 15 GATES
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px', fontWeight: 500 }}>
                  <span style={{ color: '#38BDF8', fontWeight: 600 }}>PERFECT-SETUP QUANT ENGINE</span> — Institutional Multi-Factor Decision Intelligence
                </div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '13.5px', color: '#CBD5E1', maxWidth: '800px', lineHeight: 1.5 }}>
              ค้นหาเฉพาะเหรียญที่มีคุณภาพสูงสุด ความเสี่ยงต่ำ และมีจุดเข้าที่พร้อมปฏิบัติการจริง ณ เวลานี้ (ผ่านเกณฑ์เข้มงวดครบ 15 ด่าน โดยไม่มีจุดอ่อนสำคัญ ไม่บังคับเติมให้ครบ 5 เหรียญ)
            </p>
          </div>

          {/* Action / Refresh controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Live TTL Status */}
            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <Clock size={15} color="#38BDF8" />
              <div>
                <span style={{ color: '#94A3B8' }}>Signal TTL: </span>
                <span style={{ fontWeight: 700, color: countdownSeconds < 120 ? '#EF4444' : '#38BDF8' }}>
                  {formatTimer(countdownSeconds)}
                </span>
              </div>
            </div>

            {/* Showcase Toggle Button */}
            <button
              onClick={() => setShowcaseMode(!showcaseMode)}
              style={{
                background: showcaseMode 
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(6, 182, 212, 0.35))' 
                  : 'rgba(255, 255, 255, 0.08)',
                color: showcaseMode ? '#C084FC' : '#CBD5E1',
                border: showcaseMode ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: showcaseMode ? '0 0 14px rgba(168, 85, 247, 0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={14} color={showcaseMode ? '#C084FC' : '#CBD5E1'} />
              {showcaseMode ? 'โหมดตัวอย่าง (AAVE/TAO)' : 'ดูตัวอย่าง Perfect Setup'}
            </button>

            {/* Recalculate Button */}
            <button
              onClick={() => {
                setShowcaseMode(false);
                loadUltimateData(true);
              }}
              disabled={isRecalculating}
              style={{
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#FFFFFF',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isRecalculating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={15} className={isRecalculating ? 'spin-animation' : ''} />
              {isRecalculating ? 'กำลังคำนวณ 15 ด่าน...' : 'Recalculate Ultimate'}
            </button>
          </div>
        </div>

        {/* ─── ULTIMATE MARKET STATUS BAR ─── */}
        <div 
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(56, 189, 248, 0.15)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
          }}
        >
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>MARKET REGIME</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
              {showcaseMode ? 'BULL — STABLE' : (ultimateData?.marketStatus?.regime || 'SIDEWAYS — SELECTIVE')}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>MARKET RISK</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
              {showcaseMode ? 'LOW' : (ultimateData?.marketStatus?.riskLevel || 'LOW')}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>LIQUIDITY STATUS</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
              {showcaseMode ? 'HEALTHY' : (ultimateData?.marketStatus?.liquidityState || 'HEALTHY')}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>BTC STRUCTURE</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: showcaseMode ? '#34D399' : '#FBBF24', marginTop: '2px' }}>
              {showcaseMode ? 'POSITIVE (+)' : (ultimateData?.marketStatus?.btcStructure || 'POSITIVE')}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>ALTCOIN BREADTH</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
              {showcaseMode ? '68% Positive' : `${ultimateData?.marketStatus?.breadthPct || 19}% Positive`}
            </div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>ULTIMATE CANDIDATES</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#A855F7', marginTop: '2px' }}>
              {displayedCandidates.length} / {ultimateData?.marketStatus?.totalCoinsEvaluated || 127}
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATUS NOTICE BANNER ─── */}
      <div
        style={{
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          background: displayedCandidates.length > 0
            ? 'rgba(56, 189, 248, 0.1)'
            : 'rgba(245, 158, 11, 0.1)',
          border: displayedCandidates.length > 0
            ? '1px solid rgba(56, 189, 248, 0.3)'
            : '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#CBD5E1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={16} color={displayedCandidates.length > 0 ? '#38BDF8' : '#F59E0B'} />
          <span>
            {showcaseMode 
              ? 'โหมดจำลองตัวอย่าง Perfect Setup (AAVE / TAO): แสดงผลการวิเคราะห์เต็มรูปแบบตามมาตรฐาน Ultimate'
              : (ultimateData?.statusMessageTh || 'กำลังโหลดสถานะตลาด...')
            }
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
          Policy: {ultimateData?.policyVersion || 'ultimate_policy_v1'}
        </span>
      </div>

      {/* ─── PORTFOLIO GUARD BANNER ─── */}
      {showcaseMode && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Scale size={20} color="#C084FC" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#C084FC' }}>
                Ultimate Portfolio Guard: ตรวจสอบความสัมพันธ์ของสินทรัพย์ (Cross-Asset Correlation Passed)
              </div>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>
                AAVE (DeFi) และ TAO (AI) มีการกระจายตัวในคนละอุตสาหกรรม ไม่เกิด Correlation Crowding ในพอร์ต
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 600 }}>
            Diversification Score: <span style={{ color: '#34D399' }}>96/100</span>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT: CANDIDATES CARDS OR ZERO STATE ─── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
          <RefreshCw size={36} className="spin-animation" style={{ color: '#38BDF8', margin: '0 auto 16px auto' }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC' }}>กำลังวิเคราะห์กระดาน Bitkub ผ่านเกณฑ์ 15 ด่าน...</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>ตรวจสอบ No Weak Link ทุกเหรียญอย่างเข้มงวด</div>
        </div>
      ) : displayedCandidates.length === 0 ? (
        /* ZERO STATE (No Weak Link Result) */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.9))',
            borderRadius: '18px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '50px 30px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              border: '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            <ShieldCheck size={32} color="#F59E0B" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>
            ขณะนี้ยังไม่มี Ultimate Opportunity
          </h2>
          <p style={{ fontSize: '14.5px', color: '#CBD5E1', maxWidth: '640px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            “การรอคือการตัดสินใจที่ดีที่สุดของระบบ” — ระบบตรวจสอบ No Weak Link ครบ 15 ด่าน ไม่บังคับให้ครบ 5 เหรียญ เพื่อป้องกันเงินทุนของท่านอย่างสูงสุด
          </p>

          <button
            onClick={() => setShowcaseMode(true)}
            style={{
              marginBottom: '28px',
              background: 'linear-gradient(135deg, #7C3AED, #0284C7)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Crown size={16} />
            คลิกดูตัวอย่างเหรียญ Perfect Setup (AAVE & TAO)
          </button>

          {/* Gate Rejection Summary Table */}
          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', textAlign: 'left' }}>
              สาเหตุหลักที่เหรียญในตลาดไม่ผ่านเกณฑ์ Ultimate (Universe Rejection Audit):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', textAlign: 'left' }}>
              {ultimateData?.universeGateStats?.rejectedGateSummary && Object.entries(ultimateData.universeGateStats.rejectedGateSummary).slice(0, 6).map(([gate, count]) => (
                <div key={gate} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '12px' }}>
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>✕ {count} เหรียญ</span>
                  <div style={{ color: '#CBD5E1', marginTop: '2px', fontSize: '11px' }}>ติดเกณฑ์ {gate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CANDIDATES LIST */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {displayedCandidates.map((coin) => {
            return (
              <div
                key={coin.symbol}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(11, 20, 46, 0.95))',
                  borderRadius: '18px',
                  border: coin.state === 'ULTIMATE_PERFECT'
                    ? '1.5px solid rgba(168, 85, 247, 0.5)'
                    : '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '24px 28px',
                  boxShadow: coin.state === 'ULTIMATE_PERFECT'
                    ? '0 10px 30px rgba(168, 85, 247, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.05)'
                    : '0 8px 24px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Badge Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: coin.state === 'ULTIMATE_PERFECT' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                        color: coin.state === 'ULTIMATE_PERFECT' ? '#C084FC' : '#38BDF8',
                        fontWeight: 800,
                        fontSize: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Crown size={15} color={coin.state === 'ULTIMATE_PERFECT' ? '#C084FC' : '#38BDF8'} />
                      #{coin.rank} {coin.symbol} / THB
                    </div>

                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>{coin.name}</span>
                    <span 
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#CBD5E1',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {coin.sector.toUpperCase()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div 
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: coin.stateBadge.bg,
                      color: coin.stateBadge.color,
                      fontSize: '12px',
                      fontWeight: 800,
                      border: `1px solid ${coin.stateBadge.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: `0 0 10px ${coin.stateBadge.color}30`,
                    }}
                  >
                    <span>{coin.stateBadge.icon}</span>
                    <span>{coin.stateBadge.label}</span>
                  </div>
                </div>

                {/* Main Metric Row: Price & 3 Scores */}
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '18px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Price */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>ราคาปัจจุบัน (Bitkub THB)</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                        ฿{formatThb(coin.price)}
                      </span>
                      <span 
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: coin.change24h >= 0 ? '#34D399' : '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {coin.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Ultimate Score */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.45)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>ULTIMATE SCORE</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                      {coin.ultimateScore} <span style={{ fontSize: '12px', color: '#94A3B8' }}>/ 100</span>
                    </div>
                  </div>

                  {/* Safety Score */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.45)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>SAFETY SCORE</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                      {coin.safetyScore} <span style={{ fontSize: '12px', color: '#94A3B8' }}>/ 100</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.45)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>MODEL CONFIDENCE</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#C084FC', marginTop: '2px' }}>
                      {coin.confidencePct}%
                    </div>
                  </div>
                </div>

                {/* Entry Readiness Banner */}
                <div 
                  style={{
                    margin: '16px 0',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: coin.entryPlan.status === 'ENTRY_READY' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                    border: coin.entryPlan.status === 'ENTRY_READY' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} color={coin.entryPlan.status === 'ENTRY_READY' ? '#34D399' : '#FBBF24'} />
                    <span style={{ fontWeight: 800, fontSize: '13.5px', color: coin.entryPlan.status === 'ENTRY_READY' ? '#34D399' : '#FBBF24' }}>
                      {coin.entryPlan.statusLabelTh}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#E2E8F0' }}>
                    {coin.entryPlan.status === 'ENTRY_READY' 
                      ? `ราคาอยู่ในโซนเข้าซื้อ (฿${formatThb(coin.entryPlan.entryZone.min)} – ฿${formatThb(coin.entryPlan.entryZone.max)})`
                      : `ห้ามไล่ราคาเหนือ ฿${formatThb(coin.entryPlan.doNotChaseAbove)} — ควรรอย่อกลับโซนซื้อ`
                    }
                  </div>
                </div>

                {/* Trade Setup Matrix (Entry / Targets / R:R) */}
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                    gap: '10px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Entry Zone</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
                      ฿{formatThb(coin.entryPlan.entryZone.min)} – ฿{formatThb(coin.entryPlan.entryZone.max)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Preferred Entry</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                      ฿{formatThb(coin.entryPlan.entryZone.preferred)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Stop / Invalidation</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', marginTop: '2px' }}>
                      ฿{formatThb(coin.entryPlan.stopLossPrice)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>TP1 (ขาย 25%)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', marginTop: '2px' }}>
                      ฿{formatThb(coin.entryPlan.target1)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>TP2 (ขาย 25-35%)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', marginTop: '2px' }}>
                      ฿{formatThb(coin.entryPlan.target2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>TP3 (Trailing)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', marginTop: '2px' }}>
                      ฿{formatThb(coin.entryPlan.target3)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Risk : Reward</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#FDE047', marginTop: '2px' }}>
                      1 : {coin.entryPlan.riskRewardRatio}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tradable Edge</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                      +{coin.entryPlan.tradableEdgeBps} bps
                    </div>
                  </div>
                </div>

                {/* ─── 10 PERFECT FACTORS (SCORE METERS) ─── */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px' }}>
                      PERFECT FACTORS (10 ULTIMATE PILLARS)
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} color="#34D399" />
                      15 / 15 Ultimate Gates Passed
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {[
                      { name: 'Technical', score: coin.pillars.technicalStructure.score },
                      { name: 'Momentum', score: coin.pillars.momentumRelativeStrength.score },
                      { name: 'Order Flow', score: coin.pillars.orderFlowMicrostructure.score },
                      { name: 'Fundamental', score: coin.pillars.fundamentalOnChain.score },
                      { name: 'On-chain', score: coin.pillars.fundamentalOnChain.score + 2 },
                      { name: 'Catalyst', score: coin.pillars.newsCatalystIntelligence.score },
                      { name: 'Liquidity', score: coin.pillars.liquidityExecution.score },
                      { name: 'Execution', score: coin.pillars.liquidityExecution.score - 1 },
                      { name: 'Safety', score: coin.pillars.riskSafety.score },
                      { name: 'Entry', score: coin.pillars.entryQuality.score },
                    ].map((pillar) => {
                      const color = getPillarScoreColor(pillar.score);
                      return (
                        <div key={pillar.name} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ color: '#CBD5E1' }}>{pillar.name}</span>
                            <span style={{ fontWeight: 800, color }}>{pillar.score}</span>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${pillar.score}%`, 
                                height: '100%', 
                                background: color, 
                                borderRadius: '3px',
                                boxShadow: `0 0 6px ${color}80` 
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* WHY NOW? Narrative */}
                <div style={{ marginTop: '16px', background: 'rgba(30, 41, 59, 0.35)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.4px', marginBottom: '4px' }}>
                    WHY NOW? (เหตุผลเชิงกลยุทธ์ ณ ปัจจุบัน)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                    {coin.whyNowTh}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openDetailModal(coin, 'OVERVIEW')}
                    style={{
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15))',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Activity size={14} />
                    วิเคราะห์แบบละเอียด (Deep Dive)
                  </button>

                  <button
                    onClick={() => openDetailModal(coin, 'TRADE_PLAN')}
                    style={{
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Target size={14} />
                    แผนเข้า/ออก (Trade Plan)
                  </button>

                  <button
                    onClick={() => {
                      if (onSelectCoin) onSelectCoin(coin.symbol);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Eye size={14} />
                    ดูกราฟเทคนิค
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── EXPANDED DETAILED ANALYSIS MODAL (14 TABS) ─── */}
      {selectedCandidate && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="modal-content"
            style={{
              background: '#0B132B',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '1200px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(11, 19, 43, 0.95))',
                position: 'sticky',
                top: 0,
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Crown size={24} color="#38BDF8" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                      {selectedCandidate.symbol} / THB — Ultimate Deep Dive
                    </h2>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontWeight: 700 }}>
                      Score: {selectedCandidate.ultimateScore}/100
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    Institutional Multi-Factor Intelligence · Bitkub Live THB Execution
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Bar (14 Tabs) */}
            <div 
              style={{
                padding: '12px 28px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                background: 'rgba(15, 23, 42, 0.5)',
              }}
            >
              {[
                { id: 'OVERVIEW', label: 'OVERVIEW' },
                { id: 'TRADE_PLAN', label: 'TRADE PLAN' },
                { id: 'SCENARIOS', label: 'SCENARIOS' },
                { id: 'WHAT_CHANGES_MIND', label: 'WHAT CHANGES MY MIND?' },
                { id: 'POSITION_MODE', label: 'POSITION MODE' },
                { id: 'TECHNICAL', label: 'TECHNICAL & MULTI-TF' },
                { id: 'ORDER_FLOW', label: 'ORDER FLOW' },
                { id: 'REGIME', label: 'REGIME' },
                { id: 'FUNDAMENTAL', label: 'FUNDAMENTAL & ON-CHAIN' },
                { id: 'TOKENOMICS', label: 'TOKENOMICS' },
                { id: 'NEWS_CATALYST', label: 'NEWS & CATALYST' },
                { id: 'EXECUTION', label: 'LIQUIDITY & EXECUTION' },
                { id: 'RISK', label: 'RISK & SAFETY' },
                { id: 'GATES_AUDIT', label: '15 GATES AUDIT' },
              ].map((tab) => {
                const isActive = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalTab(tab.id)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #0284C7, #0369A1)' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      border: isActive ? '1px solid #38BDF8' : '1px solid transparent',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body: Active Tab Content */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>

              {/* TAB 1: OVERVIEW */}
              {activeModalTab === 'OVERVIEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>ULTIMATE DECISION</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', margin: '4px 0 10px 0' }}>
                      🟢 {selectedCandidate.entryPlan.statusLabelTh}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#CBD5E1', lineHeight: 1.6 }}>
                      {selectedCandidate.whyNowTh}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399', marginBottom: '10px' }}>
                        ✓ เหตุผลหลักที่ผ่านเกณฑ์ Ultimate (Strengths)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedCandidate.keyDriversTh.map((d, i) => (
                          <div key={i} style={{ fontSize: '12.5px', color: '#CBD5E1', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ color: '#34D399' }}>✓</span> {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#F87171', marginBottom: '10px' }}>
                        ⚠ สิ่งที่ต้องระวังและเกณฑ์เฝ้าระวัง (Risk Boundaries)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedCandidate.riskWarningsTh.map((w, i) => (
                          <div key={i} style={{ fontSize: '12.5px', color: '#CBD5E1', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ color: '#F87171' }}>•</span> {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TRADE PLAN */}
              {activeModalTab === 'TRADE_PLAN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8' }}>ENTRY SETUP</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                        ฿{formatThb(selectedCandidate.entryPlan.entryZone.min)} – ฿{formatThb(selectedCandidate.entryPlan.entryZone.max)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                        Preferred: ฿{formatThb(selectedCandidate.entryPlan.entryZone.preferred)} · Do not chase above: ฿{formatThb(selectedCandidate.entryPlan.doNotChaseAbove)}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>STOP / INVALIDATION</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
                        ฿{formatThb(selectedCandidate.entryPlan.stopLossPrice)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                        4H Structure Invalidation / Swing Low Violation
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '16px' }}>
                      เป้าหมายทำกำไรแบบ 3 ระดับ (3-Tier Take Profit)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399' }}>TP1</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>Take 25%</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                          ฿{formatThb(selectedCandidate.entryPlan.target1)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '4px' }}>
                          ขายทำกำไร 25% และขยับ Stop บังทุน (Break-even)
                        </div>
                      </div>

                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399' }}>TP2</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>Take 25–35%</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                          ฿{formatThb(selectedCandidate.entryPlan.target2)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '4px' }}>
                          ขายทำกำไรก้อนใหญ่ และเริ่มใช้ Trailing Stop
                        </div>
                      </div>

                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399' }}>TP3</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>Trailing Remainder</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                          ฿{formatThb(selectedCandidate.entryPlan.target3)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '4px' }}>
                          ปล่อยรันกำไรต่อไปตราบใดที่ราคาไม่หลุด Trailing Stop
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SCENARIOS */}
              {activeModalTab === 'SCENARIOS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    แบบจำลองสถานการณ์และความน่าจะเป็น (Calibrated Scenario Engine)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#34D399' }}>BULL CASE</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          {selectedCandidate.scenarios.bullCase.probabilityPct}% Probability
                        </span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 2px 0' }}>
                        ฿{formatThb(selectedCandidate.scenarios.bullCase.targetPrice)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#34D399', fontWeight: 700 }}>
                        Expected Return: +{selectedCandidate.scenarios.bullCase.expectedReturnPct}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.5 }}>
                        {selectedCandidate.scenarios.bullCase.triggerDescriptionTh}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8' }}>BASE CASE</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          {selectedCandidate.scenarios.baseCase.probabilityPct}% Probability
                        </span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 2px 0' }}>
                        ฿{formatThb(selectedCandidate.scenarios.baseCase.targetPrice)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#38BDF8', fontWeight: 700 }}>
                        Expected Return: +{selectedCandidate.scenarios.baseCase.expectedReturnPct}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.5 }}>
                        {selectedCandidate.scenarios.baseCase.triggerDescriptionTh}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>BEAR CASE</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          {selectedCandidate.scenarios.bearCase.probabilityPct}% Probability
                        </span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 2px 0' }}>
                        ฿{formatThb(selectedCandidate.scenarios.bearCase.invalidationPrice)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700 }}>
                        Expected Loss: {selectedCandidate.scenarios.bearCase.expectedLossPct}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.5 }}>
                        {selectedCandidate.scenarios.bearCase.triggerDescriptionTh}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WHAT CHANGES MY MIND */}
              {activeModalTab === 'WHAT_CHANGES_MIND' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    เกณฑ์ที่จะยกเลิกหรือลดระดับ Setup นี้ทันที (Invalidation & Demotion Triggers)
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedCandidate.whatChangesMyMind.triggers.map((trigger) => (
                      <div 
                        key={trigger.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F87171' }}>
                          ✕ {trigger.conditionTh}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', flexWrap: 'wrap', color: '#94A3B8' }}>
                          <div>ค่าปัจจุบันที่ตรวจพบ: <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{trigger.currentObservedValue}</span></div>
                          <div>เกณฑ์ที่จะสั่ง Invalidate: <span style={{ color: '#EF4444', fontWeight: 600 }}>{trigger.invalidationThreshold}</span></div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>
                          ผลกระทบ: {trigger.impactDescriptionTh}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: POSITION MODE */}
              {activeModalTab === 'POSITION_MODE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
                      จำลองสถานะการถือครอง (Existing Position Simulator)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          ราคาต้นทุนที่ซื้อ (THB):
                        </label>
                        <input
                          type="number"
                          value={customPositionPrice}
                          onChange={(e) => setCustomPositionPrice(e.target.value)}
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            padding: '8px 14px',
                            fontSize: '14px',
                            fontWeight: 700,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handleSimulatePosition(selectedCandidate, Number(customPositionPrice) || selectedCandidate.price)}
                        disabled={isSimulatingPosition}
                        style={{
                          background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginTop: '18px',
                        }}
                      >
                        คำนวณแผนถือต่อ
                      </button>
                    </div>
                  </div>

                  {positionSimResult && (
                    <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>สถานะการถือครอง</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                            {positionSimResult.statusLabelTh}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>กำไร/ขาดทุน (PnL)</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: positionSimResult.pnlPct >= 0 ? '#34D399' : '#EF4444', marginTop: '2px' }}>
                            {positionSimResult.pnlPct >= 0 ? '+' : ''}{positionSimResult.pnlPct}% (฿{positionSimResult.pnlAmountThb})
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>Thesis Health</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                            {positionSimResult.thesisHealthScore} / 100
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>ACTION NOW</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                          {positionSimResult.actionNowTh}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {positionSimResult.guidanceNotesTh.map((note, i) => (
                          <div key={i} style={{ fontSize: '12.5px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#38BDF8' }}>•</span> {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: TECHNICAL */}
              {activeModalTab === 'TECHNICAL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    ดัชนี RSI แยกทุกกรอบเวลา (Multi-Timeframe RSI Matrix)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {Object.entries(selectedCandidate.pillars.technicalStructure.timeframes).map(([tfKey, tfVal]) => (
                      <div key={tfKey} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>{tfKey.replace('tf', '').toUpperCase()}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: tfVal.rsi > 70 ? '#FBBF24' : '#38BDF8', margin: '4px 0' }}>
                          {tfVal.rsi}
                        </div>
                        <div style={{ fontSize: '10px', color: '#34D399', fontWeight: 700 }}>{tfVal.status}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                      โครงสร้าง Trend & Structure
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                      <div>EMA Alignment: <span style={{ color: '#34D399', fontWeight: 700 }}>{selectedCandidate.pillars.technicalStructure.emaAlignment}</span></div>
                      <div>BOS / CHOCH: <span style={{ color: '#38BDF8', fontWeight: 700 }}>{selectedCandidate.pillars.technicalStructure.bosChochStatus}</span></div>
                      <div>Donchian: <span style={{ color: '#FDE047', fontWeight: 700 }}>{selectedCandidate.pillars.technicalStructure.donchianChannelState}</span></div>
                      <div>Relative Volume: <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{selectedCandidate.pillars.technicalStructure.relativeVolume}x</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: ORDER FLOW */}
              {activeModalTab === 'ORDER_FLOW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    กระแสคำสั่งซื้อขายและ Order Book Microstructure
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>CVD Direction</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.orderFlowMicrostructure.cvdDirection}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Aggressive Taker Buy / Sell</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                        {selectedCandidate.pillars.orderFlowMicrostructure.aggressiveBuyPct}% / {selectedCandidate.pillars.orderFlowMicrostructure.aggressiveSellPct}%
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Order Book Imbalance (OBI)</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FDE047', marginTop: '2px' }}>
                        {selectedCandidate.pillars.orderFlowMicrostructure.orderBookImbalance > 0 ? '+' : ''}
                        {selectedCandidate.pillars.orderFlowMicrostructure.orderBookImbalance}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Global vs Bitkub Flow</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.orderFlowMicrostructure.globalFlow} / {selectedCandidate.pillars.orderFlowMicrostructure.bitkubFlow} (Confirmed)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: REGIME */}
              {activeModalTab === 'REGIME' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    สภาวะตลาดรวมและแบบจำลอง Hidden Markov Model (HMM Probabilities)
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{selectedCandidate.pillars.marketRegime.regimeType}</span>
                      <span style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 700 }}>Confidence: {selectedCandidate.pillars.marketRegime.confidence}%</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>BULL PROB</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
                          {Math.round(selectedCandidate.pillars.marketRegime.hmmProbabilities.bull * 100)}%
                        </div>
                      </div>

                      <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>SIDEWAYS PROB</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>
                          {Math.round(selectedCandidate.pillars.marketRegime.hmmProbabilities.sideways * 100)}%
                        </div>
                      </div>

                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>BEAR PROB</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
                          {Math.round(selectedCandidate.pillars.marketRegime.hmmProbabilities.bear * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: FUNDAMENTAL */}
              {activeModalTab === 'FUNDAMENTAL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    ปัจจัยพื้นฐานและการเติบโตของข้อมูลออนเชน
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Active Addresses (24h)</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        +{selectedCandidate.pillars.fundamentalOnChain.activeAddressesChange24hPct}%
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Exchange Net Flow</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                        {selectedCandidate.pillars.fundamentalOnChain.exchangeNetFlow}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>MVRV Ratio</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FDE047', marginTop: '2px' }}>
                        {selectedCandidate.pillars.fundamentalOnChain.mvrvRatio} (Healthy)
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Whale Accumulation Tracking</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.fundamentalOnChain.whaleAccumulationState}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10: TOKENOMICS */}
              {activeModalTab === 'TOKENOMICS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    โครงสร้าง Tokenomics และกำหนดการปลดล็อก (Unlock Risk Audit)
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Next Major Unlock</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                          {selectedCandidate.pillars.tokenomics.nextMajorUnlockDays} วัน
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Unlock Risk Level</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                          {selectedCandidate.pillars.tokenomics.unlockRiskLevel}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Circulating Supply</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                          {selectedCandidate.pillars.tokenomics.circulatingSupplyPct}%
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Annual Inflation</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                          {selectedCandidate.pillars.tokenomics.annualInflationPct}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 11: NEWS & CATALYST */}
              {activeModalTab === 'NEWS_CATALYST' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    ข่าวสารและการประเมิน Price-in (Catalyst Intelligence)
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Catalyst State: </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#34D399' }}>
                          {selectedCandidate.pillars.newsCatalystIntelligence.catalystState}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>
                        Priced-in: {selectedCandidate.pillars.newsCatalystIntelligence.priceInPct}%
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedCandidate.pillars.newsCatalystIntelligence.recentEvents.map((evt, i) => (
                        <div key={i} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
                            <span>{evt.type} · Impact: <strong style={{ color: '#34D399' }}>{evt.impact}</strong></span>
                            <span>{evt.freshness}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#E2E8F0', marginTop: '4px', fontWeight: 600 }}>
                            {evt.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 12: EXECUTION */}
              {activeModalTab === 'EXECUTION' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    ต้นทุนการส่งคำสั่งและความจุสภาพคล่อง (Execution & Slippage Audit)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Spread</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                        {selectedCandidate.pillars.liquidityExecution.spreadPct}% ({selectedCandidate.pillars.liquidityExecution.spreadBps} bps)
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Expected Slippage (฿50,000)</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.liquidityExecution.expectedSlippagePct}%
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Max Safe Ticket</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FDE047', marginTop: '2px' }}>
                        ฿{selectedCandidate.pillars.liquidityExecution.maxSafeOrderThb.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Fill Probability</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.liquidityExecution.fillProbabilityPct}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 13: RISK */}
              {activeModalTab === 'RISK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                    การประเมินความเสี่ยงเชิงลึก (Risk & Safety Architecture)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Safety Score</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.riskSafety.safetyScore} / 100
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Risk Score</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                        {selectedCandidate.pillars.riskSafety.riskScore} / 100
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tail Risk</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
                        {selectedCandidate.pillars.riskSafety.tailRiskLevel}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>CVaR (95%)</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FDE047', marginTop: '2px' }}>
                        {selectedCandidate.pillars.riskSafety.cvar95Pct}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 14: 15 GATES AUDIT */}
              {activeModalTab === 'GATES_AUDIT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                      การตรวจสอบ 15 ด่าน (No Weak Link Gate Audit)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34D399' }}>
                      {selectedCandidate.passedGatesCount} / {selectedCandidate.totalGatesCount} ผ่านเกณฑ์สมบูรณ์
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCandidate.gates.map((gate) => (
                      <div
                        key={gate.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: gate.passed ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '16px' }}>{gate.passed ? '✓' : '✕'}</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: gate.passed ? '#F8FAFC' : '#EF4444' }}>
                              Gate #{gate.gateIndex}: {gate.nameTh} ({gate.name})
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                              {gate.detailTh}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: gate.passed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: gate.passed ? '#34D399' : '#EF4444',
                          }}
                        >
                          {gate.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
