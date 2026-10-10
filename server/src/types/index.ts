export type SectorCategory = 
  | 'core' 
  | 'layer1_2' 
  | 'defi' 
  | 'ai_depin' 
  | 'rwa_oracle' 
  | 'meme' 
  | 'gamefi' 
  | 'emerging';

export interface SectorInfo {
  id: SectorCategory;
  name: string;
  nameTh: string;
  description: string;
  color: string;
  badgeBg: string;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCapShare: number;
  topCoin: string;
}

export type SignalType = 
  | 'STRONG_BUY'
  | 'BUY'
  | 'WATCH'
  | 'WAIT_FOR_RETEST'
  | 'WAIT_FOR_PULLBACK'
  | 'BREAKOUT_WATCH'
  | 'NEUTRAL'
  | 'SELL'
  | 'STRONG_SELL'
  | 'DO_NOT_CHASE'
  | 'HIGH_RISK';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High' | 'Extreme';

export type ScoreGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';

export interface TechnicalScoreBreakdown {
  total: number; // 0 - 100
  grade: ScoreGrade;
  trend: number; // Max 20
  priceStructure: number; // Max 20
  volume: number; // Max 15
  momentum: number; // Max 15
  relativeStrength: number; // Max 10
  riskReward: number; // Max 10
  liquidity: number; // Max 10
}

export interface AIScoreResult {
  score: number; // 0 - 100
  marketTrendContext: string;
  sentimentScore: number; // -1.0 to 1.0
  riskRating: RiskLevel;
  explanationTh: string;
  setupType: string;
  supportLevel: number;
  resistanceLevel: number;
  invalidationLevel: number;
  recommendedAction: string;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  primarySector: SectorCategory;
  logoUrl?: string;
  baseAsset: string;
  quoteAsset: string; // 'THB' or 'USDT'
  isBitkubPair: boolean;
  bitkubSymbol?: string;
  binanceSymbol?: string;
}

export interface TickerData {
  symbol: string;
  name: string;
  sector: SectorCategory;
  price: number;
  currency: 'THB' | 'USDT';
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  rsi: number;
  trend: 'Strong Bullish' | 'Bullish' | 'Early Uptrend' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  signal: SignalType;
  signalLabelTh: string;
  signalReasonTh: string;
  aiScore: number;
  technicalScore: number;
  fundamentalScore?: number;
  scoreGrade: ScoreGrade;
  riskLevel: RiskLevel;
  sparkline: number[];
  isWatchlist?: boolean;
  lastUpdated: string;
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
}

export interface MarketOverviewKPIs {
  totalMarketCap: number;
  totalMarketCapFormatted: string;
  marketCapChange24h: number;
  marketCapSparkline: number[];
  
  volume24h: number;
  volume24hFormatted: string;
  volumeChange24h: number;
  volumeSparkline: number[];
  
  btcDominance: number;
  btcDominanceChange24h: number;
  btcDominanceSparkline: number[];
  
  fearAndGreedIndex: number;
  fearAndGreedSentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  fearAndGreedSentimentTh: string;
  
  marketAITrend: {
    status: 'bull' | 'bear' | 'neutral';
    statusTh: string;
    descriptionTh: string;
  };
  
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  bullishCoinCount: number;
  breakoutCoinCount: number;
  usdThbRate?: number;
  timestamp: string;
}

export interface Top3OverallItem {
  rank: 1 | 2 | 3;
  symbol: string;
  name: string;
  price: number;
  change7d: number;
  score: number;
  signal: SignalType;
  signalLabelTh: string;
  reasonTh: string;
  trendTh: string;
  risk: RiskLevel;
  colorType: 'gold' | 'silver' | 'bronze';
  pair?: string;
}

export interface SectorTopItem {
  sector: SectorCategory;
  sectorNameTh: string;
  sectorColor: string;
  coins: {
    rank: number;
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    aiScore: number;
    signal: SignalType;
  }[];
}

export interface AlertItem {
  id: string;
  time: string;
  symbol: string;
  alertType: string;
  descriptionTh: string;
  currentValue: string;
  severity: 'info' | 'watch' | 'important' | 'critical';
  status: 'active' | 'triggered';
}

export interface CryptoNewsItem {
  id: string;
  title: string;
  timeAgo: string;
  source: string;
  relatedCoins: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  impact: 'High' | 'Medium' | 'Low';
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPct: number;
  weight: number;
  signal: string;
  risk: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalReturnPct: number;
  totalReturnUsd: number;
  allocation: {
    symbol: string;
    label: string;
    percentage: number;
    color: string;
    value: number;
  }[];
  performanceHistory: {
    time: string;
    returnPct: number;
  }[];
  positions?: PortfolioPosition[];
}

export interface PaperTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  qty: number;
  totalCost: number;
  currentValue: number;
  sl: number;
  tp: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  status: 'OPEN' | 'CLOSED';
  closePrice?: number;
  realizedPnl?: number;
  realizedPnlPct?: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
  signalOrigin?: string;
}

