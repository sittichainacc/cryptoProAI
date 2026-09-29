import React, { useState, useMemo } from 'react';
import { X, Search, Target, Plus, Check, ShieldAlert, Zap } from 'lucide-react';
import { TickerData, FocusPriority, FocusMode, FocusPositionStatus } from '../types/index.js';

interface FocusAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: TickerData[];
  existingFocusSymbols: string[];
  onAddFocus: (payload: {
    symbol: string;
    priority: FocusPriority;
    mode: FocusMode;
    positionStatus: FocusPositionStatus;
    userNotes?: string;
  }) => Promise<void>;
  currency: 'THB' | 'USDT';
}

export const FocusAddModal: React.FC<FocusAddModalProps> = ({
  isOpen,
  onClose,
  coins,
  existingFocusSymbols,
  onAddFocus,
  currency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [priority, setPriority] = useState<FocusPriority>('high');
  const [mode, setMode] = useState<FocusMode>('normal');
  const [positionStatus, setPositionStatus] = useState<FocusPositionStatus>('WATCHING');
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCoins = useMemo(() => {
    if (!searchTerm.trim()) {
      return coins.slice(0, 15);
    }
    const q = searchTerm.toLowerCase();
    return coins.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        `${c.symbol}/THB`.toLowerCase().includes(q) ||
        `${c.symbol}/USDT`.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [coins, searchTerm]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedSymbol) return;
    setIsSubmitting(true);
    try {
      await onAddFocus({
        symbol: selectedSymbol,
        priority,
        mode,
        positionStatus,
        userNotes: userNotes.trim() || undefined,
      });
      setSelectedSymbol(null);
      setUserNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to add coin to focus:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(139, 92, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                เพิ่มเหรียญเข้าสู่ระบบ FOCUS
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                วิเคราะห์และเฝ้าระวังต่อเนื่อง Real-Time (Intensive Monitoring)
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

        {/* Search input */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 12px',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="ค้นหาเหรียญ: เช่น ETH, Ethereum, ETH/THB, ADA, FLOCK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                width: '100%',
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Coin Selection List */}
        <div
          style={{
            flex: 1,
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '8px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {filteredCoins.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              ไม่พบเหรียญที่ค้นหา
            </div>
          ) : (
            filteredCoins.map((coin) => {
              const isSelected = selectedSymbol === coin.symbol;
              const isAlreadyFocused = existingFocusSymbols.includes(coin.symbol);

              return (
                <div
                  key={coin.symbol}
                  onClick={() => {
                    if (!isAlreadyFocused) {
                      setSelectedSymbol(coin.symbol);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: isAlreadyFocused ? 'default' : 'pointer',
                    backgroundColor: isSelected
                      ? 'rgba(139, 92, 246, 0.22)'
                      : isAlreadyFocused
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(139, 92, 246, 0.5)'
                      : '1px solid transparent',
                    opacity: isAlreadyFocused ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-card-inner)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '11px',
                        color: isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)',
                      }}
                    >
                      {coin.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {coin.symbol}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          /THB
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {coin.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currency === 'THB'
                          ? `฿${(coin.price * 33.24).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                          : `$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: coin.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                        }}
                      >
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </div>
                    </div>

                    {isAlreadyFocused ? (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          fontWeight: 700,
                        }}
                      >
                        Focus อยู่แล้ว
                      </span>
                    ) : isSelected ? (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#8B5CF6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} color="#FFFFFF" />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Coin Configuration Form */}
        {selectedSymbol && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bg-card-inner)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {/* Priority */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ลำดับความสำคัญ (Priority)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FocusPriority)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="critical">Critical (สูงสุด)</option>
                  <option value="high">High (สูง)</option>
                  <option value="normal">Normal (ปกติ)</option>
                  <option value="low">Low (ทั่วไป)</option>
                </select>
              </div>

              {/* Mode */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ระดับ Focus (Mode)
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as FocusMode)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="normal">Normal (อัปเดตปกติ)</option>
                  <option value="high_focus">High Focus (วิเคราะห์ถี่ขึ้น)</option>
                  <option value="critical_focus">Critical Focus (ระดับวินาที)</option>
                </select>
              </div>

              {/* Position Status */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  สถานะการถือครอง
                </label>
                <select
                  value={positionStatus}
                  onChange={(e) => setPositionStatus(e.target.value as FocusPositionStatus)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="WATCHING">กำลังเฝ้าดู (Watching)</option>
                  <option value="PLANNING TO BUY">วางแผนจะซื้อ (Planning to Buy)</option>
                  <option value="HOLDING">ถือครองอยู่ (Holding)</option>
                  <option value="TAKING PROFIT">กำลังล็อกกำไร (Taking Profit)</option>
                  <option value="EXITING">กำลังถอยออก (Exiting)</option>
                </select>
              </div>
            </div>

            {/* User Note */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                บันทึกแผนหรือเหตุผลเฝ้าระวัง (Optional Note)
              </label>
              <input
                type="text"
                placeholder="เช่น: รอทดสอบแนวรับ, กำลังทำ Higher Low, พอร์ตถือสถานะอยู่..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '7px 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {selectedSymbol ? `เลือก: ${selectedSymbol}` : 'กรุณาเลือกเหรียญ'}
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSymbol || isSubmitting}
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                background: selectedSymbol
                  ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: selectedSymbol && !isSubmitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: selectedSymbol ? '0 0 14px rgba(139, 92, 246, 0.4)' : 'none',
              }}
            >
              <Target size={14} />
              {isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มเข้าสู่ FOCUS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
