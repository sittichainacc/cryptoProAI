import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { goldRouter } from './routes/gold.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { marketService } from './services/market.service.js';
import { testDbConnection, pool } from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);
app.use('/api/gold', goldRouter);
app.use('/api/users', usersRouter);

// Database Health & Status check
app.get('/api/db/status', async (_req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version()');
    const latency = Date.now() - start;
    res.json({
      connected: true,
      provider: 'Supabase PostgreSQL',
      host: process.env.DB_HOST || 'db.sfotlpjydhdpcmkooqwr.supabase.co',
      database: process.env.DB_NAME || 'postgres',
      time: result.rows[0].current_time,
      version: result.rows[0].version,
      latencyMs: latency,
    });
  } catch (error: any) {
    res.status(500).json({
      connected: false,
      provider: 'Supabase PostgreSQL',
      error: error.message,
    });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static files if client/dist or public folder exists (Production Container)
const possibleStaticDirs = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../public'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, './public'),
];

const staticDir = possibleStaticDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || null;

if (staticDir) {
  console.log(`[Static] Serving frontend static assets from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  console.warn(`[Static] ⚠️ No frontend build found. Looked in: ${possibleStaticDirs.join(', ')}`);
  app.get('/', (_req, res) => {
    res.send('CryptoPro AI API Server is running. Frontend static build not found.');
  });
}

// Start Server & Poller
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(` CryptoPro AI Backend Server Running on Port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/market/kpis`);
  console.log(` Supabase DB Status: http://localhost:${PORT}/api/db/status`);
  console.log(`====================================================`);
  
  // Test connection to Supabase PostgreSQL database
  await testDbConnection();

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


