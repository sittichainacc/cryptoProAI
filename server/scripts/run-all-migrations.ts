import { testDbConnection, pool } from '../src/database/db.js';
import { runStockMigrations } from '../src/modules/stocks/migrations/migrate.js';

async function main() {
  console.log('========================================================');
  console.log('🚀 RUNNING COMPLETE DATABASE MIGRATIONS & VERIFICATION');
  console.log('========================================================\n');

  // 1. Test Connection
  console.log('Step 1: Testing Connection to Supabase PostgreSQL...');
  const connected = await testDbConnection();
  if (!connected) {
    console.error('❌ Failed to connect to database. Aborting migrations.');
    process.exit(1);
  }

  // 2. Ensure user_profiles table
  console.log('\nStep 2: Verifying user_profiles table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(150),
      avatar_url TEXT,
      role VARCHAR(20) NOT NULL DEFAULT 'free'
        CHECK (role IN ('free', 'gold', 'premium', 'platinum', 'admin')),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING')),
      daily_api_quota INT NOT NULL DEFAULT 50,
      max_watchlists INT NOT NULL DEFAULT 5,
      max_alerts INT NOT NULL DEFAULT 3,
      can_access_whale_radar BOOLEAN NOT NULL DEFAULT false,
      can_access_quant_v3 BOOLEAN NOT NULL DEFAULT false,
      can_access_focus BOOLEAN NOT NULL DEFAULT false,
      can_export_pdf BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
  `);
  console.log('✅ user_profiles table verified.');

  // 3. Run Global Stocks Phase 0 - Phase 8 Migrations
  console.log('\nStep 3: Running Global Stocks Phase 0 - Phase 8 Migrations...');
  const stockMigrated = await runStockMigrations();
  if (!stockMigrated) {
    console.error('❌ Stock migrations encountered an error.');
    process.exit(1);
  }

  // 4. Verification of Tables & Counts
  console.log('\nStep 4: Verifying Created Tables & Counts...');
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log(`\n📋 Found ${tablesResult.rows.length} total tables in public schema:`);
  for (const row of tablesResult.rows) {
    const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM public."${row.table_name}"`);
    console.log(`   - ${row.table_name.padEnd(32)}: ${countRes.rows[0].count} records`);
  }

  console.log('\n========================================================');
  console.log('🎉 ALL DATABASE MIGRATIONS COMPLETED & VERIFIED!');
  console.log('========================================================');

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
