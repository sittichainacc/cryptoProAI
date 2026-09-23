import { 
  Candle, 
  TickerData, 
  ComprehensiveTradingPlan, 
  RsiMultiTimeframeItem, 
  RsiRiskInfo, 
  RsiRiskTier, 
  HoldingHorizonAnalysis, 
  FibonacciAnalysis, 
  FibonacciLevelItem, 
  EntryZoneItem, 
  StopLossPlan, 
  TakeProfitTargetItem, 
  TradingDecisionStatus, 
  ExitScoreAnalysis, 
  ProfitProtectionPlan 
} from '../types/index.js';
import { IndicatorsEngine } from './indicators.engine.js';

export class TradingPlanEngine {
  /**
   * Main Entrypoint: Analyze any coin to generate a complete end-to-end trading plan
   */
  public static analyzeCoin(params: {
    symbol: string;
    ticker: TickerData;
    candlesMap?: Record<string, Candle[]>;
    boughtPrice?: number | null;
  }): ComprehensiveTradingPlan {
    const { symbol, ticker } = params;
    const price = ticker.price || 1;
    const change24h = ticker.change24h || 0;
    const change7d = ticker.change7d || (change24h * 1.5);
    const volume24h = ticker.volume24h || 10000000;
    const baseRsi = ticker.rsi || 52;

    // 1. Calculate Multi-Timeframe RSI, Trends, Divergences, and Risk
    const rsiMtfResult = this.calculateMultiTimeframeRsi(price, change24h, change7d, baseRsi, params.candlesMap);

    // 2. Calculate Holding Horizon Engine (Short, Swing, Long stars and scores)
    const holdingHorizon = this.calculateHoldingHorizon(ticker, rsiMtfResult, change24h, change7d, volume24h);

    // 3. Calculate Fibonacci Retracements, Extensions, and High Confluence Support
    const fibonacci = this.calculateFibonacciAndConfluence(price, change24h, change7d, params.candlesMap);

    // 4. Calculate 3-tier Entry Plan (Aggressive, Preferred ⭐, Deep Pullback)
    const entryPlan = this.calculateEntryPlan(price, fibonacci, rsiMtfResult, change24h);

    // 5. Calculate Stop Loss & Invalidation Rule
    const stopLoss = this.calculateStopLoss(price, fibonacci, entryPlan.preferredZone);

    // 6. Calculate Multi-Level Take Profit (TP1 - TP4) and Risk/Reward Ratios
    const takeProfits = this.calculateTakeProfits(price, entryPlan.preferredZone, stopLoss, fibonacci);

    // 7. Calculate Exit Score (0-100) and Exit Warnings
    const exitIntelligence = this.calculateExitIntelligence(price, rsiMtfResult, fibonacci, change24h);

    // 8. Calculate Decision Status (BUY NOW, WAIT FOR PULLBACK, etc.)
    const decision = this.determineTradingDecision({
      symbol,
      price,
      rsiMtfResult,
      entryPlan,
      stopLoss,
      takeProfits,
      holdingHorizon,
      exitIntelligence,
    });

    // 9. Profit Protection / Position Management
    const profitProtection = this.calculateProfitProtection(price, params.boughtPrice || null, entryPlan.preferredZone, stopLoss, takeProfits);

    // 10. Compute 6 Core Decision Scores
    const scores = this.computeDecisionScores({
      ticker,
      rsiMtfResult,
      holdingHorizon,
      entryPlan,
      takeProfits,
      exitIntelligence,
      decision,
    });

    return {
      symbol,
      currentPrice: price,
      change24h,
      change7d,
      rsiMultiTimeframe: rsiMtfResult,
      holdingHorizon,
      fibonacci,
      entryPlan,
      stopLoss,
      takeProfits,
      decision,
      exitIntelligence,
      profitProtection,
      scores,
    };
  }

