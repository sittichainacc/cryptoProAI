/**
 * 🥇 GoldPlanChart — ชาร์ตกราฟทองคำระดับสถาบัน (Institutional Precision Chart)
 * Candlesticks + EMA 20/50 + Volume + Trade Plan Levels (Entry / Best / Chase / Stop / TP1-3)
 * รองรับ Timeframe: 15M, 1H, 4H, 1D พร้อม Floating HUD และ Indicator Toggles
 */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries, 
  LineStyle, 
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time
} from 'lightweight-charts';
import { Maximize2, Minimize2, Eye, EyeOff, BarChart2, TrendingUp, RefreshCw } from 'lucide-react';

interface Candle { 
  time: number; 
  open: number; 
  high: number; 
  low: number; 
  close: number; 
  volume: number; 
}

export interface PlanLevels {
  entryLow: number; 
  entryHigh: number; 
  bestEntry: number; 
  chaseLevel: number;
  stopLoss: number; 
  tp1: number; 
  tp2: number; 
  tp3: number;
  riskReward?: number;
  side?: 'LONG' | 'SHORT';
}

export interface ThaiPlanLevels {
  buyZoneLow: number;
  buyZoneHigh: number;
  bestBuy: number;
  chaseAbove: number;
  invalidation: number;
  tp1: number;
  tp2: number;
  tp3: number;
}

interface GoldPlanChartProps {
  mode: string;
  plan: PlanLevels | null;
  thaiPlan?: ThaiPlanLevels | null;
  supports?: number[];
  resistances?: number[];
  currentPrice?: number;
}

const isLightTheme = () => typeof document !== 'undefined' && document.documentElement.classList.contains('light');

function calculateEma(candles: Candle[], period: number): LineData<Time>[] {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  const result: LineData<Time>[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i].close;
  let ema = sum / period;
  result.push({ time: candles[period - 1].time as Time, value: Number(ema.toFixed(2)) });

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time as Time, value: Number(ema.toFixed(2)) });
  }
  return result;
}

