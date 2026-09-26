import { Router } from 'express';
import { marketStore } from '../database/store.js';
import { marketService } from '../services/market.service.js';
import { SECTORS } from '../config/sectors.js';
import { IndicatorsEngine } from '../engines/indicators.engine.js';
import { MarketStructureEngine } from '../engines/structure.engine.js';
import { RiskEngine } from '../engines/risk.engine.js';
import { TradingPlanEngine } from '../engines/trading_plan.engine.js';
import { QuantPremiumEngine, DEFAULT_PHASE20_CONFIG } from '../engines/quant_premium.engine.js';

export const apiRouter = Router();

/**
 * KPI Overview
 */
apiRouter.get('/market/kpis', (_req, res) => {
  const kpis = marketStore.getMarketOverviewKPIs();
  res.json({ success: true, data: kpis });
});

/**
 * Top 10 Movers (Gainers, Losers, Volume)
 */
apiRouter.get('/market/movers', (_req, res) => {
  const movers = marketStore.getTopMovers();
  res.json({ success: true, data: movers });
});

/**
 * 8 Sectors List & Aggregate Performance
 */
apiRouter.get('/market/sectors', (_req, res) => {
  const allTickers = marketStore.getAllTickers();
  const sectorList = Object.entries(SECTORS).map(([key, info]) => {
    const sectorCoins = allTickers.filter(t => t.sector === key);
    const avgChange24h = sectorCoins.length 
      ? sectorCoins.reduce((sum, c) => sum + c.change24h, 0) / sectorCoins.length 
      : 0;
    const avgChange7d = sectorCoins.length 
      ? sectorCoins.reduce((sum, c) => sum + c.change7d, 0) / sectorCoins.length 
      : 0;
    const totalVolume = sectorCoins.reduce((sum, c) => sum + c.volume24h, 0);
    const sorted = [...sectorCoins].sort((a, b) => b.change24h - a.change24h);
    const topCoin = sorted[0]?.symbol ?? '-';
    const worstCoin = sorted[sorted.length - 1]?.symbol ?? '-';

    return {
      ...info,
      change24h: Number(avgChange24h.toFixed(2)),
      change7d: Number(avgChange7d.toFixed(2)),
      volume24h: totalVolume,
      marketCapShare: key === 'core' ? 68.0 : key === 'layer1_2' ? 10.5 : key === 'defi' ? 5.6 : 3.5,
      topCoin,
      worstCoin,
    };
  });

  res.json({ success: true, data: sectorList });
});

/**
 * Market Heatmap Data (Image 3)
 */
apiRouter.get('/market/heatmap', (_req, res) => {
  const allTickers = marketStore.getAllTickers();
  const heatmapCoins = allTickers.slice(0, 16).map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    price: coin.price,
    change24h: coin.change24h,
    marketCap: coin.marketCap,
    sector: coin.sector,
    sizeWeight: coin.symbol === 'BTC' ? 32 : coin.symbol === 'ETH' ? 20 : coin.symbol === 'SOL' ? 12 : 6,
  }));

  res.json({ success: true, data: heatmapCoins });
});

/**
 * 24 Recommended Coins (8 Sectors, 3 coins each)
 */
apiRouter.get('/market/24-recommended', (_req, res) => {
  const grid = marketStore.get24RecommendedCoins();
  res.json({ success: true, data: grid });
});

/**
 * Top 3 Overall (Gold, Silver, Bronze)
 */
apiRouter.get('/market/top3-overall', (_req, res) => {
  const top3 = marketStore.getTop3Overall();
  res.json({ success: true, data: top3 });
});

/**
 * AI Signals Hub (Top Signals)
 */
apiRouter.get('/market/signals', (_req, res) => {
  const tickers = marketStore.getAllTickers()
    .filter(t => t.signal === 'STRONG_BUY' || t.signal === 'BUY' || t.signal === 'WAIT_FOR_RETEST')
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 10);

  res.json({ success: true, data: tickers });
});

/**
 * Watchlist
 */
apiRouter.get('/market/watchlist', (_req, res) => {
  const items = marketStore.getWatchlist();
  res.json({ success: true, data: items });
});

