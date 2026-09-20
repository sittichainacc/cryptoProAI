import React from 'react';
import { TickerData } from '../types/index.js';
import { ChevronRight, Star } from 'lucide-react';
import { PriceCell } from './PriceCell.js';

interface WatchlistMiniCardProps {
  watchlist: TickerData[];
  onSelectCoin: (symbol: string) => void;
  onViewAll?: () => void;
  currency: 'THB' | 'USDT';
}

export const WatchlistMiniCard: React.FC<WatchlistMiniCardProps> = ({
  watchlist,
  onSelectCoin,
  onViewAll,
  currency,
}) => {
  const getBadgeClass = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'badge-strong-buy';
      case 'BUY':
        return 'badge-buy';
      default:
        return 'badge-watch';
    }
  };

  const getBadgeLabel = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'แนวโน้มแกร่ง';
      case 'BUY':
        return 'สัญญาณบวก';
      default:
        return 'เฝ้าดู';
    }
  };

  const multiplier = currency === 'THB' ? 34.5 : 1;
  const prefix = currency === 'THB' ? '฿' : '$';

  return (
    <div className="crypto-card">
      <div className="card-header-row">
        <div className="card-title" style={{ fontSize: '14px' }}>
          <span>รายการเฝ้าดูของฉัน</span>
        </div>
        <div className="card-action-link" onClick={onViewAll}>
          <span>ดูทั้งหมด</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {watchlist.slice(0, 5).map((coin) => {
          return (
            <div
              key={coin.symbol}
              onClick={() => onSelectCoin(coin.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* Star + Symbol */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontWeight: 800, fontSize: '13px' }}>{coin.symbol}</span>
              </div>

              {/* Real-time Flash Price */}
              <span style={{ fontWeight: 600, fontSize: '12px' }}>
                <PriceCell price={coin.price * multiplier} prefix={prefix} />
              </span>

              {/* 24h% */}
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                }}
              >
                {coin.change24h > 0 ? `+${coin.change24h.toFixed(1)}%` : `${coin.change24h.toFixed(1)}%`}
              </span>

              {/* Signal Badge */}
              <span className={`badge ${getBadgeClass(coin.signal)}`} style={{ fontSize: '10px' }}>
                {getBadgeLabel(coin.signal)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