export interface WhaleTransaction {
  id: string;
  timeAgo: string;
  timestamp: string;
  symbol: string;
  amount: number;
  amountFormatted: string;
  valueUsd: number;
  valueUsdFormatted: string;
  from: string;
  fromType: 'exchange' | 'whale' | 'cold_wallet' | 'institution';
  to: string;
  toType: 'exchange' | 'whale' | 'cold_wallet' | 'institution';
  action: 'ACCUMULATION' | 'DISTRIBUTION' | 'TRANSFER';
  actionTh: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  txHash: string;
}

export interface WhaleRadarSummary {
  totalWhaleVolume24h: number;
  totalWhaleVolumeFormatted: string;
  netExchangeFlowUsd: number;
  netExchangeFlowFormatted: string;
  flowDirection: 'OUTFLOW_ACCUMULATION' | 'INFLOW_DISTRIBUTION';
  whaleSentimentPct: number;
  whaleSentimentLabelTh: string;
  transactions: WhaleTransaction[];
}

export type Top5Role = 
  | 'Best Overall'
  | 'Best Early Uptrend'
  | 'Best Breakout'
  | 'Best Momentum'
  | 'Best Risk/Reward';

// ==========================================
// QUANT ENGINE V3 TYPES
// ==========================================

export type MarketRegime = 
  | 'STRONG RISK ON' | 'STRONG_RISK_ON'
  | 'RISK ON' | 'RISK_ON'
  | 'RECOVERY'
  | 'TRENDING'
  | 'RANGE'
  | 'LOW VOL' | 'LOW_VOL'
  | 'HIGH VOL' | 'HIGH_VOL'
  | 'RISK OFF' | 'RISK_OFF'
  | 'CAPITULATION' 
  | 'EUPHORIA'
  | 'BTC LED' | 'BTC_LED'
  | 'ALT LED' | 'ALT_LED'
  // Backward compatibility:
  | 'BTC TREND' 
  | 'ALTCOIN TREND' 
  | 'HIGH VOLATILITY' 
  | 'LOW VOLATILITY';

export type MarketFavoredStrategy = 
  | 'Breakout' 
  | 'Momentum' 
  | 'Pullback' 
  | 'Mean Reversion' 
  | 'Capital Preservation';

export type MtfAlignment = 
  | 'STRONG BULLISH ALIGNMENT'
  | 'Bullish Alignment' 
  | 'BULLISH'
  | 'Mixed' 
  | 'MIXED'
  | 'Conflicted' 
  | 'BEARISH'
  | 'Bearish Alignment'
  | 'STRONG BEARISH';

export type RelativeStrengthMomentum = 'Improving' | 'Steady' | 'Weakening';

export type ExtensionLevel = 'Normal' | 'Warm' | 'Extended' | 'Overextended' | 'Parabolic';

export type QuantV2EntryStatus = 
  | 'STRONG BUY NOW' 
  | 'BUY NOW' 
  | 'SCALE IN' 
  | 'WAIT FOR RETEST' 
  | 'WATCH' 
  | 'NO ENTRY' 
  | 'DO NOT CHASE';

export type QuantV2ExitStatus = 
  | 'HOLD STRONG' 
  | 'HOLD' 
  | 'TAKE PROFIT PARTIAL' 
  | 'LOCK PROFIT' 
  | 'TRAILING STOP' 
  | 'REDUCE' 
  | 'EXIT'
  | 'EMERGENCY EXIT';

export type QuantV3ReasonCode =
  | 'BULLISH_MTF'
  | 'HIGH_RELATIVE_STRENGTH'
  | 'VOLUME_EXPANSION'
  | 'GOOD_RETEST'
  | 'GOOD_RR'
  | 'HIGH_LIQUIDITY'
  | 'CLEAN_ORDER_FLOW'
  | 'HEALTHY_PULLBACK'
  | 'BREAKOUT_CONFIRMED'
  | 'SOLID_FUNDAMENTALS'
  | 'TOKENOMICS_SAFE'
  | 'STRONG_CATALYST'
  | 'HIGH_EXTENSION'
  | 'LOCAL_PREMIUM_RISK'
  | 'NEGATIVE_NEWS_RISK'
  | 'UNLOCK_RISK'
  | 'LOW_LIQUIDITY_RISK'
  | 'EXCESSIVE_SLIPPAGE'
  | 'MARKET_REGIME_BLOCKED'
  | 'PUMP_SUSPECTED';

export interface QuantV3Scores {
  coinQualityScore: number;       // Step 30
  technicalScore: number;         // Step 10 & 11
  trendScore: number;             // Step 11
  momentumScore: number;          // Step 12
  relativeStrengthScore: number;  // Step 23
  liquidityScore: number;         // Step 6
  executionScore: number;         // Step 6
  orderFlowScore: number;         // Step 16
  onchainScore: number;           // Step 18
  fundamentalScore: number;       // Step 19
  tokenomicsScore: number;        // Step 20
  catalystScore: number;          // Step 21
  attentionScore: number;         // Step 22
  opportunityScore: number;       // Step 31
  entryScore: number;             // Step 27
  buyNowScore: number;            // Step 32
  riskScore: number;              // Step 25
  extensionScore: number;         // Step 26
  exitScore: number;              // Step 38
  profitProtectionScore: number;  // Step 39
  confidenceScore: number;        // Step 36
}

