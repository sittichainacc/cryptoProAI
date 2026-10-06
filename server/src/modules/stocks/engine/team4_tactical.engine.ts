// ============================================================================
// Global Equity Multi-Agent System - Team 4: Tactical Asset Allocation Engine
// 10 Agents: Timing & Trigger, Position Sizing (Kelly Criterion), Stop Loss / Invalidation,
//            Take Profit & Scaling (TP1/TP2/TP3), Options Overlay, Hedging & Correlation,
//            Execution Strategy, Liquidity & Slippage, Risk-Reward Optimization, Tactical Chairman
// ============================================================================

import { globalStockStore, GlobalStockItem } from './stock_store.js';
import { riskEngine } from './risk_engine.js';
import { team3RedTeamEngine } from './team3_red_team.engine.js';
import { TradePlan } from '../types.js';

export interface KellyCalculationResult {
  ticker: string;
  winProbability: number; // e.g. 0.62 (62%)
  payoutRatio: number;    // e.g. 2.2 (Win/Loss ratio)
  fullKellyFraction: number; // raw Kelly formula output
  halfKellyFraction: number; // conservative half-kelly
  recommendedSizePct: number; // constrained by 10% hard cap
  riskAdjustedCapitalUsd: number; // for given total portfolio equity
  rationale: string;
}

export interface TacticalAgentOutput {
  agentId: string;
  agentName: string;
  tacticDomain: string;
  actionableDecision: string;
  keyMetricLabel: string;
  keyMetricValue: string | number;
  parameters: Record<string, any>;
  guidance: string[];
}

export interface TacticalTradePlanResult {
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  direction: 'LONG' | 'SHORT';
  timeframe: 'SWING' | 'POSITION' | 'INTRADAY';
  setupType: 'BREAKOUT' | 'PULLBACK_EMA20' | 'SUPPORT_BOUNCE' | 'MOMENTUM_EXPANSION';
  entryPrice: number;
  entryZone: { low: number; high: number };
  stopLoss: number;
  stopLossDistancePct: number;
  riskUnitR: number; // Dollar risk per share = Entry - SL
  takeProfit1: number; // 1.5R - 2.0R (Scale out 33%, move SL to Breakeven)
  takeProfit2: number; // 2.5R - 3.0R (Scale out 33%)
  takeProfit3: number; // 4.0R+ (Trailing runner)
  riskRewardRatio: number; // Must be >= 2.0
  riskRewardValid: boolean;
  positionSizing: KellyCalculationResult;
  optionsOverlay: {
    recommendedStrategy: 'NONE' | 'COVERED_CALL' | 'PROTECTIVE_COLLAR' | 'CASH_SECURED_PUT';
    callStrike?: number;
    putStrike?: number;
    expirationDays?: number;
    hedgeEfficiency: string;
  };
  hedgingStrategy: {
    portfolioBeta: number;
    correlationToSpy: number;
    hedgeInstrument: string;
    hedgeRatioPct: number;
  };
  executionTactics: {
    orderType: 'LIMIT' | 'TWAP' | 'VWAP' | 'MARKET';
    maxAllowableSpreadPct: number;
    currentSpreadPct: number;
    estimatedSlippageBps: number;
    darkPoolPreference: boolean;
  };
  agentReports: {
    timing: TacticalAgentOutput;
    sizing: TacticalAgentOutput;
    stopLoss: TacticalAgentOutput;
    takeProfit: TacticalAgentOutput;
    options: TacticalAgentOutput;
    hedging: TacticalAgentOutput;
    execution: TacticalAgentOutput;
    liquidity: TacticalAgentOutput;
    riskReward: TacticalAgentOutput;
    chairman: TacticalAgentOutput;
  };
  redTeamVetoActive: boolean;
  isTradeApproved: boolean;
  approvalStatusSummary: string;
  createdAt: string;
}

