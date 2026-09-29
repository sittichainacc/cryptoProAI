import React from 'react';
import { RefreshCw, Clock, ChevronRight, ChevronDown, Plus, ShieldAlert } from 'lucide-react';
import { CryptoIcon } from './CryptoIcon.js';

/** สีประจำแต่ละส่วน (โครงเดียวกับ TOP BUY NOW ต่างกันเฉพาะสีเน้น) */
export interface TopPicksTheme {
  accent: string;       // สีหลัก เช่น #10B981
  accentLight: string;  // สีตัวอักษรเน้น เช่น #34D399
  gradient: string;     // gradient ของไอคอน/ปุ่ม ADD TO FOCUS
  glowRgb: string;      // "16, 185, 129" สำหรับ rgba()
  tintRgb: string;      // สีรองของพื้นหลัง "6, 182, 212"
}

export const TOP_PICKS_THEMES: Record<'buyNow' | 'ultimate' | 'premium', TopPicksTheme> = {
  buyNow: { accent: '#10B981', accentLight: '#34D399', gradient: 'linear-gradient(135deg, #10B981, #06B6D4)', glowRgb: '16, 185, 129', tintRgb: '6, 182, 212' },
  ultimate: { accent: '#38BDF8', accentLight: '#7DD3FC', gradient: 'linear-gradient(135deg, #0EA5E9, #8B5CF6)', glowRgb: '56, 189, 248', tintRgb: '139, 92, 246' },
  premium: { accent: '#F59E0B', accentLight: '#FBBF24', gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', glowRgb: '245, 158, 11', tintRgb: '239, 68, 68' },
};

export interface TopPickCard {
  symbol: string;
  priceText: string;
  change24h: number;
  status: { label: string; color: string };
  scoreLabel: string;
  score: number | string;
  metrics: { label: string; value: string; color?: string }[];
  rankChange?: { rankDelta: number; isNew: boolean };
  flash?: 'up' | 'down';
}

interface FocusTopPicksSectionProps {
  title: string;
  liveBadge: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: TopPicksTheme;
  collapsed: boolean;
  onToggle: () => void;
  dataAgeSec: number;
  isLoading: boolean;
  onRecalculate: () => void;
  cards: TopPickCard[];
  summaryChip: string;
  summaryText: string;
  emptyTitle: string;
  emptyMessage: React.ReactNode;
  onAdd: (symbol: string) => void;
  onView: (symbol: string) => void;
}

export const FocusTopPicksSection: React.FC<FocusTopPicksSectionProps> = ({
  title, liveBadge, subtitle, icon, theme, collapsed, onToggle, dataAgeSec, isLoading, onRecalculate,
  cards, summaryChip, summaryText, emptyTitle, emptyMessage, onAdd, onView,
}) => {
  const rgba = (a: number, rgb = theme.glowRgb) => `rgba(${rgb}, ${a})`;

  return (
    <div
      style={{
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${rgba(0.12)} 0%, ${rgba(0.06, theme.tintRgb)} 50%, rgba(15, 23, 42, 0.85) 100%)`,
        border: `1px solid ${rgba(0.4)}`,
        boxShadow: `0 8px 28px ${rgba(0.15)}`,
        overflow: 'hidden',
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Banner Title & Engine Rules */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div onClick={onToggle} className="collapsible-header-clickable" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '38px', height: '38px', borderRadius: '10px', background: theme.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${rgba(0.4)}`,
            }}
          >
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px' }}>{title}</h2>
              <span
                style={{
                  fontSize: '10.5px', fontWeight: 800, backgroundColor: rgba(0.25), color: theme.accentLight,
                  border: `1px solid ${rgba(0.4)}`, padding: '2px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span className="live-green-pulse" style={{ width: '5.5px', height: '5.5px', borderRadius: '50%', backgroundColor: theme.accent }} />
                {liveBadge}
              </span>
              {collapsed && <span className="collapsible-summary-chip">{summaryChip}</span>}
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> Live Scan: <strong style={{ color: theme.accentLight }}>{dataAgeSec}s ago</strong>
          </span>
          <button
            onClick={onRecalculate}
            disabled={isLoading}
            style={{
              padding: '6px 12px', borderRadius: '8px', backgroundColor: rgba(0.15), border: `1px solid ${rgba(0.35)}`,
              color: theme.accentLight, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            คำนวณสด
          </button>
          <button onClick={onToggle} className="collapse-toggle-btn" title={collapsed ? `ขยาย ${title}` : `ย่อ ${title}`}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            <span>{collapsed ? 'ขยาย' : 'ย่อ'}</span>
          </button>
        </div>
      </div>

      {collapsed ? (
        /* Collapsed summary pill */
        <div
          onClick={onToggle}
          style={{
            cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: `1px dashed ${rgba(0.35)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '8px', fontSize: '12px',
          }}
        >
          <span style={{ color: theme.accentLight, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-green-pulse" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: theme.accent }} />
            สถานะ: {summaryText}
          </span>
          <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: 700 }}>คลิกเพื่อขยายดูการ์ดเหรียญ</span>
        </div>
      ) : cards.length === 0 ? (
        <div
          style={{
            padding: '24px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.35)', border: '1px dashed rgba(245, 158, 11, 0.35)',
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          }}
        >
          <ShieldAlert size={26} color="#F59E0B" />
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#FBBF24' }}>{emptyTitle}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '650px' }}>{emptyMessage}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))', gap: '12px' }}>
          {cards.slice(0, 5).map((card, idx) => {
            const isNew = !!card.rankChange?.isNew;
            const isUp = !!card.rankChange && card.rankChange.rankDelta > 0;
            const isDown = !!card.rankChange && card.rankChange.rankDelta < 0;
            return (
              <div
                key={card.symbol}
                className={`rank-slide ${isUp ? 'card-glow-green' : isDown ? 'card-glow-orange' : ''}`}
                style={{
                  padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: isNew ? '1.5px solid #06B6D4' : isUp ? `1.5px solid ${theme.accent}` : `1px solid ${rgba(0.3)}`,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', gap: '10px',
                  transition: 'all 0.35s ease', position: 'relative', minWidth: 0,
                }}
              >
                {/* Top Line: Rank, Symbol, Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '11px', fontWeight: 900,
                        backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: idx === 0 ? '#FBBF24' : idx === 1 ? '#CBD5E1' : '#94A3B8',
                        padding: '2px 7px', borderRadius: '6px',
                        border: `1px solid ${idx === 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <CryptoIcon symbol={card.symbol} size={22} />
                    <strong style={{ fontSize: '16px', color: '#FFFFFF', letterSpacing: '-0.2px' }}>{card.symbol}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/THB</span>
                    {isNew && (
                      <span style={{ fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(6, 182, 212, 0.25)', color: '#22D3EE', border: '1px solid #06B6D4' }}>NEW</span>
                    )}
                    {isUp && (
                      <span style={{ fontSize: '9.5px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.25)', color: '#34D399', border: '1px solid #10B981' }}>↑ +{card.rankChange!.rankDelta}</span>
                    )}
                    {isDown && (
                      <span style={{ fontSize: '9.5px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(249, 115, 22, 0.25)', color: '#FB923C', border: '1px solid #F97316' }}>↓ {card.rankChange!.rankDelta}</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
                      backgroundColor: `color-mix(in srgb, ${card.status.color} 20%, transparent)`, color: card.status.color, border: `1px solid ${card.status.color}`,
                    }}
                  >
                    {card.status.label}
                  </span>
                </div>

                {/* Price & Score */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div
                      className={card.flash === 'up' ? 'price-flash-up' : card.flash === 'down' ? 'price-flash-down' : ''}
                      style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', transition: 'background-color 0.4s ease' }}
                    >
                      {card.priceText}
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: card.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {card.change24h >= 0 ? '+' : ''}{card.change24h.toFixed(2)}% (24h)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{card.scoreLabel}</div>
                    <div style={{ fontSize: '19px', fontWeight: 900, color: theme.accentLight }}>
                      {card.score}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', padding: '8px',
                    borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.3)', fontSize: '10.5px',
                  }}
                >
                  {card.metrics.map((m) => (
                    <div key={m.label} style={{ minWidth: 0 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{m.label}:</span>
                      <div style={{ color: m.color ?? '#FFFFFF', fontWeight: 700, overflowWrap: 'anywhere' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    onClick={() => onAdd(card.symbol)}
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: '8px', background: theme.gradient, border: 'none', color: '#FFFFFF',
                      fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', boxShadow: `0 0 10px ${rgba(0.3)}`,
                    }}
                  >
                    <Plus size={13} /> ADD TO FOCUS
                  </button>
                  <button
                    onClick={() => onView(card.symbol)}
                    style={{
                      padding: '7px 10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    }}
                    title="ดูการวิเคราะห์เชิงลึกใน Decision Cockpit"
                  >
                    ดูข้อมูล
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
