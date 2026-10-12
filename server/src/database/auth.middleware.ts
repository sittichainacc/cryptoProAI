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

  // 3. Fallback (Bypass Mode): Default to active Admin user 'totokung' or any admin in DB
  const adminRes = await pool.query<{ id: string }>(
    "SELECT id FROM public.user_profiles WHERE username = 'totokung' OR role = 'admin' ORDER BY created_at ASC LIMIT 1"
  );
  if (adminRes.rows.length > 0) return adminRes.rows[0].id;

  // 4. Fallback to default guest user 'crypto_guest'
  const guestRes = await pool.query<{ id: string }>(
    "SELECT id FROM public.user_profiles WHERE username = 'crypto_guest' LIMIT 1"
  );
  if (guestRes.rows.length > 0) return guestRes.rows[0].id;

  // 5. Ultimate fallback to first available active user
  const firstUser = await pool.query<{ id: string }>(
    'SELECT id FROM public.user_profiles ORDER BY created_at ASC LIMIT 1'
  );
  return firstUser.rows[0]?.id || '';
}

/**
 * Get full User Context from request (Temporarily bypassed with full Admin privileges)
 */
export async function resolveUserContext(req: Request): Promise<UserContext | null> {
  const userId = await resolveUserId(req);
  if (!userId) {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'totokung',
      role: 'admin',
      max_watchlists: 999,
      max_alerts: 999,
      daily_api_quota: 99999,
    };
  }

  const res = await pool.query<UserContext>(
    'SELECT id, username, role, max_watchlists, max_alerts, daily_api_quota FROM public.user_profiles WHERE id = $1',
    [userId]
  );
  if (res.rows[0]) {
    // ปิดระบบจำกัดสิทธิ์ชั่วคราว: มอบสิทธิ์ Admin และโควต้าสูงสุดให้ใช้งานได้ครบทุกส่วน
    return {
      ...res.rows[0],
      role: 'admin',
      max_watchlists: 999,
      max_alerts: 999,
      daily_api_quota: 99999,
    };
  }
  return {
    id: userId,
    username: 'totokung',
    role: 'admin',
    max_watchlists: 999,
    max_alerts: 999,
    daily_api_quota: 99999,
  };
}

export const ROLE_HIERARCHY: Record<string, number> = {
  free: 1,
  gold: 2,
  premium: 3,
  platinum: 4,
  admin: 5,
};

/**
 * Middleware to enforce minimum role tier requirement (Temporarily bypassed for open access)
 */
export function requireMinRole(_minRole: 'free' | 'gold' | 'premium' | 'platinum' | 'admin') {
  return async (req: Request, _res: any, next: any) => {
    try {
      // ปิดชั่วคราว: อนุญาตให้ทุกส่วนเข้าถึงได้ทันทีโดยไม่ต้อง login หรือตรวจสอบระดับสมาชิก
      const user = await resolveUserContext(req);
      (req as any).user = user;
      next();
    } catch (_err: any) {
      next();
    }
  };
}

/**
 * Middleware to enforce Super-Admin access only (Temporarily bypassed)
 */
export const requireAdmin = requireMinRole('admin');
