// ============================================================================
// Automated PostgreSQL Migration Runner for Stock System (Phase 0)
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../../../database/db.js';
import { ALL_41_AGENTS } from '../agents/registry.js';
import { globalStockStore } from '../engine/stock_store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Stocks Universe & Exchanges
CREATE TABLE IF NOT EXISTS public.stocks (
    ticker VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
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

-- 3. Fundamentals & Quality Metrics
CREATE TABLE IF NOT EXISTS public.fundamentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL DEFAULT 'TTM',
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
    team_number INT NOT NULL,
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
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Deterministic Hard Risk Rules
CREATE TABLE IF NOT EXISTS public.risk_rules (
    rule_key VARCHAR(100) PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_value NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Investment Committee CIO Decisions
CREATE TABLE IF NOT EXISTS public.cio_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    decision VARCHAR(50) NOT NULL,
    final_rating VARCHAR(50) NOT NULL,
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

-- 10. Paper Trading Orders
CREATE TABLE IF NOT EXISTS public.paper_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_plan_id VARCHAR(100) REFERENCES public.trade_plans(id),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL DEFAULT 'LIMIT',
    quantity NUMERIC(12, 4) NOT NULL,
    executed_price NUMERIC(12, 4),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    pnl_usd NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- 11. Team 1 Stock Ranking Runs
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

-- 12. Team 1 Stock Ranking Factor Scores
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

-- 13. Team 2 Equity Research Reports & DCF Valuations
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

-- 14. Team 3 Red Team Adversarial Audits & Binding VETO
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

-- 11. Phase 5: Team 4 Tactical Trade Plans
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

-- 12. Phase 6: AI-CIO Investment Committee Memos & Consensus Calibration
CREATE TABLE IF NOT EXISTS public.stock_agent_accuracies (
    agent_id VARCHAR(20) PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    team VARCHAR(10) NOT NULL,
    brier_score NUMERIC(6, 4) NOT NULL DEFAULT 0.1600,
    historical_accuracy_pct NUMERIC(5, 2) NOT NULL DEFAULT 74.00,
    total_predictions INTEGER NOT NULL DEFAULT 120,
    calibrated_weight NUMERIC(6, 3) NOT NULL DEFAULT 1.000,
    domain VARCHAR(100) NOT NULL,
    last_calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_cio_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL REFERENCES public.stocks(ticker),
    company_name VARCHAR(100) NOT NULL,
    consensus_score NUMERIC(5, 2) NOT NULL,
    consensus_action VARCHAR(20) NOT NULL,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_cio_memos_ticker ON public.stock_cio_memos(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_cio_memos_created ON public.stock_cio_memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_agent_accuracies_team ON public.stock_agent_accuracies(team);

-- Phase 7: Portfolio Snapshots & Circuit Breaker Events
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

-- Phase 8: Paper Trading & Strategy Backtesting
CREATE TABLE IF NOT EXISTS public.stock_paper_orders (
    id VARCHAR(64) PRIMARY KEY,
    ticker VARCHAR(16) NOT NULL,
    company_name VARCHAR(128) NOT NULL,
    side VARCHAR(8) NOT NULL,
    order_type VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,
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

-- 23. Notification Channels (Phase 10)
CREATE TABLE IF NOT EXISTS public.notification_channels (
    id VARCHAR(64) PRIMARY KEY,
    channel_type VARCHAR(30) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    webhook_url TEXT,
    bot_token TEXT,
    chat_id VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscribed_events TEXT[] NOT NULL DEFAULT ARRAY['CIRCUIT_BREAKER', 'RED_TEAM_VETO', 'CIO_BUY'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_channels_active ON public.notification_channels(is_active);

-- 24. Notification Logs (Phase 10)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id VARCHAR(64) PRIMARY KEY,
    channel_id VARCHAR(64),
    channel_type VARCHAR(30) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DELIVERED',
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notify_logs_event ON public.notification_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notify_logs_sent ON public.notification_logs(sent_at DESC);
`;

export async function runStockMigrations(): Promise<boolean> {
  console.log('[Stocks Migration] 🚀 Checking & Applying Global Equity Schema...');

  try {
    await pool.query(SCHEMA_SQL);
    console.log('[Stocks Migration] ✅ Core Schema tables verified/created successfully.');

    // Upsert All Active Universe Stocks (Ensuring foreign keys are always satisfied)
    console.log('[Stocks Migration] 📥 Ensuring all active universe stocks are registered in database...');
    for (const stock of globalStockStore.getUniverse()) {
      await pool.query(
        `INSERT INTO public.stocks (ticker, name, exchange, sector, industry, country, currency)
         VALUES ($1, $2, $3, $4, $5, 'USA', 'USD')
         ON CONFLICT (ticker) DO UPDATE SET 
           name = EXCLUDED.name, 
           exchange = EXCLUDED.exchange, 
           sector = EXCLUDED.sector, 
           industry = EXCLUDED.industry`,
        [stock.ticker, stock.name, stock.exchange, stock.sector, stock.industry]
      );
    }
    console.log(`[Stocks Migration] ✅ Upserted ${globalStockStore.getUniverse().length} universe stocks into public.stocks.`);

    // Seed 41 Agents Registry if empty
    const agentCountRes = await pool.query('SELECT COUNT(*) FROM public.agent_definitions');
    if (parseInt(agentCountRes.rows[0].count) === 0) {
      console.log('[Stocks Migration] 🤖 Seeding 41 Agents into agent_definitions table...');
      for (const agent of ALL_41_AGENTS) {
        const teamNum = typeof agent.team === 'number' ? agent.team : 0;
        await pool.query(
          `INSERT INTO public.agent_definitions 
           (agent_id, name, thai_name, team_number, team_name, role_description, specialty, weight, model_provider, model_name, temperature, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (agent_id) DO NOTHING`,
          [
            agent.id,
            agent.name,
            agent.thaiName,
            teamNum,
            agent.teamName,
            agent.roleDescription,
            agent.specialty,
            agent.weight,
            agent.modelProvider,
            agent.modelName,
            agent.temperature,
            agent.isActive,
          ]
        );
      }
      console.log('[Stocks Migration] ✅ Successfully registered all 41 Agents in Database.');
    }

    return true;
  } catch (err: any) {
    console.error('[Stocks Migration] ⚠️ Migration error:', err.message);
    return false;
  }
}
