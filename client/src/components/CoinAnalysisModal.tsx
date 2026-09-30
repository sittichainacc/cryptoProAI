import React from 'react';
import { TickerData } from '../types/index.js';
import { X, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Shield, Target, ShieldAlert, LogIn } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from './CryptoIcon.js';

interface CoinAnalysisModalProps {
  coin: TickerData | null;
  onClose: () => void;
  currency: 'THB' | 'USDT';
  userRole?: 'admin' | 'analyst' | 'investor';
  onOpenLogin?: () => void;
}

export const CoinAnalysisModal: React.FC<CoinAnalysisModalProps> = ({ 
  coin, 
  onClose, 
  currency,
  userRole = 'analyst',
  onOpenLogin,
}) => {
  if (!coin) return null;

  const isAdmin = userRole === 'admin';
  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const displayPrice = (coin.price * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: coin.price < 1 ? 4 : 2,
    maximumFractionDigits: coin.price < 1 ? 4 : 2,
  });

  const support = (coin.price * 0.94 * multiplier).toFixed(coin.price < 1 ? 4 : 2);
  const resistance = (coin.price * 1.12 * multiplier).toFixed(coin.price < 1 ? 4 : 2);
  const invalidation = (coin.price * 0.90 * multiplier).toFixed(coin.price < 1 ? 4 : 2);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="crypto-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Official Coin Icon */}
            <CryptoIcon symbol={coin.symbol} size={42} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{coin.symbol}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{coin.name}</span>
                <span className="badge badge-strong-buy">{coin.signalLabelTh}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                หมวดหมู่: <strong style={{ color: 'var(--neon-cyan)' }}>{coin.sector.toUpperCase()}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* If non-premium: Display "สำหรับสมาชิก Premium" */}
        {!isAdmin ? (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '14px',
              margin: '10px 0',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                margin: '0 auto 14px auto',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(153, 27, 27, 0.4))',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              }}
            >
              <ShieldAlert size={32} color="#EF4444" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              สำหรับสมาชิก Premium
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '440px', margin: '0 auto 12px auto' }}>
              การวิเคราะห์เชิงลึกเหรียญ <strong style={{ color: 'var(--neon-cyan)' }}>{coin.symbol}</strong> (โมเดล AI Score, Technical Score, Trade Levels, AI Thai Rationale) สำหรับ <strong style={{ color: '#F59E0B' }}>สมาชิก Premium</strong> เท่านั้น
            </p>

            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#FDE047', fontSize: '11.5px', fontWeight: 700, marginBottom: '18px' }}>
              ต้องสมัครสมาชิกเดือนละ 10 บาท / ปีละ 110 บาท
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {onOpenLogin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบในฐานะ Premium</span>
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Score & Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ราคาปัจจุบัน</div>
                <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {prefix}{displayPrice}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  }}
                >
                  {coin.change24h > 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>AI Score</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '4px' }}>
                  {coin.aiScore} <span style={{ fontSize: '12px', fontWeight: 600 }}>/100</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-blue-light)' }}>Technical Score</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--neon-blue-light)', marginTop: '4px' }}>
                  {coin.technicalScore}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>({coin.scoreGrade})</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ความเสี่ยง (Risk)</div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    marginTop: '4px',
                    color: coin.riskLevel === 'Low' ? '#10B981' : coin.riskLevel === 'Medium' ? '#F59E0B' : '#EF4444',
                  }}
                >
                  {coin.riskLevel}
                </div>
              </div>
            </div>

            {/* AI Thai Rationale Box (Section 14 & 47) */}
            <div
              style={{
                backgroundColor: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--neon-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <Sparkles size={16} />
                บทวิเคราะห์และเหตุผลประกอบจาก AI (Human-Readable)
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                {coin.signalReasonTh}
              </p>
            </div>

            {/* Key Trade Levels (S/R, Entry, Invalidation) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> แนวรับสำคัญ (Support)
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>
                  {prefix}{support}
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={12} /> แนวต้านเป้าหมาย (Target)
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>
                  {prefix}{resistance}
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> จุดตัดขาดทุน (Invalidation)
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>
                  {prefix}{invalidation}
                </div>
              </div>
            </div>

            {/* Decision Support Disclaimer */}
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              * ระบบนี้เป็น Decision Support System ช่วยประมวลผลข้อมูลทางเทคนิค ไม่ใช่ระบบการันตีกำไร ผู้ลงทุนควรบริหารความเสี่ยงอย่างเคร่งครัด
            </div>
          </>
        )}
      </div>
    </div>
  );
};
