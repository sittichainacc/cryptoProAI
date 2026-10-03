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
  console.log('🚀 STARTING REAL TEST: PHASE 4 STRATEGY, REPORTS & JOURNALS');
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

  // 1. Get users from DB
  const userRes = await pool.query(
    "SELECT id, username, role FROM public.user_profiles WHERE username IN ('totokung', 'crypto_guest')"
  );
  const totokung = userRes.rows.find((u) => u.username === 'totokung');
  const guest = userRes.rows.find((u) => u.username === 'crypto_guest');

  assert(totokung && totokung.id, `Loaded user totokung: ID=${totokung?.id}`);
  assert(guest && guest.id, `Loaded guest user: ID=${guest?.id}`);

  // -------------------------------------------------------------------
  // TEST 1: GET /api/journals (Auto-seeds starter journal & reads from DB)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 1: Trading Journals from PostgreSQL (GET /api/journals) ---');
  const getRes = await fetch(`${API_BASE}/journals`, {
    headers: { 'x-user-id': totokung.id },
  });
  const getJson = await getRes.json();
  assert(getRes.status === 200 && getJson.success, 'GET /api/journals returned 200 OK');
  assert(Array.isArray(getJson.data) && getJson.data.length > 0, `Journals array length: ${getJson.data.length}`);
  assert(!!getJson.data[0].id, `First journal has valid ID: ${getJson.data[0].id}`);

  // Check in PostgreSQL
  const dbCheck = await pool.query('SELECT * FROM public.trading_journals WHERE user_id = $1', [totokung.id]);
  assert(dbCheck.rows.length === getJson.data.length, `PostgreSQL count (${dbCheck.rows.length}) matches API count (${getJson.data.length})`);

  // -------------------------------------------------------------------
  // TEST 2: POST /api/journals (Create new journal entry in DB)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 2: Create Trading Journal in PostgreSQL (POST /api/journals) ---');
  const createRes = await fetch(`${API_BASE}/journals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': totokung.id,
    },
    body: JSON.stringify({
      title: 'บันทึกการทดสอบ Phase 4: ประเมินความเสี่ยงและวินัยการเทรด',
      tradeDate: new Date().toISOString().slice(0, 10),
      marketSentiment: 'BULLISH',
      dailySummaryTh: 'ทดสอบการส่งข้อมูลและบันทึกลงในฐานข้อมูล Supabase PostgreSQL ผ่านระบบ Pair Programming',
      lessonsLearned: 'การบันทึกสถิติช่วยลดอคติในการตัดสินใจ และทำให้วิเคราะห์ Win Rate ได้แม่นยำ',
      winTrades: 3,
      lossTrades: 1,
      netPnl: 450.75,
    }),
  });
  const createJson = await createRes.json();
  assert(createRes.status === 200 && createJson.success, 'Journal created successfully');
  const createdId = createJson.data.id;
  assert(!!createdId, `Created Journal ID: ${createdId}`);
  assert(createJson.data.marketSentiment === 'BULLISH', 'Market sentiment is BULLISH');
  assert(createJson.data.netPnl === 450.75, 'Net PnL is 450.75');

  // Verify in PostgreSQL
  const dbVerify = await pool.query('SELECT * FROM public.trading_journals WHERE id = $1', [createdId]);
  assert(dbVerify.rows.length === 1, `PostgreSQL contains exactly 1 row for journal ID ${createdId}`);
  assert(dbVerify.rows[0].title === 'บันทึกการทดสอบ Phase 4: ประเมินความเสี่ยงและวินัยการเทรด', 'DB title matches');
  assert(parseFloat(dbVerify.rows[0].net_pnl) === 450.75, 'DB net_pnl matches');

  // -------------------------------------------------------------------
  // TEST 3: PUT /api/journals/:id (Update journal in DB)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 3: Update Journal in PostgreSQL (PUT /api/journals/:id) ---');
  const updateRes = await fetch(`${API_BASE}/journals/${createdId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': totokung.id,
    },
    body: JSON.stringify({
      title: 'บันทึกการทดสอบ Phase 4: [อัปเดตแล้ว] สำเร็จสมบูรณ์',
      netPnl: 580.00,
    }),
  });
  const updateJson = await updateRes.json();
  assert(updateRes.status === 200 && updateJson.success, 'PUT /api/journals/:id returned 200 OK');
  assert(updateJson.data.title === 'บันทึกการทดสอบ Phase 4: [อัปเดตแล้ว] สำเร็จสมบูรณ์', 'Updated title matches');
  assert(updateJson.data.netPnl === 580.00, 'Updated net PnL is 580.00');

  // DB check
  const dbUpdateCheck = await pool.query('SELECT title, net_pnl FROM public.trading_journals WHERE id = $1', [createdId]);
  assert(dbUpdateCheck.rows[0].title === 'บันทึกการทดสอบ Phase 4: [อัปเดตแล้ว] สำเร็จสมบูรณ์', 'DB title matches updated value');
  assert(parseFloat(dbUpdateCheck.rows[0].net_pnl) === 580.00, 'DB net_pnl matches updated value');

  // -------------------------------------------------------------------
  // TEST 4: Strict User Isolation (guest cannot see totokung's journal)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 4: User Isolation Check (guest vs totokung) ---');
  const guestJournalRes = await fetch(`${API_BASE}/journals`, {
    headers: { 'x-user-id': guest.id },
  });
  const guestJournalJson = await guestJournalRes.json();
  const guestHasTotokungJournal = guestJournalJson.data.some((j) => j.id === createdId);
  assert(!guestHasTotokungJournal, 'crypto_guest DOES NOT see journal created by totokung (Strict User Isolation)');

  // -------------------------------------------------------------------
  // TEST 5: GET /api/reports/performance (Aggregate Performance Report)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 5: User Performance Report Aggregated from DB (GET /api/reports/performance) ---');
  const repRes = await fetch(`${API_BASE}/reports/performance`, {
    headers: { 'x-user-id': totokung.id },
  });
  const repJson = await repRes.json();
  assert(repRes.status === 200 && repJson.success, 'GET /reports/performance returned 200 OK');
  assert(typeof repJson.data.winRatePct === 'number', `Win rate: ${repJson.data.winRatePct}%`);
  assert(typeof repJson.data.profitFactor === 'number', `Profit factor: ${repJson.data.profitFactor}x`);
  assert(repJson.data.journalCount >= 1, `Journal count in report: ${repJson.data.journalCount}`);
  assert(Array.isArray(repJson.data.performanceBySymbol), `performanceBySymbol is array: length=${repJson.data.performanceBySymbol.length}`);

  // -------------------------------------------------------------------
  // TEST 6: DELETE /api/journals/:id (Delete journal from DB)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 6: Delete Journal from PostgreSQL (DELETE /api/journals/:id) ---');
  const delRes = await fetch(`${API_BASE}/journals/${createdId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': totokung.id },
  });
  const delJson = await delRes.json();
  assert(delRes.status === 200 && delJson.success, 'DELETE journal returned 200 OK');

  const dbDelCheck = await pool.query('SELECT * FROM public.trading_journals WHERE id = $1', [createdId]);
  assert(dbDelCheck.rows.length === 0, `PostgreSQL confirms journal ${createdId} is completely deleted`);

  console.log('\n====================================================');
  console.log(`🏁 PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

runLiveTest().catch(async (e) => {
  console.error('Test execution error:', e);
  await pool.end();
  process.exit(1);
});
