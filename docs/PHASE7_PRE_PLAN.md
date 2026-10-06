# 📋 PRE-IMPLEMENTATION PLAN: PHASE 7 — PORTFOLIO & REAL-TIME RISK ENGINE

**Document Reference:** `docs/PHASE7_PRE_PLAN.md`  
**Standard:** Rule 39 Conformance (Pre-Implementation Plan & Formal Architecture Review)  
**System:** Global Equity Intelligence & Autonomous Trading System  
**Phase:** Phase 7 — Portfolio & Real-Time Risk Engine  
**Author:** Principal Software Architect + Head of Quantitative Portfolio Risk  
**Timestamp:** 2026-10-06T12:56:00+07:00  
**Status:** **PLANNING COMPLETE — READY FOR EXECUTION**  

---

## 1. Executive Summary & Objective

In this phase, we develop **Phase 7: Portfolio & Real-Time Risk Engine**. While previous phases focused on stock screening (Phase 1), factor ranking (Phase 2), DCF valuation (Phase 3), adversarial red-teaming (Phase 4), tactical entry/stops (Phase 5), and AI-CIO consensus calibration (Phase 6), Phase 7 establishes the **Global Portfolio-Level Risk Guardrails**.

This engine operates 24/7 as an **autonomous, deterministic non-LLM supervisory daemon**, continuously monitoring portfolio health, sector concentrations, correlated drawdown risks, beta drift, and real-time circuit breakers.

---

## 2. Core Mathematical Models & Specifications

### 2.1 Sector Concentration & Exposure Drift Monitor
- **Hard Sector Cap:** Maximum **30.0%** of total portfolio net equity in any single GICS sector (e.g. Information Technology).
- **Single Asset Hard Cap:** Re-enforced at **10.0%** maximum allocation.
- **Drift Warning Threshold:** Sector allocation $> 25.0\%$ triggers an `ELEVATED_SECTOR_DRIFT` warning.
- **Hard Breach Action:** If any sector reaches $> 30.0\%$, the Hard Risk Engine deterministically rejects any new buy orders for stocks in that sector.

### 2.2 3-Tier Multi-Level Drawdown Circuit Breakers
Monitored relative to the High-Water Mark (HWM):
$$\text{Drawdown} = \frac{\text{Current Equity} - \text{High-Water Mark}}{\text{High-Water Mark}} \times 100\%$$

| Level | Drawdown Threshold | Trigger Condition | System Action | Status Code |
|---|---|---|---|---|
| **Level 1** | $\text{Drawdown} \le -5.0\%$ | Daily or trailing drop $\ge 5\%$ | **HALT NEW BUYS**: All new entry buy orders are blocked. Existing positions can only be managed (TP, SL, or hedge). | `CIRCUIT_BREAKER_L1_HALT_BUYS` |
| **Level 2** | $\text{Drawdown} \le -10.0\%$ | Trailing drop $\ge 10\%$ | **DEFENSIVE DELEVERAGING**: Auto-trim bottom 3 lowest-conviction positions to restore cash buffer to $\ge 50\%$. | `CIRCUIT_BREAKER_L2_DELEVERAGE` |
| **Level 3** | $\text{Drawdown} \le -15.0\%$ | Trailing drop $\ge 15\%$ | **EMERGENCY KILL SWITCH**: Immediate market liquidation of all open equity positions to 100% Cash/Treasury. Autonomous trading engine disabled until manual admin reset. | `CIRCUIT_BREAKER_L3_KILL_SWITCH` |

### 2.3 Portfolio Beta Drift & Automated Hedging Monitor
- **Portfolio Beta ($\beta_p$):**
  $$\beta_p = \sum_{i=1}^{M} w_i \cdot \beta_i \quad \text{where } w_i = \frac{\text{Position Value}_i}{\text{Total Portfolio Value}}$$
- **Beta Target Corridor:**
  $$\beta_{\text{target}} \in [0.70, 1.10]$$
- **Beta Drift Breach:**
  - If $\beta_p > 1.25$: High Market Sensitivity risk! Engine recommends macro hedge (SPY short or Put overlay) of size:
    $$\text{Hedge Notional} = (\beta_p - 1.0) \times \text{Portfolio Equity}$$
  - If $\beta_p < 0.50$: Extreme Defensiveness; review cash deployment.

### 2.4 Value-at-Risk (VaR) & Expected Shortfall (CVaR)
- **Parametric 95% 1-Day VaR:**
  $$\text{VaR}_{95\%, 1\text{d}} = 1.645 \times \sigma_p \times \text{Portfolio Value}$$
  where $\sigma_p$ is daily portfolio volatility calculated from the asset covariance matrix.
- **Conditional VaR (CVaR / Expected Shortfall):**
  $$\text{CVaR}_{95\%} = \frac{1}{1 - 0.95} \int_{0}^{0.05} \text{VaR}_\alpha \, d\alpha \approx 2.06 \times \sigma_p \times \text{Portfolio Value}$$
- **Maximum Historical Drawdown (MDD) Tracking:**
  $$\text{MDD} = \max_{\tau \le t} \left( \frac{\text{HWM}_\tau - \text{Equity}_\tau}{\text{HWM}_\tau} \right)$$

