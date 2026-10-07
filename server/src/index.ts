import 'dotenv/config';
import { app } from './app.js';
import { runStockMigrations } from './modules/stocks/migrations/migrate.js';
import { marketService } from './services/market.service.js';
import { testDbConnection, pool } from './database/db.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// Start Server & Poller (Standalone / Container / Dev runtime)
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(` CryptoPro AI Backend Server Running on Port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/market/kpis`);
  console.log(` Supabase DB Status: http://localhost:${PORT}/api/db/status`);
  console.log(`====================================================`);
  
  // Test connection to Supabase PostgreSQL database
  await testDbConnection();

  // Run Global Equity Multi-Agent Database Migrations (Phase 0)
  await runStockMigrations();

  // Auto-create user_profiles table if not exists
  try {
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
    console.log('[DB] ✅ user_profiles table ensured');
  } catch (e: any) {
    console.warn('[DB] ⚠️  Could not ensure user_profiles table:', e.message);
  }

  // Start Bitkub & Binance background sync
  await marketService.start();
});

export { app };
export default app;
