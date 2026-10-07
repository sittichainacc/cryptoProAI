# Phased Development Roadmap

- [x] **PHASE 0: Foundations & Architecture (COMPLETED)**
  - Architecture, Database Migration, 41 Agents Registry, Hard Risk Engine, Consensus Engine, API Endpoints, Frontend Menu "หุ้นต่างประเทศ", Verification Tests, Docker Integration.
- [x] **PHASE 1: Stock Universe & Automated Data Ingestion (COMPLETED)**
  - Expanded universe to 32 US Large Caps with 35-day OHLCV candles, Technical Indicators Engine (SMA, EMA 20/50/200, RSI 14, MACD 12/26/9, Bollinger Bands, ATR 14, Golden/Death Cross, RS vs SPY), SEC EDGAR Filings (10-K, 10-Q, 8-K), and Multi-Factor Screener with live REST endpoints and responsive UI tabs.
- [x] **PHASE 2: Team 1 Stock Ranking Production Automation (COMPLETED)**
  - Full factor ranking models with 10 Agents (T1-01 to T1-10), dynamic configurable factor weights (Momentum, Trend, Quality, Growth, Value, Revisions, Catalysts), automated composite score synthesis, database persistence (stock_ranking_runs, stock_ranking_scores), and interactive UI tab with sliders and leaderboard.
- [x] **PHASE 3: Team 2 Equity Research Automation (COMPLETED)**
  - 10 Fundamental Research Agents (T2-01 to T2-10), 2-Stage DCF Valuation mathematical engine with interactive WACC/growth sensitivity simulator, Reverse DCF implied growth calculator, Economic Moat scoring (Wide/Narrow/None), 3-scenario target price generator (Bull/Base/Bear), database persistence (stock_research_reports), and rich UI tab.
- [x] **PHASE 4: Team 3 Red Team Adversarial Review (COMPLETED)**
  - 10 Oppositional Agents (T3-01 to T3-10), 8-variable Beneish M-Score forensic accounting engine ($M > -1.78$ manipulator flag), crowded trade and sentiment heat meter (short interest %, days to cover, retail FOMO), technical breakdown detector (distribution days, EMA 50/200 breakdown, death cross), binding deterministic `RED_TEAM_VETO` integrated into Hard Risk Engine and order execution, PostgreSQL database persistence (`stock_red_team_audits`), and interactive UI tab.
- [x] **PHASE 5: Team 4 Tactical Asset Allocation (COMPLETED)**
  - Kelly Criterion sizing (Half-Kelly, hard cap 10%), Dynamic ATR Stops ($1.5 \times ATR_{14}$), multi-tier TP1/TP2/TP3 targets (2.0R, 3.2R, 4.8R runner with EMA20 trailing stop), Options Overlay, Beta Hedging vs SPY, TWAP/VWAP execution, DB persistence (`stock_tactical_plans`), and interactive UI tab. 273/273 tests passing.
- [x] **PHASE 6: AI-CIO & Consensus Calibration (COMPLETED)**
  - Full 41-Agent master synthesis chamber, empirical Brier score accuracy registry & dynamic calibration weighting, 3-topic dialectical debate arena (Bull vs Bear vs CIO compromise), supermajority voting ($\ge 67\%$), unconditional Red Team VETO enforcement, Bayesian 95% confidence intervals, Wall Street-grade Executive Investment Committee Memo, DB persistence (`stock_cio_memos`, `stock_agent_accuracies`), and interactive UI Tab 6. 437/437 tests passing.
- [x] **PHASE 7: Portfolio & Real-Time Risk Engine (COMPLETED)**
  - Real-time sector exposure drift monitor (30.0% hard cap), 3-tier drawdown circuit breakers (L1: -5% halt buys, L2: -10% deleveraging to 50% cash, L3: -15% emergency kill switch), automated cash rebalancing, portfolio beta hedging vs SPY, 1-Day 95% Parametric VaR & CVaR, DB persistence (`stock_portfolio_snapshots`, `stock_circuit_breaker_events`), and interactive UI Tab 7. 564/564 tests passing.
- [x] **PHASE 8: Paper Trading & Strategy Backtesting (COMPLETED)**
  - Virtual paper trading execution engine with dynamic slippage (3.5–25.0 bps) and broker/regulatory fee models, deterministic Hard Risk Engine gatekeeping (Rule 38: single position cap 10%, sector cap 30%, circuit breaker halts, Red Team VETO), 4 walk-forward historical backtest strategies (Multi-Agent Consensus, Momentum Trend Following, Mean Reversion Value, Fundamental DCF Quality), institutional performance metrics (CAGR, Alpha, Beta vs SPY, Sharpe, Sortino, MDD, Win Rate, Profit Factor), database persistence (`stock_paper_orders`, `stock_backtest_runs`), and interactive UI Tab 8. 646/646 tests passing.
- [x] **PHASE 9: Real-Time Market Data Provider & Production Hardening (COMPLETED)**
  - Real-time market data ingestion with Yahoo Finance API integration, live US 10Y Yield, 2Y Yield, VIX, DXY macro parameters, corporate news & sentiment scoring, market hours calculation (NYSE/NASDAQ 09:30-16:00 EST), Supabase PostgreSQL migration runner, multi-stage Docker containerization with static SPA serving, and UI Header Banner with live market status and sync button. 680/680 tests passing.


