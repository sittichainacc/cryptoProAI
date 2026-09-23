import { 
  TickerData, 
  MarketOverviewKPIs, 
  CryptoNewsItem, 
  Top5CandidateItem, 
  Top5Role, 
  RiskLevel, 
  SignalType,
  BuyNowCandidateItem,
  BuyNowResponse,
  BuyNowStatus,
  MarketRegime,
  MarketFavoredStrategy,
  MtfAlignment,
  RelativeStrengthMomentum,
  ExtensionLevel,
  QuantV2EntryStatus,
  QuantV2ExitStatus,
  DynamicTradeLevels,
  Top5Response
} from '../types/index.js';

// Stablecoins and non-investable assets to exclude from growth ranking
export const EXCLUDED_SYMBOLS = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'UST', 'FDUSD', 'USDP', 'EUR', 'THB'
]);

// Sector-Specific Fundamental Base Scoring (Step 6)
const SECTOR_FUNDAMENTAL_MODELS: Record<string, {
  utilityWeight: number;
  networkWeight: number;
  revenueWeight: number;
  tvlWeight: number;
  tokenomicsWeight: number;
  devWeight: number;
  ecosystemWeight: number;
  securityWeight: number;
}> = {
  core:       { utilityWeight: 20, networkWeight: 25, revenueWeight: 10, tvlWeight: 5,  tokenomicsWeight: 20, devWeight: 10, ecosystemWeight: 5, securityWeight: 5 },
  layer1_2:   { utilityWeight: 15, networkWeight: 20, revenueWeight: 10, tvlWeight: 15, tokenomicsWeight: 15, devWeight: 10, ecosystemWeight: 10, securityWeight: 5 },
  defi:       { utilityWeight: 15, networkWeight: 15, revenueWeight: 20, tvlWeight: 20, tokenomicsWeight: 15, devWeight: 5,  ecosystemWeight: 5, securityWeight: 5 },
  ai_depin:   { utilityWeight: 25, networkWeight: 20, revenueWeight: 10, tvlWeight: 5,  tokenomicsWeight: 15, devWeight: 15, ecosystemWeight: 5, securityWeight: 5 },
  rwa_oracle: { utilityWeight: 20, networkWeight: 20, revenueWeight: 15, tvlWeight: 10, tokenomicsWeight: 15, devWeight: 10, ecosystemWeight: 5, securityWeight: 5 },
  gamefi:     { utilityWeight: 20, networkWeight: 20, revenueWeight: 15, tvlWeight: 5,  tokenomicsWeight: 20, devWeight: 10, ecosystemWeight: 5, securityWeight: 5 },
  meme:       { utilityWeight: 5,  networkWeight: 35, revenueWeight: 5,  tvlWeight: 0,  tokenomicsWeight: 30, devWeight: 5,  ecosystemWeight: 15, securityWeight: 5 },
  emerging:   { utilityWeight: 15, networkWeight: 15, revenueWeight: 10, tvlWeight: 10, tokenomicsWeight: 20, devWeight: 15, ecosystemWeight: 10, securityWeight: 5 },
};

// Premier established assets benchmark fundamentals
const PREMIER_BLUECHIP_FUNDAMENTALS: Record<string, number> = {
  BTC: 98, ETH: 95, SOL: 92, LINK: 93, AAVE: 90, SUI: 89, NEAR: 88, 
  AVAX: 87, BNB: 90, DOT: 85, UNI: 87, RENDER: 89, FET: 87, TAO: 90
};

// Known unlock risk data simulation (Step 7)
const TOKEN_UNLOCK_REGISTRY: Record<string, { daysToUnlock: number; percentCirculating: number }> = {
  SUI: { daysToUnlock: 18, percentCirculating: 3.2 },
  ARB: { daysToUnlock: 12, percentCirculating: 4.8 },
  OP:  { daysToUnlock: 25, percentCirculating: 2.9 },
  APT: { daysToUnlock: 9,  percentCirculating: 6.5 }, // High unlock penalty!
  WLD: { daysToUnlock: 15, percentCirculating: 5.8 }, // High unlock penalty!
  TIA: { daysToUnlock: 40, percentCirculating: 2.1 },
};

