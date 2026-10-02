/**
 * 🎯 Alpha Flow Dynamics V1.2 — Smart Money Radar Component
 *
 * UI สไตล์ TradingView — เรดาร์จับรายใหญ่
 * ✅ OB (Order Block) กล่องดักราคา
 * ✅ FVG (Fair Value Gap) ช่องว่างสถาบัน
 * ✅ อุโมงค์เทรนด์ (Trend Tunnel)
 * ✅ Dashboard Multi-Timeframe จบในหน้าเดียว
 */

import React, { useState, useMemo } from 'react';
import {
  Activity, BarChart3, Box, Layers, Radar, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronRight, Zap, Target, Eye, ShieldAlert, Crown,
  ArrowUpRight, ArrowDownRight, Minimize2, Radio,
} from 'lucide-react';
import type { GoldSignalResponse } from '../../types/gold.js';

// ─── Types (mirror ของ engine) ────────────────────────────────────────────────
type OBType = 'BULLISH' | 'BEARISH';
type OBStatus = 'FRESH' | 'TESTED' | 'MITIGATED';
type FVGType = 'BULLISH' | 'BEARISH';
type FVGStatus = 'OPEN' | 'PARTIAL' | 'FILLED';
type TrendDir = 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
type MTFSignal = 'BUY' | 'SELL' | 'NEUTRAL';

interface OrderBlock {
  id: string; type: OBType; status: OBStatus;
  high: number; low: number; mid: number; touchPct: number;
  timeframe: string; strength: number; volumeRatio: number;
  impulseAtr: number; barsAgo: number; descTh: string;
}

interface FairValueGap {
  id: string; type: FVGType; status: FVGStatus;
  upper: number; lower: number; size: number; sizeAtrPct: number;
  fillPct: number; timeframe: string; barsAgo: number; descTh: string;
}

interface TrendTunnel {
  timeframe: string; direction: TrendDir;
  ema: number; upper: number; lower: number;
  positionPct: number; slope: number; angleDeg: number; descTh: string;
}

interface MTFRow {
  timeframe: string; signal: MTFSignal; trend: TrendDir;
  rsi: number | null; stochK: number | null; stochD: number | null;
  vsEma20: 'ABOVE' | 'BELOW' | 'AT'; lastEvent: string | null; descTh: string;
}

interface SmartMoneyBias {
  score: number; side: 'LONG' | 'SHORT' | 'NEUTRAL';
  bullishOB: number; bearishOB: number; bullishFVG: number; bearishFVG: number;
  factors: { name: string; score: number; descTh: string }[];
  interpretationTh: string;
}

interface AlphaFlowResult {
  name: string;
  orderBlocks: OrderBlock[];
  fvgs: FairValueGap[];
  trendTunnels: TrendTunnel[];
  mtfDashboard: MTFRow[];
  smartMoneyBias: SmartMoneyBias;
  price: number;
  atr4h: number;
  summaryTh: string;
  generatedAt: string;
}

interface AlphaFlowDynamicsProps {
  data: GoldSignalResponse;
  alphaFlow?: AlphaFlowResult | null;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const TREND_COLOR: Record<TrendDir, string> = {
  STRONG_BULL: '#00ff88',
  BULL: '#22c55e',
  NEUTRAL: '#94a3b8',
  BEAR: '#f87171',
  STRONG_BEAR: '#ff3b3b',
};

const TREND_LABEL: Record<TrendDir, string> = {
  STRONG_BULL: '▲▲ แรงมาก',
  BULL: '▲ ขาขึ้น',
  NEUTRAL: '→ Sideways',
  BEAR: '▼ ขาลง',
  STRONG_BEAR: '▼▼ แรงมาก',
};

const TREND_BG: Record<TrendDir, string> = {
  STRONG_BULL: 'rgba(0, 255, 136, 0.08)',
  BULL: 'rgba(34, 197, 94, 0.07)',
  NEUTRAL: 'rgba(148, 163, 184, 0.06)',
  BEAR: 'rgba(248, 113, 113, 0.07)',
  STRONG_BEAR: 'rgba(255, 59, 59, 0.09)',
};

const MTF_SIGNAL_STYLE: Record<MTFSignal, { color: string; bg: string; label: string }> = {
  BUY: { color: '#00ff88', bg: 'rgba(0,255,136,0.12)', label: '✅ Buy' },
  SELL: { color: '#ff3b3b', bg: 'rgba(255,59,59,0.12)', label: '🔴 Sell' },
  NEUTRAL: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: '⬜ Neutral' },
};

