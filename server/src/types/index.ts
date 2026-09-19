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