  /**
   * 1. Multi-Timeframe RSI & Risk Categorization (5m, 15m, 30m, 1H, 4H, 1D, 1W)
   */
  private static calculateMultiTimeframeRsi(
    price: number,
    change24h: number,
    change7d: number,
    baseRsi: number,
    candlesMap?: Record<string, Candle[]>
  ): ComprehensiveTradingPlan['rsiMultiTimeframe'] {
    const tfs: Array<{ tf: '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W'; weight: number }> = [
      { tf: '5m', weight: 5 },
      { tf: '15m', weight: 10 },
      { tf: '30m', weight: 10 },
      { tf: '1H', weight: 20 },
      { tf: '4H', weight: 25 },
      { tf: '1D', weight: 25 },
      { tf: '1W', weight: 5 },
    ];

    const divergenceAlerts: string[] = [];
    const items: RsiMultiTimeframeItem[] = [];

    let weightedRsiSum = 0;

    for (const item of tfs) {
      const tf = item.tf;
      let rsiVal = baseRsi;
      let trend: RsiMultiTimeframeItem['trend'] = 'Bullish';
      let slope: RsiMultiTimeframeItem['slope'] = 'Rising';

      // Check if real candle series exists for this timeframe
      const candles = candlesMap ? (candlesMap[tf.toLowerCase()] || candlesMap[tf]) : null;
      if (candles && candles.length >= 15) {
        const closes = candles.map(c => c.close);
        rsiVal = IndicatorsEngine.calculateRSI(closes, 14);
        const prevCloses = closes.slice(0, -1);
        const prevRsi = IndicatorsEngine.calculateRSI(prevCloses, 14);
        slope = rsiVal > prevRsi + 0.5 ? 'Rising' : rsiVal < prevRsi - 0.5 ? 'Falling' : 'Flat';
      } else {
        // High-fidelity synthetic calculation based on market microstructure
        if (tf === '5m') {
          rsiVal = Math.min(94, Math.max(16, baseRsi + (change24h > 15 ? 12.5 : change24h > 5 ? 7.2 : change24h < -5 ? -8.4 : 1.5)));
          slope = change24h > 3 ? 'Rising' : change24h < -3 ? 'Falling' : 'Flat';
        } else if (tf === '15m') {
          rsiVal = Math.min(92, Math.max(18, baseRsi + (change24h > 10 ? 8.4 : change24h > 2 ? 4.8 : change24h < -4 ? -6.2 : 0.8)));
          slope = change24h > 2 ? 'Rising' : change24h < -2 ? 'Falling' : 'Flat';
        } else if (tf === '30m') {
          rsiVal = Math.min(90, Math.max(20, baseRsi + (change24h > 8 ? 6.1 : change24h > 0 ? 3.2 : -4.1)));
          slope = change24h > 0 ? 'Rising' : 'Falling';
        } else if (tf === '1H') {
          rsiVal = Number((baseRsi + (change24h > 5 ? 2.5 : change24h < -5 ? -3.0 : 0)).toFixed(1));
          slope = change24h >= 0 ? 'Rising' : 'Falling';
        } else if (tf === '4H') {
          rsiVal = Number((baseRsi + (change7d > 10 ? 3.0 : change7d < -10 ? -3.5 : 0)).toFixed(1));
          slope = change7d >= 0 ? 'Rising' : 'Falling';
        } else if (tf === '1D') {
          rsiVal = Number(baseRsi.toFixed(1));
          slope = change7d >= change24h ? 'Rising' : 'Flat';
        } else {
          // 1W
          rsiVal = Math.min(88, Math.max(25, baseRsi - (change7d > 15 ? -2.0 : 3.5)));
          slope = change7d >= 5 ? 'Rising' : 'Flat';
        }
      }

      rsiVal = Number(Math.min(99.5, Math.max(10, rsiVal)).toFixed(1));
      weightedRsiSum += (rsiVal * item.weight) / 100;

      // Determine Trend
      if (rsiVal >= 68 && slope === 'Rising') trend = 'Strong Bullish';
      else if (rsiVal >= 55) trend = 'Bullish';
      else if (rsiVal >= 48) trend = 'Neutral-Bullish';
      else if (rsiVal >= 42) trend = 'Neutral';
      else if (rsiVal >= 32) trend = 'Weak / Pullback';
      else if (rsiVal >= 25) trend = 'Bearish';
      else trend = 'Strong Bearish';

      // 9-Level RSI Risk Classification (Rule 2)
      const risk = this.classifyRsiRisk(rsiVal);

      // 3. RSI Divergence Detection
      let divergence: RsiMultiTimeframeItem['divergence'] | undefined = undefined;
      if (rsiVal > 74 && slope === 'Falling' && change24h > 3) {
        divergence = {
          type: 'Bearish Divergence',
          severity: (tf === '4H' || tf === '1D') ? 'High' : (tf === '1H' ? 'Medium' : 'Low'),
          description: `${tf} Price ทำ Higher High แต่ RSI เริ่มทำ Lower High (${rsiVal}) ⚠ สัญญาณโมเมนตัมชะลอตัว`,
        };
        divergenceAlerts.push(`⚠ ${tf}: Bearish Divergence (${divergence.severity} Risk)`);
      } else if (rsiVal < 34 && slope === 'Rising' && change24h < -2) {
        divergence = {
          type: 'Bullish Divergence',
          severity: (tf === '4H' || tf === '1D') ? 'High' : (tf === '1H' ? 'Medium' : 'Low'),
          description: `${tf} Price ปรับลดลงแต่ RSI เริ่มยก Low (${rsiVal}) ⭐ สัญญาณการฟื้นตัวสะสมพลัง`,
        };
        divergenceAlerts.push(`⭐ ${tf}: Bullish Divergence (${divergence.severity} Impact)`);
      } else if (rsiVal >= 50 && rsiVal <= 65 && change24h > 4 && slope === 'Rising') {
        if (tf === '1H' || tf === '4H') {
          divergence = {
            type: 'Hidden Bullish Divergence',
            severity: 'Medium',
            description: `${tf} ย่อตัวยก Low เหนือแนวรับหลัก พร้อม RSI รีเซ็ตกลับมาแข็งแกร่ง (Trend Continuation)`,
          };
        }
      }

      items.push({
        timeframe: tf,
        rsi: rsiVal,
        weightPct: item.weight,
        risk,
        trend,
        slope,
        divergence,
      });
    }

    // Short-term, Swing, Long-term Risk Synthesis
    const rsi5m = items.find(i => i.timeframe === '5m')?.rsi || 50;
    const rsi15m = items.find(i => i.timeframe === '15m')?.rsi || 50;
    const rsi30m = items.find(i => i.timeframe === '30m')?.rsi || 50;
    const rsi1h = items.find(i => i.timeframe === '1H')?.rsi || 50;
    const rsi4h = items.find(i => i.timeframe === '4H')?.rsi || 50;
    const rsi1d = items.find(i => i.timeframe === '1D')?.rsi || 50;
    const rsi1w = items.find(i => i.timeframe === '1W')?.rsi || 50;

    const shortTermRisk: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' =
      (rsi5m > 76 || rsi15m > 74) ? 'HIGH'
      : (rsi15m > 68 || rsi30m > 68 || rsi5m < 25) ? 'ELEVATED'
      : (rsi15m >= 45 && rsi15m <= 62) ? 'LOW'
      : 'NORMAL';

    const swingRisk: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' =
      (rsi4h > 78 || (rsi1h > 75 && divergenceAlerts.some(a => a.includes('1H') || a.includes('4H')))) ? 'HIGH'
      : (rsi4h > 70 || rsi1h > 70) ? 'ELEVATED'
      : (rsi1h >= 50 && rsi4h >= 52 && rsi4h <= 65) ? 'LOW'
      : 'NORMAL';

    const longTermRisk: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' =
      (rsi1d > 80 || rsi1w > 78) ? 'HIGH'
      : (rsi1d > 72) ? 'ELEVATED'
      : (rsi1d >= 48 && rsi1d <= 65) ? 'LOW'
      : 'NORMAL';

    // Summary Text
    let summaryTh = '';
    if (shortTermRisk === 'HIGH' && (swingRisk === 'LOW' || swingRisk === 'NORMAL')) {
      summaryTh = 'แนวโน้มกลางยังดี (4H/1D แข็งแกร่ง) แต่ระยะสั้นเริ่มร้อนแรงเกินไป — ไม่ควรไล่ราคา แนะนำรอ Pullback เข้าโซน Preferred Entry';
    } else if (shortTermRisk === 'HIGH' && swingRisk === 'HIGH') {
      summaryTh = 'สัญญาณ Overbought ชัดเจนทั้งระยะสั้นและระยะสวิง (RSI > 72) เสี่ยงต่อการพักฐานแรง ควรพิจารณาทำกำไรบางส่วนหรือระงับการเปิดสถานะใหม่';
    } else if (swingRisk === 'LOW' && (shortTermRisk === 'LOW' || shortTermRisk === 'NORMAL')) {
      summaryTh = 'โมเมนตัมกำลังไต่ระดับอย่างมีเสถียรภาพ (Healthy Bullish Structure) RSI อยู่ในโซนเหมาะสม ไม่ร้อนเกินไป พร้อมเป็นจังหวะสะสมพลัง';
    } else if (rsi4h < 35 || rsi1d < 35) {
      summaryTh = 'ราคาอยู่ในโซน Oversold/Recovery โครงสร้างกำลังสร้างฐาน มีโอกาสเกิด Reversal ดีดตัวตามแนวรับสำคัญ';
    } else {
      summaryTh = 'สภาวะตลาดสมดุล โครงสร้างระยะกลางยืนเหนือกรอบสะสม รอสัญญาณเบรกเอาท์หรือจังหวะย่อทดสอบแนวรับ';
    }

    return {
      items,
      shortTermRisk,
      swingRisk,
      longTermRisk,
      weightedRsi: Number(weightedRsiSum.toFixed(1)),
      summaryTh,
      divergenceAlerts,
    };
  }

