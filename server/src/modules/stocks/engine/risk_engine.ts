// ============================================================================
// Deterministic Hard Risk Engine (Master Prompt Section 4)
// LLM is STRICTLY PROHIBITED from bypassing these rules.
// ============================================================================

import { RiskRuleConfig, RiskEvaluationResult, TradePlan } from '../types.js';

export class HardRiskEngine {
  private config: RiskRuleConfig;

  constructor(initialConfig?: Partial<RiskRuleConfig>) {
    this.config = {
      max_position_size_pct: 10.0, // Max 10% of portfolio in single position
      max_portfolio_exposure_pct: 90.0, // Max 90% total invested (keep 10% cash)
      max_sector_exposure_pct: 25.0, // Max 25% in one sector (e.g. Technology)
      max_industry_exposure_pct: 15.0, // Max 15% in one industry (e.g. Semiconductors)
      max_single_stock_loss_pct: 5.0, // Max 5% loss on single position before hard stop
      max_daily_loss_usd: 5000.0, // Global daily loss breaker
      max_drawdown_pct: 12.0, // Max portfolio drawdown before circuit breaker
      min_risk_reward: 2.0, // Must have at least 1:2 Risk/Reward
      max_open_positions: 12,
      max_slippage_pct: 0.5,
      max_spread_pct: 0.3,
      min_liquidity_usd: 50_000_000, // Min $50M daily volume
      news_blackout_minutes: 30, // 30 min before/after breaking news
      earnings_blackout_days: 2, // No new entry 2 days before earnings
      global_kill_switch_active: false,
      ...initialConfig,
    };
  }

  public getConfig(): RiskRuleConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<RiskRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[RiskEngine] Updated risk configurations:', this.config);
  }

  public setKillSwitch(active: boolean, reason: string): void {
    this.config.global_kill_switch_active = active;
    console.warn(`[RiskEngine] 🚨 GLOBAL KILL SWITCH SET TO: ${active}. Reason: ${reason}`);
  }

  /**
   * Deterministic evaluation of proposed trade plan against hard boundaries
   */
  public evaluateTradeProposal(
    proposal: TradePlan,
    currentPortfolio: {
      totalEquity: number;
      cashBalance: number;
      openPositionsCount: number;
      currentDrawdownPct: number;
      todayLossUsd: number;
      sectorExposurePct: Record<string, number>;
      industryExposurePct: Record<string, number>;
    },
    marketContext: {
      tickerDailyVolumeUsd: number;
      spreadPct: number;
      daysUntilEarnings?: number;
      isMarketHalted?: boolean;
      dataIsStale?: boolean;
    }
  ): RiskEvaluationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Rule 1: Global Kill Switch
    if (this.config.global_kill_switch_active) {
      violations.push('GLOBAL_KILL_SWITCH_ACTIVE: ทุกคำสั่งซื้อขายถูกระงับฉุกเฉิน');
      return {
        approved: false,
        violations,
        warnings,
        maxAllowedSizePct: 0,
        killSwitchTriggered: true,
      };
    }

    // Rule 2: Market Halt
    if (marketContext.isMarketHalted) {
      violations.push('MARKET_HALTED: หุ้นถูกระงับการซื้อขายชั่วคราว');
    }

    // Rule 3: Stale Market Data
    if (marketContext.dataIsStale) {
      violations.push('STALE_MARKET_DATA: ข้อมูลราคาไม่อัปเดต เกินเวลาที่ยอมรับได้');
    }

    // Rule 4: Red Team Veto (Absolute veto)
    if (proposal.red_team_veto) {
      violations.push('RED_TEAM_VETO: Red Team Veto ได้รับการอนุมัติ ห้ามเข้าซื้อโดยเด็ดขาด');
    }

    // Rule 5: Portfolio Drawdown Limit
    if (currentPortfolio.currentDrawdownPct >= this.config.max_drawdown_pct) {
      violations.push(
        `MAX_DRAWDOWN_EXCEEDED: พอร์ต Drawdown (${currentPortfolio.currentDrawdownPct.toFixed(1)}%) เกินเพดานความเสี่ยง (${this.config.max_drawdown_pct}%)`
      );
    }

    // Rule 6: Daily Loss Breaker
    if (currentPortfolio.todayLossUsd >= this.config.max_daily_loss_usd) {
      violations.push(
        `MAX_DAILY_LOSS_EXCEEDED: ผลขาดทุนวันนี้ ($${currentPortfolio.todayLossUsd}) ถึงขีดจำกัดสูงสุด ($${this.config.max_daily_loss_usd})`
      );
    }

    // Rule 7: Max Open Positions
    if (currentPortfolio.openPositionsCount >= this.config.max_open_positions) {
      violations.push(
        `MAX_OPEN_POSITIONS_REACHED: มีสถานะเปิดอยู่แล้ว ${currentPortfolio.openPositionsCount} ตัว (เพดานสูงสุด ${this.config.max_open_positions})`
      );
    }

    // Rule 8: Minimum Risk-Reward Ratio
    if (proposal.risk_reward < this.config.min_risk_reward) {
      violations.push(
        `MIN_RISK_REWARD_VIOLATION: อัตรา Risk/Reward (${proposal.risk_reward.toFixed(2)}) ต่ำกว่าเกณฑ์ขั้นต่ำ (${this.config.min_risk_reward}:1)`
      );
    }

    // Rule 9: Position Sizing Cap
    let maxAllowedSizePct = this.config.max_position_size_pct;
    if (proposal.position_size > this.config.max_position_size_pct) {
      warnings.push(
        `POSITION_SIZE_SCALED_DOWN: ขนาดเสนอซื้อ ${proposal.position_size}% ถูกตัดลดลงเหลือ ${this.config.max_position_size_pct}% ตามกฎ Hard Cap`
      );
    }

    // Rule 10: Earnings Blackout Period
    if (
      marketContext.daysUntilEarnings !== undefined &&
      marketContext.daysUntilEarnings <= this.config.earnings_blackout_days &&
      marketContext.daysUntilEarnings >= 0
    ) {
      violations.push(
        `EARNINGS_BLACKOUT: อยู่ในช่วงประกาศงบในอีก ${marketContext.daysUntilEarnings} วัน ห้ามเปิดสถานะใหม่`
      );
    }

    // Rule 11: Liquidity Check
    if (marketContext.tickerDailyVolumeUsd < this.config.min_liquidity_usd) {
      violations.push(
        `INSUFFICIENT_LIQUIDITY: มูลค่าการซื้อขายเฉลี่ย ($${(marketContext.tickerDailyVolumeUsd / 1_000_000).toFixed(1)}M) ต่ำกว่าเกณฑ์ ($${(this.config.min_liquidity_usd / 1_000_000).toFixed(1)}M)`
      );
    }

    // Rule 12: Bid-Ask Spread Check
    if (marketContext.spreadPct > this.config.max_spread_pct) {
      violations.push(
        `SPREAD_TOO_WIDE: Spread (${marketContext.spreadPct.toFixed(2)}%) กว้างเกินเกณฑ์ (${this.config.max_spread_pct}%)`
      );
    }

    const approved = violations.length === 0;

    return {
      approved,
      violations,
      warnings,
      maxAllowedSizePct,
      killSwitchTriggered: false,
    };
  }
}

export const riskEngine = new HardRiskEngine();
export const hardRiskEngine = riskEngine;
