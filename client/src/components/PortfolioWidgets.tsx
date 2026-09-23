import React, { useState } from 'react';
import { PortfolioSummary } from '../types/index.js';
import { ArrowUpRight } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface PortfolioWidgetsProps {
  portfolio: PortfolioSummary | null;
  currency: 'THB' | 'USDT';
}

export const PortfolioWidgets: React.FC<PortfolioWidgetsProps> = ({ portfolio, currency }) => {
  const [activeTf, setActiveTf] = useState('1M');

  if (!portfolio) return null;

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const totalDisplay = (portfolio.totalValue * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const returnUsdDisplay = (portfolio.totalReturnUsd * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

  return (
    <>
      {/* 1. Portfolio Allocation Donut */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '10px' }}>
          <div className="card-title" style={{ fontSize: '13.5px' }}>
            การจัดสรรพอร์ต (ตัวอย่าง)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Donut Chart with Center Label */}
          <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" width="100" height="100">
              {donutSlices.map((slice) => (
                <path
                  key={slice.symbol}
                  d={slice.pathD}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              ))}
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
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 800 }}>{prefix}{totalDisplay}</span>
              <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--neon-green-light)' }}>
                +{portfolio.totalReturnPct}%
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', flex: 1, fontSize: '11px' }}>
            {portfolio.allocation.map((item) => (
              <div key={item.symbol} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{item.symbol}</span>
                <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Portfolio Return Chart */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '8px' }}>
          <div className="card-title" style={{ fontSize: '13.5px' }}>
            ผลตอบแทนพอร์ต
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
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
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-green-light)' }}>
            +{portfolio.totalReturnPct}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            (+{prefix}{returnUsdDisplay} {currency})
          </div>
        </div>

        {/* Mini Curved Equity Graph */}
        <div style={{ height: '54px', width: '100%' }}>
          <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 50 Q 30 45, 60 40 T 120 25 T 160 18 T 200 6 L 200 60 L 0 60 Z"
              fill="url(#equityGrad)"
            />
            <path
              d="M 0 50 Q 30 45, 60 40 T 120 25 T 160 18 T 200 6"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>
    </>
  );
};
