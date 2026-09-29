import React, { useState } from 'react';
import { X, Layers, Check, ArrowRight, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { FocusCoinData } from '../types/index.js';

interface FocusCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  focusCoins: FocusCoinData[];
  currency: 'THB' | 'USDT';
  onSelectCoin: (symbol: string) => void;
}

export const FocusCompareModal: React.FC<FocusCompareModalProps> = ({
  isOpen,
  onClose,
  focusCoins,
  currency,
  onSelectCoin,
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() =>
    focusCoins.slice(0, 3).map((c) => c.symbol)
  );

  if (!isOpen) return null;

  const toggleSelect = (sym: string) => {
    if (selectedSymbols.includes(sym)) {
      if (selectedSymbols.length > 2) {
        setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
      }
    } else {
      if (selectedSymbols.length < 5) {
        setSelectedSymbols([...selectedSymbols, sym]);
      }
    }
  };

  const comparedCoins = focusCoins.filter((c) => selectedSymbols.includes(c.symbol));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                เปรียบเทียบเหรียญ FOCUS (Compare 2–5 Coins)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                วิเคราะห์เชิงลึกเปรียบเทียบมิติต่างๆ เคียงข้างกันเพื่อการตัดสินใจที่ดีที่สุด
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Coin Selector Chips */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--bg-card-inner)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginRight: '6px' }}>
            เลือกเหรียญ (2–5 ตัว):
          </span>
          {focusCoins.map((coin) => {
            const isSelected = selectedSymbols.includes(coin.symbol);
            return (
              <button
                key={coin.symbol}
                onClick={() => toggleSelect(coin.symbol)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #8B5CF6' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'var(--bg-card)',
                  color: isSelected ? '#A78BFA' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {coin.symbol}
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>

        {/* Comparison Matrix Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: 'var(--text-muted)',
                      width: '200px',
                      fontWeight: 700,
                    }}
                  >
                    มิติการวิเคราะห์ (Dimensions)
                  </th>
                  {comparedCoins.map((coin) => (
                    <th
                      key={coin.symbol}
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--text-primary)',
                        minWidth: '160px',
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{coin.symbol}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{coin.coinName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. Focus Score */}
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#A78BFA' }}>
                    FOCUS SCORE (0–100)
                  </td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: c.focusScore >= 80 ? 'var(--neon-green)' : c.focusScore >= 70 ? 'var(--neon-cyan)' : '#F59E0B' }}>
                        {c.focusScore}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {c.focusLevel} ({c.scoreDelta >= 0 ? `+${c.scoreDelta}` : c.scoreDelta})
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. Current Price */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>ราคาปัจจุบัน</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                      {currency === 'THB'
                        ? `฿${(c.currentPrice * 33.24).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                        : `$${c.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                      <div style={{ fontSize: '11px', color: c.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                        {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 3. Trend & MTF Agreement */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Trend & MTF Agreement</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--neon-cyan)' }}>{c.trends.tf4h}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {c.mtfAgreementScore}% Agreement
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 4. Entry Status & Setup */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>สัญญาณเข้าซื้อ (Entry Status)</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            c.entryIntelligence.status === 'DO NOT CHASE'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : c.entryIntelligence.status.includes('BUY')
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            c.entryIntelligence.status === 'DO NOT CHASE'
                              ? '#EF4444'
                              : c.entryIntelligence.status.includes('BUY')
                              ? '#10B981'
                              : '#F59E0B',
                        }}
                      >
                        {c.entryIntelligence.status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 5. Exit Status & Trailing Stop */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>คำแนะนำ Exit / Trailing Stop</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: c.exitIntelligence.status === 'LOCK PROFIT' ? '#F97316' : '#3B82F6' }}>
                        {c.exitIntelligence.status}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        TS: {currency === 'THB' ? `฿${(c.exitIntelligence.dynamicTrailingStop * 33.24).toFixed(2)}` : `$${c.exitIntelligence.dynamicTrailingStop.toFixed(2)}`}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 6. Risk / Reward */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Risk / Reward Ratio</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--neon-green)' }}>
                      {c.entryIntelligence.riskReward}
                    </td>
                  ))}
                </tr>

                {/* 7. Sub-Scores (Tech, Entry, Fund, News, Risk) */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Technical Score (30%)</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                      {c.technicalScore}/100
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Entry Quality Score (20%)</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                      {c.entryScore}/100
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Profit Protection (Exit Risk)</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: c.exitIntelligence.profitProtectionScore > 80 ? '#F97316' : 'inherit' }}>
                      {c.exitIntelligence.profitProtectionScore}/100
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Order Book Buy Pressure</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: c.volumeOrderBook.buyPressurePct > 50 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {c.volumeOrderBook.buyPressurePct}% Buy
                    </td>
                  ))}
                </tr>

                {/* 8. Action Link */}
                <tr>
                  <td style={{ padding: '16px 12px' }}></td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          onSelectCoin(c.symbol);
                          onClose();
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        วิเคราะห์เชิงลึก <ArrowRight size={12} />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
