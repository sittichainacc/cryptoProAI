-- ============================================================================
-- Migration 001: Global Equity Multi-Agent System Core Schema (Phase 0)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Stocks Universe & Exchanges
CREATE TABLE IF NOT EXISTS public.stocks (
    ticker VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(50) NOT NULL, -- NASDAQ, NYSE, LSE, etc.
    sector VARCHAR(100) NOT NULL,
    industry VARCHAR(150) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON public.stocks(sector);
CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON public.stocks(exchange);

-- 2. Daily & Historical Stock Prices
CREATE TABLE IF NOT EXISTS public.stock_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker) ON DELETE CASCADE,
    price_date DATE NOT NULL,
    open NUMERIC(12, 4) NOT NULL,
    high NUMERIC(12, 4) NOT NULL,
    low NUMERIC(12, 4) NOT NULL,
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'market_data_api',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticker, price_date)
);
CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker_date ON public.stock_prices(ticker, price_date DESC);

-- 3. Fundamentals & Quality Metrics
CREATE TABLE IF NOT EXISTS public.fundamentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL DEFAULT 'TTM', -- TTM, FY, Q
    period_end_date DATE NOT NULL,
    revenue NUMERIC(18, 2),
    revenue_growth_yoy NUMERIC(8, 4),
    net_income NUMERIC(18, 2),
    eps NUMERIC(10, 4),
    eps_growth_yoy NUMERIC(8, 4),
    operating_margin NUMERIC(8, 4),
    gross_margin NUMERIC(8, 4),
    free_cash_flow NUMERIC(18, 2),
    roe NUMERIC(8, 4),
    roic NUMERIC(8, 4),
    pe_ratio NUMERIC(10, 2),
    forward_pe NUMERIC(10, 2),
    ev_to_ebitda NUMERIC(10, 2),
    debt_to_equity NUMERIC(10, 4),
    piotroski_f_score INT,
    source VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticker, period_type, period_end_date)
);

-- 4. Multi-Agent Registry (41 Agents)
CREATE TABLE IF NOT EXISTS public.agent_definitions (
    agent_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    thai_name VARCHAR(255) NOT NULL,
    team_number INT NOT NULL, -- 1, 2, 3, 4 or 0 for CIO
    team_name VARCHAR(100) NOT NULL,
    role_description TEXT NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    weight NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    model_provider VARCHAR(50) NOT NULL DEFAULT 'anthropic',
    model_name VARCHAR(100) NOT NULL DEFAULT 'claude-3-5-sonnet',
    temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Prompt Management & Versioning
CREATE TABLE IF NOT EXISTS public.agent_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) NOT NULL REFERENCES public.agent_definitions(agent_id),
    name VARCHAR(150) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    system_prompt TEXT NOT NULL,
    task_prompt TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_id, version)
);

-- 6. Agent Execution Runs & Structured Audits
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) NOT NULL REFERENCES public.agent_definitions(agent_id),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    task_id VARCHAR(100),
    decision VARCHAR(50),
    score NUMERIC(5, 2),
    confidence NUMERIC(4, 2),
    thesis JSONB,
    evidence JSONB,
    risks JSONB,
    sources JSONB,
    input_tokens INT,
    output_tokens INT,
    cost_usd NUMERIC(8, 4),
    duration_ms INT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, RETRIED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_ticker_agent ON public.agent_runs(ticker, agent_id);

-- 7. Deterministic Hard Risk Rules
CREATE TABLE IF NOT EXISTS public.risk_rules (
    rule_key VARCHAR(100) PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_value NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- '%', 'USD', 'COUNT', 'MINUTES'
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Investment Committee CIO Decisions
CREATE TABLE IF NOT EXISTS public.cio_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    decision VARCHAR(50) NOT NULL, -- APPROVE, REJECT, WAIT, REDUCE_SIZE
    final_rating VARCHAR(50) NOT NULL, -- STRONG_BUY, BUY, etc.
    consensus_score NUMERIC(5, 2) NOT NULL,
    consensus_confidence NUMERIC(4, 2) NOT NULL,
    rationale TEXT NOT NULL,
    proponents JSONB,
    dissenters JSONB,
    red_team_veto BOOLEAN NOT NULL DEFAULT false,
    risk_check_passed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Trade Plans
CREATE TABLE IF NOT EXISTS public.trade_plans (
    id VARCHAR(100) PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    strategy VARCHAR(150) NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'LONG',
    time_horizon VARCHAR(20) NOT NULL DEFAULT 'SWING',
    current_price NUMERIC(12, 4) NOT NULL,
    entry_low NUMERIC(12, 4) NOT NULL,
    entry_high NUMERIC(12, 4) NOT NULL,
    stop_loss NUMERIC(12, 4) NOT NULL,
    invalidation NUMERIC(12, 4) NOT NULL,
    tp1 NUMERIC(12, 4) NOT NULL,
    tp2 NUMERIC(12, 4) NOT NULL,
    tp3 NUMERIC(12, 4) NOT NULL,
    risk_reward NUMERIC(6, 2) NOT NULL,
    position_size_pct NUMERIC(5, 2) NOT NULL,
    portfolio_weight_pct NUMERIC(5, 2) NOT NULL,
    max_loss_usd NUMERIC(12, 2) NOT NULL,
    confidence NUMERIC(4, 2) NOT NULL,
    consensus_score NUMERIC(5, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AI_PROPOSED',
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 10. Paper Trading Orders & Executions
CREATE TABLE IF NOT EXISTS public.paper_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_plan_id VARCHAR(100) REFERENCES public.trade_plans(id),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    side VARCHAR(10) NOT NULL, -- BUY, SELL
    order_type VARCHAR(20) NOT NULL DEFAULT 'LIMIT',
    quantity NUMERIC(12, 4) NOT NULL,
    executed_price NUMERIC(12, 4),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    pnl_usd NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- 11. System Audit Logs
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
