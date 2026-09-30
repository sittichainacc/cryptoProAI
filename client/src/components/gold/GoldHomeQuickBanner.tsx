import React, { useEffect, useState } from 'react';
import { Gem, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import type { GoldPriceData } from '../../types/gold.js';

interface GoldHomeQuickBannerProps {
  onOpenGold: () => void;
}

export const GoldHomeQuickBanner: React.FC<GoldHomeQuickBannerProps> = ({ onOpenGold }) => {
  const [price, setPrice] = useState<GoldPriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/gold/price')
      .then((res) => res.json())
      .then((json) => {
        if (alive && json.success && json.data) {
          setPrice(json.data);
        }
      })
      .catch((err) => {
        console.warn('[GoldHomeQuickBanner] load price error:', err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const usd = (n: number | null | undefined) =>
    n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const thb = (n: number | null | undefined) =>
    n == null ? '—' : `฿${Math.round(n).toLocaleString('th-TH')}`;

  const signed = (n: number | null | undefined, suffix = '%') =>
    n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}${suffix}`;

  const xauChange = price?.xauUsdChange24hPct ?? 0;
  const isXauUp = xauChange >= 0;

  return (
    <div
      onClick={onOpenGold}
      className="gold-home-quick-banner"
      style={{
        marginBottom: '18px',
        padding: '14px 18px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(17, 24, 39, 0.95) 45%, rgba(217, 119, 6, 0.16) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.75)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
      }}
    >
      {/* Golden Top Shimmer accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #F59E0B, #FDE047, #10B981, transparent)',
        }}
      />

      {/* Left: Branding & Core Intelligence Pillars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)',
            flexShrink: 0,
          }}
        >
          <Gem size={22} color="#FFFFFF" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#FDE047', letterSpacing: '-0.3px' }}>
              🥇 สัญญาณทองคำอัจฉริยะ (Gold Intelligence & Precision Signal)
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={11} />
              เปิดให้ทุกคนเข้าถึงฟรี
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#FDE047',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  width: '5.5px',
                  height: '5.5px',
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B',
                  boxShadow: '0 0 6px #F59E0B',
                }}
              />
              LIVE COCKPIT
            </span>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--text-muted, #94A3B8)',
              marginTop: '4px',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <span>AI Multi-Factor Gold Decision Engine:</span>
            <span style={{ color: '#FDE047', fontWeight: 600 }}>XAU/USD Spot</span>
            <span>•</span>
            <span style={{ color: '#FDE047', fontWeight: 600 }}>ทองคำแท่งไทย 96.5%</span>
            <span>•</span>
            <span style={{ color: '#FDE047', fontWeight: 600 }}>COMEX GC Futures</span>
            <span style={{ opacity: 0.7 }}>(วิเคราะห์ Real Yield, Fed, DXY และจังหวะเข้า–ออก)</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Price Highlights & CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {price && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Spot Gold Price */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #94A3B8)', fontWeight: 600 }}>
                XAU/USD Spot
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                  {usd(price.xauUsd)}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isXauUp ? '#34D399' : '#F87171',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {isXauUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {signed(xauChange)}
                </span>
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Thai Gold Price */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #94A3B8)', fontWeight: 600 }}>
                ทองคำแท่ง 96.5% (ขายออก)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FDE047' }}>
                  {thb(price.thaiGoldBarSell)}
                </span>
                {price.thaiGoldChange != null && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: price.thaiGoldChange >= 0 ? '#34D399' : '#F87171',
                    }}
                  >
                    ({price.thaiGoldChange >= 0 ? '+' : ''}{price.thaiGoldChange}฿)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenGold();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            border: 'none',
            color: '#000000',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            transition: 'all 0.16s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(245, 158, 11, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
          }}
        >
          <span>ดูสัญญาณทองคำสด</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
