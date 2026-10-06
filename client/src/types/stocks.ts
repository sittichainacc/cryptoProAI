// ============================================================================
// Frontend Types: Global Stocks Multi-Agent Intelligence System
// ============================================================================

export type MarketRegimeType = 
  | 'STRONG_RISK_ON'
  | 'RISK_ON'
  | 'NEUTRAL'
  | 'RISK_OFF'
  | 'STRONG_RISK_OFF';

export type TimeHorizon = 'INTRADAY' | 'SWING' | 'POSITION' | 'LONG_TERM';

export type RecommendationDecision = 
  | 'STRONG_BUY'
  | 'BUY'
  | 'ACCUMULATE'
  | 'HOLD'
  | 'WAIT'
  | 'REDUCE'
  | 'SELL'
  | 'AVOID';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SECFilingItem {
  form: '10-K' | '10-Q' | '8-K';
  filingDate: string;
  periodEnded: string;
  reportUrl: string;
  title: string;
}

export interface TechnicalIndicatorSet {
  ticker: string;
  price: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr14: number;
  goldenCross: boolean;
  deathCross: boolean;
  priceAbove200Ema: boolean;
  distanceFrom52wHighPct: number;
  distanceFrom52wLowPct: number;
  relativeStrengthVsSpy: number;
  technicalScore: number;
  setupSummary: string;
}

export interface GlobalStockItem {
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE';
  sector: string;
  industry: string;
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  forwardPE: number;
  evToEbitda: number;
  roe: number;
  revenueGrowthYoY: number;
  epsGrowthYoY: number;
  freeCashFlowYield: number;
  grossMargin: number;
  netMargin: number;
  debtToEquity: number;
  piotroskiFScore: number;
  high52w: number;
  low52w: number;
  rsi14: number;
  ema50: number;
  ema200: number;
  volumeUsd24h: number;
  sparkline: number[];
  candles?: Candle[];
  secFilings?: SECFilingItem[];
  technicalIndicators?: TechnicalIndicatorSet;
  lastUpdated: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  thaiName: string;
  team: 1 | 2 | 3 | 4 | 'CIO';
  teamName: string;
  roleDescription: string;
  specialty: string;
  weight: number;
  modelProvider: string;
  modelName: string;
  temperature: number;
  isActive: boolean;
}

