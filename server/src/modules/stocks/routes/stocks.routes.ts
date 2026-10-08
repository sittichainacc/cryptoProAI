// ============================================================================
// Global Stock Multi-Agent API Router (Phase 0)
// ============================================================================

import { Router, Request, Response } from 'express';
import { globalStockStore } from '../engine/stock_store.js';
import { ALL_41_AGENTS } from '../agents/registry.js';
import { riskEngine } from '../engine/risk_engine.js';
import { pool } from '../../../database/db.js';
import { team1RankingEngine, FactorWeights } from '../engine/team1_ranking.engine.js';
import { team2ResearchEngine } from '../engine/team2_research.engine.js';
import { team3RedTeamEngine } from '../engine/team3_red_team.engine.js';
import { team4TacticalEngine } from '../engine/team4_tactical.engine.js';
import { cioConsensusEngine } from '../engine/cio_consensus.engine.js';
import { portfolioRiskEngine } from '../engine/portfolio_risk.engine.js';
import { paperTradingEngine } from '../engine/paper_trading.engine.js';
import { backtestEngine } from '../engine/backtest.engine.js';
import { marketDataProvider } from '../providers/market_data_provider.service.js';
import { realtimeSSEService } from '../realtime/realtime_sse.service.js';
import { notificationDispatcher } from '../notifications/notification_dispatcher.service.js';
import { aiCIOAssistant, QuickActionType, BriefingType } from '../assistant/ai_cio_assistant.service.js';

export const stocksRouter = Router();

// Health Check
stocksRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    module: 'Global Equity Intelligence & Autonomous Trading System',
    phase: 'PHASE_0',
    agentsRegistered: ALL_41_AGENTS.length,
    activeUniverseCount: globalStockStore.getUniverse().length,
    timestamp: new Date().toISOString(),
  });
});

// Market Regime & Macro Context
stocksRouter.get('/regime', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: globalStockStore.getMarketRegime(),
  });
});

// Stock Universe Screener
stocksRouter.get('/universe', (req: Request, res: Response) => {
  const { sector } = req.query;
  let list = globalStockStore.getUniverse();
  if (sector && typeof sector === 'string') {
    list = list.filter((s) => s.sector.toLowerCase() === sector.toLowerCase());
  }
  res.json({
    success: true,
    count: list.length,
    data: list,
  });
});

// Advanced Multi-Factor Screener (Phase 1)
stocksRouter.get('/screener', (req: Request, res: Response) => {
  const {
    sector,
    minMarketCap,
    maxPe,
    minRoe,
    minRevenueGrowth,
    minGrossMargin,
    rsiState,
    technicalSetup,
  } = req.query;

  const results = globalStockStore.getScreenerResults({
    sector: typeof sector === 'string' ? sector : undefined,
    minMarketCap: minMarketCap ? parseFloat(minMarketCap as string) : undefined,
    maxPe: maxPe ? parseFloat(maxPe as string) : undefined,
    minRoe: minRoe ? parseFloat(minRoe as string) : undefined,
    minRevenueGrowth: minRevenueGrowth ? parseFloat(minRevenueGrowth as string) : undefined,
    minGrossMargin: minGrossMargin ? parseFloat(minGrossMargin as string) : undefined,
    rsiState: typeof rsiState === 'string' ? (rsiState as any) : undefined,
    technicalSetup: typeof technicalSetup === 'string' ? (technicalSetup as any) : undefined,
  });

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
});

// Historical Chart Candles & Computed Technical Indicators (Phase 1)
stocksRouter.get('/chart/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string) || '';
  const chartData = globalStockStore.getStockChart(ticker);
  if (!chartData) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูลกราฟของหุ้น '${ticker.toUpperCase()}'`,
    });
  }
  res.json({
    success: true,
    data: chartData,
  });
});

// SEC Filings (10-K, 10-Q, 8-K) (Phase 1)
stocksRouter.get('/filings/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string) || '';
  const filings = globalStockStore.getStockFilings(ticker);
  res.json({
    success: true,
    count: filings.length,
    ticker: ticker.toUpperCase(),
    data: filings,
  });
});

// Technical Indicators Matrix (Phase 1)
stocksRouter.get('/indicators/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string) || '';
  const indicators = globalStockStore.getStockIndicators(ticker);
  if (!indicators) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูล Indicators ของหุ้น '${ticker.toUpperCase()}'`,
    });
  }
  res.json({
    success: true,
    data: indicators,
  });
});

// 41 Agents Registry
stocksRouter.get('/agents', (req: Request, res: Response) => {
  const { team } = req.query;
  let agents = ALL_41_AGENTS;
  if (team) {
    agents = agents.filter((a) => a.team.toString() === team.toString());
  }
  res.json({
    success: true,
    count: agents.length,
    data: agents,
  });
});

