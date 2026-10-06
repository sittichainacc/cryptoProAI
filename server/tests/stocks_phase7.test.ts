// ============================================================================
// Phase 7 Unit Test Suite: Portfolio & Real-Time Risk Engine
// Comprehensive Verification of Sector Caps, Circuit Breakers, Deleveraging,
// Macro Hedging, VaR Telemetry, and Deterministic Kill Switch Enforcement
// ============================================================================

import { portfolioRiskEngine } from '../src/modules/stocks/engine/portfolio_risk.engine.js';
import { hardRiskEngine } from '../src/modules/stocks/engine/risk_engine.js';
import { globalStockStore } from '../src/modules/stocks/engine/stock_store.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (detail !== undefined) {
      console.error('   Detail:', detail);
    }
  }
}

console.log('========================================================');
console.log('🧪 RUNNING PHASE 7 TESTS: PORTFOLIO & REAL-TIME RISK ENGINE');
console.log('========================================================\n');

// ----------------------------------------------------------------------------
// TEST SUITE 1: Portfolio State Initialization & Mark-to-Market
// ----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Portfolio State Initialization & Mark-to-Market ---');

const summary1 = portfolioRiskEngine.getRiskSummary();
assert(summary1.totalEquity > 50000, `Initial total equity must be positive and substantial (got $${summary1.totalEquity})`);
assert(summary1.cashBalance > 0, `Initial cash balance must be positive (got $${summary1.cashBalance})`);
assert(summary1.investedEquity > 0, `Invested equity must be positive (got $${summary1.investedEquity})`);
assert(
  Math.abs(summary1.totalEquity - (summary1.cashBalance + summary1.investedEquity)) < 0.05,
  'Total equity must equal cash balance + invested equity'
);
assert(summary1.highWaterMark >= summary1.totalEquity, 'High-water mark must be initialized at or above equity');
assert(summary1.currentDrawdownPct <= 0, `Initial drawdown must be <= 0% (got ${summary1.currentDrawdownPct}%)`);
assert(summary1.circuitBreakerLevel === 0, 'Circuit breaker must initially be Level 0 (NORMAL)');
assert(summary1.killSwitchActive === false, 'Kill switch must initially be FALSE');

const holdings1 = portfolioRiskEngine.getLiveHoldings();
assert(holdings1.length >= 5, `Must have at least 5 seeded initial holdings (got ${holdings1.length})`);

for (const h of holdings1) {
  assert(h.shares > 0, `${h.ticker} shares must be positive`);
  assert(h.currentPrice > 0, `${h.ticker} current price must be positive ($${h.currentPrice})`);
  assert(h.marketValue > 0, `${h.ticker} market value must be positive ($${h.marketValue})`);
  assert(h.weightPct > 0 && h.weightPct <= 35, `${h.ticker} weight must be within valid range (${h.weightPct}%)`);
  assert(h.beta > 0, `${h.ticker} beta must be positive (${h.beta})`);
  assert(h.convictionScore >= 50 && h.convictionScore <= 100, `${h.ticker} conviction score must be 50-100 (${h.convictionScore})`);
}

// ----------------------------------------------------------------------------
// TEST SUITE 2: Sector Concentrations & 30% Hard Cap
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Sector Concentrations & 30% Hard Cap ---');

const sectors = portfolioRiskEngine.getSectorExposures();
assert(sectors.length >= 3, `Must have exposures across at least 3 sectors (got ${sectors.length})`);

let totalWeightSum = 0;
for (const s of sectors) {
  assert(s.hardCapPct === 30.0, `${s.sector} hard cap must be exactly 30.0%`);
  assert(s.marketValue > 0, `${s.sector} market value must be positive ($${s.marketValue})`);
  assert(s.stockCount >= 1, `${s.sector} stock count must be >= 1 (${s.stockCount})`);
  assert(s.weightPct > 0, `${s.sector} weight must be positive (${s.weightPct}%)`);
  assert(['NORMAL', 'ELEVATED', 'BREACHED'].includes(s.status), `${s.sector} status must be valid (${s.status})`);
  totalWeightSum += s.weightPct;
}
assert(totalWeightSum <= 100.0, `Total sector weights sum must not exceed 100% (got ${totalWeightSum.toFixed(2)}%)`);

