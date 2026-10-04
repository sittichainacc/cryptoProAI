import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { CryptoNewsItem } from '../types/index.js';
import { Newspaper, Search, RefreshCw } from 'lucide-react';

interface NewsPageProps {
  onSelectCoin?: (symbol: string) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({ onSelectCoin }) => {
  const [news, setNews] = useState<CryptoNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<'ALL' | 'positive' | 'negative' | 'neutral'>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<'ALL' | 'High' | 'Medium'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNews();
      setNews(data || []);
    } catch (err) {
      console.error('Failed to load crypto news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredNews = news.filter((item) => {
    if (selectedSentiment !== 'ALL' && item.sentiment !== selectedSentiment) return false;
    if (selectedImpact !== 'ALL' && item.impact !== selectedImpact) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCoin = Array.isArray(item.relatedCoins) && item.relatedCoins.some((c) => c.toLowerCase().includes(q));
      const matchSource = item.source.toLowerCase().includes(q);
      if (!matchTitle && !matchCoin && !matchSource) return false;
    }
    return true;
  });

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--neon-green-light)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            เชิงบวก (Bullish)
          </span>
        );
      case 'negative':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--neon-red)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            เชิงลบ (Bearish)
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            เป็นกลาง (Neutral)
          </span>
        );
    }
  };

  const getImpactBadge = (impact: string) => {
    if (impact === 'High') {
      return (
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: 'var(--neon-amber)',
          }}
        >
          High Impact
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '10.5px',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: '4px',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#60A5FA',
        }}
      >
        Medium Impact
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Newspaper size={22} color="var(--neon-cyan)" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              ศูนย์ข้อมูลข่าวสาร &amp; ความเชื่อมั่นตลาด (Crypto News &amp; Sentiment)
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            คัดกรองเฉพาะข่าวสำคัญที่มีผลต่อราคาและการวิเคราะห์โครงสร้างตลาด พร้อมการประเมิน Sentiment รายเหรียญ
          </p>
        </div>

        <button
          onClick={loadNews}
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          <span>{isLoading ? 'กำลังโหลด...' : 'รีเฟรชข่าวสาร'}</span>
        </button>
      </div>

      {/* Controls & Filters */}
      <div
        className="crypto-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Sentiment Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>อารมณ์ข่าว:</span>
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'positive', label: '🟢 ข่าวบวก' },
            { id: 'negative', label: '🔴 ข่าวลบ' },
            { id: 'neutral', label: '⚪ เป็นกลาง' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSentiment(tab.id as any)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: selectedSentiment === tab.id ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                backgroundColor: selectedSentiment === tab.id ? 'var(--neon-blue)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedSentiment === tab.id ? '#FFF' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px 12px',
            minWidth: '240px',
          }}
        >
          <Search size={14} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="ค้นหาหัวข้อข่าว หรือเหรียญ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFF',
              fontSize: '12.5px',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* News Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNews.length === 0 ? (
          <div className="crypto-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            ไม่พบข่าวสารตามเงื่อนไขที่เลือก
          </div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className="crypto-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {/* Meta Row: Source, Time, Impact, Sentiment */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                    {item.source}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.timeAgo}</span>
                  {getImpactBadge(item.impact)}
                  {getSentimentBadge(item.sentiment)}
                </div>

                {/* News Headline */}
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.45 }}>
                  {item.title}
                </div>

                {/* Related Coins */}
                {item.relatedCoins && item.relatedCoins.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เหรียญที่เกี่ยวข้อง:</span>
                    {item.relatedCoins.map((coin) => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => onSelectCoin && onSelectCoin(coin)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#60A5FA',
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.25)';
                          e.currentTarget.style.borderColor = '#60A5FA';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.25)';
                        }}
                        title={`คลิกเพื่อเปิดกราฟและวิเคราะห์ ${coin} ทันที`}
                      >
                        <span>{coin}</span>
                        <span style={{ fontSize: '9px', opacity: 0.8 }}>↗ ดูกราฟ</span>
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
