import React from 'react';
import { TickerData } from '../types/index.js';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { PriceCell } from './PriceCell.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from './CryptoIcon.js';

interface AISignalsCardProps {
  signals: TickerData[];
  onSelectCoin: (symbol: string) => void;
  onViewAll?: () => void;
  currency?: 'THB' | 'USDT';
}

export const AISignalsCard: React.FC<AISignalsCardProps> = ({
  signals,
  onSelectCoin,
  onViewAll,
  currency = 'THB',
}) => {
  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const getBadgeClass = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'badge-strong-buy';
      case 'BUY':
        return 'badge-buy';
      case 'WAIT_FOR_RETEST':
        return 'badge-retest';
      case 'WAIT_FOR_PULLBACK':
        return 'badge-watch';
      default:
        return 'badge-neutral';
    }
  };

  const getBadgeLabel = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'แนวโน้มแกร่ง';
      case 'BUY':
        return 'สัญญาณบวก';
      case 'WAIT_FOR_RETEST':
        return 'ทดสอบรับ';
      case 'WAIT_FOR_PULLBACK':
        return 'รอจังหวะย่อ';
      default:
        return 'เฝ้าระวัง';
    }
  };

  const getAvatarColor = (symbol: string) => {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4'];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) hash += symbol.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="crypto-card" style={{ marginBottom: '14px' }}>
      <div className="card-header-row">
        <div className="card-title" style={{ fontSize: '14px' }}>
          <span>สัญญาณวิเคราะห์โอกาส (AI Signals)</span>
        </div>
        <div className="card-action-link" onClick={onViewAll}>
          <span>ดูทั้งหมด</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {signals.slice(0, 5).map((item, index) => (
          <div
            key={item.symbol}
            onClick={() => onSelectCoin(item.symbol)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
          >
            {/* Rank & Coin Logo & Symbol */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '12px' }}>
                {index + 1}
              </span>
              {/* Coin Icon */}
              <CryptoIcon symbol={item.symbol} size={24} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{item.symbol}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {item.signal === 'STRONG_BUY' ? 'Breakout + Volume สูง' : 'แนวโน้มขาขึ้นชัดเจน'}
                </div>
              </div>
            </div>

            {/* Price, Badge & Change % */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PriceCell
                price={item.price * multiplier}
                prefix={prefix}
                style={{ fontSize: '12px', fontWeight: 700 }}
              />

              <span className={`badge ${getBadgeClass(item.signal)}`} style={{ fontSize: '10px' }}>
                {getBadgeLabel(item.signal)}
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: item.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  minWidth: '46px',
                  justifyContent: 'flex-end',
                }}
              >
                <ArrowUpRight size={12} />
                <span>+{Math.abs(item.change24h).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
