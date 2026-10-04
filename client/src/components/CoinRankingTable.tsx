import React, { useState, useRef, useEffect } from 'react';
import { TickerData } from '../types/index.js';
import { Star, ArrowUpDown, ArrowUpRight, ArrowDownRight, Download, Brain, TrendingUp, LayoutList, Search, X, Target } from 'lucide-react';
import { PriceCell } from './PriceCell.js';
import { CryptoIcon } from './CryptoIcon.js';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface CoinRankingTableProps {
  coins: TickerData[];
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  currency: 'THB' | 'USDT';
  hideCardWrapper?: boolean;
  watchlist?: TickerData[];
  onToggleFocus?: (symbol: string) => void;
  focusSymbols?: string[];
}

export const CoinRankingTable: React.FC<CoinRankingTableProps> = ({
  coins,
  onSelectCoin,
  onToggleWatchlist,
  currency,
  hideCardWrapper,
  watchlist = [],
  onToggleFocus,
  focusSymbols = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'watchlist' | 'all' | 'buy_interest' | 'best_buy_ai' | 'search'>('watchlist');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortField, setSortField] = useState<keyof TickerData>('marketCap');
  const [sortAsc, setSortAsc] = useState(false);

  // Auto-focus search input when switching to search mode
  useEffect(() => {
    if (viewMode === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [viewMode]);

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'core', label: 'Core / Large Cap' },
    { id: 'layer1_2', label: 'L1 / L2' },
    { id: 'defi', label: 'DeFi' },
    { id: 'ai_depin', label: 'AI / DePIN' },
    { id: 'rwa_oracle', label: 'RWA / Oracle' },
    { id: 'meme', label: 'Meme' },
    { id: 'gamefi', label: 'GameFi' },
    { id: 'emerging', label: 'Emerging' },
  ];

  const handleSort = (field: keyof TickerData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredCoins = coins.filter((c) => {
    // Category filter (always applies except in search mode)
    if (viewMode !== 'search' && selectedCategory !== 'all' && c.sector !== selectedCategory) return false;

    if (viewMode === 'watchlist') {
      return Boolean(c.isWatchlist || (Array.isArray(watchlist) && watchlist.some(w => w.symbol === c.symbol)));
    }
    if (viewMode === 'buy_interest') {
      return (c.signal === 'BUY' || c.signal === 'STRONG_BUY' || c.signal === 'WATCH') && c.change24h >= -1;
    }
    if (viewMode === 'best_buy_ai') {
      return (c.signal === 'BUY' || c.signal === 'STRONG_BUY') && c.aiScore >= 65;
    }
    if (viewMode === 'search') {
      if (!searchQuery.trim()) return true; // show all when empty
      const q = searchQuery.trim().toLowerCase();
      return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    }
    return true;
  });

  // For best_buy_ai: force sort by aiScore desc
  const effectiveSortField = viewMode === 'best_buy_ai' ? 'aiScore' : sortField;
  const effectiveSortAsc = viewMode === 'best_buy_ai' ? false : sortAsc;

  const sortedCoins = [...filteredCoins].sort((a: any, b: any) => {
    const valA = a[effectiveSortField] ?? 0;
    const valB = b[effectiveSortField] ?? 0;
    return effectiveSortAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
  });

  // Limit best_buy_ai to top 30 for focused view
  const displayedCoins = viewMode === 'best_buy_ai' ? sortedCoins.slice(0, 30) : sortedCoins;

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const exportToCSV = () => {
    if (!sortedCoins.length) return;
    const headers = ['Rank', 'Symbol', 'Name', 'Sector', `Price_${currency}`, 'Change_1h_%', 'Change_24h_%', 'Change_7d_%', 'Volume_24h', 'RSI_14', 'Signal', 'AI_Score', 'Tech_Score', 'Risk_Level'];
    const rows = sortedCoins.map((c, i) => [
      i + 1,
      c.symbol,
      `"${c.name.replace(/"/g, '""')}"`,
      c.sector,
      (c.price * multiplier).toFixed(4),
      c.change1h,
      c.change24h,
      c.change7d,
      c.volume24h,
      c.rsi,
      c.signal,
      c.aiScore,
      c.technicalScore,
      c.riskLevel,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CryptoPro_AI_Ranking_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSparkline = (points: number[], isUp: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 70;
    const height = 24;

    const pathD = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height}>
        <path
          d={pathD}
          fill="none"
          stroke={isUp ? '#10B981' : '#EF4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div
      className={hideCardWrapper ? '' : 'crypto-card'}
      style={
        hideCardWrapper
          ? { marginTop: 0, padding: 0 }
          : { marginTop: '20px' }
      }
    >
      {/* Table Header & Category Tabs */}
      <div className="card-header-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="card-title">
          <span>ตารางจัดอันดับเหรียญ (Crypto Ranking)</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({displayedCoins.length} เหรียญ
            {viewMode === 'best_buy_ai' ? ' · Top AI' : ''}
            {viewMode === 'search' && searchQuery.trim() ? ` · "ค้นหา: ${searchQuery.trim()}"` : ''}
            )
          </span>
        </div>

        {/* View Mode Toggle — 4 options */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '3px',
          gap: '2px',
          flexWrap: 'wrap',
        }}>
          {/* รายการโปรด */}
          <button
            onClick={() => setViewMode('watchlist')}
            title="รายการโปรดของฉัน"
            style={{
              background: viewMode === 'watchlist' ? '#F59E0B' : 'transparent',
              color: viewMode === 'watchlist' ? '#FFF' : 'var(--text-secondary)',
              border: 'none', borderRadius: '7px',
              padding: '5px 11px', fontSize: '11.5px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <Star size={12} fill={viewMode === 'watchlist' ? '#FFF' : 'none'} color={viewMode === 'watchlist' ? '#FFF' : '#F59E0B'} />
            <span>รายการโปรด</span>
          </button>

          {/* ทั้งหมด */}
          <button
            onClick={() => setViewMode('all')}
            title="แสดงเหรียญทั้งหมด"
            style={{
              background: viewMode === 'all' ? 'var(--neon-blue)' : 'transparent',
              color: viewMode === 'all' ? '#FFF' : 'var(--text-secondary)',
              border: 'none', borderRadius: '7px',
              padding: '5px 11px', fontSize: '11.5px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <LayoutList size={12} />
            <span>ทั้งหมด</span>
          </button>

          {/* น่าสนใจเข้าซื้อ */}
          <button
            onClick={() => setViewMode('buy_interest')}
            title="เหรียญที่มีสัญญาณน่าสนใจสำหรับการเข้าซื้อ"
            style={{
              background: viewMode === 'buy_interest' ? 'var(--neon-green)' : 'transparent',
              color: viewMode === 'buy_interest' ? '#FFF' : 'var(--text-secondary)',
              border: 'none', borderRadius: '7px',
              padding: '5px 11px', fontSize: '11.5px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <TrendingUp size={12} color={viewMode === 'buy_interest' ? '#FFF' : 'var(--neon-green)'} />
            <span>น่าสนใจเข้าซื้อ</span>
          </button>

          {/* ดีที่สุด AI */}
          <button
            onClick={() => setViewMode('best_buy_ai')}
            title="Top AI Score — เหรียญที่ AI วิเคราะห์ว่าดีที่สุดสำหรับการเข้าซื้อ"
            style={{
              background: viewMode === 'best_buy_ai' ? 'var(--neon-purple)' : 'transparent',
              color: viewMode === 'best_buy_ai' ? '#FFF' : 'var(--text-secondary)',
              border: 'none', borderRadius: '7px',
              padding: '5px 11px', fontSize: '11.5px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <Brain size={12} color={viewMode === 'best_buy_ai' ? '#FFF' : 'var(--neon-purple)'} />
            <span>ดีที่สุด AI</span>
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* ค้นหา */}
          <button
            onClick={() => {
              setViewMode('search');
              setSearchQuery('');
            }}
            title="ค้นหาเหรียญด้วยชื่อหรือสัญลักษณ์"
            style={{
              background: viewMode === 'search' ? '#0891B2' : 'transparent',
              color: viewMode === 'search' ? '#FFF' : 'var(--text-secondary)',
              border: 'none', borderRadius: '7px',
              padding: '5px 11px', fontSize: '11.5px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <Search size={12} color={viewMode === 'search' ? '#FFF' : '#0891B2'} />
            <span>ค้นหา</span>
          </button>
        </div>

        {/* Category Pill Tabs & Export */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? 'var(--neon-blue)' : 'rgba(255,255,255,0.03)',
                  color: selectedCategory === cat.id ? '#FFF' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportToCSV}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11.5px', gap: '4px', marginLeft: '6px' }}
            title="ดาวน์โหลดรายการเหรียญเป็นไฟล์ CSV"
          >
            <Download size={13} color="var(--neon-cyan)" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Mode Context Banner / Search Input */}
      {viewMode !== 'all' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: viewMode === 'search' ? '6px 10px' : '8px 14px',
          marginBottom: '8px',
          borderRadius: '8px',
          fontSize: '11.5px',
          backgroundColor:
            viewMode === 'watchlist' ? 'rgba(245, 158, 11, 0.08)' :
            viewMode === 'buy_interest' ? 'rgba(16, 185, 129, 0.08)' :
            viewMode === 'search' ? 'rgba(8, 145, 178, 0.08)' :
            'rgba(139, 92, 246, 0.1)',
          border:
            viewMode === 'watchlist' ? '1px solid rgba(245, 158, 11, 0.25)' :
            viewMode === 'buy_interest' ? '1px solid rgba(16, 185, 129, 0.25)' :
            viewMode === 'search' ? '1px solid rgba(8, 145, 178, 0.35)' :
            '1px solid rgba(139, 92, 246, 0.3)',
          color: 'var(--text-secondary)',
        }}>
          {viewMode === 'watchlist' && (
            <><Star size={12} fill="#F59E0B" color="#F59E0B" />
            <span><b style={{ color: '#F59E0B' }}>รายการโปรด</b> — เหรียญที่คุณกด ★ ติดตามไว้</span></>
          )}
          {viewMode === 'buy_interest' && (
            <><TrendingUp size={12} color="var(--neon-green)" />
            <span><b style={{ color: 'var(--neon-green)' }}>น่าสนใจเข้าซื้อ</b> — สัญญาณ BUY / STRONG BUY / WATCH ที่ยังเป็นบวกใน 24h</span></>
          )}
          {viewMode === 'best_buy_ai' && (
            <><Brain size={12} color="var(--neon-purple)" />
            <span><b style={{ color: 'var(--neon-purple)' }}>ดีที่สุด AI</b> — AI Score &gt; 65 + สัญญาณ BUY/STRONG BUY — แสดง Top {displayedCoins.length} เหรียญ เรียงตาม AI Score</span></>
          )}
          {viewMode === 'search' && (
            <>
              <Search size={14} color="#0891B2" style={{ flexShrink: 0 }} />
              <div style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาด้วยชื่อเหรียญ หรือสัญลักษณ์... เช่น BTC, Ethereum, SOL"
                  onKeyDown={(e) => e.key === 'Escape' && setViewMode('watchlist')}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    padding: '2px 4px',
                    width: '100%',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '2px 4px',
                      display: 'flex', alignItems: 'center', flexShrink: 0,
                    }}
                    title="ล้างคำค้นหา"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span style={{
                fontSize: '11px',
                color: '#0891B2',
                fontWeight: 600,
                flexShrink: 0,
                opacity: searchQuery.trim() ? 1 : 0.5,
              }}>
                {searchQuery.trim() ? `${displayedCoins.length} ผล` : 'พิมพ์เพื่อค้นหา'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Responsive Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="crypto-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '28px' }}>#</th>
              <th style={{ width: '30px' }}></th>
              <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>
                เหรียญ <ArrowUpDown size={11} />
              </th>
              <th onClick={() => handleSort('price')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                ราคา ({currency}) <ArrowUpDown size={11} />
              </th>
              <th onClick={() => handleSort('change1h')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                1h %
              </th>
              <th onClick={() => handleSort('change24h')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                24h % <ArrowUpDown size={11} />
              </th>
              <th onClick={() => handleSort('change7d')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                7d %
              </th>
              <th onClick={() => handleSort('volume24h')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                Volume 24h
              </th>
              <th onClick={() => handleSort('rsi')} style={{ textAlign: 'right', cursor: 'pointer' }}>
                RSI (14)
              </th>
              <th style={{ textAlign: 'center' }}>สัญญาณ</th>
              <th onClick={() => handleSort('aiScore')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                AI Score <ArrowUpDown size={11} />
              </th>
              <th onClick={() => handleSort('technicalScore')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                Tech Score
              </th>
              <th style={{ textAlign: 'center' }}>ความเสี่ยง</th>
              <th style={{ textAlign: 'center' }}>กราฟ 7 วัน</th>
            </tr>
          </thead>
          <tbody>
            {displayedCoins.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  {
                    viewMode === 'watchlist' ? (
                      <div>
                        <Star size={28} color="#F59E0B" style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>ยังไม่มีรายการโปรด</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>กดไอคอน ★ ที่เหรียญใดก็ได้เพื่อเพิ่มเข้ารายการโปรด</div>
                      </div>
                    ) : viewMode === 'buy_interest' ? (
                      <div>
                        <span style={{ fontSize: '22px' }}>📊</span>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>ไม่พบเหรียญน่าสนใจในขณะนี้</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>ตลาดอาจอยู่ในช่วง Sideways หรือ Bearish — ลองดูหมวดหมู่อื่น</div>
                      </div>
                    ) : viewMode === 'best_buy_ai' ? (
                      <div>
                        <span style={{ fontSize: '22px' }}>🤖</span>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>AI ยังไม่พบเหรียญที่ดีที่สุดในขณะนี้</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>AI Score ต้องมากกว่า 65 และต้องมีสัญญาณ BUY / STRONG BUY</div>
                      </div>
                    ) : viewMode === 'search' ? (
                      <div>
                        <Search size={28} color="#0891B2" style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>
                          {searchQuery.trim()
                            ? `ไม่พบเหรียญที่ตรงกับ "${searchQuery}"`
                            : 'พิมพ์ชื่อหรือสัญลักษณ์เหรียญที่ต้องการค้นหา'}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>
                          {searchQuery.trim()
                            ? 'ลองค้นหาด้วยคำอื่น หรือตรวจสอบตัวสะกด'
                            : 'เช่น BTC, ETH, Solana, DOGE ...'}
                        </div>
                      </div>
                    ) : (
                      <div>ไม่พบข้อมูล</div>
                    )
                  }
                </td>
              </tr>
            ) : displayedCoins.map((coin, index) => {
              const displayPrice = (coin.price * multiplier).toLocaleString(undefined, {
                minimumFractionDigits: coin.price < 1 ? 4 : 2,
                maximumFractionDigits: coin.price < 1 ? 4 : 2,
              });

              return (
                <tr
                  key={coin.symbol}
                  onClick={() => onSelectCoin(coin.symbol)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(coin.symbol);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        title={coin.isWatchlist ? 'นำออกจาก Watchlist' : 'เพิ่มใน Watchlist'}
                      >
                        <Star
                          size={14}
                          fill={coin.isWatchlist ? '#F59E0B' : 'none'}
                          color={coin.isWatchlist ? '#F59E0B' : 'var(--text-muted)'}
                        />
                      </button>

                      {onToggleFocus && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFocus(coin.symbol);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          title={focusSymbols.includes(coin.symbol) ? 'นำออกจาก FOCUS' : 'เพิ่มเข้าสู่ FOCUS (🎯)'}
                        >
                          <Target
                            size={14}
                            color={focusSymbols.includes(coin.symbol) ? '#8B5CF6' : 'var(--text-muted)'}
                            style={{ filter: focusSymbols.includes(coin.symbol) ? 'drop-shadow(0 0 4px #8B5CF6)' : 'none' }}
                          />
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CryptoIcon symbol={coin.symbol} size={22} />
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{coin.symbol}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{coin.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    <PriceCell price={coin.price * multiplier} prefix={prefix} />
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: coin.change1h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                    }}
                  >
                    {coin.change1h > 0 ? `+${coin.change1h}%` : `${coin.change1h}%`}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: coin.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                    }}
                  >
                    {coin.change24h > 0 ? `+${coin.change24h.toFixed(1)}%` : `${coin.change24h.toFixed(1)}%`}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: coin.change7d >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                    }}
                  >
                    {coin.change7d > 0 ? `+${coin.change7d.toFixed(1)}%` : `${coin.change7d.toFixed(1)}%`}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {prefix}{((coin.volume24h * multiplier) / 1e6).toFixed(1)}M
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{coin.rsi}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${
                        coin.signal === 'STRONG_BUY'
                          ? 'badge-strong-buy'
                          : coin.signal === 'BUY'
                          ? 'badge-buy'
                          : 'badge-watch'
                      }`}
                    >
                      {coin.signalLabelTh}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                    {coin.aiScore}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>
                    {coin.technicalScore}{' '}
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({coin.scoreGrade})</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color:
                          coin.riskLevel === 'Low'
                            ? '#10B981'
                            : coin.riskLevel === 'Medium'
                            ? '#F59E0B'
                            : '#EF4444',
                        fontWeight: 600,
                      }}
                    >
                      {coin.riskLevel}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {renderSparkline(coin.sparkline, coin.change7d >= 0)}
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
