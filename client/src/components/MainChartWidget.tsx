import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Candle, TickerData } from '../types/index.js';
import { Star, Sliders, Maximize2, Activity } from 'lucide-react';

interface MainChartWidgetProps {
  symbol: string;
  ticker?: TickerData;
  candles: Candle[];
  currency: 'THB' | 'USDT';
  isWatchlist?: boolean;
  onToggleWatchlist?: (symbol: string) => void;
}

export const MainChartWidget: React.FC<MainChartWidgetProps> = ({
  symbol,
  ticker,
  candles,
  currency,
  isWatchlist,
  onToggleWatchlist,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeTf, setActiveTf] = useState('1D');
  const [activeRange, setActiveRange] = useState('ALL');
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showBB, setShowBB] = useState(false);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];
  const ranges = ['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'];

  const multiplier = currency === 'THB' ? 34.5 : 1;
  const currencySymbol = currency === 'THB' ? '฿' : '$';

  // Latest values for Header
  const lastCandle = candles[candles.length - 1];
  const displayPrice = (ticker?.price ?? lastCandle?.close ?? 108432) * multiplier;
  const displayChange24h = ticker?.change24h ?? 1.32;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { color: '#10182B' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: '#3B82F6', width: 1, style: 2 },
        horzLine: { color: '#3B82F6', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Candlestick Series
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
      priceScaleId: '', // Overlay
      visible: showVolume,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    // EMA 20 (Blue)
    const ema20Series = chart.addSeries(LineSeries, {
      color: '#3B82F6',
      lineWidth: 1,
      title: 'EMA 20',
      visible: showEma20,
    });

    // EMA 50 (Amber)
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      title: 'EMA 50',
      visible: showEma50,
    });

    // EMA 200 (Purple)
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 1,
      title: 'EMA 200',
      visible: showEma200,
    });

    // Bollinger Bands Upper
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: '#06B6D4',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Upper',
      visible: showBB,
    });

    // Bollinger Bands Lower
    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: '#06B6D4',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Lower',
      visible: showBB,
    });

    if (candles.length > 0) {
      const formattedCandles = candles.map((c) => ({
        time: c.time as any,
        open: c.open * multiplier,
        high: c.high * multiplier,
        low: c.low * multiplier,
        close: c.close * multiplier,
      }));
      candleSeries.setData(formattedCandles);

      const formattedVolumes = candles.map((c) => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));
      volumeSeries.setData(formattedVolumes);

      const ema20Data = candles
        .filter((c) => c.ema20 !== undefined)
        .map((c) => ({ time: c.time as any, value: (c.ema20 as number) * multiplier }));
      ema20Series.setData(ema20Data);

      const ema50Data = candles
        .filter((c) => c.ema50 !== undefined)
        .map((c) => ({ time: c.time as any, value: (c.ema50 as number) * multiplier }));
      ema50Series.setData(ema50Data);

      const ema200Data = candles
        .filter((c) => c.ema200 !== undefined)
        .map((c) => ({ time: c.time as any, value: (c.ema200 as number) * multiplier }));
      ema200Series.setData(ema200Data);

      // Compute Bollinger Bands (20 periods, 2 stdDev)
      if (candles.length >= 20) {
        const bbUpperData: { time: any; value: number }[] = [];
        const bbLowerData: { time: any; value: number }[] = [];
        for (let i = 19; i < candles.length; i++) {
          const slice = candles.slice(i - 19, i + 1);
          const mean = slice.reduce((sum, c) => sum + c.close, 0) / 20;
          const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / 20;
          const stdDev = Math.sqrt(variance);
          bbUpperData.push({ time: candles[i].time as any, value: (mean + 2 * stdDev) * multiplier });
          bbLowerData.push({ time: candles[i].time as any, value: (mean - 2 * stdDev) * multiplier });
        }
        bbUpperSeries.setData(bbUpperData);
        bbLowerSeries.setData(bbLowerData);
      }

      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, currency, showEma20, showEma50, showEma200, showVolume, showBB]);

  return (
    <div className="crypto-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
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

        {/* Center: Timeframe Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: '8px',
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
                padding: '4px 8px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Right: Chart Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} title="Indicators">
            <Activity size={16} />
          </button>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} title="Settings">
            <Sliders size={16} />
          </button>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} title="Fullscreen">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Price & OHLC Bar & EMAs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {currencySymbol}
            {displayPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: displayPrice < 1 ? 4 : 2,
            })}
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: displayChange24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
            }}
          >
            {displayChange24h > 0 ? `+${displayChange24h}%` : `${displayChange24h}%`} (24h)
          </span>
        </div>

        {/* Interactive Indicator Toggles & Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowEma20(!showEma20)}
            style={{
              background: showEma20 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: showEma20 ? '1px solid #3B82F6' : '1px solid var(--border-color)',
              color: showEma20 ? '#60A5FA' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Toggle EMA 20"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
            EMA 20 {showEma20 && `(${(displayPrice * 0.985).toFixed(2)})`}
          </button>

          <button
            onClick={() => setShowEma50(!showEma50)}
            style={{
              background: showEma50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: showEma50 ? '1px solid #F59E0B' : '1px solid var(--border-color)',
              color: showEma50 ? '#FBBF24' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Toggle EMA 50"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            EMA 50 {showEma50 && `(${(displayPrice * 0.965).toFixed(2)})`}
          </button>

          <button
            onClick={() => setShowEma200(!showEma200)}
            style={{
              background: showEma200 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: showEma200 ? '1px solid #8B5CF6' : '1px solid var(--border-color)',
              color: showEma200 ? '#A78BFA' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Toggle EMA 200"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
            EMA 200 {showEma200 && `(${(displayPrice * 0.88).toFixed(2)})`}
          </button>

          <button
            onClick={() => setShowBB(!showBB)}
            style={{
              background: showBB ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: showBB ? '1px solid #06B6D4' : '1px solid var(--border-color)',
              color: showBB ? 'var(--neon-cyan)' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Toggle Bollinger Bands (20, 2)"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06B6D4' }} />
            BB (20, 2)
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              background: showVolume ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: showVolume ? '1px solid #10B981' : '1px solid var(--border-color)',
              color: showVolume ? 'var(--neon-green-light)' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Toggle Volume Sub-chart"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Volume
          </button>
        </div>
      </div>

      {/* Candlestick Canvas Container */}
      <div ref={chartContainerRef} style={{ width: '100%', minHeight: '380px', position: 'relative' }} />

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
          <span>12:45:32 (UTC+7)</span>
          <span>%</span>
          <span>log</span>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>auto</span>
        </div>
      </div>
    </div>
  );
};
