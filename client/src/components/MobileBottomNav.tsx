import React from 'react';
import { Home, Crown, BarChart2, Target, Menu, Gem } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onToggleMobileMenu: () => void;
  onToggleFocusSidebar: () => void;
  isFocusSidebarOpen: boolean;
  recommendationCount?: number;
  userRole?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleMobileMenu,
  onToggleFocusSidebar,
  isFocusSidebarOpen,
  recommendationCount = 5,
  userRole = 'analyst',
}) => {
  const isHome = activeTab === 'dashboard';
  const isGoldSignal = activeTab === 'gold-signal';
  const isTop5 = activeTab === 'top5-ultimate' || activeTab === 'top5-premium' || activeTab === 'top5';
  const isChart = activeTab === 'technical' || activeTab === 'analysis';

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="เมนูหลักสำหรับมือถือ"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        backgroundColor: 'rgba(11, 17, 32, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 80,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* 1. Home Button */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`mobile-nav-btn ${isHome ? 'is-active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: isHome ? '#FDE047' : '#94A3B8',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '8px',
          flex: 1,
          transition: 'all 0.18s ease',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Home
            size={20}
            color={isHome ? '#FDE047' : 'currentColor'}
            style={{
              filter: isHome ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))' : 'none',
            }}
          />
          {isHome && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 6px #F59E0B',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '10.5px', fontWeight: isHome ? 800 : 500, letterSpacing: '0.2px' }}>
          Home
        </span>
      </button>

      {/* 2. Gold Signal Button */}
      <button
        onClick={() => onSelectTab('gold-signal')}
        className={`mobile-nav-btn ${isGoldSignal ? 'is-active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: isGoldSignal ? '#FBBF24' : '#94A3B8',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '8px',
          flex: 1,
          transition: 'all 0.18s ease',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Gem
            size={20}
            color={isGoldSignal ? '#FBBF24' : 'currentColor'}
            style={{
              filter: isGoldSignal ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))' : 'none',
            }}
          />
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-10px',
              backgroundColor: '#F59E0B',
              color: '#000',
              fontSize: '8px',
              fontWeight: 900,
              padding: '0 4px',
              borderRadius: '6px',
            }}
          >
            LIVE
          </span>
        </div>
        <span style={{ fontSize: '10.5px', fontWeight: isGoldSignal ? 800 : 500, letterSpacing: '0.2px' }}>
          สัญญาณทอง
        </span>
      </button>

      {/* 3. Chart Button */}
      <button
        onClick={() => onSelectTab('technical')}
        className={`mobile-nav-btn ${isChart ? 'is-active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: isChart ? 'var(--neon-cyan)' : '#94A3B8',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '8px',
          flex: 1,
          transition: 'all 0.18s ease',
        }}
      >
        <div style={{ position: 'relative' }}>
          <BarChart2
            size={20}
            color={isChart ? 'var(--neon-cyan)' : 'currentColor'}
            style={{
              filter: isChart ? 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.7))' : 'none',
            }}
          />
        </div>
        <span style={{ fontSize: '10.5px', fontWeight: isChart ? 800 : 500, letterSpacing: '0.2px' }}>
          กราฟ
        </span>
      </button>

      {/* 4. Recommendation Drawer Toggle Button (ซ่อนไว้หากไม่ได้เข้าสู่ระบบ) */}
      {userRole === 'admin' && (
        <button
          onClick={onToggleFocusSidebar}
          className={`mobile-nav-btn ${isFocusSidebarOpen ? 'is-active' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: isFocusSidebarOpen ? '#34D399' : '#94A3B8',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            flex: 1,
            transition: 'all 0.18s ease',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Target
              size={20}
              color={isFocusSidebarOpen ? '#34D399' : 'currentColor'}
              style={{
                filter: isFocusSidebarOpen ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))' : 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-8px',
                backgroundColor: '#10B981',
                color: '#000',
                fontSize: '8px',
                fontWeight: 900,
                padding: '0 4px',
                borderRadius: '6px',
              }}
            >
              {recommendationCount}
            </span>
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: isFocusSidebarOpen ? 800 : 500, letterSpacing: '0.2px' }}>
            แนะนำ
          </span>
        </button>
      )}

      {/* 5. Menu Drawer Toggle Button */}
      <button
        onClick={onToggleMobileMenu}
        className="mobile-nav-btn"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '8px',
          flex: 1,
          transition: 'all 0.18s ease',
        }}
      >
        <Menu size={20} />
        <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.2px' }}>
          เมนู
        </span>
      </button>
    </nav>
  );
};
