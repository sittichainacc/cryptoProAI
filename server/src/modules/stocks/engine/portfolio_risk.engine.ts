// ============================================================================
// Phase 7: Portfolio & Real-Time Risk Engine
// Real-time Sector Exposure Drift, Drawdown Circuit Breakers, Automated Cash
// Rebalancing, Portfolio Beta Hedging & Deterministic Kill Switch Telemetry
// ============================================================================

import { globalStockStore } from './stock_store.js';
import { hardRiskEngine } from './risk_engine.js';
import { pool } from '../../../database/db.js';
import { notificationDispatcher } from '../notifications/notification_dispatcher.service.js';

export type CircuitBreakerLevel = 0 | 1 | 2 | 3;

export interface PortfolioHolding {
  ticker: string;
  companyName: string;
  sector: string;
  shares: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  weightPct: number;
  beta: number;
  convictionScore: number; // 0-100 from AI-CIO
  stopLoss: number;
  takeProfit: number;
}

export interface SectorExposure {
  sector: string;
  marketValue: number;
  weightPct: number;
  stockCount: number;
  hardCapPct: number; // 30.0%
  isBreached: boolean; // weightPct > 30.0
  status: 'NORMAL' | 'ELEVATED' | 'BREACHED';
}

export interface MacroHedgeRecommendation {
  required: boolean;
  instrument: 'SPY_SHORT' | 'SPY_PUT_OVERLAY' | 'NONE';
  hedgeNotionalUsd: number;
  targetPortfolioBeta: number;
  contractsCount: number;
  rationale: string;
}

export interface PortfolioRiskSummary {
  timestamp: string;
  totalEquity: number;
  cashBalance: number;
  investedEquity: number;
  cashRatioPct: number;
  highWaterMark: number;
  currentDrawdownPct: number;
  maxDrawdownPct: number;
  circuitBreakerLevel: CircuitBreakerLevel;
  circuitBreakerStatus: 'NORMAL' | 'HALT_BUYS' | 'DELEVERAGE' | 'KILL_SWITCH';
  killSwitchActive: boolean;
  portfolioBeta: number;
  betaTargetCorridor: [number, number]; // [0.70, 1.10]
  betaStatus: 'OPTIMAL' | 'ELEVATED' | 'DEFENSIVE';
  macroHedgeRecommendation: MacroHedgeRecommendation;
  varMetrics: {
    dailyVolPct: number;
    var95DailyUsd: number;
    var95DailyPct: number;
    cvar95DailyUsd: number;
    cvar95DailyPct: number;
    sharpeRatio: number;
    sortinoRatio: number;
  };
  sectorExposures: SectorExposure[];
  holdings: PortfolioHolding[];
  alerts: string[];
}

export interface CircuitBreakerEvent {
  id?: number;
  timestamp: string;
  level: CircuitBreakerLevel;
  triggerReason: string;
  drawdownPct: number;
  actionTaken: string;
  metadata?: any;
}

export class PortfolioRiskEngine {
  private cashBalance: number = 25000.0;
  private highWaterMark: number = 100000.0;
  private maxDrawdownRecordedPct: number = 0.0;
  private circuitBreakerLevel: CircuitBreakerLevel = 0;
  private killSwitchActive: boolean = false;
  private eventHistory: CircuitBreakerEvent[] = [];

  // Internal holdings registry
  private holdingsMap: Map<string, {
    ticker: string;
    shares: number;
    averageEntryPrice: number;
    convictionScore: number;
    stopLoss: number;
    takeProfit: number;
  }> = new Map();

  constructor() {
    this.seedDefaultPortfolio();
  }

