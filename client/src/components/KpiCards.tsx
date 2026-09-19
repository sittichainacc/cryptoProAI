import React from 'react';
import { MarketOverviewKPIs } from '../types/index.js';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ChevronRight } from 'lucide-react';

interface KpiCardsProps {
  kpis: MarketOverviewKPIs | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  if (!kpis) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="crypto-card" style={{ height: '110px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const renderMiniSparkline = (points: number[], color: string) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 85;
    const height = 30;

    const pathD = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 6) - 3;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}
    >
      {/* 1. Total Market Cap */}
      <div className="crypto-card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          มูลค่าตลาดรวม (Crypto)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {kpis.totalMarketCapFormatted}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: kpis.marketCapChange24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                marginTop: '4px',
              }}
            >
              {kpis.marketCapChange24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{kpis.marketCapChange24h > 0 ? `+${kpis.marketCapChange24h}%` : `${kpis.marketCapChange24h}%`}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '2px' }}>(24h)</span>
            </div>
          </div>
          <div>{renderMiniSparkline(kpis.marketCapSparkline, '#10B981')}</div>
        </div>
      </div>

      {/* 2. 24H Volume */}
      <div className="crypto-card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          ปริมาณการซื้อขาย (24h)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {kpis.volume24hFormatted}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: kpis.volumeChange24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                marginTop: '4px',
              }}
            >
              <ArrowUpRight size={14} />
              <span>+{kpis.volumeChange24h}%</span>
            </div>
          </div>
          <div>{renderMiniSparkline(kpis.volumeSparkline, '#06B6D4')}</div>
        </div>
      </div>

      {/* 3. BTC Dominance */}
      <div className="crypto-card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          BTC Dominance
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {kpis.btcDominance}%
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: kpis.btcDominanceChange24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                marginTop: '4px',
              }}
            >
              <ArrowDownRight size={14} />
              <span>{kpis.btcDominanceChange24h}%</span>
            </div>
          </div>
          <div>{renderMiniSparkline(kpis.btcDominanceSparkline, '#F59E0B')}</div>
        </div>
      </div>

      {/* 4. Fear & Greed Index */}
      <div className="crypto-card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Fear & Greed Index
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800 }}>{kpis.fearAndGreedIndex}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
              {kpis.fearAndGreedSentiment}
            </span>
          </div>

          {/* Horizontal Color Gauge */}
          <div
            style={{
              height: '6px',
              borderRadius: '6px',
              background: 'linear-gradient(to right, #EF4444 0%, #F59E0B 40%, #10B981 100%)',
              position: 'relative',
              marginTop: '12px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-3px',
                left: `${kpis.fearAndGreedIndex}%`,
                width: '12px',
                height: '12px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                boxShadow: '0 0 6px #000',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Market AI Trend */}
      <div
        className="crypto-card"
        style={{
          padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(11, 16, 29, 0.95))',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          แนวโน้มตลาด (AI)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={22} color="var(--neon-green-light)" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--neon-green-light)' }}>
                {kpis.marketAITrend.statusTh}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                มีโอกาสเป็นขาขึ้นในระยะกลาง
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
};
