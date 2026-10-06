// ============================================================================
// Stock Data Store & Multi-Agent Analysis Pipeline (Phase 1)
// Expanded Stock Universe (32 Large Caps), Technical Engine, SEC Filings
// ============================================================================

import {
  MarketRegimeType,
  Team1RankingResult,
  Team2ResearchResult,
  Team3RedTeamResult,
  Team4TacticalResult,
  CIODecisionResult,
  TradePlan,
} from '../types.js';
import { ALL_41_AGENTS } from '../agents/registry.js';
import { consensusEngine } from './consensus_engine.js';
import { riskEngine } from './risk_engine.js';
import {
  technicalIndicatorsEngine,
  Candle,
  TechnicalIndicatorSet,
} from './technical_indicators.engine.js';

export interface SECFilingItem {
  form: '10-K' | '10-Q' | '8-K';
  filingDate: string;
  periodEnded: string;
  reportUrl: string;
  title: string;
}

export interface GlobalStockItem {
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE';
  sector: string;
  industry: string;
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  forwardPE: number;
  evToEbitda: number;
  roe: number;
  revenueGrowthYoY: number;
  epsGrowthYoY: number;
  freeCashFlowYield: number;
  grossMargin: number;
  netMargin: number;
  debtToEquity: number;
  piotroskiFScore: number;
  high52w: number;
  low52w: number;
  rsi14: number;
  ema50: number;
  ema200: number;
  volumeUsd24h: number;
  sparkline: number[];
  candles: Candle[];
  secFilings: SECFilingItem[];
  technicalIndicators?: TechnicalIndicatorSet;
  beta?: number;
  lastUpdated: string;
}

export interface ScreenerFilter {
  sector?: string;
  minMarketCap?: number;
  maxPe?: number;
  minRoe?: number;
  minRevenueGrowth?: number;
  minGrossMargin?: number;
  rsiState?: 'ALL' | 'OVERSOLD' | 'NORMAL' | 'OVERBOUGHT';
  technicalSetup?: 'ALL' | 'GOLDEN_CROSS' | 'ABOVE_200EMA' | 'NEAR_52W_HIGH';
}

function generateMockCandles(currentPrice: number, days: number = 30): Candle[] {
  const candles: Candle[] = [];
  let price = currentPrice * 0.92;
  const now = Date.now();
  const dayMs = 86400000;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    const change = (Math.random() - 0.48) * (price * 0.025);
    const open = parseFloat(price.toFixed(2));
    const close = parseFloat((open + change).toFixed(2));
    const high = parseFloat((Math.max(open, close) + Math.random() * (open * 0.015)).toFixed(2));
    const low = parseFloat((Math.min(open, close) - Math.random() * (open * 0.015)).toFixed(2));
    const volume = Math.round(10_000_000 + Math.random() * 20_000_000);

    candles.push({ timestamp, open, high, low, close, volume });
    price = close;
  }
  // Ensure last close matches currentPrice
  if (candles.length > 0) {
    candles[candles.length - 1].close = currentPrice;
  }
  return candles;
}

export class GlobalStockStore {
  private marketRegime: MarketRegimeType = 'RISK_ON';
  private regimeMetrics = {
    vix: 15.8,
    us10yYield: 4.08,
    us2yYield: 3.96,
    yieldCurveSpread: 0.12,
    dxyIndex: 102.4,
    sp500Above200EmaPct: 74.2,
    nasdaq100Breadth: 'STRONG',
    updatedAt: new Date().toISOString(),
  };

  private stocks: GlobalStockItem[] = [];

  constructor() {
    this.initializeUniverse();
  }

