// ============================================================================
// Phase 3 Unit Tests: Team 2 Equity Research & 2-Stage DCF Valuation Engine
// ============================================================================

import { team2ResearchEngine } from '../src/modules/stocks/engine/team2_research.engine.js';
import { globalStockStore } from '../src/modules/stocks/engine/stock_store.js';

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
  console.log('🧪 RUNNING PHASE 3 TEAM 2 EQUITY RESEARCH UNIT TESTS');
  console.log('========================================================\n');

  const stock = globalStockStore.getStock('NVDA');
  assert(stock !== undefined, 'NVDA stock must exist in universe');
  if (!stock) return;

  // Test 1: 2-Stage DCF Model calculation
  const dcf = team2ResearchEngine.calculateDCF(stock);
  assert(dcf.fairValue > 0, `Fair Value must be positive (got $${dcf.fairValue})`);
  assert(dcf.enterpriseValue > 0, `Enterprise Value must be positive (got $${dcf.enterpriseValue})`);
  assert(dcf.equityValue > 0, `Equity Value must be positive (got $${dcf.equityValue})`);
  assert(dcf.projectedFCF.length === 5, 'Projected FCF must have 5 forecast years');
  assert(dcf.terminalValue > 0, 'Terminal Value must be positive');
  assert(dcf.pvTerminalValue > 0, 'Present Value of Terminal Value must be positive');
  assert(typeof dcf.marginOfSafetyPct === 'number', `Margin of safety must be a valid number (got ${dcf.marginOfSafetyPct}%)`);
  assert(['SIGNIFICANTLY_UNDERVALUED', 'MODERATELY_UNDERVALUED', 'FAIRLY_VALUED', 'OVERVALUED', 'HIGHLY_OVERVALUED'].includes(dcf.valuationStatus), 'Valuation status must match valid enum');

  // Test 2: Custom DCF sensitivity
  const dcfHighGrowth = team2ResearchEngine.calculateDCF(stock, { growthRateStage1: 0.40 });
  const dcfLowGrowth = team2ResearchEngine.calculateDCF(stock, { growthRateStage1: 0.10 });
  assert(dcfHighGrowth.fairValue > dcfLowGrowth.fairValue, 'Higher FCF growth rate must produce higher Fair Value');

  const dcfHighWacc = team2ResearchEngine.calculateDCF(stock, { wacc: 0.12 });
  const dcfLowWacc = team2ResearchEngine.calculateDCF(stock, { wacc: 0.07 });
  assert(dcfLowWacc.fairValue > dcfHighWacc.fairValue, 'Lower WACC must produce higher Fair Value');

  // Test 3: Economic Moat evaluation
  const moat = team2ResearchEngine.evaluateMoat(stock);
  assert(['WIDE', 'NARROW', 'NONE'].includes(moat.rating), `Moat rating must be WIDE, NARROW or NONE (got ${moat.rating})`);
  assert(moat.score >= 0 && moat.score <= 100, `Moat score must be between 0 and 100 (got ${moat.score})`);
  assert(moat.primarySources.length > 0, 'Moat must have primary sources listed');
  assert(moat.rating === 'WIDE', 'NVDA must be evaluated as WIDE MOAT');

  // Test 4: Full Equity Research Report Synthesis
  const report = team2ResearchEngine.generateReport('NVDA');
  assert(report !== null, 'Report for NVDA must generate successfully');
  if (!report) return;

  assert(report.ticker === 'NVDA', 'Report ticker must be NVDA');
  assert(report.overallResearchScore >= 70, `Overall research score should be strong >= 70 (got ${report.overallResearchScore})`);
  assert(['HIGH', 'MODERATE', 'SPECULATIVE'].includes(report.researchConviction), 'Research conviction must be valid');

  // Test 5: Scenarios Price Target Ordering (Bear < Base < Bull)
  const sc = report.scenarios;
  assert(sc.bear.targetPrice < sc.base.targetPrice, `Bear target ($${sc.bear.targetPrice}) must be < Base target ($${sc.base.targetPrice})`);
  assert(sc.base.targetPrice < sc.bull.targetPrice, `Base target ($${sc.base.targetPrice}) must be < Bull target ($${sc.bull.targetPrice})`);
  assert(sc.bull.upsidePct > sc.base.upsidePct, 'Bull upside % must be greater than Base upside %');
  assert(sc.base.upsidePct > sc.bear.downsidePct, 'Base upside % must be greater than Bear downside %');

  // Test 6: Verify all 10 Team 2 Agent Theses exist
  const at = report.agentTheses;
  assert(at.revenueGrowth.agentId === 'T2-01', 'T2-01 Revenue Growth thesis exists');
  assert(at.incomeStatement.agentId === 'T2-02', 'T2-02 Income Statement thesis exists');
  assert(at.balanceSheet.agentId === 'T2-03', 'T2-03 Balance Sheet thesis exists');
  assert(at.cashFlow.agentId === 'T2-04', 'T2-04 Cash Flow thesis exists');
  assert(at.valuation.agentId === 'T2-05', 'T2-05 Valuation thesis exists');
  assert(at.moat.agentId === 'T2-06', 'T2-06 Moat thesis exists');
  assert(at.management.agentId === 'T2-07', 'T2-07 Management thesis exists');
  assert(at.earningsCall.agentId === 'T2-08', 'T2-08 Earnings Call thesis exists');
  assert(at.competitor.agentId === 'T2-09', 'T2-09 Competitor thesis exists');
  assert(at.chairman.agentId === 'T2-10', 'T2-10 Chairman thesis exists');

  for (const thesis of Object.values(at)) {
    assert(thesis.score >= 0 && thesis.score <= 100, `Thesis ${thesis.agentId} score in [0, 100] (got ${thesis.score})`);
    assert(thesis.thesis.length > 10, `Thesis ${thesis.agentId} description must be detailed`);
    assert(thesis.evidence.length > 0, `Thesis ${thesis.agentId} must have supporting evidence`);
  }

  // Test 7: Chairman Summary
  assert(report.chairmanSummary.length > 30, 'Chairman summary must be comprehensive');

  // Test 8: Non-existent ticker handling
  const nullReport = team2ResearchEngine.generateReport('UNKNOWN_XYZ');
  assert(nullReport === null, 'Unknown ticker should return null');

  console.log('\n========================================================');
  console.log(`📊 PHASE 3 TEST SUMMARY: Passed ${passed}/${passed + failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
