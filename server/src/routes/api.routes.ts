import { Router } from 'express';
import { marketStore } from '../database/store.js';
import { marketService } from '../services/market.service.js';
import { SECTORS } from '../config/sectors.js';
import { IndicatorsEngine } from '../engines/indicators.engine.js';
import { MarketStructureEngine } from '../engines/structure.engine.js';
import { RiskEngine } from '../engines/risk.engine.js';

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
apiRouter.get('/market/chart/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const candles = marketStore.getCandles(symbol);
  const ticker = marketStore.getTicker(symbol);

  res.json({
    success: true,
    data: {
      symbol,
      ticker,
      candles,
    },
  });
});

/**
 * Deep Coin Analysis & Multi-Timeframe Matrix (Sections 8, 10, 15, 17, 18)
 */
apiRouter.get('/market/analysis/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const candles = marketStore.getCandles(symbol);
  const ticker = marketStore.getTicker(symbol) || marketStore.getTicker('BTC')!;

  const indicators = IndicatorsEngine.calculateAllIndicators(candles);
  const structure = MarketStructureEngine.analyze(candles, ticker.price);
  const multiTf = IndicatorsEngine.getMultiTimeframeMatrix(symbol, ticker.price);

  res.json({
    success: true,
    data: {
      symbol,
      ticker,
      indicators,
      structure,
      multiTf,
    },
  });
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

