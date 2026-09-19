import React from 'react';
import { TickerData } from '../types/index.js';
import { X, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Shield, Target } from 'lucide-react';

interface CoinAnalysisModalProps {
  coin: TickerData | null;
  onClose: () => void;
  currency: 'THB' | 'USDT';
}

export const CoinAnalysisModal: React.FC<CoinAnalysisModalProps> = ({ coin, onClose, currency }) => {
  if (!coin) return null;

  const multiplier = currency === 'THB' ? 34.5 : 1;
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
          backgroundColor: '#0F172A',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.2)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '18px',
                color: '#FFF',
              }}
            >
              {coin.symbol.slice(0, 2)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800 }}>{coin.symbol}</span>
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
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

        {/* Score & Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ราคาปัจจุบัน</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
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

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px' }}>
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
            backgroundColor: 'rgba(16, 24, 43, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
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
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#E2E8F0', marginBottom: '10px' }}>
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
      </div>
    </div>
  );
};
