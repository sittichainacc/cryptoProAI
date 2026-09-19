import React from 'react';
import { CryptoNewsItem } from '../types/index.js';
import { ChevronRight, Newspaper } from 'lucide-react';

interface CryptoNewsCardProps {
  news: CryptoNewsItem[];
  onViewAll?: () => void;
}

export const CryptoNewsCard: React.FC<CryptoNewsCardProps> = ({ news, onViewAll }) => {
  return (
    <div className="crypto-card">
      <div className="card-header-row">
        <div className="card-title" style={{ fontSize: '13.5px' }}>
          <span>ข่าวคริปโต (คัดเฉพาะสำคัญ)</span>
        </div>
        <div className="card-action-link" onClick={onViewAll}>
          <span>ดูทั้งหมด</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {news.slice(0, 4).map((item) => (
          <div
            key={item.id}
            style={{
              padding: '6px 4px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--neon-amber)',
                  marginTop: '5px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    marginTop: '3px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span>{item.timeAgo}</span>
                  <span>•</span>
                  <span>{item.source}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
