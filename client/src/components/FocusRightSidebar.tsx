import React, { useState, useMemo } from 'react';
import { 
  Target, 
  ChevronRight, 
  ChevronLeft, 
  Pin, 
  PinOff, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  ShieldAlert, 
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import { FocusCoinData } from '../types/index.js';

interface FocusRightSidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  focusCoins: FocusCoinData[];
  selectedSymbol: string | null;
  onSelectCoin: (symbol: string) => void;
  onOpenAddModal: () => void;
  onOpenCompareModal: () => void;
  onRecalculate: () => void;
  onOpenFocusPage: (symbol?: string) => void;
  currency: 'THB' | 'USDT';
}

export const FocusRightSidebar: React.FC<FocusRightSidebarProps> = ({
  isOpen,
  onToggleOpen,
  isPinned,
  onTogglePin,
  isCollapsed,
  onToggleCollapse,
  focusCoins,
  selectedSymbol,
  onSelectCoin,
  onOpenAddModal,
  onOpenCompareModal,
  onRecalculate,
  onOpenFocusPage,
  currency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'change' | 'priority'>('score');

  const filteredCoins = useMemo(() => {
    let result = [...focusCoins];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.symbol.toLowerCase().includes(q) ||
          c.coinName.toLowerCase().includes(q) ||
          c.pair.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'score') {
      result.sort((a, b) => b.focusScore - a.focusScore);
    } else if (sortBy === 'change') {
      result.sort((a, b) => b.change24h - a.change24h);
    } else if (sortBy === 'priority') {
      const pOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      result.sort((a, b) => (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0));
    }
    return result;
  }, [focusCoins, searchTerm, sortBy]);

  // Color mappings per rule 51
  const getStatusBadgeStyle = (status: string) => {
    if (status === 'DO NOT CHASE' || status === 'EXIT') {
      return { bg: 'rgba(239, 68, 68, 0.18)', border: '#EF4444', text: '#F87171' }; // Red
    }
    if (status === 'LOCK PROFIT' || status === 'TAKE PROFIT PARTIAL') {
      return { bg: 'rgba(249, 115, 22, 0.18)', border: '#F97316', text: '#FB923C' }; // Orange
    }
    if (status.includes('BUY') || status === 'SCALE IN') {
      return { bg: 'rgba(16, 185, 129, 0.18)', border: '#10B981', text: '#34D399' }; // Green
    }
    if (status === 'HOLD' || status === 'HOLD STRONG') {
      return { bg: 'rgba(59, 130, 246, 0.18)', border: '#3B82F6', text: '#60A5FA' }; // Blue
    }
    return { bg: 'rgba(245, 158, 11, 0.18)', border: '#F59E0B', text: '#FBBF24' }; // Yellow
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#06B6D4'; // Cyan
    if (score >= 70) return '#3B82F6'; // Blue
    if (score >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  if (!isOpen) {
    // Floating Trigger Button on the right edge
    return (
      <button
        onClick={onToggleOpen}
        style={{
          position: 'fixed',
          right: 0,
          top: '45%',
          transform: 'translateY(-50%)',
          backgroundColor: '#8B5CF6',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '10px 0 0 10px',
          padding: '12px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 49,
          boxShadow: '-4px 0 16px rgba(139, 92, 246, 0.5)',
          transition: 'all 0.2s ease',
        }}
        title="เปิดแถบ FOCUS Sidebar"
      >
        <Target size={18} />
        <span
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontWeight: 800,
            fontSize: '11px',
            letterSpacing: '1px',
          }}
        >
          FOCUS ({focusCoins.length})
        </span>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 6px #10B981',
          }}
        />
      </button>
    );
  }

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : '320px',
        backgroundColor: '#0B1120',
        borderLeft: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: isPinned ? 'sticky' : 'fixed',
        top: 0,
        right: 0,
        zIndex: 50,
        boxShadow: isPinned ? 'none' : '-10px 0 30px rgba(0, 0, 0, 0.65)',
        transition: 'width 0.22s ease-in-out',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isCollapsed ? '16px 8px' : '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
              cursor: 'pointer',
            }}
            onClick={() => onOpenFocusPage()}
            title="ไปที่หน้า Focus Intelligence Center"
          >
            <Target size={16} color="#FFFFFF" />
          </div>

          {!isCollapsed && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 900, fontSize: '14px', color: '#FFFFFF', letterSpacing: '0.5px' }}>
                  FOCUS
                </span>
                <span
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '0 6px',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {focusCoins.length}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    color: '#10B981',
                    fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  ● LIVE
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isCollapsed && (
            <>
              <button
                onClick={onRecalculate}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="สแกนและคำนวณสดเดี๋ยวนี้"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={onTogglePin}
                style={{
                  background: isPinned ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                  border: 'none',
                  color: isPinned ? '#A78BFA' : 'var(--text-muted)',
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
              title="ปิดแถบ Focus"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Collapsed View (Icons only) */}
      {isCollapsed ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={onOpenAddModal}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px dashed rgba(139, 92, 246, 0.4)',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#A78BFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="เพิ่มเหรียญเข้า Focus"
          >
            <Plus size={16} />
          </button>

          {focusCoins.map((coin) => (
            <div
              key={coin.symbol}
              onClick={() => {
                onSelectCoin(coin.symbol);
                onOpenFocusPage(coin.symbol);
              }}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor:
                  selectedSymbol === coin.symbol
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  selectedSymbol === coin.symbol
                    ? '1px solid #8B5CF6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
              title={`${coin.symbol} - Focus Score: ${coin.focusScore}`}
            >
              <span style={{ fontWeight: 800, fontSize: '11px', color: '#FFFFFF' }}>
                {coin.symbol}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  color: getScoreColor(coin.focusScore),
                }}
              >
                {coin.focusScore}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Expanded View */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Toolbar: + Add Focus, Compare, Search */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={onOpenAddModal}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Plus size={14} /> + Add Focus
              </button>
              <button
                onClick={onOpenCompareModal}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="เปรียบเทียบ 2-5 เหรียญ"
              >
                Compare
              </button>
            </div>

            {/* Search and Sort */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div
                style={{
                  flex: 1,
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
                  placeholder="ค้นหาใน Focus..."
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
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '10.5px',
                  padding: '4px 6px',
                  outline: 'none',
                }}
              >
                <option value="score">Sort: Score</option>
                <option value="change">Sort: 24h%</option>
                <option value="priority">Sort: Priority</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {filteredCoins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                {searchTerm ? 'ไม่พบเหรียญตามที่ค้นหา' : 'ยังไม่มีเหรียญใน Focus กดปุ่ม + Add Focus ด้านบนเพื่อเริ่มติดตาม'}
              </div>
            ) : (
              filteredCoins.map((coin, idx) => {
                const isSelected = selectedSymbol === coin.symbol;
                const statusBadge = getStatusBadgeStyle(coin.entryIntelligence.status);
                const scoreColor = getScoreColor(coin.focusScore);

                return (
                  <div
                    key={coin.symbol}
                    onClick={() => {
                      onSelectCoin(coin.symbol);
                    }}
                    onDoubleClick={() => onOpenFocusPage(coin.symbol)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: isSelected
                        ? 'rgba(139, 92, 246, 0.16)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected
                        ? '1px solid rgba(139, 92, 246, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Top Row: Symbol, Price, Change */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#FFFFFF' }}>
                          {coin.pair}
                        </span>
                        {coin.priority === 'critical' && (
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: 800,
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#EF4444',
                              padding: '1px 4px',
                              borderRadius: '4px',
                            }}
                          >
                            CRITICAL
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>
                          {currency === 'THB'
                            ? `฿${(coin.currentPrice * 33.24).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                            : `$${coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                        </div>
                        <div
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: coin.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                          }}
                        >
                          {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Score Gauge & Metrics */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      {/* Left: Score Gauge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: `2.5px solid ${scoreColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '12px',
                            color: scoreColor,
                          }}
                        >
                          {coin.focusScore}
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
                            Score {coin.focusScore}
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                            {coin.scoreMomentum} ({coin.scoreDelta >= 0 ? `+${coin.scoreDelta}` : coin.scoreDelta})
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Stats */}
                      <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <div>Trend: <strong style={{ color: 'var(--neon-cyan)' }}>{coin.trends.tf4h.includes('Bull') ? '↑' : '↓'}</strong></div>
                        <div>Vol: <strong style={{ color: '#FFFFFF' }}>{coin.volumeOrderBook.volumeRatio}x</strong></div>
                      </div>
                    </div>

                    {/* Bottom Row: Status Badge & Quick Deep Analysis Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.text,
                          border: `1px solid ${statusBadge.border}`,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {coin.entryIntelligence.status}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCoin(coin.symbol);
                          onOpenFocusPage(coin.symbol);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#A78BFA',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        วิเคราะห์ลึก <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <button
              onClick={() => onOpenFocusPage()}
              style={{
                width: '100%',
                padding: '7px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                color: '#C4B5FD',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Target size={13} /> เปิด Focus Intelligence Center เต็มจอ
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