export const GoldPlanChart: React.FC<GoldPlanChartProps> = ({ 
  mode, 
  plan, 
  thaiPlan, 
  supports = [], 
  resistances = [], 
  currentPrice 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const [tf, setTf] = useState<'15m' | '1h' | '4h' | '1d'>('4h');
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [light, setLight] = useState(isLightTheme());

  // Indicator toggles
  const [showEma, setShowEma] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Hover crosshair info
  const [hoverInfo, setHoverInfo] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
  } | null>(null);

  // Monitor theme changes
  useEffect(() => {
    const obs = new MutationObserver(() => setLight(isLightTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Fetch candle data
  const loadCandles = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/gold/candles?tf=${tf}&mode=${mode}`)
      .then(r => r.json())
      .then(j => {
        if (!cancelled) {
          if (j.success && Array.isArray(j.data)) {
            setCandles(j.data);
          } else {
            setError(j.error || 'ไม่พบข้อมูลแท่งเทียน');
          }
          setLoading(false);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [tf, mode]);

  useEffect(() => {
    return loadCandles();
  }, [loadCandles]);

  // Construct chart
  useEffect(() => {
    if (!containerRef.current || !candles?.length) return;
    const el = containerRef.current;
    el.innerHTML = '';

    const chartHeight = isExpanded ? 600 : 440;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: chartHeight,
      layout: {
        background: { color: light ? '#FFFFFF' : '#0B0F19' },
        textColor: light ? '#475569' : '#94A3B8',
        fontSize: 11,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)' },
        horzLines: { color: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { color: light ? '#94A3B8' : '#475569', width: 1, style: LineStyle.Dashed },
        horzLine: { color: light ? '#94A3B8' : '#475569', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.22 : 0.1 },
      },
      timeScale: {
        borderColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        timeVisible: tf !== '1d',
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Collect relevant levels for autoscale bounds
    const levels = plan && showLevels ? [plan.stopLoss, plan.tp1, plan.tp2, plan.tp3, plan.entryLow, plan.entryHigh] : [];

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
      autoscaleInfoProvider: (original: () => any) => {
        const r = original();
        if (!r || !levels.length) return r;
        return {
          ...r,
          priceRange: {
            minValue: Math.min(r.priceRange.minValue, ...levels),
            maxValue: Math.max(r.priceRange.maxValue, ...levels),
          },
        };
      },
    });
    candlestickSeriesRef.current = candleSeries;

    const candleData: CandlestickData<Time>[] = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleData);

    // Volume Series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });

      const volumeData: HistogramData<Time>[] = candles.map((c, i) => {
        const prevClose = i > 0 ? candles[i - 1].close : c.open;
        const isUp = c.close >= prevClose;
        return {
          time: c.time as Time,
          value: c.volume || 0,
          color: isUp ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        };
      });
      volumeSeries.setData(volumeData);
    }

    // EMAs
    if (showEma) {
      const ema20Data = calculateEma(candles, 20);
      if (ema20Data.length) {
        const ema20Series = chart.addSeries(LineSeries, {
          color: '#F59E0B',
          lineWidth: 1,
          title: 'EMA 20',
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        ema20Series.setData(ema20Data);
      }

      const ema50Data = calculateEma(candles, 50);
      if (ema50Data.length) {
        const ema50Series = chart.addSeries(LineSeries, {
          color: '#3B82F6',
          lineWidth: 1,
          title: 'EMA 50',
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        ema50Series.setData(ema50Data);
      }
    }

    // Price lines helper
    const addPriceLine = (
      price: number, 
      color: string, 
      title: string, 
      style = LineStyle.Solid, 
      width: 1 | 2 = 1
    ) => {
      candleSeries.createPriceLine({
        price,
        color,
        lineWidth: width,
        lineStyle: style,
        axisLabelVisible: true,
        title,
      });
    };

    // Draw Plan Levels
    if (plan && showLevels) {
      const isShort = plan.side === 'SHORT';
      addPriceLine(plan.bestEntry, '#10B981', `🎯 Best ${isShort ? 'Short' : 'Buy'}`, LineStyle.Solid, 2);
      addPriceLine(plan.entryHigh, '#3B82F6', 'Zone High', LineStyle.Dashed, 1);
      addPriceLine(plan.entryLow, '#3B82F6', 'Zone Low', LineStyle.Dashed, 1);
      addPriceLine(plan.chaseLevel, '#F59E0B', '⚠ Max Chase', LineStyle.Dotted, 1);
      addPriceLine(plan.stopLoss, '#EF4444', '🛑 Stop Loss', LineStyle.Solid, 2);
      addPriceLine(plan.tp1, '#06B6D4', '🏆 TP1 (30-50%)', LineStyle.Dashed, 1);
      addPriceLine(plan.tp2, '#10B981', '🏆 TP2 (Target)', LineStyle.Dashed, 2);
      if (plan.tp3) {
        addPriceLine(plan.tp3, '#8B5CF6', '🏆 TP3 (Runner)', LineStyle.Dashed, 1);
      }
    } else if (showLevels) {
      supports.slice(0, 2).forEach((s, idx) => addPriceLine(s, '#10B981', `Support ${idx + 1}`, LineStyle.Dotted));
      resistances.slice(0, 2).forEach((r, idx) => addPriceLine(r, '#EF4444', `Resist ${idx + 1}`, LineStyle.Dotted));
    }

    // Set visible window
    const n = candles.length;
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 110), to: n + 10 });

    // Crosshair move handler
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData || !candlestickSeriesRef.current) {
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
          const prev = candles[candles.length - 2]?.close ?? lastCandle.open;
          const chg = ((lastCandle.close - prev) / prev) * 100;
          setHoverInfo({
            open: lastCandle.open,
            high: lastCandle.high,
            low: lastCandle.low,
            close: lastCandle.close,
            volume: lastCandle.volume,
            change: chg,
            time: new Date((lastCandle.time as number) * 1000).toLocaleString('th-TH', { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })
          });
        }
        return;
      }
      const data = param.seriesData.get(candlestickSeriesRef.current) as CandlestickData<Time> | undefined;
      if (data) {
        const chg = ((data.close - data.open) / data.open) * 100;
        setHoverInfo({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          change: chg,
          time: new Date((data.time as number) * 1000).toLocaleString('th-TH', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        });
      }
    });

    // Handle resizing
    const ro = new ResizeObserver(() => {
      if (el && chart) {
        chart.applyOptions({ width: el.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [candles, plan, showLevels, showEma, showVolume, light, tf, supports, resistances, isExpanded]);

  const handleAutoFit = () => {
    if (chartRef.current && candles?.length) {
      const n = candles.length;
      chartRef.current.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 110), to: n + 10 });
    }
  };

  const isThai = mode === 'THAI_GOLD_BAR';

  return (
    <div style={{
      background: 'var(--bg-card, #111827)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      borderRadius: 16,
      padding: '16px',
      position: 'relative',
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      overflow: 'hidden',
    }}>
      {/* Decorative Golden Top Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #F59E0B, #FFD700, transparent)',
        opacity: 0.8,
      }} />

      {/* Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10,
        flexWrap: 'wrap',
      }}>
        {/* Left Title & Mode tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--text-primary, #F8FAFC)',
            letterSpacing: '-0.3px',
          }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span>กราฟเทคนิค & กรอบราคาเข้า–ออก</span>
          </div>

          <div style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            {mode === 'COMEX_FUTURES' ? 'COMEX GC Futures' : mode === 'THAI_GOLD_BAR' ? 'ทองคำแท่งไทย 96.5%' : 'XAU/USD Gold Spot'}
          </div>

          {currentPrice && (
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--neon-green, #10B981)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: 6,
            }}>
              {isThai ? `฿${Math.round(currentPrice).toLocaleString()}` : `$${currentPrice.toFixed(2)}`}
            </div>
          )}
        </div>

        {/* Right Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Timeframe selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card-inner, rgba(255,255,255,0.03))',
            padding: '3px',
            borderRadius: 8,
            border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
          }}>
            {(['15m', '1h', '4h', '1d'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: tf === t ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                  color: tf === t ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                  boxShadow: tf === t ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none',
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Quick Indicator Toggles */}
          <button
            onClick={() => setShowEma(!showEma)}
            title="เปิด/ปิด EMA 20 & 50"
            style={{
              padding: '5px 8px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${showEma ? '#F59E0B' : 'var(--border-color)'}`,
              background: showEma ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card-inner)',
              color: showEma ? '#F59E0B' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <TrendingUp size={12} />
            <span>EMA</span>
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            title="เปิด/ปิด Volume"
            style={{
              padding: '5px 8px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${showVolume ? '#10B981' : 'var(--border-color)'}`,
              background: showVolume ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-inner)',
              color: showVolume ? '#10B981' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <BarChart2 size={12} />
            <span>Vol</span>
          </button>

          <button
            onClick={() => setShowLevels(!showLevels)}
            title="เปิด/ปิด แผนราคา Entry/Stop/TP"
            style={{
              padding: '5px 8px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${showLevels ? '#3B82F6' : 'var(--border-color)'}`,
              background: showLevels ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card-inner)',
              color: showLevels ? '#3B82F6' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {showLevels ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Levels</span>
          </button>

          <button
            onClick={handleAutoFit}
            title="ปรับมุมมองชาร์ตให้พอดี"
            style={{
              padding: '5px 8px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card-inner)',
              color: 'var(--text-secondary)',
            }}
          >
            Fit
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'ย่อชาร์ต' : 'ขยายชาร์ตเต็มที่'}
            style={{
              padding: '5px 8px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card-inner)',
              color: 'var(--text-secondary)',
            }}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Floating HUD Bar (OHLCV & Target Quick Glance) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'var(--bg-card-inner, rgba(0,0,0,0.2))',
        border: '1px solid var(--border-color, rgba(255,255,255,0.05))',
        fontSize: 11,
        marginBottom: 8,
      }}>
        {/* Left: Hover Candle Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted, #64748B)' }}>{hoverInfo?.time || 'Live Bar'}</span>
          <span>O: <strong style={{ color: 'var(--text-primary)' }}>{hoverInfo?.open?.toFixed(2) ?? '—'}</strong></span>
          <span>H: <strong style={{ color: '#10B981' }}>{hoverInfo?.high?.toFixed(2) ?? '—'}</strong></span>
          <span>L: <strong style={{ color: '#EF4444' }}>{hoverInfo?.low?.toFixed(2) ?? '—'}</strong></span>
          <span>C: <strong style={{ color: 'var(--text-primary)' }}>{hoverInfo?.close?.toFixed(2) ?? '—'}</strong></span>
          {hoverInfo?.change != null && (
            <span style={{
              fontWeight: 700,
              color: hoverInfo.change >= 0 ? '#10B981' : '#EF4444',
            }}>
              {hoverInfo.change >= 0 ? '+' : ''}{hoverInfo.change.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Right: Legend Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {showEma && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B' }}>
                <span style={{ width: 8, height: 2, background: '#F59E0B' }} /> EMA 20
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3B82F6' }}>
                <span style={{ width: 8, height: 2, background: '#3B82F6' }} /> EMA 50
              </span>
            </div>
          )}

          {plan && showLevels && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>
                🎯 Best: ${plan.bestEntry}
              </span>
              <span style={{ color: '#EF4444', fontWeight: 700 }}>
                🛑 Stop: ${plan.stopLoss}
              </span>
              <span style={{ color: '#06B6D4', fontWeight: 700 }}>
                🏆 TP1: ${plan.tp1}
              </span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>
                🏆 TP2: ${plan.tp2}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      {error ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--neon-red, #EF4444)',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>ไม่สามารถโหลดกราฟได้: {error}</div>
          <button
            onClick={loadCandles}
            style={{
              marginTop: 12,
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#3B82F6',
              color: '#FFF',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : loading && !candles ? (
        <div style={{
          padding: '80px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary, #94A3B8)',
          fontSize: 13,
        }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 10px', color: '#F59E0B' }} />
          <div>กำลังโหลดข้อมูลกราฟแท่งเทียนระดับสถาบัน...</div>
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', minHeight: isExpanded ? 600 : 440 }} />
      )}
    </div>
  );
};
