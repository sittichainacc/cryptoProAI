# 🎯 PRE-IMPLEMENTATION PLAN: PHASE 2

## 1. Executive Summary
- **Phase**: PHASE 2: TEAM 1 — Stock Ranking Production Automation
- **Objective**: พัฒนาเครื่องยนต์จัดอันดับหุ้นอัตโนมัติ (Team 1 Stock Ranking) ขับเคลื่อนด้วย AI Agent 10 ตัว (T1-01 ถึง T1-10) พร้อมระบบ Dynamic Factor Weights ปรับค่าน้ำหนักได้ตามสไตล์การลงทุน (Momentum, Value, Quality, Growth, Trend, Earnings Revision, Catalysts) และแสดงผล Top 10-20 Ranked Candidates พร้อมคะแนน breakdown ทุกมิติ.

---

## 2. System Architecture Impact
- **Engine Layer**: สร้าง `team1_ranking.engine.ts` ซึ่งรวมโมเดลคณิตศาสตร์และการประเมินของ Agent 10 ตัวใน Team 1
- **Database Layer**: เพิ่มตารางบันทึกประวัติการจัดอันดับและคะแนน Factor:
  - `stock_ranking_runs`
  - `stock_ranking_scores`
- **API Layer**: เพิ่ม Endpoint ใน `stocks.routes.ts`:
  - `POST /api/stocks/ranking/run`: ประมวลผลและจัดอันดับหุ้น 32 ตัว
  - `GET /api/stocks/ranking/latest`: ดึงผลการจัดอันดับล่าสุดพร้อม Leaderboard
  - `GET /api/stocks/ranking/weights`: ดึงค่าน้ำหนักปัจจุบัน (Default หรือ Custom)
- **Frontend Layer**: เพิ่มแท็บ "AI Ranking Engine (Team 1 จัดอันดับหุ้น)" พร้อม UI ตัวเลื่อนปรับค่าน้ำหนัก (Factor Weight Sliders), ปุ่ม Trigger Ranking, และ Leaderboard Cards พร้อมคะแนนย่อยของ 10 Agents.

---

## 3. Detailed Component Plan

### 3.1 The 10 Agents of Team 1
| Agent ID | Agent Name | Metric / Logic | Output (0-100) |
|---|---|---|---|
| **T1-01** | Universe Screener Agent | Large Cap ($10B+), ADV > 500k, Liquidity check | 0 - 100 |
| **T1-02** | Momentum Agent | 1M/3M/6M/12M return + RS vs SPY + 52W ATH Proximity | 0 - 100 |
| **T1-03** | Technical Trend Agent | Golden Cross, Price vs EMA20/50/200, RSI 50-65, MACD > 0 | 0 - 100 |
| **T1-04** | Quality Factor Agent | ROE (>20%), ROIC, Piotroski F-Score (0-9), Net Debt/EBITDA | 0 - 100 |
| **T1-05** | Growth Factor Agent | Revenue YoY growth, EPS YoY CAGR, Forward Projections | 0 - 100 |
| **T1-06** | Value Factor Agent | Inverse relative P/E, Forward P/E, EV/EBITDA, PEG (<1.5) | 0 - 100 |
| **T1-07** | Earnings Revision Agent | 4-quarter EPS Beat rate (4/4=95), Upward revisions | 0 - 100 |
| **T1-08** | Volume & Liquidity Agent | Volume accumulation on up-days vs down-days, ADV $500M+ | 0 - 100 |
| **T1-09** | News & Catalyst Agent | AI product cycle, Cloud CapEx, keynotes, regulatory tailwinds | 0 - 100 |
| **T1-10** | Ranking Chairman Agent | Synthesizes scores with dynamic weights -> Composite Rank | Composite Rank |

### 3.2 Dynamic Weight Configuration
Default Weights (Sum = 100%):
- Momentum: 20%
- Quality: 20%
- Growth: 15%
- Technical Trend: 15%
- Value: 10%
- Earnings Revision: 10%
- News & Catalysts: 10%

### 3.3 Conviction Matrix
- **Score >= 82**: `STRONG_BUY` (Tier 1 Top Conviction)
- **Score 72 - 81.9**: `BUY` (Tier 2 Growth/Quality Pick)
- **Score 60 - 71.9**: `WATCHLIST` (Tier 3 Pullback candidate)
- **Score < 60**: `NEUTRAL` (Tier 4 Low Relative Strength)

---

## 4. Test Strategy
1. Unit tests in `server/tests/stocks_phase2.test.ts`:
   - Test each agent's evaluation output is strictly between 0 and 100.
   - Test dynamic weight normalization (always sums to 1.0).
   - Test composite ranking sort order (descending total score).
   - Test tie-breaker logic if scores are equal.
   - Test API integration and persistence.

---

## 5. Risk Assessment & Rollback Plan
- **Risk**: Hard Risk Engine bypass.
  - **Mitigation**: Team 1 only generates Ranking Candidates; trades MUST still pass through Team 3 Red Team Veto and the Deterministic Hard Risk Engine before any trade execution.
- **Rollback**: In case of regression, revert `team1_ranking.engine.ts` and routes.

---

## 6. Checklist & Sign-off
- [x] Mathematical definitions designed for all 10 Team 1 Agents
- [x] Database migration schema drafted
- [x] API routes designed
- [x] UI components and weight sliders planned
- [x] Automated test suite drafted
