import React, { useState } from 'react';
import { PortfolioSummary } from '../types/index.js';
import { ChevronRight, TrendingUp, PieChart, ExternalLink, ShieldCheck } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface PortfolioWidgetsProps {
  portfolio: PortfolioSummary | null;
  currency: 'THB' | 'USDT';
  onSelectCoin?: (symbol: string) => void;
  onViewFullPortfolio?: () => void;
}

export const PortfolioWidgets: React.FC<PortfolioWidgetsProps> = ({
  portfolio,
  currency,
  onSelectCoin,
  onViewFullPortfolio,
}) => {
  const [activeTf, setActiveTf] = useState('3M');
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  if (!portfolio) {
    return (
      <div className="crypto-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        กำลังโหลดข้อมูลการวิเคราะห์พอร์ตโฟลิโอ...
      </div>
    );
  }

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Dynamic calculations based on active timeframe
  const tfMultipliers: Record<string, { factor: number; path: string }> = {
    '1W': { factor: 0.25, path: 'M 0 45 Q 40 42, 80 36 T 140 28 T 200 18' },
    '1M': { factor: 0.60, path: 'M 0 48 Q 50 42, 90 32 T 150 22 T 200 12' },
    '3M': { factor: 1.00, path: 'M 0 50 Q 30 45, 60 40 T 120 25 T 160 18 T 200 6' },
    '6M': { factor: 1.55, path: 'M 0 54 Q 40 48, 80 30 T 130 18 T 200 4' },
    '1Y': { factor: 2.30, path: 'M 0 56 Q 30 50, 70 26 T 120 14 T 200 2' },
    'ALL': { factor: 3.50, path: 'M 0 58 Q 25 48, 60 22 T 110 10 T 200 1' },
  };

  const currentTfConfig = tfMultipliers[activeTf] || tfMultipliers['3M'];
  const currentReturnPct = (portfolio.totalReturnPct * currentTfConfig.factor).toFixed(2);
  const currentReturnAmount = (portfolio.totalReturnUsd * currentTfConfig.factor * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalDisplay = (portfolio.totalValue * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // SVG Donut calculation
  let cumulativePercent = 0;
  const donutSlices = portfolio.allocation.map((item) => {
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += item.percentage;
    const endAngle = (cumulativePercent / 100) * 360;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + 38 * Math.cos(startRad);
    const y1 = 50 + 38 * Math.sin(startRad);
    const x2 = 50 + 38 * Math.cos(endRad);
    const y2 = 50 + 38 * Math.sin(endRad);

    const largeArc = item.percentage > 50 ? 1 : 0;
    const pathD = `M ${x1} ${y1} A 38 38 0 ${largeArc} 1 ${x2} ${y2}`;

    return {
      ...item,
      pathD,
    };
  });

  const isLiveDb = portfolio.totalValue > 0 && portfolio.allocation.length > 0;

  return (
    <>
      {/* 1. Portfolio Allocation Donut */}
      <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="card-header-row" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PieChart size={16} color="var(--neon-cyan)" />
              <div className="card-title" style={{ fontSize: '13.5px' }}>
                การจัดสรรพอร์ต (Allocation)
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: isLiveDb ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                  color: isLiveDb ? '#34D399' : '#C4B5FD',
                  border: `1px solid ${isLiveDb ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                }}
              >
                {isLiveDb ? '☁️ เชื่อม DB พอร์ต' : 'ตัวอย่างพอร์ต'}
              </span>
            </div>

            {onViewFullPortfolio && (
              <div
                className="card-action-link"
                onClick={onViewFullPortfolio}
                style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--neon-cyan)' }}
                title="ไปที่หน้าบริหารจัดการพอร์ตโฟลิโอฉบับเต็ม"
              >
                <span>ดูพอร์ตฉบับเต็ม</span>
                <ChevronRight size={14} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
            {/* Donut Chart with Center Label */}
            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" width="100" height="100">
                {donutSlices.map((slice) => {
                  const isHovered = hoveredSymbol === slice.symbol;
                  return (
                    <path
                      key={slice.symbol}
                      d={slice.pathD}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isHovered ? '17' : '14'}
                      strokeLinecap="round"
                      style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
                      onMouseEnter={() => setHoveredSymbol(slice.symbol)}
                      onMouseLeave={() => setHoveredSymbol(null)}
                      onClick={() => onSelectCoin?.(slice.symbol)}
                    />
                  );
                })}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '11.5px', fontWeight: 800 }}>
                  {hoveredSymbol || `${prefix}${totalDisplay}`}
                </span>
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--neon-green-light)' }}>
                  +{portfolio.totalReturnPct}%
                </span>
              </div>
            </div>

            {/* Legend Items */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', flex: 1, fontSize: '11px' }}>
              {portfolio.allocation.map((item) => {
                const isHovered = hoveredSymbol === item.symbol;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectCoin?.(item.symbol)}
                    onMouseEnter={() => setHoveredSymbol(item.symbol)}
                    onMouseLeave={() => setHoveredSymbol(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    title={`คลิกเพื่อเปิดดูกราฟและบทวิเคราะห์เหรียญ ${item.symbol}`}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <strong style={{ color: isHovered ? '#60A5FA' : 'var(--text-secondary)' }}>{item.symbol}</strong>
                    <span style={{ fontWeight: 700, marginLeft: 'auto', color: '#CBD5E1' }}>{item.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>คลิกที่ชื่อเหรียญเพื่อเปิดดูกราฟสด</span>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{portfolio.allocation.length} เหรียญในพอร์ต</span>
        </div>
      </div>

      {/* 2. Portfolio Return Chart */}
      <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="card-header-row" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="var(--neon-green-light)" />
              <div className="card-title" style={{ fontSize: '13.5px' }}>
                ผลตอบแทนพอร์ต (Return)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '3px', backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '2px', borderRadius: '6px' }}>
              {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTf(tf)}
                  style={{
                    background: activeTf === tf ? 'var(--neon-blue)' : 'transparent',
                    color: activeTf === tf ? '#FFF' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: 'var(--neon-green-light)' }}>
                +{currentReturnPct}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                (+{prefix}{currentReturnAmount} {currency}) ในช่วง {activeTf}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '10.5px' }}>
              <div style={{ color: 'var(--text-muted)' }}>ความแม่นยำ (Win Rate)</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8' }}>72.4%</div>
            </div>
          </div>

          {/* Mini Curved Equity Graph */}
          <div style={{ height: '54px', width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`equityGrad-${activeTf}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${currentTfConfig.path} L 200 60 L 0 60 Z`}
                fill={`url(#equityGrad-${activeTf})`}
              />
              <path
                d={currentTfConfig.path}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>สูงสุด: <strong style={{ color: '#34D399' }}>SOL (+28.4%)</strong></span>
          {onViewFullPortfolio && (
            <span
              onClick={onViewFullPortfolio}
              style={{ color: '#C4B5FD', cursor: 'pointer', fontWeight: 700 }}
            >
              + บันทึกการเทรด →
            </span>
          )}
        </div>
      </div>
    </>
  );
};
