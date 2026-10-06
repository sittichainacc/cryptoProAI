# 🎯 PRE-IMPLEMENTATION PLAN: PHASE 4

## 1. Executive Summary
- **Phase**: PHASE 4: TEAM 3 — Red Team Adversarial Review
- **Objective**: พัฒนาระบบตรวจสอบความเสี่ยงเชิงปรปักษ์ (Red Team Adversarial Engine) ขับเคลื่อนด้วย AI Agent 10 ตัว (T3-01 ถึง T3-10) ทำหน้าที่เป็น "ฝ่ายค้านและผู้จับผิดการลงทุน" พร้อมโมเดลนิติวิทยาศาสตร์ทางบัญชี **Beneish M-Score** (ตรวจจับการตกแต่งงบการเงิน), การตรวจจับ **Crowded Trade / Short Squeeze**, การตรวจจับ **Technical Breakdown**, และการบังคับใช้อำนาจยับยั้งเด็ดขาด **`RED_TEAM_VETO`** เพื่อเชื่อมต่อเข้าสู่ Deterministic Hard Risk Engine โดยตรง

---

## 2. System Architecture Impact
- **Engine Layer**: สร้าง `team3_red_team.engine.ts`:
  - **Beneish M-Score Forensic Model**: คำนวณอัตราส่วน 8 ตัวชี้วัด (DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA) เพื่อจำแนกความเสี่ยงการตกแต่งงบ (Threshold: M-Score > -1.78 = Manipulator Alert)
  - **Crowded Trade & Sentiment Heat Detector**: คำนวณ Short Interest % of Float, Days to Cover, Retail Euphoria, Positioning Squeeze Risk
  - **Technical Breakdown Engine**: ตรวจสอบการหลุดเส้นค่าเฉลี่ยสำคัญ, Distribution Days, และ Head & Shoulders Tops
  - **Binding Veto Engine**: หากพบ Red Flags ร้ายแรง $\ge 3$ ข้อ หรือ M-Score ผิดปกติ จะสั่งการ `RED_TEAM_VETO = true` ไปยัง `risk_engine.ts` ทันที
- **Database Layer**: เพิ่มตารางบันทึกรายงานการตรวจสอบเชิงปรปักษ์:
  - `stock_red_team_audits`: บันทึก id, ticker, threat_level, veto_triggered, red_flags_count, beneish_m_score, crowded_trade_score, objections, counter_evidence, agent_reports, chairman_synthesis
- **API Layer**: เพิ่ม Endpoint ใน `stocks.routes.ts`:
  - `GET /api/stocks/red-team/:ticker`: ดึงผลการตรวจสอบความเสี่ยง 10 Agents ของหุ้นที่ระบุ
  - `POST /api/stocks/red-team/audit`: รันการประเมิน Red Team Adversarial Stress Test
- **Frontend Layer**: เพิ่มแท็บ "Red Team Adversarial Audit (Team 3 ตรวจสอบความเสี่ยง & Veto)" พร้อมเกจ Beneish M-Score, สัญญาณเตือน Red Flags, และปุ่มทดสอบจำลอง Veto Binding Live!

---

## 3. Detailed Component Plan

