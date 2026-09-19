# 🚀 CryptoPro AI – Crypto Investment Intelligence & Analysis Platform

> **Comprehensive Decision Support System for Cryptocurrency Trading & Investment (100% Crypto Only)**  
> *ถอดแบบระบบและ Visual Design ภาษา Dark Navy Trading Terminal ตามภาพอ้างอิง CryptoPro AI ทั้ง 3 ภาพแบบ 100%*

---

## 📌 บทนำและเป้าหมายของระบบ (System Overview)

**CryptoPro AI** คือแพลตฟอร์มวิเคราะห์ คัดกรอง และติดตามการลงทุน Cryptocurrency เชิงปริมาณ (Quantitative Decision Support System) ที่สร้างขึ้นเพื่อช่วยให้นักลงทุนคริปโตตัดสินใจลงทุนอย่างมีแบบแผน มีข้อมูลสถิติรองรับ และมีการบริหารความเสี่ยงที่เป็นวิทยาศาสตร์

### คุณสมบัติหลักตามข้อกำหนด:
- **100% Cryptocurrency Only**: โฟกัสเฉพาะตลาดคริปโตเคอร์เรนซีล้วน ไม่มีสินทรัพย์ดั้งเดิมปะปน
- **Decision Support System**: ระบบวิเคราะห์และสนับสนุนการตัดสินใจ ไม่มีระบบส่งคำสั่งซื้อขายอัตโนมัติโดยที่ผู้ใช้ไม่ได้ยืนยัน ทุกสัญญาณมาพร้อม **บทวิเคราะห์ภาษาไทยเชิงตรรกะ (Human-Readable Thai Rationale)**
- **Bitkub Primary Exchange + Binance Global**: เชื่อมต่อข้อมูลจริงคู่เงินบาท (THB Pairs) จาก Bitkub REST API และดึงคู่เงินสากล (USDT Pairs) จาก Binance API อัตโนมัติ
- **8 Crypto Sectors**: จัดหมวดหมู่เหรียญ 8 สายแบบชัดเจน (1 Coin = 1 Primary Sector) พร้อม Widget **24 เหรียญแนะนำ (8 สาย สายละ 3 ตัว)** และ **Top 3 Overall (Gold, Silver, Bronze)**
- **Two-Tier Scoring Engine**:
  1. **Technical Score (0–100)**: วัด 7 มิติเชิงตัวเลข (Trend 20, Structure 20, Volume 15, Momentum 15, Relative Strength 10, Risk/Reward 10, Liquidity 10) ตัดเกรด A+ ถึง D
  2. **AI Score (0–100)**: สังเคราะห์ภาพรวมตลาด บิตคอยน์ โครงสร้างราคา และความเสี่ยง พร้อมระดับราคา Entry, Support, Resistance, และ Stop Loss Invalidation

---

## 🖥️ รายละเอียด 13 หน้าจอหลักของระบบ (Full 13 Screens)

1. **แดชบอร์ดหลัก (Dashboard Command Center)**:
   - 5 Top KPI Cards: Market Cap, 24h Volume, BTC Dominance, Fear & Greed Index, Market AI Trend
   - Top 10 Movers (Gainers, Losers, Volume)
   - Main Candlestick Chart (Lightweight Charts) พร้อม EMA 20, 50, 200, Bollinger Bands, Volume และปุ่ม Toggle สด
   - สัญญาณเด่นวันนี้ (AI) & รายการเฝ้าดูของฉัน
   - **24 เหรียญแนะนำ (8 สาย สายละ 3 ตัว)** และ **ตัวเด่นที่สุดตอนนี้ (Top 3 Overall)**
2. **ตลาดคริปโต (Crypto Market & Heatmap)**:
   - Total Market Cap Chart พร้อม Timeframe Selector
   - Sector Allocation Donut
   - Market Performance Heatmap ไทล์ขนาดตาม Market Cap
   - Sector Performance Bar Chart และ AI Strategy Guidance
3. **สแกนเหรียญ (Coin Screener - 8 Presets)**:
   - 8 โหมดสแกน: Breakout, Momentum, Trend Following, Pullback, Reversal, Volume Spike, Oversold, Relative Strength
   - แถบ Multi-Filters กรอง Sector, Minimum Volume, Risk Level
