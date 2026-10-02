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
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const altClientDistPath = path.resolve(__dirname, '../public');
const containerPublicPath = path.resolve(process.cwd(), 'public');

const staticDir = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(altClientDistPath)
  ? altClientDistPath
  : fs.existsSync(containerPublicPath)
  ? containerPublicPath
  : null;

if (staticDir) {
  console.log(`[Static] Serving frontend static assets from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
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

  // Start Bitkub & Binance background sync
  await marketService.start();
});


