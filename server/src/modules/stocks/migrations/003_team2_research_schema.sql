-- ============================================================================
-- Phase 3 Migration: Team 2 Equity Research Reports & DCF Valuations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    fair_value_base NUMERIC(12, 4) NOT NULL,
    fair_value_bull NUMERIC(12, 4) NOT NULL,
    fair_value_bear NUMERIC(12, 4) NOT NULL,
    margin_of_safety_pct NUMERIC(6, 2) NOT NULL,
    moat_rating VARCHAR(20) NOT NULL,
    moat_score INT NOT NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    wacc NUMERIC(5, 2) NOT NULL,
    terminal_growth NUMERIC(5, 2) NOT NULL,
    valuation_data JSONB NOT NULL,
    scenarios JSONB NOT NULL,
    agent_theses JSONB NOT NULL,
    chairman_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_research_ticker ON public.stock_research_reports(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_research_created ON public.stock_research_reports(created_at DESC);
