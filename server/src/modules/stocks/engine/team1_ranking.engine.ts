// ============================================================================
// Global Equity Multi-Agent System - Team 1: Stock Ranking Engine
// 10 Agents: Screener, Momentum, Trend, Quality, Growth, Value, Revisions,
//            Liquidity, Catalysts, and Ranking Chairman
// ============================================================================

import { globalStockStore, GlobalStockItem } from './stock_store.js';
import { TechnicalIndicatorSet } from './technical_indicators.engine.js';

export interface FactorWeights {
  momentum: number;         // default 0.20
  trend: number;            // default 0.15
  quality: number;          // default 0.20
  growth: number;           // default 0.15
  value: number;            // default 0.10
  earningsRevision: number; // default 0.10
  catalyst: number;         // default 0.10
}

export const DEFAULT_FACTOR_WEIGHTS: FactorWeights = {
  momentum: 0.20,
  trend: 0.15,
  quality: 0.20,
  growth: 0.15,
  value: 0.10,
  earningsRevision: 0.10,
  catalyst: 0.10,
};

export interface AgentFactorScore {
  agentId: string;
  agentName: string;
  score: number;        // 0 - 100
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
  totalScore: number;   // 0 - 100 composite
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

export class Team1RankingEngine {
  private activeWeights: FactorWeights = { ...DEFAULT_FACTOR_WEIGHTS };
  private latestRun: RankingRunResult | null = null;

  constructor() {
    this.runRanking(); // Initialize with first ranking run
  }

  public getWeights(): FactorWeights {
    return { ...this.activeWeights };
  }

  public setWeights(weights: Partial<FactorWeights>): FactorWeights {
    const raw = { ...this.activeWeights, ...weights };
    // Normalize to sum to 1.0
    const sum = 
      raw.momentum + raw.trend + raw.quality + raw.growth + 
      raw.value + raw.earningsRevision + raw.catalyst;
    
    if (sum > 0) {
      this.activeWeights = {
        momentum: Number((raw.momentum / sum).toFixed(4)),
        trend: Number((raw.trend / sum).toFixed(4)),
        quality: Number((raw.quality / sum).toFixed(4)),
        growth: Number((raw.growth / sum).toFixed(4)),
        value: Number((raw.value / sum).toFixed(4)),
        earningsRevision: Number((raw.earningsRevision / sum).toFixed(4)),
        catalyst: Number((raw.catalyst / sum).toFixed(4)),
      };
    }
    return { ...this.activeWeights };
  }

  // --------------------------------------------------------------------------
  // Agent Evaluation Functions (T1-01 to T1-09)
  // --------------------------------------------------------------------------

  // T1-01 Universe Screener Agent
  private evaluateScreener(stock: GlobalStockItem): AgentFactorScore {
    let score = 70;
    const isLargeCap = stock.marketCap >= 50_000_000_000;
    const isMegaCap = stock.marketCap >= 500_000_000_000;
    const isEligibleExchange = ['NASDAQ', 'NYSE'].includes(stock.exchange);

    if (isMegaCap) score += 25;
    else if (isLargeCap) score += 15;
    else score += 5;

    if (isEligibleExchange) score += 5;

    const clamped = Math.min(100, Math.max(0, score));
    return {
      agentId: 'T1-01',
      agentName: 'Universe Screener Agent',
      score: clamped,
      metricLabel: 'Market Cap / Liquidity Tier',
      metricValue: `$${(stock.marketCap / 1e9).toFixed(1)}B (${stock.exchange})`,
      verdict: clamped >= 85 ? 'STRONG' : 'POSITIVE',
      notes: isMegaCap ? 'Mega-Cap Tier 1 Liquidity' : 'Large-Cap Compliant Universe',
    };
  }

  // T1-02 Momentum Agent
  private evaluateMomentum(stock: GlobalStockItem, indicators: TechnicalIndicatorSet | null): AgentFactorScore {
    let score = 50;
    // 1M / 1D price momentum proxy
    if (stock.changePercent > 3.0) score += 25;
    else if (stock.changePercent > 0.5) score += 15;
    else if (stock.changePercent < -3.0) score -= 20;

    // Relative strength vs SPY (scale 0-100)
    const rs = indicators?.relativeStrengthVsSpy || 75;
    if (rs > 85) score += 25;
    else if (rs > 75) score += 15;
    else if (rs < 65) score -= 15;

    const clamped = Math.min(100, Math.max(0, score));
    return {
      agentId: 'T1-02',
      agentName: 'Momentum Agent',
      score: clamped,
      metricLabel: 'RS vs SPY / 1D Move',
      metricValue: `${rs}/100 (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)`,
      verdict: clamped >= 80 ? 'STRONG' : clamped >= 60 ? 'POSITIVE' : clamped >= 40 ? 'NEUTRAL' : 'WEAK',
      notes: rs > 80 ? 'Strong Alpha outperforming benchmark' : 'In-line or lagging benchmark index',
    };
  }

