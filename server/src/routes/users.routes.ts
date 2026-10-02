import { Router, Request, Response } from 'express';
import { usersService, TIER_DEFINITIONS, UserRole, UserStatus } from '../database/users.service.js';

export const usersRouter = Router();

/**
 * GET /api/users/tiers
 * Returns definition of all 5 tiers and privilege matrix
 */
usersRouter.get('/tiers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: TIER_DEFINITIONS,
  });
});

/**
 * GET /api/users
 * Returns list of users with optional filtering & tier stats
 */
usersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, role, status } = req.query;
    const users = await usersService.getAllUsers({
      search: typeof search === 'string' ? search : undefined,
      role: typeof role === 'string' ? role : undefined,
      status: typeof status === 'string' ? status : undefined,
    });
    const stats = await usersService.getTierStats();

    res.json({
      success: true,
      data: {
        users,
        stats,
        total: users.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/users/:id
 * Get single user by ID
 */
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await usersService.getUserById(String(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users
 * Create a new user with tier
 */
usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username, email, full_name, role, notes } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก Username และ Email ให้ครบถ้วน' });
    }

    const existing = await usersService.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, message: `Username "${username}" มีผู้ใช้งานแล้ว` });
    }

    const newUser = await usersService.createUser({
      username,
      email,
      full_name,
      role: role as UserRole,
      notes,
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: `สร้างผู้ใช้งาน ${username} ระดับสิทธิ์ ${role || 'free'} เรียบร้อยแล้ว`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/users/:id/role
 * Switch user role among the 5 tiers
 */
usersRouter.patch('/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles: UserRole[] = ['free', 'gold', 'premium', 'platinum', 'admin'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `สิทธิ์ไม่ถูกต้อง สิทธิ์ที่รองรับ: ${validRoles.join(', ')}`,
      });
    }

    const updated = await usersService.updateUserRole(String(req.params.id), role);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' });
    }

    const tierInfo = TIER_DEFINITIONS.find(t => t.role === role);

    res.json({
      success: true,
      data: updated,
      message: `ปรับระดับสิทธิ์ผู้ใช้ ${updated.username} เป็น "${tierInfo?.titleTh}" เรียบร้อยแล้ว`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/users/:id/status
 * Block / Unblock user
 */
usersRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'BLOCKED' && status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง (ACTIVE, BLOCKED, PENDING)' });
    }

    const updated = await usersService.updateUserStatus(String(req.params.id), status as UserStatus);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' });
    }

    res.json({
      success: true,
      data: updated,
      message: `อัปเดตสถานะของ ${updated.username} เป็น ${status} เรียบร้อยแล้ว`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user from database
 */
usersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await usersService.deleteUser(String(req.params.id));
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
    }
    res.json({ success: true, message: 'ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
