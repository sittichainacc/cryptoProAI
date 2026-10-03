import { pool } from './src/database/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function runLiveTests() {
  console.log('====================================================');
  console.log('🧪 STARTING PHASE 5 LIVE TESTS: FOCUS & COMPARISONS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      if (details) console.error('   Details:', details);
      failed++;
    }
  }

  // 1. Get totokung user id
  const userRes = await pool.query("SELECT id, username FROM public.user_profiles WHERE username = 'totokung' LIMIT 1");
  const totokung = userRes.rows[0];
  assert(!!totokung, 'Totokung user exists in database', totokung);
  const userId = totokung.id;

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-username': 'totokung',
  };

  // 2. Test GET /api/focus
  console.log('\n--- Test 1: GET /api/focus (Fetch user Focus list) ---');
  const getRes = await fetch(`${BASE_URL}/focus`, { headers: authHeaders });
  const getJson = await getRes.json();
  assert(getRes.status === 200 && getJson.success === true, 'GET /api/focus returned HTTP 200', getJson);
  assert(Array.isArray(getJson.data?.items) && getJson.data.items.length >= 5, `Focus list contains ${getJson.data?.items?.length} items`);
  const symbols = getJson.data.items.map((i: any) => i.symbol);
  console.log('   Focus Coins:', symbols.join(', '));
  assert(symbols.includes('BTC') && symbols.includes('ETH') && symbols.includes('SOL'), 'Focus list includes core coins BTC, ETH, SOL');

  // 3. Test GET /api/focus/:symbol/detail
  console.log('\n--- Test 2: GET /api/focus/:symbol/detail (Deep Institutional Intelligence) ---');
  const detailRes = await fetch(`${BASE_URL}/focus/BTC/detail`, { headers: authHeaders });
  const detailJson = await detailRes.json();
  assert(detailRes.status === 200 && detailJson.success === true, 'GET /api/focus/BTC/detail returned HTTP 200');
  const btc = detailJson.data;
  assert(btc.symbol === 'BTC', 'Detail symbol is BTC');
  assert(btc.focusScore > 0, `BTC Focus Score is calculated: ${btc.focusScore}/100`);
  assert(!!btc.technicals?.ema20, 'BTC Technicals (EMA, RSI, MACD) evaluated');
  assert(!!btc.entryIntelligence?.status, `BTC Entry Intelligence evaluated: ${btc.entryIntelligence?.status}`);
  assert(!!btc.exitIntelligence?.status, `BTC Exit Intelligence evaluated: ${btc.exitIntelligence?.status}`);

  // 4. Test POST /api/focus (Add DOGE to Focus)
  console.log('\n--- Test 3: POST /api/focus (Add new coin to user Focus) ---');
  const addRes = await fetch(`${BASE_URL}/focus`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      symbol: 'DOGE',
      priority: 'high',
      mode: 'high_focus',
      positionStatus: 'PLANNING TO BUY',
      userNotes: 'ทดสอบระบบ Phase 5 - วางแผนสะสม DOGE',
    }),
  });
  const addJson = await addRes.json();
  assert(addRes.status === 200 && addJson.success === true, 'POST /api/focus returned HTTP 200', addJson);
  assert(addJson.data?.symbol === 'DOGE', 'Added coin symbol is DOGE');
  assert(addJson.data?.priority === 'high', 'Priority is high');
  assert(addJson.data?.userNotes === 'ทดสอบระบบ Phase 5 - วางแผนสะสม DOGE', 'Notes saved correctly');

  // 5. Verify in PostgreSQL directly
  console.log('\n--- Test 4: Database Verification for DOGE in public.focus_items ---');
  const dbCheck = await pool.query('SELECT * FROM public.focus_items WHERE user_id = $1 AND symbol = $2', [userId, 'DOGE']);
  assert(dbCheck.rows.length === 1, 'DOGE found in public.focus_items table');
  const dogeRow = dbCheck.rows[0];
  assert(dogeRow.priority === 'high', 'DB priority column is high');
  assert(dogeRow.mode === 'high_focus', 'DB mode column is high_focus');
  assert(dogeRow.position_status === 'PLANNING TO BUY', 'DB position_status is PLANNING TO BUY');

  // 6. Test PUT /api/focus/:id (Update Position)
  console.log('\n--- Test 5: PUT /api/focus/:id (Update DOGE Position to HOLDING) ---');
  const updateRes = await fetch(`${BASE_URL}/focus/${dogeRow.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      positionStatus: 'HOLDING',
      userNotes: 'เข้าซื้อ DOGE สำเร็จ ปรับเป็น HOLDING',
      position: {
        averageCost: 5.25,
        amount: 2500,
        stopLoss: 4.80,
        takeProfit1: 6.50,
        takeProfit2: 7.80,
        trailingStopPercent: 5.0,
      },
      customTrailingStop: 4.95,
    }),
  });
  const updateJson = await updateRes.json();
  assert(updateRes.status === 200 && updateJson.success === true, 'PUT /api/focus/:id returned HTTP 200');
  assert(updateJson.data?.positionStatus === 'HOLDING', 'Updated status is HOLDING');
  assert(updateJson.data?.position?.averageCost === 5.25, 'Average cost updated to 5.25');
  assert(updateJson.data?.position?.amount === 2500, 'Position amount updated to 2500');

  // 7. Verify updated DB row
  const dbUpdateCheck = await pool.query('SELECT * FROM public.focus_items WHERE id = $1', [dogeRow.id]);
  const updatedRow = dbUpdateCheck.rows[0];
  assert(Number(updatedRow.average_cost) === 5.25, 'DB average_cost is 5.25');
  assert(Number(updatedRow.position_amount) === 2500, 'DB position_amount is 2500');
  assert(Number(updatedRow.custom_trailing_stop) === 4.95, 'DB custom_trailing_stop is 4.95');

  // 8. Test POST /api/focus/reorder
  console.log('\n--- Test 6: POST /api/focus/reorder (Drag & Drop Reordering) ---');
  const reorderRes = await fetch(`${BASE_URL}/focus/reorder`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      symbols: ['DOGE', 'BTC', 'ETH', 'SOL', 'ADA', 'FLOCK'],
    }),
  });
  const reorderJson = await reorderRes.json();
  assert(reorderRes.status === 200 && reorderJson.success === true, 'POST /api/focus/reorder returned HTTP 200');
  const reorderedSymbols = reorderJson.data?.items?.map((i: any) => i.symbol);
  assert(reorderedSymbols?.[0] === 'DOGE', 'DOGE is now ranked #1 in reordered list');

  // 9. Test GET /api/focus/comparisons
  console.log('\n--- Test 7: GET /api/focus/comparisons (Multi-Coin Comparisons) ---');
  const compGetRes = await fetch(`${BASE_URL}/focus/comparisons`, { headers: authHeaders });
  const compGetJson = await compGetRes.json();
  assert(compGetRes.status === 200 && compGetJson.success === true, 'GET /api/focus/comparisons returned HTTP 200');
  assert(Array.isArray(compGetJson.data) && compGetJson.data.length >= 1, `Found ${compGetJson.data?.length} comparison sets`);
  console.log('   Saved comparisons:', compGetJson.data.map((c: any) => `${c.name} [${c.symbols.join(',')}]`).join(' | '));

  // 10. Test POST /api/focus/comparisons (Create comparison set)
  console.log('\n--- Test 8: POST /api/focus/comparisons (Save New Comparison Set) ---');
  const compAddRes = await fetch(`${BASE_URL}/focus/comparisons`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Layer 1 Showdown (ETH vs SOL vs ADA)',
      symbols: ['ETH', 'SOL', 'ADA'],
      notes: 'เปรียบเทียบความเร็ว ค่า Gas และการยอมรับของสถาบัน',
      isFavorite: true,
    }),
  });
  const compAddJson = await compAddRes.json();
  assert(compAddRes.status === 200 && compAddJson.success === true, 'POST /api/focus/comparisons returned HTTP 200');
  const newCompId = compAddJson.data?.id;
  assert(!!newCompId, 'New comparison set created with UUID', newCompId);

  // 11. Test DELETE /api/focus/comparisons/:id
  console.log('\n--- Test 9: DELETE /api/focus/comparisons/:id ---');
  const compDelRes = await fetch(`${BASE_URL}/focus/comparisons/${newCompId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const compDelJson = await compDelRes.json();
  assert(compDelRes.status === 200 && compDelJson.success === true, 'DELETE /api/focus/comparisons/:id returned HTTP 200');
  const compDelDb = await pool.query('SELECT count(*)::int as count FROM public.focus_comparisons WHERE id = $1', [newCompId]);
  assert(compDelDb.rows[0].count === 0, 'Comparison set deleted from PostgreSQL');

  // 12. Test DELETE /api/focus/DOGE
  console.log('\n--- Test 10: DELETE /api/focus/DOGE (Remove Focus Item) ---');
  const delRes = await fetch(`${BASE_URL}/focus/DOGE`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delJson = await delRes.json();
  assert(delRes.status === 200 && delJson.success === true, 'DELETE /api/focus/DOGE returned HTTP 200');
  const dogeDelCheck = await pool.query('SELECT count(*)::int as count FROM public.focus_items WHERE user_id = $1 AND symbol = $2', [userId, 'DOGE']);
  assert(dogeDelCheck.rows[0].count === 0, 'DOGE successfully deleted from public.focus_items');

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  await pool.end();
  if (failed > 0) process.exit(1);
}

runLiveTests().catch((e) => {
  console.error('Fatal error during test:', e);
  process.exit(1);
});
