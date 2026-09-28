import React, { useState, useEffect, useRef } from 'react';
import { Search, Moon, Sun, Bell, User, Shield, ChevronDown, Check, Sparkles, Volume2, VolumeX, Radio, Keyboard, X, Menu } from 'lucide-react';
import { TickerData } from '../types/index.js';
import { realtimeService } from '../services/realtime.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoAnalystProfile } from './CryptoAnalystProfile.js';

interface TopbarProps {
  currency: 'THB' | 'USDT';
  setCurrency: (c: 'THB' | 'USDT') => void;
  coins?: TickerData[];
  onSearchSelect?: (symbol: string) => void;
  activeTopTab: string;
  setActiveTopTab: (tab: string) => void;
  userRole?: 'admin' | 'analyst' | 'investor';
  setUserRole?: (role: 'admin' | 'analyst' | 'investor') => void;
  onMobileMenuToggle?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currency,
  setCurrency,
  coins = [],
  onSearchSelect,
  activeTopTab,
  setActiveTopTab,
  userRole = 'analyst',
  setUserRole,
  onMobileMenuToggle,
  onOpenLogin,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cryptopro-theme');
    return saved ? saved !== 'light' : true;
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = realtimeService.subscribeStatus(setWsStatus);
    return unsub;
  }, []);

  // Sync theme class to <html> element
  useEffect(() => {
    if (!isDark) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isDark]);

  // Global Keyboard Shortcuts for Pro Traders
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Ctrl+K or Cmd+K: Focus Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape: Close all modals / popovers
      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowNotifications(false);
        setShowRoleMenu(false);
        setIsSearchFocused(false);
        return;
      }

      if (isInput) return;

      // Single-key shortcuts when not typing in an input
      if (e.key === '/' || e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.altKey && e.key === '1') {
        setActiveTopTab('overview');
      } else if (e.altKey && e.key === '2') {
        setActiveTopTab('screener');
      } else if (e.altKey && e.key === '3') {
        setActiveTopTab('chart');
      } else if (e.altKey && e.key === '4') {
        setActiveTopTab('signals');
      } else if (e.altKey && e.key === '5') {
        setActiveTopTab('portfolio');
      } else if (e.altKey && e.key.toLowerCase() === 't') {
        setCurrency(currency === 'THB' ? 'USDT' : 'THB');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currency, setActiveTopTab, setCurrency]);

  // Synthesize soft pleasant audio chime using Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.error(e);
    }
  };

  const topTabs = [
    { id: 'overview', label: 'ภาพรวม' },
    { id: 'screener', label: 'คัดเลือกเหรียญ' },
    { id: 'chart', label: 'วิเคราะห์กราฟ' },
    { id: 'signals', label: 'สัญญาณวิเคราะห์ AI' },
    { id: 'portfolio', label: 'วิเคราะห์พอร์ต' },
    { id: 'alerts', label: 'ตั้งค่าแจ้งเตือน' },
    { id: 'reports', label: 'รายงานตลาด' },
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (onSearchSelect) {
        onSearchSelect(searchQuery.trim().toUpperCase());
      }
      setIsSearchFocused(false);
    }
  };

  const searchResults = searchQuery.trim()
    ? coins
        .filter(
          (c) =>
            c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <header
      className="app-topbar"
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        minWidth: 0,
        gap: '12px',
      }}
    >
      {/* Left / Center: Hamburger (mobile) + Top Navigation Tabs */}
      <nav className="topbar-left-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
        {/* Mobile hamburger menu button — visible only on ≤768px via CSS */}
        <button
          className="mobile-menu-btn"
          onClick={onMobileMenuToggle}
          title="เมนู"
        >
          <Menu size={18} />
        </button>

        {/* Mobile Brand Title — visible on ≤768px */}
        <div className="mobile-brand-title" style={{ display: 'none', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px', color: '#FFFFFF' }}>
            CryptoPro <span style={{ color: 'var(--neon-cyan)' }}>AI</span>
          </span>
        </div>

        <div
          className="topbar-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {topTabs.map((tab) => {
            const isActive = activeTopTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTopTab(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-12px',
                      left: '15%',
                      right: '15%',
                      height: '2.5px',
                      backgroundColor: 'var(--neon-cyan)',
                      borderRadius: '4px',
                      boxShadow: '0 0 8px var(--neon-cyan)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right Controls: Search, Currency, Notifications, Profile */}
      <div
        className="topbar-right-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >

        {/* Real-time WebSocket Live Telemetry Indicator */}
        <div
          className="topbar-live-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: wsStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: wsStatus === 'connected' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '20px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: wsStatus === 'connected' ? '#34D399' : '#FBBF24',
            letterSpacing: '0.4px',
            flexShrink: 0,
          }}
          title={wsStatus === 'connected' ? 'เชื่อมต่อสตรีมมิ่งสด Binance WebSocket (Tick-by-Tick)' : 'กำลังเชื่อมต่อสตรีมสด...'}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: wsStatus === 'connected' ? '#10B981' : '#F59E0B',
              boxShadow: wsStatus === 'connected' ? '0 0 8px #10B981' : 'none',
            }}
          />
          <span>{wsStatus === 'connected' ? 'REAL-TIME LIVE' : 'CONNECTING...'}</span>
        </div>

        {/* Global Search with Autocomplete Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            className="topbar-search-box"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: isSearchFocused ? '1px solid var(--neon-cyan)' : '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '6px 12px',
              width: '200px',
              transition: 'all 0.2s ease',
            }}
          >


            <Search size={16} color="var(--text-muted)" style={{ marginRight: '6px', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '100%',
                fontFamily: 'inherit',
                minWidth: '35px',
              }}
            />
            {!searchQuery && (
              <span
                className="topbar-search-shortcut-badge"
                style={{
                  fontSize: '9.5px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
              >
                Ctrl+K
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchQuery.trim() && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '320px',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>ผลการค้นหาเหรียญ</span>
                <span>{searchResults.length} รายการ</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {searchResults.map((coin) => (
                  <div
                    key={coin.symbol}
                    onMouseDown={() => {
                      if (onSearchSelect) onSearchSelect(coin.symbol);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          color: '#60A5FA',
                        }}
                      >
                        {coin.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#FFF' }}>{coin.symbol}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{coin.name}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700 }}>
                        {currency === 'THB' ? '฿' : '$'}
                        {(coin.price * getCurrencyMultiplier(currency)).toLocaleString(undefined, {
                          maximumFractionDigits: coin.price * getCurrencyMultiplier(currency) < 1 ? 4 : 2,
                        })}
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                        }}
                      >
                        {coin.change24h > 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <div
          className="topbar-currency-switcher"
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '2px',
          }}
        >
          <button
            onClick={() => setCurrency('THB')}
            className="topbar-currency-btn"
            style={{
              background: currency === 'THB' ? 'var(--neon-blue)' : 'transparent',
              color: currency === 'THB' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            THB
          </button>
          <button
            onClick={() => setCurrency('USDT')}
            className="topbar-currency-btn"
            style={{
              background: currency === 'USDT' ? 'var(--neon-blue)' : 'transparent',
              color: currency === 'USDT' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            USDT
          </button>
        </div>

        {/* Exchange Connection Latency Pill */}
        <div
          className="topbar-latency-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '5px 10px',
            whiteSpace: 'nowrap',
          }}
          title="สถานะการเชื่อมโยงข้อมูลสด: Bitkub WebSocket & Binance REST API"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
          <span style={{ fontWeight: 600 }}>Bitkub 38ms • Binance 62ms</span>
        </div>

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          className="topbar-shortcuts-btn"
          onClick={() => setShowShortcutsModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          title="คีย์ลัดสำหรับเทรดเดอร์ (กด ? เพื่อเปิด)"
        >
          <Keyboard size={17} />
        </button>


        {/* Dark/Light Mode toggle */}
        <button
          className="topbar-theme-toggle-btn"
          onClick={() => {
            const next = !isDark;
            setIsDark(next);
            localStorage.setItem('cryptopro-theme', next ? 'dark' : 'light');
            if (next) {
              document.documentElement.classList.remove('light');
            } else {
              document.documentElement.classList.add('light');
            }
          }}
          style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? 'var(--text-secondary)' : '#D97706',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
        >
          {isDark ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: showNotifications ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
              border: showNotifications ? '1px solid var(--neon-blue)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showNotifications ? 'var(--neon-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            title="การแจ้งเตือนสัญญาณ AI"
          >
            <Bell size={17} />
          </button>
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              width: '17px',
              height: '17px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
              pointerEvents: 'none',
            }}
          >
            4
          </span>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <>
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 99998,
                }}
                onClick={() => setShowNotifications(false)}
              />
              <div
                className="topbar-notifications-popover"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '340px',
                  maxWidth: 'calc(100vw - 24px)',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 14px 32px rgba(0, 0, 0, 0.7)',
                  zIndex: 99999,
                }}
              >
                {/* Popover Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Radio size={14} color="var(--neon-cyan)" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFF' }}>
                      สัญญาณ AI ล่าสุด
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        if (next) playNotificationChime();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: soundEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '3px 7px',
                        fontSize: '11px',
                        color: soundEnabled ? 'var(--neon-green-light)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      title="เปิด/ปิดเสียงแจ้งเตือนอัตโนมัติ"
                    >
                      {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      <span>{soundEnabled ? 'เสียงเปิด' : 'เสียงปิด'}</span>
                    </button>
                    {soundEnabled && (
                      <button
                        onClick={playNotificationChime}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--neon-blue)',
                          fontSize: '10.5px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '0 2px',
                        }}
                        title="ทดสอบเสียงกริ่ง"
                      >
                        ทดสอบ
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      title="ปิด"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Notification Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    symbol: 'SOL',
                    title: 'Breakout EMA 50 + Volume +185%',
                    detail: 'AI Score 91 • ทะลุแนวต้าน $152.00 สัญญาณ Strong Buy',
                    time: '2 นาทีที่แล้ว',
                    badge: 'STRONG BUY',
                    badgeBg: 'rgba(16, 185, 129, 0.2)',
                    badgeColor: '#10B981',
                  },
                  {
                    symbol: 'NEAR',
                    title: 'Pullback Support Bounce',
                    detail: 'AI Score 84 • ทดสอบ EMA 20 เด้งตัวพร้อม RSI Bullish',
                    time: '12 นาทีที่แล้ว',
                    badge: 'BUY',
                    badgeBg: 'rgba(59, 130, 246, 0.2)',
                    badgeColor: '#60A5FA',
                  },
                  {
                    symbol: 'BTC',
                    title: 'Price Alert: ทดสอบแนวต้าน ฿3,250,000',
                    detail: 'ปริมาณซื้อขายฝั่ง Bitkub พุ่งขึ้น +42% ในรอบ 1 ชม.',
                    time: '28 นาทีที่แล้ว',
                    badge: 'WATCH',
                    badgeBg: 'rgba(245, 158, 11, 0.2)',
                    badgeColor: '#F59E0B',
                  },
                  {
                    symbol: 'PEPE',
                    title: 'Take Profit 1 Target Reached (+18.4%)',
                    detail: 'ถึงเป้าหมายกำไรระยะสั้น แนะนำทยอยล็อคกำไร 50%',
                    time: '1 ชม. ที่แล้ว',
                    badge: 'PROFIT',
                    badgeBg: 'rgba(139, 92, 246, 0.2)',
                    badgeColor: '#A78BFA',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (onSearchSelect) onSearchSelect(item.symbol);
                      setShowNotifications(false);
                    }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#FFF' }}>{item.symbol}</span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: item.badgeBg,
                            color: item.badgeColor,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>

              {/* View All In Alerts Page */}
              <button
                onClick={() => {
                  setActiveTopTab('alerts');
                  setShowNotifications(false);
                }}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '7px 0',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--neon-cyan)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                เปิดศูนย์แจ้งเตือนเต็มรูปแบบ (Alerts Center) →
              </button>
            </div>
          </>
        )}
        </div>

        {/* Admin Login or Status Badge Button */}
        {userRole !== 'admin' ? (
          onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="topbar-admin-login-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: '#FDE047',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)',
                transition: 'all 0.15s ease',
              }}
              title="เข้าสู่ระบบ Admin เพื่อเข้าถึงส่วนที่จำกัดสิทธิ์"
            >
              <Shield size={13} color="#F59E0B" />
              <span className="topbar-admin-login-text">เข้าสู่ระบบ Admin</span>
            </button>
          )
        ) : (
          <div
            className="topbar-admin-status-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#FBBF24',
              fontSize: '11px',
              fontWeight: 800,
            }}
            title="เข้าสู่ระบบในฐานะ Admin เรียบร้อยแล้ว"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span className="topbar-admin-status-text">ADMINISTRATOR</span>
          </div>
        )}

        {/* Unified Crypto Analyst Profile Hub & Role Switcher */}
        <CryptoAnalystProfile
          userRole={userRole}
          setUserRole={setUserRole}
          currency={currency}
          setCurrency={setCurrency}
          isDark={isDark}
          setIsDark={setIsDark}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onTestChime={playNotificationChime}
          wsStatus={wsStatus}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onNavigateTab={(tab) => setActiveTopTab(tab)}
          onOpenLogin={onOpenLogin}
          onLogout={onLogout}
        />
      </div>


      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '560px',
              maxWidth: '92vw',
              backgroundColor: '#0F172A',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={20} color="var(--neon-cyan)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF' }}>
                  คีย์ลัดสำหรับเทรดเดอร์ (Trading Terminal Shortcuts)
                </h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { keys: ['Ctrl', 'K'], desc: 'โฟกัสช่องค้นหาเหรียญทั่วทั้งระบบ (Global Search)', category: 'การค้นหา' },
                { keys: ['/'], desc: 'โฟกัสช่องค้นหาเหรียญทันทีเมื่ออยู่นอกช่องพิมพ์', category: 'การค้นหา' },
                { keys: ['Alt', '1'], desc: 'สลับไปยังหน้า "ภาพรวม" (Overview Dashboard)', category: 'การนำทาง' },
                { keys: ['Alt', '2'], desc: 'สลับไปยังหน้า "คัดเลือกเหรียญ" (Coin Screener)', category: 'การนำทาง' },
                { keys: ['Alt', '3'], desc: 'สลับไปยังหน้า "วิเคราะห์กราฟ" (Technical Chart)', category: 'การนำทาง' },
                { keys: ['Alt', '4'], desc: 'สลับไปยังหน้า "สัญญาณซื้อขาย" (AI Signals Hub)', category: 'การนำทาง' },
                { keys: ['Alt', '5'], desc: 'สลับไปยังหน้า "พอร์ตการลงทุน" (Portfolio & Risk)', category: 'การนำทาง' },
                { keys: ['Alt', 'T'], desc: 'สลับสกุลเงินหลักระหว่าง THB (฿) และ USDT ($)', category: 'ระบบ' },
                { keys: ['?'], desc: 'เปิด/ปิด หน้าต่างคีย์ลัดนี้', category: 'ช่วยเหลือ' },
                { keys: ['Esc'], desc: 'ปิดหน้าต่างป๊อปโอเวอร์ / ปิดผลการค้นหา', category: 'ทั่วไป' },
              ].map((sc, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sc.desc}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {sc.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        <kbd
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#60A5FA',
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        >
                          {k}
                        </kbd>
                        {ki < sc.keys.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              กด <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', border: '1px solid var(--border-color)', color: '#FFF' }}>Esc</kbd> เพื่อปิดหน้าต่างนี้
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