export interface TradePlan {
  id: string;
  ticker: string;
  companyName: string;
  strategy: string;
  direction: 'LONG' | 'SHORT';
  time_horizon: TimeHorizon;
  current_price: number;
  entry_low: number;
  entry_high: number;
  stop_loss: number;
  invalidation: number;
  tp1: number;
  tp2: number;
  tp3: number;
  risk_reward: number;
  position_size: number;
  portfolio_weight: number;
  max_loss_usd: number;
  confidence: number;
  ranking_score: number;
  research_score: number;
  red_team_score: number;
  consensus_score: number;
  market_regime: MarketRegimeType;
  reason: string;
  red_team_veto: boolean;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface MultiAgentAnalysisResponse {
  stock: GlobalStockItem;
  team1Ranking: {
    ticker: string;
    companyName: string;
    rankingScore: number;
    factorBreakdown: {
      quality: number;
      growth: number;
      momentum: number;
      earningsRevision: number;
      valuation: number;
      technicalSetup: number;
      catalyst: number;
      liquidity: number;
      marketContext: number;
    };
  };
  team2Research: {
    businessQualityScore: number;
    growthScore: number;
    financialHealthScore: number;
    valuationScore: number;
    bullThesis: string;
    baseThesis: string;
    bearThesis: string;
    catalysts: string[];
    risks: string[];
    fairValue: number;
    bullCaseValuation: number;
    baseCaseValuation: number;
    bearCaseValuation: number;
    confidence: number;
  };
  team3RedTeam: {
    redTeamScore: number;
    riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    objections: string[];
    counterEvidence: string[];
    vetoRecommendation: boolean;
    confidence: number;
  };
  team4Tactical: {
    decision: RecommendationDecision;
    entryZone: { low: number; high: number };
    stopLoss: number;
    tp1: number;
    tp2: number;
    tp3: number;
    riskRewardRatio: number;
    recommendedPositionSizePct: number;
    timeHorizon: TimeHorizon;
  };
  cioDecision: {
    decision: 'APPROVE' | 'REJECT' | 'WAIT' | 'REDUCE_SIZE' | 'RESEARCH_MORE';
    finalRating: RecommendationDecision;
    consensusScore: number;
    consensusConfidence: number;
    rationale: string;
    proponents: string[];
    dissenters: string[];
    redTeamVetoActive: boolean;
    riskCheckPassed: boolean;
    suggestedAction: string;
    timestamp: string;
  };
  consensus: {
    consensusScore: number;
    consensusConfidence: number;
    consensusDecision: RecommendationDecision;
    totalVotes: number;
    bullishWeight: number;
    bearishWeight: number;
    neutralWeight: number;
    vetoTriggered: boolean;
    explanation: string;
  };
  tradePlan: TradePlan;
  riskCheck: {
    approved: boolean;
    violations: string[];
    warnings: string[];
    maxAllowedSizePct: number;
    killSwitchTriggered: boolean;
  };
  agentsParticipated: number;
}

export interface FactorWeights {
  momentum: number;
  trend: number;
  quality: number;
  growth: number;
  value: number;
  earningsRevision: number;
  catalyst: number;
}

export interface AgentFactorScore {
  agentId: string;
  agentName: string;
  score: number;
  metricLabel: string;
  metricValue: string | number;
  verdict: 'STRONG' | 'POSITIVE' | 'NEUTRAL' | 'CAUTION' | 'WEAK';
  notes: string;
}

export interface StockRankingCandidate {
  rank: number;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  changePercent: number;
  marketCap: number;
  totalScore: number;
  conviction: 'STRONG_BUY' | 'BUY' | 'WATCHLIST' | 'NEUTRAL';
  factorScores: {
    screener: AgentFactorScore;
    momentum: AgentFactorScore;
    trend: AgentFactorScore;
    quality: AgentFactorScore;
    growth: AgentFactorScore;
    value: AgentFactorScore;
    earningsRevision: AgentFactorScore;
    liquidity: AgentFactorScore;
    catalyst: AgentFactorScore;
  };
  chairmanSummary: string;
  topStrengths: string[];
  keyRisks: string[];
  lastUpdated: string;
}

export interface RankingRunResult {
  runId: string;
  timestamp: string;
  universeSize: number;
  marketRegime: string;
  weights: FactorWeights;
  topCandidates: StockRankingCandidate[];
  summary: {
    strongBuyCount: number;
    buyCount: number;
    watchlistCount: number;
    neutralCount: number;
    highestScoreTicker: string;
    highestScore: number;
  };
}

// Phase 3: Team 2 Equity Research & 2-Stage DCF Valuation
export interface DCFValuationParams {
  wacc: number;
  terminalGrowthRate: number;
  growthRateStage1: number;
  forecastYears: number;
}

export interface DCFValuationResult {
  currentPrice: number;
  fairValue: number;
  marginOfSafetyPct: number;
  valuationStatus: 'SIGNIFICANTLY_UNDERVALUED' | 'MODERATELY_UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED' | 'HIGHLY_OVERVALUED';
  projectedFCF: Array<{ year: number; fcf: number; presentValue: number }>;
  enterpriseValue: number;
  equityValue: number;
  terminalValue: number;
  pvTerminalValue: number;
  impliedMarketGrowthRate: number;
  wacc: number;
  terminalGrowthRate: number;
}

export interface ResearchAgentThesis {
  agentId: string;
  agentName: string;
  focusArea: string;
  score: number;
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
  overallResearchScore: number;
  researchConviction: 'HIGH' | 'MODERATE' | 'SPECULATIVE';
  moat: {
    rating: 'WIDE' | 'NARROW' | 'NONE';
    score: number;
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

// Phase 4: Team 3 Red Team Adversarial Review & Forensic Types
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
  threatScore: number; // 0 - 100 composite risk
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

export interface RedTeamUniverseSummary {
  totalAudited: number;
  vetoedCount: number;
  criticalCount: number;
  highRiskCount: number;
  data: RedTeamAuditResult[];
}

// Phase 5: Team 4 Tactical Asset Allocation & Execution Types
export interface KellyCalculationResult {
  ticker: string;
  winProbability: number;
  payoutRatio: number;
  fullKellyFraction: number;
  halfKellyFraction: number;
  recommendedSizePct: number;
  riskAdjustedCapitalUsd: number;
  rationale: string;
}

export interface TacticalAgentOutput {
  agentId: string;
  agentName: string;
  tacticDomain: string;
  actionableDecision: string;
  keyMetricLabel: string;
  keyMetricValue: string | number;
  parameters: Record<string, any>;
  guidance: string[];
}

export interface TacticalTradePlanResult {
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  direction: 'LONG' | 'SHORT';
  timeframe: 'SWING' | 'POSITION' | 'INTRADAY';
  setupType: 'BREAKOUT' | 'PULLBACK_EMA20' | 'SUPPORT_BOUNCE' | 'MOMENTUM_EXPANSION';
  entryPrice: number;
  entryZone: { low: number; high: number };
  stopLoss: number;
  stopLossDistancePct: number;
  riskUnitR: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  riskRewardValid: boolean;
  positionSizing: KellyCalculationResult;
  optionsOverlay: {
    recommendedStrategy: 'NONE' | 'COVERED_CALL' | 'PROTECTIVE_COLLAR' | 'CASH_SECURED_PUT';
    callStrike?: number;
    putStrike?: number;
    expirationDays?: number;
    hedgeEfficiency: string;
  };
  hedgingStrategy: {
    portfolioBeta: number;
    correlationToSpy: number;
    hedgeInstrument: string;
    hedgeRatioPct: number;
  };
  executionTactics: {
    orderType: 'LIMIT' | 'TWAP' | 'VWAP' | 'MARKET';
    maxAllowableSpreadPct: number;
    currentSpreadPct: number;
    estimatedSlippageBps: number;
    darkPoolPreference: boolean;
  };
  agentReports: {
    timing: TacticalAgentOutput;
    sizing: TacticalAgentOutput;
    stopLoss: TacticalAgentOutput;
    takeProfit: TacticalAgentOutput;
    options: TacticalAgentOutput;
    hedging: TacticalAgentOutput;
    execution: TacticalAgentOutput;
    liquidity: TacticalAgentOutput;
    riskReward: TacticalAgentOutput;
    chairman: TacticalAgentOutput;
  };
  redTeamVetoActive: boolean;
  isTradeApproved: boolean;
  approvalStatusSummary: string;
  createdAt: string;
}

export interface TacticalUniverseSummary {
  totalUniverse: number;
  approvedCount: number;
  avgKellyPct: number;
  avgRR: number;
  data: TacticalTradePlanResult[];
}

// ============================================================================
// Phase 6: AI-CIO Investment Committee Chamber & Consensus Types
// ============================================================================

export interface AgentAccuracyRecord {
  agentId: string;
  agentName: string;
  team: string;
  brierScore: number;
  historicalAccuracyPct: number;
  totalPredictions: number;
  calibratedWeight: number;
  domain: string;
}

export type CommitteeVoteDecision = 'APPROVE' | 'REJECT' | 'ABSTAIN';

export interface AgentIndividualVote {
  agentId: string;
  agentName: string;
  team: number | 'CIO';
  teamName: string;
  vote: CommitteeVoteDecision;
  convictionScore: number;
  calibratedWeight: number;
  weightedScore: number;
  domain: string;
  rationale: string;
}

export interface DialecticalDebatePoint {
  topic: string;
  bullAgent: string;
  bullArgument: string;
  bearAgent: string;
  bearCounterArgument: string;
  cioResolution: string;
}

export interface DialecticalDebateSession {
  ticker: string;
  companyName: string;
  debateTopic: string;
  points: DialecticalDebatePoint[];
  dialecticalSynthesis: string;
}

export interface CIOInvestmentCommitteeMemo {
  id?: string;
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  consensusAction: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'SELL' | 'VETOED';
  consensusScore: number;
  supermajorityApproved: boolean;
  calibratedApprovalPct: number;
  rawApprovalPct: number;
  redTeamVetoActive: boolean;
  vetoReason?: string;
  confidenceInterval: {
    mean: number;
    lower95: number;
    upper95: number;
    standardError: number;
  };
  teamBreakdown: {
    team1Ranking: { score: number; rank: number; summary: string };
    team2Fundamental: { fairValue: number; upsidePct: number; moat: string; summary: string };
    team3RedTeam: { threatScore: number; threatLevel: string; redFlags: number; vetoTriggered: boolean };
    team4Tactical: { setupType: string; allocationPct: number; stopLoss: number; tp2: number; riskReward: number };
  };
  voteTally: {
    totalAgents: number;
    approveCount: number;
    rejectCount: number;
    abstainCount: number;
    teamApprovePct: { team1: number; team2: number; team3: number; team4: number; cio: number };
  };
  votes: AgentIndividualVote[];
  debate: DialecticalDebateSession;
  executiveSummary: string;
  executiveMemoMd: string;
  mandateExecution: {
    approvedShares: number;
    capitalAllocationUsd: number;
    portfolioWeightPct: number;
    entryLimitPrice: number;
    hardStopLoss: number;
    primaryTargetTp2: number;
    trailingRunnerTp3: number;
  };
  createdAt: string;
}

export interface CIOUniverseSummaryItem {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'SELL' | 'VETOED';
  consensusScore: number;
  calibratedApprovalPct: number;
  supermajorityApproved: boolean;
  redTeamVetoActive: boolean;
  allocationPct: number;
  hardStopLoss: number;
  primaryTargetTp2: number;
}

// ============================================================================
// Phase 7: Portfolio Risk & Circuit Breakers Types
// ============================================================================

export type CircuitBreakerLevel = 0 | 1 | 2 | 3;

export interface PortfolioHolding {
  ticker: string;
  companyName: string;
  sector: string;
  shares: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  weightPct: number;
  beta: number;
  convictionScore: number;
  stopLoss: number;
  takeProfit: number;
}

export interface SectorExposure {
  sector: string;
  marketValue: number;
  weightPct: number;
  stockCount: number;
  hardCapPct: number;
  isBreached: boolean;
  status: 'NORMAL' | 'ELEVATED' | 'BREACHED';
}

export interface MacroHedgeRecommendation {
  required: boolean;
  instrument: 'SPY_SHORT' | 'SPY_PUT_OVERLAY' | 'NONE';
  hedgeNotionalUsd: number;
  targetPortfolioBeta: number;
  contractsCount: number;
  rationale: string;
}

export interface PortfolioRiskSummary {
  timestamp: string;
  totalEquity: number;
  cashBalance: number;
  investedEquity: number;
  cashRatioPct: number;
  highWaterMark: number;
  currentDrawdownPct: number;
  maxDrawdownPct: number;
  circuitBreakerLevel: CircuitBreakerLevel;
  circuitBreakerStatus: 'NORMAL' | 'HALT_BUYS' | 'DELEVERAGE' | 'KILL_SWITCH';
  killSwitchActive: boolean;
  portfolioBeta: number;
  betaTargetCorridor: [number, number];
  betaStatus: 'OPTIMAL' | 'ELEVATED' | 'DEFENSIVE';
  macroHedgeRecommendation: MacroHedgeRecommendation;
  varMetrics: {
    dailyVolPct: number;
    var95DailyUsd: number;
    var95DailyPct: number;
    cvar95DailyUsd: number;
    cvar95DailyPct: number;
    sharpeRatio: number;
    sortinoRatio: number;
  };
  sectorExposures: SectorExposure[];
  holdings: PortfolioHolding[];
  alerts: string[];
}

export interface CircuitBreakerEvent {
  id?: number;
  timestamp: string;
  level: CircuitBreakerLevel;
  triggerReason: string;
  drawdownPct: number;
  actionTaken: string;
  metadata?: any;
}

// ============================================================================
// Phase 8: Paper Trading & Strategy Backtesting Types
// ============================================================================

export type PaperOrderSide = 'BUY' | 'SELL';
export type PaperOrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type PaperOrderStatus = 'PENDING' | 'SUBMITTED' | 'FILLED' | 'REJECTED' | 'CANCELLED' | 'CLOSED';

export interface PaperOrder {
  id: string;
  ticker: string;
  companyName: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  status: PaperOrderStatus;
  shares: number;
  requestedPrice: number;
  limitPrice?: number;
  stopPrice?: number;
  filledPrice?: number;
  slippageBps: number;
  slippageUsd: number;
  commissionUsd: number;
  totalCostUsd: number;
  realizedPnlUsd: number;
  realizedPnlPct: number;
  rejectReason?: string;
  createdAt: string;
  filledAt?: string;
}

export interface CreatePaperOrderInput {
  ticker: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  convictionScore?: number;
}

export type BacktestStrategyId =
  | 'MULTI_AGENT_CONSENSUS'
  | 'MOMENTUM_TREND_FOLLOWING'
  | 'MEAN_REVERSION_VALUE'
  | 'FUNDAMENTAL_DCF_QUALITY';

export interface BacktestStrategyInfo {
  id: BacktestStrategyId;
  name: string;
  thaiName: string;
  description: string;
  targetRegime: string;
  defaultConfig: Partial<BacktestConfig>;
}

export interface BacktestConfig {
  strategyId: BacktestStrategyId;
  initialCapital: number;
  benchmarkTicker: string;
  slippageBps: number;
  commissionPerShare: number;
  maxPositions: number;
  stopLossPct: number;
  takeProfitPct: number;
  positionSizing: 'EQUAL_WEIGHT' | 'HALF_KELLY' | 'VOLATILITY_PARITY';
}

export interface EquityCurvePoint {
  date: string;
  dayIndex: number;
  equity: number;
  cash: number;
  invested: number;
  drawdownPct: number;
  benchmarkEquity: number;
}

export interface BacktestTrade {
  id: string;
  ticker: string;
  companyName: string;
  side: 'BUY' | 'SELL';
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnlUsd: number;
  pnlPct: number;
  holdDays: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'REBALANCE' | 'END_OF_PERIOD';
}

export interface BacktestResult {
  runId: string;
  strategyId: BacktestStrategyId;
  strategyName: string;
  initialCapital: number;
  finalEquity: number;
  totalReturnPct: number;
  cagrPct: number;
  benchmarkReturnPct: number;
  alphaPct: number;
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  payoffRatio: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  equityCurve: EquityCurvePoint[];
  tradeLog: BacktestTrade[];
  config: BacktestConfig;
  createdAt: string;
}

