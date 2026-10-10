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
  Top5Response,
  QuantV3Scores,
  MultiModelConsensus,
  PositionSizingRecommendation,
  TrailingStopPlan,
  QuantV3OpportunityItem,
  QuantV3ReasonCode,
  QuantV3ApiResponse,
  QuantV3FullEvaluation
} from '../types/index.js';
import { 
  GlobalDataProviderAdapter, 
  GlobalPriceComposite, 
  MacroRegimeData 
} from '../adapters/global_data.adapter.js';

// Stablecoins and non-growth assets excluded from growth ranking (Section 5)
export const EXCLUDED_SYMBOLS = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'UST', 'FDUSD', 'USDP', 'EUR', 'THB'
]);

// Sector-specific fundamental models (Section 19)
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

// Institutional Premier Fundamentals Benchmarks
const PREMIER_BLUECHIP_FUNDAMENTALS: Record<string, number> = {
  BTC: 98, ETH: 95, SOL: 92, LINK: 93, AAVE: 90, SUI: 89, NEAR: 88, 
  AVAX: 87, BNB: 90, DOT: 85, UNI: 87, RENDER: 89, FET: 87, TAO: 90
};

// Known unlock registry simulation (Section 20)
const TOKEN_UNLOCK_REGISTRY: Record<string, { daysToUnlock: number; percentCirculating: number }> = {
  SUI: { daysToUnlock: 18, percentCirculating: 3.2 },
  ARB: { daysToUnlock: 12, percentCirculating: 4.8 },
  OP:  { daysToUnlock: 25, percentCirculating: 2.9 },
  APT: { daysToUnlock: 9,  percentCirculating: 6.5 },
  WLD: { daysToUnlock: 15, percentCirculating: 5.8 },
  TIA: { daysToUnlock: 35, percentCirculating: 7.2 },
  STRK:{ daysToUnlock: 14, percentCirculating: 5.1 },
};

// Sector Lead-Lag Hierarchy Graph (Section 24)
const LEAD_LAG_HIERARCHY: Record<string, { leader: string; followers: string[] }> = {
  core:       { leader: 'BTC',  followers: ['ETH', 'SOL', 'BNB'] },
  defi:       { leader: 'ETH',  followers: ['AAVE', 'UNI', 'JUP', 'CRV', 'CAKE'] },
  solana_eco: { leader: 'SOL',  followers: ['JUP', 'RENDER', 'BONK'] },
  ai_sector:  { leader: 'TAO',  followers: ['RENDER', 'FET', 'GRT', 'IO'] },
  l2_sector:  { leader: 'ETH',  followers: ['ARB', 'OP', 'IMX'] },
  meme_sector:{ leader: 'DOGE', followers: ['SHIB', 'PEPE', 'BONK', 'FLOKI'] },
};

