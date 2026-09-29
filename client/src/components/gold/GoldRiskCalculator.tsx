/**
 * 🥇 GoldRiskCalculator — เครื่องคำนวณขนาดไม้และการบริหารความเสี่ยง (Position Sizer & Risk-Reward Calculator)
 * คำนวณ Lot Size / จำนวนบาททองคำ / ความเสี่ยงที่เป็นตัวเงิน และกำไรคาดการณ์ที่ TP1, TP2, TP3
 */
import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, ShieldAlert, Award, TrendingUp, ArrowRight, Percent } from 'lucide-react';
import type { GoldPriceData, GoldEntryZone, ThaiGoldPlan } from '../../types/gold.js';

interface GoldRiskCalculatorProps {
  mode: string;
  price: GoldPriceData;
  plan: GoldEntryZone | null;
  thaiPlan: ThaiGoldPlan | null;
}

export const GoldRiskCalculator: React.FC<GoldRiskCalculatorProps> = ({ mode, price, plan, thaiPlan }) => {
  const isThai = mode === 'THAI_GOLD_BAR';

  // Capital & Risk settings
  const [capital, setCapital] = useState<number>(() => isThai ? 200000 : 5000);
  const [riskPct, setRiskPct] = useState<number>(2); // 2% default risk
  
  // Custom prices or auto-filled from plan
  const defaultEntry = isThai ? (thaiPlan?.bestBuy ?? price.thaiGoldBarSell ?? 44000) : (plan?.bestEntry ?? price.xauUsd ?? 4150);
  const defaultStop = isThai ? (thaiPlan?.invalidation ?? (defaultEntry * 0.985)) : (plan?.stopLoss ?? (defaultEntry * 0.985));
  const defaultTp1 = isThai ? (thaiPlan?.tp1 ?? (defaultEntry * 1.015)) : (plan?.tp1 ?? (defaultEntry * 1.015));
  const defaultTp2 = isThai ? (thaiPlan?.tp2 ?? (defaultEntry * 1.03)) : (plan?.tp2 ?? (defaultEntry * 1.03));

  const [entryPrice, setEntryPrice] = useState<number>(defaultEntry);
  const [stopPrice, setStopPrice] = useState<number>(defaultStop);
  const [tp1Price, setTp1Price] = useState<number>(defaultTp1);
  const [tp2Price, setTp2Price] = useState<number>(defaultTp2);

  // Sync if plan loads
  React.useEffect(() => {
    if (isThai && thaiPlan) {
      setEntryPrice(thaiPlan.bestBuy);
      setStopPrice(thaiPlan.invalidation);
      setTp1Price(thaiPlan.tp1);
      setTp2Price(thaiPlan.tp2);
    } else if (!isThai && plan) {
      setEntryPrice(plan.bestEntry);
      setStopPrice(plan.stopLoss);
      setTp1Price(plan.tp1);
      setTp2Price(plan.tp2);
    }
  }, [isThai, plan, thaiPlan]);

  // Calculations
  const maxRiskCash = (capital * riskPct) / 100;
  const isLong = entryPrice > stopPrice;
  const riskPerUnit = Math.abs(entryPrice - stopPrice);

  const calculations = useMemo(() => {
    if (riskPerUnit <= 0) return null;

    if (isThai) {
      // Thai Gold Bar (Unit: บาททองคำ)
      // Risk per 1 baht gold = entryPrice (ราคาขายออก) - stopPrice (ราคารับซื้อ)
      const rawBahtWeight = maxRiskCash / riskPerUnit;
      const recommendedBahtWeight = Math.max(1, Math.floor(rawBahtWeight)); // ปัดเศษลงเพื่อความปลอดภัย
      const actualRiskCash = recommendedBahtWeight * riskPerUnit;
      const totalCapitalNeeded = recommendedBahtWeight * entryPrice;

      const gainTp1PerUnit = tp1Price - entryPrice;
      const gainTp2PerUnit = tp2Price - entryPrice;

      const profitTp1 = recommendedBahtWeight * gainTp1PerUnit;
      const profitTp2 = recommendedBahtWeight * gainTp2PerUnit;

      const rrRatio = gainTp2PerUnit > 0 ? (gainTp2PerUnit / riskPerUnit).toFixed(1) : '—';

      return {
        unitLabel: 'บาททองคำ',
        positionSize: recommendedBahtWeight,
        actualRiskCash,
        totalCapitalNeeded,
        profitTp1,
        profitTp2,
        rrRatio,
        riskDistancePct: ((riskPerUnit / entryPrice) * 100).toFixed(2),
        tp1GainPct: ((gainTp1PerUnit / entryPrice) * 100).toFixed(2),
        tp2GainPct: ((gainTp2PerUnit / entryPrice) * 100).toFixed(2),
      };
    } else {
      // Global Gold (Unit: Troy Ounce / Lot, 1 Standard Lot = 100 oz)
      const rawOunces = maxRiskCash / riskPerUnit;
      const standardLots = rawOunces / 100;
      const actualRiskCash = rawOunces * riskPerUnit;
      const totalCapitalNeeded = rawOunces * entryPrice;

      const gainTp1PerUnit = Math.abs(tp1Price - entryPrice);
      const gainTp2PerUnit = Math.abs(tp2Price - entryPrice);

      const profitTp1 = rawOunces * gainTp1PerUnit;
      const profitTp2 = rawOunces * gainTp2PerUnit;

      const rrRatio = (gainTp2PerUnit / riskPerUnit).toFixed(1);

      return {
        unitLabel: 'Troy Ounces',
        positionSize: rawOunces.toFixed(2),
        standardLots: standardLots.toFixed(2),
        actualRiskCash,
        totalCapitalNeeded,
        profitTp1,
        profitTp2,
        rrRatio,
        riskDistancePct: ((riskPerUnit / entryPrice) * 100).toFixed(2),
        tp1GainPct: ((gainTp1PerUnit / entryPrice) * 100).toFixed(2),
        tp2GainPct: ((gainTp2PerUnit / entryPrice) * 100).toFixed(2),
      };
    }
  }, [isThai, maxRiskCash, riskPerUnit, entryPrice, stopPrice, tp1Price, tp2Price]);

  return (
    <div style={{
      background: 'var(--bg-card, #111827)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      borderRadius: 16,
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
          }}>
            <Calculator size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary, #F8FAFC)' }}>
              คำนวณขนาดไม้ & ความเสี่ยง (Position Sizer)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94A3B8)' }}>
              คำนวณจำนวนเงินที่เสี่ยงและขนาดออเดอร์ที่เหมาะสมตามหลัก Money Management
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          โหมด: {isThai ? 'ทองคำแท่ง (บาท)' : 'Gold Spot (USD)'}
        </div>
      </div>

      {/* Inputs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        {/* Capital Input */}
        <div style={{
          background: 'var(--bg-card-inner, rgba(255,255,255,0.03))',
          padding: '12px',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
        }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            ทุนพอร์ต ({isThai ? 'บาท' : 'USD'})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(Math.max(1, Number(e.target.value)))}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 800,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Risk % Selector */}
        <div style={{
          background: 'var(--bg-card-inner, rgba(255,255,255,0.03))',
          padding: '12px',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
        }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            ความเสี่ยงต่อไม้ (% Risk)
          </label>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {[1, 2, 3, 5].map(pct => (
              <button
                key={pct}
                onClick={() => setRiskPct(pct)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: riskPct === pct ? '#EF4444' : 'rgba(255,255,255,0.05)',
                  color: riskPct === pct ? '#FFF' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Entry Price */}
        <div style={{
          background: 'var(--bg-card-inner, rgba(255,255,255,0.03))',
          padding: '12px',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
        }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            ราคาเข้า ({isThai ? 'บาท' : '$'})
          </label>
          <input
            type="number"
            value={entryPrice}
            onChange={e => setEntryPrice(Number(e.target.value))}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#3B82F6',
              fontSize: 16,
              fontWeight: 800,
              outline: 'none',
            }}
          />
        </div>

        {/* Stop Price */}
        <div style={{
          background: 'var(--bg-card-inner, rgba(255,255,255,0.03))',
          padding: '12px',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
        }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Stop Loss ({isThai ? 'บาท' : '$'})
          </label>
          <input
            type="number"
            value={stopPrice}
            onChange={e => setStopPrice(Number(e.target.value))}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#EF4444',
              fontSize: 16,
              fontWeight: 800,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Calculated Results Cockpit */}
      {calculations ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(16, 185, 129, 0.05))',
          padding: '16px',
          borderRadius: 14,
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}>
          {/* Card 1: Recommended Size */}
          <div style={{
            background: 'var(--bg-card, #111827)',
            padding: '14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              ขนาดออเดอร์แนะนำ
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>
              {calculations.positionSize} <span style={{ fontSize: 14, fontWeight: 700 }}>{calculations.unitLabel}</span>
            </div>
            {calculations.standardLots && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                ≈ {calculations.standardLots} Standard Lot
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              มูลค่าไม้: {isThai ? `฿${Math.round(calculations.totalCapitalNeeded).toLocaleString()}` : `$${calculations.totalCapitalNeeded.toFixed(2)}`}
            </div>
          </div>

          {/* Card 2: Max Risk Cash */}
          <div style={{
            background: 'var(--bg-card, #111827)',
            padding: '14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
              ความเสี่ยงจริงเมื่อโดน Stop
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>
              {isThai ? `฿${Math.round(calculations.actualRiskCash).toLocaleString()}` : `$${calculations.actualRiskCash.toFixed(2)}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              ระยะ Stop: {calculations.riskDistancePct}% ({riskPct}% ของพอร์ต)
            </div>
          </div>

          {/* Card 3: Expected Profit at TP1 & TP2 */}
          <div style={{
            background: 'var(--bg-card, #111827)',
            padding: '14px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
              กำไรคาดการณ์ (Target Profit)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>TP1: </span>
                <strong style={{ fontSize: 16, color: '#06B6D4' }}>
                  +{isThai ? `฿${Math.round(calculations.profitTp1).toLocaleString()}` : `$${calculations.profitTp1.toFixed(0)}`}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>TP2: </span>
                <strong style={{ fontSize: 16, color: '#10B981' }}>
                  +{isThai ? `฿${Math.round(calculations.profitTp2).toLocaleString()}` : `$${calculations.profitTp2.toFixed(0)}`}
                </strong>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Risk : Reward = <strong style={{ color: '#F59E0B' }}>1 : {calculations.rrRatio}R</strong>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#EF4444', fontSize: 12 }}>
          ⚠️ กรุณากำหนดราคาเข้า และ Stop Loss ให้ถูกต้อง (ระยะห่างต้องมากกว่า 0)
        </div>
      )}
    </div>
  );
};