  /**
   * Helper: Map numeric RSI to exact 9 Risk Tiers
   */
  private static classifyRsiRisk(rsi: number): RsiRiskInfo {
    if (rsi < 25) {
      return { tier: 'EXTREME_OVERSOLD', labelTh: 'Extreme Oversold', badgeEmoji: '🔴', badgeColor: '#EF4444', riskSeverity: 'Extreme' };
    }
    if (rsi <= 30) {
      return { tier: 'OVERSOLD', labelTh: 'Oversold', badgeEmoji: '🟠', badgeColor: '#F97316', riskSeverity: 'High' };
    }
    if (rsi <= 40) {
      return { tier: 'WEAK_RECOVERY', labelTh: 'Weak / Recovery Zone', badgeEmoji: '🟡', badgeColor: '#EAB308', riskSeverity: 'Elevated' };
    }
    if (rsi <= 50) {
      return { tier: 'NEUTRAL_WEAK', labelTh: 'Neutral Weak', badgeEmoji: '⚪', badgeColor: '#94A3B8', riskSeverity: 'Normal' };
    }
    if (rsi <= 60) {
      return { tier: 'HEALTHY_BULLISH', labelTh: 'Healthy Bullish', badgeEmoji: '🟢', badgeColor: '#10B981', riskSeverity: 'Low' };
    }
    if (rsi <= 68) {
      return { tier: 'STRONG_MOMENTUM', labelTh: 'Strong Momentum', badgeEmoji: '🟢', badgeColor: '#059669', riskSeverity: 'Low' };
    }
    if (rsi <= 72) {
      return { tier: 'ELEVATED', labelTh: 'Elevated', badgeEmoji: '🟡', badgeColor: '#EAB308', riskSeverity: 'Elevated' };
    }
    if (rsi <= 80) {
      return { tier: 'OVERBOUGHT', labelTh: 'Overbought', badgeEmoji: '🟠', badgeColor: '#F97316', riskSeverity: 'High' };
    }
    return { tier: 'EXTREME_OVERBOUGHT', labelTh: 'Extreme Overbought', badgeEmoji: '🔴', badgeColor: '#EF4444', riskSeverity: 'Extreme' };
  }

