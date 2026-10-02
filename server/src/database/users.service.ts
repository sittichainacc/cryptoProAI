import { pool } from './db.js';

export type UserRole = 'free' | 'gold' | 'premium' | 'platinum' | 'admin';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

export interface UserProfile {
  id: string;
  user_id?: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  daily_api_quota: number;
  max_watchlists: number;
  max_alerts: number;
  can_access_whale_radar: boolean;
  can_access_quant_v3: boolean;
  can_access_focus: boolean;
  can_export_pdf: boolean;
  notes?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export const TIER_DEFINITIONS = [
  {
    role: 'free' as UserRole,
    titleTh: 'ผู้ใช้งานทั่วไป (Free Tier)',
    titleEn: 'General User / Free Tier',
    level: 1,
    badgeColor: '#64748B',
    accentColor: '#94A3B8',
    descriptionTh: 'สมัครสมาชิกเข้าใช้งานฟรี ไม่มีค่าใช้จ่าย เข้าถึงฟังก์ชันพื้นฐาน มีโฆษณาคั่นและจำกัดโควต้า',
    dailyQuota: 50,
    maxWatchlists: 5,
    maxAlerts: 3,
    whaleRadar: false,
    quantV3: false,
    focusWorkstation: false,
    exportPdf: false,
    features: [
      'ดูภาพรวมตลาดและ KPI รวม 5 การ์ด',
      'ราคาเหรียญแบบเรียลไทม์ 10 อันดับแรก',
      'กราฟแท่งเทียนพื้นฐาน (Candlestick)',
      'บันทึกเหรียญใน Watchlist สูงสุด 5 ตัว',
      'แจ้งเตือนราคาทางหน้าจอ 3 รายการ',
    ],
  },
  {
    role: 'gold' as UserRole,
    titleTh: 'ผู้ใช้งานระดับ Gold (Gold Member)',
    titleEn: 'Gold Member',
    level: 2,
    badgeColor: '#F59E0B',
    accentColor: '#FBBF24',
    descriptionTh: 'สมาชิกเริ่มต้นแบบเสียค่าบริการ ได้รับสิทธิประโยชน์เพิ่ม ปิดโฆษณา เข้าถึง 24 เหรียญแนะนำ 8 Sector',
    dailyQuota: 300,
    maxWatchlists: 15,
    maxAlerts: 10,
    whaleRadar: false,
    quantV3: false,
    focusWorkstation: false,
    exportPdf: false,
    features: [
      'ปลดล็อกฟังก์ชันผู้ใช้งานทั่วไปทั้งหมด',
      'ไม่มีโฆษณาคั่น 100% (Ad-Free Experience)',
      'ปลดล็อก Widget 24 เหรียญแนะนำครบ 8 Sectors',
      'กราฟเทคนิคอลพร้อม 17 Indicators Matrix & MTF',
      'บันทึกเหรียญใน Watchlist เพิ่มเป็น 15 ตัว',
      'ตั้งแจ้งเตือนราคา & RSI ได้ 10 รายการ',
    ],
  },
  {
    role: 'premium' as UserRole,
    titleTh: 'ผู้ใช้งานระดับ Premium (Premium Member)',
    titleEn: 'Premium Member',
    level: 3,
    badgeColor: '#A855F7',
    accentColor: '#C084FC',
    descriptionTh: 'ปลดล็อกฟังก์ชันเกือบทั้งหมดของแพลตฟอร์ม เข้าถึง AI Signals 11 รูปแบบ และ AI Screener 8 โหมด',
    dailyQuota: 1500,
    maxWatchlists: 30,
    maxAlerts: 25,
    whaleRadar: false,
    quantV3: true,
    focusWorkstation: true,
    exportPdf: true,
    features: [
      'ปลดล็อกสิทธิประโยชน์ของระดับ Gold ทั้งหมด',
      'สัญญาณ AI Signals Real-Time 11 สถานะพร้อมบทวิเคราะห์ภาษาไทย',
      'Coin Screener 8 โหมดคัดกรองเหรียญแบบเชิงลึก',
      'ระบบบริหารความเสี่ยง Portfolio & Position Sizing Calculator',
      'เข้าถึงระบบ FOCUS Multi-Coin Compare & Alpha Flow',
      'สิทธิ์ดาวน์โหลดรายงานสภาวะตลาดเป็น PDF',
      'ช่องทางบริการลูกค้าแบบเร่งด่วน (Priority Support)',
    ],
  },
  {
    role: 'platinum' as UserRole,
    titleTh: 'ผู้ใช้งานระดับ Platinum (Platinum Member)',
    titleEn: 'Platinum Member (VIP Tier)',
    level: 4,
    badgeColor: '#06B6D4',
    accentColor: '#22D3EE',
    descriptionTh: 'ระดับสูงสุดในกลุ่มลูกค้า (Top Tier VIP) สิทธิประโยชน์เหนือระดับ ปลดล็อก Whale Radar และ Quant V3',
    dailyQuota: 100000,
    maxWatchlists: 100,
    maxAlerts: 100,
    whaleRadar: true,
    quantV3: true,
    focusWorkstation: true,
    exportPdf: true,
    features: [
      'สิทธิ์สูงสุดของกลุ่มลูกค้า (All Customer Features Unlocked)',
      'Whale Radar: เรดาร์ตรวจจับธุรกรรมเจ้ามือและกระเป๋าวาฬขนาดใหญ่',
      'Quant V3 Institutional Opportunity Hunter 100% Realtime',
      'Institutional Gold Signal & Alpha Flow Dynamics ทุก Timeframe',
      'เข้าถึงฟีเจอร์และอัลกอริทึมเวอร์ชันใหม่อย่างรวดเร็ว (Early Access)',
      'โควต้า API และ Watchlist ไม่จำกัด (Unlimited Usage)',
      'VIP Account Manager & กลุ่มวิเคราะห์พิเศษเฉพาะกลุ่ม Platinum',
    ],
  },
  {
    role: 'admin' as UserRole,
    titleTh: 'ผู้ดูแลระบบ (Administrator)',
    titleEn: 'Admin / Administrator',
    level: 5,
    badgeColor: '#EF4444',
    accentColor: '#F87171',
    descriptionTh: 'ผู้ควบคุมระบบ มีอำนาจสูงสุด จัดการข้อมูล อนุมัติหรือบล็อกผู้ใช้ เปลี่ยนแปลงสิทธิ์ และดูแลความปลอดภัย',
    dailyQuota: 999999,
    maxWatchlists: 999,
    maxAlerts: 999,
    whaleRadar: true,
    quantV3: true,
    focusWorkstation: true,
    exportPdf: true,
    features: [
      'สิทธิ์ควบคุมระบบสูงสุด 100% (Full Super-Admin Access)',
      'ระบบบริหารจัดการผู้ใช้ (User Management Dashboard): เพิ่ม/ลบ/แก้ไข/บล็อก',
      'สิทธิ์สลับและปรับระดับ Role (5 Tiers) ให้แก่ผู้ใช้งานทุกคน',
      'จัดการฐานข้อมูล Supabase PostgreSQL & API Key Settings',
      'ตรวจสอบ Audit Logs & ความปลอดภัยของระบบอย่างละเอียด',
    ],
  },
];

export class UsersService {
  /**
   * Get all user profiles with optional search and role filtering
   */
  async getAllUsers(filters?: { search?: string; role?: string; status?: string }): Promise<UserProfile[]> {
    try {
      let sql = 'SELECT * FROM public.user_profiles WHERE 1=1';
      const params: any[] = [];

      if (filters?.role && filters.role !== 'all') {
        params.push(filters.role);
        sql += ` AND role = $${params.length}`;
      }

      if (filters?.status && filters.status !== 'all') {
        params.push(filters.status);
        sql += ` AND status = $${params.length}`;
      }

      if (filters?.search) {
        params.push(`%${filters.search.toLowerCase()}%`);
        sql += ` AND (LOWER(username) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(COALESCE(full_name, '')) LIKE $${params.length})`;
      }

      sql += ' ORDER BY created_at ASC';

      const res = await pool.query(sql, params);
      return res.rows;
    } catch (err: any) {
      console.error('[UsersService] Error fetching users from DB:', err.message);
      return [];
    }
  }

