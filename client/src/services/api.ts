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
  QuantV3ApiResponse,
  Phase20EvaluationResponse,
  Phase20Candidate,
  SlippageSimulationResult,
  UltimateEvaluationResponse,
  UltimateCandidate,
  SimulatedPositionEvaluation,
  TradingJournalItem,
  UserPerformanceReport,
  FocusComparisonItem,
  ClientUserSettings
} from '../types/index.js';

const API_BASE = '/api';

export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...customHeaders,
  };
  try {
    const userStr = localStorage.getItem('cryptopro_auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }
      if (user?.username) {
        headers['x-username'] = user.username;
      }
    }
  } catch (e) {
    // ignore
  }
  return headers;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders((options.headers as Record<string, string>) || {});
  return fetch(url, {
    ...options,
    headers,
  });
}


export const api = {
  async getKPIs(): Promise<MarketOverviewKPIs> {
    const res = await authFetch(`${API_BASE}/market/kpis`);
    const json = await res.json();
    return json.data;
  },

  async getMovers(): Promise<{ gainers: TickerData[]; losers: TickerData[]; volume: TickerData[] }> {
    const res = await authFetch(`${API_BASE}/market/movers`);
    const json = await res.json();
    return json.data;
  },

  async getChartData(symbol: string, interval: string = '1D'): Promise<{ symbol: string; ticker: TickerData; candles: Candle[] }> {
    const res = await authFetch(`${API_BASE}/market/chart/${symbol}?interval=${encodeURIComponent(interval)}`);
    const json = await res.json();
    return json.data;
  },

  async getDeepAnalysis(symbol: string, boughtPrice?: number | null): Promise<DeepAnalysisData> {
    const query = boughtPrice ? `?boughtPrice=${encodeURIComponent(boughtPrice)}` : '';
    const res = await authFetch(`${API_BASE}/market/analysis/${symbol}${query}`);
    const json = await res.json();
    return json.data;
  },

  async getHeatmap(): Promise<HeatmapItem[]> {
    const res = await authFetch(`${API_BASE}/market/heatmap`);
    const json = await res.json();
    return json.data;
  },

  async getSectorStats(): Promise<SectorStatItem[]> {
    const res = await authFetch(`${API_BASE}/market/sectors`);
    const json = await res.json();
    return json.data;
  },

  async getTopAISignals(): Promise<TickerData[]> {
    const res = await authFetch(`${API_BASE}/market/signals`);
    const json = await res.json();
    return json.data;
  },

  async getWatchlist(): Promise<TickerData[]> {
    const res = await authFetch(`${API_BASE}/market/watchlist`);
    const json = await res.json();
    return json.data;
  },

  async toggleWatchlist(symbol: string): Promise<{ symbol: string; isWatchlist: boolean }> {
    const res = await authFetch(`${API_BASE}/market/watchlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const json = await res.json();
    return json.data;
  },

  async saveWatchlistDetails(data: {
    symbol: string;
    targetBuyPrice?: number | null;
    targetSellPrice?: number | null;
    notes?: string | null;
    priority?: number;
  }): Promise<any> {
    const res = await authFetch(`${API_BASE}/market/watchlist/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  async removeFromWatchlist(symbol: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/market/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.success;
  },

  async getAuthMe(): Promise<any> {
    const res = await authFetch(`${API_BASE}/auth/me`);
    return await res.json();
  },


  async getPortfolio(): Promise<PortfolioSummary> {
    const res = await authFetch(`${API_BASE}/market/portfolio`);
    const json = await res.json();
    return json.data;
  },

  async getRecentAlerts(): Promise<AlertItem[]> {
    const res = await authFetch(`${API_BASE}/market/alerts`);
    const json = await res.json();
    return json.data;
  },

  async createAlert(alertData: Omit<AlertItem, 'id' | 'time'>): Promise<AlertItem> {
    const res = await authFetch(`${API_BASE}/market/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || json.error || 'Failed to create alert');
    }
    return json.data;
  },

  async deleteAlert(id: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/market/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.success;
  },

  async toggleAlertStatus(id: string): Promise<AlertItem> {
    const res = await authFetch(`${API_BASE}/market/alerts/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    });
    const json = await res.json();
    return json.data;
  },

  async getNews(): Promise<CryptoNewsItem[]> {
    const res = await authFetch(`${API_BASE}/market/news`);
    const json = await res.json();
    return json.data;
  },

  async get24Recommended(): Promise<SectorTopItem[]> {
    const res = await authFetch(`${API_BASE}/market/24-recommended`);
    const json = await res.json();
    return json.data;
  },

  async getTop3Overall(): Promise<Top3OverallItem[]> {
    const res = await authFetch(`${API_BASE}/market/top3-overall`);
    const json = await res.json();
    return json.data;
  },

  async getCoins(params?: { sector?: string; search?: string; sort?: string; order?: 'asc' | 'desc' }): Promise<TickerData[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await authFetch(`${API_BASE}/coins?${query}`);
    const json = await res.json();
    return json.data;
  },

  async runScanner(mode: string, sector?: string, minVolume?: number): Promise<TickerData[]> {
    const res = await authFetch(`${API_BASE}/scanner`, {
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
    const res = await authFetch(`${API_BASE}/calculator/position-sizing`, {
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
    const res = await authFetch(`${API_BASE}/calculator/dca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    return json.data;
  },

  async getSystemStatus(): Promise<any> {
    const res = await authFetch(`${API_BASE}/system/status`);
    const json = await res.json();
    return json.data;
  },

  async triggerSync(): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`${API_BASE}/system/sync`, { method: 'POST' });
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
    const res = await authFetch(`${API_BASE}/paper-trading`);
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
    const res = await authFetch(`${API_BASE}/paper-trading/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const json = await res.json();
    return json.data;
  },

  async closePaperTrade(id: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/paper-trading/close/${id}`, { method: 'POST' });
    const json = await res.json();
    return json.success;
  },

  async deletePaperTrade(id: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/paper-trading/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  // Trading Journals (Supabase PostgreSQL)
  async getJournals(): Promise<TradingJournalItem[]> {
    const res = await authFetch(`${API_BASE}/journals`);
    const json = await res.json();
    return json.data || [];
  },

  async createJournal(data: {
    title: string;
    tradeDate?: string;
    marketSentiment?: string;
    dailySummaryTh?: string;
    lessonsLearned?: string;
    winTrades?: number;
    lossTrades?: number;
    netPnl?: number;
  }): Promise<TradingJournalItem> {
    const res = await authFetch(`${API_BASE}/journals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create journal');
    return json.data;
  },

  async updateJournal(id: string, data: any): Promise<TradingJournalItem> {
    const res = await authFetch(`${API_BASE}/journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update journal');
    return json.data;
  },

  async deleteJournal(id: string): Promise<boolean> {
    const res = await authFetch(`${API_BASE}/journals/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  async getUserPerformanceReport(): Promise<UserPerformanceReport> {
    const res = await authFetch(`${API_BASE}/reports/performance`);
    const json = await res.json();
    return json.data;
  },

  async getWhaleRadar(): Promise<WhaleRadarSummary> {
    const res = await authFetch(`${API_BASE}/market/whale-radar`);
    const json = await res.json();
    return json.data;
  },

  // Phase 20 Production Architecture: Top 5 Premium
  async getTop5Premium(): Promise<Phase20EvaluationResponse> {
    const res = await authFetch(`${API_BASE}/market/top5-premium`);
    const json = await res.json();
    return json.data;
  },

  async recalculateTop5Premium(config?: any): Promise<Phase20EvaluationResponse> {
    const res = await authFetch(`${API_BASE}/market/top5-premium/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const json = await res.json();
    return json.data;
  },

  async getTop5PremiumFocus(symbol: string): Promise<{
    candidate: Phase20Candidate | null;
    hardGates: { passed: boolean; reasonCodes: string[] };
    marketRegime: any;
  }> {
    const res = await authFetch(`${API_BASE}/market/top5-premium/focus/${encodeURIComponent(symbol)}`);
    const json = await res.json();
    return json.data;
  },

  async simulateSlippage(symbol: string, capitalThb: number): Promise<SlippageSimulationResult> {
    const res = await authFetch(`${API_BASE}/market/top5-premium/slippage-sim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, capitalThb }),
    });
    const json = await res.json();
    return json.data;
  },

  // Phase 21 Production Architecture: Top 5 Ultimate (Institutional No Weak Link)
  async getTop5Ultimate(): Promise<UltimateEvaluationResponse> {
    const res = await authFetch(`${API_BASE}/market/top5-ultimate`);
    const json = await res.json();
    return json.data;
  },

  async recalculateTop5Ultimate(config?: any): Promise<UltimateEvaluationResponse> {
    const res = await authFetch(`${API_BASE}/market/top5-ultimate/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const json = await res.json();
    return json.data;
  },

  async getTop5UltimateFocus(symbol: string): Promise<UltimateCandidate> {
    const res = await authFetch(`${API_BASE}/market/top5-ultimate/focus/${encodeURIComponent(symbol)}`);
    const json = await res.json();
    return json.data;
  },

  async simulateUltimatePosition(params: {
    symbol: string;
    entryPrice: number;
    currentPrice: number;
    stopLossPrice?: number;
    tp1Price?: number;
    tp2Price?: number;
    tp3Price?: number;
  }): Promise<SimulatedPositionEvaluation> {
    const res = await authFetch(`${API_BASE}/market/top5-ultimate/position-sim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return json.data;
  },

  async getTop5(): Promise<Top5Response> {
    const res = await authFetch(`${API_BASE}/market/top5`);
    const json = await res.json();
    return json.data;
  },

  async getTop5History(): Promise<Top5SnapshotHistory[]> {
    const res = await authFetch(`${API_BASE}/market/top5/history`);
    const json = await res.json();
    return json.data;
  },

  async recalculateTop5(): Promise<Top5Response> {
    const res = await authFetch(`${API_BASE}/market/top5/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async getBuyNow(): Promise<BuyNowResponse> {
    const res = await authFetch(`${API_BASE}/market/buynow`);
    const json = await res.json();
    return json.data;
  },

  async recalculateBuyNow(): Promise<BuyNowResponse> {
    const res = await authFetch(`${API_BASE}/market/buynow/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  // Quant V3 Opportunities & Intelligence
  async getOpportunities(): Promise<{
    opportunities: QuantV3OpportunityItem[];
    marketContext: any;
    totalEvaluated: number;
  }> {
    const res = await authFetch(`${API_BASE}/market/opportunities`);
    const json = await res.json();
    return json.data;
  },

  async recalculateOpportunities(): Promise<{
    opportunities: QuantV3OpportunityItem[];
    marketContext: any;
    totalEvaluated: number;
  }> {
    const res = await authFetch(`${API_BASE}/market/opportunities/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async getQuantV3Detail(symbol: string): Promise<QuantV3ApiResponse> {
    const res = await authFetch(`${API_BASE}/market/quant-v3/${symbol}`);
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
    const res = await authFetch(`${API_BASE}/market/quant-v3-overview`);
    const json = await res.json();
    return json.data;
  },

  // Focus Module APIs
  async getFocusList(): Promise<FocusResponse> {
    const res = await authFetch(`${API_BASE}/focus`);
    const json = await res.json();
    return json.data;
  },

  async getFocusDetail(symbol: string): Promise<FocusCoinData> {
    const res = await authFetch(`${API_BASE}/focus/${symbol}/detail`);
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
    const res = await authFetch(`${API_BASE}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async updateFocus(id: string, updates: Partial<FocusItem>): Promise<FocusCoinData> {
    const res = await authFetch(`${API_BASE}/focus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.data;
  },

  async removeFocus(symbol: string): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`${API_BASE}/focus/${symbol}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async reorderFocus(symbols: string[]): Promise<FocusResponse> {
    const res = await authFetch(`${API_BASE}/focus/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    const json = await res.json();
    return json.data;
  },

  async recalculateFocus(): Promise<FocusResponse> {
    const res = await authFetch(`${API_BASE}/focus/recalculate`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  // Focus Comparison Sets (Persisted in Supabase PostgreSQL per user)
  async getFocusComparisons(): Promise<FocusComparisonItem[]> {
    const res = await authFetch(`${API_BASE}/focus/comparisons`);
    const json = await res.json();
    return json.data || [];
  },

  async saveFocusComparison(payload: {
    name: string;
    symbols: string[];
    notes?: string;
    isFavorite?: boolean;
  }): Promise<FocusComparisonItem> {
    const res = await authFetch(`${API_BASE}/focus/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteFocusComparison(id: string): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`${API_BASE}/focus/comparisons/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  // User Settings & Preferences (Supabase PostgreSQL)
  async getUserSettings(): Promise<ClientUserSettings> {
    const res = await authFetch(`${API_BASE}/settings`);
    const json = await res.json();
    return json.data;
  },

  async updateUserSettings(payload: Partial<ClientUserSettings> & {
    bitkubApiSecret?: string;
    binanceApiSecret?: string;
    lineNotifyToken?: string;
    telegramBotToken?: string;
  }): Promise<ClientUserSettings> {
    const res = await authFetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
    const res = await authFetch(`${API_BASE}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchange }),
    });
    return await res.json();
  },

  // Auth & Rate Limiting
  async login(username: string, password: string): Promise<{
    success: boolean;
    isLocked: boolean;
    attempts: number;
    maxAttempts: number;
    ip?: string;
    message: string;
    user?: {
      id?: string;
      username: string;
      name: string;
      role: 'admin' | 'platinum' | 'premium' | 'gold' | 'free';
      loggedInAt: string;
    };
  }> {
    const res = await authFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await res.json();
  },

  async getAuthStatus(): Promise<{
    success: boolean;
    data: {
      ip: string;
      attempts: number;
      maxAttempts: number;
      isLocked: boolean;
      lockedAt?: number;
    };
  }> {
    const res = await authFetch(`${API_BASE}/auth/status`);
    return await res.json();
  },

  async resetAuthLock(): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`${API_BASE}/auth/reset-lock`, { method: 'POST' });
    return await res.json();
  },
};


