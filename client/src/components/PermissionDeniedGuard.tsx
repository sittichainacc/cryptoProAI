import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, LogIn, Sparkles, CheckCircle2, Shield } from 'lucide-react';

interface PermissionDeniedGuardProps {
  featureTitle: string;
  onOpenLogin: () => void;
  onGoBack: () => void;
  description?: string;
}

export const PermissionDeniedGuard: React.FC<PermissionDeniedGuardProps> = ({
  featureTitle,
  onOpenLogin,
  onGoBack,
  description,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        padding: '30px 20px',
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <div
        className="crypto-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.15)',
          padding: '36px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        {/* Shield Lock Icon with Dual Rings */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '20px',
            margin: '0 auto 20px auto',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(153, 27, 27, 0.4))',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)',
            position: 'relative',
          }}
        >
          <ShieldAlert size={38} color="#EF4444" />
        </div>

        {/* Notice Heading (Exact wording requested by user: ท่านไม่มีสิทธิดูส่วนนี้) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '11.5px',
            fontWeight: 800,
            marginBottom: '12px',
            letterSpacing: '0.4px',
          }}
        >
          <Lock size={12} />
          <span>RESTRICTED ACCESS • ADMIN ONLY</span>
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
            letterSpacing: '-0.3px',
          }}
        >
          ท่านไม่มีสิทธิ์ดูส่วนนี้
        </h1>

        <div
          style={{
            fontSize: '13.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '20px',
            maxWidth: '440px',
            margin: '0 auto 20px auto',
          }}
        >
          ส่วน <strong style={{ color: 'var(--neon-cyan)' }}>"{featureTitle}"</strong> ถูกจำกัดสิทธิ์เฉพาะ{' '}
          <strong style={{ color: '#F59E0B' }}>ผู้ดูแลระบบ (Admin)</strong> เท่านั้น{' '}
          {description || 'เพื่อความปลอดภัยและการจัดการข้อมูลเชิงลึกขั้นสูง กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ'}
        </div>

        {/* Admin privileges included in this access */}
        <div
          style={{
            backgroundColor: 'var(--bg-card-inner)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '26px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              marginBottom: '10px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            ฟีเจอร์ระดับ Admin ที่ได้รับการปกป้อง:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { text: 'Top 5 Premium (สูตรอัลกอริทึม 20 ขั้นตอน คัด 5 เหรียญพร้อมจุดเข้า-ออก)', active: featureTitle.includes('Top 5 Premium') },
              { text: 'วิเคราะห์เชิงลึก (โมเดลคำนวณ CVD, Volatility, Regime & AI Edge Matrix)', active: featureTitle.includes('วิเคราะห์เชิงลึก') },
              { text: 'รายการเฝ้าดู (Watchlist & Real-time Institutional Tracking)', active: featureTitle.includes('เฝ้าดู') || featureTitle.includes('Watchlist') },
              { text: 'วิเคราะห์พอร์ต & เสี่ยง (Portfolio Risk & VaR Stress Test)', active: featureTitle.includes('พอร์ต') },
              { text: 'การตั้งค่าระบบ (System Settings & API Key Exchange Controls)', active: featureTitle.includes('ตั้งค่า') },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: item.active ? '#FDE047' : '#94A3B8',
                  fontWeight: item.active ? 700 : 500,
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: item.active ? '#F59E0B' : 'rgba(255, 255, 255, 0.25)',
                    boxShadow: item.active ? '0 0 8px #F59E0B' : 'none',
                    flexShrink: 0,
                  }}
                />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenLogin}
            className="btn-primary"
            style={{
              padding: '11px 22px',
              fontSize: '13.5px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
              border: 'none',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              cursor: 'pointer',
            }}
          >
            <LogIn size={16} />
            <span>เข้าสู่ระบบในฐานะ Admin</span>
          </button>

          <button
            onClick={onGoBack}
            style={{
              padding: '11px 18px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับสู่หน้าหลัก</span>
          </button>
        </div>

        {/* Hint footer */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Shield size={13} color="#64748B" />
          <span>ระบบรักษาความปลอดภัยจำกัดสิทธิ์: รหัสผ่านผิด 3 ครั้งจะระงับไอพีทันที</span>
        </div>
      </div>
    </div>
  );
};
