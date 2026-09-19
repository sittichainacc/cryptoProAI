import React, { useState } from 'react';
import { TickerData } from '../types/index.js';
import { Star, ArrowUpDown, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';

interface CoinRankingTableProps {
  coins: TickerData[];
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const CoinRankingTable: React.FC<CoinRankingTableProps> = ({
  coins,
  onSelectCoin,
  onToggleWatchlist,
  currency,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState<keyof TickerData>('marketCap');
  const [sortAsc, setSortAsc] = useState(false);

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
    if (selectedCategory !== 'all' && c.sector !== selectedCategory) return false;
    return true;
  });

  const sortedCoins = [...filteredCoins].sort((a: any, b: any) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    return sortAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
  });

  const multiplier = currency === 'THB' ? 34.5 : 1;
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
    <div className="crypto-card" style={{ marginTop: '20px' }}>
      {/* Table Header & Category Tabs */}
      <div className="card-header-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="card-title">
          <span>ตารางจัดอันดับเหรียญ (Crypto Ranking)</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({sortedCoins.length} เหรียญ)</span>
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
            {sortedCoins.map((coin, index) => {
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(coin.symbol);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Star
                        size={14}
                        fill={coin.isWatchlist ? '#F59E0B' : 'none'}
                        color={coin.isWatchlist ? '#F59E0B' : 'var(--text-muted)'}
                      />
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{coin.symbol}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{coin.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {prefix}{displayPrice}
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
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    ${(coin.volume24h / 1e6).toFixed(1)}M
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