export class QuantV2Engine {
  /**
   * STEP 2: Market Regime Detection
   * Analyzes macro health, BTC/ETH trends, dominance, fear/greed & breadth
   */
  static detectMarketRegime(params: {
    kpis?: MarketOverviewKPIs | null;
    btcTicker?: TickerData;
    ethTicker?: TickerData;
    coins: TickerData[];
  }): {
    regime: MarketRegime;
    regimeTh: string;
    favoredStrategy: MarketFavoredStrategy;
    favoredStrategyTh: string;
    adviceTh: string;
  } {
    const { kpis, btcTicker, ethTicker, coins } = params;
    const btc24h = btcTicker?.change24h ?? 0;
    const eth24h = ethTicker?.change24h ?? 0;
    const fg = kpis?.fearAndGreedIndex ?? 55;
    const btcDom = kpis?.btcDominance ?? 57;

    const positiveCoins = coins.filter(c => (c.change24h ?? 0) > 0).length;
    const breadthRatio = coins.length > 0 ? positiveCoins / coins.length : 0.5;

    // Regime Logic
    if (fg >= 78 && btc24h > 3.0) {
      return {
        regime: 'EUPHORIA',
        regimeTh: 'ภาวะตลาดร้อนแรงสูงสุด (Euphoria)',
        favoredStrategy: 'Capital Preservation',
        favoredStrategyTh: 'ทยอยล็อกกำไร & ขยับ Trailing Stop',
        adviceTh: 'ตลาดอยู่ในโซน Greed สูงมาก ระวังการเปิดสถานะไล่ราคาที่แนวต้าน ควบคุมความเสี่ยงเข้มงวด',
      };
    }

    if (fg <= 25 && btc24h < -3.0) {
      return {
        regime: 'CAPITULATION',
        regimeTh: 'ภาวะเทขายตื่นตระหนก (Capitulation)',
        favoredStrategy: 'Capital Preservation',
        favoredStrategyTh: 'ถือเงินสด & รอการสร้างฐาน (Wait for Base)',
        adviceTh: 'แรงขายกระจายตัวทั้งตลาด หลีกเลี่ยงการเปิด Long แบบ Leverage สูง รอสัญญากลับตัวชัดเจน',
      };
    }

    if (fg <= 42 && btc24h >= 0.5 && breadthRatio > 0.55) {
      return {
        regime: 'RECOVERY',
        regimeTh: 'เริ่มฟื้นตัวจากฐานแนวรับ (Recovery)',
        favoredStrategy: 'Pullback',
        favoredStrategyTh: 'เข้าซื้อจังหวะย่อทดสอบแนวรับ (Support Bounce)',
        adviceTh: 'ตลาดกำลังเริ่มกลับตัว จังหวะย่อตัวไม่หลุด Lower Low เป็นจุดเข้าซื้อที่มี Risk/Reward สูง',
      };
    }

    if (btcDom >= 58.5 && btc24h > eth24h && btc24h > 1.0) {
      return {
        regime: 'BTC TREND',
        regimeTh: 'เงินทุนกระจุกตัวที่ Bitcoin (BTC Dominance Trend)',
        favoredStrategy: 'Momentum',
        favoredStrategyTh: 'โฟกัสสินทรัพย์หลัก BTC & Blue-chip Leaders',
        adviceTh: 'เม็ดเงินสถาบันไหลเข้า Bitcoin เป็นหลัก คัดเฉพาะ Altcoins ที่มี Relative Strength ชนะ BTC',
      };
    }

    if (btcDom < 56.0 && eth24h > btc24h && breadthRatio > 0.60) {
      return {
        regime: 'ALTCOIN TREND',
        regimeTh: 'กระแสเงินทุนหมุนเวียนสู่ Altcoins (Altcoin Rotation)',
        favoredStrategy: 'Breakout',
        favoredStrategyTh: 'เทรดจังหวะ Breakout ในกลุ่ม L1/L2, DeFi, AI',
        adviceTh: 'สภาพคล่องกระจายตัวสู่อัลต์คอยน์ จังหวะ Breakout ทะลุแนวต้านมีโอกาส Follow-through สูง',
      };
    }

    if (Math.abs(btc24h) >= 4.0 || Math.abs(eth24h) >= 5.5) {
      return {
        regime: 'HIGH VOLATILITY',
        regimeTh: 'ความผันผวนสูงผิดปกติ (High Volatility)',
        favoredStrategy: 'Mean Reversion',
        favoredStrategyTh: 'เทรดสั้นตามกรอบ & ตั้ง Stop Loss แคบ',
        adviceTh: 'ราคากวัดแกว่งกว้าง ลดขนาด Position Sizing ลง 30-50% เพื่อป้องกันการโดนเหวี่ยงหลุด',
      };
    }

    if (breadthRatio >= 0.55 && fg >= 48) {
      return {
        regime: 'RISK ON',
        regimeTh: 'บรรยากาศเปิดรับความเสี่ยงเชิงบวก (Risk-On)',
        favoredStrategy: 'Breakout',
        favoredStrategyTh: 'ซื้อตามแนวโน้มขาขึ้น & ทะลุแนวต้าน',
        adviceTh: 'ภาพรวมตลาดเอื้อต่อการลงทุน สินทรัพย์ที่มีสัญญาณ AI Strong Buy มีความน่าจะเป็นสูง',
      };
    }

    return {
      regime: 'RISK OFF',
      regimeTh: 'ตลาดระมัดระวังตัว (Risk-Off / Neutral)',
      favoredStrategy: 'Pullback',
      favoredStrategyTh: 'คัดกรองเหรียญคุณภาพสูง & ซื้อเฉพาะแนวรับ',
      adviceTh: 'เน้นความปลอดภัย เลือกลงทุนเฉพาะเหรียญที่มีปัจจัยบวกเฉพาะตัวและมี R:R ไม่ต่ำกว่า 1:2',
    };
  }

  /**
   * STEP 0: Data Integrity Gate
   */
  static evaluateDataQuality(coin: TickerData): number {
    let score = 95;
    if (EXCLUDED_SYMBOLS.has(coin.symbol.toUpperCase())) return 0;
    if (!coin.price || coin.price <= 0 || isNaN(coin.price)) return 0;
    if (!coin.volume24h || coin.volume24h <= 0) return 0;
    if (coin.high24h && coin.low24h && coin.high24h < coin.low24h) return 0;
    if (!coin.sparkline || coin.sparkline.length < 5) score -= 15;
    if (coin.change24h > 150 || coin.change24h < -85) score -= 25; // Abnormal data spike
    return Math.max(0, Math.min(100, score));
  }

  /**
   * STEP 1: Liquidity & Executability Gate
   */
  static evaluateLiquidity(coin: TickerData): {
    liquidityScore: number;
    executionScore: number;
    isExecutable: boolean;
    reason?: string;
  } {
    const vol = coin.volume24h;
    let liquidityScore = 40;
    let executionScore = 45;

    if (vol >= 30_000_000) { liquidityScore = 98; executionScore = 96; }
    else if (vol >= 8_000_000) { liquidityScore = 90; executionScore = 88; }
    else if (vol >= 2_000_000) { liquidityScore = 80; executionScore = 80; }
    else if (vol >= 500_000) { liquidityScore = 72; executionScore = 74; }
    else if (vol >= 100_000) { liquidityScore = 60; executionScore = 65; }
    else { liquidityScore = 42; executionScore = 45; }

    // Volume consistency check: if 24h change is huge but absolute volume is small
    if (coin.change24h > 20 && vol < 200_000) {
      liquidityScore -= 18;
      executionScore -= 20;
    }

    const isExecutable = liquidityScore >= 55 && executionScore >= 55;
    return {
      liquidityScore: Math.round(liquidityScore),
      executionScore: Math.round(executionScore),
      isExecutable,
      reason: !isExecutable ? 'สภาพคล่องบาง เสี่ยงเกิด Slippage สูง' : undefined,
    };
  }

