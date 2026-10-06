# Hard Risk Engine Specification

## 1. Guiding Principle
The Risk Engine is implemented entirely in **Deterministic TypeScript/Node.js Code** and **NOT** governed by LLMs. No generative model can override a violation.

## 2. Hard Boundaries
- **Global Kill Switch**: When activated (`active = true`), order execution is halted instantly.
- **Red Team Veto**: When `vetoRecommendation = true`, trade proposals are vetoed regardless of AI-CIO conviction.
- **Max Single Position Size**: Capped at 10.0% of total portfolio equity.
- **Max Portfolio Exposure**: Capped at 90.0% (guarantees a 10.0% cash safety buffer).
- **Max Sector Exposure**: Capped at 25.0% per sector.
- **Max Drawdown Limit**: Capped at 12.0%. Exceeding this triggers a portfolio freeze.
- **Daily Loss Breaker**: Capped at $5,000 USD daily realized/unrealized loss.
- **Minimum Risk-Reward**: Must equal or exceed 2.0:1.
- **Earnings Blackout**: Blocks opening new positions 2 days before earnings releases.
- **Liquidity Floor**: Requires at least $50,000,000 USD average daily volume.