---

## 3. Database Schema & Migration (`007_portfolio_risk_schema.sql`)

1. **`public.stock_portfolio_snapshots`**:
   - `id SERIAL PRIMARY KEY`
   - `timestamp TIMESTAMPTZ DEFAULT NOW()`
   - `total_equity NUMERIC(15, 2) NOT NULL`
   - `cash_balance NUMERIC(15, 2) NOT NULL`
   - `invested_equity NUMERIC(15, 2) NOT NULL`
   - `high_water_mark NUMERIC(15, 2) NOT NULL`
   - `current_drawdown_pct NUMERIC(6, 3) NOT NULL`
   - `portfolio_beta NUMERIC(5, 2) NOT NULL`
   - `var_95_daily_usd NUMERIC(15, 2) NOT NULL`
   - `cvar_95_daily_usd NUMERIC(15, 2) NOT NULL`
   - `circuit_breaker_level INT DEFAULT 0`
   - `kill_switch_active BOOLEAN DEFAULT FALSE`
   - `sector_exposures JSONB NOT NULL`
   - `holdings JSONB NOT NULL`

2. **`public.stock_circuit_breaker_events`**:
   - `id SERIAL PRIMARY KEY`
   - `timestamp TIMESTAMPTZ DEFAULT NOW()`
   - `level INT NOT NULL`
   - `trigger_reason VARCHAR(255) NOT NULL`
   - `drawdown_pct NUMERIC(6, 3) NOT NULL`
   - `action_taken VARCHAR(100) NOT NULL`
   - `metadata JSONB`

---

## 4. Architectural Implementation Details

### 4.1 New Engine: `portfolio_risk.engine.ts`
Located in `server/src/modules/stocks/engine/portfolio_risk.engine.ts`.
- Singleton `portfolioRiskEngine` maintaining real-time positions, calculating sector weights, portfolio beta, VaR, and drawdown.
- Direct binding hooks into `HardRiskEngine`:
  - `hardRiskEngine.validateTradePlan()` updated to check:
    1. Is Circuit Breaker Level 1/2/3 or Kill Switch active? $\implies$ REJECT BUY.
    2. Does this trade push sector allocation above 30%? $\implies$ REJECT with `SECTOR_CAP_EXCEEDED`.
    3. Does this trade push single stock above 10%? $\implies$ REJECT with `POSITION_SIZE_EXCEEDED`.

### 4.2 Integration into `stocks.routes.ts`
- `GET /api/stocks/portfolio/summary`: Real-time portfolio equity, HWM, drawdown %, beta, VaR, CVaR, circuit breaker level, and kill switch status.
- `GET /api/stocks/portfolio/sectors`: Sector breakdown vs 30% hard cap.
- `GET /api/stocks/portfolio/circuit-breakers`: Circuit breaker history and current level.
- `POST /api/stocks/portfolio/rebalance`: Automated rebalance calculations and low-conviction trim orders.
- `POST /api/stocks/portfolio/kill-switch`: Manual or automated Kill Switch trigger/reset endpoint with admin authentication.

### 4.3 Frontend Dashboard Integration (`GlobalStocksPage.tsx`)
- Add **Tab 7: 🛡️ Portfolio Risk & Circuit Breakers (ระบบควบคุมความเสี่ยงพอร์ต & วงจรตัดขาดทุน)**:
  - **Circuit Breaker Status Banner**: Real-time Level 0 (NORMAL), Level 1 (HALT BUYS), Level 2 (DELEVERAGE), Level 3 (KILL SWITCH).
  - **Portfolio Equity & Drawdown Gauge**: Real-time gauge comparing current equity vs High-Water Mark and drawdown line.
  - **Sector Concentration Matrix**: Visual bars of all GICS sectors with 30% hard cap warning line.
  - **Risk Telemetry Cards**: Portfolio Beta, 1-Day 95% VaR ($), Expected Shortfall CVaR ($), Cash Buffer %, Sharpe / Sortino ratios.
  - **Live Positions Table with Beta & Conviction**: Real-time display of current portfolio holdings, unrealized P&L, weight %, and beta contribution.
  - **Emergency Kill Switch Controls**: Visual control panel with password/confirmation safeguard to test or trigger/reset emergency shutdown.

---

## 5. Verification & Testing Strategy
- Create `server/tests/stocks_phase7.test.ts` covering:
  - Portfolio snapshot calculations and equity aggregation.
  - Sector concentration 30% cap enforcement (blocks new buys in breached sector).
  - High-Water Mark tracking and accurate Drawdown % calculation.
  - Circuit Breaker Level 1 trigger ($-5\%$) and new buy block verification.
  - Circuit Breaker Level 2 trigger ($-10\%$) and defensive deleveraging logic.
  - Circuit Breaker Level 3 trigger ($-15\%$) and emergency kill switch execution.
  - Parametric VaR (95%) and CVaR calculations.
  - Portfolio Beta aggregation and SPY macro hedge recommendations.
  - HardRiskEngine integration ensuring zero execution when breakers are tripped.
- Verify 100% pass rate on Phase 7 tests and all previous phases (0-6).
- Rebuild client, sync to WSL, recreate Docker, and smoke test live endpoints.