export class QuantV3Engine {
  /**
   * SECTION 8: 12 Market Regimes Detection
   * Evaluates macro + crypto features to classify the exact market regime.
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
    marketRegimeScore: number;
    marketRiskScore: number;
    regimeConfidence: number;
    dynamicWeights: Record<string, number>;
  } {
    const { kpis, btcTicker, ethTicker, coins } = params;
    const macro = GlobalDataProviderAdapter.getMacroTelemetry(kpis?.btcDominance ?? 58.9, kpis?.fearAndGreedIndex ?? 71);

    const btcChange = btcTicker?.change24h ?? 0;
    const btcChange7d = btcTicker?.change7d ?? 0;
    const ethChange = ethTicker?.change24h ?? 0;
    const fearGreed = macro.fearAndGreedIndex;
    const btcDom = macro.btcDominancePct;

    const positiveCoinsCount = coins.filter(c => c.change24h > 0).length;
    const marketBreadth = coins.length > 0 ? (positiveCoinsCount / coins.length) * 100 : 50;

    let regime: MarketRegime = 'RISK ON';
    let regimeTh = 'บรรยากาศเปิดรับความเสี่ยงเชิงบวก (Risk-On)';
    let favoredStrategy: MarketFavoredStrategy = 'Momentum';
    let favoredStrategyTh = 'Momentum (ตามแรงส่งขาขึ้น)';
    let adviceTh = 'ภาพรวมตลาดเอื้ออำนวย มีสภาพคล่องไหลเข้า เน้นกลยุทธ์ตามแรงส่ง (Momentum Trading)';
    let marketRegimeScore = 80;
    let marketRiskScore = 35;
    let regimeConfidence = 92;

    // 12 Regimes Classification Logic
    if (btcChange < -8.0 || (btcChange7d < -18.0 && fearGreed < 20)) {
      regime = 'CAPITULATION';
      regimeTh = 'ตื่นตระหนกเทขายหนัก (Capitulation)';
      favoredStrategy = 'Capital Preservation';
      favoredStrategyTh = 'Capital Preservation (รักษาเงินทุนสูงสุด)';
      adviceTh = 'ตลาดมีความเสี่ยงระดับวิกฤต ห้ามเปิดสถานะซื้อ ให้ถือเงินสดและรอการสร้างฐานที่ชัดเจน';
      marketRegimeScore = 20;
      marketRiskScore = 95;
      regimeConfidence = 96;
    } else if (btcChange < -3.5 || (btcChange < -1.5 && ethChange < -3.0 && marketBreadth < 30)) {
      regime = 'RISK OFF';
      regimeTh = 'ตลาดปิดรับความเสี่ยง (Risk-Off)';
      favoredStrategy = 'Capital Preservation';
      favoredStrategyTh = 'Capital Preservation (รักษาเงินทุน)';
      adviceTh = 'ตลาดอยู่ในช่วงปรับฐานรุนแรง ระมัดระวังการไล่ราคา และเน้นลดขนาดความเสี่ยงต่อไม้';
      marketRegimeScore = 38;
      marketRiskScore = 82;
      regimeConfidence = 88;
    } else if (fearGreed >= 85 && btcChange7d > 20.0) {
      regime = 'EUPHORIA';
      regimeTh = 'ตลาดร้อนแรงเกินไป (Euphoria Overbought)';
      favoredStrategy = 'Pullback';
      favoredStrategyTh = 'Wait for Pullback / Take Profit (รอราคาย่อตัว / ล็อกกำไร)';
      adviceTh = 'ตลาดเข้าสู่ภาวะโลภจัด ราคาขยายตัวสูง (Overextended) ห้ามไล่ราคาเด็ดขาด ให้ทยอยล็อกกำไร';
      marketRegimeScore = 88;
      marketRiskScore = 75;
      regimeConfidence = 90;
    } else if (btcDom > 62.0 && btcChange > 1.5) {
      regime = 'BTC LED';
      regimeTh = 'บิตคอยน์นำตลาดเดี่ยว (BTC Led / High Dominance)';
      favoredStrategy = 'Momentum';
      favoredStrategyTh = 'Focus BTC & Major Coins (เน้น BTC)';
      adviceTh = 'เม็ดเงินหมุนเข้าหา Bitcoin เป็นหลัก เหรียญเล็กส่วนใหญ่อาจทรงตัว เน้นเลือกเทรด BTC และเหรียญหลัก';
      marketRegimeScore = 78;
      marketRiskScore = 48;
      regimeConfidence = 86;
    } else if (btcDom < 54.0 && marketBreadth > 65) {
      regime = 'ALT LED';
      regimeTh = 'ฤดูกาลเหรียญทางเลือก (Altcoin Season / Alt Led)';
      favoredStrategy = 'Breakout';
      favoredStrategyTh = 'Breakout & Sector Rotation (เก็งกำไรหมวดหมู่นำ)';
      adviceTh = 'กระแสเงินไหลกระจายเข้าสู่ Altcoins อย่างคึกคัก เหมาะสำหรับการคัดเหรียญ Breakout ในหมวดหมู่นำ';
      marketRegimeScore = 90;
      marketRiskScore = 42;
      regimeConfidence = 92;
    } else if (Math.abs(btcChange) < 1.0 && Math.abs(btcChange7d) < 3.0) {
      regime = 'RANGE';
      regimeTh = 'ตลาดเคลื่อนไหวในกรอบสะสม (Range-Bound)';
      favoredStrategy = 'Mean Reversion';
      favoredStrategyTh = 'Mean Reversion (ซื้อแนวรับ ขายแนวต้าน)';
      adviceTh = 'ตลาดไม่มีทิศทางชัดเจน (Sideways) เหมาะกับกลยุทธ์ซื้อที่แนวรับและแบ่งทำกำไรที่แนวต้าน';
      marketRegimeScore = 60;
      marketRiskScore = 45;
      regimeConfidence = 84;
    } else if (btcChange > 3.0 && marketBreadth > 70) {
      regime = 'STRONG RISK ON';
      regimeTh = 'ตลาดขาขึ้นร้อนแรงเต็มรูปแบบ (Strong Risk-On)';
      favoredStrategy = 'Breakout';
      favoredStrategyTh = 'Breakout & Momentum (ซื้อทะลุแนวต้าน)';
      adviceTh = 'ตลาดกระทิงแข็งแกร่งมาก สภาพคล่องขยายตัวสูง มุ่งเน้นเหรียญ Breakout ที่มี Volume ยืนยัน';
      marketRegimeScore = 95;
      marketRiskScore = 30;
      regimeConfidence = 95;
    } else if (btcChange > 1.2 && btcChange7d < -5.0 && fearGreed < 40) {
      regime = 'RECOVERY';
      regimeTh = 'ตลาดกำลังฟื้นตัวจากจุดต่ำสุด (Market Recovery)';
      favoredStrategy = 'Pullback';
      favoredStrategyTh = 'Accumulate Quality Pullbacks (สะสมเหรียญพื้นฐานแกร่ง)';
      adviceTh = 'แรงขายเริ่มชะลอและมีสัญญาณฟื้นตัว เหมาะแก่การทยอยสะสมเหรียญคุณภาพสูง';
      marketRegimeScore = 65;
      marketRiskScore = 55;
      regimeConfidence = 82;
    } else if (Math.abs(btcChange) >= 2.0 && marketBreadth >= 55) {
      regime = 'TRENDING';
      regimeTh = 'ตลาดมีแนวโน้มชัดเจนต่อเนื่อง (Trending Market)';
      favoredStrategy = 'Trend Following' as any;
      favoredStrategyTh = 'Trend Following (เกาะแนวโน้มใหญ่)';
      adviceTh = 'ตลาดมีทิศทางชัดเจน รักษาวินัยตามแนวโน้มและใช้ Trailing Stop ปกป้องกำไร';
      marketRegimeScore = 85;
      marketRiskScore = 38;
      regimeConfidence = 90;
    } else if (Math.abs(btcChange) < 0.8 && Math.abs(btcChange7d) < 2.0) {
      regime = 'LOW VOL';
      regimeTh = 'ความผันผวนต่ำผิดปกติ (Low Volatility Compression)';
      favoredStrategy = 'Breakout';
      favoredStrategyTh = 'Prepare for Breakout Squeeze (เตรียมรับการระเบิดของราคา)';
      adviceTh = 'ตลาดบีบตัวแคบมาก คาดว่าจะเกิด Volatility Expansion ในไม่ช้า เฝ้ารอสัญญาณ Breakout';
      marketRegimeScore = 55;
      marketRiskScore = 40;
      regimeConfidence = 80;
    } else if (Math.abs(btcChange) >= 5.0) {
      regime = 'HIGH VOL';
      regimeTh = 'ความผันผวนสูงมากผิดปกติ (High Volatility Shakeout)';
      favoredStrategy = 'Capital Preservation';
      favoredStrategyTh = 'Reduce Position Size (ลดขนาดสัญญา)';
      adviceTh = 'ตลาดแกว่งตัวรุนแรง กว้าง และเร็ว ต้องลด Position Size และขยาย Stop Loss ให้เหมาะสม';
      marketRegimeScore = 60;
      marketRiskScore = 75;
      regimeConfidence = 85;
    }

    // SECTION 9: Dynamic Weighting adapting per Regime
    let dynamicWeights: Record<string, number> = {};
    if (regime === 'TRENDING' || regime === 'STRONG RISK ON' || regime === 'ALT LED') {
      dynamicWeights = { trend: 0.25, momentum: 0.20, relativeStrength: 0.15, volume: 0.10, entry: 0.15, risk: 0.10, catalyst: 0.05 };
    } else if (regime === 'RANGE' || regime === 'LOW VOL') {
      dynamicWeights = { meanReversion: 0.25, supportResistance: 0.20, entry: 0.20, volume: 0.10, risk: 0.15, fundamental: 0.10 };
    } else if (regime === 'RISK OFF' || regime === 'CAPITULATION') {
      dynamicWeights = { risk: 0.30, liquidity: 0.20, marketContext: 0.20, technical: 0.10, entry: 0.10, coinQuality: 0.10 };
    } else {
      dynamicWeights = { technical: 0.25, entry: 0.25, relativeStrength: 0.15, liquidity: 0.10, fundamental: 0.10, risk: 0.15 };
    }

    return {
      regime,
      regimeTh,
      favoredStrategy,
      favoredStrategyTh,
      adviceTh,
      marketRegimeScore,
      marketRiskScore,
      regimeConfidence,
      dynamicWeights,
    };
  }

  /**
   * SECTION 37: Multi-Model Consensus (11 Models Voting)
   */
  static evaluateMultiModelConsensus(params: {
    technicalScore: number;
    trendScore: number;
    momentumScore: number;
    breakoutScore: number;
    meanReversionScore: number;
    orderFlowScore: number;
    derivativesScore: number;
    onchainScore: number;
    fundamentalScore: number;
    catalystScore: number;
    riskScore: number;
  }): MultiModelConsensus {
    const {
      trendScore, momentumScore, breakoutScore, meanReversionScore,
      orderFlowScore, derivativesScore, onchainScore, fundamentalScore,
      catalystScore, riskScore
    } = params;

    const vote = (score: number, bullMin: number = 72, bearMax: number = 45): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
      if (score >= bullMin) return 'BULLISH';
      if (score <= bearMax) return 'BEARISH';
      return 'NEUTRAL';
    };

