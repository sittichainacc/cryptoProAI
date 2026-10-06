# Database Schema & Entity Relationships

The system utilizes PostgreSQL (Supabase cloud cluster) with the following relational models:

## Tables Summary

| Table | Purpose |
| :--- | :--- |
| `stocks` | Master registry of global equity universe (ticker, exchange, sector, industry) |
| `stock_prices` | Daily OHLCV price time series |
| `fundamentals` | Financial statements, margins, ROE, FCF, and Piotroski F-Scores |
| `agent_definitions` | Registry of all 41 Agents, weights, roles, and assigned LLM models |
| `agent_prompts` | Prompt management with versioning support (V1, V2, V3) |
| `agent_runs` | Audit logs of each agent run with structured JSON output, tokens, and latency |
| `risk_rules` | Deterministic hard boundary parameters (configurable via Admin UI) |
| `cio_decisions` | Historical Investment Committee verdicts, consensus scores, and rationale |
| `trade_plans` | Active actionable plans with Entry low/high, Stop Loss, and TP1-3 |
| `paper_trades` | Simulated execution records and PnL tracking |
| `system_audit_logs` | Security and compliance audit trails |
