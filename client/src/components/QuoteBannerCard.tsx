import React from 'react';

export const QuoteBannerCard: React.FC = () => {
  return (
    <div
      className="crypto-card"
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(239, 68, 68, 0.08), var(--bg-card))',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#F59E0B', marginBottom: '4px' }}>
          Better Analysis
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          A Brighter Tomorrow
        </div>
      </div>

      <div
        style={{
          fontSize: '12.5px',
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginTop: '10px',
        }}
      >
        “วิเคราะห์ให้แม่นยำ ลงทุนอย่างมีวินัย สู่อนาคตที่ดีกว่า”
      </div>

      <div
        style={{
          position: 'absolute',
          right: '-15px',
          bottom: '-20px',
          opacity: 0.15,
          fontSize: '70px',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        ☀️
      </div>
    </div>
  );
};
