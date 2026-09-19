import React from 'react';
import { AlertItem } from '../types/index.js';
import { Bell, ChevronRight } from 'lucide-react';

interface RecentAlertsCardProps {
  alerts: AlertItem[];
  onViewAll?: () => void;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({ alerts, onViewAll }) => {
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

  return (
    <div className="crypto-card">
      <div className="card-header-row">
        <div className="card-title" style={{ fontSize: '13.5px' }}>
          <span>การแจ้งเตือนล่าสุด</span>
        </div>
        <div className="card-action-link" onClick={onViewAll}>
          <span>ดูทั้งหมด</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alerts.slice(0, 5).map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              padding: '6px 4px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getSeverityColor(item.severity),
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 700, color: 'var(--neon-cyan)' }}>{item.symbol}</span>
              <span
                style={{
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '190px',
                }}
              >
                {item.descriptionTh.replace(item.symbol, '').trim()}
              </span>
            </div>

            <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginLeft: '6px', flexShrink: 0 }}>
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
