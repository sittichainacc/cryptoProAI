// ============================================================================
// External Market Data Provider Interface (Master Prompt Section 31)
// ============================================================================

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  averageVolume30d: number;
  marketCap: number;
  peRatio?: number;
  forwardPE?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timestamp: string;
  source: string;
}

export interface StockCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundamentalData {
  symbol: string;
  revenueTTM: number;
  revenueGrowthYoY: number;
  netIncomeTTM: number;
  epsTTM: number;
  operatingMargin: number;
  grossMargin: number;
  freeCashFlowTTM: number;
  roe: number;
  roic: number;
  debtToEquity: number;
  currentRatio: number;
  piotroskiFScore: number;
  lastUpdated: string;
}

export interface IMarketDataProvider {
  readonly providerName: string;

  getQuote(symbol: string): Promise<StockQuote | null>;
  getBatchQuotes(symbols: string[]): Promise<Map<string, StockQuote>>;
  getHistoricalCandles(symbol: string, interval: '1d' | '1h' | '15m', limit?: number): Promise<StockCandle[]>;
  getFundamentals(symbol: string): Promise<FundamentalData | null>;
  isMarketOpen(): boolean;
}

export interface INewsProvider {
  readonly providerName: string;
  getCompanyNews(symbol: string, limit?: number): Promise<{
    headline: string;
    summary: string;
    source: string;
    url: string;
    publishedAt: string;
    sentimentScore: number;
  }[]>;
}

export interface IFilingProvider {
  readonly providerName: string;
  getRecentFilings(symbol: string, formTypes?: ('10-K' | '10-Q' | '8-K')[]): Promise<{
    formType: string;
    filingDate: string;
    acceptanceDateTime: string;
    reportUrl: string;
    description: string;
  }[]>;
}

export interface IMacroProvider {
  readonly providerName: string;
  getMacroIndicators(): Promise<{
    us10yYield: number;
    us2yYield: number;
    yieldCurveSpread: number;
    vix: number;
    dxyIndex: number;
    fedFundsRate: number;
    cpiInflationRate: number;
    updatedAt: string;
  }>;
}