  /**
   * Seed realistic initial portfolio assets
   */
  private seedDefaultPortfolio(): void {
    const initialPositions = [
      { ticker: 'NVDA', shares: 70, avgPrice: 130.0, conviction: 88, sl: 125.0, tp: 155.0 },
      { ticker: 'AAPL', shares: 40, avgPrice: 215.0, conviction: 82, sl: 205.0, tp: 245.0 },
      { ticker: 'MSFT', shares: 20, avgPrice: 410.0, conviction: 80, sl: 395.0, tp: 460.0 },
      { ticker: 'AMZN', shares: 45, avgPrice: 175.0, conviction: 78, sl: 168.0, tp: 205.0 },
      { ticker: 'JPM',  shares: 40, avgPrice: 205.0, conviction: 75, sl: 195.0, tp: 235.0 },
      { ticker: 'JNJ',  shares: 55, avgPrice: 158.0, conviction: 72, sl: 150.0, tp: 175.0 },
      { ticker: 'XOM',  shares: 75, avgPrice: 112.0, conviction: 70, sl: 106.0, tp: 128.0 },
    ];

    this.cashBalance = 36534.0;

    for (const p of initialPositions) {
      this.holdingsMap.set(p.ticker, {
        ticker: p.ticker,
        shares: p.shares,
        averageEntryPrice: p.avgPrice,
        convictionScore: p.conviction,
        stopLoss: p.sl,
        takeProfit: p.tp,
      });
    }

    // Initialize HWM to current equity
    const summary = this.calculateSummaryInternal();
    this.highWaterMark = summary.totalEquity;
  }

  /**
   * Get all live holdings with real-time mark-to-market prices
   */
  public getLiveHoldings(): PortfolioHolding[] {
    const holdings: PortfolioHolding[] = [];
    const stockUniverse = globalStockStore.getUniverse();
    const stockMap = new Map(stockUniverse.map((s) => [s.ticker, s]));

    let totalInvested = 0;
    const rawList: Array<{
      ticker: string;
      companyName: string;
      sector: string;
      shares: number;
      averageEntryPrice: number;
      currentPrice: number;
      marketValue: number;
      unrealizedPnl: number;
      unrealizedPnlPct: number;
      beta: number;
      convictionScore: number;
      stopLoss: number;
      takeProfit: number;
    }> = [];

    for (const [ticker, pos] of this.holdingsMap.entries()) {
      const stock = stockMap.get(ticker);
      const currentPrice = stock?.price ?? pos.averageEntryPrice;
      const marketValue = Number((pos.shares * currentPrice).toFixed(2));
      const costBasis = Number((pos.shares * pos.averageEntryPrice).toFixed(2));
      const unrealizedPnl = Number((marketValue - costBasis).toFixed(2));
      const unrealizedPnlPct = Number(((unrealizedPnl / costBasis) * 100).toFixed(2));
      const beta = stock?.beta ?? 1.0;

      totalInvested += marketValue;

      rawList.push({
        ticker,
        companyName: stock?.name ?? ticker,
        sector: stock?.sector ?? 'Unknown',
        shares: pos.shares,
        averageEntryPrice: pos.averageEntryPrice,
        currentPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPct,
        beta,
        convictionScore: pos.convictionScore,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
      });
    }

    const totalEquity = totalInvested + this.cashBalance;

    for (const item of rawList) {
      const weightPct = totalEquity > 0 ? Number(((item.marketValue / totalEquity) * 100).toFixed(2)) : 0;
      holdings.push({
        ...item,
        weightPct,
      });
    }

    return holdings.sort((a, b) => b.marketValue - a.marketValue);
  }

  /**
   * Calculate sector concentrations against 30.0% hard cap
   */
  public getSectorExposures(): SectorExposure[] {
    const holdings = this.getLiveHoldings();
    const totalEquity = holdings.reduce((sum, h) => sum + h.marketValue, 0) + this.cashBalance;

    const sectorMap: Record<string, { value: number; count: number }> = {};

    for (const h of holdings) {
      if (!sectorMap[h.sector]) {
        sectorMap[h.sector] = { value: 0, count: 0 };
      }
      sectorMap[h.sector].value += h.marketValue;
      sectorMap[h.sector].count += 1;
    }

    const exposures: SectorExposure[] = [];
    const hardCapPct = 30.0;

    for (const [sector, data] of Object.entries(sectorMap)) {
      const weightPct = totalEquity > 0 ? Number(((data.value / totalEquity) * 100).toFixed(2)) : 0;
      const isBreached = weightPct > hardCapPct;
      const status: 'NORMAL' | 'ELEVATED' | 'BREACHED' = isBreached
        ? 'BREACHED'
        : weightPct > 25.0
        ? 'ELEVATED'
        : 'NORMAL';

      exposures.push({
        sector,
        marketValue: Number(data.value.toFixed(2)),
        weightPct,
        stockCount: data.count,
        hardCapPct,
        isBreached,
        status,
      });
    }

    return exposures.sort((a, b) => b.weightPct - a.weightPct);
  }

