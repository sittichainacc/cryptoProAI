import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, IChartApi, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Candle, TickerData } from '../types/index.js';
import { Star, Sliders, Maximize2, Minimize2, Activity, Check, RotateCcw, X, Layers, Sparkles, Save, ArrowUpDown } from 'lucide-react';
import { TradingViewWidget } from './TradingViewWidget.js';
import { PriceCell } from './PriceCell.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { api } from '../services/api.js';
import {
  SavedChartIndicators,
  DEFAULT_CHART_INDICATORS,
  INDICATOR_CATALOG,
  INDICATOR_PRESETS,
  IndicatorPreset,
  getSavedIndicators,
  saveChartIndicators,
  getSavedChartEngine,
  saveChartEngine,
  getSavedChartTimeframe,
  saveChartTimeframe,
  getSavedChartHeight,
  saveChartHeight,
  toTradingViewStudies,
} from '../utils/chartIndicatorStorage.js';

interface MainChartWidgetProps {
  symbol: string;
  ticker?: TickerData;
  candles: Candle[];
  currency: 'THB' | 'USDT';
  isWatchlist?: boolean;
  onToggleWatchlist?: (symbol: string) => void;
  onTimeframeChange?: (tf: string) => void;
}

export const MainChartWidget: React.FC<MainChartWidgetProps> = ({
  symbol,
  ticker,
  candles,
  currency,
  isWatchlist,
  onToggleWatchlist,
  onTimeframeChange,
}) => {
  const widgetRootRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Detect current app theme (light/dark) from <html> class
  const getAppTheme = (): 'dark' | 'light' =>
    document.documentElement.classList.contains('light') ? 'light' : 'dark';

  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(() => getAppTheme());

  // Persistent States from LocalStorage
  const [chartEngine, setChartEngineState] = useState<'tradingview' | 'lightweight'>(() => getSavedChartEngine());
  const [activeTf, setActiveTfState] = useState<string>(() => getSavedChartTimeframe());
  const [activeRange, setActiveRange] = useState('ALL');
  const [indicators, setIndicators] = useState<SavedChartIndicators>(() => getSavedIndicators());
  const [chartHeight, setChartHeightState] = useState<number>(() => getSavedChartHeight());

  // Fullscreen & UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);

  // Local candles for active timeframe switching
  const [currentCandles, setCurrentCandles] = useState<Candle[]>(candles);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];
  const heightOptions = [
    { label: '600px (มาตรฐาน)', value: 600 },
    { label: '740px (ขยายสูง)', value: 740 },
    { label: '880px (สูงพิเศษ)', value: 880 },
  ];
  const ranges = ['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'];

  const multiplier = getCurrencyMultiplier(currency);
  const currencySymbol = currency === 'THB' ? '฿' : '$';

  // Persistence handlers
  const setChartEngine = (engine: 'tradingview' | 'lightweight') => {
    setChartEngineState(engine);
    saveChartEngine(engine);
  };

  const setActiveTf = (tf: string) => {
    setActiveTfState(tf);
    saveChartTimeframe(tf);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  const setChartHeight = (h: number) => {
    setChartHeightState(h);
    saveChartHeight(h);
    triggerToast(`ปรับความสูงกราฟเป็น ${h}px แล้ว`);
  };

  const triggerToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => {
      setSavedToast((curr) => (curr === msg ? null : curr));
    }, 2400);
  };

  // Sync props candles
  useEffect(() => {
    setCurrentCandles(candles);
  }, [candles]);

  // Watch for theme changes on <html> element via MutationObserver
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setAppTheme(getAppTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Fetch candles when timeframe changes in lightweight mode
  useEffect(() => {
    if (chartEngine !== 'lightweight') return;
    let cancelled = false;
    const loadCandlesForTf = async () => {
      setIsLoadingCandles(true);
      try {
        const res = await api.getChartData(symbol, activeTf);
        if (!cancelled && res?.candles && res.candles.length > 0) {
          setCurrentCandles(res.candles);
        }
      } catch (err) {
        console.warn(`[MainChartWidget] Failed to fetch candles for tf ${activeTf}:`, err);
      } finally {
        if (!cancelled) setIsLoadingCandles(false);
      }
    };
    loadCandlesForTf();
    return () => {
      cancelled = true;
    };
  }, [symbol, activeTf, chartEngine]);

  // Handle Fullscreen events and ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (widgetRootRef.current?.requestFullscreen) {
        widgetRootRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const toggleIndicator = (key: keyof SavedChartIndicators) => {
    setIndicators((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveChartIndicators(next);
      triggerToast(`บันทึก ${next[key] ? 'เปิด' : 'ปิด'} ${key.toUpperCase()} แล้ว`);
      return next;
    });
  };

  const applyPreset = (preset: IndicatorPreset) => {
    setIndicators(preset.indicators);
    saveChartIndicators(preset.indicators);
    triggerToast(`โหลดและบันทึกพรีเซ็ต "${preset.name}" แล้ว`);
  };

  const resetToDefault = () => {
    setIndicators({ ...DEFAULT_CHART_INDICATORS });
    saveChartIndicators({ ...DEFAULT_CHART_INDICATORS });
    triggerToast('รีเซ็ตเป็นอินดิเคเตอร์เริ่มต้น และบันทึกเรียบร้อย');
  };

  const activeCount = useMemo(() => {
    return Object.values(indicators).filter(Boolean).length;
  }, [indicators]);

  const tvStudies = useMemo(() => {
    return toTradingViewStudies(indicators);
  }, [indicators]);

  // Latest values for Header
  const lastCandle = currentCandles[currentCandles.length - 1];
  const displayPrice = (ticker?.price ?? lastCandle?.close ?? 108432) * multiplier;
  const displayChange24h = ticker?.change24h ?? 1.32;
  const high24h = (ticker?.high24h ?? lastCandle?.high ?? 0) * multiplier;
  const low24h = (ticker?.low24h ?? lastCandle?.low ?? 0) * multiplier;
  const vol24h = (ticker?.volume24h ?? 0) * multiplier;

  const formatVolCompact = (v: number) => {
    if (v >= 1e9) return `${currencySymbol}${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${currencySymbol}${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${currencySymbol}${(v / 1e3).toFixed(1)}K`;
    return `${currencySymbol}${v.toFixed(0)}`;
  };

  // Lightweight Charts Engine Setup
  useEffect(() => {
    if (chartEngine !== 'lightweight') return;
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';

    const isLight = appTheme === 'light';
    const calculatedHeight = isFullscreen ? window.innerHeight - 240 : chartHeight - 80;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: Math.max(380, calculatedHeight),
      layout: {
        background: { color: isLight ? '#FFFFFF' : '#0B0F19' },
        textColor: isLight ? '#475569' : '#94A3B8',
        fontSize: 11,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: '#3B82F6', width: 1, style: 2 },
        horzLine: { color: '#3B82F6', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      },
      timeScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
      },
    });

    chartRef.current = chart;
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(6, 182, 212, 0.4)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      visible: indicators.volume,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    // EMA 20 (Blue)
    const ema20Series = chart.addSeries(LineSeries, {
      color: '#3B82F6',
      lineWidth: 1,
      title: 'EMA 20',
      visible: indicators.ema20,
    });

    // EMA 50 (Amber)
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      title: 'EMA 50',
      visible: indicators.ema50,
    });

    // EMA 200 (Purple)
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 1,
      title: 'EMA 200',
      visible: indicators.ema200,
    });

    // Bollinger Bands Upper
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: '#06B6D4',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Upper',
      visible: indicators.bb,
    });

    // Bollinger Bands Lower
    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: '#06B6D4',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Lower',
      visible: indicators.bb,
    });

    if (currentCandles.length > 0) {
      const formattedCandles = currentCandles.map((c) => ({
        time: c.time as any,
        open: c.open * multiplier,
        high: c.high * multiplier,
        low: c.low * multiplier,
        close: c.close * multiplier,
      }));
      candleSeries.setData(formattedCandles);

      const formattedVolumes = currentCandles.map((c) => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));
      volumeSeries.setData(formattedVolumes);

      const ema20Data = currentCandles
        .filter((c) => c.ema20 !== undefined)
        .map((c) => ({ time: c.time as any, value: (c.ema20 as number) * multiplier }));
      ema20Series.setData(ema20Data);

      const ema50Data = currentCandles
        .filter((c) => c.ema50 !== undefined)
        .map((c) => ({ time: c.time as any, value: (c.ema50 as number) * multiplier }));
      ema50Series.setData(ema50Data);

      const ema200Data = currentCandles
        .filter((c) => c.ema200 !== undefined)
        .map((c) => ({ time: c.time as any, value: (c.ema200 as number) * multiplier }));
      ema200Series.setData(ema200Data);

      // Compute Bollinger Bands (20 periods, 2 stdDev)
      if (currentCandles.length >= 20) {
        const bbUpperData: { time: any; value: number }[] = [];
        const bbLowerData: { time: any; value: number }[] = [];
        for (let i = 19; i < currentCandles.length; i++) {
          const slice = currentCandles.slice(i - 19, i + 1);
          const mean = slice.reduce((sum, c) => sum + c.close, 0) / 20;
          const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / 20;
          const stdDev = Math.sqrt(variance);
          bbUpperData.push({ time: currentCandles[i].time as any, value: (mean + 2 * stdDev) * multiplier });
          bbLowerData.push({ time: currentCandles[i].time as any, value: (mean - 2 * stdDev) * multiplier });
        }
        bbUpperSeries.setData(bbUpperData);
        bbLowerSeries.setData(bbLowerData);
      }

      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        const nextH = isFullscreen ? window.innerHeight - 240 : chartHeight - 80;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: Math.max(380, nextH),
        });
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          const nextH = isFullscreen ? window.innerHeight - 240 : chartHeight - 80;
          chart.applyOptions({
            width: entry.contentRect.width,
            height: Math.max(380, nextH),
          });
        }
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [currentCandles, currency, indicators, chartEngine, multiplier, chartHeight, isFullscreen, appTheme]);

  const effectiveChartHeight = isFullscreen ? 'calc(100vh - 175px)' : `${chartHeight}px`;
  const isLight = appTheme === 'light';

  return (
    <div
      ref={widgetRootRef}
      className={`crypto-card chart-widget-root ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={{
        padding: isFullscreen ? '16px 24px' : '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : '100%',
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 99999 : undefined,
        backgroundColor: isFullscreen ? (isLight ? '#FFFFFF' : '#0B0F19') : 'var(--bg-card)',
        overflowY: isFullscreen ? 'auto' : 'visible',
      }}
    >
      {/* Top Bar: Symbol, Timeframes, Price, Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          marginBottom: '10px',
        }}
      >
        {/* Left: Symbol & Watchlist */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            ₿
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800 }}>
            {symbol}/{currency === 'THB' ? 'THB' : 'USDT'}
          </span>
          <button
            onClick={() => onToggleWatchlist && onToggleWatchlist(symbol)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isWatchlist ? '#F59E0B' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Star size={16} fill={isWatchlist ? '#F59E0B' : 'none'} />
          </button>
        </div>

        {/* Center: Timeframe Selector (1m, 5m, 15m, 1h, 4h, 1D, 1W) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: '8px',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTf(tf)}
              style={{
                background: activeTf === tf ? 'var(--neon-blue)' : 'transparent',
                color: activeTf === tf ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 9px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: activeTf === tf ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
              }}
              title={`เปลี่ยนช่วงเวลากราฟเป็น ${tf}`}
            >
              {tf}
            </button>
          ))}
          {isLoadingCandles && (
            <span style={{ fontSize: '10px', color: 'var(--neon-cyan)', marginLeft: '4px', animation: 'pulse 1s infinite' }}>
              กำลังโหลด...
            </span>
          )}
        </div>

        {/* Right: Chart Height, Mode Selector & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Height Adjuster Buttons (Only shown when not fullscreen) */}
          {!isFullscreen && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
              title="ปรับขนาดความสูงของกราฟ (600px, 740px, 880px)"
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--text-muted)' }}>
                <ArrowUpDown size={12} />
              </div>
              {heightOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setChartHeight(opt.value)}
                  style={{
                    background: chartHeight === opt.value ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: chartHeight === opt.value ? 'var(--neon-blue-light)' : 'var(--text-muted)',
                    border: chartHeight === opt.value ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '3px 7px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.value}px
                </button>
              ))}
            </div>
          )}

          {/* Engine Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setChartEngine('tradingview')}
              style={{
                background: chartEngine === 'tradingview' ? 'var(--neon-blue)' : 'transparent',
                color: chartEngine === 'tradingview' ? '#FFF' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s',
              }}
              title="สตรีมมิ่งกราฟจริงจาก TradingView พร้อมโหลดอินดิเคเตอร์ที่บันทึกไว้"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              TradingView Live
            </button>
            <button
              onClick={() => setChartEngine('lightweight')}
              style={{
                background: chartEngine === 'lightweight' ? 'var(--neon-blue)' : 'transparent',
                color: chartEngine === 'lightweight' ? '#FFF' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s',
              }}
              title="กราฟวิเคราะห์น้ำหนักเบาพร้อม 17 ตัวชี้วัด AI ในตัว"
            >
              AI Analysis Chart
            </button>
          </div>

          {/* Fullscreen Mode Toggle Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: isFullscreen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.15)',
              border: isFullscreen ? '1px solid #EF4444' : '1px solid rgba(59, 130, 246, 0.3)',
              color: isFullscreen ? '#FCA5A5' : 'var(--neon-blue-light)',
              borderRadius: '8px',
              padding: '4px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
            title={isFullscreen ? 'ออกจากโหมดเต็มจอ (ESC)' : 'ขยายกราฟเต็มหน้าจอ (Fullscreen)'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={14} />
                <span>ออกจากเต็มจอ (ESC)</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} />
                <span>เต็มจอ (Fullscreen)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Persistent Real-time Live Price & 24h Stats Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '6px 0 10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Real-time Flash Price */}
          <PriceCell
            price={displayPrice}
            prefix={currencySymbol}
            style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}
          />

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: displayChange24h >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: displayChange24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {displayChange24h > 0 ? `▲ +${displayChange24h.toFixed(2)}%` : `▼ ${displayChange24h.toFixed(2)}%`}
          </span>

          {/* 24h High/Low/Vol Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            {high24h > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: '3px' }}>สูงสุด:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currencySymbol}{high24h.toLocaleString(undefined, { maximumFractionDigits: high24h < 1 ? 4 : 2 })}
                </span>
              </div>
            )}
            {low24h > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: '3px' }}>ต่ำสุด:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currencySymbol}{low24h.toLocaleString(undefined, { maximumFractionDigits: low24h < 1 ? 4 : 2 })}
                </span>
              </div>
            )}
            {vol24h > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: '3px' }}>วอลุ่ม:</span>
                <span style={{ fontWeight: 600, color: 'var(--neon-cyan)' }}>
                  {formatVolCompact(vol24h)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Status Indicator Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {savedToast ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--neon-green-light)',
                fontSize: '11px',
                fontWeight: 600,
                animation: 'pulse 1s infinite alternate',
              }}
            >
              <Check size={12} />
              <span>{savedToast}</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: isLight ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-muted)',
                fontSize: '10.5px',
              }}
              title="ระบบจะจดจำและบันทึกอินดิเคเตอร์ที่เลือกไว้ลงในเบราว์เซอร์อัตโนมัติ"
            >
              <Save size={11} color="#60A5FA" />
              <span>บันทึกอินดิเคเตอร์อัตโนมัติ ({activeCount} ตัว)</span>
            </div>
          )}
        </div>
      </div>

      {/* Modern Interactive Indicators Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '6px 10px',
          backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(15, 23, 42, 0.55)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '8px',
        }}
      >
        {/* Left: Indicator Manager Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsManagerOpen(!isManagerOpen)}
            style={{
              background: isManagerOpen
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))'
                : isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
              border: isManagerOpen ? '1px solid var(--neon-blue)' : '1px solid var(--border-color)',
              color: isManagerOpen ? '#FFF' : 'var(--text-primary)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Sliders size={13} color={isManagerOpen ? 'var(--neon-blue)' : '#94A3B8'} />
            <span>จัดการอินดิเคเตอร์</span>
            <span
              style={{
                backgroundColor: activeCount > 0 ? 'var(--neon-blue)' : 'rgba(255, 255, 255, 0.1)',
                color: '#FFF',
                borderRadius: '999px',
                padding: '1px 6px',
                fontSize: '9.5px',
                fontWeight: 800,
              }}
            >
              {activeCount}
            </span>
          </button>

          {/* Quick Presets Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', maxWidth: '300px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '4px', marginRight: '2px' }}>พรีเซ็ต:</span>
            {INDICATOR_PRESETS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                style={{
                  background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.07)',
                  color: 'var(--text-secondary)',
                  borderRadius: '5px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={`${p.name} - ${p.description}`}
              >
                <span>{p.icon}</span>
                <span>{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Quick Toggle Indicator Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          {INDICATOR_CATALOG.map((item) => {
            const isActive = !!indicators[item.key];
            return (
              <button
                key={item.key}
                onClick={() => toggleIndicator(item.key)}
                style={{
                  background: isActive ? (isLight ? `${item.color}18` : `${item.color}22`) : (isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)'),
                  border: isActive ? `1px solid ${item.color}` : (isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.07)'),
                  color: isActive ? (isLight ? item.color : '#FFF') : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 0 8px ${item.color}33` : 'none',
                }}
                title={`${item.label} (คลิกเปิด/ปิด และบันทึกค่าอัตโนมัติ)`}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? item.color : 'rgba(255, 255, 255, 0.2)',
                  }}
                />
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Indicator Manager Modal */}
      {isManagerOpen && (
        <div
          style={{
            position: 'absolute',
            top: '120px',
            right: '20px',
            zIndex: 40,
            width: '420px',
            maxWidth: '92vw',
            backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
            border: isLight ? '1px solid var(--border-color)' : '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: isLight
              ? '0 20px 40px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.2)'
              : '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={14} color="#60A5FA" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>ตั้งค่าและบันทึกอินดิเคเตอร์</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>บันทึกอัตโนมัติ ใช้ได้ทั้ง TradingView & AI Chart</div>
              </div>
            </div>
            <button
              onClick={() => setIsManagerOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Presets Gallery */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="var(--neon-cyan)" />
              <span>เทมเพลตยอดนิยม (Presets):</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {INDICATOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Indicators List with switches */}
          <div style={{ marginBottom: '14px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={12} color="var(--neon-blue)" />
              <span>รายการอินดิเคเตอร์ทั้งหมด ({activeCount}/{INDICATOR_CATALOG.length} เปิดอยู่):</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {INDICATOR_CATALOG.map((item) => {
                const isActive = !!indicators[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleIndicator(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: isActive
                        ? isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'
                        : isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive
                        ? `1px solid ${item.color}55`
                        : isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          boxShadow: isActive ? `0 0 6px ${item.color}` : 'none',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {/* Switch */}
                    <div
                      style={{
                        width: '34px',
                        height: '18px',
                        borderRadius: '999px',
                        backgroundColor: isActive ? item.color : isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: '#FFF',
                          position: 'absolute',
                          top: '2px',
                          left: isActive ? '18px' : '2px',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <button
              onClick={resetToDefault}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={11} />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>

            <button
              onClick={() => setIsManagerOpen(false)}
              style={{
                background: 'var(--neon-blue)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 14px',
                color: '#FFF',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Check size={13} />
              <span>เรียบร้อย (บันทึกแล้ว)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chart Canvas Area */}
      {chartEngine === 'tradingview' ? (
        <div
          style={{
            width: '100%',
            height: effectiveChartHeight,
            minHeight: isFullscreen ? '400px' : `${chartHeight}px`,
            marginTop: '4px',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <TradingViewWidget
            symbol={symbol}
            theme={appTheme}
            interval={activeTf}
            height={effectiveChartHeight}
            studies={tvStudies}
          />
        </div>
      ) : (
        <>
          {/* Candlestick Canvas Container */}
          <div
            ref={chartContainerRef}
            style={{
              width: '100%',
              height: effectiveChartHeight,
              minHeight: isFullscreen ? '400px' : `${chartHeight - 60}px`,
              position: 'relative',
            }}
          />

          {/* Bottom Range Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRange(r)}
                  style={{
                    background: activeRange === r ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: activeRange === r ? 'var(--neon-blue-light)' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
              <span>อินดิเคเตอร์: {activeCount} ตัว</span>
              <span>%</span>
              <span>log</span>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>auto</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
