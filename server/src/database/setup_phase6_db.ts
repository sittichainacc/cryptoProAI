import { pool } from './db.js';

export async function setupPhase6Db() {
  console.log('[Phase 6 DB] Initializing tables for User Settings & Preferences...');

  const createSettingsSql = `
    CREATE TABLE IF NOT EXISTS public.user_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      default_currency VARCHAR(10) NOT NULL DEFAULT 'THB' CHECK (default_currency IN ('THB', 'USDT')),
      default_timeframe VARCHAR(10) NOT NULL DEFAULT '1D',
      default_risk_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
      language VARCHAR(10) NOT NULL DEFAULT 'th' CHECK (language IN ('th', 'en')),
      sound_enabled BOOLEAN NOT NULL DEFAULT true,
      theme VARCHAR(20) NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
      bitkub_api_key TEXT,
      bitkub_api_secret TEXT,
      binance_api_key TEXT,
      binance_api_secret TEXT,
      line_notify_token TEXT,
      telegram_chat_id TEXT,
      telegram_bot_token TEXT,
      notify_whale_alerts BOOLEAN NOT NULL DEFAULT true,
      notify_price_alerts BOOLEAN NOT NULL DEFAULT true,
      notify_buy_signals BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
  `;
  await pool.query(createSettingsSql);
  console.log('[Phase 6 DB] Table public.user_settings ready.');

  // Seed default settings for totokung if not exists
  const adminRes = await pool.query("SELECT id FROM public.user_profiles WHERE username = 'totokung' LIMIT 1");
  if (adminRes.rows.length > 0) {
    const adminId = adminRes.rows[0].id;
    await pool.query(
      `INSERT INTO public.user_settings (
        user_id, default_currency, default_timeframe, default_risk_pct, language, sound_enabled,
        bitkub_api_key, bitkub_api_secret, binance_api_key, binance_api_secret,
        notify_whale_alerts, notify_price_alerts, notify_buy_signals
       ) VALUES (
        $1, 'THB', '1D', 2.00, 'th', true,
        'bk_live_totokung_992817293847', 'bk_secret_super_admin_safe_key_884920',
        'bn_live_totokung_883719284719', 'bn_secret_super_admin_safe_key_773910',
        true, true, true
       ) ON CONFLICT (user_id) DO NOTHING`,
      [adminId]
    );
    console.log('[Phase 6 DB] Seeded default settings for totokung.');
  }

  console.log('[Phase 6 DB] All Phase 6 schema & seeding complete!');
}

if (process.argv[1]?.includes('setup_phase6_db')) {
  setupPhase6Db().then(() => {
    pool.end();
  }).catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
}
