import React from 'react';
import { BuyNowCandidateItem } from '../types/index.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { Zap, ShieldAlert, ArrowUpRight, BarChart2, Target, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';

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
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.06)',
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
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
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
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0' }}>
              คัดกรองเฉพาะเหรียญที่ R:R ≥ 1:2, สัญญาณกราฟไม่ Overextended, ไม่ใช่การไล่ราคา และอยู่ในตำแหน่ง Entry ที่เหมาะสม
            </p>
          </div>
        </div>

        {onRecalculate && (
          <button
            onClick={onRecalculate}
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
      </div>

      {/* Candidates List / Grid */}
      <div
        style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
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
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Header: Rank + Coin + Status Badge + Price */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    #{item.rank}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>{item.symbol}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.name}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 600 }}>
                      {item.currentTrend} • {item.setup}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                    {currencyPrefix}{formattedPrice}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: item.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                    {item.change24h >= 0 ? `+${item.change24h.toFixed(2)}%` : `${item.change24h.toFixed(2)}%`}
                  </div>
                </div>
              </div>

              {/* Status Badge & Score Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
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

              {/* Trade Levels Plan Box */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  fontSize: '11px',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>🎯 โซนเข้าซื้อ (Entry)</div>
                  <div style={{ fontWeight: 700, color: '#34D399', marginTop: '2px' }}>
                    {currencyPrefix}{formattedEntryMin} – {formattedEntryMax}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>🛑 จุดตัดขาดทุน (SL)</div>
                  <div style={{ fontWeight: 700, color: '#F87171', marginTop: '2px' }}>
                    {currencyPrefix}{formattedSL} (-{item.riskPct}%)
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>🚀 เป้าแรก (TP1)</div>
                  <div style={{ fontWeight: 700, color: '#60A5FA', marginTop: '2px' }}>
                    {currencyPrefix}{formattedTP1} (+{item.rewardPct}%)
                  </div>
                </div>
              </div>

              {/* Why Buy Now Quant Bullet Points */}
              <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {item.whyBuyNow.slice(0, 3).map((reason, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: '#10B981', flexShrink: 0, marginTop: '1px' }}>•</span>
                    <span style={{ lineHeight: '1.4' }}>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
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
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
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
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
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
    </div>
  );
};
