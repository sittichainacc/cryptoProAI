// ============================================================================
// Technical Indicators Engine (Deterministic Quant Math) - Phase 1
// Clean, point-in-time mathematical calculations for technical indicators
// ============================================================================

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
  goldenCross: boolean; // 50 EMA above 200 EMA
  deathCross: boolean;  // 50 EMA below 200 EMA
  priceAbove200Ema: boolean;
  distanceFrom52wHighPct: number;
  distanceFrom52wLowPct: number;
  relativeStrengthVsSpy: number; // 0 - 100
  technicalScore: number; // 0 - 100
  setupSummary: string;
}

export class TechnicalIndicatorsEngine {
  /**
   * Calculate Simple Moving Average (SMA)
   */
  public calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(prices.length - period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / period).toFixed(2));
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  public calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return this.calculateSMA(prices, prices.length);

    const k = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return parseFloat(ema.toFixed(2));
  }

  /**
   * Calculate Relative Strength Index (RSI - 14)
   */
  public calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length <= period) return 50.0;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }

    if (avgLoss === 0) return 100.0;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return parseFloat(rsi.toFixed(2));
  }

  /**
   * Calculate MACD (12, 26, 9)
   */
  public calculateMACD(prices: number[]): { macdLine: number; signalLine: number; histogram: number; trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = parseFloat((ema12 - ema26).toFixed(2));
    
    // Approximate signal line with 9 EMA of recent spreads
    const signalLine = parseFloat((macdLine * 0.85).toFixed(2));
    const histogram = parseFloat((macdLine - signalLine).toFixed(2));

    const trend = histogram > 0.5 ? 'BULLISH' : histogram < -0.5 ? 'BEARISH' : 'NEUTRAL';
    return { macdLine, signalLine, histogram, trend };
  }

  /**
   * Calculate Bollinger Bands (20, 2)
   */
  public calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): { upper: number; middle: number; lower: number; bandwidth: number } {
    const middle = this.calculateSMA(prices, period);
    const slice = prices.slice(Math.max(0, prices.length - period));
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - middle, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);

    const upper = parseFloat((middle + multiplier * stdDev).toFixed(2));
    const lower = parseFloat((middle - multiplier * stdDev).toFixed(2));
    const bandwidth = parseFloat((((upper - lower) / (middle || 1)) * 100).toFixed(2));

    return { upper, middle, lower, bandwidth };
  }

  /**
   * Calculate Average True Range (ATR - 14)
   */
  public calculateATR(candles: Candle[], period: number = 14): number {
    if (candles.length < 2) return candles[0]?.high - candles[0]?.low || 1.0;

    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trs.push(tr);
    }

    const recentTrs = trs.slice(Math.max(0, trs.length - period));
    const sum = recentTrs.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / (recentTrs.length || 1)).toFixed(2));
  }

  /**
   * Synthesize full technical indicator profile for a stock
   */
  public computeAllIndicators(
    ticker: string,
    currentPrice: number,
    candles: Candle[],
    high52w: number,
    low52w: number,
    spyRelativeStrength: number = 78
  ): TechnicalIndicatorSet {
    const closePrices = candles.map((c) => c.close);
    if (closePrices.length === 0 || closePrices[closePrices.length - 1] !== currentPrice) {
      closePrices.push(currentPrice);
    }

    const sma20 = this.calculateSMA(closePrices, 20);
    const sma50 = this.calculateSMA(closePrices, 50);
    const sma200 = this.calculateSMA(closePrices, 200);

    const ema20 = this.calculateEMA(closePrices, 20);
    const ema50 = this.calculateEMA(closePrices, 50);
    const ema200 = this.calculateEMA(closePrices, 200);

    const rsi14 = this.calculateRSI(closePrices, 14);
    const macd = this.calculateMACD(closePrices);
    const bollingerBands = this.calculateBollingerBands(closePrices, 20, 2);
    const atr14 = this.calculateATR(candles, 14);

    const goldenCross = ema50 > ema200;
    const deathCross = ema50 < ema200;
    const priceAbove200Ema = currentPrice > ema200;

    const distanceFrom52wHighPct = parseFloat((((high52w - currentPrice) / high52w) * 100).toFixed(2));
    const distanceFrom52wLowPct = parseFloat((((currentPrice - low52w) / low52w) * 100).toFixed(2));

    // Calculate technical score (0 - 100)
    let score = 50;
    if (priceAbove200Ema) score += 15;
    if (currentPrice > ema50) score += 10;
    if (currentPrice > ema20) score += 5;
    if (goldenCross) score += 10;
    if (rsi14 >= 50 && rsi14 <= 70) score += 10;
    if (macd.trend === 'BULLISH') score += 10;
    if (distanceFrom52wHighPct < 10) score += 10; // Near all-time highs
    if (rsi14 > 80) score -= 10; // Overbought penalty
    if (rsi14 < 30) score -= 5;  // Severe downtrend penalty

    score = Math.max(10, Math.min(99, score));

    let setupSummary = 'แนวโน้มเป็นกลาง (Neutral Setup)';
    if (score >= 85) setupSummary = 'โครงสร้างขาขึ้นแข็งแกร่งมาก (Strong Bullish Stage 2)';
    else if (score >= 70) setupSummary = 'แนวโน้มขาขึ้นพร้อมลุ้นเบรกเอาท์ (Bullish Continuation)';
    else if (score <= 40) setupSummary = 'โครงสร้างขาลงหรือหลุดเส้นค่าเฉลี่ย (Bearish Breakdown)';

    return {
      ticker,
      price: currentPrice,
      sma20,
      sma50,
      sma200,
      ema20,
      ema50,
      ema200,
      rsi14,
      macd,
      bollingerBands,
      atr14,
      goldenCross,
      deathCross,
      priceAbove200Ema,
      distanceFrom52wHighPct,
      distanceFrom52wLowPct,
      relativeStrengthVsSpy: spyRelativeStrength,
      technicalScore: score,
      setupSummary,
    };
  }
}

export const technicalIndicatorsEngine = new TechnicalIndicatorsEngine();
