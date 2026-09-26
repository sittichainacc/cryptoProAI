import React, { useState, useMemo } from 'react';
import { TickerData, BuyNowCandidateItem } from '../types/index.js';
import { PriceCell } from './PriceCell.js';
import { Star, TrendingUp, TrendingDown, BarChart2, Zap } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from './CryptoIcon.js';

type TabId = 'watchlist' | 'buynow' | 'volume' | 'gainers' | 'losers';

interface TopMoversCardProps {
  gainers: TickerData[];
  losers: TickerData[];
  volume: TickerData[];
  watchlist?: TickerData[];
  buyNowCandidates?: BuyNowCandidateItem[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist?: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

const TABS = [
  { id: 'watchlist' as TabId, label: 'รายการโปรด', labelShort: 'โปรด', icon: Star,        color: '#F59E0B' },
  { id: 'buynow'    as TabId, label: 'Top 5 Buy Now',labelShort: 'Buy Now', icon: Zap,    color: '#10B981' },
  { id: 'volume'   as TabId, label: 'ปริมาณ 24h',  labelShort: 'Volume',  icon: BarChart2,  color: '#06B6D4' },
  { id: 'gainers'  as TabId, label: '% เพิ่มสูงสุด',labelShort: 'Gainers', icon: TrendingUp, color: '#10B981' },
  { id: 'losers'   as TabId, label: '% ลดสูงสุด',   labelShort: 'Losers',  icon: TrendingDown, color: '#EF4444' },
];

export const TopMoversCard: React.FC<TopMoversCardProps> = ({
  gainers,
  losers,
  volume,
  watchlist = [],
  buyNowCandidates = [],
  selectedSymbol,
  onSelectCoin,
  onToggleWatchlist,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('gainers');

  const multiplier = getCurrencyMultiplier(currency);
  const currencyPrefix = currency === 'THB' ? '฿' : '$';

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  const list = useMemo(() => {
    switch (activeTab) {
      case 'gainers':   return [...gainers].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
      case 'losers':    return [...losers].sort((a, b) => a.change24h - b.change24h).slice(0, 10);
      case 'volume':    return [...volume].sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);
      case 'watchlist': return watchlist.slice(0, 10);
      default:          return [];
    }
  }, [activeTab, gainers, losers, volume, watchlist]);

  const getCoinAvatarColor = (symbol: string) => {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444', '#84CC16'];
    let h = 0;
    for (let i = 0; i < symbol.length; i++) h += symbol.charCodeAt(i);
    return palette[h % palette.length];
  };

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const isStarred = (coin: TickerData) =>
    coin.isWatchlist ?? watchlist.some((w) => w.symbol === coin.symbol);

  const renderChangeCell = (change: number) => (
    <span
      style={{
        fontWeight: 700,
        fontSize: '12px',
        color: change >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1px',
      }}
    >
      {change > 0 ? '▲' : change < 0 ? '▼' : ''}
      {Math.abs(change).toFixed(2)}%
    </span>
  );

  return (
    <div
      className="crypto-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 12px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <activeTabDef.icon size={14} color={activeTabDef.color} />
          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
            {activeTabDef.label}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            Top {Math.min(list.length, 10)}
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: activeTabDef.color,
            background: `${activeTabDef.color}18`,
            border: `1px solid ${activeTabDef.color}40`,
            borderRadius: '5px',
            padding: '2px 7px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: activeTabDef.color,
              display: 'inline-block',
            }}
          />
          LIVE
        </span>
      </div>

      {/* 4 Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '3px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '3px',
          borderRadius: '9px',
          marginBottom: '10px',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                padding: '5px 2px',
                border: isActive ? `1px solid ${tab.color}55` : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                transition: 'all 0.15s',
                backgroundColor: isActive ? tab.color + '20' : 'transparent',
                color: isActive ? tab.color : 'var(--text-muted)',
              }}
            >
              <tab.icon size={10} />
              <span style={{ whiteSpace: 'nowrap' }}>{tab.labelShort}</span>
            </button>
          );
        })}
      </div>

      {/* Column Headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 18px 1fr 84px 60px',
          gap: '0',
          padding: '4px 4px',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2px',
        }}
      >
        <span>#</span>
        <span></span>
        <span style={{ paddingLeft: '4px' }}>เหรียญ</span>
        <span style={{ textAlign: 'right' }}>ราคา ({currency})</span>
        <span style={{ textAlign: 'right' }}>
          {activeTab === 'volume' ? 'Vol 24h' : '24h %'}
        </span>
      </div>

      {/* Coin List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'buynow' ? (
          buyNowCandidates.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '140px',
                gap: '8px',
                color: 'var(--text-muted)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <Zap size={26} color="#10B981" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399' }}>
                ขณะนี้ยังไม่มีเหรียญที่ผ่านเงื่อนไข Buy Now
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                ระบบคัดกรองเฉพาะเหรียญที่ R:R ≥ 1:2 และไม่ Overextended
              </span>
            </div>
          ) : (
            buyNowCandidates.map((c, index) => {
              const isSelected = selectedSymbol === c.symbol;
              const statusColor = c.status === 'STRONG BUY NOW' ? '#10B981' : '#059669';

              return (
                <div
                  key={c.symbol}
                  onClick={() => onSelectCoin(c.symbol)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '16px 18px 1fr 84px 60px',
                    alignItems: 'center',
                    padding: '7px 4px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(16,185,129,0.12)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(16,185,129,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Rank */}
                  <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 700 }}>
                    {index + 1}
                  </span>

                  {/* Zap icon */}
                  <Zap size={11} color="#10B981" />

                  {/* Symbol + sub info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', paddingLeft: '2px' }}>
                    {/* Coin Icon */}
                    <CryptoIcon symbol={c.symbol} size={20} />
                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{c.symbol}</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: statusColor, background: 'rgba(16,185,129,0.15)', padding: '0 4px', borderRadius: '4px' }}>
                          {c.buyNowScore}p
                        </span>
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {c.setup} • {c.riskReward}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', paddingRight: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#FFF' }}>
                      {currencyPrefix}
                      {(c.price * multiplier).toLocaleString(undefined, {
                        maximumFractionDigits: c.price * multiplier < 1 ? 4 : 2,
                      })}
                    </div>
                  </div>

                  {/* 24h change */}
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: c.change24h >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: c.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                      }}
                    >
                      {c.change24h >= 0 ? `+${c.change24h.toFixed(1)}%` : `${c.change24h.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              );
            })
          )
        ) : list.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '140px',
              gap: '8px',
              color: 'var(--text-muted)',
            }}
          >
            <Star size={26} color="var(--text-muted)" fill="none" />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>ยังไม่มีเหรียญในรายการโปรด</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              กดดาว ★ ที่ตารางเหรียญเพื่อเพิ่ม
            </span>
          </div>
        ) : (
          list.map((coin, index) => {
            const isSelected = selectedSymbol === coin.symbol;
            const starred = isStarred(coin);
            const changeColor = coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)';

            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectCoin(coin.symbol)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '16px 18px 1fr 84px 60px',
                  alignItems: 'center',
                  padding: '7px 4px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {/* Rank */}
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {index + 1}
                </span>

                {/* Star */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist && onToggleWatchlist(coin.symbol);
                  }}
                  title={starred ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: starred ? '#F59E0B' : 'var(--text-muted)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <Star
                    size={11}
                    fill={starred ? '#F59E0B' : 'none'}
                    color={starred ? '#F59E0B' : 'var(--text-muted)'}
                  />
                </button>

                {/* Symbol + sub info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', paddingLeft: '2px' }}>
                  {/* Coin Icon */}
                  <CryptoIcon symbol={coin.symbol} size={20} />
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '12px',
                        color: isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                      }}
                    >
                      {coin.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: 'var(--text-muted)',
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {coin.name || coin.symbol}
                    </div>
                  </div>
                </div>

                {/* Live Price */}
                <div style={{ textAlign: 'right', fontWeight: 600 }}>
                  <PriceCell
                    price={coin.price * multiplier}
                    prefix={currencyPrefix}
                    style={{ fontSize: '11px' }}
                  />
                </div>

                {/* Secondary: Volume or Change% */}
                <div style={{ textAlign: 'right' }}>
                  {activeTab === 'volume' ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--neon-cyan)',
                      }}
                    >
                      {formatVolume(coin.volume24h)}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '11.5px',
                        color: changeColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '1px',
                      }}
                    >
                      {coin.change24h > 0 ? '▲' : coin.change24h < 0 ? '▼' : ''}
                      {Math.abs(coin.change24h).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