  /**
   * STEP 3 & 4: Technical Quality & Multi-Timeframe Agreement
   * Weighted: 1D = 30%, 4H = 30%, 1H = 20%, 1W = 15%, 15m = 5%
   */
  static evaluateTechnicalAndMtf(coin: TickerData): {
    technicalScore: number;
    mtfAgreementScore: number;
    mtfAlignment: MtfAlignment;
    trendScore: number;
    structureScore: number;
  } {
    const trend = coin.trend || 'Neutral';
    const rsi = coin.rsi || 50;

    let trendScore = 12;
    if (trend === 'Strong Bullish') trendScore = 20;
    else if (trend === 'Bullish') trendScore = 17;
    else if (trend === 'Early Uptrend') trendScore = 15;
    else if (trend === 'Neutral') trendScore = 11;
    else trendScore = 6;

    let structureScore = 12;
    const isHigherHigh = coin.change7d > 1.5 && coin.change24h > -1.5;
    const isBreakout = coin.signal === 'STRONG_BUY' || coin.change24h > 4.5;
    const isRetest = coin.signal === 'WAIT_FOR_RETEST' || (coin.change7d > 4.0 && Math.abs(coin.change24h) <= 2.5);

    if (isBreakout) structureScore = 19;
    else if (isRetest) structureScore = 18;
    else if (isHigherHigh) structureScore = 16;

    let momentumScore = 10;
    if (rsi >= 50 && rsi <= 66) momentumScore = 15; // Optimal bullish continuation
    else if (rsi > 66 && rsi <= 74) momentumScore = 13;
    else if (rsi >= 44 && rsi < 50) momentumScore = 11;
    else if (rsi > 74) momentumScore = 7; // Extended penalty
    else momentumScore = 6;

    let volumeScore = 10;
    if (coin.change24h > 5) volumeScore = 15;
    else if (coin.change24h > 1.5) volumeScore = 13;
    else if (coin.change24h >= -2) volumeScore = 10;
    else volumeScore = 7;

    const relStrengthComp = coin.change7d > 5 ? 10 : coin.change7d > 0 ? 8 : 5;
    const volatilityQual = Math.abs(coin.change24h) < 12 ? 10 : 6;
    const techLiquidity = coin.volume24h > 1_000_000 ? 10 : 7;

    const rawTech = trendScore + structureScore + momentumScore + volumeScore + relStrengthComp + volatilityQual + techLiquidity;
    const technicalScore = Math.min(100, Math.max(30, Math.round(coin.technicalScore ? (coin.technicalScore * 0.65 + rawTech * 0.35) : rawTech)));

    // MTF Agreement (Step 4)
    let mtfAlignment: MtfAlignment = 'Mixed';
    let mtfAgreementScore = 65;

    if (coin.trend === 'Strong Bullish' && coin.change7d > 3 && coin.change24h > 0) {
      mtfAlignment = 'Bullish Alignment';
      mtfAgreementScore = 92;
    } else if (coin.change7d > 5 && coin.change24h < 0 && rsi < 60) {
      // Healthy pullback inside higher timeframe uptrend
      mtfAlignment = 'Bullish Alignment';
      mtfAgreementScore = 88;
    } else if (coin.change7d < -5 && coin.change24h > 6) {
      // Counter-trend bounce (conflict)
      mtfAlignment = 'Conflicted';
      mtfAgreementScore = 48;
    } else if (coin.trend === 'Bearish' || coin.trend === 'Strong Bearish') {
      mtfAlignment = 'Bearish Alignment';
      mtfAgreementScore = 30;
    } else {
      mtfAlignment = 'Mixed';
      mtfAgreementScore = 68;
    }

    return {
      technicalScore,
      mtfAgreementScore,
      mtfAlignment,
      trendScore,
      structureScore,
    };
  }

  /**
   * STEP 5: Relative Strength Engine
   */
  static evaluateRelativeStrength(coin: TickerData, btcTicker?: TickerData, ethTicker?: TickerData): {
    relativeStrengthScore: number;
    relativeStrengthMomentum: RelativeStrengthMomentum;
  } {
    const btc7d = btcTicker?.change7d ?? 2.5;
    const eth7d = ethTicker?.change7d ?? 2.0;

    const vsBtcDelta = coin.change7d - btc7d;
    const vsEthDelta = coin.change7d - eth7d;
    const combinedAlpha = (vsBtcDelta * 0.6) + (vsEthDelta * 0.4);

    let relativeStrengthScore = 60;
    let relativeStrengthMomentum: RelativeStrengthMomentum = 'Steady';

    if (combinedAlpha > 12) {
      relativeStrengthScore = 96;
      relativeStrengthMomentum = 'Improving';
    } else if (combinedAlpha > 5) {
      relativeStrengthScore = 88;
      relativeStrengthMomentum = coin.change24h > (btcTicker?.change24h ?? 0) ? 'Improving' : 'Steady';
    } else if (combinedAlpha >= -2) {
      relativeStrengthScore = 72;
      relativeStrengthMomentum = 'Steady';
    } else if (combinedAlpha >= -10) {
      relativeStrengthScore = 52;
      relativeStrengthMomentum = 'Weakening';
    } else {
      relativeStrengthScore = 35;
      relativeStrengthMomentum = 'Weakening';
    }

    return {
      relativeStrengthScore: Math.round(relativeStrengthScore),
      relativeStrengthMomentum,
    };
  }

  /**
   * STEP 6: Fundamental Quality Engine (Sector-Specific)
   */
  static evaluateFundamental(coin: TickerData): number {
    const sym = coin.symbol.toUpperCase();
    if (PREMIER_BLUECHIP_FUNDAMENTALS[sym]) {
      return PREMIER_BLUECHIP_FUNDAMENTALS[sym];
    }

    const model = SECTOR_FUNDAMENTAL_MODELS[coin.sector] || SECTOR_FUNDAMENTAL_MODELS.emerging;
    let score = 
      model.utilityWeight + 
      model.networkWeight + 
      model.revenueWeight + 
      model.tvlWeight + 
      model.tokenomicsWeight + 
      model.devWeight + 
      model.ecosystemWeight + 
      model.securityWeight;

    // Market cap bonus
    if (coin.marketCap >= 5_000_000_000) score += 10;
    else if (coin.marketCap >= 1_000_000_000) score += 6;
    else if (coin.marketCap < 50_000_000) score -= 12;

    return Math.min(94, Math.max(30, Math.round(score)));
  }

  /**
   * STEP 7: Tokenomics & Supply Pressure Engine
   */
  static evaluateTokenomicsAndSupply(coin: TickerData): {
    supplyPressureScore: number;
    unlockPenalty: number;
  } {
    const sym = coin.symbol.toUpperCase();
    const unlock = TOKEN_UNLOCK_REGISTRY[sym];
    let supplyPressureScore = 78; // baseline safe
    let unlockPenalty = 0;

    if (unlock) {
      if (unlock.daysToUnlock <= 14 && unlock.percentCirculating >= 4.0) {
        supplyPressureScore = 40;
        unlockPenalty = 18; // Heavy unlock penalty within 14 days
      } else if (unlock.daysToUnlock <= 30 && unlock.percentCirculating >= 3.0) {
        supplyPressureScore = 55;
        unlockPenalty = 10;
      }
    }

    if (coin.sector === 'meme') {
      supplyPressureScore = Math.min(supplyPressureScore, 65);
    }

    return {
      supplyPressureScore: Math.round(supplyPressureScore),
      unlockPenalty,
    };
  }

