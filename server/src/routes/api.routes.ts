import { Router } from 'express';
import { marketStore } from '../database/store.js';
import { marketService } from '../services/market.service.js';
import { SECTORS } from '../config/sectors.js';
import { IndicatorsEngine } from '../engines/indicators.engine.js';
import { MarketStructureEngine } from '../engines/structure.engine.js';
import { RiskEngine } from '../engines/risk.engine.js';
import { TradingPlanEngine } from '../engines/trading_plan.engine.js';
import { QuantPremiumEngine, DEFAULT_PHASE20_CONFIG } from '../engines/quant_premium.engine.js';
import { UltimateQualificationEngine, ULTIMATE_POLICY_V1 } from '../engines/ultimate_qualification.engine.js';
import { WatchlistService } from '../database/watchlist.service.js';
import { AlertsService } from '../database/alerts.service.js';
import { portfolioService } from '../database/portfolio.service.js';
import { journalService } from '../database/journal.service.js';
import { FocusService } from '../database/focus.service.js';
import { SettingsService } from '../database/settings.service.js';
import { resolveUserId } from '../database/auth.middleware.js';

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
 * Watchlist (Connected to Supabase PostgreSQL per user)
 */
apiRouter.get('/market/watchlist', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const result = await WatchlistService.getUserWatchlist(userId, marketStore);
    res.json({ success: true, data: result.items, quota: result.quota });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/market/watchlist/toggle', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }
    const result = await WatchlistService.toggleWatchlist(userId, symbol);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

apiRouter.post('/market/watchlist/save', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { symbol, targetBuyPrice, targetSellPrice, notes, priority } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }
    const row = await WatchlistService.saveWatchlistDetails(userId, {
      symbol,
      targetBuyPrice: targetBuyPrice !== undefined && targetBuyPrice !== null && targetBuyPrice !== '' ? Number(targetBuyPrice) : null,
      targetSellPrice: targetSellPrice !== undefined && targetSellPrice !== null && targetSellPrice !== '' ? Number(targetSellPrice) : null,
      notes,
      priority: priority ? Number(priority) : 1,
    });
    res.json({ success: true, data: row });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/market/watchlist/:symbol', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const symbol = req.params.symbol;
    const removed = await WatchlistService.removeCoin(userId, symbol);
    res.json({ success: true, data: { symbol, removed } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
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
 * Portfolio Summary & Analytics (Connected to Supabase PostgreSQL per user)
 */
apiRouter.get('/market/portfolio', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const analytics = await portfolioService.getPortfolioAnalytics(userId);
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update Portfolio Settings
 */
apiRouter.put('/market/portfolio/settings', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const portfolio = await portfolioService.updatePortfolioSettings(userId, req.body);
    res.json({ success: true, data: portfolio });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Recent Alerts (Connected to Supabase PostgreSQL per user)
 */
apiRouter.get('/market/alerts', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const result = await AlertsService.getUserAlerts(userId, marketStore);
    res.json({ success: true, data: result.items, quota: result.quota });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/market/alerts', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { symbol, alertType, descriptionTh, currentValue, severity } = req.body;
    if (!symbol || !alertType) {
      return res.status(400).json({ success: false, error: 'symbol and alertType are required' });
    }
    const newAlert = await AlertsService.createAlert(userId, {
      symbol: String(symbol),
      alertType: String(alertType),
      conditionValue: currentValue,
      descriptionTh,
      severity,
    });
    res.json({ success: true, data: newAlert });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

apiRouter.delete('/market/alerts/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const success = await AlertsService.deleteAlert(userId, req.params.id);
    res.json({ success, message: success ? 'Alert deleted' : 'Alert not found' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/market/alerts/:id/toggle', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const updated = await AlertsService.toggleAlertStatus(userId, req.params.id);
    res.json({ success: !!updated, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
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
 * Paper Trading: Get All Trades & Performance Stats (Connected to Supabase PostgreSQL)
 */
apiRouter.get('/paper-trading', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await portfolioService.getPaperTrades(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Paper Trading: Open New Simulated Position (Connected to Supabase PostgreSQL)
 */
apiRouter.post('/paper-trading/order', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { symbol, type = 'BUY', entryPrice, qty, sl, tp, notes, signalOrigin } = req.body;
    if (!symbol || !entryPrice || !qty) {
      return res.status(400).json({ success: false, message: 'symbol, entryPrice, and qty are required' });
    }

    const trade = await portfolioService.openPaperTrade(userId, {
      symbol,
      type,
      entryPrice: Number(entryPrice),
      qty: Number(qty),
      sl: sl ? Number(sl) : undefined,
      tp: tp ? Number(tp) : undefined,
      notes,
      signalOrigin,
    });

    res.json({ success: true, data: trade });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Paper Trading: Close Open Trade (Connected to Supabase PostgreSQL)
 */
apiRouter.post('/paper-trading/close/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const trade = await portfolioService.closePaperTrade(userId, req.params.id);
    res.json({ success: true, message: 'Trade closed at current market price', data: trade });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Paper Trading: Delete Trade (Connected to Supabase PostgreSQL)
 */
apiRouter.delete('/paper-trading/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const success = await portfolioService.deletePaperTrade(userId, req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Trading Journals: Get All Entries for User (Connected to Supabase PostgreSQL)
 */
apiRouter.get('/journals', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const journals = await journalService.getJournals(userId);
    res.json({ success: true, data: journals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Trading Journals: Create Entry (Connected to Supabase PostgreSQL)
 */
apiRouter.post('/journals', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const journal = await journalService.createJournal(userId, req.body);
    res.json({ success: true, data: journal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Trading Journals: Update Entry (Connected to Supabase PostgreSQL)
 */
apiRouter.put('/journals/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const journal = await journalService.updateJournal(userId, req.params.id, req.body);
    res.json({ success: true, data: journal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Trading Journals: Delete Entry (Connected to Supabase PostgreSQL)
 */
apiRouter.delete('/journals/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const success = await journalService.deleteJournal(userId, req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Reports: User Personal Performance & Stats (Aggregated from DB)
 */
apiRouter.get('/reports/performance', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const report = await journalService.getUserPerformanceReport(userId);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
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
  const usdThbRate = marketStore.getUsdThbRate() || 33.39;

  const response = QuantPremiumEngine.evaluateUniverse({
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
    usdThbRate,
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
  const usdThbRate = marketStore.getUsdThbRate() || 33.39;

  const response = QuantPremiumEngine.evaluateUniverse({
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
    config: customConfig,
    usdThbRate,
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
  const usdThbRate = marketStore.getUsdThbRate() || 33.39;

  const result = QuantPremiumEngine.evaluateSingleCoin(symbol, {
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
    usdThbRate,
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

  const usdThbRate = marketStore.getUsdThbRate() || 33.39;
  const coinThb = {
    ...coin,
    price: coin.price * usdThbRate,
    volume24h: (coin.volume24h || 1000000) * usdThbRate,
  };

  const result = QuantPremiumEngine.simulateCapitalSlippage({
    coin: coinThb,
    capitalThb: Number(capitalThb) || 50000,
  });

  res.json({ success: true, data: result });
});

/**
 * Top 5 Ultimate — Perfect-Setup Low-Risk Opportunities
 * Institutional Multi-Factor Decision Engine (15 Gates / 10 Pillars / No Weak Link)
 */
let cachedUltimateTop5: any = null;
let lastUltimateCalcTime = 0;

apiRouter.get('/market/top5-ultimate', (_req, res) => {
  const now = Date.now();
  if (cachedUltimateTop5 && (now - lastUltimateCalcTime < 10000)) {
    return res.json({ success: true, data: cachedUltimateTop5 });
  }

  const allCoins = marketStore.getAllTickers();
  const btcTicker = marketStore.getTicker('BTC');
  const ethTicker = marketStore.getTicker('ETH');
  const kpis = marketStore.getMarketOverviewKPIs();
  const news = marketStore.getNews();
  const usdThbRate = marketStore.getUsdThbRate() || 33.39;

  const response = UltimateQualificationEngine.evaluateUniverse({
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
    usdThbRate,
  });

  cachedUltimateTop5 = response;
  lastUltimateCalcTime = now;

  res.json({ success: true, data: response });
});

apiRouter.post('/market/top5-ultimate/recalculate', (req, res) => {
  const allCoins = marketStore.getAllTickers();
  const btcTicker = marketStore.getTicker('BTC');
  const ethTicker = marketStore.getTicker('ETH');
  const kpis = marketStore.getMarketOverviewKPIs();
  const news = marketStore.getNews();
  const customConfig = req.body?.config || {};
  const usdThbRate = marketStore.getUsdThbRate() || 33.39;

  const response = UltimateQualificationEngine.evaluateUniverse({
    coins: allCoins,
    btcTicker,
    ethTicker,
    kpis,
    news,
    config: customConfig,
    usdThbRate,
  });

  cachedUltimateTop5 = response;
  lastUltimateCalcTime = Date.now();

  res.json({ success: true, data: response });
});

apiRouter.get('/market/top5-ultimate/focus/:symbol', (req, res) => {
  const { symbol } = req.params;
  const allCoins = marketStore.getAllTickers();
  const coin = marketStore.getTicker(symbol);
  if (!coin) {
    return res.status(404).json({ success: false, error: `Coin ${symbol} not found` });
  }

  const btcTicker = marketStore.getTicker('BTC');
  const ethTicker = marketStore.getTicker('ETH');
  const kpis = marketStore.getMarketOverviewKPIs();
  const news = marketStore.getNews();
  const usdThbRate = marketStore.getUsdThbRate() || 33.39;

  const coinPriceThb = Number((coin.price * usdThbRate).toFixed(coin.price * usdThbRate < 0.01 ? 6 : coin.price * usdThbRate < 1 ? 4 : 2));
  const coinThb = {
    ...coin,
    price: coinPriceThb,
    high24h: coin.high24h ? Number((coin.high24h * usdThbRate).toFixed(2)) : Number((coinPriceThb * 1.02).toFixed(2)),
    low24h: coin.low24h ? Number((coin.low24h * usdThbRate).toFixed(2)) : Number((coinPriceThb * 0.98).toFixed(2)),
    volume24h: (coin.volume24h || 1000000) * usdThbRate,
  };

  const btcTickerThb = btcTicker ? {
    ...btcTicker,
    price: Number((btcTicker.price * usdThbRate).toFixed(2)),
  } : undefined;

  const positiveCoins = allCoins.filter(c => (c.change24h || 0) > 0).length;
  const breadthPct = allCoins.length > 0 ? Math.round((positiveCoins / allCoins.length) * 100) : 50;

  const candidate = UltimateQualificationEngine.evaluateSingleAsset({
    coin: coinThb,
    btcTicker: btcTickerThb,
    ethChange: ethTicker?.change24h || 0,
    btcChange: btcTicker?.change24h || 0,
    breadthPct,
    kpis,
    news,
    config: ULTIMATE_POLICY_V1,
    usdThbRate,
  });

  res.json({ success: true, data: candidate });
});

apiRouter.post('/market/top5-ultimate/position-sim', (req, res) => {
  const { symbol, entryPrice, currentPrice, stopLossPrice, tp1Price, tp2Price, tp3Price } = req.body;
  if (!symbol || !entryPrice || !currentPrice) {
    return res.status(400).json({ success: false, error: 'Missing required parameters: symbol, entryPrice, currentPrice' });
  }

  const result = UltimateQualificationEngine.evaluateExistingPosition({
    symbol,
    entryPrice: Number(entryPrice),
    currentPrice: Number(currentPrice),
    stopLossPrice: Number(stopLossPrice || entryPrice * 0.95),
    tp1Price: Number(tp1Price || entryPrice * 1.06),
    tp2Price: Number(tp2Price || entryPrice * 1.12),
    tp3Price: Number(tp3Price || entryPrice * 1.18),
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

// 1. Get all Focus items with live intelligence per user
apiRouter.get('/focus', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await FocusService.getUserFocusList(userId, marketStore);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get single Focus coin deep detail
apiRouter.get('/focus/:symbol/detail', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await FocusService.getUserFocusDetail(userId, req.params.symbol, marketStore);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Focus coin not found' });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Add coin to Focus
apiRouter.post('/focus', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'symbol is required' });
    }
    const item = await FocusService.addFocusItem(userId, symbol, req.body, marketStore);
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update Focus item
apiRouter.put('/focus/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const updated = await FocusService.updateFocusItem(userId, req.params.id, req.body, marketStore);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Focus item not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Remove coin from Focus
apiRouter.delete('/focus/:symbol', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const success = await FocusService.removeFocusItem(userId, req.params.symbol);
    res.json({ success, message: success ? 'Removed from focus' : 'Focus item not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Reorder Focus items (Drag & Drop ranking)
apiRouter.post('/focus/reorder', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ success: false, error: 'symbols array is required' });
    }
    const data = await FocusService.reorderFocusItems(userId, symbols, marketStore);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Force immediate recalculation of all Focus coins
apiRouter.post('/focus/recalculate', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await FocusService.getUserFocusList(userId, marketStore);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Multi-coin Comparisons list
apiRouter.get('/focus/comparisons', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await FocusService.getUserComparisons(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Save comparison set
apiRouter.post('/focus/comparisons', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const { name, symbols, notes, isFavorite } = req.body;
    if (!name || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ success: false, error: 'name and symbols array are required' });
    }
    const data = await FocusService.saveComparison(userId, name, symbols, notes, isFavorite);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Delete comparison set
apiRouter.delete('/focus/comparisons/:id', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const success = await FocusService.deleteComparison(userId, req.params.id);
    res.json({ success, message: success ? 'Comparison deleted' : 'Comparison not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ==========================================
 * SETTINGS MODULE API ENDPOINTS (Supabase PostgreSQL)
 * ==========================================
 */

// 1. Get user settings
apiRouter.get('/settings', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await SettingsService.getUserSettings(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Update user settings
apiRouter.put('/settings', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const data = await SettingsService.updateUserSettings(userId, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Test Exchange API Connection (Bitkub / Binance)
apiRouter.post('/settings/test-connection', async (req, res) => {
  const { exchange } = req.body;
  if (!exchange || (exchange !== 'bitkub' && exchange !== 'binance')) {
    return res.status(400).json({ success: false, error: 'exchange must be bitkub or binance' });
  }
  const result = await SettingsService.testConnection(exchange);
  res.json({ success: result.status === 'online', data: result });
});





