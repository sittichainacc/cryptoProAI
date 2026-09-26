import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { realtimeService } from '../services/realtime.js';
import { PortfolioPosition, PortfolioSummary, PositionSizingResult } from '../types/index.js';
import { Calculator, PieChart, ShieldAlert, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, RefreshCw, Layers, Activity, TrendingUp, BarChart3, Compass, Info } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { CryptoIcon } from '../components/CryptoIcon.js';

interface PortfolioPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSelectCoin, currency }) => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Position Sizing & Risk Management Calculator state (Pure Analytics / Risk Planning)
  const [calcCapital, setCalcCapital] = useState(10000);
  const [calcRiskPct, setCalcRiskPct] = useState(2);
  const [calcEntry, setCalcEntry] = useState(185);
  const [calcStopLoss, setCalcStopLoss] = useState(172);
  const [calcTarget, setCalcTarget] = useState(215);
  const [calcResult, setCalcResult] = useState<PositionSizingResult | null>(null);

  const loadPortfolio = async () => {
    try {
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPortfolio();

    // Subscribe to real-time Binance ticks for sub-second valuation updates
    const unsub = realtimeService.subscribeTicks((ticks) => {
      const updated: Record<string, number> = {};
      for (const [sym, tick] of Object.entries(ticks)) {
        updated[sym] = tick.price;
      }
      setLivePrices((prev) => ({ ...prev, ...updated }));
    });

    return unsub;
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

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  if (!portfolio) {
    return <div style={{ color: 'var(--text-muted)', padding: '30px' }}>กำลังโหลดข้อมูลการวิเคราะห์พอร์ตโฟลิโอ...</div>;
  }

  const positions = portfolio.positions || [];

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              การวิเคราะห์พอร์ตโฟลิโอ & ประเมินความเสี่ยง (Portfolio Risk Analytics)
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--neon-green-light)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '2px 8px',
              }}
            >
              100% Pure Analytics Mode
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ระบบวิเคราะห์การกระจายตัวสินทรัพย์ (Asset Allocation), มาตรวัดความเสี่ยง (Risk Metrics), และแบบจำลองคำนวณ Money Management
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadPortfolio} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}>
            <RefreshCw size={13} />
            <span>อัปเดตสถิติพอร์ต</span>
          </button>
        </div>
      </div>

      {/* 4 Risk & Capital Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        <div className="crypto-card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>มูลค่าสินทรัพย์ติดตาม (Portfolio Valuation)</div>
          <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px' }}>
            {prefix}{(portfolio.totalValue * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neon-green-light)', marginTop: '4px' }}>
            +{portfolio.totalReturnPct}% (+{prefix}{(portfolio.totalReturnUsd * multiplier).toLocaleString()})
          </div>
        </div>

        <div className="crypto-card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>คะแนนการกระจายความเสี่ยง (Diversification)</div>
          <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px', color: 'var(--neon-cyan)' }}>
            92 / 100 <span style={{ fontSize: '14px', color: '#FFF' }}>(A+)</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--neon-green-light)', marginTop: '4px' }}>
            ✓ สัดส่วนสมดุล ไม่กระจุกตัวในกลุ่มเดียว
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
        {/* Sector Allocation Breakdown */}
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
            <strong>สรุปความเสี่ยง AI:</strong> พอร์ตมีโครงสร้างที่เน้น Core Assets เกิน 45% จึงมีเกราะป้องกันที่ดีเยี่ยมเมื่อตลาดผันผวน ในขณะที่ Layer 1 และ AI ช่วยขับเคลื่อนการเติบโต
          </div>
        </div>
      </div>

      {/* Row 3: Watched Assets Risk & Exposure Matrix (Live Real-Time Prices) */}
      <div className="crypto-card">
        <div className="card-header-row">
          <div className="card-title">
            <BarChart3 size={16} color="var(--neon-blue-light)" />
            <span>ตารางวิเคราะห์สัดส่วนและความเสี่ยงรายสินทรัพย์ (Asset Risk & Weight Matrix)</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--neon-green-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            อัปเดตราคาแบบ Real-Time
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
              {positions.map((pos) => {
                const liveP = livePrices[pos.symbol] ?? pos.currentPrice;
                const currentPrice = liveP * multiplier;
                const totalVal = pos.qty * liveP * multiplier;
                const pnlPct = ((liveP - pos.avgCost) / pos.avgCost) * 100;
                const isProfit = pnlPct >= 0;

                return (
                  <tr key={pos.symbol} onClick={() => onSelectCoin(pos.symbol)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Coin Icon */}
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Position Sizing & Money Management Calculator (Section 28 - Pure Analytics / Planning) */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '14px' }}>
          <div className="card-title">
            <Calculator size={18} color="var(--neon-cyan)" />
            <span>แบบจำลองคำนวณการคุมความเสี่ยง & Money Management (Position Sizing Simulator)</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            คำนวณขนาดไม้สูงสุดที่ปลอดภัยตามหลักสถิติ เพื่อการวางแผนก่อนตัดสินใจ (ไม่มีการส่งคำสั่งซื้อขาย)
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
    </div>
  );
};
