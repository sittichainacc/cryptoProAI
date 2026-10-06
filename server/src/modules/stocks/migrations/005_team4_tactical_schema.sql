-- ============================================================================
-- Phase 5 Migration: Team 4 Tactical Asset Allocation & Execution Schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_tactical_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    setup_type VARCHAR(50) NOT NULL,
    entry_price NUMERIC(10, 2) NOT NULL,
    entry_zone_low NUMERIC(10, 2) NOT NULL,
    entry_zone_high NUMERIC(10, 2) NOT NULL,
    stop_loss NUMERIC(10, 2) NOT NULL,
    take_profit_1 NUMERIC(10, 2) NOT NULL,
    take_profit_2 NUMERIC(10, 2) NOT NULL,
    take_profit_3 NUMERIC(10, 2) NOT NULL,
    risk_reward_ratio NUMERIC(6, 2) NOT NULL,
    kelly_size_pct NUMERIC(5, 2) NOT NULL,
    is_trade_approved BOOLEAN NOT NULL DEFAULT true,
    tactical_plan_data JSONB NOT NULL,
    agent_reports JSONB NOT NULL,
    approval_status_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_tactical_ticker ON public.stock_tactical_plans(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_tactical_approved ON public.stock_tactical_plans(is_trade_approved);
CREATE INDEX IF NOT EXISTS idx_stock_tactical_created ON public.stock_tactical_plans(created_at DESC);
