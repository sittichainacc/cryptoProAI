// ============================================================================
// Phase 2 Unit Tests: Team 1 Stock Ranking Production Engine
// ============================================================================

import { team1RankingEngine, DEFAULT_FACTOR_WEIGHTS } from '../src/modules/stocks/engine/team1_ranking.engine.js';
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
  console.log('🧪 RUNNING PHASE 2 TEAM 1 STOCK RANKING UNIT TESTS');
  console.log('========================================================\n');

  // Test 1: Default Factor Weights
  const weights = team1RankingEngine.getWeights();
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  assert(Math.abs(weightSum - 1.0) < 0.01, `Factor weights must sum to 1.0 (got ${weightSum.toFixed(2)})`);
  assert(weights.momentum === DEFAULT_FACTOR_WEIGHTS.momentum, 'Default momentum weight should match');
  assert(weights.quality === DEFAULT_FACTOR_WEIGHTS.quality, 'Default quality weight should match');

  // Test 2: Weight Normalization on custom input
  const normalized = team1RankingEngine.setWeights({
    momentum: 40,
    quality: 40,
    growth: 20,
    trend: 0,
    value: 0,
    earningsRevision: 0,
    catalyst: 0,
  });
  const normSum = Object.values(normalized).reduce((a, b) => a + b, 0);
  assert(Math.abs(normSum - 1.0) < 0.01, `Normalized weights must sum to 1.0 (got ${normSum.toFixed(2)})`);
  assert(normalized.momentum === 0.4, `Momentum weight should be normalized to 0.4 (got ${normalized.momentum})`);

  // Reset to default weights for canonical test
  team1RankingEngine.setWeights(DEFAULT_FACTOR_WEIGHTS);

  // Test 3: Run Full Team 1 Ranking Pipeline
  const runResult = team1RankingEngine.runRanking();
  assert(runResult.runId.startsWith('RUN-T1-'), `Run ID should have valid prefix (got ${runResult.runId})`);
  assert(runResult.universeSize >= 20, `Universe size should be >= 20 (got ${runResult.universeSize})`);
  assert(runResult.topCandidates.length === runResult.universeSize, 'Candidates count must match universe size');

  // Test 4: Ranks should be 1-indexed and strictly sequential
  const firstRank = runResult.topCandidates[0].rank;
  const lastRank = runResult.topCandidates[runResult.topCandidates.length - 1].rank;
  assert(firstRank === 1, `First candidate rank should be 1 (got ${firstRank})`);
  assert(lastRank === runResult.universeSize, `Last candidate rank should be ${runResult.universeSize} (got ${lastRank})`);

  // Test 5: Total Scores must be in descending order
  let isSorted = true;
  for (let i = 0; i < runResult.topCandidates.length - 1; i++) {
    if (runResult.topCandidates[i].totalScore < runResult.topCandidates[i + 1].totalScore) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Top candidates list must be sorted descending by totalScore');

  // Test 6: Verify all 9 Agent Factor Scores exist and are clamped [0, 100]
  const sampleCandidate = runResult.topCandidates[0];
  const factors = sampleCandidate.factorScores;
  assert(factors.screener.score >= 0 && factors.screener.score <= 100, `Screener score [0, 100] (got ${factors.screener.score})`);
  assert(factors.momentum.score >= 0 && factors.momentum.score <= 100, `Momentum score [0, 100] (got ${factors.momentum.score})`);
  assert(factors.trend.score >= 0 && factors.trend.score <= 100, `Trend score [0, 100] (got ${factors.trend.score})`);
  assert(factors.quality.score >= 0 && factors.quality.score <= 100, `Quality score [0, 100] (got ${factors.quality.score})`);
  assert(factors.growth.score >= 0 && factors.growth.score <= 100, `Growth score [0, 100] (got ${factors.growth.score})`);
  assert(factors.value.score >= 0 && factors.value.score <= 100, `Value score [0, 100] (got ${factors.value.score})`);
  assert(factors.earningsRevision.score >= 0 && factors.earningsRevision.score <= 100, `Earnings Revision score [0, 100] (got ${factors.earningsRevision.score})`);
  assert(factors.liquidity.score >= 0 && factors.liquidity.score <= 100, `Liquidity score [0, 100] (got ${factors.liquidity.score})`);
  assert(factors.catalyst.score >= 0 && factors.catalyst.score <= 100, `Catalyst score [0, 100] (got ${factors.catalyst.score})`);

  // Test 7: Conviction Tiering
  for (const cand of runResult.topCandidates) {
    if (cand.totalScore >= 82) {
      assert(cand.conviction === 'STRONG_BUY', `Score >= 82 should be STRONG_BUY for ${cand.ticker}`);
      break;
    }
  }

  // Test 8: Chairman Summary and Strengths
  assert(sampleCandidate.chairmanSummary.length > 20, 'Chairman summary must be informative and descriptive');
  assert(sampleCandidate.topStrengths.length > 0, 'Candidate must have at least one top strength listed');
  assert(sampleCandidate.keyRisks.length > 0, 'Candidate must have at least one risk factor listed');

  // Test 9: Summary Statistics
  const summary = runResult.summary;
  assert(summary.highestScore > 80, `Top stock score should be competitive > 80 (got ${summary.highestScore})`);
  assert(summary.highestScoreTicker.length > 0, `Top stock ticker must be non-empty (got ${summary.highestScoreTicker})`);
  assert(summary.strongBuyCount + summary.buyCount + summary.watchlistCount + summary.neutralCount === runResult.universeSize, 'Summary counts must tally to universe total');

  console.log('\n========================================================');
  console.log(`📊 PHASE 2 TEST SUMMARY: Passed ${passed}/${passed + failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
