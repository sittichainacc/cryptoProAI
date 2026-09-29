import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { HeatmapItem, SectorStatItem, TickerData } from '../types/index.js';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Compass, Shield, Activity } from 'lucide-react';
import { WhaleRadarWidget } from '../components/WhaleRadarWidget.js';
import { realtimeService } from '../services/realtime.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from '../components/CryptoIcon.js';

interface MarketOverviewPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const MarketOverviewPage: React.FC<MarketOverviewPageProps> = ({ onSelectCoin, currency }) => {
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [sectorStats, setSectorStats] = useState<SectorStatItem[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');

  useEffect(() => {
    api.getHeatmap().then(setHeatmap);
    api.getSectorStats().then(setSectorStats);

    const unsub = realtimeService.subscribeTicks((ticks) => {
      setHeatmap((prev) =>
        prev.map((item) => {
          const t = ticks[item.symbol];
          return t ? { ...item, price: t.price, change24h: t.change24h } : item;
        })
      );
    });

    return unsub;
  }, []);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Sector Donut Distribution (Image 2)
  const sectorShares = [
    { name: 'BTC', share: 54.2, color: '#F59E0B' },
    { name: 'ETH', share: 13.8, color: '#3B82F6' },
    { name: 'Stablecoin', share: 7.6, color: '#10B981' },
    { name: 'DeFi', share: 5.6, color: '#06B6D4' },
    { name: 'Layer1 / Layer2', share: 4.9, color: '#8B5CF6' },
    { name: 'Meme', share: 4.3, color: '#EC4899' },
    { name: 'AI & DePIN', share: 4.1, color: '#14B8A6' },
    { name: 'GameFi', share: 2.8, color: '#F97316' },
    { name: 'RWA & Oracle', share: 2.7, color: '#0284C7' },
  ];

  const TIMEFRAME_DATA: Record<string, {
    capUsd: number;
    changePct: number;
    periodLabel: string;
    isPositive: boolean;
    areaD: string;
    lineD: string;
    timeline: string[];
  }> = {
    '1D': {
      capUsd: 3.62e12,
      changePct: 2.48,
      periodLabel: '(24h)',
      isPositive: true,
      areaD: 'M 0 170 Q 60 160, 120 145 T 240 120 T 360 85 T 480 95 T 600 40 L 600 220 L 0 220 Z',
      lineD: 'M 0 170 Q 60 160, 120 145 T 240 120 T 360 85 T 480 95 T 600 40',
      timeline: ['00:00', '04:00', '08:00', '12:00', '16:00', 'Live'],
    },
    '1W': {
      capUsd: 3.54e12,
      changePct: 4.15,
      periodLabel: '(7d)',
      isPositive: true,
      areaD: 'M 0 180 Q 80 190, 160 150 T 320 110 T 480 70 T 600 50 L 600 220 L 0 220 Z',
      lineD: 'M 0 180 Q 80 190, 160 150 T 320 110 T 480 70 T 600 50',
      timeline: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
    },
    '1M': {
      capUsd: 3.38e12,
      changePct: 9.82,
      periodLabel: '(30d)',
      isPositive: true,
      areaD: 'M 0 195 Q 100 170, 200 140 T 400 90 T 500 65 T 600 35 L 600 220 L 0 220 Z',
      lineD: 'M 0 195 Q 100 170, 200 140 T 400 90 T 500 65 T 600 35',
      timeline: ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4', 'Live'],
    },
    '3M': {
      capUsd: 2.95e12,
      changePct: 22.71,
      periodLabel: '(3M)',
      isPositive: true,
      areaD: 'M 0 205 Q 120 180, 250 150 T 420 100 T 520 60 T 600 30 L 600 220 L 0 220 Z',
      lineD: 'M 0 205 Q 120 180, 250 150 T 420 100 T 520 60 T 600 30',
      timeline: ['3 เดือนก่อน', '2 เดือนก่อน', 'เดือนก่อน', 'ปัจจุบัน'],
    },
    '1Y': {
      capUsd: 2.14e12,
      changePct: 69.15,
      periodLabel: '(1Y)',
      isPositive: true,
      areaD: 'M 0 210 Q 100 195, 200 160 T 360 130 T 480 80 T 600 25 L 600 220 L 0 220 Z',
      lineD: 'M 0 210 Q 100 195, 200 160 T 360 130 T 480 80 T 600 25',
      timeline: ['ก.ย. 2025', 'ธ.ค. 2025', 'มี.ค. 2026', 'มิ.ย. 2026', 'สด Live'],
    },
    'ALL': {
      capUsd: 1.10e12,
      changePct: 229.09,
      periodLabel: '(All Time)',
      isPositive: true,
      areaD: 'M 0 215 Q 150 205, 300 150 T 450 90 T 550 50 T 600 20 L 600 220 L 0 220 Z',
      lineD: 'M 0 215 Q 150 205, 300 150 T 450 90 T 550 50 T 600 20',
      timeline: ['2022', '2023', '2024', '2025', '2026 Live'],
    },
  };

  const currentTfData = TIMEFRAME_DATA[activeTimeframe] || TIMEFRAME_DATA['1D'];
  const formattedCap = currency === 'THB'
    ? `฿${((currentTfData.capUsd * multiplier) / 1e12).toFixed(2)}T`
    : `$${(currentTfData.capUsd / 1e12).toFixed(2)}T`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div className="card-header-row" style={{ marginBottom: '0', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            ภาพรวมตลาดคริปโต (Crypto Market Overview)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            วิเคราะห์เชิงลึก สัดส่วนตลาดรายหมวดหมู่ และ Heatmap ทิศทางเม็ดเงิน
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              style={{
                background: activeTimeframe === tf ? 'var(--neon-blue)' : 'rgba(255,255,255,0.04)',
                color: activeTimeframe === tf ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Total Market Cap Curve & Sector Donut Breakdown */}
      <div className="market-overview-grid-2col">
        {/* Total Market Cap Chart Widget */}
        <div className="crypto-card">
          <div className="card-header-row">
            <div>
              <div className="card-title" style={{ fontSize: '15px' }}>
                กราฟตลาดรวม (Total Market Cap - {activeTimeframe})
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900 }}>{formattedCap}</span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: currentTfData.changePct >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  }}
                >
                  {currentTfData.changePct >= 0 ? `+${currentTfData.changePct.toFixed(2)}%` : `${currentTfData.changePct.toFixed(2)}%`} {currentTfData.periodLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Area Chart Simulation */}
          <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
            <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="marketCapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={currentTfData.areaD}
                fill="url(#marketCapGrad)"
                style={{ transition: 'all 0.3s ease' }}
              />
              <path
                d={currentTfData.lineD}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                style={{ transition: 'all 0.3s ease' }}
              />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {currentTfData.timeline.map((label, idx) => (
              <span key={idx}>{label}</span>
            ))}
          </div>
        </div>