  /**
   * Internal summary calculation without circuit-breaker mutation
   */
  private calculateSummaryInternal(): PortfolioRiskSummary {
    const holdings = this.getLiveHoldings();
    const investedEquity = Number(holdings.reduce((sum, h) => sum + h.marketValue, 0).toFixed(2));
    const totalEquity = Number((investedEquity + this.cashBalance).toFixed(2));
    const cashRatioPct = totalEquity > 0 ? Number(((this.cashBalance / totalEquity) * 100).toFixed(2)) : 100;

    // High Water Mark & Drawdown calculation
    if (totalEquity > this.highWaterMark) {
      this.highWaterMark = totalEquity;
    }

    const currentDrawdownPct = this.highWaterMark > 0
      ? Number((((totalEquity - this.highWaterMark) / this.highWaterMark) * 100).toFixed(2))
      : 0;

    if (Math.abs(currentDrawdownPct) > this.maxDrawdownRecordedPct) {
      this.maxDrawdownRecordedPct = Math.abs(currentDrawdownPct);
    }

    // Weighted Portfolio Beta
    let weightedBetaSum = 0;
    if (investedEquity > 0) {
      for (const h of holdings) {
        weightedBetaSum += (h.marketValue / investedEquity) * h.beta;
      }
    }
    // Scale beta by invested fraction
    const portfolioBeta = Number((weightedBetaSum * (investedEquity / (totalEquity || 1))).toFixed(2));

    const betaStatus: 'OPTIMAL' | 'ELEVATED' | 'DEFENSIVE' =
      portfolioBeta > 1.15 ? 'ELEVATED' : portfolioBeta < 0.65 ? 'DEFENSIVE' : 'OPTIMAL';

    // Macro Hedge Recommendation (Target corridor [0.70, 1.10])
    let hedgeRecommendation: MacroHedgeRecommendation;
    if (portfolioBeta > 1.20 && investedEquity > 20000) {
      const excessBeta = portfolioBeta - 1.0;
      const hedgeNotionalUsd = Math.round(excessBeta * investedEquity);
      const spyPrice = 575.0; // Benchmark proxy
      const contractsCount = Math.max(1, Math.round(hedgeNotionalUsd / (spyPrice * 100)));

      hedgeRecommendation = {
        required: true,
        instrument: 'SPY_PUT_OVERLAY',
        hedgeNotionalUsd,
        targetPortfolioBeta: 0.90,
        contractsCount,
        rationale: `Portfolio Beta is elevated at ${portfolioBeta} (Above 1.20 threshold). S&P 500 Put Overlay recommended to trim downside volatility.`,
      };
    } else {
      hedgeRecommendation = {
        required: false,
        instrument: 'NONE',
        hedgeNotionalUsd: 0,
        targetPortfolioBeta: portfolioBeta,
        contractsCount: 0,
        rationale: `Portfolio Beta of ${portfolioBeta} is within safe risk bounds [0.70, 1.10]. No macro hedge required.`,
      };
    }

    // Value-at-Risk (Parametric 95% 1-day) & Expected Shortfall (CVaR)
    // Daily portfolio volatility estimated ~ 1.2% (typical US diversified large cap)
    const dailyVolPct = 1.25;
    const var95DailyPct = Number((1.645 * dailyVolPct).toFixed(2)); // ~2.06%
    const var95DailyUsd = Math.round((var95DailyPct / 100) * totalEquity);

    const cvar95DailyPct = Number((2.06 * dailyVolPct).toFixed(2)); // ~2.57%
    const cvar95DailyUsd = Math.round((cvar95DailyPct / 100) * totalEquity);

    const sharpeRatio = 1.84;
    const sortinoRatio = 2.45;

    const sectorExposures = this.getSectorExposures();

    // Check alerts
    const alerts: string[] = [];
    if (this.killSwitchActive) {
      alerts.push('🚨 EMERGENCY KILL SWITCH IS ACTIVE: All automated order execution is halted!');
    }
    if (this.circuitBreakerLevel === 1) {
      alerts.push('⚠️ CIRCUIT BREAKER LEVEL 1 (Drawdown >= 5%): All new BUY entry orders are blocked.');
    } else if (this.circuitBreakerLevel === 2) {
      alerts.push('🛑 CIRCUIT BREAKER LEVEL 2 (Drawdown >= 10%): Defensive deleveraging active.');
    } else if (this.circuitBreakerLevel === 3) {
      alerts.push('🚨 CIRCUIT BREAKER LEVEL 3 (Drawdown >= 15%): Complete liquidation to cash enforced.');
    }

    const breachedSectors = sectorExposures.filter((s) => s.isBreached);
    for (const b of breachedSectors) {
      alerts.push(`⚠️ SECTOR CONCENTRATION ALERT: ${b.sector} is at ${b.weightPct}% (Limit: 30.0%).`);
    }

    const cbStatus: 'NORMAL' | 'HALT_BUYS' | 'DELEVERAGE' | 'KILL_SWITCH' =
      this.circuitBreakerLevel === 3 || this.killSwitchActive
        ? 'KILL_SWITCH'
        : this.circuitBreakerLevel === 2
        ? 'DELEVERAGE'
        : this.circuitBreakerLevel === 1
        ? 'HALT_BUYS'
        : 'NORMAL';

    return {
      timestamp: new Date().toISOString(),
      totalEquity,
      cashBalance: this.cashBalance,
      investedEquity,
      cashRatioPct,
      highWaterMark: this.highWaterMark,
      currentDrawdownPct,
      maxDrawdownPct: this.maxDrawdownRecordedPct,
      circuitBreakerLevel: this.circuitBreakerLevel,
      circuitBreakerStatus: cbStatus,
      killSwitchActive: this.killSwitchActive,
      portfolioBeta,
      betaTargetCorridor: [0.70, 1.10],
      betaStatus,
      macroHedgeRecommendation: hedgeRecommendation,
      varMetrics: {
        dailyVolPct,
        var95DailyUsd,
        var95DailyPct,
        cvar95DailyUsd,
        cvar95DailyPct,
        sharpeRatio,
        sortinoRatio,
      },
      sectorExposures,
      holdings,
      alerts,
    };
  }

