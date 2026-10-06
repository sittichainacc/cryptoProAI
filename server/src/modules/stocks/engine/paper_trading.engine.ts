// ============================================================================
// Phase 8: Virtual Paper Trading Engine
// Institutional Paper Trading Simulator with Realistic Slippage, Brokerage
// Commissions, Regulatory Fees, and Non-Negotiable Hard Risk Gatekeeping
// ============================================================================

import crypto from 'crypto';
import { globalStockStore, GlobalStockItem } from './stock_store.js';
import { portfolioRiskEngine, PortfolioHolding, PortfolioRiskSummary } from './portfolio_risk.engine.js';
import { hardRiskEngine } from './risk_engine.js';
import { team3RedTeamEngine } from './team3_red_team.engine.js';
import { pool } from '../../../database/db.js';

export type PaperOrderSide = 'BUY' | 'SELL';
export type PaperOrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type PaperOrderStatus = 'PENDING' | 'SUBMITTED' | 'FILLED' | 'REJECTED' | 'CANCELLED' | 'CLOSED';

export interface PaperOrder {
  id: string;
  ticker: string;
  companyName: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  status: PaperOrderStatus;
  shares: number;
  requestedPrice: number;
  limitPrice?: number;
  stopPrice?: number;
  filledPrice?: number;
  slippageBps: number;
  slippageUsd: number;
  commissionUsd: number;
  totalCostUsd: number;
  realizedPnlUsd: number;
  realizedPnlPct: number;
  rejectReason?: string;
  createdAt: string;
  filledAt?: string;
}

export interface CreatePaperOrderInput {
  ticker: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  convictionScore?: number;
}

export class PaperTradingEngine {
  private orders: Map<string, PaperOrder> = new Map();

  constructor() {
    this.seedDefaultOrders();
  }

  /**
   * Seed realistic historical paper orders
   */
  private seedDefaultOrders(): void {
    const historicalFills: Array<{
      ticker: string;
      name: string;
      side: PaperOrderSide;
      shares: number;
      price: number;
      slippageBps: number;
      commission: number;
      minutesAgo: number;
    }> = [
      { ticker: 'NVDA', name: 'NVIDIA Corporation', side: 'BUY', shares: 70, price: 130.0, slippageBps: 4.5, commission: 1.0, minutesAgo: 240 },
      { ticker: 'AAPL', name: 'Apple Inc.', side: 'BUY', shares: 40, price: 215.0, slippageBps: 3.8, commission: 1.0, minutesAgo: 180 },
      { ticker: 'MSFT', name: 'Microsoft Corporation', side: 'BUY', shares: 20, price: 410.0, slippageBps: 3.2, commission: 1.0, minutesAgo: 120 },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', side: 'BUY', shares: 45, price: 175.0, slippageBps: 4.0, commission: 1.0, minutesAgo: 90 },
      { ticker: 'TSLA', name: 'Tesla Inc.', side: 'BUY', shares: 30, price: 220.0, slippageBps: 5.5, commission: 1.0, minutesAgo: 60 },
      { ticker: 'TSLA', name: 'Tesla Inc.', side: 'SELL', shares: 30, price: 235.0, slippageBps: 5.0, commission: 1.05, minutesAgo: 30 },
    ];

    const now = Date.now();
    for (const h of historicalFills) {
      const id = `order_${crypto.randomUUID().substring(0, 8)}`;
      const createdAt = new Date(now - h.minutesAgo * 60000).toISOString();
      const gross = h.shares * h.price;
      const slippageUsd = Number(((gross * h.slippageBps) / 10000).toFixed(2));
      const filledPrice = h.side === 'BUY' ? h.price + slippageUsd / h.shares : h.price - slippageUsd / h.shares;
      const totalCostUsd = Number((h.shares * filledPrice + h.commission).toFixed(2));

      let pnlUsd = 0;
      let pnlPct = 0;
      if (h.side === 'SELL') {
        pnlUsd = Number((h.shares * (filledPrice - 220.0) - h.commission).toFixed(2));
        pnlPct = Number(((pnlUsd / (h.shares * 220.0)) * 100).toFixed(2));
      }

      this.orders.set(id, {
        id,
        ticker: h.ticker,
        companyName: h.name,
        side: h.side,
        orderType: 'MARKET',
        status: h.side === 'SELL' ? 'CLOSED' : 'FILLED',
        shares: h.shares,
        requestedPrice: h.price,
        filledPrice: Number(filledPrice.toFixed(2)),
        slippageBps: h.slippageBps,
        slippageUsd,
        commissionUsd: h.commission,
        totalCostUsd,
        realizedPnlUsd: pnlUsd,
        realizedPnlPct: pnlPct,
        createdAt,
        filledAt: createdAt,
      });
    }
  }

