/**
 * CryptoPro AI — Database Setup Script
 * สร้างตาราง user_profiles และ seed ข้อมูลตัวอย่าง
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'db.sfotlpjydhdpcmkooqwr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'vhV2AHJp#k#g27%',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function setupDatabase() {
  console.log('🔌 Connecting to Supabase PostgreSQL...');

  // Step 1: Create table
  console.log('\n📋 Step 1: Creating user_profiles table...');
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
  `);
  console.log('   ✅ Table created (or already exists)');

  // Step 2: Create indexes
  console.log('\n📑 Step 2: Creating indexes...');
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);`);
  console.log('   ✅ Indexes created');

  // Step 3: Seed demo users
  console.log('\n🌱 Step 3: Seeding demo users...');
  await pool.query(`
    INSERT INTO public.user_profiles 
      (username, email, full_name, role, status, daily_api_quota, max_watchlists, max_alerts, 
       can_access_whale_radar, can_access_quant_v3, can_access_focus, can_export_pdf, notes)
    VALUES
      ('totokung',     'totokung@cryptopro.ai',  'Totokung (Super Admin)',    'admin',    'ACTIVE', 999999, 999, 999, true,  true,  true,  true,  'ผู้ดูแลระบบสูงสุด'),
      ('fuyu',         'admin@cryptopro.ai',     'Admin Fuyu',               'admin',    'ACTIVE', 999999, 999, 999, true,  true,  true,  true,  'ผู้ดูแลระบบ'),
      ('sittichai_vip','sittichai@cryptopro.ai', 'สิทธิชัย Platinum VIP',    'platinum', 'ACTIVE', 100000, 100, 100, true,  true,  true,  true,  'สมาชิก Platinum VIP'),
      ('somchai_pro',  'somchai@cryptopro.ai',   'สมชาย Premium',            'premium',  'ACTIVE', 1500,   30,  20,  false, true,  true,  true,  'สมาชิก Premium'),
      ('nisa_gold',    'nisa@cryptopro.ai',      'ณิสา Gold Member',         'gold',     'ACTIVE', 300,    15,  10,  false, false, false, false, 'สมาชิก Gold'),
      ('crypto_guest', 'guest@cryptopro.ai',     'ผู้ใช้งานทั่วไป Free',     'free',     'ACTIVE', 50,     5,   3,   false, false, false, false, 'ผู้ใช้งานฟรี')
    ON CONFLICT (username) DO UPDATE SET
      role              = EXCLUDED.role,
      status            = EXCLUDED.status,
      daily_api_quota   = EXCLUDED.daily_api_quota,
      can_access_whale_radar = EXCLUDED.can_access_whale_radar,
      can_access_quant_v3    = EXCLUDED.can_access_quant_v3,
      can_access_focus       = EXCLUDED.can_access_focus,
      can_export_pdf         = EXCLUDED.can_export_pdf,
      updated_at        = NOW();
  `);
  console.log('   ✅ Demo users seeded');

  // Step 4: Verify
  console.log('\n🔍 Step 4: Verification...');
  const result = await pool.query(`
    SELECT role, COUNT(*)::int as count, 
           array_agg(username ORDER BY created_at) as users
    FROM public.user_profiles 
    GROUP BY role 
    ORDER BY 
      CASE role 
        WHEN 'admin' THEN 1 WHEN 'platinum' THEN 2 
        WHEN 'premium' THEN 3 WHEN 'gold' THEN 4 ELSE 5 
      END
  `);

  const totalResult = await pool.query(`SELECT COUNT(*)::int as total FROM public.user_profiles`);
  
  console.log(`\n   📊 Total Users: ${totalResult.rows[0].total}`);
  console.log('   ┌──────────────┬───────┬───────────────────────────────────┐');
  console.log('   │ Role         │ Count │ Usernames                         │');
  console.log('   ├──────────────┼───────┼───────────────────────────────────┤');
  result.rows.forEach(r => {
    const roleStr = r.role.padEnd(12);
    const countStr = String(r.count).padEnd(5);
    const usersStr = r.users.join(', ').substring(0, 35);
    console.log(`   │ ${roleStr} │ ${countStr} │ ${usersStr.padEnd(33)} │`);
  });
  console.log('   └──────────────┴───────┴───────────────────────────────────┘');

  await pool.end();
  console.log('\n✅ Database setup complete!\n');
}

setupDatabase().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
