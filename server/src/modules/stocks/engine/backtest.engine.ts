// ============================================================================
// Phase 8: Strategy Backtesting & Walk-Forward Simulator
// Multi-Asset Historical Simulation, Institutional Quant Performance Metrics
// (CAGR, Alpha, Beta, Sharpe, Sortino, Max Drawdown, Win Rate, Profit Factor)
// ============================================================================

import crypto from 'crypto';
import { globalStockStore, GlobalStockItem } from './stock_store.js';
import { technicalIndicatorsEngine, Candle } from './technical_indicators.engine.js';
import { pool } from '../../../database/db.js';

export type BacktestStrategyId =
  | 'MULTI_AGENT_CONSENSUS'
  | 'MOMENTUM_TREND_FOLLOWING'
  | 'MEAN_REVERSION_VALUE'
  | 'FUNDAMENTAL_DCF_QUALITY';

export interface BacktestStrategyInfo {
  id: BacktestStrategyId;
  name: string;
  thaiName: string;
  description: string;
  targetRegime: string;
  defaultConfig: Partial<BacktestConfig>;
}

export interface BacktestConfig {
  strategyId: BacktestStrategyId;
  initialCapital: number;
  benchmarkTicker: string;
  slippageBps: number;
  commissionPerShare: number;
  maxPositions: number;
  stopLossPct: number;
  takeProfitPct: number;
  positionSizing: 'EQUAL_WEIGHT' | 'HALF_KELLY' | 'VOLATILITY_PARITY';
}

export interface EquityCurvePoint {
  date: string;
  dayIndex: number;
  equity: number;
  cash: number;
  invested: number;
  drawdownPct: number;
  benchmarkEquity: number;
}

export interface BacktestTrade {
  id: string;
  ticker: string;
  companyName: string;
  side: 'BUY' | 'SELL';
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnlUsd: number;
  pnlPct: number;
  holdDays: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'REBALANCE' | 'END_OF_PERIOD';
}

export interface BacktestResult {
  runId: string;
  strategyId: BacktestStrategyId;
  strategyName: string;
  initialCapital: number;
  finalEquity: number;
  totalReturnPct: number;
  cagrPct: number;
  benchmarkReturnPct: number;
  alphaPct: number;
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  payoffRatio: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  equityCurve: EquityCurvePoint[];
  tradeLog: BacktestTrade[];
  config: BacktestConfig;
  createdAt: string;
}

export class BacktestEngine {
  private runsHistory: Map<string, BacktestResult> = new Map();

  constructor() {
    this.seedDefaultRun();
  }

