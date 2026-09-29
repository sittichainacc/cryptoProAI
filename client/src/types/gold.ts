// ⚠ สำเนาจาก server/src/engines/gold/gold_types.ts — แก้ไขที่ server แล้วคัดลอกมาใหม่
/**
 * 🥇 Gold Intelligence Module — Type Definitions
 * AI Multi-Factor Gold Decision Engine
 *
 * หลักการ: ทุก Engine คืน `bias` (-100 = Bearish ทอง … +100 = Bullish ทอง)
 * Decision Engine เลือกทิศทาง แล้วแปลงเป็น Pillar Score ตามทิศทางนั้น
 * ข้อมูลที่ไม่มีจริง = null (ห้ามสุ่มแทน) และไม่นำไปคิดคะแนน
 */

export type Bias3 = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type TradeSide = 'LONG' | 'SHORT';

// ─── Data Source Status ───
export interface GoldSourceStatus {
  id: string;
  label: string;
  source: string;
  status: 'LIVE' | 'STALE' | 'UNAVAILABLE';
  ageSec: number;
  note?: string;
}

// ─── Gold Price Data ───
export interface GoldPriceData {
  xauUsd: number;               // XAU/USD spot (ประมาณจาก COMEX − basis หากไม่มี spot สด)
  xauUsdChange24h: number;
  xauUsdChange24hPct: number;
  xauUsdHigh24h: number;
  xauUsdLow24h: number;
  spotIsEstimated: boolean;
  comexPrice: number;           // GC=F (front/active contract)
  comexBasis: number;           // COMEX − Spot
  thaiGoldBarBuy: number | null;     // ทองคำแท่ง รับซื้อ (บาทละ)
  thaiGoldBarSell: number | null;    // ทองคำแท่ง ขายออก
  thaiGoldOrnamentBuy: number | null;
  thaiGoldOrnamentSell: number | null;
  thaiGoldChange: number | null;     // เปลี่ยนแปลงจากวันก่อน (บาท)
  thaiGoldAsTime: string | null;     // เวลาประกาศของสมาคมฯ
  thaiGoldRound: number | null;      // ครั้งที่ประกาศ
  usdThb: number | null;
  goldSpotSource: string;
  thaiGoldSource: string;
  marketOpen: boolean;
  lastCandleTime: number;       // unix sec
}

// ─── Trading Mode ───
export type GoldTradingMode =
  | 'XAU_USD_SPOT'
  | 'COMEX_FUTURES'
  | 'THAI_GOLD_BAR'
  | 'GOLD_FUTURES_TFEX'
  | 'PORTFOLIO_GOLD';

// ─── Regime ───
export type GoldTrendRegime = 'STRONG_BULL' | 'BULL' | 'SIDEWAYS' | 'BEAR' | 'STRONG_BEAR';
export type GoldVolatilityRegime = 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
export type GoldMacroRegime = 'DOVISH' | 'NEUTRAL' | 'HAWKISH';
export type GoldUsdRegime = 'WEAKENING' | 'NEUTRAL' | 'STRENGTHENING';
export type GoldRealYieldRegime = 'FALLING' | 'STABLE' | 'RISING';
export type GoldSafeHavenRegime = 'NORMAL' | 'ELEVATED' | 'EXTREME';
export type GoldStateRegime = 'TREND' | 'PULLBACK' | 'BREAKOUT' | 'EXHAUSTION' | 'SHOCK' | 'RECOVERY' | 'RANGE';

export interface GoldRegimeFactor {
  name: string;
  value: string;
  isBullish: boolean;
  icon: string; // ✓ ✕ — ⚠
}

export interface GoldRegimeResult {
  trend: GoldTrendRegime;
  volatility: GoldVolatilityRegime;
  macro: GoldMacroRegime;
  usd: GoldUsdRegime;
  realYield: GoldRealYieldRegime;
  safeHaven: GoldSafeHavenRegime;
  state: GoldStateRegime;
  confidence: number;
  labelTh: string;
  adviceTh: string;
  factors: GoldRegimeFactor[];
}