// Multi-Agent Analysis by Ticker
stocksRouter.get('/analysis/:ticker', (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string) || '';
  const analysis = globalStockStore.getMultiAgentAnalysis(ticker);
  if (!analysis) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูลหุ้นสัญลักษณ์ '${ticker.toUpperCase()}' ในระบบ`,
    });
  }
  res.json({
    success: true,
    data: analysis,
  });
});

// High-Conviction Trade Plans & Top Opportunities
stocksRouter.get('/trade-plans', (_req: Request, res: Response) => {
  const plans = globalStockStore.getTopOpportunities();
  res.json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

// Hard Risk Engine Status & Rules
stocksRouter.get('/risk/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      config: riskEngine.getConfig(),
      engineType: 'Deterministic Code (Non-LLM Guardrail)',
      killSwitchActive: riskEngine.getConfig().global_kill_switch_active,
      timestamp: new Date().toISOString(),
    },
  });
});

// Toggle Global Kill Switch
stocksRouter.post('/risk/kill-switch', (req: Request, res: Response) => {
  const { active, reason } = req.body;
  riskEngine.setKillSwitch(!!active, reason || 'Manual toggle via Admin UI');
  res.json({
    success: true,
    message: `Global Kill Switch is now: ${riskEngine.getConfig().global_kill_switch_active ? 'ACTIVE (Trading Halted)' : 'INACTIVE (Normal)'}`,
    config: riskEngine.getConfig(),
  });
});

// Paper Trading Order Submission (Unified Phase 8 Engine)
// Accepts both Phase 8 payload ({ shares, orderType }) and legacy Phase 0 payload ({ quantity, price }).
// All orders pass through: Red Team VETO -> Kill Switch -> Circuit Breakers -> Cash -> 10% Position -> 30% Sector.
stocksRouter.post('/paper/order', async (req: Request, res: Response) => {
  try {
    const { ticker, side, orderType, shares, quantity, limitPrice, stopPrice, convictionScore } = req.body || {};
    const qty = Number(shares ?? quantity);

    if (!ticker || !side || !qty) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุ ticker, side (BUY/SELL) และ shares ให้ครบถ้วน',
      });
    }

    const order = await paperTradingEngine.submitOrder({
      ticker: String(ticker),
      side: String(side).toUpperCase() as 'BUY' | 'SELL',
      orderType: (orderType ? String(orderType).toUpperCase() : 'MARKET') as any,
      shares: qty,
      limitPrice: limitPrice ? Number(limitPrice) : undefined,
      stopPrice: stopPrice ? Number(stopPrice) : undefined,
      convictionScore: convictionScore ? Number(convictionScore) : undefined,
    });

    const isRejected = order.status === 'REJECTED';
    res.status(isRejected ? 422 : 200).json({
      success: !isRejected,
      message: isRejected
        ? `⛔ คำสั่งซื้อขายถูกปฏิเสธโดย Hard Risk Engine: ${order.rejectReason}`
        : `✅ ส่งคำสั่ง ${order.side} ${order.shares} หุ้น ${order.ticker} สถานะ ${order.status}`,
      error: isRejected ? order.rejectReason : undefined,
      data: order,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Deterministic Hard Risk Engine Trade Evaluation
stocksRouter.post('/risk/evaluate', (req: Request, res: Response) => {
  const proposal = req.body?.proposal;
  const portfolio = req.body?.portfolio || {
    totalEquity: 100000,
    cashBalance: 40000,
    openPositionsCount: 3,
    currentDrawdownPct: 2.5,
    todayLossUsd: 120,
    sectorExposurePct: {},
    industryExposurePct: {},
  };
  const marketContext = req.body?.marketContext || {
    tickerDailyVolumeUsd: 150_000_000,
    spreadPct: 0.05,
    daysUntilEarnings: 15,
  };

  if (!proposal || !proposal.ticker) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุข้อมูล proposal ให้ครบถ้วน' });
  }

  // Cross-reference Red Team Veto if not explicitly specified
  if (proposal.red_team_veto === undefined) {
    const audit = team3RedTeamEngine.auditStock(proposal.ticker);
    if (audit?.vetoTriggered) {
      proposal.red_team_veto = true;
    }
  }

  const result = riskEngine.evaluateTradeProposal(proposal, portfolio, marketContext);
  res.json({
    success: true,
    data: result,
  });
});

// ============================================================================
// Phase 2: Team 1 Stock Ranking Endpoints
// ============================================================================

// Get Current Factor Weights
stocksRouter.get('/ranking/weights', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: team1RankingEngine.getWeights(),
  });
});

// Update Factor Weights
stocksRouter.post('/ranking/weights', (req: Request, res: Response) => {
  const updated = team1RankingEngine.setWeights(req.body || {});
  res.json({
    success: true,
    message: 'ปรับแต่งค่าน้ำหนัก Factor สำเร็จ (Normalized 100%)',
    data: updated,
  });
});

// Get Latest Team 1 Ranking Run
stocksRouter.get('/ranking/latest', (_req: Request, res: Response) => {
  const result = team1RankingEngine.getLatestRun();
  res.json({
    success: true,
    data: result,
  });
});

// Trigger Team 1 Ranking Run
stocksRouter.post('/ranking/run', async (req: Request, res: Response) => {
  try {
    const customWeights: Partial<FactorWeights> | undefined = req.body?.weights;
    const rankingResult = team1RankingEngine.runRanking(customWeights);

    // Asynchronously try to persist run into PostgreSQL (non-blocking)
    try {
      await pool.query(
        `INSERT INTO public.stock_ranking_runs 
         (id, universe_size, market_regime, weights, highest_ticker, highest_score, summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          rankingResult.runId,
          rankingResult.universeSize,
          rankingResult.marketRegime,
          JSON.stringify(rankingResult.weights),
          rankingResult.summary.highestScoreTicker,
          rankingResult.summary.highestScore,
          JSON.stringify(rankingResult.summary),
        ]
      );

      for (const candidate of rankingResult.topCandidates) {
        await pool.query(
          `INSERT INTO public.stock_ranking_scores
           (run_id, ticker, rank, total_score, conviction, factor_scores, chairman_summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            rankingResult.runId,
            candidate.ticker,
            candidate.rank,
            candidate.totalScore,
            candidate.conviction,
            JSON.stringify(candidate.factorScores),
            candidate.chairmanSummary,
          ]
        );
      }
    } catch (dbErr: any) {
      // In-memory store continues flawlessly if DB insert is skipped
      console.warn('[Ranking API] DB record skipped (using memory result):', dbErr.message);
    }

    res.json({
      success: true,
      message: `ประมวลผลจัดอันดับหุ้นสำเร็จ (Team 1 ประเมินหุ้นทั้งหมด ${rankingResult.universeSize} ตัว)`,
      data: rankingResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการประมวลผลจัดอันดับหุ้น: ' + err.message,
    });
  }
});

// ============================================================================
// Phase 3: Team 2 Equity Research & DCF Valuation Endpoints
// ============================================================================

// Get Full Equity Research Report for a Stock
stocksRouter.get('/research/:ticker', async (req: Request, res: Response) => {
  const ticker = ((req.params.ticker as string) || '').toUpperCase();
  const report = team2ResearchEngine.generateReport(ticker);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูลงานวิจัยของหุ้น '${ticker}' ในระบบ Universe`,
    });
  }

  // Non-blocking asynchronous persistence to PostgreSQL
  try {
    await pool.query(
      `INSERT INTO public.stock_research_reports 
       (ticker, fair_value_base, fair_value_bull, fair_value_bear, margin_of_safety_pct, moat_rating, moat_score, overall_score, wacc, terminal_growth, valuation_data, scenarios, agent_theses, chairman_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        report.ticker,
        report.scenarios.base.targetPrice,
        report.scenarios.bull.targetPrice,
        report.scenarios.bear.targetPrice,
        report.valuation.marginOfSafetyPct,
        report.moat.rating,
        report.moat.score,
        report.overallResearchScore,
        report.valuation.wacc,
        report.valuation.terminalGrowthRate,
        JSON.stringify(report.valuation),
        JSON.stringify(report.scenarios),
        JSON.stringify(report.agentTheses),
        report.chairmanSummary,
      ]
    );
  } catch (dbErr: any) {
    console.warn('[Research API] DB record skipped (using memory result):', dbErr.message);
  }

  res.json({
    success: true,
    data: report,
  });
});

// Dynamic DCF Valuation Recalculator
stocksRouter.post('/research/dcf', (req: Request, res: Response) => {
  const { ticker, wacc, terminalGrowthRate, growthRateStage1 } = req.body || {};
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ ticker' });
  }

  const stock = globalStockStore.getStock((ticker as string).toUpperCase());
  if (!stock) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบหุ้น '${ticker.toUpperCase()}' ในระบบ Universe`,
    });
  }

  const result = team2ResearchEngine.calculateDCF(stock, {
    wacc: wacc !== undefined ? Number(wacc) : undefined,
    terminalGrowthRate: terminalGrowthRate !== undefined ? Number(terminalGrowthRate) : undefined,
    growthRateStage1: growthRateStage1 !== undefined ? Number(growthRateStage1) : undefined,
  });

  res.json({
    success: true,
    message: `คำนวณ 2-Stage DCF ของ ${stock.ticker} สำเร็จ`,
    data: result,
  });
});

