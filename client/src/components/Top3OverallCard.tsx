import React from 'react';
import { Top3OverallItem } from '../types/index.js';
import { Award, ChevronRight } from 'lucide-react';
import { PriceCell } from './PriceCell.js';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface Top3OverallCardProps {
  items: Top3OverallItem[];
  onSelectCoin: (symbol: string) => void;
  onViewAll?: () => void;
  currency: 'THB' | 'USDT';
  hideHeader?: boolean;
}

export const Top3OverallCard: React.FC<Top3OverallCardProps> = ({
  items,
  onSelectCoin,
  onViewAll,
  currency,
  hideHeader,
}) => {
  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const getColorTheme = (type: 'gold' | 'silver' | 'bronze') => {
    if (type === 'gold') {
      return {
        border: 'rgba(245, 158, 11, 0.4)',
        bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 24, 43, 0.9))',
        badgeBg: '#F59E0B',
        textColor: '#FBBF24',
      };
    }
    if (type === 'silver') {
      return {
        border: 'rgba(148, 163, 184, 0.4)',
        bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.12), rgba(16, 24, 43, 0.9))',
        badgeBg: '#94A3B8',
        textColor: '#CBD5E1',
      };
    }
    return {
      border: 'rgba(217, 119, 6, 0.4)',
      bg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(16, 24, 43, 0.9))',
      badgeBg: '#B45309',
      textColor: '#F59E0B',
    };
  };

  return (
    <div style={{ marginTop: hideHeader ? '0' : '20px' }}>
      {!hideHeader && (
        <div className="card-header-row" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--neon-amber)" />
            <div className="card-title" style={{ fontSize: '15px' }}>
              ตัวเด่นที่สุดตอนนี้ (Top 3 Overall)
            </div>
          </div>
          <div className="card-action-link" onClick={onViewAll}>
            <span>ดูเหตุผลทั้งหมด</span>
            <ChevronRight size={14} />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}
      >
        {items.map((item) => {
          const theme = getColorTheme(item.colorType);

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectCoin(item.symbol)}
              style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '14px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Trophy Rank Badge */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: theme.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '20px',
                  fontWeight: 900,
                  boxShadow: `0 0 12px ${theme.border}`,
                  flexShrink: 0,
                }}
              >
                {item.rank}
              </div>

              {/* Coin Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '17px', fontWeight: 800 }}>{item.pair || `${item.symbol} / THB`}</span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--neon-green-light)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    THB
                  </span>
                  <PriceCell
                    price={item.price * multiplier}
                    prefix={prefix}
                    style={{ fontSize: '13px', fontWeight: 700, color: theme.textColor }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neon-green-light)' }}>
                    +{item.change7d}% (7d)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{item.trendTh}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