// ─── Technical ───
export interface GoldRsiTimeframe {
  timeframe: string;
  value: number | null;
  label: string;
  color: string;
}

export interface GoldMtfRsiMatrix {
  timeframes: GoldRsiTimeframe[];
  overallStatus: string;
  interpretationTh: string;
  hasOverboughtRisk: boolean;
  hasOversoldRisk: boolean;
  hasBearishDivergence: boolean;
  hasBullishDivergence: boolean;
}

export interface GoldTimeframeBias {
  timeframe: string;
  bias: Bias3;
  close: number;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
}

export interface GoldTechnicalResult {
  trendAlignment: { score: number; direction: 'BULLISH' | 'BEARISH' | 'MIXED'; descTh: string; perTimeframe: GoldTimeframeBias[] };
  structure: GoldStructureResult;
  breakout: { isBreakout: boolean; direction: Bias3; level: number; donchianHigh: number; donchianLow: number; score: number; descTh: string };
  meanReversion: { deviationAtr: number; score: number; descTh: string };
  momentum: { score: number; roc5d: number; acceleration: 'ACCELERATING' | 'STEADY' | 'DECELERATING'; descTh: string };
  volatility: { atr4h: number; atrDaily: number; realizedVol: number; atrPercentile: number; regime: GoldVolatilityRegime; squeeze: boolean; descTh: string };
  rsiMatrix: GoldMtfRsiMatrix;
  volumeProfile: { poc: number; hvn: number[]; lvn: number[]; descTh: string };
  supportResistance: { supports: number[]; resistances: number[]; descTh: string };
  vwap: { sessionVwap: number; anchoredVwap: number; anchorLabel: string; deviation: number; descTh: string };
  fibonacci: { swingHigh: number; swingLow: number; levels: Record<string, number>; descTh: string };
  bias: number;         // -100..100
  overallScore: number; // 0..100 (bullish-oriented)
  overallBias: Bias3;
  summaryTh: string;
}

export interface GoldStructureResult {
  pattern: string;
  trend: Bias3;
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
  event: 'BOS_UP' | 'BOS_DOWN' | 'CHOCH_UP' | 'CHOCH_DOWN' | null;
  bias: number;
  score: number;
  descTh: string;
}

// ─── Order Flow (COMEX proxy) ───
export type GoldOrderFlowState = 'STRONG_ACCUMULATION' | 'ACCUMULATION' | 'NEUTRAL' | 'DISTRIBUTION' | 'STRONG_DISTRIBUTION';

export interface GoldOrderFlowResult {
  state: GoldOrderFlowState;
  comexVolume24h: number | null;
  rvol: number | null;                 // volume 24h / avg 24h (20 วัน)
  cvdProxy24h: number | null;          // Σ volume × CLV (ประมาณแรงซื้อ-ขายสุทธิ)
  cvdDirection: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  cvdDivergence: boolean;
  absorption: boolean;
  cot: {
    reportDate: string;
    openInterest: number;
    oiChangeWeek: number;
    specNet: number;
    specNetChangeWeek: number;
    specNetPercentile26w: number;
    priceChangeWeekPct: number | null;
    priceVsOi: string;
  } | null;
  largeTrades: string | null;
  priceVsVolume: string;
  interpretationTh: string;
  methodNote: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;   // 0-100 — proxy จาก OHLCV จึงต่ำโดยธรรมชาติ
  rawBias: number;           // bias ก่อนหักด้วย confidence
  bias: number;
  score: number;
}

// ─── Macro ───
export interface MacroDataPoint {
  name: string;
  period: string;
  expected: string | null;
  actual: string;
  previous: string;
  surprise: string | null;
  surpriseBasis: 'CONSENSUS' | 'PREVIOUS';
  goldImpact: Bias3;
  reasonTh: string;
  source: string;
}

