# 🎯 PRE-IMPLEMENTATION PLAN: PHASE 3

## 1. Executive Summary
- **Phase**: PHASE 3: TEAM 2 — Equity Research Automation
- **Objective**: พัฒนาเครื่องยนต์วิเคราะห์ปัจจัยพื้นฐานเชิงลึก (Team 2 Equity Research) ขับเคลื่อนด้วย AI Agent 10 ตัว (T2-01 ถึง T2-10) พร้อมโมเดลประเมินมูลค่าหุ้น 2-Stage DCF Valuation (Discounted Cash Flow), การวิเคราะห์คูเมืองธุรกิจ (Economic Moat), งบดุล กระแสเงินสดอิสระ (FCF) และการจำลองฉากทัศน์ 3 ระดับ (Bull, Base, Bear Scenarios) เพื่อหา Fair Value และ Margin of Safety.

---

## 2. System Architecture Impact
- **Engine Layer**: สร้าง `team2_research.engine.ts` ซึ่งประกอบด้วย:
  - โมเดล 2-Stage DCF (Discounted Cash Flow Model): คำนวณ Projected Free Cash Flow 5 ปี + Terminal Value โดยใช้ WACC (Weighted Average Cost of Capital) และ Terminal Growth Rate
  - Reverse DCF Model: คำนวณ Implied FCF Growth Rate ที่ตลาดกำลังสะท้อนอยู่ในราคาปัจจุบัน
  - Economic Moat Scoring: ประเมิน Network Effect, Switching Costs, Cost Advantage, Intangible Assets
  - Bull / Base / Bear Scenario Generator
- **Database Layer**: เพิ่มตารางบันทึกรายงานผลวิจัยและผลการประเมินมูลค่า:
  - `stock_research_reports`: id, ticker, fair_value_base, fair_value_bull, fair_value_bear, margin_of_safety_pct, moat_rating, bull_case, base_case, bear_case, created_at
- **API Layer**: เพิ่ม Endpoint ใน `stocks.routes.ts`:
  - `GET /api/stocks/research/:ticker`: ดึงผลการวิเคราะห์ปัจจัยพื้นฐานและ Valuation ของ Team 2
  - `POST /api/stocks/research/dcf`: จำลองโมเดล DCF โดยปรับเปลี่ยน WACC, Terminal Growth Rate หรือ FCF Growth ได้ตามต้องการ
- **Frontend Layer**: เพิ่มแท็บหรือเสริมแผง "Equity Research & DCF Valuation (Team 2)" บน Dashboard ให้แสดง Fair Value Band, Margin of Safety Gauge, Economic Moat Badge, และ Bull/Base/Bear Thesis.

---

## 3. Detailed Component Plan

### 3.1 The 10 Agents of Team 2
| Agent ID | Agent Name | Focus Area & Mathematical Logic | Key Metric / Output |
|---|---|---|---|
| **T2-01** | Revenue / Growth Agent | Segment revenue, 3Y CAGR, Operating leverage | Revenue CAGR %, Growth Health (0-100) |
| **T2-02** | Income Statement Agent | Gross Margin, Operating Margin, Net Margin trends | Margin Quality Score (0-100) |
| **T2-03** | Balance Sheet Agent | Net Debt / EBITDA, Cash runway, Quick Ratio | Solvency Score (0-100), Net Cash ($B) |
| **T2-04** | Cash Flow / FCF Agent | FCF Yield %, OCF to Net Income conversion | FCF Yield %, Conversion Ratio |
| **T2-05** | Valuation Agent | 2-Stage DCF, Reverse DCF, Fair Value vs Price | Fair Value ($), Margin of Safety % |
| **T2-06** | Business / Moat Agent | Network effects, Switching costs, Cost advantage | Moat: `WIDE`, `NARROW`, `NONE` |
| **T2-07** | Management Agent | ROIC vs WACC spread, Capital allocation, Buybacks | Capital Allocation Score (0-100) |
| **T2-08** | Earnings Call Agent | Transcript sentiment, Guidance revision direction | Sentiment Score (0-100), Tone |
| **T2-09** | Competitor / TAM Agent | TAM ($B), Market share, Porter's 5 Forces | Market Share %, Moat Trend |
| **T2-10** | Research Chairman Agent | Synthesizes Bull/Base/Bear cases and final Fair Value | Bull / Base / Bear Price Targets |

### 3.2 2-Stage DCF Valuation Mathematical Model
1. **Stage 1: Explicit Forecast (Years 1 to 5)**:
   $$FCF_t = FCF_0 \times (1 + g_1)^t$$
   $$PV(FCF) = \sum_{t=1}^{5} \frac{FCF_t}{(1 + WACC)^t}$$
2. **Stage 2: Terminal Value (Gordon Growth Model)**:
   $$TV_5 = \frac{FCF_5 \times (1 + g_{\infty})}{WACC - g_{\infty}}$$
   $$PV(TV) = \frac{TV_5}{(1 + WACC)^5}$$
3. **Enterprise Value & Equity Value**:
   $$\text{Enterprise Value} = PV(FCF) + PV(TV)$$
   $$\text{Equity Value} = \text{Enterprise Value} + \text{Cash} - \text{Total Debt}$$
   $$\text{Fair Value per Share} = \frac{\text{Equity Value}}{\text{Shares Outstanding}}$$
4. **Margin of Safety (MoS)**:
   $$\text{Margin of Safety} = \frac{\text{Fair Value} - \text{Current Price}}{\text{Fair Value}} \times 100\%$$

---

## 4. Test Strategy
1. Unit tests in `server/tests/stocks_phase3.test.ts`:
   - Test DCF model math produces positive, reasonable Fair Value for various inputs.
   - Test Margin of Safety calculation formula.
   - Test Moat evaluation returns valid categories (`WIDE`, `NARROW`, `NONE`).
   - Test Bull / Base / Bear target ordering: $\text{Bear Target} < \text{Base Target} < \text{Bull Target}$.
   - Test all 10 Team 2 agents evaluate and generate non-empty theses.
   - Test research API endpoints `/api/stocks/research/:ticker` and `/api/stocks/research/dcf`.

---

## 5. Risk Assessment & Rollback Plan
- **Risk**: Unrealistic DCF assumptions (e.g. WACC <= Terminal Growth Rate causing divide by zero or negative EV).
  - **Mitigation**: Strict validation: $WACC \ge g_{\infty} + 1.5\%$. Fallback to historical multiples if assumptions are invalid.
- **Rollback**: Revert `team2_research.engine.ts` and routes without affecting Phase 0, 1, or 2.

---

## 6. Checklist & Sign-off
- [x] DCF 2-stage formula and Reverse DCF mathematically defined
- [x] Database migration schema drafted
- [x] 10 Team 2 agent definitions structured
- [x] UI Valuation Band & Scenario viewer designed
- [x] Test suite designed