  /**
   * Calculate realistic execution slippage (bps and USD) based on trade size & volume
   */
  public calculateSlippage(
    ticker: string,
    shares: number,
    price: number
  ): { slippageBps: number; slippageUsd: number } {
    const stock = globalStockStore.getStock(ticker.toUpperCase());
    const baseBps = 3.5; // Base 3.5 bps for US Mega Caps
    const orderValueUsd = shares * price;
    const dailyVolumeUsd = stock?.volumeUsd24h ?? 1_000_000_000;

    // Market impact curve: sqrt(Order / ADV) * impact factor
    const impactFactor = 8.0;
    const impactBps = Math.sqrt(orderValueUsd / dailyVolumeUsd) * 1000 * impactFactor;
    const totalSlippageBps = Number(Math.min(25.0, Math.max(baseBps, baseBps + impactBps)).toFixed(2));
    const slippageUsd = Number(((orderValueUsd * totalSlippageBps) / 10000).toFixed(2));

    return { slippageBps: totalSlippageBps, slippageUsd };
  }

  /**
   * Calculate institutional commissions and regulatory fees
   * Broker: $0.005/share (min $1.00, max 0.5% of value)
   * SEC Fee (Sell only): 0.00278% of proceeds
   * FINRA TAF (Sell only): $0.000166/share (max $8.30)
   */
  public calculateCommission(side: PaperOrderSide, shares: number, grossValue: number): number {
    const baseBroker = Math.max(1.0, Math.min(shares * 0.005, grossValue * 0.005));
    if (side === 'BUY') {
      return Number(baseBroker.toFixed(2));
    }
    const secFee = (grossValue * 0.0000278);
    const finraTaf = Math.min(8.30, shares * 0.000166);
    return Number((baseBroker + secFee + finraTaf).toFixed(2));
  }

