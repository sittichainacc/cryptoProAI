import React, { useState } from 'react';
import { Sparkles, Filter, RotateCcw, Zap, TrendingUp, BarChart3, CheckCircle2, X, Plus, Star } from 'lucide-react';
import { api } from '../services/api.js';
import { TickerData } from '../types/index.js';
import { CryptoIcon } from './CryptoIcon.js';
import { formatPrice } from '../utils/currency.js';

interface AIScannerQuickCardProps {
  onRunScanner?: (mode: string, sector?: string, minVolume?: number) => Promise<TickerData[] | void> | void;
  onSelectCoin?: (symbol: string) => void;
  onAddToFocus?: (symbol: string) => void;
  currency?: 'THB' | 'USDT';
}

export const AIScannerQuickCard: React.FC<AIScannerQuickCardProps> = ({
  onRunScanner,
  onSelectCoin,
  onAddToFocus,
  currency = 'THB',
}) => {
  const [selectedChip, setSelectedChip] = useState('breakout');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedMinChange, setSelectedMinChange] = useState('all');
  const [selectedMinVol, setSelectedMinVol] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<TickerData[] | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [addedFocusMap, setAddedFocusMap] = useState<Record<string, boolean>>({});

  const chips = [
    { id: 'breakout', label: 'Breakout', icon: Zap },
    { id: 'momentum', label: 'Momentum', icon: Sparkles },
    { id: 'volume_spike', label: 'Volume Spike', icon: Zap },
    { id: 'oversold', label: 'Oversold', icon: TrendingUp },
    { id: 'trend_following', label: 'Trend Following', icon: BarChart3 },
    { id: 'ai_score_high', label: 'AI Score สูง', icon: Sparkles },
  ];

  const handleReset = () => {
    setSelectedChip('breakout');
    setSelectedGroup('all');
    setSelectedMinChange('all');
    setSelectedMinVol('all');
    setSelectedRisk('all');
    setScanResults(null);
  };

  const executeScan = async () => {
    setIsScanning(true);
    try {
      let minVolNum = 0;
      if (selectedMinVol === '฿300M' || selectedMinVol === '$10M') minVolNum = 300000000;
      else if (selectedMinVol === '฿1500M' || selectedMinVol === '$50M') minVolNum = 1500000000;
      else if (selectedMinVol === '฿3000M' || selectedMinVol === '$100M') minVolNum = 3000000000;

      const results = await api.runScanner(
        selectedChip,
        selectedGroup === 'all' ? undefined : selectedGroup,
        minVolNum
      );

      let filtered = results || [];

      // Filter by min change
      if (selectedMinChange === '+5%') {
        filtered = filtered.filter((c) => c.change24h >= 5);
      } else if (selectedMinChange === '+10%') {
        filtered = filtered.filter((c) => c.change24h >= 10);
      } else if (selectedMinChange === '+20%') {
        filtered = filtered.filter((c) => c.change24h >= 20);
      }

      // Filter by risk
      if (selectedRisk === 'low') {
        filtered = filtered.filter((c) => c.rsi >= 40 && c.rsi <= 65);
      } else if (selectedRisk === 'high') {
        filtered = filtered.filter((c) => c.change24h >= 15 || c.rsi > 75);
      }

      setScanResults(filtered);
      setIsResultModalOpen(true);

      if (onRunScanner) {
        await onRunScanner(selectedChip, selectedGroup === 'all' ? undefined : selectedGroup, minVolNum);
      }
    } catch (err) {
      console.error('Scanner failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleQuickAddFocus = async (symbol: string) => {
    try {
      if (onAddToFocus) {
        onAddToFocus(symbol);
      } else {
        await api.addFocus({ symbol, priority: 'high', mode: 'high_focus' });
      }
      setAddedFocusMap((prev) => ({ ...prev, [symbol]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const getChipLabel = (id: string) => chips.find((c) => c.id === id)?.label || id;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {/* Left: AI Scanner Quick Bar */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-row" style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--neon-blue)" />
                <div className="card-title" style={{ fontSize: '13.5px' }}>
                  สแกนเหรียญสด (AI Scanner)
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                {chips.find((c) => c.id === selectedChip)?.label}
              </span>
            </div>

            <div className="card-subtitle" style={{ marginBottom: '12px' }}>
              เลือกสูตรสแกนอัจฉริยะเพื่อหาเหรียญทำกำไรทันที
            </div>

            {/* Chips Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {chips.map((chip) => {
                const isSelected = selectedChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setSelectedChip(chip.id)}
                    style={{
                      background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                      color: isSelected ? '#60A5FA' : 'var(--text-secondary)',
                      borderRadius: '8px',
                      padding: '7px 4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <chip.icon size={12} color={isSelected ? '#60A5FA' : 'var(--text-muted)'} />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={executeScan}
            disabled={isScanning}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '9px 12px' }}
          >
            {isScanning ? (
              <>
                <Sparkles size={15} className="animate-spin" />
                <span>กำลังสแกน 357 เหรียญ...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>เริ่มสแกน "{getChipLabel(selectedChip)}" ทันที</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Filter Card */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-row" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={15} color="#A78BFA" />
                <div className="card-title" style={{ fontSize: '13.5px' }}>
                  ตัวคัดกรองเรดาร์ (Filter)
                </div>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>พารามิเตอร์ละเอียด</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  กลุ่มเหรียญ (Sector)
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                >
                  <option value="all">ทั้งหมด (ทุกกลุ่ม)</option>
                  <option value="core">Core / Large Cap</option>
                  <option value="layer1_2">L1 / L2</option>
                  <option value="defi">DeFi</option>
                  <option value="ai_depin">AI / DePIN</option>
                  <option value="rwa_oracle">RWA / Oracle</option>
                  <option value="meme">Meme</option>
                  <option value="gamefi">GameFi</option>
                  <option value="emerging">Emerging</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  การเปลี่ยนแปลง (24h %)
                </label>
                <select
                  value={selectedMinChange}
                  onChange={(e) => setSelectedMinChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="+5%">มากกว่า +5%</option>
                  <option value="+10%">มากกว่า +10%</option>
                  <option value="+20%">มากกว่า +20% (พุ่งแรง)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ปริมาณซื้อขาย (Volume)
                </label>
                <select
                  value={selectedMinVol}
                  onChange={(e) => setSelectedMinVol(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                >
                  <option value="all">ไม่จำกัดขั้นต่ำ</option>
                  {currency === 'THB' ? (
                    <>
                      <option value="฿300M">มากกว่า ฿300M</option>
                      <option value="฿1500M">มากกว่า ฿1,500M</option>
                      <option value="฿3000M">มากกว่า ฿3,000M</option>
                    </>
                  ) : (
                    <>
                      <option value="$10M">มากกว่า $10M</option>
                      <option value="$50M">มากกว่า $50M</option>
                      <option value="$100M">มากกว่า $100M</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ระดับความเสี่ยง
                </label>
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="low">ความเสี่ยงต่ำ-กลาง (RSI 40-65)</option>
                  <option value="high">ความเสี่ยงสูง (High Volatility)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={executeScan}
              disabled={isScanning}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Filter size={14} />
              <span>{isScanning ? 'กำลังสแกน...' : 'ค้นหาตามเงื่อนไข'}</span>
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
              title="รีเซ็ตเงื่อนไขทั้งหมด"
            >
              <RotateCcw size={13} />
              <span>รีเซ็ต</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* SCAN RESULTS MODAL / DRAWER */}
      {/* ================================================== */}
      {isResultModalOpen && scanResults && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsResultModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#A78BFA" />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                    ผลการสแกนเรดาร์: {getChipLabel(selectedChip)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    พบทั้งหมด <strong style={{ color: 'var(--neon-green)' }}>{scanResults.length} เหรียญ</strong> ที่ตรงตามเงื่อนไข (เรียงตามคะแนน AI Score)
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsResultModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Coin List */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scanResults.slice(0, 15).map((coin, index) => {
                const isAdded = addedFocusMap[coin.symbol];
                return (
                  <div
                    key={coin.symbol}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', width: '22px' }}>
                        #{index + 1}
                      </span>
                      <CryptoIcon symbol={coin.symbol} size={26} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>{coin.symbol}</strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/THB</span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(139, 92, 246, 0.2)',
                              color: '#C4B5FD',
                            }}
                          >
                            AI {coin.aiScore}/100
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {coin.name} • RSI: <strong style={{ color: '#CBD5E1' }}>{coin.rsi}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                          {formatPrice(coin.price)}
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: coin.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                          }}
                        >
                          {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            onSelectCoin?.(coin.symbol);
                            setIsResultModalOpen(false);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid #3B82F6',
                            color: '#60A5FA',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="เปิดดูกราฟและบทวิเคราะห์เหรียญนี้ทันที"
                        >
                          <BarChart3 size={12} /> ดูกราฟ
                        </button>

                        <button
                          onClick={() => handleQuickAddFocus(coin.symbol)}
                          disabled={isAdded}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: isAdded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                            border: `1px solid ${isAdded ? '#10B981' : '#8B5CF6'}`,
                            color: isAdded ? '#34D399' : '#C4B5FD',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: isAdded ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="บันทึกเหรียญเข้าสู่ฐานข้อมูล Focus"
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 size={12} /> บันทึกแล้ว
                            </>
                          ) : (
                            <>
                              <Star size={12} /> + Add Focus
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {scanResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <Filter size={32} color="#64748B" style={{ margin: '0 auto 10px auto' }} />
                  <div>ไม่พบเหรียญที่ตรงตามเงื่อนไขที่กำหนด</div>
                  <div style={{ fontSize: '11.5px', marginTop: '4px' }}>ลองลดความเข้มงวดของตัวคัดกรอง หรือเปลี่ยนสูตรการสแกน</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <span>ระบบสแกนด้วย Quant AI Engine สดทุก 10 วินาที</span>
              <button
                onClick={() => setIsResultModalOpen(false)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