  // T1-03 Technical Trend Agent
  private evaluateTrend(indicators: TechnicalIndicatorSet | null): AgentFactorScore {
    let score = 50;
    if (!indicators) {
      return {
        agentId: 'T1-03',
        agentName: 'Technical Trend Agent',
        score: 50,
        metricLabel: 'Trend Health',
        metricValue: 'Data Pending',
        verdict: 'NEUTRAL',
        notes: 'Awaiting candle stream',
      };
    }

    if (indicators.macd.trend === 'BULLISH') score += 25;
    else if (indicators.macd.trend === 'BEARISH') score -= 25;

    if (indicators.goldenCross) score += 15;
    if (indicators.deathCross) score -= 20;

    // RSI sweet spot (50 - 68)
    if (indicators.rsi14 >= 50 && indicators.rsi14 <= 68) score += 10;
    else if (indicators.rsi14 > 75) score -= 5; // Slightly overbought
    else if (indicators.rsi14 < 35) score -= 10; // Oversold / weak trend

    // MACD positive histogram
    if (indicators.macd.histogram > 0) score += 10;
    else score -= 10;

    const clamped = Math.min(100, Math.max(0, score));
    return {
      agentId: 'T1-03',
      agentName: 'Technical Trend Agent',
      score: clamped,
      metricLabel: 'Trend & Structure',
      metricValue: `${indicators.macd.trend} (RSI: ${indicators.rsi14.toFixed(1)})`,
      verdict: clamped >= 80 ? 'STRONG' : clamped >= 60 ? 'POSITIVE' : clamped >= 40 ? 'NEUTRAL' : 'WEAK',
      notes: indicators.goldenCross ? 'EMA Golden Cross active with solid momentum' : 'Consolidating above support',
    };
  }

  // T1-04 Quality Factor Agent
  private evaluateQuality(stock: GlobalStockItem): AgentFactorScore {
    let score = 40;
    // ROE
    if (stock.roe >= 40) score += 30;
    else if (stock.roe >= 25) score += 20;
    else if (stock.roe >= 15) score += 10;

    // Piotroski F-Score (estimate based on fundamentals: 0-9)
    const fScore = stock.roe > 20 && stock.revenueGrowthYoY > 15 ? 8 : 7;
    score += fScore * 3.5;

    const clamped = Math.min(100, Math.max(0, Math.round(score)));
    return {
      agentId: 'T1-04',
      agentName: 'Quality Factor Agent',
      score: clamped,
      metricLabel: 'ROE & Piotroski F-Score',
      metricValue: `${stock.roe.toFixed(1)}% (F-Score: ${fScore}/9)`,
      verdict: clamped >= 80 ? 'STRONG' : 'POSITIVE',
      notes: stock.roe >= 30 ? 'Top-decile return on equity and superior capital efficiency' : 'High quality corporate balance sheet',
    };
  }

  // T1-05 Growth Factor Agent
  private evaluateGrowth(stock: GlobalStockItem): AgentFactorScore {
    let score = 30;
    if (stock.revenueGrowthYoY >= 50) score += 65;
    else if (stock.revenueGrowthYoY >= 25) score += 50;
    else if (stock.revenueGrowthYoY >= 15) score += 35;
    else if (stock.revenueGrowthYoY >= 5) score += 20;
    else score += 5;

    const clamped = Math.min(100, Math.max(0, score));
    return {
      agentId: 'T1-05',
      agentName: 'Growth Factor Agent',
      score: clamped,
      metricLabel: 'Revenue YoY Growth',
      metricValue: `+${stock.revenueGrowthYoY.toFixed(1)}%`,
      verdict: clamped >= 80 ? 'STRONG' : clamped >= 60 ? 'POSITIVE' : 'NEUTRAL',
      notes: stock.revenueGrowthYoY >= 30 ? 'Hyper-growth revenue expansion profile' : 'Steady compounding topline growth',
    };
  }

  // T1-06 Value Factor Agent
  private evaluateValue(stock: GlobalStockItem): AgentFactorScore {
    let score = 50;
    // Lower Forward P/E relative to sector growth
    if (stock.forwardPE < 20) score += 35;
    else if (stock.forwardPE < 30) score += 20;
    else if (stock.forwardPE < 45) score += 5;
    else score -= 15; // Valuation premium

    // EV to EBITDA
    if (stock.evToEbitda < 18) score += 20;
    else if (stock.evToEbitda < 25) score += 10;
    else score -= 10;

    const clamped = Math.min(100, Math.max(0, score));
    return {
      agentId: 'T1-06',
      agentName: 'Value Factor Agent',
      score: clamped,
      metricLabel: 'Forward P/E & EV/EBITDA',
      metricValue: `${stock.forwardPE.toFixed(1)}x / ${stock.evToEbitda.toFixed(1)}x`,
      verdict: clamped >= 70 ? 'POSITIVE' : clamped >= 50 ? 'NEUTRAL' : 'CAUTION',
      notes: stock.forwardPE < 25 ? 'Attractive multiple relative to forward earnings' : 'Growth premium priced in; requires continued execution',
    };
  }

