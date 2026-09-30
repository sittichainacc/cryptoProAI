import React from 'react';
import { Lock, ShieldAlert, LogIn, Sparkles, Gem, BarChart3, Zap, Layers, Award, Activity, ArrowRight, Crown } from 'lucide-react';

interface HomeAdminLockCardProps {
  type: 'workspace' | 'subsections';
  onOpenLogin: () => void;
  onOpenGold?: () => void;
}

export const HomeAdminLockCard: React.FC<HomeAdminLockCardProps> = ({
  type,
  onOpenLogin,
  onOpenGold,
}) => {
  if (type === 'workspace') {
    return (
      <div
        className="home-admin-workspace-lock"
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card, #111827)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '14px',
          overflow: 'hidden',
          marginBottom: '20px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 25px rgba(245, 158, 11, 0.12)',
          position: 'relative',
        }}
      >
        {/* Fake Workspace Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            fontSize: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 8px #F59E0B',
              }}
            />
            <span style={{ fontWeight: 800, color: 'var(--text-primary, #F8FAFC)', letterSpacing: '0.3px' }}>
              TRADING WORKSPACE (แบบชิดกัน ปรับสัดส่วนได้อิสระ)
            </span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            <Crown size={12} color="#F59E0B" />
            <span>สำหรับสมาชิก Premium เท่านั้น</span>
          </span>
        </div>

        {/* Lock Body */}
        <div
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(17, 24, 39, 0.95) 100%)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Crown size={32} color="#F59E0B" />
          </div>

          <h3
            style={{
              fontSize: '20px',
              fontWeight: 900,
              color: 'var(--text-primary, #F8FAFC)',
              margin: '0 0 8px',
              letterSpacing: '-0.3px',
            }}
          >
            สำหรับสมาชิก Premium เท่านั้น
          </h3>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-muted, #94A3B8)',
              maxWidth: '580px',
              lineHeight: 1.6,
              margin: '0 0 16px',
            }}
          >
            หน้าต่าง TRADING WORKSPACE มัลติพาเนล (Movers/Watchlist, กราฟเทรดสด TradingView, และสัญญาณ AI Live Signals) พร้อมฟังก์ชันลากปรับสัดส่วนหน้าจออิสระ <strong>สำหรับสมาชิก Premium เท่านั้น</strong>
          </p>

          {/* Pricing Highlight Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#FDE047',
              fontSize: '13px',
              fontWeight: 800,
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)',
            }}
          >
            <Sparkles size={15} />
            <span>ต้องสมัครสมาชิกเดือนละ 10 บาท / ปีละ 110 บาท</span>
          </div>

          {/* Quick feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <span style={pillStyle}>📊 กราฟสด TradingView Candlestick</span>
            <span style={pillStyle}>🎛️ ลากปรับสัดส่วน 3 หน้าต่างด้วยเมาส์</span>
            <span style={pillStyle}>⚡ AI Live Signals feeds</span>
          </div>

          <button
            onClick={onOpenLogin}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D97706')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F59E0B')}
          >
            <LogIn size={16} />
            <span>เข้าสู่ระบบในฐานะ Premium</span>
          </button>
        </div>
      </div>
    );
  }

  // Variant: subsections (ส่วนถัดจากกราฟ ดังภาพให้ดูได้เฉพาะสมาชิก Premium)
  return (
    <div
      className="home-admin-subsections-lock"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-card, #111827)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '20px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 25px rgba(245, 158, 11, 0.1)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
          backgroundColor: 'rgba(245, 158, 11, 0.06)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              boxShadow: '0 0 8px #F59E0B',
            }}
          />
          <span style={{ fontWeight: 800, color: 'var(--text-primary, #F8FAFC)', letterSpacing: '0.3px' }}>
            ส่วนประกอบวิเคราะห์เพิ่มเติม (ด้านล่างกราฟ)
          </span>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            border: '1px solid rgba(245, 158, 11, 0.4)',
          }}
        >
          <Crown size={12} color="#F59E0B" />
          <span>สำหรับสมาชิก Premium เท่านั้น</span>
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '34px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(17, 24, 39, 0.95) 100%)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Crown size={32} color="#F59E0B" />
        </div>

        <h3
          style={{
            fontSize: '20px',
            fontWeight: 900,
            color: 'var(--text-primary, #F8FAFC)',
            margin: '0 0 8px',
            letterSpacing: '-0.3px',
          }}
        >
          สำหรับสมาชิก Premium เท่านั้น
        </h3>

        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--text-muted, #94A3B8)',
            maxWidth: '620px',
            lineHeight: 1.6,
            margin: '0 0 16px',
          }}
        >
          ชุดตารางจัดอันดับเหรียญ, Top 5 Buy Now, ศูนย์วิเคราะห์พอร์ต ข่าว & เรดาร์อัจฉริยะ, 24 เหรียญตามกลุ่มอุตสาหกรรม, และตัวเด่น Top 3 Overall <strong>สำหรับสมาชิก Premium เท่านั้น</strong>
        </p>

        {/* Pricing Highlight Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(139, 92, 246, 0.2))',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: '#FDE047',
            fontSize: '13px',
            fontWeight: 800,
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)',
          }}
        >
          <Sparkles size={15} />
          <span>ต้องสมัครสมาชิกเดือนละ 10 บาท / ปีละ 110 บาท</span>
        </div>

        {/* 5 Locked Sections Preview List (ตรงตามภาพที่ผู้ใช้ส่งมา) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
            width: '100%',
            maxWidth: '820px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <LockedItemRow
            icon={<BarChart3 size={15} color="#10B981" />}
            title="ตารางจัดอันดับเหรียญคริปโตทั้งหมด (Crypto Screener & Ranking)"
            badge="357 เหรียญ"
          />
          <LockedItemRow
            icon={<Zap size={15} color="#10B981" />}
            title="Top 5 Buy Now — เหรียญที่มีจังหวะเข้าซื้อได้ ณ เวลานี้"
            badge="5 เหรียญ"
          />
          <LockedItemRow
            icon={<Activity size={15} color="#06B6D4" />}
            title="ศูนย์วิเคราะห์พอร์ต ข่าว และเรดาร์อัจฉริยะ"
            badge="5 วิดเจ็ต"
          />
          <LockedItemRow
            icon={<Layers size={15} color="#3B82F6" />}
            title="24 เหรียญแนะนำตามกลุ่มอุตสาหกรรม (8 สาย สายละ 3 ตัว)"
            badge="24 เหรียญ"
          />
          <LockedItemRow
            icon={<Award size={15} color="#F59E0B" />}
            title="ตัวเด่นที่สุดตอนนี้ (Top 3 Overall – Gold, Silver, Bronze)"
            badge="Top 3"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onOpenLogin}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D97706')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F59E0B')}
          >
            <LogIn size={16} />
            <span>เข้าสู่ระบบในฐานะ Premium</span>
          </button>

          {onOpenGold && (
            <button
              onClick={onOpenGold}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary, #F8FAFC)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#F59E0B')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)')}
            >
              <Gem size={15} color="#F59E0B" />
              <span>ไปยังหน้าสัญญาณทองคำ (เปิดให้ดูทุกคน)</span>
              <ArrowRight size={13} color="#F59E0B" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const pillStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-secondary, #CBD5E1)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
  padding: '4px 10px',
  borderRadius: '6px',
};

const LockedItemRow: React.FC<{ icon: React.ReactNode; title: string; badge: string }> = ({
  icon,
  title,
  badge,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      fontSize: '11.5px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
      {icon}
      <span
        style={{
          color: 'var(--text-primary, #F8FAFC)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={title}
      >
        {title}
      </span>
    </div>
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--text-muted, #94A3B8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '2px 6px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {badge}
    </span>
  </div>
);
