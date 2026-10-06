// ============================================================================
// Phase 5 Unit Tests: Team 4 Tactical Asset Allocation & Execution Strategy Engine
// ============================================================================

import { team4TacticalEngine } from '../src/modules/stocks/engine/team4_tactical.engine.js';
import { globalStockStore } from '../src/modules/stocks/engine/stock_store.js';
import { riskEngine } from '../src/modules/stocks/engine/risk_engine.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 5 TEAM 4 TACTICAL ASSET ALLOCATION TESTS');
  console.log('========================================================\n');

  const stock = globalStockStore.getStock('NVDA');
  assert(stock !== undefined, 'NVDA stock must exist in active universe');
  if (!stock) return;

  // Test 1: Fractional Kelly Criterion Calculation
  const kelly = team4TacticalEngine.calculateKellySizing('NVDA', 100_000, { winProb: 0.65, payoutRatio: 2.2 });
  assert(kelly.ticker === 'NVDA', 'Kelly ticker must match');
  assert(kelly.winProbability === 0.65, `Win probability must be 0.65 (got ${kelly.winProbability})`);
  assert(kelly.payoutRatio === 2.2, `Payout ratio must be 2.2 (got ${kelly.payoutRatio})`);
  assert(kelly.fullKellyFraction > 0, `Full Kelly fraction must be positive (got ${kelly.fullKellyFraction})`);
  assert(kelly.halfKellyFraction > 0, `Half Kelly fraction must be positive (got ${kelly.halfKellyFraction})`);
  assert(kelly.halfKellyFraction < kelly.fullKellyFraction, 'Half Kelly must be less than Full Kelly');
  assert(kelly.recommendedSizePct <= 10.0, `Recommended size % MUST NOT exceed 10.0% Hard Cap (got ${kelly.recommendedSizePct}%)`);
  assert(kelly.recommendedSizePct >= 1.5, `Recommended size % must be at least 1.5% (got ${kelly.recommendedSizePct}%)`);
  assert(kelly.riskAdjustedCapitalUsd > 0, `Risk adjusted capital must be positive (got $${kelly.riskAdjustedCapitalUsd})`);
  assert(kelly.rationale.length > 10, 'Kelly rationale must be substantive');

  // Test 2: Full Tactical Trade Plan Generation for NVDA
  const plan = team4TacticalEngine.generateTacticalPlan('NVDA', 100_000);
  assert(plan !== null, 'Tactical plan for NVDA must generate successfully');
  if (!plan) return;

  assert(plan.ticker === 'NVDA', 'Plan ticker must be NVDA');
  assert(plan.currentPrice > 0, `Current price must be positive (got $${plan.currentPrice})`);
  assert(plan.entryPrice > 0, `Entry price must be positive (got $${plan.entryPrice})`);
  assert(plan.entryZone.low < plan.entryZone.high, 'Entry zone low must be less than high');
  assert(['BREAKOUT', 'PULLBACK_EMA20', 'SUPPORT_BOUNCE', 'MOMENTUM_EXPANSION'].includes(plan.setupType), `Setup type must be valid enum (got ${plan.setupType})`);

  // Test 3: Dynamic ATR Stops & Strict Ladder Ordering
  // Invariant: stopLoss < entryPrice < takeProfit1 < takeProfit2 < takeProfit3
  assert(plan.stopLoss < plan.entryPrice, `Stop Loss ($${plan.stopLoss}) must be below Entry Price ($${plan.entryPrice})`);
  assert(plan.entryPrice < plan.takeProfit1, `Take Profit 1 ($${plan.takeProfit1}) must be above Entry Price ($${plan.entryPrice})`);
  assert(plan.takeProfit1 < plan.takeProfit2, `Take Profit 2 ($${plan.takeProfit2}) must be above Take Profit 1 ($${plan.takeProfit1})`);
  assert(plan.takeProfit2 < plan.takeProfit3, `Take Profit 3 ($${plan.takeProfit3}) must be above Take Profit 2 ($${plan.takeProfit2})`);

  assert(plan.riskUnitR > 0, `Risk Unit R must be positive (got $${plan.riskUnitR})`);
  assert(plan.stopLossDistancePct > 0, `Stop loss distance % must be positive (got ${plan.stopLossDistancePct}%)`);
  assert(plan.stopLossDistancePct < 25.0, `Stop loss distance % must be reasonable (<25%) (got ${plan.stopLossDistancePct}%)`);

  // Test 4: Risk/Reward Ratio Mandatory Filter
  assert(plan.riskRewardRatio >= 2.0, `Risk/Reward ratio must be >= 2.0 (got ${plan.riskRewardRatio})`);
  assert(plan.riskRewardValid === true, 'riskRewardValid flag must be true when RR >= 2.0');

  // Test 5: Options Overlay & Hedging Tactics
  assert(['NONE', 'COVERED_CALL', 'PROTECTIVE_COLLAR', 'CASH_SECURED_PUT'].includes(plan.optionsOverlay.recommendedStrategy), 'Options strategy must be valid');
  assert(plan.optionsOverlay.callStrike! > plan.entryPrice, 'Covered call strike must be above entry price');
  assert(plan.hedgingStrategy.portfolioBeta > 0, 'Portfolio beta must be positive');
  assert(plan.hedgingStrategy.correlationToSpy > 0, 'SPY correlation must be positive');

  // Test 6: Execution Strategy & Slippage Guardrail
  assert(['LIMIT', 'TWAP', 'VWAP', 'MARKET'].includes(plan.executionTactics.orderType), 'Order type must be valid');
  assert(plan.executionTactics.currentSpreadPct <= plan.executionTactics.maxAllowableSpreadPct, 'Spread must be within limit');
  assert(plan.executionTactics.estimatedSlippageBps > 0, 'Estimated slippage must be positive');

  // Test 7: All 10 Team 4 Agents Output Integrity
  const reports = plan.agentReports;
  assert(reports.timing.agentId === 'T4-01', 'T4-01 Timing Agent must be present');
  assert(reports.sizing.agentId === 'T4-02', 'T4-02 Position Sizing Agent must be present');
  assert(reports.stopLoss.agentId === 'T4-03', 'T4-03 Stop Loss Agent must be present');
  assert(reports.takeProfit.agentId === 'T4-04', 'T4-04 Take Profit Agent must be present');
  assert(reports.options.agentId === 'T4-05', 'T4-05 Options Overlay Agent must be present');
  assert(reports.hedging.agentId === 'T4-06', 'T4-06 Hedging Agent must be present');
  assert(reports.execution.agentId === 'T4-07', 'T4-07 Execution Strategy Agent must be present');
  assert(reports.liquidity.agentId === 'T4-08', 'T4-08 Liquidity Agent must be present');
  assert(reports.riskReward.agentId === 'T4-09', 'T4-09 Risk-Reward Agent must be present');
  assert(reports.chairman.agentId === 'T4-10', 'T4-10 Tactical Chairman Agent must be present');

  Object.values(reports).forEach((agent) => {
    assert(agent.actionableDecision.length > 5, `${agent.agentId} actionable decision must be substantive`);
    assert(agent.guidance.length > 0, `${agent.agentId} must provide clear tactical guidance`);
  });

  // Test 8: Convert to TradePlan and verify with HardRiskEngine
  const tradePlan = team4TacticalEngine.toTradePlan(plan);
  assert(tradePlan.ticker === 'NVDA', 'TradePlan ticker must match');
  assert(tradePlan.position_size === plan.positionSizing.recommendedSizePct, 'TradePlan size must match Kelly size');
  assert(tradePlan.position_size <= 10.0, 'TradePlan size must not exceed 10%');

  const portfolio = {
    totalEquity: 100_000,
    cashBalance: 50_000,
    openPositionsCount: 3,
    currentDrawdownPct: 1.0,
    todayLossUsd: 0,
    sectorExposurePct: { Technology: 15.0 },
    industryExposurePct: { Semiconductors: 10.0 },
  };

  const marketContext = {
    tickerDailyVolumeUsd: 10_000_000_000,
    spreadPct: 0.02,
    daysUntilEarnings: 25,
  };

  const evalResult = riskEngine.evaluateTradeProposal(tradePlan, portfolio, marketContext);
  assert(evalResult.approved === true, 'Hard Risk Engine MUST APPROVE clean Tactical Trade Plan');
  assert(evalResult.violations.length === 0, 'Clean Trade Plan should have zero violations');

  // Test 9: TSLA Red Team Veto Integration
  const tslaPlan = team4TacticalEngine.generateTacticalPlan('TSLA', 100_000);
  assert(tslaPlan !== null, 'TSLA tactical plan must generate');
  if (tslaPlan) {
    assert(tslaPlan.redTeamVetoActive === true, 'TSLA must reflect Red Team VETO as active');
    assert(tslaPlan.isTradeApproved === false, 'TSLA trade plan MUST NOT be approved due to Red Team Veto');
    assert(tslaPlan.approvalStatusSummary.includes('RED TEAM VETO'), 'TSLA approval summary must explicitly note RED TEAM VETO');
  }

  // Test 10: Universe-Wide Tactical Generation
  const universe = globalStockStore.getUniverse();
  let validPlansCount = 0;
  for (const s of universe) {
    const res = team4TacticalEngine.generateTacticalPlan(s.ticker, 100_000);
    if (res && res.entryPrice > 0 && res.stopLoss > 0 && res.takeProfit1 > 0) {
      validPlansCount++;
    }
  }
  assert(validPlansCount === universe.length, `All ${universe.length} stocks must generate valid tactical plans (got ${validPlansCount})`);

  console.log('\n========================================================');
  console.log(`📊 PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