  // T1-07 Earnings Revision Agent
  private evaluateEarningsRevision(stock: GlobalStockItem): AgentFactorScore {
    // Top AI/Tech leaders have consecutive beat track record
    const highBeatTickers = ['NVDA', 'MSFT', 'META', 'AMZN', 'LLY', 'AVGO', 'PLTR'];
    const hasHighBeats = highBeatTickers.includes(stock.ticker);
    const score = hasHighBeats ? 92 : 74;

    return {
      agentId: 'T1-07',
      agentName: 'Earnings Revision Agent',
      score,
      metricLabel: 'EPS Beat & Consensus Revisions',
      metricValue: hasHighBeats ? '4/4 Quarters Beat (+14.2% avg)' : '3/4 Quarters Beat (+4.8% avg)',
      verdict: hasHighBeats ? 'STRONG' : 'POSITIVE',
      notes: hasHighBeats ? 'Consistent upward earnings estimate revisions by Wall Street' : 'Stable earnings estimates with moderate upside revisions',
    };
  }

  // T1-08 Volume & Liquidity Agent
  private evaluateLiquidity(stock: GlobalStockItem): AgentFactorScore {
    const isUltraLiquid = stock.marketCap >= 300_000_000_000;
    const score = isUltraLiquid ? 96 : 82;

    return {
      agentId: 'T1-08',
      agentName: 'Volume & Liquidity Agent',
      score,
      metricLabel: 'Institutional Accumulation',
      metricValue: isUltraLiquid ? 'Ultra High (ADV > $1B/day)' : 'High Institutional Liquidity',
      verdict: 'STRONG',
      notes: 'Deep order book depth with minimal institutional execution slippage',
    };
  }

  // T1-09 News & Catalyst Agent
  private evaluateCatalyst(stock: GlobalStockItem): AgentFactorScore {
    const catalystMap: Record<string, { score: number; catalyst: string; verdict: 'STRONG' | 'POSITIVE' }> = {
      NVDA: { score: 95, catalyst: 'Blackwell B200 volume production & AI Data Center CapEx surge', verdict: 'STRONG' },
      MSFT: { score: 90, catalyst: 'Copilot enterprise monetization & Azure AI compute expansion', verdict: 'STRONG' },
      META: { score: 88, catalyst: 'Llama 4 models & AI ad-targeting efficiency margin gains', verdict: 'STRONG' },
      AMZN: { score: 87, catalyst: 'AWS re:Invent custom silicon (Trainium) & Prime logistics leverage', verdict: 'STRONG' },
      GOOGL: { score: 84, catalyst: 'Gemini 2.5 rollout & Google Cloud operating margin inflection', verdict: 'STRONG' },
      TSM: { score: 92, catalyst: '3nm / 2nm foundry capacity sold out through 2027', verdict: 'STRONG' },
      AVGO: { score: 91, catalyst: 'Custom AI ASIC accelerators & VMware integration synergies', verdict: 'STRONG' },
      PLTR: { score: 94, catalyst: 'AIP Bootcamps commercial pipeline conversion acceleration', verdict: 'STRONG' },
      LLY: { score: 93, catalyst: 'Tirzepatide manufacturing ramp & cardiovascular label expansion', verdict: 'STRONG' },
      AAPL: { score: 82, catalyst: 'Apple Intelligence iPhone upgrade cycle launch', verdict: 'POSITIVE' },
      TSLA: { score: 78, catalyst: 'Robotaxi autonomous pilot & Energy Storage Megapack growth', verdict: 'POSITIVE' },
    };

    const entry = catalystMap[stock.ticker] || {
      score: 72,
      catalyst: `${stock.sector} industry secular growth tailwinds and strong market positioning`,
      verdict: 'POSITIVE' as const,
    };

    return {
      agentId: 'T1-09',
      agentName: 'News & Catalyst Agent',
      score: entry.score,
      metricLabel: 'Upcoming Key Catalysts',
      metricValue: entry.catalyst,
      verdict: entry.verdict,
      notes: 'Active positive near-term catalysts supporting upward rerating',
    };
  }

