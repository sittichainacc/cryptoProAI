// ============================================================================
// Phase 4 Unit Tests: Team 3 Red Team Adversarial Review & Hard VETO Engine
// ============================================================================

import { team3RedTeamEngine } from '../src/modules/stocks/engine/team3_red_team.engine.js';
import { globalStockStore } from '../src/modules/stocks/engine/stock_store.js';
import { riskEngine } from '../src/modules/stocks/engine/risk_engine.js';
import { TradePlan } from '../src/modules/stocks/types.js';

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
  console.log('🧪 RUNNING PHASE 4 TEAM 3 RED TEAM ADVERSARIAL UNIT TESTS');
  console.log('========================================================\n');

  const stock = globalStockStore.getStock('NVDA');
  assert(stock !== undefined, 'NVDA stock must exist in active universe');
  if (!stock) return;

  // Test 1: Beneish M-Score 8-Variable Formula
  const mScore = team3RedTeamEngine.calculateBeneishMScore(stock);
  assert(typeof mScore.mScore === 'number' && !isNaN(mScore.mScore), `Beneish M-Score must be a valid number (got ${mScore.mScore})`);
  assert(mScore.dsri > 0, `DSRI (Days Sales in Receivables) must be positive (${mScore.dsri})`);
  assert(mScore.gmi > 0, `GMI (Gross Margin Index) must be positive (${mScore.gmi})`);
  assert(mScore.aqi > 0, `AQI (Asset Quality Index) must be positive (${mScore.aqi})`);
  assert(mScore.sgi > 0, `SGI (Sales Growth Index) must be positive (${mScore.sgi})`);
  assert(mScore.depi > 0, `DEPI (Depreciation Index) must be positive (${mScore.depi})`);
  assert(mScore.sgai > 0, `SGAI (SG&A Index) must be positive (${mScore.sgai})`);
  assert(mScore.lvgi > 0, `LVGI (Leverage Index) must be positive (${mScore.lvgi})`);
  assert(typeof mScore.tata === 'number', `TATA (Total Accruals to Assets) must be valid (${mScore.tata})`);
  assert(
    mScore.isManipulatorRisk === (mScore.mScore > -1.78),
    `Manipulator risk flag must precisely match threshold M > -1.78 (got score=${mScore.mScore}, risk=${mScore.isManipulatorRisk})`
  );
  assert(mScore.interpretation.length > 0, 'Interpretation must provide clear descriptive guidance');

  // Test 2: Red Team Audit Execution
  const audit = team3RedTeamEngine.auditStock('NVDA');
  assert(audit !== null, 'Red Team audit on NVDA must return valid result');
  if (!audit) return;

  assert(audit.ticker === 'NVDA', 'Audit ticker must match NVDA');
  assert(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(audit.overallThreatLevel), `Threat level must be valid enum (got ${audit.overallThreatLevel})`);
  assert(audit.threatScore >= 0 && audit.threatScore <= 100, `Threat score must be 0-100 (got ${audit.threatScore})`);
  assert(typeof audit.vetoTriggered === 'boolean', `vetoTriggered must be boolean (got ${audit.vetoTriggered})`);
  assert(Array.isArray(audit.summaryObjections), 'Summary objections must be an array');
  assert(audit.chairmanSynthesis.length > 0, 'Chairman synthesis must have narrative analysis');

  // Test 3: All 10 Team 3 Red Team Agents Present and Structured
  const agents = audit.agentReports;
  assert(agents.bearCase.agentId === 'T3-01', 'T3-01 Bear Case Agent must be present');
  assert(agents.accountingForensic.agentId === 'T3-02', 'T3-02 Accounting/Forensic Agent must be present');
  assert(agents.valuationChallenge.agentId === 'T3-03', 'T3-03 Valuation Challenge Agent must be present');
  assert(agents.earningsRisk.agentId === 'T3-04', 'T3-04 Earnings Risk Agent must be present');
  assert(agents.technicalBreakdown.agentId === 'T3-05', 'T3-05 Technical Breakdown Agent must be present');
  assert(agents.macroRisk.agentId === 'T3-06', 'T3-06 Macro Risk Agent must be present');
  assert(agents.industryRisk.agentId === 'T3-07', 'T3-07 Industry Risk Agent must be present');
  assert(agents.crowdedTrade.agentId === 'T3-08', 'T3-08 Crowded Trade Agent must be present');
  assert(agents.portfolioCorrelation.agentId === 'T3-09', 'T3-09 Portfolio Correlation Agent must be present');
  assert(agents.chairmanVeto.agentId === 'T3-10', 'T3-10 Red Team Chairman Agent must be present');

  // Verify Agent Data Integrity
  Object.values(agents).forEach((agent) => {
    assert(agent.score >= 0 && agent.score <= 100, `${agent.agentId} score must be between 0 and 100 (${agent.score})`);
    assert(agent.objection.length > 5, `${agent.agentId} objection must be substantive`);
    assert(agent.counterEvidence.length > 0, `${agent.agentId} must provide counter-evidence points`);
  });

  // Test 4: Crowded Trade & Technical Breakdown Metrics
  assert(audit.crowdedTrade.crowdedScore >= 0 && audit.crowdedTrade.crowdedScore <= 100, 'Crowded score must be 0-100');
  assert(['LOW', 'ELEVATED', 'HIGH'].includes(audit.crowdedTrade.squeezeRisk), `Squeeze risk must be valid enum (got ${audit.crowdedTrade.squeezeRisk})`);
  assert(typeof audit.technicalBreakdown.below50Ema === 'boolean', 'below50Ema must be boolean');
  assert(typeof audit.technicalBreakdown.distributionDays === 'number', 'distributionDays must be numeric');

  // Test 5: Simulated Critical VETO & Hard Risk Engine Binding Enforcement
  const forcedVetoAudit = team3RedTeamEngine.auditStock('NVDA', true);
  assert(forcedVetoAudit !== null, 'Forced veto audit must succeed');
  if (forcedVetoAudit) {
    assert(forcedVetoAudit.vetoTriggered === true, 'Simulated critical audit MUST trigger vetoTriggered = true');
    assert(forcedVetoAudit.overallThreatLevel === 'CRITICAL', 'Threat level must be CRITICAL under forced veto');
    assert(forcedVetoAudit.agentReports.chairmanVeto.isRedFlag === true, 'Chairman must flag Red Flag under forced veto');
    assert(typeof forcedVetoAudit.vetoReason === 'string' && forcedVetoAudit.vetoReason.includes('RED TEAM VETO'), 'Veto reason must explicitly indicate RED TEAM VETO');
  }

  // Test 6: Hard Risk Engine Veto Enforcement
  const tradeProposal: TradePlan = {
    id: 'test-trade-nvda-1',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    direction: 'LONG',
    timeframe: 'SWING',
    entry_price: stock.price,
    stop_loss: stock.price * 0.95,
    take_profit_1: stock.price * 1.10,
    take_profit_2: stock.price * 1.20,
    position_size: 5.0, // 5% position
    risk_reward: 2.5,
    consensus_score: 85,
    confidence_level: 'HIGH',
    catalysts: ['AI Data Center Demand'],
    risks: ['High Valuation'],
    red_team_veto: true, // VETO TRIGGERED BY TEAM 3
    created_at: new Date().toISOString(),
  };

  const currentPortfolio = {
    totalEquity: 100_000,
    cashBalance: 50_000,
    openPositionsCount: 2,
    currentDrawdownPct: 1.5,
    todayLossUsd: 0,
    sectorExposurePct: { Technology: 15.0 },
    industryExposurePct: { Semiconductors: 10.0 },
  };

  const marketContext = {
    tickerDailyVolumeUsd: 15_000_000_000,
    spreadPct: 0.02,
    daysUntilEarnings: 20,
    isMarketHalted: false,
    dataIsStale: false,
  };

  const riskResult = riskEngine.evaluateTradeProposal(tradeProposal, currentPortfolio, marketContext);
  assert(riskResult.approved === false, 'Hard Risk Engine MUST REJECT trade when red_team_veto is true');
  assert(
    riskResult.violations.some((v) => v.includes('RED_TEAM_VETO')),
    `Violation must include RED_TEAM_VETO message (got: ${riskResult.violations.join(', ')})`
  );

  // Test 7: Hard Risk Engine Approves when VETO is false and within limits
  const cleanProposal = { ...tradeProposal, red_team_veto: false };
  const cleanRiskResult = riskEngine.evaluateTradeProposal(cleanProposal, currentPortfolio, marketContext);
  assert(cleanRiskResult.approved === true, 'Hard Risk Engine MUST APPROVE trade when red_team_veto is false and rules pass');
  assert(cleanRiskResult.violations.length === 0, 'There should be 0 violations for clean trade');

  // Test 8: Universe-Wide Red Team Audit Consistency
  const universe = globalStockStore.getUniverse();
  let validAuditsCount = 0;
  for (const s of universe) {
    const res = team3RedTeamEngine.auditStock(s.ticker);
    if (res && res.overallThreatLevel && res.beneishMScore) {
      validAuditsCount++;
    }
  }
  assert(validAuditsCount === universe.length, `All ${universe.length} stocks in universe must generate valid audits (got ${validAuditsCount})`);

  console.log('\n========================================================');
  console.log(`📊 PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
