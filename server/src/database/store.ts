import { 
  AlertItem, 
  Candle, 
  Coin, 
  CryptoNewsItem, 
  MarketOverviewKPIs, 
  PaperTrade,
  SectorCategory, 
  SectorInfo, 
  SectorTopItem, 
  TickerData, 
  Top3OverallItem,
  Top5CandidateItem,
  Top5SnapshotHistory,
  Top5Response,
  BuyNowCandidateItem,
  BuyNowResponse,
  FocusItem,
  FocusCoinData,
  FocusResponse,
  WhaleRadarSummary,
  WhaleTransaction,
  QuantV3OpportunityItem,
  QuantV3ApiResponse
} from '../types/index.js';
import { INITIAL_COINS, SECTORS } from '../config/sectors.js';
import { TechnicalScoringEngine } from '../engines/scoring.engine.js';
import { AIEngine } from '../engines/ai.engine.js';
import { IndicatorsEngine } from '../engines/indicators.engine.js';
import { RankingEngine, QuantV3Engine } from '../engines/ranking.engine.js';
import { FocusEngine } from '../engines/focus.engine.js';
import { BinanceAdapter } from '../adapters/binance.adapter.js';
import { BitkubAdapter } from '../adapters/bitkub.adapter.js';

export class MarketStore {
  private coins: Map<string, Coin> = new Map();
  private tickers: Map<string, TickerData> = new Map();
  private candlesCache: Map<string, Candle[]> = new Map();
  private watchlist: Set<string> = new Set(['BTC', 'ETH', 'SOL', 'LINK', 'AAVE']);
  private alerts: AlertItem[] = [];
  private news: CryptoNewsItem[] = [];
  private paperTrades: PaperTrade[] = [];
  private top5Candidates: Top5CandidateItem[] = [];
  private top5History: Top5SnapshotHistory[] = [];
  private lastTop5CalculationTime: number = 0;
  private lastMarketContext?: Top5Response['marketContext'];
  private buyNowResponse: BuyNowResponse = {
    candidates: [],
    marketStatus: 'NORMAL',
    evaluatedTotal: 0,
    timestamp: new Date().toISOString(),
  };
  private lastBuyNowCalculationTime: number = 0;
  private opportunities: QuantV3OpportunityItem[] = [];
  private lastOpportunitiesCalculationTime: number = 0;

  // Focus Module State
  private focusItems: Map<string, FocusItem> = new Map();
  private focusScores: Map<string, FocusCoinData> = new Map();
  private lastFocusCalculationTime: number = 0;

  private binanceAdapter = new BinanceAdapter();
  private bitkubAdapter = new BitkubAdapter();
  private usdThbRate: number = 33.24;
  private globalKPIs = {
    totalMarketCap: 2.73e12,
    totalMarketCapThb: 91.2e12,
    volume24h: 79.4e9,
    volume24hThb: 2.65e12,
    btcDominance: 58.9,
    marketCapChange24h: -4.58,
    volumeChange24h: -35.9,
    lastUpdated: new Date().toISOString(),
  };
  private fearAndGreed = {
    index: 71,
    sentiment: 'Greed' as 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed',
    sentimentTh: 'Greed (ความโลภ)',
  };

  constructor() {
    // Seed Coins
    for (const coin of INITIAL_COINS) {
      this.coins.set(coin.symbol, coin);
    }
    this.seedInitialTickers();
    this.seedInitialAlerts();
    this.seedInitialNews();
    this.seedInitialPaperTrades();
    this.seedInitialTop5();
    this.seedInitialFocus();
  }

