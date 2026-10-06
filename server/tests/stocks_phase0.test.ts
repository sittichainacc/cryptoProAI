// ============================================================================
// Phase 0 Automated Test Suite: Global Stocks Multi-Agent & Risk Engine
// ============================================================================

import { ALL_41_AGENTS, getAgentsByTeam } from '../src/modules/stocks/agents/registry.js';
import { HardRiskEngine } from '../src/modules/stocks/engine/risk_engine.js';
import { ConsensusEngine } from '../src/modules/stocks/engine/consensus_engine.js';
import { globalStockStore } from '../src/modules/stocks/engine/stock_store.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 0 MULTI-AGENT & RISK ENGINE UNIT TESTS');
  console.log('========================================================\n');

  // Test 1: Exactly 41 Agents defined across 4 Teams + CIO
  assert(ALL_41_AGENTS.length === 41, 'Agent Registry must contain exactly 41 Agents');
  assert(getAgentsByTeam(1).length === 10, 'TEAM 1 (Stock Ranking) must have 10 Agents');
  assert(getAgentsByTeam(2).length === 10, 'TEAM 2 (Equity Research) must have 10 Agents');
  assert(getAgentsByTeam(3).length === 10, 'TEAM 3 (Red Team) must have 10 Agents');
  assert(getAgentsByTeam(4).length === 10, 'TEAM 4 (Tactical Allocation) must have 10 Agents');
  assert(getAgentsByTeam('CIO').length === 1, 'AI-CIO must have 1 Chairman Agent');

  // Test 2: Hard Risk Engine - Deterministic Evaluation
  const risk = new HardRiskEngine({
    max_position_size_pct: 10,
    max_drawdown_pct: 12,
    min_risk_reward: 2.0,
    global_kill_switch_active: false,
  });

  const validTradePlan: any = {
    ticker: 'NVDA',
    risk_reward: 2.5,
    position_size: 8,
    red_team_veto: false,
  };

  const normalPortfolio = {
    totalEquity: 100000,
    cashBalance: 40000,
    openPositionsCount: 3,
    currentDrawdownPct: 3.5,
    todayLossUsd: 200,
    sectorExposurePct: {},
    industryExposurePct: {},
  };

  const normalMarket = {
    tickerDailyVolumeUsd: 100_000_000,
    spreadPct: 0.05,
    daysUntilEarnings: 30,
    isMarketHalted: false,
    dataIsStale: false,
  };

  // Normal proposal passes
  const check1 = risk.evaluateTradeProposal(validTradePlan, normalPortfolio, normalMarket);
  assert(check1.approved === true, 'Risk Engine should APPROVE compliant trade proposal');

  // Test 3: Red Team Veto MUST Reject
  const vetoProposal: any = { ...validTradePlan, red_team_veto: true };
  const checkVeto = risk.evaluateTradeProposal(vetoProposal, normalPortfolio, normalMarket);
  assert(checkVeto.approved === false, 'Risk Engine MUST REJECT when Red Team Veto is active');
  assert(checkVeto.violations.some((v) => v.includes('RED_TEAM_VETO')), 'Violation must state RED_TEAM_VETO');

  // Test 4: Global Kill Switch MUST Halt All Trading
  risk.setKillSwitch(true, 'Emergency Market Black Swan Event');
  const checkKillSwitch = risk.evaluateTradeProposal(validTradePlan, normalPortfolio, normalMarket);
  assert(checkKillSwitch.approved === false, 'Global Kill Switch MUST block all proposals');
  assert(checkKillSwitch.killSwitchTriggered === true, 'killSwitchTriggered flag must be true');
  risk.setKillSwitch(false, 'System Normalized');

  // Test 5: Risk/Reward violation
  const lowRRProposal: any = { ...validTradePlan, risk_reward: 1.2 };
  const checkRR = risk.evaluateTradeProposal(lowRRProposal, normalPortfolio, normalMarket);
  assert(checkRR.approved === false, 'Risk Engine MUST REJECT when R:R is below 2.0');

  // Test 6: Consensus Engine
  const consensus = new ConsensusEngine();
  const votes = [
    { agentId: 'T1-10', weight: 1.5, confidence: 0.9, historicalAccuracy: 0.8, score: 90, decision: 'BUY' },
    { agentId: 'T2-10', weight: 1.5, confidence: 0.85, historicalAccuracy: 0.85, score: 85, decision: 'BUY' },
  ];
  const res = consensus.calculateConsensus(votes);
  assert(res.consensusScore >= 80, 'Consensus Score should reflect weighted bullish inputs');
  assert(res.consensusDecision === 'STRONG_BUY' || res.consensusDecision === 'BUY', 'Consensus decision should be BUY or STRONG_BUY');

  // Test 7: Stock Store & Market Regime
  const regime = globalStockStore.getMarketRegime();
  assert(regime.regime === 'RISK_ON', 'Market Regime should initialize to RISK_ON');

  const nvdaAnalysis = globalStockStore.getMultiAgentAnalysis('NVDA');
  assert(nvdaAnalysis !== null, 'NVDA Multi-Agent Analysis must return full pipeline output');
  assert(nvdaAnalysis?.agentsParticipated === 41, 'All 41 Agents participate in full analysis pipeline');

  console.log(`\n========================================================`);
  console.log(`📊 TEST SUMMARY: Passed ${passed}/${passed + failed}`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