export interface GoldMacroResult {
  fedBias: GoldMacroRegime;
  fedBiasConfidence: number;
  rateCutExpectation: string;
  policySpread2y3m: number | null;   // 2Y − 3M (bp) — market-implied path
  cpiLatest: MacroDataPoint | null;
  nfpLatest: MacroDataPoint | null;
  coreCpiLatest: MacroDataPoint | null;
  unemploymentLatest: MacroDataPoint | null;
  us10yYield: number | null;
  us2yYield: number | null;
  us3mYield: number | null;
  realYield10y: number | null;
  realYieldChange20dBp: number | null;
  realYieldTrend: GoldRealYieldRegime;
  breakeven10y: number | null;
  nextFomcDate: string | null;
  nextFomcCountdown: string | null;
  macroSentiment: 'BULLISH_GOLD' | 'BEARISH_GOLD' | 'NEUTRAL';
  bias: number;
  score: number;
  summaryTh: string;
  recentEvents: MacroDataPoint[];
  yieldsAsOf: string | null;
}

// ─── Intermarket ───
export interface IntermarketItem {
  key: string;
  name: string;
  value: string;
  change5dPct: number | null;
  change20dPct: number | null;
  direction: '↑' | '↓' | '→';
  goldImpact: Bias3;
  correlation60d: number | null;
  descTh: string;
  available: boolean;
}

export interface GoldIntermarketResult {
  items: IntermarketItem[];
  bias: number;
  score: number;
  overallBias: Bias3;
  summaryTh: string;
}

// ─── News ───
export interface GoldNewsItem {
  headline: string;
  source: string;
  link: string;
  reliability: number;
  impact: number;
  freshness: number;
  novelty: number;
  pricedIn: number;
  goldEffect: Bias3;
  horizon: string;
  timestampIso: string;
  category: string;
  isPrimarySource: boolean;
}

export interface GoldNewsResult {
  latestEvents: GoldNewsItem[];
  overallSentiment: Bias3;
  sentimentScore: number;
  geopoliticalIntensity: number; // 0-100
  bias: number;
  summaryTh: string;
  methodNote: string;
}

// ─── Fundamental ───
export interface GoldFundamentalComponent {
  key: string;
  name: string;
  score: number | null;   // null = ไม่มีข้อมูล
  trend: string;
  descTh: string;
  source: string;
  asOf: string | null;
}

export interface GoldFundamentalResult {
  components: GoldFundamentalComponent[];
  coveragePct: number;
  overallScore: number | null;
  bias: number;
  summaryTh: string;
}

// ─── Event Risk ───
export interface GoldEventRisk {
  eventName: string;
  timeIso: string;
  countdown: string;
  countdownMinutes: number; // ติดลบ = ผ่านไปแล้ว
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  forecast: string | null;
  previous: string | null;
  recommendation: 'WAIT' | 'CAUTION' | 'CLEAR' | 'CONFIRMING';
  reasonTh: string;
  eventType: string | null;     // CPI / NFP / FOMC ...
  windowPreMin: number;
  windowPostMin: number;
  windowSource: 'LEARNED' | 'DEFAULT';
}

export interface GoldEventRiskResult {
  upcomingEvents: GoldEventRisk[];
  recentEvents: GoldEventRisk[];
  nextHighImpact: GoldEventRisk | null;
  isBlocked: boolean;
  blockPhase: 'PRE_EVENT' | 'POST_EVENT' | null;
  blockReasonTh: string;
  overallRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  windowNote: string;
}

// ─── Risk ───
export interface GoldRiskItem {
  name: string;
  nameTh: string;
  score: number;
  level: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' | 'EXTREME';
  descTh: string;
}

export interface GoldRiskResult {
  items: GoldRiskItem[];
  overall: number;
  overallLevel: 'LOW' | 'MODERATE_LOW' | 'MODERATE' | 'MODERATE_HIGH' | 'HIGH';
  summaryTh: string;
}

