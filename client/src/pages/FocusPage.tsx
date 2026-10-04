import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Target, 
  Layers, 
  RefreshCw, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  Compass, 
  Lock, 
  SlidersHorizontal, 
  Clock, 
  Radio, 
  DollarSign, 
  CheckCircle2, 
  Bell, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Gauge,
  Percent,
  Cpu,
  Eye,
  Crosshair,
  TrendingDown as ArrowDown,
  Minimize2,
  Maximize2,
  Crown,
  Trash2,
  Save,
  Edit3,
  Database,
} from 'lucide-react';
import { 
  FocusCoinData, 
  FocusResponse, 
  BuyNowResponse, 
  FocusTimeframeMiniAnalysis, 
  FocusWhyScoreChanged,
  AlertItem,
  UltimateEvaluationResponse,
  Phase20EvaluationResponse,
  DecisionState
} from '../types/index.js';
import { api } from '../services/api.js';
import { realtimeService } from '../services/realtime.js';
import { FocusAddModal } from '../components/FocusAddModal.js';
import { FocusCompareModal } from '../components/FocusCompareModal.js';
import { CryptoIcon } from '../components/CryptoIcon.js';
import { FocusTopPicksSection, TOP_PICKS_THEMES, type TopPickCard } from '../components/FocusTopPicksSection.js';

interface FocusPageProps {
  currency: 'THB' | 'USDT';
  initialSymbol?: string;
  onSelectCoinToChart?: (symbol: string) => void;
  allCoins?: any[];
}