4. **วิเคราะห์เหรียญเชิงลึก (Coin Analysis Workstation & Modal)**:
   - กราฟแท่งเทียน Candlestick, โครงสร้าง Market Structure (HH/HL), จุด Breakout/Retest, แนวรับ 1-2, แนวต้าน 1-2 และจุด Invalidation
5. **วิเคราะห์กราฟ & เทคนิคอล (Technical Analysis)**:
   - ตารางค่าชี้วัด **17 Indicators Matrix** (EMA, SMA, RSI, MACD, BB, ATR, ADX, Supertrend, VWAP, OBV, Fibonacci)
   - **Multi-Timeframe Matrix (15m, 1H, 4H, 1D, 1W)** พร้อมการสังเคราะห์ Consensus Signal
6. **สัญญาณ AI (AI Signals Hub)**:
   - 11 สถานะสัญญาณการเทรด (`STRONG_BUY`, `BUY`, `WAIT_FOR_RETEST`, `WAIT_FOR_PULLBACK`, `WATCH`, `HIGH_RISK`, `SELL` ฯลฯ)
   - บทวิเคราะห์ภาษาไทยอธิบายเหตุผล, โซนเข้าซื้อ, เป้าทำกำไร, จุด Stop Loss
7. **รายการเฝ้าดู (Watchlist)**:
   - ตารางติดตามเหรียญคนโปรด แจ้งเตือนการเปลี่ยนแปลงของราคาและสัญญาณ AI
8. **พอร์ตการลงทุน & Position Sizing (Portfolio Workstation)**:
   - สรุปสินทรัพย์, Win Rate, Drawdown, ตาราง Open Positions
   - **Position Sizing Calculator (Section 28)**: ป้อนเงินทุน, % ความเสี่ยง, จุดเข้า, Stop Loss, Target -> คำนวณขนาดไม้, จำนวนเหรียญ, ความเสี่ยงสูงสุด และ Risk/Reward Ratio ทันที
9. **ศูนย์แจ้งเตือน (Alerts Center)**:
   - ฟีดแจ้งเตือนล่าสุด และแบบฟอร์มสร้างการแจ้งเตือนตามเงื่อนไขราคา, RSI, EMA Cross, Technical Score
10. **เครื่องมือ & กลยุทธ์ (Strategy & Quant Workstation)**:
    - **DCA Simulator & Backtester**: จำลองการออมเหรียญรายวัน/สัปดาห์/เดือน ย้อนหลัง 3M–3Y
    - **3 Core AI Strategies**: กฎและเหรียญที่เข้าเกณฑ์ของ Follow Trend, Swing Trade, Breakout
    - **Expectancy & R:R Engine**: ปรับ Win Rate, Avg Win/Loss คำนวณความได้เปรียบทางสถิติและเปรียบเทียบผลลัพธ์ 100 ไม้
    - **Crypto Correlation Matrix 30D**: เมทริกซ์สหสัมพันธ์ระหว่างเหรียญหลักเพื่อการกระจายความเสี่ยง
11. **รายงานสภาวะตลาด (Market Intelligence Reports)**:
    - สรุป Executive Summary สภาวะตลาด, Macro Metrics, Top AI Opportunities, Risk & Invalidation Rules
    - รองรับรายงาน Daily Briefing, Weekly Macro, Risk Assessment
    - ปุ่มแชร์สรุปข้อความ (Copy to Clipboard) และพิมพ์/บันทึก PDF
12. **ระบบสลับบทบาทผู้ใช้งาน (User Roles & Access Control - Section 40)**:
    - สลับโหมด **Investor** (เรียบง่าย สัญญาณชัดเจน), **Analyst** (17 Indicators, MTF Matrix, Rationale), **Admin** (จัดการ API Keys, Configs)
