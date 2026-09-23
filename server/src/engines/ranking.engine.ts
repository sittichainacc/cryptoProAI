import { 
  TickerData, 
  MarketOverviewKPIs, 
  CryptoNewsItem, 
  Top5CandidateItem, 
  BuyNowResponse,
  Top5Response,
  QuantV3OpportunityItem,
  QuantV3ApiResponse
} from '../types/index.js';
import { QuantV3Engine, EXCLUDED_SYMBOLS } from './quant_v3.engine.js';

export { EXCLUDED_SYMBOLS, QuantV3Engine };

export class RankingEngine {
  /**
   * Evaluates universe using Quant Engine V3 (60 quantitative specifications)
   */
  static evaluateTop5(params: {
    coins: TickerData[];
    btcTicker?: TickerData;
    kpis?: MarketOverviewKPIs | null;
    news?: CryptoNewsItem[];
  }): { 
    top5: Top5CandidateItem[]; 
    buyNowCandidates: any[]; 
    opportunities: QuantV3OpportunityItem[];
    marketContext: Top5Response['marketContext']; 
    totalEvaluated: number 
  } {
    const result = QuantV3Engine.evaluateUniverse(params);
    return {
      top5: result.top5,
      buyNowCandidates: result.buyNowCandidates,
      opportunities: result.opportunities,
      marketContext: result.marketContext,
      totalEvaluated: result.evaluatedTotal,
    };
  }

  /**
   * Dedicated TOP 5 BUY NOW Quant Pipeline (Quant V3)
   * Strictly enforces 12 Hard Gates and returns 0 to 5 candidates (never force 5)
   */
  static evaluateBuyNow(params: {
    coins: TickerData[];
    btcTicker?: TickerData;
    kpis?: MarketOverviewKPIs | null;
    news?: CryptoNewsItem[];
  }): BuyNowResponse {
    const result = QuantV3Engine.evaluateUniverse(params);
    const isMarketBlocked = result.marketContext.favoredStrategy === 'Capital Preservation' || 
                            result.marketContext.marketRegime === 'CAPITULATION' || 
                            result.marketContext.marketRegime === 'RISK OFF';

    let marketStatus: 'NORMAL' | 'HIGH RISK' | 'NO SETUP' = 'NORMAL';
    let marketMessage: string | undefined = undefined;

    if (isMarketBlocked) {
      marketStatus = 'HIGH RISK';
      marketMessage = `ระวัง: สภาวะตลาดอยู่ในโหมด ${result.marketContext.marketRegimeTh} (${result.marketContext.favoredStrategyTh}) กลยุทธ์เน้นรักษาเงินทุน (Capital Preservation First)`;
    } else if (result.buyNowCandidates.length === 0) {
      marketStatus = 'NO SETUP';
      marketMessage = 'NO BUY NOW OPPORTUNITY — ไม่พบเหรียญที่ผ่านเกณฑ์ Hard Gate ทั้ง 12 ข้อตามวินัยระบบ Quant Engine V3 (อดทนรอจังหวะที่ได้เปรียบ)';
    }

    return {
      candidates: result.buyNowCandidates,
      marketStatus,
      marketMessage,
      evaluatedTotal: result.evaluatedTotal,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dedicated Top Opportunities Pipeline (Section 31 - "เหรียญไหนกำลังมา?")
   */
  static evaluateOpportunities(params: {
    coins: TickerData[];
    btcTicker?: TickerData;
    kpis?: MarketOverviewKPIs | null;
    news?: CryptoNewsItem[];
  }): QuantV3OpportunityItem[] {
    const result = QuantV3Engine.evaluateUniverse(params);
    return result.opportunities;
  }
}
