import { pool } from './src/database/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  console.log('====================================================');
  console.log('🧪 LIVE TEST: Database-Driven Authentication (No Fixed Code)');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 0. Reset lock
    await fetch(`${BASE_URL}/auth/reset-lock`, { method: 'POST' });

    // TEST 1: Login with existing user totokung
    console.log('\n--- TEST 1: Login with totokung from Database ---');
    const res1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'totokung', password: 'Ss@crypto' })
    });
    const data1 = await res1.json();
    assert(res1.status === 200 && data1.success === true, 'Login with totokung succeeds (200 OK)');
    assert(data1.user?.username === 'totokung', 'Returned user is totokung');
    assert(data1.user?.role === 'admin', 'totokung has role admin');

    // Wait 1 second for background auto-migration to finish
    await new Promise(r => setTimeout(r, 1000));

    // TEST 2: Verify password hash in PostgreSQL was upgraded to PBKDF2
    console.log('\n--- TEST 2: Verify PBKDF2 Auto-Migration in PostgreSQL ---');
    const dbCheck1 = await pool.query("SELECT password FROM public.user_profiles WHERE username = 'totokung'");
    const storedPw1 = dbCheck1.rows[0]?.password;
    console.log('Stored password in DB for totokung:', storedPw1?.substring(0, 25) + '...');
    assert(storedPw1?.startsWith('pbkdf2:'), 'Password for totokung is now securely hashed with PBKDF2');

    // TEST 3: Login AGAIN using the newly hashed password
    console.log('\n--- TEST 3: Login with PBKDF2 Hashed Password ---');
    const res2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'totokung', password: 'Ss@crypto' })
    });
    const data2 = await res2.json();
    assert(res2.status === 200 && data2.success === true, 'Login against PBKDF2 hash succeeds');

    // TEST 4: Login with fuyu
    console.log('\n--- TEST 4: Login with fuyu from Database ---');
    const res3 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'fuyu', password: 'haru' })
    });
    const data3 = await res3.json();
    assert(res3.status === 200 && data3.success === true, 'Login with fuyu succeeds (200 OK)');
    assert(data3.user?.username === 'fuyu', 'Returned user is fuyu');

    // TEST 5: Wrong password attempts & lockout test
    console.log('\n--- TEST 5: 3-Attempt Lockout Protection Test ---');
    await fetch(`${BASE_URL}/auth/reset-lock`, { method: 'POST' });

    // Attempt 1
    const att1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'totokung', password: 'WrongPassword1' })
    });
    const dAtt1 = await att1.json();
    assert(att1.status === 401 && dAtt1.attempts === 1, 'Attempt 1 fails with 401 (attempts: 1)');

    // Attempt 2
    const att2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'totokung', password: 'WrongPassword2' })
    });
    const dAtt2 = await att2.json();
    assert(att2.status === 401 && dAtt2.attempts === 2, 'Attempt 2 fails with 401 (attempts: 2)');

    // Attempt 3
    const att3 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'totokung', password: 'WrongPassword3' })
    });
    const dAtt3 = await att3.json();
    assert(att3.status === 403 && dAtt3.isLocked === true && dAtt3.attempts === 3, 'Attempt 3 locks IP with 403 (isLocked: true)');

    // Attempt 4 while locked
    const att4 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'totokung', password: 'Ss@crypto' })
    });
    assert(att4.status === 403, 'Login while locked is rejected with 403');

    // Reset lock
    await fetch(`${BASE_URL}/auth/reset-lock`, { method: 'POST' });

    // TEST 6: Dynamically create user in DB without any code changes
    console.log('\n--- TEST 6: Completely Dynamic New User in Database ---');
    const dynamicUsername = `dyn_user_${Date.now()}`;
    const dynamicPassword = 'MySecretPassword#999';
    
    // Create new user with custom password via POST /api/users
    const createRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: dynamicUsername,
        email: `${dynamicUsername}@test.com`,
        full_name: 'Dynamic Test User',
        role: 'gold',
        password: dynamicPassword
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success === true, 'Created dynamic user via API');
    const dynamicUserId = createData.data?.id;

    // Login with the dynamic user and password
    const dynLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: dynamicUsername, password: dynamicPassword })
    });
    const dynLoginData = await dynLoginRes.json();
    assert(dynLoginRes.status === 200 && dynLoginData.success === true, 'Dynamic user logs in successfully without code modification');
    assert(dynLoginData.user?.role === 'gold', 'Dynamic user role is gold');

    // TEST 7: Update dynamic user password in DB via PATCH /api/users/:id/password
    console.log('\n--- TEST 7: Password Change in Database ---');
    const newPassword = 'BrandNewPassword#2026';
    const patchPwRes = await fetch(`${BASE_URL}/users/${dynamicUserId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });
    const patchPwData = await patchPwRes.json();
    assert(patchPwRes.status === 200 && patchPwData.success === true, 'Password updated via PATCH /api/users/:id/password');

    // Try old password -> should fail
    const oldPwLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: dynamicUsername, password: dynamicPassword })
    });
    assert(oldPwLogin.status === 401, 'Old password fails to login');

    // Reset lock after failed attempt
    await fetch(`${BASE_URL}/auth/reset-lock`, { method: 'POST' });

    // Try new password -> should succeed
    const newPwLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: dynamicUsername, password: newPassword })
    });
    const newPwData = await newPwLogin.json();
    assert(newPwLogin.status === 200 && newPwData.success === true, 'New password logs in successfully');

    // Clean up dynamic user
    await pool.query('DELETE FROM public.user_profiles WHERE id = $1', [dynamicUserId]);
    console.log('Cleaned up dynamic test user from database');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during test:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
