import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Crown, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Target, 
  ArrowUpRight, 
  Clock, 
  Compass, 
  ChevronRight, 
  ExternalLink, 
  Eye, 
  Sliders, 
  Activity, 
  AlertCircle,
  HelpCircle,
  History,
  Layers,
  BarChart3,
  Zap,
  ShieldCheck,
  Percent,
  Cpu,
  Coins,
  Gauge,
  Lock,
  Radio,
  ChevronDown,
  ChevronUp,
  Scale,
  ArrowRight,
  BookmarkPlus
} from 'lucide-react';
import { 
  Top5CandidateItem, 
  Top5Response, 
  Top5SnapshotHistory, 
  BuyNowCandidateItem,
  QuantV3OpportunityItem,
  QuantV3Scores,
  MultiModelConsensus,
  PositionSizingRecommendation,
  TrailingStopPlan
} from '../types/index.js';
import { api } from '../services/api.js';
import { formatCurrencyValue, getCurrencyMultiplier } from '../utils/currency.js';
import { PriceCell } from '../components/PriceCell.js';
import { CryptoIcon } from '../components/CryptoIcon.js';

interface Top5PageProps {
  currency: 'THB' | 'USDT';
  onSelectCoin: (symbol: string) => void;
  onOpenAnalysis?: (symbol: string) => void;
}

