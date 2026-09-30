import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Zap, Volume2, VolumeX, Sparkles, CheckCircle2, Clock, 
  ShieldCheck, ChevronRight, AlertCircle, RefreshCw, Send 
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
  const minZone = Math.min(entryLow, entryHigh);
  const maxZone = Math.max(entryLow, entryHigh);
  const isPriceInZone = currentPrice >= minZone && currentPrice <= maxZone;

  // Real Market Trigger Condition
  const isRealTriggered = Boolean(
    signal.state === 'LONG_READY' ||
    signal.state === 'SHORT_READY' ||
    isPriceInZone ||
    (conviction.totalScore >= 65 && conviction.isAllGatesPass)
  );

  // States
  const [isSimulated, setIsSimulated] = useState(false);
  const isActive = isRealTriggered || isSimulated;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_LS_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [hasPlayedSound, setHasPlayedSound] = useState(false);
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

  // Play rich luxury golden chime via Web Audio API
  const playGoldenChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Golden 4-note ascending chord: C5 -> E5 -> G5 -> C6
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + index * 0.08;
        const duration = 0.65;

        osc.type = index === 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
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
          body: 'ระบบจะส่งการแจ้งเตือนทันทีเมื่อราคาเข้าสู่จุดสะสมที่ได้เปรียบ',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.warn('Notification error:', e);
    }
  };

  // Trigger chime on initial active load
  useEffect(() => {
    if (isActive && soundEnabled && !hasPlayedSound) {
      playGoldenChime();
      setHasPlayedSound(true);

      // Also send system notification if allowed
      if (notificationGranted && 'Notification' in window) {
        new Notification('⚡ แจ้งเตือนเวลาทองคำ (CryptoPro AI)', {
          body: `สัญญาณเวลาทองเปิดแล้ว! ราคาเข้าสู่โซนสะสม (${isThai ? `฿${currentPrice.toLocaleString()}` : `$${currentPrice}`})`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [isActive, soundEnabled, hasPlayedSound, notificationGranted]);

  // Countdown timer for golden entry window
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => (prev > 1 ? prev - 1 : 1200));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayPrice = isThai
    ? `฿${Math.round(price.thaiGoldBarSell ?? 66000).toLocaleString('th-TH')}`
    : `$${(price.xauUsd ?? 2650).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        background: isActive
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, var(--bg-card, #111827) 45%, rgba(16, 185, 129, 0.16) 100%)'
          : 'var(--bg-card, #111827)',
        border: isActive ? '1px solid rgba(245, 158, 11, 0.65)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        boxShadow: isActive
          ? '0 0 24px rgba(245, 158, 11, 0.22), inset 0 0 16px rgba(245, 158, 11, 0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Golden animated top pulse rail */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #F59E0B, #FDE047, #10B981, #06B6D4, #F59E0B)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s infinite linear',
          }}
        />
      )}

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
        {/* Left: Bell Icon & Alert Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: '1 1 360px' }}>
          {/* Pulsing Bell Badge */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: isActive
                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                : 'var(--bg-card-inner, rgba(255, 255, 255, 0.06))',
              border: isActive ? 'none' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isActive ? '0 0 20px rgba(245, 158, 11, 0.55)' : 'none',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Bell size={22} color={isActive ? '#FFFFFF' : 'var(--text-muted, #94A3B8)'} className={isActive ? 'animate-bounce' : ''} />
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
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
                  letterSpacing: '0.6px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#FDE047' : 'var(--text-muted, #94A3B8)',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} />
                {isRealTriggered ? 'LIVE MARKET TRIGGER' : (isSimulated ? 'SIMULATED DEMO' : 'STANDBY MONITORING')}
              </span>

              {isActive && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
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
                fontWeight: 800,
                color: isActive ? 'var(--text-primary, #FFFFFF)' : 'var(--text-secondary, #CBD5E1)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              <span>{isActive ? '⚡ แจ้งเตือน: เข้าสู่เวลาทองที่สามารถเข้าทำรายการได้!' : '🔔 ระบบเฝ้าระวังเวลาทองคำอัตโนมัติ (STANDBY)'}</span>
              {isActive && (
                <span style={{ color: '#FDE047', fontWeight: 700 }}>
                  ({displayPrice})
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '12px',
                color: isActive ? 'var(--text-secondary, #E2E8F0)' : 'var(--text-muted, #94A3B8)',
                marginTop: '3px',
                lineHeight: 1.4,
              }}
            >
              {isActive
                ? 'ราคาเข้าสู่โซน Confluence สำคัญ (Fibo Golden Zone + โครงสร้างราคา 4H + สถิติความคุ้มค่า) เข้าเกณฑ์จังหวะสะสมไม้แรกที่คุ้มค่าความเสี่ยง'
                : 'ระบบ AI ทำงานสแกนตลอด 24 ชั่วโมง เมื่อถึงระดับจุดเข้าที่ได้เปรียบและเสาหลักยืนยัน จะส่งเสียงกระดิ่งเตือนและไฮไลต์ทันที'}
            </div>
          </div>
        </div>

        {/* Right: Interactive Controls & Sound */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sound Toggle Button */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              toggleSound(next);
              if (next) playGoldenChime();
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: soundEnabled ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-card-inner, rgba(255, 255, 255, 0.05))',
              border: soundEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              color: soundEnabled ? '#34D399' : 'var(--text-muted, #94A3B8)',
              fontSize: '11.5px',
              fontWeight: 700,
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

          {/* Test Chime Button */}
          <button
            onClick={playGoldenChime}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.16)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FDE047',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title="ทดสอบฟังเสียงกระดิ่งทองคำ"
          >
            <Sparkles size={14} color="#FDE047" />
            <span>ทดสอบเสียง</span>
          </button>

          {/* Browser Desktop Notification Request */}
          {!notificationGranted && (
            <button
              onClick={requestNotification}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.14)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#38BDF8',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              title="เปิดการแจ้งเตือนบนหน้าจอเบราว์เซอร์"
            >
              <Send size={13} />
              <span>แจ้งเตือนบนจอ</span>
            </button>
          )}

          {/* Simulate Alert Toggle */}
          <button
            onClick={() => {
              const next = !isSimulated;
              setIsSimulated(next);
              if (next && soundEnabled) playGoldenChime();
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: isSimulated
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.25))'
                : 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: isSimulated ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
              color: isSimulated ? '#F87171' : '#000000',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title="จำลองเปิด-ปิด สัญญาณแจ้งเตือนเวลาทอง"
          >
            <Zap size={13} />
            <span>{isSimulated ? 'ปิดจำลองเตือน' : 'ทดสอบสัญญาณเวลาทอง'}</span>
          </button>

          {/* Jump to Plan Button */}
          {onScrollToPlan && (
            <button
              onClick={onScrollToPlan}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
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