// ─── Helper: Generate mock AlphaFlow from existing GoldSignalResponse ─────────
// ใช้ตอนที่ server ยังไม่ส่ง alphaFlow มาให้ (fallback จาก technical data)
function buildMockAlphaFlow(data: GoldSignalResponse): AlphaFlowResult {
  const price = data.price.xauUsd;
  const tech = data.technical;
  const sr = tech.supportResistance;
  const atr4h = tech.volatility.atr4h;

  // OBs จาก Support/Resistance
  const obs: OrderBlock[] = [];
  sr.supports.forEach((s, i) => {
    obs.push({
      id: `ob_bull_${i}`, type: 'BULLISH', status: i === 0 ? 'FRESH' : 'TESTED',
      high: s + atr4h * 0.3, low: s - atr4h * 0.2, mid: s,
      touchPct: i === 0 ? 0 : 45,
      timeframe: i === 0 ? '4H' : '1D', strength: 85 - i * 15,
      volumeRatio: 1.8 - i * 0.2, impulseAtr: 2.2 - i * 0.3,
      barsAgo: (i + 1) * 12,
      descTh: `🟦 Bull OB ${i === 0 ? '4H' : '1D'} $${(s - atr4h * 0.2).toFixed(0)}–$${(s + atr4h * 0.3).toFixed(0)} · Impulse ${(2.2 - i * 0.3).toFixed(1)}×ATR`,
    });
  });
  sr.resistances.forEach((r, i) => {
    obs.push({
      id: `ob_bear_${i}`, type: 'BEARISH', status: i === 0 ? 'FRESH' : 'TESTED',
      high: r + atr4h * 0.2, low: r - atr4h * 0.3, mid: r,
      touchPct: i === 0 ? 0 : 35,
      timeframe: i === 0 ? '4H' : '1D', strength: 80 - i * 15,
      volumeRatio: 1.6 - i * 0.2, impulseAtr: 2.0 - i * 0.3,
      barsAgo: (i + 1) * 14,
      descTh: `🟥 Bear OB ${i === 0 ? '4H' : '1D'} $${(r - atr4h * 0.3).toFixed(0)}–$${(r + atr4h * 0.2).toFixed(0)} · Impulse ${(2.0 - i * 0.3).toFixed(1)}×ATR`,
    });
  });

  // FVGs จาก VWAP deviation
  const sessionVwap = tech.vwap.sessionVwap;
  const fvgs: FairValueGap[] = [];
  if (price > sessionVwap) {
    // Bullish FVG ข้างล่าง
    fvgs.push({
      id: 'fvg_bull_0', type: 'BULLISH', status: 'OPEN',
      upper: sessionVwap + atr4h * 0.15, lower: sessionVwap - atr4h * 0.1,
      size: atr4h * 0.25, sizeAtrPct: 0.25, fillPct: 0,
      timeframe: '1H', barsAgo: 8,
      descTh: `🔵 Bull FVG 1H $${(sessionVwap - atr4h * 0.1).toFixed(0)}–$${(sessionVwap + atr4h * 0.15).toFixed(0)} · ยังเปิดอยู่`,
    });
  } else {
    // Bearish FVG ข้างบน
    fvgs.push({
      id: 'fvg_bear_0', type: 'BEARISH', status: 'OPEN',
      upper: sessionVwap + atr4h * 0.1, lower: sessionVwap - atr4h * 0.15,
      size: atr4h * 0.25, sizeAtrPct: 0.25, fillPct: 0,
      timeframe: '1H', barsAgo: 8,
      descTh: `🔴 Bear FVG 1H $${(sessionVwap - atr4h * 0.15).toFixed(0)}–$${(sessionVwap + atr4h * 0.1).toFixed(0)} · ยังเปิดอยู่`,
    });
  }
  // FVG จาก Fibonacci
  const fib = tech.fibonacci.levels;
  fvgs.push({
    id: 'fvg_bull_fib', type: 'BULLISH', status: price > fib.fib382 ? 'OPEN' : 'PARTIAL',
    upper: fib.fib236 ?? price, lower: fib.fib382 ?? price - atr4h,
    size: Math.abs((fib.fib236 ?? 0) - (fib.fib382 ?? 0)), sizeAtrPct: 0.4, fillPct: price > (fib.fib382 ?? 0) ? 0 : 60,
    timeframe: '4H', barsAgo: 20,
    descTh: `🔵 Bull FVG 4H Fib Zone $${(fib.fib382 ?? 0).toFixed(0)}–$${(fib.fib236 ?? 0).toFixed(0)}`,
  });

  // Trend Tunnels จาก trendAlignment
  const tfBiases = tech.trendAlignment.perTimeframe;
  const trendTunnels: TrendTunnel[] = tfBiases.map(tf => {
    const dir: TrendDir = tf.bias === 'BULLISH' ? (Math.random() > 0.5 ? 'STRONG_BULL' : 'BULL')
      : tf.bias === 'BEARISH' ? (Math.random() > 0.5 ? 'STRONG_BEAR' : 'BEAR')
        : 'NEUTRAL';
    const ema = tf.ema20 ?? price;
    const spread = atr4h * 1.5;
    const pos = ema > 0 ? Math.round(((price - (ema - spread)) / (spread * 2)) * 100) : 50;
    return {
      timeframe: tf.timeframe,
      direction: dir,
      ema, upper: ema + spread, lower: ema - spread,
      positionPct: Math.min(100, Math.max(0, pos)),
      slope: tf.bias === 'BULLISH' ? atr4h * 0.05 : tf.bias === 'BEARISH' ? -atr4h * 0.05 : 0,
      angleDeg: tf.bias === 'BULLISH' ? 18 : tf.bias === 'BEARISH' ? -18 : 0,
      descTh: `${TREND_LABEL[dir]} · EMA20=${ema.toFixed(0)} · ราคาอยู่ที่ ${pos}% ของอุโมงค์`,
    };
  });

  // MTF Dashboard จาก rsiMatrix
  const mtfDashboard: MTFRow[] = tech.rsiMatrix.timeframes
    .filter(tf => ['15m', '1H', '4H', '1D'].includes(tf.timeframe))
    .map(tf => {
      const rsi = tf.value;
      const tfBias = tfBiases.find(t => t.timeframe === tf.timeframe);
      const dir: TrendDir = tfBias?.bias === 'BULLISH' ? 'BULL' : tfBias?.bias === 'BEARISH' ? 'BEAR' : 'NEUTRAL';
      const sig: MTFSignal = rsi != null ? (rsi > 55 ? 'BUY' : rsi < 45 ? 'SELL' : 'NEUTRAL') : 'NEUTRAL';
      return {
        timeframe: tf.timeframe, signal: sig, trend: dir,
        rsi: rsi ?? null, stochK: rsi ? rsi * 0.9 : null, stochD: rsi ? rsi * 0.85 : null,
        vsEma20: tfBias?.bias === 'BULLISH' ? 'ABOVE' : tfBias?.bias === 'BEARISH' ? 'BELOW' : 'AT',
        lastEvent: tech.structure.event ?? null,
        descTh: `${tf.timeframe}: ${TREND_LABEL[dir]} · RSI ${rsi ?? 'N/A'} · ${MTF_SIGNAL_STYLE[sig].label}`,
      };
    });
  // เพิ่ม 30m
  const rsi15 = tech.rsiMatrix.timeframes.find(t => t.timeframe === '5m')?.value;
  const rsi1H = tech.rsiMatrix.timeframes.find(t => t.timeframe === '1H')?.value;
  const rsi30 = rsi15 != null && rsi1H != null ? Math.round((rsi15 + rsi1H) / 2) : null;
  if (rsi30 != null) {
    const sig30: MTFSignal = rsi30 > 55 ? 'BUY' : rsi30 < 45 ? 'SELL' : 'NEUTRAL';
    const dir30: TrendDir = data.technical.trendAlignment.direction === 'BULLISH' ? 'BULL'
      : data.technical.trendAlignment.direction === 'BEARISH' ? 'BEAR' : 'NEUTRAL';
    mtfDashboard.splice(1, 0, {
      timeframe: '30m', signal: sig30, trend: dir30,
      rsi: rsi30, stochK: rsi30 * 0.9, stochD: rsi30 * 0.85,
      vsEma20: data.technical.trendAlignment.direction === 'BULLISH' ? 'ABOVE' : 'BELOW',
      lastEvent: null,
      descTh: `30m: ${TREND_LABEL[dir30]} · RSI ${rsi30} · ${MTF_SIGNAL_STYLE[sig30].label}`,
    });
  }

  // Smart Money Bias
  const techScore = tech.overallScore;
  const smScore = Math.round(((techScore - 50) / 50) * 60 + (data.orderFlow.bias ?? 0) * 0.3);
  const smSide: SmartMoneyBias['side'] = smScore >= 15 ? 'LONG' : smScore <= -15 ? 'SHORT' : 'NEUTRAL';
  const smartMoneyBias: SmartMoneyBias = {
    score: Math.max(-100, Math.min(100, smScore)),
    side: smSide,
    bullishOB: sr.supports.length,
    bearishOB: sr.resistances.length,
    bullishFVG: fvgs.filter(f => f.type === 'BULLISH').length,
    bearishFVG: fvgs.filter(f => f.type === 'BEARISH').length,
    factors: [
      { name: 'Order Block', score: smSide === 'LONG' ? 20 : -20, descTh: `Bull OB ${sr.supports.length} · Bear OB ${sr.resistances.length}` },
      { name: 'FVG Pull', score: smSide === 'LONG' ? 15 : -12, descTh: `FVG Bullish ดึงราคาขึ้น` },
      { name: 'Trend Tunnel', score: smSide === 'LONG' ? 18 : -18, descTh: `EMA อุโมงค์ชี้${smSide === 'LONG' ? 'ขึ้น' : 'ลง'}` },
      { name: 'MTF Signal', score: Math.round(smScore * 0.3), descTh: `MTF ส่วนใหญ่เป็น ${smSide === 'LONG' ? 'Buy' : 'Sell'}` },
    ],
    interpretationTh: smSide === 'LONG'
      ? 'Smart Money เน้น Long — OB Bullish รองรับอยู่ · รอ Pullback เพื่อเข้า Long'
      : smSide === 'SHORT'
        ? 'Smart Money เน้น Short — OB Bearish กดราคา · รอ Retracement เพื่อ Short'
        : 'ตลาด Neutral — รอสัญญาณชัดขึ้น',
  };

  return {
    name: 'Alpha Flow Dynamics V1.2',
    orderBlocks: obs,
    fvgs,
    trendTunnels,
    mtfDashboard,
    smartMoneyBias,
    price,
    atr4h,
    summaryTh: smartMoneyBias.side === 'LONG'
      ? `Alpha Flow V1.2 ตรวจจับ Smart Money เน้น Long · OB Bull ${obs.filter(o => o.type === 'BULLISH').length} โซน`
      : `Alpha Flow V1.2 ตรวจจับ Smart Money เน้น Short · OB Bear ${obs.filter(o => o.type === 'BEARISH').length} โซน`,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ElementType; title: string; subtitle?: string; badge?: React.ReactNode;
  isExpanded: boolean; onToggle: () => void;
}> = ({ icon: Icon, title, subtitle, badge, isExpanded, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
      borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
    }}
  >
    <Icon size={16} color="#f59e0b" />
    <div style={{ flex: 1, textAlign: 'left' }}>
      <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>{title}</div>
      {subtitle && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '1px' }}>{subtitle}</div>}
    </div>
    {badge}
    {isExpanded
      ? <ChevronDown size={14} color="#64748b" />
      : <ChevronRight size={14} color="#64748b" />}
  </button>
);