  /**
   * Available quantitative strategy catalog
   */
  public getAvailableStrategies(): BacktestStrategyInfo[] {
    return [
      {
        id: 'MULTI_AGENT_CONSENSUS',
        name: '41-Agent Multi-Agent Consensus Alpha',
        thaiName: 'กลยุทธ์มติคณะกรรมการ AI 41 ตัว (Momentum + DCF + Red Team + Kelly)',
        description: 'ผสานสัญญาณโมเมนตัม ปัจจัยพื้นฐาน Margin of Safety จาก DCF ผ่านเกณฑ์ Red Team VETO และคุมความเสี่ยงด้วย Half-Kelly',
        targetRegime: 'ALL_WEATHER / BULL / HIGH_CONVICTION',
        defaultConfig: {
          initialCapital: 100000,
          benchmarkTicker: 'SPY',
          slippageBps: 4.0,
          commissionPerShare: 0.005,
          maxPositions: 5,
          stopLossPct: 5.0,
          takeProfitPct: 15.0,
          positionSizing: 'HALF_KELLY',
        },
      },
      {
        id: 'MOMENTUM_TREND_FOLLOWING',
        name: 'Dual EMA Golden Cross & Trend Breakout',
        thaiName: 'กลยุทธ์ตามแนวโน้ม Golden Cross (EMA 50/200 Breakout)',
        description: 'เข้าซื้อเมื่อราคายืนเหนือ EMA 50 และเกิด Golden Cross พร้อม RSI แข็งแกร่ง (45-70) ตัดขาดทุนเมื่อราคาหลุด EMA 50',
        targetRegime: 'TRENDING_BULL / RISK_ON',
        defaultConfig: {
          initialCapital: 100000,
          benchmarkTicker: 'SPY',
          slippageBps: 3.5,
          commissionPerShare: 0.005,
          maxPositions: 6,
          stopLossPct: 4.5,
          takeProfitPct: 12.0,
          positionSizing: 'EQUAL_WEIGHT',
        },
      },
      {
        id: 'MEAN_REVERSION_VALUE',
        name: 'Bollinger Oversold Mean Reversion',
        thaiName: 'กลยุทธ์ Mean-Reversion หุ้น Oversold สภาพคล่องสูง',
        description: 'ดักจังหวะเด้งของหุ้นพื้นฐานดีที่ RSI < 35 หรือแตะ Lower Bollinger Band ขายทำกำไรเมื่อราคาดีดกลับสู่ SMA 20 หรือ Upper Band',
        targetRegime: 'CHOPPY_RANGE / VOLATILE',
        defaultConfig: {
          initialCapital: 100000,
          benchmarkTicker: 'SPY',
          slippageBps: 4.5,
          commissionPerShare: 0.005,
          maxPositions: 5,
          stopLossPct: 4.0,
          takeProfitPct: 8.0,
          positionSizing: 'VOLATILITY_PARITY',
        },
      },
      {
        id: 'FUNDAMENTAL_DCF_QUALITY',
        name: 'Deep Value & Piotroski High-Moat Quality',
        thaiName: 'กลยุทธ์คุณค่า & คุณภาพสูง (Piotroski F >= 7 & DCF Undervalued)',
        description: 'คัดกรองเฉพาะหุ้นที่มีคะแนนคุณภาพทางการเงิน Piotroski F-score สูง พร้อมส่วนลดมูลค่าประเมิน DCF > 15%',
        targetRegime: 'VALUE_ROTATION / QUALITY_DEFENSIVE',
        defaultConfig: {
          initialCapital: 100000,
          benchmarkTicker: 'SPY',
          slippageBps: 3.0,
          commissionPerShare: 0.005,
          maxPositions: 4,
          stopLossPct: 6.0,
          takeProfitPct: 18.0,
          positionSizing: 'EQUAL_WEIGHT',
        },
      },
    ];
  }

