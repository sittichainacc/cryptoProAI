import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { PortfolioPosition, PortfolioSummary, PositionSizingResult } from '../types/index.js';
import { Calculator, PieChart, ShieldAlert, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PortfolioPageProps {
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSelectCoin, currency }) => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);

  // Position Sizing Calculator state (Section 28)
  const [calcCapital, setCalcCapital] = useState(10000);
  const [calcRiskPct, setCalcRiskPct] = useState(2);
  const [calcEntry, setCalcEntry] = useState(185);
  const [calcStopLoss, setCalcStopLoss] = useState(172);
  const [calcTarget, setCalcTarget] = useState(215);
  const [calcResult, setCalcResult] = useState<PositionSizingResult | null>(null);

  useEffect(() => {
    api.getPortfolio().then(setPortfolio);
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

  const multiplier = currency === 'THB' ? 34.5 : 1;
  const prefix = currency === 'THB' ? '฿' : '$';

  if (!portfolio) {
    return <div style={{ color: 'var(--text-muted)', padding: '30px' }}>กำลังโหลดข้อมูลพอร์ตการลงทุน...</div>;
  }

  const positions = portfolio.positions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
          Crypto Portfolio & Risk Management (พอร์ตการลงทุนและการบริหารความเสี่ยง)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          ติดตามผลการดำเนินงาน สัดส่วนการจัดสรรสินทรัพย์ และเครื่องคำนวณ Position Sizing
        </p>
      </div>

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
            รายการเหรียญที่ถือครอง (Open Positions)
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({positions.length} รายการ)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="crypto-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>เหรียญ</th>
                <th style={{ textAlign: 'right' }}>จำนวน (Qty)</th>
                <th style={{ textAlign: 'right' }}>ต้นทุนเฉลี่ย</th>
                <th style={{ textAlign: 'right' }}>ราคาปัจจุบัน</th>
                <th style={{ textAlign: 'right' }}>มูลค่ารวม</th>
                <th style={{ textAlign: 'right' }}>กำไร/ขาดทุน (P/L)</th>
                <th style={{ textAlign: 'right' }}>กำไร %</th>
                <th style={{ textAlign: 'center' }}>สัดส่วนพอร์ต</th>
                <th style={{ textAlign: 'center' }}>AI Signal</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.symbol} onClick={() => onSelectCoin(pos.symbol)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#FFF' }}>{pos.symbol}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pos.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{pos.qty}</td>
                  <td style={{ textAlign: 'right' }}>{prefix}{(pos.avgCost * multiplier).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {prefix}{(pos.currentPrice * multiplier).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {prefix}{(pos.value * multiplier).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: pos.pnl >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                    +{prefix}{(pos.pnl * multiplier).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--neon-green-light)' }}>
                    +{pos.pnlPct.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'center' }}>{pos.weight}%</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-strong-buy">{pos.signal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Sizing Calculator (Section 28) */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '14px' }}>
          <div className="card-title">
            <Calculator size={18} color="var(--neon-cyan)" />
            Position Sizing Calculator (เครื่องคำนวณขนาดไม้ตามความเสี่ยง)
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            คำนวณตามหลัก Risk Management และ Risk/Reward Ratio
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                เงินทุนรวม (Capital in USD):
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
                ความเสี่ยงต่อไม้ (Risk %):
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
    </div>
  );
};