export interface MultiModelConsensus {
  bullishVotes: number;
  bearishVotes: number;
  neutralVotes: number;
  totalModels: number;
  modelAgreementPct: number;
  consensusVerdict: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  modelBreakdown: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    reversal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    breakout: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    meanReversion: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    orderFlow: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    derivatives: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    onchain: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    fundamental: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    catalyst: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    risk: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
}

export interface PositionSizingRecommendation {
  recommendedRiskPct: number;         // Risk per trade % (e.g. 1.5%)
  maxPositionPct: number;             // Max % of total portfolio (e.g. 12%)
  stopDistancePct: number;            // Stop loss distance % (e.g. 4.2%)
  suggestedCapitalAllocationPct: number; // Position size % based on Risk / Stop distance
  fractionalKellyPct: number;         // Fractional Kelly criterion %
  volatilityAdjustmentFactor: number; // Scaled by ATR / market volatility
  riskRewardTarget1: number;          // R:R TP1
}

export interface TrailingStopPlan {
  stopType: 'ATR Trailing' | 'Chandelier Exit' | 'Structure Stop' | 'EMA Stop' | 'Hybrid Stop';
  currentStopPrice: number;
  stopDistancePct: number;
  canMoveDown: false;                 // Invariant: Trailing Stop only moves UP, NEVER down!
  nextTriggerPrice: number;
  recommendedAction: string;
}

export interface QuantV3OpportunityItem {
  rank: number;
  symbol: string;
  pair?: string;
  name: string;
  price: number;
  priceThb?: number;
  denominatedCurrency?: 'THB' | 'USDT';
  sector?: string;
  opportunityScore: number;
  breakoutQualityScore: number;
  earlyOpportunityScore: number;
  momentumScore: number;
  relativeStrengthScore: number;
  volumeRatio: number;
  leadLagRole: 'Leader' | 'Follower' | 'Independent';
  setupStage: 'Forming Range' | 'Testing Resistance' | 'Breakout Squeeze' | 'Healthy Pullback';
  catalyst: string;
  keyCatalysts?: string[];
  whyInteresting: string[];
  entryStatus: string;
  entryZone?: { min: number; max: number; text?: string };
  change24h: number;
  change7d: number;
}

export interface DynamicTradeLevels {
  entryZone: { min: number; max: number; text: string };
  bestEntry?: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  invalidation: number; // Stop Loss
  tp1: number;
  tp2: number;
  tp3: number;
  rrTp1: number;
  rrTp2: number;
  rrTp3: number;
}

export interface Top5CandidateItem {
  rank: 1 | 2 | 3 | 4 | 5;
  role: Top5Role;
  roleTh: string;
  badgeColor: string;
  symbol: string;
  pair?: string;
  name: string;
  sector?: string;
  price: number;
  priceThb?: number;
  denominatedCurrency?: 'THB' | 'USDT';
  change24h: number;
  change7d: number;
  volume24h: number;
  
  // Decoupled Scores (Quant Architecture V2)
  coinQualityScore: number;       // 0 - 100 (Step 14: Quality of the asset)
  opportunityScore: number;       // 0 - 100 (Step 15: Market setup & momentum)
  entryScore: number;             // 0 - 100 (Step 11: Timing & Risk/Reward)
  buyNowScore: number;            // 0 - 100 (Step 16: Actionable buy now score)
  confidenceScore: number;        // 0 - 100 (Step 17: Data freshness & model agreement)

  // Granular Sub-Scores
  technicalScore: number;         // 0 - 100 (Step 3: 5-TF weighted)
  fundamentalScore: number;       // 0 - 100 (Step 6: Sector-specific)
  supplyPressureScore: number;    // 0 - 100 (Step 7: Token unlocks & dilution)
  newsScore: number;              // 0 - 100 (Step 8: Catalyst intelligence)
  catalystScore: number;          // 0 - 100 (Step 8: Deduplicated events & decay)
  riskScore: number;              // 0 - 100 (Step 9: Risk engine, 0=low, 100=extreme)
  extensionScore: number;         // 0 - 100 (Step 10: Extension & FOMO engine)
  extensionLevel: ExtensionLevel;
  liquidityScore: number;         // 0 - 100 (Step 1: Liquidity depth & spread)
  executionScore: number;         // 0 - 100 (Step 1: Slippage & book depth)
  dataQualityScore: number;       // 0 - 100 (Step 0: Integrity gate)
  
  // Relative Strength & MTF
  relativeStrengthScore: number;  // 0 - 100 (Step 5: vs BTC, ETH, Sector)
  relativeStrengthMomentum: RelativeStrengthMomentum;
  mtfAgreementScore: number;      // 0 - 100 (Step 4: Multi-timeframe agreement)
  mtfAlignment: MtfAlignment;

  // Exit & Protection
  exitScore: number;              // 0 - 100 (Step 21: Exit engine)
  profitProtectionScore: number;  // 0 - 100
  exitStatus: QuantV2ExitStatus;

