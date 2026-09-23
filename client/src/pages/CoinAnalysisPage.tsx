import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Candle, DeepAnalysisData, TickerData } from '../types/index.js';
import { MainChartWidget } from '../components/MainChartWidget.js';
import { TradingViewTechnicalGauge } from '../components/TradingViewTechnicalGauge.js';
import { Sparkles, Layers, Target, AlertTriangle, CheckCircle2, Shield, Activity, Compass, Radio, Search } from 'lucide-react';
import { realtimeService } from '../services/realtime.js';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface CoinAnalysisPageProps {
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const CoinAnalysisPage: React.FC<CoinAnalysisPageProps> = ({
  selectedSymbol,
  onSelectCoin,
  currency,
}) => {
  const [analysisData, setAnalysisData] = useState<DeepAnalysisData | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [allCoins, setAllCoins] = useState<TickerData[]>([]);
  const [coinSearch, setCoinSearch] = useState('');

  useEffect(() => {
    api.getCoins().then(setAllCoins);
  }, []);

  useEffect(() => {
    api.getDeepAnalysis(selectedSymbol).then(setAnalysisData);
    api.getChartData(selectedSymbol).then((res) => setCandles(res.candles));
  }, [selectedSymbol]);

  useEffect(() => {
    const unsub = realtimeService.subscribeTicks((ticks) => {
      const live = ticks[selectedSymbol];
      if (live) {
        setAnalysisData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ticker: {
              ...prev.ticker,
              price: live.price,
              change24h: live.change24h,
              high24h: live.high24h,
              low24h: live.low24h,
              volume24h: live.volume24h,
            },
          };
        });

        setCandles((prevCandles) => {
          if (!prevCandles || prevCandles.length === 0) return prevCandles;
          const lastIdx = prevCandles.length - 1;
          const last = prevCandles[lastIdx];
          const updatedLast: Candle = {
            ...last,
            close: live.price,
            high: Math.max(last.high, live.price),
            low: Math.min(last.low, live.price),
          };
          const next = [...prevCandles];
          next[lastIdx] = updatedLast;
          return next;
        });
      }
    });

    return () => unsub();
  }, [selectedSymbol]);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  if (!analysisData) {
    return <div style={{ color: 'var(--text-muted)', padding: '40px' }}>กำลังโหลดข้อมูลการวิเคราะห์เชิงลึก...</div>;
  }

  const { ticker, indicators, structure, multiTf } = analysisData;

  const displayPrice = (ticker.price * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: ticker.price < 1 ? 4 : 2,
    maximumFractionDigits: ticker.price < 1 ? 4 : 2,
  });

  const popularSymbols = ['BTC', 'ETH', 'SOL', 'ADA', 'FLOCK', 'KUB', 'DOGE', 'XRP'];

  const filteredCoins = coinSearch.trim()
    ? allCoins.filter(
        (c) =>
          c.symbol.toLowerCase().includes(coinSearch.toLowerCase().trim()) ||
          c.name.toLowerCase().includes(coinSearch.toLowerCase().trim())
      )
    : allCoins;

  const displayCoins =
    filteredCoins.some((c) => c.symbol === selectedSymbol) || !selectedSymbol
      ? filteredCoins
      : [...allCoins.filter((c) => c.symbol === selectedSymbol), ...filteredCoins];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Coin Selector */}
      <div className="card-header-row" style={{ marginBottom: '0', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              วิเคราะห์เชิงลึก: {selectedSymbol}/{currency === 'THB' ? 'THB' : 'USDT'}
            </h2>
            <span className="badge badge-strong-buy">{ticker.signalLabelTh}</span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--neon-green-light)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span className="live-dot" />
              LIVE TICKER
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Technical Score 100 คะแนน • การวิเคราะห์โครงสร้างตลาด • Consensus Matrix
          </p>
        </div>

        {/* Quick Coin Switcher Dropdown & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Quick Popular Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยอดนิยม:</span>
            {popularSymbols.map((sym) => {
              const isActive = selectedSymbol === sym;
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectCoin(sym)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: isActive ? '1px solid var(--neon-blue)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isActive ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'var(--neon-blue-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={`สลับไปที่ ${sym}`}
                >
                  {sym}
                </button>
              );
            })}
          </div>

          {/* Quick Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0B101E',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '4px 10px',
            }}
          >
            <Search size={13} color="var(--neon-cyan)" />
            <input
              type="text"
              placeholder="ค้นหาเหรียญ..."
              value={coinSearch}
              onChange={(e) => setCoinSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                width: '85px',
              }}
            />
            {coinSearch && (
              <button
                type="button"
                onClick={() => setCoinSearch('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Select Dropdown with Solid Dark High-Contrast Styling */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>เลือกเหรียญ:</span>
            <select
              value={selectedSymbol}
              onChange={(e) => onSelectCoin(e.target.value)}
              style={{
                backgroundColor: '#0F182B',
                color: '#F8FAFC',
                colorScheme: 'dark',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                minWidth: '170px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
              }}
            >
              {displayCoins.length === 0 ? (
                <option value="" disabled style={{ backgroundColor: '#0B101E', color: '#94A3B8' }}>
                  ไม่พบเหรียญที่ค้นหา
                </option>
              ) : (
                displayCoins.map((c) => (
                  <option
                    key={c.symbol}
                    value={c.symbol}
                    style={{
                      backgroundColor: '#0B101E',
                      color: '#F8FAFC',
                      padding: '8px 12px',
                      fontSize: '13px',
                    }}
                  >
                    {c.symbol} - {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Candlestick Chart */}
      <MainChartWidget
        symbol={selectedSymbol}
        ticker={ticker}
        candles={candles}
        currency={currency}
      />

      {/* Row 2: Multi-Timeframe Matrix, Market Structure & TradingView Consensus Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Multi-Timeframe Analysis Table */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-row">
              <div className="card-title" style={{ fontSize: '14.5px' }}>
                <Layers size={16} color="var(--neon-cyan)" />
                Multi-Timeframe Analysis (15m, 1H, 4H, 1D, 1W)
              </div>
            </div>

            <table className="crypto-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Timeframe</th>
                  <th>Trend</th>
                  <th>RSI (14)</th>
                  <th>MACD Hist</th>
                  <th>Volume</th>
                  <th style={{ textAlign: 'center' }}>Signal</th>
                </tr>
              </thead>
              <tbody>
                {multiTf.timeframes.map((tf) => (
                  <tr key={tf.timeframe}>
                    <td style={{ fontWeight: 800, color: 'var(--neon-blue-light)' }}>{tf.timeframe}</td>
                    <td>{tf.trend}</td>
                    <td>{tf.rsi}</td>
                    <td style={{ color: tf.macd.histogram >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                      {tf.macd.histogram > 0 ? `+${tf.macd.histogram}` : tf.macd.histogram}
                    </td>
                    <td>{tf.volumeStatus}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-buy">{tf.signal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '11.5px',
              lineHeight: 1.4,
              color: '#CBD5E1',
            }}
          >
            <strong>Consensus:</strong> {multiTf.explanationTh}
          </div>
        </div>

        {/* Market Structure & Support / Resistance (Section 10) */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ fontSize: '14.5px', marginBottom: '12px' }}>
              <Activity size={16} color="var(--neon-green)" />
              Market Structure & Key Levels
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>โครงสร้างราคา:</span>
                <strong style={{ color: '#FFF' }}>{structure.structureType}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>สภาวะตลาด (Phase):</span>
                <strong style={{ color: 'var(--neon-green-light)' }}>{structure.phase}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>แนวต้านหลัก (Resistance 1):</span>
                <strong style={{ color: 'var(--neon-cyan)' }}>{prefix}{(structure.primaryResistance * multiplier).toFixed(ticker.price < 1 ? 4 : 2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>แนวรับสำคัญ (Support 1):</span>
                <strong style={{ color: 'var(--neon-green)' }}>{prefix}{(structure.primarySupport * multiplier).toFixed(ticker.price < 1 ? 4 : 2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>จุดตัดขาดทุน (Invalidation):</span>
                <strong style={{ color: 'var(--neon-red)' }}>{prefix}{(structure.secondarySupport * multiplier).toFixed(ticker.price < 1 ? 4 : 2)}</strong>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '10px', fontStyle: 'italic' }}>
            {structure.summaryTh}
          </p>
        </div>

        {/* TradingView Live Technical Consensus Gauge (Real-Time Internet Feed) */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-row" style={{ marginBottom: '8px' }}>
            <div className="card-title" style={{ fontSize: '14.5px' }}>
              <Target size={16} color="var(--neon-blue-light)" />
              TradingView Consensus Meter
            </div>
            <span style={{ fontSize: '11px', color: 'var(--neon-green-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Live Feed
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '340px', width: '100%', overflow: 'hidden', borderRadius: '12px', backgroundColor: 'var(--bg-card-inner, #0B101E)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <TradingViewTechnicalGauge symbol={selectedSymbol} height="100%" />
          </div>
        </div>
      </div>

      {/* Row 3: 17 Indicators Live Values Grid (Section 9) */}
      <div className="crypto-card">
        <div className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
          Technical Indicators Matrix (17 ค่าชี้วัดทางเทคนิค)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', fontSize: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>EMA 9 / 20</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.ema9} / {indicators.ema20}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>EMA 50 / 200</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.ema50} / {indicators.ema200}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>RSI (14)</div>
            <div style={{ fontWeight: 800, marginTop: '2px', color: 'var(--neon-cyan)' }}>{indicators.rsi14}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>MACD (12,26,9)</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.macd.macd} / {indicators.macd.signal}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Bollinger Upper/Lower</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.bollingerBands.upper} / {indicators.bollingerBands.lower}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Supertrend</div>
            <div style={{ fontWeight: 800, marginTop: '2px', color: indicators.supertrend.direction === 'bullish' ? '#10B981' : '#EF4444' }}>
              {indicators.supertrend.value} ({indicators.supertrend.direction})
            </div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>ATR (14)</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.atr14}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>ADX (14)</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.adx14}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>VWAP</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.vwap}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>OBV</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.obv.toLocaleString()}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Fibonacci 0.618</div>
            <div style={{ fontWeight: 800, marginTop: '2px', color: '#F59E0B' }}>{indicators.fibonacci.level618}</div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Fibonacci 0.500</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.fibonacci.level500}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