export const Top5Page: React.FC<Top5PageProps> = ({
  currency,
  onSelectCoin,
  onOpenAnalysis,
}) => {
  const [data, setData] = useState<Top5Response | null>(null);
  const [buyNowList, setBuyNowList] = useState<BuyNowCandidateItem[]>([]);
  const [opportunitiesList, setOpportunitiesList] = useState<QuantV3OpportunityItem[]>([]);
  const [buyNowStatus, setBuyNowStatus] = useState<string>('NORMAL');
  const [buyNowMessage, setBuyNowMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeView, setActiveView] = useState<'cards' | 'opportunities' | 'buynow' | 'history' | 'methodology'>('cards');
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [expandedScoresSymbol, setExpandedScoresSymbol] = useState<string | null>(null);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const loadQuantV3Data = async (force: boolean = false) => {
    if (force) setIsRecalculating(true);
    else setIsLoading(true);
    try {
      const [top5Res, buyNowRes, oppRes] = await Promise.all([
        force ? api.recalculateTop5() : api.getTop5(),
        force ? api.recalculateBuyNow() : api.getBuyNow(),
        force ? api.recalculateOpportunities() : api.getOpportunities(),
      ]);
      if (top5Res) {
        setData(top5Res);
        setLastFetchTime(new Date().toLocaleTimeString('th-TH'));
      }
      if (buyNowRes) {
        setBuyNowList(buyNowRes.candidates || []);
        setBuyNowStatus(buyNowRes.marketStatus);
        setBuyNowMessage(buyNowRes.marketMessage);
      }
      if (oppRes?.opportunities) {
        setOpportunitiesList(oppRes.opportunities);
      }
    } catch (err) {
      console.error('Failed to load Quant Engine V3 data:', err);
    } finally {
      setIsLoading(false);
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    loadQuantV3Data();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadQuantV3Data(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRankTheme = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          glow: 'rgba(245, 158, 11, 0.28)',
          border: 'rgba(245, 158, 11, 0.45)',
          badgeBg: 'rgba(245, 158, 11, 0.15)',
          badgeText: '#F59E0B',
          icon: Crown,
        };
      case 2:
        return {
          glow: 'rgba(16, 185, 129, 0.28)',
          border: 'rgba(16, 185, 129, 0.45)',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeText: '#10B981',
          icon: TrendingUp,
        };
      case 3:
        return {
          glow: 'rgba(6, 182, 212, 0.28)',
          border: 'rgba(6, 182, 212, 0.45)',
          badgeBg: 'rgba(6, 182, 212, 0.15)',
          badgeText: '#06B6D4',
          icon: Flame,
        };
      case 4:
        return {
          glow: 'rgba(168, 85, 247, 0.28)',
          border: 'rgba(168, 85, 247, 0.45)',
          badgeBg: 'rgba(168, 85, 247, 0.15)',
          badgeText: '#A855F7',
          icon: Sparkles,
        };
      case 5:
      default:
        return {
          glow: 'rgba(59, 130, 246, 0.28)',
          border: 'rgba(59, 130, 246, 0.45)',
          badgeBg: 'rgba(59, 130, 246, 0.15)',
          badgeText: '#3B82F6',
          icon: Target,
        };
    }
  };

  const getEntryStatusBadge = (status: string, extensionLevel?: string) => {
    if (extensionLevel === 'Overextended' || extensionLevel === 'Parabolic') {
      return { bg: 'rgba(239, 68, 68, 0.22)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.6)', label: 'DO NOT CHASE' };
    }
    switch (status) {
      case 'STRONG BUY NOW':
      case 'BUY NOW':
      case 'BUY ZONE':
        return { bg: 'rgba(16, 185, 129, 0.18)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.45)', label: status };
      case 'SCALE IN':
        return { bg: 'rgba(6, 182, 212, 0.18)', color: '#38BDF8', border: '1px solid rgba(6, 182, 212, 0.45)', label: status };
      case 'WAIT FOR RETEST':
        return { bg: 'rgba(245, 158, 11, 0.18)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.45)', label: 'WAIT FOR RETEST' };
      case 'DO NOT CHASE':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.5)', label: 'DO NOT CHASE' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.3)', label: status || 'WATCH' };
    }
  };

  const getExtensionBadge = (level: string) => {
    switch (level) {
      case 'Parabolic':
        return { color: '#EF4444', text: 'Parabolic (พุ่งทะลุแนว)', bg: 'rgba(239, 68, 68, 0.2)' };
      case 'Overextended':
        return { color: '#F87171', text: 'Overextended (ไล่ราคาสูง)', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'Extended':
        return { color: '#FBBF24', text: 'Extended (ตึงตัว)', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'Warm':
        return { color: '#38BDF8', text: 'Warm (โมเมนตัมอุ่นเครื่อง)', bg: 'rgba(6, 182, 212, 0.15)' };
      case 'Normal':
      default:
        return { color: '#34D399', text: 'Normal (ราคาปกติ)', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const getExitStatusBadge = (status: string) => {
    switch (status) {
      case 'HOLD STRONG':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', text: 'ถือต่ออย่างมั่นใจ (Hold Strong)' };
      case 'HOLD':
        return { color: '#34D399', bg: 'rgba(16, 185, 129, 0.1)', text: 'ถือรอสัญญาณ (Hold)' };
      case 'TAKE PROFIT PARTIAL':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', text: 'ทยอยแบ่งขายล็อกกำไร (TP Partial)' };
      case 'LOCK PROFIT':
        return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', text: 'ล็อกกำไร (Lock Profit)' };
      case 'TRAILING STOP':
        return { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', text: 'ยกจุดตัดขาดทุนตามราคา (Trailing Stop)' };
      case 'REDUCE':
        return { color: '#F87171', bg: 'rgba(239, 68, 68, 0.15)', text: 'ลดพอร์ต/ลดความเสี่ยง (Reduce)' };
      case 'EXIT':
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.25)', text: 'ขายปิดสถานะ (Exit Position)' };
      default:
        return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', text: status };
    }
  };

  const getConsensusColor = (verdict?: string) => {
    switch (verdict) {
      case 'STRONG_BULLISH': return '#10B981';
      case 'BULLISH': return '#34D399';
      case 'STRONG_BEARISH': return '#EF4444';
      case 'BEARISH': return '#F87171';
      default: return '#94A3B8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Hero Header */}
      <div
        className="crypto-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.90))',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F59E0B, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.45)',
                  flexShrink: 0,
                }}
              >
                <Crown size={24} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '23px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                    Quant Engine V3 — <span style={{ color: 'var(--neon-amber)' }}>Adaptive Crypto Decision Intelligence</span>
                  </h1>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: 'var(--neon-cyan)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    60-SECTION ENGINE
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--neon-green)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    11-MODEL CONSENSUS
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: 'var(--neon-cyan)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    🇹🇭 BITKUB THB PAIRS
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>
                  แยกขาด 21 Decoupled Scores | ปรับน้ำหนักตาม 12 สภาวะตลาด | Bitkub Primary (THB) + Composite Global Price Index | LLM มีหน้าที่อธิบายเท่านั้น
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recalculate Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div>คำนวณล่าสุด: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lastFetchTime || '-'}</span></div>
              <div style={{ color: 'var(--neon-green)', fontWeight: 600 }}>● Bitkub THB (เรท {data?.usdThbRate || 33.24} THB/USD)</div>
            </div>

            <button
              onClick={() => loadQuantV3Data(true)}
              disabled={isRecalculating}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--neon-blue), #2563EB)',
                cursor: isRecalculating ? 'not-allowed' : 'pointer',
                opacity: isRecalculating ? 0.7 : 1,
              }}
            >
              <RefreshCw size={15} className={isRecalculating ? 'spin' : ''} />
              <span>{isRecalculating ? 'กำลังประมวลผล V3...' : 'คำนวณอันดับใหม่'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 8 & 9: Market Regime & Dynamic Weighting Banner */}
        {data && (
          <div
            style={{
              marginTop: '20px',
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Gauge size={18} color="var(--neon-cyan)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Market Regime (12 โหมดตลาด):</span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    backgroundColor: 'rgba(59, 130, 246, 0.25)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                  }}
                >
                  {data.marketContext.marketRegimeTh || data.marketContext.marketRegime}
                </span>

                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  กลยุทธ์ที่ได้เปรียบ:
                </span>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 800,
                    color: 'var(--neon-green-light)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {data.marketContext.favoredStrategyTh || data.marketContext.favoredStrategy}
                </span>

                {data.marketContext.marketRegimeScore !== undefined && (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                    คะแนน Regime: <strong style={{ color: 'var(--text-primary)' }}>{data.marketContext.marketRegimeScore}/100</strong>
                    {' '}| ความเสี่ยงตลาด: <strong style={{ color: (data.marketContext.marketRiskScore || 0) > 60 ? '#EF4444' : 'var(--neon-green)' }}>{data.marketContext.marketRiskScore}/100</strong>
                  </span>
                )}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {data.marketContext.regimeAdviceTh || 'ตลาดเป็นขาขึ้น เหมาะสำหรับตามแรงส่งและหาเหรียญต้นรอบ'}
              </div>
            </div>

            {/* Dynamic Weights Pill Tags (Section 9) */}
            {data.marketContext.dynamicWeights && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--neon-amber)', fontWeight: 700 }}>
                  ⚖️ น้ำหนักคะแนนปัจจุบัน (Dynamic Weights):
                </span>
                {Object.entries(data.marketContext.dynamicWeights).map(([k, v]) => (
                  <span
                    key={k}
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'var(--bg-card-inner)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {k}: <strong>{Math.round(v * 100)}%</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Context KPIs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BTC Trend (1D)</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: data.marketContext.btcTrend === 'bull' ? 'var(--neon-green-light)' : 'var(--text-primary)', marginTop: '2px' }}>
                  {data.marketContext.btcTrendTh}
                </div>
              </div>

              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Fear &amp; Greed</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--neon-amber)', marginTop: '2px' }}>
                  {data.marketContext.fearAndGreedIndex}/100 ({data.marketContext.fearAndGreedSentiment})
                </div>
              </div>

              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Bitcoin Dominance</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--neon-cyan)', marginTop: '2px' }}>
                  {data.marketContext.btcDominance}%
                </div>
              </div>

              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Universe ตรวจสอบแล้ว</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {data.marketContext.totalActiveCoinsEvaluated} เหรียญ Bitkub
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Tabs (5 Tabs) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveView('cards')}
          style={{
            background: activeView === 'cards' ? 'var(--neon-blue)' : 'var(--bg-card-inner)',
            border: activeView === 'cards' ? '1px solid var(--neon-blue)' : '1px solid var(--border-color)',
            color: activeView === 'cards' ? '#FFF' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Award size={15} />
          <span>Top Overall Ranking (เหรียญเด่นรอบด้าน)</span>
        </button>

        <button
          onClick={() => setActiveView('opportunities')}
          style={{
            background: activeView === 'opportunities' ? '#8B5CF6' : 'var(--bg-card-inner)',
            border: activeView === 'opportunities' ? '1px solid #8B5CF6' : '1px solid var(--border-color)',
            color: activeView === 'opportunities' ? '#FFF' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={15} color={activeView === 'opportunities' ? '#FFF' : '#A78BFA'} />
          <span>Top Opportunities ("เหรียญไหนกำลังมา?")</span>
          {opportunitiesList.length > 0 && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '1px 6px',
                borderRadius: '10px',
                color: activeView === 'opportunities' ? '#FFF' : '#A78BFA',
              }}
            >
              {opportunitiesList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('buynow')}
          style={{
            background: activeView === 'buynow' ? 'var(--neon-green)' : 'var(--bg-card-inner)',
            border: activeView === 'buynow' ? '1px solid var(--neon-green)' : '1px solid var(--border-color)',
            color: activeView === 'buynow' ? '#FFF' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap size={15} color={activeView === 'buynow' ? '#FFF' : 'var(--neon-green)'} />
          <span>Top Buy Now (เข้าซื้อได้ทันที 0–5 เหรียญ)</span>
          {buyNowList.length > 0 ? (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '1px 6px',
                borderRadius: '10px',
                color: activeView === 'buynow' ? '#FFF' : '#34D399',
              }}
            >
              {buyNowList.length}
            </span>
          ) : (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.2)',
                padding: '1px 5px',
                borderRadius: '8px',
                color: '#F87171',
              }}
            >
              0 ผ่านเกณฑ์
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('history')}
          style={{
            background: activeView === 'history' ? 'var(--neon-blue)' : 'var(--bg-card-inner)',
            border: activeView === 'history' ? '1px solid var(--neon-blue)' : '1px solid var(--border-color)',
            color: activeView === 'history' ? '#FFF' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <History size={15} />
          <span>ประวัติอันดับ (Ranking Snapshots)</span>
        </button>

        <button
          onClick={() => setActiveView('methodology')}
          style={{
            background: activeView === 'methodology' ? 'var(--neon-blue)' : 'var(--bg-card-inner)',
            border: activeView === 'methodology' ? '1px solid var(--neon-blue)' : '1px solid var(--border-color)',
            color: activeView === 'methodology' ? '#FFF' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <HelpCircle size={15} />
          <span>ระเบียบวิธี Quant V3 (60 ข้อกำหนด)</span>
        </button>
      </div>

      {/* VIEW 1: TOP OVERALL CARDS */}
      {activeView === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isLoading && !data ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px auto' }} />
              <div>กำลังรันโมเดล Quant Engine V3 ประเมินเหรียญทั้งหมดใน Bitkub...</div>
            </div>
          ) : (
            data?.top5.map((coin) => {
              const theme = getRankTheme(coin.rank);
              const RoleIcon = theme.icon;
              const statusBadge = getEntryStatusBadge(coin.entryStatus, coin.extensionLevel);
              const extensionBadge = getExtensionBadge(coin.extensionLevel);
              const isPositive = coin.change24h >= 0;
              const isExpanded = expandedScoresSymbol === coin.symbol;

              return (
                <div
                  key={coin.symbol}
                  className="crypto-card"
                  style={{
                    padding: '24px 26px',
                    borderRadius: '16px',
                    border: `1.5px solid ${theme.border}`,
                    boxShadow: `0 8px 24px ${theme.glow}`,
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                >
                  {/* Card Header Row: Rank Badge + Role Badges + Symbol + Price + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Rank Emblem */}
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${theme.border}, rgba(0,0,0,0.6))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '19px',
                          boxShadow: `0 0 14px ${theme.glow}`,
                          flexShrink: 0,
                        }}
                      >
                        #{coin.rank}
                      </div>

                      {/* Coin Icon */}
                      <CryptoIcon symbol={coin.symbol} size={42} />

                      {/* Role & Name */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Dynamically Assigned Merit Badges (Section 35) */}
                          {(coin.badges && coin.badges.length > 0 ? coin.badges : [coin.role]).map((b, bIdx) => (
                            <span
                              key={bIdx}
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: bIdx === 0 ? theme.badgeBg : 'var(--bg-card-inner)',
                                color: bIdx === 0 ? theme.badgeText : 'var(--text-secondary)',
                                border: `1px solid ${bIdx === 0 ? theme.border : 'var(--border-color)'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {bIdx === 0 && <RoleIcon size={12} />}
                              {b}
                            </span>
                          ))}

                          {/* Entry Status Badge */}
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.color,
                              border: statusBadge.border,
                            }}
                          >
                            {statusBadge.label}
                          </span>

                          {/* Extension Warning Flag (Section 26) */}
                          {coin.extensionScore >= 70 && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: extensionBadge.bg,
                                color: extensionBadge.color,
                                border: `1px solid ${extensionBadge.color}40`,
                              }}
                            >
                              {extensionBadge.text}
                            </span>
                          )}

                          {/* Local Premium Risk Warning (Section 7) */}
                          {coin.isLocalPremiumRisk && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#F87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                              }}
                            >
                              Local Premium +{coin.exchangePremiumPct}% (ระวังราคาไทยแพงกว่าโลก)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                            {coin.pair || `${coin.symbol} / THB`}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--neon-green-light)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            🇹🇭 Bitkub THB
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{coin.name}</span>
                          {coin.sector && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {coin.sector}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        ราคา ({currency === 'THB' ? 'THB' : currency})
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>
                        <PriceCell price={coin.price * multiplier} prefix={prefix} />
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: isPositive ? 'var(--neon-green-light)' : 'var(--neon-red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '3px',
                          marginTop: '2px',
                        }}
                      >
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{isPositive ? '+' : ''}{coin.change24h.toFixed(2)}% (24H)</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 57: Standardized Reason Codes Strip */}
                  {coin.reasonCodes && coin.reasonCodes.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        เหตุผลเชิงระบบ (Reason Codes):
                      </span>
                      {coin.reasonCodes.map((code, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: code.includes('RISK') || code.includes('EXTENSION') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: code.includes('RISK') || code.includes('EXTENSION') ? '#F87171' : 'var(--neon-cyan)',
                            border: `1px solid ${code.includes('RISK') || code.includes('EXTENSION') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                          }}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Section 37: 11-Model Consensus Meter */}
                  {coin.modelConsensus && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card-inner)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={15} color="var(--neon-cyan)" />
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>ฉันทามติ 11 โมเดล (Model Consensus):</span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 900,
                            color: getConsensusColor(coin.modelConsensus.consensusVerdict),
                            backgroundColor: 'rgba(0, 0, 0, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            border: `1px solid ${getConsensusColor(coin.modelConsensus.consensusVerdict)}40`,
                          }}
                        >
                          {coin.modelConsensus.consensusVerdict} ({coin.modelConsensus.modelAgreementPct}% Agreement)
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--neon-green)' }}>▲ กระทิง {coin.modelConsensus.bullishVotes}</span>
                        <span style={{ color: 'var(--text-muted)' }}>― กลาง {coin.modelConsensus.neutralVotes}</span>
                        <span style={{ color: 'var(--neon-red)' }}>▼ หมี {coin.modelConsensus.bearishVotes}</span>
                      </div>
                    </div>
                  )}

                  {/* 4 Core Pillars KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Coin Quality Score</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-green-light)', marginTop: '2px' }}>
                        {coin.coinQualityScore} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Fundamental &amp; Tokenomics</div>
                    </div>

                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Technical &amp; MTF Score</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '2px' }}>
                        {coin.technicalScore} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{coin.mtfAlignment}</div>
                    </div>

                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Entry Quality Score</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-amber)', marginTop: '2px' }}>
                        {coin.entryScore} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>R:R {coin.riskRewardRatio || '2.2'}:1</div>
                    </div>

                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Risk &amp; Extension</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: coin.riskScore > 65 ? '#EF4444' : 'var(--text-primary)', marginTop: '2px' }}>
                        {coin.riskScore} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Ext: {coin.extensionScore}/100</div>
                    </div>
                  </div>

                  {/* Dynamic Trade Levels & Plan */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>โซนเข้าซื้อ (Entry Zone - THB)</span>
                      <strong style={{ color: 'var(--neon-cyan)', fontSize: '12.5px' }}>
                        {prefix}{(coin.entryZone.min * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })} – {prefix}{(coin.entryZone.max * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>แนวรับ (S1 / S2 - THB)</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {prefix}{((coin.dynamicLevels?.support1 || coin.support) * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>เป้า 1 (TP1 - THB) [R:R {coin.dynamicLevels?.rrTp1 || 2.2}]</span>
                      <strong style={{ color: 'var(--neon-green-light)' }}>
                        {prefix}{((coin.dynamicLevels?.tp1 || coin.target1) * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>เป้า 2 (TP2 - THB) [R:R {coin.dynamicLevels?.rrTp2 || 3.5}]</span>
                      <strong style={{ color: 'var(--neon-green-light)' }}>
                        {prefix}{((coin.dynamicLevels?.tp2 || coin.target2) * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>จุดตัดขาดทุน (Invalidation - THB)</span>
                      <strong style={{ color: 'var(--neon-red)' }}>
                        {prefix}{(coin.invalidation * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>ความคุ้มค่า Risk/Reward</span>
                      <strong style={{ color: 'var(--neon-amber)' }}>
                        1 : {coin.riskRewardRatio || coin.dynamicLevels?.rrTp1 || '2.2'}
                      </strong>
                    </div>
                  </div>

                  {/* Section 40 & 41: Position Sizing & Trailing Stop Recommendation */}
                  {(coin.positionSizing || coin.trailingStopPlan) && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card-inner)',
                        border: '1px solid var(--border-color)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '12px',
                        fontSize: '11px',
                      }}
                    >
                      {coin.positionSizing && (
                        <div>
                          <div style={{ color: 'var(--neon-amber)', fontWeight: 800, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Scale size={13} />
                            <span>การบริหารเงินทุน (Position Sizing - Section 41):</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            แนะนำขนาดสถานะ: <strong style={{ color: 'var(--text-primary)' }}>{coin.positionSizing.suggestedCapitalAllocationPct}% ของพอร์ต</strong> (ความเสี่ยง {coin.positionSizing.recommendedRiskPct}% ต่อไม้)
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
                            Fractional Kelly: {coin.positionSizing.fractionalKellyPct}% | Max Allowed: {coin.positionSizing.maxPositionPct}%
                          </div>
                        </div>
                      )}

                      {coin.trailingStopPlan && (
                        <div>
                          <div style={{ color: '#A855F7', fontWeight: 800, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Lock size={13} />
                            <span>แผน Trailing Stop (Section 40 — เลื่อนขึ้นเท่านั้น):</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            วิธี: <strong style={{ color: 'var(--text-primary)' }}>{coin.trailingStopPlan.stopType}</strong> | จุดขยับ: <strong style={{ color: '#A855F7' }}>{prefix}{(coin.trailingStopPlan.currentStopPrice * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}</strong>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
                            {coin.trailingStopPlan.recommendedAction}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle 21 Decoupled Scores Button */}
                  <div>
                    <button
                      onClick={() => setExpandedScoresSymbol(isExpanded ? null : coin.symbol)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--neon-cyan)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isExpanded ? 'ซ่อน' : 'แสดง'} คะแนนเชิงลึกครบทั้ง 21 Decoupled Scores (Quant V3 Spec)</span>
                    </button>

                    {isExpanded && coin.quantV3Scores && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-card-inner)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '8px',
                          fontSize: '11px',
                        }}
                      >
                        <div>Coin Quality: <strong style={{ color: '#34D399' }}>{coin.quantV3Scores.coinQualityScore}</strong></div>
                        <div>Technical: <strong style={{ color: '#38BDF8' }}>{coin.quantV3Scores.technicalScore}</strong></div>
                        <div>Trend: <strong style={{ color: '#38BDF8' }}>{coin.quantV3Scores.trendScore}</strong></div>
                        <div>Momentum: <strong style={{ color: '#38BDF8' }}>{coin.quantV3Scores.momentumScore}</strong></div>
                        <div>Relative Strength: <strong style={{ color: '#FBBF24' }}>{coin.quantV3Scores.relativeStrengthScore}</strong></div>
                        <div>Liquidity: <strong style={{ color: '#A78BFA' }}>{coin.quantV3Scores.liquidityScore}</strong></div>
                        <div>Execution: <strong style={{ color: '#A78BFA' }}>{coin.quantV3Scores.executionScore}</strong></div>
                        <div>Order Flow: <strong style={{ color: '#A78BFA' }}>{coin.quantV3Scores.orderFlowScore}</strong></div>
                        <div>On-Chain: <strong style={{ color: '#34D399' }}>{coin.quantV3Scores.onchainScore}</strong></div>
                        <div>Fundamental: <strong style={{ color: '#34D399' }}>{coin.quantV3Scores.fundamentalScore}</strong></div>
                        <div>Tokenomics: <strong style={{ color: '#34D399' }}>{coin.quantV3Scores.tokenomicsScore}</strong></div>
                        <div>Catalyst: <strong style={{ color: '#C084FC' }}>{coin.quantV3Scores.catalystScore}</strong></div>
                        <div>Attention: <strong style={{ color: '#C084FC' }}>{coin.quantV3Scores.attentionScore}</strong></div>
                        <div>Opportunity: <strong style={{ color: '#38BDF8' }}>{coin.quantV3Scores.opportunityScore}</strong></div>
                        <div>Entry Quality: <strong style={{ color: '#FBBF24' }}>{coin.quantV3Scores.entryScore}</strong></div>
                        <div>Buy Now Score: <strong style={{ color: '#10B981' }}>{coin.quantV3Scores.buyNowScore}</strong></div>
                        <div>Risk Score: <strong style={{ color: coin.quantV3Scores.riskScore > 60 ? '#EF4444' : 'var(--text-muted)' }}>{coin.quantV3Scores.riskScore}</strong></div>
                        <div>Extension: <strong style={{ color: coin.quantV3Scores.extensionScore >= 70 ? '#EF4444' : 'var(--text-muted)' }}>{coin.quantV3Scores.extensionScore}</strong></div>
                        <div>Exit Score: <strong style={{ color: 'var(--text-muted)' }}>{coin.quantV3Scores.exitScore}</strong></div>
                        <div>Profit Protect: <strong style={{ color: '#FBBF24' }}>{coin.quantV3Scores.profitProtectionScore}</strong></div>
                        <div>Confidence: <strong style={{ color: 'var(--neon-green-light)' }}>{coin.quantV3Scores.confidenceScore}</strong></div>
                      </div>
                    )}
                  </div>

                  {/* Why Top 5 Quant Bullet Points & AI Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={13} color="var(--neon-green)" />
                        <span>เหตุผลเชิงปริมาณที่ติด Top Overall (Section 35):</span>
                      </div>
                      <div className="custom-large-scrollbar" style={{ maxHeight: '140px', overflowY: 'auto', paddingRight: '6px' }}>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          {coin.whyTop5.map((reason, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#C084FC', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sparkles size={13} color="#C084FC" />
                        <span>บทวิเคราะห์สรุป AI (Quantitative Explanation Only - Section 58):</span>
                      </div>
                      <div className="custom-large-scrollbar" style={{ maxHeight: '140px', overflowY: 'auto', paddingRight: '6px' }}>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          {coin.aiSummaryTh}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                    <button
                      onClick={() => onSelectCoin(coin.symbol)}
                      className="btn-secondary"
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                    >
                      <Eye size={13} />
                      <span>เปิดดูกราฟสด ({coin.symbol})</span>
                    </button>
                    <button
                      onClick={() => onOpenAnalysis && onOpenAnalysis(coin.symbol)}
                      className="btn-primary"
                      style={{ fontSize: '11.5px', padding: '6px 14px' }}
                    >
                      <ExternalLink size={13} />
                      <span>วิเคราะห์ 17 อินดิเคเตอร์ละเอียด</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: TOP OPPORTUNITIES ("เหรียญไหนกำลังมา?" - Section 31) */}
      {activeView === 'opportunities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.06))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={18} color="#A78BFA" />
              <strong style={{ color: '#A78BFA', fontSize: '14px' }}>
                Top Opportunities ("เหรียญไหนกำลังมา?" - Section 31):
              </strong>
            </div>
            <p style={{ margin: 0 }}>
              คัดเลือกเหรียญที่มี Momentum Acceleration สูง มีสัญญาณ Breakout Squeeze เริ่มต้น และ Relative Strength นำตลาด universe เพื่อค้นหาเหรียญต้นรอบก่อนตลาดตระหนัก
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {opportunitiesList.map((opp) => (
              <div
                key={opp.symbol}
                className="crypto-card"
                style={{
                  padding: '18px 20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#A78BFA',
                        fontWeight: 900,
                        fontSize: '14px',
                      }}
                    >
                      #{opp.rank}
                    </div>
                    {/* Coin Icon */}
                    <CryptoIcon symbol={opp.symbol} size={30} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>
                          {opp.pair || `${opp.symbol} / THB`}
                        </span>
                        <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--neon-green-light)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          THB
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opp.sector || opp.leadLagRole}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>ราคา ({currency})</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>
                      <PriceCell price={opp.price * multiplier} prefix={prefix} />
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: opp.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {opp.change24h >= 0 ? '+' : ''}{opp.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Opportunity Score & Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Opportunity</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#A78BFA' }}>{opp.opportunityScore}p</div>
                  </div>
                  <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Breakout Quality</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8' }}>{opp.breakoutQualityScore}p</div>
                  </div>
                  <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>RS Score</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FBBF24' }}>{opp.relativeStrengthScore}p</div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div>• โซนความได้เปรียบ: <strong style={{ color: 'var(--neon-cyan)' }}>{opp.setupStage} ({opp.leadLagRole})</strong></div>
                  <div>• สัญญาณนำ: <strong style={{ color: 'var(--text-primary)' }}>{opp.catalyst || 'Volume Expansion นำตลาด'}</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '4px' }}>
                  <button
                    onClick={() => onSelectCoin(opp.symbol)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    <Eye size={12} />
                    <span>ดูกราฟ</span>
                  </button>
                  <button
                    onClick={() => onOpenAnalysis && onOpenAnalysis(opp.symbol)}
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                  >
                    <ExternalLink size={12} />
                    <span>วิเคราะห์ลึก</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: TOP 5 BUY NOW (Strictly 0 to 5 Candidates - Section 33 & 34) */}
      {activeView === 'buynow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hard Gates Explanation Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={18} color="var(--neon-green)" />
              <strong style={{ color: 'var(--neon-green)', fontSize: '14px' }}>
                เกณฑ์คัดกรอง Top Buy Now Hard Gates (Section 33 &amp; 34 — แสดง 0 ถึง 5 เหรียญอย่างเข้มงวด):
              </strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '6px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span style={{ color: 'var(--neon-green)', fontWeight: 800 }}>• Entry Quality ≥ 80:</span> ตำแหน่งราคาอยู่ใกล้แนวรับสำคัญ มีโครงสร้าง Retest ชัดเจน
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span style={{ color: 'var(--neon-green)', fontWeight: 800 }}>• Risk/Reward ≥ 1:2.0:</span> หาก R:R ต่ำกว่า 1:2 ปฏิเสธทันทีแม้กราฟเทคนิคจะสูง
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span style={{ color: 'var(--neon-green)', fontWeight: 800 }}>• ไม่ไล่ราคา (Extension &lt; 75):</span> ป้องกันการติดดอยจาก FOMO และ Parabolic Move
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span style={{ color: 'var(--neon-green)', fontWeight: 800 }}>• ห้ามบังคับครบ 5:</span> หากไม่มีเหรียญที่ผ่านเกณฑ์ ระบบจะแสดง 0 เหรียญ เพื่อรักษาวินัยการเทรด
              </div>
            </div>
          </div>

          {buyNowList.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                background: 'var(--bg-card-inner)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <ShieldAlert size={48} color="#FBBF24" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                NO BUY NOW OPPORTUNITY
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '580px', margin: '8px auto 16px auto', lineHeight: 1.6 }}>
                {buyNowMessage || 'ไม่พบเหรียญที่ผ่านเกณฑ์ Hard Gate ทั้ง 12 ข้อตามวินัย Quant Engine V3 (R:R ≥ 1:2, Entry ≥ 80, Technical ≥ 75, Extension < 75) ในขณะนี้'}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--neon-amber)', fontSize: '12px', fontWeight: 700 }}>
                <Lock size={13} />
                <span>หลักการวินัย: NO SETUP = NO TRADE | CAPITAL PRESERVATION FIRST</span>
              </div>
            </div>
          ) : (
            buyNowList.map((coin) => (
              <div
                key={coin.symbol}
                className="crypto-card"
                style={{
                  padding: '24px 26px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(16, 185, 129, 0.45)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--neon-green)',
                        fontWeight: 900,
                        fontSize: '18px',
                      }}
                    >
                      #{coin.rank}
                    </div>
                    {/* Coin Icon */}
                    <CryptoIcon symbol={coin.symbol} size={42} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                          {coin.pair || `${coin.symbol} / THB`}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--neon-green-light)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          🇹🇭 Bitkub THB
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{coin.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '5px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--neon-green)' }}>
                          BUY NOW SCORE: {coin.buyNowScore}p
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {coin.setup} • {coin.currentTrend}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      ราคา ({currency === 'THB' ? 'THB' : currency})
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>
                      <PriceCell price={coin.price * multiplier} prefix={prefix} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: coin.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Entry Plan Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '11.5px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Entry Zone (THB)</span>
                    <strong style={{ color: 'var(--neon-cyan)', fontSize: '12.5px' }}>
                      {prefix}{(coin.entryZone.min * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })} – {prefix}{(coin.entryZone.max * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Stop Loss (THB)</span>
                    <strong style={{ color: 'var(--neon-red)' }}>
                      {prefix}{(coin.stopLoss * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>TP1 (THB) ({coin.rrTp1 ? `R:R ${coin.rrTp1}` : 'R:R 2.2'})</span>
                    <strong style={{ color: 'var(--neon-green)' }}>
                      {prefix}{(coin.tp1 * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>TP2 (THB)</span>
                    <strong style={{ color: 'var(--neon-green)' }}>
                      {prefix}{(coin.tp2 * multiplier).toLocaleString(undefined, { maximumFractionDigits: (coin.price * multiplier) < 1 ? 4 : 2 })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>ความคุ้มค่า Risk/Reward</span>
                    <strong style={{ color: 'var(--neon-amber)' }}>
                      1 : {coin.rrRatio.toFixed(1)}
                    </strong>
                  </div>
                </div>

                {/* Position Sizing Recommendation */}
                {coin.positionSizing && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card-inner)' }}>
                    🎯 แนะนำ Position Size: <strong style={{ color: 'var(--text-primary)' }}>{coin.positionSizing.suggestedCapitalAllocationPct}% ของพอร์ต</strong> (ความเสี่ยง {coin.positionSizing.recommendedRiskPct}% ต่อไม้) | Trailing Stop: {coin.trailingStopPlan?.stopType || 'ATR Trailing'}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => onSelectCoin(coin.symbol)}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                  >
                    <Eye size={13} />
                    <span>ดูกราฟ</span>
                  </button>
                  <button
                    onClick={() => onOpenAnalysis && onOpenAnalysis(coin.symbol)}
                    className="btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 14px' }}
                  >
                    <ExternalLink size={13} />
                    <span>วิเคราะห์เต็ม</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 4: RANKING SNAPSHOTS HISTORY */}
      {activeView === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.05))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '12px',
              color: '#CBD5E1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <History size={16} color="var(--neon-cyan)" />
              <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>
                บันทึกการจัดอันดับย้อนหลัง (Ranking Snapshots - Section 46):
              </strong>
            </div>
            <span>เก็บบันทึกอันดับ คะแนน และการขยับขึ้นลง (UP / DOWN / SAME / NEW) ทุกรอบการคำนวณ เพื่อให้ตรวจสอบความเสถียรของสัญญาณย้อนหลังได้</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.history.map((snap) => (
              <div
                key={snap.id}
                className="crypto-card"
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    ⏱ รอบเวลา: <strong style={{ color: 'var(--text-primary)' }}>{new Date(snap.timestamp).toLocaleTimeString('th-TH')}</strong> ({new Date(snap.timestamp).toLocaleDateString('th-TH')})
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--neon-cyan)' }}>Snapshot ID: {snap.id}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {snap.top5.map((item) => (
                    <div
                      key={item.symbol}
                      onClick={() => onSelectCoin(item.symbol)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card-inner)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--neon-amber)' }}>#{item.rank}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-primary)' }}>{item.pair || `${item.symbol}/THB`}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.role}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--neon-cyan)' }}>
                          {item.finalScore}p
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: item.movement === 'UP' ? 'var(--neon-green-light)' : item.movement === 'DOWN' ? 'var(--neon-red)' : item.movement === 'NEW' ? 'var(--neon-amber)' : 'var(--text-muted)',
                          }}
                        >
                          {item.movement === 'UP' ? '▲ ขยับขึ้น' : item.movement === 'DOWN' ? '▼ ย่อลง' : item.movement === 'NEW' ? '★ ติดอันดับใหม่' : '― คงเดิม'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: QUANT ENGINE V3 ARCHITECTURE (60 SECTIONS COMPREHENSIVE METHODOLOGY) */}
      {activeView === 'methodology' && (
        <div className="crypto-card" style={{ padding: '28px', lineHeight: 1.65 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Compass size={22} color="var(--neon-cyan)" />
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Quant Engine V3 — Adaptive Crypto Decision Intelligence Engine (ระเบียบวิธี 60 ข้อกำหนด)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--neon-amber)', margin: '4px 0 0 0', fontWeight: 700 }}>
                ปรัชญาหลัก: GOOD COIN ≠ GOOD TREND ≠ GOOD SETUP ≠ GOOD ENTRY ≠ GOOD RISK/REWARD
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {/* Core Philosophy Banner */}
            <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.06))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>🛡️ หลักการสำคัญและข้อห้ามเด็ดขาด (Core Principles):</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '10px' }}>
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <strong style={{ color: 'var(--neon-green)' }}>NO LLM SCORING:</strong> ระบบห้ามใช้ LLM เป็นผู้คิดคะแนนหรือเลือกเหรียญโดยตรง ตัวเลขทั้งหมดต้องมาจาก Quant Engine เท่านั้น LLM มีหน้าที่สรุปและอธิบาย
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <strong style={{ color: '#38BDF8' }}>NO SETUP = NO TRADE:</strong> ถ้าไม่มีจังหวะที่ได้เปรียบ หรือ R:R ต่ำกว่า 1:2.0 ระบบจะปฏิเสธการเข้าซื้อทันทีแม้เหรียญนั้นจะเป็น Good Coin ก็ตาม
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <strong style={{ color: '#FBBF24' }}>DO NOT CHASE:</strong> หากราคา Extension &ge; 75 หรือ Local Premium ไทยแพงกว่าตลาดโลก ระบบจะ Override เป็น "DO NOT CHASE" เพื่อรักษาเงินทุน
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <strong style={{ color: '#F87171' }}>CAPITAL PRESERVATION:</strong> เป้าหมายไม่ใช่การทำนายราคาให้ถูกทุกครั้ง แต่คือการตอบอย่างมีวินัยว่าเมื่อใดควรซื้อ เมื่อใดควรรอ และเมื่อใดควรล็อกกำไร
                </div>
              </div>
            </div>

            {/* 21 Decoupled Scores Breakdown */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--neon-cyan)', fontSize: '13.5px' }}>📊 21 Decoupled Granular Scores (มาตรา 1):</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
                <div>1. <strong>Coin Quality Score:</strong> คุณภาพเหรียญระยะยาว</div>
                <div>2. <strong>Technical Score:</strong> กราฟเทคนิค MTF 5 กรอบเวลา</div>
                <div>3. <strong>Trend Score:</strong> ความแข็งแกร่งของแนวโน้ม</div>
                <div>4. <strong>Momentum Score:</strong> แรงส่งและอัตราเร่ง</div>
                <div>5. <strong>Relative Strength Score:</strong> เทียบ BTC/ETH/Sector</div>
                <div>6. <strong>Liquidity Score:</strong> สภาพคล่องการซื้อขาย</div>
                <div>7. <strong>Execution Score:</strong> Spread &amp; Slippage Gate</div>
                <div>8. <strong>Order Flow Score:</strong> CVD &amp; Buy/Sell Pressure</div>
                <div>9. <strong>On-chain Score:</strong> เมตริกบล็อกเชน &amp; Whale Flow</div>
                <div>10. <strong>Fundamental Score:</strong> ปัจจัยพื้นฐานเฉพาะเซกเตอร์</div>
                <div>11. <strong>Tokenomics Score:</strong> โครงสร้างเหรียญ &amp; Dilution</div>
                <div>12. <strong>Catalyst Score:</strong> ข่าวและเหตุการณ์สำคัญ</div>
                <div>13. <strong>Attention Score:</strong> กระแสโซเชียล &amp; FOMO Risk</div>
                <div>14. <strong>Opportunity Score:</strong> สัญญาณเหรียญที่กำลังมา</div>
                <div>15. <strong>Entry Score:</strong> คุณภาพจุดเข้าและแนวรับ</div>
                <div>16. <strong>Buy Now Score:</strong> คะแนนพร้อมซื้อทันที</div>
                <div>17. <strong>Risk Score:</strong> ดัชนีความเสี่ยงรวม 0–100</div>
                <div>18. <strong>Extension Score:</strong> ระยะห่างราคา vs แนวรับ</div>
                <div>19. <strong>Exit Score:</strong> สัญญาณการขายและลดพอร์ต</div>
                <div>20. <strong>Profit Protection Score:</strong> ล็อกกำไรเมื่อขึ้นแรง</div>
                <div>21. <strong>Confidence Score:</strong> ความน่าเชื่อถือของข้อมูล</div>
              </div>
            </div>

            {/* 12 Market Regimes & Dynamic Weighting */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--neon-cyan)', fontSize: '13.5px' }}>🌐 12 Market Regimes &amp; Dynamic Weighting (มาตรา 8 &amp; 9):</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>
                ระบบต้องจำแนกสภาวะตลาดก่อนวิเคราะห์รายเหรียญ โดยมี 12 Regimes: <strong>STRONG RISK ON, RISK ON, RECOVERY, TRENDING, RANGE, LOW VOL, HIGH VOL, RISK OFF, CAPITULATION, EUPHORIA, BTC LED, ALT LED</strong>.
                ห้ามใช้ Weight เดียวตลอดเวลา เช่น ในโหมด RANGE จะเพิ่มน้ำหนัก Mean Reversion 25% และ Support/Resistance 20% ในขณะที่โหมด RISK OFF จะเพิ่มน้ำหนักความเสี่ยง Risk 30% และ Liquidity 20%
              </p>
            </div>

            {/* 11-Model Consensus */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--neon-cyan)', fontSize: '13.5px' }}>🗳️ 11-Model Consensus Voting (มาตรา 37):</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>
                สร้างฉันทามติจากการโหวตของ 11 โมเดลอิสระ: Trend Model, Momentum Model, Reversal Model, Breakout Model, Mean Reversion Model, Order Flow Model, Derivative Model, On-chain Model, Fundamental Model, Catalyst Model, และ Risk Model คำนวณเป็น Bullish / Bearish / Neutral Votes และ Model Agreement %
              </p>
            </div>

            {/* Hard Gates for Buy Now */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--neon-cyan)', fontSize: '13.5px' }}>🚪 12 Hard Gates สำหรับ Buy Now (มาตรา 33 &amp; 34):</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>
                ต้องผ่านทุกข้อ: Data Quality &ge; 70, Liquidity ผ่าน, Execution ผ่าน, Entry Quality &ge; 80, Technical &ge; 75, Risk/Reward &ge; 1:2.0, Extension &lt; 75, ความเสี่ยงไม่เกินเกณฑ์, ไม่มี Critical Negative News, ไม่มี Dangerous Unlock, ไม่มี Local Premium Extreme, และ Market Regime ไม่ Block. หากไม่ผ่านแม้แต่ข้อเดียว จะถูกคัดออกทันที และระบบแสดงได้ตั้งแต่ 0 ถึง 5 เหรียญ (ห้ามบังคับครบ 5)
              </p>
            </div>

            {/* Trailing Stop & Position Sizing */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--neon-cyan)', fontSize: '13.5px' }}>📐 Trailing Stop &amp; Position Sizing (มาตรา 40 &amp; 41):</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>
                Trailing Stop คำนวณแบบไดนามิกจาก ATR Trailing / Chandelier Exit / Structure Stop โดยมีกฎเหล็กคือ <em>"Trailing Stop สามารถเลื่อนขึ้นตามราคา แต่ห้ามเลื่อนลงเมื่อราคาปรับตัวขึ้นแล้ว"</em>.
                พร้อมแนะนำ Position Sizing จาก Fixed Risk, ATR Risk, Volatility Targeting, และ Fractional Kelly โดยแนะนำความเสี่ยงต่อไม้ (Risk per Trade) แทนการแนะนำจำนวนเงินตายตัว
              </p>
            </div>

            {/* Section 56 API & Section 58 AI Explanation */}
            <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--neon-cyan)', fontSize: '13.5px' }}>🤖 API Output &amp; AI Explanation Rule (มาตรา 56, 57 &amp; 58):</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>
                ทุกการประเมินจะให้ผลลัพธ์เป็น Structured Data พร้อม Reason Codes มาตรฐาน (เช่น BULLISH_MTF, GOOD_RR, HIGH_EXTENSION, LOCAL_PREMIUM_RISK) เพื่อการตรวจสอบย้อนหลังที่โปร่งใส.
                LLM รับเฉพาะตัวเลขและ Structured Output จาก Quant Engine เพื่อสร้างคำอธิบายสรุป ห้าม LLM เปลี่ยนคะแนน สร้างราคาเอง หรือแนะนำเหรียญที่ไม่ผ่านการคัดกรองจาก Quant Engine
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