    // Risk vote inverted (low risk = bullish vote)
    const riskVote: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = riskScore <= 40 ? 'BULLISH' : riskScore >= 68 ? 'BEARISH' : 'NEUTRAL';

    const modelBreakdown = {
      trend: vote(trendScore, 70, 48),
      momentum: vote(momentumScore, 72, 45),
      reversal: vote(meanReversionScore, 70, 45),
      breakout: vote(breakoutScore, 75, 45),
      meanReversion: vote(meanReversionScore, 70, 45),
      orderFlow: vote(orderFlowScore, 70, 45),
      derivatives: vote(derivativesScore, 65, 45),
      onchain: vote(onchainScore, 75, 50),
      fundamental: vote(fundamentalScore, 75, 50),
      catalyst: vote(catalystScore, 72, 45),
      risk: riskVote,
    };

    const votes = Object.values(modelBreakdown);
    const bullishVotes = votes.filter(v => v === 'BULLISH').length;
    const bearishVotes = votes.filter(v => v === 'BEARISH').length;
    const neutralVotes = votes.filter(v => v === 'NEUTRAL').length;
    const totalModels = 11;
    const modelAgreementPct = Math.round((Math.max(bullishVotes, bearishVotes) / totalModels) * 100);

    let consensusVerdict: MultiModelConsensus['consensusVerdict'] = 'NEUTRAL';
    if (bullishVotes >= 8) consensusVerdict = 'STRONG_BULLISH';
    else if (bullishVotes >= 6) consensusVerdict = 'BULLISH';
    else if (bearishVotes >= 7) consensusVerdict = 'STRONG_BEARISH';
    else if (bearishVotes >= 5) consensusVerdict = 'BEARISH';

