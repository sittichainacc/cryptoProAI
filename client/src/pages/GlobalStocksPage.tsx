// ============================================================================
// Global Equity Multi-Agent Intelligence System (Phase 1 UI)
// Master Investment Committee: 41 Agents across 4 Teams + AI-CIO + Hard Risk Engine
// Enhanced with Multi-Factor Screener, Technical Indicators Matrix & SEC Filings
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Cpu,
  BarChart3,
  Layers,
  Zap,
  Target,
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Lock,
  Play,
  UserCheck,
  Scale,
  SlidersHorizontal,
  Activity,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  RotateCcw,
  History,
  Check,
  XCircle,
  Clock,
  Send,
  Wallet,
  Bell,
  Radio
} from 'lucide-react';
import { NotificationChannelManager } from '../components/NotificationChannelManager.js';
import {
  GlobalStockItem,
  AgentDefinition,
  TradePlan,
  MultiAgentAnalysisResponse,
  TechnicalIndicatorSet,
  SECFilingItem,
  RankingRunResult,
  FactorWeights,
  StockRankingCandidate,
  EquityResearchReport,
  DCFValuationResult,
  RedTeamAuditResult,
  RedTeamUniverseSummary,
  TacticalTradePlanResult,
  KellyCalculationResult,
  TacticalUniverseSummary,
  CIOInvestmentCommitteeMemo,
  CIOUniverseSummaryItem,
  AgentAccuracyRecord,
  PortfolioRiskSummary,
  PortfolioHolding,
  SectorExposure,
  CircuitBreakerEvent,
  PaperOrder,
  CreatePaperOrderInput,
  BacktestStrategyId,
  BacktestStrategyInfo,
  BacktestConfig,
  EquityCurvePoint,
  BacktestTrade,
  BacktestResult,
  PaperOrderSide,
  PaperOrderType,
  PaperOrderStatus
} from '../types/stocks.js';