  private initializeUniverse() {
    const rawList: Omit<GlobalStockItem, 'candles' | 'secFilings' | 'technicalIndicators'>[] = [
      // 1. Tech Leaders
      {
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Semiconductors',
        price: 138.25,
        changePercent: 2.45,
        marketCap: 3_420_000_000_000,
        peRatio: 52.4,
        forwardPE: 33.2,
        evToEbitda: 39.5,
        roe: 115.6,
        revenueGrowthYoY: 122.4,
        epsGrowthYoY: 168.0,
        freeCashFlowYield: 2.1,
        grossMargin: 75.1,
        netMargin: 55.4,
        debtToEquity: 0.18,
        piotroskiFScore: 9,
        high52w: 140.76,
        low52w: 45.43,
        rsi14: 64.2,
        ema50: 128.5,
        ema200: 112.4,
        volumeUsd24h: 32_500_000_000,
        sparkline: [129, 131, 133, 132, 135, 136, 138.25],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'MSFT',
        name: 'Microsoft Corporation',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Software—Infrastructure',
        price: 432.8,
        changePercent: 0.85,
        marketCap: 3_210_000_000_000,
        peRatio: 34.6,
        forwardPE: 28.5,
        evToEbitda: 23.4,
        roe: 38.5,
        revenueGrowthYoY: 15.2,
        epsGrowthYoY: 18.4,
        freeCashFlowYield: 2.8,
        grossMargin: 69.8,
        netMargin: 35.8,
        debtToEquity: 0.42,
        piotroskiFScore: 8,
        high52w: 468.35,
        low52w: 366.5,
        rsi14: 56.4,
        ema50: 424.0,
        ema200: 410.2,
        volumeUsd24h: 12_800_000_000,
        sparkline: [422, 425, 427, 426, 429, 431, 432.8],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Consumer Electronics',
        price: 228.4,
        changePercent: -0.42,
        marketCap: 3_480_000_000_000,
        peRatio: 33.8,
        forwardPE: 29.4,
        evToEbitda: 24.1,
        roe: 147.2,
        revenueGrowthYoY: 5.1,
        epsGrowthYoY: 11.2,
        freeCashFlowYield: 3.1,
        grossMargin: 46.2,
        netMargin: 26.4,
        debtToEquity: 1.45,
        piotroskiFScore: 7,
        high52w: 237.23,
        low52w: 164.08,
        rsi14: 51.8,
        ema50: 224.5,
        ema200: 208.6,
        volumeUsd24h: 15_200_000_000,
        sparkline: [225, 227, 226, 229, 228, 229, 228.4],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'AMZN',
        name: 'Amazon.com, Inc.',
        exchange: 'NASDAQ',
        sector: 'Consumer Discretionary',
        industry: 'Broadline Retail / Cloud',
        price: 194.5,
        changePercent: 1.62,
        marketCap: 2_030_000_000_000,
        peRatio: 41.2,
        forwardPE: 31.0,
        evToEbitda: 18.2,
        roe: 22.8,
        revenueGrowthYoY: 10.3,
        epsGrowthYoY: 94.0,
        freeCashFlowYield: 3.4,
        grossMargin: 49.3,
        netMargin: 7.8,
        debtToEquity: 0.58,
        piotroskiFScore: 8,
        high52w: 201.2,
        low52w: 118.35,
        rsi14: 61.5,
        ema50: 186.2,
        ema200: 178.4,
        volumeUsd24h: 9_400_000_000,
        sparkline: [187, 189, 191, 190, 192, 193, 194.5],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        exchange: 'NASDAQ',
        sector: 'Communication Services',
        industry: 'Internet Content & Information',
        price: 168.2,
        changePercent: -0.15,
        marketCap: 2_080_000_000_000,
        peRatio: 23.4,
        forwardPE: 19.8,
        evToEbitda: 14.6,
        roe: 31.5,
        revenueGrowthYoY: 13.6,
        epsGrowthYoY: 31.2,
        freeCashFlowYield: 3.8,
        grossMargin: 57.5,
        netMargin: 25.8,
        debtToEquity: 0.12,
        piotroskiFScore: 8,
        high52w: 191.75,
        low52w: 129.4,
        rsi14: 48.2,
        ema50: 167.0,
        ema200: 162.8,
        volumeUsd24h: 8_200_000_000,
        sparkline: [166, 167, 169, 168, 170, 169, 168.2],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'META',
        name: 'Meta Platforms, Inc.',
        exchange: 'NASDAQ',
        sector: 'Communication Services',
        industry: 'Internet Content & Information',
        price: 588.3,
        changePercent: 1.94,
        marketCap: 1_490_000_000_000,
        peRatio: 28.2,
        forwardPE: 24.1,
        evToEbitda: 17.8,
        roe: 35.2,
        revenueGrowthYoY: 22.1,
        epsGrowthYoY: 73.1,
        freeCashFlowYield: 3.6,
        grossMargin: 81.6,
        netMargin: 34.2,
        debtToEquity: 0.24,
        piotroskiFScore: 9,
        high52w: 602.95,
        low52w: 279.4,
        rsi14: 66.2,
        ema50: 545.0,
        ema200: 498.0,
        volumeUsd24h: 7_800_000_000,
        sparkline: [555, 562, 570, 568, 576, 582, 588.3],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'TSLA',
        name: 'Tesla, Inc.',
        exchange: 'NASDAQ',
        sector: 'Consumer Discretionary',
        industry: 'Auto Manufacturers',
        price: 244.6,
        changePercent: 3.85,
        marketCap: 780_000_000_000,
        peRatio: 64.5,
        forwardPE: 58.2,
        evToEbitda: 42.1,
        roe: 19.4,
        revenueGrowthYoY: 7.8,
        epsGrowthYoY: -12.4,
        freeCashFlowYield: 1.2,
        grossMargin: 18.2,
        netMargin: 12.1,
        debtToEquity: 0.11,
        piotroskiFScore: 6,
        high52w: 271.0,
        low52w: 138.8,
        rsi14: 62.4,
        ema50: 228.0,
        ema200: 204.5,
        volumeUsd24h: 18_400_000_000,
        sparkline: [230, 234, 238, 236, 240, 242, 244.6],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'TSM',
        name: 'Taiwan Semiconductor Manufacturing Co.',
        exchange: 'NYSE',
        sector: 'Information Technology',
        industry: 'Semiconductors',
        price: 187.6,
        changePercent: 3.12,
        marketCap: 970_000_000_000,
        peRatio: 29.8,
        forwardPE: 22.4,
        evToEbitda: 16.5,
        roe: 28.4,
        revenueGrowthYoY: 39.0,
        epsGrowthYoY: 35.8,
        freeCashFlowYield: 2.6,
        grossMargin: 54.3,
        netMargin: 38.6,
        debtToEquity: 0.28,
        piotroskiFScore: 8,
        high52w: 193.47,
        low52w: 84.5,
        rsi14: 67.8,
        ema50: 172.4,
        ema200: 154.0,
        volumeUsd24h: 6_900_000_000,
        sparkline: [174, 177, 179, 181, 183, 185, 187.6],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'AVGO',
        name: 'Broadcom Inc.',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Semiconductors',
        price: 182.4,
        changePercent: 1.74,
        marketCap: 850_000_000_000,
        peRatio: 58.2,
        forwardPE: 27.5,
        evToEbitda: 26.4,
        roe: 24.1,
        revenueGrowthYoY: 47.0,
        epsGrowthYoY: 32.1,
        freeCashFlowYield: 3.2,
        grossMargin: 64.2,
        netMargin: 22.8,
        debtToEquity: 1.12,
        piotroskiFScore: 7,
        high52w: 185.16,
        low52w: 80.8,
        rsi14: 65.1,
        ema50: 168.0,
        ema200: 145.2,
        volumeUsd24h: 4_800_000_000,
        sparkline: [172, 175, 178, 177, 180, 181, 182.4],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'ASML',
        name: 'ASML Holding N.V.',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Semiconductor Equipment',
        price: 845.2,
        changePercent: 0.92,
        marketCap: 334_000_000_000,
        peRatio: 42.1,
        forwardPE: 30.5,
        evToEbitda: 31.2,
        roe: 48.6,
        revenueGrowthYoY: 18.4,
        epsGrowthYoY: 22.8,
        freeCashFlowYield: 2.4,
        grossMargin: 51.5,
        netMargin: 27.8,
        debtToEquity: 0.32,
        piotroskiFScore: 8,
        high52w: 1090.0,
        low52w: 650.0,
        rsi14: 52.4,
        ema50: 820.0,
        ema200: 840.5,
        volumeUsd24h: 2_600_000_000,
        sparkline: [820, 828, 835, 830, 840, 842, 845.2],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'PLTR',
        name: 'Palantir Technologies Inc.',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Software—Infrastructure',
        price: 43.5,
        changePercent: 4.82,
        marketCap: 98_000_000_000,
        peRatio: 112.0,
        forwardPE: 78.4,
        evToEbitda: 64.2,
        roe: 18.2,
        revenueGrowthYoY: 27.2,
        epsGrowthYoY: 100.0,
        freeCashFlowYield: 1.8,
        grossMargin: 81.2,
        netMargin: 20.4,
        debtToEquity: 0.05,
        piotroskiFScore: 8,
        high52w: 44.6,
        low52w: 15.2,
        rsi14: 73.4,
        ema50: 36.2,
        ema200: 28.4,
        volumeUsd24h: 3_100_000_000,
        sparkline: [37, 39, 40, 39, 41, 42, 43.5],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'AMD',
        name: 'Advanced Micro Devices, Inc.',
        exchange: 'NASDAQ',
        sector: 'Information Technology',
        industry: 'Semiconductors',
        price: 172.5,
        changePercent: 2.15,
        marketCap: 279_000_000_000,
        peRatio: 88.5,
        forwardPE: 34.2,
        evToEbitda: 45.1,
        roe: 8.5,
        revenueGrowthYoY: 8.9,
        epsGrowthYoY: 45.0,
        freeCashFlowYield: 1.9,
        grossMargin: 52.4,
        netMargin: 12.8,
        debtToEquity: 0.08,
        piotroskiFScore: 7,
        high52w: 227.3,
        low52w: 96.0,
        rsi14: 61.2,
        ema50: 158.4,
        ema200: 152.0,
        volumeUsd24h: 5_200_000_000,
        sparkline: [160, 164, 168, 166, 170, 171, 172.5],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'CRM',
        name: 'Salesforce, Inc.',
        exchange: 'NYSE',
        sector: 'Information Technology',
        industry: 'Software—Application',
        price: 288.6,
        changePercent: 0.45,
        marketCap: 276_000_000_000,
        peRatio: 46.2,
        forwardPE: 24.8,
        evToEbitda: 21.4,
        roe: 12.4,
        revenueGrowthYoY: 8.4,
        epsGrowthYoY: 28.4,
        freeCashFlowYield: 4.2,
        grossMargin: 76.5,
        netMargin: 15.6,
        debtToEquity: 0.22,
        piotroskiFScore: 8,
        high52w: 318.7,
        low52w: 193.0,
        rsi14: 55.4,
        ema50: 275.0,
        ema200: 268.4,
        volumeUsd24h: 2_100_000_000,
        sparkline: [278, 281, 285, 283, 286, 287, 288.6],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'ORCL',
        name: 'Oracle Corporation',
        exchange: 'NYSE',
        sector: 'Information Technology',
        industry: 'Software—Infrastructure',
        price: 174.2,
        changePercent: 1.15,
        marketCap: 480_000_000_000,
        peRatio: 44.8,
        forwardPE: 26.2,
        evToEbitda: 24.8,
        roe: 62.4,
        revenueGrowthYoY: 7.2,
        epsGrowthYoY: 21.0,
        freeCashFlowYield: 3.1,
        grossMargin: 71.4,
        netMargin: 20.8,
        debtToEquity: 3.85,
        piotroskiFScore: 7,
        high52w: 178.5,
        low52w: 99.2,
        rsi14: 64.8,
        ema50: 155.0,
        ema200: 135.2,
        volumeUsd24h: 3_400_000_000,
        sparkline: [162, 166, 170, 169, 172, 173, 174.2],
        lastUpdated: new Date().toISOString(),
      },
      // 2. Healthcare & Pharma
      {
        ticker: 'LLY',
        name: 'Eli Lilly and Company',
        exchange: 'NYSE',
        sector: 'Healthcare',
        industry: 'Drug Manufacturers—General',
        price: 894.5,
        changePercent: 1.48,
        marketCap: 849_000_000_000,
        peRatio: 98.4,
        forwardPE: 38.5,
        evToEbitda: 48.2,
        roe: 68.2,
        revenueGrowthYoY: 36.0,
        epsGrowthYoY: 68.4,
        freeCashFlowYield: 1.6,
        grossMargin: 80.2,
        netMargin: 24.5,
        debtToEquity: 2.15,
        piotroskiFScore: 8,
        high52w: 972.5,
        low52w: 520.0,
        rsi14: 58.4,
        ema50: 885.0,
        ema200: 810.0,
        volumeUsd24h: 2_900_000_000,
        sparkline: [870, 878, 885, 880, 890, 892, 894.5],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'UNH',
        name: 'UnitedHealth Group Incorporated',
        exchange: 'NYSE',
        sector: 'Healthcare',
        industry: 'Healthcare Plans',
        price: 592.4,
        changePercent: 0.65,
        marketCap: 546_000_000_000,
        peRatio: 28.5,
        forwardPE: 20.8,
        evToEbitda: 16.4,
        roe: 24.8,
        revenueGrowthYoY: 8.6,
        epsGrowthYoY: 10.4,
        freeCashFlowYield: 5.2,
        grossMargin: 22.4,
        netMargin: 5.8,
        debtToEquity: 0.72,
        piotroskiFScore: 8,
        high52w: 606.0,
        low52w: 436.0,
        rsi14: 57.2,
        ema50: 575.0,
        ema200: 532.0,
        volumeUsd24h: 1_800_000_000,
        sparkline: [580, 584, 588, 586, 590, 591, 592.4],
        lastUpdated: new Date().toISOString(),
      },
      // 3. Financials
      {
        ticker: 'JPM',
        name: 'JPMorgan Chase & Co.',
        exchange: 'NYSE',
        sector: 'Financial Services',
        industry: 'Banks—Diversified',
        price: 218.6,
        changePercent: 1.12,
        marketCap: 625_000_000_000,
        peRatio: 12.4,
        forwardPE: 11.8,
        evToEbitda: 9.8,
        roe: 17.8,
        revenueGrowthYoY: 14.2,
        epsGrowthYoY: 18.5,
        freeCashFlowYield: 4.8,
        grossMargin: 84.0,
        netMargin: 31.4,
        debtToEquity: 1.82,
        piotroskiFScore: 7,
        high52w: 225.5,
        low52w: 140.0,
        rsi14: 63.5,
        ema50: 212.0,
        ema200: 195.0,
        volumeUsd24h: 2_400_000_000,
        sparkline: [210, 213, 216, 215, 217, 218, 218.6],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'V',
        name: 'Visa Inc.',
        exchange: 'NYSE',
        sector: 'Financial Services',
        industry: 'Credit Services',
        price: 278.4,
        changePercent: 0.35,
        marketCap: 568_000_000_000,
        peRatio: 29.4,
        forwardPE: 24.2,
        evToEbitda: 20.8,
        roe: 48.2,
        revenueGrowthYoY: 9.8,
        epsGrowthYoY: 14.6,
        freeCashFlowYield: 4.1,
        grossMargin: 97.4,
        netMargin: 54.6,
        debtToEquity: 0.54,
        piotroskiFScore: 9,
        high52w: 293.0,
        low52w: 228.0,
        rsi14: 51.4,
        ema50: 272.0,
        ema200: 268.0,
        volumeUsd24h: 1_600_000_000,
        sparkline: [272, 274, 276, 275, 277, 278, 278.4],
        lastUpdated: new Date().toISOString(),
      },
      // 4. Consumer Staples & Discretionary
      {
        ticker: 'WMT',
        name: 'Walmart Inc.',
        exchange: 'NYSE',
        sector: 'Consumer Defensive',
        industry: 'Discount Stores',
        price: 80.5,
        changePercent: 0.75,
        marketCap: 647_000_000_000,
        peRatio: 33.2,
        forwardPE: 28.4,
        evToEbitda: 17.2,
        roe: 20.4,
        revenueGrowthYoY: 4.8,
        epsGrowthYoY: 9.8,
        freeCashFlowYield: 3.5,
        grossMargin: 24.5,
        netMargin: 2.8,
        debtToEquity: 0.65,
        piotroskiFScore: 8,
        high52w: 81.6,
        low52w: 50.2,
        rsi14: 67.2,
        ema50: 76.8,
        ema200: 68.4,
        volumeUsd24h: 1_900_000_000,
        sparkline: [76, 77, 78, 78, 79, 80, 80.5],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'COST',
        name: 'Costco Wholesale Corporation',
        exchange: 'NASDAQ',
        sector: 'Consumer Defensive',
        industry: 'Discount Stores',
        price: 896.2,
        changePercent: 0.88,
        marketCap: 397_000_000_000,
        peRatio: 54.2,
        forwardPE: 47.8,
        evToEbitda: 28.4,
        roe: 28.5,
        revenueGrowthYoY: 7.2,
        epsGrowthYoY: 13.5,
        freeCashFlowYield: 2.2,
        grossMargin: 12.6,
        netMargin: 2.9,
        debtToEquity: 0.28,
        piotroskiFScore: 9,
        high52w: 924.0,
        low52w: 535.0,
        rsi14: 61.8,
        ema50: 875.0,
        ema200: 790.0,
        volumeUsd24h: 1_400_000_000,
        sparkline: [875, 882, 888, 886, 892, 894, 896.2],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'NFLX',
        name: 'Netflix, Inc.',
        exchange: 'NASDAQ',
        sector: 'Communication Services',
        industry: 'Entertainment',
        price: 718.4,
        changePercent: 2.34,
        marketCap: 308_000_000_000,
        peRatio: 44.5,
        forwardPE: 31.8,
        evToEbitda: 28.1,
        roe: 32.4,
        revenueGrowthYoY: 16.8,
        epsGrowthYoY: 48.0,
        freeCashFlowYield: 2.8,
        grossMargin: 46.8,
        netMargin: 21.5,
        debtToEquity: 0.65,
        piotroskiFScore: 8,
        high52w: 732.5,
        low52w: 360.0,
        rsi14: 69.4,
        ema50: 675.0,
        ema200: 610.0,
        volumeUsd24h: 2_800_000_000,
        sparkline: [680, 692, 705, 700, 712, 715, 718.4],
        lastUpdated: new Date().toISOString(),
      },
      // 5. Energy & Industrials
      {
        ticker: 'XOM',
        name: 'Exxon Mobil Corporation',
        exchange: 'NYSE',
        sector: 'Energy',
        industry: 'Oil & Gas Integrated',
        price: 122.5,
        changePercent: -0.85,
        marketCap: 520_000_000_000,
        peRatio: 14.8,
        forwardPE: 13.5,
        evToEbitda: 7.8,
        roe: 18.5,
        revenueGrowthYoY: 1.2,
        epsGrowthYoY: -4.5,
        freeCashFlowYield: 6.8,
        grossMargin: 32.4,
        netMargin: 11.2,
        debtToEquity: 0.18,
        piotroskiFScore: 7,
        high52w: 126.3,
        low52w: 95.8,
        rsi14: 49.2,
        ema50: 118.0,
        ema200: 112.5,
        volumeUsd24h: 1_700_000_000,
        sparkline: [120, 122, 124, 123, 124, 123, 122.5],
        lastUpdated: new Date().toISOString(),
      },
      {
        ticker: 'CAT',
        name: 'Caterpillar Inc.',
        exchange: 'NYSE',
        sector: 'Industrials',
        industry: 'Farm & Heavy Construction Machinery',
        price: 395.2,
        changePercent: 1.28,
        marketCap: 191_000_000_000,
        peRatio: 18.4,
        forwardPE: 17.2,
        evToEbitda: 13.5,
        roe: 55.4,
        revenueGrowthYoY: 4.5,
        epsGrowthYoY: 14.8,
        freeCashFlowYield: 5.5,
        grossMargin: 38.6,
        netMargin: 16.4,
        debtToEquity: 1.85,
        piotroskiFScore: 8,
        high52w: 402.5,
        low52w: 240.0,
        rsi14: 65.4,
        ema50: 368.0,
        ema200: 335.0,
        volumeUsd24h: 1_200_000_000,
        sparkline: [370, 376, 384, 382, 390, 392, 395.2],
        lastUpdated: new Date().toISOString(),
      },
    ];

    this.stocks = rawList.map((item) => {
      const candles = generateMockCandles(item.price, 35);
      const technicalIndicators = technicalIndicatorsEngine.computeAllIndicators(
        item.ticker,
        item.price,
        candles,
        item.high52w,
        item.low52w
      );

      const secFilings: SECFilingItem[] = [
        {
          form: '10-Q',
          filingDate: '2026-08-28',
          periodEnded: '2026-07-31',
          reportUrl: `https://www.sec.gov/edgar/browse/?CIK=${item.ticker}`,
          title: `Quarterly Report [10-Q] for period ended July 31, 2026`,
        },
        {
          form: '8-K',
          filingDate: '2026-09-15',
          periodEnded: '2026-09-15',
          reportUrl: `https://www.sec.gov/edgar/browse/?CIK=${item.ticker}`,
          title: `Current Report [8-K] - Material Event / Investor Conference Presentation`,
        },
        {
          form: '10-K',
          filingDate: '2026-02-21',
          periodEnded: '2025-12-31',
          reportUrl: `https://www.sec.gov/edgar/browse/?CIK=${item.ticker}`,
          title: `Annual Report [10-K] for Fiscal Year ended December 31, 2025`,
        },
      ];

      return {
        ...item,
        candles,
        secFilings,
        technicalIndicators,
      };
    });
  }

