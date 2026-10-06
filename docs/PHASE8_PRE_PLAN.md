# 📋 PRE-IMPLEMENTATION PLAN: PHASE 8 — PAPER TRADING SIMULATOR & STRATEGY BACKTESTING

**Document Reference:** `docs/PHASE8_PRE_PLAN.md`  
**Standard:** Rule 39 Conformance (Pre-Implementation Plan & Formal Architecture Review)  
**System:** Global Equity Intelligence & Autonomous Trading System  
**Phase:** Phase 8 — Paper Trading Simulator & Strategy Backtesting  
**Author:** Principal Software Architect + Head Quant Developer + DevOps Engineer  
**Timestamp:** 2026-10-06T13:10:00+07:00  
**Status:** **PLANNING COMPLETE — READY FOR EXECUTION**  

---

## 1. Executive Summary & Objectives

Following the successful completion and verification of:
- **Phase 0–6**: 41-Agent Investment Committee, 32 Large Cap Universe, DCF/Reverse-DCF, Forensic Red Team Veto, Tactical ATR/Kelly sizing, AI-CIO supermajority consensus.
- **Phase 7**: Portfolio Real-Time Risk Engine, 30% Sector Hard Cap, 3-Tier Drawdown Circuit Breakers (-5%, -10%, -15%), Beta Drift Hedging, and 1-Day 95% Parametric VaR/CVaR.

**Phase 8: Paper Trading Simulator & Strategy Backtesting** bridges quantitative decision intelligence with realistic market simulation. It delivers two institutional-grade execution capabilities:

1. **Virtual Paper Trading Execution Engine**:
   - Order execution lifecycle (`PROPOSED` $\to$ `RISK_GATE_CHECK` $\to$ `SUBMITTED` $\to$ `FILLED` $\to$ `CLOSED`).
   - Realistic market friction modeling: dynamic slippage (0.03%–0.15% based on trade size and volatility) + broker commissions ($0.005/share) + regulatory fees.
   - Deterministic Hard Risk Engine gatekeeping (Rule 38): No paper trade can bypass single position cap (10%), sector cap (30%), circuit breaker level (BUYs halted if Drawdown $\ge 5\%$), cash reserves, or Red Team VETO.
   - Synchronized portfolio mark-to-market holdings and real-time realized/unrealized P&L.

2. **Walk-Forward Strategy Backtesting Engine**:
   - Multi-asset historical simulation across the 32 US Large Caps universe and SPY benchmark.
   - Pre-configured institutional strategies:
     - `MULTI_AGENT_CONSENSUS`: Composite signal combining Momentum, Value, Quality, Moat, DCF Margin of Safety, and Red Team clearance.
     - `MOMENTUM_TREND_FOLLOWING`: Dual EMA Golden Cross (50/200) + RSI momentum breakout.
     - `MEAN_REVERSION_VALUE`: Bollinger Band oversold bounce + RSI mean-reversion with strict ATR stop.
     - `FUNDAMENTAL_DCF_QUALITY`: High Piotroski F-score ($\ge 7$) + DCF margin of safety $\ge 15\%$.
   - Comprehensive performance metrics: CAGR, Cumulative Return %, Benchmark Return % (SPY), Alpha ($\alpha$), Beta ($\beta$), Sharpe Ratio, Sortino Ratio, Maximum Drawdown (MDD), Win Rate %, Profit Factor, and Payoff Ratio.
   - Step-by-step equity curve time-series and detailed trade log.

---

## 2. Mathematical Models & Friction Modeling

### 2.1 Slippage Modeling
Real market fills incur slippage due to bid-ask spread and market impact:
$$\text{Slippage Pct} = \text{Base Spread} + \gamma \cdot \sqrt{\frac{\text{Order Value}}{\text{Average Daily Volume (USD)}}}$$
Where:
- $\text{Base Spread} = 0.0003$ (3 bps for US mega-caps)
- $\gamma = 0.05$ (Impact elasticity coefficient)
- Upper bound cap: $0.0025$ (25 bps)

Execution Fill Prices:
$$\text{Fill Price}_{\text{BUY}} = P_{\text{market}} \times (1 + \text{Slippage Pct})$$
$$\text{Fill Price}_{\text{SELL}} = P_{\text{market}} \times (1 - \text{Slippage Pct})$$

### 2.2 Broker Commissions & Regulatory Fees
- **Broker Commission:** $\$0.005$ per share (Minimum: $\$1.00$, Maximum: $0.5\%$ of gross order value).
- **SEC Transaction Fee (Sells only):** $0.00278\%$ of proceeds.
- **FINRA Trading Activity Fee (TAF, Sells only):** $\$0.000166$ per share (Max: $\$8.30$).

### 2.3 Backtest Performance Metrics Formulas
1. **Cumulative Return:**
   $$R_{\text{total}} = \frac{E_{\text{final}} - E_{\text{initial}}}{E_{\text{initial}}} \times 100\%$$
2. **Sharpe Ratio (Annualized, $R_f = 4.0\%$):**
   $$\text{Sharpe} = \frac{\bar{R}_p - R_f / 252}{\sigma_p} \times \sqrt{252}$$
3. **Sortino Ratio:**
   $$\text{Sortino} = \frac{\bar{R}_p - R_f / 252}{\sigma_{\text{down}}} \times \sqrt{252}$$
   where $\sigma_{\text{down}}$ is the downside deviation of negative returns only.
