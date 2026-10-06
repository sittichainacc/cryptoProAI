-- ============================================================================
-- Migration 006: AI-CIO Investment Committee Memos & Agent Consensus Calibration
-- Stores 41-Agent voting records, dialectical debates, Brier score weights, and CIO memos
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_agent_accuracies (
    agent_id VARCHAR(20) PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    team VARCHAR(10) NOT NULL, -- '1', '2', '3', '4', 'CIO'
    brier_score NUMERIC(6, 4) NOT NULL DEFAULT 0.1600,
    historical_accuracy_pct NUMERIC(5, 2) NOT NULL DEFAULT 74.00,
    total_predictions INTEGER NOT NULL DEFAULT 120,
    calibrated_weight NUMERIC(6, 3) NOT NULL DEFAULT 1.000,
    domain VARCHAR(100) NOT NULL,
    last_calibrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_cio_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    company_name VARCHAR(100) NOT NULL,
    consensus_score NUMERIC(5, 2) NOT NULL,
    consensus_action VARCHAR(20) NOT NULL, -- 'STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'SELL', 'VETOED'
    supermajority_approved BOOLEAN NOT NULL DEFAULT false,
    calibrated_approval_pct NUMERIC(5, 2) NOT NULL,
    raw_approval_pct NUMERIC(5, 2) NOT NULL,
    red_team_veto_active BOOLEAN NOT NULL DEFAULT false,
    bull_thesis_summary TEXT NOT NULL,
    bear_thesis_summary TEXT NOT NULL,
    dialectical_synthesis TEXT NOT NULL,
    executive_memo_md TEXT NOT NULL,
    team1_ranking_summary JSONB NOT NULL,
    team2_valuation_summary JSONB NOT NULL,
    team3_forensic_summary JSONB NOT NULL,
    team4_tactical_summary JSONB NOT NULL,
    vote_tally JSONB NOT NULL,
    confidence_interval JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_cio_memos_ticker ON public.stock_cio_memos(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_cio_memos_created ON public.stock_cio_memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_agent_accuracies_team ON public.stock_agent_accuracies(team);