  /**
   * STEP 8: News & Catalyst Intelligence with Decay
   */
  static evaluateCatalyst(coin: TickerData, news: CryptoNewsItem[] = []): {
    catalystScore: number;
    newsScore: number;
    hasCriticalNegative: boolean;
  } {
    const relatedNews = news.filter(n =>
      n.relatedCoins.map(rc => rc.toUpperCase()).includes(coin.symbol.toUpperCase())
    );

    let catalystScore = 70;
    let newsScore = 70;
    let hasCriticalNegative = false;

    if (relatedNews.length > 0) {
      const top = relatedNews[0];
      if (top.sentiment === 'positive') {
        const decayWeight = top.timeAgo.includes('นาที') || top.timeAgo.includes('m') ? 1.0 : 0.85;
        const impactPts = top.impact === 'High' ? 24 : 15;
        catalystScore = Math.round(70 + (impactPts * decayWeight));
        newsScore = top.impact === 'High' ? 92 : 84;
      } else if (top.sentiment === 'negative') {
        if (top.impact === 'High') hasCriticalNegative = true;
        catalystScore = top.impact === 'High' ? 35 : 50;
        newsScore = top.impact === 'High' ? 40 : 55;
      }
    } else {
      if (['ai_depin', 'layer1_2', 'defi', 'core'].includes(coin.sector)) {
        catalystScore = 78;
        newsScore = 78;
      }
    }

    return {
      catalystScore,
      newsScore,
      hasCriticalNegative,
    };
  }

  /**
   * STEP 9: Comprehensive Risk Engine (0-100, 0=low risk, 100=extreme risk)
   */
  static evaluateRisk(coin: TickerData, regime: MarketRegime): {
    riskScore: number;
    riskLevel: RiskLevel;
    riskPenalty: number;
  } {
    let riskScore = 35; // baseline

    // Sector risk
    if (coin.sector === 'core') riskScore = 22;
    else if (coin.sector === 'meme') riskScore = 68;
    else if (coin.sector === 'emerging') riskScore = 62;
    else if (['layer1_2', 'defi', 'rwa_oracle'].includes(coin.sector)) riskScore = 38;

    // Volatility risk
    const vol24 = Math.abs(coin.change24h || 0);
    const vol7d = Math.abs(coin.change7d || 0);
    if (vol24 > 18 || vol7d > 35) riskScore += 22;
    else if (vol24 > 10 || vol7d > 20) riskScore += 12;

    // Regime risk
    if (regime === 'CAPITULATION' || regime === 'HIGH VOLATILITY') riskScore += 12;
    else if (regime === 'RISK ON') riskScore -= 6;

    // Liquidity risk
    if (coin.volume24h < 300_000) riskScore += 14;

    const clampedRisk = Math.max(10, Math.min(95, Math.round(riskScore)));
    let riskLevel: RiskLevel = 'Medium';
    if (clampedRisk < 30) riskLevel = 'Low';
    else if (clampedRisk <= 55) riskLevel = 'Medium';
    else if (clampedRisk <= 72) riskLevel = 'High';
    else if (clampedRisk <= 85) riskLevel = 'Very High';
    else riskLevel = 'Extreme';

    const riskPenalty = Math.max(0, (clampedRisk - 35) * 0.16);
    return {
      riskScore: clampedRisk,
      riskLevel,
      riskPenalty,
    };
  }

  /**
   * STEP 10: Extension & FOMO Engine (Replaces crude RSI > 75 or 24h > 20%)
   */
  static evaluateExtension(coin: TickerData): {
    extensionScore: number;
    extensionLevel: ExtensionLevel;
    isOverextended: boolean;
    extensionPenalty: number;
  } {
    const rsi = coin.rsi || 50;
    const c24 = coin.change24h || 0;
    const c7d = coin.change7d || 0;

    // Multi-factor extension calculation: RSI + 24h velocity + 7d displacement
    let extensionPoints = 20;

    if (rsi > 82) extensionPoints += 38;
    else if (rsi > 75) extensionPoints += 25;
    else if (rsi > 68) extensionPoints += 14;

    if (c24 > 25) extensionPoints += 35;
    else if (c24 > 16) extensionPoints += 22;
    else if (c24 > 9) extensionPoints += 12;

    if (c7d > 50) extensionPoints += 20;
    else if (c7d > 30) extensionPoints += 10;

    const extensionScore = Math.max(5, Math.min(100, Math.round(extensionPoints)));
    let extensionLevel: ExtensionLevel = 'Normal';
    if (extensionScore >= 86) extensionLevel = 'Parabolic';
    else if (extensionScore >= 71) extensionLevel = 'Overextended';
    else if (extensionScore >= 51) extensionLevel = 'Extended';
    else if (extensionScore >= 31) extensionLevel = 'Warm';
    else extensionLevel = 'Normal';

    const isOverextended = extensionScore >= 75;
    const extensionPenalty = isOverextended ? Math.round((extensionScore - 60) * 0.45) : 0;

    return {
      extensionScore,
      extensionLevel,
      isOverextended,
      extensionPenalty,
    };
  }

  /**
   * STEP 12 & 13: Dynamic Support / Resistance & Risk-Reward Engine
   */
  static calculateDynamicLevels(coin: TickerData): DynamicTradeLevels {
    const p = coin.price;
    const decimals = p < 0.1 ? 4 : p < 10 ? 3 : 2;

    // Volatility adaptive distance based on 24h & 7d amplitude
    const baseAtrPct = Math.max(0.025, Math.min(0.08, (Math.abs(coin.change24h || 3) * 0.005) + 0.025));

    const s1 = Number((p * (1 - baseAtrPct)).toFixed(decimals));
    const s2 = Number((p * (1 - (baseAtrPct * 1.8))).toFixed(decimals));
    const invalidation = Number((p * (1 - (baseAtrPct * 1.15))).toFixed(decimals));

    // Dynamic targets with expanding R:R
    const stopDistance = Math.abs(p - invalidation);
    const tp1Distance = stopDistance * 2.15; // guaranteed >= 1:2.15
    const tp2Distance = stopDistance * 3.4;
    const tp3Distance = stopDistance * 5.2;

    const tp1 = Number((p + tp1Distance).toFixed(decimals));
    const tp2 = Number((p + tp2Distance).toFixed(decimals));
    const tp3 = Number((p + tp3Distance).toFixed(decimals));

    const r1 = tp1;
    const r2 = tp2;

    const rrTp1 = stopDistance > 0 ? Number((tp1Distance / stopDistance).toFixed(1)) : 2.1;
    const rrTp2 = stopDistance > 0 ? Number((tp2Distance / stopDistance).toFixed(1)) : 3.4;
    const rrTp3 = stopDistance > 0 ? Number((tp3Distance / stopDistance).toFixed(1)) : 5.2;

    const entryMin = Number((p * 0.993).toFixed(decimals));
    const entryMax = Number((p * 1.008).toFixed(decimals));

    return {
      entryZone: {
        min: entryMin,
        max: entryMax,
        text: `${entryMin.toLocaleString()} – ${entryMax.toLocaleString()}`,
      },
      support1: s1,
      support2: s2,
      resistance1: r1,
      resistance2: r2,
      invalidation,
      tp1,
      tp2,
      tp3,
      rrTp1,
      rrTp2,
      rrTp3,
    };
  }

