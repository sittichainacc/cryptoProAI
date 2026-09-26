import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api.js';
import { realtimeService } from '../services/realtime.js';
import { SignalType, TickerData } from '../types/index.js';
import { 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  AlertTriangle, 
  ShieldCheck, 
  Filter, 
  Activity,
  Crown,
  Award,
  Search,
  ArrowUpDown,
  TrendingUp,
  BarChart3,
  Flame,
  Zap,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from '../components/CryptoIcon.js';
import { PriceCell } from '../components/PriceCell.js';

interface AISignalsPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const AISignalsPage: React.FC<AISignalsPageProps> = ({ onSelectCoin, currency }) => {
  const [signals, setSignals] = useState<TickerData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'aiScore' | 'techScore' | 'change24h'>('aiScore');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getCoins()
      .then((data) => {
        setSignals(data || []);
      })
      .finally(() => {
        setIsLoading(false);
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
    { id: 'STRONG_BUY', label: 'Strong Buy (แกร่งสุด)' },
    { id: 'BUY', label: 'Buy (สัญญาณซื้อ)' },
    { id: 'WAIT_FOR_RETEST', label: 'Wait for Retest' },
    { id: 'WAIT_FOR_PULLBACK', label: 'Wait for Pullback' },
    { id: 'WATCH', label: 'Watchlist' },
    { id: 'HIGH_RISK', label: 'High Risk' },
    { id: 'SELL', label: 'Sell / Warning' },
  ];

  // 1. Process signals: Sort by best score descending (1, 2, 3...)
  const sortedAndFiltered = useMemo(() => {
    let list = [...signals];

    // Filter by signal type
    if (selectedFilter !== 'ALL') {
      list = list.filter((s) => s.signal === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    // Sort descending by highest score
    list.sort((a, b) => {
      if (sortBy === 'aiScore') {
        const scoreDiff = (b.aiScore ?? 0) - (a.aiScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const techDiff = (b.technicalScore ?? 0) - (a.technicalScore ?? 0);
        if (techDiff !== 0) return techDiff;
        return (b.change24h ?? 0) - (a.change24h ?? 0);
      } else if (sortBy === 'techScore') {
        const techDiff = (b.technicalScore ?? 0) - (a.technicalScore ?? 0);
        if (techDiff !== 0) return techDiff;
        return (b.aiScore ?? 0) - (a.aiScore ?? 0);
      } else if (sortBy === 'change24h') {
        return (b.change24h ?? 0) - (a.change24h ?? 0);
      }
      return (b.aiScore ?? 0) - (a.aiScore ?? 0);
    });

    return list;
  }, [signals, selectedFilter, searchQuery, sortBy]);

  // Overall Signal Market Statistics
  const stats = useMemo(() => {
    if (signals.length === 0) {
      return { topCoin: null, strongBuyCount: 0, buyCount: 0, avgScore: 0, totalCount: 0 };
    }
    const sorted = [...signals].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
    const strongBuyCount = signals.filter((s) => s.signal === 'STRONG_BUY').length;
    const buyCount = signals.filter((s) => s.signal === 'BUY').length;
    const avgScore = Math.round(
      signals.reduce((acc, c) => acc + (c.aiScore || 0), 0) / signals.length
    );
    return {
      topCoin: sorted[0],
      strongBuyCount,
      buyCount,
      avgScore,
      totalCount: signals.length,
    };
  }, [signals]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Header & Live Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
              }}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0 }}>
                  สัญญาณ AI Quantitative Ranking
                </h1>
                <span
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    color: 'var(--neon-cyan)',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  จัดอันดับ 1 → {signals.length}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                วิเคราะห์เชิงปริมาณ 11 สถานะสัญญาณ พร้อมจัดลำดับคะแนนที่ดีที่สุด (Best Score Descending) คำนวณจุดเข้าและ Trade Plan สด
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--neon-green-light)',
              fontWeight: 800,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span>Binance Stream Live Feed • Real-Time Scoring</span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* KPI 1: Top Rank #1 */}
        <div
          className="crypto-card"
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              boxShadow: '0 0 14px rgba(245, 158, 11, 0.4)',
              flexShrink: 0,
            }}
          >
            <Crown size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#FDE047', fontWeight: 800, letterSpacing: '0.4px' }}>
              อันดับ 1 คะแนนสูงสุด (TOP #1)
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFF' }}>
              {stats.topCoin ? `${stats.topCoin.symbol} (${stats.topCoin.aiScore}/100)` : '-'}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              {stats.topCoin ? stats.topCoin.signalLabelTh : 'กำลังประมวลผล'}
            </div>
          </div>
        </div>

        {/* KPI 2: Strong Buy & Buy Count */}
        <div
          className="crypto-card"
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)',
              flexShrink: 0,
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 800, letterSpacing: '0.4px' }}>
              สัญญาณพร้อมเข้า (BUY / STRONG BUY)
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFF' }}>
              {stats.strongBuyCount + stats.buyCount} เหรียญ
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Strong Buy: {stats.strongBuyCount} • Buy: {stats.buyCount}
            </div>
          </div>
        </div>

        {/* KPI 3: Average AI Score */}
        <div
          className="crypto-card"
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 0 14px rgba(59, 130, 246, 0.4)',
              flexShrink: 0,
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 800, letterSpacing: '0.4px' }}>
              คะแนน AI เฉลี่ยทั้งตลาด
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFF' }}>
              {stats.avgScore}/100
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              จาก {stats.totalCount} เหรียญใน Universe
            </div>
          </div>
        </div>

        {/* KPI 4: Active Filter Count */}
        <div
          className="crypto-card"
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 0 14px rgba(139, 92, 246, 0.4)',
              flexShrink: 0,
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#C4B5FD', fontWeight: 800, letterSpacing: '0.4px' }}>
              ผลลัพธ์จัดอันดับปัจจุบัน
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFF' }}>
              {sortedAndFiltered.length} รายการ
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              เรียงจากอันดับ 1 → {sortedAndFiltered.length}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters, Sorting & Search Toolbar */}
      <div
        className="crypto-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Top Toolbar Row: Search + Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px 12px',
              minWidth: '240px',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="ค้นหาเหรียญ (เช่น BTC, ETH, SOL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFF',
                fontSize: '12px',
                width: '100%',
              }}
            />
            {searchQuery && (
              <span
                onClick={() => setSearchQuery('')}
                style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px' }}
              >
                ✕
              </span>
            )}
          </div>

          {/* Sort Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={13} color="var(--neon-cyan)" />
              <span>ลำดับการเรียง:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: '#FFF',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="aiScore" style={{ backgroundColor: '#0F172A', color: '#FFF' }}>
                👑 คะแนน AI สูงสุด (1 → N)
              </option>
              <option value="techScore" style={{ backgroundColor: '#0F172A', color: '#FFF' }}>
                ⚡ Technical Score สูงสุด
              </option>
              <option value="change24h" style={{ backgroundColor: '#0F172A', color: '#FFF' }}>
                📈 % เพิ่มขึ้นสูงสุด 24h
              </option>
            </select>
          </div>
        </div>

        {/* Signal Category Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  background: isSelected ? 'var(--neon-blue)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Ranked Cards Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Sparkles size={28} className="animate-spin" color="var(--neon-cyan)" style={{ margin: '0 auto 12px auto' }} />
          <div>กำลังคำนวณและจัดอันดับคะแนนสัญญาณ AI เรียลไทม์...</div>
        </div>
      ) : sortedAndFiltered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertTriangle size={32} color="#F59E0B" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>ไม่พบสัญญาณที่ตรงกับเงื่อนไข</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>ลองเปลี่ยนตัวกรองสัญญาณ หรือค้นหาด้วยชื่อเหรียญอื่น</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {sortedAndFiltered.map((coin, index) => {
            const rank = index + 1;
            const displayPrice = (coin.price * multiplier).toLocaleString(undefined, {
              minimumFractionDigits: coin.price < 1 ? 4 : 2,
              maximumFractionDigits: coin.price < 1 ? 4 : 2,
            });

            const support = (coin.price * 0.94 * multiplier).toFixed(coin.price < 1 ? 4 : 2);
            const resistance = (coin.price * 1.12 * multiplier).toFixed(coin.price < 1 ? 4 : 2);
            const invalidation = (coin.price * 0.90 * multiplier).toFixed(coin.price < 1 ? 4 : 2);

            const isBuy = coin.signal === 'STRONG_BUY' || coin.signal === 'BUY';
            const isWarning = coin.signal === 'HIGH_RISK' || coin.signal === 'SELL' || coin.signal === 'DO_NOT_CHASE';

            // Distinctive Rank Badges for Top 3
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;

            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectCoin(coin.symbol)}
                className="crypto-card"
                style={{
                  cursor: 'pointer',
                  border: isRank1
                    ? '1.5px solid rgba(245, 158, 11, 0.6)'
                    : isRank2
                    ? '1.5px solid rgba(148, 163, 184, 0.5)'
                    : isRank3
                    ? '1.5px solid rgba(217, 119, 6, 0.5)'
                    : isBuy
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : isWarning
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid var(--border-color)',
                  boxShadow: isRank1
                    ? '0 8px 24px rgba(245, 158, 11, 0.18)'
                    : isRank2
                    ? '0 6px 20px rgba(148, 163, 184, 0.12)'
                    : isRank3
                    ? '0 6px 20px rgba(217, 119, 6, 0.12)'
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = isRank1
                    ? '0 12px 28px rgba(245, 158, 11, 0.3)'
                    : '0 8px 24px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = isRank1
                    ? '0 8px 24px rgba(245, 158, 11, 0.18)'
                    : isRank2
                    ? '0 6px 20px rgba(148, 163, 184, 0.12)'
                    : isRank3
                    ? '0 6px 20px rgba(217, 119, 6, 0.12)'
                    : 'none';
                }}
              >
                <div>
                  {/* Card Header Row: Rank Badge + Coin Info + Signal Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Rank Indicator Badge */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: isRank1 || isRank2 || isRank3 ? '3px 8px' : '3px 7px',
                          borderRadius: '6px',
                          background: isRank1
                            ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                            : isRank2
                            ? 'linear-gradient(135deg, #94A3B8, #64748B)'
                            : isRank3
                            ? 'linear-gradient(135deg, #B45309, #78350F)'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: isRank1 ? '#000000' : '#FFFFFF',
                          border: isRank1 || isRank2 || isRank3 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                          fontWeight: 900,
                          fontSize: isRank1 ? '11px' : '10.5px',
                          letterSpacing: '0.3px',
                          boxShadow: isRank1 ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none',
                          flexShrink: 0,
                          gap: '3px',
                        }}
                      >
                        {isRank1 && <Crown size={12} />}
                        {isRank2 && <Award size={12} />}
                        {isRank3 && <Award size={12} />}
                        <span>#{rank}</span>
                      </div>

                      {/* Authentic Coin Icon */}
                      <CryptoIcon symbol={coin.symbol} size={32} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>{coin.symbol}</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{coin.name}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          หมวด: {coin.sector.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Signal Status Badge */}
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
                      style={{
                        padding: '4px 9px',
                        fontSize: '11px',
                        fontWeight: 800,
                        borderRadius: '6px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {coin.signalLabelTh}
                    </span>
                  </div>

                  {/* Price & Primary Score Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>
                        {prefix}{displayPrice}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          marginTop: '2px',
                        }}
                      >
                        {coin.change24h >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        <span>{coin.change24h > 0 ? `+${coin.change24h}%` : `${coin.change24h}%`} (24h)</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* AI Score Badge */}
                      <div
                        style={{
                          textAlign: 'center',
                          backgroundColor: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', fontWeight: 800 }}>AI SCORE</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--neon-cyan)' }}>
                          {coin.aiScore}
                        </div>
                      </div>

                      {/* Technical Score Badge */}
                      <div
                        style={{
                          textAlign: 'center',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontSize: '9px', color: '#60A5FA', fontWeight: 800 }}>TECH</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>
                          {coin.technicalScore}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Score Visual Progress Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                      <span>ระดับความเชื่อมั่นโมเดล AI</span>
                      <span style={{ color: coin.aiScore >= 85 ? '#34D399' : coin.aiScore >= 70 ? '#60A5FA' : '#94A3B8' }}>
                        เกรด {coin.scoreGrade || 'A'} • {coin.aiScore}/100
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(10, coin.aiScore))}%`,
                          height: '100%',
                          background:
                            coin.aiScore >= 85
                              ? 'linear-gradient(90deg, #10B981, #06B6D4)'
                              : coin.aiScore >= 70
                              ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
                              : 'linear-gradient(90deg, #64748B, #94A3B8)',
                          borderRadius: '3px',
                          boxShadow: coin.aiScore >= 85 ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Human-Readable Explanation (Thai) */}
                  <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.5, marginBottom: '14px' }}>
                    {coin.signalReasonTh}
                  </p>
                </div>

                {/* Trade Levels & Invalidation Zone */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10.5px', marginBottom: '8px' }}>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>แนวรับ (Support):</span>
                      <div style={{ fontWeight: 800, color: 'var(--neon-green)', marginTop: '2px' }}>{prefix}{support}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>เป้าหมาย (TP):</span>
                      <div style={{ fontWeight: 800, color: 'var(--neon-cyan)', marginTop: '2px' }}>{prefix}{resistance}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>ตัดขาดทุน (SL):</span>
                      <div style={{ fontWeight: 800, color: 'var(--neon-red)', marginTop: '2px' }}>{prefix}{invalidation}</div>
                    </div>
                  </div>

                  {/* Action Link Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--neon-cyan)',
                      fontWeight: 700,
                    }}
                  >
                    <span>เปิดกราฟ & วิเคราะห์เชิงลึก</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