// ============================================================================
// Phase 4: Team 3 Red Team Adversarial Engine Endpoints
// ============================================================================

// Universe Red Team Threat Summary (Audits all stocks in active universe)
stocksRouter.get('/red-team/universe', (req: Request, res: Response) => {
  const universe = globalStockStore.getUniverse();
  const audits = universe.map((s) => team3RedTeamEngine.auditStock(s.ticker)).filter(Boolean);
  
  const vetoedCount = audits.filter((a) => a?.vetoTriggered).length;
  const criticalCount = audits.filter((a) => a?.overallThreatLevel === 'CRITICAL').length;
  const highRiskCount = audits.filter((a) => a?.overallThreatLevel === 'HIGH').length;

  res.json({
    success: true,
    totalAudited: audits.length,
    vetoedCount,
    criticalCount,
    highRiskCount,
    data: audits,
  });
});

// Single Stock Red Team Adversarial Audit
stocksRouter.get('/red-team/:ticker', async (req: Request, res: Response) => {
  const ticker = ((req.params.ticker as string) || '').toUpperCase();
  const audit = team3RedTeamEngine.auditStock(ticker);
  if (!audit) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูลตรวจสอบความเสี่ยงของหุ้น '${ticker}' ใน Universe`,
    });
  }

  // Non-blocking PostgreSQL persistence
  try {
    await pool.query(
      `INSERT INTO public.stock_red_team_audits 
       (ticker, threat_level, threat_score, veto_triggered, veto_reason, red_flags_count, beneish_m_score, is_manipulator_risk, crowded_score, agent_reports, summary_objections, chairman_synthesis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        audit.ticker,
        audit.overallThreatLevel,
        audit.threatScore,
        audit.vetoTriggered,
        audit.vetoReason || null,
        audit.redFlagsCount,
        audit.beneishMScore.mScore,
        audit.beneishMScore.isManipulatorRisk,
        audit.crowdedTrade.crowdedScore,
        JSON.stringify(audit.agentReports),
        JSON.stringify(audit.summaryObjections),
        audit.chairmanSynthesis,
      ]
    );
  } catch (dbErr: any) {
    console.warn('[RedTeam API] DB record skipped (using memory result):', dbErr.message);
  }

  res.json({
    success: true,
    data: audit,
  });
});

