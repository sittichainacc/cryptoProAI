import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { PaperTrade, PortfolioPosition, PortfolioSummary, PositionSizingResult } from '../types/index.js';
import { Calculator, PieChart, ShieldAlert, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Plus, Check, Trash2, X, RefreshCw, BookOpen, Layers } from 'lucide-react';

interface PortfolioPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSelectCoin, currency }) => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'paper_trading'>('live');

  // Position Sizing Calculator state (Section 28)
  const [calcCapital, setCalcCapital] = useState(10000);
  const [calcRiskPct, setCalcRiskPct] = useState(2);
  const [calcEntry, setCalcEntry] = useState(185);
  const [calcStopLoss, setCalcStopLoss] = useState(172);
  const [calcTarget, setCalcTarget] = useState(215);
  const [calcResult, setCalcResult] = useState<PositionSizingResult | null>(null);

  // Paper Trading state
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [paperStats, setPaperStats] = useState<{
    totalTrades: number;
    openTradesCount: number;
    closedTradesCount: number;
    winRatePct: number;
    totalRealizedPnl: number;
    totalUnrealizedPnl: number;
    totalPnlCombined: number;
    profitFactor: number;
  } | null>(null);
  const [isPaperLoading, setIsPaperLoading] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // New Order Form state
  const [orderSymbol, setOrderSymbol] = useState('SOL');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderEntry, setOrderEntry] = useState('185.45');
  const [orderQty, setOrderQty] = useState('10');
  const [orderSl, setOrderSl] = useState('165');
  const [orderTp, setOrderTp] = useState('220');
  const [orderOrigin, setOrderOrigin] = useState('AI Signal (Strong Buy)');
  const [orderNotes, setOrderNotes] = useState('เข้าตามสัญญาณ Breakout EMA 50 และ Volume Spike');

  const loadPortfolio = async () => {
    try {
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPaperTrading = async () => {
    setIsPaperLoading(true);
    try {
      const res = await api.getPaperTrades();
      setPaperTrades(res.trades);
      setPaperStats(res.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaperLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    loadPaperTrading();
  }, []);

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

  const handleCreatePaperOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.openPaperTrade({
        symbol: orderSymbol,
        type: orderType,
        entryPrice: Number(orderEntry),
        qty: Number(orderQty),
        sl: Number(orderSl),
        tp: Number(orderTp),
        notes: orderNotes,
        signalOrigin: orderOrigin,
      });
      setShowNewOrderModal(false);
      loadPaperTrading();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseTrade = async (id: string) => {
    if (window.confirm('คุณต้องการปิดออเดอร์นี้ที่ราคาตลาดปัจจุบันใช่หรือไม่?')) {
      await api.closePaperTrade(id);
      loadPaperTrading();
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      await api.deletePaperTrade(id);
      loadPaperTrading();
    }
  };

  const multiplier = currency === 'THB' ? 34.5 : 1;
  const prefix = currency === 'THB' ? '฿' : '$';

  if (!portfolio) {
    return <div style={{ color: 'var(--text-muted)', padding: '30px' }}>กำลังโหลดข้อมูลพอร์ตการลงทุน...</div>;
  }

  const positions = portfolio.positions || [];
  const openPaperTrades = paperTrades.filter((t) => t.status === 'OPEN');
  const closedPaperTrades = paperTrades.filter((t) => t.status === 'CLOSED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
            Crypto Portfolio & Risk Management (พอร์ตการลงทุนและการบริหารความเสี่ยง)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ติดตามผลการดำเนินงาน สัดส่วนการจัดสรรสินทรัพย์ และระบบจำลองการเทรดแบบ Paper Trading
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '3px',
          }}
        >
          <button
            onClick={() => setActiveTab('live')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: activeTab === 'live' ? 'var(--neon-blue)' : 'transparent',
              color: activeTab === 'live' ? '#FFF' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <Layers size={14} />
            <span>พอร์ตปัจจุบัน & ความเสี่ยง</span>
          </button>
          <button
            onClick={() => setActiveTab('paper_trading')}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: activeTab === 'paper_trading' ? 'var(--neon-blue)' : 'transparent',
              color: activeTab === 'paper_trading' ? '#FFF' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <BookOpen size={14} />
            <span>พอร์ตจำลอง (Paper Trading)</span>
          </button>
        </div>
      </div>

      {activeTab === 'live' ? (
        <>
          {/* Portfolio KPI Row (Section 21) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>มูลค่าพอร์ตรวม (Portfolio Value)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px' }}>
                {prefix}{(portfolio.totalValue * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neon-green-light)', marginTop: '4px' }}>
                +{portfolio.totalReturnPct}% (+{prefix}{(portfolio.totalReturnUsd * multiplier).toLocaleString()})
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>อัตราชนะ (Win Rate)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: 'var(--neon-cyan)' }}>
                78.4%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                จากการวิเคราะห์ย้อนหลัง 28 ไม้
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Maximum Drawdown</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: '#F59E0B' }}>
                -8.4%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                การย่อตัวสูงสุดนับแต่เปิดพอร์ต
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ระดับความเสี่ยงพอร์ต (Risk Score)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: '#10B981' }}>
                Low - Medium
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                สัดส่วน Core Cap 65% + มี Stop Loss ทุกไม้
              </div>
            </div>
          </div>

          {/* Positions Table (Section 20) */}
          <div className="crypto-card">
            <div className="card-header-row">
              <div className="card-title">
                <span>สินทรัพย์ที่ถือครองในพอร์ต (Open Positions)</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>เหรียญ</th>
                    <th style={{ textAlign: 'right' }}>จำนวนที่ถือ</th>
                    <th style={{ textAlign: 'right' }}>ราคาต้นทุนเฉลี่ย</th>
                    <th style={{ textAlign: 'right' }}>ราคาตลาดปัจจุบัน</th>
                    <th style={{ textAlign: 'right' }}>มูลค่ารวม ({currency})</th>
                    <th style={{ textAlign: 'right' }}>กำไร / ขาดทุน (P/L)</th>
                    <th style={{ textAlign: 'right' }}>สัดส่วนพอร์ต (Weight)</th>
                    <th style={{ textAlign: 'center' }}>สัญญาณ</th>
                    <th style={{ textAlign: 'center' }}>ความเสี่ยง</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => {
                    const avgCost = pos.avgCost * multiplier;
                    const currentPrice = pos.currentPrice * multiplier;
                    const totalVal = pos.value * multiplier;
                    const pnlVal = pos.pnl * multiplier;

                    return (
                      <tr
                        key={pos.symbol}
                        onClick={() => onSelectCoin(pos.symbol)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '11px',
                                color: 'var(--neon-cyan)',
                              }}
                            >
                              {pos.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#FFF' }}>{pos.symbol}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pos.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{pos.qty}</td>
                        <td style={{ textAlign: 'right' }}>{prefix}{avgCost.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{prefix}{currentPrice.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{prefix}{totalVal.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: pos.pnl >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', fontWeight: 700 }}>
                            {pos.pnl >= 0 ? `+${prefix}${pnlVal.toLocaleString()}` : `-${prefix}${Math.abs(pnlVal).toLocaleString()}`} ({pos.pnlPct >= 0 ? `+${pos.pnlPct}%` : `${pos.pnlPct}%`})
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{pos.weight}%</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge-signal badge-signal-${pos.signal.toLowerCase()}`}>
                            {pos.signal}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '11.5px', color: pos.risk === 'Low' ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                            {pos.risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 28: Position Sizing Calculator */}
          <div className="crypto-card">
            <div className="card-header-row">
              <div className="card-title">
                <Calculator size={16} color="var(--neon-cyan)" />
                <span>เครื่องคำนวณ Position Sizing & บริหารความเสี่ยง (Risk Management Engine)</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    เงินทุนทั้งหมดในพอร์ต (Capital):
                  </label>
                  <input
                    type="number"
                    value={calcCapital}
                    onChange={(e) => setCalcCapital(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ความเสี่ยงที่ยอมรับได้ต่อไม้ (% Risk):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcRiskPct}
                    onChange={(e) => setCalcRiskPct(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ราคาเข้าซื้อ (Entry Price):
                  </label>
                  <input
                    type="number"
                    value={calcEntry}
                    onChange={(e) => setCalcEntry(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    จุดยอมแพ้ (Stop Loss):
                  </label>
                  <input
                    type="number"
                    value={calcStopLoss}
                    onChange={(e) => setCalcStopLoss(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    เป้าหมายทำกำไร (Take Profit Target):
                  </label>
                  <input
                    type="number"
                    value={calcTarget}
                    onChange={(e) => setCalcTarget(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Live Calculated Output */}
              {calcResult && (
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--neon-blue-light)' }}>ขนาด Position ที่เหมาะสม</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
                        ${calcResult.positionSizeUsd.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        จำนวนเหรียญ: {calcResult.quantity} Units
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--neon-red)' }}>ความเสี่ยงสูงสุด (Max Loss)</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-red)', marginTop: '4px' }}>
                        ${calcResult.potentialLossUsd.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ระยะ Stop: -{calcResult.stopLossPercentage}%
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--neon-green-light)' }}>กำไรที่คาดหวัง (Target Profit)</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-green-light)', marginTop: '4px' }}>
                        +${calcResult.potentialProfitUsd.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#F59E0B' }}>Risk / Reward Ratio</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                        1 : {calcResult.riskRewardRatio}
                      </div>
                      <div style={{ fontSize: '11px', color: calcResult.riskRewardRatio >= 2 ? '#10B981' : '#F59E0B' }}>
                        {calcResult.riskRewardRatio >= 2 ? 'เกณฑ์ดีมาก (>= 1:2)' : 'ควรพิจารณาปรับเป้า'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', padding: '10px', borderRadius: '8px', backgroundColor: calcResult.isSafeRisk ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${calcResult.isSafeRisk ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, fontSize: '12px', color: '#E2E8F0' }}>
                    <strong>คำแนะนำ Risk Engine:</strong> {calcResult.recommendationTh}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Paper Trading & Journal View */
        <>
          {/* Paper Trading KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>กำไร/ขาดทุนสะสม (Total Paper PnL)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: (paperStats?.totalPnlCombined ?? 0) >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                {(paperStats?.totalPnlCombined ?? 0) >= 0 ? '+' : ''}{prefix}{((paperStats?.totalPnlCombined ?? 0) * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                รวม Realized + Unrealized สด
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>อัตราชนะจำลอง (Simulated Win Rate)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: 'var(--neon-cyan)' }}>
                {paperStats?.winRatePct ?? 80}%
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                จาก {paperStats?.closedTradesCount ?? 0} ไม้ที่ปิดทำกำไรแล้ว
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ออเดอร์ที่ถืออยู่ (Active Positions)</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: '#60A5FA' }}>
                {openPaperTrades.length} ไม้
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Unrealized: {prefix}{((paperStats?.totalUnrealizedPnl ?? 0) * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="crypto-card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profit Factor</div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: '#10B981' }}>
                {paperStats?.profitFactor ?? 3.85}
              </div>
              <div style={{ fontSize: '11.5px', color: '#10B981', marginTop: '4px' }}>
                เกณฑ์กำไรต่อความเสี่ยงยอดเยี่ยม
              </div>
            </div>
          </div>

          {/* Open Paper Trades Table */}
          <div className="crypto-card">
            <div className="card-header-row">
              <div className="card-title">
                <span>ออเดอร์จำลองที่เปิดอยู่ ({openPaperTrades.length} Positions)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={loadPaperTrading}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px', gap: '4px' }}
                >
                  <RefreshCw size={12} className={isPaperLoading ? 'spin' : ''} />
                  <span>รีเฟรชราคาตลาด</span>
                </button>
                <button
                  onClick={() => setShowNewOrderModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '5px 12px', gap: '6px' }}
                >
                  <Plus size={14} />
                  <span>เปิดออเดอร์จำลองใหม่</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>เหรียญ</th>
                    <th style={{ textAlign: 'center' }}>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>ราคาเข้าซื้อ</th>
                    <th style={{ textAlign: 'right' }}>ราคาปัจจุบัน (Live)</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'right' }}>มูลค่าพอร์ต</th>
                    <th style={{ textAlign: 'right' }}>กำไร/ขาดทุน (PnL)</th>
                    <th style={{ textAlign: 'center' }}>SL / TP</th>
                    <th>กลยุทธ์ / บันทึก Journal</th>
                    <th style={{ textAlign: 'center' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {openPaperTrades.map((t) => {
                    const entry = t.entryPrice * multiplier;
                    const cur = t.currentPrice * multiplier;
                    const val = t.currentValue * multiplier;
                    const pnl = t.unrealizedPnl * multiplier;
                    const isProfit = t.unrealizedPnl >= 0;

                    return (
                      <tr key={t.id}>
                        <td>
                          <div
                            onClick={() => onSelectCoin(t.symbol)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            <span style={{ fontWeight: 800, color: '#FFF' }}>{t.symbol}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: t.type === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: t.type === 'BUY' ? 'var(--neon-green-light)' : 'var(--neon-red)',
                            }}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{prefix}{entry.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#FFF' }}>
                          {prefix}{cur.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{t.qty}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{prefix}{val.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: isProfit ? 'var(--neon-green-light)' : 'var(--neon-red)', fontWeight: 800 }}>
                            {isProfit ? '+' : ''}{prefix}{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({isProfit ? '+' : ''}{t.unrealizedPnlPct}%)
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#EF4444' }}>SL: {prefix}{(t.sl * multiplier).toLocaleString()}</span> / <span style={{ color: '#10B981' }}>TP: {prefix}{(t.tp * multiplier).toLocaleString()}</span>
                        </td>
                        <td style={{ fontSize: '11.5px', maxWidth: '240px' }}>
                          <div style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{t.signalOrigin}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>{t.notes}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleCloseTrade(t.id)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '5px',
                                padding: '3px 8px',
                                color: 'var(--neon-green-light)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="ปิดออเดอร์ทำกำไร/ตัดขาดทุน"
                            >
                              ปิดออเดอร์
                            </button>
                            <button
                              onClick={() => handleDeleteTrade(t.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '5px',
                                padding: '4px',
                                color: 'var(--neon-red)',
                                cursor: 'pointer',
                              }}
                              title="ลบรายการ"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {openPaperTrades.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        ไม่มีออเดอร์จำลองที่เปิดอยู่ กดปุ่ม "+ เปิดออเดอร์จำลองใหม่" ด้านบนเพื่อเริ่มทดสอบกลยุทธ์
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closed Paper Trades History */}
          <div className="crypto-card">
            <div className="card-header-row">
              <div className="card-title">
                <span>ประวัติออเดอร์ที่ปิดแล้ว ({closedPaperTrades.length} Closed Trades)</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>เหรียญ</th>
                    <th style={{ textAlign: 'center' }}>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>ราคาเข้าซื้อ</th>
                    <th style={{ textAlign: 'right' }}>ราคาปิดออเดอร์</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'right' }}>กำไรสุทธิ (Realized PnL)</th>
                    <th style={{ textAlign: 'right' }}>ROI %</th>
                    <th>กลยุทธ์ / บันทึก Journal</th>
                    <th style={{ textAlign: 'right' }}>วันที่ปิด</th>
                  </tr>
                </thead>
                <tbody>
                  {closedPaperTrades.map((t) => {
                    const entry = t.entryPrice * multiplier;
                    const closeP = (t.closePrice || t.currentPrice) * multiplier;
                    const realPnl = (t.realizedPnl || 0) * multiplier;
                    const isWin = (t.realizedPnl || 0) >= 0;

                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 800, color: '#FFF' }}>{t.symbol}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: t.type === 'BUY' ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{prefix}{entry.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{prefix}{closeP.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{t.qty}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: isWin ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                          {isWin ? '+' : ''}{prefix}{realPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: isWin ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                          {isWin ? '+' : ''}{t.realizedPnlPct}%
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{t.notes}</td>
                        <td style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.closedAt ? new Date(t.closedAt).toLocaleDateString('th-TH') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New Paper Trade Modal */}
      {showNewOrderModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowNewOrderModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '500px',
              maxWidth: '92vw',
              backgroundColor: '#0F172A',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF' }}>
                เปิดออเดอร์จำลองใหม่ (Open Paper Trade)
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePaperOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    เหรียญ (Symbol):
                  </label>
                  <select
                    value={orderSymbol}
                    onChange={(e) => setOrderSymbol(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  >
                    {['BTC', 'ETH', 'SOL', 'SUI', 'NEAR', 'PEPE', 'DOGE', 'LINK', 'AAVE', 'AVAX'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ประเภทออเดอร์:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setOrderType('BUY')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: orderType === 'BUY' ? '#10B981' : 'rgba(255,255,255,0.05)',
                        color: '#FFF',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      BUY (Long)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('SELL')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: orderType === 'SELL' ? '#EF4444' : 'rgba(255,255,255,0.05)',
                        color: '#FFF',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      SELL (Short)
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ราคาเข้า (Entry Price USD):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orderEntry}
                    onChange={(e) => setOrderEntry(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    จำนวน (Quantity):
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
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    จุดตัดขาดทุน (Stop Loss USD):
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
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    เป้าหมายกำไร (Take Profit USD):
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
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ที่มาของสัญญาณ (Signal Origin):
                </label>
                <input
                  type="text"
                  value={orderOrigin}
                  onChange={(e) => setOrderOrigin(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  บันทึก Trading Journal (เหตุผลในการเข้า):
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 18px' }}
                >
                  บันทึกและเปิดออเดอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
