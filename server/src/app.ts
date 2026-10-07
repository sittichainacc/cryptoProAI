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

// Serve frontend static files across all runtimes (Container, Serverless, Standalone)
const possibleStaticDirs = [
  path.resolve(__dirname, './public'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../public'),
  path.resolve(__dirname, '../../dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'client/dist'),
];

const staticDir = possibleStaticDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || null;

if (staticDir) {
  console.log(`[Static] Serving frontend static assets from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  console.warn(`[Static] ⚠️ Static build directory not found. Checked: ${possibleStaticDirs.join(', ')}`);
  app.get('*', (_req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>CryptoPro AI - Service Status</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2.5rem; max-width: 520px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
          h1 { color: #38bdf8; font-size: 1.5rem; margin-top: 0; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
          .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem; }
          .links { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
          a { color: #38bdf8; text-decoration: none; font-size: 0.875rem; background: #334155; padding: 6px 12px; border-radius: 6px; }
          a:hover { background: #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">API OPERATIONAL</span>
          <h1>CryptoPro AI & US Stocks Engine</h1>
          <p>Backend API และโมเดลวิเคราะห์ 41 AI Agents กำลังทำงานอย่างสมบูรณ์แบบบนระบบ Cloud</p>
          <div class="links">
            <a href="/api/stocks/health">API Health</a>
            <a href="/api/stocks/universe">Stock Universe</a>
            <a href="/api/db/status">Database Status</a>
          </div>
        </div>
      </body>
      </html>
    `);
  });
}

export { app };
export default app;