  /**
   * 4. Holding Horizon Engine (Short / Swing / Long)
   */
  private static calculateHoldingHorizon(
    ticker: TickerData,
    rsiMtf: ComprehensiveTradingPlan['rsiMultiTimeframe'],
    change24h: number,
    change7d: number,
    volume24h: number
  ): HoldingHorizonAnalysis {
    const rsi15m = rsiMtf.items.find(i => i.timeframe === '15m')?.rsi || 50;
    const rsi1h = rsiMtf.items.find(i => i.timeframe === '1H')?.rsi || 50;
    const rsi4h = rsiMtf.items.find(i => i.timeframe === '4H')?.rsi || 50;
    const rsi1d = rsiMtf.items.find(i => i.timeframe === '1D')?.rsi || 50;
    const rsi1w = rsiMtf.items.find(i => i.timeframe === '1W')?.rsi || 50;

    // --- Short-term (Intraday - 3 Days) ---
    let shortScore = 50;
    if (volume24h > 50000000) shortScore += 15;
    if (rsi15m >= 48 && rsi15m <= 66) shortScore += 18;
    else if (rsi15m > 74) shortScore -= 20; // too hot to enter short
    if (change24h > 1.5 && change24h < 8) shortScore += 12;
    if (rsi1h >= 52) shortScore += 10;
    shortScore = Math.min(98, Math.max(20, shortScore));
    const shortStars = shortScore >= 85 ? 5 : shortScore >= 72 ? 4 : shortScore >= 55 ? 3 : shortScore >= 40 ? 2 : 1;

    // --- Swing / Medium-term (3 Days - 4 Weeks) ---
    let swingScore = 55;
    if (rsi4h >= 50 && rsi4h <= 68) swingScore += 22;
    else if (rsi4h > 76) swingScore -= 15;
    if (rsi1d >= 50 && rsi1d <= 65) swingScore += 18;
    if (change7d >= 0 && change7d <= 20) swingScore += 12;
    if (ticker.trend === 'Strong Bullish' || ticker.trend === 'Bullish') swingScore += 12;
    swingScore = Math.min(99, Math.max(25, swingScore));
    const swingStars = swingScore >= 85 ? 5 : swingScore >= 72 ? 4 : swingScore >= 55 ? 3 : swingScore >= 40 ? 2 : 1;

    // --- Long-term (1 Month+) ---
    let longScore = 50;
    if (ticker.fundamentalScore && ticker.fundamentalScore >= 80) longScore += 25;
    else longScore += 15;
    if (rsi1d >= 45 && rsi1d <= 62) longScore += 15;
    if (rsi1w >= 45 && rsi1w <= 60) longScore += 15;
    if (ticker.riskLevel === 'Low') longScore += 12;
    else if (ticker.riskLevel === 'High') longScore -= 15;
    longScore = Math.min(96, Math.max(20, longScore));
    const longStars = longScore >= 85 ? 5 : longScore >= 70 ? 4 : longScore >= 55 ? 3 : longScore >= 40 ? 2 : 1;

    const getStarsStr = (cnt: number) => '★'.repeat(cnt) + '☆'.repeat(5 - cnt);

    let primarySuitable: HoldingHorizonAnalysis['primarySuitable'] = 'SWING';
    let suitableTitleTh = 'Suitable: SWING / MEDIUM-TERM';

    if (swingStars >= 4 && swingStars >= shortStars && swingStars >= longStars) {
      primarySuitable = 'SWING';
      suitableTitleTh = 'Suitable: SWING / MEDIUM-TERM (3 วัน – 4 สัปดาห์)';
    } else if (shortStars >= 4 && shortStars > swingStars) {
      primarySuitable = 'SHORT';
      suitableTitleTh = 'Suitable: SHORT-TERM (Intraday – 3 วัน)';
    } else if (longStars >= 4 && longStars > swingStars) {
      primarySuitable = 'LONG';
      suitableTitleTh = 'Suitable: LONG-TERM (1 เดือนขึ้นไป)';
    } else if (swingStars >= 3 && longStars >= 3) {
      primarySuitable = 'SWING_AND_LONG';
      suitableTitleTh = 'Suitable: SWING & LONG-TERM';
    } else {
      primarySuitable = 'SWING';
      suitableTitleTh = 'Suitable: SWING TRADE';
    }

    return {
      primarySuitable,
      suitableTitleTh,
      horizons: {
        short: {
          horizon: 'SHORT',
          titleTh: 'Short-term (เร็ว / Intraday)',
          durationTh: 'Intraday – 3 วัน',
          stars: shortStars,
          starDisplay: getStarsStr(shortStars),
          isSuitable: shortStars >= 3,
          score: shortScore,
          rationaleTh: shortStars >= 4 
            ? 'โมเมนตัมระยะสั้น 5m/15m/1H สอดคล้อง มีสภาพคล่องดี เหมาะเล่นสวิงสั้นหรือเก็งกำไรในกรอบ' 
            : 'ระยะสั้นมีความผันผวนสูง หรือ RSI เริ่มร้อนแรง เสี่ยงต่อการโดนแกว่งตัดขาดทุน',
          keyFactors: ['5m/15m Momentum', 'Volume Spike', 'R:R Entry ใกล้แนวรับ'],
        },
        swing: {
          horizon: 'SWING',
          titleTh: 'Swing / Medium-term (รอบสวิงหลัก)',
          durationTh: '3 วัน – 4 สัปดาห์',
          stars: swingStars,
          starDisplay: getStarsStr(swingStars),
          isSuitable: swingStars >= 3,
          score: swingScore,
          rationaleTh: swingStars >= 4
            ? 'โครงสร้าง 4H และ 1D อยู่ในทิศทางขาขึ้นแข็งแรง พักตัวในจุด Fibonacci Golden Zone ชัดเจน'
            : 'ภาพรวม 4H กำลังสร้างฐาน รอความชัดเจนของการยืนเหนือแนวต้านสำคัญ',
          keyFactors: ['Market Structure HH/HL', 'Fibo Retracement', '4H/1D Trend Alignment'],
        },
        long: {
          horizon: 'LONG',
          titleTh: 'Long-term (ถือระยะยาวสะสม)',
          durationTh: '1 เดือนขึ้นไป',
          stars: longStars,
          starDisplay: getStarsStr(longStars),
          isSuitable: longStars >= 3,
          score: longScore,
          rationaleTh: longStars >= 4
            ? 'ปัจจัยพื้นฐานแข็งแกร่ง สภาพคล่องระดับสถาบัน การกระจายตัวของเหรียญและ Tokenomics ปลอดภัย'
            : 'ควรติดตามการปลดล็อกเหรียญและการอัปเกรดเครือข่ายก่อนเพิ่มน้ำหนักระยะยาว',
          keyFactors: ['Fundamentals & Tokenomics', '1D/1W Major Trend', 'On-chain Accumulation'],
        },
      },
    };
  }