4. **Maximum Drawdown (MDD):**
   $$\text{MDD} = \max_{t} \left( \frac{\text{HWM}_t - E_t}{\text{HWM}_t} \right) \times 100\%$$
5. **Profit Factor:**
   $$\text{Profit Factor} = \frac{\sum \text{Winning Trades P&L}}{\sum |\text{Losing Trades P&L}|}$$
6. **Jensen's Alpha ($\alpha$) & Beta ($\beta$):**
   $$\beta = \frac{\text{Cov}(R_p, R_m)}{\text{Var}(R_m)}, \quad \alpha = (R_p - R_f) - \beta (R_m - R_f)$$

---

## 3. Database Schema & Migration (`008_paper_trading_backtest_schema.sql`)

```sql
-- Phase 8 Migration: Paper Trading & Strategy Backtesting
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

CREATE INDEX IF NOT EXISTS idx_paper_orders_ticker ON public.stock_paper_orders(ticker);
CREATE INDEX IF NOT EXISTS idx_paper_orders_status ON public.stock_paper_orders(status);
CREATE INDEX IF NOT EXISTS idx_backtest_runs_strategy ON public.stock_backtest_runs(strategy_id);
```

---

## 4. Architectural Components & Implementation Files

1. **Database Migration:**
   - `server/src/modules/stocks/migrations/008_paper_trading_backtest_schema.sql`
   - Registered in `server/src/modules/stocks/migrations/migrate.ts`
2. **Paper Trading Engine:**
   - `server/src/modules/stocks/engine/paper_trading.engine.ts`
   - Order execution, slippage calculation, commission computation, Hard Risk Engine verification gate.
   - Syncs directly with `portfolioRiskEngine` holdings & cash.
3. **Strategy Backtesting Engine:**
   - `server/src/modules/stocks/engine/backtest.engine.ts`
   - Historical candle stepper, multi-strategy signal evaluation, portfolio equity curve calculation, institutional quant KPI computation.
4. **REST API Routes (`server/src/modules/stocks/routes/stocks.routes.ts`):**
   - `GET /api/stocks/paper/orders`
   - `POST /api/stocks/paper/order`
   - `POST /api/stocks/paper/order/:id/cancel`
   - `POST /api/stocks/paper/order/:id/close`
   - `GET /api/stocks/paper/positions`
   - `POST /api/stocks/paper/reset`
   - `GET /api/stocks/backtest/strategies`
   - `POST /api/stocks/backtest/run`
   - `GET /api/stocks/backtest/history`
5. **Unit Test Suite (`server/tests/stocks_phase8.test.ts`):**
   - Comprehensive test cases covering paper order lifecycle, slippage math, commission math, Hard Risk blockades, backtest execution across all 4 strategies, Sharpe/Sortino calculations, and edge cases.
6. **Frontend UI Components (`client/src/pages/GlobalStocksPage.tsx` & `client/src/types/stocks.ts`):**
   - Tab 8: **"📊 Paper Trading & Strategy Backtesting (จำลองพอร์ตเสมือน & Backtest)"**
   - Order placement modal & interactive form.
   - Live paper positions table with real-time unrealized P&L and Quick Close.
   - Paper execution history table.
   - Backtest parameter tuning and simulation launcher.
   - Interactive SVG Equity Curve with benchmark overlay.
   - Institutional KPI metric grid & historical trade log.

---

## 5. Risk Assessment & Rule 38 Non-Negotiable Enforcement

| Risk Factor | Failure Mode | Mitigation & Non-Negotiable Hard Control |
|---|---|---|
| **Circumvention of Hard Risk Limits** | Paper orders bypassing 10% single position cap or 30% sector cap. | `paperTradingEngine.submitOrder` strictly calls `portfolioRiskEngine.canExecuteTrade()`. If rejected, order is marked `REJECTED` with exact breach reason. |
| **Circuit Breaker Violations** | Submitting buy orders when Drawdown $\ge 5\%$ (Level 1+). | Non-negotiable block: BUY orders rejected instantly if Circuit Breaker Level $\ge 1$. SELL orders permitted for de-risking. |
| **Unrealistic Fill Assumptions** | Zero slippage or zero commissions exaggerating performance. | Dynamic slippage model (minimum 3 bps, scaling with volume) and standard broker/regulatory commissions applied on every transaction. |
| **Look-Ahead Bias in Backtesting** | Strategy accessing future bar data before execution. | Strict walk-forward bar-by-bar chronological iteration without forward lookups. |

---

## 6. Execution Plan & Quality Gate Verification

1. [x] Step 1: Draft and commit Pre-Implementation Plan (`docs/PHASE8_PRE_PLAN.md`).
2. [ ] Step 2: Create SQL migration `008_paper_trading_backtest_schema.sql` and register in `migrate.ts`.
3. [ ] Step 3: Implement `paper_trading.engine.ts` and `backtest.engine.ts`.
4. [ ] Step 4: Expose API endpoints in `stocks.routes.ts`.
5. [ ] Step 5: Implement comprehensive test suite `server/tests/stocks_phase8.test.ts` and verify 100% pass.
6. [ ] Step 6: Update frontend types `client/src/types/stocks.ts` and UI in `client/src/pages/GlobalStocksPage.tsx`.
7. [ ] Step 7: Build frontend, sync to WSL/Docker, rebuild container, and perform live HTTP verification.
8. [ ] Step 8: Document Post-Implementation Audit Report (`docs/PHASE8_POST_REPORT.md`) and update `ROADMAP.md`.
