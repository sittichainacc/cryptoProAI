import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Zap, Volume2, VolumeX, Sparkles, CheckCircle2, Clock, 
  ShieldCheck, ChevronRight, AlertCircle, RefreshCw, Send, Crown, AlertTriangle, ShieldAlert
} from 'lucide-react';
import type { GoldSignalResponse } from '../../types/gold.js';

interface GoldenTimingAlertBannerProps {
  data: GoldSignalResponse;
  mode: string;
  onScrollToPlan?: () => void;
}

const SOUND_LS_KEY = 'cryptopro_gold_chime_sound';

export const GoldenTimingAlertBanner: React.FC<GoldenTimingAlertBannerProps> = ({
  data,
  mode,
  onScrollToPlan,
}) => {
  const isThai = mode === 'THAI_GOLD_BAR';
  const price = data.price;
  const entry = data.tradePlan.entry;
  const thaiEntry = data.tradePlan.thaiGoldEntry;
  const signal = data.tradePlan.signal;
  const conviction = data.conviction;

  // Real-time market price
  const currentPrice = isThai 
    ? (price.thaiGoldBarSell ?? 66000) 
    : (mode === 'COMEX_FUTURES' ? (price.comexPrice ?? price.xauUsd ?? 2650) : (price.xauUsd ?? 2650));

  // Determine entry bounds
  const entryLow = isThai ? (thaiEntry?.buyZoneLow ?? 65800) : (entry?.entryLow ?? (currentPrice * 0.996));
  const entryHigh = isThai ? (thaiEntry?.buyZoneHigh ?? 66050) : (entry?.entryHigh ?? (currentPrice * 1.002));
  const bestEntry = isThai ? (thaiEntry?.bestBuy ?? 65900) : (entry?.bestEntry ?? currentPrice);
  const stopLoss = isThai ? (thaiEntry?.invalidation ?? 65400) : (entry?.stopLoss ?? (currentPrice * 0.988));
  const chaseLimit = isThai ? (thaiEntry?.chaseAbove ?? 66250) : (entry?.chaseLevel ?? (currentPrice * 1.006));

  const minZone = Math.min(entryLow, entryHigh);
  const maxZone = Math.max(entryLow, entryHigh);
  const isPriceInZone = currentPrice >= minZone && currentPrice <= maxZone;
  const isStoppedOut = currentPrice < stopLoss;
  const isExtended = currentPrice > chaseLimit;
  const isMarketBearish = conviction.directionalBias <= -12;

  // Real Market Status Classification (Long Only: Best Gold -> Green Ready -> Amber Wait -> Red Caution)
  const isRealBestGold = Boolean(
    (signal.isBestGold || (signal.state === 'LONG_READY' && conviction.totalScore >= 70 && conviction.isAllGatesPass && isPriceInZone)) &&
    !isStoppedOut &&
    !isExtended &&
    !isMarketBearish
  );

  const isRealReadyGreen = Boolean(
    !isRealBestGold &&
    (signal.state === 'LONG_READY' || isPriceInZone || (conviction.totalScore >= 60 && conviction.isAllGatesPass)) &&
    !isStoppedOut &&
    !isExtended &&
    !isMarketBearish
  );

  const isRealWaitingAmber = Boolean(
    !isRealBestGold &&
    !isRealReadyGreen &&
    !isStoppedOut &&
    (signal.state === 'WAIT_FOR_PULLBACK' || signal.state === 'WAIT_FOR_BREAKOUT' || signal.state === 'WAIT_FOR_NEWS' || signal.state === 'REVERSAL_WATCH' || isExtended)
  );

  // Simulation mode: 'LIVE' | 'BEST_GOLD' | 'READY_GREEN' | 'WAITING' | 'CAUTION'
  const [simMode, setSimMode] = useState<'LIVE' | 'BEST_GOLD' | 'READY_GREEN' | 'WAITING' | 'CAUTION'>('LIVE');

  // Computed active state based on LIVE or SIMULATION
  const activeStatus: 'BEST_GOLD' | 'READY_GREEN' | 'WAITING' | 'CAUTION' = 
    simMode !== 'LIVE' 
      ? (simMode as 'BEST_GOLD' | 'READY_GREEN' | 'WAITING' | 'CAUTION')
      : isRealBestGold 
        ? 'BEST_GOLD' 
        : isRealReadyGreen 
          ? 'READY_GREEN' 
          : isRealWaitingAmber 
            ? 'WAITING' 
            : 'CAUTION';

  const isSimulated = simMode !== 'LIVE';
  const isActiveAction = activeStatus === 'BEST_GOLD' || activeStatus === 'READY_GREEN';

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_LS_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [hasPlayedState, setHasPlayedState] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(1140); // ~19 mins window
  const [notificationGranted, setNotificationGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const timerRef = useRef<any>(null);

  // Save sound setting
  const toggleSound = (val: boolean) => {
    setSoundEnabled(val);
    try {
      localStorage.setItem(SOUND_LS_KEY, String(val));
    } catch { /* ignore */ }
  };

  // 1. 🌟 Play Rich Luxurious Golden Harmonic Fanfare (เสียงสัญญาณดีสุด สีทองกระพริบ)
  const playSupremeGoldChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Golden 5-note shimmering ascending fanfare: C5 -> E5 -> G5 -> B5 -> C6
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.50];
      chord.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + index * 0.09;
        const duration = 0.75;

        // Rich mix of triangle and sine for warm golden shine
        osc.type = index >= 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Audio chime unavailable:', e);
    }
  };

  // 2. 🟢 Play Crisp Positive Confirmation Chime (เสียงสัญญาณเข้าพร้อม สีเขียว)
  const playReadyGreenChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dual-tone crisp bell chime: E5 -> B5 -> E6
      const notes = [659.25, 987.77, 1318.51];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + index * 0.1;
        const duration = 0.55;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Audio chime unavailable:', e);
    }
  };

  // Browser Desktop Notification
  const requestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationGranted(perm === 'granted');
      if (perm === 'granted') {
        new Notification('🔔 ระบบแจ้งเตือนเวลาทองคำเปิดใช้งานแล้ว', {
          body: 'ระบบจะส่งการแจ้งเตือนทันทีเมื่อสัญญาณเข้าพร้อมหรือสัญญาณดีสุด',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.warn('Notification error:', e);
    }
  };

  // Automatically play appropriate sound and dispatch notification on status transition
  useEffect(() => {
    if (!soundEnabled) return;

    if (activeStatus === 'BEST_GOLD' && hasPlayedState !== 'BEST_GOLD') {
      playSupremeGoldChime();
      setHasPlayedState('BEST_GOLD');
      if (notificationGranted && 'Notification' in window) {
        new Notification('👑 สัญญาณทองระดับดีที่สุด (CryptoPro AI)', {
          body: `สัญญาณเวลาทองคำจุดที่ดีที่สุด! เข้าเกณฑ์ครบทุกมิติ (${isThai ? `฿${currentPrice.toLocaleString()}` : `$${currentPrice}`})`,
          icon: '/favicon.ico',
        });
      }
    } else if (activeStatus === 'READY_GREEN' && hasPlayedState !== 'READY_GREEN') {
      playReadyGreenChime();
      setHasPlayedState('READY_GREEN');
      if (notificationGranted && 'Notification' in window) {
        new Notification('🟢 สัญญาณเข้าพร้อม (CryptoPro AI)', {
          body: `สัญญาณเข้าพร้อม! ราคาอยู่ในโซนสะสม (${isThai ? `฿${currentPrice.toLocaleString()}` : `$${currentPrice}`})`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [activeStatus, soundEnabled, hasPlayedState, notificationGranted]);

  // Countdown timer for active entry window
  useEffect(() => {
    if (isActiveAction) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => (prev > 1 ? prev - 1 : 1200));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActiveAction]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayPrice = isThai
    ? `฿${Math.round(price.thaiGoldBarSell ?? 66000).toLocaleString('th-TH')}`
    : `$${(price.xauUsd ?? 2650).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // UI Theme Configuration by Status (Color Spectrum: Gold -> Green -> Amber -> Red)
  const getThemeConfig = () => {
    switch (activeStatus) {
      case 'BEST_GOLD':
        return {
          cardStyle: {
            border: '2px solid #F59E0B',
            animation: 'goldFlashBlink 1.6s infinite ease-in-out',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, var(--bg-card, #111827) 45%, rgba(253, 224, 71, 0.2) 100%)',
            boxShadow: '0 0 35px rgba(245, 158, 11, 0.45), inset 0 0 20px rgba(253, 224, 71, 0.25)',
          },
          railGradient: 'linear-gradient(90deg, #F59E0B, #FDE047, #FFFFFF, #FDE047, #F59E0B)',
          badgeBackground: 'linear-gradient(135deg, #F59E0B, #D97706)',
          badgeShadow: '0 0 24px rgba(245, 158, 11, 0.8)',
          badgeIcon: Crown,
          badgeColor: '#FFFFFF',
          tagText: '👑 สัญญาณทองระดับดีที่สุด (SUPREME GOLD)',
          tagStyle: {
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: '#FFFFFF',
            border: '1px solid rgba(253, 224, 71, 0.8)',
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.6)',
            animation: 'goldBadgeFlash 1.6s infinite ease-in-out',
          },
          title: '👑 แจ้งเตือน: สัญญาณเวลาทองระดับดีที่สุด — จุดเข้าสะสมที่มีความได้เปรียบสูงสุด!',
          desc: 'ราคาเข้าสู่โซน Confluence สำคัญ เสาหลักทุกมิติยืนยันแข็งแกร่ง (คะแนนเต็มความมั่นใจสูง) ความคุ้มค่า Risk:Reward ยอดเยี่ยม เหมาะแก่การเปิดสถานะ Long / สะสมไม้แรก',
          statusColor: '#FDE047',
        };
      case 'READY_GREEN':
        return {
          cardStyle: {
            border: '2px solid rgba(16, 185, 129, 0.8)',
            animation: 'greenReadyPulse 2s infinite ease-in-out',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, var(--bg-card, #111827) 45%, rgba(6, 182, 212, 0.12) 100%)',
            boxShadow: '0 0 28px rgba(16, 185, 129, 0.35), inset 0 0 16px rgba(16, 185, 129, 0.15)',
          },
          railGradient: 'linear-gradient(90deg, #10B981, #34D399, #06B6D4, #10B981)',
          badgeBackground: 'linear-gradient(135deg, #10B981, #059669)',
          badgeShadow: '0 0 20px rgba(16, 185, 129, 0.65)',
          badgeIcon: CheckCircle2,
          badgeColor: '#FFFFFF',
          tagText: '🟢 สัญญาณเข้าพร้อม (READY TO BUY)',
          tagStyle: {
            background: 'rgba(16, 185, 129, 0.25)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.6)',
          },
          title: '🟢 แจ้งเตือน: สัญญาณเข้าพร้อม — ราคาอยู่ในโซนสะสมที่ได้เปรียบ',
          desc: 'ราคาอยู่ในกรอบโซนซื้อที่ได้เปรียบและเสาหลักยืนยันผ่านเกณฑ์ สามารถเปิดสถานะ Long ได้ตามแผนการเทรด ไม่ไล่ราคาเกินระดับที่กำหนด',
          statusColor: '#34D399',
        };
      case 'WAITING':
        return {
          cardStyle: {
            border: '1px solid rgba(245, 158, 11, 0.45)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-card, #111827) 50%, rgba(255, 255, 255, 0.02) 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          },
          railGradient: 'linear-gradient(90deg, #F59E0B, #EAB308, #F59E0B)',
          badgeBackground: 'rgba(245, 158, 11, 0.16)',
          badgeShadow: 'none',
          badgeIcon: Clock,
          badgeColor: '#FDE047',
          tagText: '⏳ รอราคาย่อเข้าโซน (WAIT FOR PULLBACK)',
          tagStyle: {
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#FDE047',
            border: '1px solid rgba(245, 158, 11, 0.4)',
          },
          title: '🔔 ระบบเฝ้าระวังเวลาทองคำ (STANDBY) — รอราคาย่อเข้าสู่โซนสะสม',
          desc: 'โครงสร้างราคาโดยรวมเป็นบวก แต่ราคายังไม่อยู่ในตำแหน่งที่คุ้มค่าความเสี่ยง — รอราคาย่อพักตัวเข้าสู่โซนสะสมก่อนเข้าเปิดออเดอร์',
          statusColor: '#FDE047',
        };
      case 'CAUTION':
      default:
        return {
          cardStyle: {
            border: '1px solid rgba(239, 68, 68, 0.5)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, var(--bg-card, #111827) 50%, rgba(0, 0, 0, 0.35) 100%)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
          },
          railGradient: 'linear-gradient(90deg, #EF4444, #F87171, #EF4444)',
          badgeBackground: 'rgba(239, 68, 68, 0.16)',
          badgeShadow: 'none',
          badgeIcon: ShieldAlert,
          badgeColor: '#F87171',
          tagText: '⛔ งดเทรด / ความเสี่ยงสูง (NO TRADE)',
          tagStyle: {
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#F87171',
            border: '1px solid rgba(239, 68, 68, 0.45)',
          },
          title: '⚠️ ระบบเตือนความเสี่ยง: ตลาดเป็นขาลง หรือหลุดแนวรับ — แนะนำถือเงินสด (LONG ONLY)',
          desc: 'ระบบสัญญาณทองคำมุ่งเน้นเฉพาะกลยุทธ์ขาขึ้น (LONG ONLY) ขณะนี้ตลาดยังไม่มีความได้เปรียบชัดเจน แนะนำถือเงินสดและรอการกลับตัวที่ยืนยัน',
          statusColor: '#F87171',
        };
    }
  };

  const theme = getThemeConfig();
  const BadgeIcon = theme.badgeIcon;

  return (
    <div
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...theme.cardStyle,
      }}
    >
      {/* Dynamic Animated top pulse rail */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          background: theme.railGradient,
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.8s infinite linear',
        }}
      />

      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Left: Badge Icon & Alert Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: '1 1 360px' }}>
          {/* Status Badge */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: theme.badgeBackground,
              border: isActiveAction ? 'none' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.badgeShadow,
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <BadgeIcon size={24} color={theme.badgeColor} className={isActiveAction ? 'animate-bounce' : ''} />
            {isActiveAction && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: activeStatus === 'BEST_GOLD' ? '#FDE047' : '#10B981',
                  boxShadow: `0 0 10px ${activeStatus === 'BEST_GOLD' ? '#FDE047' : '#10B981'}`,
                }}
              />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  ...theme.tagStyle,
                }}
              >
                <Sparkles size={12} />
                {theme.tagText}
              </span>

              {isSimulated && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    color: '#C084FC',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                  }}
                >
                  SIMULATION DEMO
                </span>
              )}

              {isActiveAction && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: activeStatus === 'BEST_GOLD' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                    color: activeStatus === 'BEST_GOLD' ? '#FDE047' : '#34D399',
                    border: `1px solid ${activeStatus === 'BEST_GOLD' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} />
                  เวลาทองเหลืออีก ~{formatCountdown(remainingSeconds)} นาที
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '15.5px',
                fontWeight: 900,
                color: 'var(--text-primary, #FFFFFF)',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              <span>{theme.title}</span>
              <span style={{ color: theme.statusColor, fontWeight: 800 }}>
                ({displayPrice})
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary, #CBD5E1)',
                marginTop: '3px',
                lineHeight: 1.45,
              }}
            >
              {theme.desc}
            </div>
          </div>
        </div>

        {/* Right: Sound Controls, Test Chimes & Simulation Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sound Toggle Button */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              toggleSound(next);
              if (next) {
                if (activeStatus === 'BEST_GOLD') playSupremeGoldChime();
                else playReadyGreenChime();
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: soundEnabled ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-card-inner, rgba(255, 255, 255, 0.05))',
              border: soundEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              color: soundEnabled ? '#34D399' : 'var(--text-muted, #94A3B8)',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title={soundEnabled ? 'เสียงเตือนเปิดอยู่ (คลิกเพื่อปิด)' : 'เสียงเตือนปิดอยู่ (คลิกเพื่อเปิด)'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'เสียงเตือน ON' : 'เสียงเตือน OFF'}</span>
          </button>

          {/* Test Chimes: Green Chime & Gold Chime */}
          <button
            onClick={playReadyGreenChime}
            style={{
              padding: '6px 11px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#34D399',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="ทดสอบฟังเสียงสัญญาณเข้าพร้อม (สีเขียว)"
          >
            <CheckCircle2 size={13} color="#34D399" />
            <span>เสียงเข้าพร้อม (เขียว)</span>
          </button>

          <button
            onClick={playSupremeGoldChime}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.3))',
              border: '1px solid rgba(245, 158, 11, 0.65)',
              color: '#FDE047',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.15s ease',
            }}
            title="ทดสอบฟังเสียงสัญญาณดีที่สุด (สีทองกระพริบ)"
          >
            <Sparkles size={13} color="#FDE047" />
            <span>เสียงดีสุด (ทอง)</span>
          </button>

          {/* Browser Desktop Notification Request */}
          {!notificationGranted && (
            <button
              onClick={requestNotification}
              style={{
                padding: '6px 11px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.14)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#38BDF8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="เปิดการแจ้งเตือนบนหน้าจอเบราว์เซอร์"
            >
              <Send size={12} />
              <span>แจ้งเตือนบนจอ</span>
            </button>
          )}

          {/* Simulation Toggle Buttons (All 4 States) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 0, 0, 0.35)', padding: '3px 4px', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted, #94A3B8)', padding: '0 6px' }}>
              ทดสอบ:
            </span>
            <button
              onClick={() => {
                const next = simMode === 'BEST_GOLD' ? 'LIVE' : 'BEST_GOLD';
                setSimMode(next);
                if (next === 'BEST_GOLD' && soundEnabled) playSupremeGoldChime();
              }}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                background: simMode === 'BEST_GOLD' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                border: 'none',
                color: simMode === 'BEST_GOLD' ? '#000000' : '#FDE047',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="จำลองสัญญาณดีสุด (สีทองกระพริบ)"
            >
              👑 สีทองกระพริบ
            </button>

            <button
              onClick={() => {
                const next = simMode === 'READY_GREEN' ? 'LIVE' : 'READY_GREEN';
                setSimMode(next);
                if (next === 'READY_GREEN' && soundEnabled) playReadyGreenChime();
              }}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                background: simMode === 'READY_GREEN' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
                border: 'none',
                color: simMode === 'READY_GREEN' ? '#FFFFFF' : '#34D399',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="จำลองสัญญาณเข้าพร้อม (สีเขียว)"
            >
              🟢 สีเขียว
            </button>

            {simMode !== 'LIVE' && (
              <button
                onClick={() => setSimMode('LIVE')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'var(--text-secondary, #CBD5E1)',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="กลับสู่สถานะตลาดจริง"
              >
                ตลาดจริง
              </button>
            )}
          </div>

          {/* Jump to Plan Button */}
          {onScrollToPlan && (
            <button
              onClick={onScrollToPlan}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: activeStatus === 'BEST_GOLD' 
                  ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
                  : 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                color: activeStatus === 'BEST_GOLD' ? '#000000' : '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeStatus === 'BEST_GOLD' ? '0 2px 14px rgba(245, 158, 11, 0.45)' : '0 2px 10px rgba(16, 185, 129, 0.35)',
              }}
            >
              <span>ดูจุดเข้าซื้อ</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