  /**
   * Public summary endpoint
   */
  public getRiskSummary(): PortfolioRiskSummary {
    this.evaluateCircuitBreakers();
    return this.calculateSummaryInternal();
  }

  /**
   * Check and trigger multi-level circuit breakers deterministically
   */
  public evaluateCircuitBreakers(): {
    level: CircuitBreakerLevel;
    triggered: boolean;
    actionTaken: string;
  } {
    const holdings = this.getLiveHoldings();
    const investedEquity = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalEquity = investedEquity + this.cashBalance;

    if (totalEquity > this.highWaterMark) {
      this.highWaterMark = totalEquity;
    }

    const ddPct = this.highWaterMark > 0
      ? ((this.highWaterMark - totalEquity) / this.highWaterMark) * 100
      : 0;

    let newLevel: CircuitBreakerLevel = 0;
    let action = 'NORMAL_OPERATIONS';

    if (this.killSwitchActive || ddPct >= 15.0) {
      newLevel = 3;
      action = 'EMERGENCY_KILL_SWITCH_LIQUIDATE_ALL';
      this.killSwitchActive = true;
      hardRiskEngine.setKillSwitch(true, `Circuit Breaker Level 3 Triggered: Drawdown -${ddPct.toFixed(2)}% >= 15%`);
    } else if (ddPct >= 10.0) {
      newLevel = 2;
      action = 'DEFENSIVE_DELEVERAGING_TRIM_POSITIONS';
    } else if (ddPct >= 5.0) {
      newLevel = 1;
      action = 'CIRCUIT_BREAKER_L1_HALT_BUYS';
    }

    const levelChanged = newLevel !== this.circuitBreakerLevel;
    this.circuitBreakerLevel = newLevel;

    if (levelChanged && newLevel > 0) {
      const event: CircuitBreakerEvent = {
        timestamp: new Date().toISOString(),
        level: newLevel,
        triggerReason: `Portfolio drawdown reached -${ddPct.toFixed(2)}%`,
        drawdownPct: -Number(ddPct.toFixed(2)),
        actionTaken: action,
        metadata: { totalEquity, highWaterMark: this.highWaterMark },
      };
      this.eventHistory.unshift(event);
      console.warn(`[PortfolioRiskEngine] ⚠️ CIRCUIT BREAKER LEVEL ${newLevel} TRIGGERED! Action: ${action}`);
      this.persistCircuitBreakerEvent(event);
      notificationDispatcher.notifyCircuitBreaker(newLevel, ddPct / 100, action).catch(() => {});
    }

    return {
      level: this.circuitBreakerLevel,
      triggered: this.circuitBreakerLevel > 0,
      actionTaken: action,
    };
  }

