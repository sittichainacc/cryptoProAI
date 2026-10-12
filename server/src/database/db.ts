import pg from 'pg';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Ensure .env is loaded even if run from project root or subdirectories
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  } catch (_e) {
    // ignore
  }
}

const { Pool } = pg;

export const dbConfig = {
  host: process.env.DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.sfotlpjydhdpcmkooqwr',
  password: process.env.DB_PASSWORD || 'vhV2AHJp#k#g27%',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(dbConfig);

// Helper function for running queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Test Database Connection to Supabase PostgreSQL
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT NOW() as current_time, version()');
    console.log(`[Supabase DB] ✅ Connected successfully to PostgreSQL on Supabase!`);
    console.log(`[Supabase DB] Server Time: ${res.rows[0].current_time}`);
    return true;
  } catch (err: any) {
    console.error(`[Supabase DB] ❌ Connection failed:`, err.message);
    return false;
  }
}
