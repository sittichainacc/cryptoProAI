-- ============================================================================
-- Phase 7 Migration: Portfolio Risk, Sector Caps & Circuit Breakers Schema
-- ============================================================================

-- 1. Real-Time Portfolio Snapshots & Risk Metrics
CREATE TABLE IF NOT EXISTS public.stock_portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_equity NUMERIC(15, 2) NOT NULL,
    cash_balance NUMERIC(15, 2) NOT NULL,
    invested_equity NUMERIC(15, 2) NOT NULL,
    high_water_mark NUMERIC(15, 2) NOT NULL,
    current_drawdown_pct NUMERIC(6, 3) NOT NULL,
    portfolio_beta NUMERIC(5, 2) NOT NULL,
    var_95_daily_usd NUMERIC(15, 2) NOT NULL,
    cvar_95_daily_usd NUMERIC(15, 2) NOT NULL,
    circuit_breaker_level INT NOT NULL DEFAULT 0,
    kill_switch_active BOOLEAN NOT NULL DEFAULT FALSE,
    sector_exposures JSONB NOT NULL,
    holdings JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_portfolio_snapshots_created ON public.stock_portfolio_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_portfolio_snapshots_cb_level ON public.stock_portfolio_snapshots(circuit_breaker_level);

-- 2. Circuit Breaker Trigger & Deleveraging Audit Events
CREATE TABLE IF NOT EXISTS public.stock_circuit_breaker_events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level INT NOT NULL,
    trigger_reason VARCHAR(255) NOT NULL,
    drawdown_pct NUMERIC(6, 3) NOT NULL,
    action_taken VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_cb_events_level ON public.stock_circuit_breaker_events(level);
CREATE INDEX IF NOT EXISTS idx_stock_cb_events_created ON public.stock_circuit_breaker_events(created_at DESC);