// ─── Entry ───
export type GoldSetupType =
  | 'TREND_PULLBACK'
  | 'BREAKOUT_RETEST'
  | 'LIQUIDITY_SWEEP_REVERSAL'
  | 'COMPRESSION_BREAKOUT'
  | 'MACRO_CONFIRMATION_ENTRY'
  | 'NONE';

export interface GoldEntryZone {
  side: TradeSide;
  entryLow: number;
  entryHigh: number;
  bestEntry: number;
  chaseLevel: number;   // LONG: ห้ามไล่ซื้อเหนือ / SHORT: ห้ามไล่ขายต่ำกว่า
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: number;
  holdingPeriod: string;
}

export interface GoldSetupCandidate {
  type: GoldSetupType;
  side: TradeSide;
  ready: boolean;          // เงื่อนไข setup ครบ
  quality: number;         // 0-100
  inZone: boolean;         // ราคาอยู่ในโซนเข้า
  extended: boolean;       // ราคาเกิน chase level
  zone: GoldEntryZone | null;
  triggerLevel: number | null; // สำหรับ WAIT_FOR_BREAKOUT
  descTh: string;
  track?: { trades: number; winRateTp1: number; expectancyR: number; hasEdge: boolean } | null; // ผล backtest ของ setup นี้
}

// ─── Signal States ───
export type GoldSignalState =
  | 'LONG_READY'
  | 'SHORT_READY'
  | 'WAIT_FOR_PULLBACK'
  | 'WAIT_FOR_BREAKOUT'
  | 'WAIT_FOR_NEWS'
  | 'REVERSAL_WATCH'
  | 'HOLD_LONG'
  | 'HOLD_SHORT'
  | 'PROTECT_PROFIT'
  | 'TAKE_PARTIAL_PROFIT'
  | 'EXIT'
  | 'EMERGENCY_EXIT'
  | 'NO_TRADE';

export interface GoldSignalStateInfo {
  state: GoldSignalState;
  emoji: string;
  color: string;
  labelTh: string;
  descTh: string;
}

export interface ThaiGoldPlan {
  side: 'BUY';
  buyZoneLow: number;
  buyZoneHigh: number;
  bestBuy: number;
  chaseAbove: number;
  invalidation: number;
  tp1: number;
  tp2: number;
  tp3: number;
  spreadBaht: number;
  breakevenMovePct: number;
  warningTh: string[];
}

export interface GoldTradePlan {
  signal: GoldSignalStateInfo;
  direction: TradeSide | null;
  entry: GoldEntryZone | null;        // หน่วยตามโหมด (XAU spot / COMEX)
  priceUnit: 'USD_SPOT' | 'USD_COMEX';
  setupType: GoldSetupType;
  setups: GoldSetupCandidate[];
  confidence: number;
  nowActionTh: string;               // "ตอนนี้ทำอะไร" ประโยคเดียว
  whyNow: string[];
  whyNot: string[];
  watchOut: string[];
  whatChanges: string[];
  waitLevels: { pullbackTo: number | null; breakoutAbove: number | null; breakdownBelow: number | null };
  aiExplanationTh: string;
  thaiGoldEntry: ThaiGoldPlan | null;
}

// ─── Position ───
export interface GoldPosition {
  side: TradeSide;
  unit: 'USD' | 'THB';
  entryPrice: number;
  currentPrice: number;       // LONG ทองไทย = ราคารับซื้อ (ขายคืนได้จริง)
  profitPct: number;
  profitR: number;
  mfeR: number | null;
  maeR: number | null;
  initialStop: number;
  trailingStop: number;
  tp1: number;
  tp2: number;
  tp3: number;
  thesisHealth: number;
  action: GoldSignalState;
  actionDescTh: string;
  actionStepsTh: string[];
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
}

// ─── Conviction ───
export interface GoldPillarScore {
  name: string;
  nameTh: string;
  score: number | null;  // null = ไม่มีข้อมูล (ไม่นับ)
  weight: number;
  minGate: number | null;
  isGatePass: boolean;
}

