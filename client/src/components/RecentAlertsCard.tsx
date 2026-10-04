import React, { useState } from 'react';
import { AlertItem } from '../types/index.js';
import { Bell, ChevronRight, BarChart2, Radio } from 'lucide-react';

interface RecentAlertsCardProps {
  alerts: AlertItem[];
  onSelectCoin?: (symbol: string) => void;
  onViewAll?: () => void;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({ alerts, onSelectCoin, onViewAll }) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WHALE' | 'SIGNAL'>('ALL');

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical':
        return '#EF4444';
      case 'important':
        return '#F59E0B';
      case 'watch':
        return '#3B82F6';
      default:
        return '#10B981';
    }
  };

  const filteredAlerts = alerts.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return item.severity === 'critical' || item.severity === 'important';
    if (filter === 'WHALE') return item.descriptionTh.includes('วาฬ') || item.descriptionTh.includes('Whale') || item.descriptionTh.includes('โอน');
    if (filter === 'SIGNAL') return item.descriptionTh.includes('ซื้อ') || item.descriptionTh.includes('Breakout') || item.descriptionTh.includes('RSI');
    return true;
  });

  return (
    <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header Row */}
        <div className="card-header-row" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={16} color="var(--neon-amber)" />
            <div className="card-title" style={{ fontSize: '13.5px' }}>
              การแจ้งเตือนล่าสุด
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              <Radio size={9} className="live-green-pulse" /> LIVE
            </span>
          </div>

          <div
            className="card-action-link"
            onClick={onViewAll}
            style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11.5px' }}
            title="เปิดหน้าศูนย์แจ้งเตือนสัญญาณทั้งหมด"
          >
            <span>ดูทั้งหมด ({alerts.length})</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'ALL', label: `ทั้งหมด` },
            { id: 'CRITICAL', label: `🚨 ด่วน` },
            { id: 'WHALE', label: `🐋 วาฬ` },
            { id: 'SIGNAL', label: `📈 สัญญาณ` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '2px 7px',
                borderRadius: '5px',
                border: 'none',
                fontSize: '10.5px',
                fontWeight: filter === tab.id ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: filter === tab.id ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: filter === tab.id ? '#FBBF24' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredAlerts.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCoin?.(item.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="hover-card-row"
              title={`คลิกเพื่อเปิดดูกราฟเหรียญ ${item.symbol}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: getSeverityColor(item.severity),
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${getSeverityColor(item.severity)}`,
                  }}
                />
                <span style={{ fontWeight: 800, color: 'var(--neon-cyan)', flexShrink: 0 }}>{item.symbol}</span>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '175px',
                    fontSize: '11px',
                  }}
                >
                  {item.descriptionTh.replace(item.symbol, '').trim()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {item.time}
                </span>
                <span
                  style={{
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <BarChart2 size={10} /> ดูกราฟ
                </span>
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '11.5px' }}>
              ไม่พบการแจ้งเตือนในหมวดหมู่นี้
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
        <span>คลิกที่รายการเพื่อเปิดดูกราฟทันที</span>
        <span style={{ color: '#10B981' }}>เชื่อมต่อฐานข้อมูล Alerts</span>
      </div>
    </div>
  );
};