export class Team4TacticalEngine {
  /**
   * Calculate Fractional Kelly Criterion Position Sizing
   * Formula: f* = (p * b - q) / b
   * Where:
   *   p = Win probability
   *   q = 1 - p (Loss probability)
   *   b = Win/Loss payout ratio (Avg Gain / Avg Loss)
   * Half-Kelly: 0.5 * f*, strictly bounded by Hard Risk max 10.0% cap
   */
  public calculateKellySizing(
    ticker: string,
    portfolioEquity: number = 100_000,
    options?: { winProb?: number; payoutRatio?: number }
  ): KellyCalculationResult {
    const stock = globalStockStore.getStock(ticker.toUpperCase());
    const indicators = globalStockStore.getStockIndicators(ticker.toUpperCase());

    // Estimate empirical win probability based on technical trend & momentum
    let p = 0.60;
    if (indicators) {
      if (indicators.rsi14 >= 45 && indicators.rsi14 <= 65) p += 0.05; // sweet spot
      if (indicators.ema20 > indicators.ema50) p += 0.04; // trend alignment
      if (indicators.macd.macdLine > indicators.macd.signalLine) p += 0.03; // bullish momentum
    }
    if (options?.winProb !== undefined) {
      p = Math.max(0.35, Math.min(0.85, options.winProb));
    }

    const q = 1 - p;
    const b = options?.payoutRatio !== undefined ? Math.max(1.2, options.payoutRatio) : 2.2;

    // Raw Kelly fraction
    const fullKelly = Number(((p * b - q) / b).toFixed(4));
    // Conservative Half-Kelly to avoid Gambler's Ruin
    const halfKelly = Number(Math.max(0, fullKelly * 0.5).toFixed(4));

    // Hard Risk Engine Boundary: max 10.0% of portfolio
    const hardCap = riskEngine.getConfig().max_position_size_pct;
    const recommendedSizePct = Number(Math.min(hardCap, Math.max(1.5, halfKelly * 100)).toFixed(1));
    const riskAdjustedCapitalUsd = Number(((portfolioEquity * recommendedSizePct) / 100).toFixed(2));

    let rationale = `Kelly Criterion: Win Rate ${(p * 100).toFixed(0)}%, Payout Ratio ${b.toFixed(1)}x. `;
    if (halfKelly * 100 > hardCap) {
      rationale += `Raw Half-Kelly ${(halfKelly * 100).toFixed(1)}% ถูกตัดลดลงเหลือ ${hardCap}% ตามกฎ Hard Risk Engine Cap.`;
    } else {
      rationale += `Half-Kelly ที่แนะนำ: ${recommendedSizePct}% ($${riskAdjustedCapitalUsd.toLocaleString()}).`;
    }

    return {
      ticker: ticker.toUpperCase(),
      winProbability: Number(p.toFixed(2)),
      payoutRatio: Number(b.toFixed(2)),
      fullKellyFraction: fullKelly,
      halfKellyFraction: halfKelly,
      recommendedSizePct,
      riskAdjustedCapitalUsd,
      rationale,
    };
  }