export interface GoldConvictionScore {
  side: TradeSide;          // ฝั่งที่ใช้ประเมิน pillar (ทองไทย = LONG เสมอ)
  direction: TradeSide | null;
  directionalBias: number;  // -100..100
  pillars: GoldPillarScore[];
  totalScore: number;
  rawScore: number;
  isAllGatesPass: boolean;
  blockedPillars: string[];
  dataCoveragePct: number;
  effectiveScore: number;   // Conviction × Data Confidence — ใช้ตัดสิน READY
}

// ─── Backtest V2 / Validation ───
export type ValidationTag = 'PROMOTE' | 'CONDITIONAL' | 'NEED_MORE_DATA' | 'REJECT';

export interface GoldBacktestBucket {
  label: string;
  trades: number;
  winRateTp1: number;     // % ถึง TP1 ก่อน SL
  winRateTp2: number;
  expectancyR: number;
  ciLowR: number | null;  // bootstrap 95% CI ของ expectancy
  ciHighR: number | null;
  profitFactor: number | null;
  avgMfeR: number;
  avgMaeR: number;
  maxDrawdownR: number;
  status: ValidationTag;
}

export interface GoldMatrixCell {
  setup: string; trend: string; side: string; session: string; eventState: string; vol: string;
  trades: number; expectancyR: number; winRateTp1: number; status: ValidationTag;
}

export interface GoldWalkForwardFold {
  fold: number;
  trainPeriod: string;
  testPeriod: string;
  chosenConfig: string;
  trainExpectancyR: number;
  testTrades: number;
  testExpectancyR: number;
}

export interface GoldCalibrationRow {
  bucket: string;
  trades: number;
  winRateTp1: number;
  winRateTp2: number;
  expectancyR: number;
  calibratedPTp1: number | null;  // isotonic fit (ใช้ได้เมื่อผ่านเกณฑ์ calibration เท่านั้น)
  calibratedPTp2: number | null;
  calibratedExpR: number | null;
}

export interface GoldCalibrationSlice {
  slice: string;
  trades: number;
  spearmanQualityVsR: number | null;
  monotonic: boolean;
}

export interface GoldExitPolicyResult {
  policy: 'FIXED' | 'PARTIAL_BE' | 'PARTIAL_TRAIL';
  labelTh: string;
  trades: number;
  expectancyR: number;
  winRate: number;
  avgWinR: number;
  avgLossR: number;
  mfeCapture: number;   // realized / MFE
  givebackR: number;    // MFE − realized เฉลี่ย
  maxDrawdownR: number;
}

export interface GoldEventStudyRow {
  type: string;
  nameTh: string;
  events: number;
  volExpansion: number;        // range แท่งข่าว / range ปกติของชั่วโมงเดียวกัน
  holdThroughStopRisk: number; // % ที่แท่งข่าว+แท่งถัดไปแกว่งเกิน 1 ATR(4H) — เสี่ยงโดน stop ถ้าถือผ่านข่าว
  whipsawRate: number;         // % ที่ทิศชั่วโมงแรกกลับด้านภายใน 4 ชม.
  hoursToStabilize: number;    // มัธยฐานชั่วโมงจนความผันผวนกลับปกติ
  reactionAccuracy: number | null; // % ที่ทองไปทางเดียวกับที่ surprise ชี้ (ภายใน 4 ชม.)
  reactionSamples: number;
  waitTable: { waitH: number; trades: number; expectancyR: number; stopOutRate: number }[];
  baselineExpectancyR: number;
  baselineStopOutRate: number;
  recommendedPreMin: number;
  recommendedPostMin: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  noteTh: string;
}

export interface GoldStatTests {
  psr: number;                 // P(Sharpe > 0)
  dsr: number;                 // Deflated Sharpe (หักผลของการลองหลาย config)
  pbo: number;                 // Probability of Backtest Overfitting (CSCV)
  realityCheckP: number;       // White's Reality Check p-value
  configsTested: number;
  sharpePerTrade: number;
}