13. **ตั้งค่าระบบ (Settings & Exchange API Keys)**:
    - จัดการ API Key และ Secret สำหรับ Bitkub และ Binance
    - สลับสกุลเงินแสดงผล (**THB / USDT**), Timeframe เริ่มต้น, Risk %

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```
┌────────────────────────────────────────────────────────┐
│                   CryptoPro AI System                  │
└────────────────────────────────────────────────────────┘
                           │
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│     Backend Engine        │         │      Frontend Terminal    │
│  (Node.js + Express TS)   │         │ (React 18 + Vite + TS)    │
├───────────────────────────┤         ├───────────────────────────┤
│ • In-Memory Store & Cache │         │ • Dark Navy Trading UI    │
│ • Bitkub REST Adapter     │◄───────►│ • Lightweight Charts      │
│ • Binance Ticker Adapter  │  REST   │ • 13 Interactive Pages    │
│ • 5 Analytical Engines    │         │ • Search Autocomplete     │
│ • Background Sync (20s)   │         │ • Role Switcher           │
└───────────────────────────┘         └───────────────────────────┘
```

---

## ⚙️ วิธีการติดตั้งและรันระบบ (Quick Start)

### ความต้องการของระบบ (Prerequisites)
- **Node.js**: เวอร์ชัน 18.x หรือสูงกว่า
- **npm**: เวอร์ชัน 9.x หรือสูงกว่า

### 1. ติดตั้ง Dependencies
```bash
# ติดตั้ง root dependencies
npm install

# ติดตั้ง Backend dependencies
cd server
npm install

# ติดตั้ง Frontend dependencies
cd ../client
npm install
cd ..
```

### 2. รันระบบ (Development Mode)

#### รัน Backend Server:
```bash
cd server
npm run dev
# เซิร์ฟเวอร์จะเปิดทำงานที่ http://localhost:5000/
```

#### รัน Frontend Client:
```bash
cd client
npm run dev -- --port 3000
# เว็บแอปพลิเคชันจะเปิดทำงานที่ http://localhost:3000/
```

### 3. ตรวจสอบการ Build สำหรับ Production:
```bash
cd client
npm run build
```

---

## 📊 หมวดหมู่ 8 Crypto Sectors (Classification)

| หมวดหมู่ (Sector) | ตัวอย่างเหรียญ | สัดส่วนความสำคัญ |
|---|---|:---:|
| **1. Core Cryptos** | BTC, ETH | รากฐานและสภาพคล่องหลักของตลาด |
| **2. Layer 1 / Layer 2** | SOL, BNB, ADA, AVAX, SUI, NEAR, MATIC, OP, ARB | แพลตฟอร์ม Smart Contract และ Scalability |
| **3. DeFi (Decentralized Finance)** | UNI, AAVE, CRV, MKR, SNX, LDO, JUP | การเงินไร้ตัวกลาง สภาพคล่อง Yield |
| **4. AI & DePIN** | FET, RENDER, TAO, NEAR, FLOCK, AKT | ปัญญาประดิษฐ์และโครงสร้างพื้นฐานกระจายศูนย์ |
| **5. RWA & Oracles** | LINK, ONDO, PYTH, PENDLE, MKR | โทเค็นสินทรัพย์ในโลกจริงและข้อมูลบล็อกเชน |
| **6. Meme Coins** | DOGE, SHIB, PEPE, WIF, BONK, FLOKI | เหรียญกระแสและคอมมูนิตี้ขับเคลื่อน |
| **7. GameFi & Metaverse** | GALA, AXS, SAND, MANA, ILV, IMX | เกมมิ่ง บล็อกเชน และสินทรัพย์เสมือน |
| **8. Emerging & High Beta** | TIA, SEI, JTO, STRK, W | โปรเจกต์เกิดใหม่ ศักยภาพการเติบโตสูง |

---

## 🔒 มาตรฐานความปลอดภัยและการบริหารความเสี่ยง (Risk Management)
- **No Direct Execution**: ไม่มีการส่งคำสั่งซื้อขายจริงโดยอัตโนมัติ ทุกการตัดสินใจขึ้นอยู่กับผู้ใช้งาน
- **Invalidation Level Mandatory**: ทุกสัญญาณแนะนำการซื้อขายของระบบต้องมีจุด Invalidation (Stop Loss) กำกับเสมอ
- **Position Sizing Rule**: แนะนำจำกัดความเสี่ยงไม่เกิน 1.5% - 2.0% ของพอร์ตรวมต่อหนึ่งไม้การลงทุน

---
*Crypto Investment Intelligence Platform by CryptoPro AI Team*
