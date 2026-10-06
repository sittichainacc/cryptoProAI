-- ============================================================================
-- Phase 2 Migration: Team 1 Stock Ranking Runs & Factor Scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_ranking_runs (
    id VARCHAR(100) PRIMARY KEY,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    universe_size INT NOT NULL,
    market_regime VARCHAR(50) NOT NULL DEFAULT 'RISK_ON',
    weights JSONB NOT NULL,
    highest_ticker VARCHAR(20),
    highest_score NUMERIC(5, 2),
    summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_ranking_runs_time ON public.stock_ranking_runs(run_timestamp DESC);

CREATE TABLE IF NOT EXISTS public.stock_ranking_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id VARCHAR(100) NOT NULL REFERENCES public.stock_ranking_runs(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    rank INT NOT NULL,
    total_score NUMERIC(5, 2) NOT NULL,
    conviction VARCHAR(50) NOT NULL,
    factor_scores JSONB NOT NULL,
    chairman_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_ranking_scores_run_rank ON public.stock_ranking_scores(run_id, rank);
CREATE INDEX IF NOT EXISTS idx_stock_ranking_scores_ticker ON public.stock_ranking_scores(ticker);
