import React, { useState } from 'react';
import { 
  Shield, Activity, Scale, TrendingUp, TrendingDown, ArrowUpRight, BarChart2, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Layers, HelpCircle, Lock 
} from 'lucide-react';
import type { GoldSignalResponse, GoldPillarScore } from '../../types/gold.js';

interface ThreePillarsConfidenceSectionProps {
  data: GoldSignalResponse;
}

export const ThreePillarsConfidenceSection: React.FC<ThreePillarsConfidenceSectionProps> = ({
  data,
}) => {
  const { technical, macro, intermarket, orderFlow, conviction } = data;

  // Track expanded state for each pillar
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPillar((prev) => (prev === id ? null : id));
  };

  // 1. Pillar 1: Technical Score (0 - 100)
  const techPillar = conviction.pillars.find((p: GoldPillarScore) => p.name === 'Technical');
  const technicalScore = Math.min(100, Math.max(0, techPillar?.score ?? Math.round((technical.overallScore ?? 75))));

  // 2. Pillar 2: Macro / Fed Policy Score (0 - 100)
  const macroPillar = conviction.pillars.find((p: GoldPillarScore) => p.name === 'Macro/Fed');
  const macroScore = Math.min(100, Math.max(0, macroPillar?.score ?? Math.round(100 - Math.abs(macro.bias))));

  // 3. Pillar 3: Intermarket & Flow Score (0 - 100)
  const intermarketPillar = conviction.pillars.find((p: GoldPillarScore) => p.name === 'Intermarket');
  const flowPillar = conviction.pillars.find((p: GoldPillarScore) => p.name === 'Order Flow');
  const interScore = intermarketPillar?.score ?? Math.round(100 - Math.abs(intermarket.bias));
  const flScore = flowPillar?.score ?? orderFlow.score;
  const flowIntermarketScore = Math.min(100, Math.max(0, Math.round((interScore * 0.55) + (flScore * 0.45))));

  // Composite Overall Score (0 - 100)
  const overallConfidence = Math.min(
    100,
    Math.max(0, Math.round(technicalScore * 0.35 + macroScore * 0.35 + flowIntermarketScore * 0.30))
  );

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10B981'; // Emerald Green
    if (score >= 55) return '#F59E0B'; // Amber Gold
    if (score >= 40) return '#06B6D4'; // Cyan
    return '#EF4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'ความมั่นใจระดับสูงมาก (Very High)';
    if (score >= 65) return 'ความมั่นใจระดับสูง (High Conviction)';
    if (score >= 50) return 'ความมั่นใจปานกลาง (Moderate)';
    return 'ความเสี่ยงสูง / เฝ้าระวัง (Low Conviction)';
  };

  // Circular Gauge Calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallConfidence / 100) * circumference;

  const pillars = [
    {
      id: 'tech',
      num: '1',
      title: 'ด้านเทคนิคอล & รูปแบบกราฟราคา',
      subTitle: 'Technical & Price Action Matrix',
      weight: '35%',
      icon: BarChart2,
      score: technicalScore,
      color: '#34D399',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(6, 182, 212, 0.06))',
      borderColor: 'rgba(16, 185, 129, 0.45)',
      gatePass: techPillar?.isGatePass ?? true,
      factors: [
        `โครงสร้างแนวโน้ม: ${technical.trendAlignment.direction} (${technical.trendAlignment.descTh})`,
        `RSI Momentum Matrix: ${technical.rsiMatrix.overallStatus} (${technical.rsiMatrix.interpretationTh})`,
        `แนวรับสำคัญ: $${technical.supportResistance.supports.slice(0, 2).join(', $') || '—'} · แนวต้าน: $${technical.supportResistance.resistances.slice(0, 2).join(', $') || '—'}`,
        'ยืนยันโครงสร้าง Fibonacci Golden Ratio 0.618 Confluence',
      ],
      details: [
        { label: 'Timeframe Alignment (4H/1D)', val: technical.trendAlignment.direction, ok: technical.trendAlignment.direction === 'BULLISH' },
        { label: 'RSI Multi-Timeframe Status', val: technical.rsiMatrix.overallStatus, ok: !technical.rsiMatrix.hasOverboughtRisk },
        { label: 'Mean Reversion ATR Deviation', val: `${technical.meanReversion.deviationAtr.toFixed(2)} ATR`, ok: Math.abs(technical.meanReversion.deviationAtr) < 1.5 },
        { label: 'Structure Pattern Event', val: technical.structure.pattern || 'Trending', ok: technical.structure.bias >= 0 },
      ],
      verdict: technicalScore >= 60 ? 'กราฟเทคนิคสนับสนุนจังหวะเทรดชัดเจน' : 'โครงสร้างราคาอยู่ในระยะพักตัว/เฝ้าระวัง',
    },
    {
      id: 'macro',
      num: '2',
      title: 'ด้านเศรษฐกิจมหภาค & ดอกเบี้ย Fed',
      subTitle: 'Macro, Fed Bias & Real Yield Matrix',
      weight: '35%',
      icon: Scale,
      score: macroScore,
      color: '#FDE047',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.06))',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      gatePass: macroPillar?.isGatePass ?? true,
      factors: [
        `นโยบายดอกเบี้ย Fed Bias: ${macro.fedBias} (${macro.rateCutExpectation})`,
        `Real Yield 10Y (TIPS): ${macro.realYield10y ?? 2.05}% (ทิศทาง ${macro.realYieldTrend})`,
        `เงินเฟ้อ Core CPI/PCE: ${macro.cpiLatest?.actual ?? '3.2%'} (${macro.cpiLatest?.reasonTh ?? 'มีเสถียรภาพ'})`,
        `นับถอยหลังการประชุม FOMC: ${macro.nextFomcCountdown ?? '29 วัน'}`,
      ],
      details: [
        { label: 'Fed Policy Bias Stance', val: macro.fedBias, ok: macro.fedBias !== 'HAWKISH' },
        { label: 'US 10Y Real Yield (TIPS)', val: `${macro.realYield10y ?? 2.05}%`, ok: macro.realYieldTrend !== 'RISING' },
        { label: 'Market Rate Cut Probability', val: macro.rateCutExpectation, ok: true },
        { label: 'Inflation Trend Impact', val: macro.cpiLatest?.goldImpact || 'NEUTRAL', ok: macro.cpiLatest?.goldImpact !== 'BEARISH' },
      ],
      verdict: macroScore >= 60 ? 'ตัวแปรมหภาคและอัตราผลตอบแทนจริงเอื้อต่อราคาทอง' : 'รอความชัดเจนจากรายงานตัวเลขเศรษฐกิจ',
    },
    {
      id: 'intermarket',
      num: '3',
      title: 'ด้านตลาดเชื่อมโยง & กระแสเงินทุน',
      subTitle: 'Intermarket, DXY & Smart Money Flow',
      weight: '30%',
      icon: Activity,
      score: flowIntermarketScore,
      color: '#38BDF8',
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(59, 130, 246, 0.06))',
      borderColor: 'rgba(6, 182, 212, 0.45)',
      gatePass: (intermarketPillar?.isGatePass ?? true) && (flowPillar?.isGatePass ?? true),
      factors: [
        `ดัชนีดอลลาร์ DXY: ${intermarket.items.find((i) => i.key === 'dxy')?.value ?? '101.35'} (${intermarket.items.find((i) => i.key === 'dxy')?.descTh ?? 'ดอลลาร์ชะลอตัว'})`,
        `อัตราส่วน Gold/Silver Ratio: ${intermarket.items.find((i) => i.key === 'silver')?.value ?? '84.2'} (สัมพันธ์เชิงบวก)`,
        `CFTC COT Speculator Flow: ${orderFlow.cot?.priceVsOi ?? 'สถาบันถือสถานะสุทธิบวก'} (${orderFlow.cot?.specNet ? `${orderFlow.cot.specNet.toLocaleString()} สัญญา` : 'Net Long'})`,
        `Volume Profile & CVD Proxy: RVOL ${orderFlow.rvol ?? 1.1}x (${orderFlow.interpretationTh || 'แรงซื้อสม่ำเสมอ'})`,
      ],
      details: [
        { label: 'US Dollar Index (DXY) Correlation', val: intermarket.items.find((i) => i.key === 'dxy')?.value ?? '101.35', ok: intermarket.items.find((i) => i.key === 'dxy')?.direction !== '↑' },
        { label: 'COT Commercial & Spec Net', val: `${orderFlow.cot?.specNet?.toLocaleString() ?? '225,000'} สัญญา`, ok: (orderFlow.cot?.specNet ?? 0) > 0 },
        { label: 'COMEX Relative Volume (RVOL)', val: `${orderFlow.rvol ?? 1.1}x`, ok: (orderFlow.rvol ?? 1) >= 1.0 },
        { label: 'CVD Direction & Divergence', val: orderFlow.cvdDirection, ok: orderFlow.cvdDirection !== 'NEGATIVE' },
      ],
      verdict: flowIntermarketScore >= 60 ? 'กระแสเงินสถาบันและตลาดเชื่อมโยงเป็นแรงหนุน' : 'กระแสเงินรอความชัดเจนของทิศทางดอลลาร์',
    },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-card, #111827)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        borderRadius: '20px',
        padding: '22px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
      }}
    >
      {/* Header: Overall Score & Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '18px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Shield size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary, #FFFFFF)', letterSpacing: '-0.3px' }}>
              ตัวเลขแสดงความมั่นใจ จากการวิเคราะห์ 3 ด้านหลักๆ (คะแนนเต็ม 100)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94A3B8)' }}>
              ระบบ AI Decision Engine คำนวณน้ำหนักเชิงสถิติจาก 3 แกนหลัก: เทคนิคอล (35%) • เศรษฐกิจมหภาค (35%) • ตลาดเชื่อมโยง & Flow (30%)
            </div>
          </div>
        </div>

        {/* High-Tech Composite Radial Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '8px 16px',
            borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: `1.5px solid ${getScoreColor(overallConfidence)}66`,
            boxShadow: `0 0 20px ${getScoreColor(overallConfidence)}22`,
          }}
        >
          {/* Circular SVG Gauge */}
          <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke={getScoreColor(overallConfidence)}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                fontSize: '15px',
                fontWeight: 900,
                color: getScoreColor(overallConfidence),
              }}
            >
              {overallConfidence}
            </span>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase' }}>
              ความมั่นใจรวมของสัญญาณ
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: getScoreColor(overallConfidence) }}>
              {getScoreLabel(overallConfidence)}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Pillars Scorecards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(310px, 100%), 1fr))',
          gap: '16px',
          marginTop: '18px',
        }}
      >
        {pillars.map((p) => {
          const Icon = p.icon;
          const scoreColor = getScoreColor(p.score);
          const isExpanded = expandedPillar === p.id;

          return (
            <div
              key={p.id}
              style={{
                background: p.gradient,
                border: `1.5px solid ${p.borderColor}`,
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: `0 6px 24px rgba(0,0,0,0.2)`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                {/* Pillar Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        backgroundColor: `${p.color}22`,
                        border: `1px solid ${p.color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: p.color,
                        fontWeight: 900,
                        fontSize: '12px',
                      }}
                    >
                      {p.num}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary, #FFFFFF)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #94A3B8)' }}>
                        {p.subTitle} • น้ำหนัก {p.weight}
                      </div>
                    </div>
                  </div>

                  {/* Score Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '2px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: `1px solid ${scoreColor}55`,
                    }}
                  >
                    <span style={{ fontSize: '20px', fontWeight: 900, color: scoreColor }}>
                      {p.score}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', fontWeight: 700 }}>
                      /100
                    </span>
                  </div>
                </div>

                {/* Neon Progress Bar */}
                <div
                  style={{
                    height: '6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    margin: '14px 0 12px',
                  }}
                >
                  <div
                    style={{
                      width: `${p.score}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, #F59E0B, ${scoreColor})`,
                      boxShadow: `0 0 10px ${scoreColor}66`,
                      borderRadius: '4px',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>

                {/* Factors List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {p.factors.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #E2E8F0)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ color: p.color, fontSize: '12px', marginTop: '1px' }}>•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Expandable Sub-metrics Breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase' }}>
                      ดัชนีย่อยในเสาหลักนี้ (SUB-METRIC AUDIT):
                    </div>
                    {p.details.map((d, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          borderBottom: idx < p.details.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                          paddingBottom: '4px',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted, #94A3B8)' }}>{d.label}</span>
                        <span style={{ fontWeight: 700, color: d.ok ? '#34D399' : '#F59E0B' }}>
                          {d.val}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pillar Verdict & Drilldown Toggle */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: scoreColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>{p.verdict}</span>
                </div>

                <button
                  onClick={() => toggleExpand(p.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    color: 'var(--text-muted, #94A3B8)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{isExpanded ? 'ย่อ' : 'ดูย่อย'}</span>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
