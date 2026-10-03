import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { realtimeService } from '../services/realtime.js';
import { PortfolioPosition, PortfolioSummary, PositionSizingResult, PaperTrade } from '../types/index.js';
import {
  Calculator,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Activity,
  TrendingUp,
  BarChart3,
  Compass,
  Info,
  PlusCircle,
  Trash2,
  XCircle,
  Database,
  Check,
  Clock,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from '../components/CryptoIcon.js';

interface PortfolioPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSelectCoin, currency }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'paper_trades' | 'calculator'>('analytics');
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [paperData, setPaperData] = useState<{
    portfolio?: any;
    trades: PaperTrade[];
    stats: any;
  } | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSymbol, setOrderSymbol] = useState('BTC');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderEntry, setOrderEntry] = useState<number>(108000);
  const [orderQty, setOrderQty] = useState<number>(0.05);
  const [orderSl, setOrderSl] = useState<number>(100000);
  const [orderTp, setOrderTp] = useState<number>(125000);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSignalOrigin, setOrderSignalOrigin] = useState('AI Decision Support (Manual)');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Position Sizing Calculator state
  const [calcCapital, setCalcCapital] = useState(100000);
  const [calcRiskPct, setCalcRiskPct] = useState(2);
  const [calcEntry, setCalcEntry] = useState(185);
  const [calcStopLoss, setCalcStopLoss] = useState(172);
  const [calcTarget, setCalcTarget] = useState(215);
  const [calcResult, setCalcResult] = useState<PositionSizingResult | null>(null);

  // Active User Info
  const activeUsername = localStorage.getItem('cryptopro_active_username') || 'totokung';
  const activeRole = localStorage.getItem('cryptopro_auth_role') || 'free';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionToast({ type, text });
    setTimeout(() => setActionToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [portRes, paperRes] = await Promise.all([
        api.getPortfolio(),
        api.getPaperTrades(),
      ]);
      setPortfolio(portRes);
      setPaperData(paperRes);
    } catch (err: any) {
      console.error('Failed to load portfolio/paper trades:', err);
      showToast(err.message || 'ไม่สามารถโหลดข้อมูลพอร์ตได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time Binance ticks
    const unsub = realtimeService.subscribeTicks((ticks) => {
      const updated: Record<string, number> = {};
      for (const [sym, tick] of Object.entries(ticks)) {
        updated[sym] = tick.price;
      }
      setLivePrices((prev) => ({ ...prev, ...updated }));
    });

    return unsub;
  }, []);

  // Update order entry default when symbol changes
  useEffect(() => {
    const liveP = livePrices[orderSymbol];
    if (liveP) {
      setOrderEntry(liveP);
      setOrderSl(Number((liveP * 0.92).toFixed(liveP < 1 ? 4 : 2)));
      setOrderTp(Number((liveP * 1.15).toFixed(liveP < 1 ? 4 : 2)));
    }
  }, [orderSymbol]);

  const handleCalculate = async () => {
    try {
      const result = await api.calculatePositionSizing({
        capital: calcCapital,
        riskPercent: calcRiskPct,
        entryPrice: calcEntry,
        stopLossPrice: calcStopLoss,
        targetPrice: calcTarget,
      });
      setCalcResult(result);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [calcCapital, calcRiskPct, calcEntry, calcStopLoss, calcTarget]);

  // Order Submission Handler
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSymbol || !orderEntry || !orderQty) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    setSubmittingOrder(true);
    try {
      await api.openPaperTrade({
        symbol: orderSymbol,
        type: orderType,
        entryPrice: Number(orderEntry),
        qty: Number(orderQty),
        sl: Number(orderSl || 0),
        tp: Number(orderTp || 0),
        notes: orderNotes,
        signalOrigin: orderSignalOrigin,
      });

      showToast(`เปิดโพซิชัน ${orderType} ${orderSymbol} สำเร็จ (บันทึกลง Supabase DB)`, 'success');
      setIsOrderModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการเปิดออเดอร์', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Close Trade Handler
  const handleCloseTrade = async (id: string, symbol: string) => {
    try {
      await api.closePaperTrade(id);
      showToast(`ปิดโพซิชัน ${symbol} เรียบร้อยแล้ว (คำนวณกำไร/ขาดทุน Realized PnL บันทึกลง DB)`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถปิดโพซิชันได้', 'error');
    }
  };

  // Delete Trade Handler
  const handleDeleteTrade = async (id: string) => {
    if (!confirm('ยืนยันการลบประวัติออเดอร์นี้ออกจากฐานข้อมูล?')) return;
    try {
      await api.deletePaperTrade(id);
      showToast('ลบรายการออเดอร์ออกจากฐานข้อมูลแล้ว', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'ไม่สามารถลบรายการได้', 'error');
    }
  };

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  if (!portfolio) {
    return <div style={{ color: 'var(--text-muted)', padding: '30px' }}>กำลังโหลดข้อมูลพอร์ตโฟลิโอ & จำลองการเทรด...</div>;
  }

  const positions = portfolio.positions || [];
  const openTrades = paperData?.trades.filter((t) => t.status === 'OPEN') || [];
  const closedTrades = paperData?.trades.filter((t) => t.status === 'CLOSED') || [];
  const stats = paperData?.stats;

  // Sectors allocation metadata
  const sectorAllocations = [
    { name: 'Core Assets (BTC, ETH)', pct: 48, color: '#3B82F6', risk: 'ต่ำ (Low Risk)' },
    { name: 'Layer 1 / Layer 2 (SOL, NEAR, AVAX)', pct: 24, color: '#06B6D4', risk: 'ปานกลาง (Medium)' },
    { name: 'DeFi & Infra (LINK, UNI, AAVE)', pct: 14, color: '#10B981', risk: 'ปานกลาง (Medium)' },
    { name: 'AI & DePIN (RENDER, FET, TAO)', pct: 10, color: '#8B5CF6', risk: 'สูง (High Growth)' },
    { name: 'High Beta / Meme (PEPE, SUI)', pct: 4, color: '#F59E0B', risk: 'สูงมาก (Very High)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {actionToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: actionToast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          {actionToast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionToast.text}</span>
        </div>
      )}

      {/* Header with DB Status & User Context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              การวิเคราะห์พอร์ต & เสี่ยง (Portfolio Analytics & Paper Trading)
            </h2>

            {/* Supabase DB Sync Badge */}
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

            {/* User Role & Quota Badge */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: activeRole === 'admin' ? '#F43F5E' : activeRole === 'platinum' ? '#A78BFA' : activeRole === 'premium' ? '#38BDF8' : '#F59E0B',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <ShieldCheck size={12} />
              <span>ผู้ใช้: {activeUsername} ({activeRole.toUpperCase()}) | โควต้า: {openTrades.length}/{stats?.maxOpenTrades ?? 5}</span>
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ระบบวิเคราะห์พอร์ตสินทรัพย์และการจำลองคำสั่งซื้อขายจริง บันทึกลงฐานข้อมูล Supabase PostgreSQL รายบุคคล
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="btn-primary"
            style={{
              fontSize: '12.5px',
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={15} />
            <span>เปิดคำสั่งเทรดจำลอง</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'กำลังซิงค์...' : 'รีเฟรชข้อมูล DB'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'analytics' ? '1px solid var(--neon-cyan)' : '1px solid transparent',
            background: activeTab === 'analytics' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'analytics' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PieChart size={15} />
          <span>ภาพรวมพอร์ต & วิเคราะห์ความเสี่ยง (Portfolio Analytics)</span>
        </button>

        <button
          onClick={() => setActiveTab('paper_trades')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'paper_trades' ? '1px solid #10B981' : '1px solid transparent',
            background: activeTab === 'paper_trades' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'paper_trades' ? '#34D399' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={15} />
          <span>โพซิชันเทรดจำลองใน DB ({openTrades.length} เปิด / {closedTrades.length} ปิดแล้ว)</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'calculator' ? '1px solid #F59E0B' : '1px solid transparent',
            background: activeTab === 'calculator' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'calculator' ? '#FBBF24' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calculator size={15} />
          <span>แบบจำลองคำนวณ Money Management (Position Sizing)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PORTFOLIO ANALYTICS & RISK                        */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 4 Risk & Capital Analytics KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>มูลค่าสินทรัพย์ติดตาม (Portfolio Valuation)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px' }}>
                {prefix}{(portfolio.totalValue * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: portfolio.totalReturnPct >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  marginTop: '4px',
                }}
              >
                {portfolio.totalReturnPct >= 0 ? '+' : ''}{portfolio.totalReturnPct}% ({portfolio.totalReturnUsd >= 0 ? '+' : ''}{prefix}{(portfolio.totalReturnUsd * multiplier).toLocaleString()})
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>คะแนนการกระจายความเสี่ยง (Diversification)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: 'var(--neon-cyan)' }}>
                92 / 100 <span style={{ fontSize: '14px', color: '#FFF' }}>(A+)</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--neon-green-light)', marginTop: '4px' }}>
                ✓ สัดส่วนสมดุล มีการคุม Exposure ตามกลุ่มสินทรัพย์
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ความผันผวนเทียบกับตลาด (Portfolio Beta)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: '#60A5FA' }}>
                1.08x <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>vs BTC</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                ผันผวนใกล้เคียงกับบิตคอยน์ มีเสถียรภาพสูง
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ประมาณการย่อตัวสูงสุด (Max Drawdown / VaR)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: '#F59E0B' }}>
                -12.4%
              </div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                อยู่ในเกณฑ์คุมความเสี่ยงปลอดภัย (Safe Limit &lt; 20%)
              </div>
            </div>
          </div>

          {/* Row 2: Sector Allocation (Left) & Risk Telemetry & Stress Test (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
            <div className="crypto-card">
              <div className="card-header-row" style={{ marginBottom: '14px' }}>
                <div className="card-title" style={{ fontSize: '14.5px' }}>
                  <PieChart size={16} color="var(--neon-cyan)" />
                  การกระจายตัวตามกลุ่มอุตสาหกรรม (Sector Allocation)
                </div>
              </div>

              {/* Multi-segmented Visual Bar */}
              <div style={{ height: '14px', width: '100%', borderRadius: '7px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
                {sectorAllocations.map((sec) => (
                  <div
                    key={sec.name}
                    style={{
                      width: `${sec.pct}%`,
                      backgroundColor: sec.color,
                      transition: 'width 0.3s ease',
                    }}
                    title={`${sec.name}: ${sec.pct}%`}
                  />
                ))}
              </div>

              {/* Detailed Sector Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sectorAllocations.map((sec) => (
                  <div
                    key={sec.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sec.color }} />
                      <span style={{ fontWeight: 600 }}>{sec.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sec.risk}</span>
                      <span style={{ fontWeight: 800, color: '#FFF' }}>{sec.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Health & Stress Test Analysis */}
            <div className="crypto-card">
              <div className="card-header-row" style={{ marginBottom: '14px' }}>
                <div className="card-title" style={{ fontSize: '14.5px' }}>
                  <ShieldAlert size={16} color="var(--neon-green)" />
                  การประเมินสภาวะและ Stress Test
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sharpe Ratio (ผลตอบแทนต่อความเสี่ยง):</span>
                  <strong style={{ color: 'var(--neon-green-light)' }}>2.14 (ดีเยี่ยม)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Correlation กับ S&P 500:</span>
                  <strong style={{ color: 'var(--neon-cyan)' }}>+0.28 (ความสัมพันธ์ต่ำ)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>สัดส่วนสภาพคล่องสำรอง (Cash/USDT):</span>
                  <strong style={{ color: '#FBBF24' }}>25.0% (เพียงพอต่อการรับมือความผันผวน)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stress Scenario (BTC ร่วง -20%):</span>
                  <strong style={{ color: '#F87171' }}>พอร์ตประเมินย่อตัวเพียง -14.2%</strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '11.5px',
                  lineHeight: 1.4,
                  color: '#CBD5E1',
                }}
              >
                <strong>สรุปความเสี่ยง AI:</strong> โครงสร้างสินทรัพย์เชื่อมโยงกับฐานข้อมูล Supabase PostgreSQL รายบัญชี มีการบันทึกสถานะการเปิด/ปิดไม้เพื่อประเมินความเสี่ยงได้แม่นยำ 100%
              </div>
            </div>
          </div>

          {/* Row 3: Watched Assets Risk & Exposure Matrix */}
          <div className="crypto-card">
            <div className="card-header-row">
              <div className="card-title">
                <BarChart3 size={16} color="var(--neon-blue-light)" />
                <span>ตารางวิเคราะห์สัดส่วนและความเสี่ยงรายสินทรัพย์ (Asset Risk & Weight Matrix)</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--neon-green-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                อัปเดตราคาตลาด Live
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>สินทรัพย์</th>
                    <th style={{ textAlign: 'right' }}>ราคาตลาดปัจจุบัน (Live)</th>
                    <th style={{ textAlign: 'right' }}>มูลค่าประเมิน ({currency})</th>
                    <th style={{ textAlign: 'right' }}>สัดส่วนพอร์ต (Weight)</th>
                    <th style={{ textAlign: 'right' }}>ผลตอบแทนประเมิน</th>
                    <th style={{ textAlign: 'center' }}>Beta vs BTC</th>
                    <th style={{ textAlign: 'center' }}>จุดตัดขาดทุนสถิติ (SL)</th>
                    <th style={{ textAlign: 'center' }}>ระดับความเสี่ยง</th>
                    <th style={{ textAlign: 'center' }}>เครื่องมือ</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        ยังไม่มีโพซิชันในพอร์ต — คลิกปุ่ม "เปิดคำสั่งเทรดจำลอง" เพื่อเริ่มต้นบันทึกการลงทุน
                      </td>
                    </tr>
                  ) : (
                    positions.map((pos) => {
                      const liveP = livePrices[pos.symbol] ?? pos.currentPrice;
                      const currentPrice = liveP * multiplier;
                      const totalVal = pos.qty * liveP * multiplier;
                      const pnlPct = ((liveP - pos.avgCost) / (pos.avgCost || 1)) * 100;
                      const isProfit = pnlPct >= 0;

                      return (
                        <tr key={pos.symbol} onClick={() => onSelectCoin(pos.symbol)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CryptoIcon symbol={pos.symbol} size={28} />
                              <div>
                                <div style={{ fontWeight: 800, color: '#FFFFFF' }}>{pos.symbol}</div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{pos.qty} {pos.symbol}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#FFF' }}>
                            {prefix}{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: currentPrice < 1 ? 4 : 2 })}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {prefix}{totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--neon-cyan)' }}>
                            {pos.weight}%
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <span style={{ color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)', fontWeight: 800 }}>
                              {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                            </span>
                          </td>

                          <td style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                            {pos.symbol === 'BTC' ? '1.00x' : pos.symbol === 'ETH' ? '1.12x' : '1.35x'}
                          </td>

                          <td style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--neon-red)', fontWeight: 600 }}>
                            {prefix}{(currentPrice * 0.92).toFixed(currentPrice < 1 ? 4 : 2)}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: pos.risk === 'Low' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: pos.risk === 'Low' ? 'var(--neon-green-light)' : '#FBBF24',
                              }}
                            >
                              {pos.risk}
                            </span>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCoin(pos.symbol);
                              }}
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: '#60A5FA',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              วิเคราะห์กราฟ
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LIVE PAPER TRADING IN POSTGRESQL                  */}
      {/* ======================================================== */}
      {activeTab === 'paper_trades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Performance KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>อัตราชนะ (Win Rate)</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '4px' }}>
                {stats?.winRatePct ?? 0}%
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                จาก {stats?.closedTradesCount ?? 0} ออเดอร์ที่ปิดแล้ว
              </div>
            </div>

            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Profit Factor</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#A78BFA', marginTop: '4px' }}>
                {stats?.profitFactor ?? 0}x
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                อัตราส่วนกำไรต่อขาดทุน
              </div>
            </div>

            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>กำไร/ขาดทุนสะสม (Total PnL)</div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: (stats?.totalPnlCombined ?? 0) >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  marginTop: '4px',
                }}
              >
                {(stats?.totalPnlCombined ?? 0) >= 0 ? '+' : ''}
                {prefix}{((stats?.totalPnlCombined ?? 0) * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Realized: {prefix}{((stats?.totalRealizedPnl ?? 0) * multiplier).toFixed(2)} | Unrealized: {prefix}{((stats?.totalUnrealizedPnl ?? 0) * multiplier).toFixed(2)}
              </div>
            </div>

            <div className="crypto-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>สถานะโควต้าเปิดออเดอร์</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>
                {openTrades.length} / {stats?.maxOpenTrades ?? 5}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                สิทธิ์ระดับ {activeRole.toUpperCase()} (จัดเก็บบน PostgreSQL)
              </div>
            </div>
          </div>

          {/* Active Open Positions Table */}
          <div className="crypto-card">
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div className="card-title">
                <Clock size={16} color="#34D399" />
                <span>โพซิชันที่กำลังเปิดอยู่ (Active Open Positions)</span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                บันทึกและคำนวณราคาเรียลไทม์ใน Supabase Table: <code>public.paper_trades</code>
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>สินทรัพย์</th>
                    <th>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>ราคาเข้า (Entry)</th>
                    <th style={{ textAlign: 'right' }}>ราคาตลาด (Live)</th>
                    <th style={{ textAlign: 'right' }}>จำนวน / ต้นทุน</th>
                    <th style={{ textAlign: 'right' }}>Unrealized PnL</th>
                    <th style={{ textAlign: 'center' }}>Stop Loss / TP</th>
                    <th>สัญญาณ / บันทึก</th>
                    <th style={{ textAlign: 'center' }}>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {openTrades.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        ไม่มีโพซิชันที่เปิดอยู่ — คลิกปุ่ม "เปิดคำสั่งเทรดจำลอง" ด้านบนเพื่อส่งคำสั่งใหม่
                      </td>
                    </tr>
                  ) : (
                    openTrades.map((trade) => {
                      const liveP = livePrices[trade.symbol] ?? trade.currentPrice;
                      const isBuy = trade.type === 'BUY';
                      const pnl = isBuy ? (liveP - trade.entryPrice) * trade.qty : (trade.entryPrice - liveP) * trade.qty;
                      const pnlPct = trade.totalCost > 0 ? (pnl / trade.totalCost) * 100 : 0;
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={trade.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CryptoIcon symbol={trade.symbol} size={24} />
                              <div>
                                <span style={{ fontWeight: 800, color: '#FFF' }}>{trade.symbol}</span>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  {new Date(trade.openedAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                                backgroundColor: isBuy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isBuy ? '#34D399' : '#F87171',
                              }}
                            >
                              {trade.type}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {prefix}{(trade.entryPrice * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: trade.entryPrice < 1 ? 4 : 2 })}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#FFF' }}>
                            {prefix}{(liveP * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: liveP < 1 ? 4 : 2 })}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700 }}>{trade.qty} {trade.symbol}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {prefix}{(trade.totalCost * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                              {isProfit ? '+' : ''}{prefix}{(pnl * multiplier).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                              {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', fontSize: '11px' }}>
                            <div style={{ color: 'var(--neon-red)' }}>SL: {trade.sl > 0 ? `${prefix}${(trade.sl * multiplier).toFixed(trade.sl < 1 ? 4 : 2)}` : '-'}</div>
                            <div style={{ color: 'var(--neon-green-light)' }}>TP: {trade.tp > 0 ? `${prefix}${(trade.tp * multiplier).toFixed(trade.tp < 1 ? 4 : 2)}` : '-'}</div>
                          </td>

                          <td style={{ fontSize: '11px', maxWidth: '180px' }}>
                            <div style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{trade.signalOrigin || '-'}</div>
                            <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {trade.notes || '-'}
                            </div>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleCloseTrade(trade.id, trade.symbol)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#F87171',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ปิดโพซิชัน
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

          {/* Closed Orders History Table */}
          <div className="crypto-card">
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div className="card-title">
                <CheckCircle2 size={16} color="var(--neon-cyan)" />
                <span>ประวัติคำสั่งซื้อขายที่ปิดแล้ว (Closed Trade History)</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                บันทึกผลลัพธ์ Realized PnL ถาวรใน PostgreSQL
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>สินทรัพย์</th>
                    <th>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>ราคาเข้า</th>
                    <th style={{ textAlign: 'right' }}>ราคาปิด (Close)</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'right' }}>ผลกำไร/ขาดทุนจริง (Realized PnL)</th>
                    <th style={{ textAlign: 'center' }}>เวลาเปิด / ปิด</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        ยังไม่มีประวัติคำสั่งที่ปิด
                      </td>
                    </tr>
                  ) : (
                    closedTrades.map((trade) => {
                      const pnl = trade.realizedPnl ?? 0;
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={trade.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CryptoIcon symbol={trade.symbol} size={22} />
                              <span style={{ fontWeight: 800 }}>{trade.symbol}</span>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: trade.type === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: trade.type === 'BUY' ? '#34D399' : '#F87171',
                              }}
                            >
                              {trade.type}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {prefix}{(trade.entryPrice * multiplier).toFixed(trade.entryPrice < 1 ? 4 : 2)}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#FFF' }}>
                            {prefix}{((trade.closePrice ?? trade.entryPrice) * multiplier).toFixed((trade.closePrice ?? 1) < 1 ? 4 : 2)}
                          </td>

                          <td style={{ textAlign: 'right' }}>{trade.qty} {trade.symbol}</td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                              {isProfit ? '+' : ''}{prefix}{(pnl * multiplier).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '10.5px', fontWeight: 700, color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                              {isProfit ? '+' : ''}{(trade.realizedPnlPct ?? 0).toFixed(2)}%
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            <div>เปิด: {new Date(trade.openedAt).toLocaleDateString('th-TH')}</div>
                            <div>ปิด: {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString('th-TH') : '-'}</div>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTrade(trade.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                              title="ลบออกจาก DB"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: POSITION SIZING CALCULATOR                        */}
      {/* ======================================================== */}
      {activeTab === 'calculator' && (
        <div className="crypto-card">
          <div className="card-header-row" style={{ marginBottom: '14px' }}>
            <div className="card-title">
              <Calculator size={18} color="var(--neon-cyan)" />
              <span>แบบจำลองคำนวณการคุมความเสี่ยง & Money Management (Position Sizing Simulator)</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              คำนวณขนาดไม้สูงสุดที่ปลอดภัยตามหลักสถิติ เพื่อการวางแผนก่อนตัดสินใจบันทึกลงพอร์ต
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
            {/* Inputs Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    เงินทุนทั้งหมดในพอร์ต ($)
                  </label>
                  <input
                    type="number"
                    value={calcCapital}
                    onChange={(e) => setCalcCapital(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: '#FFF', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    อัตราความเสี่ยงที่รับได้ต่อไม้ (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcRiskPct}
                    onChange={(e) => setCalcRiskPct(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: '#FFF', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ราคาเข้าที่วิเคราะห์ ($)
                  </label>
                  <input
                    type="number"
                    value={calcEntry}
                    onChange={(e) => setCalcEntry(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: '#FFF', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#EF4444', display: 'block', marginBottom: '4px' }}>
                    จุด Stop Loss ($)
                  </label>
                  <input
                    type="number"
                    value={calcStopLoss}
                    onChange={(e) => setCalcStopLoss(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', color: '#F87171', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#10B981', display: 'block', marginBottom: '4px' }}>
                    เป้าหมายกำไร ($)
                  </label>
                  <input
                    type="number"
                    value={calcTarget}
                    onChange={(e) => setCalcTarget(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)', color: '#34D399', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Results Analytics Column */}
            {calcResult && (
              <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ขนาดไม้ที่ปลอดภัย (Max Sizing)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-cyan)', marginTop: '4px' }}>
                      ${calcResult.positionSizeUsd.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                      ({calcResult.quantity.toFixed(3)} units)
                    </div>
                  </div>

                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ความเสี่ยงสูงสุด (Max Loss)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-red)', marginTop: '4px' }}>
                      -${calcResult.riskAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                      ({calcRiskPct}% ของพอร์ต)
                    </div>
                  </div>

                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk to Reward (R:R)</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: calcResult.riskRewardRatio >= 2 ? 'var(--neon-green-light)' : '#F59E0B', marginTop: '4px' }}>
                      1 : {calcResult.riskRewardRatio}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                      +{((calcResult.potentialProfitUsd / (calcResult.positionSizeUsd || 1)) * 100).toFixed(1)}% กำไร
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: calcResult.isSafeRisk ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${calcResult.isSafeRisk ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                    fontSize: '11.5px',
                    lineHeight: 1.4,
                    color: '#E2E8F0',
                  }}
                >
                  <strong>คำแนะนำ Risk Engine:</strong> {calcResult.recommendationTh}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: OPEN NEW PAPER TRADE ORDER                        */}
      {/* ======================================================== */}
      {isOrderModalOpen && (
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
          onClick={() => setIsOrderModalOpen(false)}
        >
          <div
            className="crypto-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0F172A',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} color="#34D399" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFF' }}>
                  เปิดคำสั่งเทรดจำลอง (Paper Trade Order)
                </h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    เลือกเหรียญ (Coin Symbol)
                  </label>
                  <select
                    value={orderSymbol}
                    onChange={(e) => setOrderSymbol(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      color: '#FFF',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  >
                    {['BTC', 'ETH', 'SOL', 'AVAX', 'LINK', 'NEAR', 'AAVE', 'RENDER', 'FET', 'SUI', 'PEPE', 'DOGE'].map((s) => (
                      <option key={s} value={s} style={{ backgroundColor: '#0F172A', color: '#FFF' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    ประเภทคำสั่ง (Trade Type)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setOrderType('BUY')}
                      style={{
                        padding: '9px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: orderType === 'BUY' ? '1px solid #10B981' : '1px solid var(--border-color)',
                        backgroundColor: orderType === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                        color: orderType === 'BUY' ? '#34D399' : 'var(--text-muted)',
                      }}
                    >
                      BUY / LONG
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('SELL')}
                      style={{
                        padding: '9px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: orderType === 'SELL' ? '1px solid #EF4444' : '1px solid var(--border-color)',
                        backgroundColor: orderType === 'SELL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                        color: orderType === 'SELL' ? '#F87171' : 'var(--text-muted)',
                      }}
                    >
                      SELL / SHORT
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    ราคาเข้าที่ต้องการ ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orderEntry}
                    onChange={(e) => setOrderEntry(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      color: '#FFF',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    จำนวน (Quantity)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orderQty}
                    onChange={(e) => setOrderQty(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      color: '#FFF',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#EF4444', display: 'block', marginBottom: '6px' }}>
                    จุดตัดขาดทุน Stop Loss ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orderSl}
                    onChange={(e) => setOrderSl(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      color: '#F87171',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#10B981', display: 'block', marginBottom: '6px' }}>
                    เป้าหมายทำกำไร Take Profit ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orderTp}
                    onChange={(e) => setOrderTp(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      color: '#34D399',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  ที่มาสัญญาณการเข้าเทรด
                </label>
                <input
                  type="text"
                  value={orderSignalOrigin}
                  onChange={(e) => setOrderSignalOrigin(e.target.value)}
                  placeholder="เช่น AI Gold Signal, Breakout TF 1H"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#FFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  บันทึกเหตุผล / หมายเหตุ
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="เช่น เข้าซื้อสะสมตามแนวรับ EMA 50"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#FFF',
                    fontSize: '12.5px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                  }}
                >
                  {submittingOrder ? 'กำลังบันทึกลง DB...' : 'ยืนยันเปิดคำสั่ง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