  /**
   * Submit and execute paper trade order through Hard Risk Engine Gate
   */
  public async submitOrder(input: CreatePaperOrderInput): Promise<PaperOrder> {
    const symbol = input.ticker.toUpperCase();
    const stock = globalStockStore.getStock(symbol);

    if (!stock) {
      throw new Error(`TICKER_NOT_FOUND: หุ้น ${symbol} ไม่อยู่ในรายชื่อ Universe 32 ตัว`);
    }

    if (input.shares <= 0) {
      throw new Error('INVALID_SHARES: จำนวนหุ้นต้องมากกว่า 0');
    }

    const currentPrice = stock.price;
    const requestedPrice = input.limitPrice ?? currentPrice;
    const grossNotional = input.shares * requestedPrice;

    // Estimate friction
    const { slippageBps, slippageUsd } = this.calculateSlippage(symbol, input.shares, currentPrice);
    const commissionUsd = this.calculateCommission(input.side, input.shares, grossNotional);
    const estimatedTotalOutflow = input.side === 'BUY'
      ? grossNotional + slippageUsd + commissionUsd
      : grossNotional;

    const orderId = `ord_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    // =========================================================================
    // RULE 38: Non-Negotiable Hard Risk Engine Binding Pre-Trade Gate
    // Gate 1: Red Team VETO (BUY only; SELLs always permitted for de-risking)
    // Gate 2: Kill Switch / Circuit Breakers / Cash / 10% Position / 30% Sector
    // =========================================================================
    let riskCheck: { allowed: boolean; violationReason?: string } = { allowed: true };
    if (input.side === 'BUY') {
      const redTeamAudit = team3RedTeamEngine.auditStock(symbol);
      if (redTeamAudit?.vetoTriggered) {
        riskCheck = {
          allowed: false,
          violationReason: `RED_TEAM_VETO: หุ้น ${symbol} ถูกฝ่าย Red Team ยับยั้ง (${redTeamAudit.vetoReason || 'ระดับความเสี่ยงวิกฤต'})`,
        };
      }
    }
    if (riskCheck.allowed) {
      riskCheck = portfolioRiskEngine.canExecuteTrade(symbol, input.side, estimatedTotalOutflow);
    }

    if (!riskCheck.allowed) {
      // Deterministically reject order
      const rejectedOrder: PaperOrder = {
        id: orderId,
        ticker: symbol,
        companyName: stock.name,
        side: input.side,
        orderType: input.orderType,
        status: 'REJECTED',
        shares: input.shares,
        requestedPrice,
        limitPrice: input.limitPrice,
        stopPrice: input.stopPrice,
        slippageBps: 0,
        slippageUsd: 0,
        commissionUsd: 0,
        totalCostUsd: 0,
        realizedPnlUsd: 0,
        realizedPnlPct: 0,
        rejectReason: riskCheck.violationReason ?? 'REJECTED_BY_HARD_RISK_ENGINE',
        createdAt: now,
      };

      this.orders.set(orderId, rejectedOrder);
      this.persistOrder(rejectedOrder);
      return rejectedOrder;
    }

    // Check if limit or stop order is not immediately fillable
    let shouldFillImmediately = false;
    let filledPrice = currentPrice;

    if (input.orderType === 'MARKET') {
      shouldFillImmediately = true;
      filledPrice = input.side === 'BUY'
        ? Number((currentPrice + slippageUsd / input.shares).toFixed(2))
        : Number((currentPrice - slippageUsd / input.shares).toFixed(2));
    } else if (input.orderType === 'LIMIT' && input.limitPrice) {
      if (input.side === 'BUY' && currentPrice <= input.limitPrice) {
        shouldFillImmediately = true;
        filledPrice = Number(Math.min(currentPrice + slippageUsd / input.shares, input.limitPrice).toFixed(2));
      } else if (input.side === 'SELL' && currentPrice >= input.limitPrice) {
        shouldFillImmediately = true;
        filledPrice = Number(Math.max(currentPrice - slippageUsd / input.shares, input.limitPrice).toFixed(2));
      }
    }

    if (!shouldFillImmediately) {
      // Store as PENDING limit/stop order
      const pendingOrder: PaperOrder = {
        id: orderId,
        ticker: symbol,
        companyName: stock.name,
        side: input.side,
        orderType: input.orderType,
        status: 'PENDING',
        shares: input.shares,
        requestedPrice,
        limitPrice: input.limitPrice,
        stopPrice: input.stopPrice,
        slippageBps,
        slippageUsd,
        commissionUsd,
        totalCostUsd: estimatedTotalOutflow,
        realizedPnlUsd: 0,
        realizedPnlPct: 0,
        createdAt: now,
      };

      this.orders.set(orderId, pendingOrder);
      this.persistOrder(pendingOrder);
      return pendingOrder;
    }

    // Execute Immediate Fill
    const actualGross = input.shares * filledPrice;
    const actualCommission = this.calculateCommission(input.side, input.shares, actualGross);
    const totalCostUsd = input.side === 'BUY'
      ? Number((actualGross + actualCommission).toFixed(2))
      : Number((actualGross - actualCommission).toFixed(2));

    // Update portfolio holdings & cash balances
    const fillResult = portfolioRiskEngine.executeTradeFill(
      symbol,
      input.side,
      input.shares,
      filledPrice,
      actualCommission,
      input.convictionScore ?? 75
    );

    const filledOrder: PaperOrder = {
      id: orderId,
      ticker: symbol,
      companyName: stock.name,
      side: input.side,
      orderType: input.orderType,
      status: input.side === 'SELL' ? 'CLOSED' : 'FILLED',
      shares: input.shares,
      requestedPrice,
      limitPrice: input.limitPrice,
      stopPrice: input.stopPrice,
      filledPrice,
      slippageBps,
      slippageUsd,
      commissionUsd: actualCommission,
      totalCostUsd,
      realizedPnlUsd: fillResult.realizedPnl,
      realizedPnlPct: fillResult.realizedPnlPct,
      createdAt: now,
      filledAt: now,
    };

    this.orders.set(orderId, filledOrder);
    this.persistOrder(filledOrder);
    return filledOrder;
  }

  /**
   * Cancel an open/pending paper order
   */
  public async cancelOrder(orderId: string): Promise<{ success: boolean; message: string; order?: PaperOrder }> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: `ORDER_NOT_FOUND: ไม่พบคำสั่ง ${orderId}` };
    }
    if (order.status !== 'PENDING' && order.status !== 'SUBMITTED') {
      return {
        success: false,
        message: `CANNOT_CANCEL: คำสั่งสถานะ ${order.status} ไม่สามารถยกเลิกได้`,
      };
    }

    order.status = 'CANCELLED';
    this.persistOrder(order);

    return {
      success: true,
      message: `✅ ยกเลิกคำสั่งซื้อขาย ${orderId} (${order.ticker}) เรียบร้อยแล้ว`,
      order,
    };
  }

  /**
   * Close an entire open position at current market price (Market Sell)
   */
  public async closePosition(ticker: string, reason: string = 'MANUAL_CLOSE'): Promise<PaperOrder> {
    const symbol = ticker.toUpperCase();
    const holdings = portfolioRiskEngine.getLiveHoldings();
    const holding = holdings.find((h) => h.ticker === symbol);

    if (!holding || holding.shares <= 0) {
      throw new Error(`NO_OPEN_POSITION: ไม่พบสถานะถือครองหุ้น ${symbol} ในพอร์ตเสมือน`);
    }

    return this.submitOrder({
      ticker: symbol,
      side: 'SELL',
      orderType: 'MARKET',
      shares: holding.shares,
      convictionScore: holding.convictionScore,
    });
  }

  /**
   * Check and trigger pending limit orders against latest market prices
   */
  public checkPendingOrders(): number {
    let filledCount = 0;
    const pendingOrders = Array.from(this.orders.values()).filter((o) => o.status === 'PENDING');

    for (const order of pendingOrders) {
      const stock = globalStockStore.getStock(order.ticker);
      if (!stock) continue;

      let canFill = false;
      if (order.orderType === 'LIMIT' && order.limitPrice) {
        if (order.side === 'BUY' && stock.price <= order.limitPrice) canFill = true;
        if (order.side === 'SELL' && stock.price >= order.limitPrice) canFill = true;
      } else if (order.orderType === 'STOP_LOSS' && order.stopPrice) {
        if (order.side === 'SELL' && stock.price <= order.stopPrice) canFill = true;
      }

      if (canFill) {
        const { slippageBps, slippageUsd } = this.calculateSlippage(order.ticker, order.shares, stock.price);
        const filledPrice = order.side === 'BUY'
          ? Number((stock.price + slippageUsd / order.shares).toFixed(2))
          : Number((stock.price - slippageUsd / order.shares).toFixed(2));
        const actualGross = order.shares * filledPrice;
        const actualCommission = this.calculateCommission(order.side, order.shares, actualGross);

        const fillResult = portfolioRiskEngine.executeTradeFill(
          order.ticker,
          order.side,
          order.shares,
          filledPrice,
          actualCommission
        );

        order.status = order.side === 'SELL' ? 'CLOSED' : 'FILLED';
        order.filledPrice = filledPrice;
        order.slippageBps = slippageBps;
        order.slippageUsd = slippageUsd;
        order.commissionUsd = actualCommission;
        order.totalCostUsd = Number((actualGross + actualCommission).toFixed(2));
        order.realizedPnlUsd = fillResult.realizedPnl;
        order.realizedPnlPct = fillResult.realizedPnlPct;
        order.filledAt = new Date().toISOString();

        this.persistOrder(order);
        filledCount++;
      }
    }

    return filledCount;
  }

  /**
   * Get list of paper orders with optional filters
   */
  public getOrders(filter?: { ticker?: string; status?: PaperOrderStatus }): PaperOrder[] {
    let list = Array.from(this.orders.values());
    if (filter?.ticker) {
      list = list.filter((o) => o.ticker.toUpperCase() === filter.ticker!.toUpperCase());
    }
    if (filter?.status) {
      list = list.filter((o) => o.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get single order by ID
   */
  public getOrderById(orderId: string): PaperOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Reset Paper Trading portfolio back to initial state
   */
  public resetAccount(initialCapital: number = 100000.0): void {
    this.orders.clear();
    portfolioRiskEngine.resetPortfolio('ALL_CASH', initialCapital);
    this.seedDefaultOrders();
  }

  /**
   * Persist paper order to PostgreSQL (with silent fallback)
   */
  private async persistOrder(order: PaperOrder): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO public.stock_paper_orders
         (id, ticker, company_name, side, order_type, status, shares, requested_price, filled_price, slippage_bps, slippage_usd, commission_usd, total_cost_usd, realized_pnl_usd, realized_pnl_pct, reject_reason, created_at, filled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           filled_price = EXCLUDED.filled_price,
           slippage_bps = EXCLUDED.slippage_bps,
           slippage_usd = EXCLUDED.slippage_usd,
           commission_usd = EXCLUDED.commission_usd,
           total_cost_usd = EXCLUDED.total_cost_usd,
           realized_pnl_usd = EXCLUDED.realized_pnl_usd,
           realized_pnl_pct = EXCLUDED.realized_pnl_pct,
           reject_reason = EXCLUDED.reject_reason,
           filled_at = EXCLUDED.filled_at`,
        [
          order.id,
          order.ticker,
          order.companyName,
          order.side,
          order.orderType,
          order.status,
          order.shares,
          order.requestedPrice,
          order.filledPrice ?? null,
          order.slippageBps,
          order.slippageUsd,
          order.commissionUsd,
          order.totalCostUsd,
          order.realizedPnlUsd,
          order.realizedPnlPct,
          order.rejectReason ?? null,
          order.createdAt,
          order.filledAt ?? null,
        ]
      );
      return true;
    } catch (err: any) {
      return false;
    }
  }
}

export const paperTradingEngine = new PaperTradingEngine();
