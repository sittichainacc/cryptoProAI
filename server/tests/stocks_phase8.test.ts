// ============================================================================
// Phase 8 Unit Test Suite: Paper Trading Simulator & Strategy Backtesting
// Comprehensive Verification of Virtual Execution, Slippage Math, Commission
// Math, Hard Risk Gatekeeping, Multi-Strategy Backtesting, and Institutional KPIs
// ============================================================================

import { paperTradingEngine } from '../src/modules/stocks/engine/paper_trading.engine.js';
import { backtestEngine } from '../src/modules/stocks/engine/backtest.engine.js';
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

async function runPhase8TestSuite() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 8 TESTS: PAPER TRADING & BACKTESTING');
  console.log('========================================================\n');

  // ----------------------------------------------------------------------------
  // TEST SUITE 1: Slippage & Commission Mathematical Modeling
  // ----------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Slippage & Commission Mathematical Modeling ---');

  const slip1 = paperTradingEngine.calculateSlippage('NVDA', 50, 130.0);
  assert(slip1.slippageBps >= 3.5, `Slippage must be at least 3.5 bps baseline (got ${slip1.slippageBps} bps)`);
  assert(slip1.slippageBps <= 25.0, `Slippage must not exceed 25.0 bps ceiling (got ${slip1.slippageBps} bps)`);
  assert(slip1.slippageUsd > 0, `Slippage USD must be positive (got $${slip1.slippageUsd})`);

  // Larger order should have equal or higher slippage bps due to volume impact
  const slipLarge = paperTradingEngine.calculateSlippage('NVDA', 5000, 130.0);
  assert(slipLarge.slippageBps >= slip1.slippageBps, `Large order slippage (${slipLarge.slippageBps} bps) must be >= small order (${slip1.slippageBps} bps)`);
  assert(slipLarge.slippageUsd > slip1.slippageUsd, 'Large order slippage USD must be strictly greater than small order');

  // Commission tests
  const commBuy = paperTradingEngine.calculateCommission('BUY', 100, 10000);
  assert(commBuy >= 1.0, `Buy commission must satisfy $1.00 minimum (got $${commBuy})`);
  assert(commBuy <= 50.0, `Buy commission must not exceed 0.5% cap (got $${commBuy})`);

  const commSell = paperTradingEngine.calculateCommission('SELL', 100, 10000);
  assert(commSell > commBuy, `Sell commission ($${commSell}) must be higher than Buy ($${commBuy}) due to SEC & FINRA fees`);

  // ----------------------------------------------------------------------------
  // TEST SUITE 2: Market Order Execution & Portfolio Synchronization
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Market Order Execution & Portfolio Synchronization ---');

  // Reset portfolio to clean initial state ($100k cash)
  paperTradingEngine.resetAccount(100000);
  const initialSummary = portfolioRiskEngine.getRiskSummary();
  assert(initialSummary.cashBalance === 100000, `Initial cash must be $100,000 (got $${initialSummary.cashBalance})`);
  assert(initialSummary.holdings.length === 0, 'Initial holdings must be empty after reset');

  // Submit Market BUY order for UNH (Health Care, low beta)
  const buyUnh = await paperTradingEngine.submitOrder({
    ticker: 'UNH',
    side: 'BUY',
    orderType: 'MARKET',
    shares: 10,
    convictionScore: 85,
  });

  assert(buyUnh.status === 'FILLED', `Market BUY order must be FILLED (got ${buyUnh.status})`);
  assert(buyUnh.shares === 10, 'Order shares must be 10');
  assert(buyUnh.filledPrice !== undefined && buyUnh.filledPrice > 0, `Filled price must be set ($${buyUnh.filledPrice})`);
  assert(buyUnh.commissionUsd > 0, 'Commission must be charged');
  assert(buyUnh.totalCostUsd > 0, 'Total cost must be recorded');

  // Check that portfolio holding was updated
  const holdingsAfterBuy = portfolioRiskEngine.getLiveHoldings();
  const unhHolding = holdingsAfterBuy.find((h) => h.ticker === 'UNH');
  assert(unhHolding !== undefined, 'UNH must exist in portfolio holdings');
  assert(unhHolding?.shares === 10, `UNH shares must equal 10 (got ${unhHolding?.shares})`);
  assert(portfolioRiskEngine.getRiskSummary().cashBalance < 100000, 'Cash balance must decrease after purchase');

  // Submit Market SELL order to close half of UNH
  const sellHalfUnh = await paperTradingEngine.submitOrder({
    ticker: 'UNH',
    side: 'SELL',
    orderType: 'MARKET',
    shares: 5,
  });

  assert(sellHalfUnh.status === 'CLOSED', `SELL order status must be CLOSED (got ${sellHalfUnh.status})`);
  const unhRemaining = portfolioRiskEngine.getLiveHoldings().find((h) => h.ticker === 'UNH');
  assert(unhRemaining?.shares === 5, `Remaining UNH shares must be 5 (got ${unhRemaining?.shares})`);

  // Close remaining position via closePosition helper
  const closeOrder = await paperTradingEngine.closePosition('UNH', 'TEST_CLOSE');
  assert(closeOrder.status === 'CLOSED', 'Close position order must be CLOSED');
  const unhClosed = portfolioRiskEngine.getLiveHoldings().find((h) => h.ticker === 'UNH');
  assert(unhClosed === undefined, 'UNH must no longer exist in holdings after full close');

  // ----------------------------------------------------------------------------
  // TEST SUITE 3: Limit Orders & Pending Queue Evaluation
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Limit Orders & Pending Queue Evaluation ---');

  const stockNvda = globalStockStore.getStock('NVDA')!;
  const belowMarketPrice = Number((stockNvda.price * 0.80).toFixed(2)); // 20% below market

  const limitOrder = await paperTradingEngine.submitOrder({
    ticker: 'NVDA',
    side: 'BUY',
    orderType: 'LIMIT',
    shares: 10,
    limitPrice: belowMarketPrice,
  });

  assert(limitOrder.status === 'PENDING', `BUY limit order below market must be PENDING (got ${limitOrder.status})`);
  assert(limitOrder.limitPrice === belowMarketPrice, `Limit price must be preserved ($${limitOrder.limitPrice})`);

  // Check pending orders queue
  const pendingOrders = paperTradingEngine.getOrders({ status: 'PENDING' });
  assert(pendingOrders.some((o) => o.id === limitOrder.id), 'Pending order must be present in orders list');

  // Cancel order test
  const cancelRes = await paperTradingEngine.cancelOrder(limitOrder.id);
  assert(cancelRes.success === true, 'Pending order cancellation must succeed');
  assert(cancelRes.order?.status === 'CANCELLED', 'Order status must be updated to CANCELLED');

  // Cancelling an already cancelled order should fail gracefully
  const cancelAgain = await paperTradingEngine.cancelOrder(limitOrder.id);
  assert(cancelAgain.success === false, 'Cancelling an already cancelled order must fail');

  // ----------------------------------------------------------------------------
  // TEST SUITE 4: Hard Risk Engine Pre-Trade Enforcement (Rule 38)
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Hard Risk Engine Pre-Trade Enforcement (Rule 38) ---');

  // Case A: Insufficient Cash
  paperTradingEngine.resetAccount(1000); // Only $1,000 cash
  const expensiveOrder = await paperTradingEngine.submitOrder({
    ticker: 'NVDA',
    side: 'BUY',
    orderType: 'MARKET',
    shares: 100, // 100 * ~130 = $13,000 > $1,000
  });
  assert(expensiveOrder.status === 'REJECTED', 'Order exceeding cash balance must be REJECTED');
  assert(expensiveOrder.rejectReason?.includes('INSUFFICIENT_CASH') || expensiveOrder.rejectReason?.includes('POSITION_CAP_EXCEEDED'), `Must state risk reason (got "${expensiveOrder.rejectReason}")`);

  // Reset to $100k
  paperTradingEngine.resetAccount(100000);

  // Case B: Single Position 10% Hard Cap Violation
  const hugeBuy = await paperTradingEngine.submitOrder({
    ticker: 'AAPL',
    side: 'BUY',
    orderType: 'MARKET',
    shares: 100, // 100 * ~$220 = $22,000 = 22% of $100k > 10%
  });
  assert(hugeBuy.status === 'REJECTED', 'Order exceeding 10.0% single position cap must be REJECTED');
  assert(hugeBuy.rejectReason?.includes('POSITION_CAP_EXCEEDED'), `Must cite position cap exceeded (got "${hugeBuy.rejectReason}")`);

  // Case C: Circuit Breaker Level 1 / 2 Halts BUYs
  // Force Drawdown to trigger Circuit Breaker Level 1
  portfolioRiskEngine.setHighWaterMark(200000); // Equity ~$100k, HWM $200k => DD -50% => CB Level 3 / Kill Switch
  portfolioRiskEngine.evaluateCircuitBreakers();

  const cbBuy = await paperTradingEngine.submitOrder({
    ticker: 'XOM',
    side: 'BUY',
    orderType: 'MARKET',
    shares: 10,
  });
  assert(cbBuy.status === 'REJECTED', 'BUY order during active Circuit Breaker must be REJECTED');
  assert(
    cbBuy.rejectReason?.includes('CIRCUIT_BREAKER') || cbBuy.rejectReason?.includes('KILL_SWITCH'),
    `Must cite circuit breaker or kill switch active (got "${cbBuy.rejectReason}")`
  );

  // Reset Kill Switch & HWM
  portfolioRiskEngine.resetKillSwitch(true);
  paperTradingEngine.resetAccount(100000);

  // ----------------------------------------------------------------------------
  // TEST SUITE 5: Strategy Catalog & Configuration Specs
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Strategy Catalog & Configuration Specs ---');

  const strategies = backtestEngine.getAvailableStrategies();
  assert(strategies.length === 4, `Catalog must contain 4 core strategies (got ${strategies.length})`);
  assert(strategies.some((s) => s.id === 'MULTI_AGENT_CONSENSUS'), 'Must contain MULTI_AGENT_CONSENSUS');
  assert(strategies.some((s) => s.id === 'MOMENTUM_TREND_FOLLOWING'), 'Must contain MOMENTUM_TREND_FOLLOWING');
  assert(strategies.some((s) => s.id === 'MEAN_REVERSION_VALUE'), 'Must contain MEAN_REVERSION_VALUE');
  assert(strategies.some((s) => s.id === 'FUNDAMENTAL_DCF_QUALITY'), 'Must contain FUNDAMENTAL_DCF_QUALITY');

  for (const s of strategies) {
    assert(s.defaultConfig.initialCapital === 100000, `${s.id}: Default capital must be $100,000`);
    assert(s.defaultConfig.benchmarkTicker === 'SPY', `${s.id}: Default benchmark must be SPY`);
    assert(typeof s.defaultConfig.stopLossPct === 'number', `${s.id}: Must configure stopLossPct`);
    assert(typeof s.defaultConfig.takeProfitPct === 'number', `${s.id}: Must configure takeProfitPct`);
  }

  // ----------------------------------------------------------------------------
  // TEST SUITE 6: Multi-Agent Consensus Strategy Backtesting Run
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Multi-Agent Consensus Strategy Backtesting Run ---');

  const run1 = await backtestEngine.runBacktest({
    strategyId: 'MULTI_AGENT_CONSENSUS',
    initialCapital: 100000,
    benchmarkTicker: 'SPY',
    slippageBps: 4.0,
    maxPositions: 5,
    stopLossPct: 5.0,
    takeProfitPct: 15.0,
    positionSizing: 'HALF_KELLY',
  });

  assert(run1.runId.startsWith('run_'), `Run ID must be formatted properly (${run1.runId})`);
  assert(run1.strategyId === 'MULTI_AGENT_CONSENSUS', 'Strategy ID must match');
  assert(run1.finalEquity > 0, `Final equity must be positive ($${run1.finalEquity})`);
  assert(typeof run1.totalReturnPct === 'number', `Total return % must be a number (${run1.totalReturnPct}%)`);
  assert(typeof run1.cagrPct === 'number', `CAGR % must be a number (${run1.cagrPct}%)`);
  assert(typeof run1.benchmarkReturnPct === 'number', `Benchmark return % must be a number (${run1.benchmarkReturnPct}%)`);
  assert(typeof run1.alphaPct === 'number', `Alpha % must be a number (${run1.alphaPct}%)`);
  assert(typeof run1.beta === 'number' && run1.beta > 0, `Beta must be positive (${run1.beta})`);
  assert(typeof run1.sharpeRatio === 'number', `Sharpe ratio must be computed (${run1.sharpeRatio})`);
  assert(typeof run1.sortinoRatio === 'number', `Sortino ratio must be computed (${run1.sortinoRatio})`);
  assert(run1.maxDrawdownPct >= 0, `Max drawdown must be non-negative (${run1.maxDrawdownPct}%)`);
  assert(run1.equityCurve.length >= 25, `Equity curve must contain >= 25 daily points (got ${run1.equityCurve.length})`);
  assert(run1.totalTrades >= 0, `Total trades must be tracked (${run1.totalTrades})`);

  // Verify first and last equity curve point
  const firstPoint = run1.equityCurve[0];
  const lastPoint = run1.equityCurve[run1.equityCurve.length - 1];
  assert(firstPoint.equity === 100000, 'Initial point equity must equal initial capital');
  assert(lastPoint.equity === run1.finalEquity, 'Final point equity must match finalEquity attribute');

  // ----------------------------------------------------------------------------
  // TEST SUITE 7: Alternative Strategy Simulations
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Alternative Strategy Simulations ---');

  // Momentum Trend Following
  const runTrend = await backtestEngine.runBacktest({
    strategyId: 'MOMENTUM_TREND_FOLLOWING',
    initialCapital: 100000,
    maxPositions: 6,
    stopLossPct: 4.0,
    takeProfitPct: 12.0,
    positionSizing: 'EQUAL_WEIGHT',
  });
  assert(runTrend.strategyId === 'MOMENTUM_TREND_FOLLOWING', 'Momentum run strategy ID must match');
  assert(runTrend.finalEquity > 50000, `Trend final equity must be substantial ($${runTrend.finalEquity})`);
  assert(runTrend.equityCurve.length === run1.equityCurve.length, 'Candle count must match timeline');

  // Mean Reversion Value
  const runMeanRev = await backtestEngine.runBacktest({
    strategyId: 'MEAN_REVERSION_VALUE',
    initialCapital: 100000,
    maxPositions: 5,
    stopLossPct: 4.5,
    takeProfitPct: 8.0,
    positionSizing: 'VOLATILITY_PARITY',
  });
  assert(runMeanRev.strategyId === 'MEAN_REVERSION_VALUE', 'Mean reversion strategy ID must match');
  assert(runMeanRev.equityCurve.length > 0, 'Mean reversion equity curve must be populated');

  // Fundamental DCF Quality
  const runDcf = await backtestEngine.runBacktest({
    strategyId: 'FUNDAMENTAL_DCF_QUALITY',
    initialCapital: 50000, // Custom smaller capital
    maxPositions: 4,
  });
  assert(runDcf.initialCapital === 50000, 'Custom initial capital must be respected');
  assert(runDcf.equityCurve[0].equity === 50000, 'Initial curve point must reflect $50,000');

  // ----------------------------------------------------------------------------
  // TEST SUITE 8: Backtest History & Run Lookup
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Backtest History & Run Lookup ---');

  const history = backtestEngine.getRunHistory();
  assert(history.length >= 4, `History must contain at least 4 runs (got ${history.length})`);
  assert(history[0].createdAt >= history[1].createdAt, 'History must be sorted in descending chronological order');

  const fetchedRun = backtestEngine.getRunById(run1.runId);
  assert(fetchedRun !== undefined, 'getRunById must successfully retrieve run');
  assert(fetchedRun?.finalEquity === run1.finalEquity, 'Retrieved run data must match original run');

  // Non-existent ID lookup
  const invalidRun = backtestEngine.getRunById('non_existent_id');
  assert(invalidRun === undefined, 'Invalid ID lookup must return undefined');

  // ----------------------------------------------------------------------------
  // FINAL SUMMARY REPORT
  // ----------------------------------------------------------------------------
  console.log('\n========================================================');
  console.log(`🏁 PHASE 8 TEST EXECUTION SUMMARY:`);
  console.log(`   Total Unit Tests: ${totalTests}`);
  console.log(`   Passed:           ${passedTests}`);
  console.log(`   Failed:           ${totalTests - passedTests}`);
  console.log(`   Success Rate:     ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('========================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase8TestSuite().catch((err) => {
  console.error('💥 Fatal error in Phase 8 test runner:', err);
  process.exit(1);
});
