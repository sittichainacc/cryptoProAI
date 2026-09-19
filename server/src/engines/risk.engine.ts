export interface PositionSizingInput {
  capital: number;
  riskPercent: number; // e.g. 1% to 5%
  entryPrice: number;
  stopLossPrice: number;
  targetPrice?: number;
}

export interface PositionSizingResult {
  riskAmount: number;
  stopLossDistance: number;
  stopLossPercentage: number;
  positionSizeUsd: number;
  quantity: number;
  potentialLossUsd: number;
  potentialProfitUsd: number;
  riskRewardRatio: number;
  isSafeRisk: boolean;
  recommendationTh: string;
}

export class RiskEngine {
  static calculatePositionSizing(input: PositionSizingInput): PositionSizingResult {
    const { capital, riskPercent, entryPrice, stopLossPrice, targetPrice } = input;

    const riskAmount = (capital * riskPercent) / 100;
    const stopDistance = Math.abs(entryPrice - stopLossPrice);
    const stopLossPct = (stopDistance / entryPrice) * 100;

    // Position size = Risk amount / (stop distance % / 100)
    const positionSizeUsd = stopLossPct > 0 ? (riskAmount / (stopLossPct / 100)) : 0;
    const quantity = entryPrice > 0 ? positionSizeUsd / entryPrice : 0;

    const potentialLossUsd = riskAmount;
    const profitDistance = targetPrice ? Math.max(0, targetPrice - entryPrice) : stopDistance * 2.5;
    const potentialProfitUsd = (profitDistance / entryPrice) * positionSizeUsd;
    const riskRewardRatio = stopDistance > 0 ? Number((profitDistance / stopDistance).toFixed(2)) : 0;

    const isSafeRisk = riskPercent <= 2.5 && positionSizeUsd <= capital;

    let recommendationTh = `ความเสี่ยงต่อไม้ ${riskPercent}% (${riskAmount.toLocaleString()} USD) อยู่ในเกณฑ์มาตรฐานที่ปลอดภัย`;
    if (positionSizeUsd > capital) {
      recommendationTh = `คำเตือน: ขนาด Position (${positionSizeUsd.toLocaleString()} USD) เกินเงินทุนรวม แนะนำปรับขยับ Stop Loss ให้กระชับขึ้นหรือลดความเสี่ยง`;
    }

    return {
      riskAmount: Number(riskAmount.toFixed(2)),
      stopLossDistance: Number(stopDistance.toFixed(4)),
      stopLossPercentage: Number(stopLossPct.toFixed(2)),
      positionSizeUsd: Number(positionSizeUsd.toFixed(2)),
      quantity: Number(quantity.toFixed(4)),
      potentialLossUsd: Number(potentialLossUsd.toFixed(2)),
      potentialProfitUsd: Number(potentialProfitUsd.toFixed(2)),
      riskRewardRatio,
      isSafeRisk,
      recommendationTh,
    };
  }
}