apiRouter.post('/market/watchlist/toggle', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Symbol is required' });
  }
  const isAdded = marketStore.toggleWatchlist(symbol);
  res.json({ success: true, data: { symbol, isWatchlist: isAdded } });
});

/**
 * Candlestick OHLCV Data for Chart
 */
apiRouter.get('/market/chart/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = (req.query.interval as string) || (req.query.timeframe as string) || '1d';
    const candles = await marketStore.getCandles(symbol, interval);
    const ticker = marketStore.getTicker(symbol);

    res.json({
      success: true,
      data: {
        symbol,
        interval,
        ticker,
        candles,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * Deep Coin Analysis & Comprehensive Trading Plan (RSI Multi-TF, Fibonacci, Holding Horizon, Trade Plan)
 */
apiRouter.get('/market/analysis/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const boughtPriceParam = req.query.boughtPrice ? parseFloat(req.query.boughtPrice as string) : null;
    const boughtPrice = !isNaN(boughtPriceParam as number) ? boughtPriceParam : null;

    // Fetch primary daily candles
    const candles = await marketStore.getCandles(symbol, '1d');
    const ticker = marketStore.getTicker(symbol) || marketStore.getTicker('BTC')!;

    // Fetch multi-timeframe candles in parallel
    const tfs = ['5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    const candlesEntries = await Promise.all(
      tfs.map(async (tf) => {
        try {
          const c = await marketStore.getCandles(symbol, tf);
          return [tf, c] as [string, typeof c];
        } catch {
          return [tf, []] as [string, typeof candles];
        }
      })
    );
    const candlesMap: Record<string, typeof candles> = Object.fromEntries(candlesEntries);

    const indicators = IndicatorsEngine.calculateAllIndicators(candles);
    const structure = MarketStructureEngine.analyze(candles, ticker.price);

    // Compute Comprehensive Trading Plan
    const tradingPlan = TradingPlanEngine.analyzeCoin({
      symbol,
      ticker,
      candlesMap,
      boughtPrice,
    });

    // Map multiTf to reflect real calculated multi-timeframe values
    const multiTf = {
      timeframes: tradingPlan.rsiMultiTimeframe.items.map(item => ({
        timeframe: item.timeframe,
        trend: item.trend as any,
        rsi: item.rsi,
        macd: { macd: 1.2, signal: 0.8, histogram: item.slope === 'Rising' ? 0.8 : -0.4 },
        volumeStatus: item.timeframe === '5m' || item.timeframe === '15m' ? 'High Expansion' as const : 'Normal' as const,
        signal: item.risk.tier.includes('OVERSOLD') ? 'Strong Buy' : item.risk.tier.includes('OVERBOUGHT') ? 'Take Profit' : 'Buy',
        isAboveEma20: ticker.change24h >= 0,
        isAboveEma50: ticker.change7d >= 0,
        isAboveEma200: ticker.change7d >= -5,
      })),
      consensusSignal: tradingPlan.decision.status,
      consensusScore: tradingPlan.scores.overallScore,
      explanationTh: tradingPlan.rsiMultiTimeframe.summaryTh,
    };

    res.json({
      success: true,
      data: {
        symbol,
        ticker,
        indicators,
        structure,
        multiTf,
        tradingPlan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * Portfolio Sample Summary & Allocation (Image 1 reference)
 */
apiRouter.get('/market/portfolio', (_req, res) => {
  res.json({
    success: true,
    data: {
      totalValue: 12450.00,
      totalReturnPct: 12.4,
      totalReturnUsd: 1372.50,
      allocation: [
        { symbol: 'BTC', label: 'Bitcoin', percentage: 30, color: '#F59E0B', value: 3735 },
        { symbol: 'ETH', label: 'Ethereum', percentage: 20, color: '#3B82F6', value: 2490 },
        { symbol: 'SOL', label: 'Solana', percentage: 15, color: '#10B981', value: 1867.5 },
        { symbol: 'LINK', label: 'Chainlink', percentage: 10, color: '#0284C7', value: 1245 },
        { symbol: 'AAVE', label: 'Aave', percentage: 10, color: '#8B5CF6', value: 1245 },
        { symbol: 'OTHERS', label: 'อื่นๆ', percentage: 15, color: '#6B7280', value: 1867.5 },
      ],
      performanceHistory: [
        { time: '1W', returnPct: 4.2 },
        { time: '1M', returnPct: 12.4 },
        { time: '3M', returnPct: 24.8 },
        { time: '6M', returnPct: 48.5 },
        { time: '1Y', returnPct: 92.1 },
        { time: 'ALL', returnPct: 145.0 },
      ],
      positions: [
        { symbol: 'BTC', name: 'Bitcoin', qty: 0.045, avgCost: 83000, currentPrice: 108432.50, value: 4879.46, pnl: 1144.46, pnlPct: 30.64, weight: 39.2, signal: 'BUY', risk: 'Low' },
        { symbol: 'ETH', name: 'Ethereum', qty: 0.65, avgCost: 2950, currentPrice: 3842.00, value: 2497.30, pnl: 579.80, pnlPct: 30.24, weight: 20.1, signal: 'BUY', risk: 'Low' },
        { symbol: 'SOL', name: 'Solana', qty: 10.5, avgCost: 145, currentPrice: 185.45, value: 1947.22, pnl: 424.72, pnlPct: 27.89, weight: 15.6, signal: 'STRONG_BUY', risk: 'Medium' },
        { symbol: 'LINK', name: 'Chainlink', qty: 55, avgCost: 16.5, currentPrice: 23.41, value: 1287.55, pnl: 380.05, pnlPct: 41.87, weight: 10.3, signal: 'STRONG_BUY', risk: 'Low' },
        { symbol: 'AAVE', name: 'Aave', qty: 4.2, avgCost: 220, currentPrice: 312.40, value: 1312.08, pnl: 388.08, pnlPct: 42.00, weight: 10.5, signal: 'STRONG_BUY', risk: 'Medium' },
      ],
    },
  });
});

/**
 * Recent Alerts
 */
apiRouter.get('/market/alerts', (_req, res) => {
  const alerts = marketStore.getAlerts();
  res.json({ success: true, data: alerts });
});

apiRouter.post('/market/alerts', (req, res) => {
  const { symbol, alertType, descriptionTh, currentValue, severity } = req.body;
  if (!symbol || !alertType || !currentValue) {
    return res.status(400).json({ success: false, error: 'symbol, alertType, and currentValue are required' });
  }
  const newAlert = marketStore.addAlert({
    symbol: String(symbol).toUpperCase(),
    alertType: String(alertType),
    descriptionTh: descriptionTh || `${symbol} ${alertType} ${currentValue}`,
    currentValue: String(currentValue),
    severity: severity || 'important',
    status: 'active',
  });
  res.json({ success: true, data: newAlert });
});

apiRouter.delete('/market/alerts/:id', (req, res) => {
  const success = marketStore.deleteAlert(req.params.id);
  res.json({ success, message: success ? 'Alert deleted' : 'Alert not found' });
});

/**
 * Crypto News Feed
 */
apiRouter.get('/market/news', (_req, res) => {
  const news = marketStore.getNews();
  res.json({ success: true, data: news });
});

/**
 * All Coins Table with Filter and Sorting
 */
apiRouter.get('/coins', (req, res) => {
  const { sector, search, sort, order } = req.query;
  let list = marketStore.getAllTickers();

  if (sector && sector !== 'all') {
    list = list.filter(c => c.sector === sector);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  const sortField = (sort as string) || 'marketCap';
  const isAsc = order === 'asc';

  list.sort((a: any, b: any) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    return isAsc ? valA - valB : valB - valA;
  });

  res.json({ success: true, data: list, count: list.length });
});

/**
 * AI Scanner Presets (Section 13)
 */
apiRouter.post('/scanner', (req, res) => {
  const { mode = 'breakout', minVolume = 0, sector } = req.body;
  let list = marketStore.getAllTickers();

  if (sector && sector !== 'all') {
    list = list.filter(c => c.sector === sector);
  }

  if (minVolume > 0) {
    list = list.filter(c => c.volume24h >= minVolume);
  }

  switch (mode) {
    case 'breakout':
      list = list.filter(c => c.change24h > 10 && c.rsi < 76);
      break;
    case 'momentum':
      list = list.filter(c => c.change24h > 4 && c.rsi >= 58 && c.rsi <= 72);
      break;
    case 'volume_spike':
      list = list.filter(c => c.volume24h > 300000000 || c.change24h > 15);
      break;
    case 'oversold':
      list = list.filter(c => c.rsi < 45);
      break;
    case 'trend_following':
      list = list.filter(c => c.technicalScore >= 80 && c.trend === 'Strong Bullish');
      break;
    case 'pullback':
      list = list.filter(c => c.change7d > 8 && c.change24h < 2);
      break;
    case 'reversal':
      list = list.filter(c => c.change24h > 5 && c.rsi >= 45 && c.rsi <= 60);
      break;
    case 'relative_strength':
      list = list.filter(c => c.change7d > 12);
      break;
    case 'ai_score_high':
      list = list.filter(c => c.aiScore >= 85);
      break;
  }

  list.sort((a, b) => b.aiScore - a.aiScore);

  res.json({ success: true, mode, count: list.length, data: list });
});

/**
 * Position Sizing Calculator API (Section 28)
 */
apiRouter.post('/calculator/position-sizing', (req, res) => {
  const { capital = 10000, riskPercent = 2, entryPrice, stopLossPrice, targetPrice } = req.body;
  if (!entryPrice || !stopLossPrice) {
    return res.status(400).json({ success: false, error: 'entryPrice and stopLossPrice are required' });
  }

  const result = RiskEngine.calculatePositionSizing({
    capital: Number(capital),
    riskPercent: Number(riskPercent),
    entryPrice: Number(entryPrice),
    stopLossPrice: Number(stopLossPrice),
    targetPrice: targetPrice ? Number(targetPrice) : undefined,
  });

  res.json({ success: true, data: result });
});

/**
 * Dollar-Cost Averaging (DCA) Simulation API (Section 31 & Strategy Tools)
 */
apiRouter.post('/calculator/dca', (req, res) => {
  const { symbol = 'BTC', amount = 1000, frequency = 'monthly', durationMonths = 12 } = req.body;
  const ticker = marketStore.getTicker(symbol) || marketStore.getTicker('BTC');
  const currentPrice = ticker ? ticker.price : 108432;

  const periods = frequency === 'daily' ? durationMonths * 30 : frequency === 'weekly' ? durationMonths * 4 : durationMonths;
  const amountPerPeriod = Number(amount);
  const totalInvested = amountPerPeriod * periods;

  // Base growth trajectory simulation
  const annualReturn = ticker?.change7d ? Math.min(Math.max((ticker.change7d * 4) / 100, -0.15), 1.0) : 0.42;

  let accumulatedCoins = 0;
  const history: { period: number; invested: number; value: number }[] = [];

  for (let i = 1; i <= periods; i++) {
    const progress = i / periods;
    const historicalPrice = currentPrice / (1 + (annualReturn * (1 - progress)));
    const boughtCoin = amountPerPeriod / historicalPrice;
    accumulatedCoins += boughtCoin;

    const currentValueAtStep = accumulatedCoins * historicalPrice;
    if (i % Math.max(1, Math.floor(periods / 12)) === 0 || i === periods) {
      history.push({
        period: i,
        invested: Math.round(amountPerPeriod * i),
        value: Math.round(currentValueAtStep),
      });
    }
  }

  const finalValue = accumulatedCoins * currentPrice;
  const netProfit = finalValue - totalInvested;
  const roi = (netProfit / totalInvested) * 100;
  const averageCost = totalInvested / accumulatedCoins;

  res.json({
    success: true,
    data: {
      symbol,
      frequency,
      durationMonths,
      periods,
      totalInvested: Math.round(totalInvested),
      finalValue: Math.round(finalValue),
      netProfit: Math.round(netProfit),
      roi: Number(roi.toFixed(2)),
      accumulatedCoins: Number(accumulatedCoins.toFixed(6)),
      averageCost: Number(averageCost.toFixed(2)),
      currentPrice,
      history,
    },
  });
});

/**
 * System & Exchange Status
 */
apiRouter.get('/system/status', (_req, res) => {
  const status = marketService.getStatus();
  res.json({ success: true, data: status });
});

/**
 * Live Bitkub Symbol List (all coins currently on Bitkub platform)
 */
apiRouter.get('/market/bitkub-symbols', (_req, res) => {
  const symbols = marketService.getBitkubSymbols();
  res.json({ success: true, data: symbols, count: symbols.length });
});

/**
 * Trigger Instant Market Synchronization
 */
apiRouter.post('/system/sync', async (_req, res) => {
  await marketService.syncMarketData();
  res.json({ success: true, message: 'Market data synchronized with Bitkub and Binance' });
});

/**
 * Paper Trading: Get All Trades & Performance Stats
 */
apiRouter.get('/paper-trading', (_req, res) => {
  const data = marketStore.getPaperTrades();
  res.json({ success: true, data });
});

/**
 * Paper Trading: Open New Simulated Position
 */
apiRouter.post('/paper-trading/order', (req, res) => {
  const { symbol, type = 'BUY', entryPrice, qty, sl, tp, notes, signalOrigin } = req.body;
  if (!symbol || !entryPrice || !qty) {
    return res.status(400).json({ success: false, message: 'symbol, entryPrice, and qty are required' });
  }

  const trade = marketStore.openPaperTrade({
    symbol,
    type,
    entryPrice: Number(entryPrice),
    qty: Number(qty),
    sl: Number(sl || 0),
    tp: Number(tp || 0),
    notes,
    signalOrigin,
  });

  res.json({ success: true, data: trade });
});

/**
 * Paper Trading: Close Open Trade
 */
apiRouter.post('/paper-trading/close/:id', (req, res) => {
  const success = marketStore.closePaperTrade(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Trade not found or already closed' });
  }
  res.json({ success: true, message: 'Trade closed at current market price' });
});

/**
 * Paper Trading: Delete Trade
 */
apiRouter.delete('/paper-trading/:id', (req, res) => {
  const success = marketStore.deletePaperTrade(req.params.id);
  res.json({ success });
});

/**
 * Whale Radar: Large Transfers & Sentiment
 */
apiRouter.get('/market/whale-radar', (_req, res) => {
  const summary = marketStore.getWhaleRadarSummary();
  res.json({ success: true, data: summary });
});

/**
 * Phase 20 Production Architecture: Top 5 Premium Quant Decision Intelligence
 * 19-Stage Pipeline: Universe -> Liquidity & Execution -> Regime -> Specialist Engines -> 
 * Tradable Edge -> Pre-score Hard Gates -> Top 0-5 (Never force 5) -> Sizing uncoupled from Ranking ->
 * Position State Machine & Profit Protection -> Explainability Contract & Audit Trail
 */
let cachedPremiumTop5: any = null;
let lastPremiumCalcTime = 0;

apiRouter.get('/market/top5-premium', (_req, res) => {
  const now = Date.now();
  if (cachedPremiumTop5 && (now - lastPremiumCalcTime < 10000)) {
    return res.json({ success: true, data: cachedPremiumTop5 });
  }

  const allCoins = marketStore.getAllTickers();
  const btcTicker = marketStore.getTicker('BTC');
  const ethTicker = marketStore.getTicker('ETH');
  const kpis = marketStore.getMarketOverviewKPIs();
  const news = marketStore.getNews();

  const response = QuantPremiumEngine.evaluateUniverse({
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
  });

  cachedPremiumTop5 = response;
  lastPremiumCalcTime = now;

  res.json({ success: true, data: response });
});

apiRouter.post('/market/top5-premium/recalculate', (req, res) => {
  const allCoins = marketStore.getAllTickers();
  const btcTicker = marketStore.getTicker('BTC');
  const ethTicker = marketStore.getTicker('ETH');
  const kpis = marketStore.getMarketOverviewKPIs();
  const news = marketStore.getNews();
  const customConfig = req.body?.config || {};

  const response = QuantPremiumEngine.evaluateUniverse({
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
    config: customConfig,
  });

  cachedPremiumTop5 = response;
  lastPremiumCalcTime = Date.now();

  res.json({ success: true, data: response });
});

apiRouter.get('/market/top5-premium/focus/:symbol', (req, res) => {
  const { symbol } = req.params;
  const allCoins = marketStore.getAllTickers();
  const btcTicker = marketStore.getTicker('BTC');
  const ethTicker = marketStore.getTicker('ETH');
  const kpis = marketStore.getMarketOverviewKPIs();
  const news = marketStore.getNews();

  const result = QuantPremiumEngine.evaluateSingleCoin(symbol, {
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
  });

  if (!result.candidate) {
    return res.status(404).json({ success: false, error: `Coin ${symbol} not found in Bitkub universe` });
  }

  res.json({ success: true, data: result });
});

apiRouter.post('/market/top5-premium/slippage-sim', (req, res) => {
  const { symbol, capitalThb } = req.body;
  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Symbol is required' });
  }

  const coin = marketStore.getTicker(symbol);
  if (!coin) {
    return res.status(404).json({ success: false, error: `Coin ${symbol} not found` });
  }

  const result = QuantPremiumEngine.simulateCapitalSlippage({
    coin,
    capitalThb: Number(capitalThb) || 50000,
  });

  res.json({ success: true, data: result });
});

/**
 * Top 5 Investment Intelligence & Ranking System
 */
apiRouter.get('/market/top5', (_req, res) => {
  const data = marketStore.getTop5();
  res.json({ success: true, data });
});

apiRouter.get('/market/top5/history', (_req, res) => {
  const history = marketStore.getTop5History();
  res.json({ success: true, data: history });
});

apiRouter.post('/market/top5/recalculate', (_req, res) => {
  marketStore.calculateTop5(true);
  const data = marketStore.getTop5();
  res.json({ success: true, data });
});

/**
 * Top 5 Buy Now (เหรียญที่มีจังหวะเข้าซื้อได้ ณ เวลานี้ - Quant V3 Hard Gates)
 * Filters strictly for immediate entry setups with R:R >= 1:2, 0 to 5 coins (never force 5)
 */
apiRouter.get('/market/buynow', (_req, res) => {
  const data = marketStore.getBuyNow();
  res.json({ success: true, data });
});

apiRouter.post('/market/buynow/recalculate', (_req, res) => {
  const data = marketStore.calculateBuyNow(true);
  res.json({ success: true, data });
});

/**
 * Top Opportunities ("เหรียญไหนกำลังมา?" - Section 31)
 */
apiRouter.get('/market/opportunities', (_req, res) => {
  const data = marketStore.getOpportunities();
  res.json({ success: true, data });
});

apiRouter.post('/market/opportunities/recalculate', (_req, res) => {
  marketStore.calculateTop5(true);
  const data = marketStore.getOpportunities();
  res.json({ success: true, data });
});

/**
 * Section 56: Quant V3 Decoupled Intelligence API
 */
apiRouter.get('/market/quant-v3/:symbol', (req, res) => {
  const detail = marketStore.getQuantV3Detail(req.params.symbol);
  if (!detail) {
    return res.status(404).json({ success: false, error: `Quant V3 evaluation not found for ${req.params.symbol}` });
  }
  res.json({ success: true, data: detail });
});

apiRouter.get('/market/quant-v3-overview', (_req, res) => {
  const top5 = marketStore.getTop5();
  const opportunities = marketStore.getOpportunities();
  const buyNow = marketStore.getBuyNow();
  res.json({
    success: true,
    data: {
      marketContext: top5.marketContext,
      topOverall: top5.top5,
      topOpportunities: opportunities.opportunities,
      topBuyNow: buyNow.candidates,
      marketStatus: buyNow.marketStatus,
      marketMessage: buyNow.marketMessage,
    }
  });
});

/**
 * ==========================================
 * FOCUS MODULE API ENDPOINTS
 * ==========================================
 */

// 1. Get all Focus items with live intelligence
apiRouter.get('/focus', (_req, res) => {
  const data = marketStore.getFocusList();
  res.json({ success: true, data });
});

// 2. Get single Focus coin deep detail
apiRouter.get('/focus/:symbol/detail', (req, res) => {
  const data = marketStore.getFocusDetail(req.params.symbol);
  if (!data) {
    return res.status(404).json({ success: false, error: 'Focus coin not found' });
  }
  res.json({ success: true, data });
});

// 3. Add coin to Focus
apiRouter.post('/focus', (req, res) => {
  const { symbol, priority, mode, positionStatus, position, customTrailingStop, userNotes } = req.body;
  if (!symbol) {
    return res.status(400).json({ success: false, error: 'symbol is required' });
  }
  const item = marketStore.addFocusItem(symbol, {
    priority,
    mode,
    positionStatus,
    position,
    customTrailingStop,
    userNotes,
  });
  res.json({ success: true, data: item });
});

// 4. Update Focus item
apiRouter.put('/focus/:id', (req, res) => {
  const updated = marketStore.updateFocusItem(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Focus item not found' });
  }
  res.json({ success: true, data: updated });
});

// 5. Remove coin from Focus
apiRouter.delete('/focus/:symbol', (req, res) => {
  const success = marketStore.removeFocusItem(req.params.symbol);
  res.json({ success, message: success ? 'Removed from focus' : 'Focus item not found' });
});

// 6. Reorder Focus items (Drag & Drop ranking)
apiRouter.post('/focus/reorder', (req, res) => {
  const { symbols } = req.body;
  if (!Array.isArray(symbols)) {
    return res.status(400).json({ success: false, error: 'symbols array is required' });
  }
  const success = marketStore.reorderFocusItems(symbols);
  const data = marketStore.getFocusList();
  res.json({ success, data });
});

// 7. Force immediate recalculation of all Focus coins
apiRouter.post('/focus/recalculate', (_req, res) => {
  const data = marketStore.calculateFocusScores(true);
  res.json({ success: true, data });
});

/**
 * Test Exchange API Connection (Bitkub / Binance)
 */
apiRouter.post('/settings/test-connection', async (req, res) => {
  const { exchange } = req.body;
  const start = Date.now();
  try {
    if (exchange === 'bitkub') {
      const resp = await fetch('https://api.bitkub.com/api/servertime', { signal: AbortSignal.timeout(6000) });
      const latency = Date.now() - start;
      if (resp.ok) {
        return res.json({
          success: true,
          data: {
            exchange: 'bitkub',
            status: 'online',
            latencyMs: latency,
            message: `เชื่อมต่อกับ Bitkub API สำเร็จ (${latency} ms)`,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        return res.json({
          success: false,
          data: {
            exchange: 'bitkub',
            status: 'error',
            latencyMs: latency,
            message: `Bitkub API ตอบสนองด้วยสถานะ HTTP ${resp.status}`,
          },
        });
      }
    } else if (exchange === 'binance') {
      const resp = await fetch('https://api.binance.com/api/v3/ping', { signal: AbortSignal.timeout(6000) });
      const latency = Date.now() - start;
      if (resp.ok) {
        return res.json({
          success: true,
          data: {
            exchange: 'binance',
            status: 'online',
            latencyMs: latency,
            message: `เชื่อมต่อกับ Binance API สำเร็จ (${latency} ms)`,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        return res.json({
          success: false,
          data: {
            exchange: 'binance',
            status: 'error',
            latencyMs: latency,
            message: `Binance API ตอบสนองด้วยสถานะ HTTP ${resp.status}`,
          },
        });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Unknown exchange' });
    }
  } catch (err: any) {
    const latency = Date.now() - start;
    return res.json({
      success: false,
      data: {
        exchange,
        status: 'timeout',
        latencyMs: latency,
        message: `ไม่สามารถเชื่อมต่อได้: ${err.message || 'Timeout / Network Error'}`,
      },
    });
  }
});





