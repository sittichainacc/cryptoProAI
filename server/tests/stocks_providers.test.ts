// ============================================================================
// Real-Time Market Data Provider Test Suite
// Verifies Live Quotes, Caching, Market Hours, Macro Indicators, News, and Sync
// ============================================================================

import { marketDataProvider } from '../src/modules/stocks/providers/market_data_provider.service.js';
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

async function runProviderTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING REAL-TIME MARKET DATA PROVIDER TESTS');
  console.log('========================================================\n');

  // ----------------------------------------------------------------------------
  // TEST SUITE 1: Provider Identity & Interface Conformance
  // ----------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Provider Identity & Interface Conformance ---');
  assert(
    typeof marketDataProvider.providerName === 'string' && marketDataProvider.providerName.length > 5,
    'Provider name must be descriptive'
  );
  assert(typeof marketDataProvider.isMarketOpen === 'function', 'isMarketOpen function must be defined');
  assert(typeof marketDataProvider.getQuote === 'function', 'getQuote function must be defined');
  assert(typeof marketDataProvider.getBatchQuotes === 'function', 'getBatchQuotes function must be defined');
  assert(typeof marketDataProvider.getMacroIndicators === 'function', 'getMacroIndicators must be defined');
  assert(typeof marketDataProvider.getCompanyNews === 'function', 'getCompanyNews must be defined');
  assert(typeof marketDataProvider.syncStoreWithLiveData === 'function', 'syncStoreWithLiveData must be defined');

  // ----------------------------------------------------------------------------
  // TEST SUITE 2: Market Hours Calculation
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Market Hours Calculation ---');
  const isOpen = marketDataProvider.isMarketOpen();
  assert(typeof isOpen === 'boolean', `isMarketOpen must return boolean (got ${isOpen})`);

  // ----------------------------------------------------------------------------
  // TEST SUITE 3: Real-Time Quotes & Fallback Fidelity
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Real-Time Quotes & Fallback Fidelity ---');
  marketDataProvider.clearCache();

  const quoteNVDA = await marketDataProvider.getQuote('NVDA');
  assert(quoteNVDA !== null, 'NVDA quote must not be null');
  assert(quoteNVDA?.symbol === 'NVDA', 'Quote symbol must match NVDA');
  assert(typeof quoteNVDA?.price === 'number' && quoteNVDA.price > 0, `NVDA price must be positive (got $${quoteNVDA?.price})`);
  assert(typeof quoteNVDA?.changePercent === 'number', `NVDA changePercent must be numeric (got ${quoteNVDA?.changePercent}%)`);
  assert(quoteNVDA?.source !== undefined, `Quote source must be identified (got "${quoteNVDA?.source}")`);

  // Cached retrieval test
  const startCache = Date.now();
  const cachedNVDA = await marketDataProvider.getQuote('NVDA');
  const cacheDuration = Date.now() - startCache;
  assert(cachedNVDA?.price === quoteNVDA?.price, 'Cached price must match original price');
  assert(cacheDuration < 50, `Cached response must return in <50ms (got ${cacheDuration}ms)`);

  // Non-existent symbol test
  const invalidQuote = await marketDataProvider.getQuote('INVALID_XYZ_99');
  assert(invalidQuote === null, 'Invalid ticker lookup must return null');

  // ----------------------------------------------------------------------------
  // TEST SUITE 4: Batch Quotes Retrieval
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Batch Quotes Retrieval ---');
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
  const batchQuotes = await marketDataProvider.getBatchQuotes(symbols);
  assert(batchQuotes instanceof Map, 'Batch quotes must return a Map');
  assert(batchQuotes.size === 4, `Batch quotes must contain all 4 tickers (got ${batchQuotes.size})`);
  assert(batchQuotes.has('AAPL'), 'Batch must contain AAPL');
  assert(batchQuotes.has('MSFT'), 'Batch must contain MSFT');

  // ----------------------------------------------------------------------------
  // TEST SUITE 5: Macroeconomic Indicators Fetcher
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Macroeconomic Indicators Fetcher ---');
  const macro = await marketDataProvider.getMacroIndicators();
  assert(typeof macro.us10yYield === 'number' && macro.us10yYield > 0, `US 10Y Yield must be positive (got ${macro.us10yYield}%)`);
  assert(typeof macro.us2yYield === 'number' && macro.us2yYield > 0, `US 2Y Yield must be positive (got ${macro.us2yYield}%)`);
  assert(typeof macro.vix === 'number' && macro.vix > 5, `VIX must be reasonable volatility index (got ${macro.vix})`);
  assert(typeof macro.dxyIndex === 'number' && macro.dxyIndex > 50, `DXY must be standard dollar index (got ${macro.dxyIndex})`);
  assert(typeof macro.fedFundsRate === 'number' && macro.fedFundsRate > 0, `Fed Funds rate must be positive (got ${macro.fedFundsRate}%)`);

  // ----------------------------------------------------------------------------
  // TEST SUITE 6: Company Financial News & Sentiment
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Company Financial News & Sentiment ---');
  const news = await marketDataProvider.getCompanyNews('AAPL', 3);
  assert(Array.isArray(news), 'News result must be an array');
  assert(news.length === 3, `News array must contain requested limit (got ${news.length})`);
  assert(news[0].headline.length > 10, 'Headline must be populated');
  assert(news[0].sentimentScore >= 0 && news[0].sentimentScore <= 1, 'Sentiment score must be bounded [0, 1]');
  assert(news[0].source.length > 2, 'News source must be provided');

  // ----------------------------------------------------------------------------
  // TEST SUITE 7: Stock Store Live Synchronization
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Stock Store Live Synchronization ---');
  const universeCount = globalStockStore.getUniverse().length;
  const syncResult = await marketDataProvider.syncStoreWithLiveData();
  assert(syncResult.syncedCount === universeCount, `Sync count must equal universe size (${universeCount})`);
  assert(syncResult.updatedTickers.includes('AAPL'), 'Updated tickers must include AAPL');
  assert(syncResult.updatedTickers.includes('NVDA'), 'Updated tickers must include NVDA');

  // ----------------------------------------------------------------------------
  // TEST SUITE 8: Cache Eviction & Cleanup
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Cache Eviction & Cleanup ---');
  marketDataProvider.clearCache();
  const freshQuote = await marketDataProvider.getQuote('AAPL');
  assert(freshQuote !== null, 'Quote fetch after cache clearance must succeed');

  console.log('\n========================================================');
  console.log('🏁 PROVIDER TEST EXECUTION SUMMARY:');
  console.log(`   Total Unit Tests: ${totalTests}`);
  console.log(`   Passed:           ${passedTests}`);
  console.log(`   Failed:           ${totalTests - passedTests}`);
  console.log(`   Success Rate:     ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('========================================================\n');

  if (totalTests === passedTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runProviderTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
