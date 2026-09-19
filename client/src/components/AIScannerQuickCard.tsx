import React, { useState } from 'react';
import { Sparkles, Filter, RotateCcw, Zap } from 'lucide-react';

interface AIScannerQuickCardProps {
  onRunScanner: (mode: string) => void;
}

export const AIScannerQuickCard: React.FC<AIScannerQuickCardProps> = ({ onRunScanner }) => {
  const [selectedChip, setSelectedChip] = useState('breakout');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedMinChange, setSelectedMinChange] = useState('+5%');
  const [selectedMinVol, setSelectedMinVol] = useState('$10M');

  const chips = [
    { id: 'breakout', label: 'Breakout', icon: Zap },
    { id: 'momentum', label: 'Momentum', icon: Sparkles },
    { id: 'volume_spike', label: 'Volume Spike', icon: Zap },
    { id: 'oversold', label: 'Oversold', icon: Sparkles },
    { id: 'trend_following', label: 'Trend Following', icon: Zap },
    { id: 'ai_score_high', label: 'AI Score สูง', icon: Sparkles },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
      {/* Left: AI Scanner Quick Bar */}
      <div className="crypto-card">
        <div className="card-title" style={{ fontSize: '13.5px', marginBottom: '2px' }}>
          สแกนเหรียญอัตโนมัติ (AI Scanner)
        </div>
        <div className="card-subtitle" style={{ marginBottom: '12px' }}>
          คัดเลือกเหรียญตามเงื่อนไขที่ดีที่สุด
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
                  padding: '7px 6px',
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

        <button
          onClick={() => onRunScanner(selectedChip)}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Sparkles size={15} />
          <span>เริ่มสแกนเลย</span>
        </button>
      </div>

      {/* Right: Filter Card */}
      <div className="crypto-card">
        <div className="card-title" style={{ fontSize: '13.5px', marginBottom: '10px' }}>
          ตัวคัดกรอง (Filter)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              กลุ่มเหรียญ
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
                fontSize: '11.5px',
                outline: 'none',
              }}
            >
              <option value="all">ทั้งหมด</option>
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
              24h %
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
                fontSize: '11.5px',
                outline: 'none',
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="+5%">มากกว่า +5%</option>
              <option value="+10%">มากกว่า +10%</option>
              <option value="+20%">มากกว่า +20%</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ปริมาณซื้อขาย
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
                fontSize: '11.5px',
                outline: 'none',
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="$10M">มากกว่า $10M</option>
              <option value="$50M">มากกว่า $50M</option>
              <option value="$100M">มากกว่า $100M</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ความเสี่ยง
            </label>
            <select
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11.5px',
                outline: 'none',
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="low">ความเสี่ยงต่ำ-กลาง</option>
              <option value="high">ความเสี่ยงสูง</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onRunScanner(selectedChip)}
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
            <span>ค้นหาเหรียญ</span>
          </button>
          <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }}>
            <RotateCcw size={13} />
            <span>รีเซ็ต</span>
          </button>
        </div>
      </div>
    </div>
  );
};
