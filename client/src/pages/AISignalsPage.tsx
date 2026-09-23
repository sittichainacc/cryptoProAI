import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { realtimeService } from '../services/realtime.js';
import { SignalType, TickerData } from '../types/index.js';
import { Sparkles, ArrowUpRight, ArrowDownRight, Target, AlertTriangle, ShieldCheck, Filter, Activity } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface AISignalsPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const AISignalsPage: React.FC<AISignalsPageProps> = ({ onSelectCoin, currency }) => {
  const [signals, setSignals] = useState<TickerData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  useEffect(() => {
    api.getCoins().then((data) => {
      setSignals(data);
    });

    // Real-time sub-second price streaming
    const unsub = realtimeService.subscribeTicks((ticks) => {
      setSignals((prev) =>
        prev.map((c) => {
          const t = ticks[c.symbol];
          return t
            ? {
                ...c,
                price: t.price,
                change24h: t.change24h,
                high24h: t.high24h,
                low24h: t.low24h,
                volume24h: t.quoteVolume24h,
              }
            : c;
        })
      );
    });

    return unsub;
  }, []);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const filterTabs = [
    { id: 'ALL', label: 'ทั้งหมด' },
    { id: 'STRONG_BUY', label: 'Strong Buy' },
    { id: 'BUY', label: 'Buy' },
    { id: 'WAIT_FOR_RETEST', label: 'Wait for Retest' },
    { id: 'WAIT_FOR_PULLBACK', label: 'Wait for Pullback' },
    { id: 'WATCH', label: 'Watchlist' },
    { id: 'HIGH_RISK', label: 'High Risk' },
    { id: 'SELL', label: 'Sell / Warning' },
  ];

  const filtered = signals.filter((s) => {
    if (selectedFilter === 'ALL') return true;
    return s.signal === selectedFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--neon-cyan)" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              AI Quantitative Signals (ศูนย์วิเคราะห์สัญญาณเชิงปริมาณ)
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ประเมินตาม 11 สถานะสัญญาณ พร้อมบทวิเคราะห์เชิงเทคนิค กรอบแนวรับ-แนวต้าน และระดับ Invalidation ทางสถิติ
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--neon-green-light)', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '5px 10px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          <span>Binance Stream Live Feed</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            style={{
              background: selectedFilter === tab.id ? 'var(--neon-blue)' : 'var(--bg-card)',
              border: selectedFilter === tab.id ? '1px solid #3B82F6' : '1px solid var(--border-color)',
              color: selectedFilter === tab.id ? '#FFF' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Signal Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px',
        }}
      >
        {filtered.map((coin) => {
          const displayPrice = (coin.price * multiplier).toLocaleString(undefined, {
            minimumFractionDigits: coin.price < 1 ? 4 : 2,
            maximumFractionDigits: coin.price < 1 ? 4 : 2,
          });

          const support = (coin.price * 0.94 * multiplier).toFixed(coin.price < 1 ? 4 : 2);
          const resistance = (coin.price * 1.12 * multiplier).toFixed(coin.price < 1 ? 4 : 2);
          const invalidation = (coin.price * 0.90 * multiplier).toFixed(coin.price < 1 ? 4 : 2);

          const isBuy = coin.signal === 'STRONG_BUY' || coin.signal === 'BUY';
          const isWarning = coin.signal === 'HIGH_RISK' || coin.signal === 'SELL' || coin.signal === 'DO_NOT_CHASE';

          return (
            <div
              key={coin.symbol}
              onClick={() => onSelectCoin(coin.symbol)}
              className="crypto-card"
              style={{
                cursor: 'pointer',
                border: isBuy ? '1px solid rgba(16, 185, 129, 0.35)' : isWarning ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Top Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>{coin.symbol}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{coin.name}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      หมวด: {coin.sector.toUpperCase()}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      coin.signal === 'STRONG_BUY'
                        ? 'badge-strong-buy'
                        : coin.signal === 'BUY'
                        ? 'badge-buy'
                        : isWarning
                        ? 'badge-sell'
                        : 'badge-watch'
                    }`}
                  >
                    {coin.signalLabelTh}
                  </span>
                </div>

                {/* Price & Scores */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>
                      {prefix}{displayPrice}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                      {coin.change24h > 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--neon-cyan)' }}>AI Score</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--neon-cyan)' }}>{coin.aiScore}</div>
                    </div>
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--neon-blue-light)' }}>Tech Score</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{coin.technicalScore}</div>
                    </div>
                  </div>
                </div>

                {/* Human-Readable Explanation (Thai) */}
                <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.45, marginBottom: '14px' }}>
                  {coin.signalReasonTh}
                </p>
              </div>

              {/* Levels & Invalidation */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10.5px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '5px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>แนวรับ:</span>
                  <div style={{ fontWeight: 700, color: 'var(--neon-green)' }}>{prefix}{support}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '5px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>เป้าหมาย:</span>
                  <div style={{ fontWeight: 700, color: 'var(--neon-cyan)' }}>{prefix}{resistance}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '5px', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ตัดขาดทุน:</span>
                  <div style={{ fontWeight: 700, color: 'var(--neon-red)' }}>{prefix}{invalidation}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