export interface GoldValidationSummary {
  status: 'PRODUCTION' | 'RESEARCH_CONDITIONAL' | 'REJECTED';
  statusTh: string;
  historicalExpectancyR: number;
  recentExpectancyR: number;       // 6 เดือนล่าสุด
  walkForwardOosR: number | null;  // expanding walk-forward out-of-sample
  holdoutR: number | null;
  stability: 'HIGH' | 'MEDIUM' | 'MEDIUM_LOW' | 'LOW';
  sampleSize: number;
  calibrated: boolean;
  reasonsTh: string[];
}

export interface GoldBacktestResult {
  generatedAt: string;
  period: { from: string; to: string };
  timeframe: string;
  costPerSideUsd: number;
  validation: GoldValidationSummary;
  overall: GoldBacktestBucket;
  bySetup: GoldBacktestBucket[];
  byDimension: { dimension: string; buckets: GoldBacktestBucket[] }[];
  setupByTrend: GoldMatrixCell[];
  matrix: GoldMatrixCell[];
  walkForward: { expanding: GoldWalkForwardFold[]; rolling: GoldWalkForwardFold[]; holdout: GoldWalkForwardFold | null; configStability: number };
  parameterGrid: { config: string; trades: number; expectancyR: number; isDefault: boolean }[];
  stats: GoldStatTests;
  calibration: { rows: GoldCalibrationRow[]; spearman: number | null; monotonic: boolean; calibrated: boolean; slices: GoldCalibrationSlice[] };
  exitPolicies: GoldExitPolicyResult[];
  eventStudy: { rows: GoldEventStudyRow[]; eventsLoaded: number; granularityNote: string } | null;
  methodNoteTh: string[];
}

export interface GoldValidationStatus {
  available: boolean;
  status: GoldValidationSummary['status'] | 'VALIDATING';
  statusTh: string;
  historicalExpectancyR: number | null;
  recentExpectancyR: number | null;
  walkForwardOosR: number | null;
  stability: GoldValidationSummary['stability'] | null;
  sampleSize: number;
  setupStatus: ValidationTag | null;
  setupRegimeStatus: ValidationTag | null;
  setupTrack: { trades: number; winRateTp1: number; expectancyR: number } | null;
  winProbability: { calibrated: boolean; pTp1: number | null; pTp2: number | null; expectedR: number | null; noteTh: string };
}

// ─── Data Quality ───
export interface GoldDataCategory {
  key: string;
  nameTh: string;
  coverage: number;   // 0-100
  freshness: number;  // 0-100
  quality: number;    // 0-100 (ความน่าเชื่อถือของแหล่ง)
  noteTh: string;
}

export interface GoldDataQuality {
  categories: GoldDataCategory[];
  overallCoverage: number;
  freshness: number;
  sourceQuality: number;
  dataConfidence: number;  // 0-100
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  noteTh: string;
}

// ─── Final Response ───
export interface GoldSignalResponse {
  price: GoldPriceData;
  mode: GoldTradingMode;
  regime: GoldRegimeResult;
  technical: GoldTechnicalResult;
  orderFlow: GoldOrderFlowResult;
  macro: GoldMacroResult;
  intermarket: GoldIntermarketResult;
  news: GoldNewsResult;
  fundamental: GoldFundamentalResult;
  risk: GoldRiskResult;
  eventRisk: GoldEventRiskResult;
  conviction: GoldConvictionScore;
  tradePlan: GoldTradePlan;
  position: GoldPosition | null;
  validation: GoldValidationStatus;
  dataQuality: GoldDataQuality;
  alerts: { level: 'WARN' | 'ERROR'; messageTh: string }[];
  dataSources: GoldSourceStatus[];
  generatedAt: string;
  engineVersion: string;
  disclaimerTh: string;
}