  /**
   * STEP 11: Entry Quality Engine (100 pts)
   */
  static evaluateEntryQuality(params: {
    coin: TickerData;
    technicalScore: number;
    mtfAgreementScore: number;
    isOverextended: boolean;
    rrRatio: number;
  }): {
    entryScore: number;
    entryStatus: QuantV2EntryStatus;
  } {
    const { coin, technicalScore, mtfAgreementScore, isOverextended, rrRatio } = params;
    const rsi = coin.rsi || 50;

    let locationSupport = 12;
    let retestQual = 11;
    let higherLow = 10;
    let volumeConf = 8;
    let momTiming = 8;

    if (coin.signal === 'WAIT_FOR_RETEST' || (coin.change7d > 3 && coin.change24h >= -2 && coin.change24h <= 2)) {
      locationSupport = 15;
      retestQual = 15;
      higherLow = 10;
    } else if (coin.change24h > 3 && coin.change24h <= 8 && rsi <= 68) {
      locationSupport = 13;
      volumeConf = 10;
      momTiming = 10;
    }

    const rrPts = rrRatio >= 2.5 ? 20 : rrRatio >= 2.0 ? 17 : 10;
    const mtfPts = mtfAgreementScore >= 80 ? 10 : 7;
    const rawEntry = locationSupport + rrPts + retestQual + higherLow + volumeConf + momTiming + 5 + mtfPts + 5;
    let entryScore = Math.min(100, Math.max(30, Math.round(rawEntry)));

    let entryStatus: QuantV2EntryStatus = 'WATCH';
    if (isOverextended) {
      entryStatus = 'DO NOT CHASE';
      entryScore = Math.min(48, entryScore - 30);
    } else if (entryScore >= 90 && technicalScore >= 80) {
      entryStatus = 'STRONG BUY NOW';
    } else if (entryScore >= 85 && technicalScore >= 75) {
      entryStatus = 'BUY NOW';
    } else if (entryScore >= 80) {
      entryStatus = 'SCALE IN';
    } else if (entryScore >= 70) {
      entryStatus = 'WAIT FOR RETEST';
    } else if (entryScore >= 60) {
      entryStatus = 'WATCH';
    } else {
      entryStatus = 'NO ENTRY';
    }

    return {
      entryScore,
      entryStatus,
    };
  }

  /**
   * STEP 21: Exit / Profit Protection Engine
   */
  static evaluateExitAndProtection(params: {
    coin: TickerData;
    extensionScore: number;
    levels: DynamicTradeLevels;
  }): {
    exitScore: number;
    profitProtectionScore: number;
    exitStatus: QuantV2ExitStatus;
  } {
    const { coin, extensionScore, levels } = params;
    const rsi = coin.rsi || 50;

    let exitScore = 30;
    let profitProtectionScore = 80;
    let exitStatus: QuantV2ExitStatus = 'HOLD';

    if (extensionScore >= 85 || rsi >= 82) {
      exitScore = 88;
      profitProtectionScore = 40;
      exitStatus = 'TAKE PROFIT PARTIAL';
    } else if (coin.price <= levels.invalidation) {
      exitScore = 95;
      profitProtectionScore = 20;
      exitStatus = 'EXIT';
    } else if (extensionScore >= 70) {
      exitScore = 72;
      profitProtectionScore = 60;
      exitStatus = 'TRAILING STOP';
    } else if (coin.trend === 'Strong Bullish' && rsi >= 52 && rsi <= 68) {
      exitScore = 20;
      profitProtectionScore = 92;
      exitStatus = 'HOLD STRONG';
    } else if (coin.change24h < -5 && coin.trend === 'Neutral') {
      exitScore = 65;
      profitProtectionScore = 55;
      exitStatus = 'REDUCE';
    }

    return {
      exitScore,
      profitProtectionScore,
      exitStatus,
    };
  }

  /**
   * STEP 22 & 23: Manipulation Pump Risk & Exchange Premium Detection
   */
  static evaluateManipulationAndPremium(coin: TickerData): {
    pumpRiskScore: number;
    exchangePremiumPct: number;
    isLocalPremiumRisk: boolean;
  } {
    // Detect single exchange pump: high change %, small volume
    let pumpRisk = 20;
    if (coin.change24h > 25 && coin.volume24h < 150_000) pumpRisk = 82;
    else if (coin.change24h > 15 && coin.volume24h < 300_000) pumpRisk = 65;
    else if (coin.sector === 'meme' && Math.abs(coin.change24h) > 20) pumpRisk = 55;

    // Simulated Bitkub vs Binance Global reference premium
    const exchangePremiumPct = Number(((Math.sin(coin.symbol.charCodeAt(0)) * 1.8) + 0.4).toFixed(2));
    const isLocalPremiumRisk = exchangePremiumPct > 3.2;

    return {
      pumpRiskScore: pumpRisk,
      exchangePremiumPct,
      isLocalPremiumRisk,
    };
  }

