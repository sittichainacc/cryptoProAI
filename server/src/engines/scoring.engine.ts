import { ScoreGrade, TechnicalScoreBreakdown } from '../types/index.js';

export class TechnicalScoringEngine {
  /**
   * Calculate 100-Point Technical Score
   */
  static calculateScore(params: {
    price: number;
    change24h: number;
    change7d: number;
    volume24h: number;
    rsi: number;
    isAboveEma20: boolean;
    isAboveEma50: boolean;
    isAboveEma200: boolean;
    isBreakout: boolean;
    isRetest: boolean;
    btcChange7d: number;
    sectorChange7d: number;
  }): TechnicalScoreBreakdown {
    // 1. Trend (Max 20)
    let trend = 0;
    if (params.isAboveEma20 && params.isAboveEma50 && params.isAboveEma200) {
      trend += 10; // Strong EMA alignment
    } else if (params.isAboveEma20 && params.isAboveEma50) {
      trend += 7;
    } else if (params.isAboveEma20) {
      trend += 4;
    }

    if (params.change7d > 5 && params.change24h > 0) {
      trend += 10; // Higher High / Higher Low structure
    } else if (params.change7d > 0) {
      trend += 6;
    } else if (params.change7d > -5) {
      trend += 3;
    }

    // 2. Price Structure (Max 20)
    let priceStructure = 0;
    if (params.isBreakout) {
      priceStructure += 10;
    } else if (params.change24h > 3) {
      priceStructure += 7;
    } else {
      priceStructure += 4;
    }

    if (params.isRetest) {
      priceStructure += 10;
    } else if (params.price > 0 && params.change24h >= 0) {
      priceStructure += 7;
    } else {
      priceStructure += 3;
    }

    // 3. Volume (Max 15)
    let volume = 0;
    if (params.change24h > 10) {
      volume += 8; // Massive volume expansion
    } else if (params.change24h > 3) {
      volume += 6;
    } else {
      volume += 3;
    }
    // Volume base consistency
    volume += params.volume24h > 100000 ? 7 : 4;

    // 4. Momentum (Max 15)
    let momentum = 0;
    // RSI optimal zone (50 - 68 is healthy bullish)
    if (params.rsi >= 50 && params.rsi <= 68) {
      momentum += 8;
    } else if (params.rsi > 68 && params.rsi <= 78) {
      momentum += 6;
    } else if (params.rsi >= 40 && params.rsi < 50) {
      momentum += 4;
    } else {
      momentum += 2; // Overbought > 80 or Oversold < 30
    }
    // MACD positive momentum estimate
    if (params.change24h > 0 && params.rsi > 48) {
      momentum += 7;
    } else {
      momentum += 3;
    }

    // 5. Relative Strength (Max 10)
    let relativeStrength = 0;
    const vsBtc = params.change7d - params.btcChange7d;
    if (vsBtc > 5) relativeStrength += 5;
    else if (vsBtc > 0) relativeStrength += 3;
    else relativeStrength += 1;

    const vsSector = params.change7d - params.sectorChange7d;
    if (vsSector > 3) relativeStrength += 5;
    else if (vsSector >= 0) relativeStrength += 3;
    else relativeStrength += 1;

    // 6. Risk / Reward (Max 10)
    let riskReward = 0;
    if (params.rsi < 65 && params.change24h < 15) {
      riskReward += 6; // Room to upside
    } else {
      riskReward += 3;
    }
    riskReward += (params.isRetest || params.isBreakout) ? 4 : 2;

    // 7. Liquidity (Max 10)
    let liquidity = 0;
    if (params.volume24h > 5000000) liquidity += 10;
    else if (params.volume24h > 1000000) liquidity += 8;
    else if (params.volume24h > 100000) liquidity += 6;
    else liquidity += 4;

    // Cap categories
    trend = Math.min(20, Math.max(0, trend));
    priceStructure = Math.min(20, Math.max(0, priceStructure));
    volume = Math.min(15, Math.max(0, volume));
    momentum = Math.min(15, Math.max(0, momentum));
    relativeStrength = Math.min(10, Math.max(0, relativeStrength));
    riskReward = Math.min(10, Math.max(0, riskReward));
    liquidity = Math.min(10, Math.max(0, liquidity));

    const total = trend + priceStructure + volume + momentum + relativeStrength + riskReward + liquidity;

    let grade: ScoreGrade = 'D';
    if (total >= 90) grade = 'A+';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B+';
    else if (total >= 60) grade = 'B';
    else if (total >= 50) grade = 'C';
    else grade = 'D';

    return {
      total,
      grade,
      trend,
      priceStructure,
      volume,
      momentum,
      relativeStrength,
      riskReward,
      liquidity,
    };
  }
}
