import React, { useState } from 'react';
import { CryptoNewsItem } from '../types/index.js';
import { ChevronRight, Newspaper, ExternalLink, X, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react';

interface CryptoNewsCardProps {
  news: CryptoNewsItem[];
  onSelectCoin?: (symbol: string) => void;
  onViewAll?: () => void;
}

export const CryptoNewsCard: React.FC<CryptoNewsCardProps> = ({ news, onSelectCoin, onViewAll }) => {
  const [selectedNews, setSelectedNews] = useState<CryptoNewsItem | null>(null);

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { label: '🟢 ข่าวบวก', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'negative':
        return { label: '🔴 ระวังเทขาย', bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: '⚪ ข่าวทั่วไป', bg: 'rgba(255, 255, 255, 0.08)', text: '#CBD5E1', border: 'rgba(255, 255, 255, 0.15)' };
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'High':
        return { label: '🔥 ผลกระทบสูง', color: '#F59E0B' };
      case 'Medium':
        return { label: '⚡ ปานกลาง', color: '#38BDF8' };
      default:
        return { label: '💧 ทั่วไป', color: '#94A3B8' };
    }
  };

  return (
    <>
      <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="card-header-row" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Newspaper size={16} color="var(--neon-amber)" />
              <div className="card-title" style={{ fontSize: '13.5px' }}>
                ข่าวคริปโต & ข่าวกรองตลาด
              </div>
            </div>

            <div
              className="card-action-link"
              onClick={onViewAll}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--neon-amber)' }}
              title="เปิดดูข่าวสารและการวิเคราะห์ทั้งหมด"
            >
              <span>ดูทั้งหมด ({news.length})</span>
              <ChevronRight size={14} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {news.slice(0, 4).map((item) => {
              const sent = getSentimentBadge(item.sentiment);
              const imp = getImpactBadge(item.impact);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover-card-row"
                  title="คลิกเพื่ออ่านบทวิเคราะห์ผลกระทบต่อตลาดโดย AI"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title}
                      </div>

                      <div
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{item.timeAgo}</span>
                        <span>•</span>
                        <span style={{ color: '#CBD5E1' }}>{item.source}</span>
                        <span>•</span>
                        <span style={{ color: imp.color, fontWeight: 700 }}>{imp.label}</span>

                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: sent.bg,
                            color: sent.text,
                            border: `1px solid ${sent.border}`,
                            marginLeft: 'auto',
                          }}
                        >
                          {sent.label}
                        </span>
                      </div>

                      {/* Related Coins Tagged */}
                      {item.relatedCoins && item.relatedCoins.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          {item.relatedCoins.map((sym) => (
                            <span
                              key={sym}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCoin?.(sym);
                              }}
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(59, 130, 246, 0.18)',
                                color: '#60A5FA',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                cursor: 'pointer',
                              }}
                              title={`คลิกเพื่อเปิดดูกราฟ ${sym}`}
                            >
                              ${sym}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>คลิกที่ข่าวเพื่อดูการประเมินผลกระทบ AI</span>
          <span style={{ color: '#F59E0B' }}>คัดกรองเฉพาะข่าวสำคัญ</span>
        </div>
      </div>

      {/* ================================================== */}
      {/* NEWS DETAIL & AI MARKET IMPACT MODAL */}
      {/* ================================================== */}
      {selectedNews && (
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
          onClick={() => setSelectedNews(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
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
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Newspaper size={20} color="#F59E0B" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                  บทวิเคราะห์ข่าวกรองตลาด (AI Intelligence)
                </span>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                  {selectedNews.title}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                  <span>สำนักข่าว: <strong style={{ color: '#CBD5E1' }}>{selectedNews.source}</strong></span>
                  <span>•</span>
                  <span>{selectedNews.timeAgo}</span>
                </div>
              </div>

              {/* AI Impact Box */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} /> ผลกระทบต่อตลาดโดยรวม (AI Market Assessment):
                </div>
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {selectedNews.sentiment === 'positive'
                    ? 'ข่าวนี้สร้าง Sentiment เชิงบวกอย่างมีนัยสำคัญ ส่งผลให้เม็ดเงินสถาบันและนักลงทุนรายย่อยมีความเชื่อมั่นในการเข้าสะสมสินทรัพย์ที่เกี่ยวข้องเพิ่มขึ้น'
                    : selectedNews.sentiment === 'negative'
                    ? 'ข่าวนี้อาจกระตุ้นความกังวลหรือแรงเทขายในระยะสั้น แนะนำให้นักลงทุนตั้ง Stop Loss อย่างรัดกุมและหลีกเลี่ยงการไล่ราคา'
                    : 'ข่าวสารทั่วไปเกี่ยวกับพัฒนาการของระบบนิเวศ ไม่มีสัญญาณเสี่ยงร้ายแรงต่อสภาพคล่องโดยรวม'}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px' }}>
                  <div>ระดับผลกระทบ: <strong style={{ color: getImpactBadge(selectedNews.impact).color }}>{getImpactBadge(selectedNews.impact).label}</strong></div>
                  <div>ทิศทาง Sentiment: <strong style={{ color: getSentimentBadge(selectedNews.sentiment).text }}>{getSentimentBadge(selectedNews.sentiment).label}</strong></div>
                </div>
              </div>

              {/* Related Coins */}
              {selectedNews.relatedCoins && selectedNews.relatedCoins.length > 0 && (
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    เหรียญที่เกี่ยวข้องโดยตรง:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedNews.relatedCoins.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          onSelectCoin?.(sym);
                          setSelectedNews(null);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid #3B82F6',
                          color: '#60A5FA',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        title={`เปิดกราฟ ${sym}`}
                      >
                        <BarChart2 size={13} /> ${sym} เปิดดูกราฟ
                      </button>
                    ))}
                  </div>
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
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI News Scraper Feed</span>
              <button
                onClick={() => setSelectedNews(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