// ----------------------------------------------------------------------------
// TEST SUITE 3: Portfolio Risk, Beta & Value-at-Risk (VaR) Telemetry
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Portfolio Risk, Beta & VaR Telemetry ---');

assert(summary1.portfolioBeta >= 0.5 && summary1.portfolioBeta <= 1.5, `Portfolio Beta must be realistic (got ${summary1.portfolioBeta})`);
assert(summary1.betaTargetCorridor[0] === 0.70 && summary1.betaTargetCorridor[1] === 1.10, 'Target corridor must be [0.70, 1.10]');
assert(['OPTIMAL', 'ELEVATED', 'DEFENSIVE'].includes(summary1.betaStatus), `Beta status must be valid (${summary1.betaStatus})`);

const varMetrics = summary1.varMetrics;
assert(varMetrics.dailyVolPct > 0, `Daily volatility must be positive (${varMetrics.dailyVolPct}%)`);
assert(varMetrics.var95DailyPct > 0, `95% VaR pct must be positive (${varMetrics.var95DailyPct}%)`);
assert(varMetrics.var95DailyUsd > 0, `95% VaR USD must be positive ($${varMetrics.var95DailyUsd})`);
assert(varMetrics.cvar95DailyPct > varMetrics.var95DailyPct, 'Expected Shortfall (CVaR %) must exceed VaR %');
assert(varMetrics.cvar95DailyUsd > varMetrics.var95DailyUsd, 'Expected Shortfall (CVaR $) must exceed VaR $');
assert(varMetrics.sharpeRatio > 0, `Sharpe ratio must be positive (${varMetrics.sharpeRatio})`);
assert(varMetrics.sortinoRatio > 0, `Sortino ratio must be positive (${varMetrics.sortinoRatio})`);

assert(typeof summary1.macroHedgeRecommendation.required === 'boolean', 'Macro hedge required must be boolean');
assert(['SPY_SHORT', 'SPY_PUT_OVERLAY', 'NONE'].includes(summary1.macroHedgeRecommendation.instrument), 'Hedge instrument must be valid');

// ----------------------------------------------------------------------------
// TEST SUITE 4: Trade Pre-Execution Clearance Engine
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Trade Pre-Execution Clearance Engine ---');

// 4.1 Valid BUY order within limits (GOOGL in Communication Services, 0% current holding)
const validBuy = portfolioRiskEngine.canExecuteTrade('GOOGL', 'BUY', 2000.0);
assert(validBuy.allowed === true, 'Valid BUY order under limits must be approved');

// 4.2 Insufficient cash rejection
const overCashBuy = portfolioRiskEngine.canExecuteTrade('JNJ', 'BUY', summary1.cashBalance + 50000.0);
assert(overCashBuy.allowed === false, 'BUY exceeding cash balance must be rejected');
assert(overCashBuy.violationReason?.includes('INSUFFICIENT_CASH') === true, 'Reason must state INSUFFICIENT_CASH');

// 4.3 Position Sizing Cap (10.0%)
const hugePositionBuy = portfolioRiskEngine.canExecuteTrade('NVDA', 'BUY', summary1.totalEquity * 0.15);
assert(hugePositionBuy.allowed === false, 'BUY pushing single position above 10% must be rejected');
assert(hugePositionBuy.violationReason?.includes('POSITION_CAP_EXCEEDED') === true, 'Reason must state POSITION_CAP_EXCEEDED');

// 4.4 Sector Concentration Cap (30.0%)
// Information Technology already holds NVDA, AAPL, MSFT (~35k). Adding 10k more pushes it way over 30%
const hugeSectorBuy = portfolioRiskEngine.canExecuteTrade('MSFT', 'BUY', 15000.0);
assert(hugeSectorBuy.allowed === false, 'BUY pushing sector above 30% hard cap must be rejected');
assert(
  hugeSectorBuy.violationReason?.includes('SECTOR_CAP_EXCEEDED') ||
  hugeSectorBuy.violationReason?.includes('POSITION_CAP_EXCEEDED'),
  'Reason must state SECTOR_CAP_EXCEEDED or POSITION_CAP_EXCEEDED'
);

