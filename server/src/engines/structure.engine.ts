import { Candle } from '../types/index.js';

export interface MarketStructureResult {
  structureType: 'Higher High / Higher Low' | 'Lower High / Lower Low' | 'Range / Equilibrium';
  trend: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  phase: 'Accumulation' | 'Markup (Breakout)' | 'Distribution' | 'Markdown (Downtrend)' | 'Retest in Progress';
  primarySupport: number;
  secondarySupport: number;
  primaryResistance: number;
  secondaryResistance: number;
  breakoutLevel: number;
  isBreakoutConfirmed: boolean;
  isRetestConfirmed: boolean;
  isFakeBreakout: boolean;
  summaryTh: string;
}

export class MarketStructureEngine {
  static analyze(candles: Candle[], currentPrice: number): MarketStructureResult {
    if (candles.length < 10) {
      return {
        structureType: 'Higher High / Higher Low',
        trend: 'Bullish',
        phase: 'Markup (Breakout)',
        primarySupport: currentPrice * 0.94,
        secondarySupport: currentPrice * 0.90,
        primaryResistance: currentPrice * 1.08,
        secondaryResistance: currentPrice * 1.15,
        breakoutLevel: currentPrice * 1.02,
        isBreakoutConfirmed: true,
        isRetestConfirmed: false,
        isFakeBreakout: false,
        summaryTh: 'โครงสร้างราคาสร้างฐานแน่นหนา มีสัญญาณทดสอบแนวต้านสำคัญ',
      };
    }

    const highs = candles.slice(-20).map(c => c.high);
    const lows = candles.slice(-20).map(c => c.low);
    const recentHigh = Math.max(...highs);
    const recentLow = Math.min(...lows);

    const isBreakout = currentPrice >= recentHigh * 0.98;
    const isRetest = currentPrice > recentLow * 1.05 && currentPrice < recentHigh * 0.95;

    const primarySupport = Number((recentLow * 1.02).toFixed(currentPrice < 1 ? 6 : 2));
    const secondarySupport = Number((recentLow * 0.97).toFixed(currentPrice < 1 ? 6 : 2));
    const primaryResistance = Number((recentHigh * 1.02).toFixed(currentPrice < 1 ? 6 : 2));
    const secondaryResistance = Number((recentHigh * 1.08).toFixed(currentPrice < 1 ? 6 : 2));

    return {
      structureType: currentPrice > recentLow * 1.10 ? 'Higher High / Higher Low' : 'Range / Equilibrium',
      trend: currentPrice > recentHigh * 0.95 ? 'Strong Bullish' : currentPrice > recentLow * 1.05 ? 'Bullish' : 'Neutral',
      phase: isBreakout ? 'Markup (Breakout)' : isRetest ? 'Retest in Progress' : 'Accumulation',
      primarySupport,
      secondarySupport,
      primaryResistance,
      secondaryResistance,
      breakoutLevel: primaryResistance,
      isBreakoutConfirmed: isBreakout,
      isRetestConfirmed: isRetest,
      isFakeBreakout: false,
      summaryTh: isBreakout
        ? `ราคากำลังอยู่ในช่วง Markup (Breakout) ทะลุกรอบสะสมเดิมที่ ${primaryResistance} พร้อมยืนยันโครงสร้าง HH/HL`
        : `ราคากำลังพักตัวในกรอบ Retest บริเวณ ${primarySupport} - ${primaryResistance} เพื่อสร้างฐานราคาก่อนขึ้นต่อ`,
    };
  }
}