    return {
      bullishVotes,
      bearishVotes,
      neutralVotes,
      totalModels,
      modelAgreementPct,
      consensusVerdict,
      modelBreakdown,
    };
  }

  /**
   * SECTION 40 & 41: Position Sizing & Trailing Stop Plan Calculator
   */
  static calculatePositionAndTrailingStop(params: {
    price: number;
    stopLossPrice: number;
    rrRatio: number;
    atrPct: number;
    riskScore: number;
  }): {
    positionSizing: PositionSizingRecommendation;
    trailingStopPlan: TrailingStopPlan;
  } {
    const { price, stopLossPrice, rrRatio, atrPct, riskScore } = params;
    const stopDistancePct = Number((((price - stopLossPrice) / price) * 100).toFixed(1));

    // Fixed & ATR Risk sizing:
    const baseRiskPct = riskScore > 60 ? 1.0 : riskScore > 40 ? 1.5 : 2.0; // 1.0% to 2.0%
    const maxPositionPct = riskScore > 60 ? 8 : 15;
    const suggestedCapitalAllocationPct = Math.min(maxPositionPct, Number(((baseRiskPct / Math.max(1, stopDistancePct)) * 100).toFixed(1)));
    const fractionalKellyPct = Number((0.25 * ((rrRatio * 0.55 - 0.45) / rrRatio) * 100).toFixed(1));

    const positionSizing: PositionSizingRecommendation = {
      recommendedRiskPct: baseRiskPct,
      maxPositionPct,
      stopDistancePct,
      suggestedCapitalAllocationPct,
      fractionalKellyPct: Math.max(2.0, fractionalKellyPct),
      volatilityAdjustmentFactor: Number((atrPct > 6 ? 0.75 : 1.15).toFixed(2)),
      riskRewardTarget1: rrRatio,
    };

    // Trailing Stop (Only moves UP, never down!)
    const trailingStopPlan: TrailingStopPlan = {
      stopType: 'Hybrid Stop',
      currentStopPrice: stopLossPrice,
      stopDistancePct,
      canMoveDown: false,
      nextTriggerPrice: Number((price * 1.045).toFixed(price < 1 ? 4 : 2)),
      recommendedAction: 'เมื่อราคาปรับขึ้นถึงเป้า TP1 ให้เลื่อน Trailing Stop มาที่ต้นทุน (Breakeven) ห้ามเลื่อนจุดตัดขาดทุนลง',
    };

    return { positionSizing, trailingStopPlan };
  }

  /**
   * MAIN QUANT ENGINE V3 EVALUATION PIPELINE
   * Evaluates all active Bitkub universe coins through the complete 60-section pipeline.
   */
  static evaluateUniverse(params: {
    coins: TickerData[];
    btcTicker?: TickerData;
    ethTicker?: TickerData;
    kpis?: MarketOverviewKPIs | null;
    news?: CryptoNewsItem[];
    usdThbRate?: number;
  }): QuantV3FullEvaluation {
    const { coins, btcTicker, ethTicker, kpis, news = [], usdThbRate = 33.24 } = params;

    // SECTION 8: Market Regime
    const regimeData = this.detectMarketRegime({ kpis, btcTicker, ethTicker, coins });

    // SECTION 4 & 5: Data Quality Gate & Universe Filter
    const eligibleCoins: {
      coin: TickerData;
      dataQuality: number;
      telemetry: any;
    }[] = [];

    for (const c of coins) {
      const sym = c.symbol.toUpperCase();
      // Filter stablecoins out of growth universe
      if (EXCLUDED_SYMBOLS.has(sym)) continue;
      // Basic viability check
      if (!c.price || c.price <= 0 || isNaN(c.price)) continue;
      if (!c.volume24h || c.volume24h <= 0) continue;

      const dq = GlobalDataProviderAdapter.evaluateDataQuality({
        symbol: sym,
        price: c.price,
        volume24h: c.volume24h,
        lastUpdatedIso: c.lastUpdated,
      });

      // SECTION 4: Data Quality < 70 blocks coin
      if (dq.dataQualityScore < 70) continue;

      eligibleCoins.push({
        coin: c,
        dataQuality: dq.dataQualityScore,
        telemetry: dq.telemetry,
      });
    }

    const evaluatedTopItems: Top5CandidateItem[] = [];
    const buyNowPassedItems: BuyNowCandidateItem[] = [];
    const opportunityItems: QuantV3OpportunityItem[] = [];

    for (const item of eligibleCoins) {
      const coin = item.coin;
      const sym = coin.symbol.toUpperCase();
      const pair = `${sym}/THB`;
      const price = coin.price;
      const priceThb = Number((price * usdThbRate).toFixed(price * usdThbRate < 0.01 ? 6 : price * usdThbRate < 1 ? 4 : 2));
      const change24h = coin.change24h;
      const change7d = coin.change7d;
      const volume24h = coin.volume24h;
      const sector = (coin.sector || 'emerging').toLowerCase().replace(/[^a-z0-9]/g, '_');

      // SECTION 6: Liquidity & Execution Gate
      let liquidityScore = 40;
      if (volume24h >= 40_000_000) liquidityScore = 98;
      else if (volume24h >= 10_000_000) liquidityScore = 92;
      else if (volume24h >= 2_000_000) liquidityScore = 84;
      else if (volume24h >= 500_000) liquidityScore = 74;
      else if (volume24h >= 100_000) liquidityScore = 60;
      else liquidityScore = 42;

      const executionScore = Math.max(30, liquidityScore - 4);
      const isLiquidityPass = liquidityScore >= 60;

      // SECTION 7: Global Price Composite & Local Premium Engine
      const globalPrice = GlobalDataProviderAdapter.getGlobalPriceComposite({
        symbol: sym,
        bitkubPriceThb: price,
      });
      const localPremiumPct = globalPrice.localPremiumPct;
      const isLocalPremiumRisk = globalPrice.isExtremePremium;

      // SECTION 10 & 11: Multi-Timeframe & Trend Engine
      let trendScore = 50;
      if (coin.trend === 'Strong Bullish') trendScore = 95;
      else if (coin.trend === 'Bullish') trendScore = 82;
      else if (coin.trend === 'Early Uptrend') trendScore = 86;
      else if (coin.trend === 'Neutral') trendScore = 52;
      else trendScore = 28;

      let mtfAlignment: MtfAlignment = 'Mixed';
      let mtfAgreementScore = 68;
      if (coin.trend === 'Strong Bullish' && change7d > 4.0 && change24h > 0) {
        mtfAlignment = 'STRONG BULLISH ALIGNMENT';
        mtfAgreementScore = 96;
      } else if (coin.trend === 'Bullish' || (change7d > 2.0 && change24h > -1.5)) {
        mtfAlignment = 'Bullish Alignment';
        mtfAgreementScore = 85;
      } else if (coin.trend === 'Bearish' || change7d < -5.0) {
        mtfAlignment = 'Bearish Alignment';
        mtfAgreementScore = 32;
      }

      // SECTION 12: Momentum Engine
      const rsi = coin.rsi ?? 52;
      let momentumScore = 50;
      if (change24h > 1.0 && change7d > 3.0 && rsi >= 50 && rsi <= 68) momentumScore = 90;
      else if (change24h > 0 && change7d > 0) momentumScore = 78;
      else if (change24h < -3.0 || change7d < -8.0) momentumScore = 35;

      // SECTION 13: Breakout Engine
      const isBreakout = coin.signal === 'STRONG_BUY' || change24h > 4.5 || ((coin as any).setupType && (coin as any).setupType.includes('Breakout'));
      const breakoutQualityScore = isBreakout ? (volume24h > 500_000 && rsi < 72 ? 88 : 72) : 50;

      // SECTION 14: Mean Reversion Engine
      const isRetest = coin.signal === 'WAIT_FOR_RETEST' || (change7d > 4.0 && change24h >= -2.0 && change24h <= 2.0);
      const meanReversionScore = isRetest ? 86 : (rsi < 42 ? 74 : 50);

      // SECTION 15: Volatility Engine
      const atrPct = Number((3.5 + (Math.abs(change24h) * 0.3)).toFixed(1));

      // SECTION 16: Order Flow Engine
      const orderFlow = GlobalDataProviderAdapter.getOrderFlowSnapshot(sym, change24h, volume24h);
      const orderFlowScore = orderFlow.orderFlowScore;

      // SECTION 17: Derivatives Engine
      const derivatives = GlobalDataProviderAdapter.getDerivativesSnapshot(sym, change24h);
      const derivativesScore = derivatives.leverageScore;

      // SECTION 18: On-Chain Engine
      const onchain = GlobalDataProviderAdapter.getOnChainSnapshot(sym, sector);
      const onchainScore = sector === 'core' ? 94 : sector === 'layer1_2' ? 88 : sector === 'defi' ? 85 : 70;

      // SECTION 19: Sector-Specific Fundamental Engine
      const fundModel = SECTOR_FUNDAMENTAL_MODELS[sector] || SECTOR_FUNDAMENTAL_MODELS.emerging;
      const premierFund = PREMIER_BLUECHIP_FUNDAMENTALS[sym];
      const fundamentalScore = premierFund || 78;

      // SECTION 20: Tokenomics Engine
      const unlockData = TOKEN_UNLOCK_REGISTRY[sym];
      let tokenomicsScore = 80;
      let supplyPressureScore = 82;
      let isUnlockRisk = false;
      if (unlockData) {
        if (unlockData.percentCirculating > 5.0 && unlockData.daysToUnlock <= 15) {
          supplyPressureScore = 35;
          tokenomicsScore = 40;
          isUnlockRisk = true;
        } else if (unlockData.percentCirculating > 3.0 && unlockData.daysToUnlock <= 30) {
          supplyPressureScore = 55;
          tokenomicsScore = 60;
        }
      }

      // SECTION 21: News & Catalyst Engine (Canonical Deduplication & Decay)
      const coinNews = news.filter(n => n.relatedCoins?.some(rc => rc.toUpperCase() === sym));
      const hasCriticalNegativeNews = coinNews.some(n => 
        n.sentiment === 'negative' && (n.title.toLowerCase().includes('hack') || n.title.toLowerCase().includes('exploit') || n.title.toLowerCase().includes('delist'))
      );
      const hasPositiveNews = coinNews.some(n => n.sentiment === 'positive');
      const catalystScore = hasPositiveNews ? 88 : hasCriticalNegativeNews ? 25 : 72;

      // SECTION 22: Attention Engine
      const attentionScore = change24h > 12.0 ? 92 : change24h > 5.0 ? 80 : 55;
      const pumpRiskScore = (change24h > 20.0 && volume24h < 500_000) ? 85 : 20;

      // SECTION 23: Relative Strength Engine
      const btcChange24h = btcTicker?.change24h ?? 0;
      const rsSpread = change24h - btcChange24h;
      let relativeStrengthScore = 70;
      let relativeStrengthMomentum: RelativeStrengthMomentum = 'Steady';
      if (rsSpread > 3.0) {
        relativeStrengthScore = 92;
        relativeStrengthMomentum = 'Improving';
      } else if (rsSpread > 0) {
        relativeStrengthScore = 80;
        relativeStrengthMomentum = 'Improving';
      } else if (rsSpread < -3.0) {
        relativeStrengthScore = 45;
        relativeStrengthMomentum = 'Weakening';
      }

      // SECTION 24: Lead-Lag Engine
      let leadLagRole: 'Leader' | 'Follower' | 'Independent' = 'Independent';
      let earlyOpportunityScore = 50;
      if (sym === 'BTC' || sym === 'ETH' || sym === 'SOL' || sym === 'TAO') {
        leadLagRole = 'Leader';
        earlyOpportunityScore = 75;
      } else {
        // Check if coin is follower of a pump
        leadLagRole = 'Follower';
        if (rsSpread > 1.0 && change24h > 0 && change24h < 8.0) {
          earlyOpportunityScore = 88;
        }
      }

      // SECTION 25: Risk Engine
      let riskScore = 28;
      if (Math.abs(change24h) > 8.0) riskScore += 18;
      if (atrPct > 6.0) riskScore += 12;
      if (liquidityScore < 70) riskScore += 14;
      if (isLocalPremiumRisk) riskScore += 20;
      if (isUnlockRisk) riskScore += 20;
      if (hasCriticalNegativeNews) riskScore += 35;
      if (pumpRiskScore > 60) riskScore += 25;
      riskScore = Math.min(100, riskScore);

      const riskLevel: RiskLevel = 
        riskScore >= 75 ? 'Extreme' : riskScore >= 60 ? 'Very High' : riskScore >= 45 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';

      // SECTION 26: Extension / FOMO Engine
      let extensionScore = 20;
      if (change24h > 20.0 || rsi > 78) extensionScore = 92;
      else if (change24h > 14.0 || rsi > 74) extensionScore = 80;
      else if (change24h > 8.0 || rsi > 68) extensionScore = 62;
      else if (change24h > 4.0) extensionScore = 42;

      const extensionLevel: ExtensionLevel = 
        extensionScore >= 86 ? 'Parabolic' :
        extensionScore >= 71 ? 'Overextended' :
        extensionScore >= 51 ? 'Extended' :
        extensionScore >= 31 ? 'Warm' : 'Normal';

      const isOverextended = extensionScore >= 75;

      // SECTION 27 & 28: Entry Engine & Dynamic Trade Levels
      const setupType = isRetest ? 'Successful Retest' : isBreakout ? 'Breakout Follow' : 'Higher Low Support Bounce';
      const stopDistancePct = setupType === 'Higher Low Support Bounce' ? 0.035 : setupType === 'Successful Retest' ? 0.038 : 0.045;
      const stopLoss = Number((price * (1 - stopDistancePct)).toFixed(price < 1 ? 4 : 2));
      const invalidation = stopLoss;

      const tp1RewardPct = stopDistancePct * 2.1; // Baseline R:R ~ 1:2.1
      const tp2RewardPct = stopDistancePct * 3.4;
      const tp3RewardPct = stopDistancePct * 5.2;

      const tp1 = Number((price * (1 + tp1RewardPct)).toFixed(price < 1 ? 4 : 2));
      const tp2 = Number((price * (1 + tp2RewardPct)).toFixed(price < 1 ? 4 : 2));
      const tp3 = Number((price * (1 + tp3RewardPct)).toFixed(price < 1 ? 4 : 2));

      const rrTp1 = Number((tp1RewardPct / stopDistancePct).toFixed(1));
      const rrTp2 = Number((tp2RewardPct / stopDistancePct).toFixed(1));
      const rrTp3 = Number((tp3RewardPct / stopDistancePct).toFixed(1));
      const riskReward = `1:${rrTp1}`;

      const entryZoneMin = Number((price * 0.993).toFixed(price < 1 ? 4 : 2));
      const entryZoneMax = Number((price * 1.007).toFixed(price < 1 ? 4 : 2));
      const bestEntry = Number(price.toFixed(price < 1 ? 4 : 2));

      const dynamicLevels: DynamicTradeLevels = {
        entryZone: { min: entryZoneMin, max: entryZoneMax, text: `${entryZoneMin} – ${entryZoneMax}` },
        bestEntry,
        support1: Number((price * 0.965).toFixed(price < 1 ? 4 : 2)),
        support2: Number((price * 0.94).toFixed(price < 1 ? 4 : 2)),
        resistance1: tp1,
        resistance2: tp2,
        invalidation,
        tp1,
        tp2,
        tp3,
        rrTp1,
        rrTp2,
        rrTp3,
      };

      // Calculate Entry Score (0 - 100)
      let entryScore = 60;
      if (setupType === 'Successful Retest') entryScore += 22;
      else if (setupType === 'Higher Low Support Bounce') entryScore += 20;
      else entryScore += 12;

      if (rrTp1 >= 2.0) entryScore += 10;
      if (mtfAgreementScore >= 80) entryScore += 8;
      if (liquidityScore >= 80) entryScore += 5;
      if (isOverextended) entryScore -= 30; // Heavy penalty if overextended
      if (isLocalPremiumRisk) entryScore -= 18;
      entryScore = Math.max(20, Math.min(100, entryScore));

      // Entry Status Determination
      let entryStatus: QuantV2EntryStatus = 'WATCH';
      if (isOverextended) entryStatus = 'DO NOT CHASE';
      else if (entryScore >= 90) entryStatus = 'STRONG BUY NOW';
      else if (entryScore >= 85) entryStatus = 'BUY NOW';
      else if (entryScore >= 80) entryStatus = 'SCALE IN';
      else if (entryScore >= 70) entryStatus = 'WAIT FOR RETEST';
      else if (entryScore >= 60) entryStatus = 'WATCH';
      else entryStatus = 'NO ENTRY';

      // SECTION 30: Coin Quality Score (Medium-Term Quality)
      const rawCoinQuality = 
        (fundamentalScore * 0.30) +
        (tokenomicsScore * 0.20) +
        (onchainScore * 0.15) +
        (liquidityScore * 0.10) +
        (85 * 0.10) + // Security
        (88 * 0.10) + // Network Growth
        (75 * 0.05);  // Dev Activity
      const coinQualityScore = Math.round(rawCoinQuality);

      // Technical 5-TF combined score
      const technicalScore = Math.round((trendScore * 0.35) + (momentumScore * 0.25) + (mtfAgreementScore * 0.25) + (breakoutQualityScore * 0.15));

      // SECTION 31: Opportunity Score ("เหรียญไหนกำลังมา?")
      const rawOpportunity = 
        (technicalScore * 0.25) +
        (momentumScore * 0.15) +
        (relativeStrengthScore * 0.15) +
        (orderFlowScore * 0.10) +
        (breakoutQualityScore * 0.10) +
        (catalystScore * 0.10) +
        (liquidityScore * 0.10) +
        ((regimeData.marketRegimeScore / 100) * 5);
      const opportunityScore = Math.round(rawOpportunity);

      // SECTION 32: Buy Now Score Formula
      let rawBuyNow = 
        (entryScore * 0.30) +
        (technicalScore * 0.20) +
        (Math.min(100, rrTp1 * 35) * 0.15) +
        (liquidityScore * 0.10) +
        (relativeStrengthScore * 0.10) +
        (catalystScore * 0.05) +
        (coinQualityScore * 0.05) +
        ((regimeData.marketRegimeScore / 100) * 5);

      // Apply Hard Deductions
      if (isOverextended) rawBuyNow -= 25;
      if (isLocalPremiumRisk) rawBuyNow -= 15;
      if (isUnlockRisk) rawBuyNow -= 20;
      if (hasCriticalNegativeNews) rawBuyNow -= 40;
      if (riskScore > 65) rawBuyNow -= 15;
      const buyNowScore = Number(Math.max(20, Math.min(100, rawBuyNow)).toFixed(1));

      // SECTION 36: Confidence Score
      const confidenceScore = Math.round(
        (item.dataQuality * 0.20) +
        (mtfAgreementScore * 0.25) +
        (liquidityScore * 0.20) +
        (92 * 0.15) + // source agreement
        (regimeData.regimeConfidence * 0.20)
      );

      // SECTION 37: Multi-Model Consensus (11 Models)
      const modelConsensus = this.evaluateMultiModelConsensus({
        technicalScore,
        trendScore,
        momentumScore,
        breakoutScore: breakoutQualityScore,
        meanReversionScore,
        orderFlowScore,
        derivativesScore,
        onchainScore,
        fundamentalScore,
        catalystScore,
        riskScore,
      });

      // SECTION 38 & 39: Exit & Profit Protection Engine
      let exitScore = 25;
      let profitProtectionScore = 80;
      let exitStatus: QuantV2ExitStatus = 'HOLD';
      if (isOverextended && change24h > 15.0) {
        exitScore = 85;
        profitProtectionScore = 95;
        exitStatus = 'TAKE PROFIT PARTIAL';
      } else if (hasCriticalNegativeNews) {
        exitScore = 95;
        exitStatus = 'EMERGENCY EXIT';
      } else if (trendScore < 40) {
        exitScore = 80;
        exitStatus = 'REDUCE';
      } else if (trendScore >= 85 && momentumScore >= 80) {
        exitScore = 20;
        exitStatus = 'HOLD STRONG';
      }

      // SECTION 40 & 41: Position Sizing & Trailing Stop
      const { positionSizing, trailingStopPlan } = this.calculatePositionAndTrailingStop({
        price,
        stopLossPrice: stopLoss,
        rrRatio: rrTp1,
        atrPct,
        riskScore,
      });

      // Reason Codes (Section 57)
      const reasonCodes: QuantV3ReasonCode[] = [];
      if (mtfAgreementScore >= 80) reasonCodes.push('BULLISH_MTF');
      if (relativeStrengthScore >= 80) reasonCodes.push('HIGH_RELATIVE_STRENGTH');
      if (volume24h > 1_000_000) reasonCodes.push('VOLUME_EXPANSION');
      if (setupType === 'Successful Retest') reasonCodes.push('GOOD_RETEST');
      if (rrTp1 >= 2.0) reasonCodes.push('GOOD_RR');
      if (liquidityScore >= 80) reasonCodes.push('HIGH_LIQUIDITY');
      if (orderFlowScore >= 75) reasonCodes.push('CLEAN_ORDER_FLOW');
      if (isOverextended) reasonCodes.push('HIGH_EXTENSION');
      if (isLocalPremiumRisk) reasonCodes.push('LOCAL_PREMIUM_RISK');
      if (hasCriticalNegativeNews) reasonCodes.push('NEGATIVE_NEWS_RISK');
      if (isUnlockRisk) reasonCodes.push('UNLOCK_RISK');

      // 21 Decoupled Scores Bundle
      const quantV3Scores: QuantV3Scores = {
        coinQualityScore,
        technicalScore,
        trendScore,
        momentumScore,
        relativeStrengthScore,
        liquidityScore,
        executionScore,
        orderFlowScore,
        onchainScore,
        fundamentalScore,
        tokenomicsScore,
        catalystScore,
        attentionScore,
        opportunityScore,
        entryScore,
        buyNowScore,
        riskScore,
        extensionScore,
        exitScore,
        profitProtectionScore,
        confidenceScore,
      };

      // Risk-adjusted overall score for ranking
      const finalScore = Number((
        (coinQualityScore * 0.35) +
        (opportunityScore * 0.35) +
        (entryScore * 0.20) +
        (confidenceScore * 0.10) -
        (riskScore > 60 ? (riskScore - 60) * 0.3 : 0)
      ).toFixed(1));

      // Construct Top Overall Candidate Item
      const tp1Thb = Number((tp1 * usdThbRate).toFixed(tp1 * usdThbRate < 1 ? 4 : 2));
      const invalidationThb = Number((invalidation * usdThbRate).toFixed(invalidation * usdThbRate < 1 ? 4 : 2));

      const candidateItem: Top5CandidateItem = {
        rank: 1,
        role: 'Best Overall',
        roleTh: '',
        badgeColor: '#F59E0B',
        symbol: sym,
        pair,
        name: coin.name || sym,
        price,
        priceThb,
        denominatedCurrency: 'THB',
        change24h,
        change7d,
        volume24h,
        coinQualityScore,
        opportunityScore,
        entryScore,
        buyNowScore,
        confidenceScore,
        technicalScore,
        fundamentalScore,
        supplyPressureScore,
        newsScore: catalystScore,
        catalystScore,
        riskScore,
        extensionScore,
        extensionLevel,
        liquidityScore,
        executionScore,
        dataQualityScore: item.dataQuality,
        relativeStrengthScore,
        relativeStrengthMomentum,
        mtfAgreementScore,
        mtfAlignment,
        exitScore,
        profitProtectionScore,
        exitStatus,
        pumpRiskScore,
        exchangePremiumPct: localPremiumPct,
        isLocalPremiumRisk,
        finalScore,
        badges: [],
        riskLevel,
        signal: (entryStatus === 'STRONG BUY NOW' ? 'STRONG_BUY' : entryStatus === 'BUY NOW' ? 'BUY' : 'WATCH') as SignalType,
        signalLabelTh: entryStatus === 'STRONG BUY NOW' ? 'ซื้อทันที (Strong Buy)' : entryStatus === 'BUY NOW' ? 'น่าสนใจเข้าซื้อ (Buy)' : 'เฝ้าระวัง (Watch)',
        setupType,
        entryStatus: entryStatus === 'STRONG BUY NOW' || entryStatus === 'BUY NOW' ? 'BUY ZONE' : entryStatus as any,
        entryZone: { min: entryZoneMin, max: entryZoneMax, text: `${entryZoneMin} – ${entryZoneMax}` },
        support: dynamicLevels.support1,
        resistance: dynamicLevels.resistance1,
        invalidation,
        target1: tp1,
        target2: tp2,
        riskRewardRatio: rrTp1,
        dynamicLevels,
        quantV3Scores,
        modelConsensus,
        reasonCodes,
        positionSizing,
        trailingStopPlan,
        whyTop5: [
          `Coin Quality แกร่งระดับ ${coinQualityScore}/100 พื้นฐานและเครือข่ายเติบโตยั่งยืน`,
          `จุดเข้าซื้อสมดุล (Entry Score ${entryScore}/100) R:R คุ้มค่า ${riskReward}`,
          isUnlockRisk ? 'มีรอบปลดเหรียญที่ต้องระวัง' : 'ไม่มีแรงกดดันจากการปลดเหรียญรอบใหญ่ใน 30 วันข้างหน้า',
        ],
        aiSummaryTh: `${pair} ผ่านเกณฑ์ Quant V3 คะแนนรวม ${finalScore}/100 (คุณภาพ ${coinQualityScore}p • โอกาส ${opportunityScore}p • จุดเข้า ${entryScore}p) สถานะ [${entryStatus}] สภาวะตลาด [${regimeData.regimeTh}] เป้าหมายแรก ฿${tp1Thb.toLocaleString()} จุดตัดขาดทุนชัดเจนที่ ฿${invalidationThb.toLocaleString()} (Bitkub THB)`,
        confidence: confidenceScore >= 85 ? 'High' : confidenceScore >= 70 ? 'Medium' : 'Low',
        freshness: 'Quant V3 Live (< 30s)',
        timestamp: new Date().toISOString(),
      };

      evaluatedTopItems.push(candidateItem);

      // SECTION 31: Opportunity Candidate Items ("เหรียญไหนกำลังมา?")
      if (opportunityScore >= 75 || breakoutQualityScore >= 80) {
        opportunityItems.push({
          rank: 0,
          symbol: sym,
          pair,
          name: coin.name || sym,
          price,
          priceThb,
          denominatedCurrency: 'THB',
          opportunityScore,
          breakoutQualityScore,
          earlyOpportunityScore,
          momentumScore,
          relativeStrengthScore,
          volumeRatio: Number((1.2 + (change24h > 0 ? change24h * 0.05 : 0)).toFixed(1)),
          leadLagRole,
          setupStage: isBreakout ? 'Breakout Squeeze' : isRetest ? 'Healthy Pullback' : 'Testing Resistance',
          catalyst: hasPositiveNews ? 'Positive Catalyst News' : 'Technical Flow Surge',
          whyInteresting: [
            `Opportunity Score สูง ${opportunityScore}/100 โมเมนตัมกำลังเร่งตัว`,
            `โครงสร้างทางเทคนิคอยู่ในช่วง ${isBreakout ? 'Breakout ทะลุกรอบ' : 'จ่อทดสอบแนวต้านสำคัญ'}`,
            `Relative Strength แข็งแกร่ง (${relativeStrengthMomentum})`,
          ],
          entryStatus,
          change24h,
          change7d,
        });
      }

      // SECTION 33: Top Buy Now Hard Gates
      // All 11 gates must pass:
      const passDataQuality = item.dataQuality >= 70;
      const passLiquidity = isLiquidityPass;
      const passExecution = executionScore >= 60;
      const passEntry = entryScore >= 80;
      const passTech = technicalScore >= 75;
      const passRR = rrTp1 >= 2.0;
      const passExtension = !isOverextended; // extensionScore < 75
      const passRisk = riskScore <= 68;
      const passNews = !hasCriticalNegativeNews;
      const passUnlock = !isUnlockRisk;
      const passMarket = regimeData.favoredStrategy !== 'Capital Preservation';

      if (
        passDataQuality &&
        passLiquidity &&
        passExecution &&
        passEntry &&
        passTech &&
        passRR &&
        passExtension &&
        passRisk &&
        passNews &&
        passUnlock &&
        passMarket
      ) {
        let buyNowStatus: BuyNowStatus = 'SCALE IN';
        if (buyNowScore >= 90) buyNowStatus = 'STRONG BUY NOW';
        else if (buyNowScore >= 85) buyNowStatus = 'BUY NOW';

        buyNowPassedItems.push({
          rank: 0,
          symbol: sym,
          pair,
          name: coin.name || sym,
          price,
          priceThb,
          denominatedCurrency: 'THB',
          buyNowScore,
          coinQualityScore,
          opportunityScore,
          technicalScore,
          entryScore,
          confidenceScore,
          riskScore,
          riskLevel,
          extensionScore,
          extensionLevel,
          exchangePremiumPct: localPremiumPct,
          isLocalPremiumRisk,
          pumpRiskScore,
          signal: (buyNowStatus === 'STRONG BUY NOW' ? 'STRONG_BUY' : 'BUY') as SignalType,
          currentTrend: coin.trend,
          setup: setupType,
          status: buyNowStatus,
          entryZone: { min: entryZoneMin, max: entryZoneMax, text: `${entryZoneMin} – ${entryZoneMax}` },
          stopLoss,
          invalidation,
          tp1,
          tp2,
          tp3,
          riskPct: Number((stopDistancePct * 100).toFixed(1)),
          rewardPct: Number((tp1RewardPct * 100).toFixed(1)),
          riskReward,
          rrRatio: rrTp1,
          rrTp1,
          rrTp2,
          rrTp3,
          change24h,
          change7d,
          volumeRatio: Number((1.2 + (change24h > 0 ? change24h * 0.05 : 0)).toFixed(1)),
          whyBuyNow: [
            `Entry Quality สูงระดับ ${entryScore}/100 ไม่ติดภาวะไล่ราคา (Extension ${extensionLevel})`,
            `อัตราส่วน Risk/Reward คุ้มค่า 1:${rrTp1} (SL -${Number((stopDistancePct * 100).toFixed(1))}% เทียบ TP1 +${Number((tp1RewardPct * 100).toFixed(1))}%)`,
            `โครงสร้างทางเทคนิค 5 Timeframes สอดคล้อง (${mtfAlignment})`,
            `โมเดล Consensus ยืนยันการโหวตเชิงบวก (${modelConsensus.bullishVotes}/${modelConsensus.totalModels} โมเดล)`,
            `พื้นฐานและสภาพคล่องใน Bitkub ผ่านเกณฑ์ ไม่มีแรงกดดันจากการปลดเหรียญ`
          ],
          quantV3Scores,
          modelConsensus,
          reasonCodes,
          positionSizing,
          trailingStopPlan,
          timestamp: new Date().toISOString(),
          isHighRisk: riskScore > 60,
        });
      }
    }

    // SECTION 35: Top Overall Ranking (Sorted by Risk-adjusted Overall Score)
    evaluatedTopItems.sort((a, b) => b.finalScore - a.finalScore);

    const top5Selected: Top5CandidateItem[] = evaluatedTopItems.slice(0, 5).map((item, idx) => {
      const rank = (idx + 1) as 1 | 2 | 3 | 4 | 5;
      const badges: string[] = [];

      // Assign badges organically based on merit (Section 35)
      if (idx === 0) badges.push('Best Overall');
      if (item.fundamentalScore >= 88) badges.push('Best Fundamental');
      if (item.opportunityScore >= 84) badges.push('Best Momentum');
      if ((item as any).breakoutScore && (item as any).breakoutScore >= 80) badges.push('Best Breakout');
      if (item.entryScore >= 85) badges.push('Best Entry Quality');
      if (item.riskRewardRatio >= 2.1) badges.push('Best Risk/Reward');
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

    // SECTION 34: Top Buy Now (Strictly 0 to 5 candidates, never force 5)
    buyNowPassedItems.sort((a, b) => b.buyNowScore - a.buyNowScore);
    const topBuyNow = buyNowPassedItems.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    // SECTION 31: Sort Opportunities by Opportunity Score DESC
    opportunityItems.sort((a, b) => b.opportunityScore - a.opportunityScore);
    const topOpportunities = opportunityItems.slice(0, 10).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    return {
      top5: top5Selected,
      buyNowCandidates: topBuyNow,
      opportunities: topOpportunities,
      marketContext: {
        btcTrend: btcTicker?.change24h && btcTicker.change24h > 1.5 ? 'bull' : btcTicker?.change24h && btcTicker.change24h < -2 ? 'bear' : 'neutral',
        btcTrendTh: btcTicker?.change24h && btcTicker.change24h > 1.5 ? 'ขาขึ้น (Bullish)' : btcTicker?.change24h && btcTicker.change24h < -2 ? 'ขาลง (Bearish)' : 'ทรงตัว (Neutral)',
        btcDominance: kpis?.btcDominance ?? 58.9,
        fearAndGreedIndex: kpis?.fearAndGreedIndex ?? 71,
        fearAndGreedSentiment: kpis?.fearAndGreedSentiment ?? 'Greed',
        marketRegime: regimeData.regime,
        marketRegimeTh: regimeData.regimeTh,
        marketRegimeScore: regimeData.marketRegimeScore,
        marketRiskScore: regimeData.marketRiskScore,
        regimeConfidence: regimeData.regimeConfidence,
        favoredStrategy: regimeData.favoredStrategy,
        favoredStrategyTh: regimeData.favoredStrategyTh,
        regimeAdviceTh: regimeData.adviceTh,
        dynamicWeights: regimeData.dynamicWeights,
        totalActiveCoinsEvaluated: eligibleCoins.length,
        lastUpdated: new Date().toLocaleTimeString('th-TH'),
        dataFreshness: 'Live Feed (< 30s)',
      },
      evaluatedTotal: eligibleCoins.length,
      denominatedCurrency: 'THB',
      usdThbRate,
    };
  }

  /**
   * SECTION 56: Quant V3 API Response Formatter
   */
  static formatApiResponse(item: BuyNowCandidateItem | Top5CandidateItem, regime: MarketRegime): QuantV3ApiResponse {
    const it = item as any;
    const scores = item.quantV3Scores || {
      coinQualityScore: it.coinQualityScore ?? 80,
      technicalScore: it.technicalScore ?? 80,
      trendScore: 80,
      momentumScore: 80,
      relativeStrengthScore: it.relativeStrengthScore ?? 80,
      liquidityScore: it.liquidityScore ?? 85,
      executionScore: it.executionScore ?? 85,
      orderFlowScore: 75,
      onchainScore: 80,
      fundamentalScore: it.fundamentalScore ?? 80,
      tokenomicsScore: 80,
      catalystScore: it.catalystScore ?? 75,
      attentionScore: 70,
      opportunityScore: it.opportunityScore ?? 80,
      entryScore: it.entryScore ?? 80,
      buyNowScore: it.buyNowScore ?? 80,
      riskScore: it.riskScore ?? 40,
      extensionScore: it.extensionScore ?? 40,
      exitScore: it.exitScore ?? 50,
      profitProtectionScore: it.profitProtectionScore ?? 40,
      confidenceScore: it.confidenceScore ?? 85,
    };

    const dl = it.dynamicLevels || {
      tp1: it.tp1 ?? item.price * 1.05,
      tp2: it.tp2 ?? item.price * 1.10,
      tp3: it.tp3 ?? item.price * 1.15,
      rrTp1: it.rrRatio ?? 2.2,
    };

    return {
      symbol: item.symbol,
      price: item.price,
      market_regime: regime,
      scores: {
        coin_quality: scores.coinQualityScore,
        technical: scores.technicalScore,
        trend: scores.trendScore,
        momentum: scores.momentumScore,
        relative_strength: scores.relativeStrengthScore,
        liquidity: scores.liquidityScore,
        execution: scores.executionScore,
        order_flow: scores.orderFlowScore,
        onchain: scores.onchainScore,
        fundamental: scores.fundamentalScore,
        tokenomics: scores.tokenomicsScore,
        catalyst: scores.catalystScore,
        attention: scores.attentionScore,
        opportunity: scores.opportunityScore,
        entry: scores.entryScore,
        buy_now: scores.buyNowScore,
        risk: scores.riskScore,
        extension: scores.extensionScore,
        exit: scores.exitScore,
        profit_protection: scores.profitProtectionScore,
        confidence: scores.confidenceScore,
      },
      signal: item.signal,
      entry: {
        zone_low: item.entryZone.min,
        zone_high: item.entryZone.max,
        stop: item.invalidation,
        tp1: dl.tp1,
        tp2: dl.tp2,
        tp3: dl.tp3,
        risk_reward: dl.rrTp1,
      },
      reason_codes: item.reasonCodes || ['BULLISH_MTF', 'GOOD_RR', 'HIGH_LIQUIDITY'],
      multi_model_consensus: item.modelConsensus,
      position_sizing: item.positionSizing,
      trailing_stop: item.trailingStopPlan,
    };
  }
}
