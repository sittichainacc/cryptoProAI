import React from 'react';
import { SectorTopItem, SignalType } from '../types/index.js';
import { ChevronRight, Zap, Layers, DollarSign, Cpu, Globe, Smile, Gamepad2, Rocket } from 'lucide-react';
import { CryptoIcon } from './CryptoIcon.js';

interface Sector24GridProps {
  items: SectorTopItem[];
  onSelectCoin: (symbol: string) => void;
  onViewAll?: () => void;
  hideHeader?: boolean;
}

export const Sector24Grid: React.FC<Sector24GridProps> = ({ items, onSelectCoin, onViewAll, hideHeader }) => {
  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case 'core':
        return <Zap size={13} color="#3B82F6" />;
      case 'layer1_2':
        return <Layers size={13} color="#8B5CF6" />;
      case 'defi':
        return <DollarSign size={13} color="#06B6D4" />;
      case 'ai_depin':
        return <Cpu size={13} color="#10B981" />;
      case 'rwa_oracle':
        return <Globe size={13} color="#0284C7" />;
      case 'meme':
        return <Smile size={13} color="#F59E0B" />;
      case 'gamefi':
        return <Gamepad2 size={13} color="#EC4899" />;
      case 'emerging':
        return <Rocket size={13} color="#EF4444" />;
      default:
        return <Zap size={13} />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#F59E0B'; // Gold
    if (rank === 2) return '#94A3B8'; // Silver
    return '#B45309'; // Bronze
  };

  return (
    <div style={{ marginTop: hideHeader ? '0' : '24px' }}>
      {!hideHeader && (
        <div className="card-header-row" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="card-title" style={{ fontSize: '15px' }}>
              24 เหรียญแนะนำ (8 สาย สายละ 3 ตัว)
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              คัดกรองตามคะแนน AI และโครงสร้างทางเทคนิค
            </span>
          </div>
          <div className="card-action-link" onClick={onViewAll}>
            <span>ดูทั้งหมด 24 เหรียญ</span>
            <ChevronRight size={14} />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
        }}
      >
        {items.map((sec) => (
          <div
            key={sec.sector}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Sector Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingBottom: '6px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {getSectorIcon(sec.sector)}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: sec.sectorColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {sec.sectorNameTh.split('(')[0].trim()}
              </span>
            </div>

            {/* Top 3 Coins in this sector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sec.coins.map((coin) => (
                <div
                  key={coin.symbol}
                  onClick={() => onSelectCoin(coin.symbol)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '3px',
                        backgroundColor: getRankBadgeColor(coin.rank),
                        color: '#000',
                        fontSize: '9.5px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {coin.rank}
                    </span>
                    <CryptoIcon symbol={coin.symbol} size={15} />
                    <span style={{ fontWeight: 800, fontSize: '12px' }}>{coin.symbol}</span>
                  </div>

                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                    }}
                  >
                    {coin.change24h > 0 ? `+${coin.change24h.toFixed(1)}%` : `${coin.change24h.toFixed(1)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
