import React from 'react';
import { Globe, ArrowRight, Cpu, ShieldCheck } from 'lucide-react';

interface Props {
  onOpenStocks: () => void;
}

export const GlobalStocksQuickBanner: React.FC<Props> = ({ onOpenStocks }) => {
  return (
    <div
      onClick={onOpenStocks}
      style={{
        background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 12,
        padding: '12px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Globe size={18} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#ffffff' }}>
              ระบบวิเคราะห์หุ้นต่างประเทศ Multi-Agent AI (S&P 500 / Nasdaq 100)
            </span>
            <span
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Cpu size={12} /> 41 AGENTS
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            วิเคราะห์เชิงลึก 4 ทีม (Ranking, Research, Red Team Veto, Tactical Allocation) พร้อม Hard Risk Engine ควบคุมความเสี่ยง
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontSize: 13, fontWeight: 600 }}>
        <span>เปิดหน้าระบบหุ้น</span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
};
