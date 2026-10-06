// ============================================================================
// Global Equity Multi-Agent System - Phase 6 Test Suite
// AI-CIO Investment Committee Chamber & Consensus Calibration Engine
// Tests 41-Agent voting, Brier score weighting, dialectical debate, supermajority rule,
// binding Red Team VETO enforcement, and Executive Memo generation.
// ============================================================================

import { cioConsensusEngine } from '../src/modules/stocks/engine/cio_consensus.engine.js';
import { globalStockStore } from '../src/modules/stocks/engine/stock_store.js';
import { riskEngine } from '../src/modules/stocks/engine/risk_engine.js';
import { team4TacticalEngine } from '../src/modules/stocks/engine/team4_tactical.engine.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

async function runPhase6Tests() {
  console.log('\n========================================================');
  console.log('🧪 RUNNING PHASE 6 AI-CIO & CONSENSUS CALIBRATION TESTS');
  console.log('========================================================\n');

  // Test 1: 41 Agents Brier Score Accuracy Registry
  const accuracies = cioConsensusEngine.getAgentAccuracies();
  assert(accuracies.length === 41, `Must have exactly 41 agents in accuracy registry (got ${accuracies.length})`);

  let totalWeight = 0;
  for (const acc of accuracies) {
    assert(acc.brierScore >= 0.05 && acc.brierScore <= 0.30, `${acc.agentId} Brier score must be realistic (0.05 - 0.30) (got ${acc.brierScore})`);
    assert(acc.historicalAccuracyPct >= 65.0 && acc.historicalAccuracyPct <= 95.0, `${acc.agentId} accuracy must be 65-95% (got ${acc.historicalAccuracyPct}%)`);
    assert(acc.calibratedWeight > 0.20, `${acc.agentId} calibrated weight must exceed minimum floor (got ${acc.calibratedWeight})`);
    totalWeight += acc.calibratedWeight;
  }
  const avgWeight = totalWeight / 41;
  assert(Math.abs(avgWeight - 1.0) < 0.05, `Average calibrated weight must be normalized close to 1.0 (got ${avgWeight.toFixed(3)})`);

  // Test 2: Dynamic Brier Recalibration
  const initialWeight = accuracies.find((a) => a.agentId === 'T1-01')?.calibratedWeight || 1.0;
  cioConsensusEngine.recalibrateAgent('T1-01', 0.05); // Excellent forecasting boost
  const boostedWeight = cioConsensusEngine.getAgentAccuracies().find((a) => a.agentId === 'T1-01')?.calibratedWeight || 1.0;
  assert(boostedWeight > initialWeight, `Lower Brier score must increase calibrated weight (${initialWeight} -> ${boostedWeight})`);

  // Reset back to baseline
  cioConsensusEngine.recalibrateAgent('T1-01', 0.142);

  // Test 3: Convene Full Committee on High-Conviction Stock (NVDA)
  const nvdaMemo = cioConsensusEngine.conveneCommittee('NVDA', 100_000);
  assert(nvdaMemo !== null, 'NVDA Investment Committee memo must generate successfully');

  if (nvdaMemo) {
    assert(nvdaMemo.ticker === 'NVDA', 'Memo ticker must be NVDA');
    assert(nvdaMemo.currentPrice > 0, `Current price must be positive (got $${nvdaMemo.currentPrice})`);
    assert(nvdaMemo.votes.length === 41, `All 41 Agents must cast individual votes (got ${nvdaMemo.votes.length})`);
    assert(nvdaMemo.consensusScore >= 60, `NVDA consensus score must be >= 60 (got ${nvdaMemo.consensusScore})`);
    assert(nvdaMemo.calibratedApprovalPct >= 67.0, `NVDA calibrated approval must pass 67% threshold (got ${nvdaMemo.calibratedApprovalPct}%)`);
    assert(nvdaMemo.supermajorityApproved === true, 'NVDA must achieve supermajority approval');
    assert(nvdaMemo.consensusAction === 'BUY' || nvdaMemo.consensusAction === 'STRONG_BUY', `NVDA action must be BUY or STRONG_BUY (got ${nvdaMemo.consensusAction})`);
    assert(nvdaMemo.redTeamVetoActive === false, 'NVDA must not have active Red Team Veto');

    // Bayesian Confidence Interval
    assert(nvdaMemo.confidenceInterval.lower95 <= nvdaMemo.confidenceInterval.mean, 'Lower 95% CI must be <= mean');
    assert(nvdaMemo.confidenceInterval.upper95 >= nvdaMemo.confidenceInterval.mean, 'Upper 95% CI must be >= mean');
    assert(nvdaMemo.confidenceInterval.standardError > 0, 'Standard error must be positive');

    // Dialectical Debate Session
    assert(nvdaMemo.debate.points.length === 3, 'Dialectical debate must have 3 debate topics');
    assert(nvdaMemo.debate.points[0].bullArgument.length > 10, 'Bull argument must be substantive');
    assert(nvdaMemo.debate.points[0].bearCounterArgument.length > 10, 'Bear counter-argument must be substantive');
    assert(nvdaMemo.debate.points[0].cioResolution.length > 10, 'CIO compromise resolution must be substantive');
    assert(nvdaMemo.debate.dialecticalSynthesis.length > 20, 'Debate synthesis must be substantive');

    // Executive Memo Markdown
    assert(nvdaMemo.executiveMemoMd.includes('AI-CIO INVESTMENT COMMITTEE MEMORANDUM'), 'Executive memo must contain title');
    assert(nvdaMemo.executiveMemoMd.includes('Bayesian Consensus & Calibration Bounds'), 'Executive memo must contain Bayesian bounds');
    assert(nvdaMemo.executiveMemoMd.includes('Cross-Team Intelligence Synthesis'), 'Executive memo must contain cross-team table');

    // Mandate Execution
    assert(nvdaMemo.mandateExecution.approvedShares > 0, `Approved shares must be positive (got ${nvdaMemo.mandateExecution.approvedShares})`);
    assert(nvdaMemo.mandateExecution.capitalAllocationUsd > 0, `Capital allocation must be positive (got $${nvdaMemo.mandateExecution.capitalAllocationUsd})`);
    assert(nvdaMemo.mandateExecution.portfolioWeightPct <= 10.0, `Portfolio weight must not exceed 10% hard cap (got ${nvdaMemo.mandateExecution.portfolioWeightPct}%)`);
  }

  // Test 4: Unconditional Red Team VETO Enforcement (TSLA)
  const tslaMemo = cioConsensusEngine.conveneCommittee('TSLA', 100_000);
  assert(tslaMemo !== null, 'TSLA Investment Committee memo must generate');

  if (tslaMemo) {
    assert(tslaMemo.redTeamVetoActive === true, 'TSLA must trigger Red Team VETO as active');
    assert(tslaMemo.consensusAction === 'VETOED', `TSLA consensus action MUST BE VETOED (got ${tslaMemo.consensusAction})`);
    assert(tslaMemo.supermajorityApproved === false, 'TSLA supermajority MUST NOT be approved when VETO is active');
    assert(tslaMemo.mandateExecution.approvedShares === 0, 'TSLA approved shares MUST BE 0 when VETOED');
    assert(tslaMemo.mandateExecution.capitalAllocationUsd === 0, 'TSLA capital allocation MUST BE 0 when VETOED');
    assert(tslaMemo.mandateExecution.portfolioWeightPct === 0, 'TSLA portfolio weight MUST BE 0% when VETOED');
    assert(tslaMemo.executiveSummary.includes('VETOED'), 'Executive summary must explicitly declare VETOED');

    // Verify all Team 3 agents voted REJECT
    const team3Votes = tslaMemo.votes.filter((v) => v.team === 3);
    assert(team3Votes.length === 10, 'Team 3 must have 10 agents');
    const allTeam3Rejected = team3Votes.every((v) => v.vote === 'REJECT');
    assert(allTeam3Rejected, 'All Team 3 agents MUST vote REJECT under Red Team Veto');

    // AI-CIO also rejects
    const cioVote = tslaMemo.votes.find((v) => v.agentId === 'AI-CIO');
    assert(cioVote?.vote === 'REJECT', 'AI-CIO MUST vote REJECT under Red Team Veto');
  }

  // Test 5: Hard Risk Engine Binding Rejection of VETOED memo
  const tslaTactical = team4TacticalEngine.generateTacticalPlan('TSLA', 100_000);
  assert(tslaTactical !== null, 'TSLA tactical plan must generate');
  if (tslaTactical) {
    const tslaTradePlan = team4TacticalEngine.toTradePlan(tslaTactical);
    const riskCheck = riskEngine.evaluateTradeProposal(
      tslaTradePlan,
      {
        totalEquity: 100_000,
        cashBalance: 50_000,
        openPositionsCount: 2,
        currentDrawdownPct: 2.0,
        todayLossUsd: 0,
        sectorExposurePct: {},
        industryExposurePct: {},
      },
      { tickerDailyVolumeUsd: 50_000_000, spreadPct: 0.02, daysUntilEarnings: 40 }
    );
    assert(riskCheck.approved === false, 'Hard Risk Engine MUST REJECT trade plan when Red Team VETO is active');
    assert(riskCheck.violations.some((v) => v.includes('RED_TEAM_VETO')), 'Violation must state RED_TEAM_VETO');
  }

  // Test 6: Universe Multi-Stock Committee Convening
  const universe = globalStockStore.getUniverse();
  let memoGeneratedCount = 0;
  for (const s of universe) {
    const memo = cioConsensusEngine.conveneCommittee(s.ticker, 100_000);
    if (memo && memo.votes.length === 41 && memo.confidenceInterval.mean > 0) {
      memoGeneratedCount++;
    }
  }
  assert(memoGeneratedCount === universe.length, `All ${universe.length} universe stocks must generate complete committee memos (got ${memoGeneratedCount})`);

  console.log('\n========================================================');
  console.log(`📊 PHASE 6 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal test error in Phase 6:', err);
  process.exit(1);
});