// 4.5 SELL orders are always allowed for risk reduction
const sellCheck = portfolioRiskEngine.canExecuteTrade('NVDA', 'SELL', 5000.0);
assert(sellCheck.allowed === true, 'SELL orders must always be allowed for risk reduction');

// ----------------------------------------------------------------------------
// TEST SUITE 5: Circuit Breaker Level 1 Trigger (Drawdown >= 5%)
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Circuit Breaker Level 1 Trigger (Drawdown >= 5%) ---');

// Simulate HWM increase to create 6% drawdown
const currentEq = summary1.totalEquity;
portfolioRiskEngine.setHighWaterMark(currentEq / 0.94); // Forces ~6.0% drawdown

const cbEval1 = portfolioRiskEngine.evaluateCircuitBreakers();
assert(cbEval1.level === 1, `Drawdown of 6% must trigger Circuit Breaker Level 1 (got Level ${cbEval1.level})`);
assert(cbEval1.actionTaken.includes('HALT_BUYS'), 'Action must state HALT_BUYS');

const summaryAfterL1 = portfolioRiskEngine.getRiskSummary();
assert(summaryAfterL1.circuitBreakerLevel === 1, 'Summary must reflect Circuit Breaker Level 1');
assert(summaryAfterL1.circuitBreakerStatus === 'HALT_BUYS', 'Status must be HALT_BUYS');

// Verify that ANY new BUY order is now rejected under Level 1
const buyUnderL1 = portfolioRiskEngine.canExecuteTrade('JNJ', 'BUY', 500.0);
assert(buyUnderL1.allowed === false, 'New BUY order MUST BE BLOCKED under Circuit Breaker Level 1');
assert(buyUnderL1.violationReason?.includes('CIRCUIT_BREAKER_L1_ACTIVE') === true, 'Reason must state CIRCUIT_BREAKER_L1_ACTIVE');

// But SELL orders remain allowed
const sellUnderL1 = portfolioRiskEngine.canExecuteTrade('JNJ', 'SELL', 500.0);
assert(sellUnderL1.allowed === true, 'SELL orders must remain allowed under Level 1 to reduce exposure');

// ----------------------------------------------------------------------------
// TEST SUITE 6: Circuit Breaker Level 2 Trigger (Drawdown >= 10%) & Deleveraging
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 6: Circuit Breaker Level 2 Trigger (Drawdown >= 10%) & Deleveraging ---');

// Simulate 11% drawdown
portfolioRiskEngine.setHighWaterMark(currentEq / 0.89); // Forces ~11.0% drawdown

const cbEval2 = portfolioRiskEngine.evaluateCircuitBreakers();
assert(cbEval2.level === 2, `Drawdown of 11% must trigger Circuit Breaker Level 2 (got Level ${cbEval2.level})`);
assert(cbEval2.actionTaken.includes('DELEVERAGING'), 'Action must state DELEVERAGING');

// Test defensive deleveraging to target 50% cash buffer
const preDelevCash = portfolioRiskEngine.getRiskSummary().cashBalance;
const delevResult = portfolioRiskEngine.executeDeleveraging(50.0);

assert(delevResult.newCashBalance >= preDelevCash, 'Cash balance must increase after deleveraging');
assert(delevResult.trimmedPositions.length > 0, 'Must have trimmed at least 1 position');
assert(delevResult.newCashRatioPct >= 45.0, `New cash ratio must approach or exceed target buffer (got ${delevResult.newCashRatioPct}%)`);

// ----------------------------------------------------------------------------
// TEST SUITE 7: Circuit Breaker Level 3 Trigger (Drawdown >= 15%) & Emergency Kill Switch
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 7: Circuit Breaker Level 3 & Emergency Kill Switch ---');