// Red Team Audit with Simulation / Forced VETO Test
stocksRouter.post('/red-team/audit', async (req: Request, res: Response) => {
  const { ticker, simulateCriticalVeto } = req.body || {};
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ ticker' });
  }

  const audit = team3RedTeamEngine.auditStock(ticker, !!simulateCriticalVeto);
  if (!audit) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูลตรวจสอบความเสี่ยงของหุ้น '${ticker.toUpperCase()}' ใน Universe`,
    });
  }

  try {
    await pool.query(
      `INSERT INTO public.stock_red_team_audits 
       (ticker, threat_level, threat_score, veto_triggered, veto_reason, red_flags_count, beneish_m_score, is_manipulator_risk, crowded_score, agent_reports, summary_objections, chairman_synthesis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        audit.ticker,
        audit.overallThreatLevel,
        audit.threatScore,
        audit.vetoTriggered,
        audit.vetoReason || null,
        audit.redFlagsCount,
        audit.beneishMScore.mScore,
        audit.beneishMScore.isManipulatorRisk,
        audit.crowdedTrade.crowdedScore,
        JSON.stringify(audit.agentReports),
        JSON.stringify(audit.summaryObjections),
        audit.chairmanSynthesis,
      ]
    );
  } catch (dbErr: any) {
    console.warn('[RedTeam API] DB record skipped:', dbErr.message);
  }

  res.json({
    success: true,
    message: `ทำการ Audit หุ้น ${audit.ticker} สำเร็จ (VETO: ${audit.vetoTriggered ? 'TRIGGERED 🚨' : 'CLEARED ✅'})`,
    data: audit,
  });
});

// ============================================================================
// Phase 5: Team 4 Tactical Asset Allocation & Execution Endpoints
// ============================================================================

// Universe Tactical Plans Overview
stocksRouter.get('/tactical/universe', (req: Request, res: Response) => {
  const equity = req.query.equity ? parseFloat(req.query.equity as string) : 100_000;
  const universe = globalStockStore.getUniverse();
  const plans = universe.map((s) => team4TacticalEngine.generateTacticalPlan(s.ticker, equity)).filter(Boolean);

  const approvedCount = plans.filter((p) => p?.isTradeApproved).length;
  const avgKellyPct = Number(
    (plans.reduce((acc, p) => acc + (p?.positionSizing.recommendedSizePct || 0), 0) / (plans.length || 1)).toFixed(1)
  );
  const avgRR = Number(
    (plans.reduce((acc, p) => acc + (p?.riskRewardRatio || 0), 0) / (plans.length || 1)).toFixed(2)
  );

  res.json({
    success: true,
    totalUniverse: plans.length,
    approvedCount,
    avgKellyPct,
    avgRR,
    data: plans,
  });
});

// Single Stock Tactical Trade Plan
stocksRouter.get('/tactical/:ticker', async (req: Request, res: Response) => {
  const ticker = ((req.params.ticker as string) || '').toUpperCase();
  const equity = req.query.equity ? parseFloat(req.query.equity as string) : 100_000;

  const plan = team4TacticalEngine.generateTacticalPlan(ticker, equity);
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบข้อมูลแผนกลยุทธ์ของหุ้น '${ticker}' ในระบบ Universe`,
    });
  }

  // Non-blocking PostgreSQL persistence
  try {
    await pool.query(
      `INSERT INTO public.stock_tactical_plans 
       (ticker, setup_type, entry_price, entry_zone_low, entry_zone_high, stop_loss, take_profit_1, take_profit_2, take_profit_3, risk_reward_ratio, kelly_size_pct, is_trade_approved, tactical_plan_data, agent_reports, approval_status_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        plan.ticker,
        plan.setupType,
        plan.entryPrice,
        plan.entryZone.low,
        plan.entryZone.high,
        plan.stopLoss,
        plan.takeProfit1,
        plan.takeProfit2,
        plan.takeProfit3,
        plan.riskRewardRatio,
        plan.positionSizing.recommendedSizePct,
        plan.isTradeApproved,
        JSON.stringify(plan),
        JSON.stringify(plan.agentReports),
        plan.approvalStatusSummary,
      ]
    );
  } catch (dbErr: any) {
    console.warn('[Tactical API] DB record skipped (using memory result):', dbErr.message);
  }

  res.json({
    success: true,
    data: plan,
  });
});