  // Manipulation & Premium
  pumpRiskScore: number;          // 0 - 100 (Step 22: Pump detection)
  exchangePremiumPct: number;     // Step 23: Bitkub vs Global price
  isLocalPremiumRisk: boolean;

  // Overall Score & Badges
  finalScore: number;             // Risk-adjusted overall score
  badges: string[];               // e.g. ['Best Overall', 'Best Fundamental', 'Best Breakout']

  riskLevel: RiskLevel;
  signal: SignalType;
  signalLabelTh: string;
  setupType: string;
  entryStatus: 'BUY ZONE' | 'WAIT FOR RETEST' | 'WAIT FOR PULLBACK' | 'BREAKOUT WATCH' | 'DO NOT CHASE' | 'HIGH RISK' | 'NO SETUP';
  
  // Trade execution levels
  entryZone: {
    min: number;
    max: number;
    text: string;
  };
  support: number;
  resistance: number;
  invalidation: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  dynamicLevels: DynamicTradeLevels;
  
  // Quant V3 Extensions
  quantV3Scores?: QuantV3Scores;
  modelConsensus?: MultiModelConsensus;
  reasonCodes?: QuantV3ReasonCode[];
  positionSizing?: PositionSizingRecommendation;
  trailingStopPlan?: TrailingStopPlan;

  // Reasons & AI explanation
  whyTop5: string[];
  aiSummaryTh: string;
  confidence: 'High' | 'Medium' | 'Low';
  freshness: string;
  timestamp: string;
}

export interface Top5SnapshotHistory {
  id: string;
  timestamp: string;
  timeLabel: string;
  top5: {
    rank: number;
    symbol: string;
    pair?: string;
    finalScore: number;
    role: string;
    change24h: number;
    previousRank?: number;
    movement?: 'UP' | 'DOWN' | 'SAME' | 'NEW';
  }[];
}

export interface Top5Response {
  top5: Top5CandidateItem[];
  denominatedCurrency?: 'THB' | 'USDT';
  usdThbRate?: number;
  marketContext: {
    btcTrend: 'bull' | 'bear' | 'neutral';
    btcTrendTh: string;
    btcDominance: number;
    fearAndGreedIndex: number;
    fearAndGreedSentiment: string;
    marketRegime: MarketRegime;
    marketRegimeTh: string;
    marketRegimeScore?: number;
    marketRiskScore?: number;
    regimeConfidence?: number;
    favoredStrategy: MarketFavoredStrategy;
    favoredStrategyTh: string;
    regimeAdviceTh: string;
    dynamicWeights?: Record<string, number>;
    totalActiveCoinsEvaluated: number;
    lastUpdated: string;
    dataFreshness: string;
  };
  history: Top5SnapshotHistory[];
}

export type BuyNowStatus = 'STRONG BUY NOW' | 'BUY NOW' | 'SCALE IN';

export interface BuyNowCandidateItem {
  rank: number;
  symbol: string;
  pair?: string;
  name: string;
  price: number;
  priceThb?: number;
  denominatedCurrency?: 'THB' | 'USDT';
  buyNowScore: number;       // 80 - 100
  coinQualityScore: number;   // 0 - 100
  opportunityScore: number;   // 0 - 100
  technicalScore: number;    // >= 75
  entryScore: number;        // >= 80
  confidenceScore: number;   // 0 - 100
  riskScore: number;         // <= 65 or 75
  riskLevel: RiskLevel;
  extensionScore: number;    // < 75
  extensionLevel: ExtensionLevel;
  exchangePremiumPct: number;
  isLocalPremiumRisk: boolean;
  pumpRiskScore: number;
  signal: SignalType;
  currentTrend: string;      // Strong Bullish, Bullish, Early Uptrend
  setup: string;             // Successful Retest, Higher Low Entry, Support Bounce, Fresh Breakout
  status: BuyNowStatus;      // STRONG BUY NOW, BUY NOW, SCALE IN
  entryZone: {
    min: number;
    max: number;
    text: string;
  };
  stopLoss: number;
  invalidation: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskPct: number;
  rewardPct: number;
  riskReward: string;        // e.g. "1:2.8"
  rrRatio: number;           // numeric value >= 2.0
  rrTp1: number;
  rrTp2: number;
  rrTp3: number;
  change24h: number;
  change7d: number;
  volumeRatio: number;       // >= 1.2
  whyBuyNow: string[];       // Quant reasons list
  
  // Quant V3 Extensions
  quantV3Scores?: QuantV3Scores;
  modelConsensus?: MultiModelConsensus;
  reasonCodes?: QuantV3ReasonCode[];
  positionSizing?: PositionSizingRecommendation;
  trailingStopPlan?: TrailingStopPlan;
  dynamicLevels?: DynamicTradeLevels;
  relativeStrengthScore?: number;
  liquidityScore?: number;
  executionScore?: number;
  fundamentalScore?: number;
  catalystScore?: number;
  exitScore?: number;
  profitProtectionScore?: number;

  timestamp: string;
  isHighRisk?: boolean;
}

