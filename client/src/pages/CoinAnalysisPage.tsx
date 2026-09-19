import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Candle, DeepAnalysisData, TickerData } from '../types/index.js';
import { MainChartWidget } from '../components/MainChartWidget.js';
import { TradingViewTechnicalGauge } from '../components/TradingViewTechnicalGauge.js';
import { Sparkles, Layers, Target, AlertTriangle, CheckCircle2, Shield, Activity, Compass } from 'lucide-react';

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

  useEffect(() => {
    api.getCoins().then(setAllCoins);
  }, []);

  useEffect(() => {
    api.getDeepAnalysis(selectedSymbol).then(setAnalysisData);
    api.getChartData(selectedSymbol).then((res) => setCandles(res.candles));
  }, [selectedSymbol]);

  const multiplier = currency === 'THB' ? 34.5 : 1;
  const prefix = currency === 'THB' ? '฿' : '$';

  if (!analysisData) {
    return <div style={{ color: 'var(--text-muted)', padding: '40px' }}>กำลังโหลดข้อมูลการวิเคราะห์เชิงลึก...</div>;
  }

  const { ticker, indicators, structure, multiTf } = analysisData;

  const displayPrice = (ticker.price * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: ticker.price < 1 ? 4 : 2,
    maximumFractionDigits: ticker.price < 1 ? 4 : 2,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Coin Selector */}
      <div className="card-header-row" style={{ marginBottom: '0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              วิเคราะห์เชิงลึก: {selectedSymbol}/{currency === 'THB' ? 'THB' : 'USDT'}
            </h2>
            <span className="badge badge-strong-buy">{ticker.signalLabelTh}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Technical Score 100 คะแนน • การวิเคราะห์โครงสร้างตลาด • Consensus Matrix
          </p>
        </div>

        {/* Quick Coin Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เลือกเหรียญ:</span>
          <select
            value={selectedSymbol}
            onChange={(e) => onSelectCoin(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
            }}
          >
            {allCoins.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} - {c.name}
              </option>
            ))}
          </select>
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
        <div className="crypto-card">
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
        <div className="crypto-card">
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

          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '10px', fontStyle: 'italic' }}>
            {structure.summaryTh}
          </p>
        </div>

        {/* TradingView Live Technical Consensus Gauge (Real-Time Internet Feed) */}
        <div className="crypto-card">
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
          <div style={{ height: '320px', width: '100%', overflow: 'hidden' }}>
            <TradingViewTechnicalGauge symbol={selectedSymbol} height={320} />
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
