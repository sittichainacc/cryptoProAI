import React, { useState } from 'react';
import { TickerData } from '../types/index.js';
import { PriceCell } from './PriceCell.js';

interface TopMoversCardProps {
  gainers: TickerData[];
  losers: TickerData[];
  volume: TickerData[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const TopMoversCard: React.FC<TopMoversCardProps> = ({
  gainers,
  losers,
  volume,
  selectedSymbol,
  onSelectCoin,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume'>('gainers');

  const list = activeTab === 'gainers' ? gainers : activeTab === 'losers' ? losers : volume;

  const getCoinAvatarColor = (symbol: string) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) hash += symbol.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="crypto-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header-row" style={{ marginBottom: '12px' }}>
        <div className="card-title">Top 10 (24h)</div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          padding: '3px',
          borderRadius: '8px',
          marginBottom: '10px',
        }}
      >
        {(['gainers', 'losers', 'volume'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '5px 0',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
              backgroundColor: activeTab === tab ? 'var(--neon-blue)' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            {tab === 'gainers' ? 'Gainers' : tab === 'losers' ? 'Losers' : 'Volume'}
          </button>
        ))}
      </div>

      {/* Table List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="crypto-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '20px', padding: '6px 4px' }}>#</th>
              <th style={{ padding: '6px 8px' }}>เหรียญ</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>ราคา</th>
              <th style={{ textAlign: 'right', padding: '6px 8px' }}>24h%</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 10).map((coin, index) => {
              const isSelected = selectedSymbol === coin.symbol;
              const displayPrice = currency === 'THB' 
                ? (coin.price * 34.5).toLocaleString(undefined, { minimumFractionDigits: coin.price < 1 ? 4 : 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })
                : coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price < 1 ? 4 : 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 });
              const currencyPrefix = currency === 'THB' ? '฿' : '$';

              return (
                <tr
                  key={coin.symbol}
                  onClick={() => onSelectCoin(coin.symbol)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  }}
                >
                  <td style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '8px 4px' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '8px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: getCoinAvatarColor(coin.symbol),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#FFF',
                        }}
                      >
                        {coin.symbol.slice(0, 1)}
                      </div>
                      <span style={{ fontWeight: 700, color: isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)' }}>
                        {coin.symbol}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, padding: '8px 8px' }}>
                    <PriceCell price={coin.price * (currency === 'THB' ? 34.5 : 1)} prefix={currencyPrefix} />
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      padding: '8px 8px',
                      color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                    }}
                  >
                    {coin.change24h > 0 ? `+${coin.change24h.toFixed(1)}%` : `${coin.change24h.toFixed(1)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