export interface QuantV3FullEvaluation {
  top5: Top5CandidateItem[];
  buyNowCandidates: BuyNowCandidateItem[];
  opportunities: QuantV3OpportunityItem[];
  marketContext: Top5Response['marketContext'];
  evaluatedTotal: number;
  denominatedCurrency?: 'THB' | 'USDT';
  usdThbRate?: number;
}

export interface QuantV3ApiResponse {
  symbol: string;
  price: number;
  market_regime: MarketRegime;
  scores: {
    coin_quality: number;
    technical: number;
    trend: number;
    momentum: number;
    relative_strength: number;
    liquidity: number;
    execution: number;
    order_flow: number;
    onchain: number;
    fundamental: number;
    tokenomics: number;
    catalyst: number;
    attention: number;
    opportunity: number;
    entry: number;
    buy_now: number;
    risk: number;
    extension: number;
    exit: number;
    profit_protection: number;
    confidence: number;
  };
  signal: string;
  entry: {
    zone_low: number;
    zone_high: number;
    stop: number;
    tp1: number;
    tp2: number;
    tp3: number;
    risk_reward: number;
  };
  reason_codes: QuantV3ReasonCode[];
  multi_model_consensus?: MultiModelConsensus;
  position_sizing?: PositionSizingRecommendation;
  trailing_stop?: TrailingStopPlan;
}

export interface BuyNowResponse {
  candidates: BuyNowCandidateItem[];
  marketStatus: 'NORMAL' | 'DISABLED_MARKET_RISK' | 'HIGH RISK' | 'NO SETUP';
  marketMessage?: string;
  evaluatedTotal: number;
  timestamp: string;
  denominatedCurrency?: 'THB' | 'USDT';
  usdThbRate?: number;
}


// ==========================================
// FOCUS MODULE TYPES
// ==========================================

export type FocusPriority = 'low' | 'normal' | 'high' | 'critical';
export type FocusMode = 'normal' | 'high_focus' | 'critical_focus';
export type FocusPositionStatus = 'WATCHING' | 'PLANNING TO BUY' | 'HOLDING' | 'TAKING PROFIT' | 'EXITING';
export type FocusScoreLevel = 'EXCEPTIONAL' | 'VERY STRONG' | 'STRONG' | 'WATCH' | 'NEUTRAL' | 'WEAK';
export type ScoreMomentum = 'RISING FAST' | 'RISING' | 'STABLE' | 'FALLING' | 'FALLING FAST';

export type FocusEntryStatus = 
  | 'STRONG BUY NOW' 
  | 'BUY NOW' 
  | 'IN ENTRY ZONE'
  | 'SCALE IN' 
  | 'WAIT FOR RETEST' 
  | 'WAIT FOR PULLBACK' 
  | 'BREAKOUT WATCH' 
  | 'DO NOT CHASE' 
  | 'NO SETUP';

export type FocusExitStatus = 
  | 'HOLD' 
  | 'HOLD STRONG' 
  | 'TAKE PROFIT PARTIAL' 
  | 'LOCK PROFIT' 
  | 'TRAILING STOP' 
  | 'REDUCE' 
  | 'EXIT' 
  | 'EMERGENCY EXIT';

export type ExtensionRisk = 'NORMAL' | 'OVEREXTENDED' | 'PARABOLIC' | 'FOMO RISK' | 'DO NOT CHASE';

export interface FocusPositionData {
  averageCost: number;
  amount: number;
  currentValue?: number;
  pnl?: number;
  pnlPercent?: number;
  portfolioPercent?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  trailingStopPercent?: number;
}

export interface FocusItem {
  id: string;
  symbol: string;
  pair: string;            // e.g. "ETH/THB"
  coinName: string;
  priority: FocusPriority;
  mode: FocusMode;
  positionStatus: FocusPositionStatus;
  position?: FocusPositionData;
  customTrailingStop?: number | null;
  userNotes?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FocusScoreHistoryItem {
  timestamp: string;
  score: number;
  price: number;
}

export interface FocusAlert {
  id: string;
  symbol: string;
  priority: 'INFO' | 'WATCH' | 'IMPORTANT' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
}

export interface FocusCoinData extends FocusItem {
  currentPrice: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  bidPrice: number;
  askPrice: number;
  spreadPct: number;
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;

  // Performance Multi-timeframe
  perf5m: number;
  perf15m: number;
  perf1h: number;
  perf4h: number;
  perf24h: number;
  perf7d: number;
  perf30d: number;
  perf90d: number;

  // Focus Score & Sub-scores
  focusScore: number;           // 0-100
  focusLevel: FocusScoreLevel;
  scoreDelta: number;           // difference vs previous round
  scoreMomentum: ScoreMomentum;
  technicalScore: number;       // 30%
  entryScore: number;           // 20%
  momentumScore: number;        // 10%
  volumeScore: number;          // 10%
  fundamentalScore: number;     // 10%
  newsScore: number;            // 10%
  liquidityScore: number;       // 5%
  marketContextScore: number;   // 5%
  penalties: {
    riskPenalty: number;
    extensionPenalty: number;
    negativeNewsPenalty: number;
    unlockPenalty: number;
  };

