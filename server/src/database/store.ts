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
  WhaleRadarSummary,
  WhaleTransaction
} from '../types/index.js';
import { INITIAL_COINS, SECTORS } from '../config/sectors.js';
import { TechnicalScoringEngine } from '../engines/scoring.engine.js';
import { AIEngine } from '../engines/ai.engine.js';
import { IndicatorsEngine } from '../engines/indicators.engine.js';

export class MarketStore {
  private coins: Map<string, Coin> = new Map();
  private tickers: Map<string, TickerData> = new Map();
  private candlesCache: Map<string, Candle[]> = new Map();
  private watchlist: Set<string> = new Set(['BTC', 'ETH', 'SOL', 'LINK', 'AAVE']);
  private alerts: AlertItem[] = [];
  private news: CryptoNewsItem[] = [];
  private paperTrades: PaperTrade[] = [];
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
  }

  private seedInitialTickers() {
    // Base realistic market data
    const baselineData: Record<string, { price: number; change24h: number; change7d: number; volume: number; rsi: number }> = {
      BTC: { price: 108432.50, change24h: 1.32, change7d: 4.56, volume: 45200000000, rsi: 58.4 },
      ETH: { price: 3842.00, change24h: 2.18, change7d: 6.21, volume: 21400000000, rsi: 62.1 },
      SOL: { price: 185.45, change24h: 4.32, change7d: 12.40, volume: 7850000000, rsi: 64.8 },
      BNB: { price: 726.31, change24h: 1.55, change7d: 3.82, volume: 1850000000, rsi: 54.2 },

      DOT: { price: 6.28, change24h: 14.70, change7d: 18.50, volume: 680000000, rsi: 67.5 },
      ADA: { price: 0.71, change24h: 2.65, change7d: 6.14, volume: 920000000, rsi: 56.1 },
      KAVA: { price: 0.992, change24h: 34.20, change7d: 42.10, volume: 410000000, rsi: 74.2 },
      AVAX: { price: 37.22, change24h: 4.11, change7d: 11.30, volume: 730000000, rsi: 59.3 },
      SUI: { price: 3.92, change24h: 5.62, change7d: 15.10, volume: 1120000000, rsi: 68.2 },
      SEI: { price: 0.54, change24h: 8.40, change7d: 14.20, volume: 380000000, rsi: 63.4 },
      ARB: { price: 0.88, change24h: 3.10, change7d: 5.40, volume: 420000000, rsi: 51.8 },

      AAVE: { price: 312.40, change24h: 18.60, change7d: 28.50, volume: 890000000, rsi: 71.3 },
      JUP: { price: 0.731, change24h: 16.80, change7d: 22.40, volume: 350000000, rsi: 69.1 },
      CAKE: { price: 2.45, change24h: 6.20, change7d: 9.80, volume: 120000000, rsi: 58.0 },
      UNI: { price: 11.85, change24h: 4.50, change7d: 8.20, volume: 480000000, rsi: 57.4 },
      CRV: { price: 0.42, change24h: 2.10, change7d: 4.30, volume: 85000000, rsi: 52.1 },

      FLOCK: { price: 0.185, change24h: 22.10, change7d: 48.00, volume: 180000000, rsi: 76.5 },
      FET: { price: 1.18, change24h: 24.90, change7d: 38.20, volume: 950000000, rsi: 75.1 },
      TAO: { price: 482.00, change24h: 7.80, change7d: 19.50, volume: 290000000, rsi: 65.4 },
      GRT: { price: 0.24, change24h: 5.40, change7d: 11.20, volume: 210000000, rsi: 59.8 },
      IO: { price: 2.85, change24h: 12.30, change7d: 24.50, volume: 310000000, rsi: 67.2 },

      LINK: { price: 23.41, change24h: 12.40, change7d: 18.76, volume: 1650000000, rsi: 66.8 },
      XRP: { price: 2.46, change24h: 0.84, change7d: 2.91, volume: 3400000000, rsi: 53.4 },
      ACH: { price: 0.032, change24h: 8.90, change7d: 14.10, volume: 85000000, rsi: 61.2 },
      XLM: { price: 0.38, change24h: 1.20, change7d: 3.40, volume: 290000000, rsi: 51.5 },

      PEPE: { price: 0.0000123, change24h: 14.60, change7d: 24.80, volume: 2200000000, rsi: 72.1 },
      DOGE: { price: 0.219, change24h: 3.71, change7d: 9.23, volume: 2800000000, rsi: 58.7 },
      BONK: { price: 0.000021, change24h: 13.60, change7d: 21.40, volume: 760000000, rsi: 69.4 },
      FLOKI: { price: 0.00018, change24h: 9.40, change7d: 16.20, volume: 430000000, rsi: 64.1 },

      IMX: { price: 1.42, change24h: 15.90, change7d: 21.30, volume: 240000000, rsi: 68.9 },
      AXS: { price: 6.85, change24h: 4.80, change7d: 8.50, volume: 180000000, rsi: 57.2 },
      MANA: { price: 0.44, change24h: 3.50, change7d: 6.20, volume: 110000000, rsi: 54.8 },
      GALA: { price: 0.031, change24h: 7.20, change7d: 11.40, volume: 150000000, rsi: 60.1 },
      SAND: { price: 0.41, change24h: 2.90, change7d: 5.10, volume: 95000000, rsi: 53.0 },

      EDGE: { price: 1.23, change24h: 26.40, change7d: 54.00, volume: 190000000, rsi: 78.4 },
      PIEVERSE: { price: 0.45, change24h: 18.20, change7d: 36.50, volume: 85000000, rsi: 71.0 },
      SKR: { price: 0.0841, change24h: 28.70, change7d: 61.20, volume: 95000000, rsi: 81.2 },
      ASTER: { price: 0.15, change24h: 11.40, change7d: 22.00, volume: 45000000, rsi: 64.5 },
    };

    const btc7d = baselineData['BTC']?.change7d ?? 4.56;

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
        const step = (data.price - current) / (14 - i) + (Math.random() - 0.45) * (data.price * 0.02);
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
        change1h: Number(((Math.random() - 0.4) * 1.5).toFixed(2)),
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

  getMarketOverviewKPIs(): MarketOverviewKPIs {
    return {
      totalMarketCap: 3.21e12,
      totalMarketCapFormatted: '$3.21T',
      marketCapChange24h: 2.34,
      marketCapSparkline: [3.05, 3.08, 3.12, 3.10, 3.14, 3.16, 3.15, 3.18, 3.19, 3.20, 3.21],

      volume24h: 128.7e9,
      volume24hFormatted: '$128.7B',
      volumeChange24h: 18.5,
      volumeSparkline: [95, 102, 108, 105, 114, 118, 122, 120, 125, 128.7],

      btcDominance: 54.2,
      btcDominanceChange24h: -0.3,
      btcDominanceSparkline: [55.1, 55.0, 54.8, 54.9, 54.6, 54.5, 54.4, 54.3, 54.2],

      fearAndGreedIndex: this.fearAndGreed.index,
      fearAndGreedSentiment: this.fearAndGreed.sentiment,
      fearAndGreedSentimentTh: this.fearAndGreed.sentimentTh,

      marketAITrend: {
        status: 'bull',
        statusTh: 'กระทิง (Bullish)',
        descriptionTh: 'มีโอกาสเป็นขาขึ้นต่อเนื่องในระยะกลาง ตลาดมีแรงซื้อหนุนสม่ำเสมอ',
      },

      btcPrice: this.tickers.get('BTC')?.price ?? 108432.50,
      btcChange24h: this.tickers.get('BTC')?.change24h ?? 1.32,
      ethPrice: this.tickers.get('ETH')?.price ?? 3842.00,
      ethChange24h: this.tickers.get('ETH')?.change24h ?? 2.18,
      bullishCoinCount: 31,
      breakoutCoinCount: 9,
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

    const top1 = scoredList[0] || this.tickers.get('SOL');
    const top2 = scoredList[1] || this.tickers.get('LINK');
    const top3 = scoredList[2] || this.tickers.get('PEPE');

    return [
      {
        rank: 1,
        symbol: top1?.symbol ?? 'SOL',
        name: top1?.name ?? 'Solana',
        price: top1?.price ?? 185.45,
        change7d: top1?.change7d ?? 12.4,
        score: top1?.aiScore ?? 92,
        signal: top1?.signal ?? 'STRONG_BUY',
        signalLabelTh: 'Strong Buy',
        reasonTh: 'แนวโน้มแข็งแรงมาก ยืนเหนือเส้น EMA หลักทุกเส้น',
        trendTh: 'แนวโน้มแข็งแรง',
        risk: top1?.riskLevel ?? 'Medium',
        colorType: 'gold',
      },
      {
        rank: 2,
        symbol: top2?.symbol ?? 'LINK',
        name: top2?.name ?? 'Chainlink',
        price: top2?.price ?? 23.41,
        change7d: top2?.change7d ?? 8.76,
        score: top2?.aiScore ?? 90,
        signal: top2?.signal ?? 'STRONG_BUY',
        signalLabelTh: 'Strong Buy',
        reasonTh: 'โครงสร้างกราฟ 4H สวยงาม ทะลุแนวต้านสำคัญ',
        trendTh: 'โครงสร้างดีมาก',
        risk: top2?.riskLevel ?? 'Low',
        colorType: 'silver',
      },
      {
        rank: 3,
        symbol: top3?.symbol ?? 'PEPE',
        name: top3?.name ?? 'Pepe',
        price: top3?.price ?? 0.0000123,
        change7d: top3?.change7d ?? 9.23,
        score: top3?.aiScore ?? 86,
        signal: top3?.signal ?? 'BUY',
        signalLabelTh: 'Buy',
        reasonTh: 'Volume ไหลเข้าต่อเนื่อง Momentum เด่นในกลุ่มมีม',
        trendTh: 'Momentum เด่น',
        risk: top3?.riskLevel ?? 'High',
        colorType: 'bronze',
      },
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

  getNews(): CryptoNewsItem[] {
    return this.news;
  }

  getCandles(symbol: string): Candle[] {
    const sym = symbol.toUpperCase();
    if (this.candlesCache.has(sym)) {
      return this.candlesCache.get(sym)!;
    }

    // Generate realistic historical daily candles for symbol
    const ticker = this.tickers.get(sym) || this.tickers.get('BTC')!;
    const basePrice = ticker.price;
    const count = 120;
    const now = Math.floor(Date.now() / 1000);
    const daySec = 86400;
    const candles: Candle[] = [];

    let currentClose = basePrice * 0.70;
    for (let i = count; i >= 0; i--) {
      const time = now - i * daySec;
      const volatility = currentClose * 0.035;
      const change = (Math.random() - 0.47) * volatility;
      const open = currentClose;
      const close = currentClose + change;
      const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
      const volume = (ticker.volume24h / 50) * (0.6 + Math.random() * 0.8);

      candles.push({
        time,
        open: Number(open.toFixed(basePrice < 1 ? 6 : 2)),
        high: Number(high.toFixed(basePrice < 1 ? 6 : 2)),
        low: Number(low.toFixed(basePrice < 1 ? 6 : 2)),
        close: Number(close.toFixed(basePrice < 1 ? 6 : 2)),
        volume: Math.round(volume),
      });

      currentClose = close;
    }

    // Ensure the last candle matches current price
    const last = candles[candles.length - 1];
    last.close = ticker.price;
    last.high = Math.max(last.high, ticker.price);
    last.low = Math.min(last.low, ticker.price);

    const enriched = IndicatorsEngine.enrichCandlesWithEMAs(candles);
    this.candlesCache.set(sym, enriched);
    return enriched;
  }

  setCandles(symbol: string, candles: Candle[]) {
    const enriched = IndicatorsEngine.enrichCandlesWithEMAs(candles);
    this.candlesCache.set(symbol.toUpperCase(), enriched);
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
}

export const marketStore = new MarketStore();