  /**
   * Get User by ID
   */
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const res = await pool.query('SELECT * FROM public.user_profiles WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch (err: any) {
      console.error('[UsersService] Error fetching user by id:', err.message);
      return null;
    }
  }

  /**
   * Get User by Username
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      const res = await pool.query('SELECT * FROM public.user_profiles WHERE LOWER(username) = LOWER($1)', [username]);
      return res.rows[0] || null;
    } catch (err: any) {
      console.error('[UsersService] Error fetching user by username:', err.message);
      return null;
    }
  }

  /**
   * Create New User
   */
  async createUser(data: {
    username: string;
    email: string;
    full_name?: string;
    role?: UserRole;
    notes?: string;
  }): Promise<UserProfile | null> {
    const role: UserRole = data.role || 'free';
    const tier = TIER_DEFINITIONS.find(t => t.role === role) || TIER_DEFINITIONS[0];

    try {
      const query = `
        INSERT INTO public.user_profiles (
          username, email, full_name, role, status, 
          daily_api_quota, max_watchlists, max_alerts, 
          can_access_whale_radar, can_access_quant_v3, can_access_focus, can_export_pdf, notes
        ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;
      const values = [
        data.username.trim().toLowerCase(),
        data.email.trim().toLowerCase(),
        data.full_name || data.username,
        role,
        tier.dailyQuota,
        tier.maxWatchlists,
        tier.maxAlerts,
        tier.whaleRadar,
        tier.quantV3,
        tier.focusWorkstation,
        tier.exportPdf,
        data.notes || null,
      ];

      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err: any) {
      console.error('[UsersService] Error creating user:', err.message);
      throw err;
    }
  }

  /**
   * Update User Role (5-Tier Switch)
   */
  async updateUserRole(id: string, newRole: UserRole): Promise<UserProfile | null> {
    const tier = TIER_DEFINITIONS.find(t => t.role === newRole);
    if (!tier) throw new Error(`Invalid role: ${newRole}`);

    try {
      const query = `
        UPDATE public.user_profiles
        SET 
          role = $1,
          daily_api_quota = $2,
          max_watchlists = $3,
          max_alerts = $4,
          can_access_whale_radar = $5,
          can_access_quant_v3 = $6,
          can_access_focus = $7,
          can_export_pdf = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING *;
      `;
      const values = [
        newRole,
        tier.dailyQuota,
        tier.maxWatchlists,
        tier.maxAlerts,
        tier.whaleRadar,
        tier.quantV3,
        tier.focusWorkstation,
        tier.exportPdf,
        id,
      ];

      const res = await pool.query(query, values);
      return res.rows[0] || null;
    } catch (err: any) {
      console.error('[UsersService] Error updating user role:', err.message);
      throw err;
    }
  }

  /**
   * Update User Status (ACTIVE / BLOCKED)
   */
  async updateUserStatus(id: string, newStatus: UserStatus): Promise<UserProfile | null> {
    try {
      const res = await pool.query(
        'UPDATE public.user_profiles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newStatus, id]
      );
      return res.rows[0] || null;
    } catch (err: any) {
      console.error('[UsersService] Error updating user status:', err.message);
      throw err;
    }
  }

  /**
   * Delete User
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await pool.query('DELETE FROM public.user_profiles WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.error('[UsersService] Error deleting user:', err.message);
      throw err;
    }
  }

  /**
   * Get Tier Statistics
   */
  async getTierStats(): Promise<Record<string, number>> {
    try {
      const res = await pool.query(`
        SELECT role, COUNT(*)::int as count 
        FROM public.user_profiles 
        GROUP BY role
      `);
      const stats: Record<string, number> = {
        total: 0,
        free: 0,
        gold: 0,
        premium: 0,
        platinum: 0,
        admin: 0,
      };

      res.rows.forEach(r => {
        stats[r.role] = r.count;
        stats.total += r.count;
      });

      return stats;
    } catch {
      return { total: 5, free: 1, gold: 1, premium: 1, platinum: 1, admin: 1 };
    }
  }
}

export const usersService = new UsersService();
