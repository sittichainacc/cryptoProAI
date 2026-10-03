import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'db.sfotlpjydhdpcmkooqwr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'vhV2AHJp#k#g27%',
  ssl: { rejectUnauthorized: false },
});

const API_BASE = 'http://localhost:5000/api';

async function runLiveTest() {
  console.log('====================================================');
  console.log('🚀 STARTING REAL TEST: PHASE 3 PORTFOLIO & PAPER TRADES');
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

  // 1. Get user profiles from DB
  const userRes = await pool.query("SELECT id, username, role FROM public.user_profiles WHERE username IN ('totokung', 'crypto_guest')");
  const totokung = userRes.rows.find(u => u.username === 'totokung');
  const guest = userRes.rows.find(u => u.username === 'crypto_guest');

  assert(totokung && totokung.id, `Loaded user totokung: ID=${totokung?.id}`);
  assert(guest && guest.id, `Loaded guest user: ID=${guest?.id}`);

  // -------------------------------------------------------------------
  // TEST 1: GET /api/market/portfolio (Auto-creates portfolio in DB & returns analytics)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 1: Portfolio Analytics & DB Auto-creation (GET /api/market/portfolio) ---');
  const portRes = await fetch(`${API_BASE}/market/portfolio`, {
    headers: { 'x-user-id': totokung.id },
  });
  const portJson = await portRes.json();
  assert(portRes.status === 200 && portJson.success, 'GET /api/market/portfolio returned 200 OK');
  assert(typeof portJson.data.totalValue === 'number', `totalValue is a valid number: ${portJson.data.totalValue}`);
  assert(Array.isArray(portJson.data.positions), `positions is an array: length=${portJson.data.positions.length}`);
  assert(Array.isArray(portJson.data.allocation), `allocation is an array: length=${portJson.data.allocation.length}`);

  // Verify that public.portfolios has a row for totokung
  const dbPortCheck = await pool.query('SELECT * FROM public.portfolios WHERE user_id = $1', [totokung.id]);
  assert(dbPortCheck.rows.length >= 1, `PostgreSQL has portfolio row for totokung: ${dbPortCheck.rows[0]?.name}`);
  const portfolioId = dbPortCheck.rows[0]?.id;

  // -------------------------------------------------------------------
  // TEST 2: GET /api/paper-trading (Fetches real trades from PostgreSQL)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 2: Paper Trades from PostgreSQL (GET /api/paper-trading) ---');
  const paperRes = await fetch(`${API_BASE}/paper-trading`, {
    headers: { 'x-user-id': totokung.id },
  });
  const paperJson = await paperRes.json();
  assert(paperRes.status === 200 && paperJson.success, 'GET /api/paper-trading returned 200 OK');
  assert(Array.isArray(paperJson.data.trades) && paperJson.data.trades.length > 0, `Trades array populated: ${paperJson.data.trades.length} trades`);
  assert(typeof paperJson.data.stats.winRatePct === 'number', `Win rate calculated: ${paperJson.data.stats.winRatePct}%`);
  assert(paperJson.data.stats.maxOpenTrades === 999, `Admin open trades quota is 999`);

  // Verify that rows in PostgreSQL match
  const dbTrades = await pool.query('SELECT id, symbol, trade_type, status FROM public.paper_trades WHERE user_id = $1', [totokung.id]);
  assert(dbTrades.rows.length === paperJson.data.trades.length, `PostgreSQL count (${dbTrades.rows.length}) matches API count (${paperJson.data.trades.length})`);

  // -------------------------------------------------------------------
  // TEST 3: POST /api/paper-trading/order (Insert new trade in PostgreSQL)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 3: Create New Paper Trade in PostgreSQL (POST /api/paper-trading/order) ---');
  const createRes = await fetch(`${API_BASE}/paper-trading/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': totokung.id,
    },
    body: JSON.stringify({
      symbol: 'AVAX',
      type: 'BUY',
      entryPrice: 42.5,
      qty: 15,
      sl: 38.0,
      tp: 55.0,
      notes: 'ทดสอบเปิดออเดอร์ Phase 3 ใน Supabase',
      signalOrigin: 'AI Gold Signal Engine',
    }),
  });
  const createJson = await createRes.json();
  assert(createRes.status === 200 && createJson.success, 'Trade created successfully');
  const createdTradeId = createJson.data.id;
  assert(!!createdTradeId, `Created Trade ID: ${createdTradeId}`);
  assert(createJson.data.symbol === 'AVAX', 'Trade symbol is AVAX');
  assert(createJson.data.totalCost === 42.5 * 15, `Trade total cost is ${42.5 * 15}`);

  // Direct check in PostgreSQL
  const dbVerify = await pool.query('SELECT * FROM public.paper_trades WHERE id = $1', [createdTradeId]);
  assert(dbVerify.rows.length === 1, `PostgreSQL contains exactly 1 row for ID ${createdTradeId}`);
  assert(dbVerify.rows[0].status === 'OPEN', 'DB status is OPEN');
  assert(parseFloat(dbVerify.rows[0].entry_price) === 42.5, 'DB entry_price matches 42.5');

  // -------------------------------------------------------------------
  // TEST 4: POST /api/paper-trading/close/:id (Close trade & record Realized PnL in DB)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 4: Close Trade in PostgreSQL (POST /api/paper-trading/close/:id) ---');
  const closeRes = await fetch(`${API_BASE}/paper-trading/close/${createdTradeId}`, {
    method: 'POST',
    headers: { 'x-user-id': totokung.id },
  });
  const closeJson = await closeRes.json();
  assert(closeRes.status === 200 && closeJson.success, 'Trade closed successfully');
  assert(closeJson.data.status === 'CLOSED', 'Returned trade status is CLOSED');
  assert(typeof closeJson.data.realizedPnl === 'number', `Realized PnL calculated: ${closeJson.data.realizedPnl}`);

  // Check in PostgreSQL
  const dbCloseCheck = await pool.query('SELECT status, close_price, realized_pnl, closed_at FROM public.paper_trades WHERE id = $1', [createdTradeId]);
  assert(dbCloseCheck.rows[0].status === 'CLOSED', 'DB status is now CLOSED');
  assert(dbCloseCheck.rows[0].closed_at !== null, 'DB closed_at is recorded');
  assert(parseFloat(dbCloseCheck.rows[0].realized_pnl) === closeJson.data.realizedPnl, 'DB realized_pnl matches');

  // -------------------------------------------------------------------
  // TEST 5: User Isolation (crypto_guest cannot see totokung's trades)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 5: Strict User Isolation Test (guest vs totokung) ---');
  const guestPaperRes = await fetch(`${API_BASE}/paper-trading`, {
    headers: { 'x-user-id': guest.id },
  });
  const guestPaperJson = await guestPaperRes.json();
  const guestHasTotokungTrade = guestPaperJson.data.trades.some(t => t.id === createdTradeId);
  assert(!guestHasTotokungTrade, 'crypto_guest DOES NOT see AVAX trade created by totokung (Strict User Isolation)');

  // -------------------------------------------------------------------
  // TEST 6: Free User Quota Enforcement Test (Max 5 open trades)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 6: Free User Quota Enforcement (Max 5 open trades) ---');
  const openCountRes = await pool.query("SELECT COUNT(*)::int as count FROM public.paper_trades WHERE user_id = $1 AND status = 'OPEN'", [guest.id]);
  const currentGuestOpen = openCountRes.rows[0].count;
  
  // Fill remaining slots to reach 5
  const needed = 5 - currentGuestOpen;
  const tempTrades = [];
  for (let i = 0; i < needed; i++) {
    const r = await fetch(`${API_BASE}/paper-trading/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': guest.id },
      body: JSON.stringify({ symbol: 'SOL', type: 'BUY', entryPrice: 150, qty: 1 }),
    });
    const d = await r.json();
    if (d.data?.id) tempTrades.push(d.data.id);
  }

  // 6th trade should fail
  const exceedRes = await fetch(`${API_BASE}/paper-trading/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': guest.id },
    body: JSON.stringify({ symbol: 'NEAR', type: 'BUY', entryPrice: 5.0, qty: 10 }),
  });
  const exceedJson = await exceedRes.json();
  assert(exceedRes.status === 400, 'Opening trade beyond quota for free user rejected with 400');
  assert(exceedJson.message.includes('ครบโควต้า'), `Rejection message indicates quota limit: "${exceedJson.message}"`);

  // Clean up guest temp trades
  for (const tid of tempTrades) {
    await pool.query('DELETE FROM public.paper_trades WHERE id = $1', [tid]);
  }

  // -------------------------------------------------------------------
  // TEST 7: PUT /api/market/portfolio/settings (Update portfolio config)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 7: Update Portfolio Settings in PostgreSQL ---');
  const updatePortRes = await fetch(`${API_BASE}/market/portfolio/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': totokung.id },
    body: JSON.stringify({
      name: 'พอร์ตหลัก ทดสอบความเสี่ยง Pro',
      initialCapital: 250000,
      currency: 'THB',
      riskPerTradePct: 2.5,
    }),
  });
  const updatePortJson = await updatePortRes.json();
  assert(updatePortRes.status === 200 && updatePortJson.success, 'PUT /market/portfolio/settings returned 200 OK');
  assert(updatePortJson.data.name === 'พอร์ตหลัก ทดสอบความเสี่ยง Pro', 'Portfolio name updated');
  assert(updatePortJson.data.initial_capital === 250000, 'Portfolio capital updated to 250,000');

  // Verify in PostgreSQL
  const dbPortUpdated = await pool.query('SELECT name, initial_capital, risk_per_trade_pct FROM public.portfolios WHERE user_id = $1', [totokung.id]);
  assert(dbPortUpdated.rows[0].name === 'พอร์ตหลัก ทดสอบความเสี่ยง Pro', 'DB portfolio name matches updated value');
  assert(parseFloat(dbPortUpdated.rows[0].initial_capital) === 250000, 'DB initial_capital matches 250000');

  // -------------------------------------------------------------------
  // TEST 8: DELETE /api/paper-trading/:id (Delete trade from PostgreSQL)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 8: Delete Trade from PostgreSQL (DELETE /api/paper-trading/:id) ---');
  const delRes = await fetch(`${API_BASE}/paper-trading/${createdTradeId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': totokung.id },
  });
  const delJson = await delRes.json();
  assert(delRes.status === 200 && delJson.success, 'DELETE trade returned 200 OK');

  const dbDelCheck = await pool.query('SELECT * FROM public.paper_trades WHERE id = $1', [createdTradeId]);
  assert(dbDelCheck.rows.length === 0, `PostgreSQL confirms trade ${createdTradeId} is completely deleted`);

  console.log('\n====================================================');
  console.log(`🏁 PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

runLiveTest().catch(async (e) => {
  console.error('Test execution error:', e);
  await pool.end();
  process.exit(1);
});
