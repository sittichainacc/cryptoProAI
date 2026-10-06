-- ============================================================================
-- Phase 8 Migration: Paper Trading Simulator & Strategy Backtesting Schema
-- ============================================================================

-- 1. Paper Orders Table
CREATE TABLE IF NOT EXISTS public.stock_paper_orders (
    id VARCHAR(64) PRIMARY KEY,
    ticker VARCHAR(16) NOT NULL,
    company_name VARCHAR(128) NOT NULL,
    side VARCHAR(8) NOT NULL, -- 'BUY' | 'SELL'
    order_type VARCHAR(16) NOT NULL, -- 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT'
    status VARCHAR(16) NOT NULL, -- 'PENDING' | 'SUBMITTED' | 'FILLED' | 'REJECTED' | 'CANCELLED' | 'CLOSED'
    shares NUMERIC(12, 4) NOT NULL,
    requested_price NUMERIC(12, 2) NOT NULL,
    filled_price NUMERIC(12, 2),
    slippage_bps NUMERIC(8, 2) DEFAULT 0,
    slippage_usd NUMERIC(12, 2) DEFAULT 0,
    commission_usd NUMERIC(12, 2) DEFAULT 0,
    total_cost_usd NUMERIC(14, 2) NOT NULL,
    realized_pnl_usd NUMERIC(14, 2) DEFAULT 0,
    realized_pnl_pct NUMERIC(8, 2) DEFAULT 0,
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_paper_orders_ticker ON public.stock_paper_orders(ticker);
CREATE INDEX IF NOT EXISTS idx_paper_orders_status ON public.stock_paper_orders(status);
CREATE INDEX IF NOT EXISTS idx_paper_orders_created ON public.stock_paper_orders(created_at DESC);

-- 2. Strategy Backtest Runs & Performance Metrics Table
CREATE TABLE IF NOT EXISTS public.stock_backtest_runs (
    id VARCHAR(64) PRIMARY KEY,
    strategy_id VARCHAR(64) NOT NULL,
    strategy_name VARCHAR(128) NOT NULL,
    initial_capital NUMERIC(14, 2) NOT NULL,
    final_equity NUMERIC(14, 2) NOT NULL,
    total_return_pct NUMERIC(8, 2) NOT NULL,
    cagr_pct NUMERIC(8, 2) NOT NULL,
    benchmark_return_pct NUMERIC(8, 2) NOT NULL,
    alpha_pct NUMERIC(8, 2) NOT NULL,
    beta NUMERIC(6, 2) NOT NULL,
    sharpe_ratio NUMERIC(6, 2) NOT NULL,
    sortino_ratio NUMERIC(6, 2) NOT NULL,
    max_drawdown_pct NUMERIC(6, 2) NOT NULL,
    win_rate_pct NUMERIC(6, 2) NOT NULL,
    profit_factor NUMERIC(6, 2) NOT NULL,
    total_trades INT NOT NULL,
    winning_trades INT NOT NULL,
    losing_trades INT NOT NULL,
    equity_curve JSONB NOT NULL,
    trade_log JSONB NOT NULL,
    config_parameters JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_strategy ON public.stock_backtest_runs(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtest_runs_created ON public.stock_backtest_runs(created_at DESC);
