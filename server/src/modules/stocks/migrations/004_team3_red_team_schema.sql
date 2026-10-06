-- ============================================================================
-- Phase 4 Migration: Team 3 Red Team Adversarial Audits & Binding VETO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_red_team_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    threat_level VARCHAR(20) NOT NULL,
    threat_score NUMERIC(5, 2) NOT NULL,
    veto_triggered BOOLEAN NOT NULL DEFAULT false,
    veto_reason TEXT,
    red_flags_count INT NOT NULL DEFAULT 0,
    beneish_m_score NUMERIC(6, 2) NOT NULL,
    is_manipulator_risk BOOLEAN NOT NULL DEFAULT false,
    crowded_score NUMERIC(5, 2) NOT NULL,
    agent_reports JSONB NOT NULL,
    summary_objections JSONB,
    chairman_synthesis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_red_team_ticker ON public.stock_red_team_audits(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_red_team_veto ON public.stock_red_team_audits(veto_triggered);
CREATE INDEX IF NOT EXISTS idx_stock_red_team_created ON public.stock_red_team_audits(created_at DESC);