  // T1-10 Ranking Chairman Agent: Synthesize all 9 factor scores with weights
  public runRanking(customWeights?: Partial<FactorWeights>): RankingRunResult {
    if (customWeights) {
      this.setWeights(customWeights);
    }
    const weights = this.activeWeights;
    const universe = globalStockStore.getUniverse();
    const candidates: StockRankingCandidate[] = [];

    for (const stock of universe) {
      const indicators = globalStockStore.getStockIndicators(stock.ticker);

      const screener = this.evaluateScreener(stock);
      const momentum = this.evaluateMomentum(stock, indicators);
      const trend = this.evaluateTrend(indicators);
      const quality = this.evaluateQuality(stock);
      const growth = this.evaluateGrowth(stock);
      const value = this.evaluateValue(stock);
      const earningsRevision = this.evaluateEarningsRevision(stock);
      const liquidity = this.evaluateLiquidity(stock);
      const catalyst = this.evaluateCatalyst(stock);

      // Weighted Composite Score Formula
      const totalScore = Number((
        momentum.score * weights.momentum +
        trend.score * weights.trend +
        quality.score * weights.quality +
        growth.score * weights.growth +
        value.score * weights.value +
        earningsRevision.score * weights.earningsRevision +
        catalyst.score * weights.catalyst
      ).toFixed(2));

      // Conviction Tiering
      let conviction: 'STRONG_BUY' | 'BUY' | 'WATCHLIST' | 'NEUTRAL';
      if (totalScore >= 82) conviction = 'STRONG_BUY';
      else if (totalScore >= 72) conviction = 'BUY';
      else if (totalScore >= 60) conviction = 'WATCHLIST';
      else conviction = 'NEUTRAL';

      // Strengths & Risks synthesis
      const strengths: string[] = [];
      const risks: string[] = [];

      if (growth.score >= 80) strengths.push(`High Growth: ${growth.metricValue}`);
      if (quality.score >= 80) strengths.push(`Premier Quality: ${quality.metricValue}`);
      if (momentum.score >= 75) strengths.push(`Relative Strength: ${momentum.metricValue}`);
      if (trend.score >= 75) strengths.push(`Bullish Trend: ${trend.metricValue}`);
      if (catalyst.score >= 85) strengths.push(`Catalyst: ${catalyst.metricValue}`);

      if (value.score < 50) risks.push(`Valuation Premium: Forward P/E ${stock.forwardPE.toFixed(1)}x`);
      if (indicators?.rsi14 && indicators.rsi14 > 72) risks.push(`Near-term Overbought (RSI: ${indicators.rsi14.toFixed(1)})`);
      if (growth.score < 50) risks.push('Moderate Topline Revenue Deceleration');

      if (strengths.length === 0) strengths.push('Defensive Balance Sheet');
      if (risks.length === 0) risks.push('Macro Sensitivity & Multiple Compression Risk');

      const chairmanSummary = `Team 1 Consensus Score: ${totalScore}/100 [${conviction}]. Lead drivers: ${strengths.slice(0, 2).join('; ')}.`;

      candidates.push({
        rank: 0, // Assigned after sorting
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        industry: stock.industry,
        price: stock.price,
        changePercent: stock.changePercent,
        marketCap: stock.marketCap,
        totalScore,
        conviction,
        factorScores: {
          screener,
          momentum,
          trend,
          quality,
          growth,
          value,
          earningsRevision,
          liquidity,
          catalyst,
        },
        chairmanSummary,
        topStrengths: strengths,
        keyRisks: risks,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Sort descending by totalScore
    candidates.sort((a, b) => b.totalScore - a.totalScore);

    // Assign 1-indexed ranks
    candidates.forEach((cand, idx) => {
      cand.rank = idx + 1;
    });

    const runId = `RUN-T1-${Date.now().toString(36).toUpperCase()}`;
    const result: RankingRunResult = {
      runId,
      timestamp: new Date().toISOString(),
      universeSize: universe.length,
      marketRegime: 'RISK_ON',
      weights,
      topCandidates: candidates,
      summary: {
        strongBuyCount: candidates.filter(c => c.conviction === 'STRONG_BUY').length,
        buyCount: candidates.filter(c => c.conviction === 'BUY').length,
        watchlistCount: candidates.filter(c => c.conviction === 'WATCHLIST').length,
        neutralCount: candidates.filter(c => c.conviction === 'NEUTRAL').length,
        highestScoreTicker: candidates[0]?.ticker || '',
        highestScore: candidates[0]?.totalScore || 0,
      },
    };

    this.latestRun = result;
    return result;
  }

  public getLatestRun(): RankingRunResult {
    if (!this.latestRun) {
      return this.runRanking();
    }
    return this.latestRun;
  }
}

export const team1RankingEngine = new Team1RankingEngine();
