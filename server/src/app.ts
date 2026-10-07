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
import { stocksRouter } from './modules/stocks/routes/stocks.routes.js';
import { pool } from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Standard API Routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);
app.use('/api/gold', goldRouter);
app.use('/api/users', usersRouter);
app.use('/api/stocks', stocksRouter);

// Direct routes (fallback in case serverless proxy rewrites /api prefix)
app.use('/auth', authRouter);
app.use('/gold', goldRouter);
app.use('/users', usersRouter);
app.use('/stocks', stocksRouter);

// Database Health & Status check
app.get(['/api/db/status', '/db/status'], async (_req, res) => {
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
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static files if client/dist or public folder exists (Production Container & Local Server)
if (!process.env.VERCEL) {
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
    app.get('/', (_req, res) => {
      res.send('CryptoPro AI API Server is running. Frontend static build not found.');
    });
  }
}

export { app };
export default app;
