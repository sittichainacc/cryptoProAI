import React, { useState } from 'react';
import { 
  Target, ShieldAlert, Award, ArrowUpRight, TrendingUp, 
  CheckCircle2, AlertTriangle, Calculator, Sparkles, Copy, Check, Info, ShieldCheck, Zap, Crown, Clock 
} from 'lucide-react';
import type { GoldSignalResponse } from '../../types/gold.js';

interface PrecisionTradePlanCardsProps {
  data: GoldSignalResponse;
  mode: string;
  onOpenCalculator?: () => void;
}

export const PrecisionTradePlanCards: React.FC<PrecisionTradePlanCardsProps> = ({
  data,
  mode,
  onOpenCalculator,
}) => {
  const isThai = mode === 'THAI_GOLD_BAR';
  const price = data.price;
  const entry = data.tradePlan.entry;
  const thaiEntry = data.tradePlan.thaiGoldEntry;
  const signal = data.tradePlan.signal;
  const conviction = data.conviction;

  // ⚠️ กลยุทธ์สัญญาณทองคำเป็น LONG ONLY (ขาขึ้นเท่านั้น ไม่เทรดขาลง)
  const isShort = false;

  const [copied, setCopied] = useState(false);

  const usd = (n: number | null | undefined, d = 2) =>
    n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

  const thb = (n: number | null | undefined) =>
    n == null ? '—' : `฿${Math.round(n).toLocaleString('th-TH')}`;

  const signed = (n: number | null | undefined, suffix = '%', d = 2) =>
    n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}${suffix}`;

  // Current market price
  const currentPrice = isThai 
    ? (price.thaiGoldBarSell ?? 66000) 
    : (mode === 'COMEX_FUTURES' ? (price.comexPrice ?? price.xauUsd ?? 2650) : (price.xauUsd ?? 2650));

  // 1. Dynamic Entry Calculations (Realistic fallbacks derived from live market price)
  let entryLow: number;
  let entryHigh: number;
  let bestEntry: number;
  let chaseLimit: number;

  if (isThai) {
    const base = price.thaiGoldBarSell ?? 66000;
    entryLow = thaiEntry?.buyZoneLow ?? (base - 200);
    entryHigh = thaiEntry?.buyZoneHigh ?? (base + 50);
    bestEntry = thaiEntry?.bestBuy ?? base;
    chaseLimit = thaiEntry?.chaseAbove ?? (base + 250);
  } else {
    const base = currentPrice;
    entryLow = entry?.entryLow ?? Number((base * 0.996).toFixed(2));
    entryHigh = entry?.entryHigh ?? Number((base * 1.002).toFixed(2));
    bestEntry = entry?.bestEntry ?? Number((base * 0.998).toFixed(2));
    chaseLimit = entry?.chaseLevel ?? Number((base * 1.006).toFixed(2)); // ห้ามไล่ซื้อสูงกว่านี้
  }

  // 2. Dynamic Stop Loss Calculations (Always below entry for LONG)
  let stopLoss: number;
  if (isThai) {
    stopLoss = thaiEntry?.invalidation ?? (price.thaiGoldBarSell ? price.thaiGoldBarSell - 600 : 65400);
  } else {
    stopLoss = entry?.stopLoss ?? Number((bestEntry * 0.988).toFixed(2));
  }

  const stopDist = Math.abs(bestEntry - stopLoss);
  const stopPct = ((stopDist / (bestEntry || 1)) * 100);

  // 3. Dynamic Take Profit Calculations (Always above entry for LONG)
  let tp1: number;
  let tp2: number;
  let tp3: number;
  if (isThai) {
    const base = price.thaiGoldBarSell ?? 66000;
    tp1 = thaiEntry?.tp1 ?? (base + 600);
    tp2 = thaiEntry?.tp2 ?? (base + 1200);
    tp3 = thaiEntry?.tp3 ?? (base + 2000);
  } else {
    tp1 = entry?.tp1 ?? Number((bestEntry * 1.015).toFixed(2));
    tp2 = entry?.tp2 ?? Number((bestEntry * 1.030).toFixed(2));
    tp3 = entry?.tp3 ?? Number((bestEntry * 1.050).toFixed(2));
  }

  const rrRatio = entry?.riskReward ?? 2.5;

  // Real-Time Price Proximity Evaluation
  const minZone = Math.min(entryLow, entryHigh);
  const maxZone = Math.max(entryLow, entryHigh);
  const isPriceInZone = currentPrice >= minZone && currentPrice <= maxZone;
  const isStoppedOut = currentPrice < stopLoss;
  const isExtended = currentPrice > chaseLimit;

  // Best Gold vs Ready Green Detection
  const isBestGold = Boolean(
    (signal.isBestGold || (signal.state === 'LONG_READY' && conviction.totalScore >= 70 && conviction.isAllGatesPass && isPriceInZone)) &&
    !isStoppedOut &&
    !isExtended
  );

  const isReadyGreen = Boolean(
    !isBestGold &&
    (signal.state === 'LONG_READY' || isPriceInZone || (conviction.totalScore >= 60 && conviction.isAllGatesPass)) &&
    !isStoppedOut &&
    !isExtended
  );

  const getPriceZoneStatus = () => {
    if (currentPrice < stopLoss) {
      return {
        status: 'STOPPED_OUT',
        label: '⛔ ราคาหลุด Stop Loss — แผนเสีย ยกเลิกการเข้าออเดอร์',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.18)',
        border: 'rgba(239, 68, 68, 0.45)',
        icon: ShieldAlert,
        tier: 'RED',
      };
    }
    if (currentPrice > chaseLimit) {
      return {
        status: 'EXTENDED',
        label: '⚠️ ราคาปรับขึ้นเกินโซนปลอดภัย — ห้ามไล่ราคาเด็ดขาด (Chase Risk)',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.18)',
        border: 'rgba(245, 158, 11, 0.45)',
        icon: AlertTriangle,
        tier: 'AMBER',
      };
    }
    if (currentPrice >= minZone && currentPrice <= maxZone) {
      if (isBestGold) {
        return {
          status: 'IN_ZONE_BEST',
          label: '👑 ราคาอยู่ในโซนจุดเข้าที่ดีที่สุด! สัญญาณความได้เปรียบสูงสุด (Supreme Entry)',
          color: '#FDE047',
          bg: 'rgba(245, 158, 11, 0.28)',
          border: 'rgba(245, 158, 11, 0.75)',
          icon: Sparkles,
          pulse: true,
          tier: 'GOLD',
        };
      }
      return {
        status: 'IN_ZONE',
        label: '🟢 ราคาอยู่ในโซนเข้าซื้อแล้ว! สัญญาณเข้าพร้อม เหมาะแก่การสะสมไม้แรก',
        color: '#34D399',
        bg: 'rgba(16, 185, 129, 0.22)',
        border: 'rgba(16, 185, 129, 0.65)',
        icon: CheckCircle2,
        pulse: true,
        tier: 'GREEN',
      };
    }
    return {
      status: 'WAITING',
      label: `⏳ ราคายังไม่ถึงโซน — รอจังหวะย่อตัวเข้าสู่โซน ${isThai ? thb(entryLow) : usd(entryLow, 0)} – ${isThai ? thb(entryHigh) : usd(entryHigh, 0)}`,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(245, 158, 11, 0.35)',
      icon: Clock,
      tier: 'AMBER',
    };
  };

  const zoneStatus = getPriceZoneStatus();
  const StatusIcon = zoneStatus.icon;

  // Copy Trade Plan to Clipboard
  const handleCopyPlan = () => {
    const symbolStr = isThai ? '🇹🇭 ทองคำแท่งไทย 96.5%' : (mode === 'COMEX_FUTURES' ? '⚡ COMEX Gold Futures (GC)' : '🌐 XAU/USD Spot');
    const sideStr = isThai ? 'ซื้อสะสม (BUY)' : 'เปิดสถานะซื้อ / ขาขึ้น (LONG ONLY)';
    const entryStr = isThai ? `${thb(entryLow)} – ${thb(entryHigh)} (จุดดีที่สุด: ${thb(bestEntry)})` : `${usd(entryLow)} – ${usd(entryHigh)} (Best: ${usd(bestEntry)})`;
    const slStr = isThai ? `${thb(stopLoss)} (-${thb(stopDist)} / ${stopPct.toFixed(2)}%)` : `${usd(stopLoss)} (-${usd(stopDist)} / ${stopPct.toFixed(2)}%)`;
    const tpStr = isThai ? `TP1: ${thb(tp1)} | TP2: ${thb(tp2)} | TP3: ${thb(tp3)}` : `TP1: ${usd(tp1)} | TP2: ${usd(tp2)} | TP3: ${usd(tp3)}`;

    const textToCopy = `🥇 แผนเทรดทองคำ CryptoPro AI (Long Only)