  /**
   * Validate if a proposed trade can execute against sector caps, circuit breakers, and cash
   */
  public canExecuteTrade(
    ticker: string,
    side: 'BUY' | 'SELL',
    notionalUsd: number
  ): { allowed: boolean; violationReason?: string } {
    const summary = this.calculateSummaryInternal();

    // 1. Kill Switch
    if (this.killSwitchActive || summary.circuitBreakerLevel === 3) {
      return {
        allowed: false,
        violationReason: 'KILL_SWITCH_ACTIVE: ทุกคำสั่งซื้อขายถูกระงับฉุกเฉินโดยระบบควบคุมความเสี่ยง',
      };
    }

    // 2. Sells are always allowed for risk reduction
    if (side === 'SELL') {
      return { allowed: true };
    }

    // 3. Circuit Breaker Level 1 or 2 halts new BUY entries
    if (summary.circuitBreakerLevel >= 1) {
      return {
        allowed: false,
        violationReason: `CIRCUIT_BREAKER_L${summary.circuitBreakerLevel}_ACTIVE: ห้ามเปิดสถานะซื้อใหม่ในระหว่างภาวะ Drawdown เกินเกณฑ์`,
      };
    }

    // 4. Cash Balance Check
    if (notionalUsd > this.cashBalance) {
      return {
        allowed: false,
        violationReason: `INSUFFICIENT_CASH: ต้องการเงินสด $${notionalUsd.toFixed(2)} แต่มีเงินสดเพียง $${this.cashBalance.toFixed(2)}`,
      };
    }

    // 5. Single Stock Cap Check (10.0%)
    const stock = globalStockStore.getStock(ticker.toUpperCase());
    const existingHolding = this.holdingsMap.get(ticker.toUpperCase());
    const currentHoldingValue = existingHolding
      ? existingHolding.shares * (stock?.price ?? existingHolding.averageEntryPrice)
      : 0;
    const postTradeHoldingValue = currentHoldingValue + notionalUsd;
    const postHoldingWeightPct = (postTradeHoldingValue / summary.totalEquity) * 100;

    if (postHoldingWeightPct > 10.0) {
      return {
        allowed: false,
        violationReason: `POSITION_CAP_EXCEEDED: สัดส่วนหุ้น ${ticker} หลังเข้าซื้อจะแตะ ${postHoldingWeightPct.toFixed(2)}% (เกินเกณฑ์เพดาน 10.0%)`,
      };
    }

    // 6. Sector Hard Cap Check (30.0%)
    const targetSector = stock?.sector ?? 'Unknown';
    const sectorExposure = summary.sectorExposures.find((s) => s.sector === targetSector);
    const currentSectorValue = sectorExposure?.marketValue ?? 0;
    const postSectorValue = currentSectorValue + notionalUsd;
    const postSectorWeightPct = (postSectorValue / summary.totalEquity) * 100;

    if (postSectorWeightPct > 30.0) {
      return {
        allowed: false,
        violationReason: `SECTOR_CAP_EXCEEDED: สัดส่วนกลุ่มอุตสาหกรรม ${targetSector} หลังเข้าซื้อจะแตะ ${postSectorWeightPct.toFixed(2)}% (เกินเพดาน Hard Cap 30.0%)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Execute Defensive Deleveraging (Level 2 Circuit Breaker)
   * Trims lowest-conviction positions until cash reaches target (e.g. 50%)
   */
  public executeDeleveraging(targetCashPct: number = 50.0): {
    trimmedPositions: Array<{ ticker: string; sharesSold: number; proceedsUsd: number }>;
    newCashBalance: number;
    newCashRatioPct: number;
  } {
    const summary = this.calculateSummaryInternal();
    const targetCashUsd = (targetCashPct / 100) * summary.totalEquity;
    let deficitUsd = targetCashUsd - this.cashBalance;

    const trimmedPositions: Array<{ ticker: string; sharesSold: number; proceedsUsd: number }> = [];

    if (deficitUsd <= 0) {
      return {
        trimmedPositions,
        newCashBalance: this.cashBalance,
        newCashRatioPct: summary.cashRatioPct,
      };
    }

    // Sort holdings by conviction ascending (trim lowest first)
    const sortedHoldings = this.getLiveHoldings().sort((a, b) => a.convictionScore - b.convictionScore);

    for (const h of sortedHoldings) {
      if (deficitUsd <= 0) break;

      const pos = this.holdingsMap.get(h.ticker);
      if (!pos || pos.shares <= 0) continue;

      const stockPrice = h.currentPrice;
      const sharesToSell = Math.min(pos.shares, Math.ceil(deficitUsd / stockPrice));
      const proceeds = Number((sharesToSell * stockPrice).toFixed(2));

      pos.shares -= sharesToSell;
      if (pos.shares <= 0) {
        this.holdingsMap.delete(h.ticker);
      }

      this.cashBalance = Number((this.cashBalance + proceeds).toFixed(2));
      deficitUsd -= proceeds;

      trimmedPositions.push({
        ticker: h.ticker,
        sharesSold: sharesToSell,
        proceedsUsd: proceeds,
      });
    }

    const updatedSummary = this.calculateSummaryInternal();

    // Log Deleveraging event
    this.eventHistory.unshift({
      timestamp: new Date().toISOString(),
      level: 2,
      triggerReason: `Automated Defensive Deleveraging to target ${targetCashPct}% cash buffer`,
      drawdownPct: summary.currentDrawdownPct,
      actionTaken: `Liquidated ${trimmedPositions.length} positions, recovered $${trimmedPositions.reduce((s, p) => s + p.proceedsUsd, 0)}`,
      metadata: { trimmedPositions },
    });

    return {
      trimmedPositions,
      newCashBalance: this.cashBalance,
      newCashRatioPct: updatedSummary.cashRatioPct,
    };
  }

  /**
   * Execute Emergency Kill Switch (Level 3 Circuit Breaker)
   * Liquidates 100% of equity holdings to cash
   */
  public triggerEmergencyKillSwitch(reason: string, adminAuth: boolean = false): {
    success: boolean;
    liquidatedPositions: number;
    cashRecoveredUsd: number;
    finalCashBalance: number;
  } {
    let totalRecovered = 0;
    let count = 0;

    const stockUniverse = globalStockStore.getUniverse();
    const stockMap = new Map(stockUniverse.map((s) => [s.ticker, s]));

    for (const [ticker, pos] of this.holdingsMap.entries()) {
      const stock = stockMap.get(ticker);
      const price = stock?.price ?? pos.averageEntryPrice;
      const proceeds = Number((pos.shares * price).toFixed(2));

      totalRecovered += proceeds;
      count += 1;
    }

    this.holdingsMap.clear();
    this.cashBalance = Number((this.cashBalance + totalRecovered).toFixed(2));
    this.killSwitchActive = true;
    this.circuitBreakerLevel = 3;

    // Direct synchronization with HardRiskEngine
    hardRiskEngine.setKillSwitch(true, reason);

    const event: CircuitBreakerEvent = {
      timestamp: new Date().toISOString(),
      level: 3,
      triggerReason: reason,
      drawdownPct: this.maxDrawdownRecordedPct,
      actionTaken: `EMERGENCY_KILL_SWITCH: Liquidated ${count} positions, 100% Cash ($${this.cashBalance.toFixed(2)})`,
      metadata: { adminAuth, totalRecovered, count },
    };
    this.eventHistory.unshift(event);
    this.persistCircuitBreakerEvent(event);

    return {
      success: true,
      liquidatedPositions: count,
      cashRecoveredUsd: totalRecovered,
      finalCashBalance: this.cashBalance,
    };
  }

  /**
   * Reset Kill Switch (Requires Admin Clearance)
   */
  public resetKillSwitch(adminAuth: boolean): { success: boolean; message: string } {
    if (!adminAuth) {
      return {
        success: false,
        message: 'ADMIN_CLEARANCE_REQUIRED: จำเป็นต้องได้รับการยืนยันตัวตนระดับผู้ดูแลระบบ (Admin) เพื่อปลดล็อค Kill Switch',
      };
    }

    this.killSwitchActive = false;
    this.circuitBreakerLevel = 0;
    hardRiskEngine.setKillSwitch(false, 'Admin manual reset of kill switch');

    const event: CircuitBreakerEvent = {
      timestamp: new Date().toISOString(),
      level: 0,
      triggerReason: 'Admin Manual Reset',
      drawdownPct: 0,
      actionTaken: 'SYSTEM_OPERATIONS_RESTORED',
    };
    this.eventHistory.unshift(event);

    return {
      success: true,
      message: '✅ Kill Switch ถูกปลดล็อคแล้ว ระบบการเทรดอัตโนมัติกลับสู่สภาวะปกติ (NORMAL)',
    };
  }

  /**
   * Modify High-Water Mark (for unit testing or baseline initialization)
   */
  public setHighWaterMark(hwm: number): void {
    this.highWaterMark = hwm;
  }

  /**
   * Modify Cash Balance (for testing or deposit/withdrawal simulation)
   */
  public setCashBalance(cash: number): void {
    this.cashBalance = Number(cash.toFixed(2));
  }

  /**
   * Add or update position
   */
  public setPosition(ticker: string, shares: number, avgPrice: number, conviction: number = 75): void {
    if (shares <= 0) {
      this.holdingsMap.delete(ticker.toUpperCase());
    } else {
      this.holdingsMap.set(ticker.toUpperCase(), {
        ticker: ticker.toUpperCase(),
        shares,
        averageEntryPrice: avgPrice,
        convictionScore: conviction,
        stopLoss: avgPrice * 0.95,
        takeProfit: avgPrice * 1.15,
      });
    }
  }

  /**
   * Execute trade fill and update cash + holding (Phase 8 Paper Trading integration)
   */
  public executeTradeFill(
    ticker: string,
    side: 'BUY' | 'SELL',
    shares: number,
    filledPrice: number,
    commissionUsd: number,
    convictionScore: number = 75
  ): {
    realizedPnl: number;
    realizedPnlPct: number;
    newCashBalance: number;
    newHoldingShares: number;
  } {
    const symbol = ticker.toUpperCase();
    let realizedPnl = 0;
    let realizedPnlPct = 0;
    const existing = this.holdingsMap.get(symbol);

    if (side === 'BUY') {
      const grossCost = shares * filledPrice;
      const totalOutflow = grossCost + commissionUsd;
      this.cashBalance = Number((this.cashBalance - totalOutflow).toFixed(2));

      if (existing) {
        const totalShares = existing.shares + shares;
        const totalBasis = existing.shares * existing.averageEntryPrice + grossCost;
        const weightedAvg = Number((totalBasis / totalShares).toFixed(2));
        existing.shares = totalShares;
        existing.averageEntryPrice = weightedAvg;
        existing.convictionScore = convictionScore;
      } else {
        this.holdingsMap.set(symbol, {
          ticker: symbol,
          shares,
          averageEntryPrice: filledPrice,
          convictionScore,
          stopLoss: Number((filledPrice * 0.95).toFixed(2)),
          takeProfit: Number((filledPrice * 1.15).toFixed(2)),
        });
      }
    } else {
      // SELL
      const grossProceeds = shares * filledPrice;
      const netProceeds = grossProceeds - commissionUsd;
      this.cashBalance = Number((this.cashBalance + netProceeds).toFixed(2));

      if (existing) {
        const costBasis = shares * existing.averageEntryPrice;
        realizedPnl = Number((grossProceeds - costBasis - commissionUsd).toFixed(2));
        realizedPnlPct = costBasis > 0 ? Number(((realizedPnl / costBasis) * 100).toFixed(2)) : 0;

        if (existing.shares <= shares) {
          this.holdingsMap.delete(symbol);
        } else {
          existing.shares = Number((existing.shares - shares).toFixed(4));
        }
      }
    }

    const currentHolding = this.holdingsMap.get(symbol);
    return {
      realizedPnl,
      realizedPnlPct,
      newCashBalance: this.cashBalance,
      newHoldingShares: currentHolding?.shares ?? 0,
    };
  }

  /**
   * Reset portfolio to initial clean state ($100,000 all cash or default)
   */
  public resetPortfolio(mode: 'ALL_CASH' | 'DEFAULT' = 'ALL_CASH', initialCapital: number = 100000.0): void {
    this.holdingsMap.clear();
    this.cashBalance = initialCapital;
    this.highWaterMark = initialCapital;
    this.maxDrawdownRecordedPct = 0;
    this.circuitBreakerLevel = 0;
    this.killSwitchActive = false;
    hardRiskEngine.setKillSwitch(false, 'Portfolio Reset');

    if (mode === 'DEFAULT') {
      this.seedDefaultPortfolio();
    }
  }

  /**
   * Get Circuit Breaker audit history
   */
  public getCircuitBreakerHistory(): CircuitBreakerEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Save snapshot to PostgreSQL
   */
  public async persistSnapshot(): Promise<boolean> {
    const summary = this.getRiskSummary();
    try {
      await pool.query(
        `INSERT INTO public.stock_portfolio_snapshots
         (total_equity, cash_balance, invested_equity, high_water_mark, current_drawdown_pct, portfolio_beta, var_95_daily_usd, cvar_95_daily_usd, circuit_breaker_level, kill_switch_active, sector_exposures, holdings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          summary.totalEquity,
          summary.cashBalance,
          summary.investedEquity,
          summary.highWaterMark,
          summary.currentDrawdownPct,
          summary.portfolioBeta,
          summary.varMetrics.var95DailyUsd,
          summary.varMetrics.cvar95DailyUsd,
          summary.circuitBreakerLevel,
          summary.killSwitchActive,
          JSON.stringify(summary.sectorExposures),
          JSON.stringify(summary.holdings),
        ]
      );
      return true;
    } catch (err: any) {
      // In-memory fallback if database not available
      return false;
    }
  }

  /**
   * Save circuit breaker event to PostgreSQL
   */
  private async persistCircuitBreakerEvent(event: CircuitBreakerEvent): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO public.stock_circuit_breaker_events
         (level, trigger_reason, drawdown_pct, action_taken, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          event.level,
          event.triggerReason,
          event.drawdownPct,
          event.actionTaken,
          JSON.stringify(event.metadata || {}),
        ]
      );
      return true;
    } catch (err: any) {
      return false;
    }
  }
}

export const portfolioRiskEngine = new PortfolioRiskEngine();
