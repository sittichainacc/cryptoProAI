import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { TickerData } from '../types/index.js';
import { Sparkles, Filter, Zap, RotateCcw, ArrowUpDown, ArrowUpRight, ArrowDownRight, Star, Download } from 'lucide-react';
import { realtimeService } from '../services/realtime.js';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface CoinScreenerPageProps {
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const CoinScreenerPage: React.FC<CoinScreenerPageProps> = ({
  onSelectCoin,
  onToggleWatchlist,
  currency,
}) => {
  const [scanMode, setScanMode] = useState('breakout');
  const [selectedSector, setSelectedSector] = useState('all');
  const [minVolume, setMinVolume] = useState(0);
  const [results, setResults] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scanModes = [
    { id: 'breakout', label: '1. Breakout', desc: 'ทะลุแนวต้าน + Volume สูง' },
    { id: 'momentum', label: '2. Momentum', desc: 'แรงส่งขาขึ้น + MACD Positive' },
    { id: 'trend_following', label: '3. Trend Following', desc: 'EMA20 > EMA50 > EMA200' },
    { id: 'pullback', label: '4. Pullback', desc: 'Uptrend กำลังย่อตัวทดสอบแนวรับ' },
    { id: 'reversal', label: '5. Reversal', desc: 'เปลี่ยนแนวโน้มจากลงเป็นขึ้น' },
    { id: 'volume_spike', label: '6. Volume Spike', desc: 'Volume สูงกว่าค่าเฉลี่ย 150-300%' },
    { id: 'oversold', label: '7. Oversold', desc: 'RSI ต่ำ เข้าโซนขายมากเกินไป' },
    { id: 'relative_strength', label: '8. Relative Strength', desc: 'เหรียญที่แข็งแกร่งกว่า BTC' },
  ];

  const handleRunScan = async (mode = scanMode) => {
    setIsLoading(true);
    try {
      const data = await api.runScanner(mode, selectedSector, minVolume);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRunScan('breakout');

    const unsub = realtimeService.subscribeTicks((ticks) => {
      setResults((prev) =>
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
  }, [selectedSector, minVolume]);

  const multiplier = getCurrencyMultiplier(currency);

  const exportToCSV = () => {
    if (!results.length) return;
    const headers = ['Rank', 'Symbol', 'Name', 'Sector', `Price_${currency}`, 'Change_24h_%', 'Change_7d_%', 'Volume_24h', 'RSI_14', 'Trend', 'Signal', 'AI_Score', 'Tech_Score', 'Score_Grade', 'Risk_Level', 'Reason_TH'];
    const rows = results.map((c, i) => [
      i + 1,
      c.symbol,
      `"${c.name.replace(/"/g, '""')}"`,
      c.sector,
      (c.price * multiplier).toFixed(4),
      c.change24h,
      c.change7d,
      c.volume24h,
      c.rsi,
      `"${c.trend}"`,
      c.signal,
      c.aiScore,
      c.technicalScore,
      c.scoreGrade,
      c.riskLevel,
      `"${(c.signalReasonTh || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CryptoPro_Scanner_${scanMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const prefix = currency === 'THB' ? '฿' : '$';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
          AI Crypto Scanner (คัดกรองเหรียญอัตโนมัติ)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          เลือกจาก 8 โหมดสแกนเนอร์อัจฉริยะ ค้นหาโอกาสการลงทุนที่ดีที่สุดในตลาด
        </p>
      </div>

      {/* 8 Scan Modes Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
        }}
      >
        {scanModes.map((mode) => {
          const isSelected = scanMode === mode.id;
          return (
            <div
              key={mode.id}
              onClick={() => {
                setScanMode(mode.id);
                handleRunScan(mode.id);
              }}
              style={{
                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'var(--bg-card)',
                border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)' }}>
                {mode.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {mode.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Filters Card */}
      <div className="crypto-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>หมวดหมู่:</span>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                style={{
                  backgroundColor: '#0F182B',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  colorScheme: 'dark',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>ทั้งหมด (8 Sectors)</option>
                <option value="core" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Core</option>
                <option value="layer1_2" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>L1 / L2</option>
                <option value="defi" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>DeFi</option>
                <option value="ai_depin" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>AI / DePIN</option>
                <option value="rwa_oracle" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>RWA / Oracle</option>
                <option value="meme" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Meme</option>
                <option value="gamefi" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>GameFi</option>
                <option value="emerging" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Emerging</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Volume ขั้นต่ำ:</span>
              <select
                value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value))}
                style={{
                  backgroundColor: '#0F182B',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  colorScheme: 'dark',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="0" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>ทุกขนาดสภาพคล่อง</option>
                <option value="50000000" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>&gt; $50M</option>
                <option value="100000000" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>&gt; $100M</option>
                <option value="500000000" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>&gt; $500M</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleRunScan()}
            className="btn-primary"
            style={{ padding: '8px 16px' }}
          >
            <Zap size={14} />
            <span>สแกนข้อมูลใหม่</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="crypto-card">
        <div className="card-header-row">
          <div className="card-title">
            <span>ผลลัพธ์การสแกน ({results.length} เหรียญที่ตรงเงื่อนไข)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLoading && <span style={{ fontSize: '12px', color: 'var(--neon-cyan)' }}>กำลังวิเคราะห์...</span>}
            <button
              onClick={exportToCSV}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px', gap: '6px' }}
              title="ส่งออกผลลัพธ์เป็นไฟล์ CSV"
            >
              <Download size={13} />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="crypto-table">
            <thead>
              <tr>
                <th style={{ width: '28px' }}>#</th>
                <th></th>
                <th>เหรียญ</th>
                <th style={{ textAlign: 'right' }}>ราคา ({currency})</th>
                <th style={{ textAlign: 'right' }}>24h %</th>
                <th style={{ textAlign: 'right' }}>7d %</th>
                <th style={{ textAlign: 'right' }}>Volume 24h</th>
                <th style={{ textAlign: 'right' }}>RSI (14)</th>
                <th style={{ textAlign: 'center' }}>สัญญาณ</th>
                <th style={{ textAlign: 'center' }}>AI Score</th>
                <th style={{ textAlign: 'center' }}>Tech Score</th>
                <th style={{ textAlign: 'center' }}>ความเสี่ยง</th>
                <th>เหตุผลทางเทคนิค</th>
              </tr>
            </thead>
            <tbody>
              {results.map((coin, index) => {
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
                        <span style={{ fontWeight: 800, color: '#FFF' }}>{coin.symbol}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{coin.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {prefix}{displayPrice}
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
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
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
                    <td style={{ fontSize: '11.5px', color: 'var(--text-secondary)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {coin.signalReasonTh}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
