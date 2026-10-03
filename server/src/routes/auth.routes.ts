import { Router, Request, Response } from 'express';
import { pool } from '../database/db.js';
import { resolveUserId } from '../database/auth.middleware.js';

export const authRouter = Router();

interface IpLockoutRecord {
  attempts: number; // 0, 1, 2, 3
  isLocked: boolean;
  lockedAt?: number;
  ip: string;
  lastAttemptAt: number;
}

// In-memory map of client IP -> Lockout status
const ipLockouts = new Map<string, IpLockoutRecord>();

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

/**
 * GET /api/auth/status
 * Check current IP lockout and attempts status
 */
authRouter.get('/status', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const record = ipLockouts.get(ip) || {
    attempts: 0,
    isLocked: false,
    ip,
    lastAttemptAt: Date.now(),
  };

  res.json({
    success: true,
    data: {
      ip,
      attempts: record.attempts,
      maxAttempts: 3,
      isLocked: record.isLocked,
      lockedAt: record.lockedAt,
    },
  });
});

/**
 * GET /api/auth/me
 * Return current logged in user profile from Supabase PostgreSQL
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, username, email, full_name, avatar_url, role, status,
              daily_api_quota, max_watchlists, max_alerts,
              can_access_whale_radar, can_access_quant_v3, can_access_focus, can_export_pdf,
              notes, last_login_at, created_at
       FROM public.user_profiles
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error fetching auth me:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials against Supabase PostgreSQL public.user_profiles
 * Locked on 3 failed attempts (1/3, 2/3, 3/3)
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  let record = ipLockouts.get(ip);
  if (!record) {
    record = { attempts: 0, isLocked: false, ip, lastAttemptAt: Date.now() };
    ipLockouts.set(ip, record);
  }

  // If already locked out
  if (record.isLocked) {
    return res.status(403).json({
      success: false,
      isLocked: true,
      attempts: record.attempts,
      maxAttempts: 3,
      ip,
      message: `ไอพีเครื่องนี้ (${ip}) ถูกระงับการเข้าสู่ระบบเนื่องจากใส่รหัสผ่านผิดครบ 3 ครั้ง ปุ่มทั้งหมดจะถูกปิดการใช้งาน`,
    });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
    });
  }

  try {
    // 1. Query user from PostgreSQL database
    const userRes = await pool.query(
      `SELECT id, username, email, full_name, avatar_url, role, status, password,
              daily_api_quota, max_watchlists, max_alerts,
              can_access_whale_radar, can_access_quant_v3, can_access_focus, can_export_pdf
       FROM public.user_profiles 
       WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
      [username.trim()]
    );

    const user = userRes.rows[0];

    // Check account status
    if (user && user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน (BLOCKED) กรุณาติดต่อผู้ดูแลระบบ',
      });
    }

    // Fixed credentials fallback for admin accounts
    const isAdminFallback = (
      (username === 'fuyu' && password === 'haru') ||
      (username === 'totokung' && password === 'Ss@crypto')
    );

    const isPasswordCorrect = user && (user.password === password || isAdminFallback);

    if (isPasswordCorrect) {
      // Reset lockout counter on success
      record.attempts = 0;
      record.isLocked = false;
      ipLockouts.set(ip, record);

      // Update last_login_at in database
      await pool.query(
        'UPDATE public.user_profiles SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
        [user.id]
      );

      const returnedUser = {
        id: user.id,
        username: user.username,
        name: user.full_name || user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role,
        status: user.status,
        dailyApiQuota: user.daily_api_quota,
        maxWatchlists: user.max_watchlists,
        maxAlerts: user.max_alerts,
        canAccessWhaleRadar: user.can_access_whale_radar,
        canAccessQuantV3: user.can_access_quant_v3,
        canAccessFocus: user.can_access_focus,
        canExportPdf: user.can_export_pdf,
        loggedInAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        isLocked: false,
        attempts: 0,
        maxAttempts: 3,
        user: returnedUser,
        message: `เข้าสู่ระบบสำเร็จ — ยินดีต้อนรับ ${returnedUser.name} (${user.role.toUpperCase()})`,
      });
    }

    // Failed login: increment attempts
    record.attempts += 1;
    record.lastAttemptAt = Date.now();

    if (record.attempts >= 3) {
      record.isLocked = true;
      record.lockedAt = Date.now();
      ipLockouts.set(ip, record);

      return res.status(403).json({
        success: false,
        isLocked: true,
        attempts: 3,
        maxAttempts: 3,
        ip,
        message: `รหัสผ่านไม่ถูกต้อง (ครั้งที่ 3/3) ไอพีเครื่องของท่าน (${ip}) ถูกระงับการเข้าสู่ระบบ ปุ่มทั้งหมดจะถูกปิดการใช้งาน`,
      });
    }

    ipLockouts.set(ip, record);

    return res.status(401).json({
      success: false,
      isLocked: false,
      attempts: record.attempts,
      maxAttempts: 3,
      ip,
      message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ครั้งที่ ${record.attempts}/3)`,
    });
  } catch (err: any) {
    console.error('Error during login:', err.message);
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: ${err.message}`,
    });
  }
});

/**
 * POST /api/auth/reset-lock
 * Optional reset endpoint for test / dev environment
 */
authRouter.post('/reset-lock', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  ipLockouts.delete(ip);
  res.json({ success: true, message: `ปลดล็อกไอพี ${ip} เรียบร้อยแล้ว` });
});
