import { 
  AlertItem, 
  Candle, 
  CryptoNewsItem, 
  DeepAnalysisData, 
  HeatmapItem, 
  MarketOverviewKPIs, 
  PaperTrade,
  PortfolioSummary, 
  PositionSizingResult, 
  SectorStatItem, 
  SectorTopItem, 
  TickerData, 
  Top3OverallItem,
  Top5Response,
  Top5SnapshotHistory,
  BuyNowResponse,
  FocusResponse,
  FocusCoinData,
  FocusItem,
  WhaleRadarSummary,
  QuantV3OpportunityItem,
  QuantV3ApiResponse
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

  async getChartData(symbol: string, interval: string = '1D'): Promise<{ symbol: string; ticker: TickerData; candles: Candle[] }> {
    const res = await fetch(`${API_BASE}/market/chart/${symbol}?interval=${encodeURIComponent(interval)}`);
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

  async createAlert(alertData: Omit<AlertItem, 'id' | 'time'>): Promise<AlertItem> {
    const res = await fetch(`${API_BASE}/market/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteAlert(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/market/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.success;
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

  async getPaperTrades(): Promise<{
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
  }> {
    const res = await fetch(`${API_BASE}/paper-trading`);
    const json = await res.json();
    return json.data;
  },

  async openPaperTrade(order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    qty: number;
    sl: number;
    tp: number;
    notes?: string;
    signalOrigin?: string;
  }): Promise<PaperTrade> {
    const res = await fetch(`${API_BASE}/paper-trading/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const json = await res.json();
    return json.data;
  },

  async closePaperTrade(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/paper-trading/close/${id}`, { method: 'POST' });
    const json = await res.json();
    return json.success;
  },

  async deletePaperTrade(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/paper-trading/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  async getWhaleRadar(): Promise<WhaleRadarSummary> {
    const res = await fetch(`${API_BASE}/market/whale-radar`);
    const json = await res.json();
    return json.data;
  },

  async getTop5(): Promise<Top5Response> {
    const res = await fetch(`${API_BASE}/market/top5`);
    const json = await res.json();
    return json.data;
  },

  async getTop5History(): Promise<Top5SnapshotHistory[]> {
    const res = await fetch(`${API_BASE}/market/top5/history`);
    const json = await res.json();
    return json.data;
  },

  async recalculateTop5(): Promise<Top5Response> {
    const res = await fetch(`${API_BASE}/market/top5/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async getBuyNow(): Promise<BuyNowResponse> {
    const res = await fetch(`${API_BASE}/market/buynow`);
    const json = await res.json();
    return json.data;
  },

  async recalculateBuyNow(): Promise<BuyNowResponse> {
    const res = await fetch(`${API_BASE}/market/buynow/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  // Quant V3 Opportunities & Intelligence
  async getOpportunities(): Promise<{
    opportunities: QuantV3OpportunityItem[];
    marketContext: any;
    totalEvaluated: number;
  }> {
    const res = await fetch(`${API_BASE}/market/opportunities`);
    const json = await res.json();
    return json.data;
  },

  async recalculateOpportunities(): Promise<{
    opportunities: QuantV3OpportunityItem[];
    marketContext: any;
    totalEvaluated: number;
  }> {
    const res = await fetch(`${API_BASE}/market/opportunities/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async getQuantV3Detail(symbol: string): Promise<QuantV3ApiResponse> {
    const res = await fetch(`${API_BASE}/market/quant-v3/${symbol}`);
    const json = await res.json();
    return json.data;
  },

  async getQuantV3Overview(): Promise<{
    marketContext: any;
    topOverall: any[];
    topOpportunities: QuantV3OpportunityItem[];
    topBuyNow: any[];
    marketStatus: string;
    marketMessage?: string;
  }> {
    const res = await fetch(`${API_BASE}/market/quant-v3-overview`);
    const json = await res.json();
    return json.data;
  },

  // Focus Module APIs
  async getFocusList(): Promise<FocusResponse> {
    const res = await fetch(`${API_BASE}/focus`);
    const json = await res.json();
    return json.data;
  },

  async getFocusDetail(symbol: string): Promise<FocusCoinData> {
    const res = await fetch(`${API_BASE}/focus/${symbol}/detail`);
    const json = await res.json();
    return json.data;
  },

  async addFocus(payload: {
    symbol: string;
    priority?: string;
    mode?: string;
    positionStatus?: string;
    position?: any;
    customTrailingStop?: number;
    userNotes?: string;
  }): Promise<FocusCoinData> {
    const res = await fetch(`${API_BASE}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async updateFocus(id: string, updates: Partial<FocusItem>): Promise<FocusCoinData> {
    const res = await fetch(`${API_BASE}/focus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.data;
  },

  async removeFocus(symbol: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/focus/${symbol}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async reorderFocus(symbols: string[]): Promise<FocusResponse> {
    const res = await fetch(`${API_BASE}/focus/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    const json = await res.json();
    return json.data;
  },

  async recalculateFocus(): Promise<FocusResponse> {
    const res = await fetch(`${API_BASE}/focus/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async testExchangeConnection(exchange: 'bitkub' | 'binance'): Promise<{
    success: boolean;
    data: {
      exchange: string;
      status: 'online' | 'error' | 'timeout';
      latencyMs: number;
      message: string;
      timestamp?: string;
    };
  }> {
    const res = await fetch(`${API_BASE}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchange }),
    });
    return await res.json();
  },
};