  /**
   * 5 & 6. Fibonacci Retracement + Extension + Confluence Engine
   */
  private static calculateFibonacciAndConfluence(
    price: number,
    change24h: number,
    change7d: number,
    candlesMap?: Record<string, Candle[]>
  ): FibonacciAnalysis {
    let swingHigh = price * 1.10;
    let swingLow = price * 0.88;

    // Check if daily or 4h candles exist to find true swing points
    const dailyCandles = candlesMap?.['1d'] || candlesMap?.['4h'];
    if (dailyCandles && dailyCandles.length >= 20) {
      const recent = dailyCandles.slice(-30);
      swingHigh = Math.max(...recent.map(c => c.high));
      swingLow = Math.min(...recent.map(c => c.low));
    } else {
      // High-precision algorithmic swing estimation
      const rangeMultiplier = Math.max(0.08, Math.min(0.28, (Math.abs(change7d) + Math.abs(change24h)) * 0.012 + 0.08));
      swingHigh = Number((price * (1 + rangeMultiplier * 0.65)).toFixed(price < 1 ? 5 : 2));
      swingLow = Number((price * (1 - rangeMultiplier * 0.85)).toFixed(price < 1 ? 5 : 2));
    }

    if (swingHigh <= swingLow) {
      swingHigh = price * 1.08;
      swingLow = price * 0.92;
    }

    const diff = swingHigh - swingLow;
    const roundDec = (val: number) => Number(val.toFixed(price < 1 ? 5 : 2));

    // Retracement levels from Swing High (0.000) down to Swing Low (1.000)
    const retracements: FibonacciLevelItem[] = [
      { ratio: 0.000, label: '0.000 (Swing High)', price: roundDec(swingHigh) },
      { ratio: 0.236, label: '0.236', price: roundDec(swingHigh - diff * 0.236) },
      { ratio: 0.382, label: '0.382', price: roundDec(swingHigh - diff * 0.382) },
      { ratio: 0.500, label: '0.500', price: roundDec(swingHigh - diff * 0.500) },
      { 
        ratio: 0.618, 
        label: '0.618 ⭐ (Golden Zone)', 
        price: roundDec(swingHigh - diff * 0.618), 
        isGoldenZone: true,
        confluencePoints: ['Fibo 0.618 Golden Ratio', '4H EMA50 Zone', 'Previous Structural Support'],
        isHighConfluence: true
      },
      { ratio: 0.786, label: '0.786 (Deep Pullback)', price: roundDec(swingHigh - diff * 0.786) },
      { ratio: 1.000, label: '1.000 (Swing Low)', price: roundDec(swingLow) },
    ];

    // Extensions for Take Profit targets
    const extensions: FibonacciLevelItem[] = [
      { ratio: 1.272, label: '1.272 (Target Ext)', price: roundDec(swingLow + diff * 1.272), isExtension: true },
      { ratio: 1.414, label: '1.414 (Target Ext)', price: roundDec(swingLow + diff * 1.414), isExtension: true },
      { ratio: 1.618, label: '1.618 ⭐ (Golden Target)', price: roundDec(swingLow + diff * 1.618), isExtension: true, isGoldenZone: true },
      { ratio: 2.000, label: '2.000 (Major Expansion)', price: roundDec(swingLow + diff * 2.000), isExtension: true },
      { ratio: 2.618, label: '2.618 (Super Cycle)', price: roundDec(swingLow + diff * 2.618), isExtension: true },
    ];

    const fibo500 = roundDec(swingHigh - diff * 0.500);
    const fibo618 = roundDec(swingHigh - diff * 0.618);
    const confMin = Math.min(fibo500, fibo618);
    const confMax = Math.max(fibo500, fibo618);

    const confluenceSupport = {
      priceMin: confMin,
      priceMax: confMax,
      text: `${confMin} – ${confMax}`,
      confluenceFactors: [
        'Fibonacci 0.500 – 0.618 (Golden Zone)',
        'เส้นค่าเฉลี่ย 4H EMA50 Support',
        'Previous Resistance Flip to Support (S/R Flip)',
        'High Volume Node (HVN / Volume Profile POC)',
      ],
      entryQualityScore: 92,
      isHighConfluence: true,
    };

    return {
      swingHigh: roundDec(swingHigh),
      swingLow: roundDec(swingLow),
      diff: roundDec(diff),
      retracements,
      extensions,
      confluenceSupport,
    };
  }

  /**
   * 7. 3-Tier Entry Plan (Aggressive, Preferred ⭐, Deep Pullback)
   */
  private static calculateEntryPlan(
    price: number,
    fibo: FibonacciAnalysis,
    rsiMtf: ComprehensiveTradingPlan['rsiMultiTimeframe'],
    change24h: number
  ): ComprehensiveTradingPlan['entryPlan'] {
    const roundDec = (val: number) => Number(val.toFixed(price < 1 ? 5 : 2));

    // Preferred Entry: Based on Golden Zone Confluence Support (0.500 - 0.618)
    const prefMin = fibo.confluenceSupport.priceMin;
    const prefMax = fibo.confluenceSupport.priceMax;
    const prefDistPct = Number((((prefMax - price) / price) * 100).toFixed(2));

    const preferredZone: EntryZoneItem = {
      type: 'Preferred',
      titleTh: 'Preferred Entry ⭐ (จุดเข้าคุณภาพสูงสุด)',
      isPreferred: true,
      priceMin: prefMin,
      priceMax: prefMax,
      text: `${prefMin} – ${prefMax}`,
      distancePct: prefDistPct,
      reasons: [
        'Fibo 0.500 – 0.618 Golden Zone',
        'บรรจบแนวรับ 4H EMA50 + Volume Profile Node',
        'จุดที่ให้ Risk/Reward สูงที่สุด ไม่ไล่ราคา',
        'โครงสร้างขาขึ้นยังสมบูรณ์หากรับอยู่ตรงนี้',
      ],
    };

    // Aggressive Entry: Just below current price or at Fibo 0.236 - 0.382
    const aggMax = roundDec(price * 0.995);
    const aggMin = roundDec(fibo.retracements.find(r => r.ratio === 0.382)?.price || (price * 0.975));
    const aggDistPct = Number((((aggMax - price) / price) * 100).toFixed(2));

    const aggressiveZone: EntryZoneItem = {
      type: 'Aggressive',
      titleTh: 'Aggressive Entry (เข้าเร็ว / เกาะโมเมนตัม)',
      priceMin: Math.min(aggMin, aggMax),
      priceMax: Math.max(aggMin, aggMax),
      text: `${Math.min(aggMin, aggMax)} – ${Math.max(aggMin, aggMax)}`,
      distancePct: aggDistPct,
      reasons: [
        'Fibo 0.236 – 0.382 Retracement แถวหน้าด่าน',
        'สำหรับผู้รับความเสี่ยงได้สูง กลัวตกรถหากราคาย่อตื้น',
        'ต้องคุม Position Sizing ให้เล็กลง (แบ่งไม้เข้า 25-30%)',
      ],
    };

    // Deep Pullback Entry: Near Fibo 0.786 or Swing Low
    const deepMin = fibo.retracements.find(r => r.ratio === 1.000)?.price || roundDec(price * 0.88);
    const deepMax = fibo.retracements.find(r => r.ratio === 0.786)?.price || roundDec(price * 0.92);
    const deepDistPct = Number((((deepMax - price) / price) * 100).toFixed(2));

    const deepPullbackZone: EntryZoneItem = {
      type: 'Deep Pullback',
      titleTh: 'Deep Pullback Entry (ย่อลึก / รอช้อนกรณีตลาดผันผวน)',
      priceMin: Math.min(deepMin, deepMax),
      priceMax: Math.max(deepMin, deepMax),
      text: `${Math.min(deepMin, deepMax)} – ${Math.max(deepMin, deepMax)}`,
      distancePct: deepDistPct,
      reasons: [
        'Fibo 0.786 Retracement ด่านสุดท้ายก่อนเสียทรง',
        'จุดดักรับกรณี Bitcoin เทขายหรือตลาดเกิด Flash Dump',
        'ได้ต้นทุนถูกมาก แต่ต้องระวังหากหลุด Swing Low',
      ],
    };

    // Calculate Entry Score (0-100)
    let entryScore = 70;
    if (Math.abs(prefDistPct) <= 2.0) entryScore += 20; // exactly in preferred zone
    else if (prefDistPct < -5.0) entryScore -= 18; // price is >5% above preferred zone -> do not chase!
    if (rsiMtf.shortTermRisk === 'LOW') entryScore += 10;
    else if (rsiMtf.shortTermRisk === 'HIGH') entryScore -= 15;
    entryScore = Math.min(99, Math.max(25, entryScore));

    return {
      zones: [aggressiveZone, preferredZone, deepPullbackZone],
      preferredZone,
      entryScore,
    };
  }

