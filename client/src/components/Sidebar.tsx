import React from 'react';
import { 
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
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'market', label: 'ตลาดคริปโต', icon: TrendingUp },
    { id: 'screener', label: 'สแกนเหรียญ', icon: ScanLine },
    { id: 'analysis', label: 'วิเคราะห์เชิงลึก', icon: Activity },
    { id: 'technical', label: 'วิเคราะห์กราฟ', icon: BarChart2 },
    { id: 'signals', label: 'สัญญาณ AI', icon: Sparkles },
    { id: 'watchlist', label: 'รายการเฝ้าดู', icon: Eye },
    { id: 'portfolio', label: 'พอร์ตการลงทุน', icon: PieChart },
    { id: 'alerts', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'reports', label: 'รายงาน & สถิติ', icon: FileSpreadsheet },
    { id: 'strategy', label: 'เครื่องมือ & กลยุทธ์', icon: Wrench },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
  ];

  const exchanges = [
    { name: 'Binance', connected: true, color: '#F0B90B' },
    { name: 'Bitkub', connected: true, isPrimary: true, color: '#00D084' },
    { name: 'Bybit', connected: false, color: '#F7A600' },
    { name: 'OKX', connected: false, color: '#FFFFFF' },
    { name: 'KuCoin', connected: false, color: '#24AE8F' },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? '72px' : '250px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease-in-out',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
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
          {!isCollapsed && (
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
      </div>

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
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: isCollapsed ? '12px 0' : '10px 14px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                backgroundColor: isActive
                  ? 'rgba(59, 130, 246, 0.18)'
                  : 'transparent',
                color: isActive ? '#60A5FA' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13.5px',
                position: 'relative',
                boxShadow: isActive ? 'inset 0 0 12px rgba(59, 130, 246, 0.25)' : 'none',
              }}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '18%',
                    bottom: '18%',
                    width: '3.5px',
                    backgroundColor: 'var(--neon-cyan)',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 8px var(--neon-cyan)',
                  }}
                />
              )}
              <Icon size={18} color={isActive ? 'var(--neon-cyan)' : 'currentColor'} />
              {!isCollapsed && <span>{item.label}</span>}
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
              <ShieldCheck size={14} color="var(--neon-cyan)" />
              เชื่อมต่อ API (ไม่บังคับ)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {exchanges.map((ex) => (
                <div
                  key={ex.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: ex.isPrimary ? 'rgba(0, 208, 132, 0.06)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: ex.connected ? '#10B981' : '#64748B',
                      }}
                    />
                    <span style={{ color: ex.connected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {ex.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10.5px',
                      color: ex.connected ? '#10B981' : 'var(--text-muted)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    {ex.connected ? (
                      <>
                        <CheckCircle2 size={11} /> เชื่อมต่อแล้ว
                      </>
                    ) : (
                      'เชื่อมต่อ'
                    )}
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
