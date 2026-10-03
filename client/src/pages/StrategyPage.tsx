import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  TrendingUp, 
  Calculator, 
  PieChart, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Clock,
  Layers,
  BarChart3,
  Plus,
  Trash2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  BookOpen,
  Database,
  ShieldCheck,
  FileEdit
} from 'lucide-react';
import { TickerData, PaperTrade, TradingJournalItem } from '../types/index.js';
import { api } from '../services/api.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { realtimeService } from '../services/realtime.js';

interface StrategyPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const StrategyPage: React.FC<StrategyPageProps> = ({ onSelectCoin, currency }) => {
  const [activeTab, setActiveTab] = useState<'dca' | 'strategies' | 'expectancy' | 'correlation' | 'paper_trading' | 'trading_journal'>('dca');
  const activeUsername = localStorage.getItem('cryptopro_active_username') || 'totokung';
  const activeRole = localStorage.getItem('cryptopro_auth_role') || 'free';

  // Trading Journal State
  const [journals, setJournals] = useState<TradingJournalItem[]>([]);
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [journalSentiment, setJournalSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE'>('BULLISH');
  const [journalSummary, setJournalSummary] = useState('');
  const [journalLessons, setJournalLessons] = useState('');
  const [journalWins, setJournalWins] = useState(0);
  const [journalLosses, setJournalLosses] = useState(0);
  const [journalNetPnl, setJournalNetPnl] = useState(0);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  
  // DCA Calculator State
  const [dcaSymbol, setDcaSymbol] = useState('BTC');
  const [dcaAmount, setDcaAmount] = useState(1000);
  const [dcaFreq, setDcaFreq] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [dcaDuration, setDcaDuration] = useState(12);
  const [dcaResult, setDcaResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Expectancy Calculator State
  const [winRate, setWinRate] = useState(55);
  const [avgWinPercent, setAvgWinPercent] = useState(6);
  const [avgLossPercent, setAvgLossPercent] = useState(2.5);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Paper Trading State
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [paperStats, setPaperStats] = useState<any>(null);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [paperToast, setPaperToast] = useState<string | null>(null);
  const [availableCoins, setAvailableCoins] = useState<TickerData[]>([]);

  // Paper Order Form State
  const [orderSymbol, setOrderSymbol] = useState('SOL');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderEntryPrice, setOrderEntryPrice] = useState('185.00');
  const [orderQty, setOrderQty] = useState('10');
  const [orderSl, setOrderSl] = useState('172.00');
  const [orderTp, setOrderTp] = useState('210.00');
  const [orderNotes, setOrderNotes] = useState('เข้าตามสัญญาณ Strong Buy ทะลุแนวต้านสำคัญ');

  const loadPaperTradingData = async () => {
    setIsLoadingPaper(true);
    try {
      const data = await api.getPaperTrades();
      if (data) {
        setPaperTrades(data.trades || []);
        setPaperStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load paper trades:', err);
    } finally {
      setIsLoadingPaper(false);
    }
  };

  const loadJournals = async () => {
    setIsLoadingJournals(true);
    try {
      const data = await api.getJournals();
      setJournals(data);
    } catch (e) {
      console.error('Failed to load journals:', e);
    } finally {
      setIsLoadingJournals(false);
    }
  };

  useEffect(() => {
    api.getCoins().then((coins) => {
      setAvailableCoins(coins);
      if (coins.length > 0) {
        const sol = coins.find((c) => c.symbol === 'SOL') || coins[0];
        setOrderSymbol(sol.symbol);
        setOrderEntryPrice(sol.price.toString());
        setOrderSl((sol.price * 0.94).toFixed(sol.price < 1 ? 4 : 2));
        setOrderTp((sol.price * 1.15).toFixed(sol.price < 1 ? 4 : 2));
      }
    });
    loadPaperTradingData();
    loadJournals();
  }, []);

  const handleAutoFillJournalFromTrades = () => {
    const closed = paperTrades.filter((t) => t.status === 'CLOSED');
    const wins = closed.filter((t) => (t.realizedPnl ?? 0) > 0).length;
    const losses = closed.filter((t) => (t.realizedPnl ?? 0) < 0).length;
    const netPnl = closed.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);
    setJournalWins(wins);
    setJournalLosses(losses);
    setJournalNetPnl(Number(netPnl.toFixed(2)));
    setJournalTitle(`สรุปผลการเทรดประจำวัน (${new Date().toLocaleDateString('th-TH')})`);
    setJournalSummary(`บันทึกคำสั่งปิด ${closed.length} ออเดอร์ (ชนะ ${wins} ไม้ / แพ้ ${losses} ไม้) ผลกำไรสุทธิ ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`);
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim()) return;
    setIsSavingJournal(true);
    try {
      await api.createJournal({
        title: journalTitle,
        tradeDate: journalDate,
        marketSentiment: journalSentiment,
        dailySummaryTh: journalSummary,
        lessonsLearned: journalLessons,
        winTrades: Number(journalWins),
        lossTrades: Number(journalLosses),
        netPnl: Number(journalNetPnl),
      });
      setPaperToast('บันทึก Trading Journal ลงใน Supabase PostgreSQL สำเร็จ!');
      setTimeout(() => setPaperToast(null), 3000);
      setIsJournalModalOpen(false);
      setJournalTitle('');
      setJournalSummary('');
      setJournalLessons('');
      await loadJournals();
    } catch (err: any) {
      alert(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSavingJournal(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm('ยืนยันการลบบันทึก Trading Journal นี้ออกจากฐานข้อมูล?')) return;
    try {
      await api.deleteJournal(id);
      setPaperToast('ลบรายการบันทึกออกจากฐานข้อมูลแล้ว');
      setTimeout(() => setPaperToast(null), 3000);
      await loadJournals();
    } catch (err: any) {
      alert(err.message || 'ลบไม่สำเร็จ');
    }
  };

  const handleSelectOrderCoin = (sym: string) => {
    setOrderSymbol(sym);
    const coin = availableCoins.find((c) => c.symbol === sym);
    if (coin) {
      setOrderEntryPrice(coin.price.toString());
      setOrderSl((coin.price * 0.94).toFixed(coin.price < 1 ? 4 : 2));
      setOrderTp((coin.price * 1.15).toFixed(coin.price < 1 ? 4 : 2));
    }
  };

  const handleOpenPaperOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    try {
      await api.openPaperTrade({
        symbol: orderSymbol,
        type: orderType,
        entryPrice: parseFloat(orderEntryPrice) || 0,
        qty: parseFloat(orderQty) || 1,
        sl: parseFloat(orderSl) || 0,
        tp: parseFloat(orderTp) || 0,
        notes: orderNotes,
        signalOrigin: 'Manual / Strategy AI',
      });
      await loadPaperTradingData();
      setOrderModalOpen(false);
      setPaperToast(`เปิดโพซิชัน ${orderType} ${orderSymbol} จำลองสำเร็จ`);
      setTimeout(() => setPaperToast(null), 3000);
    } catch (err) {
      console.error('Failed to open paper trade:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCloseTrade = async (id: string) => {
    try {
      await api.closePaperTrade(id);
      await loadPaperTradingData();
      setPaperToast('ปิดสถานะตามราคาตลาดสดเรียบร้อยแล้ว');
      setTimeout(() => setPaperToast(null), 3000);
    } catch (err) {
      console.error('Failed to close trade:', err);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      await api.deletePaperTrade(id);
      await loadPaperTradingData();
      setPaperToast('ลบรายการเทรดเรียบร้อย');
      setTimeout(() => setPaperToast(null), 2500);
    } catch (err) {
      console.error('Failed to delete trade:', err);
    }
  };

  // Run initial DCA Calculation
  const runDcaCalculation = async () => {
    setIsCalculating(true);
    try {
      const res = await api.calculateDCA({
        symbol: dcaSymbol,
        amount: dcaAmount,
        frequency: dcaFreq,
        durationMonths: dcaDuration,
      });
      setDcaResult(res);
    } catch (e) {
      console.error('Failed to calculate DCA:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    runDcaCalculation();
  }, [dcaSymbol, dcaFreq, dcaDuration]);

  // Calculate Expectancy
  const winFraction = winRate / 100;
  const lossFraction = 1 - winFraction;
  const expectancy = (winFraction * avgWinPercent) - (lossFraction * avgLossPercent);
  const profitFactor = (lossFraction * avgLossPercent) === 0 ? 99 : (winFraction * avgWinPercent) / (lossFraction * avgLossPercent);
  const rrRatio = (avgWinPercent / avgLossPercent).toFixed(1);

  // Correlation Matrix Data
  const correlationCoins = ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'AVAX'];
  const correlationMatrix: Record<string, Record<string, number>> = {
    BTC: { BTC: 1.0, ETH: 0.88, SOL: 0.76, BNB: 0.79, DOGE: 0.62, AVAX: 0.74 },
    ETH: { BTC: 0.88, ETH: 1.0, SOL: 0.81, BNB: 0.82, DOGE: 0.65, AVAX: 0.78 },
    SOL: { BTC: 0.76, ETH: 0.81, SOL: 1.0, BNB: 0.71, DOGE: 0.68, AVAX: 0.85 },
    BNB: { BTC: 0.79, ETH: 0.82, SOL: 0.71, BNB: 1.0, DOGE: 0.58, AVAX: 0.70 },
    DOGE: { BTC: 0.62, ETH: 0.65, SOL: 0.68, BNB: 0.58, DOGE: 1.0, AVAX: 0.66 },
    AVAX: { BTC: 0.74, ETH: 0.78, SOL: 0.85, BNB: 0.70, DOGE: 0.66, AVAX: 1.0 },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="card-header-row" style={{ marginBottom: 0, flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Wrench size={22} color="var(--neon-cyan)" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              เครื่องมือ &amp; กลยุทธ์การลงทุน (Strategy &amp; Quant Workstation)
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '6px',
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Database size={12} />
              <span>Supabase DB Synced</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <ShieldCheck size={12} />
              <span>ผู้ใช้: {activeUsername} ({activeRole.toUpperCase()})</span>
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            เครื่องมือวางแผนการลงทุนเชิงปริมาณ, แบบจำลอง DCA ย้อนหลัง, กลยุทธ์ AI 3 รูปแบบ และสมุดบันทึกการเทรด Trading Journal
          </p>
        </div>
      </div>

      {/* Strategy Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'dca', label: 'แบบจำลองการออมเหรียญ (DCA Simulator)', icon: Calculator },
          { id: 'strategies', label: 'กลยุทธ์เทรด AI (3 Core Strategies)', icon: Sparkles },
          { id: 'expectancy', label: 'คำนวณสถิติความได้เปรียบ (Expectancy & R:R)', icon: Percent },
          { id: 'correlation', label: 'เมทริกซ์สหสัมพันธ์ (Correlation Matrix)', icon: Layers },
          { id: 'paper_trading', label: 'พอร์ตจำลองการเทรด (Live Paper Trading)', icon: TrendingUp },
          { id: 'trading_journal', label: 'สมุดบันทึกการเทรด (Trading Journal)', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: isActive ? 'var(--neon-blue)' : 'var(--bg-card)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: isActive ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} color={isActive ? '#FFFFFF' : 'var(--neon-cyan)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: DCA Simulator */}
      {activeTab === 'dca' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="crypto-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} color="var(--neon-cyan)" />
              ตั้งค่าพารามิเตอร์จำลองการออม (DCA Inputs)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Coin Select */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  เหรียญที่ต้องการออม
                </label>
                <select
                  value={dcaSymbol}
                  onChange={(e) => setDcaSymbol(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: '#FFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    outline: 'none',
                    fontWeight: 700,
                  }}
                >
                  {['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE', 'AVAX', 'NEAR', 'SUI'].map((sym) => (
                    <option key={sym} value={sym} style={{ backgroundColor: '#0B0F19' }}>
                      {sym}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount per period */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  เงินลงทุนต่อรอบ ({currency})
                </label>
                <input
                  type="number"
                  value={dcaAmount}
                  onChange={(e) => setDcaAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: '#FFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    outline: 'none',
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* Frequency */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  ความถี่ในการซื้อ
                </label>
                <select
                  value={dcaFreq}
                  onChange={(e) => setDcaFreq(e.target.value as any)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: '#FFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    outline: 'none',
                    fontWeight: 700,
                  }}
                >
                  <option value="daily" style={{ backgroundColor: '#0B0F19' }}>ทุกวัน (Daily)</option>
                  <option value="weekly" style={{ backgroundColor: '#0B0F19' }}>ทุกสัปดาห์ (Weekly)</option>
                  <option value="monthly" style={{ backgroundColor: '#0B0F19' }}>ทุกเดือน (Monthly)</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  ระยะเวลาสะสม
                </label>
                <select
                  value={dcaDuration}
                  onChange={(e) => setDcaDuration(Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    color: '#FFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    outline: 'none',
                    fontWeight: 700,
                  }}
                >
                  <option value={3} style={{ backgroundColor: '#0B0F19' }}>3 เดือน</option>
                  <option value={6} style={{ backgroundColor: '#0B0F19' }}>6 เดือน</option>
                  <option value={12} style={{ backgroundColor: '#0B0F19' }}>1 ปี (12 เดือน)</option>
                  <option value={24} style={{ backgroundColor: '#0B0F19' }}>2 ปี (24 เดือน)</option>
                  <option value={36} style={{ backgroundColor: '#0B0F19' }}>3 ปี (36 เดือน)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={runDcaCalculation}
                disabled={isCalculating}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                {isCalculating ? 'กำลังประมวลผล...' : 'คำนวณผลลัพธ์ DCA'}
              </button>
            </div>
          </div>

          {/* DCA Result Cards */}
          {dcaResult && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="crypto-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เงินต้นสะสมรวม (Total Invested)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
                  {prefix}{dcaResult.totalInvested.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  จำนวน {dcaResult.periods} รอบการซื้อ
                </div>
              </div>

              <div className="crypto-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>มูลค่าพอร์ตปัจจุบัน (Portfolio Value)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>
                  {prefix}{dcaResult.finalValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--neon-green-light)', marginTop: '2px' }}>
                  สะสมได้ {dcaResult.accumulatedCoins} {dcaSymbol}
                </div>
              </div>

              <div className="crypto-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>กำไรสุทธิ (Net Profit)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: dcaResult.netProfit >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', marginTop: '4px' }}>
                  {dcaResult.netProfit >= 0 ? `+${prefix}` : `-${prefix}`}
                  {Math.abs(dcaResult.netProfit).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: dcaResult.netProfit >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', marginTop: '2px' }}>
                  ผลตอบแทน {dcaResult.roi > 0 ? `+${dcaResult.roi}%` : `${dcaResult.roi}%`}
                </div>
              </div>

              <div className="crypto-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ต้นทุนเฉลี่ย (Avg Cost) vs ตลาด</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
                  ${dcaResult.averageCost.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', marginTop: '2px' }}>
                  ราคาตลาด: ${dcaResult.currentPrice.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* DCA Timeline Progress */}
          {dcaResult && dcaResult.history && (
            <div className="crypto-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={16} color="var(--neon-cyan)" />
                ตารางบันทึกการเติบโตตามช่วงเวลา (Milestone Progression)
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>รอบที่ (Period)</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>เงินต้นสะสม</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>มูลค่าพอร์ต</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>กำไร / ขาดทุน</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcaResult.history.map((step: any, idx: number) => {
                      const profit = step.value - step.invested;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>รอบที่ {step.period}</td>
                          <td style={{ textAlign: 'right', padding: '10px 8px' }}>{prefix}{step.invested.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, color: '#60A5FA' }}>
                            {prefix}{step.value.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 8px', color: profit >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', fontWeight: 700 }}>
                            {profit >= 0 ? `+${prefix}` : `-${prefix}`}{Math.abs(profit).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', padding: '10px 8px' }}>
                            <span className="badge badge-strong-buy" style={{ fontSize: '10px' }}>สะสมต่อเนื่อง</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 3 Core AI Strategies */}
      {activeTab === 'strategies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Strategy 1 */}
          <div className="crypto-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-strong-buy">Trend Following</span>
              <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: 700 }}>Win Rate: ~74% | R:R 1:2.8</span>
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>1. เล่นตามแนวโน้มใหญ่ (Follow Trend)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                กลยุทธ์หลักสำหรับ Run Trend ยาวในรอบ Bull Market เข้าซื้อเมื่อโครงสร้างราคายืนยันขาขึ้นสมบูรณ์แบบ
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', lineHeight: 1.6 }}>
              <div><strong>เงื่อนไขการเข้า (Entry):</strong> EMA 20 &gt; EMA 50 &gt; EMA 200, MACD &gt; 0, ADX &gt; 25</div>
              <div><strong>จุดตัดขาดทุน (SL):</strong> ปิดแท่ง 4H หลุดต่ำกว่าเส้น EMA 50 หรือ 2 ATR</div>
              <div><strong>เป้าหมายกำไร (TP):</strong> Trailing Stop ตามเส้น EMA 20 ไปเรื่อยๆ จนกว่าโครงสร้างจะเสีย</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เหรียญที่ตรงเกณฑ์: <strong>BTC, ETH, SOL</strong></span>
              <button onClick={() => onSelectCoin('SOL')} className="btn-secondary" style={{ fontSize: '11px' }}>
                ดูกราฟ SOL <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Strategy 2 */}
          <div className="crypto-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-buy">Swing Trading</span>
              <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: 700 }}>Win Rate: ~68% | R:R 1:2.2</span>
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>2. ซื้อแนวรับ ขายแนวต้าน (Swing Trade)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                ดักซื้อจังหวะย่อตัวในกรอบแนวรับสำคัญ (Buy the Dips) เมื่อราคาเหรียญคุณภาพดีมีการ Pullback ชั่วคราว
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', lineHeight: 1.6 }}>
              <div><strong>เงื่อนไขการเข้า (Entry):</strong> ราคา Pullback แตะแนวรับ S1 หรือ Fibonacci 0.618, RSI 35-45</div>
              <div><strong>จุดตัดขาดทุน (SL):</strong> หลุดแนวรับ S2 (ต่ำกว่าจุดกลับตัว 1.5%)</div>
              <div><strong>เป้าหมายกำไร (TP):</strong> แนวต้าน R1 และ R2 โดยแบ่งไม้ Take Profit 50/50</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เหรียญที่ตรงเกณฑ์: <strong>SUI, AVAX, NEAR</strong></span>
              <button onClick={() => onSelectCoin('SUI')} className="btn-secondary" style={{ fontSize: '11px' }}>
                ดูกราฟ SUI <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Strategy 3 */}
          <div className="crypto-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-retest">Breakout Momentum</span>
              <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: 700 }}>Win Rate: ~61% | R:R 1:3.5</span>
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>3. เก็งกำไรจังหวะทะลุ (Breakout)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                เข้าซื้อทันทีที่ราคาเบรกทะลุกรอบสะสมพลัง (Consolidation) พร้อมกับ Volume พุ่งกระฉูดกว่าปกติ
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', lineHeight: 1.6 }}>
              <div><strong>เงื่อนไขการเข้า (Entry):</strong> ทะลุ Resistance สูงสุด 20 วัน + Volume พุ่งเกิน 200%</div>
              <div><strong>จุดตัดขาดทุน (SL):</strong> วกกลับเข้ามาปิดแท่งใต้กรอบแนวต้านเดิม (Fakeout Stop)</div>
              <div><strong>เป้าหมายกำไร (TP):</strong> วัดระยะความสูงของกรอบสะสมเดิมขยายตัวขึ้นไป 100%-161.8%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เหรียญที่ตรงเกณฑ์: <strong>DOGE, PEPE, FET</strong></span>
              <button onClick={() => onSelectCoin('DOGE')} className="btn-secondary" style={{ fontSize: '11px' }}>
                ดูกราฟ DOGE <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Statistical Expectancy & R:R Matrix */}
      {activeTab === 'expectancy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="crypto-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={18} color="var(--neon-cyan)" />
              เครื่องมือคำนวณความได้เปรียบทางสถิติ (Expectancy Engine)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  อัตราความแม่นยำ (Win Rate): <strong>{winRate}%</strong>
                </label>
                <input
                  type="range"
                  min={25}
                  max={85}
                  value={winRate}
                  onChange={(e) => setWinRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3B82F6' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  กำไรเฉลี่ยต่อไม้ที่ชนะ (Avg Win %): <strong>+{avgWinPercent}%</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={0.5}
                  value={avgWinPercent}
                  onChange={(e) => setAvgWinPercent(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10B981' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  ขาดทุนเฉลี่ยต่อไม้ที่แพ้ (Avg Loss %): <strong>-{avgLossPercent}%</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={avgLossPercent}
                  onChange={(e) => setAvgLossPercent(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#EF4444' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '18px' }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk : Reward Ratio</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--neon-cyan)', marginTop: '2px' }}>
                  1 : {rrRatio}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ความคุ้มค่าของการเสี่ยง</div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit Factor</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: profitFactor >= 1.5 ? 'var(--neon-green-light)' : 'var(--neon-red)', marginTop: '2px' }}>
                  {profitFactor.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: profitFactor >= 1.5 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                  {profitFactor >= 2.0 ? 'ยอดเยี่ยมมาก' : profitFactor >= 1.5 ? 'ได้เปรียบตลาด' : 'ความเสี่ยงสูง'}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expectancy per Trade</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: expectancy > 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', marginTop: '2px' }}>
                  {expectancy > 0 ? `+${expectancy.toFixed(2)}%` : `${expectancy.toFixed(2)}%`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ผลตอบแทนที่คาดหวังต่อ 1 ไม้</div>
              </div>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="crypto-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>
              เปรียบเทียบสถิติผลตอบแทน 100 ไม้ (Why R:R beats Win Rate)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              ความลับของนักลงทุนเชิงปริมาณ: Win Rate ต่ำแต่ R:R สูง ให้ผลลัพธ์พอร์ตเติบโตเร็วกว่าการเน้น Win Rate สูงแต่เสียคำโต
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>รูปแบบระบบ</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Win Rate</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Risk : Reward</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Expectancy/ไม้</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>กำไรสุทธิ 100 ไม้</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>เทรดตามอารมณ์ (Win บ่อยแต่แพ้หนัก)</td>
                  <td style={{ textAlign: 'center', color: '#60A5FA' }}>75%</td>
                  <td style={{ textAlign: 'center', color: '#EF4444' }}>1 : 0.4</td>
                  <td style={{ textAlign: 'right', color: '#EF4444' }}>-0.50%</td>
                  <td style={{ textAlign: 'right', color: '#EF4444', fontWeight: 800 }}>-50.0% (ล้างพอร์ต)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>CryptoPro AI Swing Trader</td>
                  <td style={{ textAlign: 'center', color: '#60A5FA' }}>55%</td>
                  <td style={{ textAlign: 'center', color: '#10B981' }}>1 : 2.0</td>
                  <td style={{ textAlign: 'right', color: '#10B981' }}>+0.65%</td>
                  <td style={{ textAlign: 'right', color: '#10B981', fontWeight: 800 }}>+65.0% (เติบโตดี)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>CryptoPro AI Trend Runner</td>
                  <td style={{ textAlign: 'center', color: '#60A5FA' }}>45%</td>
                  <td style={{ textAlign: 'center', color: '#10B981' }}>1 : 3.0</td>
                  <td style={{ textAlign: 'right', color: '#10B981' }}>+0.80%</td>
                  <td style={{ textAlign: 'right', color: '#10B981', fontWeight: 800 }}>+80.0% (ผลตอบแทนสูงสุด)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Correlation Matrix */}
      {activeTab === 'correlation' && (
        <div className="crypto-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--neon-cyan)" />
            เมทริกซ์สหสัมพันธ์ระหว่างเหรียญหลัก (Crypto Correlation Matrix 30D)
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            ค่าความสัมพันธ์ระหว่าง -1.0 ถึง +1.0 (ค่าใกล้ 1.0 คือวิ่งตามกัน, ค่าต่ำกว่า 0.6 ช่วยกระจายความเสี่ยงพอร์ตได้ดีขึ้น)
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>เหรียญ</th>
                  {correlationCoins.map((c) => (
                    <th key={c} style={{ padding: '10px' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationCoins.map((rowCoin) => (
                  <tr key={rowCoin} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px', textAlign: 'left', fontWeight: 800, color: '#FFF' }}>{rowCoin}</td>
                    {correlationCoins.map((colCoin) => {
                      const val = correlationMatrix[rowCoin][colCoin];
                      const isSelf = rowCoin === colCoin;
                      const bg = isSelf 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : val >= 0.8 
                        ? 'rgba(59, 130, 246, 0.18)' 
                        : val >= 0.7 
                        ? 'rgba(6, 182, 212, 0.15)' 
                        : 'rgba(16, 185, 129, 0.12)';
                      return (
                        <td key={colCoin} style={{ padding: '10px', backgroundColor: bg, fontWeight: 700, color: isSelf ? '#FFF' : '#E2E8F0' }}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.06)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '12px', color: '#CBD5E1' }}>
            💡 <strong>คำแนะนำเชิงปริมาณ:</strong> การถือครอง Bitcoin (BTC) คู่กับ Ethereum (ETH) มีค่า Correlation สูงถึง 0.88 ทำให้การกระจายความเสี่ยงต่ำ หากต้องการกระจายความเสี่ยงที่แท้จริง ควรแบ่งสัดส่วนไปยังกลุ่มเหรียญที่มีสหสัมพันธ์ต่ำกว่า เช่น DePIN หรือ Meme (Correlation ~0.58 - 0.62) ควบคู่กับการคุม Position Sizing เสมอ
          </div>
        </div>
      )}

      {/* Tab 5: Live Paper Trading Simulation */}
      {activeTab === 'paper_trading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toast Notification */}
          {paperToast && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: 'var(--neon-green-light)',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={16} color="#10B981" />
              <span>{paperToast}</span>
            </div>
          )}

          {/* Performance Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="crypto-card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>อัตราชนะ (Win Rate)</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '4px' }}>
                {paperStats?.winRatePct ?? 0}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                จากทั้งหมด {paperStats?.closedTradesCount ?? 0} ออเดอร์ที่ปิดแล้ว
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit Factor</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--neon-green-light)', marginTop: '4px' }}>
                {paperStats?.profitFactor ?? 0}x
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                อัตราส่วนกำไรเทียบขาดทุน
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>กำไรสุทธิรวม (Total Combined PnL)</div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: (paperStats?.totalPnlCombined ?? 0) >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  marginTop: '4px',
                }}
              >
                {(paperStats?.totalPnlCombined ?? 0) >= 0 ? '+' : ''}
                {prefix}{((paperStats?.totalPnlCombined ?? 0) * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Realized: {prefix}{((paperStats?.totalRealizedPnl ?? 0) * multiplier).toFixed(2)} | Unrealized: {prefix}{((paperStats?.totalUnrealizedPnl ?? 0) * multiplier).toFixed(2)}
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>สถานะที่เปิดอยู่ (Active Open)</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#60A5FA', marginTop: '4px' }}>
                {paperStats?.openTradesCount ?? 0} โพซิชัน
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                กำลังติดตามราคา Real-time
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => setOrderModalOpen(true)}
              className="btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 16px', gap: '6px' }}
            >
              <Plus size={15} />
              <span>เปิดออเดอร์จำลองใหม่ (+ New Order)</span>
            </button>

            <button
              onClick={loadPaperTradingData}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
              disabled={isLoadingPaper}
            >
              <RefreshCw size={13} className={isLoadingPaper ? 'spin' : ''} />
              <span>{isLoadingPaper ? 'กำลังอัปเดต...' : 'รีเฟรชราคาโพซิชัน'}</span>
            </button>
          </div>

          {/* New Order Modal / Drawer */}
          {orderModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(5, 8, 15, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              onClick={() => setOrderModalOpen(false)}
            >
              <div
                className="crypto-card"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  padding: '24px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--neon-cyan)" />
                  เปิดโพซิชันเทรดจำลอง (New Paper Order)
                </div>

                <form onSubmit={handleOpenPaperOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        เลือกเหรียญ:
                      </label>
                      <select
                        value={orderSymbol}
                        onChange={(e) => handleSelectOrderCoin(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                      >
                        {availableCoins.map((c) => (
                          <option key={c.symbol} value={c.symbol}>
                            {c.symbol} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        ทิศทาง (Order Type):
                      </label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as any)}
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                      >
                        <option value="BUY">🟢 BUY (Long)</option>
                        <option value="SELL">🔴 SELL (Short)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        ราคาเข้า (Entry Price USDT):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={orderEntryPrice}
                        onChange={(e) => setOrderEntryPrice(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        จำนวนเหรียญ (Quantity):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={orderQty}
                        onChange={(e) => setOrderQty(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Stop Loss (ราคาตัดขาดทุน):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={orderSl}
                        onChange={(e) => setOrderSl(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Take Profit (ราคาทำกำไร):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={orderTp}
                        onChange={(e) => setOrderTp(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      บันทึกเหตุผลการเข้าเทรด (Trading Notes):
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="เช่น เบรคเส้นเทรนด์ไลน์พร้อม Volume พุ่ง"
                      style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setOrderModalOpen(false)}
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {isSubmittingOrder ? 'กำลังบันทึก...' : 'ยืนยันเปิดออเดอร์'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Active Open Positions Table */}
          <div className="crypto-card">
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>
                โพซิชันที่กำลังเปิดอยู่ (Active Open Positions)
              </div>
              <span style={{ fontSize: '11px', color: 'var(--neon-green-light)', fontWeight: 700 }}>
                ● คำนวณ PnL ตามราคา Real-time
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>เหรียญ</th>
                    <th>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>ราคาเข้า (Entry)</th>
                    <th style={{ textAlign: 'right' }}>ราคาปัจจุบัน</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'right' }}>SL / TP</th>
                    <th style={{ textAlign: 'right' }}>กำไร/ขาดทุน (Unrealized)</th>
                    <th style={{ textAlign: 'center' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {paperTrades.filter((t) => t.status === 'OPEN').length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        ยังไม่มีโพซิชันที่เปิดอยู่ กดปุ่ม "+ เปิดออเดอร์จำลองใหม่" เพื่อเริ่มทดสอบกลยุทธ์
                      </td>
                    </tr>
                  ) : (
                    paperTrades
                      .filter((t) => t.status === 'OPEN')
                      .map((trade) => {
                        const isProfit = (trade.unrealizedPnl ?? 0) >= 0;
                        return (
                          <tr key={trade.id} onClick={() => onSelectCoin(trade.symbol)} style={{ cursor: 'pointer' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ color: '#FFF' }}>{trade.symbol}</strong>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{trade.notes}</span>
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: trade.type === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: trade.type === 'BUY' ? 'var(--neon-green-light)' : 'var(--neon-red)',
                                }}
                              >
                                {trade.type}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {prefix}{(trade.entryPrice * multiplier).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#FFF' }}>
                              {prefix}{(trade.currentPrice * multiplier).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </td>
                            <td style={{ textAlign: 'right' }}>{trade.qty}</td>
                            <td style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                              SL: {prefix}{(trade.sl * multiplier).toFixed(2)} | TP: {prefix}{(trade.tp * multiplier).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                              {isProfit ? '+' : ''}{prefix}{((trade.unrealizedPnl ?? 0) * multiplier).toFixed(2)} ({isProfit ? '+' : ''}{trade.unrealizedPnlPct?.toFixed(2)}%)
                            </td>
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleCloseTrade(trade.id)}
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  color: 'var(--neon-amber)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                ปิดออเดอร์
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closed Trades History Table */}
          <div className="crypto-card">
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>
                ประวัติออเดอร์ที่ปิดแล้ว (Closed History)
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>เหรียญ</th>
                    <th>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>ราคาเข้า</th>
                    <th style={{ textAlign: 'right' }}>ราคาปิด (Exit)</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'right' }}>กำไรที่รับรู้ (Realized PnL)</th>
                    <th style={{ textAlign: 'center' }}>ผลลัพธ์</th>
                    <th style={{ textAlign: 'center' }}>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {paperTrades.filter((t) => t.status === 'CLOSED').length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        ยังไม่มีประวัติออเดอร์ที่ปิด
                      </td>
                    </tr>
                  ) : (
                    paperTrades
                      .filter((t) => t.status === 'CLOSED')
                      .map((trade) => {
                        const isProfit = (trade.realizedPnl ?? 0) >= 0;
                        return (
                          <tr key={trade.id}>
                            <td><strong style={{ color: '#FFF' }}>{trade.symbol}</strong></td>
                            <td>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: trade.type === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: trade.type === 'BUY' ? 'var(--neon-green-light)' : 'var(--neon-red)',
                                }}
                              >
                                {trade.type}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {prefix}{(trade.entryPrice * multiplier).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#FFF' }}>
                              {prefix}{((trade.closePrice ?? trade.currentPrice) * multiplier).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right' }}>{trade.qty}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                              {isProfit ? '+' : ''}{prefix}{((trade.realizedPnl ?? 0) * multiplier).toFixed(2)} ({isProfit ? '+' : ''}{trade.realizedPnlPct?.toFixed(2)}%)
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: isProfit ? '#34D399' : '#F87171',
                                }}
                              >
                                {isProfit ? 'WIN' : 'LOSS'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteTrade(trade.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                title="ลบประวัติรายการนี้"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
      {/* Tab 6: Trading Journal (Supabase PostgreSQL) */}
      {activeTab === 'trading_journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--neon-cyan)" />
                <span>สมุดบันทึกประวัติและบทเรียนการเทรด (Trading Journal & Psychology)</span>
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                บันทึกแผน อารมณ์ และบทเรียนที่ได้จากการเทรด จัดเก็บถาวรในตาราง <code>public.trading_journals</code>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  handleAutoFillJournalFromTrades();
                  setIsJournalModalOpen(true);
                }}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '7px 12px', gap: '6px' }}
              >
                <span>⚡ ดึงสถิติจาก Paper Trades อัตโนมัติ</span>
              </button>
              <button
                onClick={() => setIsJournalModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: '12.5px', padding: '7px 14px', gap: '6px' }}
              >
                <Plus size={15} />
                <span>เพิ่มบันทึกใหม่</span>
              </button>
            </div>
          </div>

          {/* Journal Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>จำนวนบันทึกทั้งหมด</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '4px' }}>
                {journals.length} รายการ
              </div>
            </div>

            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ออเดอร์ที่ชนะบันทึกไว้</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--neon-green-light)', marginTop: '4px' }}>
                {journals.reduce((sum, j) => sum + j.winTrades, 0)} ไม้
              </div>
            </div>

            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ออเดอร์ที่แพ้บันทึกไว้</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--neon-red)', marginTop: '4px' }}>
                {journals.reduce((sum, j) => sum + j.lossTrades, 0)} ไม้
              </div>
            </div>

            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>กำไร/ขาดทุนสุทธิที่บันทึก</div>
              {(() => {
                const total = journals.reduce((sum, j) => sum + j.netPnl, 0);
                return (
                  <div style={{ fontSize: '22px', fontWeight: 900, color: total >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', marginTop: '4px' }}>
                    {total >= 0 ? '+' : ''}{prefix}{(total * multiplier).toFixed(2)}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Journal Entries List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {journals.length === 0 ? (
              <div className="crypto-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                ยังไม่มีบันทึก Trading Journal ในฐานข้อมูล — คลิกปุ่ม "เพิ่มบันทึกใหม่" หรือ "ดึงสถิติจาก Paper Trades"
              </div>
            ) : (
              journals.map((journal) => (
                <div
                  key={journal.id}
                  className="crypto-card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              journal.marketSentiment === 'BULLISH'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : journal.marketSentiment === 'BEARISH'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color:
                              journal.marketSentiment === 'BULLISH'
                                ? '#34D399'
                                : journal.marketSentiment === 'BEARISH'
                                ? '#F87171'
                                : '#FBBF24',
                          }}
                        >
                          {journal.marketSentiment}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          📅 {new Date(journal.tradeDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#FFF', margin: '6px 0 0 0' }}>
                        {journal.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Win: {journal.winTrades} | Loss: {journal.lossTrades}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: journal.netPnl >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                          {journal.netPnl >= 0 ? '+' : ''}{prefix}{(journal.netPnl * multiplier).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteJournal(journal.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="ลบบันทึกนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {journal.dailySummaryTh && (
                    <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
                      {journal.dailySummaryTh}
                    </div>
                  )}

                  {journal.lessonsLearned && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '12px',
                        color: '#FDE68A',
                        lineHeight: '1.4',
                      }}
                    >
                      💡 <strong>บทเรียนที่ได้:</strong> {journal.lessonsLearned}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Modal: New Journal Entry */}
          {isJournalModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
              }}
              onClick={() => setIsJournalModalOpen(false)}
            >
              <div
                className="crypto-card"
                style={{
                  width: '100%',
                  maxWidth: '540px',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={20} color="var(--neon-cyan)" />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFF' }}>
                      บันทึก Trading Journal ใหม่
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsJournalModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveJournal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        วันที่เทรด (Date)
                      </label>
                      <input
                        type="date"
                        value={journalDate}
                        onChange={(e) => setJournalDate(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        สภาวะตลาด (Market Sentiment)
                      </label>
                      <select
                        value={journalSentiment}
                        onChange={(e) => setJournalSentiment(e.target.value as any)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '12.5px', outline: 'none' }}
                      >
                        <option value="BULLISH" style={{ backgroundColor: '#0F172A' }}>🟢 BULLISH (ขาขึ้น)</option>
                        <option value="BEARISH" style={{ backgroundColor: '#0F172A' }}>🔴 BEARISH (ขาลง)</option>
                        <option value="NEUTRAL" style={{ backgroundColor: '#0F172A' }}>🟡 NEUTRAL (ไซด์เวย์)</option>
                        <option value="VOLATILE" style={{ backgroundColor: '#0F172A' }}>⚡ VOLATILE (ผันผวนสูง)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      หัวข้อบันทึก (Title) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น บันทึกการเข้าเทรด SOL และ BTC ตามสัญญาณ Breakout"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--neon-green-light)', display: 'block', marginBottom: '4px' }}>
                        ไม้ที่ชนะ (Wins)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={journalWins}
                        onChange={(e) => setJournalWins(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--neon-red)', display: 'block', marginBottom: '4px' }}>
                        ไม้ที่แพ้ (Losses)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={journalLosses}
                        onChange={(e) => setJournalLosses(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        กำไรสุทธิ ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={journalNetPnl}
                        onChange={(e) => setJournalNetPnl(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      สรุปแผนและการปฏิบัติ (Daily Summary)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="อธิบายเหตุการณ์ จังหวะที่เข้า และการปฏิบัติตามวินัย"
                      value={journalSummary}
                      onChange={(e) => setJournalSummary(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', fontSize: '12.5px', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#FBBF24', display: 'block', marginBottom: '4px' }}>
                      สิ่งที่ได้เรียนรู้ / ข้อผิดพลาดที่ต้องระวัง (Lessons Learned)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="เช่น อารมณ์ FOMO ตอนราคาพุ่ง, ควรรอสัญญาณ Re-test ก่อนเข้า"
                      value={journalLessons}
                      onChange={(e) => setJournalLessons(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.05)', color: '#FFF', fontSize: '12.5px', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsJournalModalOpen(false)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12.5px' }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingJournal}
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '12.5px' }}
                    >
                      {isSavingJournal ? 'กำลังบันทึก...' : 'บันทึกลงฐานข้อมูล'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