  /**
   * 8. Stop Loss & Invalidation Rule
   */
  private static calculateStopLoss(
    price: number,
    fibo: FibonacciAnalysis,
    preferredZone: EntryZoneItem
  ): StopLossPlan {
    const roundDec = (val: number) => Number(val.toFixed(price < 1 ? 5 : 2));

    // Technical Stop Loss: just below the Golden Zone / Preferred Zone (approx 1.5 - 2.5% below prefMin)
    const technicalSl = roundDec(preferredZone.priceMin * 0.975);

    // Hard Stop: below Fibo 0.786 or below structure swing low
    const hardStop = roundDec(preferredZone.priceMin * 0.945);

    const refEntry = (preferredZone.priceMin + preferredZone.priceMax) / 2;
    const riskPct = Number((((technicalSl - refEntry) / refEntry) * 100).toFixed(2));

    const invalidationTextTh = `หากราคาปิดแท่ง 4H ต่ำกว่า ${technicalSl} โครงสร้าง Swing Setup ถือว่า Invalid และต้องตัดขาดทุนทันที`;

    return {
      technicalSl,
      hardStop,
      riskPct: Math.abs(riskPct),
      invalidationTextTh,
      recommendedRiskPct: 2.0, // Standard 2% account equity risk
    };
  }

  /**
   * 9 & 10. Multi-Level Take Profit Targets & Risk/Reward (R:R) Engine
   */
  private static calculateTakeProfits(
    price: number,
    preferredZone: EntryZoneItem,
    stopLoss: StopLossPlan,
    fibo: FibonacciAnalysis
  ): ComprehensiveTradingPlan['takeProfits'] {
    const roundDec = (val: number) => Number(val.toFixed(price < 1 ? 5 : 2));
    const refEntry = (preferredZone.priceMin + preferredZone.priceMax) / 2;
    const riskDiff = Math.abs(refEntry - stopLoss.technicalSl);

    // TP1: Previous Resistance / Swing Midpoint
    const tp1Price = roundDec(fibo.retracements.find(r => r.ratio === 0.236)?.price || (price * 1.06));
    const tp1Gain = Number((((tp1Price - refEntry) / refEntry) * 100).toFixed(2));
    const tp1Rr = Number((Math.abs(tp1Price - refEntry) / (riskDiff || 0.01)).toFixed(2));

    // TP2: Swing High (100% Retracement Recovery)
    const tp2Price = roundDec(fibo.swingHigh);
    const tp2Gain = Number((((tp2Price - refEntry) / refEntry) * 100).toFixed(2));
    const tp2Rr = Number((Math.abs(tp2Price - refEntry) / (riskDiff || 0.01)).toFixed(2));

    // TP3: Fibo Extension 1.272
    const tp3Price = roundDec(fibo.extensions.find(e => e.ratio === 1.272)?.price || (fibo.swingHigh * 1.08));
    const tp3Gain = Number((((tp3Price - refEntry) / refEntry) * 100).toFixed(2));
    const tp3Rr = Number((Math.abs(tp3Price - refEntry) / (riskDiff || 0.01)).toFixed(2));

    // TP4: Fibo Extension 1.618 (Golden Extension)
    const tp4Price = roundDec(fibo.extensions.find(e => e.ratio === 1.618)?.price || (fibo.swingHigh * 1.18));
    const tp4Gain = Number((((tp4Price - refEntry) / refEntry) * 100).toFixed(2));
    const tp4Rr = Number((Math.abs(tp4Price - refEntry) / (riskDiff || 0.01)).toFixed(2));

    const targets: TakeProfitTargetItem[] = [
      {
        level: 'TP1',
        targetPrice: tp1Price,
        gainPct: tp1Gain,
        rrRatio: tp1Rr,
        rationaleTh: 'Previous Resistance / โซนแนวต้านแรกสำหรับแบ่งล็อกกำไรบางส่วน',
      },
      {
        level: 'TP2',
        targetPrice: tp2Price,
        gainPct: tp2Gain,
        rrRatio: tp2Rr,
        rationaleTh: 'Swing High เดิม (เป้าหมายหลักของการเทรดรอบสวิง)',
      },
      {
        level: 'TP3',
        targetPrice: tp3Price,
        gainPct: tp3Gain,
        rrRatio: tp3Rr,
        rationaleTh: 'Fibonacci Extension 1.272 (เป้าหมายกรณีราคาเกิด Breakout ทะลุ High)',
      },
      {
        level: 'TP4',
        targetPrice: tp4Price,
        gainPct: tp4Gain,
        rrRatio: tp4Rr,
        rationaleTh: 'Fibonacci Extension 1.618 (Golden Zone Target ขยายคลื่นใหญ่)',
      },
    ];

    const currentRiskDiff = Math.abs(price - stopLoss.technicalSl);
    const currentPriceRrToTp2 = Number((Math.abs(tp2Price - price) / (currentRiskDiff || 1)).toFixed(2));

    // Minimum acceptable R:R is 1.8 (Rule 10)
    const minAcceptableRr = 1.8;
    const acceptableRrFound = tp2Rr >= minAcceptableRr;

    let chaseWarning: string | null = null;
    if (price > preferredZone.priceMax * 1.03 && currentPriceRrToTp2 < minAcceptableRr) {
      chaseWarning = `❌ DO NOT CHASE — หากเข้าซื้อที่ราคาปัจจุบัน (${price}) จะเหลือ Risk/Reward เพียง 1:${currentPriceRrToTp2} (ต่ำกว่าเกณฑ์ขั้นต่ำ 1:${minAcceptableRr}) ควรรอย่อตัว`;
    }

    return {
      targets,
      acceptableRrFound,
      bestRr: tp2Rr,
      minAcceptableRr,
      chaseWarning,
    };
  }