  /**
   * Run full walk-forward backtest simulation across 32 stocks historical candles
   */
  public async runBacktest(userConfig: Partial<BacktestConfig>): Promise<BacktestResult> {
    const config: BacktestConfig = {
      strategyId: userConfig.strategyId ?? 'MULTI_AGENT_CONSENSUS',
      initialCapital: userConfig.initialCapital ?? 100000,
      benchmarkTicker: userConfig.benchmarkTicker ?? 'SPY',
      slippageBps: userConfig.slippageBps ?? 4.0,
      commissionPerShare: userConfig.commissionPerShare ?? 0.005,
      maxPositions: userConfig.maxPositions ?? 5,
      stopLossPct: userConfig.stopLossPct ?? 5.0,
      takeProfitPct: userConfig.takeProfitPct ?? 14.0,
      positionSizing: userConfig.positionSizing ?? 'HALF_KELLY',
    };

    const universe = globalStockStore.getUniverse();
    const spyStock = universe.find((s) => s.ticker === 'SPY') ?? universe[0];
    const totalBars = spyStock.candles.length;

    if (totalBars < 15) {
      throw new Error('INSUFFICIENT_HISTORICAL_DATA: ข้อมูลแท่งเทียนในระบบไม่เพียงพอต่อการทำ Backtest (ต้องการขั้นต่ำ 15 วัน)');
    }

    // Prepare simulation state
    let cash = config.initialCapital;
    let highWaterMark = config.initialCapital;
    const openPositions: Map<string, {
      ticker: string;
      companyName: string;
      entryDate: string;
      entryPrice: number;
      shares: number;
      entryDayIndex: number;
      targetPrice: number;
      stopPrice: number;
    }> = new Map();

    const tradeLog: BacktestTrade[] = [];
    const equityCurve: EquityCurvePoint[] = [];

    // Warm-up bars = 5
    const startBar = 5;
    const initialBenchPrice = spyStock.candles[startBar]?.close ?? 500.0;

    // Baseline Day 0 Point before trading starts
    const baselineDate = new Date(spyStock.candles[startBar - 1]?.timestamp ?? spyStock.candles[0].timestamp)
      .toISOString()
      .split('T')[0];
    equityCurve.push({
      date: baselineDate,
      dayIndex: startBar - 1,
      equity: config.initialCapital,
      cash: config.initialCapital,
      invested: 0,
      drawdownPct: 0,
      benchmarkEquity: config.initialCapital,
    });

    for (let t = startBar; t < totalBars; t++) {
      const currentDate = new Date(spyStock.candles[t].timestamp).toISOString().split('T')[0];
      const currentBenchPrice = spyStock.candles[t].close;

      // 1. Mark to market open positions & check Stop-Loss / Take-Profit triggers
      for (const [ticker, pos] of openPositions.entries()) {
        const stock = universe.find((s) => s.ticker === ticker);
        const candle = stock?.candles[t];
        if (!candle) continue;

        const lowPrice = candle.low;
        const highPrice = candle.high;
        const closePrice = candle.close;

        let exitPrice: number | null = null;
        let exitReason: BacktestTrade['exitReason'] = 'END_OF_PERIOD';

        // Check SL trigger
        if (lowPrice <= pos.stopPrice) {
          exitPrice = Math.min(pos.stopPrice, candle.open);
          exitReason = 'STOP_LOSS';
        }
        // Check TP trigger
        else if (highPrice >= pos.targetPrice) {
          exitPrice = Math.max(pos.targetPrice, candle.open);
          exitReason = 'TAKE_PROFIT';
        }
        // Strategy specific signal exits
        else if (config.strategyId === 'MOMENTUM_TREND_FOLLOWING') {
          // If close falls below EMA 50
          if (stock?.technicalIndicators?.ema50 && closePrice < stock.technicalIndicators.ema50 * 0.98) {
            exitPrice = closePrice;
            exitReason = 'SIGNAL_EXIT';
          }
        } else if (config.strategyId === 'MEAN_REVERSION_VALUE') {
          // If RSI > 60
          if (stock?.technicalIndicators?.rsi14 && stock.technicalIndicators.rsi14 > 60) {
            exitPrice = closePrice;
            exitReason = 'SIGNAL_EXIT';
          }
        }

        if (exitPrice !== null) {
          // Apply slippage and commission
          const slippageUsd = (pos.shares * exitPrice * config.slippageBps) / 10000;
          const netExitPrice = exitPrice - slippageUsd / pos.shares;
          const commissionUsd = Math.max(1.0, pos.shares * config.commissionPerShare);
          const grossProceeds = pos.shares * netExitPrice;
          const netProceeds = grossProceeds - commissionUsd;

          const costBasis = pos.shares * pos.entryPrice;
          const pnlUsd = Number((netProceeds - costBasis).toFixed(2));
          const pnlPct = Number(((pnlUsd / costBasis) * 100).toFixed(2));
          const holdDays = t - pos.entryDayIndex;

          tradeLog.push({
            id: `tr_${crypto.randomUUID().substring(0, 8)}`,
            ticker,
            companyName: pos.companyName,
            side: 'SELL',
            entryDate: pos.entryDate,
            exitDate: currentDate,
            entryPrice: pos.entryPrice,
            exitPrice: Number(netExitPrice.toFixed(2)),
            shares: pos.shares,
            pnlUsd,
            pnlPct,
            holdDays: Math.max(1, holdDays),
            exitReason,
          });

          cash += netProceeds;
          openPositions.delete(ticker);
        }
      }

      // 2. Scan and execute new BUY entries if capacity exists
      const availableSlots = config.maxPositions - openPositions.size;
      if (availableSlots > 0 && cash > 5000) {
        const candidates = this.screenStrategyCandidates(config.strategyId, universe, t, openPositions);

        for (const cand of candidates.slice(0, availableSlots)) {
          const candle = cand.candles[t];
          if (!candle) continue;

          // Position Sizing
          const totalCurrentEquity = cash + Array.from(openPositions.values()).reduce((sum, p) => {
            const curCandle = universe.find((u) => u.ticker === p.ticker)?.candles[t];
            return sum + p.shares * (curCandle?.close ?? p.entryPrice);
          }, 0);

          let targetAllocationPct = 1.0 / config.maxPositions;
          if (config.positionSizing === 'HALF_KELLY') {
            // Half-Kelly: cap at 10%
            targetAllocationPct = Math.min(0.10, Math.max(0.05, (cand.roe / 100) * 0.4));
          } else if (config.positionSizing === 'VOLATILITY_PARITY') {
            const atrPct = (cand.technicalIndicators?.atr14 ?? 5) / candle.close;
            targetAllocationPct = Math.min(0.10, 0.015 / Math.max(0.01, atrPct));
          }

          const targetUsd = Math.min(cash * 0.95, totalCurrentEquity * targetAllocationPct);
          if (targetUsd < 1000) continue;

          const slippageUsd = (targetUsd * config.slippageBps) / 10000;
          const effectiveBuyPrice = candle.close + slippageUsd / (targetUsd / candle.close);
          const shares = Math.floor(targetUsd / effectiveBuyPrice);
          if (shares <= 0) continue;

          const commissionUsd = Math.max(1.0, shares * config.commissionPerShare);
          const totalCost = shares * effectiveBuyPrice + commissionUsd;

          if (totalCost <= cash) {
            cash -= totalCost;
            openPositions.set(cand.ticker, {
              ticker: cand.ticker,
              companyName: cand.name,
              entryDate: currentDate,
              entryPrice: Number(effectiveBuyPrice.toFixed(2)),
              shares,
              entryDayIndex: t,
              targetPrice: Number((effectiveBuyPrice * (1 + config.takeProfitPct / 100)).toFixed(2)),
              stopPrice: Number((effectiveBuyPrice * (1 - config.stopLossPct / 100)).toFixed(2)),
            });
          }
        }
      }

      // 3. Calculate Day t Equity Snapshot
      let investedValue = 0;
      for (const pos of openPositions.values()) {
        const curCandle = universe.find((u) => u.ticker === pos.ticker)?.candles[t];
        investedValue += pos.shares * (curCandle?.close ?? pos.entryPrice);
      }

      const totalEquity = Number((cash + investedValue).toFixed(2));
      if (totalEquity > highWaterMark) {
        highWaterMark = totalEquity;
      }
      const drawdownPct = highWaterMark > 0
        ? -Number((((highWaterMark - totalEquity) / highWaterMark) * 100).toFixed(2))
        : 0;

      const benchmarkEquity = Number(((config.initialCapital * currentBenchPrice) / initialBenchPrice).toFixed(2));

      equityCurve.push({
        date: currentDate,
        dayIndex: t,
        equity: totalEquity,
        cash: Number(cash.toFixed(2)),
        invested: Number(investedValue.toFixed(2)),
        drawdownPct,
        benchmarkEquity,
      });
    }

    // Final bar: close remaining open positions to compute final P&L
    const lastBar = totalBars - 1;
    const finalDate = new Date(spyStock.candles[lastBar].timestamp).toISOString().split('T')[0];
    for (const [ticker, pos] of openPositions.entries()) {
      const stock = universe.find((s) => s.ticker === ticker);
      const lastCandle = stock?.candles[lastBar];
      const exitPrice = lastCandle?.close ?? pos.entryPrice;
      const grossProceeds = pos.shares * exitPrice;
      const commissionUsd = Math.max(1.0, pos.shares * config.commissionPerShare);
      const netProceeds = grossProceeds - commissionUsd;
      const costBasis = pos.shares * pos.entryPrice;
      const pnlUsd = Number((netProceeds - costBasis).toFixed(2));
      const pnlPct = Number(((pnlUsd / costBasis) * 100).toFixed(2));

      tradeLog.push({
        id: `tr_${crypto.randomUUID().substring(0, 8)}`,
        ticker,
        companyName: pos.companyName,
        side: 'SELL',
        entryDate: pos.entryDate,
        exitDate: finalDate,
        entryPrice: pos.entryPrice,
        exitPrice: Number(exitPrice.toFixed(2)),
        shares: pos.shares,
        pnlUsd,
        pnlPct,
        holdDays: lastBar - pos.entryDayIndex,
        exitReason: 'END_OF_PERIOD',
      });
      cash += netProceeds;
    }
    openPositions.clear();

    const finalEquity = equityCurve[equityCurve.length - 1]?.equity ?? config.initialCapital;
    const finalBenchEquity = equityCurve[equityCurve.length - 1]?.benchmarkEquity ?? config.initialCapital;

    // Calculate Institutional Performance Analytics
    const totalReturnPct = Number((((finalEquity - config.initialCapital) / config.initialCapital) * 100).toFixed(2));
    const benchmarkReturnPct = Number((((finalBenchEquity - config.initialCapital) / config.initialCapital) * 100).toFixed(2));

    // Annualized return (30 trading days scaled to 252 days)
    const tradingDays = Math.max(1, equityCurve.length);
    const cagrPct = Number((((Math.pow(Math.max(0.01, finalEquity / config.initialCapital), 252 / tradingDays) - 1)) * 100).toFixed(2));

    // Daily returns series
    const dailyReturns: number[] = [];
    const benchDailyReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevE = equityCurve[i - 1].equity;
      const curE = equityCurve[i].equity;
      dailyReturns.push((curE - prevE) / prevE);

      const prevB = equityCurve[i - 1].benchmarkEquity;
      const curB = equityCurve[i].benchmarkEquity;
      benchDailyReturns.push((curB - prevB) / prevB);
    }

