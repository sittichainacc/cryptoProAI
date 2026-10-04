import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { WhaleRadarSummary } from '../types/index.js';
import { Radar, ArrowUpRight, ArrowDownRight, Compass, Sparkles, ChevronRight, ShieldAlert } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface QuoteBannerCardProps {
  currency?: 'THB' | 'USDT';
  onSelectCoin?: (symbol: string) => void;
  onViewAllRadar?: () => void;
}

export const QuoteBannerCard: React.FC<QuoteBannerCardProps> = ({
  currency = 'THB',
  onSelectCoin,
  onViewAllRadar,
}) => {
  const [activeMode, setActiveMode] = useState<'RADAR' | 'WISDOM'>('RADAR');
  const [whaleData, setWhaleData] = useState<WhaleRadarSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadWhale = async () => {
      try {
        const res = await api.getWhaleRadar();
        if (isMounted) setWhaleData(res);
      } catch (err) {
        console.error('Failed to load whale radar in quote banner:', err);
      }
    };
    loadWhale();
    const interval = setInterval(loadWhale, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const latestTx = whaleData?.transactions?.[0];

  return (
    <div
      className="crypto-card"
      style={{
        background: activeMode === 'RADAR'
          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(15, 23, 42, 0.9), var(--bg-card))'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(239, 68, 68, 0.06), var(--bg-card))',
        border: activeMode === 'RADAR' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '210px',
      }}
    >
      <div>
        {/* Header with Mode Toggle */}
        <div className="card-header-row" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeMode === 'RADAR' ? (
              <Radar size={16} color="var(--neon-cyan)" />
            ) : (
              <Sparkles size={16} color="#F59E0B" />
            )}
            <div className="card-title" style={{ fontSize: '13.5px' }}>
              {activeMode === 'RADAR' ? 'เรดาร์อัจฉริยะ (Smart Radar)' : 'ปรัชญาการลงทุน'}
            </div>
          </div>

          {/* Toggle pill */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setActiveMode('RADAR')}
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: activeMode === 'RADAR' ? 'var(--neon-cyan)' : 'transparent',
                color: activeMode === 'RADAR' ? '#000' : 'var(--text-muted)',
              }}
            >
              เรดาร์วาฬ
            </button>
            <button
              onClick={() => setActiveMode('WISDOM')}
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: activeMode === 'WISDOM' ? '#F59E0B' : 'transparent',
                color: activeMode === 'WISDOM' ? '#000' : 'var(--text-muted)',
              }}
            >
              คำคม
            </button>
          </div>
        </div>

        {activeMode === 'RADAR' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>พฤติกรรมเจ้ามือ (Sentiment)</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--neon-green)', marginTop: '2px' }}>
                  {whaleData ? `${whaleData.whaleSentimentPct}% สะสม` : '74% สะสม'}
                </div>
              </div>

              <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net Exchange Flow</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                  {whaleData ? whaleData.netExchangeFlowFormatted : '-$42.8M'}
                </div>
              </div>
            </div>

            {/* Latest Whale Anomaly Transaction */}
            {latestTx ? (
              <div
                onClick={() => onSelectCoin?.(latestTx.symbol)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
                title={`คลิกเพื่อเปิดดูกราฟ ${latestTx.symbol}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🐋</span>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FFFFFF' }}>
                      {latestTx.symbol}: {latestTx.amount.toLocaleString()} {latestTx.symbol}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                      {latestTx.actionTh} • {latestTx.timeAgo}
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '11px', fontWeight: 800, color: latestTx.sentiment === 'BULLISH' ? 'var(--neon-green)' : '#F87171' }}>
                  {prefix}{(latestTx.valueUsd * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ) : (
              <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                กำลังติดตามธุรกรรม On-Chain ผิดปกติ...
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#F59E0B', marginBottom: '2px' }}>
              Better Analysis
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              A Brighter Tomorrow
            </div>
            <div
              style={{
                fontSize: '12px',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              “วิเคราะห์ให้แม่นยำ ลงทุนอย่างมีวินัย ไม่ไล่ราคา สู่อนาคตทางการเงินที่ยั่งยืน”
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          marginTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '10.5px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--neon-cyan)' }}>
          <Compass size={12} /> สแกน On-Chain สด
        </span>

        {onViewAllRadar && (
          <span
            onClick={onViewAllRadar}
            style={{ color: '#C4B5FD', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <span>ดูเรดาร์เต็มจอ</span>
            <ChevronRight size={12} />
          </span>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          right: '-15px',
          bottom: '-20px',
          opacity: 0.12,
          fontSize: '70px',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {activeMode === 'RADAR' ? '📡' : '☀️'}
      </div>
    </div>
  );
};