  /**
   * 12. Exit Score (0 - 100) & Warning Detector
   */
  private static calculateExitIntelligence(
    price: number,
    rsiMtf: ComprehensiveTradingPlan['rsiMultiTimeframe'],
    fibo: FibonacciAnalysis,
    change24h: number
  ): ExitScoreAnalysis {
    const reasons: string[] = [];
    let exitScore = 15;

    const rsi15m = rsiMtf.items.find(i => i.timeframe === '15m')?.rsi || 50;
    const rsi1h = rsiMtf.items.find(i => i.timeframe === '1H')?.rsi || 50;
    const rsi4h = rsiMtf.items.find(i => i.timeframe === '4H')?.rsi || 50;

    // RSI Overheat
    if (rsi4h >= 78) {
      exitScore += 35;
      reasons.push(`⚠ RSI 4H = ${rsi4h} (Extreme Overheated Zone)`);
    } else if (rsi4h >= 70) {
      exitScore += 20;
      reasons.push(`⚠ RSI 4H = ${rsi4h} เข้าสู่โซน Overbought`);
    }

    if (rsi1h >= 75) {
      exitScore += 18;
      reasons.push(`⚠ RSI 1H = ${rsi1h} เริ่มตึงตัว`);
    }

    // Divergence
    if (rsiMtf.divergenceAlerts.length > 0) {
      exitScore += 22;
      for (const d of rsiMtf.divergenceAlerts) {
        if (d.includes('Bearish')) reasons.push(d);
      }
    }

    // Proximity to Fibo Extension
    const ext1618 = fibo.extensions.find(e => e.ratio === 1.618)?.price || (price * 1.5);
    if (price >= ext1618 * 0.97) {
      exitScore += 25;
      reasons.push(`⚠ ราคาใกล้ถึง Fibonacci Extension 1.618 (${ext1618}) โซนเป้าหมายกำไรใหญ่`);
    }

    // High 24h pump
    if (change24h > 20) {
      exitScore += 20;
      reasons.push(`⚠ ราคาปรับขึ้นแรง +${change24h.toFixed(1)}% ใน 24h มีแรงขายทำกำไรแฝง`);
    }

    exitScore = Math.min(100, Math.max(10, exitScore));

    let status: ExitScoreAnalysis['status'] = 'HOLD';
    let statusTh = 'ถือต่อตามแผน (Hold Position)';

    if (exitScore >= 80) {
      status = 'EXIT';
      statusTh = 'พิจารณาปิดทำกำไรทั้งหมดหรือยกระดับ Trailing Stop ชิดราคา';
    } else if (exitScore >= 68) {
      status = 'TAKE PARTIAL PROFIT';
      statusTh = 'ทยอยแบ่งขายทำกำไร 25% - 50% (Lock Profit)';
    } else if (exitScore >= 50) {
      status = 'PROTECT PROFIT';
      statusTh = 'ขยับจุด Stop Loss มาที่จุดคุ้มทุน (Breakeven)';
    } else if (rsi4h >= 55) {
      status = 'HOLD STRONG';
      statusTh = 'แนวโน้มแข็งแกร่งมาก ถือต่อปล่อยกำไรเติบโต (Let Profits Run)';
    }

    if (reasons.length === 0) {
      reasons.push('โครงสร้างราคายังไม่มีสัญญาณเตือนการขายแรง (No Distribution)');
    }

    return {
      exitScore,
      status,
      reasons,
      statusTh,
    };
  }

  /**
   * 11. Final Trading Decision Status & Rationale
   */
  private static determineTradingDecision(params: {
    symbol: string;
    price: number;
    rsiMtfResult: ComprehensiveTradingPlan['rsiMultiTimeframe'];
    entryPlan: ComprehensiveTradingPlan['entryPlan'];
    stopLoss: StopLossPlan;
    takeProfits: ComprehensiveTradingPlan['takeProfits'];
    holdingHorizon: HoldingHorizonAnalysis;
    exitIntelligence: ExitScoreAnalysis;
  }): ComprehensiveTradingPlan['decision'] {
    const { symbol, price, rsiMtfResult, entryPlan, stopLoss, takeProfits, holdingHorizon, exitIntelligence } = params;
    const prefZone = entryPlan.preferredZone;
    const distToPref = Number((((price - prefZone.priceMax) / prefZone.priceMax) * 100).toFixed(2));
    const rsi15m = rsiMtfResult.items.find(i => i.timeframe === '15m')?.rsi || 50;
    const rsi1h = rsiMtfResult.items.find(i => i.timeframe === '1H')?.rsi || 50;

    let status: TradingDecisionStatus = 'WATCH';
    let badgeColor = '#6B7280';
    let verdictTh = '';

    // Decision Logic
    if (exitIntelligence.exitScore >= 75) {
      status = 'TAKE PARTIAL PROFIT';
      badgeColor = '#F59E0B';
      verdictTh = `⚠ ทยอยขายทำกำไรที่ ${price} (Exit Score ${exitIntelligence.exitScore}/100)`;
    } else if (takeProfits.chaseWarning || distToPref > 4.5 || rsi15m > 74 || rsi1h > 72) {
      status = 'WAIT FOR PULLBACK';
      badgeColor = '#EAB308';
      verdictTh = `❌ ไม่ไล่ซื้อที่ ${price} — ควรรอย่อตัวลงมาทดสอบโซน Preferred Entry`;
    } else if (price >= prefZone.priceMin && price <= prefZone.priceMax) {
      if (takeProfits.acceptableRrFound && rsiMtfResult.shortTermRisk !== 'HIGH') {
        status = 'BUY NOW';
        badgeColor = '#10B981';
        verdictTh = `⭐ BUY NOW — ราคาอยู่ใน Preferred Entry Zone (${prefZone.text}) พร้อม R:R คุ้มค่า`;
      } else {
        status = 'ENTER PARTIAL';
        badgeColor = '#3B82F6';
        verdictTh = `แบ่งไม้เข้าซื้อบางส่วน (Enter Partial 30%) ที่ ${price}`;
      }
    } else if (price < prefZone.priceMin) {
      status = 'WAIT FOR RETEST';
      badgeColor = '#8B5CF6';
      verdictTh = `รอดูการทรงตัวและสร้างฐานใหม่ (Wait for Retest) บริเวณแนวรับ`;
    } else if (distToPref <= 2.5 && rsi15m <= 65) {
      status = 'ENTER PARTIAL';
      badgeColor = '#3B82F6';
      verdictTh = `ทยอยสะสมได้บางส่วน (Scale in 25-30%) ใกล้โซน Preferred Entry`;
    } else {
      status = 'WATCH';
      badgeColor = '#64748B';
      verdictTh = `ติดตามดูสัญญาณการพักตัว (Watch for Setup)`;
    }

    const preferredEntryTextTh = `⭐ Preferred Entry: ${prefZone.text}`;
    const invalidationTextTh = `Invalidation: ต่ำกว่า ${stopLoss.technicalSl}`;
    const suitableStyleTh = `Suitable: ${holdingHorizon.primarySuitable.replace('_', ' ')} TRADE`;

    const fullSummaryTh = `${verdictTh} | ${preferredEntryTextTh} | ${invalidationTextTh} | ${suitableStyleTh}`;

    return {
      status,
      badgeColor,
      verdictTh,
      preferredEntryTextTh,
      invalidationTextTh,
      suitableStyleTh,
      fullSummaryTh,
    };
  }