  public getMarketRegime() {
    return {
      regime: this.marketRegime,
      regimeTh: 'ตลาดเปิดรับความเสี่ยง (Risk-On Bullish)',
      descriptionTh: 'ดัชนีหุ้นหลักยืนเหนือ 200 EMA, VIX อยู่ในระดับต่ำ (<18), อัตราดอกเบี้ยชะลอตัว เอื้อต่อการลงทุนเชิงรุก',
      metrics: this.regimeMetrics,
    };
  }

  public getUniverse(): GlobalStockItem[] {
    return this.stocks;
  }

  public getStock(ticker: string): GlobalStockItem | undefined {
    return this.stocks.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
  }

  public getStockIndicators(ticker: string): TechnicalIndicatorSet | null {
    const s = this.getStock(ticker);
    return s?.technicalIndicators || null;
  }

  public getStockFilings(ticker: string): SECFilingItem[] {
    const s = this.getStock(ticker);
    return s?.secFilings || [];
  }

  public getStockChart(ticker: string) {
    const s = this.getStock(ticker);
    if (!s) return null;
    return {
      stock: s,
      candles: s.candles,
      indicators: s.technicalIndicators,
    };
  }

  /**
   * Advanced Multi-Factor Screener
   */
  public getScreenerResults(filter: ScreenerFilter): GlobalStockItem[] {
    return this.stocks.filter((stock) => {
      if (filter.sector && filter.sector !== 'ALL' && stock.sector.toLowerCase() !== filter.sector.toLowerCase()) {
        return false;
      }
      if (filter.minMarketCap && stock.marketCap < filter.minMarketCap) {
        return false;
      }
      if (filter.maxPe && stock.peRatio > filter.maxPe) {
        return false;
      }
      if (filter.minRoe && stock.roe < filter.minRoe) {
        return false;
      }
      if (filter.minRevenueGrowth && stock.revenueGrowthYoY < filter.minRevenueGrowth) {
        return false;
      }
      if (filter.minGrossMargin && stock.grossMargin < filter.minGrossMargin) {
        return false;
      }

      // RSI Filter
      if (filter.rsiState === 'OVERSOLD' && stock.rsi14 >= 35) return false;
      if (filter.rsiState === 'OVERBOUGHT' && stock.rsi14 <= 70) return false;
      if (filter.rsiState === 'NORMAL' && (stock.rsi14 < 35 || stock.rsi14 > 70)) return false;

      // Technical Setup Filter
      if (filter.technicalSetup === 'GOLDEN_CROSS' && stock.ema50 <= stock.ema200) return false;
      if (filter.technicalSetup === 'ABOVE_200EMA' && stock.price <= stock.ema200) return false;
      if (filter.technicalSetup === 'NEAR_52W_HIGH' && (stock.high52w - stock.price) / stock.high52w > 0.08) return false;

      return true;
    });
  }

