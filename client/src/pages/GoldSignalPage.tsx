/**
 * 🥇 สัญญาณทอง — CryptoPro Gold Intelligence & Entry Signal (Executive Edition)
 * AI Multi-Factor Gold Decision Engine
 * ตอบ 6 มิติชัดเจน: ตอนนี้ทำอะไร → เข้าแถวไหน → ผิดออกตรงไหน → กำไรตรงไหน → ถือต่อไหม → อะไรจะเปลี่ยนแผน
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  GoldSignalResponse, GoldPillarScore, GoldSetupCandidate, GoldRiskItem, GoldValidationStatus, GoldDataQuality,
  GoldEventRisk, IntermarketItem, MacroDataPoint, GoldNewsItem, GoldPosition, GoldPriceData,
} from '../types/gold.js';
import { GoldPlanChart } from '../components/gold/GoldPlanChart.js';
import { GoldRiskCalculator } from '../components/gold/GoldRiskCalculator.js';
import { GoldBacktestPanel, TagChip } from '../components/gold/GoldBacktestPanel.js';
import { 
  TrendingUp, TrendingDown, Target, Shield, AlertTriangle, ArrowRight, 
  CheckCircle2, XCircle, RefreshCw, Zap, Clock, DollarSign, BarChart3, 
  Sliders, Info, Scale, Activity, Flame, ChevronRight, Gem, ExternalLink, 
  Calculator, Compass, ShieldAlert, Award, Layers
} from 'lucide-react';

const API = '/api/gold';
const MODE_KEY = 'gold-signal-mode';
const POS_KEY = 'gold-signal-position';

const MODES = [
  { id: 'XAU_USD_SPOT', label: '🌐 XAU/USD Spot (สากล)', shortLabel: 'XAU/USD' },
  { id: 'THAI_GOLD_BAR', label: '🇹🇭 ทองคำแท่งไทย 96.5% (สมาคมฯ)', shortLabel: 'ทองไทย 96.5%' },
  { id: 'COMEX_FUTURES', label: '⚡ COMEX GC Futures (ตลาดล่วงหน้า)', shortLabel: 'COMEX GC' },
];

const C = {
  green: 'var(--neon-green, #10B981)', 
  red: 'var(--neon-red, #EF4444)', 
  amber: 'var(--neon-amber, #F59E0B)', 
  blue: 'var(--neon-blue, #3B82F6)',
  purple: 'var(--neon-purple, #8B5CF6)', 
  cyan: '#06B6D4',
  gold: '#F59E0B',
  muted: 'var(--text-secondary, #94A3B8)', 
  text: 'var(--text-primary, #F8FAFC)',
  cardBg: 'var(--bg-card, #111827)',
  cardInner: 'var(--bg-card-inner, rgba(255,255,255,0.03))',
  border: 'var(--border-color, rgba(255,255,255,0.08))',
};

const usd = (n: number | null | undefined, d = 2) => n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const thb = (n: number | null | undefined) => n == null ? '—' : `฿${Math.round(n).toLocaleString('th-TH')}`;
const signed = (n: number | null | undefined, suffix = '%', d = 2) => n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}${suffix}`;
const scoreColor = (s: number | null) => s == null ? C.muted : s >= 65 ? C.green : s >= 45 ? C.amber : C.red;
const riskColor = (s: number) => s < 30 ? C.green : s < 55 ? C.amber : C.red;
const impactColor = (i: string) => i === 'BULLISH' ? C.green : i === 'BEARISH' ? C.red : C.muted;

const toThaiGoldBaht = (usdPrice: number | null | undefined, p: GoldPriceData): number | null => {
  if (usdPrice == null || !p.thaiGoldBarSell || !p.usdThb) return null;
  const K = (15.244 * 0.965) / 31.1035;
  const premium = (p.thaiGoldBarSell ?? 0) - p.xauUsd * p.usdThb * K;
  return Math.round((usdPrice * p.usdThb * K + premium) / 50) * 50;
};

const readLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k: string, v: string | null) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } };

interface PosForm { side: 'LONG' | 'SHORT'; entry: string; stop: string; date: string }
const emptyPos: PosForm = { side: 'LONG', entry: '', stop: '', date: '' };

const SETUP_TH: Record<string, string> = {
  TREND_PULLBACK: 'Trend Pullback (ย่อในเทรนด์)',
  BREAKOUT_RETEST: 'Breakout Retest (ทะลุแล้วทดสอบ)',
  LIQUIDITY_SWEEP_REVERSAL: 'Liquidity Sweep (กวาดสภาพคล่องแล้วกลับตัว)',
  COMPRESSION_BREAKOUT: 'Compression Breakout (ระเบิดกรอบบีบตัว)',
  MACRO_CONFIRMATION_ENTRY: 'Macro Confirmation (ข่าว & Flow ยืนยัน)',
  NONE: '—',
};

export const GoldSignalPage: React.FC = () => {
  const [mode, setMode] = useState<string>(() => readLS(MODE_KEY) ?? 'XAU_USD_SPOT');
  const [data, setData] = useState<GoldSignalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'deep' | 'macro' | 'intermarket' | 'flow' | 'news' | 'plan' | 'backtest' | 'sources'>('deep');
  const [showChart, setShowChart] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [posForm, setPosForm] = useState<PosForm>(() => {
    try { return { ...emptyPos, ...JSON.parse(readLS(`${POS_KEY}:${readLS(MODE_KEY) ?? 'XAU_USD_SPOT'}`) ?? '{}') }; } catch { return emptyPos; }
  });
  const [activePos, setActivePos] = useState<PosForm | null>(() => posForm.entry ? posForm : null);

  const fetchSignal = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams({ mode });
      if (activePos?.entry) {
        q.set('entryPrice', activePos.entry);
        q.set('side', mode === 'THAI_GOLD_BAR' ? 'LONG' : activePos.side);
        if (activePos.stop) q.set('stopLoss', activePos.stop);
        if (activePos.date) { const t = Date.parse(activePos.date); if (!Number.isNaN(t)) q.set('entryTime', String(t)); }
      }
      const res = await fetch(`${API}/signal?${q}`);
      const json = await res.json();
      if (json.success) { 
        setData(json.data); 
        setError(null); 
        setLastUpdate(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })); 
      } else {
        setError(json.error || 'โหลดสัญญาณทองไม่สำเร็จ');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [mode, activePos]);

  useEffect(() => {
    fetchSignal();
    const id = setInterval(fetchSignal, 60_000);
    return () => clearInterval(id);
  }, [fetchSignal]);

  const changeMode = (m: string) => {
    setMode(m);
    writeLS(MODE_KEY, m);
    let saved: PosForm = emptyPos;
    try { saved = { ...emptyPos, ...JSON.parse(readLS(`${POS_KEY}:${m}`) ?? '{}') }; } catch { /* ignore */ }
    setPosForm(saved);
    setActivePos(saved.entry ? saved : null);
  };

  const applyPosition = () => {
    if (!posForm.entry) return;
    writeLS(`${POS_KEY}:${mode}`, JSON.stringify(posForm));
    setActivePos({ ...posForm });
  };

  const clearPosition = () => {
    writeLS(`${POS_KEY}:${mode}`, null);
    setPosForm(emptyPos);
    setActivePos(null);
  };

  const supports = useMemo(() => data?.technical.supportResistance.supports ?? [], [data]);
  const resistances = useMemo(() => data?.technical.supportResistance.resistances ?? [], [data]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center' }}>
        <div style={{
          background: 'var(--bg-card)',
          padding: '40px 50px',
          borderRadius: 20,
          border: '1px solid rgba(245, 158, 11, 0.2)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }} className="animate-bounce">🥇</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' }}>
            กำลังประมวลผลระบบสัญญาณทองคำอัจฉริยะ...
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
            รวบรวมข้อมูล COMEX GC · US Treasury Real Yield · BLS · CFTC · สมาคมค้าทองคำ
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: C.red, fontSize: 16, fontWeight: 800, maxWidth: 520, margin: '0 auto' }}>
          เกิดข้อผิดพลาดในการโหลดสัญญาณทอง: {error}
        </div>
        <button onClick={fetchSignal} style={{
          marginTop: 20,
          padding: '10px 24px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: '#FFF',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
        }}>
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { price, regime, technical, orderFlow, macro, intermarket, news, fundamental, risk, eventRisk, conviction, tradePlan: plan, position, validation, dataQuality } = data;
  const thaiMode = mode === 'THAI_GOLD_BAR';
  const sig = plan.signal;
  const bestSetup = plan.setups.find(s => s.type === plan.setupType) ?? null;
  const dxy = intermarket.items.find(i => i.key === 'dxy');
  const staleSources = data.dataSources.filter(s => s.status !== 'LIVE');

  const tabs = [
    { id: 'deep', label: '🎯 เทคนิค & โครงสร้างราคา', icon: Target },
    { id: 'macro', label: '🏛️ Macro, Fed & Real Yield', icon: Scale },
    { id: 'intermarket', label: '🌐 Intermarket & DXY', icon: Activity },
    { id: 'flow', label: '🔄 Order Flow & COT', icon: BarChart3 },
    { id: 'news', label: '📰 ข่าว & ปัจจัยพื้นฐาน', icon: Flame },
    { id: 'plan', label: '📌 ติดตาม Position ของคุณ', icon: Compass },
    { id: 'backtest', label: '🧪 ผลการทดสอบ (Backtest)', icon: Award },
    { id: 'sources', label: `🛰️ แหล่งข้อมูล${staleSources.length ? ` (${staleSources.length}⚠)` : ''}`, icon: Layers },
  ];

  return (
    <div className="gold-signal-page" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      {/* ═══ Top Hero Bar ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(17, 24, 39, 0.95) 45%, rgba(16, 185, 129, 0.08) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 20,
        padding: 'clamp(16px, 3vw, 24px)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        {/* Shimmer line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #F59E0B, #FFD700, #10B981, transparent)',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28 }}>🥇</span>
              <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.5px' }}>
                สัญญาณทองคำอัจฉริยะ <span style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>Gold Intelligence & Precision Cockpit</span>
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 800,
                background: price.marketOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                color: price.marketOpen ? C.green : C.muted,
                border: `1px solid ${price.marketOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: price.marketOpen ? C.green : C.muted }} />
                {price.marketOpen ? 'ตลาดเปิด (LIVE)' : 'ตลาดปิด'}
              </span>
            </div>

            <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0', maxWidth: 840, lineHeight: 1.5 }}>
              AI Multi-Factor Gold Decision Engine วิเคราะห์ราคา เทคนิค Real Yield ดอลลาร์ ดอกเบี้ย Fed ตัวเลขแรงงาน CFTC COT ข่าว และสมาคมค้าทองคำ
            </p>
          </div>

          {/* Mode Switcher & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              background: 'var(--bg-card-inner, rgba(0,0,0,0.3))',
              padding: '4px',
              borderRadius: 12,
              border: '1px solid var(--border-color)',
            }}>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => changeMode(m.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    background: mode === m.id ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                    color: mode === m.id ? '#FFF' : C.muted,
                    boxShadow: mode === m.id ? '0 2px 10px rgba(245, 158, 11, 0.3)' : 'none',
                  }}
                >
                  {m.shortLabel}
                </button>
              ))}
            </div>

            <button
              onClick={fetchSignal}
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.06)',
                color: C.text,
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'กำลังรีเฟรช...' : 'รีเฟรช'}</span>
            </button>
            <span style={{ fontSize: 11, color: C.muted }}>{lastUpdate ? `อัปเดต ${lastUpdate}` : ''}</span>
          </div>
        </div>
      </div>

      {error && <Banner color={C.red} icon="⚠️" title="รีเฟรชล่าสุดไม่สำเร็จ — แสดงข้อมูลชุดก่อนหน้า" text={error} />}
      {data.alerts.map(a => <Banner key={a.messageTh} color={a.level === 'ERROR' ? C.red : C.amber} icon={a.level === 'ERROR' ? '🛑' : '⚠️'} title={a.level === 'ERROR' ? 'ADMIN ALERT' : 'แจ้งเตือนระบบ'} text={a.messageTh} />)}

      {/* ═══ Executive Decision Cockpit: 3-Col Hero Grid ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap: 16,
        alignItems: 'stretch',
      }}>
        {/* Card 1: Main Action & Hero Signal */}
        <div style={{
          background: `linear-gradient(135deg, ${sig.color}15, rgba(17, 24, 39, 0.8))`,
          border: `2px solid ${sig.color}66`,
          borderRadius: 18,
          padding: '20px',
          boxShadow: `0 8px 30px ${sig.color}18`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 900,
                background: `${sig.color}22`,
                color: sig.color,
                border: `1px solid ${sig.color}55`,
              }}>
                <span style={{ fontSize: 14 }}>{sig.emoji}</span>
                <span>{sig.labelTh}</span>
              </span>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
                {thaiMode ? 'ฝั่งซื้อทองคำแท่ง' : `ฝั่งเทรด: ${conviction.side}`}
              </span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5 }}>
              🎯 การตัดสินใจหลักขณะนี้ (ACTION NOW)
            </div>
            <div style={{
              fontSize: 'clamp(18px, 2.5vw, 22px)',
              fontWeight: 900,
              color: C.text,
              marginTop: 6,
              lineHeight: 1.4,
            }}>
              {plan.nowActionTh}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              {sig.descTh}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={chip(regime.trend.includes('BULL') ? C.green : regime.trend.includes('BEAR') ? C.red : C.amber)}>
                {regime.labelTh}
              </span>
              {bestSetup && bestSetup.type !== 'NONE' && (
                <span style={chip(C.blue)}>
                  Setup: {SETUP_TH[bestSetup.type] || bestSetup.type}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              Directional Bias: <strong style={{ color: C.text }}>{conviction.directionalBias}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Conviction & Model Probability */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 18,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>
                📊 CONVICTION & WIN PROBABILITY
              </div>
              <span style={chip(conviction.isAllGatesPass ? C.green : C.red)}>
                {conviction.isAllGatesPass ? '✓ Gates Passed' : '⚠ Gate Blocked'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: scoreColor(conviction.totalScore), letterSpacing: -1 }}>
                {conviction.totalScore}
              </span>
              <span style={{ fontSize: 18, color: C.muted, fontWeight: 600 }}>/ 100</span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: scoreColor(conviction.totalScore),
                background: `${scoreColor(conviction.totalScore)}15`,
                padding: '2px 8px',
                borderRadius: 6,
                marginLeft: 'auto',
              }}>
                {conviction.totalScore >= 70 ? 'ความมั่นใจสูง' : conviction.totalScore >= 50 ? 'ความมั่นใจปานกลาง' : 'ความมั่นใจต่ำ'}
              </span>
            </div>

            <div style={{ height: 8, background: 'var(--bg-card-inner)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
              <div style={{
                width: `${conviction.totalScore}%`,
                height: '100%',
                background: `linear-gradient(90deg, #F59E0B, ${scoreColor(conviction.totalScore)})`,
                borderRadius: 4,
              }} />
            </div>

            {/* Sub-metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-inner)' }}>
                <div style={{ fontSize: 10, color: C.muted }}>Win Prob P(TP1)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: validation.winProbability.calibrated ? C.green : C.amber }}>
                  {validation.winProbability.calibrated ? `${validation.winProbability.pTp1}%` : 'ประเมินจาก Setup'}
                </div>
              </div>

              <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-inner)' }}>
                <div style={{ fontSize: 10, color: C.muted }}>Data Confidence</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor(dataQuality.dataConfidence) }}>
                  {dataQuality.dataConfidence}/100 ({dataQuality.level})
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
            {validation.winProbability.noteTh}
          </div>
        </div>

        {/* Card 3: Live Price Ticker & Thai Gold Association */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 18,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>
                {thaiMode ? '🇹🇭 สมาคมค้าทองคำแห่งประเทศไทย' : '🌐 XAU/USD SPOT PRICE'}
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>
                USD/THB {price.usdThb ? price.usdThb.toFixed(2) : '—'}
              </span>
            </div>

            {thaiMode ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: C.muted }}>รับซื้อ (Buy back)</span>
                    <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>{thb(price.thaiGoldBarBuy)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: C.muted }}>ขายออก (Sell)</span>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#F59E0B' }}>{thb(price.thaiGoldBarSell)}</div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'var(--bg-card-inner)',
                  marginTop: 10,
                  fontSize: 11,
                }}>
                  <span>เปลี่ยนแปลงวันนี้:</span>
                  <strong style={{ color: (price.thaiGoldChange ?? 0) >= 0 ? C.green : C.red }}>
                    {(price.thaiGoldChange ?? 0) >= 0 ? '+' : ''}{price.thaiGoldChange?.toLocaleString() ?? 0} บาท
                  </strong>
                  <span style={{ color: C.muted }}>
                    {price.thaiGoldRound ? `รอบที่ ${price.thaiGoldRound}` : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: -1 }}>
                  {usd(price.xauUsd)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: price.xauUsdChange24hPct >= 0 ? C.green : C.red }}>
                    {signed(price.xauUsdChange24hPct)}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    (24h: {signed(price.xauUsdChange24h, '$', 2)})
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  H: {usd(price.xauUsdHigh24h)} · L: {usd(price.xauUsdLow24h)} · COMEX Basis {signed(price.comexBasis, '', 1)}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
            fontSize: 11,
            color: C.muted,
          }}>
            <span>COMEX GC: {usd(price.comexPrice)}</span>
            <span>{price.goldSpotSource.split('(')[0]}</span>
          </div>
        </div>
      </div>

      {/* ═══ 6 คำตอบหลัก (Executive 6 Core Action Answers) ═══ */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 20,
        padding: '22px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧭</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                การตัดสินใจ 6 มิติ (Trade Execution Matrix)
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                ตอบโจทย์การเทรดจริง: จังหวะเข้า โซนราคา จุดยอมแพ้ เป้ากำไร การบริหาร และจุดเปลี่ยนแผน
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: showCalculator ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
              color: showCalculator ? '#F59E0B' : C.text,
              border: `1px solid ${showCalculator ? '#F59E0B' : 'var(--border-color)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Calculator size={14} />
            <span>{showCalculator ? 'ซ่อนเครื่องคำนวณไม้' : 'เปิดเครื่องคำนวณไม้ & ความเสี่ยง'}</span>
          </button>
        </div>

        <DecisionGrid d={data} thaiMode={thaiMode} />

        {/* AI In-depth Explanation Box */}
        <div style={{
          marginTop: 18,
          padding: '16px 18px',
          borderRadius: 14,
          background: 'var(--bg-card-inner)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
              AI Executive Summary & Market Context (คำอธิบายกลยุทธ์เชิงลึก)
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {plan.aiExplanationTh}
          </div>
        </div>
      </div>

      {/* ═══ Position Sizer & Risk Calculator (Collapsible / Prominent) ═══ */}
      {showCalculator && (
        <GoldRiskCalculator 
          mode={mode} 
          price={price} 
          plan={plan.entry} 
          thaiPlan={plan.thaiGoldEntry} 
        />
      )}

      {/* ═══ Prominent Hero Technical Chart ═══ */}
      <div style={{ minWidth: 0 }}>
        <GoldPlanChart 
          mode={mode === 'COMEX_FUTURES' ? 'COMEX_FUTURES' : 'XAU_USD_SPOT'} 
          plan={plan.entry} 
          thaiPlan={plan.thaiGoldEntry}
          supports={supports} 
          resistances={resistances} 
          currentPrice={thaiMode ? price.thaiGoldBarSell ?? undefined : price.xauUsd}
        />
      </div>

      {/* ═══ Factor Cards Grid (Why Now / Why Not / Watch Out / Changes) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
        gap: 14,
      }}>
        {plan.whyNow.length > 0 && (
          <FactorCard 
            title={thaiMode ? '✅ ปัจจัยหนุนการซื้อ' : conviction.side === 'SHORT' ? '✅ WHY SHORT? เหตุผลฝั่งขาย' : '✅ WHY LONG? เหตุผลฝั่งซื้อ'} 
            mark="✓" 
            items={plan.whyNow} 
            color={C.green} 
          />
        )}
        {plan.whyNot.length > 0 && (
          <FactorCard 
            title="⚠️ WHAT'S AGAINST? ข้อจำกัด" 
            mark="✕" 
            items={plan.whyNot} 
            color={C.red} 
          />
        )}
        {plan.watchOut.length > 0 && (
          <FactorCard 
            title="🚨 WATCH OUT เฝ้าระวัง" 
            mark="⚠" 
            items={plan.watchOut} 
            color={C.amber} 
          />
        )}
        <FactorCard 
          title="⚡ แผนจะเปลี่ยนเมื่อ (INVALIDATION)" 
          mark="→" 
          items={plan.whatChanges} 
          color={C.purple} 
        />
      </div>

      {/* ═══ Navigation Tabs for In-Depth Radar ═══ */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 2,
      }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px 10px 0 0',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? C.text : C.muted,
                borderTop: `2px solid ${active ? '#F59E0B' : 'transparent'}`,
                borderLeft: `1px solid ${active ? 'var(--border-color)' : 'transparent'}`,
                borderRight: `1px solid ${active ? 'var(--border-color)' : 'transparent'}`,
                borderBottom: 'none',
              }}
            >
              <Icon size={14} style={{ color: active ? '#F59E0B' : 'inherit' }} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Tab Contents ═══ */}
      <div style={{ minHeight: 320 }}>
        {tab === 'deep' && <DeepTab d={data} thaiMode={thaiMode} />}
        {tab === 'macro' && <MacroTab d={data} />}
        {tab === 'intermarket' && <IntermarketTab d={data} />}
        {tab === 'flow' && <FlowTab d={data} />}
        {tab === 'news' && <NewsTab d={data} />}
        {tab === 'plan' && (
          <PlanTab 
            d={data} 
            thaiMode={thaiMode} 
            form={posForm} 
            setForm={setPosForm} 
            onApply={applyPosition} 
            onClear={clearPosition} 
            active={!!activePos} 
          />
        )}
        {tab === 'backtest' && <GoldBacktestPanel />}
        {tab === 'sources' && <SourcesTab d={data} />}
      </div>

      {/* ═══ Footer ═══ */}
      <div style={{
        fontSize: 11,
        color: C.muted,
        textAlign: 'center',
        padding: '16px 20px',
        lineHeight: 1.7,
        borderTop: '1px solid var(--border-color)',
      }}>
        CryptoPro Gold Decision Engine {data.engineVersion} · ประมวลผลเมื่อ {new Date(data.generatedAt).toLocaleString('th-TH')}<br />
        ⚠️ {data.disclaimerTh}
      </div>
    </div>
  );
};

// ─────────────────────────── Decision Grid Component ───────────────────────────

const DecisionGrid: React.FC<{ d: GoldSignalResponse; thaiMode: boolean }> = ({ d, thaiMode }) => {
  const plan = d.tradePlan;
  const sig = plan.signal;
  const e = plan.entry;
  const te = plan.thaiGoldEntry;
  const pos = d.position;
  const t = d.technical;
  const p = d.price;
  const dir = d.conviction.direction;
  const sl = t.structure.lastSwingLow;
  const sh = t.structure.lastSwingHigh;

  // Entry Question
  let whereTitle = 'เข้าแถวไหน (Entry Zone)';
  let whereValue = '';
  let whereSub = '';
  if (te) {
    whereValue = `${thb(te.buyZoneLow)} – ${thb(te.buyZoneHigh)}`;
    whereSub = `จุดดีที่สุด: ${thb(te.bestBuy)} · ห้ามไล่ซื้อเกิน: ${thb(te.chaseAbove)}`;
  } else if (e) {
    whereValue = `${usd(e.entryLow)} – ${usd(e.entryHigh)}`;
    whereSub = `จุดดีที่สุด: ${usd(e.bestEntry)} · ห้ามไล่ราคา${e.side === 'LONG' ? 'เกิน' : 'ต่ำกว่า'}: ${usd(e.chaseLevel)}`;
  } else {
    const pullbackBaht = toThaiGoldBaht(plan.waitLevels.pullbackTo, p);
    whereValue = thaiMode && pullbackBaht 
      ? `รอราคาย่อที่ ${thb(pullbackBaht)} (${usd(plan.waitLevels.pullbackTo)})` 
      : `รอราคาย่อที่ ${usd(plan.waitLevels.pullbackTo)}`;
    whereSub = plan.waitLevels.breakoutAbove 
      ? `หรือรอยืนยัน Breakout เหนือ ${usd(plan.waitLevels.breakoutAbove)}`
      : 'ยังไม่อยู่ในจุดเข้าที่ได้เปรียบ';
  }

  // Stop Loss Question
  let stopTitle = 'ถ้าผิดทางออกตรงไหน (Stop Loss)';
  let stopValue = '';
  let stopSub = '';
  if (te) {
    stopValue = thb(te.invalidation);
    stopSub = `ราคารับซื้อต่ำกว่าระดับนี้ = แผนเสียทันที (ระยะห่าง ${signed(((te.invalidation - (te.bestBuy ?? 1)) / (te.bestBuy ?? 1)) * 100)})`;
  } else if (e) {
    stopValue = usd(e.stopLoss);
    const stopDistance = Math.abs(e.bestEntry - e.stopLoss);
    const stopPct = ((stopDistance / e.bestEntry) * 100).toFixed(2);
    stopSub = `ราคาปิดแท่ง 4H เลยระดับนี้ = แผนเสีย (ห่าง ${usd(stopDistance, 1)} / ${stopPct}%)`;
  } else {
    stopValue = 'กำหนดเมื่อมีจุดเข้า';
    stopSub = 'รอระบบตรวจพบโครงสร้างที่สมบูรณ์';
  }

  // Take Profit Question
  let tpTitle = 'ทำกำไรตรงไหน (Take Profit)';
  let tpValue = '';
  let tpSub = '';
  if (te) {
    tpValue = `TP1: ${thb(te.tp1)} · TP2: ${thb(te.tp2)}`;
    tpSub = `TP3: ${thb(te.tp3)} (ราคารับซื้อ) · คุ้มทุนเมื่อราคาขยับ ${te.breakevenMovePct}%`;
  } else if (e) {
    tpValue = `TP1: ${usd(e.tp1)} · TP2: ${usd(e.tp2)}`;
    tpSub = `TP3: ${usd(e.tp3)} · อัตราทด R:R 1:${e.riskReward} · คาดการณ์ถือ ${e.holdingPeriod}`;
  } else {
    tpValue = 'กำหนดเมื่อมีจุดเข้า';
    tpSub = 'คำนวณตามแนวรับ-ต้านและ Fibonacci';
  }

  // Holding Strategy Question
  let holdTitle = 'ถ้ามีของอยู่ถือต่อไหม (Holding Action)';
  let holdValue = '';
  let holdSub = '';
  if (pos) {
    holdValue = pos.actionDescTh;
    holdSub = `Trailing Stop: ${pos.unit === 'THB' ? thb(pos.trailingStop) : usd(pos.trailingStop)} · กำไรปัจจุบัน: ${signed(pos.profitPct)}`;
  } else if (thaiMode) {
    holdValue = dir === 'SHORT' ? 'มีทองอยู่: ชะลอซื้อเพิ่ม และระวังจุดลดพอร์ต' : 'มีทองอยู่: ถือต่อได้ตามเทรนด์';
    holdSub = sl ? `ระวังหากทองโลกปิด 4H หลุด ${usd(sl)} (${thb(toThaiGoldBaht(sl, p))})` : 'ถือตามแนวโน้มระยะกลาง';
  } else {
    holdValue = dir === 'LONG' ? 'ถือ Long ต่อได้ตามเทรนด์' : dir === 'SHORT' ? 'ถือ Short ต่อได้ตามเทรนด์' : 'ถือตามแผนเดิม ไม่เพิ่มขนาด';
    holdSub = sl ? `Stop ใต้ ${usd(sl)} / Swing High ${usd(sh)}` : 'รักษาขนาดไม้ตามความเสี่ยง';
  }

  // What changes Question
  let changeTitle = 'อะไรจะทำให้แผนเปลี่ยน (Invalidation Triggers)';
  let changeValue = plan.whatChanges[0] || 'การเปลี่ยนแปลงนโยบายดอกเบี้ย Fed หรือตัวเลข CPI';
  let changeSub = plan.whatChanges.slice(1, 3).join(' · ');

  const cards = [
    { num: '1', title: 'ตอนนี้ทำอะไร (Action Now)', value: plan.nowActionTh, sub: sig.descTh, color: sig.color, icon: Target },
    { num: '2', title: whereTitle, value: whereValue, sub: whereSub, color: C.blue, icon: Compass },
    { num: '3', title: stopTitle, value: stopValue, sub: stopSub, color: C.red, icon: ShieldAlert },
    { num: '4', title: tpTitle, value: tpValue, sub: tpSub, color: C.green, icon: Award },
    { num: '5', title: holdTitle, value: holdValue, sub: holdSub, color: C.purple, icon: Activity },
    { num: '6', title: changeTitle, value: changeValue, sub: changeSub, color: C.amber, icon: Zap },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
      gap: 14,
    }}>
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div
            key={c.num}
            style={{
              background: 'var(--bg-card-inner, rgba(255,255,255,0.02))',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: `${c.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                  }}>
                    {c.num}
                  </span>
                  <span>{c.title}</span>
                </span>
                <Icon size={14} style={{ color: c.color, opacity: 0.8 }} />
              </div>

              <div style={{
                fontSize: 15,
                fontWeight: 800,
                color: C.text,
                lineHeight: 1.4,
                marginTop: 4,
              }}>
                {c.value}
              </div>
            </div>

            {c.sub && (
              <div style={{
                fontSize: 11,
                color: C.muted,
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--border-color)',
                lineHeight: 1.4,
              }}>
                {c.sub}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────── Reusable Small Elements ───────────────────────────

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'var(--bg-card, #111827)',
    borderRadius: 16,
    padding: '18px',
    border: '1px solid var(--border-color)',
    minWidth: 0,
    ...style,
  }}>
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
    {children}
  </div>
);