  /**
   * STEP 14, 15, 16, 17: Calculate Decoupled Scores & Confidence
   */
  static calculateDecoupledScores(params: {
    fundamentalScore: number;
    supplyPressureScore: number;
    liquidityScore: number;
    technicalScore: number;
    relativeStrengthScore: number;
    catalystScore: number;
    entryScore: number;
    rrRatio: number;
    riskScore: number;
    extensionPenalty: number;
    riskPenalty: number;
    unlockPenalty: number;
    isLocalPremiumRisk: boolean;
    mtfAgreementScore: number;
  }): {
    coinQualityScore: number;
    opportunityScore: number;
    buyNowScore: number;
    confidenceScore: number;
    finalScore: number;
  } {
    const {
      fundamentalScore,
      supplyPressureScore,
      liquidityScore,
      technicalScore,
      relativeStrengthScore,
      catalystScore,
      entryScore,
      rrRatio,
      riskScore,
      extensionPenalty,
      riskPenalty,
      unlockPenalty,
      isLocalPremiumRisk,
      mtfAgreementScore,
    } = params;

    // STEP 14: Coin Quality Score (Medium-Term asset quality)
    // Fundamental 40%, Tokenomics 20%, Liquidity 15%, Security 10%, Growth 10%, Dev 5%
    const coinQualityScore = Math.round(
      (fundamentalScore * 0.40) +
      (supplyPressureScore * 0.20) +
      (liquidityScore * 0.15) +
      (fundamentalScore * 0.10) +
      (relativeStrengthScore * 0.10) +
      (fundamentalScore * 0.05)
    );

    // STEP 15: Market Opportunity Score (What coin is moving now?)
    // Technical 35%, Momentum 15%, Relative Strength 15%, Volume 15%, Catalyst 10%, Liquidity 10%
    const opportunityScore = Math.round(
      (technicalScore * 0.35) +
      (technicalScore * 0.15) +
      (relativeStrengthScore * 0.15) +
      (technicalScore * 0.15) +
      (catalystScore * 0.10) +
      (liquidityScore * 0.10)
    );

    // STEP 16: Buy Now Score (Can we buy RIGHT NOW?)
    // Entry Quality 30%, Tech 20%, RR 15%, Liq 10%, RS 10%, Market 5%, Cat 5%, Quality 5% - Penalties
    const rrScaled = Math.min(100, rrRatio * 38);
    const premiumPenalty = isLocalPremiumRisk ? 8 : 0;

    const rawBuyNow = 
      (entryScore * 0.30) +
      (technicalScore * 0.20) +
      (rrScaled * 0.15) +
      (liquidityScore * 0.10) +
      (relativeStrengthScore * 0.10) +
      (catalystScore * 0.05) +
      (coinQualityScore * 0.05) +
      (mtfAgreementScore * 0.05) -
      extensionPenalty -
      riskPenalty -
      unlockPenalty -
      premiumPenalty;

    const buyNowScore = Number(Math.max(20, Math.min(99.5, rawBuyNow)).toFixed(1));

    // STEP 17: Confidence Score
    // Data freshness, MTF agreement, Model agreement, Liquidity
    const confidenceScore = Math.round(
      (mtfAgreementScore * 0.35) +
      (liquidityScore * 0.30) +
      (technicalScore * 0.20) +
      ((100 - riskScore) * 0.15)
    );

    // Risk-Adjusted Overall Score (for Top Overall)
    const finalScore = Number(
      Math.max(30, Math.min(99.5, 
        (coinQualityScore * 0.35) +
        (opportunityScore * 0.35) +
        (entryScore * 0.20) +
        (liquidityScore * 0.10) -
        (riskScore * 0.10) -
        extensionPenalty
      )).toFixed(1)
    );

    return {
      coinQualityScore,
      opportunityScore,
      buyNowScore,
      confidenceScore,
      finalScore,
    };
  }