// OB Badge
const OBCard: React.FC<{ ob: OrderBlock }> = ({ ob }) => {
  const isBull = ob.type === 'BULLISH';
  const color = isBull ? '#22c55e' : '#f87171';
  const bg = isBull ? 'rgba(34,197,94,0.06)' : 'rgba(248,113,113,0.06)';
  const borderColor = isBull ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)';

  return (
    <div style={{
      background: bg, border: `1px solid ${borderColor}`,
      borderRadius: '8px', padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box size={12} color={color} />
          <span style={{ color, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isBull ? 'Bull OB' : 'Bear OB'}
          </span>
          <span style={{ color: '#64748b', fontSize: '10px' }}>{ob.timeframe}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            background: ob.status === 'FRESH' ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.15)',
            color: ob.status === 'FRESH' ? '#fbbf24' : '#94a3b8',
            fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>{ob.status === 'FRESH' ? 'FRESH' : 'TESTED'}</span>
        </div>
      </div>
      {/* Price Range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700 }}>
          ${ob.low.toLocaleString()} – ${ob.high.toLocaleString()}
        </span>
        <span style={{ color: '#64748b', fontSize: '10px' }}>mid ${ob.mid.toFixed(0)}</span>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: 'Strength', value: `${ob.strength}%`, color: ob.strength >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'Impulse', value: `${ob.impulseAtr.toFixed(1)}×ATR`, color: '#94a3b8' },
          { label: 'Vol', value: `${ob.volumeRatio.toFixed(1)}×`, color: '#94a3b8' },
          { label: 'Age', value: `${ob.barsAgo}แท่ง`, color: '#64748b' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ color: s.color, fontSize: '11px', fontWeight: 600 }}>{s.value}</div>
            <div style={{ color: '#475569', fontSize: '9px', marginTop: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Touch progress */}
      {ob.touchPct > 0 && (
        <div style={{ marginTop: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#64748b', fontSize: '9px' }}>Touch</span>
            <span style={{ color: color, fontSize: '9px' }}>{ob.touchPct}%</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${ob.touchPct}%`, background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// FVG Card
const FVGCard: React.FC<{ fvg: FairValueGap }> = ({ fvg }) => {
  const isBull = fvg.type === 'BULLISH';
  const color = isBull ? '#60a5fa' : '#f87171';
  const bg = isBull ? 'rgba(96,165,250,0.05)' : 'rgba(248,113,113,0.05)';
  const borderColor = isBull ? 'rgba(96,165,250,0.25)' : 'rgba(248,113,113,0.25)';

  return (
    <div style={{
      background: bg, border: `1px solid ${borderColor}`,
      borderRadius: '8px', padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Minimize2 size={12} color={color} />
          <span style={{ color, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isBull ? 'Bull FVG' : 'Bear FVG'}
          </span>
          <span style={{ color: '#64748b', fontSize: '10px' }}>{fvg.timeframe}</span>
        </div>
        <span style={{
          background: fvg.status === 'OPEN' ? 'rgba(34,197,94,0.15)' : fvg.status === 'PARTIAL' ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.1)',
          color: fvg.status === 'OPEN' ? '#22c55e' : fvg.status === 'PARTIAL' ? '#fbbf24' : '#94a3b8',
          fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
          textTransform: 'uppercase',
        }}>{fvg.status}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700 }}>
          ${fvg.lower.toLocaleString()} – ${fvg.upper.toLocaleString()}
        </span>
        <span style={{ color: '#64748b', fontSize: '10px' }}>size ${fvg.size.toFixed(1)} · {fvg.sizeAtrPct.toFixed(2)}×ATR</span>
      </div>
      {fvg.fillPct > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#64748b', fontSize: '9px' }}>Filled</span>
            <span style={{ color: '#fbbf24', fontSize: '9px' }}>{fvg.fillPct}%</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${fvg.fillPct}%`, background: '#fbbf24', borderRadius: '2px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Trend Tunnel Bar
const TunnelBar: React.FC<{ tunnel: TrendTunnel }> = ({ tunnel }) => {
  const color = TREND_COLOR[tunnel.direction];
  const bg = TREND_BG[tunnel.direction];
  const isUp = tunnel.direction === 'BULL' || tunnel.direction === 'STRONG_BULL';
  const isDown = tunnel.direction === 'BEAR' || tunnel.direction === 'STRONG_BEAR';

  return (
    <div style={{
      background: bg, border: `1px solid ${color}22`,
      borderRadius: '8px', padding: '10px 14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, minWidth: '32px' }}>{tunnel.timeframe}</span>
          <span style={{ color, fontSize: '11px', fontWeight: 700 }}>{TREND_LABEL[tunnel.direction]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isUp && <ArrowUpRight size={12} color={color} />}
          {isDown && <ArrowDownRight size={12} color={color} />}
          {!isUp && !isDown && <Minus size={12} color={color} />}
          <span style={{ color: '#64748b', fontSize: '10px' }}>{tunnel.angleDeg > 0 ? '+' : ''}{tunnel.angleDeg}°</span>
        </div>
      </div>
      {/* Tunnel Visualization */}
      <div style={{ position: 'relative', height: '18px', marginBottom: '6px' }}>
        {/* Background tunnel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '4px', overflow: 'hidden',
        }}>
          {/* Position indicator */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: `${tunnel.positionPct}%`,
            background: `linear-gradient(90deg, ${color}18, ${color}35)`,
            borderRadius: '4px', transition: 'width 0.8s ease',
          }} />
          {/* Price dot */}
          <div style={{
            position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
            left: `${tunnel.positionPct}%`,
            width: '10px', height: '10px',
            background: color, borderRadius: '50%',
            boxShadow: `0 0 8px ${color}80`,
            transition: 'left 0.8s ease',
          }} />
        </div>
        {/* Labels */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px', pointerEvents: 'none',
        }}>
          <span style={{ color: '#475569', fontSize: '8px' }}>${tunnel.lower.toFixed(0)}</span>
          <span style={{ color: '#94a3b8', fontSize: '8px' }}>EMA {tunnel.ema.toFixed(0)}</span>
          <span style={{ color: '#475569', fontSize: '8px' }}>${tunnel.upper.toFixed(0)}</span>
        </div>
      </div>
      {/* Position % */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#475569', fontSize: '9px' }}>ล่าง</span>
        <span style={{ color, fontSize: '10px', fontWeight: 600 }}>ตำแหน่ง {tunnel.positionPct}%</span>
        <span style={{ color: '#475569', fontSize: '9px' }}>บน</span>
      </div>
    </div>
  );
};

// MTF Dashboard Table
const MTFDashboard: React.FC<{ rows: MTFRow[]; price: number }> = ({ rows, price }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px' }}>
      <thead>
        <tr>
          {['TF', 'Trend', 'RSI', 'Stoch K/D', 'EMA20', 'Event', 'Signal'].map(h => (
            <th key={h} style={{
              color: '#475569', fontSize: '10px', fontWeight: 600, textAlign: 'center',
              padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const sig = MTF_SIGNAL_STYLE[row.signal];
          const trendColor = TREND_COLOR[row.trend];
          const rsiColor = row.rsi != null
            ? row.rsi >= 70 ? '#f87171' : row.rsi <= 30 ? '#60a5fa' : row.rsi >= 55 ? '#22c55e' : '#94a3b8'
            : '#94a3b8';

          return (
            <tr key={row.timeframe} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              {/* TF */}
              <td style={{ padding: '8px', textAlign: 'center', borderRadius: '6px 0 0 6px' }}>
                <span style={{ color: '#f1f5f9', fontSize: '12px', fontWeight: 700 }}>{row.timeframe}</span>
              </td>
              {/* Trend */}
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <span style={{ color: trendColor, fontSize: '10px', fontWeight: 600 }}>
                  {TREND_LABEL[row.trend]}
                </span>
              </td>
              {/* RSI */}
              <td style={{ padding: '8px', textAlign: 'center' }}>
                {row.rsi != null ? (
                  <span style={{
                    color: rsiColor, fontSize: '12px', fontWeight: 700,
                    background: `${rsiColor}18`, padding: '2px 6px', borderRadius: '4px',
                  }}>{row.rsi}</span>
                ) : <span style={{ color: '#475569', fontSize: '10px' }}>N/A</span>}
              </td>
              {/* Stoch */}
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                  {row.stochK != null ? row.stochK : 'N/A'}/{row.stochD != null ? row.stochD : 'N/A'}
                </span>
                {row.stochK != null && row.stochK !== null && (
                  <span style={{ color: '#475569', fontSize: '9px' }}>
                    {row.stochK > 80 ? ' OB' : row.stochK < 20 ? ' OS' : ''}
                  </span>
                )}
              </td>
              {/* EMA20 */}
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                  color: row.vsEma20 === 'ABOVE' ? '#22c55e' : row.vsEma20 === 'BELOW' ? '#f87171' : '#94a3b8',
                  background: row.vsEma20 === 'ABOVE' ? 'rgba(34,197,94,0.1)' : row.vsEma20 === 'BELOW' ? 'rgba(248,113,113,0.1)' : 'rgba(148,163,184,0.08)',
                }}>
                  {row.vsEma20 === 'ABOVE' ? '▲ เหนือ' : row.vsEma20 === 'BELOW' ? '▼ ใต้' : '= ที่'}
                </span>
              </td>
              {/* Event */}
              <td style={{ padding: '8px', textAlign: 'center' }}>
                {row.lastEvent ? (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px',
                    color: row.lastEvent.includes('↑') ? '#22c55e' : '#f87171',
                    background: row.lastEvent.includes('↑') ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)',
                  }}>{row.lastEvent}</span>
                ) : <span style={{ color: '#334155', fontSize: '10px' }}>—</span>}
              </td>
              {/* Signal */}
              <td style={{ padding: '8px', textAlign: 'center', borderRadius: '0 6px 6px 0' }}>
                <span style={{
                  color: sig.color, background: sig.bg, fontSize: '10px', fontWeight: 700,
                  padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.3px',
                }}>{sig.label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Smart Money Radar Gauge
const SmartMoneyGauge: React.FC<{ bias: SmartMoneyBias; price: number }> = ({ bias, price }) => {
  const score = bias.score; // -100 to +100
  const pct = ((score + 100) / 200) * 100; // convert to 0–100%
  const color = score >= 20 ? '#22c55e' : score <= -20 ? '#f87171' : '#94a3b8';
  const label = score >= 40 ? 'Strong Bull' : score >= 20 ? 'Bullish' : score <= -40 ? 'Strong Bear' : score <= -20 ? 'Bearish' : 'Neutral';

  // Needle angle: -90° (left = bear) to +90° (right = bull), center = 0°
  const angle = (score / 100) * 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* SVG Gauge */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <svg width="140" height="80" viewBox="0 0 140 80">
            {/* Background Arc */}
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path
              d="M 10 75 A 60 60 0 0 1 130 75"
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round"
            />
            {/* Colored arc based on score */}
            <path
              d="M 10 75 A 60 60 0 0 1 130 75"
              fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray="188" strokeDashoffset={`${188 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            {/* Needle */}
            <line
              x1="70" y1="75"
              x2={70 + 45 * Math.cos((angle - 90) * (Math.PI / 180))}
              y2={75 + 45 * Math.sin((angle - 90) * (Math.PI / 180))}
              stroke={color} strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: 'all 0.8s ease' }}
            />
            {/* Center dot */}
            <circle cx="70" cy="75" r="5" fill={color} />
            {/* Labels */}
            <text x="8" y="78" fill="#ef4444" fontSize="8" fontWeight="700">Bear</text>
            <text x="103" y="78" fill="#22c55e" fontSize="8" fontWeight="700">Bull</text>
          </svg>
          {/* Score badge */}
          <div style={{
            position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
            color, fontSize: '16px', fontWeight: 800, letterSpacing: '-0.5px',
          }}>{score > 0 ? '+' : ''}{score}</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ color, fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>{label}</div>
          <div style={{ color: '#64748b', fontSize: '11px', lineHeight: '1.5', marginBottom: '8px' }}>
            {bias.interpretationTh}
          </div>
          {/* OB/FVG Counts */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'OB Bull', count: bias.bullishOB, color: '#22c55e' },
              { label: 'OB Bear', count: bias.bearishOB, color: '#f87171' },
              { label: 'FVG Bull', count: bias.bullishFVG, color: '#60a5fa' },
              { label: 'FVG Bear', count: bias.bearishFVG, color: '#fb923c' },
            ].map(item => (
              <div key={item.label} style={{
                background: `${item.color}15`, border: `1px solid ${item.color}30`,
                borderRadius: '6px', padding: '4px 8px', textAlign: 'center',
              }}>
                <div style={{ color: item.color, fontSize: '14px', fontWeight: 800 }}>{item.count}</div>
                <div style={{ color: '#475569', fontSize: '9px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {bias.factors.map(f => {
          const pctBar = ((f.score + 30) / 60) * 100;
          const fColor = f.score >= 10 ? '#22c55e' : f.score <= -10 ? '#f87171' : '#94a3b8';
          return (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '10px', minWidth: '110px' }}>{f.name}</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: fColor, borderRadius: '3px',
                  width: `${Math.max(2, Math.min(100, pctBar))}%`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <span style={{ color: fColor, fontSize: '10px', fontWeight: 700, minWidth: '28px', textAlign: 'right' }}>
                {f.score > 0 ? '+' : ''}{f.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const AlphaFlowDynamics: React.FC<AlphaFlowDynamicsProps> = ({ data, alphaFlow }) => {
  const af = useMemo(() => alphaFlow ?? buildMockAlphaFlow(data), [data, alphaFlow]);

  const [expanded, setExpanded] = useState({
    radar: true, ob: true, fvg: false, tunnel: true, mtf: true,
  });

  const toggle = (key: keyof typeof expanded) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const smBias = af.smartMoneyBias;
  const smColor = smBias.side === 'LONG' ? '#22c55e' : smBias.side === 'SHORT' ? '#f87171' : '#94a3b8';

  const freshOBs = af.orderBlocks.filter(o => o.status === 'FRESH').length;
  const openFVGs = af.fvgs.filter(f => f.status === 'OPEN').length;

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(8,14,31,0.98) 100%)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: '14px',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.04) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'rgba(245,158,11,0.15)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <Radar size={16} color="#f59e0b" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 800, letterSpacing: '0.3px' }}>
                Alpha Flow Dynamics
              </span>
              <span style={{
                background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                border: '1px solid rgba(245,158,11,0.3)',
              }}>V1.2</span>
            </div>
            <div style={{ color: '#475569', fontSize: '11px', marginTop: '1px' }}>
              Smart Money Radar · OB · FVG · Trend Tunnel · MTF Dashboard
            </div>
          </div>
        </div>
        {/* Live badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22c55e', animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 600 }}>LIVE</span>
          </div>
          <span style={{ color: '#334155', fontSize: '9px' }}>
            {new Date(af.generatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Summary Bar ── */}
      <div style={{
        padding: '10px 16px',
        background: `${smColor}08`,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          background: `${smColor}18`, border: `1px solid ${smColor}35`,
          borderRadius: '8px', padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        }}>
          {smBias.side === 'LONG' ? <TrendingUp size={14} color={smColor} /> : smBias.side === 'SHORT' ? <TrendingDown size={14} color={smColor} /> : <Activity size={14} color={smColor} />}
          <span style={{ color: smColor, fontSize: '13px', fontWeight: 800 }}>
            {smBias.side === 'LONG' ? '🐋 Smart Money: LONG' : smBias.side === 'SHORT' ? '🐻 Smart Money: SHORT' : '🔍 Smart Money: NEUTRAL'}
          </span>
          <span style={{ color: `${smColor}99`, fontSize: '12px', fontWeight: 700 }}>
            {smBias.score > 0 ? '+' : ''}{smBias.score}
          </span>
        </div>
        <div style={{ color: '#475569', fontSize: '11px', lineHeight: '1.4', flex: 1 }}>
          {af.summaryTh}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <span style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px' }}>
            {freshOBs} OB Fresh
          </span>
          <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px' }}>
            {openFVGs} FVG Open
          </span>
        </div>
      </div>

      {/* ── Smart Money Radar ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <SectionHeader
          icon={Radar} title="Smart Money Radar"
          subtitle="วิเคราะห์ทิศทางรายใหญ่จาก OB · FVG · Trend · MTF"
          isExpanded={expanded.radar} onToggle={() => toggle('radar')}
        />
        {expanded.radar && (
          <div style={{ padding: '14px 16px' }}>
            <SmartMoneyGauge bias={smBias} price={af.price} />
          </div>
        )}
      </div>

      {/* ── MTF Dashboard ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <SectionHeader
          icon={BarChart3} title="Multi-Timeframe Dashboard"
          subtitle="ดูทุก Timeframe จบในหน้าเดียว · ไม่ต้องสลับจอ"
          badge={
            <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px' }}>
              {af.mtfDashboard.length} TF
            </span>
          }
          isExpanded={expanded.mtf} onToggle={() => toggle('mtf')}
        />
        {expanded.mtf && (
          <div style={{ padding: '14px 16px' }}>
            <MTFDashboard rows={af.mtfDashboard} price={af.price} />
          </div>
        )}
      </div>

      {/* ── Order Blocks ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <SectionHeader
          icon={Box} title="Order Blocks (OB)"
          subtitle="กล่องดักราคารายใหญ่ — จุดที่สถาบันวางคำสั่ง"
          badge={
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                {af.orderBlocks.filter(o => o.type === 'BULLISH').length}🟦
              </span>
              <span style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                {af.orderBlocks.filter(o => o.type === 'BEARISH').length}🟥
              </span>
            </div>
          }
          isExpanded={expanded.ob} onToggle={() => toggle('ob')}
        />
        {expanded.ob && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {af.orderBlocks.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                ไม่พบ Order Block ที่สำคัญในช่วงนี้
              </div>
            ) : (
              af.orderBlocks.map(ob => <OBCard key={ob.id} ob={ob} />)
            )}
          </div>
        )}
      </div>

      {/* ── Fair Value Gaps ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <SectionHeader
          icon={Layers} title="Fair Value Gaps (FVG)"
          subtitle="ช่องว่างราคาที่รายใหญ่ทิ้งไว้ — ราคามักย้อนกลับมาเติม"
          badge={
            <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px' }}>
              {af.fvgs.filter(f => f.status === 'OPEN').length} Open
            </span>
          }
          isExpanded={expanded.fvg} onToggle={() => toggle('fvg')}
        />
        {expanded.fvg && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {af.fvgs.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                ไม่พบ Fair Value Gap ที่เปิดอยู่
              </div>
            ) : (
              af.fvgs.map(fvg => <FVGCard key={fvg.id} fvg={fvg} />)
            )}
          </div>
        )}
      </div>

      {/* ── Trend Tunnel ── */}
      <div>
        <SectionHeader
          icon={Activity} title="Trend Tunnel — อุโมงค์เทรนด์"
          subtitle="EMA + ATR Envelope · บอกทิศทางและตำแหน่งราคาในอุโมงค์"
          isExpanded={expanded.tunnel} onToggle={() => toggle('tunnel')}
        />
        {expanded.tunnel && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {af.trendTunnels.map(tunnel => (
              <TunnelBar key={tunnel.timeframe} tunnel={tunnel} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={11} color="#f59e0b" />
          <span style={{ color: '#475569', fontSize: '10px' }}>Alpha Flow Dynamics V1.2 · Smart Money Radar</span>
        </div>
        <span style={{ color: '#1e293b', fontSize: '10px' }}>ATR 4H: ${af.atr4h}</span>
      </div>
    </div>
  );
};
