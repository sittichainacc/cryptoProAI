import { Router, Request, Response } from 'express';

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
 * POST /api/auth/login
 * Fixed credentials: username = fuyu, password = haru
 * Locked on 3 failed attempts (1/3, 2/3, 3/3)
 */
authRouter.post('/login', (req: Request, res: Response) => {
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

  // Admin credentials list
  const ADMIN_CREDENTIALS = [
    { username: 'fuyu',     password: 'haru',       name: 'Admin Fuyu'     },
    { username: 'totokung', password: 'Ss@crypto',  name: 'Admin Totokung' },
  ];

  const matchedAdmin = ADMIN_CREDENTIALS.find(
    (c) => c.username === username && c.password === password
  );

  // Check admin fixed credentials
  if (matchedAdmin) {
    // Reset attempt count upon successful authentication
    record.attempts = 0;
    record.isLocked = false;
    ipLockouts.set(ip, record);

    return res.json({
      success: true,
      isLocked: false,
      attempts: 0,
      maxAttempts: 3,
      user: {
        username: matchedAdmin.username,
        name: matchedAdmin.name,
        role: 'admin',
        loggedInAt: new Date().toISOString(),
      },
      message: `เข้าสู่ระบบผู้ดูแลระบบ (Admin) สำเร็จ — ยินดีต้อนรับ ${matchedAdmin.name}`,
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