  // MTF Trend
  trends: {
    tf15m: string;
    tf1h: string;
    tf4h: string;
    tf1d: string;
    tf1w: string;
  };
  mtfAgreementScore: number;    // e.g. 80% (4/5 Bullish)
  mtfSummary: string;

  // Technical Indicators
  technicals: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema100: number;
    ema200: number;
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    adx: number;
    atr: number;
    vwap: number;
    bollinger: { upper: number; middle: number; lower: number };
    supertrend: { value: number; direction: 'up' | 'down' };
    supportNearest: number;
    supportMajor: number;
    resistanceNearest: number;
    resistanceMajor: number;
    supportDistancePct: number;
    resistanceDistancePct: number;
  };

  // Market Structure
  marketStructure: {
    pattern: string; // HH, HL, LH, LL, Breakout, Breakdown, Retest, Pullback, Reversal
    description: string;
  };

  // Entry Engine
  entryIntelligence: {
    status: FocusEntryStatus;
    entryZone: { min: number; max: number; text: string };
    bestEntry: number;
    distanceToEntryPct: number;
    distanceStatus: string; // "IN ENTRY ZONE", "WAIT -1.86%", etc.
    stopLoss: number;
    tp1: number;
    tp2: number;
    tp3: number;
    riskPct: number;
    rewardPct: number;
    riskReward: string;
    rrRatio: number;
  };

  // Exit & Trailing Stop Intelligence
  exitIntelligence: {
    status: FocusExitStatus;
    profitProtectionScore: number; // 0-100
    dynamicTrailingStop: number;   // Moves up with trend, never moves down
    trailingStopDistancePct: number;
    extensionRisk: ExtensionRisk;
    advice: string;
  };

  // Volume & Order Book Pressure
  volumeOrderBook: {
    volumeRatio: number;
    buyPressurePct: number;  // e.g. 62%
    sellPressurePct: number; // e.g. 38%
    orderBookStatus: string;
    bidDepthUsd: number;
    askDepthUsd: number;
    volumeDelta: string;
  };

  // News & Catalyst
  newsIntelligence: {
    newsScore: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    catalyst: 'Strong' | 'Moderate' | 'Weak';
    riskLevel: 'Low' | 'Medium' | 'High';
    latestHeadline: string;
    latestSource: string;
    latestTime: string;
  };

  // Fundamental & Token Unlock
  fundamentalIntelligence: {
    score: number;
    marketCapUsd: number;
    circulatingSupply: number;
    totalSupply: number;
    tvlUsd: number;
    developerActivity: string;
    tokenUtility: string;
    nextUnlock: {
      daysLeft: number;
      date: string;
      percentSupply: number;
      risk: 'LOW' | 'MEDIUM' | 'HIGH';
    };
  };

  // Whale & Market Context
  whaleAndContext: {
    whaleSignal: 'ACCUMULATION' | 'NEUTRAL' | 'DISTRIBUTION';
    relativeStrengthVsBtc: number; // %
    relativeStrengthVsSector: number; // %
    status: 'OUTPERFORMING' | 'IN_LINE' | 'UNDERPERFORMING';
    sectorName: string;
  };

  // 5 Core AI Decision Answers (Rule 62)
  aiSummary: {
    q1IsGoodNow: string;          // 1. เหรียญนี้ตอนนี้ดีไหม?
    q2CanBuy: string;             // 2. ซื้อได้ไหม?
    q3WhereToBuy: string;         // 3. ถ้าจะซื้อ ควรซื้อบริเวณไหน?
    q4HoldOrSell: string;         // 4. ถ้าถืออยู่ ควรถือต่อหรือขาย?
    q5WhatChangesView: string;    // 5. อะไรคือสิ่งที่จะทำให้มุมมองเปลี่ยน?
    summaryText: string;
    nextDecisionTrigger: string;
  };

  // Extended Decision Cockpit Fields (Sections 7-18)
  quantScores?: FocusDecisionScores;
  timeframeAnalysis?: FocusTimeframeMiniAnalysis[];
  timeframeMatrix?: FocusTimeframeMatrix;
  buyEligibility?: FocusBuyEligibility;
  whyScoreChanged?: FocusWhyScoreChanged[];
  orderBookDepth?: FocusOrderBookDepth;
  relativeStrengthMulti?: FocusRelativeStrengthMulti;
  localPremium?: FocusLocalPremium;
  dynamicNextTrigger?: string;
  sourceType?: 'PINNED' | 'AUTO';

  // Real-time Telemetry (Section 1)
  lastTickAt?: number;
  lastAnalysisAt?: number;
  lastScoreAt?: number;
  latencyMs?: number;
  dataAgeSeconds?: number;
  dataFreshnessStatus?: 'LIVE' | 'DELAYED' | 'STALE' | 'RECONNECTING' | 'PAUSED';

  // Live Telemetry
  liveStatus: 'LIVE' | 'Updating' | 'Scanning' | 'Stale' | 'API Error';
  lastUpdated: string;
  scoreHistory: FocusScoreHistoryItem[];
  alerts: FocusAlert[];
}