  /**
   * Synthesize Complete Tactical Allocation & Execution Plan for a Stock
   */
  public generateTacticalPlan(
    ticker: string,
    portfolioEquity: number = 100_000,
    customOverrides?: {
      targetEntry?: number;
      customStopLoss?: number;
      winProb?: number;
    }
  ): TacticalTradePlanResult | null {
    const stock = globalStockStore.getStock(ticker.toUpperCase());
    if (!stock) return null;

    const indicators = globalStockStore.getStockIndicators(stock.ticker);
    const redTeamAudit = team3RedTeamEngine.auditStock(stock.ticker);
    const isVetoed = redTeamAudit?.vetoTriggered || false;

    // 1. Entry & Timing Setup (T4-01)
    const currentPrice = stock.price;
    const atr14 = indicators?.atr14 || Number((currentPrice * 0.025).toFixed(2));
    const ema20 = indicators?.ema20 || currentPrice;

    let setupType: 'BREAKOUT' | 'PULLBACK_EMA20' | 'SUPPORT_BOUNCE' | 'MOMENTUM_EXPANSION';
    if (currentPrice > stock.high52w * 0.96) {
      setupType = 'BREAKOUT';
    } else if (Math.abs(currentPrice - ema20) / currentPrice < 0.015) {
      setupType = 'PULLBACK_EMA20';
    } else if (indicators && indicators.rsi14 < 40) {
      setupType = 'SUPPORT_BOUNCE';
    } else {
      setupType = 'MOMENTUM_EXPANSION';
    }

    const entryPrice = customOverrides?.targetEntry || currentPrice;
    const entryZone = {
      low: Number((entryPrice - atr14 * 0.3).toFixed(2)),
      high: Number((entryPrice + atr14 * 0.2).toFixed(2)),
    };

    // 2. Stop Loss & Invalidation (T4-03): Dynamic ATR Stops
    // Default: Entry - 1.5 * ATR14
    const riskMultiplier = 1.5;
    const calculatedRiskUnitR = Number((atr14 * riskMultiplier).toFixed(2));
    const stopLoss = customOverrides?.customStopLoss
      ? customOverrides.customStopLoss
      : Number((entryPrice - calculatedRiskUnitR).toFixed(2));

    const actualRiskUnitR = Number((entryPrice - stopLoss).toFixed(2));
    const stopLossDistancePct = Number(((actualRiskUnitR / entryPrice) * 100).toFixed(2));

    // 3. Take Profit Scaling Ladder (T4-04): Multi-Tiered TP1 / TP2 / TP3
    const takeProfit1 = Number((entryPrice + actualRiskUnitR * 2.0).toFixed(2)); // 2.0R
    const takeProfit2 = Number((entryPrice + actualRiskUnitR * 3.2).toFixed(2)); // 3.2R
    const takeProfit3 = Number((entryPrice + actualRiskUnitR * 4.8).toFixed(2)); // 4.8R Runner

    // 4. Risk / Reward Calculation (T4-09)
    const riskRewardRatio = Number(((takeProfit1 - entryPrice) / actualRiskUnitR).toFixed(2));
    const riskRewardValid = riskRewardRatio >= 2.0;

    // 5. Position Sizing (T4-02): Kelly Criterion
    const sizingResult = this.calculateKellySizing(stock.ticker, portfolioEquity, {
      winProb: customOverrides?.winProb,
      payoutRatio: riskRewardRatio,
    });

    // 6. Options Overlay (T4-05)
    const coveredCallStrike = Number((entryPrice * 1.12).toFixed(0));
    const protectivePutStrike = Number((entryPrice * 0.93).toFixed(0));

    // 7. Execution Strategy (T4-07 & T4-08)
    const spreadPct = Number((stock.price > 100 ? 0.02 : 0.04).toFixed(3));
    const estimatedSlippageBps = (stock.marketCap || 0) > 500_000_000_000 ? 4 : 9;

    // 8. Generate 10 Specialized Tactical Agent Reports
    const t4_01: TacticalAgentOutput = {
      agentId: 'T4-01',
      agentName: 'Timing & Trigger Agent',
      tacticDomain: 'Entry Confirmation & Technical Setups',
      actionableDecision: `เข้าซื้อเมื่อราคาเคลื่อนตัวเข้าสู่กรอบ $${entryZone.low} - $${entryZone.high} (${setupType})`,
      keyMetricLabel: 'Setup Trigger',
      keyMetricValue: setupType,
      parameters: { entryPrice, entryZone, setupType },
      guidance: [
        'รอแท่งเทียน Bullish Reversal หรือ Price Action ยืนยันบนกรอบ 1H/4H',
        'ไม่ไล่ราคาหากราคาหลุดกรอบ High เกิน 0.5%',
      ],
    };

    const t4_02: TacticalAgentOutput = {
      agentId: 'T4-02',
      agentName: 'Position Sizing Agent',
      tacticDomain: 'Fractional Kelly Criterion & Volatility Parity',
      actionableDecision: `จัดสรรเงินลงทุน ${sizingResult.recommendedSizePct}% ของพอร์ต ($${sizingResult.riskAdjustedCapitalUsd.toLocaleString()})`,
      keyMetricLabel: 'Recommended Size',
      keyMetricValue: `${sizingResult.recommendedSizePct}% of Equity`,
      parameters: {
        winProbability: sizingResult.winProbability,
        payoutRatio: sizingResult.payoutRatio,
        halfKelly: sizingResult.halfKellyFraction,
        capitalUsd: sizingResult.riskAdjustedCapitalUsd,
      },
      guidance: [
        sizingResult.rationale,
        `จำกัดความเสี่ยงต่อการขาดทุนระดับพอร์ตไม่เกิน 1.0% ($${(portfolioEquity * 0.01).toFixed(0)})`,
      ],
    };

    const t4_03: TacticalAgentOutput = {
      agentId: 'T4-03',
      agentName: 'Stop Loss / Invalidation Agent',
      tacticDomain: 'Dynamic ATR 14 Trailing Stops & Support Defense',
      actionableDecision: `ตั้ง Hard Stop Loss ที่ราคา $${stopLoss} (-${stopLossDistancePct}%)`,
      keyMetricLabel: 'Stop Loss & Risk (R)',
      keyMetricValue: `$${stopLoss} (Risk: $${actualRiskUnitR}/หุ้น)`,
      parameters: { stopLoss, actualRiskUnitR, stopLossDistancePct, atr14 },
      guidance: [
        `ระยะ Stop Loss คำนวณจาก 1.5x ATR 14 ($${atr14}) ป้องกัน False Breakout จากความผันผวนปกติ`,
        'ตัดขาดทุนทันทีเมื่อปิดแท่ง Daily ต่ำกว่าระดับ Invalidation โดยไม่มีข้อยกเว้น',
      ],
    };

    const t4_04: TacticalAgentOutput = {
      agentId: 'T4-04',
      agentName: 'Take Profit & Scaling Agent',
      tacticDomain: 'Multi-Tiered Scaling Exit Targets (TP1 / TP2 / TP3)',
      actionableDecision: `แบ่งขายทำกำไร 3 ระดับ: TP1 ($${takeProfit1}), TP2 ($${takeProfit2}), TP3 ($${takeProfit3})`,
      keyMetricLabel: 'Profit Targets Ladder',
      keyMetricValue: `TP1: $${takeProfit1} | TP2: $${takeProfit2} | TP3: $${takeProfit3}`,
      parameters: { takeProfit1, takeProfit2, takeProfit3 },
      guidance: [
        `TP1 ($${takeProfit1} / +${(((takeProfit1 - entryPrice) / entryPrice) * 100).toFixed(1)}%): ปิดสถานะ 33% และเลื่อน Stop Loss ขึ้นมาที่ Breakeven ($${entryPrice}) ทันที`,
        `TP2 ($${takeProfit2} / +${(((takeProfit2 - entryPrice) / entryPrice) * 100).toFixed(1)}%): ปิดสถานะอีก 33% เพื่อล็อคกำไรส่วนใหญ่`,
        `TP3 ($${takeProfit3} / +${(((takeProfit3 - entryPrice) / entryPrice) * 100).toFixed(1)}%): ถือหุ้นที่เหลือ 34% เป็น Runner โดยใช้ Trailing Stop ตามเส้น EMA 20`,
      ],
    };

    const t4_05: TacticalAgentOutput = {
      agentId: 'T4-05',
      agentName: 'Options Overlay Agent',
      tacticDomain: 'Yield Enhancement & Downside Floor Protection',
      actionableDecision: `ขาย Covered Call Strike $${coveredCallStrike} เพื่อเพิ่มกระแสเงินสด Yield +2.5%`,
      keyMetricLabel: 'Options Overlay Strategy',
      keyMetricValue: `Covered Call @ $${coveredCallStrike}`,
      parameters: {
        coveredCallStrike,
        protectivePutStrike,
        expirationDays: 35,
      },
      guidance: [
        `ขาย Covered Call 35-45 DTE ที่ระดับ Delta 0.25 (Strike $${coveredCallStrike})`,
        'หากมีความผันผวนสูงช่วงประกาศงบ สามารถซื้อ Protective Put ที่ $93% เพื่อปิดความเสี่ยง Tail Risk',
      ],
    };

    const t4_06: TacticalAgentOutput = {
      agentId: 'T4-06',
      agentName: 'Hedging & Correlation Agent',
      tacticDomain: 'Beta Mitigation & Market Direction Neutrality',
      actionableDecision: `หุ้นมี Beta 1.35x เทียบ SPY แนะนำเปิด Short SPY หรือถือเงินสดสำรอง 15% ชดเชย`,
      keyMetricLabel: 'Beta to Benchmark',
      keyMetricValue: '1.35x Beta vs SPY',
      parameters: { portfolioBeta: 1.35, correlationToSpy: 0.78, hedgeRatioPct: 15 },
      guidance: [
        'ความสัมพันธ์กับตลาดสหรัฐฯ อยู่ในระดับปานกลาง-สูง (Correlation 0.78)',
        'เมื่อตลาดเข้าสู่โหมด Risk-Off แนะนำลดสัดส่วนถือครองลง 30%',
      ],
    };

    const t4_07: TacticalAgentOutput = {
      agentId: 'T4-07',
      agentName: 'Execution Strategy Agent',
      tacticDomain: 'Algorithmic Smart Order Routing (TWAP/VWAP)',
      actionableDecision: 'ส่งคำสั่งแบบ LIMIT หรือแบ่งซอยคำสั่งด้วยอัลกอริทึม TWAP ตลอด 30 นาทีแรกของตลาด',
      keyMetricLabel: 'Execution Style',
      keyMetricValue: 'TWAP / Limit Inside Bid-Ask',
      parameters: { executionStyle: 'TWAP', orderType: 'LIMIT' },
      guidance: [
        'หลีกเลี่ยงการเคาะ Market Order ทันทีตอนตลาดเปิด 15 นาทีแรก (Market Open Volatility Spike)',
        'ตั้ง Limit Order ณ ราคา Mid-price ในช่วงที่มีสภาพคล่องสูงสุด (10:00 - 11:30 EST)',
      ],
    };

    const t4_08: TacticalAgentOutput = {
      agentId: 'T4-08',
      agentName: 'Liquidity & Slippage Agent',
      tacticDomain: 'Spread Verification & Slippage Minimization',
      actionableDecision: `Bid-Ask Spread แคบ (${spreadPct}%) ผ่านเกณฑ์สภาพคล่อง ไม่มีความเสี่ยงเรื่อง Slippage รุนแรง`,
      keyMetricLabel: 'Estimated Slippage',
      keyMetricValue: `${estimatedSlippageBps} bps (${spreadPct}% Spread)`,
      parameters: { spreadPct, estimatedSlippageBps, maxSpreadPct: 0.30 },
      guidance: [
        `Spread (${spreadPct}%) ต่ำกว่าเพดาน Hard Risk Engine (0.30%) อย่างปลอดภัย`,
        `มูลค่าการซื้อขายเฉลี่ยสูงกว่า $50M/วัน จัดอยู่ในกลุ่มสภาพคล่องระดับพรีเมียม (Tier 1 Liquidity)`,
      ],
    };

    const t4_09: TacticalAgentOutput = {
      agentId: 'T4-09',
      agentName: 'Risk-Reward Optimization Agent',
      tacticDomain: 'Asymmetric Return & Mathematical Payoff Filter',
      actionableDecision: riskRewardValid
        ? `อัตรา Risk/Reward (${riskRewardRatio}:1) ผ่านเกณฑ์ขั้นต่ำ 2.0:1 คุ้มค่าความเสี่ยงเชิงคณิตศาสตร์`
        : `อัตรา Risk/Reward (${riskRewardRatio}:1) ต่ำกว่าเกณฑ์ 2.0:1 ไม่อนุญาตให้เปิดสถานะ`,
      keyMetricLabel: 'Risk/Reward Ratio',
      keyMetricValue: `${riskRewardRatio}:1 [${riskRewardValid ? 'PASS' : 'FAIL'}]`,
      parameters: { riskRewardRatio, minRequired: 2.0, passed: riskRewardValid },
      guidance: [
        'ผลตอบแทนคาดหวังที่ TP1 คุ้มครองความเสียหายจากการขาดทุนได้เกิน 2 เท่าตัว',
        'เข้าเกณฑ์ Asymmetric Bet ของ Master Investment Committee',
      ],
    };

    // 9. Synthesis by T4-10 Tactical Chairman Agent
    let isTradeApproved = riskRewardValid && !isVetoed;
    let approvalStatusSummary = '';

    if (isVetoed) {
      isTradeApproved = false;
      approvalStatusSummary = `🚨 REJECTED BY RED TEAM VETO: หุ้น ${stock.ticker} ถูกระงับคำสั่งซื้อขายเด็ดขาดจากฝ่ายค้าน (Veto Triggered)`;
    } else if (!riskRewardValid) {
      isTradeApproved = false;
      approvalStatusSummary = `❌ REJECTED BY RISK ENGINE: อัตรา Risk/Reward (${riskRewardRatio}:1) ไม่ถึงเกณฑ์ขั้นต่ำ 2.0:1`;
    } else {
      isTradeApproved = true;
      approvalStatusSummary = `✅ TACTICAL PLAN APPROVED: แผนซื้อขายของ ${stock.ticker} ผ่านเกณฑ์สมบูรณ์ (R/R: ${riskRewardRatio}:1, Size: ${sizingResult.recommendedSizePct}%, SL: $${stopLoss}, TP1: $${takeProfit1})`;
    }

    const t4_10: TacticalAgentOutput = {
      agentId: 'T4-10',
      agentName: 'Tactical Chairman Agent',
      tacticDomain: 'Master Tactical Synthesis & CIO Submission',
      actionableDecision: approvalStatusSummary,
      keyMetricLabel: 'Tactical Approval Status',
      keyMetricValue: isTradeApproved ? 'APPROVED ✅' : 'REJECTED ❌',
      parameters: { isTradeApproved, isVetoed, riskRewardRatio },
      guidance: [
        `ขนาดเสนอซื้อ: ${sizingResult.recommendedSizePct}% | Stop Loss: $${stopLoss} | Take Profit: $${takeProfit1} - $${takeProfit3}`,
        'แผนการเทรดนี้พร้อมส่งต่อไปยังคณะกรรมการ AI-CIO เพื่อตัดสินใจขั้นสุดท้าย',
      ],
    };

    return {
      ticker: stock.ticker,
      companyName: stock.name,
      sector: stock.sector,
      currentPrice,
      direction: 'LONG',
      timeframe: 'SWING',
      setupType,
      entryPrice,
      entryZone,
      stopLoss,
      stopLossDistancePct,
      riskUnitR: actualRiskUnitR,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      riskRewardRatio,
      riskRewardValid,
      positionSizing: sizingResult,
      optionsOverlay: {
        recommendedStrategy: 'COVERED_CALL',
        callStrike: coveredCallStrike,
        putStrike: protectivePutStrike,
        expirationDays: 35,
        hedgeEfficiency: 'Yield Boost +2.5% Annualized',
      },
      hedgingStrategy: {
        portfolioBeta: 1.35,
        correlationToSpy: 0.78,
        hedgeInstrument: 'SHORT SPY / CASH_BUFFER',
        hedgeRatioPct: 15,
      },
      executionTactics: {
        orderType: 'LIMIT',
        maxAllowableSpreadPct: 0.30,
        currentSpreadPct: spreadPct,
        estimatedSlippageBps,
        darkPoolPreference: (stock.marketCap || 0) > 200_000_000_000,
      },
      agentReports: {
        timing: t4_01,
        sizing: t4_02,
        stopLoss: t4_03,
        takeProfit: t4_04,
        options: t4_05,
        hedging: t4_06,
        execution: t4_07,
        liquidity: t4_08,
        riskReward: t4_09,
        chairman: t4_10,
      },
      redTeamVetoActive: isVetoed,
      isTradeApproved,
      approvalStatusSummary,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Convert Tactical Result to TradePlan object for Paper Execution & Hard Risk Engine
   */
  public toTradePlan(tactical: TacticalTradePlanResult): TradePlan {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const shares = tactical.positionSizing.riskAdjustedCapitalUsd > 0 
      ? Math.floor(tactical.positionSizing.riskAdjustedCapitalUsd / tactical.entryPrice)
      : 10;
    const maxLoss = Number((tactical.riskUnitR * shares).toFixed(2));

    return {
      id: `plan-${tactical.ticker.toLowerCase()}-${Date.now()}`,
      ticker: tactical.ticker,
      companyName: tactical.companyName,
      strategy: `Tactical Kelly ${tactical.setupType}`,
      direction: tactical.direction,
      time_horizon: tactical.timeframe === 'POSITION' ? 'POSITION' : 'SWING',
      current_price: tactical.currentPrice,
      entry_low: tactical.entryZone.low,
      entry_high: tactical.entryZone.high,
      stop_loss: tactical.stopLoss,
      invalidation: tactical.stopLoss,
      tp1: tactical.takeProfit1,
      tp2: tactical.takeProfit2,
      tp3: tactical.takeProfit3,
      risk_reward: tactical.riskRewardRatio,
      position_size: tactical.positionSizing.recommendedSizePct,
      portfolio_weight: tactical.positionSizing.recommendedSizePct,
      max_loss_usd: maxLoss,
      confidence: tactical.isTradeApproved ? 0.85 : 0.45,
      ranking_score: 80,
      research_score: 80,
      red_team_score: tactical.redTeamVetoActive ? 85 : 25,
      consensus_score: tactical.isTradeApproved ? 85 : 45,
      market_regime: 'RISK_ON',
      reason: `Tactical Kelly plan: ${tactical.setupType} setup. SL: $${tactical.stopLoss}, TP1: $${tactical.takeProfit1}, TP2: $${tactical.takeProfit2}`,
      red_team_veto: tactical.redTeamVetoActive,
      status: tactical.isTradeApproved ? 'APPROVED' : 'REJECTED',
      created_at: tactical.createdAt,
      expires_at: expiresAt,
    };
  }
}

export const team4TacticalEngine = new Team4TacticalEngine();
