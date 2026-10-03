import { Request } from 'express';
import { pool } from './db.js';

export interface UserContext {
  id: string;
  username: string;
  role: string;
  max_watchlists: number;
  max_alerts: number;
  daily_api_quota: number;
}

/**
 * Resolve active User ID from request headers or default to guest user
 */
export async function resolveUserId(req: Request): Promise<string> {
  // 1. Explicit Header: x-user-id
  const headerId = req.headers['x-user-id'] as string;
  if (headerId && headerId.trim()) {
    return headerId.trim();
  }

  // 2. Header: x-username or query ?username=
  const username = (req.headers['x-username'] as string) || (req.query.username as string);
  if (username && username.trim()) {
    const res = await pool.query<{ id: string }>(
      'SELECT id FROM public.user_profiles WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [username.trim()]
    );
    if (res.rows.length > 0) return res.rows[0].id;
  }

  // 3. Fallback to default guest user 'crypto_guest'
  const guestRes = await pool.query<{ id: string }>(
    "SELECT id FROM public.user_profiles WHERE username = 'crypto_guest' LIMIT 1"
  );
  if (guestRes.rows.length > 0) return guestRes.rows[0].id;

  // 4. Ultimate fallback to first available active user
  const firstUser = await pool.query<{ id: string }>(
    'SELECT id FROM public.user_profiles ORDER BY created_at ASC LIMIT 1'
  );
  return firstUser.rows[0]?.id || '';
}

/**
 * Get full User Context from request
 */
export async function resolveUserContext(req: Request): Promise<UserContext | null> {
  const userId = await resolveUserId(req);
  if (!userId) return null;

  const res = await pool.query<UserContext>(
    'SELECT id, username, role, max_watchlists, max_alerts, daily_api_quota FROM public.user_profiles WHERE id = $1',
    [userId]
  );
  return res.rows[0] || null;
}