export const GlobalStocksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'cio' | 'portfolio' | 'paper' | 'ranking' | 'research' | 'redteam' | 'tactical' | 'notifications' | 'screener' | 'technical' | 'filings' | 'agents' | 'risk'>('opportunities');
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [sseStats, setSseStats] = useState<{ activeClients: number; totalBroadcasts: number; uptimeSeconds: number } | undefined>(undefined);
  const [universe, setUniverse] = useState<GlobalStockItem[]>([]);
  const [tradePlans, setTradePlans] = useState<TradePlan[]>([]);
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('NVDA');
  const [analysisData, setAnalysisData] = useState<MultiAgentAnalysisResponse | null>(null);
  const [chartData, setChartData] = useState<{ stock: GlobalStockItem; candles: any[]; indicators: TechnicalIndicatorSet } | null>(null);
  const [secFilings, setSecFilings] = useState<SECFilingItem[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [paperOrderMsg, setPaperOrderMsg] = useState<string | null>(null);

  // Team 1 Stock Ranking State (Phase 2)
  const [rankingResult, setRankingResult] = useState<RankingRunResult | null>(null);
  const [factorWeights, setFactorWeights] = useState<FactorWeights>({
    momentum: 0.20,
    trend: 0.15,
    quality: 0.20,
    growth: 0.15,
    value: 0.10,
    earningsRevision: 0.10,
    catalyst: 0.10,
  });
  const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(false);
  const [rankingMsg, setRankingMsg] = useState<string | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>('NVDA');

  // Team 2 Equity Research & DCF State (Phase 3)
  const [researchReport, setResearchReport] = useState<EquityResearchReport | null>(null);
  const [dcfWacc, setDcfWacc] = useState<number>(9.0);
  const [dcfTerminalGrowth, setDcfTerminalGrowth] = useState<number>(3.5);
  const [dcfGrowthStage1, setDcfGrowthStage1] = useState<number>(20.0);
  const [isLoadingResearch, setIsLoadingResearch] = useState<boolean>(false);
  const [researchMsg, setResearchMsg] = useState<string | null>(null);

  // Team 3 Red Team & Forensic State (Phase 4)
  const [redTeamAudit, setRedTeamAudit] = useState<RedTeamAuditResult | null>(null);
  const [redTeamUniverse, setRedTeamUniverse] = useState<RedTeamAuditResult[]>([]);
  const [isLoadingRedTeam, setIsLoadingRedTeam] = useState<boolean>(false);
  const [redTeamMsg, setRedTeamMsg] = useState<string | null>(null);

  // Team 4 Tactical Asset Allocation State (Phase 5)
  const [tacticalPlan, setTacticalPlan] = useState<TacticalTradePlanResult | null>(null);
  const [tacticalUniverse, setTacticalUniverse] = useState<TacticalTradePlanResult[]>([]);
  const [isLoadingTactical, setIsLoadingTactical] = useState<boolean>(false);
  const [tacticalMsg, setTacticalMsg] = useState<string | null>(null);
  const [customEquity, setCustomEquity] = useState<number>(100_000);
  const [customWinProb, setCustomWinProb] = useState<number>(60);
  const [customPayoutRatio, setCustomPayoutRatio] = useState<number>(2.2);
  const [kellySimResult, setKellySimResult] = useState<KellyCalculationResult | null>(null);

  // AI-CIO Investment Committee Chamber State (Phase 6)
  const [cioMemo, setCioMemo] = useState<CIOInvestmentCommitteeMemo | null>(null);
  const [cioUniverse, setCioUniverse] = useState<CIOUniverseSummaryItem[]>([]);
  const [agentAccuracies, setAgentAccuracies] = useState<AgentAccuracyRecord[]>([]);
  const [isLoadingCio, setIsLoadingCio] = useState<boolean>(false);
  const [cioMsg, setCioMsg] = useState<string | null>(null);
  const [selectedDebateTopicIndex, setSelectedDebateTopicIndex] = useState<number>(0);

  // Portfolio Risk & Circuit Breakers State (Phase 7)
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRiskSummary | null>(null);
  const [cbHistory, setCbHistory] = useState<CircuitBreakerEvent[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [portfolioMsg, setPortfolioMsg] = useState<string | null>(null);
  const [tradeCheckTicker, setTradeCheckTicker] = useState<string>('NVDA');
  const [tradeCheckSide, setTradeCheckSide] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeCheckAmount, setTradeCheckAmount] = useState<number>(5000);
  const [tradeCheckResult, setTradeCheckResult] = useState<{ allowed: boolean; violationReason?: string } | null>(null);
  const [isCheckingTrade, setIsCheckingTrade] = useState<boolean>(false);
  const [targetCashDeleveraging, setTargetCashDeleveraging] = useState<number>(50);

  // Paper Trading & Strategy Backtesting State (Phase 8)
  const [paperTabMode, setPaperTabMode] = useState<'paper' | 'backtest'>('paper');
  const [paperOrders, setPaperOrders] = useState<PaperOrder[]>([]);
  const [isLoadingPaper, setIsLoadingPaper] = useState<boolean>(false);
  const [paperActionMsg, setPaperActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Paper Order Form
  const [paperOrderTicker, setPaperOrderTicker] = useState<string>('NVDA');
  const [paperOrderSide, setPaperOrderSide] = useState<PaperOrderSide>('BUY');
  const [paperOrderType, setPaperOrderType] = useState<PaperOrderType>('MARKET');
  const [paperOrderShares, setPaperOrderShares] = useState<number>(10);
  const [paperOrderLimitPrice, setPaperOrderLimitPrice] = useState<number | undefined>(undefined);
  const [paperOrderStopPrice, setPaperOrderStopPrice] = useState<number | undefined>(undefined);
  const [isSubmittingPaperOrder, setIsSubmittingPaperOrder] = useState<boolean>(false);

  // Backtest Config & Execution
  const [backtestStrategies, setBacktestStrategies] = useState<BacktestStrategyInfo[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<BacktestStrategyId>('MULTI_AGENT_CONSENSUS');
  const [backtestCapital, setBacktestCapital] = useState<number>(100000);
  const [backtestBenchmark, setBacktestBenchmark] = useState<string>('SPY');
  const [backtestSlippage, setBacktestSlippage] = useState<number>(4.0);
  const [backtestCommission, setBacktestCommission] = useState<number>(0.005);
  const [backtestMaxPositions, setBacktestMaxPositions] = useState<number>(5);
  const [backtestStopLossPct, setBacktestStopLossPct] = useState<number>(5.0);
  const [backtestTakeProfitPct, setBacktestTakeProfitPct] = useState<number>(15.0);
  const [backtestPositionSizing, setBacktestPositionSizing] = useState<'EQUAL_WEIGHT' | 'HALF_KELLY' | 'VOLATILITY_PARITY'>('HALF_KELLY');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunningBacktest, setIsRunningBacktest] = useState<boolean>(false);
  const [backtestHistory, setBacktestHistory] = useState<BacktestResult[]>([]);

  // Multi-Factor Screener State (Phase 1)
  const [filterPe, setFilterPe] = useState<number | 'ALL'>('ALL');
  const [filterRoe, setFilterRoe] = useState<number | 'ALL'>('ALL');
  const [filterGrowth, setFilterGrowth] = useState<number | 'ALL'>('ALL');
  const [filterRsiState, setFilterRsiState] = useState<'ALL' | 'OVERSOLD' | 'NORMAL' | 'OVERBOUGHT'>('ALL');
  const [filterTechnicalSetup, setFilterTechnicalSetup] = useState<'ALL' | 'GOLDEN_CROSS' | 'ABOVE_200EMA' | 'NEAR_52W_HIGH'>('ALL');

  // Real-Time Market Data Provider State
  const [providerStatus, setProviderStatus] = useState<{
    isMarketOpen: boolean;
    provider: string;
    macroSummary: { us10y: string; vix: number; dxy: number };
  } | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const fetchProviderStatus = async () => {
    try {
      const res = await fetch('/api/stocks/providers/status');
      if (res.ok) {
        const json = await res.json();
        setProviderStatus(json);
      }
    } catch (e) {
      console.error('Error fetching provider status:', e);
    }
  };

  const handleSyncLivePrices = async () => {
    setIsSyncingLive(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/stocks/sync-live', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setSyncMsg(json.message);
        await fetchData();
        await fetchProviderStatus();
      } else {
        setSyncMsg(json.error || 'ซิงก์ข้อมูลไม่สำเร็จ');
      }
    } catch (err: any) {
      setSyncMsg(err.message || 'เกิดข้อผิดพลาดในการซิงก์ราคาตลาดสด');
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setSyncMsg(null), 6000);
    }
  };

  // Fetch Core Data
  const fetchData = async () => {
    try {
      const [uRes, tpRes, agRes, rkRes] = await Promise.all([
        fetch('/api/stocks/universe'),
        fetch('/api/stocks/trade-plans'),
        fetch('/api/stocks/agents'),
        fetch('/api/stocks/risk/status'),
      ]);

      if (uRes.ok) {
        const json = await uRes.json();
        setUniverse(json.data || []);
      }
      if (tpRes.ok) {
        const json = await tpRes.json();
        setTradePlans(json.data || []);
      }
      if (agRes.ok) {
        const json = await agRes.json();
        setAgents(json.data || []);
      }
      if (rkRes.ok) {
        const json = await rkRes.json();
        setKillSwitchActive(json.data?.killSwitchActive || false);
      }
    } catch (err) {
      console.error('Failed to load stocks data:', err);
    }
  };

  // Fetch Team 1 Ranking Data (Phase 2)
  const fetchRankingData = async () => {
    try {
      const res = await fetch('/api/stocks/ranking/latest');
      if (res.ok) {
        const json = await res.json();
        setRankingResult(json.data);
        if (json.data?.weights) {
          setFactorWeights(json.data.weights);
        }
      }
    } catch (err) {
      console.error('Failed to load ranking data:', err);
    }
  };

  const handleRunRanking = async () => {
    setIsLoadingRanking(true);
    setRankingMsg(null);
    try {
      const res = await fetch('/api/stocks/ranking/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: factorWeights }),
      });
      const json = await res.json();
      if (json.success) {
        setRankingResult(json.data);
        setRankingMsg(`✅ ประมวลผลจัดอันดับสำเร็จ! หุ้นอันดับ 1: ${json.data.summary.highestScoreTicker} (${json.data.summary.highestScore}/100)`);
      } else {
        setRankingMsg(`❌ เกิดข้อผิดพลาด: ${json.error}`);
      }
    } catch (e: any) {
      setRankingMsg(`❌ เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setIsLoadingRanking(false);
      setTimeout(() => setRankingMsg(null), 5000);
    }
  };

  const resetWeights = () => {
    setFactorWeights({
      momentum: 0.20,
      trend: 0.15,
      quality: 0.20,
      growth: 0.15,
      value: 0.10,
      earningsRevision: 0.10,
      catalyst: 0.10,
    });
  };

  // Fetch Analysis, Chart, Filings, Research, Red Team & Tactical when selectedStock changes
  const fetchStockDetails = async (ticker: string) => {
    setIsLoadingAnalysis(true);
    try {
      const [aRes, cRes, fRes, rRes, rtRes, tacRes, cioRes] = await Promise.all([
        fetch(`/api/stocks/analysis/${ticker}`),
        fetch(`/api/stocks/chart/${ticker}`),
        fetch(`/api/stocks/filings/${ticker}`),
        fetch(`/api/stocks/research/${ticker}`),
        fetch(`/api/stocks/red-team/${ticker}`),
        fetch(`/api/stocks/tactical/${ticker}?equity=${customEquity}`),
        fetch(`/api/stocks/cio/memo/${ticker}`),
      ]);

      if (aRes.ok) {
        const json = await aRes.json();
        setAnalysisData(json.data);
      }
      if (cRes.ok) {
        const json = await cRes.json();
        setChartData(json.data);
      }
      if (fRes.ok) {
        const json = await fRes.json();
        setSecFilings(json.data || []);
      }
      if (rRes.ok) {
        const json = await rRes.json();
        setResearchReport(json.data);
        if (json.data?.valuation) {
          setDcfWacc(json.data.valuation.wacc);
          setDcfTerminalGrowth(json.data.valuation.terminalGrowthRate);
        }
      }
      if (rtRes.ok) {
        const json = await rtRes.json();
        setRedTeamAudit(json.data);
      }
      if (tacRes.ok) {
        const json = await tacRes.json();
        setTacticalPlan(json.data);
      }
      if (cioRes && cioRes.ok) {
        const json = await cioRes.json();
        setCioMemo(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch stock details:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const fetchRedTeamUniverse = async () => {
    try {
      const res = await fetch('/api/stocks/red-team/universe');
      if (res.ok) {
        const json = await res.json();
        setRedTeamUniverse(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch red team universe:', err);
    }
  };

  const fetchTacticalUniverse = async () => {
    try {
      const res = await fetch(`/api/stocks/tactical/universe?equity=${customEquity}`);
      if (res.ok) {
        const json = await res.json();
        setTacticalUniverse(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tactical universe:', err);
    }
  };

  const fetchCioUniverse = async () => {
    try {
      const [uRes, accRes] = await Promise.all([
        fetch('/api/stocks/cio/universe'),
        fetch('/api/stocks/cio/accuracy'),
      ]);
      if (uRes.ok) {
        const json = await uRes.json();
        setCioUniverse(json.data || []);
      }
      if (accRes.ok) {
        const json = await accRes.json();
        setAgentAccuracies(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch CIO universe:', err);
    }
  };

  const handleConveneCommittee = async () => {
    if (!selectedStock) return;
    setIsLoadingCio(true);
    setCioMsg(null);
    try {
      const res = await fetch('/api/stocks/cio/convene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: selectedStock, portfolioEquity: customEquity }),
      });
      const json = await res.json();
      if (json.success) {
        setCioMemo(json.data);
        setCioMsg(json.message);
        fetchCioUniverse();
      } else {
        setCioMsg(`❌ เกิดข้อผิดพลาด: ${json.error}`);
      }
    } catch (err: any) {
      setCioMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsLoadingCio(false);
    }
  };

  // Phase 7: Portfolio Risk & Circuit Breaker Handlers
  const fetchPortfolioRisk = async () => {
    setIsLoadingPortfolio(true);
    try {
      const [sumRes, cbRes] = await Promise.all([
        fetch('/api/stocks/portfolio/summary'),
        fetch('/api/stocks/portfolio/circuit-breakers'),
      ]);
      if (sumRes.ok) {
        const json = await sumRes.json();
        setPortfolioRisk(json.data);
      }
      if (cbRes.ok) {
        const json = await cbRes.json();
        setCbHistory(json.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio risk:', err);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const handleDeleveraging = async (targetCashPct: number = 50) => {
    try {
      const res = await fetch('/api/stocks/portfolio/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCashPct }),
      });
      const json = await res.json();
      if (json.success) {
        setPortfolioMsg(`✅ ปรับลดความเสี่ยงสำเร็จ: เงินสดในพอร์ตเพิ่มเป็น $${json.data.newCashBalance} (${json.data.newCashRatioPct}%)`);
        fetchPortfolioRisk();
      }
    } catch (err: any) {
      setPortfolioMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setTimeout(() => setPortfolioMsg(null), 5000);
    }
  };

  const handleKillSwitchAction = async (action: 'TRIGGER' | 'RESET') => {
    try {
      const res = await fetch('/api/stocks/portfolio/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminAuth: true, reason: action === 'TRIGGER' ? 'Manual Fire Drill from UI' : 'Admin UI Reset' }),
      });
      const json = await res.json();
      if (json.success) {
        setPortfolioMsg(action === 'TRIGGER' ? '🚨 EMERGENCY KILL SWITCH EXECUTED! ล้างพอร์ตเป็นเงินสด 100%' : '✅ ปลดล็อค Kill Switch สำเร็จ ระบบกลับสู่สภาวะปกติ');
        fetchPortfolioRisk();
        fetchData();
      } else {
        setPortfolioMsg(`❌ ${json.message}`);
      }
    } catch (err: any) {
      setPortfolioMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setTimeout(() => setPortfolioMsg(null), 6000);
    }
  };

  const handleCheckTrade = async () => {
    setIsCheckingTrade(true);
    setTradeCheckResult(null);
    try {
      const res = await fetch('/api/stocks/portfolio/check-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: tradeCheckTicker,
          side: tradeCheckSide,
          notionalUsd: tradeCheckAmount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTradeCheckResult(json.data);
      }
    } catch (err: any) {
      console.error('Pre-trade check failed:', err);
    } finally {
      setIsCheckingTrade(false);
    }
  };

  const handleRecalculateKelly = async () => {
    if (!selectedStock) return;
    try {
      const res = await fetch('/api/stocks/tactical/kelly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedStock,
          portfolioEquity: customEquity,
          winProbability: customWinProb / 100,
          payoutRatio: customPayoutRatio,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setKellySimResult(json.data);
      }
    } catch (err) {
      console.error('Failed to calculate Kelly:', err);
    }
  };

  const handleRecalculateTacticalPlan = async (overrides?: { targetEntry?: number; customStopLoss?: number }) => {
    if (!selectedStock) return;
    setIsLoadingTactical(true);
    setTacticalMsg(null);
    try {
      const res = await fetch('/api/stocks/tactical/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedStock,
          portfolioEquity: customEquity,
          targetEntry: overrides?.targetEntry,
          customStopLoss: overrides?.customStopLoss,
          winProb: customWinProb / 100,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTacticalPlan(json.data);
        setTacticalMsg(json.message);
        fetchTacticalUniverse();
      } else {
        setTacticalMsg(`❌ เกิดข้อผิดพลาด: ${json.error}`);
      }
    } catch (err: any) {
      setTacticalMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsLoadingTactical(false);
      setTimeout(() => setTacticalMsg(null), 5000);
    }
  };

  const handleExecutePaperTradeFromPlan = async (plan: TacticalTradePlanResult) => {
    setPaperOrderMsg(null);
    const sharesCount = Math.max(1, Math.floor(plan.positionSizing.riskAdjustedCapitalUsd / plan.entryPrice));
    try {
      const res = await fetch('/api/stocks/paper/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: plan.ticker,
          side: 'BUY',
          quantity: sharesCount,
          price: plan.entryPrice,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPaperOrderMsg(`✅ ส่งคำสั่งซื้อสำเร็จ! ${json.message} (ราคา: $${plan.entryPrice}, ขนาด: ${plan.positionSizing.recommendedSizePct}%, Stop Loss: $${plan.stopLoss}, TP1: $${plan.takeProfit1})`);
      } else {
        setPaperOrderMsg(`❌ คำสั่งถูกปฏิเสธ: ${json.error}`);
      }
    } catch (err: any) {
      setPaperOrderMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
    setTimeout(() => setPaperOrderMsg(null), 8000);
  };

  const handleAuditStock = async (ticker: string, simulateVeto: boolean = false) => {
    setIsLoadingRedTeam(true);
    setRedTeamMsg(null);
    try {
      const res = await fetch('/api/stocks/red-team/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, simulateCriticalVeto: simulateVeto }),
      });
      const json = await res.json();
      if (json.success) {
        setRedTeamAudit(json.data);
        setRedTeamMsg(json.message);
        fetchRedTeamUniverse();
      } else {
        setRedTeamMsg(`❌ เกิดข้อผิดพลาด: ${json.error}`);
      }
    } catch (err: any) {
      setRedTeamMsg(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsLoadingRedTeam(false);
      setTimeout(() => setRedTeamMsg(null), 5000);
    }
  };

  const handleRecalculateDCF = async () => {
    if (!selectedStock) return;
    setIsLoadingResearch(true);
    setResearchMsg(null);
    try {
      const res = await fetch('/api/stocks/research/dcf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedStock,
          wacc: dcfWacc / 100,
          terminalGrowthRate: dcfTerminalGrowth / 100,
          growthRateStage1: dcfGrowthStage1 / 100,
        }),
      });
      const json = await res.json();
      if (json.success && researchReport) {
        setResearchReport({
          ...researchReport,
          valuation: json.data,
        });
        setResearchMsg(`✅ คำนวณ 2-Stage DCF สำเร็จ! Fair Value ใหม่: $${json.data.fairValue} (Margin of Safety: ${json.data.marginOfSafetyPct > 0 ? '+' : ''}${json.data.marginOfSafetyPct}%)`);
      } else {
        setResearchMsg(`❌ เกิดข้อผิดพลาด: ${json.error}`);
      }
    } catch (e: any) {
      setResearchMsg(`❌ เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setIsLoadingResearch(false);
      setTimeout(() => setResearchMsg(null), 5000);
    }
  };

  // Phase 8: Paper Trading & Backtesting Handlers
  const fetchPaperOrders = async () => {
    setIsLoadingPaper(true);
    try {
      const res = await fetch('/api/stocks/paper/orders');
      if (res.ok) {
        const json = await res.json();
        setPaperOrders(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching paper orders:', err);
    } finally {
      setIsLoadingPaper(false);
    }
  };

  const fetchBacktestStrategies = async () => {
    try {
      const res = await fetch('/api/stocks/backtest/strategies');
      if (res.ok) {
        const json = await res.json();
        setBacktestStrategies(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching backtest strategies:', err);
    }
  };

  const fetchBacktestHistory = async () => {
    try {
      const res = await fetch('/api/stocks/backtest/history');
      if (res.ok) {
        const json = await res.json();
        setBacktestHistory(json.data || []);
        if (json.data && json.data.length > 0 && !backtestResult) {
          setBacktestResult(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching backtest history:', err);
    }
  };

  const handleExecutePaperOrder = async () => {
    setIsSubmittingPaperOrder(true);
    setPaperActionMsg(null);
    try {
      const res = await fetch('/api/stocks/paper/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: paperOrderTicker,
          side: paperOrderSide,
          orderType: paperOrderType,
          shares: paperOrderShares,
          limitPrice: paperOrderLimitPrice,
          stopPrice: paperOrderStopPrice,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPaperActionMsg({ type: 'success', text: json.message });
        await fetchPaperOrders();
        await fetchPortfolioRisk();
      } else {
        setPaperActionMsg({ type: 'error', text: json.message || json.error || 'คำสั่งซื้อขายถูกปฏิเสธ' });
      }
    } catch (err: any) {
      setPaperActionMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการส่งคำสั่ง' });
    } finally {
      setIsSubmittingPaperOrder(false);
      setTimeout(() => setPaperActionMsg(null), 8000);
    }
  };

  const handleCancelPaperOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/stocks/paper/order/${orderId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setPaperActionMsg({ type: 'success', text: json.message });
        await fetchPaperOrders();
      } else {
        setPaperActionMsg({ type: 'error', text: json.message || 'ไม่สามารถยกเลิกคำสั่งได้' });
      }
    } catch (err: any) {
      setPaperActionMsg({ type: 'error', text: err.message });
    } finally {
      setTimeout(() => setPaperActionMsg(null), 6000);
    }
  };

  const handleClosePaperPosition = async (ticker: string) => {
    try {
      const res = await fetch('/api/stocks/paper/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPaperActionMsg({ type: 'success', text: json.message });
        await fetchPaperOrders();
        await fetchPortfolioRisk();
      } else {
        setPaperActionMsg({ type: 'error', text: json.message || 'ไม่สามารถปิดสถานะได้' });
      }
    } catch (err: any) {
      setPaperActionMsg({ type: 'error', text: err.message });
    } finally {
      setTimeout(() => setPaperActionMsg(null), 6000);
    }
  };

  const handleResetPaperAccount = async () => {
    if (!window.confirm('คุณต้องการรีเซ็ตพอร์ตเสมือน Paper Trading เป็นเงินสดเริ่มต้น $100,000 หรือไม่?')) return;
    try {
      const res = await fetch('/api/stocks/paper/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCapital: 100000 }),
      });
      const json = await res.json();
      if (res.ok) {
        setPaperActionMsg({ type: 'success', text: json.message });
        await fetchPaperOrders();
        await fetchPortfolioRisk();
      }
    } catch (err: any) {
      setPaperActionMsg({ type: 'error', text: err.message });
    } finally {
      setTimeout(() => setPaperActionMsg(null), 6000);
    }
  };

  const handleRunBacktest = async () => {
    setIsRunningBacktest(true);
    try {
      const res = await fetch('/api/stocks/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrategyId,
          initialCapital: backtestCapital,
          benchmarkTicker: backtestBenchmark,
          slippageBps: backtestSlippage,
          commissionPerShare: backtestCommission,
          maxPositions: backtestMaxPositions,
          stopLossPct: backtestStopLossPct,
          takeProfitPct: backtestTakeProfitPct,
          positionSizing: backtestPositionSizing,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBacktestResult(json.data);
        await fetchBacktestHistory();
      }
    } catch (err: any) {
      console.error('Error running backtest:', err);
    } finally {
      setIsRunningBacktest(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRankingData();
    fetchRedTeamUniverse();
    fetchTacticalUniverse();
    fetchCioUniverse();
    fetchPortfolioRisk();
    fetchPaperOrders();
    fetchBacktestStrategies();
    fetchBacktestHistory();
    fetchProviderStatus();
  }, []);

  // Phase 10: Real-Time Server-Sent Events (SSE) Listener
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/stocks/stream');

      es.addEventListener('connected', () => {
        setSseConnected(true);
      });

      es.addEventListener('market_tick', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.symbol && payload?.price) {
            setUniverse((prev) =>
              prev.map((s) => (s.ticker === payload.symbol ? { ...s, price: payload.price } : s))
            );
          }
        } catch {}
      });

      es.addEventListener('notification_alert', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          setSyncMsg(`🚨 [${payload.severity}] ${payload.title}: ${payload.message}`);
          setTimeout(() => setSyncMsg(null), 8000);
          fetchPortfolioRisk();
        } catch {}
      });

      es.onerror = () => {
        setSseConnected(false);
      };
    } catch {
      setSseConnected(false);
    }

    // Periodic SSE Stats Poller
    const statsTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/stocks/stream/stats');
        if (res.ok) {
          const json = await res.json();
          setSseStats(json.data);
        }
      } catch {}
    }, 20000);

    return () => {
      es?.close();
      clearInterval(statsTimer);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'portfolio') {
      fetchPortfolioRisk();
    } else if (activeTab === 'paper') {
      fetchPaperOrders();
      fetchPortfolioRisk();
      fetchBacktestStrategies();
      fetchBacktestHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedStock) {
      fetchStockDetails(selectedStock);
    }
  }, [selectedStock]);

  const toggleKillSwitch = async () => {
    const nextState = !killSwitchActive;
    try {
      const res = await fetch('/api/stocks/risk/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState, reason: 'Toggled via Global Equity Dashboard' }),
      });
      if (res.ok) {
        setKillSwitchActive(nextState);
      }
    } catch (e) {
      console.error('Kill switch toggle failed:', e);
    }
  };

  const handlePaperTrade = async (plan: TradePlan) => {
    try {
      const res = await fetch('/api/stocks/paper/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: plan.ticker,
          side: plan.direction === 'LONG' ? 'BUY' : 'SELL',
          quantity: Math.max(1, Math.round(10000 / plan.current_price)),
          price: plan.current_price,
          tradePlanId: plan.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaperOrderMsg(` บันทึก Paper Trade สำเร็จ: ${plan.ticker} ${plan.direction} @ $${plan.current_price}`);
      } else {
        setPaperOrderMsg(`❌ ปฏิเสธคำสั่ง: ${data.error}`);
      }
      setTimeout(() => setPaperOrderMsg(null), 5000);
    } catch (err: any) {
      setPaperOrderMsg(`❌ ส่งคำสั่งไม่สำเร็จ: ${err.message}`);
    }
  };

  // Filtered universe for Multi-Factor Screener
  const filteredStocks = universe.filter((s) => {
    const matchesSearch = s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || s.sector === selectedSector;
    const matchesPe = filterPe === 'ALL' || s.peRatio <= filterPe;
    const matchesRoe = filterRoe === 'ALL' || s.roe >= filterRoe;
    const matchesGrowth = filterGrowth === 'ALL' || s.revenueGrowthYoY >= filterGrowth;

    let matchesRsi = true;
    if (filterRsiState === 'OVERSOLD') matchesRsi = s.rsi14 < 35;
    else if (filterRsiState === 'OVERBOUGHT') matchesRsi = s.rsi14 > 70;
    else if (filterRsiState === 'NORMAL') matchesRsi = s.rsi14 >= 35 && s.rsi14 <= 70;

    let matchesTech = true;
    if (filterTechnicalSetup === 'GOLDEN_CROSS') matchesTech = s.ema50 > s.ema200;
    else if (filterTechnicalSetup === 'ABOVE_200EMA') matchesTech = s.price > s.ema200;
    else if (filterTechnicalSetup === 'NEAR_52W_HIGH') matchesTech = (s.high52w - s.price) / (s.high52w || 1) <= 0.08;

    return matchesSearch && matchesSector && matchesPe && matchesRoe && matchesGrowth && matchesRsi && matchesTech;
  });

  const sectors = ['ALL', ...Array.from(new Set(universe.map((s) => s.sector)))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40, color: '#f1f5f9' }}>
      
      {/* ========================================================================= */}
      {/* 1. Header Banner: Multi-Agent Investment Committee & Macro Regime */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  padding: '8px 12px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                }}
              >
                <Globe size={18} />
                <span>GLOBAL EQUITY INTELLIGENCE</span>
              </div>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Cpu size={14} /> 41 AGENTS ACTIVE
              </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                PHASE 10 COMPLETE (41 AGENTS, REAL-TIME SSE & MULTI-CHANNEL ALERTS)
              </span>
              <span
                style={{
                  background: providerStatus?.isMarketOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                  color: providerStatus?.isMarketOpen ? '#34d399' : '#f87171',
                  border: `1px solid ${providerStatus?.isMarketOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Clock size={13} />
                {providerStatus?.isMarketOpen ? 'NYSE/NASDAQ OPEN 🟢' : 'MARKET CLOSED (EST) 🔴'}
              </span>
              <span
                style={{
                  background: sseConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: sseConnected ? '#34d399' : '#facc15',
                  border: `1px solid ${sseConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Radio size={13} className={sseConnected ? 'animate-pulse' : ''} />
                {sseConnected ? 'LIVE SSE CONNECTED 🟢' : 'SSE RECONNECTING 🟡'}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 4px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              ระบบวิเคราะห์และคัดกรองหุ้นต่างประเทศ Multi-Agent AI
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, maxWidth: 850 }}>
              ระบบ Investment Committee จำลอง 4 ทีม (Stock Ranking, Equity Research, Red Team Veto, Tactical Allocation)
              ควบคุมด้วย AI-CIO, เครื่องมือคำนวณ Technical Indicators Matrix, รายงานงบการเงิน SEC Filings และ Deterministic Hard Risk Engine
            </p>
          </div>

          {/* Quick Macro & Risk Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 12,
              }}
            >
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>MARKET REGIME</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#10b981' }}>
                <TrendingUp size={15} /> RISK-ON BULLISH
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 12,
              }}
            >
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>LIVE VIX / 10Y / DXY</div>
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                {providerStatus
                  ? `${providerStatus.macroSummary.vix} / ${providerStatus.macroSummary.us10y} / ${providerStatus.macroSummary.dxy}`
                  : '15.01 / 4.28% / 103.85'}
              </div>
            </div>

            {/* Sync Live Prices Button */}
            <button
              onClick={handleSyncLivePrices}
              disabled={isSyncingLive}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: isSyncingLive ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              title="ดึงราคาตลาดสดจาก Yahoo Finance และอัปเดตตัวชี้วัดเทคนิคอลทันที"
            >
              <RefreshCw size={15} className={isSyncingLive ? 'animate-spin' : ''} />
              <span>{isSyncingLive ? 'SYNCING...' : 'SYNC LIVE PRICES'}</span>
            </button>

            {/* Kill Switch Toggle */}
            <button
              onClick={toggleKillSwitch}
              style={{
                background: killSwitchActive
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                  : 'rgba(30, 41, 59, 0.9)',
                color: killSwitchActive ? '#ffffff' : '#94a3b8',
                border: killSwitchActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <Shield size={16} color={killSwitchActive ? '#ffffff' : '#ef4444'} />
              <span>KILL SWITCH: {killSwitchActive ? 'ACTIVE' : 'READY'}</span>
            </button>
          </div>
        </div>

        {/* Sync Live Notification Banner */}
        {syncMsg && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} />
            <span>{syncMsg}</span>
          </div>
        )}

        {/* Paper Order Notification Banner */}
        {paperOrderMsg && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Info size={16} />
            <span>{paperOrderMsg}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16, flexWrap: 'wrap' }}>
          {[
            { id: 'opportunities', label: 'Top Opportunities & แผนซื้อขาย', icon: Target },
            { id: 'cio', label: 'AI-CIO Committee Chamber (มติ 41 Agents & ดีเบต)', icon: Scale },
            { id: 'portfolio', label: '🛡️ Portfolio & Risk Monitor (ความเสี่ยงพอร์ต & Circuit Breaker)', icon: ShieldAlert },
            { id: 'paper', label: '📊 Paper Trading & Backtest (พอร์ตจำลอง & Backtest)', icon: Play },
            { id: 'notifications', label: '🔔 แจ้งเตือน & Realtime SSE (Telegram / Discord)', icon: Bell },
            { id: 'ranking', label: 'AI Stock Ranking (Team 1 จัดอันดับหุ้น)', icon: Award },
            { id: 'research', label: 'Equity Research & DCF (Team 2 ปัจจัยพื้นฐาน)', icon: BarChart3 },
            { id: 'redteam', label: 'Red Team Adversarial & VETO (Team 3 ตรวจสอบความเสี่ยง)', icon: AlertTriangle },
            { id: 'tactical', label: 'Tactical Allocation & Execution (Team 4 กลยุทธ์เข้าทำกำไร)', icon: Zap },
            { id: 'screener', label: 'Multi-Factor Screener & หุ้นสหรัฐฯ', icon: SlidersHorizontal },
            { id: 'technical', label: 'Technical Indicators Matrix', icon: Activity },
            { id: 'filings', label: 'รายงานงบ SEC Filings (EDGAR)', icon: FileText },
            { id: 'agents', label: 'ทำเนียบ 41 AI Investment Agents', icon: Cpu },
            { id: 'risk', label: 'Hard Risk Engine & ข้อจำกัดความเสี่ยง', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: isActive ? '#3b82f6' : 'rgba(15, 23, 42, 0.6)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: isActive ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB: TOP OPPORTUNITIES & TRADE PLANS */}
      {/* ========================================================================= */}
      {activeTab === 'opportunities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 2fr', gap: 20 }}>
          {/* Left Column: Candidates List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="#eab308" />
              <span>หุ้นที่ผ่านเกณฑ์ Investment Committee</span>
            </div>

            {tradePlans.map((plan) => {
              const isSelected = selectedStock === plan.ticker;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedStock(plan.ticker)}
                  style={{
                    background: isSelected ? 'rgba(30, 58, 138, 0.4)' : 'rgba(15, 23, 42, 0.6)',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>{plan.ticker}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{plan.companyName}</span>
                    </div>
                    <span
                      style={{
                        background: plan.consensus_score >= 85 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: plan.consensus_score >= 85 ? '#10b981' : '#60a5fa',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      AI SCORE {plan.consensus_score}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12, margin: '10px 0' }}>
                    <div>
                      <div style={{ color: '#64748b' }}>ราคาปัจจุบัน</div>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>${plan.current_price}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>โซนเข้าซื้อ</div>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>${plan.entry_low} - ${plan.entry_high}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Stop Loss</div>
                      <div style={{ fontWeight: 700, color: '#f87171' }}>${plan.stop_loss}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 11 }}>
                    <span style={{ color: '#94a3b8' }}>R:R {plan.risk_reward}:1 | สัดส่วน {plan.position_size}%</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaperTrade(plan);
                      }}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Play size={12} /> Paper Trade
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Multi-Agent Deep Dive Report */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {isLoadingAnalysis ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                <div>กำลังดึงข้อมูลและรวบรวมมติจากคณะกรรมการ 41 Agents...</div>
              </div>
            ) : analysisData ? (
              <>
                {/* Stock Title & Verdict */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                        {analysisData.stock.ticker}
                      </h2>
                      <span style={{ fontSize: 16, color: '#94a3b8' }}>{analysisData.stock.name}</span>
                      <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        {analysisData.stock.exchange}
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                      {analysisData.stock.sector} • {analysisData.stock.industry}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#64748b', fontSize: 11 }}>CIO VERDICT</div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: analysisData.cioDecision.decision === 'APPROVE' ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {analysisData.cioDecision.finalRating} ({analysisData.cioDecision.decision})
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Teams Consensus Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {/* Team 1: Ranking */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 10, padding: 14, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      TEAM 1: RANKING
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8' }}>
                      {analysisData.team1Ranking.rankingScore}/100
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                      Quality {analysisData.team1Ranking.factorBreakdown.quality} | Growth {analysisData.team1Ranking.factorBreakdown.growth}
                    </div>
                  </div>

                  {/* Team 2: Research */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 10, padding: 14, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      TEAM 2: FAIR VALUE
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                      ${analysisData.team2Research.fairValue}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                      Upside +{(((analysisData.team2Research.fairValue - analysisData.stock.price) / analysisData.stock.price) * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Team 3: Red Team */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 10, padding: 14, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      TEAM 3: RED TEAM VETO
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: analysisData.team3RedTeam.vetoRecommendation ? '#ef4444' : '#10b981' }}>
                      {analysisData.team3RedTeam.vetoRecommendation ? 'VETO ACTIVE' : 'NO VETO (PASS)'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                      Risk: {analysisData.team3RedTeam.riskSeverity}
                    </div>
                  </div>

                  {/* Team 4: Tactical */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 10, padding: 14, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      TEAM 4: TACTICAL R:R
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#eab308' }}>
                      {analysisData.team4Tactical.riskRewardRatio}:1
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                      Size {analysisData.team4Tactical.recommendedPositionSizePct}% | {analysisData.team4Tactical.timeHorizon}
                    </div>
                  </div>
                </div>

                {/* AI-CIO Rationale */}
                <div style={{ background: 'rgba(15, 23, 42, 0.9)', borderRadius: 12, padding: 16, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    <UserCheck size={16} />
                    <span>มติสรุปจาก AI-CIO (Chief Investment Officer)</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                    {analysisData.cioDecision.rationale}
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                    <span><strong>ผู้สนับสนุน:</strong> {analysisData.cioDecision.proponents.join(', ')}</span>
                  </div>
                </div>

                {/* Thesis & Counter Arguments Accordion / Blocks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Bull Thesis */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: 14 }}>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                      Bull Thesis & Catalysts (Team 2)
                    </div>
                    <p style={{ fontSize: 12, color: '#cbd5e1', margin: '0 0 8px 0' }}>
                      {analysisData.team2Research.bullThesis}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#94a3b8' }}>
                      {analysisData.team2Research.catalysts.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Red Team Objections */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, padding: 14 }}>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                      Red Team Objections & Risks (Team 3)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1' }}>
                      {analysisData.team3RedTeam.objections.map((obj, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Execution Trade Plan Bar */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: 12, padding: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>แผนการส่งคำสั่ง (Deterministic Execution Plan)</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Time Horizon: {analysisData.tradePlan.time_horizon}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, textAlign: 'center', fontSize: 12 }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                      <div style={{ color: '#64748b' }}>Buy Zone</div>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>${analysisData.tradePlan.entry_low} - ${analysisData.tradePlan.entry_high}</div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                      <div style={{ color: '#64748b' }}>Stop Loss</div>
                      <div style={{ fontWeight: 700, color: '#f87171' }}>${analysisData.tradePlan.stop_loss}</div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                      <div style={{ color: '#64748b' }}>Take Profit 1</div>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>${analysisData.tradePlan.tp1}</div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                      <div style={{ color: '#64748b' }}>Take Profit 2</div>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>${analysisData.tradePlan.tp2}</div>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8 }}>
                      <div style={{ color: '#64748b' }}>Target 3 (Fair Value)</div>
                      <div style={{ fontWeight: 700, color: '#eab308' }}>${analysisData.tradePlan.tp3}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button
                      onClick={() => handlePaperTrade(analysisData.tradePlan)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 24px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <Play size={16} /> ยืนยันส่งคำสั่ง Paper Trade ({analysisData.stock.ticker})
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                เลือกหุ้นจากแถบด้านซ้ายเพื่อดูบทวิเคราะห์ Multi-Agent เชิงลึก
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5 TAB: TEAM 1 AI STOCK RANKING ENGINE (PHASE 2) */}
      {/* ========================================================================= */}
      {activeTab === 'ranking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Notification Banner */}
          {rankingMsg && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: rankingMsg.includes('❌') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: rankingMsg.includes('❌') ? '1px solid #ef4444' : '1px solid #10b981',
                color: rankingMsg.includes('❌') ? '#fca5a5' : '#6ee7b7',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Info size={16} />
              <span>{rankingMsg}</span>
            </div>
          )}

          {/* Top Overview Cards & Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {/* Top Pick Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                TOP RANKED PICK (#1)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#ffffff' }}>
                  {rankingResult?.summary.highestScoreTicker || 'NVDA'}
                </span>
                <span style={{ fontSize: 13, color: '#10b981', fontWeight: 700 }}>
                  SCORE {rankingResult?.summary.highestScore || 92}/100
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Tier 1 Strong Conviction จาก Team 1
              </div>
            </div>

            {/* Strong Buy Count */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#6ee7b7', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                STRONG BUY TIER (SCORE ≥ 82)
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>
                {rankingResult?.summary.strongBuyCount ?? 0} <span style={{ fontSize: 14, color: '#94a3b8' }}>หุ้น</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                ผ่านเกณฑ์คุณภาพและโมเมนตัมสูงสุด
              </div>
            </div>

            {/* Buy Tier Count */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                BUY TIER (SCORE 72 - 81)
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8' }}>
                {rankingResult?.summary.buyCount ?? 0} <span style={{ fontSize: 14, color: '#94a3b8' }}>หุ้น</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                หุ้นเติบโตคุณภาพสูงพร้อมสะสม
              </div>
            </div>

            {/* Run Meta Info */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                RUN IDENTIFIER & UNIVERSE
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>
                {rankingResult?.runId || 'RUN-T1-LATEST'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Cpu size={14} color="#38bdf8" /> 10 Agents / {rankingResult?.universeSize || 32} Equities
              </div>
            </div>
          </div>

          {/* Dynamic Factor Weights Control Panel */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <SlidersHorizontal size={18} color="#38bdf8" />
                  <span>ปรับแต่งค่าน้ำหนัก Factor (Dynamic Factor Weights - ปรับได้ตามกลยุทธ์)</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                  ค่าน้ำหนักจะถูก Normalize รวมเป็น 100% โดยอัตโนมัติ เพื่อให้คะแนนรวมสะท้อนกลยุทธ์ที่แม่นยำที่สุด
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={resetWeights}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  คืนค่าเริ่มต้น
                </button>
                <button
                  onClick={handleRunRanking}
                  disabled={isLoadingRanking}
                  style={{
                    background: isLoadingRanking ? '#475569' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isLoadingRanking ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <RefreshCw size={15} className={isLoadingRanking ? 'animate-spin' : ''} />
                  <span>{isLoadingRanking ? 'กำลังประมวลผล 10 Agents...' : 'ประมวลผลจัดอันดับใหม่ (Run Ranking)'}</span>
                </button>
              </div>
            </div>

            {/* Factor Weight Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { key: 'momentum', label: '1. Momentum (RS vs SPY)', val: factorWeights.momentum, color: '#38bdf8' },
                { key: 'trend', label: '2. Trend (Golden Cross)', val: factorWeights.trend, color: '#818cf8' },
                { key: 'quality', label: '3. Quality (ROE / F-Score)', val: factorWeights.quality, color: '#34d399' },
                { key: 'growth', label: '4. Growth (YoY Revenue)', val: factorWeights.growth, color: '#fbbf24' },
                { key: 'value', label: '5. Value (Forward P/E)', val: factorWeights.value, color: '#f87171' },
                { key: 'earningsRevision', label: '6. Earnings Beat Rate', val: factorWeights.earningsRevision, color: '#c084fc' },
                { key: 'catalyst', label: '7. News & Catalysts', val: factorWeights.catalyst, color: '#f472b6' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>
                      {Math.round(item.val * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={Math.round(item.val * 100)}
                    onChange={(e) => {
                      const newPct = parseInt(e.target.value) / 100;
                      setFactorWeights(prev => ({ ...prev, [item.key]: newPct }));
                    }}
                    style={{ width: '100%', accentColor: item.color, cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Candidates Leaderboard Table */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                <Award size={18} color="#eab308" />
                <span>ตารางจัดอันดับหุ้น Top Ranked Candidates (เรียงตามคะแนนสังเคราะห์ 10 Agents)</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                คลิกแถวเพื่อดูรายละเอียดคะแนน Factor Breakdown ของทั้ง 10 Agents
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '12px 16px', width: 60 }}>อันดับ</th>
                    <th style={{ padding: '12px 16px' }}>หุ้น / บริษัท</th>
                    <th style={{ padding: '12px 16px' }}>ราคา (1D%)</th>
                    <th style={{ padding: '12px 16px' }}>คะแนนรวม (Composite)</th>
                    <th style={{ padding: '12px 16px' }}>Conviction</th>
                    <th style={{ padding: '12px 16px' }}>คะแนน Factor หลัก</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>แอ็กชัน</th>
                  </tr>
                </thead>
                <tbody>
                  {(rankingResult?.topCandidates || []).map((cand) => {
                    const isExpanded = expandedCandidate === cand.ticker;
                    const isTop3 = cand.rank <= 3;
                    return (
                      <React.Fragment key={cand.ticker}>
                        <tr
                          onClick={() => setExpandedCandidate(isExpanded ? null : cand.ticker)}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: isExpanded
                              ? 'rgba(30, 58, 138, 0.25)'
                              : isTop3
                              ? 'rgba(16, 185, 129, 0.04)'
                              : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                        >
                          {/* Rank */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                fontSize: 12,
                                fontWeight: 800,
                                background: cand.rank === 1
                                  ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                                  : cand.rank === 2
                                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                                  : cand.rank === 3
                                  ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                                  : 'rgba(51, 65, 85, 0.6)',
                                color: '#ffffff',
                              }}
                            >
                              {cand.rank}
                            </span>
                          </td>

                          {/* Ticker & Name */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>
                              {cand.ticker}
                              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8, fontWeight: 500 }}>
                                {cand.sector}
                              </span>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 12 }}>{cand.name}</div>
                          </td>

                          {/* Price & Change */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>${cand.price.toFixed(2)}</div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: cand.changePercent >= 0 ? '#10b981' : '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              {cand.changePercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              <span>{cand.changePercent >= 0 ? '+' : ''}{cand.changePercent.toFixed(2)}%</span>
                            </div>
                          </td>

                          {/* Composite Score Bar */}
                          <td style={{ padding: '14px 16px', minWidth: 160 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: cand.totalScore >= 82 ? '#10b981' : cand.totalScore >= 72 ? '#38bdf8' : '#e2e8f0' }}>
                                {cand.totalScore}
                              </span>
                              <span style={{ color: '#64748b', fontSize: 11 }}>/ 100</span>
                            </div>
                            <div style={{ height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${cand.totalScore}%`,
                                  height: '100%',
                                  background: cand.totalScore >= 82
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : cand.totalScore >= 72
                                    ? 'linear-gradient(90deg, #38bdf8, #0284c7)'
                                    : 'linear-gradient(90deg, #eab308, #ca8a04)',
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                          </td>

                          {/* Conviction Badge */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                background: cand.conviction === 'STRONG_BUY'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : cand.conviction === 'BUY'
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : 'rgba(234, 179, 8, 0.2)',
                                color: cand.conviction === 'STRONG_BUY'
                                  ? '#10b981'
                                  : cand.conviction === 'BUY'
                                  ? '#38bdf8'
                                  : '#eab308',
                                border: cand.conviction === 'STRONG_BUY'
                                  ? '1px solid rgba(16, 185, 129, 0.4)'
                                  : cand.conviction === 'BUY'
                                  ? '1px solid rgba(56, 189, 248, 0.4)'
                                  : '1px solid rgba(234, 179, 8, 0.4)',
                                padding: '4px 10px',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {cand.conviction}
                            </span>
                          </td>

                          {/* Factor Micro Badges */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                                Mom: {cand.factorScores.momentum.score}
                              </span>
                              <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                                Qual: {cand.factorScores.quality.score}
                              </span>
                              <span style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                                Grow: {cand.factorScores.growth.score}
                              </span>
                              <span style={{ background: 'rgba(244, 114, 182, 0.1)', color: '#f472b6', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                                Cat: {cand.factorScores.catalyst.score}
                              </span>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStock(cand.ticker);
                                setActiveTab('opportunities');
                              }}
                              style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>วิเคราะห์ 41 Agents</span>
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Factor Detail Row */}
                        {isExpanded && (
                          <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <td colSpan={7} style={{ padding: '20px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Chairman Summary */}
                                <div
                                  style={{
                                    background: 'rgba(30, 58, 138, 0.3)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    fontSize: 13,
                                    color: '#e2e8f0',
                                  }}
                                >
                                  <strong style={{ color: '#60a5fa' }}>T1-10 Ranking Chairman Synthesis: </strong>
                                  {cand.chairmanSummary}
                                </div>

                                {/* Factor Breakdown Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                                  {Object.values(cand.factorScores).map((fac) => (
                                    <div
                                      key={fac.agentId}
                                      style={{
                                        background: 'rgba(30, 41, 59, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700 }}>
                                          {fac.agentId} • {fac.agentName}
                                        </span>
                                        <span
                                          style={{
                                            fontWeight: 800,
                                            fontSize: 12,
                                            color: fac.score >= 80 ? '#10b981' : fac.score >= 60 ? '#38bdf8' : '#eab308',
                                          }}
                                        >
                                          {fac.score}/100
                                        </span>
                                      </div>
                                      <div style={{ fontSize: 12, color: '#ffffff', fontWeight: 600 }}>
                                        {fac.metricLabel}: <span style={{ color: '#38bdf8' }}>{fac.metricValue}</span>
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                        {fac.notes}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Strengths and Risks Badges */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <CheckCircle2 size={14} /> จุดเด่นเชิงปัจจัย (Key Strengths)
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1' }}>
                                      {cand.topStrengths.map((st, i) => (
                                        <li key={i}>{st}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <AlertTriangle size={14} /> ปัจจัยเสี่ยงที่ต้องจับตา (Key Risks)
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1' }}>
                                      {cand.keyRisks.map((rk, i) => (
                                        <li key={i}>{rk}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.8 TAB: TEAM 2 EQUITY RESEARCH & 2-STAGE DCF VALUATION (PHASE 3) */}
      {/* ========================================================================= */}
      {activeTab === 'research' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stock Selector & Header Summary */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  เลือกหุ้นเพื่อวิเคราะห์ปัจจัยพื้นฐาน (EQUITY RESEARCH)
                </label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #3b82f6',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {universe.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.name} ({s.sector})
                    </option>
                  ))}
                </select>
              </div>

              {/* Research Score Pill */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>TEAM 2 RESEARCH SCORE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>
                  {researchReport?.overallResearchScore ?? 85}/100
                </div>
              </div>

              {/* Economic Moat Pill */}
              <div
                style={{
                  background: researchReport?.moat.rating === 'WIDE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: researchReport?.moat.rating === 'WIDE' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                }}
              >
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>ECONOMIC MOAT (คูเมืองธุรกิจ)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: researchReport?.moat.rating === 'WIDE' ? '#10b981' : '#38bdf8' }}>
                  {researchReport?.moat.rating ?? 'WIDE'} MOAT ({researchReport?.moat.score ?? 92}/100)
                </div>
              </div>

              {/* Conviction Pill */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>CONVICTION TIER</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#eab308' }}>
                  {researchReport?.researchConviction ?? 'HIGH'} CONVICTION
                </div>
              </div>
            </div>

            {/* Current Price vs DCF Base Fair Value */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                ราคาปัจจุบัน: <strong style={{ color: '#ffffff', fontSize: 14 }}>${researchReport?.currentPrice ?? 0}</strong>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                DCF Fair Value: ${researchReport?.valuation.fairValue ?? 0}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: (researchReport?.valuation.marginOfSafetyPct ?? 0) >= 0 ? '#10b981' : '#ef4444',
                }}
              >
                Margin of Safety: {(researchReport?.valuation.marginOfSafetyPct ?? 0) >= 0 ? '+' : ''}
                {researchReport?.valuation.marginOfSafetyPct ?? 0}%
              </div>
            </div>
          </div>

          {/* Research Notification Banner */}
          {researchMsg && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: researchMsg.includes('❌') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: researchMsg.includes('❌') ? '1px solid #ef4444' : '1px solid #10b981',
                color: researchMsg.includes('❌') ? '#fca5a5' : '#6ee7b7',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Info size={16} />
              <span>{researchMsg}</span>
            </div>
          )}

          {/* 3-Scenario Valuation Cards: Bear vs Base vs Bull */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Bear Case Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                borderRadius: 14,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#f87171', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>
                  🐻 BEAR CASE (ฉากทัศน์อนุรักษ์นิยม)
                </span>
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  FCF Growth {researchReport?.scenarios.bear.fcfGrowth ?? 10}%
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>
                ${researchReport?.scenarios.bear.targetPrice ?? 0}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', margin: '4px 0 10px 0' }}>
                {researchReport?.scenarios.bear.downsidePct ?? 0}% Downside Risk
              </div>
              <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 12 }}>
                {researchReport?.scenarios.bear.thesis}
              </p>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                <strong style={{ color: '#f87171' }}>ความเสี่ยงหลัก:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                  {researchReport?.scenarios.bear.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Base Case Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                borderRadius: 14,
                border: '1px solid rgba(59, 130, 246, 0.5)',
                padding: 20,
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>
                  🎯 BASE CASE (2-STAGE DCF FAIR VALUE)
                </span>
                <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#38bdf8', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  FCF Growth {researchReport?.scenarios.base.fcfGrowth ?? 20}%
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>
                ${researchReport?.scenarios.base.targetPrice ?? 0}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', margin: '4px 0 10px 0' }}>
                {(researchReport?.scenarios.base.upsidePct ?? 0) >= 0 ? '+' : ''}
                {researchReport?.scenarios.base.upsidePct ?? 0}% Consensus Target
              </div>
              <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 12 }}>
                {researchReport?.scenarios.base.thesis}
              </p>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                <strong style={{ color: '#60a5fa' }}>ปัจจัยขับเคลื่อน:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                  {researchReport?.scenarios.base.catalysts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bull Case Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                borderRadius: 14,
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#34d399', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>
                  🚀 BULL CASE (ฉากทัศน์เติบโตสูงสุด)
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  FCF Growth {researchReport?.scenarios.bull.fcfGrowth ?? 26}%
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>
                ${researchReport?.scenarios.bull.targetPrice ?? 0}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', margin: '4px 0 10px 0' }}>
                +{(researchReport?.scenarios.bull.upsidePct ?? 0)}% High-Alpha Upside
              </div>
              <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 12 }}>
                {researchReport?.scenarios.bull.thesis}
              </p>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                <strong style={{ color: '#34d399' }}>ตัวเร่งการเติบโต:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                  {researchReport?.scenarios.bull.catalysts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive 2-Stage DCF Simulator Panel */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <BarChart3 size={18} color="#10b981" />
                  <span>แบบจำลอง 2-Stage DCF Simulator (ทดสอบความอ่อนไหว Sensitivity Analysis)</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                  ปรับเปลี่ยนสมมติฐานต้นทุนเงินทุน (WACC) และอัตราเติบโตของกระแสเงินสด เพื่อดูผลต่อมูลค่าที่แท้จริงแบบ Real-Time
                </div>
              </div>

              <button
                onClick={handleRecalculateDCF}
                disabled={isLoadingResearch}
                style={{
                  background: isLoadingResearch ? '#475569' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isLoadingResearch ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <RefreshCw size={15} className={isLoadingResearch ? 'animate-spin' : ''} />
                <span>{isLoadingResearch ? 'กำลังคำนวณ DCF...' : 'คำนวณ DCF ใหม่ทันที'}</span>
              </button>
            </div>

            {/* Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {/* WACC Slider */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>WACC (ต้นทุนเงินทุนเฉลี่ย)</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{dcfWacc.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="14.0"
                  step="0.2"
                  value={dcfWacc}
                  onChange={(e) => setDcfWacc(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>ยิ่ง WACC สูง มูลค่าปัจจุบันยิ่งลดลง</div>
              </div>

              {/* Stage 1 FCF Growth Slider */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Stage 1 Growth (FCF 5Y CAGR)</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{dcfGrowthStage1.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="45.0"
                  step="1.0"
                  value={dcfGrowthStage1}
                  onChange={(e) => setDcfGrowthStage1(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>ประมาณการเติบโตของ FCF ในช่วง 5 ปีแรก</div>
              </div>

              {/* Terminal Growth Rate Slider */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Terminal Growth (อัตราเติบโตระยะยาว)</span>
                  <span style={{ color: '#eab308', fontWeight: 700 }}>{dcfTerminalGrowth.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.5"
                  step="0.1"
                  value={dcfTerminalGrowth}
                  onChange={(e) => setDcfTerminalGrowth(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#eab308', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>สอดคล้องกับ GDP Growth ระยะยาวของโลก</div>
              </div>

              {/* Reverse DCF Box */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>REVERSE DCF (IMPLIED GROWTH)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#a855f7' }}>
                  {researchReport?.valuation.impliedMarketGrowthRate ?? 0}%
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>อัตราเติบโตที่ราคาตลาดปัจจุบันกำลังคาดหวัง</div>
              </div>
            </div>

            {/* 5-Year Projected FCF Timeline */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
                ประมาณการกระแสเงินสดอิสระ 5 ปี (5-Year Projected Free Cash Flow Stream)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {(researchReport?.valuation.projectedFCF || []).map((proj) => (
                  <div
                    key={proj.year}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>YEAR {proj.year}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                      ${(proj.fcf / 1e9).toFixed(2)}B
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      PV: ${(proj.presentValue / 1e9).toFixed(2)}B
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 10 Research Agent Theses Grid */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
              <Cpu size={18} color="#38bdf8" />
              <span>ผลการวิเคราะห์เจาะลึก 10 AI Equity Research Agents (Team 2 Theses)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {researchReport &&
                Object.values(researchReport.agentTheses).map((thesis) => (
                  <div
                    key={thesis.agentId}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                        {thesis.agentId} • {thesis.agentName}
                      </span>
                      <span
                        style={{
                          background: thesis.score >= 85 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                          color: thesis.score >= 85 ? '#10b981' : '#38bdf8',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {thesis.score}/100
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                      {thesis.keyMetric}: <strong style={{ color: '#ffffff' }}>{thesis.metricValue}</strong>
                    </div>

                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      {thesis.thesis}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#64748b' }}>
                        {thesis.evidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.9 TAB: TEAM 3 RED TEAM ADVERSARIAL AUDIT & BINDING VETO (PHASE 4) */}
      {/* ========================================================================= */}
      {activeTab === 'redteam' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stock Selector, Status Banner & Veto Controls */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: redTeamAudit?.vetoTriggered
                ? '1px solid #ef4444'
                : '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
              boxShadow: redTeamAudit?.vetoTriggered
                ? '0 0 25px rgba(239, 68, 68, 0.25)'
                : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  เลือกหุ้นเพื่อทำการตรวจสอบเชิงปรปักษ์ (RED TEAM AUDIT)
                </label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #ef4444',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {universe.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.name} ({s.sector})
                    </option>
                  ))}
                </select>
              </div>

              {/* Threat Level Badge */}
              <div
                style={{
                  background:
                    redTeamAudit?.overallThreatLevel === 'CRITICAL'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : redTeamAudit?.overallThreatLevel === 'HIGH'
                      ? 'rgba(249, 115, 22, 0.2)'
                      : redTeamAudit?.overallThreatLevel === 'MEDIUM'
                      ? 'rgba(234, 179, 8, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  border:
                    redTeamAudit?.overallThreatLevel === 'CRITICAL'
                      ? '1px solid #ef4444'
                      : redTeamAudit?.overallThreatLevel === 'HIGH'
                      ? '1px solid #f97316'
                      : redTeamAudit?.overallThreatLevel === 'MEDIUM'
                      ? '1px solid #eab308'
                      : '1px solid #10b981',
                  padding: '8px 16px',
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>OVERALL THREAT LEVEL</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color:
                      redTeamAudit?.overallThreatLevel === 'CRITICAL'
                        ? '#ef4444'
                        : redTeamAudit?.overallThreatLevel === 'HIGH'
                        ? '#f97316'
                        : redTeamAudit?.overallThreatLevel === 'MEDIUM'
                        ? '#eab308'
                        : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{redTeamAudit?.overallThreatLevel ?? 'LOW'} THREAT</span>
                </div>
              </div>

              {/* Composite Threat Score */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>COMPOSITE THREAT SCORE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (redTeamAudit?.threatScore ?? 0) >= 65 ? '#ef4444' : '#38bdf8' }}>
                  {redTeamAudit?.threatScore ?? 0}/100
                </div>
              </div>

              {/* Red Flags Count */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>CRITICAL RED FLAGS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (redTeamAudit?.redFlagsCount ?? 0) > 0 ? '#ef4444' : '#10b981' }}>
                  {redTeamAudit?.redFlagsCount ?? 0} DETECTED
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleAuditStock(selectedStock, false)}
                disabled={isLoadingRedTeam}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  border: '1px solid #3b82f6',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isLoadingRedTeam ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={15} className={isLoadingRedTeam ? 'animate-spin' : ''} />
                <span>ตรวจสอบซ้ำ (Re-Audit)</span>
              </button>

              <button
                onClick={() => handleAuditStock(selectedStock, true)}
                disabled={isLoadingRedTeam}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                  color: '#ffffff',
                  border: '1px solid #f87171',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isLoadingRedTeam ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                }}
              >
                <Shield size={15} />
                <span>จำลองสิทธิ์ VETO ฉุกเฉิน (Test VETO)</span>
              </button>
            </div>
          </div>

          {/* VETO / Cleared Status Banner */}
          {redTeamAudit?.vetoTriggered ? (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
                border: '2px solid #ef4444',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              }}
            >
              <div style={{ background: '#ef4444', borderRadius: '50%', padding: 8, display: 'flex' }}>
                <Lock size={22} color="#ffffff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fca5a5' }}>
                  🚨 BINDING RED TEAM VETO EXECUTED (ระงับการเข้าซื้อเด็ดขาดตามกฎ HARD RISK)
                </div>
                <div style={{ fontSize: 13, color: '#ffffff', marginTop: 4 }}>
                  {redTeamAudit.vetoReason || 'คำสั่งซื้อขายถูกบล็อกโดยอัตโนมัติ เนื่องจากตรวจพบความเสี่ยงระดับวิกฤต'}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{ background: '#10b981', borderRadius: '50%', padding: 8, display: 'flex' }}>
                <CheckCircle2 size={20} color="#ffffff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                  ✅ ADVERSARIAL STRESS TEST CLEARED (ผ่านการตรวจสอบของฝ่ายค้าน)
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {redTeamAudit?.chairmanSynthesis || 'ไม่พบสัญญาณบ่งชี้ความเสี่ยงวิกฤต Red Team อนุมัติผ่านเกณฑ์'}
                </div>
              </div>
            </div>
          )}

          {/* Red Team Notification Message */}
          {redTeamMsg && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid #3b82f6',
                color: '#93c5fd',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Info size={16} />
              <span>{redTeamMsg}</span>
            </div>
          )}

          {/* 3 Main Forensic & Vulnerability Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
            {/* Card 1: Forensic Accounting & Beneish M-Score */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 14,
                border: redTeamAudit?.beneishMScore.isManipulatorRisk
                  ? '1px solid #ef4444'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  <Scale size={18} color="#f59e0b" />
                  <span>Forensic Accounting (Beneish M-Score)</span>
                </div>
                <span
                  style={{
                    background: redTeamAudit?.beneishMScore.isManipulatorRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: redTeamAudit?.beneishMScore.isManipulatorRisk ? '#ef4444' : '#10b981',
                    border: redTeamAudit?.beneishMScore.isManipulatorRisk ? '1px solid #ef4444' : '1px solid #10b981',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {redTeamAudit?.beneishMScore.isManipulatorRisk ? 'MANIPULATION RISK' : 'SAFE ZONE'}
                </span>
              </div>

              {/* M-Score Value Gauge */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>8-VARIABLE BENEISH M-SCORE (THRESHOLD: &gt; -1.78)</div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    margin: '6px 0',
                    color: redTeamAudit?.beneishMScore.isManipulatorRisk ? '#ef4444' : '#10b981',
                  }}
                >
                  M = {redTeamAudit?.beneishMScore.mScore ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                  {redTeamAudit?.beneishMScore.interpretation}
                </div>
              </div>

              {/* 8 Variable Sub-indices */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'DSRI (ลูกหนี้)', val: redTeamAudit?.beneishMScore.dsri, desc: 'Days Sales in Receivables' },
                  { label: 'GMI (กำไรขั้นต้น)', val: redTeamAudit?.beneishMScore.gmi, desc: 'Gross Margin Index' },
                  { label: 'AQI (คุณภาพสินทรัพย์)', val: redTeamAudit?.beneishMScore.aqi, desc: 'Asset Quality Index' },
                  { label: 'SGI (ยอดขาย)', val: redTeamAudit?.beneishMScore.sgi, desc: 'Sales Growth Index' },
                  { label: 'DEPI (ค่าเสื่อม)', val: redTeamAudit?.beneishMScore.depi, desc: 'Depreciation Index' },
                  { label: 'SGAI (SG&A)', val: redTeamAudit?.beneishMScore.sgai, desc: 'SG&A Expenses Index' },
                  { label: 'LVGI (หนี้สิน)', val: redTeamAudit?.beneishMScore.lvgi, desc: 'Leverage Index' },
                  { label: 'TATA (Accruals)', val: redTeamAudit?.beneishMScore.tata, desc: 'Total Accruals to Assets' },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>{item.val ?? 0}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Crowded Trade & Sentiment Heat */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  <Activity size={18} color="#38bdf8" />
                  <span>Crowded Trade & Sentiment Heat (T3-08)</span>
                </div>
                <span
                  style={{
                    background: (redTeamAudit?.crowdedTrade.crowdedScore ?? 0) > 75 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: (redTeamAudit?.crowdedTrade.crowdedScore ?? 0) > 75 ? '#ef4444' : '#38bdf8',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  SQUEEZE RISK: {redTeamAudit?.crowdedTrade.squeezeRisk ?? 'LOW'}
                </span>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>CROWDED POSITIONING METER</div>
                <div style={{ fontSize: 26, fontWeight: 900, margin: '6px 0', color: (redTeamAudit?.crowdedTrade.crowdedScore ?? 0) > 75 ? '#ef4444' : '#38bdf8' }}>
                  {redTeamAudit?.crowdedTrade.crowdedScore ?? 0}/100
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                  {(redTeamAudit?.crowdedTrade.crowdedScore ?? 0) > 75
                    ? 'สถาบันและรายย่อยถือครองหนาแน่น เสี่ยงต่อ Liquidity Cascade'
                    : 'การถือครองอยู่ในเกณฑ์สมดุล ไม่มีความเสี่ยงเรื่องภาวะฟองสบู่'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 8px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Short Interest %</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                    {redTeamAudit?.crowdedTrade.shortInterestPct ?? 0}%
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 8px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Days to Cover</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                    {redTeamAudit?.crowdedTrade.daysToCover ?? 0} วัน
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 8px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Retail FOMO</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: (redTeamAudit?.crowdedTrade.retailEuphoriaScore ?? 0) > 80 ? '#ef4444' : '#eab308', marginTop: 4 }}>
                    {redTeamAudit?.crowdedTrade.retailEuphoriaScore ?? 0}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Technical Breakdown & Distribution Days */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  <TrendingDown size={18} color="#ef4444" />
                  <span>Technical Breakdown Check (T3-05)</span>
                </div>
                <span
                  style={{
                    background: redTeamAudit?.technicalBreakdown.supportBreakRisk === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: redTeamAudit?.technicalBreakdown.supportBreakRisk === 'HIGH' ? '#ef4444' : '#10b981',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  SUPPORT BREAK: {redTeamAudit?.technicalBreakdown.supportBreakRisk ?? 'LOW'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Distribution Days (20D)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                    {redTeamAudit?.technicalBreakdown.distributionDays ?? 0} วันทำการ
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>
                    {(redTeamAudit?.technicalBreakdown.distributionDays ?? 0) >= 4 ? 'แรงขายจากสถาบันหนาแน่น' : 'ระดับปกติ'}
                  </div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Death Cross Status</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: redTeamAudit?.technicalBreakdown.deathCrossActive ? '#ef4444' : '#10b981',
                      margin: '4px 0',
                    }}
                  >
                    {redTeamAudit?.technicalBreakdown.deathCrossActive ? '🚨 ACTIVE' : '✅ NONE'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>50 EMA ตัดลง 200 EMA</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>ต่ำกว่าเส้น 50 EMA:</span>
                  <span style={{ fontWeight: 700, color: redTeamAudit?.technicalBreakdown.below50Ema ? '#ef4444' : '#10b981' }}>
                    {redTeamAudit?.technicalBreakdown.below50Ema ? '🚨 ใช่ (หลุดแนวรับย่อย)' : '✅ ไม่หลุด (เหนือเส้น 50)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                  <span style={{ color: '#94a3b8' }}>ต่ำกว่าเส้น 200 EMA:</span>
                  <span style={{ fontWeight: 700, color: redTeamAudit?.technicalBreakdown.below200Ema ? '#ef4444' : '#10b981' }}>
                    {redTeamAudit?.technicalBreakdown.below200Ema ? '🚨 ใช่ (แนวโน้มขาลงใหญ่)' : '✅ ไม่หลุด (เหนือเส้น 200)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 10 Red Team Agents Reports Grid */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
              <Shield size={18} color="#ef4444" />
              <span>ผลการคัดค้านเชิงลึก 10 AI Red Team Agents (Team 3 Adversarial Reports)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {redTeamAudit &&
                Object.values(redTeamAudit.agentReports).map((agent) => (
                  <div
                    key={agent.agentId}
                    style={{
                      background: agent.isRedFlag ? 'rgba(239, 68, 68, 0.08)' : 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 10,
                      border: agent.isRedFlag ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: agent.isRedFlag ? '#ef4444' : '#38bdf8' }}>
                        {agent.agentId} • {agent.agentName}
                      </span>
                      <span
                        style={{
                          background:
                            agent.riskSeverity === 'CRITICAL'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : agent.riskSeverity === 'HIGH'
                              ? 'rgba(249, 115, 22, 0.3)'
                              : 'rgba(51, 65, 85, 0.6)',
                          color:
                            agent.riskSeverity === 'CRITICAL'
                              ? '#ef4444'
                              : agent.riskSeverity === 'HIGH'
                              ? '#f97316'
                              : '#94a3b8',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {agent.riskSeverity} ({agent.score}/100)
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                      มิติความเสี่ยง: <span style={{ color: '#cbd5e1' }}>{agent.threatDimension}</span>
                    </div>

                    <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>
                      {agent.stressTestMetric}: <strong style={{ color: '#ffffff' }}>{agent.metricValue}</strong>
                    </div>

                    <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                      {agent.objection}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>หลักฐานคัดค้าน (Counter Evidence):</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#64748b' }}>
                        {agent.counterEvidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Universe Red Team Radar Summary Table */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                <Target size={18} color="#eab308" />
                <span>Universe Red Team Threat Radar (ภาพรวมความเสี่ยงหุ้นสหรัฐฯ ทั้งหมด {redTeamUniverse.length} ตัว)</span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                คลิกที่แถวเพื่อเปลี่ยนไปดูการเจาะลึกหุ้นตัวนั้น
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: 11 }}>
                    <th style={{ padding: '10px 14px' }}>TICKER / NAME</th>
                    <th style={{ padding: '10px 14px' }}>THREAT LEVEL</th>
                    <th style={{ padding: '10px 14px' }}>THREAT SCORE</th>
                    <th style={{ padding: '10px 14px' }}>BENEISH M-SCORE</th>
                    <th style={{ padding: '10px 14px' }}>RED FLAGS</th>
                    <th style={{ padding: '10px 14px' }}>VETO STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {redTeamUniverse.map((item) => {
                    const isSelected = selectedStock === item.ticker;
                    return (
                      <tr
                        key={item.ticker}
                        onClick={() => setSelectedStock(item.ticker)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected
                            ? 'rgba(30, 58, 138, 0.4)'
                            : item.vetoTriggered
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: '#ffffff' }}>{item.ticker}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{item.companyName}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background:
                                item.overallThreatLevel === 'CRITICAL'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : item.overallThreatLevel === 'HIGH'
                                  ? 'rgba(249, 115, 22, 0.2)'
                                  : 'rgba(16, 185, 129, 0.2)',
                              color:
                                item.overallThreatLevel === 'CRITICAL'
                                  ? '#ef4444'
                                  : item.overallThreatLevel === 'HIGH'
                                  ? '#f97316'
                                  : '#10b981',
                            }}
                          >
                            {item.overallThreatLevel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: item.threatScore >= 65 ? '#ef4444' : '#38bdf8' }}>
                          {item.threatScore}/100
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: item.beneishMScore.isManipulatorRisk ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                            {item.beneishMScore.mScore}
                          </span>
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                            ({item.beneishMScore.isManipulatorRisk ? 'ALERT' : 'SAFE'})
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: item.redFlagsCount > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                            {item.redFlagsCount}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.vetoTriggered ? (
                            <span style={{ background: '#ef4444', color: '#ffffff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              🚨 VETO ACTIVE
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                              ✅ CLEARED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.10 TAB: TEAM 4 TACTICAL ASSET ALLOCATION & EXECUTION STRATEGY (PHASE 5) */}
      {/* ========================================================================= */}
      {activeTab === 'tactical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stock Selector, Execution Action Bar & Approval Status */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: tacticalPlan?.isTradeApproved
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(239, 68, 68, 0.4)',
              padding: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  เลือกหุ้นเพื่อวางแผน Tactical Trade Plan
                </label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #10b981',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {universe.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.name} ({s.sector})
                    </option>
                  ))}
                </select>
              </div>

              {/* Setup Type Badge */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>SETUP TYPE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} />
                  <span>{tacticalPlan?.setupType ?? 'MOMENTUM_EXPANSION'}</span>
                </div>
              </div>

              {/* Approval Status Badge */}
              <div
                style={{
                  background: tacticalPlan?.isTradeApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: tacticalPlan?.isTradeApproved ? '1px solid #10b981' : '1px solid #ef4444',
                  padding: '8px 16px',
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>TACTICAL STATUS</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: tacticalPlan?.isTradeApproved ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tacticalPlan?.isTradeApproved ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{tacticalPlan?.isTradeApproved ? 'APPROVED TO TRADE' : 'REJECTED / ON HOLD'}</span>
                </div>
              </div>

              {/* Risk/Reward Badge */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>RISK / REWARD RATIO</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (tacticalPlan?.riskRewardRatio ?? 0) >= 2.0 ? '#10b981' : '#ef4444' }}>
                  {tacticalPlan?.riskRewardRatio ?? 2.0}:1
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => tacticalPlan && handleExecutePaperTradeFromPlan(tacticalPlan)}
                disabled={!tacticalPlan?.isTradeApproved}
                style={{
                  background: tacticalPlan?.isTradeApproved
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(51, 65, 85, 0.5)',
                  color: tacticalPlan?.isTradeApproved ? '#ffffff' : '#94a3b8',
                  border: tacticalPlan?.isTradeApproved ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: tacticalPlan?.isTradeApproved ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: tacticalPlan?.isTradeApproved ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Play size={16} fill={tacticalPlan?.isTradeApproved ? '#ffffff' : '#94a3b8'} />
                <span>ส่งคำสั่ง Paper Trade ตามแผน Tactical Plan</span>
              </button>
            </div>
          </div>

          {/* Tactical Status Message Banner */}
          {tacticalPlan?.approvalStatusSummary && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: tacticalPlan.isTradeApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                border: tacticalPlan.isTradeApproved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #ef4444',
                color: tacticalPlan.isTradeApproved ? '#6ee7b7' : '#fca5a5',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {tacticalPlan.isTradeApproved ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{tacticalPlan.approvalStatusSummary}</span>
            </div>
          )}

          {/* Notification Msg */}
          {tacticalMsg && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid #3b82f6',
                color: '#93c5fd',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Info size={16} />
              <span>{tacticalMsg}</span>
            </div>
          )}

          {/* Top 2 Main Panels: Kelly Criterion Simulator + Visual Price Ladder */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(360px, 1fr)', gap: 16 }}>
            {/* Panel 1: Kelly Criterion Position Sizing Simulator */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <Scale size={18} color="#10b981" />
                  <span>Kelly Criterion Position Sizing Model (T4-02)</span>
                </div>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  HARD CAP: MAX 10%
                </span>
              </div>

              {/* Simulator Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    เงินทุนพอร์ต ($USD)
                  </label>
                  <input
                    type="number"
                    value={customEquity}
                    onChange={(e) => setCustomEquity(parseFloat(e.target.value) || 10000)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    โอกาสชนะ Win Rate (%)
                  </label>
                  <input
                    type="number"
                    value={customWinProb}
                    min={35}
                    max={85}
                    onChange={(e) => setCustomWinProb(parseFloat(e.target.value) || 50)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: 8 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Payout Ratio (Win/Loss)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customPayoutRatio}
                    min={1.2}
                    max={5.0}
                    onChange={(e) => setCustomPayoutRatio(parseFloat(e.target.value) || 2.0)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* Kelly Metrics Output Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Raw Full-Kelly (f*)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                    {tacticalPlan?.positionSizing.fullKellyFraction
                      ? `${(tacticalPlan.positionSizing.fullKellyFraction * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>ทฤษฎี Kelly ดั้งเดิม</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Conservative Half-Kelly</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa', marginTop: 4 }}>
                    {tacticalPlan?.positionSizing.halfKellyFraction
                      ? `${(tacticalPlan.positionSizing.halfKellyFraction * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>ลดความเสี่ยง Gambler's Ruin</div>
                </div>

                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 10,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 600 }}>แนะนำลงทุนจริง (Capped)</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 2 }}>
                    {tacticalPlan?.positionSizing.recommendedSizePct ?? 10}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                    ${tacticalPlan?.positionSizing.riskAdjustedCapitalUsd?.toLocaleString() ?? 0}
                  </div>
                </div>
              </div>

              {/* Rationale & Action */}
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, background: 'rgba(15, 23, 42, 0.4)', padding: '10px 14px', borderRadius: 8 }}>
                {tacticalPlan?.positionSizing.rationale}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleRecalculateTacticalPlan()}
                  disabled={isLoadingTactical}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    border: '1px solid #3b82f6',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={14} className={isLoadingTactical ? 'animate-spin' : ''} />
                  <span>คำนวณสัดส่วนใหม่ (Recalculate Sizing)</span>
                </button>
              </div>
            </div>

            {/* Panel 2: Visual Price Ladder (ATR Stops & Multi-Tier TP Targets) */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <Target size={18} color="#eab308" />
                  <span>Visual Dynamic Price Ladder (ATR Stops & Targets)</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Risk (1R) = <strong style={{ color: '#ffffff' }}>${tacticalPlan?.riskUnitR ?? 0}</strong>/หุ้น
                </span>
              </div>

              {/* Ladder Visualizer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {/* Step 5: TP3 */}
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 6px', borderRadius: 4 }}>
                      TP3 (RUNNER / 4.8R)
                    </span>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      ถือหุ้น 34% ที่เหลือ รันเทรนด์ด้วย Trailing Stop (EMA 20)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                      ${tacticalPlan?.takeProfit3 ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#6ee7b7' }}>
                      +{tacticalPlan?.entryPrice ? (((tacticalPlan.takeProfit3 - tacticalPlan.entryPrice) / tacticalPlan.entryPrice) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                {/* Step 4: TP2 */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.2)', padding: '2px 6px', borderRadius: 4 }}>
                      TP2 (TARGET / 3.2R)
                    </span>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      แบ่งขายทำกำไรอีก 33% เพื่อล็อคกำไรก้อนใหญ่
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>
                      ${tacticalPlan?.takeProfit2 ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#7dd3fc' }}>
                      +{tacticalPlan?.entryPrice ? (((tacticalPlan.takeProfit2 - tacticalPlan.entryPrice) / tacticalPlan.entryPrice) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                {/* Step 3: TP1 */}
                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#eab308', background: 'rgba(234, 179, 8, 0.2)', padding: '2px 6px', borderRadius: 4 }}>
                      TP1 (FIRST SCALE / 2.0R)
                    </span>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      ขาย 33% และเลื่อน Stop Loss มาที่ Breakeven ทันที (Risk-Free Trade)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#eab308' }}>
                      ${tacticalPlan?.takeProfit1 ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#fde047' }}>
                      +{tacticalPlan?.entryPrice ? (((tacticalPlan.takeProfit1 - tacticalPlan.entryPrice) / tacticalPlan.entryPrice) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                {/* Step 2: Entry Level */}
                <div style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid #3b82f6', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', background: '#3b82f6', padding: '2px 6px', borderRadius: 4 }}>
                      ENTRY LEVEL
                    </span>
                    <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>
                      กรอบราคาเข้าซื้อ: ${tacticalPlan?.entryZone.low} - ${tacticalPlan?.entryZone.high}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>
                      ${tacticalPlan?.entryPrice ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>ราคาปัจจุบัน</div>
                  </div>
                </div>

                {/* Step 1: Invalidation Stop Loss */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 6px', borderRadius: 4 }}>
                      HARD STOP LOSS (1.5x ATR)
                    </span>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      ตัดขาดทุนเด็ดขาดหากปิดหลุดระดับ Invalidation
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>
                      ${tacticalPlan?.stopLoss ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#f87171' }}>
                      -{tacticalPlan?.stopLossDistancePct ?? 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Strategy Enhancers: Options Overlay, Hedging, Smart Execution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {/* Options Overlay */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 18, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
                <Zap size={16} color="#eab308" />
                <span>Options Overlay Strategy (T4-05)</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#eab308', marginBottom: 6 }}>
                กลยุทธ์: {tacticalPlan?.optionsOverlay.recommendedStrategy}
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                ขาย Covered Call Strike ${tacticalPlan?.optionsOverlay.callStrike} (35 DTE) เพื่อเพิ่มผลตอบแทนกระแสเงินสด {tacticalPlan?.optionsOverlay.hedgeEfficiency}
              </div>
            </div>

            {/* Hedging Strategy */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 18, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
                <Shield size={16} color="#38bdf8" />
                <span>Hedging & Correlation (T4-06)</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
                Beta: {tacticalPlan?.hedgingStrategy.portfolioBeta}x vs SPY (Correlation: {tacticalPlan?.hedgingStrategy.correlationToSpy})
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                เครื่องมือป้องกันความเสี่ยง: {tacticalPlan?.hedgingStrategy.hedgeInstrument} (สัดส่วน Hedge: {tacticalPlan?.hedgingStrategy.hedgeRatioPct}%)
              </div>
            </div>

            {/* Execution Strategy */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 18, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
                <Activity size={16} color="#10b981" />
                <span>Execution Tactics & Slippage (T4-07 & T4-08)</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>
                Order Type: {tacticalPlan?.executionTactics.orderType} (TWAP 30m)
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                Estimated Slippage: {tacticalPlan?.executionTactics.estimatedSlippageBps} bps | Spread: {tacticalPlan?.executionTactics.currentSpreadPct}% (Max: {tacticalPlan?.executionTactics.maxAllowableSpreadPct}%)
              </div>
            </div>
          </div>

          {/* 10 Tactical Agents Full Output Grid */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
              <Cpu size={18} color="#10b981" />
              <span>ผลการวิเคราะห์เจาะลึก 10 AI Tactical Agents (Team 4 Execution Breakdown)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {tacticalPlan &&
                Object.values(tacticalPlan.agentReports).map((agent) => (
                  <div
                    key={agent.agentId}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                        {agent.agentId} • {agent.agentName}
                      </span>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {agent.tacticDomain}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                      {agent.keyMetricLabel}: <strong style={{ color: '#ffffff' }}>{agent.keyMetricValue}</strong>
                    </div>

                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      {agent.actionableDecision}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#64748b' }}>
                        {agent.guidance.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Universe Tactical Radar Summary Table */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                <Target size={18} color="#10b981" />
                <span>Universe Tactical Radar (แผนซื้อขายหุ้นสหรัฐฯ ทั้งหมด {tacticalUniverse.length} ตัว)</span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                คลิกที่แถวเพื่อเปลี่ยนไปดูและส่งคำสั่งซื้อขายหุ้นตัวนั้น
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: 11 }}>
                    <th style={{ padding: '10px 14px' }}>TICKER / NAME</th>
                    <th style={{ padding: '10px 14px' }}>SETUP TYPE</th>
                    <th style={{ padding: '10px 14px' }}>ENTRY PRICE</th>
                    <th style={{ padding: '10px 14px' }}>STOP LOSS (1.5x ATR)</th>
                    <th style={{ padding: '10px 14px' }}>TAKE PROFIT 1</th>
                    <th style={{ padding: '10px 14px' }}>KELLY SIZE %</th>
                    <th style={{ padding: '10px 14px' }}>R/R RATIO</th>
                    <th style={{ padding: '10px 14px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tacticalUniverse.map((item) => {
                    const isSelected = selectedStock === item.ticker;
                    return (
                      <tr
                        key={item.ticker}
                        onClick={() => setSelectedStock(item.ticker)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected
                            ? 'rgba(30, 58, 138, 0.4)'
                            : !item.isTradeApproved
                            ? 'rgba(239, 68, 68, 0.05)'
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: '#ffffff' }}>{item.ticker}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{item.companyName}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                            {item.setupType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#ffffff' }}>
                          ${item.entryPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#ef4444', fontWeight: 700 }}>
                          ${item.stopLoss.toFixed(2)} (-{item.stopLossDistancePct}%)
                        </td>
                        <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 700 }}>
                          ${item.takeProfit1.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#a78bfa' }}>
                          {item.positionSizing.recommendedSizePct}%
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: item.riskRewardRatio >= 2.0 ? '#10b981' : '#ef4444' }}>
                          {item.riskRewardRatio}:1
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.isTradeApproved ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              ✅ APPROVED
                            </span>
                          ) : (
                            <span style={{ background: '#ef4444', color: '#ffffff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              {item.redTeamVetoActive ? '🚨 VETOED' : '❌ REJECTED'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.11 TAB: AI-CIO INVESTMENT COMMITTEE CHAMBER & CONSENSUS (PHASE 6)       */}
      {/* ========================================================================= */}
      {activeTab === 'cio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header & Stock Selector Bar */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  padding: 12,
                  borderRadius: 12,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Scale size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>AI-CIO Investment Committee Chamber</span>
                  <span style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                    41 AGENTS CONSENSUS & DEBATE
                  </span>
                </h2>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>
                  ประธานคณะกรรมการการลงทุน AI-CIO สังเคราะห์ผลการวิเคราะห์จากทั้ง 4 ทีม เพื่อออกมติลงทุนสุดท้าย (Final Decision Memo)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>เลือกหุ้น:</span>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {universe.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} — {s.name} (${s.price})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleConveneCommittee}
                disabled={isLoadingCio}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isLoadingCio ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  opacity: isLoadingCio ? 0.7 : 1,
                }}
              >
                <RefreshCw size={15} className={isLoadingCio ? 'animate-spin' : ''} />
                <span>{isLoadingCio ? 'กำลังประชุม...' : 'เรียกประชุมเต็มคณะ (Convene)'}</span>
              </button>
            </div>
          </div>

          {cioMsg && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: cioMsg.includes('❌') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                border: cioMsg.includes('❌') ? '1px solid #ef4444' : '1px solid #6366f1',
                color: '#ffffff',
                fontSize: 13,
              }}
            >
              {cioMsg}
            </div>
          )}

          {/* Committee Verdict & Supermajority Hero Panel */}
          {cioMemo && (
            <div
              style={{
                background: cioMemo.redTeamVetoActive
                  ? 'linear-gradient(135deg, rgba(69, 10, 10, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : cioMemo.supermajorityApproved
                  ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                borderRadius: 14,
                border: cioMemo.redTeamVetoActive
                  ? '1px solid #ef4444'
                  : cioMemo.supermajorityApproved
                  ? '1px solid #10b981'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    มติที่ประชุมคณะกรรมการ AI-CIO (FINAL COMMITTEE RESOLUTION)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: cioMemo.redTeamVetoActive
                          ? '#ef4444'
                          : cioMemo.consensusAction === 'STRONG_BUY' || cioMemo.consensusAction === 'BUY'
                          ? '#10b981'
                          : '#eab308',
                      }}
                    >
                      {cioMemo.redTeamVetoActive ? '🛑 VETOED (ห้ามเข้าซื้อ)' : `✅ ${cioMemo.consensusAction}`}
                    </span>
                    <span
                      style={{
                        background: cioMemo.supermajorityApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: cioMemo.supermajorityApproved ? '#10b981' : '#ef4444',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {cioMemo.supermajorityApproved ? 'SUPERMAJORITY PASSED (≥67%)' : 'SUPERMAJORITY FAILED / VETO'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>คะแนนฉันทามติ (Consensus)</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
                      {cioMemo.consensusScore}<span style={{ fontSize: 14, color: '#64748b' }}>/100</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>คะแนนโหวตถ่วงน้ำหนัก Brier</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: cioMemo.calibratedApprovalPct >= 67 ? '#10b981' : '#eab308', marginTop: 2 }}>
                      {cioMemo.calibratedApprovalPct}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>ช่วงความเชื่อมั่น 95% CI</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', marginTop: 8 }}>
                      [{cioMemo.confidenceInterval.lower95}, {cioMemo.confidenceInterval.upper95}]
                    </div>
                  </div>
                </div>
              </div>

              {/* Supermajority Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>สัดส่วนความเห็นชอบของ 41 Agents: <strong>{cioMemo.voteTally.approveCount}/41 เห็นชอบ ({cioMemo.rawApprovalPct}% ดิบ / {cioMemo.calibratedApprovalPct}% ถ่วงน้ำหนัก)</strong></span>
                  <span style={{ color: '#818cf8', fontWeight: 700 }}>เกณฑ์อนุมัติขั้นต่ำ: 67.0%</span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 10, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, cioMemo.calibratedApprovalPct)}%`,
                      height: '100%',
                      background: cioMemo.redTeamVetoActive
                        ? '#ef4444'
                        : cioMemo.calibratedApprovalPct >= 67
                        ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                        : 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }}
                  />
                  {/* 67% Marker Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '67%',
                      width: 2,
                      background: '#ffffff',
                      boxShadow: '0 0 4px #ffffff',
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0, 0, 0, 0.2)', padding: 12, borderRadius: 8 }}>
                <strong>บทวิเคราะห์ของ AI-CIO:</strong> {cioMemo.executiveSummary}
              </div>
            </div>
          )}

          {/* 4 Pillars Cross-Team Synthesis Grid */}
          {cioMemo && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {/* Team 1 Ranking */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#38bdf8', fontWeight: 700 }}>
                  <Award size={16} /> TEAM 1: STOCK RANKING
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>
                  อันดับ #{cioMemo.teamBreakdown.team1Ranking.rank}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  คะแนน Factor Score: <strong>{cioMemo.teamBreakdown.team1Ranking.score}/100</strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  {cioMemo.teamBreakdown.team1Ranking.summary}
                </div>
              </div>

              {/* Team 2 Fundamental */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                  <BarChart3 size={16} /> TEAM 2: FUNDAMENTAL DCF
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>
                  Fair Value ${cioMemo.teamBreakdown.team2Fundamental.fairValue}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  ส่วนต่างมูลค่า: <strong style={{ color: cioMemo.teamBreakdown.team2Fundamental.upsidePct >= 0 ? '#10b981' : '#ef4444' }}>
                    {cioMemo.teamBreakdown.team2Fundamental.upsidePct > 0 ? '+' : ''}{cioMemo.teamBreakdown.team2Fundamental.upsidePct}%
                  </strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  คูเมือง: <strong>{cioMemo.teamBreakdown.team2Fundamental.moat} Moat</strong>
                </div>
              </div>

              {/* Team 3 Red Team */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#ef4444', fontWeight: 700 }}>
                  <AlertTriangle size={16} /> TEAM 3: RED TEAM VETO
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: cioMemo.redTeamVetoActive ? '#ef4444' : '#ffffff', marginTop: 8 }}>
                  {cioMemo.redTeamVetoActive ? '🚨 VETO ACTIVE' : '✅ VETO CLEARED'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  ระดับความเสี่ยง: <strong>{cioMemo.teamBreakdown.team3RedTeam.threatLevel} ({cioMemo.teamBreakdown.team3RedTeam.threatScore}/100)</strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  สัญญาณเตือน Red Flags: {cioMemo.teamBreakdown.team3RedTeam.redFlags} ข้อ
                </div>
              </div>

              {/* Team 4 Tactical */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#eab308', fontWeight: 700 }}>
                  <Zap size={16} /> TEAM 4: TACTICAL ALLOCATION
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>
                  Kelly Sizing {cioMemo.teamBreakdown.team4Tactical.allocationPct}%
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  SL: <strong>${cioMemo.teamBreakdown.team4Tactical.stopLoss}</strong> | TP2: <strong>${cioMemo.teamBreakdown.team4Tactical.tp2}</strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  Risk/Reward: <strong>{cioMemo.teamBreakdown.team4Tactical.riskReward}:1</strong>
                </div>
              </div>
            </div>
          )}

          {/* Dialectical Debate Session Arena (Team 2 Bull vs Team 3 Bear) */}
          {cioMemo && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                  <Scale size={20} color="#818cf8" />
                  <span>เวทีดีเบตเชิงปรัชญา (Formal Dialectical Debate: Team 2 Bull vs Team 3 Bear)</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  ถกเถียงด้วยข้อมูลเชิงลึก 3 มิติ เพื่อให้ AI-CIO ออกมติประนีประนอม (Synthesis)
                </span>
              </div>

              {/* Debate Topic Selector */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cioMemo.debate.points.map((pt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDebateTopicIndex(idx)}
                    style={{
                      background: selectedDebateTopicIndex === idx ? '#4f46e5' : 'rgba(30, 41, 59, 0.6)',
                      color: selectedDebateTopicIndex === idx ? '#ffffff' : '#94a3b8',
                      border: selectedDebateTopicIndex === idx ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    มิติที่ {idx + 1}: {pt.topic.split('(')[0]}
                  </button>
                ))}
              </div>

              {/* Selected Debate Point Display */}
              {cioMemo.debate.points[selectedDebateTopicIndex] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Bull Column */}
                    <div
                      style={{
                        background: 'rgba(6, 78, 59, 0.25)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 12,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                        <span>🐂 ฝ่ายสนับสนุน (Bull Thesis):</span>
                        <span style={{ fontSize: 11, color: '#a7f3d0' }}>{cioMemo.debate.points[selectedDebateTopicIndex].bullAgent}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                        {cioMemo.debate.points[selectedDebateTopicIndex].bullArgument}
                      </p>
                    </div>

                    {/* Bear Column */}
                    <div
                      style={{
                        background: 'rgba(127, 29, 29, 0.25)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 12,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f87171' }}>
                        <span>🐻 ฝ่ายค้าน (Bear Counter):</span>
                        <span style={{ fontSize: 11, color: '#fca5a5' }}>{cioMemo.debate.points[selectedDebateTopicIndex].bearAgent}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                        {cioMemo.debate.points[selectedDebateTopicIndex].bearCounterArgument}
                      </p>
                    </div>
                  </div>

                  {/* CIO Reconciled Resolution */}
                  <div
                    style={{
                      background: 'rgba(67, 56, 202, 0.25)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 12,
                      padding: 14,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <Info size={18} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: '#c7d2fe', lineHeight: 1.5 }}>
                      <strong style={{ color: '#ffffff' }}>มติประนีประนอมของ AI-CIO:</strong> {cioMemo.debate.points[selectedDebateTopicIndex].cioResolution}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actionable Tactical Mandate & Direct Paper Trading Execution */}
          {cioMemo && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                  <Zap size={20} color="#eab308" />
                  <span>คำสั่งปฏิบัติการลงทุน (Actionable Tactical Mandate released by AI-CIO)</span>
                </div>
                {cioMemo.supermajorityApproved && !cioMemo.redTeamVetoActive && (
                  <button
                    onClick={() => tacticalPlan && handleExecutePaperTradeFromPlan(tacticalPlan)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <Play size={16} />
                    <span>ส่งคำสั่งซื้อจริงตามมติ CIO ใน Paper Trading Gateway</span>
                  </button>
                )}
                {cioMemo.redTeamVetoActive && (
                  <div
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Lock size={15} />
                    <span>GATEWAY LOCKED BY RED TEAM VETO</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>จำนวนหุ้นอนุมัติ</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>
                    {cioMemo.mandateExecution.approvedShares} หุ้น
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>วงเงินจัดสรร ($USD)</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', marginTop: 4 }}>
                    ${cioMemo.mandateExecution.capitalAllocationUsd.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>สัดส่วนพอร์ต (Kelly Capped)</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    {cioMemo.mandateExecution.portfolioWeightPct}%
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Hard Stop Loss (1.5x ATR)</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#ef4444', marginTop: 4 }}>
                    ${cioMemo.mandateExecution.hardStopLoss}
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>เป้าหมายหลัก TP2</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                    ${cioMemo.mandateExecution.primaryTargetTp2}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 41 Individual Agent Votes Chamber Grid */}
          {cioMemo && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <Cpu size={18} color="#818cf8" />
                  <span>ผลคะแนนโหวตรายตัวของ 41 AI Agents (Voting Chamber & Brier Score Calibration)</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <span style={{ color: '#10b981' }}>✅ APPROVE: {cioMemo.voteTally.approveCount}</span>
                  <span style={{ color: '#ef4444' }}>❌ REJECT: {cioMemo.voteTally.rejectCount}</span>
                  <span style={{ color: '#94a3b8' }}>⚪ ABSTAIN: {cioMemo.voteTally.abstainCount}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
                {cioMemo.votes.map((v) => (
                  <div
                    key={v.agentId}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                        {v.agentId} • {v.agentName}
                      </span>
                      <span
                        style={{
                          background: v.vote === 'APPROVE' ? 'rgba(16, 185, 129, 0.2)' : v.vote === 'REJECT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: v.vote === 'APPROVE' ? '#10b981' : v.vote === 'REJECT' ? '#ef4444' : '#94a3b8',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        {v.vote} ({v.convictionScore}/100)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                      <span>ทีม: {v.teamName}</span>
                      <span>น้ำหนัก Brier: <strong>{v.calibratedWeight}x</strong></span>
                    </div>

                    <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                      {v.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Universe CIO Decision Leaderboard Table */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                <Scale size={18} color="#818cf8" />
                <span>Universe AI-CIO Decisions Radar (มติการลงทุนหุ้นสหรัฐฯ ทั้งหมด {cioUniverse.length} ตัว)</span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                คลิกที่แถวเพื่อเปลี่ยนไปดูมติและบทวิเคราะห์หุ้นตัวนั้น
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: 11 }}>
                    <th style={{ padding: '10px 14px' }}>TICKER / NAME</th>
                    <th style={{ padding: '10px 14px' }}>PRICE</th>
                    <th style={{ padding: '10px 14px' }}>CIO ACTION</th>
                    <th style={{ padding: '10px 14px' }}>CONSENSUS SCORE</th>
                    <th style={{ padding: '10px 14px' }}>CALIBRATED APPROVAL</th>
                    <th style={{ padding: '10px 14px' }}>SUPERMAJORITY</th>
                    <th style={{ padding: '10px 14px' }}>VETO STATUS</th>
                    <th style={{ padding: '10px 14px' }}>KELLY ALLOCATION</th>
                  </tr>
                </thead>
                <tbody>
                  {cioUniverse.map((item) => {
                    const isSelected = selectedStock === item.ticker;
                    return (
                      <tr
                        key={item.ticker}
                        onClick={() => setSelectedStock(item.ticker)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: isSelected
                            ? 'rgba(79, 70, 229, 0.3)'
                            : item.redTeamVetoActive
                            ? 'rgba(239, 68, 68, 0.05)'
                            : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ffffff' }}>
                          <div>{item.ticker}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.name}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                          ${item.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background: item.redTeamVetoActive
                                ? '#ef4444'
                                : item.action === 'STRONG_BUY' || item.action === 'BUY'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(234, 179, 8, 0.2)',
                              color: item.redTeamVetoActive
                                ? '#ffffff'
                                : item.action === 'STRONG_BUY' || item.action === 'BUY'
                                ? '#10b981'
                                : '#eab308',
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {item.redTeamVetoActive ? 'VETOED' : item.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ffffff' }}>
                          {item.consensusScore}/100
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: item.calibratedApprovalPct >= 67 ? '#10b981' : '#eab308' }}>
                          {item.calibratedApprovalPct}%
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.supermajorityApproved ? (
                            <span style={{ color: '#10b981', fontWeight: 700 }}>✅ PASSED</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>❌ FAILED</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.redTeamVetoActive ? (
                            <span style={{ color: '#ef4444', fontWeight: 800 }}>🚨 VETO</span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>CLEARED</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: item.allocationPct > 0 ? '#38bdf8' : '#64748b' }}>
                          {item.allocationPct > 0 ? `${item.allocationPct}%` : '0%'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 7 TAB: PORTFOLIO & REAL-TIME RISK ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Controls & Status Messages */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={22} color="#38bdf8" />
                <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                  Portfolio & Real-Time Risk Engine (ระบบควบคุมความเสี่ยงพอร์ต & Circuit Breaker)
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
                เฝ้าระวังความเสี่ยงระดับพอร์ต 24/7 ควบคุมเพดาน Sector Cap 30%, วงจรตัดขาดทุน 3 ระดับ และสวิตช์หยุดฉุกเฉิน (Kill Switch)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => fetchPortfolioRisk()}
                disabled={isLoadingPortfolio}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  padding: '8px 14px',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={14} className={isLoadingPortfolio ? 'animate-spin' : ''} />
                <span>รีเฟรชข้อมูลความเสี่ยง</span>
              </button>

              <button
                onClick={() => handleDeleveraging(targetCashDeleveraging)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Shield size={14} />
                <span>ลดความเสี่ยงเชิงรุก (Deleverage สู่เงินสด {targetCashDeleveraging}%)</span>
              </button>

              {portfolioRisk?.killSwitchActive ? (
                <button
                  onClick={() => handleKillSwitchAction('RESET')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>ปลดล็อค KILL SWITCH (Admin Reset)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleKillSwitchAction('TRIGGER')}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>🚨 ซ้อมดับเพลิงฉุกเฉิน (Kill Switch)</span>
                </button>
              )}
            </div>
          </div>

          {portfolioMsg && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: portfolioMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: portfolioMsg.startsWith('✅') ? '1px solid #10b981' : '1px solid #ef4444',
                color: portfolioMsg.startsWith('✅') ? '#6ee7b7' : '#fca5a5',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {portfolioMsg}
            </div>
          )}

          {/* Circuit Breaker Status Hero Banner */}
          {portfolioRisk && (
            <div
              style={{
                background: portfolioRisk.circuitBreakerLevel === 3 || portfolioRisk.killSwitchActive
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(153, 27, 27, 0.35) 100%)'
                  : portfolioRisk.circuitBreakerLevel === 2
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.35) 100%)'
                  : portfolioRisk.circuitBreakerLevel === 1
                  ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(161, 98, 7, 0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
                borderRadius: 14,
                border: portfolioRisk.circuitBreakerLevel === 3 || portfolioRisk.killSwitchActive
                  ? '1px solid #ef4444'
                  : portfolioRisk.circuitBreakerLevel === 2
                  ? '1px solid #f59e0b'
                  : portfolioRisk.circuitBreakerLevel === 1
                  ? '1px solid #eab308'
                  : '1px solid rgba(16, 185, 129, 0.4)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    สถานะวงจรตัดขาดทุนพอร์ตโฟลิโอ (PORTFOLIO CIRCUIT BREAKER STATE)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: portfolioRisk.circuitBreakerLevel === 3 || portfolioRisk.killSwitchActive
                          ? '#ef4444'
                          : portfolioRisk.circuitBreakerLevel === 2
                          ? '#f59e0b'
                          : portfolioRisk.circuitBreakerLevel === 1
                          ? '#eab308'
                          : '#10b981',
                      }}
                    >
                      {portfolioRisk.circuitBreakerLevel === 3 || portfolioRisk.killSwitchActive
                        ? '🚨 LEVEL 3: EMERGENCY KILL SWITCH (ระงับการเทรด 100%)'
                        : portfolioRisk.circuitBreakerLevel === 2
                        ? '🛑 LEVEL 2: DEFENSIVE DELEVERAGING (ลดสถานะสู่เงินสด 50%)'
                        : portfolioRisk.circuitBreakerLevel === 1
                        ? '⚠️ LEVEL 1: HALT NEW BUYS (ระงับคำสั่งซื้อใหม่)'
                        : '✅ LEVEL 0: NORMAL OPERATIONS (สภาวะปกติ)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>จุดสูงสุดเดิม (High-Water Mark)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
                      ${portfolioRisk.highWaterMark.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Drawdown ปัจจุบัน</div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: portfolioRisk.currentDrawdownPct <= -10
                          ? '#ef4444'
                          : portfolioRisk.currentDrawdownPct <= -5
                          ? '#f59e0b'
                          : '#10b981',
                      }}
                    >
                      {portfolioRisk.currentDrawdownPct}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawdown Multi-Tier Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>ระดับ Drawdown เมื่อเทียบกับเกณฑ์ Circuit Breaker:</span>
                  <span>
                    L1: -5% | L2: -10% | L3: -15%
                  </span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 10, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (Math.abs(portfolioRisk.currentDrawdownPct) / 20) * 100)}%`,
                      height: '100%',
                      background: Math.abs(portfolioRisk.currentDrawdownPct) >= 15
                        ? '#ef4444'
                        : Math.abs(portfolioRisk.currentDrawdownPct) >= 10
                        ? '#f59e0b'
                        : Math.abs(portfolioRisk.currentDrawdownPct) >= 5
                        ? '#eab308'
                        : '#10b981',
                      transition: 'width 0.4s ease',
                    }}
                  />
                  {/* Markers */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '25%', width: 2, background: '#eab308' }} title="L1: -5%" />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: '#f59e0b' }} title="L2: -10%" />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '75%', width: 2, background: '#ef4444' }} title="L3: -15%" />
                </div>
              </div>

              {portfolioRisk.alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(0, 0, 0, 0.3)', padding: 10, borderRadius: 8 }}>
                  {portfolioRisk.alerts.map((alert, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6 Core Risk Telemetry Metrics Cards */}
          {portfolioRisk && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {/* Total Equity */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>มูลค่าพอร์ตสุทธิ (Total Equity)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>
                  ${portfolioRisk.totalEquity.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>
                  ลงทุนแล้ว: ${portfolioRisk.investedEquity.toLocaleString()}
                </div>
              </div>

              {/* Cash Balance */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>เงินสดในพอร์ต (Cash Buffer)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                  ${portfolioRisk.cashBalance.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: portfolioRisk.cashRatioPct >= 20 ? '#10b981' : '#eab308', marginTop: 2 }}>
                  สัดส่วนเงินสด: <strong>{portfolioRisk.cashRatioPct}%</strong>
                </div>
              </div>

              {/* Portfolio Beta */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Portfolio Beta vs SPY</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: portfolioRisk.portfolioBeta > 1.15 ? '#f59e0b' : '#34d399', marginTop: 4 }}>
                  {portfolioRisk.portfolioBeta}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  กรอบเป้าหมาย: [0.70, 1.10] ({portfolioRisk.betaStatus})
                </div>
              </div>

              {/* Value-at-Risk 95% 1-Day */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>1-Day 95% Parametric VaR</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f87171', marginTop: 4 }}>
                  ${portfolioRisk.varMetrics.var95DailyUsd.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  ความเสี่ยงสูงสุดต่อวัน: -{portfolioRisk.varMetrics.var95DailyPct}%
                </div>
              </div>

              {/* Expected Shortfall CVaR */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Expected Shortfall (CVaR 95%)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', marginTop: 4 }}>
                  ${portfolioRisk.varMetrics.cvar95DailyUsd.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  ค่าเฉลี่ยหางแถววิกฤต: -{portfolioRisk.varMetrics.cvar95DailyPct}%
                </div>
              </div>

              {/* Sharpe & Sortino */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Sharpe / Sortino Ratio</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#a78bfa', marginTop: 4 }}>
                  {portfolioRisk.varMetrics.sharpeRatio} <span style={{ fontSize: 16, color: '#64748b' }}>/ {portfolioRisk.varMetrics.sortinoRatio}</span>
                </div>
                <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>
                  ผลตอบแทนปรับด้วยความเสี่ยงระดับสูง
                </div>
              </div>
            </div>
          )}

          {/* Macro Beta Hedging Recommendation Panel */}
          {portfolioRisk && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>
                  คำแนะนำป้องกันความเสี่ยงเชิงมหภาค (Macro Beta Hedging Advisory)
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: portfolioRisk.macroHedgeRecommendation.required ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                  {portfolioRisk.macroHedgeRecommendation.required
                    ? `🛡️ แนะนำทำ Macro Hedge ด้วย ${portfolioRisk.macroHedgeRecommendation.instrument}`
                    : '✅ สัดส่วน Beta อยู่ในเกณฑ์เหมาะสม ไม่จำเป็นต้องเปิดสถานะ Hedge'}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#cbd5e1' }}>
                  {portfolioRisk.macroHedgeRecommendation.rationale}
                </p>
              </div>

              {portfolioRisk.macroHedgeRecommendation.required && (
                <div style={{ display: 'flex', gap: 16, background: 'rgba(30, 41, 59, 0.6)', padding: '10px 18px', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>ขนาด Hedge Notional</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>
                      ${portfolioRisk.macroHedgeRecommendation.hedgeNotionalUsd.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>จำนวนสัญญา SPY Put</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>
                      {portfolioRisk.macroHedgeRecommendation.contractsCount} สัญญา
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sector Concentrations Grid (30.0% Hard Cap) */}
          {portfolioRisk && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <Layers size={18} color="#38bdf8" />
                  <span>การกระจุกตัวในกลุ่มอุตสาหกรรม (Sector Concentration vs 30.0% Hard Cap)</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  เพดานบังคับสูงสุดต่อ Sector: <strong>30.0%</strong> (เตือนเมื่อเกิน 25.0%)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {portfolioRisk.sectorExposures.map((sec) => (
                  <div
                    key={sec.sector}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 10,
                      border: sec.isBreached
                        ? '1px solid #ef4444'
                        : sec.status === 'ELEVATED'
                        ? '1px solid #f59e0b'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{sec.sector}</span>
                      <span
                        style={{
                          background: sec.isBreached
                            ? 'rgba(239, 68, 68, 0.2)'
                            : sec.status === 'ELEVATED'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                          color: sec.isBreached ? '#ef4444' : sec.status === 'ELEVATED' ? '#f59e0b' : '#10b981',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        {sec.status} ({sec.stockCount} หุ้น)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#94a3b8' }}>มูลค่าลงทุน: ${sec.marketValue.toLocaleString()}</span>
                      <span style={{ fontWeight: 800, color: sec.weightPct > 30 ? '#ef4444' : '#ffffff' }}>
                        {sec.weightPct}% / 30.0%
                      </span>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (sec.weightPct / 30) * 100)}%`,
                          height: '100%',
                          background: sec.isBreached ? '#ef4444' : sec.status === 'ELEVATED' ? '#f59e0b' : '#38bdf8',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Pre-Trade Risk Gate Simulator */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 14,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
              <Lock size={18} color="#60a5fa" />
              <span>เครื่องมือจำลองตรวจสอบคำสั่งซื้อขายล่วงหน้า (Pre-Trade Hard Risk Gate Simulator)</span>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#94a3b8' }}>
              ทดสอบว่าคำสั่งซื้อขายที่จะส่งเข้าสู่ตลาดจะผ่านเกณฑ์ Hard Risk Engine, เพดาน Sector Cap 30%, และเพดานรายตัว 10% หรือไม่
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#94a3b8' }}>เลือกหุ้น (Ticker):</label>
                <select
                  value={tradeCheckTicker}
                  onChange={(e) => setTradeCheckTicker(e.target.value)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: 13,
                  }}
                >
                  {universe.map((s) => (
                    <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#94a3b8' }}>ประเภทคำสั่ง:</label>
                <select
                  value={tradeCheckSide}
                  onChange={(e) => setTradeCheckSide(e.target.value as any)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: 13,
                  }}
                >
                  <option value="BUY">BUY (เปิดสถานะซื้อ)</option>
                  <option value="SELL">SELL (ขายลดความเสี่ยง)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#94a3b8' }}>มูลค่าเสนอซื้อขาย ($ USD):</label>
                <input
                  type="number"
                  value={tradeCheckAmount}
                  onChange={(e) => setTradeCheckAmount(Number(e.target.value))}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: 13,
                    width: 140,
                  }}
                />
              </div>

              <button
                onClick={handleCheckTrade}
                disabled={isCheckingTrade}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Play size={14} />
                <span>{isCheckingTrade ? 'กำลังตรวจสอบ...' : 'ตรวจสอบคำสั่ง'}</span>
              </button>
            </div>

            {tradeCheckResult && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: tradeCheckResult.allowed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: tradeCheckResult.allowed ? '1px solid #10b981' : '1px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {tradeCheckResult.allowed ? (
                  <>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 700 }}>
                      ✅ คำสั่งซื้อขายได้รับอนุญาต: ผ่านเกณฑ์การประเมินความเสี่ยงทุกข้อ
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} color="#ef4444" />
                    <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 700 }}>
                      ❌ คำสั่งถูกปฏิเสธโดย Hard Risk Gate: {tradeCheckResult.violationReason}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Live Holdings Mark-to-Market Table */}
          {portfolioRisk && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                  <BarChart3 size={18} color="#34d399" />
                  <span>สถานะการถือครองหุ้นปัจจุบัน (Live Portfolio Holdings Mark-to-Market)</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  จำนวนสถานะเปิด: <strong>{portfolioRisk.holdings.length} ตัว</strong>
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 12px' }}>TICKER & COMPANY</th>
                      <th style={{ padding: '10px 12px' }}>SECTOR</th>
                      <th style={{ padding: '10px 12px' }}>SHARES</th>
                      <th style={{ padding: '10px 12px' }}>AVG PRICE</th>
                      <th style={{ padding: '10px 12px' }}>CURRENT PRICE</th>
                      <th style={{ padding: '10px 12px' }}>MARKET VALUE</th>
                      <th style={{ padding: '10px 12px' }}>UNREALIZED P&L</th>
                      <th style={{ padding: '10px 12px' }}>WEIGHT %</th>
                      <th style={{ padding: '10px 12px' }}>BETA</th>
                      <th style={{ padding: '10px 12px' }}>CONVICTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioRisk.holdings.map((h) => (
                      <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#ffffff' }}>
                          {h.ticker} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{h.companyName}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>{h.sector}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{h.shares}</td>
                        <td style={{ padding: '12px' }}>${h.averageEntryPrice}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>${h.currentPrice}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#ffffff' }}>${h.marketValue.toLocaleString()}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: h.unrealizedPnl >= 0 ? '#10b981' : '#ef4444' }}>
                          {h.unrealizedPnl >= 0 ? '+' : ''}${h.unrealizedPnl.toLocaleString()} ({h.unrealizedPnlPct > 0 ? '+' : ''}{h.unrealizedPnlPct}%)
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: h.weightPct > 10 ? '#ef4444' : '#38bdf8' }}>
                          {h.weightPct}%
                        </td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{h.beta}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {h.convictionScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Circuit Breakers & Risk Audit History Table */}
          {cbHistory.length > 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 14 }}>
                <Activity size={18} color="#f59e0b" />
                <span>ประวัติการทำงานของวงจรตัดขาดทุน (Circuit Breaker Audit Events Log)</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '8px 12px' }}>TIMESTAMP</th>
                      <th style={{ padding: '8px 12px' }}>LEVEL</th>
                      <th style={{ padding: '8px 12px' }}>TRIGGER REASON</th>
                      <th style={{ padding: '8px 12px' }}>DRAWDOWN %</th>
                      <th style={{ padding: '8px 12px' }}>ACTION TAKEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cbHistory.map((ev, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              background: ev.level === 3 ? 'rgba(239, 68, 68, 0.2)' : ev.level === 2 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                              color: ev.level === 3 ? '#ef4444' : ev.level === 2 ? '#f59e0b' : '#eab308',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 800,
                            }}
                          >
                            LEVEL {ev.level}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{ev.triggerReason}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ef4444' }}>{ev.drawdownPct}%</td>
                        <td style={{ padding: '10px 12px', color: '#93c5fd', fontWeight: 600 }}>{ev.actionTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 8 TAB: PAPER TRADING & STRATEGY BACKTESTING */}
      {/* ========================================================================= */}
      {activeTab === 'paper' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Controls & Mode Switcher */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    borderRadius: 10,
                    padding: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={20} color="#ffffff" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    Paper Trading Simulator & Strategy Backtesting (Phase 8)
                  </h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
                    ระบบจำลองคำสั่งซื้อขายจริง (Slippage, ค่าคอมมิชชัน, Hard Risk Gate) และ Walk-Forward Multi-Asset Backtester
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Switcher Buttons */}
            <div style={{ display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => setPaperTabMode('paper')}
                style={{
                  background: paperTabMode === 'paper' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                  color: paperTabMode === 'paper' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <Activity size={15} />
                <span>💼 Paper Trading Terminal</span>
              </button>

              <button
                onClick={() => setPaperTabMode('backtest')}
                style={{
                  background: paperTabMode === 'backtest' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                  color: paperTabMode === 'backtest' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <BarChart3 size={15} />
                <span>📈 Walk-Forward Backtester</span>
              </button>
            </div>
          </div>

          {/* Action Notification Message */}
          {paperActionMsg && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 10,
                background: paperActionMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${paperActionMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: paperActionMsg.type === 'success' ? '#6ee7b7' : '#fca5a5',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {paperActionMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{paperActionMsg.text}</span>
              </div>
              <button
                onClick={() => setPaperActionMsg(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 1: PAPER TRADING TERMINAL */}
          {/* ========================================================================= */}
          {paperTabMode === 'paper' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Account Telemetry Hero Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {/* Net Equity */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>พอร์ตเสมือนรวม (Net Equity)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                    ${portfolioRisk ? portfolioRisk.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '100,000.00'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    HWM: ${portfolioRisk ? portfolioRisk.highWaterMark.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '100,000.00'}
                  </div>
                </div>

                {/* Cash Balance */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>เงินสดคงเหลือ (Cash Balance)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                    ${portfolioRisk ? portfolioRisk.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '100,000.00'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    สัดส่วนเงินสด: {portfolioRisk ? portfolioRisk.cashRatioPct.toFixed(1) : '100.0'}%
                  </div>
                </div>

                {/* Invested Equity */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>มูลค่าหุ้นในพอร์ต (Invested)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                    ${portfolioRisk ? portfolioRisk.investedEquity.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    ถือครอง {portfolioRisk ? portfolioRisk.holdings.length : 0} บริษัท
                  </div>
                </div>

                {/* Circuit Breaker Status */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    borderRadius: 12,
                    border: `1px solid ${portfolioRisk && portfolioRisk.circuitBreakerLevel > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>สถานะความเสี่ยง (Risk Gate)</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: portfolioRisk && portfolioRisk.circuitBreakerLevel > 0 ? '#ef4444' : '#10b981',
                      marginTop: 6,
                    }}
                  >
                    {portfolioRisk && portfolioRisk.circuitBreakerLevel === 0 ? '🟢 NORMAL OPERATIONS' : `🚨 LEVEL ${portfolioRisk?.circuitBreakerLevel} BREACH`}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                    Drawdown: {portfolioRisk ? portfolioRisk.currentDrawdownPct.toFixed(2) : '0.00'}%
                  </div>
                </div>
              </div>

              {/* Main Two-Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
                {/* Left Column: Virtual Order Placement Form */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={18} color="#38bdf8" />
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>ส่งคำสั่งซื้อขายเสมือน</h3>
                    </div>
                    <button
                      onClick={handleResetPaperAccount}
                      title="รีเซ็ตพอร์ตเสมือนเป็นเงินสดเริ่มต้น $100k"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Reset $100k</span>
                    </button>
                  </div>

                  {/* Stock Selector */}
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      เลือกหุ้น (32 Large Caps Universe)
                    </label>
                    <select
                      value={paperOrderTicker}
                      onChange={(e) => setPaperOrderTicker(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        padding: '9px 12px',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {universe.map((s) => (
                        <option key={s.ticker} value={s.ticker}>
                          {s.ticker} — {s.name} (${s.price}) | {s.sector}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Side: BUY / SELL Buttons */}
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      ประเภทคำสั่ง (Side)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setPaperOrderSide('BUY')}
                        style={{
                          background: paperOrderSide === 'BUY' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(15, 23, 42, 0.6)',
                          color: paperOrderSide === 'BUY' ? '#ffffff' : '#94a3b8',
                          border: paperOrderSide === 'BUY' ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          padding: '10px 0',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        BUY (ซื้อ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperOrderSide('SELL')}
                        style={{
                          background: paperOrderSide === 'SELL' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(15, 23, 42, 0.6)',
                          color: paperOrderSide === 'SELL' ? '#ffffff' : '#94a3b8',
                          border: paperOrderSide === 'SELL' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          padding: '10px 0',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        SELL (ขาย)
                      </button>
                    </div>
                  </div>

                  {/* Order Type: MARKET / LIMIT / STOP_LOSS */}
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      เงื่อนไขการส่งคำสั่ง (Order Type)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {(['MARKET', 'LIMIT', 'STOP_LOSS'] as PaperOrderType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPaperOrderType(type)}
                          style={{
                            background: paperOrderType === type ? '#3b82f6' : 'rgba(15, 23, 42, 0.6)',
                            color: paperOrderType === type ? '#ffffff' : '#94a3b8',
                            border: paperOrderType === type ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 6,
                            padding: '7px 4px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shares & Quick Allocation Buttons */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>จำนวนหุ้น (Shares)</label>
                      <span style={{ fontSize: 12, color: '#38bdf8' }}>
                        ~${(paperOrderShares * (universe.find((s) => s.ticker === paperOrderTicker)?.price ?? 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={paperOrderShares}
                      onChange={(e) => setPaperOrderShares(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        padding: '9px 12px',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    />

                    {/* Quick sizing pills */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {[
                        { label: '25% ($2.5k)', shares: Math.floor(2500 / (universe.find((s) => s.ticker === paperOrderTicker)?.price ?? 100)) },
                        { label: '50% ($5.0k)', shares: Math.floor(5000 / (universe.find((s) => s.ticker === paperOrderTicker)?.price ?? 100)) },
                        { label: '75% ($7.5k)', shares: Math.floor(7500 / (universe.find((s) => s.ticker === paperOrderTicker)?.price ?? 100)) },
                        { label: 'Max 10% ($10k)', shares: Math.floor(10000 / (universe.find((s) => s.ticker === paperOrderTicker)?.price ?? 100)) },
                      ].map((pill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPaperOrderShares(Math.max(1, pill.shares))}
                          style={{
                            flex: 1,
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 6,
                            padding: '4px 0',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Limit Price Input (if LIMIT) */}
                  {paperOrderType === 'LIMIT' && (
                    <div>
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                        ราคา Limit ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ระบุราคาที่ต้องการซื้อ/ขาย"
                        value={paperOrderLimitPrice ?? ''}
                        onChange={(e) => setPaperOrderLimitPrice(parseFloat(e.target.value) || undefined)}
                        style={{
                          width: '100%',
                          background: 'rgba(15, 23, 42, 0.8)',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 8,
                          padding: '9px 12px',
                          fontSize: 14,
                        }}
                      />
                    </div>
                  )}

                  {/* Stop Loss Price Input (if STOP_LOSS) */}
                  {paperOrderType === 'STOP_LOSS' && (
                    <div>
                      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                        ราคา Trigger Stop Loss ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ระบุราคาตัดขาดทุน"
                        value={paperOrderStopPrice ?? ''}
                        onChange={(e) => setPaperOrderStopPrice(parseFloat(e.target.value) || undefined)}
                        style={{
                          width: '100%',
                          background: 'rgba(15, 23, 42, 0.8)',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 8,
                          padding: '9px 12px',
                          fontSize: 14,
                        }}
                      />
                    </div>
                  )}

                  {/* Friction Breakdown Panel */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 10,
                      padding: 12,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>ราคาตลาดปัจจุบัน:</span>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                        ${universe.find((s) => s.ticker === paperOrderTicker)?.price.toFixed(2) ?? '0.00'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>ค่า Slippage โดยประมาณ:</span>
                      <span style={{ color: '#38bdf8' }}>~4.2 bps</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>ค่าคอมมิชชัน & SEC Fees:</span>
                      <span style={{ color: '#f8fafc' }}>$1.00</span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ color: '#cbd5e1' }}>ประมาณการมูลค่าคำสั่ง:</span>
                      <span style={{ color: paperOrderSide === 'BUY' ? '#34d399' : '#f87171' }}>
                        ${(paperOrderShares * (universe.find((s) => s.ticker === paperOrderTicker)?.price ?? 0) + 1.0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleExecutePaperOrder}
                    disabled={isSubmittingPaperOrder}
                    style={{
                      background: paperOrderSide === 'BUY' ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 0',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: isSubmittingPaperOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {isSubmittingPaperOrder ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                    <span>{isSubmittingPaperOrder ? 'กำลังตรวจสอบความเสี่ยง & ส่งคำสั่ง...' : `ส่งคำสั่ง ${paperOrderSide} ${paperOrderShares} หุ้น ${paperOrderTicker}`}</span>
                  </button>
                </div>

                {/* Right Column: Holdings & Execution Order Book */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Active Positions Table */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Wallet size={18} color="#10b981" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          สถานะถือครองในพอร์ตเสมือน (Active Holdings)
                        </h3>
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {portfolioRisk?.holdings.length ?? 0} ตำแหน่ง
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>หุ้น (Ticker)</th>
                            <th style={{ padding: '8px 10px' }}>กลุ่มธุรกิจ</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>จำนวนหุ้น</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ต้นทุนเฉลี่ย</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ราคาตลาด</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>มูลค่าพอร์ต</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>กำไร/ขาดทุน (P&L)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>จัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolioRisk && portfolioRisk.holdings.length > 0 ? (
                            portfolioRisk.holdings.map((h) => {
                              const isProfitable = h.unrealizedPnl >= 0;
                              return (
                                <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                  <td style={{ padding: '10px 10px', fontWeight: 700, color: '#f8fafc' }}>
                                    {h.ticker}
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{h.companyName}</div>
                                  </td>
                                  <td style={{ padding: '10px 10px', color: '#94a3b8', fontSize: 12 }}>{h.sector}</td>
                                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>{h.shares}</td>
                                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#cbd5e1' }}>${h.averageEntryPrice.toFixed(2)}</td>
                                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>${h.currentPrice.toFixed(2)}</td>
                                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                                    ${h.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    <div style={{ fontSize: 11, color: '#64748b' }}>({h.weightPct}%)</div>
                                  </td>
                                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: isProfitable ? '#34d399' : '#f87171' }}>
                                    {isProfitable ? '+' : ''}${h.unrealizedPnl.toFixed(2)}
                                    <div style={{ fontSize: 11 }}>({isProfitable ? '+' : ''}{h.unrealizedPnlPct}%)</div>
                                  </td>
                                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleClosePaperPosition(h.ticker)}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#f87171',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Close
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                                ไม่มีสถานะถือครองในขณะนี้ สามารถส่งคำสั่งซื้อจำลองได้จากแผงด้านซ้าย
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Execution Audit Log Table */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History size={18} color="#8b5cf6" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          สมุดบันทึกประวัติการส่งคำสั่ง (Execution Order Book)
                        </h3>
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {paperOrders.length} คำสั่ง
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: 360 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>เวลา</th>
                            <th style={{ padding: '8px 10px' }}>หุ้น</th>
                            <th style={{ padding: '8px 10px' }}>คำสั่ง</th>
                            <th style={{ padding: '8px 10px' }}>เงื่อนไข</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>จำนวน</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ราคา Fill</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Slippage</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>สถานะ</th>
                            <th style={{ padding: '8px 10px' }}>รายละเอียด / การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paperOrders.length > 0 ? (
                            paperOrders.map((o) => {
                              const isBuy = o.side === 'BUY';
                              const statusColor =
                                o.status === 'FILLED'
                                  ? '#10b981'
                                  : o.status === 'CLOSED'
                                  ? '#8b5cf6'
                                  : o.status === 'PENDING'
                                  ? '#f59e0b'
                                  : o.status === 'REJECTED'
                                  ? '#ef4444'
                                  : '#64748b';

                              return (
                                <tr key={o.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                  <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </td>
                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>{o.ticker}</td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <span
                                      style={{
                                        background: isBuy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: isBuy ? '#34d399' : '#f87171',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 10,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {o.side}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>{o.orderType}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{o.shares}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: o.filledPrice ? '#f8fafc' : '#64748b' }}>
                                    {o.filledPrice ? `$${o.filledPrice.toFixed(2)}` : '-'}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>
                                    {o.slippageUsd > 0 ? `$${o.slippageUsd.toFixed(2)}` : '-'}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                    <span
                                      style={{
                                        background: `${statusColor}22`,
                                        color: statusColor,
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 10,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {o.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', color: o.rejectReason ? '#f87171' : '#94a3b8', fontSize: 11 }}>
                                    {o.status === 'PENDING' ? (
                                      <button
                                        onClick={() => handleCancelPaperOrder(o.id)}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.15)',
                                          color: '#f87171',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          borderRadius: 4,
                                          padding: '2px 6px',
                                          fontSize: 10,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      o.rejectReason || (o.realizedPnlUsd !== 0 ? `P&L: ${o.realizedPnlUsd > 0 ? '+' : ''}$${o.realizedPnlUsd.toFixed(2)}` : 'Execution Completed')
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                                ยังไม่มีประวัติคำสั่งซื้อขาย
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 2: STRATEGY BACKTESTING */}
          {/* ========================================================================= */}
          {paperTabMode === 'backtest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Strategy Selector Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {backtestStrategies.map((strat) => {
                  const isSelected = selectedStrategyId === strat.id;
                  return (
                    <div
                      key={strat.id}
                      onClick={() => setSelectedStrategyId(strat.id)}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 58, 138, 0.25) 100%)'
                          : 'rgba(15, 23, 42, 0.7)',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#93c5fd',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {strat.targetRegime}
                          </span>
                          {isSelected && <Check size={16} color="#3b82f6" />}
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '8px 0 4px' }}>
                          {strat.thaiName}
                        </h4>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                          {strat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulation Configuration & Run Action Bar */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SlidersHorizontal size={18} color="#8b5cf6" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      ตั้งค่าพารามิเตอร์การทดสอบย้อนหลัง (Backtest Parameters)
                    </h3>
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    เกณฑ์มาตรฐานเปรียบเทียบ: <strong style={{ color: '#8b5cf6' }}>SPY (S&P 500)</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>เงินทุนเริ่มต้น ($)</label>
                    <input
                      type="number"
                      step={5000}
                      value={backtestCapital}
                      onChange={(e) => setBacktestCapital(parseInt(e.target.value) || 100000)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Slippage (bps)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={backtestSlippage}
                      onChange={(e) => setBacktestSlippage(parseFloat(e.target.value) || 4.0)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>จำนวนตำแหน่งสูงสุด</label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={backtestMaxPositions}
                      onChange={(e) => setBacktestMaxPositions(parseInt(e.target.value) || 5)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Stop Loss (%)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={backtestStopLossPct}
                      onChange={(e) => setBacktestStopLossPct(parseFloat(e.target.value) || 5.0)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Take Profit (%)</label>
                    <input
                      type="number"
                      step={1.0}
                      value={backtestTakeProfitPct}
                      onChange={(e) => setBacktestTakeProfitPct(parseFloat(e.target.value) || 15.0)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Position Sizing</label>
                    <select
                      value={backtestPositionSizing}
                      onChange={(e) => setBacktestPositionSizing(e.target.value as any)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
                    >
                      <option value="HALF_KELLY">Half-Kelly Criterion</option>
                      <option value="EQUAL_WEIGHT">Equal Weight</option>
                      <option value="VOLATILITY_PARITY">Volatility Parity</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleRunBacktest}
                  disabled={isRunningBacktest}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isRunningBacktest ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  {isRunningBacktest ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                  <span>{isRunningBacktest ? 'กำลังประมวลผล Walk-Forward Backtest ข้อมูล 32 หุ้น...' : '🚀 เริ่มทดสอบย้อนหลัง (Run Walk-Forward Simulation)'}</span>
                </button>
              </div>

              {/* Simulation Result Presentation */}
              {backtestResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* KPI Metrics Scorecard */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                    {/* Strategy Return vs SPY */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>ผลตอบแทนสุทธิ (Cumulative)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: backtestResult.totalReturnPct >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
                        {backtestResult.totalReturnPct >= 0 ? '+' : ''}{backtestResult.totalReturnPct}%
                      </div>
                      <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 4 }}>
                        SPY: +{backtestResult.benchmarkReturnPct}% (Alpha: {backtestResult.alphaPct > 0 ? '+' : ''}{backtestResult.alphaPct}%)
                      </div>
                    </div>

                    {/* CAGR */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>CAGR (อัตราผลตอบแทนต่อปี)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                        +{backtestResult.cagrPct}%
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Annualized 252 Days</div>
                    </div>

                    {/* Sharpe Ratio */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Sharpe Ratio (Rf = 4%)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: backtestResult.sharpeRatio >= 2.0 ? '#10b981' : '#f59e0b', marginTop: 4 }}>
                        {backtestResult.sharpeRatio}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Sortino: <strong style={{ color: '#34d399' }}>{backtestResult.sortinoRatio}</strong>
                      </div>
                    </div>

                    {/* Max Drawdown */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Drawdown สูงสุด (MDD)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                        -{backtestResult.maxDrawdownPct}%
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Beta vs SPY: <strong style={{ color: '#94a3b8' }}>{backtestResult.beta}</strong>
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Win Rate (อัตราชนะ)</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                        {backtestResult.winRatePct}%
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {backtestResult.winningTrades} ชนะ / {backtestResult.losingTrades} แพ้
                      </div>
                    </div>

                    {/* Profit Factor */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Profit Factor</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                        {backtestResult.profitFactor}x
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Payoff: {backtestResult.payoffRatio}x
                      </div>
                    </div>
                  </div>

                  {/* High-Performance SVG Equity Curve Chart */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: 24,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          เส้นกราฟผลตอบแทนสะสม (Equity Curve vs SPY Benchmark)
                        </h3>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                          เปรียบเทียบพอร์ตโฟลิโอ ${backtestResult.initialCapital.toLocaleString()} กับดัชนี S&P 500 (SPY) แบบรายวัน
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 14, height: 4, background: '#10b981', borderRadius: 2 }} />
                          <span style={{ color: '#10b981' }}>กลยุทธ์: ${backtestResult.finalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 14, height: 4, background: '#8b5cf6', borderRadius: 2 }} />
                          <span style={{ color: '#8b5cf6' }}>Benchmark SPY</span>
                        </div>
                      </div>
                    </div>

                    {/* SVG Chart */}
                    <div style={{ width: '100%', height: 260, position: 'relative' }}>
                      {(() => {
                        const points = backtestResult.equityCurve;
                        if (!points || points.length === 0) return null;

                        const allValues = [
                          ...points.map((p) => p.equity),
                          ...points.map((p) => p.benchmarkEquity),
                        ];
                        const minVal = Math.min(...allValues) * 0.98;
                        const maxVal = Math.max(...allValues) * 1.02;
                        const range = Math.max(1, maxVal - minVal);

                        const width = 1000;
                        const height = 240;

                        const getX = (idx: number) => (idx / (points.length - 1)) * (width - 40) + 20;
                        const getY = (val: number) => height - 30 - ((val - minVal) / range) * (height - 50);

                        const strategySvgPoints = points.map((p, idx) => `${getX(idx)},${getY(p.equity)}`).join(' ');
                        const benchmarkSvgPoints = points.map((p, idx) => `${getX(idx)},${getY(p.benchmarkEquity)}`).join(' ');

                        return (
                          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            {/* Grid Lines */}
                            {[0.25, 0.5, 0.75, 1.0].map((pct, idx) => {
                              const y = getY(minVal + range * pct);
                              const labelVal = minVal + range * pct;
                              return (
                                <g key={idx}>
                                  <line x1="20" y1={y} x2={width - 20} y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
                                  <text x={width - 15} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                                    ${Math.round(labelVal).toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Benchmark Line (Purple) */}
                            <polyline
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="2.5"
                              strokeDasharray="5 3"
                              points={benchmarkSvgPoints}
                            />

                            {/* Strategy Line (Emerald Green) */}
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={strategySvgPoints}
                            />

                            {/* Data Point Dots on Strategy Curve */}
                            {points.map((p, idx) => {
                              if (idx % 3 !== 0 && idx !== points.length - 1) return null;
                              return (
                                <circle
                                  key={idx}
                                  cx={getX(idx)}
                                  cy={getY(p.equity)}
                                  r="4"
                                  fill="#10b981"
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                />
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Trade Execution Log Table */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History size={18} color="#06b6d4" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          บันทึกการเปิด-ปิดสถานะตามกลยุทธ์ (Simulated Trade History)
                        </h3>
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {backtestResult.tradeLog.length} ธุรกรรม
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: 340 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>หุ้น</th>
                            <th style={{ padding: '8px 10px' }}>วันที่เข้า</th>
                            <th style={{ padding: '8px 10px' }}>วันที่ออก</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ระยะเวลา (วัน)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ราคาเข้า ($)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ราคาออก ($)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>จำนวนหุ้น</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>กำไร/ขาดทุน ($)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>ผลตอบแทน (%)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>สาเหตุปิดสถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backtestResult.tradeLog.map((t) => {
                            const isWin = t.pnlUsd >= 0;
                            const reasonBadgeColor =
                              t.exitReason === 'TAKE_PROFIT'
                                ? '#10b981'
                                : t.exitReason === 'STOP_LOSS'
                                ? '#ef4444'
                                : t.exitReason === 'SIGNAL_EXIT'
                                ? '#3b82f6'
                                : '#64748b';

                            return (
                              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>
                                  {t.ticker}
                                  <div style={{ fontSize: 10, color: '#64748b' }}>{t.companyName}</div>
                                </td>
                                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{t.entryDate}</td>
                                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{t.exitDate}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#cbd5e1' }}>{t.holdDays}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#cbd5e1' }}>${t.entryPrice.toFixed(2)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>${t.exitPrice.toFixed(2)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#cbd5e1' }}>{t.shares}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: isWin ? '#34d399' : '#f87171' }}>
                                  {isWin ? '+' : ''}${t.pnlUsd.toFixed(2)}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: isWin ? '#34d399' : '#f87171' }}>
                                  {isWin ? '+' : ''}{t.pnlPct.toFixed(2)}%
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      background: `${reasonBadgeColor}22`,
                                      color: reasonBadgeColor,
                                      borderRadius: 4,
                                      padding: '2px 6px',
                                      fontSize: 10,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {t.exitReason}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 10 TAB: REAL-TIME SSE STREAM & MULTI-CHANNEL NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <NotificationChannelManager
          sseConnected={sseConnected}
          sseStats={sseStats}
          onRefreshData={fetchData}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: ADVANCED MULTI-FACTOR SCREENER (PHASE 1) */}
      {/* ========================================================================= */}
      {activeTab === 'screener' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Multi-Factor Filter Control Panel */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#ffffff' }}>
                <SlidersHorizontal size={18} color="#38bdf8" />
                <span>ตัวกรองมิติเชิงปริมาณ (Quantitative Multi-Factor Filters)</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                พบหุ้นผ่านเกณฑ์: <strong style={{ color: '#38bdf8' }}>{filteredStocks.length}</strong> / {universe.length} ตัว
              </div>
            </div>

            {/* Filter Controls Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
              {/* Valuation Filter */}
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>P/E Ratio (Max)</label>
                <select
                  value={filterPe}
                  onChange={(e) => setFilterPe(e.target.value === 'ALL' ? 'ALL' : parseFloat(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: 8, padding: '7px 10px' }}
                >
                  <option value="ALL">ทั้งหมด (All P/E)</option>
                  <option value="25">P/E ≤ 25x (Value)</option>
                  <option value="35">P/E ≤ 35x (Reasonable)</option>
                  <option value="50">P/E ≤ 50x (Growth)</option>
                </select>
              </div>

              {/* Quality ROE Filter */}
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>ROE Quality (Min)</label>
                <select
                  value={filterRoe}
                  onChange={(e) => setFilterRoe(e.target.value === 'ALL' ? 'ALL' : parseFloat(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: 8, padding: '7px 10px' }}
                >
                  <option value="ALL">ทั้งหมด (All ROE)</option>
                  <option value="15">ROE ≥ 15%</option>
                  <option value="25">ROE ≥ 25% (High Quality)</option>
                  <option value="40">ROE ≥ 40% (Exceptional)</option>
                </select>
              </div>

              {/* Revenue Growth Filter */}
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>Revenue Growth YoY (Min)</label>
                <select
                  value={filterGrowth}
                  onChange={(e) => setFilterGrowth(e.target.value === 'ALL' ? 'ALL' : parseFloat(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: 8, padding: '7px 10px' }}
                >
                  <option value="ALL">ทั้งหมด (All Growth)</option>
                  <option value="10">เติบโต ≥ 10% YoY</option>
                  <option value="20">เติบโต ≥ 20% YoY (Fast)</option>
                  <option value="35">เติบโต ≥ 35% YoY (Hyper)</option>
                </select>
              </div>

              {/* RSI State Filter */}
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>RSI Momentum</label>
                <select
                  value={filterRsiState}
                  onChange={(e) => setFilterRsiState(e.target.value as any)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: 8, padding: '7px 10px' }}
                >
                  <option value="ALL">ทั้งหมด (All RSI)</option>
                  <option value="OVERSOLD">Oversold (RSI &lt; 35)</option>
                  <option value="NORMAL">ปกติ (RSI 35 - 70)</option>
                  <option value="OVERBOUGHT">Overbought (RSI &gt; 70)</option>
                </select>
              </div>

              {/* Technical Setup Filter */}
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: 4 }}>Technical Setup</label>
                <select
                  value={filterTechnicalSetup}
                  onChange={(e) => setFilterTechnicalSetup(e.target.value as any)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: 8, padding: '7px 10px' }}
                >
                  <option value="ALL">ทั้งหมด (All Setups)</option>
                  <option value="GOLDEN_CROSS">Golden Cross (50 &gt; 200 EMA)</option>
                  <option value="ABOVE_200EMA">ยืนเหนือเส้น 200 EMA</option>
                  <option value="NEAR_52W_HIGH">ใกล้ New High (ห่าง &lt; 8%)</option>
                </select>
              </div>
            </div>

            {/* Sector Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {sectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  style={{
                    background: selectedSector === sec ? '#2563eb' : 'rgba(30, 41, 59, 0.6)',
                    color: selectedSector === sec ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Screener Results Table */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>Ticker / Company</th>
                  <th style={{ padding: '12px 16px' }}>ราคาล่าสุด</th>
                  <th style={{ padding: '12px 16px' }}>24h %</th>
                  <th style={{ padding: '12px 16px' }}>P/E (Forward)</th>
                  <th style={{ padding: '12px 16px' }}>ROE</th>
                  <th style={{ padding: '12px 16px' }}>Revenue Growth</th>
                  <th style={{ padding: '12px 16px' }}>F-Score</th>
                  <th style={{ padding: '12px 16px' }}>RSI (14)</th>
                  <th style={{ padding: '12px 16px' }}>Market Cap</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => (
                  <tr
                    key={stock.ticker}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#ffffff' }}>{stock.ticker}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{stock.name}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ffffff' }}>${stock.price}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: stock.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
                      {stock.changePercent >= 0 ? `+${stock.changePercent}%` : `${stock.changePercent}%`}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                      {stock.peRatio}x ({stock.forwardPE}x)
                    </td>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>{stock.roe}%</td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8' }}>+{stock.revenueGrowthYoY}%</td>
                    <td style={{ padding: '12px 16px', color: '#eab308', fontWeight: 700 }}>
                      {stock.piotroskiFScore}/9
                    </td>
                    <td style={{ padding: '12px 16px', color: stock.rsi14 > 70 ? '#ef4444' : stock.rsi14 < 35 ? '#10b981' : '#cbd5e1' }}>
                      {stock.rsi14}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      ${(stock.marketCap / 1_000_000_000_000).toFixed(2)}T
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedStock(stock.ticker);
                            setActiveTab('technical');
                          }}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: 6,
                            padding: '5px 9px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Technical
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStock(stock.ticker);
                            setActiveTab('opportunities');
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: 6,
                            padding: '5px 9px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          AI มติ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: TECHNICAL INDICATORS MATRIX (PHASE 1) */}
      {/* ========================================================================= */}
      {activeTab === 'technical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {chartData ? (
            <>
              {/* Header for Selected Stock */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{chartData.stock.ticker}</span>
                    <span style={{ fontSize: 16, color: '#94a3b8' }}>{chartData.stock.name}</span>
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                      TECHNICAL SCORE: {chartData.indicators.technicalScore}/100
                    </span>
                  </div>
                  <div style={{ color: '#38bdf8', fontSize: 13, marginTop: 4, fontWeight: 600 }}>
                    {chartData.indicators.setupSummary}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {universe.slice(0, 8).map((s) => (
                    <button
                      key={s.ticker}
                      onClick={() => setSelectedStock(s.ticker)}
                      style={{
                        background: selectedStock === s.ticker ? '#2563eb' : 'rgba(30, 41, 59, 0.6)',
                        color: selectedStock === s.ticker ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {s.ticker}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Indicator Metrics Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {/* Moving Averages */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>EXPONENTIAL MOVING AVERAGES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>EMA 20</span>
                      <strong style={{ color: '#ffffff' }}>${chartData.indicators.ema20}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>EMA 50</span>
                      <strong style={{ color: '#38bdf8' }}>${chartData.indicators.ema50}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>EMA 200</span>
                      <strong style={{ color: '#eab308' }}>${chartData.indicators.ema200}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: '#64748b' }}>Golden Cross</span>
                      <span style={{ color: chartData.indicators.goldenCross ? '#10b981' : '#f87171', fontWeight: 700 }}>
                        {chartData.indicators.goldenCross ? 'YES (Bullish)' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSI (14) */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>RSI (14-DAY MOMENTUM)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: chartData.indicators.rsi14 > 70 ? '#ef4444' : chartData.indicators.rsi14 < 35 ? '#10b981' : '#38bdf8' }}>
                    {chartData.indicators.rsi14}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                    {chartData.indicators.rsi14 > 70 ? 'Overbought (โซนซื้อมากเกินไป)' : chartData.indicators.rsi14 < 35 ? 'Oversold (โซนขายมากเกินไป)' : 'Healthy Momentum Range'}
                  </div>
                </div>

                {/* MACD */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>MACD (12, 26, 9)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>MACD Line</span>
                      <strong style={{ color: '#ffffff' }}>{chartData.indicators.macd.macdLine}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Signal Line</span>
                      <strong style={{ color: '#cbd5e1' }}>{chartData.indicators.macd.signalLine}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Histogram</span>
                      <strong style={{ color: chartData.indicators.macd.histogram >= 0 ? '#10b981' : '#ef4444' }}>
                        {chartData.indicators.macd.histogram >= 0 ? `+${chartData.indicators.macd.histogram}` : chartData.indicators.macd.histogram}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: '#64748b' }}>Signal</span>
                      <span style={{ color: chartData.indicators.macd.trend === 'BULLISH' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {chartData.indicators.macd.trend}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volatility & Bands */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>BOLLINGER & ATR (14)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Upper Band</span>
                      <strong style={{ color: '#f87171' }}>${chartData.indicators.bollingerBands.upper}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Lower Band</span>
                      <strong style={{ color: '#10b981' }}>${chartData.indicators.bollingerBands.lower}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>ATR (Daily Volatility)</span>
                      <strong style={{ color: '#38bdf8' }}>${chartData.indicators.atr14}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: '#64748b' }}>RS vs S&P 500</span>
                      <strong style={{ color: '#10b981' }}>{chartData.indicators.relativeStrengthVsSpy}/100</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              กำลังโหลดชุดข้อมูล Technical Indicators...
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: SEC FILINGS (PHASE 1) */}
      {/* ========================================================================= */}
      {activeTab === 'filings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            รายงานงบการเงินและเอกสารทางการที่ยื่นต่อ U.S. Securities and Exchange Commission (SEC EDGAR) ของ <strong>{selectedStock}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {secFilings.map((filing, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span
                      style={{
                        background: filing.form === '10-K' ? 'rgba(16, 185, 129, 0.2)' : filing.form === '10-Q' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: filing.form === '10-K' ? '#10b981' : filing.form === '10-Q' ? '#60a5fa' : '#eab308',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      FORM {filing.form}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>ยื่นเมื่อ: {filing.filingDate}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 14, marginBottom: 4 }}>
                    {filing.title}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>
                    รอบระยะเวลาสิ้นสุด: {filing.periodEnded}
                  </div>
                </div>

                <a
                  href={filing.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <ExternalLink size={14} />
                  <span>เปิดอ่านเอกสารบน SEC.gov</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: 41 AGENTS REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'agents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            โครงสร้าง Multi-Agent Architecture ประกอบด้วย 41 Agents แยกหน้าที่อย่างอิสระตาม Investment Committee
          </div>

          {[
            { teamNum: 1, title: 'TEAM 1 — STOCK RANKING (10 AGENTS)', color: '#38bdf8' },
            { teamNum: 2, title: 'TEAM 2 — EQUITY RESEARCH (10 AGENTS)', color: '#10b981' },
            { teamNum: 3, title: 'TEAM 3 — RED TEAM ANALYSIS (10 AGENTS)', color: '#ef4444' },
            { teamNum: 4, title: 'TEAM 4 — TACTICAL ASSET ALLOCATION (10 AGENTS)', color: '#eab308' },
            { teamNum: 'CIO', title: 'AI-CIO — CHIEF INVESTMENT OFFICER (1 AGENT)', color: '#a855f7' },
          ].map((grp) => {
            const teamAgents = agents.filter((a) => a.team.toString() === grp.teamNum.toString());
            return (
              <div key={grp.title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: grp.color }}>{grp.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {teamAgents.map((ag) => (
                    <div
                      key={ag.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 10,
                        padding: 14,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, color: '#ffffff' }}>{ag.id}</span>
                        <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#94a3b8' }}>
                          Weight {ag.weight}x
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>{ag.name}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>{ag.thaiName}</div>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>
                        {ag.roleDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB: HARD RISK ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 16,
              color: '#fca5a5',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Shield size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong>Deterministic Hard Risk Guardrail:</strong> ระบบควบคุมความเสี่ยงเขียนด้วย Deterministic Code (ไม่ใช่ LLM)
              เพื่อป้องกันความผิดพลาดและห้ามข้ามกฎเพดานความเสี่ยงโดยเด็ดขาด
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {[
              { label: 'Max Single Position Size', value: '10.0%', desc: 'ขนาดไม้สูงสุดต่อหุ้นหนึ่งตัว' },
              { label: 'Max Portfolio Exposure', value: '90.0%', desc: 'สัดส่วนลงทุนรวมสูงสุด (ถือเงินสดขั้นต่ำ 10%)' },
              { label: 'Max Sector Exposure', value: '25.0%', desc: 'เพดานการกระจุกตัวในหมวดอุตสาหกรรมเดียว' },
              { label: 'Max Drawdown Limit', value: '12.0%', desc: 'ระดับขาดทุนสูงสุดของพอร์ตก่อนหยุดเทรด' },
              { label: 'Max Daily Loss Breaker', value: '$5,000', desc: 'ตัดวงจรเมื่อขาดทุนรายวันถึงเพดาน' },
              { label: 'Minimum Risk/Reward', value: '2.0:1', desc: 'อัตราผลตอบแทนต่อความเสี่ยงขั้นต่ำ' },
              { label: 'Max Open Positions', value: '12 Positions', desc: 'จำนวนตัวหุ้นสูงสุดที่ถือพร้อมกัน' },
              { label: 'Red Team Veto Rule', value: 'STRICT ENFORCEMENT', desc: 'หาก Red Team Veto ห้ามส่งคำสั่งทันที' },
            ].map((rule, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{rule.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginBottom: 4 }}>{rule.value}</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>{rule.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalStocksPage;