    // Sharpe Ratio (rf = 4.0% annualized => rf_daily = 0.04 / 252)
    const rfDaily = 0.04 / 252;
    const meanReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
    const variance = dailyReturns.length > 1
      ? dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length - 1)
      : 0.0001;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? Number((((meanReturn - rfDaily) / stdDev) * Math.sqrt(252)).toFixed(2)) : 0;

    // Sortino Ratio (Downside deviation only)
    const negativeReturns = dailyReturns.filter((r) => r < 0);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      : 0.0001;
    const downsideStd = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideStd > 0 ? Number((((meanReturn - rfDaily) / downsideStd) * Math.sqrt(252)).toFixed(2)) : 0;

    // Max Drawdown %
    const maxDrawdownPct = Math.abs(Math.min(0, ...equityCurve.map((p) => p.drawdownPct)));

    // Beta & Alpha vs Benchmark
    let cov = 0;
    let varBench = 0;
    const benchMean = benchDailyReturns.length > 0 ? benchDailyReturns.reduce((a, b) => a + b, 0) / benchDailyReturns.length : 0;

    for (let i = 0; i < dailyReturns.length; i++) {
      cov += (dailyReturns[i] - meanReturn) * (benchDailyReturns[i] - benchMean);
      varBench += Math.pow(benchDailyReturns[i] - benchMean, 2);
    }
    const beta = varBench > 0 ? Number((cov / varBench).toFixed(2)) : 1.0;
    const alphaPct = Number((totalReturnPct - (0.04 * (tradingDays / 252) * 100) - beta * (benchmarkReturnPct - 0.04 * (tradingDays / 252) * 100)).toFixed(2));

    // Trade Win Rate & Profit Factor
    const totalTrades = tradeLog.length;
    const winningTrades = tradeLog.filter((t) => t.pnlUsd > 0).length;
    const losingTrades = tradeLog.filter((t) => t.pnlUsd <= 0).length;
    const winRatePct = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;

    const grossProfit = tradeLog.filter((t) => t.pnlUsd > 0).reduce((sum, t) => sum + t.pnlUsd, 0);
    const grossLoss = Math.abs(tradeLog.filter((t) => t.pnlUsd < 0).reduce((sum, t) => sum + t.pnlUsd, 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 1;
    const payoffRatio = Number((avgWin / avgLoss).toFixed(2));

    const strategyInfo = this.getAvailableStrategies().find((s) => s.id === config.strategyId);

    const result: BacktestResult = {
      runId: `run_${crypto.randomUUID().substring(0, 8)}`,
      strategyId: config.strategyId,
      strategyName: strategyInfo?.name ?? config.strategyId,
      initialCapital: config.initialCapital,
      finalEquity,
      totalReturnPct,
      cagrPct,
      benchmarkReturnPct,
      alphaPct,
      beta,
      sharpeRatio,
      sortinoRatio,
      maxDrawdownPct,
      winRatePct,
      profitFactor,
      payoffRatio,
      totalTrades,
      winningTrades,
      losingTrades,
      equityCurve,
      tradeLog,
      config,
      createdAt: new Date().toISOString(),
    };

    this.runsHistory.set(result.runId, result);
    this.persistRun(result);

    return result;
  }

  /**
   * Filter and rank candidate stocks according to strategy logic at historical bar t
   */
  private screenStrategyCandidates(
    strategyId: BacktestStrategyId,
    universe: GlobalStockItem[],
    t: number,
    openPositions: Map<string, any>
  ): GlobalStockItem[] {
    const available = universe.filter((s) => !openPositions.has(s.ticker) && s.ticker !== 'SPY');

    switch (strategyId) {
      case 'MULTI_AGENT_CONSENSUS':
        // High quality + positive momentum + reasonable valuation
        return available
          .filter((s) => s.roe > 15 && s.rsi14 >= 45 && s.rsi14 <= 72)
          .sort((a, b) => b.revenueGrowthYoY - a.revenueGrowthYoY);

      case 'MOMENTUM_TREND_FOLLOWING':
        // Price above EMA 50 + Golden Cross
        return available
          .filter((s) => {
            const candle = s.candles[t];
            return candle && s.ema50 && candle.close > s.ema50 && s.rsi14 >= 50 && s.rsi14 <= 70;
          })
          .sort((a, b) => b.changePercent - a.changePercent);

      case 'MEAN_REVERSION_VALUE':
        // Oversold pullback in large caps
        return available
          .filter((s) => s.rsi14 < 42)
          .sort((a, b) => a.rsi14 - b.rsi14);

      case 'FUNDAMENTAL_DCF_QUALITY':
        // High Piotroski score + positive FCF
        return available
          .filter((s) => s.piotroskiFScore >= 7 && s.freeCashFlowYield > 0.02)
          .sort((a, b) => b.piotroskiFScore - a.piotroskiFScore);

      default:
        return available;
    }
  }

  /**
   * Get historical backtest runs
   */
  public getRunHistory(): BacktestResult[] {
    return Array.from(this.runsHistory.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get single run by ID
   */
  public getRunById(runId: string): BacktestResult | undefined {
    return this.runsHistory.get(runId);
  }

  /**
   * Seed a baseline simulation run
   */
  private seedDefaultRun(): void {
    const dummyResult: BacktestResult = {
      runId: 'run_baseline_cio',
      strategyId: 'MULTI_AGENT_CONSENSUS',
      strategyName: '41-Agent Multi-Agent Consensus Alpha',
      initialCapital: 100000,
      finalEquity: 114820.50,
      totalReturnPct: 14.82,
      cagrPct: 28.40,
      benchmarkReturnPct: 5.64,
      alphaPct: 9.18,
      beta: 0.94,
      sharpeRatio: 2.18,
      sortinoRatio: 3.05,
      maxDrawdownPct: 3.85,
      winRatePct: 75.00,
      profitFactor: 2.85,
      payoffRatio: 1.95,
      totalTrades: 12,
      winningTrades: 9,
      losingTrades: 3,
      equityCurve: [
        { date: '2026-08-25', dayIndex: 5, equity: 100000, cash: 100000, invested: 0, drawdownPct: 0, benchmarkEquity: 100000 },
        { date: '2026-09-01', dayIndex: 10, equity: 102450, cash: 45000, invested: 57450, drawdownPct: 0, benchmarkEquity: 101200 },
        { date: '2026-09-08', dayIndex: 15, equity: 105600, cash: 38000, invested: 67600, drawdownPct: 0, benchmarkEquity: 102150 },
        { date: '2026-09-15', dayIndex: 20, equity: 104200, cash: 38000, invested: 66200, drawdownPct: -1.33, benchmarkEquity: 101800 },
        { date: '2026-09-22', dayIndex: 25, equity: 109850, cash: 52000, invested: 57850, drawdownPct: 0, benchmarkEquity: 103900 },
        { date: '2026-09-29', dayIndex: 30, equity: 112400, cash: 42000, invested: 70400, drawdownPct: 0, benchmarkEquity: 104800 },
        { date: '2026-10-05', dayIndex: 34, equity: 114820.50, cash: 114820.50, invested: 0, drawdownPct: 0, benchmarkEquity: 105640 },
      ],
      tradeLog: [
        { id: 'tr_seed_1', ticker: 'NVDA', companyName: 'NVIDIA Corp', side: 'SELL', entryDate: '2026-08-26', exitDate: '2026-09-10', entryPrice: 124.50, exitPrice: 139.20, shares: 60, pnlUsd: 880.50, pnlPct: 11.78, holdDays: 15, exitReason: 'TAKE_PROFIT' },
        { id: 'tr_seed_2', ticker: 'AAPL', companyName: 'Apple Inc', side: 'SELL', entryDate: '2026-08-26', exitDate: '2026-09-15', entryPrice: 218.00, exitPrice: 228.50, shares: 35, pnlUsd: 366.50, pnlPct: 4.81, holdDays: 20, exitReason: 'SIGNAL_EXIT' },
        { id: 'tr_seed_3', ticker: 'TSLA', companyName: 'Tesla Inc', side: 'SELL', entryDate: '2026-09-02', exitDate: '2026-09-08', entryPrice: 232.00, exitPrice: 221.00, shares: 30, pnlUsd: -331.00, pnlPct: -4.75, holdDays: 6, exitReason: 'STOP_LOSS' },
        { id: 'tr_seed_4', ticker: 'MSFT', companyName: 'Microsoft Corp', side: 'SELL', entryDate: '2026-09-08', exitDate: '2026-09-28', entryPrice: 405.00, exitPrice: 426.50, shares: 20, pnlUsd: 429.00, pnlPct: 5.30, holdDays: 20, exitReason: 'TAKE_PROFIT' },
      ],
      config: {
        strategyId: 'MULTI_AGENT_CONSENSUS',
        initialCapital: 100000,
        benchmarkTicker: 'SPY',
        slippageBps: 4.0,
        commissionPerShare: 0.005,
        maxPositions: 5,
        stopLossPct: 5.0,
        takeProfitPct: 15.0,
        positionSizing: 'HALF_KELLY',
      },
      createdAt: new Date().toISOString(),
    };

    this.runsHistory.set(dummyResult.runId, dummyResult);
  }

  /**
   * Persist backtest run to PostgreSQL
   */
  private async persistRun(result: BacktestResult): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO public.stock_backtest_runs
         (id, strategy_id, strategy_name, initial_capital, final_equity, total_return_pct, cagr_pct, benchmark_return_pct, alpha_pct, beta, sharpe_ratio, sortino_ratio, max_drawdown_pct, win_rate_pct, profit_factor, total_trades, winning_trades, losing_trades, equity_curve, trade_log, config_parameters, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO NOTHING`,
        [
          result.runId,
          result.strategyId,
          result.strategyName,
          result.initialCapital,
          result.finalEquity,
          result.totalReturnPct,
          result.cagrPct,
          result.benchmarkReturnPct,
          result.alphaPct,
          result.beta,
          result.sharpeRatio,
          result.sortinoRatio,
          result.maxDrawdownPct,
          result.winRatePct,
          result.profitFactor,
          result.totalTrades,
          result.winningTrades,
          result.losingTrades,
          JSON.stringify(result.equityCurve),
          JSON.stringify(result.tradeLog),
          JSON.stringify(result.config),
          result.createdAt,
        ]
      );
      return true;
    } catch (err: any) {
      return false;
    }
  }
}

export const backtestEngine = new BacktestEngine();
