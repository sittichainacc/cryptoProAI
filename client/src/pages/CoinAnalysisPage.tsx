import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api.js';
import { Candle, DeepAnalysisData, TickerData, ComprehensiveTradingPlan } from '../types/index.js';
import { MainChartWidget } from '../components/MainChartWidget.js';
import { TradingViewTechnicalGauge } from '../components/TradingViewTechnicalGauge.js';
import { SearchableCoinSelect } from '../components/SearchableCoinSelect.js';
import { 
  Sparkles, 
  Layers, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Activity, 
  Compass, 
  Radio, 
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Award,
  ShieldCheck,
  ShieldAlert,
  Percent,
  ChevronDown,
  Sliders,
  DollarSign,
  Maximize2,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
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
  const [boughtPriceInput, setBoughtPriceInput] = useState<string>('');
  const [activeBoughtPrice, setActiveBoughtPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getCoins().then(setAllCoins);
  }, []);

  const fetchAnalysis = async (sym: string, boughtPrice?: number | null) => {
    setIsLoading(true);
    try {
      const data = await api.getDeepAnalysis(sym, boughtPrice);
      setAnalysisData(data);
      const chartRes = await api.getChartData(sym);
      if (chartRes?.candles) {
        setCandles(chartRes.candles);
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedSymbol, activeBoughtPrice);
  }, [selectedSymbol, activeBoughtPrice]);

  // Subscribe to live WebSocket / Polling Ticks
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

  const popularSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'FLOCK', 'LINK', 'AAVE', 'SUI'];

  if (!analysisData || isLoading && !analysisData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--neon-blue)' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
          กำลังประมวลผล Multi-Timeframe RSI + Fibonacci + Holding Horizon...
        </div>
        <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-secondary)' }}>
          ระบบกำลังคำนวณ Confluence, Stop Loss และ Exit Intelligence ทุกมิติ
        </div>
      </div>
    );
  }

  const { ticker, indicators, structure, multiTf, tradingPlan } = analysisData;
  const plan = tradingPlan;

  const displayPrice = (ticker.price * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: ticker.price < 1 ? 4 : 2,
    maximumFractionDigits: ticker.price < 1 ? 4 : 2,
  });

  const formatPrice = (val: number) => {
    return `${prefix}${(val * multiplier).toLocaleString(undefined, {
      minimumFractionDigits: ticker.price < 1 ? 4 : 2,
      maximumFractionDigits: ticker.price < 1 ? 4 : 2,
    })}`;
  };

  const handleApplyBoughtPrice = () => {
    const p = parseFloat(boughtPriceInput);
    if (!isNaN(p) && p > 0) {
      // Normalize to USD if currency is THB
      const inUsd = currency === 'THB' ? p / multiplier : p;
      setActiveBoughtPrice(inUsd);
    }
  };

  const handleResetBoughtPrice = () => {
    setBoughtPriceInput('');
    setActiveBoughtPrice(null);
  };

  const handleUsePreferredEntry = () => {
    if (plan?.entryPlan?.preferredZone) {
      const mid = (plan.entryPlan.preferredZone.priceMin + plan.entryPlan.preferredZone.priceMax) / 2;
      setBoughtPriceInput((mid * multiplier).toFixed(ticker.price < 1 ? 4 : 2));
      setActiveBoughtPrice(mid);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header & Live Coin Selector Bar */}
      <div 
        className="crypto-card card-overflow-visible" 
        style={{ 
          padding: '16px 20px', 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 16, 30, 0.98) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          overflow: 'visible',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', margin: 0, letterSpacing: '-0.5px' }}>
                {selectedSymbol}/{currency}
              </h1>
              <span 
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: ticker.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  fontFamily: 'monospace'
                }}
              >
                {prefix}{displayPrice}
              </span>
              <span 
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: ticker.change24h >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: ticker.change24h >= 0 ? '#10B981' : '#EF4444',
                  border: ticker.change24h >= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {ticker.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {ticker.change24h >= 0 ? `+${ticker.change24h.toFixed(2)}%` : `${ticker.change24h.toFixed(2)}%`}
              </span>
              <span 
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--neon-blue-light)',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="live-dot" />
                REAL-TIME INTELLIGENCE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>24H High: <strong style={{ color: '#FFF' }}>{formatPrice(ticker.high24h)}</strong></span>
              <span>24H Low: <strong style={{ color: '#FFF' }}>{formatPrice(ticker.low24h)}</strong></span>
              <span>24H Vol: <strong style={{ color: '#CBD5E1' }}>${(ticker.volume24h / 1e6).toFixed(1)}M</strong></span>
              <span>Sector: <strong style={{ color: 'var(--neon-cyan)' }}>{ticker.sector}</strong></span>
            </div>
          </div>

          {/* Quick Select & Search Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>ยอดนิยม:</span>
              {popularSymbols.slice(0, 6).map((sym) => {
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
                  >
                    {sym}
                  </button>
                );
              })}
            </div>

            {/* Custom Searchable Coin Select Combobox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                ค้นหา/เลือกเหรียญ:
              </span>
              <SearchableCoinSelect
                coins={allCoins}
                selectedSymbol={selectedSymbol}
                onSelectCoin={onSelectCoin}
                currency={currency}
                placeholder="ค้นหาเหรียญทั้งหมด 355+ ตัว..."
                width="310px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Position Management & Profit Protection Mode (Interactive Bar) */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#F59E0B" />
            <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>Position Management Mode:</strong>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            ต้นทุนที่ซื้อ:
          </span>
          <input
            type="number"
            step="any"
            placeholder={`ระบุต้นทุน (${prefix})`}
            value={boughtPriceInput}
            onChange={(e) => setBoughtPriceInput(e.target.value)}
            style={{
              backgroundColor: '#0B101E',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#FFF',
              padding: '4px 10px',
              fontSize: '12px',
              width: '130px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleApplyBoughtPrice}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #F59E0B',
              color: '#FBBF24',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            คำนวณการถือครอง
          </button>
          <button
            type="button"
            onClick={handleUsePreferredEntry}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--neon-blue-light)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ใช้ Preferred Entry ⭐
          </button>
          {activeBoughtPrice && (
            <button
              type="button"
              onClick={handleResetBoughtPrice}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              รีเซ็ต
            </button>
          )}
        </div>

        {/* Protection Realtime Metric */}
        {plan?.profitProtection && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>กำไร/ขาดทุน: </span>
              <strong style={{ color: plan.profitProtection.profitPct >= 0 ? '#10B981' : '#EF4444', fontSize: '13px' }}>
                {plan.profitProtection.profitPct >= 0 ? `+${plan.profitProtection.profitPct}%` : `${plan.profitProtection.profitPct}%`}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Move Stop: </span>
              <strong style={{ color: 'var(--neon-cyan)' }}>{formatPrice(plan.profitProtection.moveStopLevel)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Trailing: </span>
              <strong style={{ color: '#FBBF24' }}>{plan.profitProtection.trailingStopPct}%</strong>
            </div>
            <div style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: '11px', fontWeight: 700 }}>
              {plan.profitProtection.recommendedActionTh}
            </div>
          </div>
        )}
      </div>

      {/* 3. Hero AI SIGNAL & Trading Decision Banner (Exact User Mockup) */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: `2px solid ${plan?.decision?.badgeColor || '#3B82F6'}`,
          borderRadius: '12px',
          padding: '18px 22px',
          boxShadow: `0 0 25px ${plan?.decision?.badgeColor ? `${plan.decision.badgeColor}22` : 'rgba(59, 130, 246, 0.15)'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>
                AI TRADING SIGNAL:
              </span>
              <span 
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  padding: '4px 14px',
                  borderRadius: '8px',
                  backgroundColor: `${plan?.decision?.badgeColor || '#3B82F6'}25`,
                  color: plan?.decision?.badgeColor || '#3B82F6',
                  border: `1.5px solid ${plan?.decision?.badgeColor || '#3B82F6'}`,
                  letterSpacing: '0.5px'
                }}
              >
                {plan?.decision?.status || 'WAIT'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                (ความแม่นยำทางสถิติ MTF 92%)
              </span>
            </div>

            {/* Verdict statement */}
            <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
              {plan?.decision?.verdictTh}
            </div>

            {/* Key Action Anchors */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '13px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--neon-green-light)' }}>
                <strong>{plan?.decision?.preferredEntryTextTh}</strong>
              </span>
              <span style={{ color: 'var(--neon-red)' }}>
                <strong>{plan?.decision?.invalidationTextTh}</strong>
              </span>
              <span style={{ color: 'var(--neon-blue-light)' }}>
                <strong>{plan?.decision?.suitableStyleTh}</strong>
              </span>
            </div>
          </div>

          {/* Scores Overview Badge Group */}
          {plan?.scores && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', minWidth: '280px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ENTRY SCORE</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: plan.scores.entryScore >= 75 ? '#10B981' : '#F59E0B' }}>
                  {plan.scores.entryScore}/100
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>TECHNICAL</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#3B82F6' }}>
                  {plan.scores.technicalScore}/100
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>EXIT SCORE</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: plan.scores.exitScore >= 70 ? '#EF4444' : '#10B981' }}>
                  {plan.scores.exitScore}/100
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Holding Horizon Engine (Short / Swing / Long) */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '12px' }}>
          <div className="card-title" style={{ fontSize: '15px' }}>
            <Compass size={17} color="var(--neon-cyan)" />
            Holding Horizon Engine (ระยะเวลาการถือครองที่เหมาะสม)
          </div>
          <span 
            style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              padding: '3px 10px', 
              borderRadius: '6px', 
              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
              color: 'var(--neon-blue-light)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            {plan?.holdingHorizon?.suitableTitleTh}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {/* Short-term Card */}
          {plan?.holdingHorizon?.horizons && (
            <>
              <div 
                style={{ 
                  padding: '14px', 
                  borderRadius: '10px', 
                  backgroundColor: plan.holdingHorizon.primarySuitable === 'SHORT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: plan.holdingHorizon.primarySuitable === 'SHORT' ? '1.5px solid var(--neon-blue)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#FFF' }}>
                    <Zap size={14} color="#FBBF24" />
                    SHORT-TERM
                  </div>
                  <span style={{ color: '#FBBF24', fontSize: '14px', fontWeight: 900, letterSpacing: '2px' }}>
                    {plan.holdingHorizon.horizons.short.starDisplay}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {plan.holdingHorizon.horizons.short.durationTh} • เน้น 5m/15m/30m/1H
                </div>
                <p style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '8px', lineHeight: 1.4 }}>
                  {plan.holdingHorizon.horizons.short.rationaleTh}
                </p>
              </div>

              {/* Swing / Medium-term Card */}
              <div 
                style={{ 
                  padding: '14px', 
                  borderRadius: '10px', 
                  backgroundColor: plan.holdingHorizon.primarySuitable === 'SWING' || plan.holdingHorizon.primarySuitable === 'SWING_AND_LONG' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: plan.holdingHorizon.primarySuitable === 'SWING' || plan.holdingHorizon.primarySuitable === 'SWING_AND_LONG' ? '1.5px solid var(--neon-green)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#FFF' }}>
                    <TrendingUp size={14} color="#10B981" />
                    SWING / MEDIUM
                  </div>
                  <span style={{ color: '#10B981', fontSize: '14px', fontWeight: 900, letterSpacing: '2px' }}>
                    {plan.holdingHorizon.horizons.swing.starDisplay}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {plan.holdingHorizon.horizons.swing.durationTh} • เน้น 1H/4H/1D + Fibo
                </div>
                <p style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '8px', lineHeight: 1.4 }}>
                  {plan.holdingHorizon.horizons.swing.rationaleTh}
                </p>
              </div>

              {/* Long-term Card */}
              <div 
                style={{ 
                  padding: '14px', 
                  borderRadius: '10px', 
                  backgroundColor: plan.holdingHorizon.primarySuitable === 'LONG' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: plan.holdingHorizon.primarySuitable === 'LONG' ? '1.5px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#FFF' }}>
                    <Award size={14} color="#A78BFA" />
                    LONG-TERM
                  </div>
                  <span style={{ color: '#A78BFA', fontSize: '14px', fontWeight: 900, letterSpacing: '2px' }}>
                    {plan.holdingHorizon.horizons.long.starDisplay}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {plan.holdingHorizon.horizons.long.durationTh} • เน้น 1D/1W + Fundamentals
                </div>
                <p style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '8px', lineHeight: 1.4 }}>
                  {plan.holdingHorizon.horizons.long.rationaleTh}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 5. Chart & Live TradingView Technical Gauge */}
      <MainChartWidget
        symbol={selectedSymbol}
        ticker={ticker}
        candles={candles}
        currency={currency}
      />

      {/* 6. Multi-Timeframe RSI Risk & Divergence Engine (7 Timeframes: 5m, 15m, 30m, 1H, 4H, 1D, 1W) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        {/* RSI Multi-Timeframe Matrix */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-row" style={{ marginBottom: '10px' }}>
              <div className="card-title" style={{ fontSize: '14.5px' }}>
                <Layers size={16} color="var(--neon-cyan)" />
                RSI Multi-Timeframe Risk Matrix (7 Timeframes)
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ห้ามเฉลี่ยรวมเป็นเลขเดียว</span>
            </div>

            <table className="crypto-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>TF</th>
                  <th>น้ำหนัก</th>
                  <th>RSI (14)</th>
                  <th>ระดับความเสี่ยง (Risk Tier)</th>
                  <th>Slope</th>
                  <th>Divergence</th>
                </tr>
              </thead>
              <tbody>
                {plan?.rsiMultiTimeframe?.items?.map((item) => (
                  <tr key={item.timeframe}>
                    <td style={{ fontWeight: 800, color: 'var(--neon-blue-light)' }}>{item.timeframe}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.weightPct}%</td>
                    <td style={{ fontWeight: 800, color: item.risk.badgeColor, fontFamily: 'monospace', fontSize: '13px' }}>
                      {item.rsi}
                    </td>
                    <td>
                      <span 
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: `${item.risk.badgeColor}1A`,
                          color: item.risk.badgeColor,
                          fontWeight: 700,
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {item.risk.badgeEmoji} {item.risk.labelTh}
                      </span>
                    </td>
                    <td style={{ color: item.slope === 'Rising' ? '#10B981' : item.slope === 'Falling' ? '#EF4444' : '#94A3B8' }}>
                      {item.slope === 'Rising' ? '↑ Rising' : item.slope === 'Falling' ? '↓ Falling' : '→ Flat'}
                    </td>
                    <td>
                      {item.divergence ? (
                        <span 
                          title={item.divergence.description} 
                          style={{ 
                            color: item.divergence.type.includes('Bullish') ? '#10B981' : '#EF4444',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'help'
                          }}
                        >
                          {item.divergence.type.includes('Bullish') ? '⭐ Bull Div' : '⚠ Bear Div'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Risk Badges Summary */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Short-term Risk: </span>
                <strong style={{ color: plan?.rsiMultiTimeframe?.shortTermRisk === 'HIGH' ? '#EF4444' : '#10B981' }}>
                  {plan?.rsiMultiTimeframe?.shortTermRisk}
                </strong>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Swing Risk: </span>
                <strong style={{ color: plan?.rsiMultiTimeframe?.swingRisk === 'HIGH' ? '#EF4444' : '#10B981' }}>
                  {plan?.rsiMultiTimeframe?.swingRisk}
                </strong>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Long-term Risk: </span>
                <strong style={{ color: plan?.rsiMultiTimeframe?.longTermRisk === 'HIGH' ? '#EF4444' : '#10B981' }}>
                  {plan?.rsiMultiTimeframe?.longTermRisk}
                </strong>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#CBD5E1',
            }}
          >
            <strong>ผลวิเคราะห์ RSI รวม:</strong> {plan?.rsiMultiTimeframe?.summaryTh}
          </div>
        </div>

        {/* TradingView Consensus Meter */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-row" style={{ marginBottom: '8px' }}>
            <div className="card-title" style={{ fontSize: '14.5px' }}>
              <Target size={16} color="var(--neon-blue-light)" />
              TradingView Consensus Meter (Live Feed)
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '340px', width: '100%', overflow: 'hidden', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner, #0B101E)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <TradingViewTechnicalGauge symbol={selectedSymbol} height="100%" />
          </div>
        </div>
      </div>

      {/* 7. Fibonacci Retracements & Extensions with High Confluence Support */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '12px' }}>
          <div className="card-title" style={{ fontSize: '15px' }}>
            <Flame size={16} color="#F59E0B" />
            Fibonacci Retracements & Extensions (Auto Swing Detection)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Swing Low: <strong style={{ color: '#FFF' }}>{formatPrice(plan?.fibonacci?.swingLow || 0)}</strong> • Swing High: <strong style={{ color: '#FFF' }}>{formatPrice(plan?.fibonacci?.swingHigh || 0)}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Retracements Table */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--neon-blue-light)', marginBottom: '8px' }}>
              FIBONACCI RETRACEMENT (การย่อตัว)
            </div>
            <table className="crypto-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>ระดับ (Ratio)</th>
                  <th>ราคา ({prefix})</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {plan?.fibonacci?.retracements?.map((lvl) => (
                  <tr key={lvl.ratio} style={{ backgroundColor: lvl.isGoldenZone ? 'rgba(245, 158, 11, 0.08)' : 'transparent' }}>
                    <td style={{ fontWeight: 800, color: lvl.isGoldenZone ? '#FBBF24' : '#CBD5E1' }}>
                      {lvl.label}
                    </td>
                    <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>
                      {formatPrice(lvl.price)}
                    </td>
                    <td>
                      {lvl.isGoldenZone ? (
                        <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '11px' }}>
                          ⭐ Golden Zone (0.618)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {lvl.ratio === 0.5 ? 'Mid Equilibrium' : lvl.ratio === 0.382 ? 'Shallow Retracement' : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extensions & Confluence Support Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--neon-green-light)', marginBottom: '8px' }}>
                FIBONACCI EXTENSION (เป้าหมายกำไร)
              </div>
              <table className="crypto-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>ระดับ (Ratio)</th>
                    <th>ราคา ({prefix})</th>
                    <th>เป้าหมาย</th>
                  </tr>
                </thead>
                <tbody>
                  {plan?.fibonacci?.extensions?.map((ext) => (
                    <tr key={ext.ratio} style={{ backgroundColor: ext.ratio === 1.618 ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                      <td style={{ fontWeight: 800, color: ext.ratio === 1.618 ? 'var(--neon-green-light)' : '#CBD5E1' }}>
                        {ext.label}
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>
                        {formatPrice(ext.price)}
                      </td>
                      <td>
                        <span style={{ color: ext.ratio === 1.618 ? '#10B981' : 'var(--text-muted)', fontSize: '11px', fontWeight: ext.ratio === 1.618 ? 800 : 500 }}>
                          {ext.ratio === 1.272 ? 'TP3 Target' : ext.ratio === 1.618 ? '⭐ Golden Target TP4' : 'Expansion Target'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* High Confluence Support Box (Rule 6) */}
            {plan?.fibonacci?.confluenceSupport && (
              <div 
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900, color: '#FBBF24', fontSize: '13px' }}>
                    <Flame size={16} color="#FBBF24" />
                    🔥 HIGH CONFLUENCE SUPPORT
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#F59E0B', color: '#000', fontWeight: 900 }}>
                    Quality Score {plan.fibonacci.confluenceSupport.entryQualityScore}/100
                  </span>
                </div>

                <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: 800, color: '#FFF' }}>
                  โซนสนับสนุนหลัก: {formatPrice(plan.fibonacci.confluenceSupport.priceMin)} – {formatPrice(plan.fibonacci.confluenceSupport.priceMax)}
                </div>

                <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '11.5px', color: '#CBD5E1', lineHeight: 1.5 }}>
                  {plan.fibonacci.confluenceSupport.confluenceFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. 3-Tier Entry Plan (Zones) + Stop Loss & Invalidation Plan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        {/* Entry Plan Card */}
        <div className="crypto-card">
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div className="card-title" style={{ fontSize: '15px' }}>
              <Target size={16} color="var(--neon-green)" />
              Entry Plan (แบ่งเป็นโซน ไม่ใช่เลขเดียว)
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry Quality {plan?.entryPlan?.entryScore}/100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plan?.entryPlan?.zones?.map((zone) => (
              <div 
                key={zone.type}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: zone.isPreferred ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: zone.isPreferred ? '1.5px solid var(--neon-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: zone.isPreferred ? 'var(--neon-green-light)' : '#FFF' }}>
                    {zone.titleTh}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    ระยะห่าง {zone.distancePct >= 0 ? `+${zone.distancePct}%` : `${zone.distancePct}%`}
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFF', marginTop: '6px', fontFamily: 'monospace' }}>
                  {formatPrice(zone.priceMin)} – {formatPrice(zone.priceMax)}
                </div>

                <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '11.5px', color: '#94A3B8', lineHeight: 1.4 }}>
                  {zone.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Stop Loss & Invalidation Rule Card */}
        <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>
                <ShieldAlert size={16} color="var(--neon-red)" />
                Stop Loss & Invalidation Plan
              </div>
              <span style={{ fontSize: '11px', color: 'var(--neon-red)', fontWeight: 800 }}>
                Risk: -{plan?.stopLoss?.riskPct}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Technical SL (จุดตัดขาดทุนทางเทคนิค)</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#EF4444', fontFamily: 'monospace' }}>
                    {formatPrice(plan?.stopLoss?.technicalSl || 0)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk Exposure</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                    -{plan?.stopLoss?.riskPct}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hard Stop (จุดตัดขาดทุนสูงสุดฉุกเฉิน)</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                    {formatPrice(plan?.stopLoss?.hardStop || 0)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Risk Limit</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    2.0% Equity Risk
                  </div>
                </div>
              </div>
            </div>

            {/* Invalidation Alert Clause (Rule 8) */}
            <div 
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '12px',
                color: '#FCA5A5',
                lineHeight: 1.5,
              }}
            >
              <strong>⚠ ข้อกำหนด Invalidation:</strong> {plan?.stopLoss?.invalidationTextTh}
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
            * ไม่ใช้ Stop Loss แบบสุ่มเป็น -5% แต่คำนวณจากโครงสร้าง Market Structure และ Golden Ratio
          </div>
        </div>
      </div>

      {/* 9. Take Profit Targets & Risk/Reward (R:R) Table */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '12px' }}>
          <div className="card-title" style={{ fontSize: '15px' }}>
            <Target size={16} color="var(--neon-green-light)" />
            Take Profit Targets & Risk/Reward (R:R) Ratio
          </div>
          <span 
            style={{ 
              fontSize: '11.5px', 
              fontWeight: 800, 
              color: plan?.takeProfits?.acceptableRrFound ? '#10B981' : '#F59E0B' 
            }}
          >
            เกณฑ์ขั้นต่ำ R:R ≥ 1:{plan?.takeProfits?.minAcceptableRr || 1.8}
          </span>
        </div>

        {plan?.takeProfits?.chaseWarning && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            {plan.takeProfits.chaseWarning}
          </div>
        )}

        <table className="crypto-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th>ระดับเป้าหมาย</th>
              <th>ราคาเป้าหมาย ({prefix})</th>
              <th>ผลตอบแทน (Reward %)</th>
              <th>สัดส่วน Risk/Reward (R:R)</th>
              <th>เหตุผลรองรับ (Rationale)</th>
            </tr>
          </thead>
          <tbody>
            {plan?.takeProfits?.targets?.map((target) => (
              <tr key={target.level}>
                <td style={{ fontWeight: 900, color: 'var(--neon-cyan)' }}>{target.level}</td>
                <td style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '13px' }}>
                  {formatPrice(target.targetPrice)}
                </td>
                <td style={{ fontWeight: 800, color: '#10B981' }}>
                  +{target.gainPct}%
                </td>
                <td>
                  <span 
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: target.rrRatio >= 2.0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: target.rrRatio >= 2.0 ? '#10B981' : 'var(--neon-blue-light)',
                      fontWeight: 800,
                    }}
                  >
                    1 : {target.rrRatio}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {target.rationaleTh}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 10. Exit Score & Warning Intelligence */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '12px' }}>
          <div className="card-title" style={{ fontSize: '15px' }}>
            <Activity size={16} color="#F59E0B" />
            Exit Score & Warning Intelligence (วิเคราะห์จังหวะออก ไม่ใช่เก่งเฉพาะตอนซื้อ)
          </div>
          <span 
            style={{
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: plan?.exitIntelligence?.exitScore && plan.exitIntelligence.exitScore >= 70 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: plan?.exitIntelligence?.exitScore && plan.exitIntelligence.exitScore >= 70 ? '#EF4444' : '#10B981',
              border: plan?.exitIntelligence?.exitScore && plan.exitIntelligence.exitScore >= 70 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            EXIT STATUS: {plan?.exitIntelligence?.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>คะแนนแรงกดดันฝั่งขาย (Exit Score):</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: plan?.exitIntelligence?.exitScore && plan.exitIntelligence.exitScore >= 70 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
              {plan?.exitIntelligence?.exitScore} / 100
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              คำแนะนำ: <strong>{plan?.exitIntelligence?.statusTh}</strong>
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>เหตุผลและสัญญาณเตือนความเสี่ยง (Warning Factors):</div>
            <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '12px', color: '#FCA5A5', lineHeight: 1.5 }}>
              {plan?.exitIntelligence?.reasons?.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 11. 17 Live Technical Indicators Matrix */}
      <div className="crypto-card">
        <div className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
          Technical Indicators Matrix (17 ค่าชี้วัดทางเทคนิค)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', fontSize: '12px' }}>
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>EMA 9 / 20</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.ema9} / {indicators.ema20}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>EMA 50 / 200</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.ema50} / {indicators.ema200}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>RSI (14)</div>
            <div style={{ fontWeight: 800, marginTop: '2px', color: 'var(--neon-cyan)' }}>{indicators.rsi14}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>MACD (12,26,9)</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.macd.macd} / {indicators.macd.signal}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Bollinger Upper/Lower</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.bollingerBands.upper} / {indicators.bollingerBands.lower}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Supertrend</div>
            <div style={{ fontWeight: 800, marginTop: '2px', color: indicators.supertrend.direction === 'bullish' ? '#10B981' : '#EF4444' }}>
              {indicators.supertrend.value} ({indicators.supertrend.direction})
            </div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>ATR (14)</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.atr14}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>ADX (14)</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.adx14}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>VWAP</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.vwap}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>OBV</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.obv.toLocaleString()}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Fibonacci 0.618</div>
            <div style={{ fontWeight: 800, marginTop: '2px', color: '#F59E0B' }}>{indicators.fibonacci.level618}</div>
          </div>

          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Fibonacci 0.500</div>
            <div style={{ fontWeight: 800, marginTop: '2px' }}>{indicators.fibonacci.level500}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
