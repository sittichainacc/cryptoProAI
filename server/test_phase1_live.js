import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.sfotlpjydhdpcmkooqwr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'vhV2AHJp#k#g27%',
  ssl: { rejectUnauthorized: false }
});

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING REAL TEST: PHASE 1 USER & WATCHLIST DB');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Database Connection & Tables
  // ----------------------------------------------------
  console.log('--- TEST 1: Supabase DB Connection & Table Schema ---');
  const userCheck = await pool.query("SELECT id, username, role, password, status, last_login_at FROM public.user_profiles WHERE username = 'totokung'");
  assert(userCheck.rows.length === 1, 'totokung exists in public.user_profiles');
  const totokung = userCheck.rows[0];
  console.log(`  totokung ID: ${totokung.id}, Role: ${totokung.role}`);

  // ----------------------------------------------------
  // TEST 2: API Login Authentication via Database
  // ----------------------------------------------------
  console.log('\n--- TEST 2: API Login Authentication via Supabase DB ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'totokung', password: 'Ss@crypto' })
  });
  const loginJson = await loginRes.json();
  assert(loginRes.status === 200 && loginJson.success === true, 'Login as totokung succeeded with 200 OK');
  assert(loginJson.user?.id === totokung.id, `Returned user ID matches DB ID (${loginJson.user?.id})`);
  assert(loginJson.user?.role === 'admin', 'Returned role is admin');

  // Verify DB last_login_at was updated
  const updatedUser = await pool.query("SELECT last_login_at FROM public.user_profiles WHERE username = 'totokung'");
  assert(updatedUser.rows[0].last_login_at !== null, `DB last_login_at was updated to: ${updatedUser.rows[0].last_login_at}`);

  // Test another user login: sittichai_vip
  const vipLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sittichai_vip', password: 'Ss@crypto' })
  });
  const vipJson = await vipLoginRes.json();
  assert(vipLoginRes.status === 200 && vipJson.user?.role === 'platinum', 'Login as sittichai_vip succeeded with role platinum');
  const sittichaiId = vipJson.user?.id;

  // Test invalid login
  const badLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'totokung', password: 'wrongPassword!' })
  });
  assert(badLogin.status === 401, 'Invalid password correctly rejected with 401');

  // ----------------------------------------------------
  // TEST 3: Watchlist Fetch from Database
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Watchlist Fetch from DB (GET /api/market/watchlist) ---');
  const wlRes = await fetch(`${BASE_URL}/market/watchlist`, {
    headers: { 'x-user-id': totokung.id }
  });
  const wlJson = await wlRes.json();
  assert(wlRes.status === 200 && wlJson.success === true, 'GET /api/market/watchlist returned 200 OK');
  assert(Array.isArray(wlJson.data), `Returned data is array (length: ${wlJson.data.length})`);
  assert(wlJson.quota?.max > 0, `Returned quota info: used=${wlJson.quota?.used}, max=${wlJson.quota?.max}`);

  // ----------------------------------------------------
  // TEST 4: Add Coin to Watchlist (Toggle) & Verify in PostgreSQL
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Add Coin to DB Watchlist (POST /api/market/watchlist/toggle) ---');
  const testSymbol = 'NEAR';

  // Clean any previous test row for NEAR
  await pool.query("DELETE FROM public.watchlists WHERE user_id = $1 AND symbol = $2", [totokung.id, testSymbol]);

  const addRes = await fetch(`${BASE_URL}/market/watchlist/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': totokung.id
    },
    body: JSON.stringify({ symbol: testSymbol })
  });
  const addJson = await addRes.json();
  assert(addRes.status === 200 && addJson.success === true && addJson.data.isWatchlist === true, `Added ${testSymbol} to watchlist`);

  // Direct query into Supabase PostgreSQL
  const dbRow = await pool.query(
    "SELECT * FROM public.watchlists WHERE user_id = $1 AND symbol = $2",
    [totokung.id, testSymbol]
  );
  assert(dbRow.rows.length === 1, `PostgreSQL contains exactly 1 row for ${testSymbol} with user_id ${totokung.id}`);
  console.log(`  DB Row: id=${dbRow.rows[0].id}, symbol=${dbRow.rows[0].symbol}, created_at=${dbRow.rows[0].created_at}`);

  // ----------------------------------------------------
  // TEST 5: Save Custom Details (Target Buy/Sell & Notes) into DB
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Save Target Prices & Personal Notes to DB ---');
  const saveRes = await fetch(`${BASE_URL}/market/watchlist/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': totokung.id
    },
    body: JSON.stringify({
      symbol: testSymbol,
      targetBuyPrice: 3.25,
      targetSellPrice: 6.80,
      notes: 'จุดซื้อสะสมแนวรับสำคัญ รอเบรกไฮเดิม',
      priority: 1
    })
  });
  const saveJson = await saveRes.json();
  assert(saveRes.status === 200 && saveJson.success === true, 'Saved target prices and notes successfully');

  // Direct check in Supabase PostgreSQL
  const dbUpdated = await pool.query(
    "SELECT target_buy_price, target_sell_price, notes FROM public.watchlists WHERE user_id = $1 AND symbol = $2",
    [totokung.id, testSymbol]
  );
  assert(Number(dbUpdated.rows[0].target_buy_price) === 3.25, `Target buy price in DB is 3.25`);
  assert(Number(dbUpdated.rows[0].target_sell_price) === 6.80, `Target sell price in DB is 6.80`);
  assert(dbUpdated.rows[0].notes === 'จุดซื้อสะสมแนวรับสำคัญ รอเบรกไฮเดิม', `Notes in DB match perfectly`);

  // ----------------------------------------------------
  // TEST 6: User Isolation Check
  // ----------------------------------------------------
  console.log('\n--- TEST 6: User Isolation Check (sittichai_vip vs totokung) ---');
  const vipWlRes = await fetch(`${BASE_URL}/market/watchlist`, {
    headers: { 'x-user-id': sittichaiId }
  });
  const vipWlJson = await vipWlRes.json();
  const vipHasNear = vipWlJson.data.some(c => c.symbol === testSymbol);
  assert(!vipHasNear, `sittichai_vip DOES NOT see ${testSymbol} added by totokung (Strict User Isolation)`);

  // ----------------------------------------------------
  // TEST 7: Remove Coin from DB Watchlist (Delete)
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Delete Coin from DB Watchlist ---');
  const delRes = await fetch(`${BASE_URL}/market/watchlist/${testSymbol}`, {
    method: 'DELETE',
    headers: { 'x-user-id': totokung.id }
  });
  const delJson = await delRes.json();
  assert(delRes.status === 200 && delJson.data.removed === true, `DELETE endpoint removed ${testSymbol}`);

  // Check DB directly
  const dbAfterDel = await pool.query(
    "SELECT * FROM public.watchlists WHERE user_id = $1 AND symbol = $2",
    [totokung.id, testSymbol]
  );
  assert(dbAfterDel.rows.length === 0, `PostgreSQL confirms ${testSymbol} is completely removed from DB`);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
