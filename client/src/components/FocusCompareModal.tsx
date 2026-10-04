import React, { useState, useEffect } from 'react';
import { X, Layers, Check, ArrowRight, ShieldCheck, Zap, AlertTriangle, Bookmark, Trash2, Plus, Sparkles, Cloud } from 'lucide-react';
import { FocusCoinData, FocusComparisonItem } from '../types/index.js';
import { api } from '../services/api.js';

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
  const [savedSets, setSavedSets] = useState<FocusComparisonItem[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load saved comparison sets from PostgreSQL
  useEffect(() => {
    if (isOpen) {
      loadSavedSets();
    }
  }, [isOpen]);

  const loadSavedSets = async () => {
    try {
      const sets = await api.getFocusComparisons();
      setSavedSets(sets);
      if (sets.length > 0 && !activeSetId) {
        // Auto select first set if matches
        const first = sets[0];
        if (first.symbols && first.symbols.length >= 2) {
          // keep initial unless user wants
        }
      }
    } catch (err) {
      console.error('Failed to load saved comparison sets:', err);
    }
  };

  const handleSelectSet = (set: FocusComparisonItem) => {
    setActiveSetId(set.id);
    // Find matching coins that exist in focusCoins or filter
    const valid = set.symbols.filter((s) => (focusCoins || []).some((c) => c.symbol === s));
    if (valid.length >= 2) {
      setSelectedSymbols(valid.slice(0, 5));
    } else {
      setSelectedSymbols(set.symbols.slice(0, 5));
    }
    showFeedback(`โหลดชุดเปรียบเทียบ: ${set.name}`);
  };

  const handleSaveSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim() || selectedSymbols.length < 2) return;
    setIsSubmitting(true);
    try {
      const saved = await api.saveFocusComparison({
        name: newSetName.trim(),
        symbols: selectedSymbols,
        notes: `เปรียบเทียบ ${selectedSymbols.join(' vs ')}`,
        isFavorite: true,
      });
      setSavedSets((prev) => [saved, ...prev]);
      setActiveSetId(saved.id);
      setIsSavingNew(false);
      setNewSetName('');
      showFeedback('บันทึกชุดเปรียบเทียบเข้าสู่ระบบเรียบร้อย');
    } catch (err) {
      console.error('Failed to save comparison set:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSet = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบชุดเปรียบเทียบ "${name}" ใช่หรือไม่?`)) return;
    try {
      await api.deleteFocusComparison(id);
      setSavedSets((prev) => prev.filter((s) => s.id !== id));
      if (activeSetId === id) setActiveSetId(null);
      showFeedback(`ลบชุดเปรียบเทียบ "${name}" แล้ว`);
    } catch (err) {
      console.error('Failed to delete comparison set:', err);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  if (!isOpen) return null;

  const toggleSelect = (sym: string) => {
    setActiveSetId(null);
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1150px',
          maxHeight: '94vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.1))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)',
              }}
            >
              <Layers size={19} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  เปรียบเทียบเหรียญ FOCUS (Compare 2–5 Coins)
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34D399',
                    fontWeight: 600,
                  }}
                >
                  <Cloud size={11} /> PostgreSQL Synced
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                วิเคราะห์เชิงลึกเปรียบเทียบมิติต่างๆ เคียงข้างกัน บันทึกชุดเปรียบเทียบลงฐานข้อมูลผู้ใช้ได้ตลอดเวลา
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
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            style={{
              padding: '8px 24px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} /> {feedbackMsg}
          </div>
        )}

        {/* Saved Comparison Sets Bar */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Bookmark size={13} color="#A78BFA" /> ชุดที่บันทึกไว้:
            </span>
            {savedSets.map((s) => {
              const isActive = activeSetId === s.id;
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isActive ? 'rgba(139, 92, 246, 0.25)' : 'var(--bg-card)',
                    border: isActive ? '1px solid #8B5CF6' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSet(s)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isActive ? '#A78BFA' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: 0,
                    }}
                  >
                    <span>{s.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>({s.symbols.join(',')})</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSet(s.id, s.name);
                    }}
                    title="ลบชุดเปรียบเทียบนี้"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      marginLeft: '2px',
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          <div>
            {!isSavingNew ? (
              <button
                type="button"
                onClick={() => setIsSavingNew(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#C4B5FD',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={12} /> บันทึกชุดปัจจุบันนี้
              </button>
            ) : (
              <form onSubmit={handleSaveSet} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="ตั้งชื่อชุดเปรียบเทียบ..."
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  autoFocus
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #8B5CF6',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    width: '170px',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newSetName.trim()}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    backgroundColor: '#8B5CF6',
                    border: 'none',
                    color: '#FFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? '...' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingNew(false)}
                  style={{
                    padding: '4px 6px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Coin Selector Chips */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--bg-card-inner)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginRight: '6px', fontWeight: 600 }}>
            เลือกเหรียญ ({selectedSymbols.length}/5):
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
                      width: '210px',
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
                        {c.change24h >= 0 ? `+${c.change24h.toFixed(2)}%` : `${c.change24h.toFixed(2)}%`} (24h)
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 3. Entry Intelligence */}
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>สถานะจุดเข้าซื้อ (Entry Status)</td>
                  {comparedCoins.map((c) => {
                    const st = c.entryIntelligence.status;
                    const isGood = st.includes('BUY') || st === 'IN ENTRY ZONE';
                    return (
                      <td key={c.symbol} style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: isGood ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isGood ? 'var(--neon-green)' : '#F59E0B',
                          }}
                        >
                          {st}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Risk / Reward */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Risk : Reward</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--neon-green)' }}>
                      {c.entryIntelligence.riskReward}
                    </td>
                  ))}
                </tr>

                {/* 5. Multi-Timeframe Alignment */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>MTF Agreement</td>
                  {comparedCoins.map((c) => (
                    <td key={c.symbol} style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{c.mtfAgreementScore}%</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{c.trends.tf4h} (4H)</div>
                    </td>
                  ))}
                </tr>

                {/* 6. RSI (14) */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>RSI (14)</td>
                  {comparedCoins.map((c) => {
                    const rsi = c.technicals.rsi;
                    return (
                      <td key={c.symbol} style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: rsi > 70 ? 'var(--neon-red)' : rsi < 35 ? 'var(--neon-green)' : 'var(--text-primary)' }}>
                        {rsi.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>

                {/* 7. Volume Pressure */}
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