        {/* Sector Breakdown Donut (Image 2) */}
        <div className="crypto-card">
          <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
            สัดส่วนตลาดรายหมวด (Sector Share)
          </div>

          <div className="sector-donut-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Donut representation */}
            <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0, margin: '0 auto' }}>
              <svg viewBox="0 0 100 100" width="130" height="130">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray="128 110" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="33 205" strokeDashoffset="-128" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="12" strokeDasharray="15 223" strokeDashoffset="-161" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="14 224" strokeDashoffset="-176" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="12" strokeDasharray="12 226" strokeDashoffset="-190" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray="18 220" strokeDashoffset="-202" />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 900 }}>$3.62T</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Cap</span>
              </div>
            </div>

            {/* Shares List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px', fontSize: '11px' }}>
              {sectorShares.map((sec) => (
                <div key={sec.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: sec.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{sec.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{sec.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Heatmap & Sector Performance Bars */}
      <div className="market-overview-grid-2col">
        {/* Heatmap (Market Performance) */}
        <div className="crypto-card">
          <div className="card-header-row" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div className="card-title" style={{ fontSize: '15px' }}>
              Heatmap (Market Performance)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ขนาดตาม Market Cap • สีตาม 24h %
            </div>
          </div>

          <div className="market-heatmap-grid">
            {heatmap.map((item) => {
              const isPositive = item.change24h >= 0;
              const bg = isPositive
                ? item.change24h > 15
                  ? 'rgba(16, 185, 129, 0.45)'
                  : item.change24h > 5
                  ? 'rgba(16, 185, 129, 0.28)'
                  : 'rgba(16, 185, 129, 0.16)'
                : 'rgba(239, 68, 68, 0.25)';
              const border = isPositive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';

              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectCoin(item.symbol)}
                  style={{
                    backgroundColor: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CryptoIcon symbol={item.symbol} size={18} />
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{item.symbol}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {prefix}{(item.price * multiplier).toLocaleString(undefined, { maximumFractionDigits: item.price < 1 ? 4 : 2 })}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isPositive ? 'var(--neon-green)' : 'var(--neon-red)',
                      textAlign: 'right',
                    }}
                  >
                    {item.change24h > 0 ? `+${item.change24h.toFixed(1)}%` : `${item.change24h.toFixed(1)}%`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Performance Horizontal Bars (Image 3) */}
        <div className="crypto-card">
          <div className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
            แนวโน้มรายกลุ่ม (Sector Performance)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sectorStats.map((sec) => (
              <div key={sec.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sec.name}</span>
                  <span style={{ fontWeight: 700, color: sec.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                    {sec.change24h >= 0 ? `+${sec.change24h}%` : `${sec.change24h}%`}
                  </span>
                </div>
                <div
                  style={{
                    height: '7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, (sec.change24h / 20) * 100))}%`,
                      height: '100%',
                      backgroundColor: sec.color,
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Whale Alert & On-Chain Flow Radar */}
      <WhaleRadarWidget currency={currency} onSelectCoin={onSelectCoin} />

      {/* Row 3: AI Strategy Suggestions */}
      <div className="market-strategy-grid">
        <div className="crypto-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), var(--bg-card))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#10B981" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>Follow Trend</div>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            เหมาะกับตลาดขาขึ้น เน้นเหรียญที่มีโครงสร้าง Higher High และยืนเหนือเส้น EMA 20/50/200 เช่น SOL, LINK, AAVE
          </p>
        </div>

        <div className="crypto-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), var(--bg-card))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={18} color="#F59E0B" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>Swing Trade</div>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            จับจังหวะสวิงสั้น-กลาง จากการทดสอบแนวรับ (Retest) หรือเบรคเอาท์พร้อม Volume สูง เหมาะสำหรับตลาด Sideway Up
          </p>
        </div>

        <div className="crypto-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), var(--bg-card))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#3B82F6" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>DCA (Dollar Cost Averaging)</div>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            สะสมระยะยาวในกลุ่ม Core Large Cap (BTC, ETH, SOL) ลดความเสี่ยงจากความผันผวนของตลาดระยะสั้น
          </p>
        </div>
      </div>
    </div>
  );
};