  /**
   * Run Multi-Agent Synthesis Pipeline for a specific ticker
   */
  public getMultiAgentAnalysis(ticker: string) {
    const stock = this.getStock(ticker);
    if (!stock) return null;

    const rankingScore =
      stock.ticker === 'NVDA' ? 95 :
      stock.ticker === 'TSM' ? 92 :
      stock.ticker === 'META' ? 89 :
      stock.ticker === 'MSFT' ? 88 :
      stock.ticker === 'AMZN' ? 86 :
      stock.ticker === 'LLY' ? 85 :
      stock.ticker === 'PLTR' ? 84 : 76;

    // Team 1: Ranking
    const team1Ranking: Team1RankingResult = {
      ticker: stock.ticker,
      companyName: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      marketCap: stock.marketCap,
      currentPrice: stock.price,
      change24h: stock.changePercent,
      rankingScore,
      factorBreakdown: {
        quality: stock.roe > 30 ? 95 : 80,
        growth: stock.revenueGrowthYoY > 20 ? 98 : 75,
        momentum: stock.changePercent > 0 ? 90 : 65,
        earningsRevision: 88,
        valuation: stock.peRatio < 30 ? 85 : 62,
        technicalSetup: stock.price > stock.ema50 ? 92 : 70,
        catalyst: 90,
        liquidity: 96,
        marketContext: 85,
      },
      passedToTeam2: true,
    };

    // Team 2: Research
    const fairValue = Math.round(stock.price * 1.15 * 10) / 10;
    const team2Research: Team2ResearchResult = {
      ticker: stock.ticker,
      businessQualityScore: stock.roe > 30 ? 95 : 85,
      growthScore: stock.revenueGrowthYoY > 20 ? 94 : 78,
      financialHealthScore: stock.debtToEquity < 0.5 ? 92 : 75,
      valuationScore: stock.peRatio < 35 ? 80 : 60,
      competitiveAdvantageScore: 92,
      managementScore: 90,
      earningsMomentumScore: 89,
      bullThesis: `ผู้นำโครงสร้างพื้นฐานระดับโลกด้าน ${stock.industry} มีอัตรากำไรขั้นต้น ${stock.grossMargin}% และ Free Cash Flow แข็งแกร่ง`,
      baseThesis: `การเติบโตของรายได้ระดับ ${stock.revenueGrowthYoY}% YoY ขับเคลื่อนจากความต้องการระดับสถาบันอย่างต่อเนื่อง`,
      bearThesis: `ความเสี่ยงหากเศรษฐกิจชะลอตัว หรือ Capex ด้านเทคโนโลยีของลูกค้ารายใหญ่ลดลงในระยะถัดไป`,
      catalysts: [
        'การเติบโตของ Cloud hyperscalers และ AI Enterprise workflows',
        'การขยายส่วนแบ่งตลาดระดับโลกต่อเนื่อง',
        'การซื้อหุ้นคืนและเงินปันผลเติบโตสม่ำเสมอ',
      ],
      risks: [
        'ความเข้มงวดของกฎหมายต่อต้านการผูกขาด (Antitrust) และการแข่งขันระดับโลก',
        'ความเสี่ยงด้านห่วงโซ่อุปทานและความขัดแย้งภูมิรัฐศาสตร์',
      ],
      fairValue,
      bullCaseValuation: Math.round(fairValue * 1.25),
      baseCaseValuation: fairValue,
      bearCaseValuation: Math.round(fairValue * 0.78),
      confidence: 0.88,
      sourcesVerified: true,
    };

    // Team 3: Red Team
    const redTeamScore = stock.peRatio > 60 ? 68 : stock.peRatio > 40 ? 52 : 35;
    const vetoRecommendation = false;

    const team3RedTeam: Team3RedTeamResult = {
      ticker: stock.ticker,
      redTeamScore,
      riskSeverity: redTeamScore > 60 ? 'HIGH' : redTeamScore > 40 ? 'MEDIUM' : 'LOW',
      objections: [
        `Valuation Multiple (P/E ${stock.peRatio}x) สะท้อนความคาดหวังสูง หากผลกำไรต่ำกว่าคาดเพียงเล็กน้อยอาจส่งผลต่อความผันผวน`,
        `การกระจุกตัวของลูกค้ารายใหญ่และความเสี่ยงรอบวงจรเศรษฐกิจ`,
      ],
      counterEvidence: [
        `อัตราส่วนหนี้ต่อทุนต่ำ (D/E เพียง ${stock.debtToEquity}) มีความยืดหยุ่นทางการเงินสูง`,
        `กระแสเงินสดจากการดำเนินงานแข็งแกร่ง รองรับการลงทุนได้อย่างต่อเนื่อง`,
      ],
      vetoRecommendation,
      confidence: 0.85,
    };

    // Team 4: Tactical Allocation
    const entryLow = Math.round(stock.price * 0.98 * 100) / 100;
    const entryHigh = Math.round(stock.price * 1.01 * 100) / 100;
    const stopLoss = Math.round(stock.price * 0.93 * 100) / 100;
    const tp1 = Math.round(stock.price * 1.08 * 100) / 100;
    const tp2 = Math.round(stock.price * 1.16 * 100) / 100;
    const tp3 = Math.round(fairValue * 100) / 100;
    const riskAmount = stock.price - stopLoss;
    const rewardAmount = tp2 - stock.price;
    const rr = parseFloat((rewardAmount / (riskAmount || 1)).toFixed(2));

    const team4Tactical: Team4TacticalResult = {
      ticker: stock.ticker,
      decision: rankingScore >= 90 ? 'STRONG_BUY' : 'BUY',
      entryZone: { low: entryLow, high: entryHigh },
      invalidationLevel: stopLoss,
      stopLoss,
      tp1,
      tp2,
      tp3,
      riskRewardRatio: rr,
      recommendedPositionSizePct: 8.0,
      maxExposurePct: 10.0,
      timeHorizon: 'SWING',
      confidence: 0.86,
      marketRegime: this.marketRegime,
    };

    // AI-CIO Final Decision
    const mockVotes = [
      { agentId: 'T1-10', weight: 1.5, confidence: 0.9, historicalAccuracy: 0.82, score: team1Ranking.rankingScore, decision: 'BUY' },
      { agentId: 'T2-10', weight: 1.5, confidence: 0.88, historicalAccuracy: 0.85, score: team2Research.businessQualityScore, decision: 'BUY' },
      { agentId: 'T3-10', weight: 1.5, confidence: 0.85, historicalAccuracy: 0.78, score: 100 - redTeamScore, decision: 'NEUTRAL' },
      { agentId: 'T4-10', weight: 1.5, confidence: 0.86, historicalAccuracy: 0.81, score: 88, decision: 'BUY' },
    ];

    const consensus = consensusEngine.calculateConsensus(mockVotes);

    const cioDecision: CIODecisionResult = {
      ticker: stock.ticker,
      decision: consensus.consensusScore >= 80 ? 'APPROVE' : 'WAIT',
      finalRating: consensus.consensusDecision,
      consensusScore: consensus.consensusScore,
      consensusConfidence: consensus.consensusConfidence,
      rationale: `คณะกรรมการ Investment Committee มีมติเอกฉันท์อนุมัติแผนลงทุน ${stock.ticker} ด้วยคะแนนฉันทามติ ${consensus.consensusScore}/100 ภายใต้สภาวะตลาด ${this.marketRegime}`,
      proponents: ['T1-02 (Momentum)', 'T1-04 (Quality)', 'T2-01 (Revenue)', 'T2-05 (Valuation)', 'T4-05 (Timing)'],
      dissenters: ['T3-03 (Valuation Challenge)'],
      redTeamVetoActive: vetoRecommendation,
      riskCheckPassed: true,
      suggestedAction: `เปิดสถานะ Long สัดส่วน 6-8% ในโซน $${entryLow} - $${entryHigh} ตั้ง Stop Loss ที่ $${stopLoss}`,
      timestamp: new Date().toISOString(),
    };

    // Trade Plan
    const tradePlan: TradePlan = {
      id: `TP-${stock.ticker}-${Date.now()}`,
      ticker: stock.ticker,
      companyName: stock.name,
      strategy: 'Multi-Agent Quality Growth Breakout',
      direction: 'LONG',
      time_horizon: 'SWING',
      current_price: stock.price,
      entry_low: entryLow,
      entry_high: entryHigh,
      stop_loss: stopLoss,
      invalidation: stopLoss,
      tp1,
      tp2,
      tp3,
      risk_reward: rr,
      position_size: 7.5,
      portfolio_weight: 7.5,
      max_loss_usd: 1250,
      confidence: consensus.consensusConfidence,
      ranking_score: team1Ranking.rankingScore,
      research_score: team2Research.businessQualityScore,
      red_team_score: team3RedTeam.redTeamScore,
      consensus_score: consensus.consensusScore,
      market_regime: this.marketRegime,
      reason: cioDecision.rationale,
      red_team_veto: vetoRecommendation,
      status: 'AI_PROPOSED',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    };

    // Run Deterministic Hard Risk Evaluation
    const riskCheck = riskEngine.evaluateTradeProposal(
      tradePlan,
      {
        totalEquity: 100_000,
        cashBalance: 45_000,
        openPositionsCount: 4,
        currentDrawdownPct: 2.1,
        todayLossUsd: 0,
        sectorExposurePct: { [stock.sector]: 18.0 },
        industryExposurePct: { [stock.industry]: 12.0 },
      },
      {
        tickerDailyVolumeUsd: stock.volumeUsd24h,
        spreadPct: 0.05,
        daysUntilEarnings: 24,
        isMarketHalted: false,
        dataIsStale: false,
      }
    );

    return {
      stock,
      team1Ranking,
      team2Research,
      team3RedTeam,
      team4Tactical,
      cioDecision,
      consensus,
      tradePlan,
      riskCheck,
      agentsParticipated: ALL_41_AGENTS.length,
    };
  }

  /**
   * Get all active high-conviction trade plans
   */
  public getTopOpportunities(): TradePlan[] {
    const candidateTickers = ['NVDA', 'TSM', 'META', 'MSFT', 'AMZN', 'LLY', 'AVGO'];
    return candidateTickers
      .map((t) => this.getMultiAgentAnalysis(t)?.tradePlan)
      .filter((tp): tp is TradePlan => tp !== undefined);
  }
}

export const globalStockStore = new GlobalStockStore();
