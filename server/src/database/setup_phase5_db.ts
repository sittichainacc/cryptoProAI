import { pool } from './db.js';

export async function setupPhase5Db() {
  console.log('[Phase 5 DB] Initializing tables for FOCUS & Multi-Coin Comparisons...');

  // 1. Table public.focus_items
  const createFocusItemsSql = `
    CREATE TABLE IF NOT EXISTS public.focus_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      symbol VARCHAR(20) NOT NULL,
      pair VARCHAR(30) NOT NULL DEFAULT 'THB',
      coin_name VARCHAR(100),
      priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
      mode VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'high_focus', 'critical_focus')),
      position_status VARCHAR(30) NOT NULL DEFAULT 'WATCHING' CHECK (position_status IN ('WATCHING', 'PLANNING TO BUY', 'HOLDING', 'TAKING PROFIT', 'EXITING')),
      average_cost NUMERIC(18, 8),
      position_amount NUMERIC(18, 8),
      stop_loss NUMERIC(18, 8),
      take_profit1 NUMERIC(18, 8),
      take_profit2 NUMERIC(18, 8),
      trailing_stop_percent NUMERIC(8, 4),
      custom_trailing_stop NUMERIC(18, 8),
      user_notes TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_user_focus_symbol UNIQUE (user_id, symbol)
    );
    CREATE INDEX IF NOT EXISTS idx_focus_items_user_id ON public.focus_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_focus_items_symbol ON public.focus_items(symbol);
    CREATE INDEX IF NOT EXISTS idx_focus_items_order ON public.focus_items(user_id, display_order);
  `;
  await pool.query(createFocusItemsSql);
  console.log('[Phase 5 DB] Table public.focus_items ready.');

  // 2. Table public.focus_comparisons (Multi-coin comparison sets)
  const createComparisonsSql = `
    CREATE TABLE IF NOT EXISTS public.focus_comparisons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      symbols TEXT[] NOT NULL,
      notes TEXT,
      is_favorite BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_focus_comparisons_user_id ON public.focus_comparisons(user_id);
  `;
  await pool.query(createComparisonsSql);
  console.log('[Phase 5 DB] Table public.focus_comparisons ready.');

  // 3. Seed default Focus items for admin user (totokung) if empty
  const adminRes = await pool.query("SELECT id FROM public.user_profiles WHERE username = 'totokung' LIMIT 1");
  if (adminRes.rows.length > 0) {
    const adminId = adminRes.rows[0].id;
    const existing = await pool.query('SELECT count(*)::int as count FROM public.focus_items WHERE user_id = $1', [adminId]);
    if (existing.rows[0].count === 0) {
      const defaultCoins = [
        { symbol: 'BTC', name: 'Bitcoin', priority: 'critical', mode: 'critical_focus', status: 'HOLDING', notes: 'Core holding คริปโตอันดับ 1 ของโลก', cost: 3150000, amount: 0.15, order: 1 },
        { symbol: 'ETH', name: 'Ethereum', priority: 'high', mode: 'high_focus', status: 'HOLDING', notes: 'Smart Contract Layer 1 หลัก', cost: 118000, amount: 1.5, order: 2 },
        { symbol: 'SOL', name: 'Solana', priority: 'high', mode: 'high_focus', status: 'PLANNING TO BUY', notes: 'High throughput ecosystem รอจังหวะย่อ', cost: 5800, amount: 10, order: 3 },
        { symbol: 'ADA', name: 'Cardano', priority: 'normal', mode: 'normal', status: 'WATCHING', notes: 'จับตาแนวรับสำคัญและสัญญาณ AI', cost: null, amount: null, order: 4 },
        { symbol: 'FLOCK', name: 'FLock.io', priority: 'normal', mode: 'normal', status: 'WATCHING', notes: 'AI & DePIN narrative เหรียญแนะนำเด่น', cost: null, amount: null, order: 5 },
      ];
      for (const c of defaultCoins) {
        await pool.query(
          `INSERT INTO public.focus_items (user_id, symbol, coin_name, priority, mode, position_status, user_notes, average_cost, position_amount, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (user_id, symbol) DO NOTHING`,
          [adminId, c.symbol, c.name, c.priority, c.mode, c.status, c.notes, c.cost, c.amount, c.order]
        );
      }
      console.log(`[Phase 5 DB] Seeded ${defaultCoins.length} initial Focus items for totokung.`);
    }

    // Also seed default comparison sets if empty
    const compExisting = await pool.query('SELECT count(*)::int as count FROM public.focus_comparisons WHERE user_id = $1', [adminId]);
    if (compExisting.rows[0].count === 0) {
      await pool.query(
        `INSERT INTO public.focus_comparisons (user_id, name, symbols, notes, is_favorite)
         VALUES 
          ($1, 'Top Layer 1 (BTC vs ETH vs SOL)', ARRAY['BTC', 'ETH', 'SOL'], 'เปรียบเทียบยักษ์ใหญ่สามเสาหลัก Layer 1', true),
          ($1, 'Altcoin Watch (ADA vs FLOCK)', ARRAY['ADA', 'FLOCK'], 'เปรียบเทียบเหรียญกระแสมาแรง', false)
        `,
        [adminId]
      );
      console.log(`[Phase 5 DB] Seeded starter comparisons for totokung.`);
    }
  }

  console.log('[Phase 5 DB] All Phase 5 schema & seeding complete!');
}

if (process.argv[1]?.includes('setup_phase5_db')) {
  setupPhase5Db().then(() => {
    pool.end();
  }).catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
}
