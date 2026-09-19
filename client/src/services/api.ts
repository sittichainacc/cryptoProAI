import { 
  AlertItem, 
  Candle, 
  CryptoNewsItem, 
  DeepAnalysisData, 
  HeatmapItem, 
  MarketOverviewKPIs, 
  PortfolioSummary, 
  PositionSizingResult, 
  SectorStatItem, 
  SectorTopItem, 
  TickerData, 
  Top3OverallItem 
} from '../types/index.js';

const API_BASE = '/api';

export const api = {
  async getKPIs(): Promise<MarketOverviewKPIs> {
    const res = await fetch(`${API_BASE}/market/kpis`);
    const json = await res.json();
    return json.data;
  },

  async getMovers(): Promise<{ gainers: TickerData[]; losers: TickerData[]; volume: TickerData[] }> {
    const res = await fetch(`${API_BASE}/market/movers`);
    const json = await res.json();
    return json.data;
  },

  async getChartData(symbol: string): Promise<{ symbol: string; ticker: TickerData; candles: Candle[] }> {
    const res = await fetch(`${API_BASE}/market/chart/${symbol}`);
    const json = await res.json();
    return json.data;
  },

  async getDeepAnalysis(symbol: string): Promise<DeepAnalysisData> {
    const res = await fetch(`${API_BASE}/market/analysis/${symbol}`);
    const json = await res.json();
    return json.data;
  },

  async getHeatmap(): Promise<HeatmapItem[]> {
    const res = await fetch(`${API_BASE}/market/heatmap`);
    const json = await res.json();
    return json.data;
  },

  async getSectorStats(): Promise<SectorStatItem[]> {
    const res = await fetch(`${API_BASE}/market/sectors`);
    const json = await res.json();
    return json.data;
  },

  async getTopAISignals(): Promise<TickerData[]> {
    const res = await fetch(`${API_BASE}/market/signals`);
    const json = await res.json();
    return json.data;
  },

  async getWatchlist(): Promise<TickerData[]> {
    const res = await fetch(`${API_BASE}/market/watchlist`);
    const json = await res.json();
    return json.data;
  },

  async toggleWatchlist(symbol: string): Promise<{ symbol: string; isWatchlist: boolean }> {
    const res = await fetch(`${API_BASE}/market/watchlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const json = await res.json();
    return json.data;
  },

  async getPortfolio(): Promise<PortfolioSummary> {
    const res = await fetch(`${API_BASE}/market/portfolio`);
    const json = await res.json();
    return json.data;
  },

  async getRecentAlerts(): Promise<AlertItem[]> {
    const res = await fetch(`${API_BASE}/market/alerts`);
    const json = await res.json();
    return json.data;
  },

  async getNews(): Promise<CryptoNewsItem[]> {
    const res = await fetch(`${API_BASE}/market/news`);
    const json = await res.json();
    return json.data;
  },

  async get24Recommended(): Promise<SectorTopItem[]> {
    const res = await fetch(`${API_BASE}/market/24-recommended`);
    const json = await res.json();
    return json.data;
  },

  async getTop3Overall(): Promise<Top3OverallItem[]> {
    const res = await fetch(`${API_BASE}/market/top3-overall`);
    const json = await res.json();
    return json.data;
  },

  async getCoins(params?: { sector?: string; search?: string; sort?: string; order?: 'asc' | 'desc' }): Promise<TickerData[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/coins?${query}`);
    const json = await res.json();
    return json.data;
  },

  async runScanner(mode: string, sector?: string, minVolume?: number): Promise<TickerData[]> {
    const res = await fetch(`${API_BASE}/scanner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, sector, minVolume }),
    });
    const json = await res.json();
    return json.data;
  },

  async calculatePositionSizing(input: {
    capital: number;
    riskPercent: number;
    entryPrice: number;
    stopLossPrice: number;
    targetPrice?: number;
  }): Promise<PositionSizingResult> {
    const res = await fetch(`${API_BASE}/calculator/position-sizing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    return json.data;
  },

  async calculateDCA(input: {
    symbol: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    durationMonths: number;
  }): Promise<{
    symbol: string;
    frequency: string;
    durationMonths: number;
    periods: number;
    totalInvested: number;
    finalValue: number;
    netProfit: number;
    roi: number;
    accumulatedCoins: number;
    averageCost: number;
    currentPrice: number;
    history: { period: number; invested: number; value: number }[];
  }> {
    const res = await fetch(`${API_BASE}/calculator/dca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    return json.data;
  },

  async getSystemStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/status`);
    const json = await res.json();
    return json.data;
  },

  async triggerSync(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/sync`, { method: 'POST' });
    const json = await res.json();
    return json;
  },
};