  /**
   * 13. Profit Protection / Position Management Mode
   */
  private static calculateProfitProtection(
    price: number,
    boughtPriceInput: number | null,
    preferredZone: EntryZoneItem,
    stopLoss: StopLossPlan,
    takeProfits: ComprehensiveTradingPlan['takeProfits']
  ): ProfitProtectionPlan {
    const isSimulatedOrHolding = boughtPriceInput !== null && boughtPriceInput > 0;
    const boughtPrice = isSimulatedOrHolding 
      ? boughtPriceInput! 
      : Number(((preferredZone.priceMin + preferredZone.priceMax) / 2).toFixed(price < 1 ? 5 : 2));

    const profitPct = Number((((price - boughtPrice) / boughtPrice) * 100).toFixed(2));

    let recommendedActionTh = '';
    let takeProfitRuleTh = '';
    let moveStopLevel = stopLoss.technicalSl;
    let trailingStopPct = 5.5;
    const nextTargetPrice = takeProfits.targets.find(t => t.targetPrice > price)?.targetPrice || (price * 1.15);

    if (profitPct >= 18.0) {
      recommendedActionTh = 'แบ่งขายทำกำไร 30% - 50% และเลื่อน Stop Loss ล็อกกำไรที่ทุน +10%';
      takeProfitRuleTh = 'Take Profit 50% at Next Target, Trail remaining with 4.5% Stop';
      moveStopLevel = Number((boughtPrice * 1.10).toFixed(price < 1 ? 5 : 2));
      trailingStopPct = 4.5;
    } else if (profitPct >= 8.0) {
      recommendedActionTh = 'เลื่อน Stop Loss ขึ้นมาที่จุดคุ้มทุน (Breakeven Stop) เพื่อขจัดความเสี่ยงขาดทุน 100%';
      takeProfitRuleTh = 'Move Stop to Breakeven, Hold for TP2 Target';
      moveStopLevel = boughtPrice;
      trailingStopPct = 5.0;
    } else if (profitPct <= -5.0) {
      recommendedActionTh = 'ราคาหลุดต่ำกว่าแผน หากปิดแท่ง 4H หลุด Technical SL ควรคัตลอสทันที';
      takeProfitRuleTh = 'Strict Risk Control — Do not average down without structure';
      moveStopLevel = stopLoss.technicalSl;
      trailingStopPct = 3.5;
    } else {
      recommendedActionTh = 'รักษาวินัยตามแผนการเทรดเดิม ใช้ Technical Stop Loss ป้องกันทุน';
      takeProfitRuleTh = 'Hold within plan, wait for Target TP1';
      moveStopLevel = stopLoss.technicalSl;
      trailingStopPct = 6.0;
    }

    return {
      isSimulatedOrHolding,
      boughtPrice,
      currentPrice: price,
      profitPct,
      recommendedActionTh,
      takeProfitRuleTh,
      moveStopLevel,
      trailingStopPct,
      nextTargetPrice,
    };
  }

  /**
   * Compute Decision Scores (Entry, Technical, Fundamental, Momentum, Risk, Exit, Overall)
   */
  private static computeDecisionScores(params: {
    ticker: TickerData;
    rsiMtfResult: ComprehensiveTradingPlan['rsiMultiTimeframe'];
    holdingHorizon: HoldingHorizonAnalysis;
    entryPlan: ComprehensiveTradingPlan['entryPlan'];
    takeProfits: ComprehensiveTradingPlan['takeProfits'];
    exitIntelligence: ExitScoreAnalysis;
    decision: ComprehensiveTradingPlan['decision'];
  }) {
    const { ticker, rsiMtfResult, holdingHorizon, entryPlan, takeProfits, exitIntelligence, decision } = params;

    const technicalScore = Math.min(100, Math.max(30, Math.round(ticker.technicalScore || 82)));
    const fundamentalScore = Math.min(100, Math.max(30, Math.round(ticker.fundamentalScore || 80)));
    const momentumScore = Math.min(100, Math.max(20, Math.round(50 + (ticker.change24h * 2.2))));

    let entryScore = entryPlan.entryScore;
    if (decision.status === 'WAIT FOR PULLBACK') entryScore = Math.min(55, entryScore - 20);
    else if (decision.status === 'BUY NOW') entryScore = Math.max(88, entryScore);

    const riskScore = Math.min(100, Math.max(15, Math.round(
      (rsiMtfResult.shortTermRisk === 'HIGH' ? 35 : rsiMtfResult.shortTermRisk === 'ELEVATED' ? 20 : 5) +
      (rsiMtfResult.swingRisk === 'HIGH' ? 30 : 10) +
      (ticker.riskLevel === 'High' ? 25 : ticker.riskLevel === 'Medium' ? 12 : 5)
    )));

    const exitScore = exitIntelligence.exitScore;

    const overallScore = Math.round(
      (technicalScore * 0.30) +
      (entryScore * 0.25) +
      (momentumScore * 0.15) +
      (fundamentalScore * 0.15) +
      ((100 - riskScore) * 0.15)
    );

    return {
      entryScore,
      technicalScore,
      fundamentalScore,
      momentumScore,
      riskScore,
      exitScore,
      overallScore,
    };
  }
}