// Simulate 16% drawdown
portfolioRiskEngine.setHighWaterMark(currentEq / 0.84); // Forces ~16.0% drawdown

const cbEval3 = portfolioRiskEngine.evaluateCircuitBreakers();
assert(cbEval3.level === 3, `Drawdown of 16% must trigger Circuit Breaker Level 3 (got Level ${cbEval3.level})`);
assert(cbEval3.actionTaken.includes('KILL_SWITCH'), 'Action must state KILL_SWITCH');

const summaryAfterL3 = portfolioRiskEngine.getRiskSummary();
assert(summaryAfterL3.circuitBreakerLevel === 3, 'Summary must reflect Circuit Breaker Level 3');
assert(summaryAfterL3.killSwitchActive === true, 'Kill switch must be ACTIVE');
assert(hardRiskEngine.getConfig().global_kill_switch_active === true, 'HardRiskEngine global kill switch must be synchronized to TRUE');

// Under Level 3, ALL orders are rejected
const anyOrderUnderL3 = portfolioRiskEngine.canExecuteTrade('AAPL', 'BUY', 100.0);
assert(anyOrderUnderL3.allowed === false, 'Orders must be unconditionally rejected when Kill Switch is active');
assert(anyOrderUnderL3.violationReason?.includes('KILL_SWITCH_ACTIVE') === true, 'Reason must state KILL_SWITCH_ACTIVE');

// ----------------------------------------------------------------------------
// TEST SUITE 8: Manual Kill Switch Execution & Admin Reset
// ----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 8: Manual Kill Switch Execution & Admin Reset ---');

// Reset to normal first with admin auth
const resetAuth = portfolioRiskEngine.resetKillSwitch(true);
assert(resetAuth.success === true, 'Admin reset must succeed');
assert(hardRiskEngine.getConfig().global_kill_switch_active === false, 'HardRiskEngine kill switch must be reset to FALSE');

// Attempt reset without admin auth
const resetNoAuth = portfolioRiskEngine.resetKillSwitch(false);
assert(resetNoAuth.success === false, 'Reset without admin auth must fail');
assert(resetNoAuth.message.includes('ADMIN_CLEARANCE_REQUIRED'), 'Message must require admin clearance');

// Test manual trigger of Emergency Kill Switch
const manualShutdown = portfolioRiskEngine.triggerEmergencyKillSwitch('Operator initiated manual fire drill', true);
assert(manualShutdown.success === true, 'Emergency kill switch execution must succeed');
assert(portfolioRiskEngine.getLiveHoldings().length === 0, 'All equity holdings must be liquidated to cash (0 holdings left)');
assert(portfolioRiskEngine.getRiskSummary().investedEquity === 0, 'Invested equity must be $0.00');
assert(portfolioRiskEngine.getRiskSummary().cashRatioPct === 100.0, 'Cash ratio must be 100.0%');

// Verify Event History
const history = portfolioRiskEngine.getCircuitBreakerHistory();
assert(history.length >= 3, `Must have logged multiple audit events in history (got ${history.length})`);
assert(history[0].level === 3, 'Latest event must be Level 3 Kill Switch');

// Restore portfolio for subsequent phases
portfolioRiskEngine.resetKillSwitch(true);
portfolioRiskEngine.setPosition('NVDA', 50, 130.0, 88);
portfolioRiskEngine.setPosition('AAPL', 40, 215.0, 82);
portfolioRiskEngine.setPosition('MSFT', 20, 410.0, 80);
portfolioRiskEngine.setPosition('AMZN', 45, 175.0, 78);
portfolioRiskEngine.setPosition('JPM', 40, 205.0, 75);
portfolioRiskEngine.setPosition('JNJ', 55, 158.0, 72);
portfolioRiskEngine.setPosition('XOM', 75, 112.0, 70);
portfolioRiskEngine.setHighWaterMark(portfolioRiskEngine.getRiskSummary().totalEquity);
portfolioRiskEngine.evaluateCircuitBreakers();

console.log('\n========================================================');
console.log(`📊 PHASE 7 TEST SUMMARY: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
console.log('========================================================');

if (totalTests - passedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