─────────────────────
สินทรัพย์: ${symbolStr}
ทิศทาง: ${sideStr}
โซนเข้า: ${entryStr}
ห้ามไล่ราคาเกิน: ${isThai ? thb(chaseLimit) : usd(chaseLimit)}
จุดตัดขาดทุน (SL): ${slStr}
เป้าทำกำไร (TP): ${tpStr}
อัตราทด R:R: 1:${rrRatio}
─────────────────────
*คำนวณตาม Fibonacci Golden Zone & สถิติความเสี่ยงสถาบัน*`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  };

  // Card 1 Dynamic Style based on Status (Gold Flashing -> Green Ready -> Amber Waiting -> Red Stop)
  const getCard1Style = () => {
    if (isBestGold) {
      return {
        border: '2px solid #F59E0B',
        animation: 'goldFlashBlink 1.6s infinite ease-in-out',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, var(--bg-card, #111827) 45%, rgba(253, 224, 71, 0.16) 100%)',
        boxShadow: '0 0 35px rgba(245, 158, 11, 0.45)',
        topRail: 'linear-gradient(90deg, #F59E0B, #FDE047, #FFFFFF, #FDE047, #F59E0B)',
        badgeText: '👑 1. จุดเข้าที่ดีที่สุด (SUPREME GOLD ENTRY)',
        badgeStyle: {
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: '#FFFFFF',
          border: '1px solid rgba(253, 224, 71, 0.8)',
          boxShadow: '0 0 16px rgba(245, 158, 11, 0.7)',
        },
        tagText: '⭐ BEST GOLDEN SETUP',
        tagStyle: {
          backgroundColor: 'rgba(245, 158, 11, 0.25)',
          color: '#FDE047',
          border: '1px solid rgba(245, 158, 11, 0.55)',
        },
      };
    }
    if (isReadyGreen) {
      return {
        border: '2px solid rgba(16, 185, 129, 0.8)',
        animation: 'greenReadyPulse 2s infinite ease-in-out',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, var(--bg-card, #111827) 45%, rgba(6, 182, 212, 0.1) 100%)',
        boxShadow: '0 0 28px rgba(16, 185, 129, 0.35)',
        topRail: 'linear-gradient(90deg, #10B981, #34D399, #06B6D4)',
        badgeText: '🟢 1. จุดเข้าซื้อพร้อม (READY TO BUY)',
        badgeStyle: {
          backgroundColor: 'rgba(16, 185, 129, 0.22)',
          color: '#34D399',
          border: '1px solid rgba(16, 185, 129, 0.6)',
        },
        tagText: 'OPTIMAL BUY ZONE',
        tagStyle: {
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.4)',
        },
      };
    }
    if (isStoppedOut) {
      return {
        border: '2px solid rgba(239, 68, 68, 0.55)',
        animation: 'none',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, var(--bg-card, #111827) 45%, rgba(0, 0, 0, 0.3) 100%)',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
        topRail: 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)',
        badgeText: '⛔ 1. หลุด Stop Loss ยกเลิกแผน (INVALIDATED)',
        badgeStyle: {
          backgroundColor: 'rgba(239, 68, 68, 0.22)',
          color: '#F87171',
          border: '1px solid rgba(239, 68, 68, 0.5)',
        },
        tagText: 'PLAN INVALIDATED',
        tagStyle: {
          backgroundColor: 'rgba(239, 68, 68, 0.18)',
          color: '#F87171',
          border: '1px solid rgba(239, 68, 68, 0.4)',
        },
      };
    }
    return {
      border: '2px solid rgba(245, 158, 11, 0.45)',
      animation: 'none',
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-card, #111827) 45%, rgba(255, 255, 255, 0.02) 100%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      topRail: 'linear-gradient(90deg, #F59E0B, #EAB308, #F59E0B)',
      badgeText: '⏳ 1. จุดเข้าซื้อสะสม (WAIT FOR DIP)',
      badgeStyle: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        color: '#FDE047',
        border: '1px solid rgba(245, 158, 11, 0.5)',
      },
      tagText: 'WAIT FOR PULLBACK',
      tagStyle: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        color: '#FDE047',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      },
    };
  };

  const card1Theme = getCard1Style();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title Bar with Calculator & Copy Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isBestGold 
                ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
                : 'linear-gradient(135deg, #10B981, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isBestGold ? '0 0 16px rgba(245, 158, 11, 0.6)' : '0 0 14px rgba(16, 185, 129, 0.4)',
            }}
          >
            {isBestGold ? <Crown size={19} color="#FFFFFF" /> : <Target size={18} color="#FFFFFF" />}
          </div>
          <div>
            <div style={{ fontSize: '16.5px', fontWeight: 900, color: 'var(--text-primary, #FFFFFF)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>3 จุดตัดสินใจสำคัญ: จุดเข้า • จุดตัดขาดทุน • จุดทำกำไร</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TrendingUp size={12} />
                {isThai ? 'ฝั่งซื้อทองคำแท่ง' : 'ฝั่งซื้อ / ขาขึ้นเท่านั้น (LONG ONLY)'}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94A3B8)' }}>
              คำนวณตามโครงสร้างราคาแนวรับ–แนวต้าน Fibonacci Golden Ratio และความคุ้มค่า Risk:Reward ระดับสถาบัน
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Copy Trade Plan Button */}
          <button
            onClick={handleCopyPlan}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card-inner, rgba(255, 255, 255, 0.06))',
              border: copied ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              color: copied ? '#34D399' : 'var(--text-primary, #FFFFFF)',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.18s ease',
            }}
            title="คัดลอกแผนเทรดไปยังคลิปบอร์ด"
          >
            {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
            <span>{copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกแผนเทรด'}</span>
          </button>

          {/* Calculator Button */}
          {onOpenCalculator && (
            <button
              onClick={onOpenCalculator}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: '#FDE047',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
              }}
            >
              <Calculator size={14} color="#FDE047" />
              <span>คำนวณขนาดไม้ & ความเสี่ยง</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 High-Impact Precision Decision Cards (Long Only) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: '16px',
        }}
      >
        {/* ═══ CARD 1: 👑/🟢 จุดเข้าที่ได้เปรียบ (Optimal Buy Zone - Gold/Green Tiered) ═══ */}
        <div
          style={{
            border: card1Theme.border,
            animation: card1Theme.animation,
            background: card1Theme.background,
            boxShadow: card1Theme.boxShadow,
            borderRadius: '18px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Top Neon Accent Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3.5px',
              background: card1Theme.topRail,
            }}
          />

          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                  ...card1Theme.badgeStyle,
                }}
              >
                {isBestGold ? <Crown size={13} /> : <Target size={13} />}
                <span>{card1Theme.badgeText}</span>
              </span>

              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  ...card1Theme.tagStyle,
                }}
              >
                {card1Theme.tagText}
              </span>
            </div>

            {/* Primary Entry Zone Price */}
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94A3B8)', fontWeight: 600 }}>
              กรอบราคาเข้าซื้อที่แนะนำ:
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 900,
                color: isBestGold ? '#FDE047' : '#34D399',
                letterSpacing: '-0.5px',
                marginTop: '4px',
                textShadow: isBestGold ? '0 0 20px rgba(245, 158, 11, 0.6)' : '0 0 16px rgba(16, 185, 129, 0.4)',
              }}
            >
              {isThai ? `${thb(entryLow)} – ${thb(entryHigh)}` : `${usd(entryLow)} – ${usd(entryHigh)}`}
            </div>

            {/* Real-time Zone Status Alert Banner */}
            <div
              style={{
                marginTop: '10px',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: zoneStatus.bg,
                border: `1px solid ${zoneStatus.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 800,
                color: zoneStatus.color,
              }}
            >
              <StatusIcon size={14} className={zoneStatus.pulse ? 'animate-pulse' : ''} />
              <span>{zoneStatus.label}</span>
            </div>

            {/* Best Entry & Chase Limit Sub-points */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.28)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-primary, #FFFFFF)', fontWeight: 700 }}>
                  ⭐ จุดเข้าที่ดีที่สุด (Best Buy):
                </span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#FDE047' }}>
                  {isThai ? thb(bestEntry) : usd(bestEntry)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>
                  ⛔ ห้ามไล่ราคาเกิน:
                </span>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#F87171' }}>
                  {isThai ? thb(chaseLimit) : usd(chaseLimit)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Footer Rationale */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted, #94A3B8)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isBestGold ? '#FDE047' : '#34D399', fontWeight: 700 }}>
              <CheckCircle2 size={13} />
              {isThai ? 'อิงราคาสมาคมค้าทองคำ 96.5%' : 'Fibonacci Golden 0.618 Zone'}
            </span>
            <span>รอจังหวะย่อในเทรนด์ขาขึ้น</span>
          </div>
        </div>

        {/* ═══ CARD 2: 🛑 จุดตัดขาดทุน ยอมแพ้ทันที (Strict Stop Loss) ═══ */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, var(--bg-card, #111827) 45%, rgba(220, 38, 38, 0.08) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Neon Accent Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #EF4444, #F87171, #DC2626)',
            }}
          />

          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 900,
                  backgroundColor: 'rgba(239, 68, 68, 0.22)',
                  color: '#F87171',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  letterSpacing: '0.4px',
                }}
              >
                <ShieldAlert size={13} />
                <span>2. จุดตัดขาดทุน ยอมแพ้ (STOP LOSS)</span>
              </span>

              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                STRICT RISK LIMIT
              </span>
            </div>

            {/* Primary Stop Loss Price */}
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94A3B8)', fontWeight: 600 }}>
              ระดับราคาตัดขาดทุน (ยอมแพ้ทันที):
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 900,
                color: '#F87171',
                letterSpacing: '-0.5px',
                marginTop: '4px',
                textShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
              }}
            >
              {isThai ? thb(stopLoss) : usd(stopLoss)}
            </div>

            {/* Risk Distance Details */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.28)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-primary, #FFFFFF)', fontWeight: 700 }}>
                  ระยะห่างความเสี่ยง (Risk Distance):
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#F87171' }}>
                  {isThai ? `-${thb(stopDist)}` : `-${usd(stopDist, 1)}`} ({signed(-stopPct)})
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.4 }}>
                ⚠️ หากราคาปิดแท่ง 4H หลุดระดับนี้ = โครงสร้างขาขึ้นเสียทันที ต้องคัตลอสเด็ดขาด ไม่ทนถือ
              </div>
            </div>
          </div>

          {/* Card Footer Risk Control */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted, #94A3B8)',
            }}
          >
            <span style={{ color: '#F87171', fontWeight: 700 }}>
              Invalidation Trigger Level
            </span>
            <span>คุม Max Drawdown เสมอ</span>
          </div>
        </div>

        {/* ═══ CARD 3: 🎯 จุดออกทำกำไร (Take Profit Targets) ═══ */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, var(--bg-card, #111827) 45%, rgba(245, 158, 11, 0.12) 100%)',
            border: '2px solid rgba(6, 182, 212, 0.5)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(6, 182, 212, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Neon Accent Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #06B6D4, #38BDF8, #F59E0B)',
            }}
          />

          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 900,
                  backgroundColor: 'rgba(6, 182, 212, 0.22)',
                  color: '#38BDF8',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  letterSpacing: '0.4px',
                }}
              >
                <Award size={13} />
                <span>3. จุดออกทำกำไร (TAKE PROFIT)</span>
              </span>

              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  color: '#FDE047',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                R:R 1:{rrRatio}
              </span>
            </div>

            {/* Target Levels Breakdown (TP1, TP2, TP3) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* TP1 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.28)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', padding: '1px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.2)' }}>
                    TP1
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-primary, #FFFFFF)', fontWeight: 600 }}>
                    ล็อกกำไรไม้แรก (40%)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary, #FFFFFF)' }}>
                    {isThai ? thb(tp1) : usd(tp1)}
                  </span>
                  <div style={{ fontSize: '10px', color: '#34D399', fontWeight: 700 }}>
                    {signed(Math.abs((tp1 - bestEntry) / (bestEntry || 1) * 100))}
                  </div>
                </div>
              </div>

              {/* TP2 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.28)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#FDE047', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)' }}>
                    TP2
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-primary, #FFFFFF)', fontWeight: 600 }}>
                    เป้าสวิงหลัก (Swing 40%)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#FDE047' }}>
                    {isThai ? thb(tp2) : usd(tp2)}
                  </span>
                  <div style={{ fontSize: '10px', color: '#FDE047', fontWeight: 700 }}>
                    {signed(Math.abs((tp2 - bestEntry) / (bestEntry || 1) * 100))}
                  </div>
                </div>
              </div>

              {/* TP3 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.28)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)' }}>
                    TP3
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-primary, #FFFFFF)', fontWeight: 600 }}>
                    คลื่นใหญ่ขยายตัว (Runner 20%)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#34D399' }}>
                    {isThai ? thb(tp3) : usd(tp3)}
                  </span>
                  <div style={{ fontSize: '10px', color: '#34D399', fontWeight: 700 }}>
                    {signed(Math.abs((tp3 - bestEntry) / (bestEntry || 1) * 100))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer R:R Ratio */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted, #94A3B8)',
            }}
          >
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>
              อัตราทดเฉลี่ย 1:{rrRatio} R:R
            </span>
            <span>คาดการณ์ถือ 1–5 วัน</span>
          </div>
        </div>
      </div>
    </div>
  );
};
