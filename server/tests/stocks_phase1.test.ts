// ============================================================================
// Phase 1 Automated Test Suite: Technical Indicators Engine & Screener
// ============================================================================

import { technicalIndicatorsEngine, Candle } from '../src/modules/stocks/engine/technical_indicators.engine.js';
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

async function runPhase1Tests() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 1 TECHNICAL ENGINE & SCREENER UNIT TESTS');
  console.log('========================================================\n');

  // Test 1: SMA Calculation
  const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const sma5 = technicalIndicatorsEngine.calculateSMA(prices, 5);
  // Last 5 prices: 16, 17, 18, 19, 20. Avg = 90 / 5 = 18.0
  assert(sma5 === 18.0, `SMA 5 should be 18.0 (got ${sma5})`);

  // Test 2: EMA Calculation
  const ema5 = technicalIndicatorsEngine.calculateEMA(prices, 5);
  assert(ema5 > 16.0 && ema5 <= 20.0, `EMA 5 should be reasonable between 16 and 20 (got ${ema5})`);

  // Test 3: RSI Calculation
  // Consistently rising prices should yield high RSI (> 70)
  const risingPrices = [10, 12, 14, 15, 17, 19, 21, 22, 24, 26, 28, 30, 32, 34, 36, 38];
  const rsiHigh = technicalIndicatorsEngine.calculateRSI(risingPrices, 14);
  assert(rsiHigh > 70, `RSI for consistently rising series should be > 70 (got ${rsiHigh})`);

  // Consistently falling prices should yield low RSI (< 35)
  const fallingPrices = [50, 48, 45, 42, 40, 38, 35, 33, 30, 28, 26, 24, 22, 20, 18, 16];
  const rsiLow = technicalIndicatorsEngine.calculateRSI(fallingPrices, 14);
  assert(rsiLow < 35, `RSI for falling series should be < 35 (got ${rsiLow})`);

  // Test 4: Bollinger Bands
  const bb = technicalIndicatorsEngine.calculateBollingerBands(prices, 10, 2);
  assert(bb.upper > bb.middle, 'Bollinger Upper band must be strictly greater than Middle band');
  assert(bb.middle > bb.lower, 'Bollinger Middle band must be strictly greater than Lower band');
  assert(bb.bandwidth > 0, 'Bandwidth must be positive');

  // Test 5: ATR Calculation
  const mockCandles: Candle[] = [
    { timestamp: 1, open: 100, high: 105, low: 98, close: 102, volume: 1000 },
    { timestamp: 2, open: 102, high: 108, low: 101, close: 107, volume: 1200 },
    { timestamp: 3, open: 107, high: 110, low: 104, close: 105, volume: 1100 },
  ];
  const atr = technicalIndicatorsEngine.calculateATR(mockCandles, 2);
  assert(atr > 0, `ATR must be a positive number (got ${atr})`);

  // Test 6: Expanded Stock Universe
  const universe = globalStockStore.getUniverse();
  assert(universe.length >= 20, `Stock Universe should contain at least 20 stocks (found ${universe.length})`);

  // Test 7: Multi-Factor Screener Filters
  // Filter by Sector = Information Technology
  const techStocks = globalStockStore.getScreenerResults({ sector: 'Information Technology' });
  assert(techStocks.length > 0, 'Tech sector filter must return stocks');
  assert(techStocks.every((s) => s.sector === 'Information Technology'), 'All returned stocks must be InfoTech');

  // Filter by P/E <= 35
  const valueTech = globalStockStore.getScreenerResults({ maxPe: 35 });
  assert(valueTech.every((s) => s.peRatio <= 35), 'All returned stocks must have P/E <= 35');

  // Filter by ROE >= 25%
  const highQuality = globalStockStore.getScreenerResults({ minRoe: 25 });
  assert(highQuality.every((s) => s.roe >= 25), 'All returned stocks must have ROE >= 25%');

  // Test 8: SEC Filings Integration
  const nvdaFilings = globalStockStore.getStockFilings('NVDA');
  assert(nvdaFilings.length >= 2, 'NVDA should have at least 2 SEC filings');
  assert(nvdaFilings.some((f) => f.form === '10-Q' || f.form === '10-K'), 'Filings must include 10-Q or 10-K');

  // Test 9: Chart Data & Indicator Integration
  const chartData = globalStockStore.getStockChart('AAPL');
  assert(chartData !== null, 'Chart data for AAPL must exist');
  assert(chartData!.candles.length >= 30, 'Candles series should have at least 30 historical bars');
  assert(chartData!.indicators !== undefined, 'Technical indicators must be attached to chart data');

  console.log(`\n========================================================`);
  console.log(`📊 PHASE 1 TEST SUMMARY: Passed ${passed}/${passed + failed}`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Tests();
