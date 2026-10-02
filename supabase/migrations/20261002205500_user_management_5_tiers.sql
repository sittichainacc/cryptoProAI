-- ====================================================================
-- CryptoPro AI — 5-Tier User Management System Schema
-- Tiers: free (ผู้ใช้งานทั่วไป), gold (Gold Member), premium (Premium Member), 
--        platinum (Platinum Member), admin (ผู้ดูแลระบบ)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'gold', 'premium', 'platinum', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'PENDING')),
  daily_api_quota INT NOT NULL DEFAULT 50,
  max_watchlists INT NOT NULL DEFAULT 5,
  max_alerts INT NOT NULL DEFAULT 3,
  can_access_whale_radar BOOLEAN NOT NULL DEFAULT false,
  can_access_quant_v3 BOOLEAN NOT NULL DEFAULT false,
  can_access_focus BOOLEAN NOT NULL DEFAULT false,
  can_export_pdf BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of profiles"
  ON public.user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access or self-update"
  ON public.user_profiles FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- Seed Default Demo Users for all 5 Tiers
INSERT INTO public.user_profiles (
  username, email, full_name, role, status, daily_api_quota, max_watchlists, max_alerts, 
  can_access_whale_radar, can_access_quant_v3, can_access_focus, can_export_pdf, notes
) VALUES
  ('fuyu', 'admin@cryptopro.ai', 'Admin Fuyu (Super Admin)', 'admin', 'ACTIVE', 999999, 999, 999, true, true, true, true, 'ผู้ดูแลระบบสูงสุด สิทธิ์การควบคุมระบบครบวงจร'),
  ('sittichai_vip', 'sittichai.nacc@gmail.com', 'สิทธิชัย (Platinum VIP)', 'platinum', 'ACTIVE', 100000, 100, 100, true, true, true, true, 'สมาชิกระดับ Platinum ได้สิทธิ์ Whale Radar, Quant V3, Focus และ Gold Signal ครบถ้วน'),
  ('somchai_pro', 'somchai.trader@crypto.co', 'สมชาย เทรดเดอร์ (Premium)', 'premium', 'ACTIVE', 1500, 30, 20, false, true, true, true, 'สมาชิก Premium เข้าถึง AI Signals 11 รูปแบบ และระบบวิเคราะห์เชิงลึก'),
  ('nisa_gold', 'nisa.investor@goldmail.com', 'ณิสา การลงทุน (Gold Member)', 'gold', 'ACTIVE', 300, 15, 10, false, false, false, false, 'สมาชิก Gold ปิดโฆษณา ดูได้ 24 เหรียญแนะนำ 8 Sector พร้อมสัญญาณเทคนิคอล 17 ค่า'),
  ('crypto_guest', 'newbie.user@gmail.com', 'ผู้ใช้งานทั่วไป (Free Tier)', 'free', 'ACTIVE', 50, 5, 3, false, false, false, false, 'ผู้ใช้งานเริ่มต้น สมัครใช้งานฟรี ดูภาพรวมตลาดและเหรียญหลัก')
ON CONFLICT (username) DO UPDATE 
SET 
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  daily_api_quota = EXCLUDED.daily_api_quota,
  can_access_whale_radar = EXCLUDED.can_access_whale_radar,
  can_access_quant_v3 = EXCLUDED.can_access_quant_v3,
  can_access_focus = EXCLUDED.can_access_focus,
  can_export_pdf = EXCLUDED.can_export_pdf;
