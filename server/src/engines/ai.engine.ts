import { AIScoreResult, RiskLevel, SignalType } from '../types/index.js';

export class AIEngine {
  /**
   * Synthesize AI Score (0-100) & Generate Human-Readable Thai Explanation
   */
  static evaluate(params: {
    symbol: string;
    name: string;
    sector: string;
    price: number;
    change24h: number;
    change7d: number;
    technicalScore: number;
    rsi: number;
    volume24h: number;
    btcTrend: 'bull' | 'bear' | 'neutral';
    fearGreed: number;
    newsSentiment?: number; // -1 to 1
  }): AIScoreResult & { signal: SignalType; signalLabelTh: string } {
    let aiScore = params.technicalScore;

    // Macro context adjustment (Fear & Greed + BTC Trend)
    if (params.btcTrend === 'bull') aiScore += 3;
    else if (params.btcTrend === 'bear') aiScore -= 4;

    if (params.fearGreed > 60) aiScore += 2;
    else if (params.fearGreed < 30) aiScore -= 3;

    // News sentiment impact
    if (params.newsSentiment && params.newsSentiment > 0.2) aiScore += 3;
    else if (params.newsSentiment && params.newsSentiment < -0.2) aiScore -= 5;

    aiScore = Math.min(100, Math.max(10, Math.round(aiScore)));

    // Risk Rating
    let riskRating: RiskLevel = 'Medium';
    if (params.sector === 'emerging' || params.sector === 'meme') {
      riskRating = params.change24h > 20 ? 'Extreme' : 'Very High';
    } else if (params.sector === 'core') {
      riskRating = 'Low';
    } else if (params.change24h > 15 || params.rsi > 78) {
      riskRating = 'High';
    } else {
      riskRating = 'Medium';
    }

    // Determine Signal
    let signal: SignalType = 'NEUTRAL';
    let signalLabelTh = 'ถือ / เฝ้าดู';
    let setupType = 'Range Bound';
    let explanationTh = '';

    const supportLevel = Number((params.price * 0.93).toFixed(params.price < 1 ? 6 : 2));
    const resistanceLevel = Number((params.price * 1.12).toFixed(params.price < 1 ? 6 : 2));
    const invalidationLevel = Number((params.price * 0.90).toFixed(params.price < 1 ? 6 : 2));
    let recommendedAction = '';

    if (aiScore >= 88) {
      if (params.rsi > 75) {
        signal = 'DO_NOT_CHASE';
        signalLabelTh = 'อย่าเพิ่งไล่ราคา (รอรวบ)';
        setupType = 'Overextended Bullish';
        explanationTh = `${params.symbol} มีโครงสร้างแข็งแกร่งมาก (คะแนน ${aiScore}/100) แต่ RSI แตะ ${params.rsi} เข้าโซน Overbought แนะนำรอจังหวะ Pullback แทนการเข้าไล่ราคาที่จุดยอด`;
        recommendedAction = `รอรับบริเวณแนวรับ ${supportLevel} ตัดขาดทุนหากหลุด ${invalidationLevel}`;
      } else if (params.change24h > 8) {
        signal = 'STRONG_BUY';
        signalLabelTh = 'สัญญาณซื้อแข็งแกร่ง (Strong Buy)';
        setupType = 'Breakout + High Volume';
        explanationTh = `ราคาปิดทะลุผ่านกรอบสะสมด้วย Volume มหาศาล ยืนเหนือกลุ่มเส้น EMA หลักทุกเส้น โครงสร้าง 4H/1D ทำ Higher High ชัดเจน`;
        recommendedAction = `เข้าสะสมตามแนว Breakout เป้าหมายแนวต้าน ${resistanceLevel} Invalidation เมื่อปิดต่ำกว่า ${invalidationLevel}`;
      } else {
        signal = 'WAIT_FOR_RETEST';
        signalLabelTh = 'รอทดสอบแนวรับ (Wait for Retest)';
        setupType = 'Breakout Retest';
        explanationTh = `เกิดสัญญาณ Breakout แล้วแต่กำลังถอยลงมาทดสอบแนวรับเดิม (Retest) เพื่อยืนยันความแข็งแกร่ง เหมาะสำหรับดักจังหวะ Low-risk Entry`;
        recommendedAction = `ตั้งรับบริเวณ ${supportLevel} เป้าหมาย ${resistanceLevel} Stop Loss ${invalidationLevel}`;
      }
    } else if (aiScore >= 75) {
      if (params.change24h < -2 && params.change7d > 5) {
        signal = 'WAIT_FOR_PULLBACK';
        signalLabelTh = 'รอย่อสะสม (Pullback)';
        setupType = 'Trend Pullback';
        explanationTh = `แนวโน้มหลักยังเป็นขาขึ้น แต่ราคาในระยะสั้นกำลังพักฐานตามธรรมชาติ เป็นโอกาสดักเก็บของตามแนวโน้มใหญ่`;
        recommendedAction = `ทยอยสะสมบริเวณ ${supportLevel} วางจุดยอมแพ้ที่ ${invalidationLevel}`;
      } else {
        signal = 'BUY';
        signalLabelTh = 'น่าสนใจเข้าซื้อ (Buy)';
        setupType = 'Momentum Continuation';
        explanationTh = `โมเมนตัมกำลังเพิ่มขึ้นต่อเนื่อง RSI อยู่ในระดับแข็งแรง ${params.rsi} ทรงราคาสร้างฐานแน่นหนา มีโอกาสปรับตัวขึ้นต่อตามกลุ่ม Sector`;
        recommendedAction = `เข้าซื้อแบบแบ่งไม้ เป้าหมายแรก ${resistanceLevel} Stop Loss ${invalidationLevel}`;
      }
    } else if (aiScore >= 60) {
      signal = 'WATCH';
      signalLabelTh = 'เฝ้าติดตาม (Watch)';
      setupType = 'Consolidation / Base Building';
      explanationTh = `ราคากำลังบีบอัดตัวสร้างฐาน (Base Building) ปริมาณซื้อขายยังทรงตัว แนะนำใส่ไว้ใน Watchlist เพื่อรอการยืนยันทิศทางชัดเจน`;
      recommendedAction = `รอให้ราคาเบรคแนวต้าน ${resistanceLevel} พร้อม Volume ก่อนตัดสินใจ`;
    } else if (aiScore <= 45) {
      if (riskRating === 'Extreme' || riskRating === 'Very High') {
        signal = 'HIGH_RISK';
        signalLabelTh = 'ความเสี่ยงสูงมาก (High Risk)';
        setupType = 'Volatile Speculation';
        explanationTh = `เหรียญมีความผันผวนสูงมากและขาดแนวรับทางเทคนิคที่มั่นคง ปริมาณซื้อขายกระจัดกระจาย ไม่แนะนำสำหรับผู้ที่ไม่สามารถเฝ้าจอได้`;
        recommendedAction = `หลีกเลี่ยงหรือจำกัดความเสี่ยงไม่เกิน 1% ของพอร์ต`;
      } else {
        signal = 'SELL';
        signalLabelTh = 'พิจารณาขาย / ลดพอร์ต (Sell)';
        setupType = 'Downtrend Continuation';
        explanationTh = `ราคาหลุดแนวรับสำคัญและอยู่ใต้เส้นค่าเฉลี่ย EMA โมเมนตัมเป็นลบ มีโอกาสปรับตัวลงต่อตามแนวโน้มขาลง`;
        recommendedAction = `ลดสัดส่วนการถือครองหรือตั้ง Stop Loss ทันที`;
      }
    }

    return {
      score: aiScore,
      marketTrendContext: params.btcTrend === 'bull' ? 'ตลาดรวมเป็นขาขึ้น (Bullish Context)' : 'ตลาดรวมผันผวน/พักฐาน',
      sentimentScore: params.newsSentiment ?? 0.1,
      riskRating,
      explanationTh,
      setupType,
      supportLevel,
      resistanceLevel,
      invalidationLevel,
      recommendedAction,
      signal,
      signalLabelTh,
    };
  }
}
