import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  TrendingUp, 
  ScanLine, 
  FileText, 
  BarChart2, 
  Sparkles, 
  Eye, 
  PieChart, 
  Bell, 
  Wrench, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Award,
  Crown,
  Target,
  Gem,
  Lock,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userRole?: 'admin' | 'platinum' | 'premium' | 'gold' | 'free';
  onOpenLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  userRole = 'free',
  onOpenLogin,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: Home, minRole: 'free' },
    { id: 'gold-signal', label: '🥇 สัญญาณทอง', icon: Gem, badge: 'LIVE', minRole: 'free' },
    { id: 'focus', label: 'FOCUS', icon: Target, badge: 'LIVE', minRole: 'admin' },
    { id: 'user-management', label: 'จัดการผู้ใช้งาน', icon: ShieldCheck, badge: 'ADMIN', minRole: 'admin' },
    { id: 'top5-ultimate', label: 'Top 5 Ultimate', icon: Crown, badge: 'NEW', minRole: 'platinum' },
    { id: 'top5-premium', label: 'Top 5 Premium', icon: Award, badge: 'PRO', minRole: 'platinum' },
    { id: 'top5', label: 'แนะนำ Top 5', icon: Award, badge: 'AI', minRole: 'platinum' },
    { id: 'market', label: 'ตลาดคริปโต', icon: TrendingUp, minRole: 'gold' },
    { id: 'screener', label: 'สแกนเหรียญ', icon: ScanLine, minRole: 'gold' },
    { id: 'analysis', label: 'วิเคราะห์เชิงลึก', icon: Activity, minRole: 'platinum' },
    { id: 'technical', label: 'วิเคราะห์กราฟ', icon: BarChart2, minRole: 'gold' },
    { id: 'signals', label: 'สัญญาณ AI', icon: Sparkles, minRole: 'premium' },
    { id: 'watchlist', label: 'รายการเฝ้าดู', icon: Eye, minRole: 'premium' },
    { id: 'portfolio', label: 'วิเคราะห์พอร์ต & เสี่ยง', icon: PieChart, minRole: 'platinum' },
    { id: 'alerts', label: 'การแจ้งเตือน', icon: Bell, minRole: 'premium' },
    { id: 'reports', label: 'รายงาน & สถิติ', icon: FileSpreadsheet, minRole: 'premium' },
    { id: 'strategy', label: 'เครื่องมือ & กลยุทธ์', icon: Wrench, minRole: 'premium' },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings, minRole: 'premium' },
  ];

  const ROLE_RANK: Record<string, number> = { free: 0, gold: 1, premium: 2, platinum: 3, admin: 4 };
  const userRank = ROLE_RANK[userRole] ?? 0;

  const isRoleUnlocked = (minRole: string) => userRank >= (ROLE_RANK[minRole] ?? 0);

  const getTierLabel = (minRole: string) => {
    if (minRole === 'admin') return 'Admin เท่านั้น';
    if (minRole === 'platinum') return 'สมาชิก Platinum+';
    if (minRole === 'premium') return 'สมาชิก Premium+';
    if (minRole === 'gold') return 'สมาชิก Gold+';
    return '';
  };

  const roleBadgeColor: Record<string, string> = {
    free: '#94A3B8', gold: '#F59E0B', premium: '#38BDF8', platinum: '#A78BFA', admin: '#F43F5E',
  };
  const roleLabel: Record<string, string> = {
    free: 'Free', gold: '🥇 Gold', premium: '⭐ Premium', platinum: '💎 Platinum', admin: '👑 Admin',
  };
  const roleDesc: Record<string, string> = {
    free: 'เข้าถึง Home และสัญญาณทอง',
    gold: 'เข้าถึงตลาด, Screener, กราฟ, ข่าว',
    premium: 'เข้าถึง Signals, Watchlist, Alerts, Reports',
    platinum: 'เข้าถึง Top5, Portfolio, Analysis และอื่นๆ',
    admin: 'เข้าถึงได้ทุกฟังก์ชัน',
  };

  const dataStreams = [
    { name: 'Binance Stream', status: 'Tick-by-Tick', connected: true, color: '#F0B90B' },
    { name: 'Bitkub Ticker', status: 'Live THB Feed', connected: true, isPrimary: true, color: '#00D084' },
    { name: 'TradingView CDN', status: 'Real-Time Chart', connected: true, color: '#2962FF' },
    { name: 'Alternative.me', status: 'Live Daily FNG', connected: true, color: '#10B981' },
  ];

  return (
    <aside
      className={`app-sidebar ${isMobileOpen ? 'is-mobile-open' : 'sidebar-mobile-hidden'}`}
      style={{
        width: isCollapsed && !isMobileOpen ? '72px' : '250px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease-in-out, transform 0.25s ease-in-out',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed && !isMobileOpen ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(6, 182, 212, 0.45)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                CryptoPro <span style={{ color: 'var(--neon-cyan)' }}>AI</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                INVEST SMARTER TOGETHER
              </div>
            </div>
          )}
        </div>

        {isMobileOpen ? (
          <button
            onClick={onCloseMobile}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="ปิดเมนู"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              width: '26px',
              height: '26px',
              display: isCollapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Mobile User Role Banner */}
      {isMobileOpen && (
        <div
          style={{
            padding: '10px 14px',
            margin: '10px 12px 2px',
            borderRadius: '10px',
            backgroundColor: userRole === 'admin' ? 'rgba(244,63,94,0.1)' : userRole === 'platinum' ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)',
            border: userRole === 'admin' ? '1px solid rgba(244,63,94,0.3)' : userRole === 'platinum' ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: roleBadgeColor[userRole] || '#94A3B8',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {userRole === 'admin' ? '👑' : userRole === 'platinum' ? '💎' : userRole === 'premium' ? '⭐' : userRole === 'gold' ? '🥇' : '👤'}
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: roleBadgeColor[userRole] || '#FFF' }}>
                {roleLabel[userRole] || 'Free'}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                {roleDesc[userRole] || ''}
              </div>
            </div>
          </div>
          {userRole === 'free' && onOpenLogin && (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onOpenLogin();
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #F59E0B',
                color: '#FDE047',
                fontSize: '10.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              อัปเกรด
            </button>
          )}
        </div>
      )}

      {/* Navigation Menu */}
      <div
        style={{
          flex: 1,
          padding: '14px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHome = item.id === 'dashboard';
          const isGold = item.id === 'gold-signal';
          const isAdminOnly = item.id === 'focus' || item.id === 'user-management';
          const unlocked = isRoleUnlocked(item.minRole || 'free');
          const isLocked = !unlocked;
          // Hide admin-only items from non-admins entirely
          if (isAdminOnly && userRole !== 'admin') return null;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: isCollapsed && !isMobileOpen ? '12px 0' : '11px 14px',
                justifyContent: isCollapsed && !isMobileOpen ? 'center' : 'flex-start',
                borderRadius: '10px',
                border: isHome
                  ? (isActive ? '1px solid rgba(245, 158, 11, 0.7)' : '1px solid rgba(245, 158, 11, 0.35)')
                  : isGold
                  ? (isActive ? '1px solid rgba(245, 158, 11, 0.7)' : '1px solid rgba(245, 158, 11, 0.3)')
                  : (isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'),
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                background: isHome
                  ? (isActive
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.18))'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(180, 83, 9, 0.04))')
                  : isGold
                  ? (isActive
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(217, 119, 6, 0.16))'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(180, 83, 9, 0.03))')
                  : (isActive
                      ? 'rgba(59, 130, 246, 0.18)'
                      : 'transparent'),
                color: isHome || isGold
                  ? (isActive ? '#FDE047' : '#FBBF24')
                  : (isActive ? '#60A5FA' : 'var(--text-secondary)'),
                fontWeight: isHome || isGold ? 800 : (isActive ? 700 : 500),
                fontSize: '13.5px',
                position: 'relative',
                opacity: isLocked && !isActive ? 0.72 : 1,
                boxShadow: isHome || isGold
                  ? (isActive
                      ? '0 0 16px rgba(245, 158, 11, 0.35), inset 0 0 12px rgba(245, 158, 11, 0.2)'
                      : '0 2px 10px rgba(245, 158, 11, 0.12), inset 0 0 6px rgba(245, 158, 11, 0.05)')
                  : (isActive ? 'inset 0 0 12px rgba(59, 130, 246, 0.25)' : 'none'),
              }}
              title={isCollapsed ? `${item.label}${isLocked ? ` (${getTierLabel(item.minRole || 'free')})` : ''}` : (isLocked ? `${item.label} (${getTierLabel(item.minRole || 'free')})` : undefined)}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '18%',
                    bottom: '18%',
                    width: '3.5px',
                    backgroundColor: isHome || isGold ? '#F59E0B' : 'var(--neon-cyan)',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: isHome || isGold ? '0 0 10px #F59E0B, 0 0 4px #FDE047' : '0 0 8px var(--neon-cyan)',
                  }}
                />
              )}
              <Icon 
                size={18} 
                color={isHome || isGold ? (isActive ? '#FDE047' : '#F59E0B') : (isActive ? 'var(--neon-cyan)' : 'currentColor')} 
                style={isHome || isGold ? { filter: isActive ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))' : 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.4))' } : undefined}
              />
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    color: isHome || isGold ? (isActive ? '#FDE047' : '#FBBF24') : undefined,
                    letterSpacing: isHome || isGold ? '0.4px' : undefined 
                  }}>
                    {item.label}
                    {isHome && (
                      <Sparkles 
                        size={12} 
                        color={isActive ? '#FDE047' : '#F59E0B'} 
                        style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.7))' }} 
                      />
                    )}
                    {isGold && (
                      <Gem 
                        size={12} 
                        color={isActive ? '#FDE047' : '#F59E0B'} 
                        style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.7))' }} 
                      />
                    )}
                  </span>
                  {'badge' in item && item.badge && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: item.id === 'top5-ultimate'
                          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(168, 85, 247, 0.35))'
                          : item.id === 'focus' 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : item.id === 'gold-signal'
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.35))'
                          : item.id === 'top5-premium'
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(168, 85, 247, 0.3))'
                          : 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(249, 115, 22, 0.25))',
                        color: item.id === 'top5-ultimate'
                          ? '#38BDF8'
                          : item.id === 'focus' 
                          ? '#34D399' 
                          : item.id === 'gold-signal' || item.id === 'top5-premium'
                          ? '#FDE047'
                          : '#FBBF24',
                        border: item.id === 'top5-ultimate'
                          ? '1px solid rgba(34, 211, 238, 0.6)'
                          : item.id === 'focus' 
                          ? '1px solid rgba(16, 185, 129, 0.4)' 
                          : item.id === 'gold-signal' || item.id === 'top5-premium'
                          ? '1px solid rgba(245, 158, 11, 0.6)'
                          : '1px solid rgba(245, 158, 11, 0.4)',
                        letterSpacing: '0.4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: item.id === 'top5-ultimate' 
                          ? '0 0 10px rgba(6, 182, 212, 0.45)' 
                          : item.id === 'gold-signal' || item.id === 'top5-premium'
                          ? '0 0 10px rgba(245, 158, 11, 0.35)' 
                          : 'none'
                      }}
                    >
                      {item.id === 'top5-ultimate' && <Gem size={9} color="#38BDF8" />}
                      {item.id === 'top5-premium' && <Sparkles size={9} color="#FDE047" />}
                      {item.id === 'gold-signal' && (
                        <span
                          className="live-green-pulse"
                          style={{
                            width: '5.5px',
                            height: '5.5px',
                            borderRadius: '50%',
                            backgroundColor: '#F59E0B',
                            boxShadow: '0 0 6px #F59E0B',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      {item.id === 'focus' && (
                        <span
                          className="live-green-pulse"
                          style={{
                            width: '5.5px',
                            height: '5.5px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      {item.badge}
                    </span>
                  )}
                  {isLocked && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94A3B8',
                        opacity: 0.75,
                        marginLeft: 'auto',
                      }}
                      title="สำหรับสมาชิก Premium (เดือนละ 10 บาท/ปีละ 110 บาท)"
                    >
                      <Lock size={12} />
                    </span>
                  )}
                </div>
              )}
              {isCollapsed && isLocked && (
                <div
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    opacity: 0.65,
                  }}
                  title="สำหรับสมาชิก Premium (เดือนละ 10 บาท/ปีละ 110 บาท)"
                >
                  <Lock size={9} color="#94A3B8" />
                </div>
              )}
              {isCollapsed && item.id === 'focus' && !isLocked && (
                <span
                  className="live-green-pulse"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                  }}
                />
              )}
              {isCollapsed && item.id === 'gold-signal' && (
                <span
                  className="live-green-pulse"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#F59E0B',
                    boxShadow: '0 0 6px #F59E0B',
                  }}
                />
              )}
            </button>
          );
        })}

        {/* API Connection Widget in Sidebar */}
        {!isCollapsed && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Activity size={14} color="var(--neon-green)" />
              สตรีมข้อมูลสด Real-Time
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dataStreams.map((st) => (
                <div
                  key={st.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11.5px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: st.isPrimary ? 'rgba(0, 208, 132, 0.06)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 6px #10B981',
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {st.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--neon-cyan)',
                      fontWeight: 700,
                    }}
                  >
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer Quote */}
      {!isCollapsed && (
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontStyle: 'italic', marginBottom: '4px', color: '#94A3B8' }}>
            "Discipline Creates Freedom"
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bitkub Main Market</span>
            <span style={{ fontSize: '10px', color: 'var(--neon-green)' }}>● Live Data</span>
          </div>
        </div>
      )}
    </aside>
  );
};
