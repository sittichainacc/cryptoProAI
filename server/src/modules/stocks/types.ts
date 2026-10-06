// ============================================================================
// Global Equity Multi-Agent Intelligence System: Type Definitions (Phase 0)
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

export type CIODecisionType = 
  | 'APPROVE'
  | 'REJECT'
  | 'WAIT'
  | 'REDUCE_SIZE'
  | 'RESEARCH_MORE';

export type TradingMode = 
  | 'RESEARCH_ONLY'
  | 'PAPER'
  | 'SHADOW'
  | 'SEMI_AUTO'
  | 'LIVE_AUTO';

export type OrderLifecycleStatus =
  | 'DRAFT'
  | 'AI_PROPOSED'
  | 'RISK_REVIEW'
  | 'RISK_REJECTED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED';

// --- Agent Hierarchy Types ---
export interface AgentDefinition {
  id: string; // e.g. 'T1-01', 'T2-05', 'AI-CIO'
  name: string;
  thaiName: string;
  team: 1 | 2 | 3 | 4 | 'CIO';
  teamName: string;
  roleDescription: string;
  specialty: string;
  weight: number;
  modelProvider: 'openai' | 'anthropic' | 'google' | 'local';
  modelName: string;
  temperature: number;
  isActive: boolean;
}

export interface AgentOutputRecord {
  agent_id: string;
  ticker: string;
  analysis_type: string;
  decision: string;
  score: number;
  confidence: number;
  thesis: string[];
  evidence: string[];
  risks: string[];
  counter_arguments: string[];
  sources: {
    source_name: string;
    source_url?: string;
    retrieved_at: string;
    data_timestamp?: string;
  }[];
  data_timestamp: string;
  generated_at: string;
}

// --- Team Results ---
export interface Team1RankingResult {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  currentPrice: number;
  change24h: number;
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
  passedToTeam2: boolean;
}

export interface Team2ResearchResult {
  ticker: string;
  businessQualityScore: number;
  growthScore: number;
  financialHealthScore: number;
  valuationScore: number;
  competitiveAdvantageScore: number;
  managementScore: number;
  earningsMomentumScore: number;
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
  sourcesVerified: boolean;
}

export interface Team3RedTeamResult {
  ticker: string;
  redTeamScore: number; // 0-100 (higher = higher skepticism/risk)
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  objections: string[];
  counterEvidence: string[];
  vetoRecommendation: boolean; // RED_TEAM_VETO
  vetoReason?: string;
  confidence: number;
}

export interface Team4TacticalResult {
  ticker: string;
  decision: RecommendationDecision;
  entryZone: { low: number; high: number };
  invalidationLevel: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskRewardRatio: number;
  recommendedPositionSizePct: number;
  maxExposurePct: number;
  timeHorizon: TimeHorizon;
  confidence: number;
  marketRegime: MarketRegimeType;
}

export interface CIODecisionResult {
  ticker: string;
  decision: CIODecisionType;
  finalRating: RecommendationDecision;
  consensusScore: number; // 0-100
  consensusConfidence: number; // 0-1
  rationale: string;
  proponents: string[];
  dissenters: string[];
  redTeamVetoActive: boolean;
  riskCheckPassed: boolean;
  suggestedAction: string;
  timestamp: string;
}

// --- Trade Plan Schema ---
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
  status: OrderLifecycleStatus;
  created_at: string;
  expires_at: string;
}

// --- Hard Risk Rules ---
export interface RiskRuleConfig {
  max_position_size_pct: number;
  max_portfolio_exposure_pct: number;
  max_sector_exposure_pct: number;
  max_industry_exposure_pct: number;
  max_single_stock_loss_pct: number;
  max_daily_loss_usd: number;
  max_drawdown_pct: number;
  min_risk_reward: number;
  max_open_positions: number;
  max_slippage_pct: number;
  max_spread_pct: number;
  min_liquidity_usd: number;
  news_blackout_minutes: number;
  earnings_blackout_days: number;
  global_kill_switch_active: boolean;
}

export interface RiskEvaluationResult {
  approved: boolean;
  violations: string[];
  warnings: string[];
  maxAllowedSizePct: number;
  killSwitchTriggered: boolean;
}