### 3.1 The 10 Agents of Team 3 (Adversarial Committee)
| Agent ID | Agent Name | Core Vulnerability Tested | Key Formula / Metric |
|---|---|---|---|
| **T3-01** | Bear Case Agent | Downside Stress Test under Recession & Multiples Compression | Max Drawdown %, Tail Risk ($) |
| **T3-02** | Accounting / Forensic Agent | Financial Manipulation & Revenue Recognition Anomalies | Beneish M-Score (Threshold: > -1.78) |
| **T3-03** | Valuation Challenge Agent | Aggressive Terminal Growth & Unrealistic Multiple Expansion | Reverse Multiple Compression % |
| **T3-04** | Earnings Risk Agent | Next-Quarter Miss Sensitivity & Guidance Cut Vulnerability | Earnings Vulnerability Score (0-100) |
| **T3-05** | Technical Breakdown Agent | Institutional Distribution Days & Major Support Invalidation | Distribution Patterns, Trend Exhaustion |
| **T3-06** | Macro Risk Agent | 10Y Yield Spikes, DXY Surge, Tariffs, Geopolitics | Macro Fragility Score (0-100) |
| **T3-07** | Industry Risk Agent | Big Tech Threat, Antitrust / DOJ Regulations, AI Commoditization | Regulatory & Competitive Threat Level |
| **T3-08** | Crowded Trade Agent | Short Interest %, Retail FOMO, Liquidity Squeeze Risk | Crowded Trade Score (0-100) |
| **T3-09** | Portfolio Correlation Agent | Covariance Clustering with Existing Portfolio Holdings | Portfolio Beta & Cross-Asset Correlation |
| **T3-10** | Red Team Chairman Agent | Synthesizes Threat Level & Executes Binding `RED_TEAM_VETO` | Threat Level (`LOW`/`MED`/`HIGH`/`CRITICAL`), VETO |

### 3.2 Beneish M-Score Mathematical Model
$$M\text{-Score} = -4.84 + 0.920 \cdot DSRI + 0.528 \cdot GMI + 0.404 \cdot AQI + 0.892 \cdot SGI + 0.115 \cdot DEPI - 0.172 \cdot SGAI + 4.037 \cdot TATA + 0.0327 \cdot LVGI$$
- **DSRI (Days Sales in Receivables Index)**: $\frac{\text{Receivables}_t / \text{Sales}_t}{\text{Receivables}_{t-1} / \text{Sales}_{t-1}}$
- **GMI (Gross Margin Index)**: $\frac{\text{Gross Margin}_{t-1}}{\text{Gross Margin}_t}$
- **AQI (Asset Quality Index)**: Non-current assets other than PP&E ratio
- **SGI (Sales Growth Index)**: $\frac{\text{Sales}_t}{\text{Sales}_{t-1}}$
- **DEPI (Depreciation Index)**: $\frac{\text{Depr Rate}_{t-1}}{\text{Depr Rate}_t}$
- **SGAI (Sales, General and Admin Expense Index)**: $\frac{\text{SGA}_t / \text{Sales}_t}{\text{SGA}_{t-1} / \text{Sales}_{t-1}}$
- **LVGI (Leverage Index)**: $\frac{\text{Total Long Term Debt}_t / \text{Total Assets}_t}{\text{Total Long Term Debt}_{t-1} / \text{Total Assets}_{t-1}}$
- **TATA (Total Accruals to Total Assets)**: $\frac{\text{Net Income} - \text{Cash Flow from Operations}}{\text{Total Assets}}$

**Threshold Decision**:
- $M\text{-Score} > -1.78$: 🚨 **High Probability of Earnings Manipulation (RED FLAG)**
- $M\text{-Score} \le -1.78$: ✅ **Low Probability of Manipulation (Normal Accounting)**

---

## 4. Test Strategy
1. Unit tests in `server/tests/stocks_phase4.test.ts`:
   - Beneish M-Score calculation matches reference benchmark.
   - Manipulator detection flags when M-Score > -1.78.
   - Crowded trade scoring logic checks short interest and sentiment.
   - Binding `RED_TEAM_VETO` power successfully sets veto state and is rejected by `risk_engine.evaluateTrade()`.
   - All 10 Team 3 agents generate adversarial stress-test theses.
   - REST API endpoint `/api/stocks/red-team/:ticker` returns valid payload.

---

## 5. Risk Assessment & Rollback Plan
- **Risk**: False positives in Beneish M-Score for hyper-growth SaaS companies (due to rapid sales growth SGI).
  - **Mitigation**: SaaS-specific adjustments to SGAI and AQI weighting to reflect R&D amortization standards.
- **Rollback**: Non-destructive modular architecture ensures seamless rollback without impacting previous phases.

---

## 6. Checklist & Sign-off
- [x] Beneish M-Score formula mathematically structured
- [x] 10 Team 3 adversarial agents defined
- [x] Binding VETO integration with Deterministic Hard Risk Engine confirmed
- [x] Database migration schema drafted
- [x] Test suite designed