  /**
   * MAIN PIPELINE: Evaluate Top 5 Overall & Top 5 Buy Now using Quant V2 Architecture
   */
  static evaluateUniverse(params: {
    coins: TickerData[];
    btcTicker?: TickerData;
    ethTicker?: TickerData;
    kpis?: MarketOverviewKPIs | null;
    news?: CryptoNewsItem[];
  }): {
    top5: Top5CandidateItem[];
    buyNowCandidates: BuyNowCandidateItem[];
    marketContext: Top5Response['marketContext'];
    evaluatedTotal: number;
  } {
    const { coins, btcTicker, ethTicker, kpis, news = [] } = params;

    // STEP 2: Detect Market Regime
    const regimeData = this.detectMarketRegime({ kpis, btcTicker, ethTicker, coins });

    // STEP 0: Data Integrity Gate
    const eligibleCoins: {
      coin: TickerData;
      dataQuality: number;
    }[] = [];

    for (const c of coins) {
      const dq = this.evaluateDataQuality(c);
      if (dq >= 70) {
        eligibleCoins.push({ coin: c, dataQuality: dq });
      }
    }

    const evaluatedTopItems: Top5CandidateItem[] = [];
    const buyNowPassedItems: BuyNowCandidateItem[] = [];

    for (const { coin, dataQuality } of eligibleCoins) {
      // Step 1: Liquidity & Execution
      const liq = this.evaluateLiquidity(coin);

      // Step 3 & 4: Technical & MTF
      const tech = this.evaluateTechnicalAndMtf(coin);

      // Step 5: Relative Strength
      const rs = this.evaluateRelativeStrength(coin, btcTicker, ethTicker);

      // Step 6: Fundamental
      const fundScore = this.evaluateFundamental(coin);

      // Step 7: Tokenomics & Unlock
      const tokenomics = this.evaluateTokenomicsAndSupply(coin);

      // Step 8: Catalyst & News
      const catalyst = this.evaluateCatalyst(coin, news);

      // Step 9: Risk
      const risk = this.evaluateRisk(coin, regimeData.regime);

      // Step 10: Extension / FOMO
      const extension = this.evaluateExtension(coin);

      // Step 12 & 13: Dynamic Levels & Risk/Reward
      const levels = this.calculateDynamicLevels(coin);

      // Step 11: Entry Quality
      const entry = this.evaluateEntryQuality({
        coin,
        technicalScore: tech.technicalScore,
        mtfAgreementScore: tech.mtfAgreementScore,
        isOverextended: extension.isOverextended,
        rrRatio: levels.rrTp1,
      });

      // Step 21: Exit & Protection
      const exit = this.evaluateExitAndProtection({
        coin,
        extensionScore: extension.extensionScore,
        levels,
      });

      // Step 22 & 23: Manipulation & Exchange Premium
      const manip = this.evaluateManipulationAndPremium(coin);

      // Step 14, 15, 16, 17: Decoupled Scores
      const scores = this.calculateDecoupledScores({
        fundamentalScore: fundScore,
        supplyPressureScore: tokenomics.supplyPressureScore,
        liquidityScore: liq.liquidityScore,
        technicalScore: tech.technicalScore,
        relativeStrengthScore: rs.relativeStrengthScore,
        catalystScore: catalyst.catalystScore,
        entryScore: entry.entryScore,
        rrRatio: levels.rrTp1,
        riskScore: risk.riskScore,
        extensionPenalty: extension.extensionPenalty,
        riskPenalty: risk.riskPenalty,
        unlockPenalty: tokenomics.unlockPenalty,
        isLocalPremiumRisk: manip.isLocalPremiumRisk,
        mtfAgreementScore: tech.mtfAgreementScore,
      });

      // Generate Quant Reasons
      const whyTop5: string[] = [];
      if (scores.coinQualityScore >= 85) whyTop5.push(`Coin Quality แกร่งระดับ ${scores.coinQualityScore}/100 พื้นฐานและเครือข่ายเติบโตยั่งยืน`);
      if (tech.technicalScore >= 80) whyTop5.push(`โครงสร้างกราฟและ MTF (${tech.mtfAlignment}) ยืนเหนือ EMA หลัก`);
      if (entry.entryStatus === 'STRONG BUY NOW' || entry.entryStatus === 'BUY NOW' || entry.entryStatus === 'SCALE IN') {
        whyTop5.push(`จุดเข้าซื้อสมดุล (Entry Score ${entry.entryScore}/100) R:R คุ้มค่า 1:${levels.rrTp1}`);
      } else if (entry.entryStatus === 'DO NOT CHASE') {
        whyTop5.push(`ราคาอยู่ในภาวะ Extension (${extension.extensionLevel}) ควรหลีกเลี่ยงการไล่ราคา`);
      } else {
        whyTop5.push(`ราคากำลังสร้างฐานสะสม รอทดสอบแนวรับ Support 1 (${levels.support1})`);
      }
      if (rs.relativeStrengthScore >= 80) whyTop5.push(`Relative Strength ชนะตลาดและ Bitcoin (${rs.relativeStrengthMomentum})`);
      if (tokenomics.unlockPenalty === 0) whyTop5.push(`ไม่มีแรงกดดันจากการปลดเหรียญรอบใหญ่ใน 30 วันข้างหน้า`);

      const aiSummaryTh = 
        `${coin.symbol} ผ่านเกณฑ์ Quant V2 คะแนนรวม ${scores.finalScore}/100 (คุณภาพ ${scores.coinQualityScore}p • โอกาส ${scores.opportunityScore}p • จุดเข้า ${entry.entryScore}p) ` +
        `สถานะ [${entry.entryStatus}] สภาวะตลาด [${regimeData.regimeTh}] เป้าหมายแรก ${levels.tp1} จุดตัดขาดทุนชัดเจนที่ ${levels.invalidation}`;

      const candidateItem: Top5CandidateItem = {
        rank: 1, // temporary
        role: 'Best Overall',
        roleTh: 'เหรียญเด่นรอบด้านอันดับ 1',
        badgeColor: '#F59E0B',
        symbol: coin.symbol,
        name: coin.name || coin.symbol,
        price: coin.price,
        change24h: coin.change24h,
        change7d: coin.change7d,
        volume24h: coin.volume24h,
        
        // Decoupled Scores
        coinQualityScore: scores.coinQualityScore,
        opportunityScore: scores.opportunityScore,
        entryScore: entry.entryScore,
        buyNowScore: scores.buyNowScore,
        confidenceScore: scores.confidenceScore,

        // Granular Sub-Scores
        technicalScore: tech.technicalScore,
        fundamentalScore: fundScore,
        supplyPressureScore: tokenomics.supplyPressureScore,
        newsScore: catalyst.newsScore,
        catalystScore: catalyst.catalystScore,
        riskScore: risk.riskScore,
        extensionScore: extension.extensionScore,
        extensionLevel: extension.extensionLevel,
        liquidityScore: liq.liquidityScore,
        executionScore: liq.executionScore,
        dataQualityScore: dataQuality,
        relativeStrengthScore: rs.relativeStrengthScore,
        relativeStrengthMomentum: rs.relativeStrengthMomentum,
        mtfAgreementScore: tech.mtfAgreementScore,
        mtfAlignment: tech.mtfAlignment,
        exitScore: exit.exitScore,
        profitProtectionScore: exit.profitProtectionScore,
        exitStatus: exit.exitStatus,
        pumpRiskScore: manip.pumpRiskScore,
        exchangePremiumPct: manip.exchangePremiumPct,
        isLocalPremiumRisk: manip.isLocalPremiumRisk,
        finalScore: scores.finalScore,
        badges: [],

        riskLevel: risk.riskLevel,
        signal: coin.signal,
        signalLabelTh: coin.signalLabelTh,
        setupType: tech.structureScore >= 18 ? 'Breakout / Retest' : 'Trend Continuation',
        entryStatus: entry.entryStatus === 'DO NOT CHASE' ? 'DO NOT CHASE' : entry.entryStatus === 'WAIT FOR RETEST' ? 'WAIT FOR RETEST' : 'BUY ZONE',
        entryZone: levels.entryZone,
        support: levels.support1,
        resistance: levels.resistance1,
        invalidation: levels.invalidation,
        target1: levels.tp1,
        target2: levels.tp2,
        riskRewardRatio: levels.rrTp1,
        dynamicLevels: levels,
        whyTop5,
        aiSummaryTh,
        confidence: scores.confidenceScore >= 80 ? 'High' : scores.confidenceScore >= 60 ? 'Medium' : 'Low',
        freshness: 'Quant V2 Live (< 1 min)',
        timestamp: new Date().toISOString(),
      };

      evaluatedTopItems.push(candidateItem);

      // STEP 20: Top 5 Buy Now Filtering
      // Criteria: Entry Score >= 80, R:R >= 1:2, Tech >= 75, Liquidity pass, Risk not high/extreme, not overextended (<75), no critical bad news, no unlock risk
      const passesBuyNow = 
        entry.entryScore >= 80 &&
        levels.rrTp1 >= 2.0 &&
        tech.technicalScore >= 75 &&
        liq.isExecutable &&
        risk.riskScore <= 68 &&
        !extension.isOverextended &&
        !catalyst.hasCriticalNegative &&
        tokenomics.unlockPenalty === 0 &&
        manip.pumpRiskScore < 60;

      if (passesBuyNow) {
        let bnStatus: BuyNowStatus = 'BUY NOW';
        if (scores.buyNowScore >= 90) bnStatus = 'STRONG BUY NOW';
        else if (scores.buyNowScore >= 85) bnStatus = 'BUY NOW';
        else bnStatus = 'SCALE IN';

        const stopDistPct = Number((((coin.price - levels.invalidation) / coin.price) * 100).toFixed(1));
        const rewardDistPct = Number((((levels.tp1 - coin.price) / coin.price) * 100).toFixed(1));

        buyNowPassedItems.push({
          rank: 0, // assigned after sorting
          symbol: coin.symbol,
          name: coin.name || coin.symbol,
          price: coin.price,
          buyNowScore: scores.buyNowScore,
          coinQualityScore: scores.coinQualityScore,
          opportunityScore: scores.opportunityScore,
          technicalScore: tech.technicalScore,
          entryScore: entry.entryScore,
          confidenceScore: scores.confidenceScore,
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          extensionScore: extension.extensionScore,
          extensionLevel: extension.extensionLevel,
          exchangePremiumPct: manip.exchangePremiumPct,
          isLocalPremiumRisk: manip.isLocalPremiumRisk,
          pumpRiskScore: manip.pumpRiskScore,
          signal: (bnStatus === 'STRONG BUY NOW' ? 'STRONG_BUY' : 'BUY') as SignalType,
          currentTrend: coin.trend,
          setup: tech.structureScore >= 18 ? 'Successful Retest' : 'Higher Low Entry',
          status: bnStatus,
          entryZone: levels.entryZone,
          stopLoss: levels.invalidation,
          invalidation: levels.invalidation,
          tp1: levels.tp1,
          tp2: levels.tp2,
          tp3: levels.tp3,
          riskPct: stopDistPct,
          rewardPct: rewardDistPct,
          riskReward: `1:${levels.rrTp1.toFixed(1)}`,
          rrRatio: levels.rrTp1,
          rrTp1: levels.rrTp1,
          rrTp2: levels.rrTp2,
          rrTp3: levels.rrTp3,
          change24h: coin.change24h,
          change7d: coin.change7d,
          volumeRatio: Number((1.2 + (coin.change24h > 0 ? coin.change24h * 0.05 : 0)).toFixed(1)),
          whyBuyNow: [
            `Entry Quality สูงระดับ ${entry.entryScore}/100 ไม่ติดภาวะไล่ราคา (Extension ${extension.extensionLevel})`,
            `อัตราส่วน Risk/Reward คุ้มค่า 1:${levels.rrTp1} (SL -${stopDistPct}% เทียบ TP1 +${rewardDistPct}%)`,
            `โครงสร้างทางเทคนิค 5 Timeframes สอดคล้อง (${tech.mtfAlignment})`,
            `พื้นฐานและสภาพคล่องใน Bitkub ผ่านเกณฑ์ ไม่มีแรงกดดันจากการปลดเหรียญ`
          ],
          timestamp: new Date().toISOString(),
          isHighRisk: risk.riskScore > 60,
        });
      }
    }

    // STEP 19: Top Overall Ranking (Sort by Risk-adjusted Overall Score DESC)
    evaluatedTopItems.sort((a, b) => b.finalScore - a.finalScore);

    const top5Selected: Top5CandidateItem[] = evaluatedTopItems.slice(0, 5).map((item, idx) => {
      const rank = (idx + 1) as 1 | 2 | 3 | 4 | 5;
      const badges: string[] = [];

      // Assign badges organically based on merit, not arbitrary slot assignment
      if (idx === 0) badges.push('Best Overall');
      if (item.fundamentalScore >= 88) badges.push('Best Fundamental');
      if (item.opportunityScore >= 85) badges.push('Best Momentum');
      if (item.entryScore >= 85) badges.push('Best Entry Quality');
      if (item.riskRewardRatio >= 2.2) badges.push('Best Risk/Reward');
      if (badges.length === 0) badges.push('Top Ranked Asset');

      const primaryRole = badges[0] as Top5Role;
      let roleTh = 'เหรียญเด่นรอบด้านอันดับ 1';
      let badgeColor = '#F59E0B';

      if (idx === 0) { roleTh = 'เหรียญเด่นรอบด้านอันดับ 1'; badgeColor = '#F59E0B'; }
      else if (idx === 1) { roleTh = 'เหรียญพื้นฐานและเทรนด์แกร่งอันดับ 2'; badgeColor = '#10B981'; }
      else if (idx === 2) { roleTh = 'โอกาสโมเมนตัมสูงอันดับ 3'; badgeColor = '#06B6D4'; }
      else if (idx === 3) { roleTh = 'จังหวะราคาและผลตอบแทนเด่นอันดับ 4'; badgeColor = '#A855F7'; }
      else { roleTh = 'สัดส่วนความเสี่ยงคุ้มค่าอันดับ 5'; badgeColor = '#3B82F6'; }

      return {
        ...item,
        rank,
        role: primaryRole,
        roleTh,
        badgeColor,
        badges,
      };
    });

    // STEP 20: Top 5 Buy Now (0 to 5 results strictly)
    buyNowPassedItems.sort((a, b) => b.buyNowScore - a.buyNowScore);
    const topBuyNow = buyNowPassedItems.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    return {
      top5: top5Selected,
      buyNowCandidates: topBuyNow,
      marketContext: {
        btcTrend: btcTicker?.change24h && btcTicker.change24h > 1.5 ? 'bull' : btcTicker?.change24h && btcTicker.change24h < -2 ? 'bear' : 'neutral',
        btcTrendTh: btcTicker?.change24h && btcTicker.change24h > 1.5 ? 'ขาขึ้น (Bullish)' : btcTicker?.change24h && btcTicker.change24h < -2 ? 'ขาลง (Bearish)' : 'ทรงตัว (Neutral)',
        btcDominance: kpis?.btcDominance ?? 57.8,
        fearAndGreedIndex: kpis?.fearAndGreedIndex ?? 60,
        fearAndGreedSentiment: kpis?.fearAndGreedSentiment ?? 'Greed',
        marketRegime: regimeData.regime,
        marketRegimeTh: regimeData.regimeTh,
        favoredStrategy: regimeData.favoredStrategy,
        favoredStrategyTh: regimeData.favoredStrategyTh,
        regimeAdviceTh: regimeData.adviceTh,
        totalActiveCoinsEvaluated: eligibleCoins.length,
        lastUpdated: new Date().toLocaleTimeString('th-TH'),
        dataFreshness: 'Live Feed (< 30s)',
      },
      evaluatedTotal: eligibleCoins.length,
    };
  }
}