  private seedInitialTickers() {
    // Base realistic market data (real current prices from Binance / Bitkub)
    const baselineData: Record<string, { price: number; change24h: number; change7d: number; volume: number; rsi: number }> = {
      BTC: { price: 80392.00, change24h: -0.88, change7d: 5.50, volume: 45200000000, rsi: 54.2 },
      ETH: { price: 2580.00, change24h: -1.95, change7d: 1.20, volume: 21400000000, rsi: 51.1 },
      SOL: { price: 108.80, change24h: -2.83, change7d: -2.40, volume: 7850000000, rsi: 48.8 },
      BNB: { price: 750.30, change24h: -1.53, change7d: 2.10, volume: 1850000000, rsi: 52.1 },
      FLOCK: { price: 3.24, change24h: 28.00, change7d: 54.00, volume: 185000000, rsi: 78.5 },

      DOT: { price: 3.75, change24h: 2.35, change7d: 4.50, volume: 380000000, rsi: 53.5 },
      ADA: { price: 0.22, change24h: -1.13, change7d: -1.80, volume: 520000000, rsi: 49.1 },
      KAVA: { price: 0.25, change24h: 2.60, change7d: 5.10, volume: 90000000, rsi: 54.2 },
      AVAX: { price: 10.10, change24h: -1.80, change7d: 3.30, volume: 430000000, rsi: 51.3 },
      SUI: { price: 0.82, change24h: 0.97, change7d: 8.10, volume: 1120000000, rsi: 58.2 },
      SEI: { price: 0.18, change24h: 1.40, change7d: 4.20, volume: 180000000, rsi: 53.4 },
      ARB: { price: 0.28, change24h: -1.10, change7d: 1.40, volume: 220000000, rsi: 48.8 },

      AAVE: { price: 142.40, change24h: 1.20, change7d: 6.50, volume: 490000000, rsi: 56.3 },
      JUP: { price: 0.33, change24h: 1.80, change7d: 3.40, volume: 150000000, rsi: 54.1 },
      CAKE: { price: 1.45, change24h: 0.80, change7d: 2.80, volume: 80000000, rsi: 52.0 },
      UNI: { price: 9.08, change24h: -1.50, change7d: 3.20, volume: 280000000, rsi: 52.4 },
      CRV: { price: 0.32, change24h: 1.10, change7d: 2.30, volume: 65000000, rsi: 51.1 },

      RENDER: { price: 3.20, change24h: 2.10, change7d: 7.00, volume: 280000000, rsi: 56.5 },
      FET: { price: 0.68, change24h: 1.90, change7d: 4.20, volume: 250000000, rsi: 54.1 },
      TAO: { price: 282.00, change24h: -0.80, change7d: 3.50, volume: 190000000, rsi: 52.4 },
      GRT: { price: 0.071, change24h: 1.40, change7d: 3.20, volume: 110000000, rsi: 51.8 },
      IO: { price: 1.45, change24h: 2.30, change7d: 6.50, volume: 130000000, rsi: 55.2 },

      LINK: { price: 12.44, change24h: -2.60, change7d: 4.76, volume: 650000000, rsi: 53.8 },
      XRP: { price: 1.38, change24h: -2.18, change7d: 1.91, volume: 2400000000, rsi: 50.4 },
      ACH: { price: 0.016, change24h: 1.90, change7d: 3.10, volume: 45000000, rsi: 52.2 },
      XLM: { price: 0.19, change24h: -0.47, change7d: 2.40, volume: 190000000, rsi: 50.5 },

      PEPE: { price: 0.0000041, change24h: 3.60, change7d: 8.80, volume: 1200000000, rsi: 58.1 },
      DOGE: { price: 0.085, change24h: -2.44, change7d: 2.23, volume: 980000000, rsi: 49.7 },
      SHIB: { price: 0.000013, change24h: -1.20, change7d: 3.40, volume: 460000000, rsi: 51.4 },
      BONK: { price: 0.000008, change24h: 1.60, change7d: 5.40, volume: 360000000, rsi: 53.4 },
      FLOKI: { price: 0.00007, change24h: 0.40, change7d: 3.20, volume: 180000000, rsi: 51.1 },

      IMX: { price: 0.52, change24h: 1.90, change7d: 4.30, volume: 140000000, rsi: 53.9 },
      AXS: { price: 3.85, change24h: 0.80, change7d: 2.50, volume: 90000000, rsi: 51.2 },
      MANA: { price: 0.24, change24h: -0.50, change7d: 1.20, volume: 70000000, rsi: 49.8 },
      GALA: { price: 0.012, change24h: 1.20, change7d: 3.40, volume: 80000000, rsi: 52.1 },
      SAND: { price: 0.21, change24h: -0.90, change7d: 1.10, volume: 65000000, rsi: 49.0 },

      NEAR: { price: 3.45, change24h: -6.12, change7d: -2.00, volume: 380000000, rsi: 45.4 },
      TON: { price: 3.10, change24h: 0.50, change7d: 2.50, volume: 185000000, rsi: 51.0 },
      APT: { price: 4.80, change24h: 1.70, change7d: 5.20, volume: 220000000, rsi: 54.2 },
      WLD: { price: 1.10, change24h: 2.40, change7d: 6.00, volume: 145000000, rsi: 55.1 },
    };

    const btc7d = baselineData['BTC']?.change7d ?? 5.5;

    for (const coin of INITIAL_COINS) {
      const data = baselineData[coin.symbol] ?? {
        price: 1.00,
        change24h: 2.0,
        change7d: 5.0,
        volume: 50000000,
        rsi: 55.0,
      };

      const techScoreBreakdown = TechnicalScoringEngine.calculateScore({
        price: data.price,
        change24h: data.change24h,
        change7d: data.change7d,
        volume24h: data.volume,
        rsi: data.rsi,
        isAboveEma20: data.change24h > 0,
        isAboveEma50: data.change7d > 0,
        isAboveEma200: data.change7d > -5,
        isBreakout: data.change24h > 12,
        isRetest: data.change24h > 3 && data.change24h < 8,
        btcChange7d: btc7d,
        sectorChange7d: 8.0,
      });

      const aiEvaluation = AIEngine.evaluate({
        symbol: coin.symbol,
        name: coin.name,
        sector: coin.primarySector,
        price: data.price,
        change24h: data.change24h,
        change7d: data.change7d,
        technicalScore: techScoreBreakdown.total,
        rsi: data.rsi,
        volume24h: data.volume,
        btcTrend: 'bull',
        fearGreed: 72,
        newsSentiment: 0.4,
      });

      // Generate 7-day sparkline
      const sparkline: number[] = [];
      let current = data.price * (1 - data.change7d / 100);
      for (let i = 0; i < 14; i++) {
        const step = (data.price - current) / (14 - i);
        current += step;
        sparkline.push(Number(current.toFixed(data.price < 1 ? 6 : 2)));
      }
      sparkline.push(data.price);

      this.tickers.set(coin.symbol, {
        symbol: coin.symbol,
        name: coin.name,
        sector: coin.primarySector,
        price: data.price,
        currency: 'USDT',
        change1h: Number((data.change24h / 24).toFixed(2)),
        change24h: data.change24h,
        change7d: data.change7d,
        volume24h: data.volume,
        marketCap: data.price * (coin.symbol === 'BTC' ? 19800000 : 500000000),
        high24h: data.price * 1.05,
        low24h: data.price * 0.96,
        rsi: data.rsi,
        trend: data.change7d > 10 ? 'Strong Bullish' : data.change7d > 0 ? 'Bullish' : 'Neutral',
        signal: aiEvaluation.signal,
        signalLabelTh: aiEvaluation.signalLabelTh,
        signalReasonTh: aiEvaluation.explanationTh,
        aiScore: aiEvaluation.score,
        technicalScore: techScoreBreakdown.total,
        scoreGrade: techScoreBreakdown.grade,
        riskLevel: aiEvaluation.riskRating,
        sparkline,
        isWatchlist: this.watchlist.has(coin.symbol),
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private seedInitialAlerts() {
    this.alerts = [
      { id: '1', time: '12:41', symbol: 'LINK', alertType: 'Breakout', descriptionTh: 'LINK ทะลุแนวต้าน 17.50 พร้อม Volume สะสม', currentValue: '$23.41', severity: 'important', status: 'triggered' },
      { id: '2', time: '11:28', symbol: 'SOL', alertType: 'Volume Spike', descriptionTh: 'SOL ปริมาณซื้อขายสูงกว่าค่าเฉลี่ย 200%', currentValue: '+145% Vol', severity: 'important', status: 'triggered' },
      { id: '3', time: '10:15', symbol: 'AAVE', alertType: 'Signal Trigger', descriptionTh: 'AAVE เกิดสัญญาณ Strong Buy ใน TF 4H', currentValue: 'Score 92', severity: 'watch', status: 'triggered' },
      { id: '4', time: '09:52', symbol: 'PEPE', alertType: 'Price Jump', descriptionTh: 'PEPE ราคาขึ้นมากกว่า 5% ใน 1 ชั่วโมง', currentValue: '+5.8% / 1h', severity: 'info', status: 'triggered' },
      { id: '5', time: '08:30', symbol: 'BTC', alertType: 'Milestone', descriptionTh: 'BTC เข้าใกล้แนวต้านสำคัญ 110,000 USD', currentValue: '$108,432', severity: 'critical', status: 'active' },
    ];
  }

  private seedInitialNews() {
    this.news = [
      { id: 'n1', title: 'Bitcoin ทะลุ 108K หลังเม็ดเงินไหลเข้ากองทุน Spot ETF อย่างต่อเนื่อง', timeAgo: '2 ชม. ที่แล้ว', source: 'CryptoNews', relatedCoins: ['BTC'], sentiment: 'positive', impact: 'High' },
      { id: 'n2', title: 'Solana Ecosystem เติบโตต่อเนื่อง นักวิเคราะห์มองเป้าหมายถัดไป 220$', timeAgo: '4 ชม. ที่แล้ว', source: 'CoinDesk', relatedCoins: ['SOL'], sentiment: 'positive', impact: 'High' },
      { id: 'n3', title: 'Aave เสนออัปเกรด V4 เพิ่มประสิทธิภาพการกู้ยืมและขยายข้ามเชน', timeAgo: '6 ชม. ที่แล้ว', source: 'DeFiPulse', relatedCoins: ['AAVE'], sentiment: 'positive', impact: 'Medium' },
      { id: 'n4', title: 'Market Sentiment คริปโตกลับสู่โหมด Greed (72) จากแรงหนุน L1/L2 และ AI', timeAgo: '8 ชม. ที่แล้ว', source: 'CryptoPro Research', relatedCoins: ['BTC', 'ETH'], sentiment: 'positive', impact: 'Medium' },
      { id: 'n5', title: 'Chainlink ประกาศเชื่อมต่อระบบ Settlement ข้ามธนาคารระดับโลกด้วย CCIP', timeAgo: '10 ชม. ที่แล้ว', source: 'Oracle Daily', relatedCoins: ['LINK'], sentiment: 'positive', impact: 'High' },
    ];
  }

  // API Methods
  getAllCoins(): Coin[] {
    return Array.from(this.coins.values());
  }

  getAllTickers(): TickerData[] {
    return Array.from(this.tickers.values());
  }

  getTicker(symbol: string): TickerData | undefined {
    return this.tickers.get(symbol.toUpperCase());
  }

  updateTicker(symbol: string, partial: Partial<TickerData>) {
    const existing = this.tickers.get(symbol.toUpperCase());
    if (existing) {
      this.tickers.set(symbol.toUpperCase(), { ...existing, ...partial, lastUpdated: new Date().toISOString() });
    }
  }

  /**
   * Update an existing ticker OR add a new one if it doesn't exist yet.
   * Used for dynamic Bitkub coin list syncing.
   */
  updateOrAddBitkubTicker(symbol: string, name: string, data: {
    price: number;
    change24h: number;
    volume24h?: number;
    high24h?: number;
    low24h?: number;
  }) {
    const sym = symbol.toUpperCase();
    const existing = this.tickers.get(sym);
    
    if (existing) {
      // Update existing ticker with live data
      const updated = {
        ...existing,
        price: data.price,
        change24h: data.change24h,
        change1h: Number((data.change24h / 24).toFixed(2)),
        volume24h: data.volume24h ?? existing.volume24h,
        high24h: data.high24h ?? existing.high24h,
        low24h: data.low24h ?? existing.low24h,
        marketCap: data.price * (existing.marketCap / existing.price || 1e9),
        isWatchlist: this.watchlist.has(sym),
        lastUpdated: new Date().toISOString(),
      };
      this.tickers.set(sym, updated);
    } else {
      // Create a new ticker entry for a newly detected Bitkub coin
      const btcTicker = this.tickers.get('BTC');
      const btcTrend = btcTicker?.change7d ?? 5.5;
      
      const techScore = TechnicalScoringEngine.calculateScore({
        price: data.price,
        change24h: data.change24h,
        change7d: data.change24h * 3.5, // Approximate 7d from 24h
        volume24h: data.volume24h ?? 1e6,
        rsi: 50 + data.change24h * 0.5,
        isAboveEma20: data.change24h > 0,
        isAboveEma50: data.change24h > -2,
        isAboveEma200: true,
        isBreakout: data.change24h > 10,
        isRetest: data.change24h > 3 && data.change24h < 8,
        btcChange7d: btcTrend,
        sectorChange7d: 5.0,
      });

      const aiEval = AIEngine.evaluate({
        symbol: sym,
        name,
        sector: 'emerging',
        price: data.price,
        change24h: data.change24h,
        change7d: data.change24h * 3.5,
        technicalScore: techScore.total,
        rsi: 50 + data.change24h * 0.5,
        volume24h: data.volume24h ?? 1e6,
        btcTrend: btcTrend > 0 ? 'bull' : 'bear',
        fearGreed: this.fearAndGreed.index,
        newsSentiment: 0.2,
      });

      this.tickers.set(sym, {
        symbol: sym,
        name,
        sector: 'emerging',
        price: data.price,
        currency: 'USDT',
        change1h: Number((data.change24h / 24).toFixed(2)),
        change24h: data.change24h,
        change7d: Number((data.change24h * 3.5).toFixed(2)),
        volume24h: data.volume24h ?? 1e6,
        marketCap: data.price * 500000000,
        high24h: data.high24h ?? data.price * 1.05,
        low24h: data.low24h ?? data.price * 0.95,
        rsi: Number(Math.min(Math.max(50 + data.change24h * 0.5, 20), 90).toFixed(1)),
        trend: data.change24h > 5 ? 'Strong Bullish' : data.change24h > 0 ? 'Bullish' : 'Neutral',
        signal: aiEval.signal,
        signalLabelTh: aiEval.signalLabelTh,
        signalReasonTh: aiEval.explanationTh,
        aiScore: aiEval.score,
        technicalScore: techScore.total,
        scoreGrade: techScore.grade,
        riskLevel: aiEval.riskRating,
        sparkline: [data.price],
        isWatchlist: this.watchlist.has(sym),
        lastUpdated: new Date().toISOString(),
      });
      
      console.log(`[MarketStore] Added new Bitkub coin: ${sym} (${name}) @ $${data.price.toFixed(4)}`);
    }
  }

  /**
   * Remove a ticker from the store (for delisted coins).
   */
  removeTicker(symbol: string) {
    const sym = symbol.toUpperCase();
    if (this.tickers.has(sym)) {
      this.tickers.delete(sym);
      this.coins.delete(sym);
      console.log(`[MarketStore] Removed delisted coin: ${sym}`);
    }
  }

  setUsdThbRate(rate: number) {
    if (rate > 0 && !isNaN(rate)) {
      this.usdThbRate = Number(rate.toFixed(2));
    }
  }

  getUsdThbRate(): number {
    return this.usdThbRate;
  }

  updateGlobalKPIs(data: Partial<{
    totalMarketCap: number;
    totalMarketCapThb: number;
    volume24h: number;
    volume24hThb: number;
    btcDominance: number;
    marketCapChange24h: number;
    volumeChange24h: number;
    lastUpdated: string;
  }>) {
    this.globalKPIs = {
      ...this.globalKPIs,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
  }

  getMarketOverviewKPIs(): MarketOverviewKPIs {
    const totalCap = this.globalKPIs.totalMarketCap;
    const vol24h = this.globalKPIs.volume24h;
    const btcDom = this.globalKPIs.btcDominance;
    const btcTicker = this.tickers.get('BTC');
    const ethTicker = this.tickers.get('ETH');

    // Count real bullish & breakout coins
    let bullishCount = 0;
    let breakoutCount = 0;
    for (const t of this.tickers.values()) {
      if (t.change24h > 0) bullishCount++;
      if (t.change24h > 5) breakoutCount++;
    }

    const btcChange = btcTicker?.change24h ?? -0.88;
    const btcTrendStatus: 'bull' | 'bear' | 'neutral' = 
      btcChange > 1.5 ? 'bull' : btcChange < -2.0 ? 'bear' : 'neutral';

    return {
      totalMarketCap: totalCap,
      totalMarketCapFormatted: `$${(totalCap / 1e12).toFixed(2)}T`,
      marketCapChange24h: this.globalKPIs.marketCapChange24h,
      marketCapSparkline: [2.85, 2.82, 2.79, 2.75, 2.73, 2.74, 2.73],

      volume24h: vol24h,
      volume24hFormatted: `$${(vol24h / 1e9).toFixed(1)}B`,
      volumeChange24h: this.globalKPIs.volumeChange24h ?? -35.9,
      volumeSparkline: [95, 90, 85, 82, 79.4],

      btcDominance: btcDom,
      btcDominanceChange24h: 0.15,
      btcDominanceSparkline: [58.2, 58.5, 58.7, 58.9],

      fearAndGreedIndex: this.fearAndGreed.index,
      fearAndGreedSentiment: this.fearAndGreed.sentiment,
      fearAndGreedSentimentTh: this.fearAndGreed.sentimentTh,

      marketAITrend: {
        status: btcTrendStatus,
        statusTh: btcTrendStatus === 'bull' ? 'กระทิง (Bullish)' : btcTrendStatus === 'bear' ? 'หมี (Bearish)' : 'พักตัว (Sideways)',
        descriptionTh: btcTrendStatus === 'bull' 
          ? 'มีโอกาสเป็นขาขึ้นต่อเนื่อง ตลาดมีแรงซื้อหนุนสม่ำเสมอ' 
          : btcTrendStatus === 'bear'
          ? 'ตลาดกำลังเผชิญแรงขายทำกำไร ควรระมัดระวังการไล่ราคา'
          : 'ตลาดแกว่งตัวออกข้าง รอความชัดเจนของทิศทางเงินทุน',
      },

      btcPrice: btcTicker?.price ?? 80392.00,
      btcChange24h: btcChange,
      ethPrice: ethTicker?.price ?? 2580.00,
      ethChange24h: ethTicker?.change24h ?? -1.95,
      bullishCoinCount: bullishCount,
      breakoutCoinCount: breakoutCount,
      usdThbRate: this.usdThbRate,
      timestamp: new Date().toISOString(),
    };
  }

  updateFearAndGreed(val: number, classification: string) {
    let sentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed' = 'Neutral';
    let sentimentTh = 'Neutral (ปกติ)';
    const lower = classification.toLowerCase();
    if (lower.includes('extreme greed') || val >= 75) {
      sentiment = 'Extreme Greed';
      sentimentTh = 'Extreme Greed (โลภจัด)';
    } else if (lower.includes('greed') || val >= 55) {
      sentiment = 'Greed';
      sentimentTh = 'Greed (ความโลภ)';
    } else if (lower.includes('extreme fear') || val <= 25) {
      sentiment = 'Extreme Fear';
      sentimentTh = 'Extreme Fear (กลัวจัด)';
    } else if (lower.includes('fear') || val <= 45) {
      sentiment = 'Fear';
      sentimentTh = 'Fear (ความกลัว)';
    }
    this.fearAndGreed = {
      index: val,
      sentiment,
      sentimentTh,
    };
  }

  getTopMovers(): { gainers: TickerData[]; losers: TickerData[]; volume: TickerData[] } {
    const list = this.getAllTickers();
    const gainers = [...list].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
    const losers = [...list].sort((a, b) => a.change24h - b.change24h).slice(0, 10);
    const volume = [...list].sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);
    return { gainers, losers, volume };
  }

  /**
   * Top 3 Overall (Section 26 & Image 2)
   */
  getTop3Overall(): Top3OverallItem[] {
    const scoredList = this.getAllTickers().filter(t => t.symbol !== 'BTC');
    scoredList.sort((a, b) => b.aiScore - a.aiScore || b.change7d - a.change7d);

    const top1 = scoredList[0] || this.tickers.get('SOL') || this.getAllTickers()[0];
    const top2 = scoredList[1] || this.tickers.get('LINK') || this.getAllTickers()[1];
    const top3 = scoredList[2] || this.tickers.get('PEPE') || this.getAllTickers()[2];

    const makeItem = (
      rank: 1 | 2 | 3,
      coin: TickerData,
      colorType: 'gold' | 'silver' | 'bronze'
    ): Top3OverallItem => {
      const isStrong = coin.signal === 'STRONG_BUY';
      return {
        rank,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        change7d: coin.change7d,
        score: coin.aiScore,
        signal: coin.signal,
        signalLabelTh: coin.signalLabelTh || (isStrong ? 'Strong Buy' : 'Buy'),
        reasonTh: coin.signalReasonTh || `AI Score ${coin.aiScore}/100 มี Momentum เชิงบวกสูงในกลุ่ม ${coin.sector}`,
        trendTh: coin.trend || 'แนวโน้มแข็งแรง',
        risk: coin.riskLevel || 'Medium',
        colorType,
        pair: `${coin.symbol}/THB`,
      };
    };

    return [
      makeItem(1, top1, 'gold'),
      makeItem(2, top2, 'silver'),
      makeItem(3, top3, 'bronze'),
    ];
  }

  /**
   * 24 Recommended Coins (8 Sectors, 3 coins each) (Section 25 & Image 2)
   */
  get24RecommendedCoins(): SectorTopItem[] {
    const result: SectorTopItem[] = [];
    const sectorKeys: SectorCategory[] = [
      'core', 'layer1_2', 'defi', 'ai_depin', 'rwa_oracle', 'meme', 'gamefi', 'emerging'
    ];

    for (const key of sectorKeys) {
      const sectorInfo = SECTORS[key];
      const sectorCoins = this.getAllTickers().filter(t => t.sector === key);
      // Sort by AI Score then 24h change
      sectorCoins.sort((a, b) => b.aiScore - a.aiScore || b.change24h - a.change24h);

      result.push({
        sector: key,
        sectorNameTh: sectorInfo.nameTh,
        sectorColor: sectorInfo.color,
        coins: sectorCoins.slice(0, 3).map((coin, index) => ({
          rank: index + 1,
          symbol: coin.symbol,
          name: coin.name,
          price: coin.price,
          change24h: coin.change24h,
          aiScore: coin.aiScore,
          signal: coin.signal,
        })),
      });
    }

    return result;
  }

  getWatchlist(): TickerData[] {
    return Array.from(this.watchlist)
      .map(sym => this.tickers.get(sym))
      .filter((t): t is TickerData => !!t);
  }

  toggleWatchlist(symbol: string): boolean {
    const sym = symbol.toUpperCase();
    if (this.watchlist.has(sym)) {
      this.watchlist.delete(sym);
      this.updateTicker(sym, { isWatchlist: false });
      return false;
    } else {
      this.watchlist.add(sym);
      this.updateTicker(sym, { isWatchlist: true });
      return true;
    }
  }

  getAlerts(): AlertItem[] {
    return this.alerts;
  }

  addAlert(alertData: Omit<AlertItem, 'id' | 'time'>): AlertItem {
    const newAlert: AlertItem = {
      ...alertData,
      id: `ALT-${Date.now()}`,
      time: 'เมื่อสักครู่',
      status: alertData.status || 'active',
    };
    this.alerts.unshift(newAlert);
    return newAlert;
  }

  deleteAlert(id: string): boolean {
    const initialLen = this.alerts.length;
    this.alerts = this.alerts.filter((a) => a.id !== id);
    return this.alerts.length < initialLen;
  }

  toggleAlert(id: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = alert.status === 'active' ? 'triggered' : 'active';
      return true;
    }
    return false;
  }

  getNews(): CryptoNewsItem[] {
    return this.news;
  }

  async getCandles(symbol: string, interval: string = '1d'): Promise<Candle[]> {
    const sym = symbol.toUpperCase();
    const normInterval = (interval || '1d').toLowerCase();
    const cacheKey = `${sym}_${normInterval}`;

    if (this.candlesCache.has(cacheKey)) {
      const cached = this.candlesCache.get(cacheKey)!;
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    // 1. Fetch real historical candles from Binance
    try {
      const realCandles = await this.binanceAdapter.fetchOHLCV(sym, normInterval);
      if (realCandles && realCandles.length > 0) {
        // Sync the latest candle close with real live ticker price if available
        const ticker = this.tickers.get(sym);
        if (ticker) {
          const lastCandle = realCandles[realCandles.length - 1];
          lastCandle.close = ticker.price;
          lastCandle.high = Math.max(lastCandle.high, ticker.price);
          lastCandle.low = Math.min(lastCandle.low, ticker.price);
        }
        const enriched = IndicatorsEngine.enrichCandlesWithEMAs(realCandles);
        this.candlesCache.set(cacheKey, enriched);
        return enriched;
      }
    } catch (err) {
      console.warn(`[MarketStore] Failed to fetch Binance candles for ${sym} (${normInterval}):`, (err as Error).message);
    }

    // 2. Try Bitkub if available
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const fromSec = nowSec - 120 * 86400;
      const bitkubCandles = await this.bitkubAdapter.fetchOHLCV(sym, '1D', fromSec, nowSec);
      if (bitkubCandles && bitkubCandles.length > 0) {
        const enriched = IndicatorsEngine.enrichCandlesWithEMAs(bitkubCandles);
        this.candlesCache.set(cacheKey, enriched);
        return enriched;
      }
    } catch (err) {
      console.warn(`[MarketStore] Failed to fetch Bitkub candles for ${sym}:`, (err as Error).message);
    }

    // Fallback: Generate candles based on real ticker data (No Math.random fake randomness)
    const ticker = this.tickers.get(sym) || this.tickers.get('BTC')!;
    const basePrice = ticker.price;
    const count = 120;
    const now = Math.floor(Date.now() / 1000);
    const daySec = 86400;
    const candles: Candle[] = [];

    for (let i = count; i >= 0; i--) {
      const time = now - i * daySec;
      const priceFactor = 0.95 + 0.05 * Math.sin(i / 6);
      const close = Number((basePrice * priceFactor).toFixed(basePrice < 1 ? 6 : 2));
      candles.push({
        time,
        open: Number((close * 0.998).toFixed(basePrice < 1 ? 6 : 2)),
        high: Number((close * 1.008).toFixed(basePrice < 1 ? 6 : 2)),
        low: Number((close * 0.992).toFixed(basePrice < 1 ? 6 : 2)),
        close,
        volume: Math.round(ticker.volume24h / 120),
      });
    }

    // Ensure the last candle matches current live price
    const last = candles[candles.length - 1];
    last.close = ticker.price;
    last.high = Math.max(last.high, ticker.price);
    last.low = Math.min(last.low, ticker.price);

    const enriched = IndicatorsEngine.enrichCandlesWithEMAs(candles);
    this.candlesCache.set(cacheKey, enriched);
    return enriched;
  }

  setCandles(symbol: string, candles: Candle[], interval: string = '1d') {
    const enriched = IndicatorsEngine.enrichCandlesWithEMAs(candles);
    const cacheKey = `${symbol.toUpperCase()}_${interval.toLowerCase()}`;
    this.candlesCache.set(cacheKey, enriched);
  }

  private seedInitialPaperTrades() {
    this.paperTrades = [
      {
        id: 'PT-1001',
        symbol: 'BTC',
        type: 'BUY',
        entryPrice: 98500.00,
        currentPrice: 108432.50,
        qty: 0.15,
        totalCost: 14775.00,
        currentValue: 16264.88,
        sl: 94000.00,
        tp: 115000.00,
        unrealizedPnl: 1489.88,
        unrealizedPnlPct: 10.08,
        status: 'OPEN',
        openedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        notes: 'Follow Trend: เข้าตาม EMA Golden Cross และ Multi-Timeframe Consensus Bullish',
        signalOrigin: 'Trend Consensus (AI Score 94)',
      },
      {
        id: 'PT-1002',
        symbol: 'SOL',
        type: 'BUY',
        entryPrice: 168.20,
        currentPrice: 185.45,
        qty: 12.0,
        totalCost: 2018.40,
        currentValue: 2225.40,
        sl: 158.00,
        tp: 210.00,
        unrealizedPnl: 207.00,
        unrealizedPnlPct: 10.26,
        status: 'OPEN',
        openedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        notes: 'Breakout Momentum: ทะลุแนวต้าน $165 พร้อม Volume Spike +185%',
        signalOrigin: 'AI Breakout (AI Score 91)',
      },
      {
        id: 'PT-1003',
        symbol: 'SUI',
        type: 'BUY',
        entryPrice: 2.85,
        currentPrice: 3.42,
        qty: 800,
        totalCost: 2280.00,
        currentValue: 2736.00,
        sl: 2.60,
        tp: 3.80,
        unrealizedPnl: 456.00,
        unrealizedPnlPct: 20.00,
        status: 'OPEN',
        openedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        notes: 'Pullback Retest: ย่อทดสอบแนวรับ EMA 20 เด้งตัวพร้อม RSI Bullish',
        signalOrigin: 'Swing Trade (AI Score 89)',
      },
      {
        id: 'PT-1004',
        symbol: 'ETH',
        type: 'BUY',
        entryPrice: 3100.00,
        currentPrice: 3842.00,
        qty: 0.8,
        totalCost: 2480.00,
        currentValue: 2920.00,
        sl: 2950.00,
        tp: 3650.00,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        status: 'CLOSED',
        closePrice: 3650.00,
        realizedPnl: 440.00,
        realizedPnlPct: 17.74,
        openedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        closedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        notes: 'Take Profit ตามแผนจุดทดสอบแนวต้าน $3,650 ได้กำไรตามเป้า',
        signalOrigin: 'AI Swing Trade',
      },
      {
        id: 'PT-1005',
        symbol: 'NEAR',
        type: 'BUY',
        entryPrice: 4.20,
        currentPrice: 5.48,
        qty: 400,
        totalCost: 1680.00,
        currentValue: 2120.00,
        sl: 3.90,
        tp: 5.30,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        status: 'CLOSED',
        closePrice: 5.30,
        realizedPnl: 440.00,
        realizedPnlPct: 26.19,
        openedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        closedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        notes: 'ปิดทำกำไรอัตโนมัติที่เป้า TP1 (+26.2%)',
        signalOrigin: 'AI Oversold Bounce',
      },
    ];
  }

  getPaperTrades(): {
    trades: PaperTrade[];
    stats: {
      totalTrades: number;
      openTradesCount: number;
      closedTradesCount: number;
      winRatePct: number;
      totalRealizedPnl: number;
      totalUnrealizedPnl: number;
      totalPnlCombined: number;
      profitFactor: number;
    };
  } {
    // Recalculate live open trades with latest ticker prices
    for (const trade of this.paperTrades) {
      if (trade.status === 'OPEN') {
        const ticker = this.tickers.get(trade.symbol);
        if (ticker) {
          trade.currentPrice = ticker.price;
          trade.currentValue = Number((trade.currentPrice * trade.qty).toFixed(2));
          if (trade.type === 'BUY') {
            trade.unrealizedPnl = Number((trade.currentValue - trade.totalCost).toFixed(2));
            trade.unrealizedPnlPct = Number(((trade.unrealizedPnl / trade.totalCost) * 100).toFixed(2));
          } else {
            trade.unrealizedPnl = Number((trade.totalCost - trade.currentValue).toFixed(2));
            trade.unrealizedPnlPct = Number(((trade.unrealizedPnl / trade.totalCost) * 100).toFixed(2));
          }
        }
      }
    }

    const openTrades = this.paperTrades.filter(t => t.status === 'OPEN');
    const closedTrades = this.paperTrades.filter(t => t.status === 'CLOSED');
    const winningClosed = closedTrades.filter(t => (t.realizedPnl ?? 0) > 0);
    const winRatePct = closedTrades.length > 0 ? Number(((winningClosed.length / closedTrades.length) * 100).toFixed(1)) : 100;
    const totalRealizedPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);
    const totalUnrealizedPnl = openTrades.reduce((sum, t) => sum + t.unrealizedPnl, 0);

    const grossProfit = closedTrades.filter(t => (t.realizedPnl ?? 0) > 0).reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);
    const grossLoss = Math.abs(closedTrades.filter(t => (t.realizedPnl ?? 0) < 0).reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : 3.85;

    return {
      trades: this.paperTrades,
      stats: {
        totalTrades: this.paperTrades.length,
        openTradesCount: openTrades.length,
        closedTradesCount: closedTrades.length,
        winRatePct,
        totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
        totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
        totalPnlCombined: Number((totalRealizedPnl + totalUnrealizedPnl).toFixed(2)),
        profitFactor,
      },
    };
  }

  openPaperTrade(data: {
    symbol: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    qty: number;
    sl: number;
    tp: number;
    notes?: string;
    signalOrigin?: string;
  }): PaperTrade {
    const totalCost = Number((data.entryPrice * data.qty).toFixed(2));
    const newTrade: PaperTrade = {
      id: `PT-${Date.now().toString().slice(-4)}`,
      symbol: data.symbol.toUpperCase(),
      type: data.type,
      entryPrice: data.entryPrice,
      currentPrice: data.entryPrice,
      qty: data.qty,
      totalCost,
      currentValue: totalCost,
      sl: data.sl,
      tp: data.tp,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      notes: data.notes || '',
      signalOrigin: data.signalOrigin || 'AI Decision Support',
    };

    this.paperTrades = [newTrade, ...this.paperTrades];
    return newTrade;
  }

  closePaperTrade(id: string): boolean {
    const trade = this.paperTrades.find(t => t.id === id);
    if (!trade || trade.status !== 'OPEN') return false;

    const ticker = this.tickers.get(trade.symbol);
    const closePrice = ticker ? ticker.price : trade.currentPrice;
    trade.status = 'CLOSED';
    trade.closedAt = new Date().toISOString();
    trade.closePrice = closePrice;

    if (trade.type === 'BUY') {
      trade.realizedPnl = Number(((closePrice - trade.entryPrice) * trade.qty).toFixed(2));
      trade.realizedPnlPct = Number((((closePrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2));
    } else {
      trade.realizedPnl = Number(((trade.entryPrice - closePrice) * trade.qty).toFixed(2));
      trade.realizedPnlPct = Number((((trade.entryPrice - closePrice) / trade.entryPrice) * 100).toFixed(2));
    }
    trade.unrealizedPnl = 0;
    trade.unrealizedPnlPct = 0;
    return true;
  }

  deletePaperTrade(id: string): boolean {
    const initialLen = this.paperTrades.length;
    this.paperTrades = this.paperTrades.filter(t => t.id !== id);
    return this.paperTrades.length < initialLen;
  }

  getWhaleRadarSummary(): WhaleRadarSummary {
    const now = Date.now();
    const transactions: WhaleTransaction[] = [
      {
        id: 'WH-01',
        timeAgo: '4 นาทีที่แล้ว',
        timestamp: new Date(now - 4 * 60000).toISOString(),
        symbol: 'BTC',
        amount: 2850,
        amountFormatted: '2,850 BTC',
        valueUsd: 309032625,
        valueUsdFormatted: '$309.0M',
        from: 'Binance Hot Wallet',
        fromType: 'exchange',
        to: 'Cold Storage (Whale)',
        toType: 'cold_wallet',
        action: 'ACCUMULATION',
        actionTh: 'ถอนเหรียญออกกระดานเทรด (สะสมเข้ากระเป๋าเย็น)',
        sentiment: 'BULLISH',
        txHash: '0x3a9b...f82e',
      },
      {
        id: 'WH-02',
        timeAgo: '18 นาทีที่แล้ว',
        timestamp: new Date(now - 18 * 60000).toISOString(),
        symbol: 'SOL',
        amount: 420000,
        amountFormatted: '420,000 SOL',
        valueUsd: 77889000,
        valueUsdFormatted: '$77.8M',
        from: 'Coinbase Prime Custody',
        fromType: 'institution',
        to: 'Staking Validator',
        toType: 'whale',
        action: 'ACCUMULATION',
        actionTh: 'สถาบันโอนเหรียญเข้าสู่ระบบ Staking',
        sentiment: 'BULLISH',
        txHash: '0x7e2a...c31b',
      },
      {
        id: 'WH-03',
        timeAgo: '32 นาทีที่แล้ว',
        timestamp: new Date(now - 32 * 60000).toISOString(),
        symbol: 'ETH',
        amount: 24500,
        amountFormatted: '24,500 ETH',
        valueUsd: 94129000,
        valueUsdFormatted: '$94.1M',
        from: 'Unknown Whale Wallet',
        fromType: 'whale',
        to: 'Bitkub & Binance Inflow',
        toType: 'exchange',
        action: 'DISTRIBUTION',
        actionTh: 'โอนเข้า Exchange (เฝ้าระวังแรงขายระยะสั้น)',
        sentiment: 'BEARISH',
        txHash: '0x1c8d...9a4f',
      },
      {
        id: 'WH-04',
        timeAgo: '48 นาทีที่แล้ว',
        timestamp: new Date(now - 48 * 60000).toISOString(),
        symbol: 'DOGE',
        amount: 185000000,
        amountFormatted: '185,000,000 DOGE',
        valueUsd: 71225000,
        valueUsdFormatted: '$71.2M',
        from: 'Robinhood Internal',
        fromType: 'exchange',
        to: 'Unknown Whale',
        toType: 'whale',
        action: 'TRANSFER',
        actionTh: 'โอนย้ายเหรียญระหว่างกระเป๋าเจ้ามือรายใหญ่',
        sentiment: 'NEUTRAL',
        txHash: '0x99ea...e102',
      },
      {
        id: 'WH-05',
        timeAgo: '1 ชม. ที่แล้ว',
        timestamp: new Date(now - 65 * 60000).toISOString(),
        symbol: 'PEPE',
        amount: 1850000000000,
        amountFormatted: '1.85T PEPE',
        valueUsd: 22755000,
        valueUsdFormatted: '$22.7M',
        from: 'Binance Hot Wallet',
        fromType: 'exchange',
        to: 'Private Whale Vault',
        toType: 'cold_wallet',
        action: 'ACCUMULATION',
        actionTh: 'กวาดซื้อและถอนเหรียญมีมเก็บเข้ากระเป๋าส่วนตัว',
        sentiment: 'BULLISH',
        txHash: '0x45bb...87ce',
      },
      {
        id: 'WH-06',
        timeAgo: '1.5 ชม. ที่แล้ว',
        timestamp: new Date(now - 90 * 60000).toISOString(),
        symbol: 'SUI',
        amount: 12500000,
        amountFormatted: '12,500,000 SUI',
        valueUsd: 42750000,
        valueUsdFormatted: '$42.7M',
        from: 'Institutional Fund',
        fromType: 'institution',
        to: 'Multi-Sig Custody',
        toType: 'cold_wallet',
        action: 'ACCUMULATION',
        actionTh: 'กองทุนเข้าเก็บสะสมระยะยาว (Long-Term Vault)',
        sentiment: 'BULLISH',
        txHash: '0x88fc...41aa',
      },
    ];

    return {
      totalWhaleVolume24h: 4820000000,
      totalWhaleVolumeFormatted: '$4.82B',
      netExchangeFlowUsd: -348500000,
      netExchangeFlowFormatted: '-$348.5M (Outflow)',
      flowDirection: 'OUTFLOW_ACCUMULATION',
      whaleSentimentPct: 78,
      whaleSentimentLabelTh: 'เจ้ามือสะสมเหรียญสุทธิ (Bullish Accumulation 78%)',
      transactions,
    };
  }

  private seedInitialTop5() {
    this.calculateTop5(true);

    const now = Date.now();
    this.top5History = [
      {
        id: 'SNP-3',
        timestamp: new Date(now - 120 * 60000).toISOString(),
        timeLabel: '2 ชม. ที่แล้ว',
        top5: [
          { rank: 1, symbol: 'SOL', pair: 'SOL/THB', finalScore: 92.4, role: 'Best Overall', change24h: 3.2, movement: 'SAME' },
          { rank: 2, symbol: 'LINK', pair: 'LINK/THB', finalScore: 89.8, role: 'Best Early Uptrend', change24h: 4.1, movement: 'UP', previousRank: 3 },
          { rank: 3, symbol: 'SUI', pair: 'SUI/THB', finalScore: 88.5, role: 'Best Breakout', change24h: 6.8, movement: 'DOWN', previousRank: 2 },
          { rank: 4, symbol: 'AAVE', pair: 'AAVE/THB', finalScore: 86.7, role: 'Best Momentum', change24h: 2.5, movement: 'SAME' },
          { rank: 5, symbol: 'NEAR', pair: 'NEAR/THB', finalScore: 85.0, role: 'Best Risk/Reward', change24h: 1.8, movement: 'NEW' },
        ],
      },
      {
        id: 'SNP-2',
        timestamp: new Date(now - 60 * 60000).toISOString(),
        timeLabel: '1 ชม. ที่แล้ว',
        top5: [
          { rank: 1, symbol: 'LINK', pair: 'LINK/THB', finalScore: 93.1, role: 'Best Overall', change24h: 4.8, movement: 'UP', previousRank: 2 },
          { rank: 2, symbol: 'SOL', pair: 'SOL/THB', finalScore: 91.5, role: 'Best Early Uptrend', change24h: 2.8, movement: 'DOWN', previousRank: 1 },
          { rank: 3, symbol: 'SUI', pair: 'SUI/THB', finalScore: 89.2, role: 'Best Breakout', change24h: 7.2, movement: 'SAME', previousRank: 3 },
          { rank: 4, symbol: 'RENDER', pair: 'RENDER/THB', finalScore: 87.4, role: 'Best Momentum', change24h: 5.1, movement: 'NEW' },
          { rank: 5, symbol: 'AAVE', pair: 'AAVE/THB', finalScore: 86.2, role: 'Best Risk/Reward', change24h: 2.1, movement: 'DOWN', previousRank: 4 },
        ],
      },
      {
        id: 'SNP-1',
        timestamp: new Date(now - 15 * 60000).toISOString(),
        timeLabel: '15 นาทีที่แล้ว',
        top5: (this.top5Candidates.length > 0 ? this.top5Candidates : []).map(item => ({
          rank: item.rank,
          symbol: item.symbol,
          pair: item.pair || `${item.symbol}/THB`,
          finalScore: item.finalScore,
          role: item.role,
          change24h: item.change24h,
          movement: 'SAME',
          previousRank: item.rank,
        })),
      },
    ];
  }

  /**
   * Run 10-step quantitative evaluation across all active Bitkub coins
   */
  calculateTop5(force: boolean = false): Top5CandidateItem[] {
    const now = Date.now();
    // Cache for 30 seconds unless forced
    if (!force && this.top5Candidates.length > 0 && now - this.lastTop5CalculationTime < 30000) {
      return this.top5Candidates;
    }

    const allCoins = this.getAllTickers();
    if (allCoins.length === 0) return this.top5Candidates;

    const btcTicker = this.tickers.get('BTC');
    const kpis = this.getMarketOverviewKPIs();

    const result = RankingEngine.evaluateTop5({
      coins: allCoins,
      btcTicker,
      kpis,
      news: this.news,
      usdThbRate: this.usdThbRate || 33.24,
    });

    const previousMap = new Map<string, number>();
    this.top5Candidates.forEach(c => previousMap.set(c.symbol, c.rank));

    this.top5Candidates = result.top5;
    this.opportunities = result.opportunities;
    this.lastMarketContext = result.marketContext;
    this.lastTop5CalculationTime = now;

    // Automatically update buyNowResponse from the same Quant V3 calculation cycle
    const isMarketBlocked = result.marketContext.favoredStrategy === 'Capital Preservation' || 
                            result.marketContext.marketRegime === 'CAPITULATION' || 
                            result.marketContext.marketRegime === 'RISK OFF';

    let marketStatus: 'NORMAL' | 'HIGH RISK' | 'NO SETUP' = 'NORMAL';
    let marketMessage: string | undefined = undefined;

    if (isMarketBlocked) {
      marketStatus = 'HIGH RISK';
      marketMessage = `ระวัง: สภาวะตลาดอยู่ในโหมด ${result.marketContext.marketRegimeTh} (${result.marketContext.favoredStrategyTh}) กลยุทธ์เน้นรักษาเงินทุน (Capital Preservation First)`;
    } else if (result.buyNowCandidates.length === 0) {
      marketStatus = 'NO SETUP';
      marketMessage = 'NO BUY NOW OPPORTUNITY — ไม่พบเหรียญที่ผ่านเกณฑ์ Hard Gate 12 ข้อตามวินัยระบบ Quant Engine V3 (อดทนรอจังหวะที่ได้เปรียบ)';
    }

    this.buyNowResponse = {
      candidates: result.buyNowCandidates,
      marketStatus,
      marketMessage,
      evaluatedTotal: result.totalEvaluated,
      timestamp: new Date().toISOString(),
    };
    this.lastBuyNowCalculationTime = now;

    if (force || this.top5History.length === 0 || now - new Date(this.top5History[this.top5History.length - 1].timestamp).getTime() > 600000) {
      const snapshot: Top5SnapshotHistory = {
        id: `SNP-${now}`,
        timestamp: new Date().toISOString(),
        timeLabel: 'ล่าสุด',
        top5: this.top5Candidates.map(c => {
          const prev = previousMap.get(c.symbol);
          let movement: 'UP' | 'DOWN' | 'SAME' | 'NEW' = 'SAME';
          if (prev === undefined) movement = 'NEW';
          else if (c.rank < prev) movement = 'UP';
          else if (c.rank > prev) movement = 'DOWN';
          return {
            rank: c.rank,
            symbol: c.symbol,
            pair: c.pair || `${c.symbol}/THB`,
            finalScore: c.finalScore,
            role: c.role,
            change24h: c.change24h,
            previousRank: prev,
            movement,
          };
        }),
      };

      this.top5History.push(snapshot);
      if (this.top5History.length > 20) {
        this.top5History.shift();
      }
    }

    return this.top5Candidates;
  }

  getTop5(): Top5Response {
    if (this.top5Candidates.length === 0 || !this.lastMarketContext) {
      this.calculateTop5(true);
    }

    const btcTicker = this.tickers.get('BTC');
    const btcChange = btcTicker?.change24h ?? 0;
    const btcTrend: 'bull' | 'bear' | 'neutral' = 
      btcChange > 1.5 ? 'bull' : btcChange < -2.0 ? 'bear' : 'neutral';
    const btcTrendTh = btcTrend === 'bull' ? 'กระทิง (Bullish)' : btcTrend === 'bear' ? 'หมี (Bearish)' : 'พักตัว (Sideways)';

    return {
      top5: this.top5Candidates,
      denominatedCurrency: 'THB',
      usdThbRate: this.usdThbRate || 33.24,
      marketContext: this.lastMarketContext || {
        btcTrend,
        btcTrendTh,
        btcDominance: this.globalKPIs.btcDominance,
        fearAndGreedIndex: this.fearAndGreed.index,
        fearAndGreedSentiment: this.fearAndGreed.sentiment,
        marketRegime: 'RISK_ON',
        marketRegimeTh: 'RISK ON (เปิดรับความเสี่ยง)',
        favoredStrategy: 'Momentum',
        favoredStrategyTh: 'Momentum Trading (ตามแรงส่ง)',
        regimeAdviceTh: 'ตลาดอยู่ในแนวโน้มเชิงบวก เหมาะแก่การเก็งกำไรตามโมเมนตัม',
        totalActiveCoinsEvaluated: this.tickers.size,
        lastUpdated: new Date().toISOString(),
        dataFreshness: 'Live Feed (< 30s)',
      },
      history: this.top5History,
    };
  }

  getTop5History(): Top5SnapshotHistory[] {
    return this.top5History;
  }

  /**
   * Run quantitative evaluation for TOP BUY NOW (Quant V3)
   * Strictly filters for coins with immediate executable setup (R:R >= 1:2, Tech >= 75, Entry >= 80, Extension < 75)
   */
  calculateBuyNow(force: boolean = false): BuyNowResponse {
    const now = Date.now();
    if (!force && this.buyNowResponse.evaluatedTotal > 0 && now - this.lastBuyNowCalculationTime < 30000) {
      return this.buyNowResponse;
    }

    // calculateTop5 computes top5, buyNowCandidates, and opportunities in a single Quant V3 pipeline run
    this.calculateTop5(force);
    return this.buyNowResponse;
  }

  getBuyNow(): BuyNowResponse {
    if (this.buyNowResponse.evaluatedTotal === 0) {
      this.calculateBuyNow(true);
    }
    return this.buyNowResponse;
  }

  /**
   * Top Opportunities ("เหรียญไหนกำลังมา?" - Section 31)
   */
  getOpportunities(): {
    opportunities: QuantV3OpportunityItem[];
    marketContext: Top5Response['marketContext'] | undefined;
    totalEvaluated: number;
  } {
    if (this.opportunities.length === 0 || !this.lastMarketContext) {
      this.calculateTop5(true);
    }
    return {
      opportunities: this.opportunities,
      marketContext: this.lastMarketContext,
      totalEvaluated: this.top5Candidates.length > 0 ? this.getAllTickers().length : 0,
    };
  }

  /**
   * Section 56: Quant V3 API Response Formatter for single coin or API endpoint
   */
  getQuantV3Detail(symbol: string): QuantV3ApiResponse | null {
    const upperSymbol = symbol.toUpperCase();
    const regime = (this.lastMarketContext?.marketRegime || 'RISK_ON') as any;

    // Check top5 and buyNow candidates
    const item = this.top5Candidates.find(c => c.symbol === upperSymbol) ||
                 this.buyNowResponse.candidates.find(c => c.symbol === upperSymbol);

    if (item) {
      return QuantV3Engine.formatApiResponse(item, regime);
    }

    // Evaluate single coin if not in cache
    const ticker = this.getTicker(upperSymbol);
    if (!ticker) return null;

    const btcTicker = this.tickers.get('BTC');
    const kpis = this.getMarketOverviewKPIs();
    const result = RankingEngine.evaluateTop5({
      coins: [ticker, ...(btcTicker ? [btcTicker] : [])],
      btcTicker,
      kpis,
      news: this.news
    });

    const evaluated = result.top5.find(c => c.symbol === upperSymbol) || 
                      result.buyNowCandidates.find(c => c.symbol === upperSymbol) ||
                      result.opportunities.find(c => c.symbol === upperSymbol);
    if (evaluated) {
      return QuantV3Engine.formatApiResponse(evaluated as any, regime);
    }

    return null;
  }

  // ==========================================
  // FOCUS MODULE ENGINE & STATE MANAGEMENT
  // ==========================================

  private seedInitialFocus() {
    const defaultFocusList: Array<{
      symbol: string;
      pair: string;
      coinName: string;
      priority: 'low' | 'normal' | 'high' | 'critical';
      mode: 'normal' | 'high_focus' | 'critical_focus';
      positionStatus: 'WATCHING' | 'PLANNING TO BUY' | 'HOLDING' | 'TAKING PROFIT' | 'EXITING';
      position?: any;
      userNotes?: string;
    }> = [
      {
        symbol: 'ADA',
        pair: 'ADA/THB',
        coinName: 'Cardano',
        priority: 'high',
        mode: 'high_focus',
        positionStatus: 'PLANNING TO BUY',
        userNotes: 'Higher Low + Retest สำเร็จ เตรียมเข้าซื้อสะสมรอบใหม่',
      },
      {
        symbol: 'ETH',
        pair: 'ETH/THB',
        coinName: 'Ethereum',
        priority: 'high',
        mode: 'normal',
        positionStatus: 'WATCHING',
        userNotes: '1D/4H Bullish ทดสอบแนวรับสำคัญ 90,500',
      },
      {
        symbol: 'FLOCK',
        pair: 'FLOCK/THB',
        coinName: 'FLock.io',
        priority: 'critical',
        mode: 'critical_focus',
        positionStatus: 'HOLDING',
        position: {
          averageCost: 2.65,
          amount: 10000,
          currentValue: 32400,
          pnl: 5900,
          pnlPercent: 22.26,
          portfolioPercent: 12.5,
        },
        userNotes: 'ราคาวิ่งพุ่งแรง Momentum สูงแต่เริ่ม Overextended แนะนำล็อกกำไรและเลื่อน Trailing Stop',
      },
      {
        symbol: 'BTC',
        pair: 'BTC/THB',
        coinName: 'Bitcoin',
        priority: 'normal',
        mode: 'normal',
        positionStatus: 'WATCHING',
        userNotes: 'ตัวชี้วัดทิศทางตลาดรวม (Market Benchmark)',
      },
    ];

    defaultFocusList.forEach((item, index) => {
      this.focusItems.set(item.symbol.toUpperCase(), {
        id: `focus-${item.symbol.toLowerCase()}`,
        symbol: item.symbol.toUpperCase(),
        pair: item.pair,
        coinName: item.coinName,
        priority: item.priority,
        mode: item.mode,
        positionStatus: item.positionStatus,
        position: item.position,
        userNotes: item.userNotes,
        isActive: true,
        order: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    this.calculateFocusScores(true);
  }

  /**
   * Recalculate deep Focus scores for all active focus coins
   */
  calculateFocusScores(force: boolean = false): FocusResponse {
    const now = Date.now();
    if (!force && this.focusScores.size > 0 && now - this.lastFocusCalculationTime < 5000) {
      return this.getFocusList();
    }

    const items = Array.from(this.focusItems.values())
      .filter(i => i.isActive)
      .sort((a, b) => a.order - b.order);

    for (const item of items) {
      let ticker = this.tickers.get(item.symbol);
      if (!ticker) {
        const template = this.tickers.get('ETH') || Array.from(this.tickers.values())[0];
        ticker = {
          ...template,
          symbol: item.symbol,
          name: item.coinName,
          price: item.symbol === 'FLOCK' ? 3.24 : 1.0,
          change24h: item.symbol === 'FLOCK' ? 28.0 : 2.0,
          change7d: item.symbol === 'FLOCK' ? 54.0 : 4.0,
          rsi: item.symbol === 'FLOCK' ? 78.5 : 55.0,
          signal: item.symbol === 'FLOCK' ? 'WATCH' : 'BUY',
          trend: item.symbol === 'FLOCK' ? 'Strong Bullish' : 'Bullish',
          aiScore: item.symbol === 'FLOCK' ? 84 : 85,
        };
        this.tickers.set(item.symbol, ticker);
      }

      const validTicker: TickerData = ticker;
      const prevScoreData = this.focusScores.get(item.symbol) || null;
      const evaluatedData = FocusEngine.evaluateFocusCoin(item, validTicker, this.usdThbRate, prevScoreData);
      this.focusScores.set(item.symbol, evaluatedData);
    }

    this.lastFocusCalculationTime = now;
    return this.getFocusList();
  }

  /**
   * Get all Focus coins with live data
   */
  getFocusList(): FocusResponse {
    const list = Array.from(this.focusScores.values())
      .filter(f => f.isActive)
      .sort((a, b) => {
        // Sort by order or score
        if (a.order !== b.order) return a.order - b.order;
        return b.focusScore - a.focusScore;
      });

    const totalCount = this.focusItems.size;
    const activeCount = list.length;
    const averageScore = activeCount > 0
      ? Math.round(list.reduce((acc, curr) => acc + curr.focusScore, 0) / activeCount)
      : 0;

    return {
      items: list,
      totalCount,
      activeCount,
      averageScore,
      marketRegime: this.globalKPIs.btcDominance > 55 ? 'BTC Dominance High / Selective Altcoins' : 'Broad Altcoin Season',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get single Focus coin deep detail
   */
  getFocusDetail(symbol: string): FocusCoinData | null {
    const cleanSym = symbol.toUpperCase();
    if (!this.focusScores.has(cleanSym)) {
      if (this.focusItems.has(cleanSym)) {
        this.calculateFocusScores(true);
      } else {
        return null;
      }
    }
    return this.focusScores.get(cleanSym) || null;
  }

  /**
   * Add coin to Focus
   */
  addFocusItem(symbol: string, options?: Partial<FocusItem>): FocusCoinData {
    const cleanSym = symbol.toUpperCase();
    let ticker = this.tickers.get(cleanSym);
    const coinName = ticker?.name || options?.coinName || cleanSym;
    const pair = options?.pair || `${cleanSym}/THB`;

    const existing = this.focusItems.get(cleanSym);
    const order = options?.order ?? (existing ? existing.order : this.focusItems.size + 1);

    const item: FocusItem = {
      id: existing ? existing.id : `focus-${cleanSym.toLowerCase()}-${Date.now()}`,
      symbol: cleanSym,
      pair,
      coinName,
      priority: options?.priority || 'normal',
      mode: options?.mode || 'normal',
      positionStatus: options?.positionStatus || 'WATCHING',
      position: options?.position,
      customTrailingStop: options?.customTrailingStop,
      userNotes: options?.userNotes || '',
      isActive: true,
      order,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.focusItems.set(cleanSym, item);
    this.calculateFocusScores(true);
    return this.focusScores.get(cleanSym)!;
  }

  /**
   * Update Focus item
   */
  updateFocusItem(idOrSymbol: string, updates: Partial<FocusItem>): FocusCoinData | null {
    let cleanSym = idOrSymbol.toUpperCase();
    let found = this.focusItems.get(cleanSym);
    if (!found) {
      // Try searching by ID
      for (const [sym, it] of this.focusItems.entries()) {
        if (it.id === idOrSymbol) {
          found = it;
          cleanSym = sym;
          break;
        }
      }
    }

    if (!found) return null;

    const updated: FocusItem = {
      ...found,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.focusItems.set(cleanSym, updated);
    this.calculateFocusScores(true);
    return this.focusScores.get(cleanSym) || null;
  }

  /**
   * Remove coin from Focus
   */
  removeFocusItem(idOrSymbol: string): boolean {
    let cleanSym = idOrSymbol.toUpperCase();
    if (!this.focusItems.has(cleanSym)) {
      for (const [sym, it] of this.focusItems.entries()) {
        if (it.id === idOrSymbol) {
          cleanSym = sym;
          break;
        }
      }
    }

    if (this.focusItems.has(cleanSym)) {
      this.focusItems.delete(cleanSym);
      this.focusScores.delete(cleanSym);
      return true;
    }
    return false;
  }

  /**
   * Reorder Focus items
   */
  reorderFocusItems(symbolsInOrder: string[]): boolean {
    symbolsInOrder.forEach((sym, idx) => {
      const cleanSym = sym.toUpperCase();
      const item = this.focusItems.get(cleanSym);
      if (item) {
        item.order = idx + 1;
        item.updatedAt = new Date().toISOString();
        this.focusItems.set(cleanSym, item);
      }
    });
    this.calculateFocusScores(true);
    return true;
  }
}

export const marketStore = new MarketStore();


