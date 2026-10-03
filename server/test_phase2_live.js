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
  console.log('🚀 STARTING REAL TEST: PHASE 2 ALERTS MENU & DB');
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

  // 1. Get totokung user
  const userRes = await pool.query("SELECT id, username, role, max_alerts FROM public.user_profiles WHERE username = 'totokung'");
  const totokung = userRes.rows[0];
  assert(totokung && totokung.id, `Loaded user totokung: ID=${totokung.id}, MaxAlerts=${totokung.max_alerts}`);

  const guestRes = await pool.query("SELECT id, username, role, max_alerts FROM public.user_profiles WHERE username = 'crypto_guest'");
  const guest = guestRes.rows[0];
  assert(guest && guest.id, `Loaded guest user: ID=${guest.id}, MaxAlerts=${guest.max_alerts}`);

  // ----------------------------------------------------
  // TEST 1: GET /api/market/alerts
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Fetch Alerts from PostgreSQL (GET /api/market/alerts) ---');
  const getRes = await fetch(`${BASE_URL}/market/alerts`, {
    headers: { 'x-user-id': totokung.id }
  });
  const getJson = await getRes.json();
  assert(getRes.status === 200 && getJson.success === true, 'GET /api/market/alerts returned 200 OK');
  assert(Array.isArray(getJson.data), `Alerts data is array (length: ${getJson.data.length})`);
  assert(getJson.quota && getJson.quota.max === totokung.max_alerts, `Quota max matches user profile (${getJson.quota?.max})`);

  // ----------------------------------------------------
  // TEST 2: POST /api/market/alerts (Create Alert in DB)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Create New Alert in PostgreSQL (POST /api/market/alerts) ---');
  const testSymbol = 'AVAX';
  // Clean up any old test alert
  await pool.query("DELETE FROM public.price_alerts WHERE user_id = $1 AND symbol = $2", [totokung.id, testSymbol]);

  const createRes = await fetch(`${BASE_URL}/market/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': totokung.id
    },
    body: JSON.stringify({
      symbol: testSymbol,
      alertType: 'Price Above',
      currentValue: '45.50',
      descriptionTh: 'AVAX เบรกทะลุแนวต้าน $45.50',
      severity: 'critical'
    })
  });
  const createJson = await createRes.json();
  assert(createRes.status === 200 && createJson.success === true, 'Alert created successfully');
  const alertId = createJson.data?.id;
  assert(alertId, `Created Alert ID: ${alertId}`);
  assert(createJson.data?.symbol === testSymbol, `Symbol matches ${testSymbol}`);
  assert(createJson.data?.severity === 'critical', 'Severity is critical');

  // Direct check in Supabase PostgreSQL
  const dbCheck = await pool.query("SELECT * FROM public.price_alerts WHERE id = $1 AND user_id = $2", [alertId, totokung.id]);
  assert(dbCheck.rows.length === 1, `PostgreSQL contains exactly 1 row for alert ID ${alertId}`);
  const row = dbCheck.rows[0];
  assert(Number(row.condition_value) === 45.50, `DB condition_value is ${row.condition_value}`);
  assert(row.severity === 'critical', `DB severity is ${row.severity}`);
  assert(row.status === 'ACTIVE', `DB status is ${row.status}`);
  console.log(`  DB Row verified: symbol=${row.symbol}, type=${row.alert_type}, val=${row.condition_value}, created_at=${row.created_at}`);

  // ----------------------------------------------------
  // TEST 3: Toggle Alert Status in DB
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Toggle Alert Status (Active <-> Disabled) ---');
  const toggleRes = await fetch(`${BASE_URL}/market/alerts/${alertId}/toggle`, {
    method: 'POST',
    headers: { 'x-user-id': totokung.id }
  });
  const toggleJson = await toggleRes.json();
  assert(toggleRes.status === 200 && toggleJson.success === true, 'Toggle alert endpoint returned 200 OK');

  const dbToggled = await pool.query("SELECT status FROM public.price_alerts WHERE id = $1", [alertId]);
  assert(dbToggled.rows[0].status === 'DISABLED', `Alert status in DB is now DISABLED`);

  // Toggle back to active
  await fetch(`${BASE_URL}/market/alerts/${alertId}/toggle`, {
    method: 'POST',
    headers: { 'x-user-id': totokung.id }
  });
  const dbActive = await pool.query("SELECT status FROM public.price_alerts WHERE id = $1", [alertId]);
  assert(dbActive.rows[0].status === 'ACTIVE', `Alert status in DB is now ACTIVE again`);

  // ----------------------------------------------------
  // TEST 4: User Isolation Check
  // ----------------------------------------------------
  console.log('\n--- TEST 4: User Isolation Check (guest vs totokung) ---');
  const guestAlertsRes = await fetch(`${BASE_URL}/market/alerts`, {
    headers: { 'x-user-id': guest.id }
  });
  const guestAlertsJson = await guestAlertsRes.json();
  const guestHasAvax = guestAlertsJson.data.some(a => a.id === alertId || a.symbol === testSymbol);
  assert(!guestHasAvax, `crypto_guest DOES NOT see AVAX alert created by totokung (Strict User Isolation)`);

  // ----------------------------------------------------
  // TEST 5: Quota Enforcement Test
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Free User Quota Enforcement Test ---');
  // Fill up guest alerts to max limit (guest.max_alerts = 3)
  const currentGuestCount = (await pool.query("SELECT count(*)::int as c FROM public.price_alerts WHERE user_id = $1", [guest.id])).rows[0].c;
  const neededToFill = guest.max_alerts - currentGuestCount;
  for (let i = 0; i < neededToFill; i++) {
    await pool.query(
      "INSERT INTO public.price_alerts (user_id, symbol, alert_type, condition_value, severity, status) VALUES ($1, $2, 'Price', 100, 'info', 'ACTIVE')",
      [guest.id, `COIN_${i}`]
    );
  }

  // Attempt to add 1 more beyond quota
  const overQuotaRes = await fetch(`${BASE_URL}/market/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': guest.id
    },
    body: JSON.stringify({
      symbol: 'OVER_LIMIT',
      alertType: 'Price Above',
      currentValue: '999',
      severity: 'important'
    })
  });
  const overQuotaJson = await overQuotaRes.json();
  assert(overQuotaRes.status === 400 && overQuotaJson.success === false, 'Creating alert beyond quota rejected with 400');
  assert(overQuotaJson.message && overQuotaJson.message.includes('ครบโควต้าแล้ว'), `Rejection message indicates quota exceeded: "${overQuotaJson.message}"`);

  // Clean guest extra test alerts
  await pool.query("DELETE FROM public.price_alerts WHERE user_id = $1 AND symbol LIKE 'COIN_%'", [guest.id]);

  // ----------------------------------------------------
  // TEST 6: Delete Alert from DB
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Delete Alert from PostgreSQL (DELETE /api/market/alerts/:id) ---');
  const delRes = await fetch(`${BASE_URL}/market/alerts/${alertId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': totokung.id }
  });
  const delJson = await delRes.json();
  assert(delRes.status === 200 && delJson.success === true, 'DELETE alert endpoint returned 200 OK');

  const dbAfterDel = await pool.query("SELECT * FROM public.price_alerts WHERE id = $1", [alertId]);
  assert(dbAfterDel.rows.length === 0, `PostgreSQL confirms alert ID ${alertId} is completely deleted from DB`);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
