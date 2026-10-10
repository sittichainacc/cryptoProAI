import React, { useState } from 'react';
import { BuyNowCandidateItem } from '../types/index.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from './CryptoIcon.js';
import { Zap, ShieldAlert, ArrowUpRight, BarChart2, Target, CheckCircle2, ChevronRight, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface Top5BuyNowWidgetProps {
  candidates: BuyNowCandidateItem[];
  currency: 'THB' | 'USDT';
  onSelectCoin: (symbol: string) => void;
  onOpenAnalysis?: (symbol: string) => void;
  onRecalculate?: () => void;
}

export const Top5BuyNowWidget: React.FC<Top5BuyNowWidgetProps> = ({
  candidates,
  currency,
  onSelectCoin,
  onOpenAnalysis,
  onRecalculate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cryptopro_top5buynow_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cryptopro_top5buynow_expanded', String(next));
      } catch {}
      return next;
    });
  };

  // RULE 1 & 22: If zero coins pass criteria, HIDE this widget completely on Dashboard!
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const multiplier = getCurrencyMultiplier(currency);
  const currencyPrefix = currency === 'THB' ? '฿' : '$';

  return (
    <div
      style={{
        marginBottom: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, var(--bg-card) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Header Banner */}
      <div
        onClick={toggleExpanded}
        style={{
          padding: '16px 20px',
          borderBottom: isExpanded ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.06)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)',
            }}
          >
            <Zap size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.2px' }}>
                Top 5 Buy Now — เหรียญที่มีจังหวะเข้าซื้อได้ ณ เวลานี้
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                {candidates.length} เหรียญผ่านเกณฑ์บังคับ
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: 'var(--neon-cyan)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                }}
              >
                🇹🇭 Bitkub THB
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              คัดกรองเฉพาะเหรียญที่ R:R ≥ 1:2, สัญญาณกราฟไม่ Overextended, ไม่ใช่การไล่ราคา และอยู่ในตำแหน่ง Entry ที่เหมาะสม
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRecalculate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRecalculate();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)')}
            >
              <TrendingUp size={13} />
              <span>คำนวณสดใหม่</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            <span>{isExpanded ? 'ย่อ' : 'ขยาย'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Candidates List / Grid */}
      {isExpanded && (
        <div
          className="top5-buynow-grid custom-large-scrollbar"
          style={{
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
        {candidates.map((item) => {
          const formattedPrice = (item.price * multiplier).toLocaleString(undefined, {
            maximumFractionDigits: item.price * multiplier < 1 ? 4 : 2,
          });
          const formattedEntryMin = (item.entryZone.min * multiplier).toLocaleString(undefined, {
            maximumFractionDigits: item.entryZone.min * multiplier < 1 ? 4 : 2,
          });
          const formattedEntryMax = (item.entryZone.max * multiplier).toLocaleString(undefined, {
            maximumFractionDigits: item.entryZone.max * multiplier < 1 ? 4 : 2,
          });
          const formattedSL = (item.stopLoss * multiplier).toLocaleString(undefined, {
            maximumFractionDigits: item.stopLoss * multiplier < 1 ? 4 : 2,
          });
          const formattedTP1 = (item.tp1 * multiplier).toLocaleString(undefined, {
            maximumFractionDigits: item.tp1 * multiplier < 1 ? 4 : 2,
          });
          const formattedTP2 = (item.tp2 * multiplier).toLocaleString(undefined, {
            maximumFractionDigits: item.tp2 * multiplier < 1 ? 4 : 2,
          });

          const statusColor = item.status === 'STRONG BUY NOW' ? '#10B981' : item.status === 'BUY NOW' ? '#059669' : '#06B6D4';

          return (
            <div
              key={item.symbol}
              style={{
                borderRadius: '14px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                height: '430px',
                maxHeight: '430px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.55)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              {/* Header: Rank + Coin + Status Badge + Price (Fixed, flexShrink: 0) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      flexShrink: 0,
                    }}
                  >
                    #{item.rank}
                  </div>
                  <CryptoIcon symbol={item.symbol} size={28} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.pair || `${item.symbol}/THB`}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--neon-green-light)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        THB
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.name}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 600 }}>
                      {item.currentTrend} • {item.setup}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>ราคา ({currency})</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currencyPrefix}{formattedPrice}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: item.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                    {item.change24h >= 0 ? `+${item.change24h.toFixed(2)}%` : `${item.change24h.toFixed(2)}%`}
                  </div>
                </div>
              </div>

              {/* Status Badge & Score Bar (Fixed, flexShrink: 0) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  flexShrink: 0,
                  marginTop: '8px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: statusColor,
                      letterSpacing: '0.4px',
                    }}
                  >
                    {item.status}
                  </span>
                  {item.isHighRisk && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      HIGH RISK
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Buy Now:</span>
                  <span style={{ fontWeight: 800, color: '#34D399', fontSize: '12.5px' }}>{item.buyNowScore}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span style={{ color: 'var(--text-muted)' }}>R:R:</span>
                  <span style={{ fontWeight: 800, color: '#60A5FA' }}>{item.riskReward}</span>
                  {item.confidenceScore && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>|</span>
                      <span style={{ color: 'var(--text-muted)' }}>Conf:</span>
                      <span style={{ fontWeight: 800, color: '#FBBF24' }}>{item.confidenceScore}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Content Body with Custom Large Scrollbar (flex: 1, minHeight: 0) */}
              <div
                className="custom-large-scrollbar"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Trade Levels Plan Box (Safe wrapping with minWidth 0) */}
                <div
                  style={{
                    padding: '9px 11px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '8px',
                    fontSize: '11px',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>🎯 โซนเข้า (Entry - THB)</div>
                    <div style={{ fontWeight: 700, color: '#34D399', marginTop: '2px', wordBreak: 'break-word', fontSize: '10.5px' }}>
                      {currencyPrefix}{formattedEntryMin} – {formattedEntryMax}
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>🛑 ตัดขาดทุน (SL - THB)</div>
                    <div style={{ fontWeight: 700, color: '#F87171', marginTop: '2px', wordBreak: 'break-word', fontSize: '10.5px' }}>
                      {currencyPrefix}{formattedSL} (-{item.riskPct}%)
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>🚀 เป้าแรก (TP1 - THB)</div>
                    <div style={{ fontWeight: 700, color: '#60A5FA', marginTop: '2px', wordBreak: 'break-word', fontSize: '10.5px' }}>
                      {currencyPrefix}{formattedTP1} (+{item.rewardPct}%)
                    </div>
                  </div>
                </div>

                {/* Why Buy Now Quant Bullet Points (Shows full reasons, scrollable) */}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--neon-green-light)', letterSpacing: '0.2px' }}>
                    เหตุผลเชิงปริมาณ ({item.whyBuyNow.length} ข้อ):
                  </div>
                  {item.whyBuyNow.map((reason, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#10B981', flexShrink: 0, marginTop: '2px', fontSize: '12px' }}>•</span>
                      <span style={{ lineHeight: '1.45', wordBreak: 'break-word' }}>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons (Fixed at bottom - separated by border, NEVER overlaps text) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => onSelectCoin(item.symbol)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60A5FA',
                    borderRadius: '7px',
                    padding: '7px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)')}
                >
                  <BarChart2 size={12} />
                  <span>เปิดกราฟสด ({item.symbol})</span>
                </button>

                {onOpenAnalysis && (
                  <button
                    onClick={() => onOpenAnalysis(item.symbol)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34D399',
                      borderRadius: '7px',
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)')}
                  >
                    <span>วิเคราะห์ลึก</span>
                    <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