export interface FocusTimeframeMiniAnalysis {
  timeframe: '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
  changePct: number;
  trend: 'BULLISH' | 'STRONG BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'PULLBACK';
  trendScore: number;
  emaState: string;
  rsi: number;
  macdState: string;
  adx: number;
  volumeRatio: number;
  marketStructure: 'HH / HL' | 'LH / LL' | 'Range' | 'Breakout' | 'Retest';
  support: number;
  resistance: number;
  momentum: 'High Bullish' | 'Bullish' | 'Neutral' | 'Bearish';
  signal: 'STRONG BUY' | 'BUY' | 'WAIT' | 'SELL';
  confidence: number;
}

export interface FocusTimeframeMatrix {
  timeframes: ('5m' | '15m' | '1H' | '4H' | '1D' | '1W')[];
  trendRow: Record<string, string>;
  momentumRow: Record<string, string>;
  volumeRow: Record<string, string>;
  structureRow: Record<string, string>;
  mtfAgreementPct: number;
  alignmentStatus: 'STRONG BULLISH ALIGNMENT' | 'MODERATE BULLISH' | 'MIXED' | 'BEARISH ALIGNMENT';
}

export interface FocusDecisionScores {
  technicalScore: number;
  entryScore: number;
  buyNowScore: number;
  momentumScore: number;
  volumeScore: number;
  orderFlowScore: number;
  relativeStrengthScore: number;
  liquidityScore: number;
  executionScore: number;
  fundamentalScore: number;
  onchainScore: number;
  newsScore: number;
  riskScore: number;
  extensionScore: number;
  profitProtectionScore: number;
  exitScore: number;
  confidenceScore: number;
  marketContextScore: number;
  localPremiumRisk: number;
  unlockRisk: number;
}

export interface FocusBuyEligibility {
  canBuyNow: 'YES' | 'SCALE IN' | 'WAIT' | 'DO NOT CHASE' | 'NO TRADE';
  statusLabelTh: string;
  reasons: string[];
  warnings: string[];
}

export interface FocusWhyScoreChanged {
  factor: string;
  delta: number;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface FocusOrderBookDepth {
  bidPrice: number;
  askPrice: number;
  spreadPct: number;
  buyDepthUsd: number;
  sellDepthUsd: number;
  buyPressurePct: number;
  sellPressurePct: number;
  buyWallPrice: number;
  sellWallPrice: number;
  orderBookImbalancePct: number;
  aggressiveBuyPct: number;
  aggressiveSellPct: number;
  cvd: string;
}

export interface FocusRelativeStrengthMulti {
  vsBtcPct: number;
  vsEthPct: number;
  vsSectorPct: number;
  vsMarketPct: number;
  status: 'OUTPERFORMING' | 'IN_LINE' | 'UNDERPERFORMING';
  sectorName: string;
}

export interface FocusLocalPremium {
  bitkubPrice: number;
  globalReferencePrice: number;
  premiumPct: number;
  riskLevel: 'NORMAL' | 'ELEVATED' | 'HIGH RISK';
  statusText: string;
}

export interface FocusResponse {
  items: FocusCoinData[];
  totalCount: number;
  activeCount: number;
  averageScore: number;
  marketRegime: string;
  timestamp: string;
}

// ==========================================
// Comprehensive Trading Plan & Analysis Types
// ==========================================

export type RsiRiskTier = 
  | 'EXTREME_OVERSOLD'      // < 25 (🔴 สูง)
  | 'OVERSOLD'              // 25-30 (🟠)
  | 'WEAK_RECOVERY'         // 30-40 (🟡)
  | 'NEUTRAL_WEAK'          // 40-50 (⚪)
  | 'HEALTHY_BULLISH'       // 50-60 (🟢)
  | 'STRONG_MOMENTUM'       // 60-68 (🟢)
  | 'ELEVATED'              // 68-72 (🟡)
  | 'OVERBOUGHT'            // 72-80 (🟠)
  | 'EXTREME_OVERBOUGHT';   // > 80 (🔴)

export interface RsiRiskInfo {
  tier: RsiRiskTier;
  labelTh: string;
  badgeEmoji: '🔴' | '🟠' | '🟡' | '⚪' | '🟢';
  badgeColor: string;
  riskSeverity: 'Extreme' | 'High' | 'Elevated' | 'Normal' | 'Low';
}

export interface RsiMultiTimeframeItem {
  timeframe: '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W';
  rsi: number;
  weightPct: number; // 5, 10, 10, 20, 25, 25, 5
  risk: RsiRiskInfo;
  trend: 'Strong Bullish' | 'Bullish' | 'Neutral-Bullish' | 'Neutral' | 'Weak / Pullback' | 'Bearish' | 'Strong Bearish';
  slope: 'Rising' | 'Falling' | 'Flat';
  divergence?: {
    type: 'Bullish Divergence' | 'Hidden Bullish Divergence' | 'Bearish Divergence' | 'Hidden Bearish Divergence';
    severity: 'High' | 'Medium' | 'Low';
    description: string;
  };
}

export interface HoldingHorizonItem {
  horizon: 'SHORT' | 'SWING' | 'LONG';
  titleTh: string;
  durationTh: string;
  stars: number; // 1 to 5
  starDisplay: string; // e.g. "★★★★★"
  isSuitable: boolean;
  score: number; // 0-100
  rationaleTh: string;
  keyFactors: string[];
}

export interface HoldingHorizonAnalysis {
  primarySuitable: 'SHORT' | 'SWING' | 'LONG' | 'SHORT_AND_SWING' | 'SWING_AND_LONG' | 'NONE';
  suitableTitleTh: string;
  horizons: {
    short: HoldingHorizonItem;
    swing: HoldingHorizonItem;
    long: HoldingHorizonItem;
  };
}

export interface FibonacciLevelItem {
  ratio: number;
  label: string; // "0.000", "0.236", "0.382", "0.500", "0.618 ⭐", "0.786", "1.000", "1.272", etc.
  price: number;
  isGoldenZone?: boolean;
  isExtension?: boolean;
  confluencePoints?: string[];
  isHighConfluence?: boolean;
}

export interface FibonacciAnalysis {
  swingHigh: number;
  swingLow: number;
  diff: number;
  retracements: FibonacciLevelItem[];
  extensions: FibonacciLevelItem[];
  confluenceSupport: {
    priceMin: number;
    priceMax: number;
    text: string;
    confluenceFactors: string[];
    entryQualityScore: number;
    isHighConfluence: boolean;
  };
}

export interface EntryZoneItem {
  type: 'Aggressive' | 'Preferred' | 'Deep Pullback';
  titleTh: string;
  isPreferred?: boolean;
  priceMin: number;
  priceMax: number;
  text: string;
  distancePct: number;
  reasons: string[];
}

export interface StopLossPlan {
  technicalSl: number;
  hardStop: number;
  riskPct: number;
  invalidationTextTh: string;
  recommendedRiskPct: number;
}

export interface TakeProfitTargetItem {
  level: 'TP1' | 'TP2' | 'TP3' | 'TP4';
  targetPrice: number;
  gainPct: number;
  rrRatio: number;
  rationaleTh: string;
}

export type TradingDecisionStatus = 
  | 'BUY NOW'
  | 'ENTER PARTIAL'
  | 'WAIT FOR PULLBACK'
  | 'WAIT FOR BREAKOUT'
  | 'WAIT FOR RETEST'
  | 'WATCH'
  | 'HOLD'
  | 'PROTECT PROFIT'
  | 'TAKE PARTIAL PROFIT'
  | 'EXIT'
  | 'AVOID';

export interface ExitScoreAnalysis {
  exitScore: number;
  status: 'HOLD' | 'HOLD STRONG' | 'PROTECT PROFIT' | 'TAKE PARTIAL PROFIT' | 'EXIT' | 'AVOID';
  reasons: string[];
  statusTh: string;
}

export interface ProfitProtectionPlan {
  isSimulatedOrHolding: boolean;
  boughtPrice: number;
  currentPrice: number;
  profitPct: number;
  recommendedActionTh: string;
  takeProfitRuleTh: string;
  moveStopLevel: number;
  trailingStopPct: number;
  nextTargetPrice: number;
}

export interface ComprehensiveTradingPlan {
  symbol: string;
  currentPrice: number;
  change24h: number;
  change7d: number;
  