// Custom Tactical Plan Generator / Recalculator
stocksRouter.post('/tactical/plan', async (req: Request, res: Response) => {
  const { ticker, portfolioEquity, targetEntry, customStopLoss, winProb } = req.body || {};
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ ticker' });
  }

  const equity = portfolioEquity ? parseFloat(portfolioEquity) : 100_000;
  const plan = team4TacticalEngine.generateTacticalPlan(ticker, equity, {
    targetEntry: targetEntry ? parseFloat(targetEntry) : undefined,
    customStopLoss: customStopLoss ? parseFloat(customStopLoss) : undefined,
    winProb: winProb ? parseFloat(winProb) : undefined,
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      error: `ไม่พบหุ้น '${ticker.toUpperCase()}' ในระบบ Universe`,
    });
  }

  try {
    await pool.query(
      `INSERT INTO public.stock_tactical_plans 
       (ticker, setup_type, entry_price, entry_zone_low, entry_zone_high, stop_loss, take_profit_1, take_profit_2, take_profit_3, risk_reward_ratio, kelly_size_pct, is_trade_approved, tactical_plan_data, agent_reports, approval_status_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        plan.ticker,
        plan.setupType,
        plan.entryPrice,
        plan.entryZone.low,
        plan.entryZone.high,
        plan.stopLoss,
        plan.takeProfit1,
        plan.takeProfit2,
        plan.takeProfit3,
        plan.riskRewardRatio,
        plan.positionSizing.recommendedSizePct,
        plan.isTradeApproved,
        JSON.stringify(plan),
        JSON.stringify(plan.agentReports),
        plan.approvalStatusSummary,
      ]
    );
  } catch (dbErr: any) {
    console.warn('[Tactical API] DB record skipped:', dbErr.message);
  }

  res.json({
    success: true,
    message: `สร้างแผน Tactical Trade Plan สำหรับ ${plan.ticker} สำเร็จ`,
    data: plan,
  });
});

// Interactive Kelly Criterion Position Sizing Simulator
stocksRouter.post('/tactical/kelly', (req: Request, res: Response) => {
  const { ticker, portfolioEquity, winProbability, payoutRatio } = req.body || {};
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ ticker' });
  }

  const equity = portfolioEquity ? parseFloat(portfolioEquity) : 100_000;
  const result = team4TacticalEngine.calculateKellySizing(ticker, equity, {
    winProb: winProbability !== undefined ? parseFloat(winProbability) : undefined,
    payoutRatio: payoutRatio !== undefined ? parseFloat(payoutRatio) : undefined,
  });

  res.json({
    success: true,
    data: result,
  });
});

// ============================================================================
// Phase 6: AI-CIO Investment Committee Chamber & Consensus Calibration Endpoints
// ============================================================================

// Get CIO Investment Committee Memo for a ticker
stocksRouter.get('/cio/memo/:ticker', async (req: Request, res: Response) => {
  const ticker = String(req.params.ticker || '');
  const memo = cioConsensusEngine.conveneCommittee(ticker);
  if (!memo) {
    return res.status(404).json({
      success: false,
      error: `ไม่สามารถออกมติ AI-CIO สำหรับ '${ticker.toUpperCase()}' ได้`,
    });
  }

  // Persist to DB asynchronously
  cioConsensusEngine.saveMemoToDb(memo).catch((err) => {
    console.warn('[CIO API] DB persistence skipped:', err.message);
  });

  res.json({
    success: true,
    data: memo,
  });
});

// Convene committee with custom portfolio capital
stocksRouter.post('/cio/convene', async (req: Request, res: Response) => {
  const { ticker, portfolioEquity } = req.body || {};
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ ticker' });
  }

  const equity = portfolioEquity ? parseFloat(portfolioEquity) : 100_000;
  const memo = cioConsensusEngine.conveneCommittee(ticker, equity);
  if (!memo) {
    return res.status(404).json({
      success: false,
      error: `ไม่สามารถจัดประชุมคณะกรรมการสำหรับ '${ticker.toUpperCase()}' ได้`,
    });
  }

  cioConsensusEngine.saveMemoToDb(memo).catch((err) => {
    console.warn('[CIO API] DB persistence skipped:', err.message);
  });

  res.json({
    success: true,
    message: `ประชุมคณะกรรมการ AI-CIO 41 Agents สำหรับ ${memo.ticker} สำเร็จ`,
    data: memo,
  });
});

// Get historical accuracy & Brier scores for all 41 Agents
stocksRouter.get('/cio/accuracy', (_req: Request, res: Response) => {
  const accuracies = cioConsensusEngine.getAgentAccuracies();
  res.json({
    success: true,
    totalAgents: accuracies.length,
    data: accuracies,
  });
});

// Recalibrate agent weight with updated Brier score
stocksRouter.post('/cio/recalibrate', (req: Request, res: Response) => {
  const { agentId, brierScore } = req.body || {};
  if (!agentId || brierScore === undefined) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ agentId และ brierScore' });
  }

  cioConsensusEngine.recalibrateAgent(agentId, parseFloat(brierScore));
  const updated = cioConsensusEngine.getAgentAccuracies().find((a) => a.agentId === agentId);

  res.json({
    success: true,
    message: `Recalibrated agent ${agentId} successfully`,
    data: updated,
  });
});

// Get universe-wide CIO decisions summary
stocksRouter.get('/cio/universe', (_req: Request, res: Response) => {
  const universe = globalStockStore.getUniverse();
  const summary = universe.map((stock) => {
    const memo = cioConsensusEngine.conveneCommittee(stock.ticker);
    return {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      price: stock.price,
      action: memo?.consensusAction || 'HOLD',
      consensusScore: memo?.consensusScore || 50,
      calibratedApprovalPct: memo?.calibratedApprovalPct || 50,
      supermajorityApproved: memo?.supermajorityApproved || false,
      redTeamVetoActive: memo?.redTeamVetoActive || false,
      allocationPct: memo?.mandateExecution.portfolioWeightPct || 0,
      hardStopLoss: memo?.mandateExecution.hardStopLoss || 0,
      primaryTargetTp2: memo?.mandateExecution.primaryTargetTp2 || 0,
    };
  });

  res.json({
    success: true,
    count: summary.length,
    data: summary,
  });
});

// ============================================================================
// Phase 7: Portfolio & Real-Time Risk Engine Endpoints
// ============================================================================

// Get real-time portfolio risk summary
stocksRouter.get('/portfolio/summary', async (_req: Request, res: Response) => {
  const summary = portfolioRiskEngine.getRiskSummary();
  // Persist snapshot to DB asynchronously
  portfolioRiskEngine.persistSnapshot().catch((err) => {
    console.warn('[Portfolio API] Snapshot persist failed:', err.message);
  });

  res.json({
    success: true,
    data: summary,
  });
});

// Get sector concentrations vs 30% hard cap
stocksRouter.get('/portfolio/sectors', (_req: Request, res: Response) => {
  const sectors = portfolioRiskEngine.getSectorExposures();
  res.json({
    success: true,
    hardCapPct: 30.0,
    data: sectors,
  });
});

// Get live portfolio holdings mark-to-market
stocksRouter.get('/portfolio/holdings', (_req: Request, res: Response) => {
  const holdings = portfolioRiskEngine.getLiveHoldings();
  res.json({
    success: true,
    count: holdings.length,
    data: holdings,
  });
});

// Get Circuit Breaker status and event history
stocksRouter.get('/portfolio/circuit-breakers', (_req: Request, res: Response) => {
  const summary = portfolioRiskEngine.getRiskSummary();
  const history = portfolioRiskEngine.getCircuitBreakerHistory();
  res.json({
    success: true,
    currentLevel: summary.circuitBreakerLevel,
    currentStatus: summary.circuitBreakerStatus,
    killSwitchActive: summary.killSwitchActive,
    currentDrawdownPct: summary.currentDrawdownPct,
    maxDrawdownPct: summary.maxDrawdownPct,
    history,
  });
});

// Pre-trade validation against risk & circuit breakers
stocksRouter.post('/portfolio/check-trade', (req: Request, res: Response) => {
  const { ticker, side, notionalUsd } = req.body || {};
  if (!ticker || !side || notionalUsd === undefined) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ ticker, side (BUY/SELL), และ notionalUsd',
    });
  }

  const result = portfolioRiskEngine.canExecuteTrade(
    String(ticker),
    side === 'SELL' ? 'SELL' : 'BUY',
    Number(notionalUsd)
  );

  res.json({
    success: true,
    data: result,
  });
});

// Execute defensive deleveraging (Level 2 Circuit Breaker or manual)
stocksRouter.post('/portfolio/rebalance', (req: Request, res: Response) => {
  const { targetCashPct } = req.body || {};
  const targetPct = targetCashPct ? Number(targetCashPct) : 50.0;
  const result = portfolioRiskEngine.executeDeleveraging(targetPct);

  res.json({
    success: true,
    message: `Defensive deleveraging completed: Target cash ${targetPct}%`,
    data: result,
  });
});

// Emergency Kill Switch trigger or reset
stocksRouter.post('/portfolio/kill-switch', (req: Request, res: Response) => {
  const { action, reason, adminAuth } = req.body || {};

  if (action === 'RESET') {
    const resetResult = portfolioRiskEngine.resetKillSwitch(adminAuth === true);
    if (!resetResult.success) {
      return res.status(403).json(resetResult);
    }
    return res.json(resetResult);
  }

  // Trigger Kill Switch
  const triggerResult = portfolioRiskEngine.triggerEmergencyKillSwitch(
    reason || 'Manual Emergency Shutdown initiated by operator',
    adminAuth === true
  );

  res.json({
    success: true,
    message: '🚨 EMERGENCY KILL SWITCH EXECUTED! All positions liquidated to cash.',
    data: triggerResult,
  });
});

// Add / modify / remove a position
stocksRouter.post('/portfolio/position', (req: Request, res: Response) => {
  const { ticker, shares, averageEntryPrice, convictionScore } = req.body || {};
  if (!ticker || shares === undefined || averageEntryPrice === undefined) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ ticker, shares, และ averageEntryPrice',
    });
  }

  portfolioRiskEngine.setPosition(
    String(ticker),
    Number(shares),
    Number(averageEntryPrice),
    convictionScore ? Number(convictionScore) : 75
  );

  res.json({
    success: true,
    message: `Position for ${String(ticker).toUpperCase()} updated successfully`,
    data: portfolioRiskEngine.getLiveHoldings(),
  });
});

// ============================================================================
// Phase 8: Paper Trading Simulator Endpoints
// ============================================================================

// Get list of paper trading orders
stocksRouter.get('/paper/orders', (req: Request, res: Response) => {
  const { ticker, status } = req.query;
  const orders = paperTradingEngine.getOrders({
    ticker: ticker as string | undefined,
    status: status as any,
  });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// Get paper trading account & positions summary
stocksRouter.get('/paper/summary', (_req: Request, res: Response) => {
  const portfolioSummary = portfolioRiskEngine.getRiskSummary();
  const orders = paperTradingEngine.getOrders();
  const openOrdersCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'SUBMITTED').length;

  res.json({
    success: true,
    data: {
      portfolio: portfolioSummary,
      openOrdersCount,
      recentOrders: orders.slice(0, 10),
    },
  });
});

// Cancel a pending paper order
stocksRouter.post('/paper/order/:id/cancel', async (req: Request, res: Response) => {
  const result = await paperTradingEngine.cancelOrder(String(req.params.id));
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Close entire paper position at market price
stocksRouter.post('/paper/close-position', async (req: Request, res: Response) => {
  try {
    const { ticker, reason } = req.body || {};
    if (!ticker) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ ticker' });
    }

    const order = await paperTradingEngine.closePosition(String(ticker), reason || 'MANUAL_CLOSE');
    res.json({
      success: true,
      message: `✅ ปิดสถานะถือครองหุ้น ${ticker.toUpperCase()} เรียบร้อยแล้ว`,
      data: order,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// Reset paper trading account to clean initial capital
stocksRouter.post('/paper/reset', (req: Request, res: Response) => {
  const { initialCapital } = req.body || {};
  const capital = initialCapital ? Number(initialCapital) : 100000;
  paperTradingEngine.resetAccount(capital);

  res.json({
    success: true,
    message: `✅ รีเซ็ตพอร์ตเสมือน Paper Trading เป็นเงินสดเริ่มต้น $${capital.toLocaleString()} เรียบร้อยแล้ว`,
    data: portfolioRiskEngine.getRiskSummary(),
  });
});

// ============================================================================
// Phase 8: Strategy Backtesting Endpoints
// ============================================================================

// Get available quantitative strategies catalog
stocksRouter.get('/backtest/strategies', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: backtestEngine.getAvailableStrategies(),
  });
});

// Run backtest simulation
stocksRouter.post('/backtest/run', async (req: Request, res: Response) => {
  try {
    const result = await backtestEngine.runBacktest(req.body || {});
    res.json({
      success: true,
      message: `✅ การทดสอบย้อนหลัง (Backtest) กลยุทธ์ "${result.strategyName}" เสร็จสมบูรณ์`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// Get backtest run history
stocksRouter.get('/backtest/history', (_req: Request, res: Response) => {
  const history = backtestEngine.getRunHistory();
  res.json({
    success: true,
    count: history.length,
    data: history,
  });
});

// Get single backtest run by ID
stocksRouter.get('/backtest/run/:id', (req: Request, res: Response) => {
  const run = backtestEngine.getRunById(String(req.params.id));
  if (!run) {
    return res.status(404).json({ success: false, error: 'ไม่พบผลลัพธ์ Backtest' });
  }
  res.json({
    success: true,
    data: run,
  });
});

// ============================================================================
// Real-Time Market Data Provider Endpoints
// ============================================================================

// Provider connection health & market status
stocksRouter.get('/providers/status', async (_req: Request, res: Response) => {
  const isMarketOpen = marketDataProvider.isMarketOpen();
  const macro = await marketDataProvider.getMacroIndicators();
  res.json({
    success: true,
    provider: marketDataProvider.providerName,
    isMarketOpen,
    exchange: 'NYSE / NASDAQ',
    marketHours: '09:30 - 16:00 EST (Mon-Fri)',
    macroSummary: {
      us10y: `${macro.us10yYield}%`,
      vix: macro.vix,
      dxy: macro.dxyIndex,
    },
    timestamp: new Date().toISOString(),
  });
});

// Live quote for a specific symbol
stocksRouter.get('/live/quote/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol);
  const quote = await marketDataProvider.getQuote(symbol);
  if (!quote) {
    return res.status(404).json({ success: false, error: `ไม่พบข้อมูลสำหรับหุ้น ${symbol}` });
  }
  res.json({
    success: true,
    data: quote,
  });
});

// Live macro indicators
stocksRouter.get('/live/macro', async (_req: Request, res: Response) => {
  const macro = await marketDataProvider.getMacroIndicators();
  res.json({
    success: true,
    data: macro,
  });
});

// Live company news & sentiment
stocksRouter.get('/live/news/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol);
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 5;
  const news = await marketDataProvider.getCompanyNews(symbol, limit);
  res.json({
    success: true,
    count: news.length,
    data: news,
  });
});

// Sync universe in stockStore with live market data
stocksRouter.post('/sync-live', async (_req: Request, res: Response) => {
  try {
    const result = await marketDataProvider.syncStoreWithLiveData();
    res.json({
      success: true,
      message: `✅ อัปเดตข้อมูลราคาตลาดสดสำเร็จ (${result.syncedCount} ตัว)`,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ============================================================================
// Phase 10: Real-Time SSE Streaming & Multi-Channel Notification Endpoints
// ============================================================================

// Server-Sent Events (SSE) Stream Endpoint
stocksRouter.get('/stream', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = String(req.headers['user-agent'] || '');
  const clientId = realtimeSSEService.registerClient(res, ip, userAgent);
  console.log(`[SSE] Client connected: ${clientId} from ${ip}`);
});

// SSE Stream Status and Telemetry
stocksRouter.get('/stream/stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: realtimeSSEService.getStats(),
  });
});

// Broadcast manual tick or custom event to all connected SSE clients
stocksRouter.post('/stream/broadcast', (req: Request, res: Response) => {
  const { event, data } = req.body || {};
  if (!event) {
    return res.status(400).json({ success: false, error: 'Event name is required' });
  }
  realtimeSSEService.broadcast(event, data || {});
  res.json({
    success: true,
    message: `Broadcasted event '${event}' to ${realtimeSSEService.getStats().activeClients} clients`,
  });
});

// List all configured notification channels
stocksRouter.get('/notifications/channels', async (_req: Request, res: Response) => {
  try {
    const channels = await notificationDispatcher.getChannels();
    res.json({
      success: true,
      count: channels.length,
      data: channels,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or update a notification channel
stocksRouter.post('/notifications/channels', async (req: Request, res: Response) => {
  try {
    const channel = await notificationDispatcher.saveChannel(req.body);
    res.json({
      success: true,
      message: `บันทึกช่องทางแจ้งเตือน '${channel.channelName}' เรียบร้อย`,
      data: channel,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a notification channel
stocksRouter.delete('/notifications/channels/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await notificationDispatcher.deleteChannel(id);
    res.json({
      success: true,
      message: `ลบช่องทางแจ้งเตือน ${id} สำเร็จ`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test notification dispatch
stocksRouter.post('/notifications/test', async (req: Request, res: Response) => {
  try {
    const { channelType, channelName } = req.body || {};
    const testPayload = {
      eventType: 'SYSTEM_TEST',
      severity: 'INFO' as const,
      title: 'CryptoPro AI Test Notification',
      message: `🔔 ทดสอบการแจ้งเตือนจากระบบ CryptoPro AI (${channelName || channelType || 'Universal'}) เวลา ${new Date().toLocaleTimeString('th-TH')}`,
      data: { testTime: new Date().toISOString() },
    };

    const result = await notificationDispatcher.dispatch(testPayload);
    res.json({
      success: true,
      message: `ส่งข้อความทดสอบสำเร็จ (${result.delivered} ช่องทาง, ล้มเหลว ${result.failed})`,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get notification audit delivery logs
stocksRouter.get('/notifications/logs', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 30;
    const logs = await notificationDispatcher.getLogs(limit);
    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// Phase 11: AI-CIO Dialectical Chat Assistant & Executive Briefings
// ============================================================================

// Conversational Dialectical Chat Endpoint
stocksRouter.post('/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { sessionId, message, ticker } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'ข้อความคำถาม (message) เป็นสิ่งจำเป็น' });
    }

    const targetSessionId = sessionId || 'session_default_cio';
    const result = await aiCIOAssistant.chat(targetSessionId, message);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Executive Investment Briefing (Markdown & Natural Audio Script)
stocksRouter.get('/assistant/briefing', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as BriefingType) || 'MORNING';
    const forceRefresh = req.query.forceRefresh === 'true';

    const briefing = await aiCIOAssistant.generateDailyBriefing(type, forceRefresh);
    res.json({
      success: true,
      data: briefing,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Assistant Quick Action Diagnostic
stocksRouter.post('/assistant/quick-action', async (req: Request, res: Response) => {
  try {
    const { action } = req.body || {};
    if (!action) {
      return res.status(400).json({ success: false, error: 'QuickAction type is required' });
    }

    const response = await aiCIOAssistant.executeQuickAction(action as QuickActionType);
    res.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Executive Context Snapshot
stocksRouter.get('/assistant/context', (_req: Request, res: Response) => {
  try {
    const context = aiCIOAssistant.compileExecutiveContext();
    res.json({
      success: true,
      data: context,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List Chat Sessions or Messages within Session
stocksRouter.get('/assistant/history', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    if (sessionId && typeof sessionId === 'string') {
      const messages = await aiCIOAssistant.getSessionMessages(sessionId);
      return res.json({
        success: true,
        sessionId,
        count: messages.length,
        data: messages,
      });
    }

    const sessions = await aiCIOAssistant.getSessions();
    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create New Chat Session
stocksRouter.post('/assistant/history/new', async (req: Request, res: Response) => {
  try {
    const { title } = req.body || {};
    const session = await aiCIOAssistant.createSession(title);
    res.json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Chat Session
stocksRouter.delete('/assistant/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await aiCIOAssistant.deleteSession(String(sessionId));
    res.json({
      success: true,
      message: `ลบเซสชัน ${sessionId} เรียบร้อย`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});