const Small: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <div style={{ fontSize: 11, color: color ?? C.muted, marginTop: 8, lineHeight: 1.6 }}>{children}</div>
);

const Bar: React.FC<{ value: number | null; color: string }> = ({ value, color }) => (
  <div style={{ height: 6, background: 'var(--bg-card-inner)', borderRadius: 3, overflow: 'hidden' }}>
    <div style={{
      width: `${Math.max(0, Math.min(100, value ?? 0))}%`,
      height: '100%',
      borderRadius: 3,
      background: color,
      transition: 'width 0.4s ease-out',
    }} />
  </div>
);

const Box: React.FC<{ label: string; value: string; color: string; sub?: string }> = ({ label, value, color, sub }) => (
  <div style={{
    background: 'var(--bg-card-inner)',
    borderRadius: 10,
    padding: '10px 12px',
    border: '1px solid var(--border-color)',
    minWidth: 0,
  }}>
    <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color, overflowWrap: 'anywhere' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Banner: React.FC<{ color: string; icon: string; title: string; text: string }> = ({ color, icon, title, text }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: `1px solid ${color}44`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 12,
    padding: '12px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{title}</div>
      <div style={{ fontSize: 12, color: C.text, marginTop: 2 }}>{text}</div>
    </div>
  </div>
);

const FactorCard: React.FC<{ title: string; mark: string; items: string[]; color: string }> = ({ title, mark, items, color }) => (
  <Card>
    <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>{title}</span>
    </div>
    {items.map((it, i) => (
      <div key={i} style={{
        fontSize: 12,
        color: C.text,
        padding: '6px 0',
        borderBottom: i < items.length - 1 ? '1px solid var(--border-color)' : 'none',
        display: 'flex',
        gap: 8,
        lineHeight: 1.5,
      }}>
        <span style={{ color, fontWeight: 900 }}>{mark}</span>
        <span>{it}</span>
      </div>
    ))}
  </Card>
);

const chip = (color: string): React.CSSProperties => ({
  fontSize: 10,
  padding: '3px 8px',
  borderRadius: 6,
  fontWeight: 700,
  color,
  border: `1px solid ${color}44`,
  background: `${color}15`,
  whiteSpace: 'nowrap',
});

// ─────────────────────────── Tab Components ───────────────────────────

const DeepTab: React.FC<{ d: GoldSignalResponse; thaiMode: boolean }> = ({ d, thaiMode }) => {
  const t = d.technical;
  const p = d.price;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
      gap: 16,
    }}>
      {/* Multi-TF Trend */}
      <Card>
        <Title>🧭 Multi-Timeframe Trend Alignment</Title>
        {t.trendAlignment.perTimeframe.map(x => (
          <div key={x.timeframe} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            padding: '7px 0',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <span style={{ fontWeight: 800, color: C.text, width: 40 }}>{x.timeframe}</span>
            <span style={chip(impactColor(x.bias))}>{x.bias}</span>
            <span style={{ color: C.muted, fontSize: 11 }}>
              EMA20 {x.ema20 ? `$${x.ema20}` : '—'} · EMA50 {x.ema50 ? `$${x.ema50}` : '—'}
            </span>
          </div>
        ))}
        <Small>{t.trendAlignment.descTh}</Small>
        <Small>🏗 โครงสร้างราคา: {t.structure.pattern} — {t.structure.descTh}</Small>
      </Card>

      {/* Multi-TF RSI Matrix */}
      <Card>
        <Title>📈 Multi-Timeframe RSI Heatmap</Title>
        {t.rsiMatrix.timeframes.map(x => (
          <div key={x.timeframe} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, width: 36, fontWeight: 700, color: C.text }}>{x.timeframe}</span>
            <div style={{ flex: 1 }}><Bar value={x.value} color={x.color} /></div>
            <span style={{ fontSize: 12, fontWeight: 800, width: 28, textAlign: 'right', color: x.color }}>
              {x.value ?? '—'}
            </span>
            <span style={{ fontSize: 10, color: C.muted, width: 80 }}>{x.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--bg-card-inner)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>สถานะ RSI ภาพรวม: {t.rsiMatrix.overallStatus}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{t.rsiMatrix.interpretationTh}</div>
        </div>
      </Card>

      {/* Technical Score Pillars */}
      <Card>
        <Title>📊 องค์ประกอบทางเทคนิค (Technical Pillars)</Title>
        {[
          { l: 'Trend Alignment', s: t.trendAlignment.score, d: t.trendAlignment.direction },
          { l: 'Market Structure', s: t.structure.score, d: t.structure.trend },
          { l: 'Momentum', s: t.momentum.score, d: t.momentum.descTh },
          { l: 'Breakout Potential', s: t.breakout.score, d: t.breakout.descTh },
          { l: 'Entry Location (Mean Rev.)', s: t.meanReversion.score, d: t.meanReversion.descTh },
        ].map(x => (
          <div key={x.l} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{x.l}</span>
              <span style={{ color: scoreColor(x.s), fontWeight: 800 }}>{x.s}/100</span>
            </div>
            <Bar value={x.s} color={scoreColor(x.s)} />
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{x.d}</div>
          </div>
        ))}
        <Small>{t.volatility.descTh}</Small>
      </Card>

      {/* Key Price Levels */}
      <Card>
        <Title>📍 แนวรับ–แนวต้านสำคัญ (Key Levels)</Title>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>แนวต้าน (Resistances)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {t.supportResistance.resistances.map(v => (
              <span key={v} style={chip(C.red)}>
                {usd(v)} {thaiMode && p.thaiGoldBarSell ? `(${thb(toThaiGoldBaht(v, p))})` : ''}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4 }}>แนวรับ (Supports)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {t.supportResistance.supports.map(v => (
              <span key={v} style={chip(C.green)}>
                {usd(v)} {thaiMode && p.thaiGoldBarSell ? `(${thb(toThaiGoldBaht(v, p))})` : ''}
              </span>
            ))}
          </div>
        </div>

        <Small>VWAP: {t.vwap.descTh}</Small>
        <Small>Fibonacci: {t.fibonacci.descTh} · 38.2% ${t.fibonacci.levels.fib382} · 50.0% ${t.fibonacci.levels.fib500}</Small>
      </Card>
    </div>
  );
};