  // 1 & 2 & 3. RSI Multi-Timeframe & Risk & Divergence
  rsiMultiTimeframe: {
    items: RsiMultiTimeframeItem[];
    shortTermRisk: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH';
    swingRisk: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH';
    longTermRisk: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH';
    weightedRsi: number;
    summaryTh: string;
    divergenceAlerts: string[];
  };

  // 4. Holding Horizon
  holdingHorizon: HoldingHorizonAnalysis;

  // 5 & 6. Fibonacci & Confluence
  fibonacci: FibonacciAnalysis;

  // 7. Entry Plan (Zones)
  entryPlan: {
    zones: EntryZoneItem[];
    preferredZone: EntryZoneItem;
    entryScore: number;
  };

  // 8. Stop Loss & Invalidation
  stopLoss: StopLossPlan;

  // 9 & 10. Multi-level Take Profit & R:R
  takeProfits: {
    targets: TakeProfitTargetItem[];
    acceptableRrFound: boolean;
    bestRr: number;
    minAcceptableRr: number;
    chaseWarning: string | null;
  };

  // 11. Entry Status & Overall Decision
  decision: {
    status: TradingDecisionStatus;
    badgeColor: string;
    verdictTh: string;
    preferredEntryTextTh: string;
    invalidationTextTh: string;
    suitableStyleTh: string;
    fullSummaryTh: string;
  };

  // 12. Exit Score
  exitIntelligence: ExitScoreAnalysis;

  // 13. Profit Protection
  profitProtection: ProfitProtectionPlan;

  // Decision Scores (0-100)
  scores: {
    entryScore: number;
    technicalScore: number;
    fundamentalScore: number;
    momentumScore: number;
    riskScore: number;
    exitScore: number;
    overallScore: number;
  };
}

export interface DeepAnalysisData {
  symbol: string;
  ticker: TickerData;
  indicators: any;
  structure: any;
  multiTf: any;
  tradingPlan: ComprehensiveTradingPlan;
}



