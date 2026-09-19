export type SectorCategory = 
  | 'core' 
  | 'layer1_2' 
  | 'defi' 
  | 'ai_depin' 
  | 'rwa_oracle' 
  | 'meme' 
  | 'gamefi' 
  | 'emerging';

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
  trend: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  signal: SignalType;
  signalLabelTh: string;
  signalReasonTh: string;
  aiScore: number;
  technicalScore: number;
  scoreGrade: ScoreGrade;
  riskLevel: RiskLevel;
  sparkline: number[];
  isWatchlist?: boolean;
  lastUpdated: string;
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
  fearAndGreedSentiment: string;
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
  timestamp: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
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

export interface SectorStatItem {
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
  worstCoin: string;
}

export interface HeatmapItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  sector: SectorCategory;
  sizeWeight: number;
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

export interface MultiTimeframeIndicators {
  timeframe: string;
  trend: string;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  volumeStatus: string;
  signal: string;
  isAboveEma20: boolean;
  isAboveEma50: boolean;
  isAboveEma200: boolean;
}

export interface DeepAnalysisData {
  symbol: string;
  ticker: TickerData;
  indicators: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema100: number;
    ema200: number;
    sma20: number;
    sma50: number;
    sma200: number;
    rsi14: number;
    macd: { macd: number; signal: number; histogram: number };
    stochRsi: { k: number; d: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    atr14: number;
    adx14: number;
    supertrend: { value: number; direction: 'bullish' | 'bearish' };
    obv: number;
    vwap: number;
    fibonacci: {
      level0: number;
      level236: number;
      level382: number;
      level500: number;
      level618: number;
      level786: number;
      level1000: number;
    };
  };
  structure: {
    structureType: string;
    trend: string;
    phase: string;
    primarySupport: number;
    secondarySupport: number;
    primaryResistance: number;
    secondaryResistance: number;
    breakoutLevel: number;
    isBreakoutConfirmed: boolean;
    isRetestConfirmed: boolean;
    summaryTh: string;
  };
  multiTf: {
    timeframes: MultiTimeframeIndicators[];
    consensusSignal: string;
    consensusScore: number;
    explanationTh: string;
  };
}

export interface PositionSizingResult {
  riskAmount: number;
  stopLossDistance: number;
  stopLossPercentage: number;
  positionSizeUsd: number;
  quantity: number;
  potentialLossUsd: number;
  potentialProfitUsd: number;
  riskRewardRatio: number;
  isSafeRisk: boolean;
  recommendationTh: string;
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

