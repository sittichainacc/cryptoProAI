import React, { useState, useMemo, useEffect } from 'react';
import { 
  Crown, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  Search,
  Star,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  Target,
  Lock,
  LogIn,
  ShieldAlert
} from 'lucide-react';
import { Phase20Candidate, BuyNowCandidateItem, FocusCoinData } from '../types/index.js';
import { api } from '../services/api.js';
import { CryptoIcon } from './CryptoIcon.js';
import { PriceCell } from './PriceCell.js';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface FocusRightSidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  focusCoins?: FocusCoinData[];
  selectedSymbol: string | null;
  onSelectCoin: (symbol: string) => void;
  onOpenAddModal?: () => void;
  onOpenCompareModal?: () => void;
  onRecalculate?: () => void;
  onOpenFocusPage?: (symbol?: string) => void;
  currency: 'THB' | 'USDT';
  buyCandidates?: BuyNowCandidateItem[];
  onNavigateToAnalysis?: (symbol: string) => void;
  onNavigateToTop5Premium?: (symbol?: string) => void;
  onNavigateToTop5?: (symbol?: string) => void;
  userRole?: 'admin' | 'analyst' | 'investor';
  onOpenLogin?: () => void;
}

export const FocusRightSidebar: React.FC<FocusRightSidebarProps> = ({
  isOpen,
  onToggleOpen,
  isPinned,
  onTogglePin,
  isCollapsed,
  onToggleCollapse,
  focusCoins = [],
  selectedSymbol,
  onSelectCoin,
  onOpenFocusPage,
  currency,
  buyCandidates: initialBuyCandidates = [],
  onNavigateToAnalysis,
  onNavigateToTop5Premium,
  onNavigateToTop5,
  userRole = 'analyst',
  onOpenLogin,
}) => {
  const isAdmin = userRole === 'admin';
  const [activeFilter, setActiveFilter] = useState<'all' | 'premium' | 'standard'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Section 1: Top 5 Premium State
  const [premiumCandidates, setPremiumCandidates] = useState<Phase20Candidate[]>([]);
  const [premiumRegime, setPremiumRegime] = useState<string>('Risk-On Bull');
  const [isPremiumExpanded, setIsPremiumExpanded] = useState<boolean>(true);

  // Section 2: Top 5 Standard State
  const [buyCandidates, setBuyCandidates] = useState<BuyNowCandidateItem[]>(initialBuyCandidates);
  const [isStandardExpanded, setIsStandardExpanded] = useState<boolean>(true);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Load data for both recommendation engines
  const loadRecommendationData = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const [premRes, buyRes] = await Promise.allSettled([
        api.getTop5Premium(),
        api.getBuyNow(),
      ]);

      if (premRes.status === 'fulfilled' && premRes.value?.candidates) {
        setPremiumCandidates(premRes.value.candidates.slice(0, 5));
        if (premRes.value.marketRegime?.regime) {
          setPremiumRegime(premRes.value.marketRegime.regime);
        }
      }

      if (buyRes.status === 'fulfilled' && buyRes.value?.candidates) {
        setBuyCandidates(buyRes.value.candidates.slice(0, 5));
      } else if (initialBuyCandidates.length > 0) {
        setBuyCandidates(initialBuyCandidates.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching recommendations in sidebar:', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecommendationData(false);
    const interval = setInterval(() => {
      loadRecommendationData(false);
    }, 20000); // 20s periodic refresh
    return () => clearInterval(interval);
  }, []);

  // Update buyCandidates if prop changes
  useEffect(() => {
    if (initialBuyCandidates.length > 0 && buyCandidates.length === 0) {
      setBuyCandidates(initialBuyCandidates.slice(0, 5));
    }
  }, [initialBuyCandidates]);

  // Filtered lists by search term
  const filteredPremium = useMemo(() => {
    if (!searchTerm.trim()) return premiumCandidates;
    const q = searchTerm.toLowerCase();
    return premiumCandidates.filter(
      (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [premiumCandidates, searchTerm]);

  const filteredStandard = useMemo(() => {
    if (!searchTerm.trim()) return buyCandidates;
    const q = searchTerm.toLowerCase();
    return buyCandidates.filter(
      (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [buyCandidates, searchTerm]);

  // Total count for badge
  const totalRecommendedCount = (isAdmin ? premiumCandidates.length : 0) + buyCandidates.length;

  // 1. Floating Trigger Button on the right screen edge
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        style={{
          position: 'fixed',
          right: 0,
          top: '46%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 35%, #8B5CF6 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(245, 158, 11, 0.6)',
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          padding: '14px 7px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '-4px 0 20px rgba(245, 158, 11, 0.4), 0 0 12px rgba(139, 92, 246, 0.3)',
          transition: 'all 0.25s ease',
        }}
        title="เปิดแถบแนะนำการลงทุน (Top 5 Premium & Top 5)"
      >
        <Crown size={16} color="#FFF" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }} />
        <span
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontWeight: 900,
            fontSize: '12px',
            letterSpacing: '2px',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          แนะนำ
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span
            style={{
              fontSize: '8.5px',
              fontWeight: 900,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              color: '#FDE047',
              padding: '2px 4px',
              borderRadius: '5px',
              lineHeight: 1,
            }}
          >
            TOP
          </span>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
        </div>
      </button>
    );
  }

  // 2. Expanded / Collapsed Drawer
  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '350px',
        backgroundColor: '#0B1120',
        borderLeft: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: isPinned ? 'sticky' : 'fixed',
        top: 0,
        right: 0,
        zIndex: 10000,
        boxShadow: isPinned ? 'none' : '-10px 0 35px rgba(0, 0, 0, 0.75)',
        transition: 'width 0.22s ease-in-out',
        flexShrink: 0,
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: isCollapsed ? '16px 8px' : '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.12))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => onNavigateToTop5Premium && onNavigateToTop5Premium()}
            title="เปิดหน้าจอ แนะนำ Top 5 Premium"
          >
            <Crown size={17} color="#FFFFFF" />
          </div>

          {!isCollapsed && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 900, fontSize: '13.5px', color: '#FFFFFF', letterSpacing: '0.3px' }}>
                  แนะนำการลงทุน
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                    padding: '0 6px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                  }}
                >
                  Top 5
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: '#10B981',
                    fontWeight: 800,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  ● LIVE
                </span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Top 5 Premium & Top 5 Real-Time
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isCollapsed && (
            <>
              <button
                onClick={() => loadRecommendationData(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isRefreshing ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="คำนวณสดและรีเฟรชข้อมูล"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onTogglePin}
                style={{
                  background: isPinned ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  border: 'none',
                  color: isPinned ? '#FBBF24' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
                title={isPinned ? 'ยกเลิกการตรึง (Unpin)' : 'ตรึงแถบข้าง (Pin)'}
              >
                {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
              </button>
            </>
          )}

          <button
            onClick={onToggleCollapse}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
            title={isCollapsed ? 'ขยายแถบ' : 'ย่อแถบ'}
          >
            {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {!isPinned && !isCollapsed && (
            <button
              onClick={onToggleOpen}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="ปิดแถบแนะนำ"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLLAPSED VIEW (Icons only, slim strip)                         */}
      {/* ============================================================== */}
      {isCollapsed ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Section 1 Mini Header */}
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#F59E0B', textAlign: 'center' }}>
            PREM
          </div>
          {!isAdmin ? (
            <div
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
              }}
              style={{
                cursor: 'pointer',
                padding: '7px 4px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px dashed rgba(239, 68, 68, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
              title="แนะนำ Top 5 Premium: ท่านไม่มีสิทธิ์ดูส่วนนี้ (เฉพาะ Admin คลิกเพื่อล็อกอิน)"
            >
              <Lock size={15} color="#EF4444" />
              <span style={{ fontSize: '8px', color: '#EF4444', fontWeight: 800 }}>LOCK</span>
            </div>
          ) : (
            premiumCandidates.map((c, idx) => (
              <div
                key={`prem-mini-${c.symbol}`}
                onClick={() => onSelectCoin(c.symbol)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '3px',
                  borderRadius: '8px',
                  backgroundColor: selectedSymbol === c.symbol ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  border: selectedSymbol === c.symbol ? '1.5px solid #F59E0B' : '1px solid transparent',
                }}
                title={`[Top 5 Premium #${idx + 1}] ${c.symbol} - Edge: +${c.tradableEdge?.expectedTradableEdgeBps || 164} bps`}
              >
                <CryptoIcon symbol={c.symbol} size={28} />
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#F59E0B',
                    color: '#000',
                    fontSize: '8px',
                    fontWeight: 900,
                    borderRadius: '50%',
                    width: '13px',
                    height: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </span>
              </div>
            ))
          )}

          <div style={{ width: '80%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />

          {/* Section 2 Mini Header */}
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#10B981', textAlign: 'center' }}>
            TOP 5
          </div>
          {buyCandidates.map((c, idx) => (
            <div
              key={`std-mini-${c.symbol}`}
              onClick={() => onSelectCoin(c.symbol)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                padding: '3px',
                borderRadius: '8px',
                backgroundColor: selectedSymbol === c.symbol ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                border: selectedSymbol === c.symbol ? '1.5px solid #10B981' : '1px solid transparent',
              }}
              title={`[Top 5 #${idx + 1}] ${c.symbol} - Buy Now: ${c.buyNowScore}p`}
            >
              <CryptoIcon symbol={c.symbol} size={28} />
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#10B981',
                  color: '#000',
                  fontSize: '8px',
                  fontWeight: 900,
                  borderRadius: '50%',
                  width: '13px',
                  height: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* ============================================================== */
        /* EXPANDED VIEW (Dual Section: Top 5 Premium & Top 5)            */
        /* ============================================================== */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Segment Switcher & Search Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setActiveFilter('all')}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: activeFilter === 'all' ? 800 : 600,
                  backgroundColor: activeFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: activeFilter === 'all' ? '#FFF' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ทั้งหมด (10)
              </button>
              <button
                onClick={() => setActiveFilter('premium')}
                style={{
                  flex: 1.2,
                  padding: '5px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: activeFilter === 'premium' ? 800 : 600,
                  backgroundColor: activeFilter === 'premium' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  color: activeFilter === 'premium' ? '#FBBF24' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                👑 Top 5 Premium
              </button>
              <button
                onClick={() => setActiveFilter('standard')}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: activeFilter === 'standard' ? 800 : 600,
                  backgroundColor: activeFilter === 'standard' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                  color: activeFilter === 'standard' ? '#34D399' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ⚡ Top 5
              </button>
            </div>

            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '4px 8px',
              }}
            >
              <Search size={12} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="ค้นหาเหรียญในคำแนะนำ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  width: '100%',
                }}
              />
              {searchTerm && (
                <X size={12} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              )}
            </div>
          </div>

          {/* Scrollable Container with 2 Sections */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* ============================================================== */}
            {/* ส่วนที่ 1: แนะนำซื้อ Top 5 Premium                             */}
            {/* ============================================================== */}
            {(activeFilter === 'all' || activeFilter === 'premium') && (
              <div
                style={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.03)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  overflow: 'hidden',
                }}
              >
                {/* Section 1 Header */}
                <div
                  onClick={() => setIsPremiumExpanded(!isPremiumExpanded)}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(139, 92, 246, 0.08))',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isPremiumExpanded ? '1px solid rgba(245, 158, 11, 0.18)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      <Crown size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#FDE047', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>1. แนะนำซื้อ Top 5 Premium</span>
                        <span style={{ fontSize: '9px', backgroundColor: '#F59E0B', color: '#000', padding: '0 5px', borderRadius: '4px', fontWeight: 900 }}>
                          PRO
                        </span>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        20-Phase Master Quant • {premiumRegime}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: isAdmin ? '#F59E0B' : '#EF4444' }}>
                      {isAdmin ? `${filteredPremium.length} เหรียญ` : '🔒 เฉพาะ Admin'}
                    </span>
                    {isPremiumExpanded ? <ChevronUp size={14} color="#F59E0B" /> : <ChevronDown size={14} color="#F59E0B" />}
                  </div>
                </div>

                {/* Section 1 Content */}
                {isPremiumExpanded && (
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!isAdmin ? (
                      <div
                        style={{
                          padding: '24px 14px',
                          textAlign: 'center',
                          backgroundColor: 'rgba(239, 68, 68, 0.06)',
                          border: '1.5px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            margin: '0 auto 10px auto',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(153, 27, 27, 0.4))',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
                          }}
                        >
                          <Lock size={22} color="#EF4444" />
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', marginBottom: '5px' }}>
                          ท่านไม่มีสิทธิ์ดูส่วนนี้
                        </div>

                        <div style={{ fontSize: '11.5px', color: '#CBD5E1', lineHeight: 1.5, marginBottom: '16px' }}>
                          แท็บแนะนำซื้อ <strong style={{ color: '#FDE047' }}>Top 5 Premium</strong> (สูตร Quant 20 ขั้นตอน) สงวนสิทธิ์เฉพาะ <strong style={{ color: '#F59E0B' }}>ผู้ดูแลระบบ (Admin)</strong> เท่านั้น
                        </div>

                        {onOpenLogin && (
                          <button
                            onClick={onOpenLogin}
                            style={{
                              width: '100%',
                              padding: '9px 14px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
                              border: 'none',
                              color: '#FFF',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
                            }}
                          >
                            <LogIn size={14} />
                            <span>เข้าสู่ระบบในฐานะ Admin</span>
                          </button>
                        )}
                      </div>
                    ) : filteredPremium.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        กำลังโหลดข้อมูล Top 5 Premium...
                      </div>
                    ) : (
                      filteredPremium.map((c, idx) => {
                        const isSelected = selectedSymbol === c.symbol;
                        const edgeBps = c.tradableEdge?.expectedTradableEdgeBps || 164;
                        const edgePct = (edgeBps / 100).toFixed(2);
                        const decision = c.decisionAssistant?.statusBadge || {
                          labelTh: 'พร้อมเข้า',
                          bg: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          border: '#10B981',
                        };

                        return (
                          <div
                            key={`prem-${c.symbol}`}
                            onClick={() => onSelectCoin(c.symbol)}
                            style={{
                              padding: '10px',
                              borderRadius: '9px',
                              backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.14)' : 'rgba(255, 255, 255, 0.025)',
                              border: isSelected ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.06)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                            }}
                          >
                            {/* Row 1: Rank Badge, Icon, Symbol, Price, Edge */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '5px',
                                    backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#CBD5E1' : '#B45309',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  #{idx + 1}
                                </div>
                                <CryptoIcon symbol={c.symbol} size={22} />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 900, fontSize: '12.5px', color: '#FFF' }}>
                                      {c.symbol}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>/THB</span>
                                  </div>
                                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                    {c.role || 'LEADER'}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>
                                  <PriceCell price={c.price * multiplier} prefix={prefix} />
                                </div>
                                <div
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: c.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                                  }}
                                >
                                  {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Expected Edge Strip & Status */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                                fontSize: '10px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Edge:</span>
                                <span style={{ fontWeight: 800, color: 'var(--neon-green-light)' }}>
                                  +{edgeBps} bps (+{edgePct}%)
                                </span>
                              </div>

                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: decision.bg || 'rgba(16, 185, 129, 0.15)',
                                  color: decision.color || '#34D399',
                                  border: `1px solid ${decision.border || '#10B981'}`,
                                }}
                              >
                                {decision.labelTh || 'พร้อมเข้า'}
                              </span>
                            </div>

                            {/* Row 3: Entry Zone & SL / TP quick plan */}
                            {c.decisionAssistant?.entryPlan && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '9.5px',
                                  color: '#CBD5E1',
                                  padding: '0 2px',
                                }}
                              >
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>โซน: </span>
                                  <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                                    {prefix}{(c.decisionAssistant.entryPlan.entryZone.min * multiplier).toLocaleString(undefined, { maximumFractionDigits: c.price < 1 ? 3 : 1 })} - {prefix}{(c.decisionAssistant.entryPlan.entryZone.max * multiplier).toLocaleString(undefined, { maximumFractionDigits: c.price < 1 ? 3 : 1 })}
                                  </span>
                                </div>
                                <div style={{ color: 'var(--neon-green-light)', fontWeight: 700 }}>
                                  TP1 +{c.decisionAssistant.entryPlan.rewardPct || 9.3}%
                                </div>
                              </div>
                            )}

                            {/* Row 4: Action Buttons */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectCoin(c.symbol);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: '#FFF',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Eye size={11} /> ดูกราฟ
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectCoin(c.symbol);
                                  if (onNavigateToTop5Premium) onNavigateToTop5Premium(c.symbol);
                                }}
                                style={{
                                  flex: 1.3,
                                  padding: '4px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  color: '#FDE047',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <span>แผนเต็ม</span> <ExternalLink size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Section 1 Footer Banner */}
                    <button
                      onClick={() => onNavigateToTop5Premium && onNavigateToTop5Premium()}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px dashed rgba(245, 158, 11, 0.35)',
                        color: '#FDE047',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <Crown size={12} />
                      <span>เปิดหน้าจอ แนะนำ Top 5 Premium เต็มรูปแบบ →</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* ส่วนที่ 2: แนะนำซื้อ Top 5 (มาตรฐาน)                           */}
            {/* ============================================================== */}
            {(activeFilter === 'all' || activeFilter === 'standard') && (
              <div
                style={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  overflow: 'hidden',
                }}
              >
                {/* Section 2 Header */}
                <div
                  onClick={() => setIsStandardExpanded(!isStandardExpanded)}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(6, 182, 212, 0.08))',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isStandardExpanded ? '1px solid rgba(16, 185, 129, 0.18)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      <Zap size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#34D399', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>2. แนะนำซื้อ Top 5</span>
                        <span style={{ fontSize: '9px', backgroundColor: '#10B981', color: '#000', padding: '0 5px', borderRadius: '4px', fontWeight: 900 }}>
                          QUANT V3
                        </span>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        Buy Now Hard Gates 12 ข้อ
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#10B981' }}>
                      {filteredStandard.length} เหรียญ
                    </span>
                    {isStandardExpanded ? <ChevronUp size={14} color="#10B981" /> : <ChevronDown size={14} color="#10B981" />}
                  </div>
                </div>

                {/* Section 2 Content */}
                {isStandardExpanded && (
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredStandard.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        กำลังโหลดข้อมูล แนะนำซื้อ Top 5...
                      </div>
                    ) : (
                      filteredStandard.map((c, idx) => {
                        const isSelected = selectedSymbol === c.symbol;

                        return (
                          <div
                            key={`std-${c.symbol}`}
                            onClick={() => onSelectCoin(c.symbol)}
                            style={{
                              padding: '10px',
                              borderRadius: '9px',
                              backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.025)',
                              border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.06)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
                            }}
                          >
                            {/* Row 1: Rank, Icon, Symbol, Price, Change */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '5px',
                                    backgroundColor: '#10B981',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  #{idx + 1}
                                </div>
                                <CryptoIcon symbol={c.symbol} size={22} />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 900, fontSize: '12.5px', color: '#FFF' }}>
                                      {c.symbol}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>/THB</span>
                                  </div>
                                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                    {c.setup}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>
                                  <PriceCell price={c.price * multiplier} prefix={prefix} />
                                </div>
                                <div
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: c.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                                  }}
                                >
                                  {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Score, R:R, Status Badge */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                                fontSize: '10px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                                  <span style={{ fontWeight: 800, color: '#FBBF24' }}>
                                    {c.buyNowScore}p
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <ShieldCheck size={10} color="#06B6D4" />
                                  <span style={{ fontWeight: 700, color: '#22D3EE' }}>
                                    R:R {c.riskReward}
                                  </span>
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                                  color: '#34D399',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                }}
                              >
                                {c.status}
                              </span>
                            </div>

                            {/* Row 3: Entry Zone */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '9.5px',
                                color: '#CBD5E1',
                                padding: '0 2px',
                              }}
                            >
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Entry: </span>
                                <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                                  {c.entryZone.text}
                                </span>
                              </div>
                              <div style={{ color: 'var(--neon-green-light)', fontWeight: 700 }}>
                                {c.currentTrend}
                              </div>
                            </div>

                            {/* Row 4: Action Buttons */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectCoin(c.symbol);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: '#FFF',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Eye size={11} /> ดูกราฟ
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectCoin(c.symbol);
                                  if (onNavigateToTop5) onNavigateToTop5(c.symbol);
                                }}
                                style={{
                                  flex: 1.3,
                                  padding: '4px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: '#34D399',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <span>วิเคราะห์</span> <ExternalLink size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Section 2 Footer Banner */}
                    <button
                      onClick={() => onNavigateToTop5 && onNavigateToTop5()}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px dashed rgba(16, 185, 129, 0.35)',
                        color: '#34D399',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <Zap size={12} />
                      <span>เปิดหน้าจอ แนะนำ Top 5 เต็มรูปแบบ →</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