const MacroTab: React.FC<{ d: GoldSignalResponse }> = ({ d }) => {
  const m = d.macro;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
      gap: 16,
    }}>
      <Card>
        <Title>🏛️ Fed Policy, Real Yield & Treasury</Title>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Box label="Fed Bias (Market-Implied)" value={m.fedBias} color={m.fedBias === 'DOVISH' ? C.green : m.fedBias === 'HAWKISH' ? C.red : C.amber} />
          <Box label="Yield Curve 2Y − 3M" value={m.policySpread2y3m != null ? `${m.policySpread2y3m} bp` : '—'} color={C.blue} />
          <Box label="US 10Y Benchmark" value={m.us10yYield != null ? `${m.us10yYield}%` : '—'} color={C.purple} />
          <Box label="Real Yield 10Y (TIPS)" value={m.realYield10y != null ? `${m.realYield10y}%` : '—'} color={m.realYieldTrend === 'FALLING' ? C.green : m.realYieldTrend === 'RISING' ? C.red : C.amber} sub={`Trend: ${m.realYieldTrend}`} />
        </div>
        <Small>{m.rateCutExpectation}</Small>
        <Small>{m.summaryTh}</Small>
      </Card>

      <Card>
        <Title>📊 ตัวเลขเศรษฐกิจสำคัญสหรัฐฯ (BLS & Fed)</Title>
        {m.recentEvents.length === 0 ? <Small>ไม่มีข้อมูลตัวเลขเศรษฐกิจ</Small> : (
          m.recentEvents.map(e => (
            <div key={e.name} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.name} ({e.period})</span>
                <span style={chip(impactColor(e.goldImpact))}>{e.goldImpact} GOLD</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>จริง: <strong style={{ color: C.text }}>{e.actual}</strong></span>
                <span>คาด: {e.expected ?? '—'}</span>
                <span>ก่อนหน้า: {e.previous}</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{e.reasonTh}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

const IntermarketTab: React.FC<{ d: GoldSignalResponse }> = ({ d }) => (
  <Card>
    <Title>🌐 Intermarket Macro Correlates — ดอลลาร์, บอนด์, โลหะเงิน และน้ำมัน</Title>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {['สินทรัพย์', 'ราคา / ดัชนี', '5 วัน (%)', 'สหสัมพันธ์กับทอง (60d)', 'ผลกระทบต่อทองคำ'].map(h => (
              <th key={h} style={{ padding: '8px', textAlign: 'left', color: C.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.intermarket.items.map((i: IntermarketItem) => (
            <tr key={i.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '8px', fontWeight: 700, color: C.text }}>{i.name}</td>
              <td style={{ padding: '8px', fontWeight: 800 }}>{i.value}</td>
              <td style={{ padding: '8px', color: (i.change5dPct ?? 0) >= 0 ? C.green : C.red }}>{signed(i.change5dPct)}</td>
              <td style={{ padding: '8px', color: C.muted }}>{i.correlation60d != null ? i.correlation60d.toFixed(2) : '—'}</td>
              <td style={{ padding: '8px' }}><span style={chip(impactColor(i.goldImpact))}>{i.goldImpact}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Small>{d.intermarket.summaryTh}</Small>
  </Card>
);

const FlowTab: React.FC<{ d: GoldSignalResponse }> = ({ d }) => {
  const f = d.orderFlow;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
      gap: 16,
    }}>
      <Card>
        <Title>🔄 COMEX Order Flow Proxy — วิเคราะห์ Volume & แรงซื้อขาย</Title>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, color: f.state.includes('ACCUM') ? C.green : f.state.includes('DISTRI') ? C.red : C.amber }}>
          {f.state.replace('_', ' ')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Box label="Volume 24h" value={f.comexVolume24h?.toLocaleString() ?? '—'} color={C.blue} />
          <Box label="Relative Volume (RVOL)" value={f.rvol != null ? `${f.rvol}x` : '—'} color={f.rvol != null && f.rvol > 1.2 ? C.green : C.muted} />
          <Box label="CVD Proxy (24h)" value={f.cvdProxy24h?.toLocaleString() ?? '—'} color={f.cvdDirection === 'POSITIVE' ? C.green : C.red} />
          <Box label="Absorption Detected" value={f.absorption ? 'ตรวจพบ' : 'ไม่พบ'} color={f.absorption ? C.amber : C.muted} />
        </div>
        <Small>{f.interpretationTh}</Small>
      </Card>

      <Card>
        <Title>📑 CFTC Commitments of Traders (COT Report)</Title>
        {!f.cot ? <Small>ไม่มีข้อมูล COT สัปดาห์ล่าสุด</Small> : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Box label="Open Interest" value={f.cot.openInterest.toLocaleString()} color={C.purple} />
              <Box label="OI Change (Week)" value={signed(f.cot.oiChangeWeek, '', 0)} color={f.cot.oiChangeWeek >= 0 ? C.green : C.red} />
              <Box label="Speculator Net Longs" value={f.cot.specNet.toLocaleString()} color={C.blue} />
              <Box label="26-Week Percentile" value={`${f.cot.specNetPercentile26w}%`} color={f.cot.specNetPercentile26w >= 85 ? C.red : C.muted} />
            </div>
            <Small>{f.cot.priceVsOi} · ข้อมูล ณ {f.cot.reportDate}</Small>
          </div>
        )}
      </Card>
    </div>
  );
};

const NewsTab: React.FC<{ d: GoldSignalResponse }> = ({ d }) => (
  <div style={{ display: 'grid', gap: 16 }}>
    <Card>
      <Title>📰 ข่าวกรองและปัจจัยพื้นฐานทองคำ (Gold Intelligence)</Title>
      {d.news.latestEvents.length === 0 ? <Small>ไม่มีข้อมูลข่าว</Small> : (
        d.news.latestEvents.map(n => (
          <div key={n.headline} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <a href={n.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: C.text, textDecoration: 'none' }}>
              {n.headline}
            </a>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
              <span style={chip(impactColor(n.goldEffect))}>{n.goldEffect}</span>
              <span>แหล่ง: {n.source}</span>
              <span>Impact: {n.impact}</span>
              <span>{new Date(n.timestampIso).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))
      )}
    </Card>
  </div>
);

const PlanTab: React.FC<{
  d: GoldSignalResponse; 
  thaiMode: boolean; 
  form: PosForm; 
  setForm: (f: PosForm) => void; 
  onApply: () => void; 
  onClear: () => void; 
  active: boolean;
}> = ({ d, thaiMode, form, setForm, onApply, onClear, active }) => {
  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 13,
    background: 'var(--bg-card-inner)',
    color: C.text,
    border: '1px solid var(--border-color)',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 4,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
      gap: 16,
    }}>
      <Card>
        <Title>📌 บันทึก Position เพื่อติดตามกลยุทธ์ Real-time</Title>
        <div style={{ display: 'grid', gap: 10 }}>
          {!thaiMode && (
            <div style={{ display: 'flex', gap: 6 }}>
              {(['LONG', 'SHORT'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, side: s })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: form.side === s ? (s === 'LONG' ? C.green : C.red) : 'var(--bg-card-inner)',
                    color: form.side === s ? '#FFF' : C.muted,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
            {thaiMode ? 'ราคาที่ซื้อ (บาท/บาททองคำ)' : 'ราคาเข้า (USD)'}
            <input
              type="number"
              value={form.entry}
              onChange={e => setForm({ ...form, entry: e.target.value })}
              placeholder={thaiMode ? 'เช่น 44250' : 'เช่น 4150'}
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
            Stop Loss (ไม่บังคับ — ระบบจะใช้โครงสร้างคำนวณให้)
            <input
              type="number"
              value={form.stop}
              onChange={e => setForm({ ...form, stop: e.target.value })}
              placeholder="Stop Loss"
              style={inputStyle}
            />
          </label>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={onApply}
              disabled={!form.entry}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#FFF',
                border: 'none',
                cursor: 'pointer',
                opacity: form.entry ? 1 : 0.5,
              }}
            >
              เริ่มติดตาม Position
            </button>
            {active && (
              <button
                onClick={onClear}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'var(--bg-card-inner)',
                  color: C.muted,
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                ล้างข้อมูล
              </button>
            )}
          </div>
        </div>
      </Card>

      {d.position ? (
        <Card>
          <Title>📊 สถานะ Position ปัจจุบัน</Title>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>
            {d.position.actionDescTh}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Box label="กำไร / ขาดทุน" value={signed(d.position.profitPct)} color={d.position.profitPct >= 0 ? C.green : C.red} />
            <Box label="R-Multiple" value={signed(d.position.profitR, 'R', 1)} color={C.purple} />
            <Box label="Trailing Stop" value={d.position.unit === 'THB' ? thb(d.position.trailingStop) : usd(d.position.trailingStop)} color={C.red} />
            <Box label="Thesis Health" value={`${d.position.thesisHealth}/100`} color={scoreColor(d.position.thesisHealth)} />
          </div>
        </Card>
      ) : (
        <Card>
          <Title>🧭 กฎการบริหารพอร์ตและ Trailing Stop มาตรฐาน</Title>
          {[
            'ก่อนถึง 1R: ยึด Stop เดิมตามแผน ไม่ขยับหนีความเสี่ยง',
            'เมื่อกำไรถึง 1R: ยก Stop มาที่จุดคุ้มทุน (Break-even)',
            'ถึง TP1: ทยอยขาย 30–50% และตั้ง Trailing Stop ตาม ATR',
            'ถึง TP2: ขายทำกำไรหลัก รันส่วนที่เหลือด้วย Trailing Stop',
            'เมื่อโครงสร้าง CHOCH สวนทาง: ปิดสถานะทันทีเพื่อปกป้องเงินทุน',
          ].map(r => (
            <div key={r} style={{ fontSize: 12, color: C.text, padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              • {r}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

const SourcesTab: React.FC<{ d: GoldSignalResponse }> = ({ d }) => (
  <Card>
    <Title>🛰️ สถานะแหล่งข้อมูล Real-time</Title>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {['ข้อมูล', 'แหล่งที่มา', 'สถานะ', 'อายุแคช'].map(h => (
              <th key={h} style={{ padding: '8px', textAlign: 'left', color: C.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.dataSources.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '8px', color: C.text, fontWeight: 600 }}>{s.label}</td>
              <td style={{ padding: '8px', color: C.muted }}>{s.source}</td>
              <td style={{ padding: '8px' }}>
                <span style={chip(s.status === 'LIVE' ? C.green : s.status === 'STALE' ? C.amber : C.red)}>
                  {s.status}
                </span>
              </td>
              <td style={{ padding: '8px', color: C.muted }}>{s.ageSec}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

export default GoldSignalPage;