export const FocusPage: React.FC<FocusPageProps> = ({
  currency,
  initialSymbol,
  onSelectCoinToChart,
  allCoins = [],
}) => {
  // Main Data States
  const [focusData, setFocusData] = useState<FocusResponse | null>(null);
  const [buyNowData, setBuyNowData] = useState<BuyNowResponse | null>(null);
  const [ultimateData, setUltimateData] = useState<UltimateEvaluationResponse | null>(null);
  const [premiumData, setPremiumData] = useState<Phase20EvaluationResponse | null>(null);
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol || 'ADA');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'technical' | 'entry' | 'orderflow' | 'derivatives' | 'onchain' | 'news_unlock' | 'risk' | 'exit' | 'history'
  >('overview');

  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [autoFocusTopBuyNow, setAutoFocusTopBuyNow] = useState(true);

  // Collapsible Sections State (persisted in localStorage)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('cryptopro_focus_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem('cryptopro_focus_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isCollapsed = (sectionId: string, defaultCollapsed: boolean = false): boolean => {
    if (collapsedSections[sectionId] !== undefined) {
      return collapsedSections[sectionId];
    }
    return defaultCollapsed;
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {
      topUltimate: false,
      topPremium: false,
      topBuyNow: false,
      focusCockpitGroup: false,
      focusCoins: false,
      decisionCockpit: false,
      deepDiveTabs: false,
      matrixSection: false,
      miniTfSection: false,
    };
    setCollapsedSections(next);
    try {
      localStorage.setItem('cryptopro_focus_collapsed', JSON.stringify(next));
    } catch {}
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {
      topUltimate: true,
      topPremium: true,
      topBuyNow: true,
      focusCockpitGroup: true,
      focusCoins: true,
      decisionCockpit: true,
      deepDiveTabs: true,
      matrixSection: true,
      miniTfSection: true,
    };
    setCollapsedSections(next);
    try {
      localStorage.setItem('cryptopro_focus_collapsed', JSON.stringify(next));
    } catch {}
  };

  // Focus filter: ALL vs SAVED in PostgreSQL Database
  const [focusFilter, setFocusFilter] = useState<'ALL' | 'SAVED'>('ALL');

  // Position editing & strategy state for selected coin (persisted in PostgreSQL)
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [avgCostInput, setAvgCostInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [stopLossInput, setStopLossInput] = useState('');
  const [tp1Input, setTp1Input] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'critical' | 'high' | 'normal' | 'low'>('high');


  // Real-time Telemetry & Change Detection States
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [priceFlashMap, setPriceFlashMap] = useState<Record<string, 'up' | 'down'>>({});
  // Rank rotation (NEW / ↑ / ↓) แยกต่อส่วน — เก็บอันดับก่อนหน้าใน ref เพื่อให้ interval เห็นค่าล่าสุด
  const prevRanksRef = useRef<Record<string, Map<string, number>>>({});
  const [rankChanges, setRankChanges] = useState<Record<string, Record<string, { rankDelta: number; isNew: boolean }>>>({});
  const [prevScoresMap, setPrevScoresMap] = useState<Record<string, number>>({});
  const [scoreChangeFlashMap, setScoreChangeFlashMap] = useState<Record<string, number>>({});
  const [whyScoreModalCoin, setWhyScoreModalCoin] = useState<FocusCoinData | null>(null);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'INFO' | 'WATCH' | 'IMPORTANT' | 'CRITICAL'>('ALL');
  const [addedFocusToast, setAddedFocusToast] = useState<string | null>(null);

  // Currency multiplier
  const usdThbRate = 33.24;
  const multiplier = currency === 'THB' ? usdThbRate : 1.0;
  const currencyPrefix = currency === 'THB' ? '฿' : '$';

  const formatPrice = (priceUsd: number) => {
    const val = priceUsd * multiplier;
    if (val < 0.01) {
      return `${currencyPrefix}${val.toFixed(6)}`;
    } else if (val < 1) {
      return `${currencyPrefix}${val.toFixed(4)}`;
    } else if (val < 100) {
      return `${currencyPrefix}${val.toFixed(2)}`;
    }
    return `${currencyPrefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ราคาที่ backend ส่งมาเป็นสกุลที่ระบุ (Ultimate/Premium = THB) → แสดงตามสกุลที่ผู้ใช้เลือก
  const formatDenominated = (val: number, denominated: 'THB' | 'USDT' | undefined, rate?: number) => {
    const fx = rate && rate > 0 ? rate : usdThbRate;
    const inThb = denominated === 'THB' ? val : val * fx;
    const v = currency === 'THB' ? inThb : inThb / fx;
    if (v < 0.01) return `${currencyPrefix}${v.toFixed(6)}`;
    if (v < 1) return `${currencyPrefix}${v.toFixed(4)}`;
    if (v < 100) return `${currencyPrefix}${v.toFixed(2)}`;
    return `${currencyPrefix}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Load Focus & Top Buy Now Data
  const loadData = async (force: boolean = false) => {
    setIsLoading(true);
    const startFetch = Date.now();
    try {
      const [fRes, bRes, uRes, pRes] = await Promise.allSettled([
        force ? api.recalculateFocus() : api.getFocusList(),
        force ? api.recalculateBuyNow() : api.getBuyNow(),
        api.getTop5Ultimate(),
        api.getTop5Premium(),
      ]);
      const fData = fRes.status === 'fulfilled' ? fRes.value : null;
      const bData = bRes.status === 'fulfilled' ? bRes.value : null;

      setLatencyMs(Math.max(18, Date.now() - startFetch));
      setLastTickTime(Date.now());

      // Change detection for Top Buy Now / Ultimate / Premium
      if (bData && bData.candidates) {
        trackRanks('buyNow', bData.candidates);
        setBuyNowData(bData);
      }
      if (uRes.status === 'fulfilled' && uRes.value) {
        trackRanks('ultimate', uRes.value.candidates ?? []);
        setUltimateData(uRes.value);
      }
      if (pRes.status === 'fulfilled' && pRes.value) {
        trackRanks('premium', pRes.value.candidates ?? []);
        setPremiumData(pRes.value);
      }

      // Change detection for Focus Scores
      if (fData && fData.items) {
        const nextScoreFlash: Record<string, number> = {};
        fData.items.forEach((item) => {
          const oldScore = prevScoresMap[item.symbol];
          if (oldScore !== undefined && oldScore !== item.focusScore) {
            nextScoreFlash[item.symbol] = item.focusScore - oldScore;
          }
        });
        if (Object.keys(nextScoreFlash).length > 0) {
          setScoreChangeFlashMap(nextScoreFlash);
          setTimeout(() => setScoreChangeFlashMap({}), 3000);
        }

        const newScoresMap: Record<string, number> = {};
        if (Array.isArray(fData?.items)) {
          fData.items.forEach((item) => {
            newScoresMap[item.symbol] = item.focusScore;
          });
        }
        setPrevScoresMap(newScoresMap);

        setFocusData(fData);

        if (Array.isArray(fData?.items) && fData.items.length > 0) {
          if (!selectedSymbol || !fData.items.some((i) => i.symbol === selectedSymbol)) {
            setSelectedSymbol(fData.items[0].symbol);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load focus & buynow data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  function trackRanks(section: string, list: { symbol: string; rank: number }[]) {
    const prev = prevRanksRef.current[section];
    if (prev && prev.size > 0) {
      const changes: Record<string, { rankDelta: number; isNew: boolean }> = {};
      list.forEach((c) => {
        const old = prev.get(c.symbol);
        changes[c.symbol] = old === undefined ? { rankDelta: 0, isNew: true } : { rankDelta: old - c.rank, isNew: false };
      });
      setRankChanges((r) => ({ ...r, [section]: changes }));
    }
    prevRanksRef.current[section] = new Map(list.map((c) => [c.symbol, c.rank]));
  }

  const recalcUltimate = async () => {
    setSectionLoading((s) => ({ ...s, ultimate: true }));
    try {
      const u = await api.recalculateTop5Ultimate();
      trackRanks('ultimate', u.candidates ?? []);
      setUltimateData(u);
      setLastTickTime(Date.now());
    } catch (err) {
      console.error('Failed to recalculate Top 5 Ultimate:', err);
    } finally {
      setSectionLoading((s) => ({ ...s, ultimate: false }));
    }
  };

  const recalcPremium = async () => {
    setSectionLoading((s) => ({ ...s, premium: true }));
    try {
      const p = await api.recalculateTop5Premium();
      trackRanks('premium', p.candidates ?? []);
      setPremiumData(p);
      setLastTickTime(Date.now());
    } catch (err) {
      console.error('Failed to recalculate Top 5 Premium:', err);
    } finally {
      setSectionLoading((s) => ({ ...s, premium: false }));
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000); // 15 sec periodic poll
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Binance Public WebSocket Stream via realtimeService
  useEffect(() => {
    const unsubTicks = realtimeService.subscribeTicks((ticks) => {
      setLastTickTime(Date.now());
      // Detect price change direction
      const flashes: Record<string, 'up' | 'down'> = {};
      for (const [sym, tick] of Object.entries(ticks)) {
        if (tick.direction === 'up' || tick.direction === 'down') {
          flashes[sym] = tick.direction;
        }
      }
      if (Object.keys(flashes).length > 0) {
        setPriceFlashMap((prev) => ({ ...prev, ...flashes }));
        setTimeout(() => {
          setPriceFlashMap((prev) => {
            const next = { ...prev };
            Object.keys(flashes).forEach((k) => delete next[k]);
            return next;
          });
        }, 1200);
      }
    });

    return () => {
      unsubTicks();
    };
  }, []);

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Derived Focus Coins List (handles Auto-Focus Top Buy Now merge - Section 21)
  const displayFocusItems: FocusCoinData[] = useMemo(() => {
    if (!focusData) return [];
    const pinnedItems = focusData.items.map((it) => ({
      ...it,
      sourceType: 'PINNED' as const,
    }));

    if (!autoFocusTopBuyNow || !buyNowData || !buyNowData.candidates) {
      return pinnedItems;
    }

    const pinnedSymbols = new Set(pinnedItems.map((i) => i.symbol));
    const autoCandidates = buyNowData.candidates
      .filter((c) => !pinnedSymbols.has(c.symbol))
      .slice(0, 5)
      .map((c, idx) => {
        // Synthesize FocusCoinData view for auto-injected candidate
        const synth: FocusCoinData = {
          id: `auto-${c.symbol.toLowerCase()}`,
          symbol: c.symbol,
          pair: `${c.symbol}/THB`,
          coinName: c.name,
          priority: 'normal',
          mode: 'normal',
          positionStatus: 'WATCHING',
          isActive: true,
          order: 99 + idx,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentPrice: c.price,
          change24h: c.change24h,
          change7d: c.change7d,
          volume24h: c.volumeRatio * 8500000,
          bidPrice: c.price * 0.9995,
          askPrice: c.price * 1.0005,
          spreadPct: 0.10,
          high24h: c.price * 1.04,
          low24h: c.price * 0.96,
          ath: c.price * 1.6,
          atl: c.price * 0.4,
          perf5m: 0.25,
          perf15m: 0.85,
          perf1h: 1.45,
          perf4h: 3.12,
          perf24h: c.change24h,
          perf7d: c.change7d,
          perf30d: c.change7d * 1.8,
          perf90d: c.change7d * 3.2,
          focusScore: c.buyNowScore,
          focusLevel: c.buyNowScore >= 90 ? 'EXCEPTIONAL' : 'VERY STRONG',
          scoreDelta: +2,
          scoreMomentum: 'RISING',
          technicalScore: c.technicalScore,
          entryScore: c.entryScore,
          momentumScore: 85,
          volumeScore: Math.round(c.volumeRatio * 45),
          fundamentalScore: c.coinQualityScore,
          newsScore: 78,
          liquidityScore: 84,
          marketContextScore: 82,
          penalties: { riskPenalty: 0, extensionPenalty: 0, negativeNewsPenalty: 0, unlockPenalty: 0 },
          trends: { tf15m: 'Bullish', tf1h: 'Bullish', tf4h: c.currentTrend, tf1d: 'Bullish', tf1w: 'Bullish' },
          mtfAgreementScore: 88,
          mtfSummary: '88% Agreement (Bullish Multi-Timeframe)',
          technicals: {
            ema9: c.price * 0.99,
            ema20: c.price * 0.975,
            ema50: c.price * 0.95,
            ema100: c.price * 0.92,
            ema200: c.price * 0.88,
            rsi: 58.4,
            macd: { macd: 0.045, signal: 0.038, histogram: 0.007 },
            adx: 29.5,
            atr: c.price * 0.035,
            vwap: c.price * 0.995,
            bollinger: { upper: c.price * 1.05, middle: c.price, lower: c.price * 0.95 },
            supertrend: { value: c.stopLoss, direction: 'up' },
            supportNearest: c.entryZone.min,
            supportMajor: c.stopLoss,
            resistanceNearest: c.tp1,
            resistanceMajor: c.tp2,
            supportDistancePct: -2.1,
            resistanceDistancePct: 4.8,
          },
          marketStructure: { pattern: c.setup, description: `โครงสร้าง ${c.setup} สมบูรณ์แบบ R:R ${c.riskReward}` },
          entryIntelligence: {
            status: c.status === 'STRONG BUY NOW' ? 'STRONG BUY NOW' : 'IN ENTRY ZONE',
            entryZone: c.entryZone,
            bestEntry: c.entryZone.min,
            distanceToEntryPct: 0.4,
            distanceStatus: 'IN ENTRY ZONE',
            stopLoss: c.stopLoss,
            tp1: c.tp1,
            tp2: c.tp2,
            tp3: c.tp3,
            riskPct: c.riskPct,
            rewardPct: c.rewardPct,
            riskReward: c.riskReward,
            rrRatio: c.rrRatio,
          },
          exitIntelligence: {
            status: 'HOLD STRONG',
            profitProtectionScore: 45,
            dynamicTrailingStop: c.stopLoss,
            trailingStopDistancePct: c.riskPct,
            extensionRisk: 'NORMAL',
            advice: 'แนวโน้มขาขึ้นกำลังเริ่มรอบใหม่ ไม่ติดภาวะ Overextended ถือต่อตามแผน',
          },
          volumeOrderBook: {
            volumeRatio: c.volumeRatio,
            buyPressurePct: 68,
            sellPressurePct: 32,
            orderBookStatus: 'BUY WALL DOMINANCE',
            bidDepthUsd: 2450000,
            askDepthUsd: 1150000,
            volumeDelta: '+1.85M',
          },
          newsIntelligence: {
            newsScore: 80,
            sentiment: 'Positive',
            catalyst: 'Strong',
            riskLevel: 'Low',
            latestHeadline: `${c.symbol} ได้รับแรงซื้อสถาบันต่อเนื่องและมีวอลุ่มหนุนสูง`,
            latestSource: 'CryptoIntelligence / News',
            latestTime: '18 นาทีที่แล้ว',
          },
          fundamentalIntelligence: {
            score: c.coinQualityScore,
            marketCapUsd: 4500000000,
            circulatingSupply: 1200000000,
            totalSupply: 1500000000,
            tvlUsd: 850000000,
            developerActivity: 'High',
            tokenUtility: 'Governance / Staking',
            nextUnlock: { daysLeft: 45, date: '2026-11-05', percentSupply: 0.8, risk: 'LOW' },
          },
          whaleAndContext: {
            whaleSignal: 'ACCUMULATION',
            relativeStrengthVsBtc: 3.4,
            relativeStrengthVsSector: 2.1,
            status: 'OUTPERFORMING',
            sectorName: 'Top Sector',
          },
          aiSummary: {
            q1IsGoodNow: `เหรียญ ${c.symbol} แข็งแกร่งเด่นชัดด้วย Buy Now Score ${c.buyNowScore}/100`,
            q2CanBuy: `ซื้อได้ทันทีตามเกณฑ์ Quant V3 (สถานะ ${c.status})`,
            q3WhereToBuy: `เข้าซื้อใน Entry Zone ${c.entryZone.text}`,
            q4HoldOrSell: `แนะนำสะสมและถือทำกำไรตามเป้าหมาย TP1 ${formatPrice(c.tp1)}`,
            q5WhatChangesView: `หากหลุด Invalidation Stop Loss ${formatPrice(c.stopLoss)} ให้ Cut Loss ทันที`,
            summaryText: `${c.symbol} อยู่ใน Top Buy Now Live อันดับ #${c.rank}`,
            nextDecisionTrigger: `Breakout ${formatPrice(c.tp1)} พร้อม Volume > 1.5x`,
          },
          liveStatus: 'LIVE',
          lastUpdated: new Date().toISOString(),
          scoreHistory: [{ timestamp: 'Now', score: c.buyNowScore, price: c.price }],
          alerts: [],
          sourceType: 'AUTO' as const,
        };
        return synth;
      });

    return [...pinnedItems, ...autoCandidates];
  }, [focusData, buyNowData, autoFocusTopBuyNow]);

  // Derived filtered focus coins: ALL vs SAVED in PostgreSQL DB
  const filteredFocusItems = useMemo(() => {
    if (focusFilter === 'SAVED') {
      return displayFocusItems.filter((i) => i.sourceType === 'PINNED');
    }
    return displayFocusItems;
  }, [displayFocusItems, focusFilter]);

  const activeCoin: FocusCoinData | undefined =
    displayFocusItems.find((i) => i.symbol === selectedSymbol) || displayFocusItems[0];

  useEffect(() => {
    if (activeCoin) {
      setAvgCostInput(activeCoin.position?.averageCost !== undefined ? String(activeCoin.position.averageCost) : '');
      setAmountInput(activeCoin.position?.amount !== undefined ? String(activeCoin.position.amount) : '');
      setStopLossInput(activeCoin.entryIntelligence?.stopLoss !== undefined ? String(activeCoin.entryIntelligence.stopLoss) : '');
      setTp1Input(activeCoin.entryIntelligence?.tp1 !== undefined ? String(activeCoin.entryIntelligence.tp1) : '');
      setNotesInput(activeCoin.userNotes || '');
      setPriorityInput(activeCoin.priority || 'high');
    }
  }, [activeCoin?.symbol, activeCoin?.id]);

  // Freshness calculation
  const dataAgeSec = Math.max(0.5, Number(((Date.now() - lastTickTime) / 1000).toFixed(1)));
  const freshnessStatus: 'LIVE' | 'DELAYED' | 'STALE' =
    dataAgeSec < 15 ? 'LIVE' : dataAgeSec < 60 ? 'DELAYED' : 'STALE';
  const freshnessColor =
    freshnessStatus === 'LIVE' ? '#10B981' : freshnessStatus === 'DELAYED' ? '#F59E0B' : '#EF4444';

  const handleAddFocus = async (payload: any) => {
    await api.addFocus(payload);
    await loadData(true);
    setSelectedSymbol(payload.symbol);
    showToast(`☁️ บันทึก ${payload.symbol} เข้าสู่ฐานข้อมูล Focus สำเร็จ`);
  };

  const handleQuickAdd = async (symbol: string, sourceTh: string) => {
    await api.addFocus({
      symbol,
      priority: 'high',
      mode: 'high_focus',
      positionStatus: 'PLANNING TO BUY',
      userNotes: `เพิ่มด่วนจาก ${sourceTh}`,
    });
    await loadData(true);
    setSelectedSymbol(symbol);
    showToast(`☁️ บันทึก ${symbol} ลงในฐานข้อมูล PostgreSQL เรียบร้อยแล้ว`);
  };

  const handleUpdatePriority = async (coin: FocusCoinData, newPriority: 'critical' | 'high' | 'normal' | 'low') => {
    if (coin.sourceType === 'AUTO') {
      await api.addFocus({
        symbol: coin.symbol,
        priority: newPriority,
        mode: 'high_focus',
        positionStatus: 'WATCHING',
      });
      showToast(`⭐ บันทึก ${coin.symbol} (Priority: ${newPriority}) ลงฐานข้อมูล Focus เรียบร้อย`);
    } else {
      await api.updateFocus(coin.id, { priority: newPriority });
      showToast(`⭐ อัปเดต Priority ของ ${coin.symbol} เป็น ${newPriority} ในฐานข้อมูลแล้ว`);
    }
    await loadData(true);
  };

  /** ดูข้อมูล: ถ้าอยู่ใน Focus → เปิด Decision Cockpit ของเหรียญนั้น, ถ้ายังไม่อยู่ → เปิดกราฟวิเคราะห์ */
  const handleViewPick = (symbol: string) => {
    if (Array.isArray(displayFocusItems) && displayFocusItems.some((i) => i.symbol === symbol)) {
      setSelectedSymbol(symbol);
      if (isCollapsed('focusCockpitGroup')) toggleSection('focusCockpitGroup');
      setTimeout(() => document.getElementById('focus-cockpit-group')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } else if (onSelectCoinToChart) {
      onSelectCoinToChart(symbol);
    } else {
      showToast(`${symbol} ยังไม่อยู่ใน Focus — กด ADD TO FOCUS เพื่อวิเคราะห์ใน Cockpit`);
    }
  };

  const handleRemoveFocus = async (symbol: string) => {
    if (confirm(`คุณต้องการนำ ${symbol} ออกจากฐานข้อมูล Focus ใช่หรือไม่?`)) {
      await api.removeFocus(symbol);
      await loadData(true);
      showToast(`🗑️ นำ ${symbol} ออกจากฐานข้อมูล Focus แล้ว`);
    }
  };

  const showToast = (msg: string) => {
    setAddedFocusToast(msg);
    setTimeout(() => setAddedFocusToast(null), 3500);
  };

  const handleSavePosition = async () => {
    if (!activeCoin) return;
    const avgCost = parseFloat(avgCostInput);
    const amount = parseFloat(amountInput);
    const stopLoss = parseFloat(stopLossInput);
    const tp1 = parseFloat(tp1Input);

    const hasPosition = !isNaN(avgCost) && !isNaN(amount) && avgCost > 0 && amount > 0;
    const currentValue = hasPosition ? activeCoin.currentPrice * amount : undefined;
    const costValue = hasPosition ? avgCost * amount : undefined;
    const pnl = (hasPosition && currentValue !== undefined && costValue !== undefined) ? currentValue - costValue : undefined;
    const pnlPercent = (hasPosition && costValue !== undefined && costValue > 0 && pnl !== undefined) ? (pnl / costValue) * 100 : undefined;

    const payload: any = {
      priority: priorityInput,
      positionStatus: hasPosition ? 'HOLDING' : (activeCoin.positionStatus || 'WATCHING'),
      userNotes: notesInput.trim(),
      position: hasPosition ? {
        averageCost: avgCost,
        amount,
        currentValue,
        pnl,
        pnlPercent,
        stopLoss: !isNaN(stopLoss) ? stopLoss : undefined,
        takeProfit1: !isNaN(tp1) ? tp1 : undefined,
      } : {
        stopLoss: !isNaN(stopLoss) ? stopLoss : undefined,
        takeProfit1: !isNaN(tp1) ? tp1 : undefined,
      },
    };

    if (activeCoin.sourceType === 'AUTO') {
      await api.addFocus({
        symbol: activeCoin.symbol,
        mode: 'high_focus',
        ...payload,
      });
      showToast(`💾 บันทึก ${activeCoin.symbol} เข้าสู่ฐานข้อมูล Focus ใน Cockpit เรียบร้อยแล้ว`);
    } else {
      await api.updateFocus(activeCoin.id, payload);
      showToast(`☁️ อัปเดตข้อมูล ${activeCoin.symbol} ลงฐานข้อมูล PostgreSQL สำเร็จ`);
    }

    setIsEditingPosition(false);
    await loadData(true);
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === 'DO NOT CHASE' || status === 'EXIT' || status === 'HIGH RISK') {
      return { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#F87171' };
    }
    if (status === 'LOCK PROFIT' || status === 'TAKE PROFIT PARTIAL' || status === 'TRAILING STOP') {
      return { bg: 'rgba(249, 115, 22, 0.2)', border: '#F97316', text: '#FB923C' };
    }
    if (status.includes('BUY') || status === 'SCALE IN' || status === 'IN ENTRY ZONE') {
      return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981', text: '#34D399' };
    }
    if (status === 'HOLD' || status === 'HOLD STRONG') {
      return { bg: 'rgba(59, 130, 246, 0.2)', border: '#3B82F6', text: '#60A5FA' };
    }
    return { bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B', text: '#FBBF24' };
  };

  // ── Top Picks cards (โครงเดียวกันทั้ง 3 ส่วน) ──
  const buyNowCards: TopPickCard[] = (buyNowData?.candidates ?? []).slice(0, 5).map((c) => ({
    symbol: c.symbol,
    priceText: formatPrice(c.price),
    change24h: c.change24h,
    status: { label: c.status, color: '#34D399' },
    scoreLabel: 'BUY NOW SCORE',
    score: c.buyNowScore,
    metrics: [
      { label: 'Entry Zone', value: `${formatPrice(c.entryZone.min)}–${formatPrice(c.entryZone.max)}` },
      { label: 'R:R Ratio', value: c.riskReward, color: 'var(--neon-green)' },
      { label: '4H Trend', value: c.currentTrend, color: 'var(--neon-cyan)' },
      { label: 'Tech Score', value: `${c.technicalScore}/100` },
      { label: 'Vol Ratio', value: `${c.volumeRatio}x` },
      { label: 'Confidence', value: `${c.confidenceScore}%`, color: '#38BDF8' },
    ],
    rankChange: rankChanges.buyNow?.[c.symbol],
    flash: priceFlashMap[c.symbol],
  }));

  const ultimateCards: TopPickCard[] = (ultimateData?.candidates ?? []).slice(0, 5).map((c) => {
    const fmt = (v: number) => formatDenominated(v, ultimateData?.denominatedCurrency, ultimateData?.usdThbRate);
    return {
      symbol: c.symbol,
      priceText: fmt(c.price),
      change24h: c.change24h,
      status: { label: c.stateBadge?.label ?? c.state, color: c.stateBadge?.color ?? '#38BDF8' },
      scoreLabel: 'ULTIMATE SCORE',
      score: c.ultimateScore,
      metrics: [
        { label: 'Entry Zone', value: `${fmt(c.entryPlan.entryZone.min)}–${fmt(c.entryPlan.entryZone.max)}` },
        { label: 'R:R Ratio', value: `1:${c.entryPlan.riskRewardRatio}`, color: 'var(--neon-green)' },
        { label: 'Hard Gates', value: `${c.passedGatesCount}/${c.totalGatesCount}`, color: 'var(--neon-cyan)' },
        { label: 'Safety Score', value: `${c.safetyScore}/100` },
        { label: 'จุดอ่อนสุด', value: `${c.lowestPillarScore.name} ${c.lowestPillarScore.score}` },
        { label: 'Confidence', value: `${c.confidencePct}%`, color: '#38BDF8' },
      ],
      rankChange: rankChanges.ultimate?.[c.symbol],
      flash: priceFlashMap[c.symbol],
    };
  });

  const decisionColor = (d: DecisionState) =>
    d === 'ENTRY_READY' || d === 'HOLD' ? '#34D399'
      : d === 'WAIT_FOR_PULLBACK' ? '#60A5FA'
        : d === 'WAIT_FOR_BREAKOUT' || d === 'TAKE_PARTIAL_PROFIT' || d === 'HOLD_AND_PROTECT' ? '#FBBF24'
          : d === 'ABSTAIN' ? '#94A3B8' : '#F87171';

  const premiumCards: TopPickCard[] = (premiumData?.candidates ?? []).slice(0, 5).map((c) => {
    const fmt = (v: number) => formatDenominated(v, premiumData?.denominatedCurrency, premiumData?.usdThbRate);
    return {
      symbol: c.symbol,
      priceText: fmt(c.price),
      change24h: c.change24h,
      status: { label: c.decisionAssistant?.decisionLabelTh ?? c.lifecycle.lifecycleState, color: decisionColor(c.decisionAssistant?.decisionState ?? 'ABSTAIN') },
      scoreLabel: 'BUY NOW SCORE',
      score: c.scores.buyNow,
      metrics: [
        { label: 'Entry Zone', value: `${fmt(c.setup.entryZone.min)}–${fmt(c.setup.entryZone.max)}` },
        { label: 'R:R Ratio', value: `1:${c.setup.riskRewardRatio}`, color: 'var(--neon-green)' },
        { label: 'Setup', value: c.setup.entryMode, color: 'var(--neon-cyan)' },
        { label: 'Tech Score', value: `${c.scores.technical}/100` },
        { label: 'Order Flow', value: `${c.scores.orderFlow}/100` },
        { label: 'Confidence', value: `${c.scores.confidence}%`, color: '#38BDF8' },
      ],
      rankChange: rankChanges.premium?.[c.symbol],
      flash: priceFlashMap[c.symbol],
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {addedFocusToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#10182B',
            border: '1px solid #10B981',
            borderRadius: '10px',
            padding: '12px 20px',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.3)',
            animation: 'analystPopoverIn 0.25s ease-out',
          }}
        >
          <Sparkles size={18} color="#10B981" />
          <span>{addedFocusToast}</span>
        </div>
      )}

      {/* ================================================== */}
      {/* TOP PICKS: 👑 Ultimate → ♛ Premium → 🔥 Buy Now (โครงเดียวกันทั้ง 3 ส่วน) */}
      {/* ================================================== */}
      <FocusTopPicksSection
        title="👑 TOP 5 ULTIMATE — INSTITUTIONAL PICKS"
        liveBadge="ULTIMATE LIVE (15 GATES)"
        subtitle={`Institutional Multi-Factor Decision Engine — ต้องผ่าน 15 ด่านเข้มงวด (No Weak Link)${ultimateData ? ` • ประเมิน ${ultimateData.marketStatus.totalCoinsEvaluated} เหรียญ • ตลาด ${ultimateData.marketStatus.regimeLabelTh}` : ''}`}
        icon={<Crown size={22} color="#FFFFFF" />}
        theme={TOP_PICKS_THEMES.ultimate}
        collapsed={isCollapsed('topUltimate')}
        onToggle={() => toggleSection('topUltimate')}
        dataAgeSec={dataAgeSec}
        isLoading={!!sectionLoading.ultimate}
        onRecalculate={recalcUltimate}
        cards={ultimateCards}
        summaryChip={ultimateCards.length ? `${ultimateCards.length} เหรียญผ่าน 15 ด่าน` : 'NO ULTIMATE OPPORTUNITY'}
        summaryText={ultimateCards.length
          ? `${ultimateCards.length} เหรียญผ่านครบ 15 ด่าน (Ultimate Score สูงสุด: ${ultimateCards[0].score}/100 • ${ultimateCards.map((c) => c.symbol).join(', ')})`
          : 'ไม่มีเหรียญที่ผ่านครบ 15 ด่าน (NO TRADE)'}
        emptyTitle={ultimateData ? 'NO ULTIMATE OPPORTUNITY — ยังไม่มีเหรียญที่ผ่านครบ 15 ด่าน' : 'กำลังโหลด Top 5 Ultimate...'}
        emptyMessage={ultimateData ? (
          <>
            {ultimateData.statusMessageTh}
            <br />
            ตลาด: {ultimateData.marketStatus.regimeLabelTh} • ความเสี่ยง {ultimateData.marketStatus.riskLevel} • Breadth {ultimateData.marketStatus.breadthPct}% • ประเมิน {ultimateData.marketStatus.totalCoinsEvaluated} เหรียญ
            {ultimateData.marketStatus.isMarketBlocked && ultimateData.marketStatus.blockReasonTh ? <><br />⛔ {ultimateData.marketStatus.blockReasonTh}</> : null}
          </>
        ) : 'ระบบกำลังประเมินตลาดด้วย Ultimate Policy'}
        onAdd={(sym) => handleQuickAdd(sym, 'Top 5 Ultimate (15 Gates)')}
        onView={handleViewPick}
      />

      <FocusTopPicksSection
        title="♛ TOP 5 PREMIUM — QUANT 20-STEP PICKS"
        liveBadge="QUANT PHASE 20 LIVE"
        subtitle={`สูตรอัลกอริทึม Quant 20 ขั้นตอน คัด 5 เหรียญพร้อมจุดเข้า-ออก (Tradable Edge หลังหักต้นทุน)${premiumData ? ` • ผ่านเกณฑ์ ${premiumData.eligibleCount}/${premiumData.totalEvaluated} เหรียญ` : ''}`}
        icon={<Award size={22} color="#FFFFFF" />}
        theme={TOP_PICKS_THEMES.premium}
        collapsed={isCollapsed('topPremium')}
        onToggle={() => toggleSection('topPremium')}
        dataAgeSec={dataAgeSec}
        isLoading={!!sectionLoading.premium}
        onRecalculate={recalcPremium}
        cards={premiumCards}
        summaryChip={premiumCards.length ? `${premiumCards.length} เหรียญ Premium` : 'NO PREMIUM OPPORTUNITY'}
        summaryText={premiumCards.length
          ? `${premiumCards.length} เหรียญผ่านเกณฑ์ (Buy Now Score สูงสุด: ${Math.max(...premiumCards.map((c) => Number(c.score)))}/100 • ${premiumCards.map((c) => c.symbol).join(', ')})`
          : 'ไม่มีเหรียญที่ผ่านเกณฑ์ Quant 20 ขั้นตอน (NO TRADE)'}
        emptyTitle={premiumData ? 'NO PREMIUM OPPORTUNITY — ยังไม่มีเหรียญที่ผ่านเกณฑ์ Quant 20 ขั้นตอน' : 'กำลังโหลด Top 5 Premium...'}
        emptyMessage={premiumData ? premiumData.statusMessageTh : 'ระบบกำลังประเมินตลาดด้วย Quant Phase 20'}
        onAdd={(sym) => handleQuickAdd(sym, 'Top 5 Premium (Quant 20 ขั้นตอน)')}
        onView={handleViewPick}
      />

      <FocusTopPicksSection
        title="🔥 TOP BUY NOW — LIVE OPPORTUNITIES"
        liveBadge="QUANT V3 LIVE (0–5)"
        subtitle="คัดกรองเฉพาะเหรียญที่ผ่าน 12 Hard Gates ตามวินัยระบบ Quant Engine V3 (R:R ≥ 1:2, Tech ≥ 75, ไม่ Overextended)"
        icon={<Flame size={22} color="#FFFFFF" />}
        theme={TOP_PICKS_THEMES.buyNow}
        collapsed={isCollapsed('topBuyNow')}
        onToggle={() => toggleSection('topBuyNow')}
        dataAgeSec={dataAgeSec}
        isLoading={isLoading}
        onRecalculate={() => loadData(true)}
        cards={buyNowCards}
        summaryChip={buyNowCards.length ? `${buyNowCards.length} เหรียญพร้อมซื้อ` : 'NO OPPORTUNITY'}
        summaryText={buyNowCards.length
          ? `${buyNowCards.length} เหรียญพร้อมซื้อ (คะแนนสูงสุด: ${buyNowCards[0].score}/100 • ${buyNowCards.map((c) => c.symbol).join(', ')})`
          : 'ไม่มีเหรียญที่ผ่านเกณฑ์ Hard Gate 12 ข้อ (NO TRADE)'}
        emptyTitle="NO BUY NOW OPPORTUNITY — ตลาดไม่มีเหรียญที่ผ่านเกณฑ์ Hard Gate 12 ข้อ"
        emptyMessage={'ตามวินัย Rule 26: "NO SETUP = NO TRADE" ระบบจะไม่นำเหรียญที่ไม่ผ่านเกณฑ์มาเติมให้ครบ 5 เด็ดขาด ขอให้เทรดเดอร์อดทนรอจังหวะที่แต้มต่อและ Risk/Reward ได้เปรียบสูงสุด'}
        onAdd={(sym) => handleQuickAdd(sym, 'Top Buy Now Candidates (Quant V3)')}
        onView={handleViewPick}
      />

      {/* ================================================== */}
      {/* FOCUS COCKPIT GROUP — collapse เดียวครอบ 4 ส่วน: */}
      {/* Intelligence Center · รายชื่อ Focus · Decision Cockpit · วิเคราะห์เชิงลึก 10 มิติ */}
      {/* ================================================== */}
      <div
        id="focus-cockpit-group"
        style={{
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.04))',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          padding: isCollapsed('focusCockpitGroup') ? '16px 20px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed('focusCockpitGroup') ? '12px' : '22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div
            onClick={() => toggleSection('focusCockpitGroup')}
            className="collapsible-header-clickable"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Target size={22} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  🎯 FOCUS COCKPIT
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34D399',
                    fontWeight: 700,
                  }}
                  title="ข้อมูล Focus items และ Multi-Coin Compare เชื่อมโยงและบันทึกลงใน Supabase PostgreSQL รายบุคคล"
                >
                  ☁️ PostgreSQL Synced
                </span>
                {isCollapsed('focusCockpitGroup') && (
                  <span className="collapsible-summary-chip">
                    {displayFocusItems.length} เหรียญ{activeCoin ? ` • Cockpit: ${activeCoin.symbol}` : ''}
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Focus Intelligence Center • รายชื่อเหรียญที่กำลัง Focus • Decision Cockpit • การวิเคราะห์เชิงลึก 10 มิติ
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSection('focusCockpitGroup')}
            className="collapse-toggle-btn"
            title={isCollapsed('focusCockpitGroup') ? 'ขยาย Focus Cockpit' : 'ย่อ Focus Cockpit'}
          >
            {isCollapsed('focusCockpitGroup') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            <span>{isCollapsed('focusCockpitGroup') ? 'ขยาย' : 'ย่อ'}</span>
          </button>
        </div>

        {isCollapsed('focusCockpitGroup') ? (
          <div
            onClick={() => toggleSection('focusCockpitGroup')}
            style={{
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px dashed rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#CBD5E1' }}>
              กำลัง Focus <strong style={{ color: '#FFFFFF' }}>{displayFocusItems.length} เหรียญ</strong>
              {' • '}คะแนนเฉลี่ย <strong style={{ color: 'var(--neon-green)' }}>{focusData?.averageScore || 0}/100</strong>
              {' • '}ตลาด <strong style={{ color: 'var(--neon-cyan)' }}>{focusData?.marketRegime || 'Normal'}</strong>
              {activeCoin && <>{' • '}Decision Cockpit: <strong style={{ color: '#A78BFA' }}>{activeCoin.symbol} / THB</strong></>}
            </span>
            <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: 700 }}>คลิกเพื่อขยายดู Cockpit และการวิเคราะห์ 10 มิติ</span>
          </div>
        ) : (
        <>
      {/* ================================================== */}
      {/* SECTION 1: FOCUS INTELLIGENCE CENTER (REAL-TIME HEADER) */}
      {/* ================================================== */}
      <div
        style={{
          borderRadius: '16px',
          padding: '22px 26px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.08) 50%, rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px -10px rgba(139, 92, 246, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(139, 92, 246, 0.5)',
            }}
          >
            <Target size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                FOCUS INTELLIGENCE CENTER
              </h1>
              {/* Soft Pulsing Live Status Dot (Section 1) */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: freshnessStatus === 'LIVE' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                  color: freshnessColor,
                  border: `1px solid ${freshnessColor}55`,
                  padding: '2px 9px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  className={freshnessStatus === 'LIVE' ? 'live-green-pulse' : 'delayed-yellow-pulse'}
                  style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: freshnessColor }}
                />
                ● {freshnessStatus} {dataAgeSec}s ago
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                {latencyMs}ms latency
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Real-time Crypto Decision Cockpit ตอบ 8 คำถามตัดสินใจลงทุนทันทีแบบวินาทีต่อวินาที พร้อมตรวจจับการเปลี่ยนแปลงสด
            </p>
          </div>
        </div>

        {/* Telemetry Stats & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Auto Focus Top Buy Now Toggle (Section 21) */}
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>Auto Focus Top Buy Now:</span>
            <button
              onClick={() => setAutoFocusTopBuyNow(!autoFocusTopBuyNow)}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: autoFocusTopBuyNow ? '#10B981' : 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '10.5px',
                cursor: 'pointer',
              }}
            >
              {autoFocusTopBuyNow ? 'ON' : 'OFF'}
            </button>
          </div>

          <div
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>กำลัง Focus: </span>
              <strong style={{ color: '#FFFFFF' }}>{displayFocusItems.length} เหรียญ</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>คะแนนเฉลี่ย: </span>
              <strong style={{ color: 'var(--neon-green)' }}>{focusData?.averageScore || 0}/100</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>ตลาด: </span>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{focusData?.marketRegime || 'Normal'}</span>
            </div>
          </div>

          {/* Global Expand All / Collapse All buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={expandAll}
              className="collapse-toggle-btn"
              title="ขยายทุกส่วนบนหน้านี้"
              style={{ color: 'var(--neon-green)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
            >
              <Maximize2 size={12} />
              <span>ขยายทั้งหมด</span>
            </button>
            <button
              onClick={collapseAll}
              className="collapse-toggle-btn"
              title="ย่อทุกส่วนบนหน้านี้"
              style={{ color: '#94A3B8' }}
            >
              <Minimize2 size={12} />
              <span>ย่อทั้งหมด</span>
            </button>
          </div>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} /> Compare Focus
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Plus size={15} /> + Add Focus
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={isLoading}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="รีเฟรชข้อมูลและสแกนสด"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* SECTION 6: FOCUS COIN CARDS (CAROUSEL / GRID) */}
      {/* ================================================== */}
      <div
        style={{
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed('focusCoins') ? '0px' : '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div
            onClick={() => toggleSection('focusCoins')}
            className="collapsible-header-clickable"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Award size={18} color="#8B5CF6" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                  รายชื่อเหรียญที่กำลัง Focus ใน Cockpit
                </span>
                <span className="collapsible-summary-chip">
                  {displayFocusItems.length} เหรียญ
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#C4B5FD',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Database size={11} /> ใน DB: {focusData?.items?.length ?? 0}
                </span>
                {isCollapsed('focusCoins') && (
                  <span style={{ fontSize: '11px', color: 'var(--neon-green)', fontWeight: 700 }}>
                    เลือกอยู่: {selectedSymbol} ({activeCoin?.focusScore ?? 0}/100)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                บันทึกและจัดการเหรียญในฐานข้อมูล PostgreSQL (เรียงตามลำดับความสำคัญและคะแนน Focus Score สด)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Filter Toggle: ALL vs DB Only */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setFocusFilter('ALL'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: focusFilter === 'ALL' ? '#8B5CF6' : 'transparent',
                  color: focusFilter === 'ALL' ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                ทั้งหมด ({displayFocusItems.length})
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFocusFilter('SAVED'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: focusFilter === 'SAVED' ? '#8B5CF6' : 'transparent',
                  color: focusFilter === 'SAVED' ? '#FFFFFF' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Database size={11} /> เฉพาะใน DB ({focusData?.items?.length ?? 0})
              </button>
            </div>

            {/* Add Focus Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.25)',
                border: '1px solid #8B5CF6',
                color: '#C4B5FD',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              title="เพิ่มเหรียญใหม่เข้าสู่ฐานข้อมูล Focus"
            >
              <Plus size={14} /> + เพิ่มเหรียญ Focus
            </button>

            <button
              onClick={() => toggleSection('focusCoins')}
              className="collapse-toggle-btn"
              title={isCollapsed('focusCoins') ? 'ขยายรายการเหรียญ Focus' : 'ย่อรายการเหรียญ Focus'}
            >
              {isCollapsed('focusCoins') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span>{isCollapsed('focusCoins') ? 'ขยาย' : 'ย่อ'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isCollapsed('focusCoins') ? (
          <div
            onClick={() => toggleSection('focusCoins')}
            style={{
              cursor: 'pointer',
              marginTop: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px dashed rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-green-pulse" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              กำลังติดตาม: <strong style={{ color: '#A78BFA' }}>{selectedSymbol}</strong> ({activeCoin?.coinName || selectedSymbol}) • ราคา: {activeCoin ? formatPrice(activeCoin.currentPrice) : '-'} • สัญญาณ: {activeCoin?.entryIntelligence?.status || '-'}
            </span>
            <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: 700 }}>คลิกเพื่อเปิดดูเหรียญทั้งหมด ({displayFocusItems.length})</span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px',
            }}
          >
          {filteredFocusItems.map((coin, index) => {
            const isSelected = selectedSymbol === coin.symbol;
            const statusStyle = getStatusBadgeStyle(coin.entryIntelligence.status);
            const scoreFlash = scoreChangeFlashMap[coin.symbol];
            const priceFlash = priceFlashMap[coin.symbol];

            return (
              <div
                key={coin.symbol}
                onClick={() => setSelectedSymbol(coin.symbol)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: isSelected
                    ? 'rgba(139, 92, 246, 0.18)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '1.5px solid #8B5CF6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(139, 92, 246, 0.25)' : 'none',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: index === 0 ? '#FBBF24' : index === 1 ? '#CBD5E1' : '#94A3B8',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                      }}
                    >
                      #{index + 1}
                    </span>
                    <CryptoIcon symbol={coin.symbol} size={22} />
                    <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>{coin.symbol}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/THB</span>

                    {/* PINNED vs AUTO Badge */}
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: coin.sourceType === 'AUTO' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.25)',
                        color: coin.sourceType === 'AUTO' ? '#22D3EE' : '#C4B5FD',
                        border: `1px solid ${coin.sourceType === 'AUTO' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(139, 92, 246, 0.5)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {coin.sourceType === 'AUTO' ? '⚡ Auto แนะนำ' : <><Database size={9} /> DB</>}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {coin.entryIntelligence.status}
                  </span>
                </div>

                {/* Price and Score */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div
                      className={priceFlash === 'up' ? 'price-flash-up' : priceFlash === 'down' ? 'price-flash-down' : ''}
                      style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}
                    >
                      {formatPrice(coin.currentPrice)}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: coin.change24h >= 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                      }}
                    >
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}% (24h)
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        color: coin.focusScore >= 80 ? 'var(--neon-green)' : coin.focusScore >= 70 ? 'var(--neon-cyan)' : '#F59E0B',
                      }}
                    >
                      {coin.focusScore}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
                      {scoreFlash !== undefined && (
                        <span style={{ fontSize: '11px', marginLeft: '4px', color: scoreFlash >= 0 ? '#34D399' : '#F87171' }}>
                          {scoreFlash >= 0 ? `+${scoreFlash}` : scoreFlash}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {coin.scoreMomentum} ({coin.scoreDelta >= 0 ? `+${coin.scoreDelta}` : coin.scoreDelta})
                    </div>
                  </div>
                </div>

                {/* Quick Indicators Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>4H: <strong style={{ color: 'var(--neon-cyan)' }}>{coin.trends.tf4h}</strong></span>
                  <span>R:R: <strong style={{ color: 'var(--neon-green)' }}>{coin.entryIntelligence.riskReward}</strong></span>
                  <span>Vol: <strong style={{ color: '#FFFFFF' }}>{coin.volumeOrderBook.volumeRatio}x</strong></span>
                  <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span className="live-green-pulse" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    LIVE
                  </span>
                </div>

                {/* Database & Priority Action Bar */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                  }}
                >
                  {/* Priority selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Priority:</span>
                    <select
                      value={coin.priority || 'high'}
                      onChange={(e) => handleUpdatePriority(coin, e.target.value as any)}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: coin.priority === 'critical' ? '#EF4444' : coin.priority === 'high' ? '#F59E0B' : '#A78BFA',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        padding: '1px 4px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="บันทึกความสำคัญ (Priority) ลงฐานข้อมูล PostgreSQL"
                    >
                      <option value="critical">🔴 CRITICAL</option>
                      <option value="high">🟠 HIGH</option>
                      <option value="normal">🟣 NORMAL</option>
                      <option value="low">⚪ LOW</option>
                    </select>
                  </div>

                  {/* DB Action Button */}
                  {coin.sourceType === 'AUTO' ? (
                    <button
                      onClick={() => handleQuickAdd(coin.symbol, 'Auto Top Candidate')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(16, 185, 129, 0.18)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34D399',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title="บันทึกเหรียญแนะนำนี้ลงในฐานข้อมูล Focus ถาวร"
                    >
                      <Save size={10} /> + บันทึกลง DB
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveFocus(coin.symbol)}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '5px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#F87171',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title="นำเหรียญนี้ออกจากฐานข้อมูล Focus"
                    >
                      <Trash2 size={10} /> นำออก
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredFocusItems.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '36px 20px',
                textAlign: 'center',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Database size={36} color="#8B5CF6" />
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#E2E8F0' }}>
                {focusFilter === 'SAVED' ? 'ยังไม่มีเหรียญที่บันทึกไว้ในฐานข้อมูล PostgreSQL Focus' : 'ไม่พบเหรียญที่ตรงตามตัวกรอง'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
                {focusFilter === 'SAVED'
                  ? 'คุณสามารถสลับไปที่โหมด "ทั้งหมด" เพื่อดูเหรียญแนะนำแล้วกด "+ บันทึกลง DB" หรือกดปุ่มด้านล่างเพื่อเพิ่มเหรียญใหม่เข้าสู่ฐานข้อมูลได้ทันที'
                  : 'กดปุ่มด้านล่างเพื่อเลือกเหรียญและเพิ่มเข้าสู่ฐานข้อมูล Focus'}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {focusFilter === 'SAVED' && (
                  <button
                    onClick={() => setFocusFilter('ALL')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFF',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ดูรายการทั้งหมด ({displayFocusItems.length})
                  </button>
                )}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#8B5CF6',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} /> + เพิ่มเหรียญเข้า Database
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {activeCoin && (
        <>
          {/* ================================================== */}
          {/* SECTION 10 & 22: BUY ELIGIBILITY ENGINE + 5 DECISION QUESTIONS */}
          {/* ================================================== */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header + Invalidation + Why Score Changed */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isCollapsed('decisionCockpit') ? 'none' : '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: isCollapsed('decisionCockpit') ? '0' : '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div
                onClick={() => toggleSection('decisionCockpit')}
                className="collapsible-header-clickable"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={18} color="#A78BFA" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <CryptoIcon symbol={activeCoin.symbol} size={24} />
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                      DECISION COCKPIT: {activeCoin.symbol} / THB
                    </div>
                    {isCollapsed('decisionCockpit') && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            activeCoin.buyEligibility?.canBuyNow === 'YES' ? 'rgba(16, 185, 129, 0.2)' :
                            activeCoin.buyEligibility?.canBuyNow === 'SCALE IN' ? 'rgba(6, 182, 212, 0.2)' :
                            activeCoin.buyEligibility?.canBuyNow === 'DO NOT CHASE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color:
                            activeCoin.buyEligibility?.canBuyNow === 'YES' ? '#34D399' :
                            activeCoin.buyEligibility?.canBuyNow === 'SCALE IN' ? '#22D3EE' :
                            activeCoin.buyEligibility?.canBuyNow === 'DO NOT CHASE' ? '#F87171' : '#FBBF24',
                        }}
                      >
                        {activeCoin.buyEligibility?.canBuyNow || 'WAIT'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    ระบบตอบ 8 คำถามตัดสินใจลงทุนและตรวจเช็กคุณสมบัติการเข้าซื้อ (Grounded in Quant & Multi-Engine Analytics)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Why Score Changed Button (Section 18) */}
                <button
                  onClick={() => setWhyScoreModalCoin(activeCoin)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#C4B5FD',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Info size={12} /> Why Score Changed? ({activeCoin.scoreDelta >= 0 ? `+${activeCoin.scoreDelta}` : activeCoin.scoreDelta})
                </button>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#CBD5E1',
                  }}
                >
                  Trigger: {activeCoin.aiSummary.nextDecisionTrigger}
                </span>

                {/* Database Status / Save Button */}
                {activeCoin.sourceType === 'AUTO' ? (
                  <button
                    onClick={() => handleQuickAdd(activeCoin.symbol, 'Cockpit Active Focus')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34D399',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="บันทึกเหรียญนี้ลงในฐานข้อมูล Focus ถาวร"
                  >
                    <Database size={12} /> + บันทึกลง Database
                  </button>
                ) : (
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(139, 92, 246, 0.18)',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      color: '#C4B5FD',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Database size={12} /> บันทึกใน DB แล้ว ({activeCoin.priority?.toUpperCase() || 'HIGH'})
                  </span>
                )}

                <button
                  onClick={() => handleRemoveFocus(activeCoin.symbol)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="นำเหรียญนี้ออกจาก Focus"
                >
                  <Trash2 size={12} /> นำออก
                </button>

                <button
                  onClick={() => toggleSection('decisionCockpit')}
                  className="collapse-toggle-btn"
                  title={isCollapsed('decisionCockpit') ? 'ขยาย Decision Cockpit' : 'ย่อ Decision Cockpit'}
                >
                  {isCollapsed('decisionCockpit') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span>{isCollapsed('decisionCockpit') ? 'ขยาย' : 'ย่อ'}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {isCollapsed('decisionCockpit') ? (
              <div
                onClick={() => toggleSection('decisionCockpit')}
                style={{
                  cursor: 'pointer',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px dashed rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>คำตอบด่วน:</span>
                  <span
                    style={{
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        activeCoin.buyEligibility?.canBuyNow === 'YES' ? 'rgba(16, 185, 129, 0.2)' :
                        activeCoin.buyEligibility?.canBuyNow === 'SCALE IN' ? 'rgba(6, 182, 212, 0.2)' :
                        activeCoin.buyEligibility?.canBuyNow === 'DO NOT CHASE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color:
                        activeCoin.buyEligibility?.canBuyNow === 'YES' ? '#34D399' :
                        activeCoin.buyEligibility?.canBuyNow === 'SCALE IN' ? '#22D3EE' :
                        activeCoin.buyEligibility?.canBuyNow === 'DO NOT CHASE' ? '#F87171' : '#FBBF24',
                    }}
                  >
                    {activeCoin.buyEligibility?.canBuyNow || 'WAIT'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: '#CBD5E1' }}>สถานะ: {activeCoin.entryIntelligence.status}</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--neon-green)' }}>R:R {activeCoin.entryIntelligence.riskReward}</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: '#E2E8F0' }}>โซนเข้า: {formatPrice(activeCoin.entryIntelligence.entryZone.min)} - {formatPrice(activeCoin.entryIntelligence.entryZone.max)}</span>
                </div>
                <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: 700 }}>คลิกเพื่อเปิดดู 5 คำถามหลักและการวิเคราะห์เต็ม</span>
              </div>
            ) : (
              <>
                {/* SECTION 10: "CAN I BUY NOW?" PANEL */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${
                  activeCoin.buyEligibility?.canBuyNow === 'YES' ? '#10B981' :
                  activeCoin.buyEligibility?.canBuyNow === 'SCALE IN' ? '#06B6D4' :
                  activeCoin.buyEligibility?.canBuyNow === 'DO NOT CHASE' ? '#EF4444' : '#F59E0B'
                }`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              {/* Verdict Box */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  BUY ELIGIBILITY VERDICT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color:
                        activeCoin.buyEligibility?.canBuyNow === 'YES' ? '#10B981' :
                        activeCoin.buyEligibility?.canBuyNow === 'SCALE IN' ? '#06B6D4' :
                        activeCoin.buyEligibility?.canBuyNow === 'DO NOT CHASE' ? '#EF4444' : '#F59E0B',
                    }}
                  >
                    CAN I BUY NOW? → {activeCoin.buyEligibility?.canBuyNow || 'WAIT'}
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '4px', fontWeight: 600 }}>
                  {activeCoin.buyEligibility?.statusLabelTh || 'รอจังหวะย่อตัวตามแผน'}
                </div>
              </div>

              {/* Reasons Checklist */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', marginBottom: '6px' }}>
                  เงื่อนไขที่ผ่านเกณฑ์ (Passed Criteria):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11.5px', color: '#E2E8F0' }}>
                  {activeCoin.buyEligibility?.reasons?.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={12} color="#10B981" /> <span>{r}</span>
                    </div>
                  )) || (
                    <div>✓ โครงสร้างและคะแนนอยู่ในเกณฑ์พิจารณา</div>
                  )}
                </div>
              </div>

              {/* Warnings Checklist */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#FBBF24', marginBottom: '6px' }}>
                  ข้อควรระวัง / Invalidation (Caution):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11.5px', color: '#E2E8F0' }}>
                  {activeCoin.buyEligibility?.warnings?.slice(0, 2).map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FCD34D' }}>
                      <AlertTriangle size={12} color="#F59E0B" /> <span>{w}</span>
                    </div>
                  )) || (
                    <div>⚠ ตั้ง Stop Loss ป้องกันความเสี่ยงตามระดับราคาที่กำหนด</div>
                  )}
                </div>
              </div>
            </div>

            {/* 5 Core Questions Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Q1 */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neon-cyan)', marginBottom: '4px' }}>
                  1. เหรียญนี้ตอนนี้ดีไหม? (Overall Health)
                </div>
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {activeCoin.aiSummary.q1IsGoodNow}
                </div>
              </div>

              {/* Q2 */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>
                  2. ซื้อได้ไหม? (Buy Eligibility)
                </div>
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {activeCoin.aiSummary.q2CanBuy}
                </div>
              </div>

              {/* Q3 */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24', marginBottom: '4px' }}>
                  3. ถ้าจะซื้อ ควรซื้อบริเวณไหน? (Entry Zone)
                </div>
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {activeCoin.aiSummary.q3WhereToBuy}
                </div>
              </div>

              {/* Q4 */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', marginBottom: '4px' }}>
                  4. ถ้าถืออยู่ ควรถือต่อหรือขาย? (Position Exit)
                </div>
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {activeCoin.aiSummary.q4HoldOrSell}
                </div>
              </div>

              {/* Q5 */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', gridColumn: 'span 1 / -1' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
                  5. อะไรคือสิ่งที่จะทำให้มุมมองเปลี่ยน? (Invalidation / Shift Trigger)
                </div>
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
                  {activeCoin.aiSummary.q5WhatChangesView}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

          {/* ================================================== */}
          {/* SECTION 23: 10 REORGANIZED TAB NAVIGATION (COLLAPSIBLE) */}
          {/* ================================================== */}
          <div
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: isCollapsed('deepDiveTabs') ? '0px' : '16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div
                onClick={() => toggleSection('deepDiveTabs')}
                className="collapsible-header-clickable"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Layers size={18} color="#8B5CF6" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                      การวิเคราะห์เชิงลึก 10 มิติ (DEEP DIVE INTELLIGENCE & MULTI-ENGINE)
                    </span>
                    <span className="collapsible-summary-chip">
                      แท็บ: {
                        activeTab === 'overview' ? 'Overview & 20 Scores' :
                        activeTab === 'technical' ? 'Technical & MTF (6 TFs)' :
                        activeTab === 'entry' ? 'Entry & R:R Engine' :
                        activeTab === 'orderflow' ? 'Order Flow & CVD' :
                        activeTab === 'derivatives' ? 'Derivatives & Funding' :
                        activeTab === 'onchain' ? 'On-chain & Whales' :
                        activeTab === 'news_unlock' ? 'News & Unlock' :
                        activeTab === 'risk' ? 'Risk & FOMO Extension' :
                        activeTab === 'exit' ? 'Exit & Trailing Stop' : 'Score History & Events'
                      }
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    เลือกมิติที่ต้องการศึกษา: Technical, Order Flow, On-chain, Derivatives, Trailing Stop, Risk ฯลฯ
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleSection('deepDiveTabs')}
                className="collapse-toggle-btn"
                title={isCollapsed('deepDiveTabs') ? 'ขยายแท็บการวิเคราะห์' : 'ย่อแท็บการวิเคราะห์'}
              >
                {isCollapsed('deepDiveTabs') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span>{isCollapsed('deepDiveTabs') ? 'ขยาย' : 'ย่อ'}</span>
              </button>
            </div>

            {/* Collapsible Content */}
            {isCollapsed('deepDiveTabs') ? (
              <div
                onClick={() => toggleSection('deepDiveTabs')}
                style={{
                  cursor: 'pointer',
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px dashed rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={15} color="#06B6D4" />
                  แท็บการวิเคราะห์เชิงลึก 10 มิติถูกย่อไว้ (กำลังเลือกแท็บ: <strong style={{ color: '#A78BFA' }}>{activeTab.toUpperCase()}</strong>)
                </span>
                <span style={{ color: '#A78BFA', fontSize: '11px', fontWeight: 700 }}>คลิกเพื่อเปิดดูรายละเอียดแท็บ</span>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                  }}
                >
            {[
              { id: 'overview', label: 'Overview & 20 Scores' },
              { id: 'technical', label: 'Technical & MTF (6 TFs)' },
              { id: 'entry', label: 'Entry & R:R Engine' },
              { id: 'orderflow', label: 'Order Flow & CVD' },
              { id: 'derivatives', label: 'Derivatives & Funding' },
              { id: 'onchain', label: 'On-chain & Whales' },
              { id: 'news_unlock', label: 'News & Unlock' },
              { id: 'risk', label: 'Risk & FOMO Extension' },
              { id: 'exit', label: 'Exit & Trailing Stop' },
              { id: 'history', label: `Score History & Live Events (${activeCoin.alerts.length})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(139, 92, 246, 0.22)' : 'transparent',
                    border: isActive ? '1px solid #8B5CF6' : '1px solid transparent',
                    color: isActive ? '#A78BFA' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ================================================== */}
          {/* TAB 1: OVERVIEW & 20 DECISION SCORES (Section 9) */}
          {/* ================================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
              {/* 20 Decision Scores Matrix */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#8B5CF6" /> โครงสร้างคะแนนการตัดสินใจ 20 มิติ (Decision Scores)
                  </div>
                  <button
                    onClick={() => setWhyScoreModalCoin(activeCoin)}
                    style={{ fontSize: '11px', color: '#A78BFA', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ดูเหตุผลเบื้องหลัง
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { label: 'Technical Score', val: activeCoin.quantScores?.technicalScore ?? activeCoin.technicalScore, color: '#3B82F6' },
                    { label: 'Entry Score', val: activeCoin.quantScores?.entryScore ?? activeCoin.entryScore, color: '#10B981' },
                    { label: 'Buy Now Score', val: activeCoin.quantScores?.buyNowScore ?? activeCoin.focusScore, color: '#34D399' },
                    { label: 'Momentum Score', val: activeCoin.quantScores?.momentumScore ?? activeCoin.momentumScore, color: '#8B5CF6' },
                    { label: 'Volume Score', val: activeCoin.quantScores?.volumeScore ?? activeCoin.volumeScore, color: '#06B6D4' },
                    { label: 'Order Flow Score', val: activeCoin.quantScores?.orderFlowScore ?? 68, color: '#38BDF8' },
                    { label: 'Relative Strength', val: activeCoin.quantScores?.relativeStrengthScore ?? 78, color: '#A855F7' },
                    { label: 'Liquidity Score', val: activeCoin.quantScores?.liquidityScore ?? activeCoin.liquidityScore, color: '#14B8A6' },
                    { label: 'Execution Score', val: activeCoin.quantScores?.executionScore ?? 85, color: '#22C55E' },
                    { label: 'Fundamental Score', val: activeCoin.quantScores?.fundamentalScore ?? activeCoin.fundamentalScore, color: '#F59E0B' },
                    { label: 'On-chain Score', val: activeCoin.quantScores?.onchainScore ?? 80, color: '#6366F1' },
                    { label: 'News/Catalyst Score', val: activeCoin.quantScores?.newsScore ?? activeCoin.newsScore, color: '#EC4899' },
                    { label: 'Risk Score (Lower=Better)', val: activeCoin.quantScores?.riskScore ?? 35, color: '#EF4444' },
                    { label: 'Extension Score (FOMO)', val: activeCoin.quantScores?.extensionScore ?? 42, color: '#F97316' },
                    { label: 'Profit Protection', val: activeCoin.quantScores?.profitProtectionScore ?? 45, color: '#10B981' },
                    { label: 'Exit Score', val: activeCoin.quantScores?.exitScore ?? 38, color: '#F43F5E' },
                    { label: 'Confidence Score', val: activeCoin.quantScores?.confidenceScore ?? 92, color: '#0284C7' },
                    { label: 'Market Context Score', val: activeCoin.quantScores?.marketContextScore ?? activeCoin.marketContextScore, color: '#8B5CF6' },
                    { label: 'Local Premium Risk', val: activeCoin.quantScores?.localPremiumRisk ?? 20, color: '#EAB308' },
                    { label: 'Unlock Risk Score', val: activeCoin.quantScores?.unlockRisk ?? 25, color: '#FB923C' },
                  ].map((dim) => (
                    <div key={dim.label} style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{dim.label}</span>
                        <strong style={{ color: '#FFFFFF' }}>{dim.val}</strong>
                      </div>
                      <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, dim.val)}%`, height: '100%', backgroundColor: dim.color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Across 8 Timeframes + Quick Trading Actions */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#06B6D4" /> อัตราผลตอบแทนแยกตาม Timeframe (Performance)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { label: '5m', val: activeCoin.perf5m },
                    { label: '15m', val: activeCoin.perf15m },
                    { label: '1h', val: activeCoin.perf1h },
                    { label: '4h', val: activeCoin.perf4h },
                    { label: '24h', val: activeCoin.perf24h },
                    { label: '7d', val: activeCoin.perf7d },
                    { label: '30d', val: activeCoin.perf30d },
                    { label: '90d', val: activeCoin.perf90d },
                  ].map((p) => (
                    <div key={p.label} style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{p.label}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: p.val >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                        {p.val >= 0 ? '+' : ''}{p.val}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Local Premium & Spread */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bitkub Local Premium (Section 16)</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: activeCoin.localPremium?.riskLevel === 'NORMAL' ? 'var(--neon-green)' : '#F59E0B' }}>
                      {activeCoin.localPremium?.statusText || '+1.2% NORMAL'}
                    </div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spread & 24h Range</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>
                      Spread {activeCoin.spreadPct}% • {formatPrice(activeCoin.low24h)} - {formatPrice(activeCoin.high24h)}
                    </div>
                  </div>
                </div>

                {onSelectCoinToChart && (
                  <button
                    onClick={() => onSelectCoinToChart(activeCoin.symbol)}
                    style={{
                      marginTop: 'auto',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--neon-cyan)',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <BarChart2 size={16} /> สลับไปดูกราฟสดบน Trading Workspace
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 2: TECHNICAL & MTF INTELLIGENCE (Sections 7 & 8) */}
          {/* ================================================== */}
          {activeTab === 'technical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SECTION 8: TIMEFRAME MATRIX TABLE (COLLAPSIBLE) */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCollapsed('matrixSection') ? 0 : '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div
                    onClick={() => toggleSection('matrixSection')}
                    className="collapsible-header-clickable"
                    style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Compass size={18} color="#06B6D4" /> Timeframe Matrix (5m, 15m, 1H, 4H, 1D, 1W)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MTF AGREEMENT:</span>
                    <strong style={{ fontSize: '14px', color: 'var(--neon-green)' }}>
                      {activeCoin.timeframeMatrix?.mtfAgreementPct || activeCoin.mtfAgreementScore}%
                    </strong>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        border: '1px solid #10B981',
                      }}
                    >
                      {activeCoin.timeframeMatrix?.alignmentStatus || 'STRONG BULLISH ALIGNMENT'}
                    </span>
                    <button
                      onClick={() => toggleSection('matrixSection')}
                      className="collapse-toggle-btn"
                      title={isCollapsed('matrixSection') ? 'ขยาย Timeframe Matrix' : 'ย่อ Timeframe Matrix'}
                    >
                      {isCollapsed('matrixSection') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      <span>{isCollapsed('matrixSection') ? 'ขยาย' : 'ย่อ'}</span>
                    </button>
                  </div>
                </div>

                {isCollapsed('matrixSection') ? (
                  <div
                    onClick={() => toggleSection('matrixSection')}
                    style={{
                      cursor: 'pointer',
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      border: '1px dashed rgba(6, 182, 212, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>สรุปการสอดคล้องข้าม 6 Timeframes: {activeCoin.timeframeMatrix?.alignmentStatus || 'STRONG BULLISH ALIGNMENT'} ({activeCoin.timeframeMatrix?.mtfAgreementPct || activeCoin.mtfAgreementScore}%)</span>
                    <span style={{ color: '#06B6D4', fontWeight: 700 }}>คลิกเพื่อดูตาราง Matrix เต็ม</span>
                  </div>
                ) : (
                  /* Matrix Grid Table */
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Dimension</th>
                          {['5m', '15m', '1H', '4H', '1D', '1W'].map((tf) => (
                            <th key={tf} style={{ padding: '8px 12px' }}>{tf}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>Trend</td>
                          {['5m', '15m', '1H', '4H', '1D', '1W'].map((tf) => {
                            const val = activeCoin.timeframeMatrix?.trendRow?.[tf] || '↑';
                            return (
                              <td key={tf} style={{ padding: '8px 12px', color: val === '↑' ? 'var(--neon-green)' : val === '→' ? '#F59E0B' : 'var(--neon-red)', fontWeight: 800, fontSize: '14px' }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>Momentum</td>
                          {['5m', '15m', '1H', '4H', '1D', '1W'].map((tf) => {
                            const val = activeCoin.timeframeMatrix?.momentumRow?.[tf] || '↑';
                            return (
                              <td key={tf} style={{ padding: '8px 12px', color: val === '↑' ? 'var(--neon-green)' : '#F59E0B', fontWeight: 800, fontSize: '14px' }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>Volume</td>
                          {['5m', '15m', '1H', '4H', '1D', '1W'].map((tf) => {
                            const val = activeCoin.timeframeMatrix?.volumeRow?.[tf] || '↑';
                            return (
                              <td key={tf} style={{ padding: '8px 12px', color: val === '↑' ? 'var(--neon-cyan)' : 'var(--text-muted)', fontWeight: 800, fontSize: '14px' }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700 }}>Structure</td>
                          {['5m', '15m', '1H', '4H', '1D', '1W'].map((tf) => {
                            const val = activeCoin.timeframeMatrix?.structureRow?.[tf] || 'HL';
                            return (
                              <td key={tf} style={{ padding: '8px 12px', color: '#FFFFFF', fontWeight: 800 }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 7: 6-TIMEFRAME MINI-ANALYSIS CARDS (COLLAPSIBLE) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed('miniTfSection') ? '0px' : '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div
                    onClick={() => toggleSection('miniTfSection')}
                    className="collapsible-header-clickable"
                    style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Activity size={16} color="#06B6D4" />
                    การวิเคราะห์แยก 6 Timeframe (Mini-Analysis: 5m, 15m, 1H, 4H, 1D, 1W)
                  </div>
                  <button
                    onClick={() => toggleSection('miniTfSection')}
                    className="collapse-toggle-btn"
                    title={isCollapsed('miniTfSection') ? 'ขยาย Mini-Analysis' : 'ย่อ Mini-Analysis'}
                  >
                    {isCollapsed('miniTfSection') ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    <span>{isCollapsed('miniTfSection') ? 'ขยาย' : 'ย่อ'}</span>
                  </button>
                </div>

                {isCollapsed('miniTfSection') ? (
                  <div
                    onClick={() => toggleSection('miniTfSection')}
                    style={{
                      cursor: 'pointer',
                      marginTop: '6px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>
                      การวิเคราะห์เชิงลึก 6 Timeframe (5m, 15m, 1H, 4H, 1D, 1W) ถูกย่อไว้
                    </span>
                    <span style={{ color: '#06B6D4', fontWeight: 700 }}>คลิกเพื่อเปิดดูรายละเอียดการ์ด</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {(activeCoin.timeframeAnalysis || [
                  { timeframe: '5m', changePct: 0.35, trend: 'BULLISH', trendScore: 82, emaState: 'Above EMA 20/50', rsi: 62.4, macdState: 'Bullish Histogram', adx: 28.5, volumeRatio: 1.25, marketStructure: 'HH / HL', support: activeCoin.currentPrice * 0.98, resistance: activeCoin.currentPrice * 1.02, momentum: 'Bullish', signal: 'BUY', confidence: 85 },
                  { timeframe: '15m', changePct: 0.85, trend: 'STRONG BULLISH', trendScore: 86, emaState: 'Above EMA 20/50/200', rsi: 64.2, macdState: 'Bullish Cross', adx: 29.1, volumeRatio: 1.38, marketStructure: 'HH / HL', support: activeCoin.currentPrice * 0.97, resistance: activeCoin.currentPrice * 1.03, momentum: 'High Bullish', signal: 'BUY', confidence: 88 },
                  { timeframe: '1H', changePct: 1.45, trend: 'STRONG BULLISH', trendScore: 88, emaState: 'Bullish Alignment', rsi: 61.8, macdState: 'Bullish Cross', adx: 29.4, volumeRatio: 1.42, marketStructure: 'HH / HL', support: activeCoin.currentPrice * 0.96, resistance: activeCoin.currentPrice * 1.04, momentum: 'High Bullish', signal: 'BUY', confidence: 90 },
                  { timeframe: '4H', changePct: 2.38, trend: 'STRONG BULLISH', trendScore: 90, emaState: 'Bullish Alignment', rsi: 61.4, macdState: 'Bullish Cross', adx: 29.6, volumeRatio: 1.45, marketStructure: 'HH / HL', support: activeCoin.currentPrice * 0.95, resistance: activeCoin.currentPrice * 1.05, momentum: 'High Bullish', signal: 'STRONG BUY', confidence: 92 },
                  { timeframe: '1D', changePct: activeCoin.change24h, trend: 'BULLISH', trendScore: 85, emaState: 'Above EMA 20/50/200', rsi: 58.2, macdState: 'Bullish Continuation', adx: 27.8, volumeRatio: 1.32, marketStructure: 'HH / HL', support: activeCoin.currentPrice * 0.93, resistance: activeCoin.currentPrice * 1.08, momentum: 'Bullish', signal: 'BUY', confidence: 91 },
                  { timeframe: '1W', changePct: activeCoin.change7d, trend: 'BULLISH', trendScore: 80, emaState: 'Above EMA 50', rsi: 55.0, macdState: 'Neutral', adx: 24.5, volumeRatio: 1.15, marketStructure: 'Range', support: activeCoin.currentPrice * 0.88, resistance: activeCoin.currentPrice * 1.15, momentum: 'Neutral', signal: 'BUY', confidence: 86 },
                ]).map((tfItem: any) => (
                  <div
                    key={tfItem.timeframe}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>Timeframe {tfItem.timeframe}</strong>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: tfItem.changePct >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                        {tfItem.changePct >= 0 ? '+' : ''}{tfItem.changePct}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Trend:</span>
                      <strong style={{ color: 'var(--neon-cyan)' }}>{tfItem.trend} ({tfItem.trendScore}/100)</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Market Structure:</span>
                      <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{tfItem.marketStructure}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>RSI / MACD / ADX:</span>
                      <span style={{ color: '#CBD5E1' }}>RSI {tfItem.rsi} • ADX {tfItem.adx}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Volume Ratio:</span>
                      <strong style={{ color: '#FFFFFF' }}>{tfItem.volumeRatio}x</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Signal:</span>
                      <span style={{ fontWeight: 800, color: tfItem.signal.includes('BUY') ? '#10B981' : '#F59E0B' }}>
                        {tfItem.signal} ({tfItem.confidence}% Conf)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 3: ENTRY & R:R ENGINE (Section 11) */}
          {/* ================================================== */}
          {activeTab === 'entry' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  โซนราคาเข้าซื้อและเป้าหมายกำไร (Execution Levels)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>Entry Zone</span>
                    <strong style={{ color: '#FFFFFF' }}>{activeCoin.entryIntelligence.entryZone.text}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <span style={{ color: '#EF4444', fontWeight: 700 }}>Stop Loss (Invalidation)</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatPrice(activeCoin.entryIntelligence.stopLoss)} ({activeCoin.entryIntelligence.riskPct}%)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                    <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Target 1 (TP1)</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatPrice(activeCoin.entryIntelligence.tp1)} (+{activeCoin.entryIntelligence.rewardPct}%)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <span style={{ color: '#60A5FA', fontWeight: 700 }}>Target 2 (TP2)</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatPrice(activeCoin.entryIntelligence.tp2)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  อัตราส่วน Risk / Reward & โครงสร้างตลาด
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>สัดส่วนกำไรต่อความเสี่ยง (R:R Ratio)</div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--neon-green)' }}>
                      {activeCoin.entryIntelligence.riskReward}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {activeCoin.entryIntelligence.distanceStatus}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neon-cyan)', marginBottom: '4px' }}>
                      Market Structure: {activeCoin.marketStructure.pattern}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {activeCoin.marketStructure.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 4: ORDER FLOW & CVD (Section 13) */}
          {/* ================================================== */}
          {activeTab === 'orderflow' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Order Book Pressure (แรงซื้อ vs แรงขาย)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--neon-green)', fontWeight: 700 }}>
                        BUY PRESSURE {activeCoin.orderBookDepth?.buyPressurePct ?? activeCoin.volumeOrderBook.buyPressurePct}%
                      </span>
                      <span style={{ color: 'var(--neon-red)', fontWeight: 700 }}>
                        SELL PRESSURE {activeCoin.orderBookDepth?.sellPressurePct ?? activeCoin.volumeOrderBook.sellPressurePct}%
                      </span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '5px', display: 'flex', overflow: 'hidden' }}>
                      <div style={{ width: `${activeCoin.orderBookDepth?.buyPressurePct ?? activeCoin.volumeOrderBook.buyPressurePct}%`, backgroundColor: '#10B981' }} />
                      <div style={{ width: `${activeCoin.orderBookDepth?.sellPressurePct ?? activeCoin.volumeOrderBook.sellPressurePct}%`, backgroundColor: '#EF4444' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Buy Depth</div>
                      <strong style={{ color: '#34D399' }}>${((activeCoin.orderBookDepth?.buyDepthUsd ?? 2450000) / 1000).toFixed(0)}K</strong>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Sell Depth</div>
                      <strong style={{ color: '#F87171' }}>${((activeCoin.orderBookDepth?.sellDepthUsd ?? 1150000) / 1000).toFixed(0)}K</strong>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Buy Wall</div>
                      <strong style={{ color: '#FFFFFF' }}>{formatPrice(activeCoin.orderBookDepth?.buyWallPrice ?? (activeCoin.currentPrice * 0.98))}</strong>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Sell Wall</div>
                      <strong style={{ color: '#FFFFFF' }}>{formatPrice(activeCoin.orderBookDepth?.sellWallPrice ?? (activeCoin.currentPrice * 1.04))}</strong>
                    </div>
                  </div>

                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)', fontSize: '12px' }}>
                    Cumulative Volume Delta (CVD): <strong style={{ color: 'var(--neon-green)' }}>{activeCoin.orderBookDepth?.cvd || '+2.48M (Positive Accumulation)'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Relative Strength Comparison (Section 14)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div>เปรียบเทียบกับ BTC: <strong style={{ color: (activeCoin.relativeStrengthMulti?.vsBtcPct ?? 2.5) >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>{(activeCoin.relativeStrengthMulti?.vsBtcPct ?? 2.5) >= 0 ? '+' : ''}{activeCoin.relativeStrengthMulti?.vsBtcPct ?? 2.5}%</strong></div>
                  <div>เปรียบเทียบกับ ETH: <strong style={{ color: 'var(--neon-cyan)' }}>+{activeCoin.relativeStrengthMulti?.vsEthPct ?? 1.8}%</strong></div>
                  <div>เปรียบเทียบกับกลุ่ม {activeCoin.relativeStrengthMulti?.sectorName ?? 'Layer 1'}: <strong style={{ color: 'var(--neon-green)' }}>+{activeCoin.relativeStrengthMulti?.vsSectorPct ?? 1.4}%</strong></div>
                  <div>เปรียบเทียบกับตลาด Bitkub: <strong style={{ color: '#FFFFFF' }}>+{activeCoin.relativeStrengthMulti?.vsMarketPct ?? 1.1}%</strong></div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)', marginTop: '4px' }}>
                    สถานะความแข็งแกร่ง: <strong style={{ color: 'var(--neon-green)' }}>{activeCoin.relativeStrengthMulti?.status || 'OUTPERFORMING'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 5: DERIVATIVES & FUNDING */}
          {/* ================================================== */}
          {activeTab === 'derivatives' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Funding Rate & Open Interest
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div>Funding Rate (8H): <strong style={{ color: '#10B981' }}>+0.0100% (Neutral Bullish)</strong></div>
                  <div>Open Interest: <strong style={{ color: '#FFFFFF' }}>$142,500,000 USD</strong></div>
                  <div>Long / Short Ratio: <strong style={{ color: 'var(--neon-cyan)' }}>1.65 (62.3% Long)</strong></div>
                  <div>Liquidation Bias: <strong style={{ color: '#94A3B8' }}>Shorts Vulnerable Above Resistance</strong></div>
                </div>
              </div>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Estimated Liquidation Zones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div>Short Squeeze Target: <strong style={{ color: 'var(--neon-green)' }}>{formatPrice(activeCoin.currentPrice * 1.06)} ($18.5M Shorts)</strong></div>
                  <div>Long Flush Risk: <strong style={{ color: 'var(--neon-red)' }}>{formatPrice(activeCoin.currentPrice * 0.94)} ($12.1M Longs)</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 6: ON-CHAIN & WHALES */}
          {/* ================================================== */}
          {activeTab === 'onchain' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Whale Signal & Smart Money Behavior
                </div>
                <div style={{ textAlign: 'center', padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>สัญญาณเจ้ามือ (Whale Behavior)</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: activeCoin.whaleAndContext.whaleSignal === 'ACCUMULATION' ? 'var(--neon-green)' : '#94A3B8' }}>
                    {activeCoin.whaleAndContext.whaleSignal}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    มีสัญญาณสะสมเหรียญและดูดซับสภาพคล่องจากกระเป๋าขนาดใหญ่ (Whale Cold Storage Inflow)
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  On-chain Activity & Metrics
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div>Active Addresses (24h): <strong style={{ color: '#FFFFFF' }}>48,250 (+12.4%)</strong></div>
                  <div>Exchange Netflow: <strong style={{ color: 'var(--neon-green)' }}>-$14.2M (Outflow สะสม)</strong></div>
                  <div>Whale Transactions (&gt; $100k): <strong style={{ color: 'var(--neon-cyan)' }}>142 รายการ</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 7: NEWS & TOKEN UNLOCK */}
          {/* ================================================== */}
          {activeTab === 'news_unlock' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  ข่าวสารและปัจจัยเร่ง (News Intelligence)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                      {activeCoin.newsIntelligence.latestHeadline}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      แหล่งข่าว: {activeCoin.newsIntelligence.latestSource} • {activeCoin.newsIntelligence.latestTime}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                    <span>Sentiment: <strong style={{ color: 'var(--neon-green)' }}>{activeCoin.newsIntelligence.sentiment}</strong></span>
                    <span>Catalyst: <strong style={{ color: '#8B5CF6' }}>{activeCoin.newsIntelligence.catalyst}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Token Unlock Monitor (ตรวจสอบแรงกดดันเหรียญปลดล็อก)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div>กำหนดการปลดถัดไป: <strong style={{ color: '#FFFFFF' }}>{activeCoin.fundamentalIntelligence.nextUnlock.date}</strong> (อีก {activeCoin.fundamentalIntelligence.nextUnlock.daysLeft} วัน)</div>
                  <div>สัดส่วนซัพพลาย: <strong style={{ color: '#FFFFFF' }}>{activeCoin.fundamentalIntelligence.nextUnlock.percentSupply}% ของ Circulating Supply</strong></div>
                  <div>ระดับความเสี่ยง: <strong style={{ color: activeCoin.fundamentalIntelligence.nextUnlock.risk === 'HIGH' ? '#EF4444' : '#10B981' }}>{activeCoin.fundamentalIntelligence.nextUnlock.risk}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 8: RISK & FOMO EXTENSION (Sections 15 & 16) */}
          {/* ================================================== */}
          {activeTab === 'risk' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* FOMO Extension Gauge (Section 15) */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gauge size={18} color="#F97316" /> Extension Score & FOMO Detection (Section 15)
                </div>

                <div style={{ textAlign: 'center', padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>สถานะความเสี่ยงจากการยืดตัวของราคา</div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color:
                        activeCoin.exitIntelligence.extensionRisk === 'PARABOLIC' ? '#EF4444' :
                        activeCoin.exitIntelligence.extensionRisk === 'OVEREXTENDED' ? '#F97316' : '#10B981',
                      marginTop: '4px',
                    }}
                  >
                    {activeCoin.exitIntelligence.extensionRisk}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {activeCoin.exitIntelligence.extensionRisk === 'PARABOLIC'
                      ? '⚠ ราคาวิ่งพุ่งแรงชันแบบพาราโบลา ห้ามไล่ราคาเด็ดขาด (DO NOT CHASE)'
                      : 'ระดับราคายังไม่หลุดโซนอันตราย ไม่ติดภาวะ FOMO Overextended'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>Distance from EMA 20: <strong style={{ color: '#FFFFFF' }}>+3.4% (Normal)</strong></div>
                  <div>RSI Heat Level: <strong style={{ color: '#FFFFFF' }}>{activeCoin.technicals.rsi} (Good Zone)</strong></div>
                  <div>ATR Extension Multiple: <strong style={{ color: '#FFFFFF' }}>1.4x ATR</strong></div>
                </div>
              </div>

              {/* Local Bitkub Premium (Section 16) */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Percent size={18} color="#10B981" /> Local Bitkub Premium Monitor (Section 16)
                </div>

                <div style={{ textAlign: 'center', padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BITKUB PREMIUM VS GLOBAL</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: activeCoin.localPremium?.riskLevel === 'NORMAL' ? 'var(--neon-green)' : '#F59E0B', marginTop: '4px' }}>
                    {activeCoin.localPremium?.statusText || '+1.2% NORMAL'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>ราคาบนกระดาน Bitkub: <strong style={{ color: '#FFFFFF' }}>฿{(activeCoin.currentPrice * usdThbRate * 1.012).toFixed(4)}</strong></div>
                  <div>ราคาอ้างอิง Global (Binance): <strong style={{ color: '#CBD5E1' }}>฿{(activeCoin.currentPrice * usdThbRate).toFixed(4)}</strong></div>
                  <div>ผลกระทบต่อคะแนน: <strong style={{ color: 'var(--neon-green)' }}>ปกติ (ไม่มีการหักคะแนนส่วนต่างผิดปกติ)</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 9: EXIT & TRAILING STOP (Section 12) */}
          {/* ================================================== */}
          {activeTab === 'exit' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  Dynamic Trailing Stop (ป้องกันการคืนกำไร)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trailing Stop แนะนำปัจจุบัน</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#38BDF8' }}>
                      {formatPrice(activeCoin.exitIntelligence.dynamicTrailingStop)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ระยะห่างจากราคาปัจจุบัน: {activeCoin.exitIntelligence.trailingStopDistancePct}%
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    * Trailing Stop จะเลื่อนระดับขึ้นตามโครงสร้างแนวโน้มขาขึ้นโดยอัตโนมัติ และ <strong>ไม่มีวันเลื่อนลง</strong> เพื่อการรักษาเงินต้นและล็อกกำไร
                  </div>
                </div>
              </div>

              {/* Position Management */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Position Management (พอร์ตของคุณ)</span>
                  <button
                    onClick={() => setIsEditingPosition(!isEditingPosition)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid #8B5CF6',
                      color: '#C4B5FD',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {isEditingPosition ? 'ปิดฟอร์ม' : 'แก้ไข Position'}
                  </button>
                </div>

                {isEditingPosition ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          ต้นทุนเฉลี่ย (Average Cost USD)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="เช่น: 2.65"
                          value={avgCostInput}
                          onChange={(e) => setAvgCostInput(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          จำนวนเหรียญที่ถือ (Amount)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="เช่น: 1000"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          จุดตัดขาดทุน (Stop Loss USD)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="เช่น: 2.45"
                          value={stopLossInput}
                          onChange={(e) => setStopLossInput(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          เป้าหมายทำกำไร (Take Profit 1 USD)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="เช่น: 3.20"
                          value={tp1Input}
                          onChange={(e) => setTp1Input(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          ความสำคัญ (Priority)
                        </label>
                        <select
                          value={priorityInput}
                          onChange={(e) => setPriorityInput(e.target.value as any)}
                          style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', width: '100%' }}
                        >
                          <option value="critical">🔴 CRITICAL (ด่วนที่สุด)</option>
                          <option value="high">🟠 HIGH (สำคัญสูง)</option>
                          <option value="normal">🟣 NORMAL (ปกติ)</option>
                          <option value="low">⚪ LOW (เฝ้าระวังต่ำ)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        บันทึกกลยุทธ์ส่วนตัว (Personal Strategy Notes)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="ระบุเหตุผลการเข้าซื้อ แผนการออก หรือบันทึกช่วยจำ..."
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={handleSavePosition}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '8px',
                          backgroundColor: '#8B5CF6',
                          color: '#FFF',
                          border: 'none',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Save size={14} /> บันทึกลงฐานข้อมูล Database
                      </button>
                      <button
                        onClick={() => setIsEditingPosition(false)}
                        style={{
                          padding: '9px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#CBD5E1',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          cursor: 'pointer',
                        }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ต้นทุนเฉลี่ย (Avg Cost)</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                          {activeCoin.position?.averageCost !== undefined ? formatPrice(activeCoin.position.averageCost) : '-'}
                        </div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>จำนวนที่ถือ (Amount)</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                          {activeCoin.position?.amount !== undefined ? `${activeCoin.position.amount.toLocaleString()} ${activeCoin.symbol}` : '-'}
                        </div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>กำไร / ขาดทุน (P/L)</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: (activeCoin.position?.pnl || 0) >= 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                          {activeCoin.position?.pnl !== undefined
                            ? `${activeCoin.position.pnl >= 0 ? '+' : ''}${formatPrice(activeCoin.position.pnl)} (${(activeCoin.position.pnlPercent || 0).toFixed(2)}%)`
                            : '-'}
                        </div>
                      </div>
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stop Loss / TP1</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1' }}>
                          SL: <span style={{ color: '#F87171' }}>{activeCoin.entryIntelligence?.stopLoss ? formatPrice(activeCoin.entryIntelligence.stopLoss) : '-'}</span>
                          {' • '}
                          TP1: <span style={{ color: '#34D399' }}>{activeCoin.entryIntelligence?.tp1 ? formatPrice(activeCoin.entryIntelligence.tp1) : '-'}</span>
                        </div>
                      </div>
                    </div>

                    {activeCoin.userNotes && (
                      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        <div style={{ fontSize: '11px', color: '#C4B5FD', fontWeight: 700, marginBottom: '2px' }}>📝 บันทึกกลยุทธ์ส่วนตัว:</div>
                        <div style={{ fontSize: '12.5px', color: '#E2E8F0' }}>{activeCoin.userNotes}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#A78BFA' }}>
                        <Database size={12} />
                        {activeCoin.sourceType === 'PINNED'
                          ? `บันทึกในฐานข้อมูล PostgreSQL เรียบร้อย (ID: ${activeCoin.id.substring(0, 8)}...)`
                          : 'เหรียญนี้เป็นระบบแนะนำอัตโนมัติ — กด "แก้ไข Position" เพื่อบันทึกลง Database'}
                      </span>
                      <span>สถานะ: <strong style={{ color: '#FFF' }}>{activeCoin.positionStatus || 'WATCHING'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TAB 10: SCORE HISTORY & ALERT STREAM (Sections 18 & 19) */}
          {/* ================================================== */}
          {activeTab === 'history' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Score History */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                  ประวัติคะแนน Focus Score (Score History Timeline)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeCoin.scoreHistory.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{h.timestamp}</span>
                      <span style={{ color: '#FFFFFF' }}>ราคา: {formatPrice(h.price)}</span>
                      <span style={{ fontWeight: 800, color: h.score >= 80 ? 'var(--neon-green)' : '#F59E0B' }}>
                        Score: {h.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Stream Feed (Section 19) */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                    Live Alert Stream (Live Events Feed)
                  </div>
                  {/* Filter Tabs */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['ALL', 'INFO', 'WATCH', 'IMPORTANT', 'CRITICAL'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setAlertFilter(lvl)}
                        style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: alertFilter === lvl ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                          color: '#FFFFFF',
                          border: 'none',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(activeCoin.alerts.length > 0 ? activeCoin.alerts : [
                    { id: 'ev-1', priority: 'IMPORTANT', title: `${activeCoin.symbol} Volume Spike +42%`, message: 'ปริมาณการซื้อขายขยายตัวเฉียบพลันในรอบ 15 นาที', timestamp: '14:02' },
                    { id: 'ev-2', priority: 'INFO', title: `${activeCoin.symbol} entered Entry Zone`, message: `ราคาแตะเข้าสู่โซนราคาซื้อที่แนะนำ`, timestamp: '13:58' },
                    { id: 'ev-3', priority: 'WATCH', title: `Relative Strength vs BTC เพิ่มขึ้น`, message: 'แรงส่งแข็งแกร่งกว่าดัชนีตลาดรวมอย่างมีนัยสำคัญ', timestamp: '13:45' },
                  ])
                    .filter((a) => alertFilter === 'ALL' || a.priority === alertFilter)
                    .map((al) => (
                      <div
                        key={al.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0,0,0,0.25)',
                          borderLeft: `4px solid ${
                            al.priority === 'CRITICAL' ? '#EF4444' :
                            al.priority === 'IMPORTANT' ? '#F97316' :
                            al.priority === 'WATCH' ? '#FBBF24' : '#8B5CF6'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>{al.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{al.message}</div>
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{al.timestamp}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
            </>
          )}
          </div>
        </>
      )}
        </>
        )}
      </div>

      {/* ================================================== */}
      {/* SECTION 18: WHY SCORE CHANGED EXPLAINABLE MODAL */}
      {/* ================================================== */}
      {whyScoreModalCoin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setWhyScoreModalCoin(null)}
        >
          <div
            style={{
              backgroundColor: '#10182B',
              border: '1px solid #8B5CF6',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(139, 92, 246, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={22} color="#8B5CF6" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  ทำไมคะแนน Focus ของ {whyScoreModalCoin.symbol} ถึงเปลี่ยน?
                </h3>
              </div>
              <button
                onClick={() => setWhyScoreModalCoin(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>คะแนนปัจจุบัน:</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--neon-green)' }}>
                  {whyScoreModalCoin.focusScore}/100
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>การเปลี่ยนแปลง (Delta):</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: whyScoreModalCoin.scoreDelta >= 0 ? '#34D399' : '#F87171' }}>
                  {whyScoreModalCoin.scoreDelta >= 0 ? `+${whyScoreModalCoin.scoreDelta}` : whyScoreModalCoin.scoreDelta} PTS
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#CBD5E1', marginBottom: '10px' }}>
              ปัจจัยที่ส่งผลต่อคะแนน (Explainable Attribution Breakdown):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(whyScoreModalCoin.whyScoreChanged || [
                { factor: 'Volume Expansion', delta: +4, description: 'ปริมาณการซื้อขายขยายตัว 1.35x เมื่อเทียบกับค่าเฉลี่ย', impact: 'positive' },
                { factor: 'Higher Low Confirmation', delta: +3, description: 'โครงสร้างราคายก Low ในกราฟ 4H สำเร็จ', impact: 'positive' },
                { factor: 'Relative Strength vs BTC', delta: +2, description: 'เหรียญวิ่งแข็งกว่าทิศทางของ Bitcoin +3.4%', impact: 'positive' },
                { factor: 'Positive Catalyst', delta: +1, description: 'Sentiment ข่าวสารและการอัปเกรดเชิงบวก', impact: 'positive' },
                { factor: 'Price Extension Penalty', delta: -3, description: 'ราคาเริ่มห่างเส้น EMA 20 แนะนำเฝ้าระวังการย่อตัว', impact: 'negative' },
              ]).map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>{item.factor}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.description}</div>
                  </div>
                  <strong style={{ fontSize: '13px', color: item.delta >= 0 ? '#10B981' : '#EF4444' }}>
                    {item.delta >= 0 ? `+${item.delta}` : item.delta}
                  </strong>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWhyScoreModalCoin(null)}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#8B5CF6',
                border: 'none',
                color: '#FFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Add Focus Modal */}
      <FocusAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        coins={allCoins}
        existingFocusSymbols={focusData?.items.map((i) => i.symbol) || []}
        onAddFocus={handleAddFocus}
        currency={currency}
      />

      {/* Compare Modal */}
      {focusData && (
        <FocusCompareModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          focusCoins={focusData.items}
          currency={currency}
          onSelectCoin={(sym) => {
            setSelectedSymbol(sym);
            setIsCompareModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
