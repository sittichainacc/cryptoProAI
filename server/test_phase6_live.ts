import { pool } from './src/database/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function runLiveTests() {
  console.log('====================================================');
  console.log('🧪 STARTING PHASE 6 LIVE TESTS: SETTINGS & PREFERENCES');
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

  // 2. Test GET /api/settings (Fetch totokung's settings)
  console.log('\n--- Test 1: GET /api/settings (Fetch User Settings) ---');
  const getRes = await fetch(`${BASE_URL}/settings`, { headers: authHeaders });
  const getJson = await getRes.json();
  assert(getRes.status === 200 && getJson.success === true, 'GET /api/settings returned HTTP 200', getJson);
  const settings = getJson.data;
  assert(settings.userId === userId, 'Settings belongs to totokung');
  assert(settings.defaultCurrency === 'THB', 'Default currency is THB');
  assert(settings.hasBitkubSecret === true, 'Bitkub secret is configured');
  assert(settings.bitkubApiSecretMasked.includes('••••'), 'Secret is masked for security');
  console.log(`   Bitkub Key: ${settings.bitkubApiKey}, Masked Secret: ${settings.bitkubApiSecretMasked}`);

  // 3. Test PUT /api/settings (Update Settings & Notification channels)
  console.log('\n--- Test 2: PUT /api/settings (Update Preferences & Telegram / Line) ---');
  const putRes = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      defaultCurrency: 'USDT',
      defaultTimeframe: '4H',
      defaultRiskPct: 3.5,
      language: 'th',
      soundEnabled: true,
      telegramChatId: '@totokung_signals_channel',
      notifyWhaleAlerts: true,
      notifyPriceAlerts: true,
      notifyBuySignals: true,
    }),
  });
  const putJson = await putRes.json();
  assert(putRes.status === 200 && putJson.success === true, 'PUT /api/settings returned HTTP 200', putJson);
  assert(putJson.data?.defaultCurrency === 'USDT', 'Currency updated to USDT');
  assert(putJson.data?.defaultRiskPct === 3.5, 'Risk pct updated to 3.5%');
  assert(putJson.data?.defaultTimeframe === '4H', 'Timeframe updated to 4H');
  assert(putJson.data?.telegramChatId === '@totokung_signals_channel', 'Telegram Chat ID saved');

  // 4. Verify in PostgreSQL directly
  console.log('\n--- Test 3: PostgreSQL Database Direct Verification ---');
  const dbCheck = await pool.query('SELECT * FROM public.user_settings WHERE user_id = $1', [userId]);
  assert(dbCheck.rows.length === 1, 'Record found in public.user_settings table');
  const row = dbCheck.rows[0];
  assert(row.default_currency === 'USDT', 'DB default_currency column is USDT');
  assert(Number(row.default_risk_pct) === 3.5, 'DB default_risk_pct column is 3.5');
  assert(row.default_timeframe === '4H', 'DB default_timeframe column is 4H');
  assert(row.telegram_chat_id === '@totokung_signals_channel', 'DB telegram_chat_id column is correct');

  // 5. Test Live Exchange Ping Test Endpoint
  console.log('\n--- Test 4: POST /api/settings/test-connection (Bitkub Ping) ---');
  const bkPingRes = await fetch(`${BASE_URL}/settings/test-connection`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ exchange: 'bitkub' }),
  });
  const bkPingJson = await bkPingRes.json();
  assert(bkPingRes.status === 200, 'Bitkub test-connection endpoint returned HTTP 200');
  assert(bkPingJson.data?.exchange === 'bitkub', 'Tested exchange is bitkub');
  assert(bkPingJson.data?.latencyMs > 0, `Bitkub latency measured: ${bkPingJson.data?.latencyMs} ms`);
  console.log(`   Bitkub Status: ${bkPingJson.data?.status}, Message: ${bkPingJson.data?.message}`);

  console.log('\n--- Test 5: POST /api/settings/test-connection (Binance Ping) ---');
  const bnPingRes = await fetch(`${BASE_URL}/settings/test-connection`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ exchange: 'binance' }),
  });
  const bnPingJson = await bnPingRes.json();
  assert(bnPingRes.status === 200, 'Binance test-connection endpoint returned HTTP 200');
  assert(bnPingJson.data?.exchange === 'binance', 'Tested exchange is binance');
  assert(bnPingJson.data?.latencyMs > 0, `Binance latency measured: ${bnPingJson.data?.latencyMs} ms`);
  console.log(`   Binance Status: ${bnPingJson.data?.status}, Message: ${bnPingJson.data?.message}`);

  // 6. Test Auto-Seeding Settings for Another User (e.g. sittichai_vip)
  console.log('\n--- Test 6: Auto-Seeding Settings for New User Profile ---');
  const vipRes = await pool.query("SELECT id FROM public.user_profiles WHERE username = 'sittichai_vip' LIMIT 1");
  if (vipRes.rows.length > 0) {
    const vipId = vipRes.rows[0].id;
    // ensure no settings row first
    await pool.query('DELETE FROM public.user_settings WHERE user_id = $1', [vipId]);
    
    // Call GET /api/settings as sittichai_vip
    const vipGetRes = await fetch(`${BASE_URL}/settings`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': vipId,
        'x-username': 'sittichai_vip',
      },
    });
    const vipGetJson = await vipGetRes.json();
    assert(vipGetRes.status === 200 && vipGetJson.success === true, 'GET /api/settings auto-seeded for sittichai_vip');
    assert(vipGetJson.data?.userId === vipId, 'Seeded settings belongs to sittichai_vip');
    assert(vipGetJson.data?.defaultCurrency === 'THB', 'Default currency is THB');

    const dbVipCheck = await pool.query('SELECT count(*)::int as count FROM public.user_settings WHERE user_id = $1', [vipId]);
    assert(dbVipCheck.rows[0].count === 1, 'Row successfully persisted into public.user_settings in DB');
  }

  // 7. Reset totokung default currency back to THB
  console.log('\n--- Test 7: Reset Currency Back to THB ---');
  await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ defaultCurrency: 'THB' }),
  });
  const finalCheck = await pool.query('SELECT default_currency FROM public.user_settings WHERE user_id = $1', [userId]);
  assert(finalCheck.rows[0].default_currency === 'THB', 'Totokung currency set back to THB');

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
