# PHASE 5 PRE-IMPLEMENTATION PLAN
## Team 4: Tactical Asset Allocation, Dynamic ATR Stops & Kelly Sizing Engine

**Project:** Global Equity Intelligence & Autonomous Trading System  
**Phase:** Phase 5 — Team 4: Tactical Asset Allocation & Execution Strategy  
**Status:** READY TO IMPLEMENT  
**Standard:** Rules 38, 39, and 40 (Mandatory Pre-Implementation Plan)

---

### 1. Objective & Scope

Phase 5 implements **Team 4: Tactical Asset Allocation & Execution Strategy**, the operational unit responsible for converting high-conviction fundamental research and filtered universe candidates into executable, mathematically risk-managed trade plans.

Team 4 operates strictly within the boundaries enforced by the Non-LLM Hard Risk Engine:
1. **Position Sizing with Fractional Kelly Criterion:**
   Calculates optimal capital allocation based on empirical win probability and payout ratio, bounded by a strict 10% maximum portfolio hard cap.
2. **Dynamic ATR Volatility Stops & Invalidation:**
   Calculates volatility-adjusted Stop Loss ($1.5 \times ATR_{14}$ or Swing Low), ensuring consistent risk units ($R$) across varied stock volatilities.
3. **Multi-Tiered Scaling Take Profit Targets (TP1 / TP2 / TP3):**
   - **TP1 (1.5R - 2.0R):** Scale out 33% of position; move Stop Loss to Breakeven.
   - **TP2 (2.5R - 3.0R):** Scale out 33% of position.
   - **TP3 (Runner / 4.0R+):** Trailing stop via ATR 14 or EMA 20.
4. **Deterministic Risk/Reward Ratio Validation:**
   Enforces the $RR \ge 2.0:1$ requirement prior to order submission.
5. **Execution Tactics & Slippage Minimization:**
   TWAP/VWAP algorithmic recommendation, maximum allowable spread ($<0.3\%$), and expected slippage estimation.

---

### 2. Architecture & The 10 Team 4 Specialized Agents

| Agent ID | Agent Name | Core Mandate | Primary Quantitative Output |
|---|---|---|---|
| **T4-01** | **Timing & Trigger Agent** | Pinpoints high-probability entry triggers (EMA pullbacks, breakouts) | Entry Price & Confirmation Zone |
| **T4-02** | **Position Sizing Agent** | Kelly Criterion & volatility parity sizing | Recommended Allocation % (Max 10%) |
| **T4-03** | **Stop Loss / Invalidation Agent** | Invalidation level based on ATR 14 & support structure | Invalidation Stop Loss ($) & Risk ($R$) |
| **T4-04** | **Take Profit & Scaling Agent** | Multi-tier scaling exits with profit locking | TP1, TP2, TP3 targets & scaling schedule |
| **T4-05** | **Options Overlay Agent** | Covered calls / protective collar strategies | Hedging suggestion & strike prices |
| **T4-06** | **Hedging & Correlation Agent** | Portfolio beta mitigation & sector pair hedges | Correlation coefficient & hedge ratio |
| **T4-07** | **Execution Strategy Agent** | Smart order routing (TWAP, VWAP, Market, Limit) | Algorithmic execution recommendation |
| **T4-08** | **Liquidity & Slippage Agent** | Order book depth & spread validation | Spread check & expected slippage % |
| **T4-09** | **Risk-Reward Optimization Agent** | Verifies minimum 2.0:1 R/R ratio | Validated R/R ratio & pass/fail flag |
| **T4-10** | **Tactical Chairman Agent** | Synthesizes comprehensive Trade Plan for CIO review | Final Tactical Trade Proposal |

---

### 3. Mathematical Models & Formulations

#### 3.1 Fractional Kelly Criterion Position Sizing
$$f^* = \frac{p \cdot b - q}{b}$$
Where:
- $p$: Estimated probability of winning trade (derived from consensus score and historical win rate, e.g. $0.62$).
- $q = 1 - p$: Probability of losing trade ($0.38$).
- $b$: Win/Loss payout ratio ($\frac{\text{Average Gain}}{\text{Average Loss}} = \frac{TP_1 - \text{Entry}}{\text{Entry} - SL}$).

To prevent extreme drawdowns, **Half-Kelly ($0.5 \cdot f^*$)** is applied and bounded by the Hard Risk Engine:
$$\text{Recommended Size \%} = \min\left(10.0, \max\left(1.0, \text{round}\left(0.5 \cdot f^* \cdot 100, 1\right)\right)\right)$$

#### 3.2 Dynamic ATR Volatility Trailing Stop
$$\text{Risk Unit } (R) = 1.5 \times ATR_{14}$$
$$\text{Stop Loss} = \text{Entry Price} - R$$
$$\text{TP}_1 = \text{Entry Price} + (1.5 \cdot R) \quad [\text{Sell 33\%, SL} \to \text{Entry}]$$
$$\text{TP}_2 = \text{Entry Price} + (2.5 \cdot R) \quad [\text{Sell 33\%}]$$
$$\text{TP}_3 = \text{Entry Price} + (4.0 \cdot R) \quad [\text{Trailing Stop via } 2 \times ATR]$$

#### 3.3 Strict Risk/Reward Validation
$$RR = \frac{\text{TP}_1 - \text{Entry Price}}{\text{Entry Price} - \text{Stop Loss}} \ge 2.0$$

---

### 4. Implementation Steps

1. **Engine Implementation:**
   - Create `server/src/modules/stocks/engine/team4_tactical.engine.ts`.
   - Implement Fractional Kelly Calculator, Dynamic ATR Stops, TP1/TP2/TP3 generator, and all 10 Team 4 agent reports.
2. **Database Migration:**
   - Create `server/src/modules/stocks/migrations/005_team4_tactical_schema.sql` (`public.stock_tactical_plans`).
   - Register in `server/src/modules/stocks/migrations/migrate.ts`.
3. **REST API Endpoints:**
   - `GET /api/stocks/tactical/:ticker`
   - `POST /api/stocks/tactical/plan`
   - `POST /api/stocks/tactical/kelly`
4. **Unit Tests:**
   - Create `server/tests/stocks_phase5.test.ts`.
   - Validate Kelly sizing formulas, ATR calculations, multi-tier TP targets, and R/R ratio enforcement.
5. **Frontend UI Integration:**
   - Add tab: "Tactical Allocation & Execution Strategy (Team 4 กลยุทธ์การจัดสรรและเข้าทำกำไร)".
   - Interactive Kelly Sizing & Position Sizer Calculator.
   - Dynamic ATR Stop & Take Profit Visual Ladder (Entry, SL, TP1, TP2, TP3).
   - 10 Team 4 Tactical Agent cards with actionable execution parameters.
6. **Sync, Build & Docker Verification:**
   - Sync to WSL directory.
   - Run full unit tests (Phase 0 through Phase 5).
   - Rebuild Docker container and verify live endpoints.
