import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Shield,
  ShieldCheck,
  Award,
  ChevronDown,
  Check,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Keyboard,
  ExternalLink,
  PieChart,
  Bell,
  FileSpreadsheet,
  Edit2,
  CheckCircle2,
  Activity,
  Layers,
  LogOut,
  X
} from 'lucide-react';

interface CryptoAnalystProfileProps {
  userRole: 'admin' | 'analyst' | 'investor';
  setUserRole?: (role: 'admin' | 'analyst' | 'investor') => void;
  currency: 'THB' | 'USDT';
  setCurrency: (c: 'THB' | 'USDT') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (sound: boolean) => void;
  onTestChime?: () => void;
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  onOpenShortcuts?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CryptoAnalystProfile: React.FC<CryptoAnalystProfileProps> = ({
  userRole,
  setUserRole,
  currency,
  setCurrency,
  isDark,
  setIsDark,
  soundEnabled,
  setSoundEnabled,
  onTestChime,
  wsStatus,
  onOpenShortcuts,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [analystName, setAnalystName] = useState(() => {
    return localStorage.getItem('cryptopro-analyst-name') || 'Sittichai Pat.';
  });
  const [tempName, setTempName] = useState(analystName);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditingName(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when editing name
  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setAnalystName(trimmed);
      localStorage.setItem('cryptopro-analyst-name', trimmed);
    }
    setIsEditingName(false);
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'SYSTEM ADMIN',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          icon: Shield,
        };
      case 'investor':
        return {
          title: 'INVESTOR',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          icon: CheckCircle2,
        };
      case 'analyst':
      default:
        return {
          title: 'PRO ANALYST',
          color: '#06B6D4',
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.4)',
          icon: ShieldCheck,
        };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* ─── Profile Trigger Chip (Header Bar) ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="analyst-profile-chip"
        style={{
          border: isOpen ? '1px solid var(--neon-cyan)' : undefined,
          boxShadow: isOpen ? '0 0 16px rgba(6, 182, 212, 0.4)' : undefined,
        }}
        title="Crypto Analyst Profile Hub"
        aria-label="Crypto Analyst Profile"
      >
        {/* Avatar with Status Beacon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              border: '2px solid rgba(6, 182, 212, 0.6)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.35)',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.5px',
            }}
          >
            {analystName.slice(0, 2).toUpperCase()}
          </div>
          {/* Online Pulsing Beacon */}
          <span
            style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '10px',
              height: '10px',
              backgroundColor: wsStatus === 'connected' ? '#10B981' : '#F59E0B',
              borderRadius: '50%',
              border: '2px solid #0B101E',
              boxShadow: wsStatus === 'connected' ? '0 0 8px #10B981' : 'none',
            }}
          />
        </div>

        {/* Identity & Role Info (Desktop view >= 768px) */}
        <div className="analyst-info-desktop">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#FFFFFF',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {analystName}
            </span>
            <ShieldCheck size={13} color="var(--neon-cyan)" />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '9.5px',
              fontWeight: 800,
              color: roleBadge.color,
              letterSpacing: '0.4px',
            }}
          >
            <span>{roleBadge.title}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>LVL 5</span>
          </div>
        </div>

        {/* Animated Chevron */}
        <ChevronDown
          size={14}
          color="#94A3B8"
          className="analyst-chip-chevron"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: '2px',
          }}
        />
      </button>

      {/* ─── Profile Popover Card Hub ─── */}
      {isOpen && (
        <div
          className="crypto-analyst-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '375px',
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            backgroundColor: '#0B132B',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.15)',
            zIndex: 150,
            backdropFilter: 'blur(16px)',
            animation: 'fadeInSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}

        >
          {/* Card Header Ambient Gradient */}
          <div
            style={{
              height: '60px',
              background: 'linear-gradient(90deg, #1E3A8A 0%, #0F766E 50%, #1D4ED8 100%)',
              position: 'relative',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#67E8F9" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#A5F3FC', letterSpacing: '0.6px' }}>
                CRYPTO PRO TERMINAL
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: 'none',
                color: '#E2E8F0',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Profile Identity Details */}
          <div style={{ padding: '0 18px 14px 18px', marginTop: '-28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              {/* Big Avatar */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #06B6D4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    border: '3px solid #0B132B',
                    boxShadow: '0 0 16px rgba(6, 182, 212, 0.5)',
                    fontWeight: 900,
                    fontSize: '20px',
                  }}
                >
                  {analystName.slice(0, 2).toUpperCase()}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: wsStatus === 'connected' ? '#10B981' : '#F59E0B',
                    borderRadius: '50%',
                    border: '2px solid #0B132B',
                    boxShadow: '0 0 6px #10B981',
                  }}
                  title={wsStatus === 'connected' ? 'เชื่อมต่อระบบสตรีมสดสมบูรณ์' : 'กำลังเชื่อมต่อ'}
                />
              </div>

              {/* Status Tags */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  ACTIVE
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#60A5FA',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                  }}
                >
                  UID #88492
                </span>
              </div>
            </div>

            {/* Editable Name & Title */}
            <div style={{ marginTop: '10px' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--neon-cyan)',
                      borderRadius: '6px',
                      color: '#FFF',
                      padding: '4px 8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      outline: 'none',
                      flex: 1,
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    style={{
                      background: 'var(--neon-blue)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#FFF',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    บันทึก
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {analystName}
                  </h4>
                  <button
                    onClick={() => {
                      setTempName(analystName);
                      setIsEditingName(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="แก้ไขชื่อนักวิเคราะห์"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}

              <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                Senior Quantitative Crypto Analyst & Strategist
              </div>
            </div>

            {/* ─── Analyst Track Record & Quant Stats ─── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginTop: '14px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>ความแม่นยำ AI (Win Rate)</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#34D399', marginTop: '2px' }}>
                  84.6%
                </div>
                <div style={{ fontSize: '9px', color: '#10B981', marginTop: '1px', fontWeight: 700 }}>
                  ↑ +2.4% สัปดาห์นี้
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>บทวิเคราะห์ทั้งหมด</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
                  1,420+
                </div>
                <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '1px' }}>
                  17 อินดิเคเตอร์ต่อเหรียญ
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>เหรียญ FOCUS เฝ้าระวัง</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#A78BFA', marginTop: '2px' }}>
                  12 เหรียญ
                </div>
                <div style={{ fontSize: '9px', color: '#A78BFA', marginTop: '1px' }}>
                  Realtime High-Frequency
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>ประสิทธิภาพ (Sharpe)</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
                  2.48
                </div>
                <div style={{ fontSize: '9px', color: '#FBBF24', marginTop: '1px', fontWeight: 700 }}>
                  เกรด A+ (ความเสี่ยงต่ำ)
                </div>
              </div>
            </div>

            {/* ─── Mode & Role Permission Switcher ─── */}
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94A3B8',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Layers size={13} color="var(--neon-cyan)" />
                <span>โหมดการใช้งาน & สิทธิ์การเข้าถึง (Role Mode)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  {
                    id: 'analyst',
                    title: 'Analyst (โหมดนักวิเคราะห์)',
                    desc: 'ปลดล็อก 17 อินดิเคเตอร์, MTF Matrix, Thai Rationale และ Focus Radar',
                    badge: 'PRO',
                    color: '#06B6D4',
                  },
                  {
                    id: 'investor',
                    title: 'Investor (โหมดนักลงทุน)',
                    desc: 'สัญญาณเข้า-ออกชัดเจน พร้อมเป้าหมายกำไร TP และจุดตัดขาดทุน SL',
                    badge: 'SIMPLIFIED',
                    color: '#10B981',
                  },
                  {
                    id: 'admin',
                    title: 'Admin (ผู้ดูแลระบบ)',
                    desc: 'จัดการ Exchange API Keys, System Config และ WebSocket Tuning',
                    badge: 'CONTROL',
                    color: '#F59E0B',
                  },
                ].map((r) => {
                  const isSelected = userRole === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (setUserRole) setUserRole(r.id as any);
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255, 255, 255, 0.025)',
                        border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#CBD5E1' }}>
                            {r.title}
                          </span>
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: `${r.color}25`,
                              color: r.color,
                              border: `1px solid ${r.color}40`,
                            }}
                          >
                            {r.badge}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.3 }}>{r.desc}</span>
                      </div>
                      {isSelected ? (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--neon-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={12} color="#FFF" />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Fast Terminal Toggles ─── */}
            <div
              style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {/* Currency Toggle */}
              <button
                onClick={() => setCurrency(currency === 'THB' ? 'USDT' : 'THB')}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '7px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#CBD5E1',
                }}
                title="คลิกเพื่อสลับสกุลเงิน"
              >
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>สกุลเงิน</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                  {currency === 'THB' ? '฿ THB' : '$ USDT'}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
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
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '7px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#CBD5E1',
                }}
                title="เปลี่ยนธีมหน้าจอ"
              >
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>โหมดธีม</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isDark ? <Moon size={12} color="#60A5FA" /> : <Sun size={12} color="#FBBF24" />}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFF' }}>
                    {isDark ? 'Dark Pro' : 'Light'}
                  </span>
                </div>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next && onTestChime) onTestChime();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '7px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#CBD5E1',
                }}
                title="เปิด/ปิดเสียงแจ้งเตือนสัญญาณ"
              >
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>เสียงเตือน AI</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {soundEnabled ? <Volume2 size={12} color="#34D399" /> : <VolumeX size={12} color="#94A3B8" />}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: soundEnabled ? '#34D399' : '#94A3B8' }}>
                    {soundEnabled ? 'เปิดเสียง' : 'ปิดเสียง'}
                  </span>
                </div>
              </button>
            </div>

            {/* ─── Quick Navigation Links ─── */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {[
                { label: 'วิเคราะห์พอร์ต & ความเสี่ยง (Portfolio)', tab: 'portfolio', icon: PieChart },
                { label: 'ศูนย์การแจ้งเตือนสัญญาณ AI (Alerts Hub)', tab: 'alerts', icon: Bell },
                { label: 'รายงานตลาดและสรุปสถิติ (Reports)', tab: 'reports', icon: FileSpreadsheet },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.tab}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab(link.tab);
                      setIsOpen(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#CBD5E1',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#CBD5E1';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={14} color="#60A5FA" />
                      <span>{link.label}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>→</span>
                  </button>
                );
              })}

              {onOpenShortcuts && (
                <button
                  onClick={() => {
                    onOpenShortcuts();
                    setIsOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#94A3B8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Keyboard size={14} color="#94A3B8" />
                    <span>คีย์ลัดสำหรับเทรดเดอร์ (Press ?)</span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    ?
                  </span>
                </button>
              )}
            </div>

            {/* ─── Footer Telemetry ─── */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '10.5px',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
                <span>Bitkub 38ms • Binance 62ms</span>
              </div>
              <span>v2.4 Pro Terminal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
