// ============================================================================
// Broker Adapter Interface (Master Prompt Section 1 & Section 31)
// ============================================================================

import { OrderLifecycleStatus } from '../types.js';

export interface BrokerOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: 'DAY' | 'GTC';
  clientOrderId: string;
}

export interface BrokerOrderResult {
  brokerOrderId: string;
  clientOrderId: string;
  symbol: string;
  status: OrderLifecycleStatus;
  filledQuantity: number;
  averageExecutionPrice: number;
  commissionPaid: number;
  submittedAt: string;
  updatedAt: string;
  rawBrokerResponse?: any;
}

export interface BrokerAccountSummary {
  accountId: string;
  currency: string;
  totalEquity: number;
  cashBalance: number;
  buyingPower: number;
  unrealizedPnL: number;
  realizedPnLToday: number;
  positionsCount: number;
  isPaperAccount: boolean;
}

export interface IBrokerProvider {
  readonly brokerName: string;
  readonly isPaper: boolean;

  getAccountSummary(): Promise<BrokerAccountSummary>;
  submitOrder(order: BrokerOrderRequest): Promise<BrokerOrderResult>;
  cancelOrder(brokerOrderId: string): Promise<boolean>;
  getOrderStatus(brokerOrderId: string): Promise<BrokerOrderResult>;
  getPositions(): Promise<{
    symbol: string;
    quantity: number;
    costBasis: number;
    currentPrice: number;
    unrealizedPnL: number;
  }[]>;
}
