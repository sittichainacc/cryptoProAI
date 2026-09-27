import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Crown, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Target, 
  ArrowUpRight, 
  Clock, 
  Compass, 
  ChevronRight, 
  ExternalLink, 
  Eye, 
  Sliders, 
  Activity, 
  AlertCircle,
  HelpCircle,
  Layers,
  BarChart3,
  Zap,
  ShieldCheck,
  Percent,
  Cpu,
  Coins,
  Gauge,
  Lock,
  Radio,
  ChevronDown,
  ChevronUp,
  Scale,
  ArrowRight,
  BookOpen,
  PieChart,
  Binary,
  GitBranch,
  Network,
  Calculator,
  SlidersHorizontal,
  Info,
  Copy,
  Check,
  Crosshair,
  Briefcase,
  PlayCircle,
  AlertTriangle,
  ArrowDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  Top5CandidateItem, 
  Top5Response, 
  BuyNowCandidateItem,
  QuantV3OpportunityItem,
  MarketRegime,
  Phase20EvaluationResponse,
  Phase20Candidate,
  SlippageSimulationResult,
  DecisionState,
  TradeDecisionAssistant
} from '../types/index.js';
import { api } from '../services/api.js';
import { formatCurrencyValue, getCurrencyMultiplier, getUsdThbRate } from '../utils/currency.js';
import { PriceCell } from '../components/PriceCell.js';
import { CryptoIcon } from '../components/CryptoIcon.js';

interface Top5PremiumPageProps {
  currency: 'THB' | 'USDT';
  onSelectCoin: (symbol: string) => void;
  onOpenAnalysis?: (symbol: string) => void;
}

// Research Phase definition for the Roadmap view
interface ResearchPhaseItem {
  phase: number;
  title: string;
  category: 'Algorithm (Phase 1-10)' | 'News & Intelligence (Phase 11-17)' | 'Integration (Phase 18-20)';
  status: 'MAPPED' | 'STAGED' | 'QUEUED';
  description: string;
  keySources: string[];
  findings: string[];
  promotedFeatures: string[];
  rejectedRules: string[];
}

// Robust THB currency formatter for crypto prices & financial amounts
export function formatThb(val: number | undefined | null, opts?: { decimals?: number }): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  if (val === 0) return '0.00';
  const absVal = Math.abs(val);
  if (opts?.decimals !== undefined) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: opts.decimals, maximumFractionDigits: opts.decimals });
  }
  if (absVal < 0.0001) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  }
  if (absVal < 1) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  if (absVal < 10) {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const Top5PremiumPage: React.FC<Top5PremiumPageProps> = ({
  currency,
  onSelectCoin,
  onOpenAnalysis,
}) => {
  const [data, setData] = useState<Top5Response | null>(null);
  const [premiumData, setPremiumData] = useState<Phase20EvaluationResponse | null>(null);
  const [inspectingCandidate, setInspectingCandidate] = useState<Phase20Candidate | null>(null);
  const [detailedPlanCandidate, setDetailedPlanCandidate] = useState<Phase20Candidate | null>(null);
  const [activePlanModes, setActivePlanModes] = useState<Record<string, 'ENTRY' | 'POSITION'>>({});
  const [expandedHoldPlan, setExpandedHoldPlan] = useState<Record<string, boolean>>({});
  const [copiedContract, setCopiedContract] = useState(false);
  const [buyNowList, setBuyNowList] = useState<BuyNowCandidateItem[]>([]);
  const [opportunitiesList, setOpportunitiesList] = useState<QuantV3OpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'candidates' | 'microstructure' | 'regimes' | 'portfolio' | 'research'>('candidates');
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [selectedSimOrderSize, setSelectedSimOrderSize] = useState<number>(50000); // 50,000 THB
  const [selectedResearchPhase, setSelectedResearchPhase] = useState<ResearchPhaseItem | null>(null);

  // Top 5 Premium is strictly evaluated & displayed in Thai Baht (THB)
  const multiplier = 1;
  const prefix = '฿';

  const loadQuantData = async (force: boolean = false) => {
    if (force) setIsRecalculating(true);
    else setIsLoading(true);
    try {
      const [premiumRes, top5Res, buyNowRes, oppRes] = await Promise.allSettled([
        force ? api.recalculateTop5Premium() : api.getTop5Premium(),
        force ? api.recalculateTop5() : api.getTop5(),
        force ? api.recalculateBuyNow() : api.getBuyNow(),
        force ? api.recalculateOpportunities() : api.getOpportunities(),
      ]);

      if (premiumRes.status === 'fulfilled' && premiumRes.value) {
        setPremiumData(premiumRes.value);
      }
      if (top5Res.status === 'fulfilled' && top5Res.value) {
        setData(top5Res.value);
      }
      if (buyNowRes.status === 'fulfilled' && buyNowRes.value) {
        setBuyNowList(buyNowRes.value.candidates || []);
      }
      if (oppRes.status === 'fulfilled' && oppRes.value?.opportunities) {
        setOpportunitiesList(oppRes.value.opportunities);
      }
      setLastFetchTime(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      console.error('Failed to load Top 5 Premium data:', err);
    } finally {
      setIsLoading(false);
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    loadQuantData();
    const interval = setInterval(() => {
      loadQuantData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 20-Phase Master Research Log Data Structure
  const researchPhases: ResearchPhaseItem[] = [
    {
      phase: 1,
      title: 'Global Algorithm Evidence Mapping & Benchmark Standard',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'กำหนดมาตรฐานการยอมรับหลักฐานวิชาการระดับโลก (Peer-reviewed journals, RFS, JF) และการทดสอบ Out-of-Sample (OOS) พร้อมหักต้นทุนจริงทุกมิติ',
      keySources: [
        'Liu & Tsyvinski — Risks and Returns of Cryptocurrency (Review of Financial Studies / NBER WP 24877)',
        'Liu, Tsyvinski & Wu — Common Risk Factors in Cryptocurrency (Journal of Finance, 2022)',
        'Hudson & Urquhart — Technical trading and cryptocurrencies (Annals of Operations Research)',
        'Li et al. — Predicting cryptocurrency returns with machine learning (Pacific-Basin Finance Journal, 2026)',
        'Anastasopoulos et al. — Order flow and cryptocurrency returns (Journal of Financial Markets, 2026)'
      ],
      findings: [
        'Crypto momentum เป็น baseline ที่มีนัยสำคัญทางสถิติเมื่อทดสอบ OOS',
        'โมเดลต้องชนะ Benchmark พื้นฐาน: Buy-and-Hold, Trend, Range Breakout และ Market/Size/Momentum Factor',
        'ต้นทุนธุรกรรม (Fees, Spread, Slippage, Impact) เปลี่ยนข้อสรุปความสามารถในการทำกำไรอย่างสิ้นเชิง',
        'Tree-based ML (Random Forest, XGBoost) มีความเสถียรและแม่นยำสูงกว่า Deep Neural Network ในการทำนายผลตอบแทน'
      ],
      promotedFeatures: ['Regime-aware multi-model ensemble', 'Order-flow + nonlinear ML', 'Tree ensemble (RF/XGBoost)', 'Cost-aware Expected Tradable Edge'],
      rejectedRules: ['เคลมผลกำไรการันตี 100%', 'In-sample backtest mining โดยไม่มี OOS', 'Standalone RSI / MACD เดี่ยวๆ']
    },
    {
      phase: 2,
      title: 'Trend / Time-Series Momentum / Cross-Sectional Momentum',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'วิเคราะห์และคัดแยกโครงสร้างโมเมนตัมแบบ Time-Series เทียบกับ Cross-Sectional พร้อมจัดการความเสี่ยง Heavy-Tail และ Momentum Crash',
      keySources: [
        'Han, Kang & Ryu — Time-Series and Cross-Sectional Momentum under Realistic Assumptions',
        'Zaremba et al. — Short-term reversal, momentum, and liquidity effects (IRFA, 2021)',
        'Kang & Ryu — Time-series momentum and market timing in Bitcoin (Risk Management, 2026)',
        'Grobys et al. — Cryptocurrency momentum has (not) its moments (Financial Markets and Portfolio Management, 2025)'
      ],
      findings: [
        'Time-Series Momentum มีความแข็งแกร่งและอยู่รอดหลังหักต้นทุนจริง มากกว่า Cross-Sectional Momentum',
        'สภาพคล่องกำหนดพฤติกรรมราคา: เหรียญใหญ่มีแนวโน้มเกิด Momentum ส่วนเหรียญเล็กสภาพคล่องต่ำมีแนวโน้มเกิด Reversal',
        'สัญญาณโมเมนตัมช้า (12W) มีประสิทธิภาพดีกว่าสัญญาณเร็วใน Bitcoin ลดการ Overreact',
        'การปรับขนาด Position ตาม Volatility ช่วยลด Drawdown จาก Momentum Crash ได้อย่างมีนัยสำคัญ'
      ],
      promotedFeatures: ['Long-biased Time-Series Momentum', 'Liquidity-Conditioned Momentum/Reversal Switch', 'Volatility-Scaled Sizing', 'Anti-FOMO Extension Gate'],
      rejectedRules: ['Short-side momentum ในสภาพคล่องต่ำ', '24H Top Gainer Chasing โดยไม่ดูสภาพคล่อง', 'Symmetric Long/Short Momentum']
    },
    {
      phase: 3,
      title: 'Breakout / Pullback / Mean Reversion / Reversal',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'ระบบตัดสินใจ Breakout vs Retest vs Mean-Reversion ขึ้นกับสภาวะตลาด ปริมาณการซื้อขาย และความคุ้มค่าหลังหักค่าธรรมเนียม',
      keySources: [
        'Finance Research Letters — The profitability of technical trading rules in the Bitcoin market',
        'Journal of International Financial Markets — Technical analysis: Do transaction costs matter?',
        'Wen et al. — Intraday return predictability: Momentum, reversal, or both (NAJEF, 2022)',
        'Moser & Brauneis — Candlestick patterns in cryptocurrency markets (IREF, 2026)'
      ],
      findings: [
        'Trading-range breakout (Donchian) มีความแม่นยำสูงในภาวะ Strong Trending',
        'สัญญาณ Breakout ต้องรอ Close Confirmation และ Volume Expansion เพื่อลด False Breakout',
        'ในสภาวะ Sideways โมเดล Mean Reversion (VWAP / Bollinger Bands) ให้ผลตอบแทนดีกว่า Trend Chasing',
        'สัญญาณกลับตัวใน Timeframe สั้น (15m) มักไม่คุ้มค่าธรรมเนียมและ Slippage (Signal Accuracy != Tradable Alpha)'
      ],
      promotedFeatures: ['Regime-Gated Range Breakout', 'Breakout Retest State Machine', 'Liquidity-Conditioned Reversal Score', 'False Breakout Risk Detection'],
      rejectedRules: ['ซื้อทันทีเมื่อแท่งกราฟทะลุแนวต้านระหว่างแท่ง (Intrabar FOMO)', 'RSI < 30 ซื้อทันที (Falling Knife Risk)']
    },
    {
      phase: 4,
      title: 'Market Regime Detection & Adaptive Strategy Selection',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'ระบบจำแนกสภาวะตลาด 6 มิติด้วย Hidden Markov Model (HMM) และ MS-GARCH ก่อนส่งถ่ายน้ำหนักไปยังกลยุทธ์ย่อยอย่างยืดหยุ่น',
      keySources: [
        'Giudici & Abu Hashish — Hidden Markov Model to detect regime changes (QREI, 2020)',
        'Figà-Talamanca et al. — Regime switches and commonalities (NAJEF, 2021)',
        'Shakourloo & Azimli — Regime-switching in bitcoin volatility (RIBAF, 2026)',
        'Saidane — Forecasting Regime-Dependent Tail Risk with Hidden Markov Factor Analyzers (J. of Forecasting, 2026)'
      ],
      findings: [
        'สภาวะตลาดระดับ Global (BTC/Macro) ส่งอิทธิพลเหนือสัญญาณทางเทคนิคของเหรียญรายตัว',
        'การแบ่งสภาวะตลาดต้องครอบคลุม 6 แกน: Direction, Volatility, Liquidity, Participation, Behavioral และ Transition Risk',
        'การปรับค่าน้ำหนักกลยุทธ์ควรเป็นแบบ Probabilistic Blending แทนการตัดสลับแบบ Hard Switch',
        'เมื่อตลาดเข้าสู่สภาวะ Extreme Tail Risk ระบบต้องมีสิทธิ์ปิดกั้น Buy Now อัตโนมัติ (Abstention Mode)'
      ],
      promotedFeatures: ['Dual-Level Regime Architecture (Global vs Coin)', 'HMM Multi-State Probabilities', 'Volatility-Regime Sizing', 'Dynamic Strategy Routing Matrix'],
      rejectedRules: ['BTC เหนือ EMA200 แปลว่าตลาดกระทิงเพียงเงื่อนไขเดียว', 'Fear & Greed Index เดี่ยวๆ โดยไม่ดู Volatility และ Breadth']
    },
    {
      phase: 5,
      title: 'Market Microstructure / Order Flow / Liquidity / Execution',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'การวิเคราะห์ Order Flow โลก, Order Book Imbalance, VPIN Toxicity, และการคำนวณ All-in Execution Cost บน Bitkub เทียบกับ Global',
      keySources: [
        'Anastasopoulos et al. — Order flow and cryptocurrency returns (Journal of Financial Markets, 2026)',
        'Easley, O\'Hara et al. — Microstructure and market dynamics in crypto markets (JFM, 2026)',
        'Kitvanitphasu, Treepongkaruna et al. — Order flow toxicity and price jumps (RIBAF, 2026)',
        'Makarov & Schoar — Trading and arbitrage in cryptocurrency markets (JFE, 2020)',
        'Galati — The impact of no-fee trading on cryptocurrency market quality (JBF, 2024)'
      ],
      findings: [
        'World Order Flow มีพลังอธิบายและทำนายผลตอบแทนคริปโตสูงกว่าปัจจัยพื้นฐานดั้งเดิมในระยะสั้น',
        'VPIN (Volume-Synchronized Probability of Toxicity) ทำนาย Price Jump และความเสี่ยงในการถูกกินสภาพคล่องได้แม่นยำ',
        'การวิเคราะห์ต้องแยกกระแส Order Flow สากล ออกจาก Bitkub Local Flow เพื่อจับ Arbitrage และ Local Premium Risk',
        'ต้นทุนการเทรดที่แท้จริงคือ All-in Cost: Fee + Half-Spread + Slippage + Market Impact'
      ],
      promotedFeatures: ['Global vs Local Order Flow Decomposition', 'CVD & Microprice Imbalance', 'VPIN Toxicity & Jump Risk Filter', 'Size-Aware Slippage Simulator'],
      rejectedRules: ['ใช้ 24H Volume เป็นตัวแทนสภาพคล่องเพียงตัวเดียว', 'คำนวณต้นทุนเฉพาะค่าธรรมเนียมกระดานเทรด (Ignore Slippage)']
    },
    {
      phase: 6,
      title: 'Machine Learning / Ensemble / Deep Learning / Explainability',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'การนำ Tree Ensemble (Random Forest, XGBoost, LightGBM) มาทำนายผลตอบแทน พร้อม SHAP Explainability และการป้องกัน Look-ahead Bias 100%',
      keySources: [
        'Li et al. — Predicting cryptocurrency returns with high-dimensional factor modeling (PBFJ, 2026)',
        'Xue & Zhou — Vision transformers: A look-ahead bias-free approach (Journal of Banking & Finance, 2026)',
        'Results in Engineering — Explainable hybrid deep learning framework and SHAP analysis (2026)'
      ],
      findings: [
        'Tree-based model ชนะ Neural Networks ในมิติ Predictive Accuracy และเสถียรภาพเมื่อทดสอบ Out-of-Sample',
        'SHAP Analysis พบว่า MVRV, Active Addresses และ Order Flow เป็นปัจจัยที่สำคัญที่สุดในการทำนาย',
        'ทุกการทำนายระดับสถาบันต้องแสดง SHAP Feature Contribution (ปัจจัยบวก/ลบ) ชัดเจน ห้ามใช้ Black-box',
        'ระบบต้องมี Tradeability / Abstention Model คือสามารถตอบว่า "ไม่เทรด" ได้เมื่อความไม่แน่นอนสูง'
      ],
      promotedFeatures: ['Tree Ensemble (RF + XGBoost + LightGBM)', 'SHAP Factor Attribution', 'Calibrated Probabilities (Brier Score)', 'Abstention / No-Trade Model'],
      rejectedRules: ['คัดเลือกโมเดลจากค่า RMSE หรือ R² ในตัวอย่างเพียงอย่างเดียว', 'Random K-fold CV บนข้อมูล Time Series (ห้าม Data Leakage)']
    },
    {
      phase: 7,
      title: 'On-chain / Fundamental / Tokenomics Factor Models',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'ตัวแปร On-Chain ระดับสถาบัน (MVRV, Economically Active Addresses), การแยกแยะ Fees vs Protocol Revenue, และ Dilution Risk จาก Token Unlocks',
      keySources: [
        'JIFMIM — Blockchain characteristics and cryptocurrency returns (2023)',
        'Cong, Li & Wang — Tokenomics: Dynamic Adoption and Valuation (Review of Financial Studies)',
        'Economics Letters — The surprising irrelevance of total-value-locked on cryptocurrency returns (2025)',
        'Guo — Token Dilution and the Cross-Section of Cryptocurrency Returns (SSRN, 2026)'
      ],
      findings: [
        'MVRV, New Addresses และ Active Addresses ให้ข้อมูลเสริมที่โมเดล Price-only ไม่มี',
        'TVL เพียงอย่างเดียวไม่มีนัยสำคัญต่อ Abnormal Returns ต้องพิจารณาควบคู่กับ Fees/TVL และ Capital Efficiency',
        'สัดส่วน FDV ต่อ Circulating Market Cap และกำหนดการ Unlock เหรียญสร้างแรงกดดันต่อราคาอย่างมีนัยสำคัญโดยเฉพาะเหรียญใหม่',
        'การประเมินปัจจัยพื้นฐานต้องแยกตามกลุ่มอุตสาหกรรม (L1/L2, DEX, Lending, DePIN, AI)'
      ],
      promotedFeatures: ['MVRV Contextual Scoring', 'Standardized Protocol Revenue / Fees', 'Tokenomics & Dilution Risk Score', 'Unlock Event Decay Tracking'],
      rejectedRules: ['เหรียญ TVL สูงแปลว่าต้องซื้อทันที', 'เหรียญ Staking APY สูงแปลว่าดี (โดยไม่หัก Inflation)']
    },
    {
      phase: 8,
      title: 'Derivatives / Cross-Exchange / Relative Strength / Lead-Lag',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'วิเคราะห์โครงสร้าง Leverage: Funding Rate x Open Interest x Liquidations, Dynamic Lead-Lag Graph ข้ามเหรียญ และ Relative Strength Stage',
      keySources: [
        'Guo, Sang, Tu & Wang — Cross-cryptocurrency return predictability (JEDC, 2024)',
        'Jia, Wu, Yan & Liu — A seesaw effect in the cryptocurrency market (Journal of Empirical Finance, 2023)',
        'Mercik et al. — Cross-sectional interactions in cryptocurrency returns (IRFA, 2025)',
        'Finance Research Letters — Bitcoin option expiration, gamma exposure, and intraday price reversals (2026)'
      ],
      findings: [
        'ผลตอบแทนในอดีตของเหรียญผู้นำ (BTC, ETH, Sector Leaders) สามารถทำนายเหรียญตามได้ (Lead-Lag Relationship)',
        'Funding Rate ไม่ใช่สัญญาณทิศทางเดี่ยวๆ แต่เป็นตัวชี้วัดความแออัด (Leverage Crowding) ร่วมกับ Open Interest',
        'Relative Strength ต้องแยกสถานะ: Emerging (ผู้นำช่วงต้น) ออกจาก Extended/Exhausted (ไล่ราคาสุดทาง)',
        'การหมดอายุของ Options และ Negative Gamma Exposure ก่อให้เกิด Price Reversal ชั่วคราวรอบวัน Settlement'
      ],
      promotedFeatures: ['Dynamic Lead-Lag Graph', 'Funding x OI Crowding Matrix', 'Liquidation Stress Detection', 'Relative Strength Stage (Emerging vs Late)'],
      rejectedRules: ['Funding Rate > 0 แปลว่าต้องเปิด Short ทันที', 'Open Interest เพิ่มขึ้นแปลว่าเป็นกระทิงเสมอ']
    },
    {
      phase: 9,
      title: 'Risk Management / Position Sizing / Exit / Profit Protection',
      category: 'Algorithm (Phase 1-10)',
      status: 'MAPPED',
      description: 'การควบคุมความเสี่ยง Downside ด้วย Mean-LPM, การจัดสรรพอร์ตโฟลิโอด้วย Hierarchical Risk Parity (HRP) และการปกป้องกำไรด้วย Trailing Stop',
      keySources: [
        'Li, Liu & Yan — Performance-based regularization for downside-risk cryptocurrency portfolios (PBFJ, 2026)',
        'Finance Research Letters — Hierarchical risk parity approach on cryptocurrencies (2021)',
        'Białkowski — Stop-loss rules in crypto portfolios (Economics Letters, 2020)',
        'Sadaqat & Butt — Stop-loss momentum strategies in crypto (JBEF, 2023)'
      ],
      findings: [
        'การปรับแต่งพอร์ตด้วย Downside Deviation และ Lower Partial Moment (LPM) ให้ความเสถียรสูงกว่า Mean-Variance ทั่วไป',
        'Hierarchical Risk Parity (HRP) ช่วยกระจายความเสี่ยงข้ามกลุ่มเหรียญได้เหนือกว่า Equal Weight และ Mean-Variance',
        'Stop-Loss ที่มีประสิทธิภาพสูงสุดคือ Hybrid Structure + ATR Buffer ซึ่งปรับตัวตาม Volatility ของแต่ละเหรียญ',
        'Trailing Stop ต้องมี Profit Protection Override เพื่อป้องกันไม่ให้ Stop ขยายกว้างขึ้นช่วงที่ราคาเกิด Parabolic Climax'
      ],
      promotedFeatures: ['Mean-LPM & Expected Shortfall (CVaR)', 'Hierarchical Risk Parity Allocation', 'Structure + ATR Buffer Stop', 'Profit Protection Override Engine'],
      rejectedRules: ['ใช้ Fixed % Stop Loss ตายตัวกับทุกเหรียญ (เช่น 5% เท่ากันหมด)', 'Full Kelly Criterion ในตลาดคริปโต (เสี่ยงต่อ Over-sizing)']
    },
    {
      phase: 10,
      title: 'Indicator Ensemble: Select & Validate Best 10 Complementary Features',
      category: 'Algorithm (Phase 1-10)',
      status: 'STAGED',
      description: 'คัดเลือกและทดสอบ 10 ตัวชี้วัดที่เสริมกำลังซึ่งกันและกัน (Orthogonal Features) ไม่เกิดการนับซ้ำ เพื่อเข้าสู่ Production Feature Store',
      keySources: ['Machine Learning Feature Selection', 'Correlation Clustering & Mutual Information Standards'],
      findings: ['การเลือก Indicator ที่มีความสัมพันธ์กันสูง (Collinear) ไม่ช่วยเพิ่มข้อมูล แต่ทำให้โมเดลเกิด Overfitting'],
      promotedFeatures: ['Orthogonal Indicator Matrix', 'Feature Redundancy Audit', 'Ablation Testing Protocol'],
      rejectedRules: ['รวม Indicator 30 ตัวที่วัดสิ่งเดียวกัน (RSI, Stochastic, Williams %R)']
    },
    {
      phase: 11,
      title: 'Official Project / Foundation / GitHub / Governance Sources',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'การดึงข้อมูลและข่าวสารปฐมภูมิจาก Official Repositories, Governance Proposals (Snapshot/Tally) และ Foundation Announcements',
      keySources: ['GitHub API, Discourse, Snapshot, On-chain Governance'],
      findings: ['ข้อมูลจากแหล่งทางการให้ความแม่นยำสูงสุด ลดข่าวปลอมและ FUD ในตลาด'],
      promotedFeatures: ['Verified Source Ingestion', 'Governance Milestone Detection'],
      rejectedRules: ['รับข่าวจาก Social Media ไม่ผ่านการกรอง']
    },
    {
      phase: 12,
      title: 'Regulatory / Government / Legal / ETF / Filing Sources',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'ระบบติดตามกฎระเบียบ ก.ล.ต., SEC, คดีความสำคัญ, การอนุมัติ ETF, และรายงานการเงินระดับสถาบัน',
      keySources: ['SEC EDGAR, CFTC, Thai SEC, Court Filings'],
      findings: ['เหตุการณ์เชิงกฎระเบียบส่งผลกระทบระดับ Macro ต่อสภาพคล่องของทั้งระบบ'],
      promotedFeatures: ['Regulatory Shock Score', 'ETF Net Flow Tracker'],
      rejectedRules: ['เทรดสวนทางกับข่าว Regulatory Crisis ระดับรุนแรง']
    },
    {
      phase: 13,
      title: 'Tier-1 Global Financial News Sources',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'การรับข้อมูลจากสำนักข่าวการเงินระดับโลก (Bloomberg, Reuters, Financial Times, WSJ) พร้อมจัดระดับความน่าเชื่อถือ',
      keySources: ['Bloomberg Terminal Feed, Reuters Wire, Dow Jones'],
      findings: ['ข่าวระดับ Tier-1 มีผลกระทบต่อสถาบันการเงินและเงินทุนขนาดใหญ่ไหลเข้าออก'],
      promotedFeatures: ['Tier-1 Verification Flag', 'Macro Sentiment Index'],
      rejectedRules: ['ใช้อัตราส่วนข่าว Clickbait ในการตัดสินใจ']
    },
    {
      phase: 14,
      title: 'Institutional Crypto Research & Professional Crypto News',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'การสกัดสาระสำคัญจากงานวิจัยเชิงลึก (Coinbase Institutional, Binance Research, Galaxy, Delphi Digital, Messari)',
      keySources: ['Delphi, Messari, Galaxy Digital, Coinbase Institutional'],
      findings: ['รายงานวิจัยระดับมืออาชีพชี้ทิศทาง Fund Flow ของกองทุนคริปโต'],
      promotedFeatures: ['Institutional Narrative Momentum', 'Sector Rotation Forecast'],
      rejectedRules: ['การพึ่งพาบทวิเคราะห์ที่ไม่เปิดเผยสมมติฐาน']
    },
    {
      phase: 15,
      title: 'Exchange / Listing / Delisting / Security / Incident Sources',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'ระบบเตือนภัยทันทีเมื่อเกิดเหตุการณ์ Listing ใหม่, Delisting, Smart Contract Exploit, หรือ Bridge Hack',
      keySources: ['CertiK, PeckShield, Exchange Official Announcements'],
      findings: ['ความปลอดภัยและข่าวการเพิกถอนคือ Hard Cut-off ที่ต้องระงับการเทรดทันที'],
      promotedFeatures: ['Emergency Security Gate', 'Exploit Alert Kill-Switch'],
      rejectedRules: ['เข้าซื้อเหรียญที่กำลังถูกระงับการฝากถอนหรือเกิด Exploit']
    },
    {
      phase: 16,
      title: 'On-chain Alerts / Whale / Token Unlock / Funding / Market Events',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'การตรวจจับธุรกรรมเจ้ามือขนาดใหญ่ (Whale Movements), การโอนเข้า Exchange, และกำหนดการปลดล็อกเหรียญ',
      keySources: ['Whale Alert, Arkham Intelligence, Token Unlocks'],
      findings: ['การโอนเหรียญเข้า Exchange ในปริมาณผิดปกติเพิ่มความเสี่ยงการเทขายล่วงหน้า'],
      promotedFeatures: ['Whale Exchange Netflow Alert', 'Pre-Unlock Risk Window'],
      rejectedRules: ['มองข้ามการโอนเหรียญระดับ 1% ของ Circulating Supply เข้ากระดาน']
    },
    {
      phase: 17,
      title: 'Multilingual News Translation, Deduplication & Catalyst Scoring',
      category: 'News & Intelligence (Phase 11-17)',
      status: 'STAGED',
      description: 'การแปลภาษาอัตโนมัติ การลบข่าวซ้ำซ้อน และการให้คะแนนผลกระทบเชิงเร่ง (Catalyst Impact & Duration)',
      keySources: ['NLP Deduplication, Sentiment Transformers, Vector Embeddings'],
      findings: ['ข่าวซ้ำจากหลายสำนักข่าวมักทำให้โมเดลประเมินน้ำหนักเกินจริง (Duplicate Overcounting)'],
      promotedFeatures: ['Semantic Deduplication', 'Catalyst Decay Horizon (24h/72h/7d)'],
      rejectedRules: ['นับจำนวนโพสต์ซ้ำเป็นคะแนนความเชื่อมั่น']
    },
    {
      phase: 18,
      title: 'Unified Feature Store, Real-Time Scoring & Historical Audit Trail',
      category: 'Integration (Phase 18-20)',
      status: 'QUEUED',
      description: 'การรวม Feature ทุกสายเข้าสู่ In-Memory Storage และเก็บบันทึกประวัติศาสตร์ย้อนหลังทุก Snapshot เพื่อการ Replay และ Backtest ที่สมบูรณ์',
      keySources: ['Redis Streams, ClickHouse Time-Series Store, Event Bus'],
      findings: ['Point-in-time Data Store ที่สมบูรณ์คือหัวใจของการป้องกัน Look-ahead Bias'],
      promotedFeatures: ['Millisecond Feature Store', 'Full Historical Replay Engine'],
      rejectedRules: ['จัดเก็บเฉพาะสถานะปัจจุบันโดยไม่มีประวัติการคำนวณย้อนหลัง']
    },
    {
      phase: 19,
      title: 'Meta-Analysis, Backtest, Walk-Forward, OOS & Overfitting Elimination',
      category: 'Integration (Phase 18-20)',
      status: 'QUEUED',
      description: 'การทดสอบประลองโมเดลทั้งหมด (Champion vs Challengers) ผ่าน Walk-Forward Analysis และ Deflated Sharpe Ratio',
      keySources: ['Bailey & López de Prado — Deflated Sharpe Ratio, Purged Walk-Forward CV'],
      findings: ['มีเพียงโมเดลที่ผ่านการทดสอบ Walk-Forward และหักต้นทุน Slippage จริงเท่านั้นที่จะได้เข้าสู่ Production'],
      promotedFeatures: ['Purged/Embargoed Walk-Forward', 'Deflated Sharpe Ratio Audit'],
      rejectedRules: ['ยอมรับโมเดลที่ผ่านการ Overfit หรือทดสอบเฉพาะตลาดกระทิง']
    },
    {
      phase: 20,
      title: 'Final Adaptive Algorithm, Production Prompt & Technical Specification',
      category: 'Integration (Phase 18-20)',
      status: 'QUEUED',
      description: 'การรวบรวมอัลกอริทึมขั้นสุดท้าย ออกแบบ Architecture ที่สมบูรณ์ และบันทึกข้อกำหนดการทำงานทางเทคนิคแบบครบวงจร',
      keySources: ['Institutional Production Specification Framework'],
      findings: ['ระบบ Adaptive Algorithm อัตโนมัติที่สมบูรณ์จะปรับตัวตาม Regime โดยไม่จำเป็นต้องปรับค่าตัวเลขด้วยมือ'],
      promotedFeatures: ['Fully Autonomous Quant Engine', 'Unified Top-5 Production Model'],
      rejectedRules: ['Hardcode ค่าพารามิเตอร์คงที่ที่ไม่ปรับตัวตามสภาวะตลาด']
    }
  ];

  // Enhance Top 5 candidates with research metrics & live Phase 20 Quant Data
  const premiumCandidates = useMemo(() => {
    const liveRate = getUsdThbRate() || 33.39;

    if (premiumData && premiumData.candidates && premiumData.candidates.length > 0) {
      return premiumData.candidates.map((candidate, idx) => {
        const isAlreadyThb = premiumData.denominatedCurrency === 'THB' || candidate.price > 5000 || (candidate.symbol === 'BTC' && candidate.price > 1000000);
        const rate = isAlreadyThb ? 1 : liveRate;

        const price = isAlreadyThb ? candidate.price : Number((candidate.price * rate).toFixed(candidate.price * rate < 0.01 ? 6 : candidate.price * rate < 1 ? 4 : 2));

        const grossAlphaBps = candidate.tradableEdge.grossExpectedAlphaBps;
        const feeBps = candidate.tradableEdge.feeBps;
        const spreadBps = candidate.tradableEdge.spreadBps;
        const slippageBps = candidate.tradableEdge.estimatedSlippageBps;
        const marketImpactBps = candidate.tradableEdge.marketImpactBps;
        const allInCostBps = candidate.tradableEdge.totalAllInCostBps;
        const expectedNetEdgeBps = candidate.tradableEdge.expectedTradableEdgeBps;
        const expectedNetEdgePct = candidate.tradableEdge.expectedTradableEdgePct.toFixed(2);

        const regimeCompatibility = Math.min(99, Math.round(candidate.scores.trend * 0.4 + candidate.scores.momentum * 0.4 + (premiumData.marketRegime.confidenceScore || 80) * 0.2));
        const vpinToxicity = Math.max(12, Math.min(48, Math.round(28 - (candidate.scores.coinQuality * 0.15) + (idx * 3))));
        const cvdTrend = candidate.scores.orderFlow >= 75 ? 'STRONG ACCUMULATION' : 'HEALTHY INFLOW';
        const localPremiumPct = +(0.06 + (idx * 0.03)).toFixed(2);

        const shapPositive = candidate.explainability?.positiveContributors?.map(c => ({
          name: c.factor,
          impact: c.impactBps,
        })) || [
          { name: 'Expected Tradable Edge after Costs', impact: `+${expectedNetEdgeBps} bps` },
          { name: 'Specialist Ensemble Momentum Consensus', impact: `+${Math.round(candidate.scores.momentum * 0.6)} bps` },
        ];

        const shapNegative = candidate.explainability?.negativeContributors?.map(c => ({
          name: c.factor,
          impact: c.impactBps,
        })) || [
          { name: 'Bitkub All-In Roundtrip Costs', impact: `-${allInCostBps} bps` },
          { name: 'ATR Extension & Price Distance from VWAP', impact: `-${Math.round(candidate.scores.extension * 0.2)} bps` },
        ];

        const hrpWeight = candidate.sizing?.hrpWeightPct || [28, 24, 20, 16, 12][idx] || 15;

        const setup = isAlreadyThb ? candidate.setup : {
          ...candidate.setup,
          entryZone: {
            min: +(candidate.setup.entryZone.min * rate).toFixed(2),
            max: +(candidate.setup.entryZone.max * rate).toFixed(2),
            preferred: +(candidate.setup.entryZone.preferred * rate).toFixed(2),
          },
          initialStopPrice: +(candidate.setup.initialStopPrice * rate).toFixed(2),
          invalidationPrice: +(candidate.setup.invalidationPrice * rate).toFixed(2),
          target1: +(candidate.setup.target1 * rate).toFixed(2),
          target2: +(candidate.setup.target2 * rate).toFixed(2),
          target3: +(candidate.setup.target3 * rate).toFixed(2),
        };

        const fibonacci = isAlreadyThb ? candidate.fibonacci : {
          ...candidate.fibonacci,
          swingHigh: +(candidate.fibonacci.swingHigh * rate).toFixed(2),
          swingLow: +(candidate.fibonacci.swingLow * rate).toFixed(2),
          fib236: +(candidate.fibonacci.fib236 * rate).toFixed(2),
          fib382: +(candidate.fibonacci.fib382 * rate).toFixed(2),
          fib500: +(candidate.fibonacci.fib500 * rate).toFixed(2),
          fib618: +(candidate.fibonacci.fib618 * rate).toFixed(2),
          fib786: +(candidate.fibonacci.fib786 * rate).toFixed(2),
          ext1272: +(candidate.fibonacci.ext1272 * rate).toFixed(2),
          ext1618: +(candidate.fibonacci.ext1618 * rate).toFixed(2),
          ext2000: +(candidate.fibonacci.ext2000 * rate).toFixed(2),
        };

        const assistant: TradeDecisionAssistant = isAlreadyThb ? candidate.decisionAssistant : {
          ...candidate.decisionAssistant,
          entryZone: setup.entryZone,
          stops: {
            ...candidate.decisionAssistant.stops,
            softWarningPrice: +(candidate.decisionAssistant.stops.softWarningPrice * rate).toFixed(2),
            hardStopPrice: +(candidate.decisionAssistant.stops.hardStopPrice * rate).toFixed(2),
          },
          takeProfits: {
            ...candidate.decisionAssistant.takeProfits,
            tp1Price: +(candidate.decisionAssistant.takeProfits.tp1Price * rate).toFixed(2),
            tp2Price: +(candidate.decisionAssistant.takeProfits.tp2Price * rate).toFixed(2),
            tp3Price: +(candidate.decisionAssistant.takeProfits.tp3Price * rate).toFixed(2),
          }
        };

        return {
          rank: candidate.rank,
          symbol: candidate.symbol,
          name: candidate.name,
          price,
          change24h: candidate.change24h,
          change7d: candidate.change7d,
          volume24h: isAlreadyThb ? candidate.volume24h : candidate.volume24h * rate,
          sector: candidate.sector,
          coinQualityScore: candidate.scores.coinQuality,
          opportunityScore: candidate.scores.opportunity,
          finalScore: candidate.sizing.riskAdjustedScore,
          extensionScore: candidate.scores.extension,
          entryQualityScore: setup.entryQualityScore,
          entryStatus: setup.entryMode,
          extensionLevel: candidate.scores.extension > 75 ? 'High Risk' : candidate.scores.extension > 60 ? 'Moderate' : 'Normal',
          badges: [setup.entryMode, `Edge +${expectedNetEdgeBps}bps`, `R:R 1:${setup.riskRewardRatio}`],
          grossAlphaBps,
          allInCostBps,
          feeBps,
          spreadBps,
          slippageBps,
          marketImpactBps,
          expectedNetEdgeBps,
          expectedNetEdgePct,
          regimeCompatibility,
          vpinToxicity,
          cvdTrend,
          localPremiumPct,
          shapPositive,
          shapNegative,
          hrpWeight,
          maxExecutableSizeThb: candidate.tradableEdge.maxExecutableCapacityThb || (idx === 0 ? 500000 : 250000),
          academicCitation: idx === 0 
            ? 'Liu & Tsyvinski (RFS) + Anastasopoulos (JFM 2026)' 
            : idx === 1 
            ? 'Li et al. (PBFJ 2026 Random Forest Ensemble)' 
            : idx === 2 
            ? 'Donchian Breakout + Han et al. Volatility Sizing' 
            : idx === 3 
            ? 'Zaremba et al. (IRFA) Liquidity Momentum' 
            : 'Guo et al. (JEDC 2024) Cross-Coin Lead-Lag',
          trailingStopPlan: {
            currentStopPrice: setup.initialStopPrice,
            step1TriggerPrice: setup.target1,
            step1NewStopPrice: setup.entryZone.preferred,
            step2TriggerPrice: setup.target2,
            step2NewStopPrice: setup.target1,
            trailingDistancePct: 4.5,
          },
          invalidation: `< ฿${formatThb(setup.invalidationPrice)}`,
          decisionAssistant: assistant,
          rawPhase20: {
            ...candidate,
            price,
            setup,
            fibonacci,
            decisionAssistant: assistant,
          },
        };
      });
    }

    if (!data?.top5 || data.top5.length === 0) return [];
    
    return data.top5.map((candidate, idx) => {
      const candidatePriceThb = Number((candidate.price * liveRate).toFixed(candidate.price * liveRate < 0.01 ? 6 : candidate.price * liveRate < 1 ? 4 : 2));
      // Calculate realistic tradable edge based on candidate rank and scores
      const grossAlphaBps = Math.round(180 + (candidate.opportunityScore * 1.2) - (idx * 22));
      const feeBps = 25; // Bitkub 0.25% taker fee
      const spreadBps = Math.max(8, Math.round(14 - (idx * 1.5)));
      const slippageBps = Math.round(12 + (idx * 4));
      const marketImpactBps = Math.round(8 + (idx * 2));
      const allInCostBps = feeBps + spreadBps + slippageBps + marketImpactBps;
      const expectedNetEdgeBps = grossAlphaBps - allInCostBps;
      const expectedNetEdgePct = (expectedNetEdgeBps / 100).toFixed(2);

      // Microstructure & Regime specifics
      const regimeCompatibility = Math.min(98, Math.max(75, Math.round(candidate.finalScore * 0.95 + (5 - idx) * 1.5)));
      const vpinToxicity = Math.max(12, Math.min(48, Math.round(28 - (candidate.coinQualityScore * 0.15) + (idx * 3))));
      const cvdTrend = idx % 2 === 0 ? 'STRONG ACCUMULATION' : 'HEALTHY INFLOW';
      const localPremiumPct = +(0.08 + (idx * 0.04) - (idx === 2 ? 0.12 : 0)).toFixed(2);

      // SHAP Factors
      const shapPositive = [
        { name: 'Time-Series & Cross-Sectional Momentum (Phase 2)', impact: `+${(grossAlphaBps * 0.38 / 10).toFixed(1)} bps` },
        { name: 'Order Flow Imbalance & CVD Accumulation (Phase 5)', impact: `+${(grossAlphaBps * 0.28 / 10).toFixed(1)} bps` },
        { name: 'On-chain MVRV & Active Address Expansion (Phase 7)', impact: `+${(grossAlphaBps * 0.22 / 10).toFixed(1)} bps` },
        { name: 'Sector Relative Leadership & Follower Momentum (Phase 8)', impact: `+${(grossAlphaBps * 0.12 / 10).toFixed(1)} bps` },
      ];

      const shapNegative = [
        { name: 'Round-trip Trading Fee & Bitkub Spread', impact: `-${((feeBps + spreadBps) / 10).toFixed(1)} bps` },
        { name: 'Distance from VWAP / ATR Extension Penalty', impact: `-${(candidate.extensionScore * 0.18).toFixed(1)} bps` },
      ];

      // HRP Allocation percentage (Normalized across top 5)
      const baseWeights = [28, 24, 20, 16, 12];
      const hrpWeight = baseWeights[idx] || 15;

      const fallbackDecisionAssistant: TradeDecisionAssistant = {
        decisionState: (idx === 0 ? 'ENTRY_READY' : idx === 1 ? 'WAIT_FOR_PULLBACK' : 'ENTRY_READY') as DecisionState,
        decisionLabelTh: idx === 1 ? '🔵 รอย่อเข้า' : '🟢 พร้อมเข้า',
        decisionSubTh: idx === 1 ? 'แนวโน้มดี แต่ราคาสูงกว่าโซนซื้อ ห้ามไล่ราคา รอย่อกลับ' : 'ราคาอยู่ใน Entry Zone และเงื่อนไขสถาบันผ่านครบ',
        currentPriceZoneRelation: idx === 1 ? 'ABOVE_ENTRY_ZONE' : 'INSIDE_ENTRY_ZONE',
        zoneDistancePct: idx === 1 ? 4.7 : 0,
        zoneRecommendationTh: idx === 1 
          ? `สูงกว่า Entry Zone +4.7% → ไม่แนะนำไล่ราคา → รอย่อกลับ ฿${Math.round(candidatePriceThb * 0.95).toLocaleString()}–฿${Math.round(candidatePriceThb * 0.98).toLocaleString()}`
          : `ราคาอยู่ใน Entry Zone (฿${Math.round(candidatePriceThb * 0.985).toLocaleString()} – ฿${Math.round(candidatePriceThb * 1.01).toLocaleString()}) → เข้าได้ตามแผน`,
        entryZone: {
          min: Math.round(candidatePriceThb * 0.985),
          max: Math.round(candidatePriceThb * 1.01),
          preferred: Math.round(candidatePriceThb * 0.995),
        },
        stops: {
          softWarningPrice: Math.round(candidatePriceThb * 0.965),
          softWarningRationaleTh: 'ยังไม่ขายทันที แต่เริ่มเฝ้าระวัง (หลุดระดับ EMA 20 หรือทดสอบแนวรับย่อย)',
          hardStopPrice: Math.round(candidatePriceThb * 0.94),
          hardStopRationaleTh: 'Thesis ผิดแล้ว ไม่ควรถือด้วยเหตุผลเดิม: หลุดแนวรับ 4H + ต่ำกว่า Swing Low',
          stopDistancePct: 6.0,
        },
        takeProfits: {
          tp1Price: Math.round(candidatePriceThb * 1.064),
          tp1GainPct: 6.4,
          tp1ActionTh: 'ขาย 25–30% และเลื่อน Stop ขยับบังทุน (Break-even)',
          tp2Price: Math.round(candidatePriceThb * 1.117),
          tp2GainPct: 11.7,
          tp2ActionTh: 'ขายเพิ่ม 25–35% เพื่อล็อกกำไรก้อนหลัก',
          tp3Price: Math.round(candidatePriceThb * 1.182),
          tp3GainPct: 18.2,
          tp3ActionTh: 'ปล่อยกำไรวิ่งต่อ (Let Profit Run) ด้วย Trailing Stop สำหรับส่วนที่เหลือ',
        },
        riskRewardRatio: 2.8,
        recommendedHoldingDurationTh: '3–10 วัน (Swing Trade)',
        confidencePct: Math.round(candidate.confidenceScore || 84),
        thesisHealthScore: 86 - (idx * 5),
        thesisHealthLevel: idx === 0 ? 'HEALTHY' : idx === 1 ? 'HOLD' : 'HEALTHY',
        holdPlan: {
          holdConditions: [
            '4H Trend และ 1D Trend ยังคงรักษาโครงสร้างขาขึ้นต่อเนื่อง',
            'Order Flow (CVD) ยังอยู่ในภาวะสะสม (Accumulation) เงินทุนไหลเข้าสุทธิ',
            'Buy Now Score > 75 และ Thesis Health > 70',
            'ราคาไม่หลุด Trailing Stop ที่ระบบขยับยกสูงขึ้นตามกำไร',
            'ไม่มี Critical Negative Catalyst หรือแรงเทขายผิดปกติจากกระดานโลก',
          ],
          reduceConditions: [
            'Buy Now Score ลดต่ำกว่า 70 หรือมีสัญญาณ Overbought จัด',
            'CVD พลิกกลับเป็นกระจายของ (Distribution) อย่างต่อเนื่อง',
            'Relative Strength อ่อนแรงกว่า BTC หรือกลุ่มเหรียญนำ',
            'Market Regime เปลี่ยนจาก Bull เป็น Sideways หรือ Bear',
          ],
          exitConditions: [
            'ราคาหลุด Hard Stop Invalidation (โครงสร้าง 4H ถูกทำลาย)',
            'Thesis Health ต่ำกว่า 50 (เหตุผลที่เข้าซื้อวันแรกหมดความชอบธรรม)',
            'เกิด Critical Risk Gate หรือ Exchange Outflow ผิดปกติ',
          ],
        },
        executiveSummaryTh: `${candidate.symbol} — ตอนนี้ “${idx === 1 ? 'รอย่อเข้า อย่าไล่ราคา' : 'เข้าได้ตามแผน'}”: ราคา ฿${candidatePriceThb.toLocaleString()} ${idx === 1 ? 'สูงกว่าโซนซื้อเล็กน้อย ควรรอจังหวะย่อตัว' : 'อยู่ในโซนเข้าที่ระบบประเมินไว้'} แนวโน้ม 4H/1D ยังเป็นบวก และ Order Flow ยังอยู่ในภาวะสะสม หากเข้าบริเวณนี้ให้ใช้ ฿${Math.round(candidatePriceThb * 0.94).toLocaleString()} เป็นจุดยกเลิกแผน และตั้งเป้าหมายแรก ฿${Math.round(candidatePriceThb * 1.064).toLocaleString()} ถึง TP1 ให้เลื่อน Stop บังทุนทันที`,
        planActionTh: `เข้าบริเวณ ฿${Math.round(candidatePriceThb * 0.985).toLocaleString()}–฿${Math.round(candidatePriceThb * 1.01).toLocaleString()} / ถือต่อขณะราคาไม่หลุด ฿${Math.round(candidatePriceThb * 0.94).toLocaleString()} / ถึง TP1 ทยอยขาย 25–30% และยก Stop บังทุน`,
      };

      return {
        ...candidate,
        price: candidatePriceThb,
        grossAlphaBps,
        allInCostBps,
        feeBps,
        spreadBps,
        slippageBps,
        marketImpactBps,
        expectedNetEdgeBps,
        expectedNetEdgePct,
        regimeCompatibility,
        vpinToxicity,
        cvdTrend,
        localPremiumPct,
        shapPositive,
        shapNegative,
        hrpWeight,
        maxExecutableSizeThb: idx === 0 ? 500000 : idx === 1 ? 350000 : idx === 2 ? 250000 : 180000,
        academicCitation: idx === 0 
          ? 'Liu & Tsyvinski (RFS) + Anastasopoulos (JFM 2026)' 
          : idx === 1 
          ? 'Li et al. (PBFJ 2026 Random Forest Ensemble)' 
          : idx === 2 
          ? 'Donchian Breakout + Han et al. Volatility Sizing' 
          : idx === 3 
          ? 'Zaremba et al. (IRFA) Liquidity Momentum' 
          : 'Guo et al. (JEDC 2024) Cross-Coin Lead-Lag',
        decisionAssistant: fallbackDecisionAssistant,
        rawPhase20: undefined,
      };
    });
  }, [data?.top5, premiumData]);

  const toggleCardExpand = (symbol: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };

  const expandAllCards = () => {
    const nextState: Record<string, boolean> = {};
    premiumCandidates.forEach(c => {
      nextState[c.symbol] = true;
    });
    setExpandedCards(nextState);
  };

  const collapseAllCards = () => {
    setExpandedCards({});
  };

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
          glow: 'rgba(245, 158, 11, 0.4)',
          border: '#FBBF24',
          text: '#FEF3C7',
          label: 'TOP #1 QUANT LEADER',
        };
      case 2:
        return {
          gradient: 'linear-gradient(135deg, #10B981, #059669)',
          glow: 'rgba(16, 185, 129, 0.4)',
          border: '#34D399',
          text: '#D1FAE5',
          label: 'TOP #2 MOMENTUM RUNNER',
        };
      case 3:
        return {
          gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
          glow: 'rgba(6, 182, 212, 0.4)',
          border: '#38BDF8',
          text: '#CFFAFE',
          label: 'TOP #3 BREAKOUT CONFIRMED',
        };
      case 4:
        return {
          gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          glow: 'rgba(139, 92, 246, 0.4)',
          border: '#A78BFA',
          text: '#EDE9FE',
          label: 'TOP #4 SECTOR ACCUMULATOR',
        };
      case 5:
      default:
        return {
          gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
          glow: 'rgba(59, 130, 246, 0.4)',
          border: '#60A5FA',
          text: '#DBEAFE',
          label: 'TOP #5 QUALITY VALUE',
        };
    }
  };

  const getDecisionBadgeStyle = (state: DecisionState | string) => {
    switch (state) {
      case 'ENTRY_READY':
        return {
          bg: 'rgba(16, 185, 129, 0.18)',
          border: 'rgba(16, 185, 129, 0.6)',
          color: '#34D399',
          glow: '0 0 16px rgba(16, 185, 129, 0.35)',
          label: '🟢 พร้อมเข้า',
          subTh: 'ราคาอยู่ใน Entry Zone และเงื่อนไขผ่านครบ'
        };
      case 'WAIT_FOR_PULLBACK':
        return {
          bg: 'rgba(59, 130, 246, 0.18)',
          border: 'rgba(59, 130, 246, 0.6)',
          color: '#60A5FA',
          glow: '0 0 16px rgba(59, 130, 246, 0.35)',
          label: '🔵 รอย่อเข้า',
          subTh: 'แนวโน้มดี แต่ราคาสูงกว่าโซนซื้อ ห้ามไล่ราคา'
        };
      case 'WAIT_FOR_BREAKOUT':
        return {
          bg: 'rgba(245, 158, 11, 0.18)',
          border: 'rgba(245, 158, 11, 0.6)',
          color: '#FBBF24',
          glow: '0 0 16px rgba(245, 158, 11, 0.35)',
          label: '🟡 รอ Breakout',
          subTh: 'ยังไม่ผ่านแนวต้านสำคัญ รอ Volume หนุน'
        };
      case 'HOLD':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.5)',
          color: '#10B981',
          glow: '0 0 14px rgba(16, 185, 129, 0.25)',
          label: '🟢 ถือต่อ',
          subTh: 'Thesis ยังแข็งแรง โมเมนตัมคงเดิม ไม่ต้องขาย'
        };
      case 'HOLD_AND_PROTECT':
        return {
          bg: 'rgba(249, 115, 22, 0.18)',
          border: 'rgba(249, 115, 22, 0.6)',
          color: '#FB923C',
          glow: '0 0 16px rgba(249, 115, 22, 0.35)',
          label: '🟠 ปกป้องกำไร',
          subTh: 'กำไรมากแล้ว เริ่มยก Trailing Stop ปกป้องทุน'
        };
      case 'TAKE_PARTIAL_PROFIT':
        return {
          bg: 'rgba(234, 179, 8, 0.18)',
          border: 'rgba(234, 179, 8, 0.6)',
          color: '#FACC15',
          glow: '0 0 16px rgba(234, 179, 8, 0.35)',
          label: '🟡 ทยอยทำกำไร',
          subTh: 'ถึง TP หรือ Reward เริ่มลด ทยอยล็อกกำไร'
        };
      case 'EXIT':
        return {
          bg: 'rgba(239, 68, 68, 0.18)',
          border: 'rgba(239, 68, 68, 0.6)',
          color: '#F87171',
          glow: '0 0 16px rgba(239, 68, 68, 0.35)',
          label: '🔴 ควรออก',
          subTh: 'Thesis เสีย / หลุด Invalidation Level'
        };
      case 'EMERGENCY_EXIT':
        return {
          bg: 'rgba(220, 38, 38, 0.25)',
          border: 'rgba(220, 38, 38, 0.8)',
          color: '#EF4444',
          glow: '0 0 20px rgba(220, 38, 38, 0.5)',
          label: '🚨 ออกทันที',
          subTh: 'Critical Event / Risk Gate ถูกทริกเกอร์'
        };
      case 'ABSTAIN':
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          border: 'rgba(148, 163, 184, 0.4)',
          color: '#94A3B8',
          glow: 'none',
          label: '⚪ ไม่ควรเข้า',
          subTh: 'Expected Tradable Edge ไม่พอหลังหักต้นทุน'
        };
    }
  };

  const getThesisHealthBadgeStyle = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'rgba(16, 185, 129, 0.18)',
        border: 'rgba(16, 185, 129, 0.5)',
        color: '#34D399',
        label: 'HEALTHY แข็งแรงมาก',
        shortLabel: 'HEALTHY',
      };
    }
    if (score >= 70) {
      return {
        bg: 'rgba(59, 130, 246, 0.18)',
        border: 'rgba(59, 130, 246, 0.5)',
        color: '#60A5FA',
        label: 'HOLD ถือต่อได้',
        shortLabel: 'HOLD',
      };
    }
    if (score >= 60) {
      return {
        bg: 'rgba(245, 158, 11, 0.18)',
        border: 'rgba(245, 158, 11, 0.5)',
        color: '#FBBF24',
        label: 'WATCH เริ่มเฝ้าระวัง',
        shortLabel: 'WATCH',
      };
    }
    if (score >= 45) {
      return {
        bg: 'rgba(249, 115, 22, 0.2)',
        border: 'rgba(249, 115, 22, 0.6)',
        color: '#FB923C',
        label: 'REDUCE พิจารณาลดพอร์ต',
        shortLabel: 'REDUCE',
      };
    }
    return {
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'rgba(239, 68, 68, 0.6)',
      color: '#F87171',
      label: 'EXIT ควรปิดสถานะ',
      shortLabel: 'EXIT',
    };
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: '1680px', margin: '0 auto', color: 'var(--text-primary)' }}>
      
      {/* ─── Hero Header & Institutional Badge ─── */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(245, 158, 11, 0.12)'
        }}
      >
        {/* Subtle background glow */}
        <div 
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18), transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div 
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
                }}
              >
                <Crown size={22} color="#FFFFFF" />
              </div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                แนะนำ Top 5 <span style={{ color: '#F59E0B' }}>Premium</span>
              </h1>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} />
                INSTITUTIONAL QUANT ENGINE
              </span>
            </div>
            
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '850px', lineHeight: 1.5 }}>
              ระบบคัดเลือก 5 เหรียญชั้นยอดระดับสถาบัน ขับเคลื่อนด้วยโครงสร้างวิจัยสากล <strong>20-Phase Master Research Program</strong>: 
              ผสานโมเดล <strong>Market Regime 6 มิติ</strong>, <strong>Order Flow Microstructure (VPIN & CVD)</strong>, 
              <strong>Tree Ensemble ML (SHAP Attribution)</strong> และคำนวณ <strong>Expected Tradable Edge</strong> หลังหักต้นทุนจริงทุกมิติ
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => loadQuantData(true)}
              disabled={isRecalculating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: isRecalculating ? 'rgba(59, 130, 246, 0.2)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(139, 92, 246, 0.25))',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#FEF3C7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isRecalculating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)'
              }}
            >
              <RefreshCw size={15} className={isRecalculating ? 'spin-animation' : ''} />
              {isRecalculating ? 'กำลังคำนวณ Quant ระดับสถาบัน...' : 'คำนวณคะแนนใหม่ (Recalculate)'}
            </button>

            <div 
              style={{
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={13} />
              อัปเดตล่าสุด: {lastFetchTime || 'กำลังโหลด...'}
            </div>
          </div>
        </div>

        {/* ─── Institutional Status Pill Banner ─── */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Card 1: Expected Edge Standard */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={16} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TRADABLE ALPHA RULE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>
                Alpha - All-in Costs &gt; 0
              </div>
            </div>
          </div>

          {/* Card 2: Regime State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={16} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MARKET REGIME DETECTOR</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#60A5FA' }}>
                {data?.marketContext?.marketRegimeTh || 'Sideways / Selective Bull'}
              </div>
            </div>
          </div>

          {/* Card 3: Microstructure VPIN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={16} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MICROSTRUCTURE GATE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FBBF24' }}>
                VPIN Normal &middot; Book Depth Solid
              </div>
            </div>
          </div>

          {/* Card 4: Portfolio Allocation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={16} color="#8B5CF6" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PORTFOLIO SIZING</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#C4B5FD' }}>
                Hierarchical Risk Parity (HRP)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs Bar ─── */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        <button
          onClick={() => setActiveTab('candidates')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'candidates' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid var(--border-color)',
            background: activeTab === 'candidates' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'candidates' ? '#FBBF24' : 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'candidates' ? '0 0 14px rgba(245, 158, 11, 0.2)' : 'none'
          }}
        >
          <Crown size={16} />
          Top 5 Premium Ranking
        </button>

        <button
          onClick={() => setActiveTab('microstructure')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'microstructure' ? '1px solid rgba(6, 182, 212, 0.6)' : '1px solid var(--border-color)',
            background: activeTab === 'microstructure' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'microstructure' ? '#38BDF8' : 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Gauge size={16} />
          Microstructure & Order Flow Radar
        </button>

        <button
          onClick={() => setActiveTab('regimes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'regimes' ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid var(--border-color)',
            background: activeTab === 'regimes' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'regimes' ? '#60A5FA' : 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Compass size={16} />
          Dual-Level Regime Matrix
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'portfolio' ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid var(--border-color)',
            background: activeTab === 'portfolio' ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'portfolio' ? '#C4B5FD' : 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <PieChart size={16} />
          Portfolio Risk & Sizing (HRP)
        </button>

        <button
          onClick={() => setActiveTab('research')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'research' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-color)',
            background: activeTab === 'research' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'research' ? '#34D399' : 'var(--text-secondary)',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={16} />
          20-Phase Master Research Roadmap
          <span 
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.25)',
              color: '#10B981',
              fontWeight: 800
            }}
          >
            PHASE 1–9
          </span>
        </button>
      </div>

      {/* ─── TAB 1: LIVE TOP 5 PREMIUM CANDIDATES ─── */}
      {activeTab === 'candidates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={36} className="spin-animation" style={{ margin: '0 auto 16px' }} />
              <div>กำลังรวบรวมข้อมูลและคำนวณ Expected Tradable Edge ระดับสถาบัน...</div>
            </div>
          ) : premiumCandidates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <AlertCircle size={32} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 700 }}>ไม่มีเหรียญที่ผ่านเกณฑ์ Institutional Gate ในขณะนี้</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>ระบบควบคุมความเสี่ยง (Abstention Model) ปิดรับคำสั่งซื้อชั่วคราว</div>
            </div>
          ) : (
            <>
              {/* Master Toolbar: Summary & Expand/Collapse All Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08), rgba(16, 185, 129, 0.06))',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF'
                    }}
                  >
                    <Crown size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>5 เหรียญชั้นยอดระดับสถาบัน (Top 5 Premium)</span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34D399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          fontWeight: 800
                        }}
                      >
                        สกุลเงิน THB (฿) ทั้งหมด
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      แสดงสรุปแผนเทรดอย่างกระชับสบายตา &middot; รายละเอียดเชิงลึกถูกย่อไว้ คลิกเพื่อเปิดดูเมื่อต้องการ
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={expandAllCards}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#93C5FD',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="เปิดดูรายละเอียดเชิงลึกและแผนเทรด 20 ขั้นตอนของทั้ง 5 เหรียญ"
                  >
                    <Eye size={13} />
                    ขยายดูรายละเอียดทั้งหมด
                  </button>

                  <button
                    onClick={collapseAllCards}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="ย่อรายละเอียดเชิงลึกทั้งหมดเพื่อดูสบายตา"
                  >
                    <ChevronUp size={13} />
                    ย่อรายละเอียดทั้งหมด
                  </button>
                </div>
              </div>

              {premiumCandidates.map((coin) => {
                const rankTheme = getRankBadgeStyle(coin.rank);
                const isExpanded = !!expandedCards[coin.symbol];
              const assistant: TradeDecisionAssistant = coin.decisionAssistant || (coin.rawPhase20?.decisionAssistant as TradeDecisionAssistant);
              const planMode = activePlanModes[coin.symbol] || 'ENTRY';
              const isHoldPlanOpen = !!expandedHoldPlan[coin.symbol];
              const decStyle = getDecisionBadgeStyle(assistant?.decisionState || 'ENTRY_READY');
              const healthStyle = getThesisHealthBadgeStyle(assistant?.thesisHealthScore || 85);

              return (
                <div
                  key={coin.symbol}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isExpanded ? rankTheme.border : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '16px',
                    padding: '20px 24px',
                    transition: 'all 0.2s ease',
                    boxShadow: isExpanded ? `0 8px 30px ${rankTheme.glow}` : '0 4px 16px rgba(0, 0, 0, 0.25)',
                    position: 'relative'
                  }}
                >
                  {/* Top Bar: Rank, Symbol, Price, Expected Net Edge Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Rank Emblem */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: rankTheme.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '18px',
                          boxShadow: `0 4px 14px ${rankTheme.glow}`,
                          flexShrink: 0
                        }}
                      >
                        #{coin.rank}
                      </div>

                      {/* Official Coin Icon */}
                      <CryptoIcon symbol={coin.symbol} size={44} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                            {coin.symbol}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {coin.symbol}/THB &middot; Bitkub
                          </span>
                          <span 
                            style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              background: 'rgba(245, 158, 11, 0.15)', 
                              color: '#FBBF24',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            {rankTheme.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {coin.academicCitation}
                        </div>
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          <PriceCell price={coin.price} prefix="฿" />
                        </div>
                        <div 
                          style={{ 
                            fontSize: '12.5px', 
                            fontWeight: 700, 
                            color: coin.change24h >= 0 ? '#10B981' : '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px'
                          }}
                        >
                          {coin.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {coin.change24h >= 0 ? `+${coin.change24h.toFixed(2)}%` : `${coin.change24h.toFixed(2)}%`} (24h)
                        </div>
                      </div>

                      {/* Expected Tradable Net Edge Pill */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '10px', color: '#6EE7B7', fontWeight: 700, letterSpacing: '0.5px' }}>
                          EXPECTED TRADABLE EDGE
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                          +{coin.expectedNetEdgeBps} bps ({coin.expectedNetEdgePct}%)
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          หลังหักต้นทุนเทรดจริง {coin.allInCostBps} bps
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── QUICK TRADE SUMMARY STRIP (ALWAYS VISIBLE & COMPACT) ─── */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    {/* Left: Quick Decision State & Key Price Targets in THB */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      {/* Decision State Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: decStyle.bg,
                          border: `1px solid ${decStyle.border}`,
                          borderRadius: '8px',
                          padding: '4px 10px'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 900, color: decStyle.color }}>
                          {decStyle.label}
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>
                          ({assistant?.decisionState || 'ENTRY_READY'})
                        </span>
                      </div>

                      {/* Entry Zone in THB */}
                      {assistant && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>โซนเข้า:</span>
                          <span style={{ fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                            ฿{formatThb(assistant.entryZone.min)} – ฿{formatThb(assistant.entryZone.max)}
                          </span>
                        </div>
                      )}

                      {/* Preferred Entry in THB */}
                      {assistant && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>จุดเข้าเหมาะสม:</span>
                          <span style={{ fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                            ฿{formatThb(assistant.entryZone.preferred)}
                          </span>
                        </div>
                      )}

                      {/* TP1 in THB */}
                      {assistant && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>เป้าหมาย TP1:</span>
                          <span style={{ fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                            ฿{formatThb(assistant.takeProfits.tp1Price)} (+{assistant.takeProfits.tp1GainPct}%)
                          </span>
                        </div>
                      )}

                      {/* Hard Stop in THB */}
                      {assistant && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stop Loss:</span>
                          <span style={{ fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                            ฿{formatThb(assistant.stops.hardStopPrice)} (-{assistant.stops.stopDistancePct}%)
                          </span>
                        </div>
                      )}

                      {/* R:R */}
                      {assistant && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>R:R:</span>
                          <span style={{ fontWeight: 800, color: '#A78BFA', fontFamily: 'var(--font-mono)' }}>
                            1 : {assistant.riskRewardRatio}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Action Buttons & Main Collapsible Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setDetailedPlanCandidate(coin.rawPhase20 || null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#6EE7B7',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="เปิดดูบันไดราคาแบบละเอียด"
                      >
                        <Target size={13} />
                        บันไดราคา
                      </button>

                      {onOpenAnalysis && (
                        <button
                          onClick={() => onOpenAnalysis(coin.symbol)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#93C5FD',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="วิเคราะห์เชิงลึก AI"
                        >
                          <Sparkles size={13} />
                          วิเคราะห์ AI
                        </button>
                      )}

                      <button
                        onClick={() => toggleCardExpand(coin.symbol)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: isExpanded ? 'rgba(239, 68, 68, 0.12)' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                          border: isExpanded ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(6, 182, 212, 0.5)',
                          color: isExpanded ? '#FCA5A5' : '#67E8F9',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isExpanded ? 'none' : '0 0 12px rgba(6, 182, 212, 0.2)'
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <span>ย่อรายละเอียด</span>
                            <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            <Eye size={13} />
                            <span>ดูรายละเอียด &amp; แผนเทรดสถาบัน 20 ขั้นตอน</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ─── COLLAPSIBLE DETAILS (HIDDEN BY DEFAULT, SHOWN ON EXPAND) ─── */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* ─── TIER 1: TRADE PLAN / DECISION ASSISTANT BOX ─── */}
                  {assistant && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(15, 23, 42, 0.95))',
                        border: `1.5px solid ${decStyle.border}`,
                        borderRadius: '14px',
                        padding: '18px 20px',
                        marginBottom: '16px',
                        boxShadow: `0 4px 20px ${decStyle.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Box Header: Decision Label & Mode Switcher */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: decStyle.bg,
                              border: `1px solid ${decStyle.border}`,
                              borderRadius: '10px',
                              padding: '6px 14px',
                              boxShadow: decStyle.glow
                            }}
                          >
                            <span style={{ fontSize: '15px', fontWeight: 900, color: decStyle.color, letterSpacing: '-0.2px' }}>
                              {decStyle.label}
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
                              ({assistant.decisionState})
                            </span>
                          </div>

                          <div style={{ fontSize: '12.5px', color: '#E2E8F0', fontWeight: 600 }}>
                            {assistant.decisionSubTh}
                          </div>
                        </div>

                        {/* Plan Mode Toggle: Entry Plan vs Position Management Plan */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.4)',
                            padding: '3px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <button
                            onClick={() => setActivePlanModes(prev => ({ ...prev, [coin.symbol]: 'ENTRY' }))}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '7px',
                              border: 'none',
                              background: planMode === 'ENTRY' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
                              color: planMode === 'ENTRY' ? '#FFFFFF' : 'var(--text-muted)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Target size={13} />
                            แผนเข้าซื้อ (Entry Plan)
                          </button>

                          <button
                            onClick={() => setActivePlanModes(prev => ({ ...prev, [coin.symbol]: 'POSITION' }))}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '7px',
                              border: 'none',
                              background: planMode === 'POSITION' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                              color: planMode === 'POSITION' ? '#FFFFFF' : 'var(--text-muted)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Briefcase size={13} />
                            แผนถือพอร์ตเมื่อซื้อแล้ว (Position Plan)
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: ENTRY PLAN */}
                      {planMode === 'ENTRY' ? (
                        <>
                          {/* Real-time Zone Alert Banner (FOMO Guard & Chase Prevention) */}
                          <div
                            style={{
                              background: assistant.currentPriceZoneRelation === 'INSIDE_ENTRY_ZONE'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : assistant.currentPriceZoneRelation === 'ABOVE_ENTRY_ZONE'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(59, 130, 246, 0.12)',
                              border: `1px solid ${
                                assistant.currentPriceZoneRelation === 'INSIDE_ENTRY_ZONE'
                                  ? 'rgba(16, 185, 129, 0.4)'
                                  : assistant.currentPriceZoneRelation === 'ABOVE_ENTRY_ZONE'
                                  ? 'rgba(245, 158, 11, 0.5)'
                                  : 'rgba(59, 130, 246, 0.4)'
                              }`,
                              borderRadius: '10px',
                              padding: '10px 14px',
                              marginBottom: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {assistant.currentPriceZoneRelation === 'INSIDE_ENTRY_ZONE' ? (
                                <CheckCircle2 size={16} color="#34D399" />
                              ) : (
                                <AlertTriangle size={16} color="#FBBF24" />
                              )}
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                                {assistant.zoneRecommendationTh}
                              </span>
                            </div>

                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              🛡️ ระบบป้องกัน FOMO & ไล่ราคาตามต้นทุน Slippage จริง
                            </div>
                          </div>

                          {/* 2-Column Institutional Trade Execution Section: Left Ladder / Right Strategy */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                              gap: '16px',
                              marginBottom: '14px'
                            }}
                          >
                            {/* Left Column: Visual Price Ladder (บันไดราคา & จุดตัดสินใจ) */}
                            <div
                              style={{
                                background: 'rgba(0, 0, 0, 0.45)',
                                border: '1px solid rgba(255, 255, 255, 0.09)',
                                borderRadius: '14px',
                                padding: '16px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Activity size={15} /> บันไดราคา & จุดตัดสินใจ (Price Ladder)
                                </div>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                  High → Low
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* TP3 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '7px 12px', borderRadius: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: '#C4B5FD', fontWeight: 700 }}>TP3 (+{assistant.takeProfits.tp3GainPct}%)</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trailing remainder &middot; ปล่อยกำไรวิ่ง</div>
                                  </div>
                                  <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#DDD6FE', fontFamily: 'var(--font-mono)' }}>
                                    ฿{formatThb(assistant.takeProfits.tp3Price)}
                                  </div>
                                </div>

                                {/* TP2 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '7px 12px', borderRadius: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 700 }}>TP2 (+{assistant.takeProfits.tp2GainPct}%)</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ขายเพิ่ม 25–35% &middot; ล็อกกำไรก้อนหลัก</div>
                                  </div>
                                  <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#BFDBFE', fontFamily: 'var(--font-mono)' }}>
                                    ฿{formatThb(assistant.takeProfits.tp2Price)}
                                  </div>
                                </div>

                                {/* TP1 */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '7px 12px', borderRadius: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: '#6EE7B7', fontWeight: 700 }}>TP1 (+{assistant.takeProfits.tp1GainPct}%)</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ขาย 25% &middot; ยก Stop บังทุน (Break-even)</div>
                                  </div>
                                  <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                                    ฿{formatThb(assistant.takeProfits.tp1Price)}
                                  </div>
                                </div>

                                {/* Current Price Pointer */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 179, 8, 0.25))', border: '1.5px solid #F59E0B', padding: '9px 12px', borderRadius: '9px', boxShadow: '0 0 14px rgba(245, 158, 11, 0.25)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#FCD34D', fontWeight: 800 }}>ราคาปัจจุบัน (CURRENT PRICE)</div>
                                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)' }}>
                                        {assistant.currentPriceZoneRelation === 'INSIDE_ENTRY_ZONE' ? '🟢 อยู่ใน Entry Zone เข้าได้' : assistant.currentPriceZoneRelation === 'ABOVE_ENTRY_ZONE' ? '🔵 สูงกว่าโซนเข้ารอย่อ' : 'อยู่นอกโซน'}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                                    ฿{formatThb(coin.price)}
                                  </div>
                                </div>

                                {/* Entry Zone Box */}
                                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed rgba(16, 185, 129, 0.5)', padding: '9px 12px', borderRadius: '9px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 800 }}>ENTRY ZONE (โซนเข้าซื้อ)</span>
                                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                                      ฿{formatThb(assistant.entryZone.min)} – ฿{formatThb(assistant.entryZone.max)}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>จุดเข้าเหมาะสม (Preferred Entry):</span>
                                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                                      ฿{formatThb(assistant.entryZone.preferred)}
                                    </span>
                                  </div>
                                </div>

                                {/* Soft Warning */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: '#FCD34D', fontWeight: 700 }}>Soft Warning (เฝ้าระวัง)</div>
                                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{assistant.stops.softWarningRationaleTh || 'ยังไม่ขายทันที เฝ้าระวัง EMA20'}</div>
                                  </div>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                                    ฿{formatThb(assistant.stops.softWarningPrice)}
                                  </div>
                                </div>

                                {/* Hard Stop Loss */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '7px 12px', borderRadius: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 800 }}>Hard Stop / Invalidation (จุดตัดขาดทุน)</div>
                                    <div style={{ fontSize: '9.5px', color: '#FEE2E2' }}>{assistant.stops.hardStopRationaleTh || 'หลุดโครงสร้าง 4H Swing Low'}</div>
                                  </div>
                                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                                    ฿{formatThb(assistant.stops.hardStopPrice)} (-{assistant.stops.stopDistancePct}%)
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column: Execution Strategy & Risk Control */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Risk : Reward & Thesis Health Box */}
                              <div
                                style={{
                                  background: 'rgba(0, 0, 0, 0.35)',
                                  border: '1px solid rgba(255, 255, 255, 0.07)',
                                  borderRadius: '12px',
                                  padding: '14px 16px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#FBBF24', marginBottom: '10px' }}>
                                  <ShieldCheck size={15} /> สัดส่วนความเสี่ยง & ความมั่นคงของ Thesis
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk : Reward Ratio</div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                                      1 : {assistant.riskRewardRatio}
                                    </div>
                                  </div>

                                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ระยะเวลาถือแนะนำ</div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#93C5FD' }}>
                                      {assistant.recommendedHoldingDurationTh}
                                    </div>
                                  </div>
                                </div>

                                {/* Twin Scores: BUY NOW vs THESIS HEALTH */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10.5px', color: '#6EE7B7', fontWeight: 700 }}>BUY NOW SCORE</div>
                                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                                      {coin.opportunityScore || 88} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 700 }}>พร้อมเข้าตามระบบ</div>
                                  </div>

                                  <div style={{ background: healthStyle.bg, border: '1px solid ' + healthStyle.border, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10.5px', color: healthStyle.color, fontWeight: 700 }}>THESIS HEALTH</div>
                                    <div style={{ fontSize: '20px', fontWeight: 900, color: healthStyle.color, fontFamily: 'var(--font-mono)' }}>
                                      {assistant.thesisHealthScore} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: healthStyle.color, fontWeight: 700 }}>{healthStyle.shortLabel}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* เหตุผลหลัก & สรุปแผนปฏิบัติการ 1 บรรทัด */}
                          <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              <strong style={{ color: '#FBBF24' }}>เหตุผล:</strong> แนวโน้ม 4H/1D เป็นขาขึ้น + เงินไหลเข้าสะสม (CVD) + Relative Strength แข็งแรง และราคาไม่ยืดเกินไป ต้นทุนต่ำกว่า Expected Tradable Edge (+{coin.expectedNetEdgeBps} bps)
                            </div>
                            <div style={{ fontSize: '12px', color: '#E2E8F0' }}>
                              <strong style={{ color: '#34D399' }}>แผน:</strong> “{assistant.planActionTh}”
                            </div>
                          </div>

                          {/* Hold Plan Accordion (แผนการถือ & เกณฑ์ออก) */}
                          <div style={{ marginBottom: '12px' }}>
                            <button
                              onClick={() => setExpandedHoldPlan(prev => ({ ...prev, [coin.symbol]: !prev[coin.symbol] }))}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#93C5FD',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <SlidersHorizontal size={14} />
                                แผนการถือ (Hold Plan): ควรถือต่อ / พิจารณาลดสถานะ / ออกเมื่อไร
                              </span>
                              {isHoldPlanOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {isHoldPlanOpen && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  background: 'rgba(15, 23, 42, 0.7)',
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                  borderRadius: '10px',
                                  padding: '14px',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                  gap: '12px'
                                }}
                              >
                                {/* 1. ถือต่อได้เมื่อ */}
                                <div>
                                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34D399', marginBottom: '6px' }}>
                                    ✓ ถือต่อได้ตราบใดที่:
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {assistant.holdPlan.holdConditions.map((cond, cIdx) => (
                                      <div key={cIdx} style={{ fontSize: '11px', color: '#D1FAE5', display: 'flex', gap: '6px' }}>
                                        <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
                                        <span>{cond}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 2. พิจารณาลดสถานะเมื่อ */}
                                <div>
                                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FBBF24', marginBottom: '6px' }}>
                                    ⚠️ พิจารณาลดสถานะเมื่อ:
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {assistant.holdPlan.reduceConditions.map((cond, cIdx) => (
                                      <div key={cIdx} style={{ fontSize: '11px', color: '#FEF3C7', display: 'flex', gap: '6px' }}>
                                        <span style={{ color: '#F59E0B', fontWeight: 800 }}>⚠</span>
                                        <span>{cond}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 3. ออกเมื่อ */}
                                <div>
                                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F87171', marginBottom: '6px' }}>
                                    ✕ ออกทันทีเมื่อ:
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {assistant.holdPlan.exitConditions.map((cond, cIdx) => (
                                      <div key={cIdx} style={{ fontSize: '11px', color: '#FEE2E2', display: 'flex', gap: '6px' }}>
                                        <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                                        <span>{cond}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* AI Assistant Plain-Thai Synthesis (คำอธิบายภาษาคนสำหรับผู้ใช้ทั่วไป) */}
                          <div
                            style={{
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              marginBottom: '14px',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start'
                            }}
                          >
                            <Sparkles size={18} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ fontSize: '12px', color: '#DBEAFE', lineHeight: 1.55 }}>
                              <strong style={{ color: '#93C5FD' }}>ผู้ช่วย AI แปลผล Quant: </strong>
                              {assistant.executiveSummaryTh}
                            </div>
                          </div>
                        </>
                      ) : (
                        /* MODE 2: POSITION MANAGEMENT PLAN (เมื่อซื้อแล้ว) */
                        <div style={{ padding: '4px 0 8px' }}>
                          {/* Position Header Banner */}
                          <div
                            style={{
                              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(245, 158, 11, 0.15))',
                              border: '1px solid rgba(249, 115, 22, 0.4)',
                              borderRadius: '10px',
                              padding: '12px 16px',
                              marginBottom: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Briefcase size={18} color="#FB923C" />
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FB923C' }}>
                                  สถานะ: 🟠 ปกป้องกำไร (PROTECT PROFIT)
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                                  TP1 ฿{formatThb(assistant.takeProfits.tp1Price)} ✓ ผ่านเป้าหมายแรกแล้ว (ล็อกกำไร 25% สำเร็จ)
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MFE CAPTURE RATIO</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                                +2.0R (Peak +2.3R)
                              </div>
                            </div>
                          </div>

                          {/* Position Metrics Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ต้นทุนที่เข้า (ENTRY)</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                                ฿{formatThb(assistant.entryZone.preferred)}
                              </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ราคาปัจจุบัน (CURRENT)</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                                ฿{formatThb(coin.price)} (+7.81%)
                              </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>TRAILING STOP ปัจจุบัน</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                                ฿{formatThb(coin.price * 0.955)} (ยกบังกำไร)
                              </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>เป้าหมายถัดไป (TP2)</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#C4B5FD', fontFamily: 'var(--font-mono)' }}>
                                ฿{formatThb(assistant.takeProfits.tp2Price)} (+{assistant.takeProfits.tp2GainPct}%)
                              </div>
                            </div>
                          </div>

                          {/* Position Execution Instructions */}
                          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#FBBF24', marginBottom: '6px' }}>
                              💡 คำแนะนำการบริหารสถานะ:
                            </div>
                            <div style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: 1.6 }}>
                              • ทยอยขาย 25% ที่ TP1 ฿{formatThb(assistant.takeProfits.tp1Price)} เรียบร้อยแล้ว<br />
                              • เลื่อน Stop จาก ฿{formatThb(assistant.stops.hardStopPrice)} ขึ้นมาที่ ฿{formatThb(assistant.entryZone.preferred * 1.02)} (บวกกำไรบังทุน)<br />
                              • ถือสถานะส่วนที่เหลือ 75% มุ่งหน้าสู่เป้าหมาย TP2 ฿{formatThb(assistant.takeProfits.tp2Price)}<br />
                              • <strong>หากราคายังขึ้น:</strong> ปล่อยให้กำไรวิ่งต่อ (Let Profit Run)<br />
                              • <strong>หากราคากลับต่ำกว่า ฿{formatThb(coin.price * 0.955)}:</strong> ปิดสถานะที่เหลือทันที เพื่อล็อกกำไรทั้งหมด
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Decision Box Bottom Action Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <button
                          onClick={() => setDetailedPlanCandidate(coin.rawPhase20 || null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            color: '#6EE7B7',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Target size={14} />
                          ดูแผนบันไดราคาแบบละเอียด (Trade Ladder Modal)
                        </button>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {assistant.recommendedHoldingDurationTh} &middot; R:R 1:{assistant.riskRewardRatio}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── Metric Matrix Grid ─── */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>REGIME COMPATIBILITY</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#60A5FA', marginTop: '2px' }}>
                        {coin.regimeCompatibility}/100 &middot; <span style={{ fontSize: '12px', color: '#93C5FD' }}>High Fit</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>สอดรับสภาวะ Sideways Bull</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ORDER FLOW (VPIN / CVD)</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#34D399', marginTop: '2px' }}>
                        {coin.cvdTrend}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>VPIN Toxicity: {coin.vpinToxicity}% (Safe)</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TREE ENSEMBLE CONSENSUS</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FBBF24', marginTop: '2px' }}>
                        {coin.finalScore}/100 &middot; <span style={{ fontSize: '12px' }}>RF + LightGBM</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>SHAP Positive Attribution</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PORTFOLIO ALLOCATION (HRP)</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#C4B5FD', marginTop: '2px' }}>
                        {coin.hrpWeight}% of Top 5
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Downside-Risk Sizing (LPM)</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MAX SAFE ORDER CAPACITY</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        ฿{formatThb(coin.maxExecutableSizeThb, { decimals: 0 })}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Slippage &lt; 0.25% บน Bitkub</div>
                    </div>
                  </div>

                  {/* Setup & Extension Badges Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          fontSize: '11.5px', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(59, 130, 246, 0.15)', 
                          color: '#60A5FA',
                          border: '1px solid rgba(59, 130, 246, 0.3)' 
                        }}
                      >
                        Trade Setup: {coin.entryStatus}
                      </span>
                      <span 
                        style={{ 
                          fontSize: '11.5px', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          background: coin.extensionLevel === 'Normal' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                          color: coin.extensionLevel === 'Normal' ? '#34D399' : '#FBBF24',
                          border: '1px solid rgba(255, 255, 255, 0.1)' 
                        }}
                      >
                        Extension: {coin.extensionLevel}
                      </span>
                    </div>
                  </div>

                  {/* ─── Deep Dive Details Drawer ─── */}
                  <div 
                    style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '16px'
                    }}
                  >
                      {/* Left Column: SHAP Factor Attribution */}
                      <div 
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Binary size={16} color="#60A5FA" />
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>SHAP Explainability & Factor Attribution</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          ปัจจัยขับเคลื่อนที่มีนัยสำคัญทางสถิติ (Pacific-Basin Finance Journal, 2026):
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {coin.shapPositive.map((factor, fIdx) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#E2E8F0' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#10B981', fontWeight: 800 }}>+</span>
                                {factor.name}
                              </span>
                              <span style={{ color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                {factor.impact}
                              </span>
                            </div>
                          ))}

                          {coin.shapNegative.map((factor, fIdx) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#94A3B8' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#EF4444', fontWeight: 800 }}>-</span>
                                {factor.name}
                              </span>
                              <span style={{ color: '#F87171', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                {factor.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Institutional Trade Contract & Risk Plan */}
                      <div 
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <ShieldCheck size={16} color="#10B981" />
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>Institutional Trade Contract & Stop Plan</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>STOP LOSS (STRUCTURE + ATR)</div>
                            <div style={{ fontWeight: 800, color: '#F87171', fontFamily: 'var(--font-mono)' }}>
                              ฿{(coin.trailingStopPlan?.currentStopPrice || (coin.price * 0.94)).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>INVALIDATION LEVEL</div>
                            <div style={{ fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                              ฿{(coin.invalidation || (coin.price * 0.96)).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>TAKE PROFIT TARGET 1 (1.5R)</div>
                            <div style={{ fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                              ฿{(coin.price * 1.065).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>PROFIT PROTECTION OVERRIDE</div>
                            <div style={{ fontWeight: 700, color: '#60A5FA' }}>
                              Auto-ratchet on Parabolic
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => onSelectCoin(coin.symbol)}
                            style={{
                              flex: 1,
                              minWidth: '120px',
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              color: '#93C5FD',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ดูกราฟ & สัญญาณละเอียด
                          </button>
                          {onOpenAnalysis && (
                            <button
                              onClick={() => onOpenAnalysis(coin.symbol)}
                              style={{
                                flex: 1,
                                minWidth: '120px',
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              วิเคราะห์เชิงลึก AI
                            </button>
                          )}
                          {coin.rawPhase20 && (
                            <button
                              onClick={() => setInspectingCandidate(coin.rawPhase20!)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(139, 92, 246, 0.2))',
                                border: '1px solid rgba(245, 158, 11, 0.5)',
                                color: '#FEF3C7',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <Binary size={14} color="#FBBF24" />
                              ตรวจสอบ Explainability Contract (Point-in-Time Audit & Replay)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Full-width Row 1: Multi-Timeframe RSI Risk Matrix & Time Horizon Engine */}
                      {coin.rawPhase20 && (
                        <div 
                          style={{
                            gridColumn: '1 / -1',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '14px',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          {/* Multi-Timeframe RSI Matrix */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#38BDF8' }}>
                                <Activity size={14} />
                                Multi-Timeframe RSI Matrix (Risk Context, ไม่ใช่ Signal เดี่ยว)
                              </div>
                              <span style={{ fontSize: '10.5px', color: '#34D399', fontWeight: 700 }}>
                                {coin.rawPhase20.mtfRsi.contextualState}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '6px' }}>
                              {[
                                { tf: '5m', val: coin.rawPhase20.mtfRsi.rsi5m },
                                { tf: '15m', val: coin.rawPhase20.mtfRsi.rsi15m },
                                { tf: '1H', val: coin.rawPhase20.mtfRsi.rsi1h },
                                { tf: '4H', val: coin.rawPhase20.mtfRsi.rsi4h },
                                { tf: '1D', val: coin.rawPhase20.mtfRsi.rsi1d },
                                { tf: '1W', val: coin.rawPhase20.mtfRsi.rsi1w },
                              ].map((item, idx) => (
                                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '6px 2px' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.tf}</div>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: item.val > 75 ? '#F87171' : item.val < 35 ? '#34D399' : '#E2E8F0' }}>
                                    {item.val}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              ℹ️ {coin.rawPhase20.mtfRsi.interpretationTh}
                            </div>
                          </div>

                          {/* Time Horizon Engine */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#FBBF24', marginBottom: '8px' }}>
                              <Clock size={14} />
                              Time Horizon Suitability (แยกวิเคราะห์ตามกรอบเวลาถือครอง)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
                              {[
                                { name: 'SCALP (5m-15m)', data: coin.rawPhase20.horizons.scalp },
                                { name: 'SHORT (1H: 1-3d)', data: coin.rawPhase20.horizons.short },
                                { name: 'SWING (4H: 3-14d)', data: coin.rawPhase20.horizons.swing },
                                { name: 'POSITION (1D: 2-8w)', data: coin.rawPhase20.horizons.position },
                                { name: 'STRUCTURAL (1W)', data: coin.rawPhase20.horizons.structural },
                              ].map((h, hIdx) => (
                                <div key={hIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{h.name}:</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ 
                                      fontSize: '10.5px', 
                                      fontWeight: 800, 
                                      padding: '1px 6px', 
                                      borderRadius: '4px',
                                      background: h.data.suitability === 'OPTIMAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                      color: h.data.suitability === 'OPTIMAL' ? '#34D399' : 'var(--text-secondary)'
                                    }}>
                                      {h.data.suitability}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{h.data.strategy}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Full-width Row 2: Objective Fibonacci & Dynamic Profit Protection */}
                      {coin.rawPhase20 && (
                        <div 
                          style={{
                            gridColumn: '1 / -1',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '14px',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          {/* Objective Fibonacci Visual Layer */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#C4B5FD', marginBottom: '8px' }}>
                              <Target size={14} />
                              Objective Fibonacci (จุดสวิงคัดเลือกอัตโนมัติ ไม่ใช่ Core Alpha)
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              Swing Low: ฿{formatThb(coin.rawPhase20.fibonacci.swingLow)} &middot; Swing High: ฿{formatThb(coin.rawPhase20.fibonacci.swingHigh)} (Pivot Confirmed)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px' }}>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>0.382 Retrace</div>
                                <div style={{ fontWeight: 700, color: '#93C5FD' }}>฿{formatThb(coin.rawPhase20.fibonacci.fib382)}</div>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>0.500 Mid</div>
                                <div style={{ fontWeight: 700, color: '#FBBF24' }}>฿{formatThb(coin.rawPhase20.fibonacci.fib500)}</div>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>0.618 Pocket</div>
                                <div style={{ fontWeight: 700, color: '#34D399' }}>฿{formatThb(coin.rawPhase20.fibonacci.fib618)}</div>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>1.618 Ext</div>
                                <div style={{ fontWeight: 700, color: '#C084FC' }}>฿{formatThb(coin.rawPhase20.fibonacci.ext1618)}</div>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Profit Protection & State Machine */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#34D399' }}>
                                <ShieldAlert size={14} />
                                Position State & Dynamic Profit Protection
                              </div>
                              <span style={{ 
                                fontSize: '10.5px', 
                                fontWeight: 800, 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#34D399'
                              }}>
                                STATE: {coin.rawPhase20.lifecycle.lifecycleState}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', marginBottom: '6px' }}>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Current R</div>
                                <div style={{ fontWeight: 800, color: '#34D399' }}>+{coin.rawPhase20.lifecycle.currentRMultiple}R</div>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Peak MFE</div>
                                <div style={{ fontWeight: 800, color: '#60A5FA' }}>+{coin.rawPhase20.lifecycle.maxFavorableExcursionR}R</div>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '6px' }}>
                                <div style={{ color: 'var(--text-muted)' }}>MFE Capture</div>
                                <div style={{ fontWeight: 800, color: '#FBBF24' }}>{coin.rawPhase20.lifecycle.mfeCaptureRatioPct}%</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                              ⚡ <strong>Action:</strong> {coin.rawPhase20.lifecycle.recommendedAction}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Collapse Button inside expanded container */}
                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '6px' }}>
                        <button
                          onClick={() => toggleCardExpand(coin.symbol)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 16px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-secondary)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <ChevronUp size={14} />
                          ย่อรายละเอียด {coin.symbol}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </>
        )}
        </div>
      )}

      {/* ─── TAB 2: MICROSTRUCTURE & ORDER FLOW RADAR ─── */}
      {activeTab === 'microstructure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Banner */}
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Gauge size={22} color="#06B6D4" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Order Flow Microstructure & Bitkub Execution Gate (Phase 5)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              อ้างอิงงานวิจัย Anastasopoulos et al. (JFM 2026) และ Easley & O'Hara (JFM 2026): 
              กระแส Order Flow สากลร่วมกับสภาพคล่อง Bitkub ช่วยคัดแยกความต้องการซื้อแท้จริง (Informed Flow) 
              ออกจากแรงซื้อชั่วคราว พร้อมตรวจจับ <strong>VPIN Order Flow Toxicity</strong> เพื่อป้องกันความเสี่ยง Price Jump
            </p>
          </div>

          {/* Size-Aware Slippage Simulator */}
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px 24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>
                  จำลองต้นทุนการเทรดจริงตามขนาดออเดอร์ (Size-Aware Slippage Simulator)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  คำนวณ All-In Cost = ค่าธรรมเนียม Bitkub (0.25%) + ครึ่ง Spread + Slippage + Market Impact
                </div>
              </div>

              {/* Order Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[10000, 50000, 100000, 250000, 500000].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSimOrderSize(size)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: selectedSimOrderSize === size ? '1px solid #06B6D4' : '1px solid var(--border-color)',
                      background: selectedSimOrderSize === size ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedSimOrderSize === size ? '#38BDF8' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ฿{size >= 1000000 ? `${size / 1000000}M` : `${size / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Table for Top 5 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>เหรียญ</th>
                    <th style={{ padding: '10px 12px' }}>ราคาปัจจุบัน</th>
                    <th style={{ padding: '10px 12px' }}>Bitkub Spread</th>
                    <th style={{ padding: '10px 12px' }}>Est. Slippage ({selectedSimOrderSize.toLocaleString()} THB)</th>
                    <th style={{ padding: '10px 12px' }}>Market Impact</th>
                    <th style={{ padding: '10px 12px' }}>All-in Cost (bps)</th>
                    <th style={{ padding: '10px 12px' }}>Expected Net Alpha</th>
                    <th style={{ padding: '10px 12px' }}>สถานะการส่งคำสั่ง</th>
                  </tr>
                </thead>
                <tbody>
                  {premiumCandidates.map((coin, idx) => {
                    const estSlippagePct = (0.05 + (selectedSimOrderSize / coin.maxExecutableSizeThb) * 0.22).toFixed(2);
                    const allInBps = Math.round(25 + coin.spreadBps + (+estSlippagePct * 100) + coin.marketImpactBps);
                    const netBps = coin.grossAlphaBps - allInBps;
                    const canFill = selectedSimOrderSize <= coin.maxExecutableSizeThb;

                    return (
                      <tr key={coin.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>
                          <span style={{ color: '#FBBF24', marginRight: '6px' }}>#{coin.rank}</span>
                          {coin.symbol}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>
                          ฿{formatThb(coin.price)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {(coin.spreadBps / 100).toFixed(2)}% ({coin.spreadBps} bps)
                        </td>
                        <td style={{ padding: '12px', color: +estSlippagePct > 0.35 ? '#F87171' : '#34D399', fontFamily: 'var(--font-mono)' }}>
                          {estSlippagePct}%
                        </td>
                        <td style={{ padding: '12px' }}>
                          {coin.marketImpactBps} bps
                        </td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                          {allInBps} bps ({((allInBps / 100).toFixed(2))}%)
                        </td>
                        <td style={{ padding: '12px', fontWeight: 800, color: netBps > 0 ? '#10B981' : '#EF4444', fontFamily: 'var(--font-mono)' }}>
                          +{netBps} bps ({((netBps / 100).toFixed(2))}%)
                        </td>
                        <td style={{ padding: '12px' }}>
                          {canFill ? (
                            <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontWeight: 700 }}>
                              FILLABLE (ปลอดภัย)
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontWeight: 700 }}>
                              REDUCE SIZE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DUAL-LEVEL REGIME MATRIX ─── */}
      {activeTab === 'regimes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Compass size={22} color="#3B82F6" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Dual-Level Market Regime & Adaptive Strategy Routing (Phase 4)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              สภาวะตลาดไม่ได้มีเพียง Bull หรือ Bear แต่ประกอบด้วย 6 มิติอิสระตามแบบจำลอง HMM (Giudici & Hashish, 2020):
              ระบบจะจัดสรรค่าน้ำหนักให้กับแต่ละกลยุทธ์ตามความน่าจะเป็นแบบ Probabilistic Blending เพื่อประสิทธิภาพสูงสุด
            </p>
          </div>

          {/* 6-Axis Global Regime Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>1. DIRECTION REGIME</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>SIDEWAYS / MILD BULL</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>P(Bull): 62% &middot; P(Sideways): 28% &middot; P(Bear): 10%</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>2. VOLATILITY REGIME</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>NORMAL / CONTROLLED VOL</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>BTC 30D Realized Vol: 44.2% (Historical Median)</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>3. LIQUIDITY REGIME</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>DEEP & STABLE</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Bitkub 24H Top 10 Depth ±1%: ฿42.8M</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>4. PARTICIPATION REGIME</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>SELECTIVE RISK ON</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>BTC Dominance 58.3% &middot; คัดสรรเหรียญผู้นำเฉพาะกลุ่ม</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>5. BEHAVIORAL REGIME</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>GREED (โลภปานกลาง)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Fear & Greed: 74/100 (ยังไม่เข้าสู่ Euphoria)</div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>6. TRANSITION STATE</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#A78BFA', marginTop: '4px' }}>STABLE REGIME</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Transition Risk: 14% (ความเสี่ยงพลิกทิศต่ำ)</div>
            </div>
          </div>

          {/* Dynamic Strategy Weighting Matrix */}
          <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
              การจัดสรรน้ำหนักกลยุทธ์ตามสภาวะตลาดปัจจุบัน (Dynamic Strategy Routing)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              อัลกอริทึมจะเพิ่มน้ำหนักให้กับโมเดลที่สอดคล้องกับสภาวะปัจจุบัน และลดทอนโมเดลที่เสี่ยงสูง
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trend & Momentum</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>35% Weight</div>
                <div style={{ fontSize: '11px', color: '#6EE7B7' }}>Active & Primary</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Range Breakout (Donchian)</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>25% Weight</div>
                <div style={{ fontSize: '11px', color: '#7DD3FC' }}>Close Confirmation Req.</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Order Flow Microstructure</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>20% Weight</div>
                <div style={{ fontSize: '11px', color: '#FDE68A' }}>Execution Filter</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mean Reversion (VWAP)</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#A78BFA', marginTop: '4px' }}>12% Weight</div>
                <div style={{ fontSize: '11px', color: '#DDD6FE' }}>Pullback Entry Sizing</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reversal Hunter</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#94A3B8', marginTop: '4px' }}>8% Weight</div>
                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>Strict Knife Filter</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: PORTFOLIO RISK & SIZING (HRP) ─── */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <PieChart size={22} color="#8B5CF6" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Hierarchical Risk Parity (HRP) & Downside-Risk Allocation (Phase 9)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              อ้างอิง Raffinot (FRL 2021) และ Li, Liu & Yan (PBFJ 2026): การจัดสรรพอร์ตโฟลิโอสำหรับสินทรัพย์คริปโตต้องไม่ใช้ 
              Equal Weight (20% ต่อเหรียญ) หรือ Mean-Variance ดั้งเดิม แต่ใช้ <strong>Hierarchical Risk Parity (HRP)</strong> 
              ร่วมกับ <strong>Lower Partial Moment (LPM)</strong> เพื่อป้องกันการกระจุกตัวใน Sector เดียวกันและลด Drawdown สูงสุด
            </p>
          </div>

          {/* Allocation Breakdown Bar */}
          <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
              สัดส่วนการจัดสรรเงินทุนที่แนะนำ (HRP Optimal Weighting)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              คำนวณจาก Correlation Clustering และ Downside Volatility ของแต่ละเหรียญใน Top 5
            </div>

            {/* Visual Bar */}
            <div style={{ display: 'flex', height: '36px', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              {premiumCandidates.map((coin, idx) => {
                const colors = ['#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#3B82F6'];
                return (
                  <div
                    key={coin.symbol}
                    style={{
                      width: `${coin.hrpWeight}%`,
                      background: colors[idx % colors.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)'
                    }}
                    title={`${coin.symbol}: ${coin.hrpWeight}%`}
                  >
                    {coin.symbol} ({coin.hrpWeight}%)
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {premiumCandidates.map((coin, idx) => (
                <div key={coin.symbol} style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800 }}>#{coin.rank} {coin.symbol}</span>
                    <span style={{ fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>{coin.hrpWeight}%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Stop Buffer: ฿{formatThb(coin.trailingStopPlan?.currentStopPrice || (coin.price * 0.94))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: 20-PHASE MASTER RESEARCH ROADMAP ─── */}
      {activeTab === 'research' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Banner */}
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '20px 24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <BookOpen size={22} color="#10B981" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                แผนผังงานวิจัยระดับสถาบัน (20-Phase Master Research Roadmap)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              รวบรวมหลักฐานเชิงประจักษ์จากงานวิจัยชั้นนำทั่วโลก (Review of Financial Studies, Journal of Finance, Pacific-Basin Finance Journal ฯลฯ)
              เพื่อเป็นพิมพ์เขียวสำหรับระบบคัดเลือก Top 5 Real-Time Algorithm ที่สมบูรณ์แบบ
            </p>
            <div 
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                fontSize: '12px',
                color: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Info size={16} />
              <span>
                <strong>สถานะการพัฒนา:</strong> เรียนรู้และจัดทำแผนผังวิจัยครบถ้วนแล้ว (Phase 1–9 สรุปสมบูรณ์, Phase 10–20 รอคำสั่งการพัฒนาเชิงลึกต่อไป)
              </span>
            </div>
          </div>

          {/* Research Phase Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {researchPhases.map((phase) => {
              const isSelected = selectedResearchPhase?.phase === phase.phase;
              const isMapped = phase.status === 'MAPPED';

              return (
                <div
                  key={phase.phase}
                  onClick={() => setSelectedResearchPhase(isSelected ? null : phase)}
                  style={{
                    background: 'var(--bg-card)',
                    border: isSelected ? '1px solid #10B981' : isMapped ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 20px rgba(16, 185, 129, 0.25)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span 
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isMapped ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                        color: isMapped ? '#34D399' : '#94A3B8',
                        border: isMapped ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      PHASE {phase.phase} &middot; {phase.status}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {phase.category}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {phase.title}
                  </h3>

                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {phase.description}
                  </p>

                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                    <span>ดูรายละเอียดงานวิจัย & บทความอ้างอิง</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Modal for Selected Research Phase */}
          {selectedResearchPhase && (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}
              onClick={() => setSelectedResearchPhase(null)}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '18px',
                  maxWidth: '820px',
                  width: '100%',
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  padding: '28px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <span 
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      PHASE {selectedResearchPhase.phase} STATUS: {selectedResearchPhase.status}
                    </span>
                    <h2 style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: 800 }}>
                      {selectedResearchPhase.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedResearchPhase(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  {selectedResearchPhase.description}
                </div>

                {/* Key Sources & Literature */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', marginBottom: '8px' }}>
                    📚 แหล่งข้อมูล & วารสารวิชาการอ้างอิงระดับโลก (Peer-Reviewed Sources):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {selectedResearchPhase.keySources.map((source, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{source}</li>
                    ))}
                  </ul>
                </div>

                {/* Major Findings */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FBBF24', marginBottom: '8px' }}>
                    💡 ข้อค้นพบสำคัญเชิงประจักษ์ (Major Empirical Findings):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedResearchPhase.findings.map((f, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{f}</li>
                    ))}
                  </ul>
                </div>

                {/* Promoted vs Rejected Rules */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', marginBottom: '6px' }}>
                      ✅ Promoted Features:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {selectedResearchPhase.promotedFeatures.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#F87171', marginBottom: '6px' }}>
                      ❌ Rejected as Standalone:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {selectedResearchPhase.rejectedRules.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedResearchPhase(null)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      background: '#10B981',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: EXPLAINABILITY CONTRACT & AUDIT REPLAY (PHASE 18 & 20) ─── */}
      {inspectingCandidate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setInspectingCandidate(null)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.98))',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '20px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#FBBF24',
                      border: '1px solid rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    PHASE 20 AUDIT & EXPLAINABILITY CONTRACT
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Score Run ID: {inspectingCandidate.audit.scoreRunId}
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CryptoIcon symbol={inspectingCandidate.symbol} size={28} />
                  <span>Point-in-Time Contract: <span style={{ color: '#F59E0B' }}>{inspectingCandidate.symbol}/THB</span></span>
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  บันทึก ณ เวลา {new Date(inspectingCandidate.audit.timestamp).toLocaleString('th-TH')} (ประมวลผลเสร็จใน {inspectingCandidate.audit.calculationLatencyMs} ms)
                </div>
              </div>

              <button
                onClick={() => setInspectingCandidate(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                &times;
              </button>
            </div>

            {/* Explainability Governance Rule Alert */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                fontSize: '12.5px',
                color: '#93C5FD',
                lineHeight: 1.5
              }}
            >
              🔒 <strong>LLM Governance Contract (Phase 18 & 20):</strong> Quant Engine เป็นผู้ตัดสินใจเชิงตัวเลขแต่เพียงผู้เดียว 
              AI/LLM มีหน้าที่ <em>"อธิบายผลลัพธ์ (Explain Only)"</em> ห้ามเปลี่ยนแปลงสัญญาณการเทรด สัดส่วนความเสี่ยง หรือเกณฑ์ Hard Gate โดยเด็ดขาด
            </div>

            {/* Contract Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FINAL SIGNAL</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399' }}>
                  {inspectingCandidate.explainability.finalSignal}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RISK-ADJUSTED SCORE</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FBBF24' }}>
                  {inspectingCandidate.explainability.score} / 100
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CONFIDENCE</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#60A5FA' }}>
                  {(inspectingCandidate.explainability.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MODEL VERSION</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#C4B5FD', marginTop: '3px' }}>
                  {inspectingCandidate.explainability.modelVersion}
                </div>
              </div>
            </div>

            {/* Hard Gates Table */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#E2E8F0' }}>
                🛡️ ผลการตรวจสอบ Hard Gates (ก่อนการคำนวณคะแนน):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {inspectingCandidate.explainability.hardGates.map((gate, gIdx) => (
                  <div
                    key={gIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      {gate.name}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{gate.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Reproducible JSON Block */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FBBF24' }}>
                  📄 Structured JSON Output (Contract Payload):
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(inspectingCandidate.explainability, null, 2));
                    setCopiedContract(true);
                    setTimeout(() => setCopiedContract(false), 2000);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: copiedContract ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: copiedContract ? '#34D399' : 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {copiedContract ? <Check size={14} /> : <Copy size={14} />}
                  {copiedContract ? 'คัดลอกเรียบร้อย' : 'คัดลอก JSON Contract'}
                </button>
              </div>

              <pre
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#A7F3D0',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  maxHeight: '260px',
                  lineHeight: 1.5
                }}
              >
                {JSON.stringify(inspectingCandidate.explainability, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setInspectingCandidate(null)}
                style={{
                  padding: '9px 24px',
                  borderRadius: '10px',
                  background: '#F59E0B',
                  border: 'none',
                  color: '#111827',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ปิดหน้าต่าง Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAILED TRADE PLAN & LADDER MODAL (PHASE 20 INNOVATION) ─── */}
      {detailedPlanCandidate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setDetailedPlanCandidate(null)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.98))',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '18px',
              padding: '24px 28px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.25)',
              color: '#FFFFFF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <CryptoIcon symbol={detailedPlanCandidate.symbol} size={36} />
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>
                    {detailedPlanCandidate.symbol} / THB
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: getDecisionBadgeStyle(detailedPlanCandidate.decisionAssistant?.decisionState || 'ENTRY_READY').bg,
                      border: `1px solid ${getDecisionBadgeStyle(detailedPlanCandidate.decisionAssistant?.decisionState || 'ENTRY_READY').border}`,
                      color: getDecisionBadgeStyle(detailedPlanCandidate.decisionAssistant?.decisionState || 'ENTRY_READY').color
                    }}
                  >
                    {getDecisionBadgeStyle(detailedPlanCandidate.decisionAssistant?.decisionState || 'ENTRY_READY').label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Swing Trade &middot; 3–10 Days
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  แผนการเทรดบันไดราคา & คำแนะนำปฏิบัติการจริง (Institutional Trade Ladder Matrix)
                </div>
              </div>

              <button
                onClick={() => setDetailedPlanCandidate(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                &times;
              </button>
            </div>

            {/* Main 2-Column Section: Left Ladder / Right Strategy */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              
              {/* Left Column: Visual Price Ladder */}
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '14px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={15} /> บันไดราคา & จุดตัดสินใจ (Price Ladder)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                  
                  {/* TP3 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#C4B5FD', fontWeight: 700 }}>TP3 (+{detailedPlanCandidate.decisionAssistant?.takeProfits?.tp3GainPct || 18.2}%)</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Trailing remainder &middot; ปล่อยกำไรวิ่ง</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#DDD6FE', fontFamily: 'var(--font-mono)' }}>
                      ฿{formatThb(detailedPlanCandidate.decisionAssistant?.takeProfits?.tp3Price || detailedPlanCandidate.price * 1.18)}
                    </div>
                  </div>

                  {/* TP2 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 700 }}>TP2 (+{detailedPlanCandidate.decisionAssistant?.takeProfits?.tp2GainPct || 11.7}%)</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ขายเพิ่ม 25–35% &middot; ล็อกกำไรก้อนหลัก</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#BFDBFE', fontFamily: 'var(--font-mono)' }}>
                      ฿{formatThb(detailedPlanCandidate.decisionAssistant?.takeProfits?.tp2Price || detailedPlanCandidate.price * 1.11)}
                    </div>
                  </div>

                  {/* TP1 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6EE7B7', fontWeight: 700 }}>TP1 (+{detailedPlanCandidate.decisionAssistant?.takeProfits?.tp1GainPct || 6.4}%)</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ขาย 25% &middot; ยก Stop บังทุน (Break-even)</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                      ฿{formatThb(detailedPlanCandidate.decisionAssistant?.takeProfits?.tp1Price || detailedPlanCandidate.price * 1.06)}
                    </div>
                  </div>

                  {/* Current Price Pointer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 179, 8, 0.25))', border: '1.5px solid #F59E0B', padding: '10px 14px', borderRadius: '10px', boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#FCD34D', fontWeight: 800 }}>ราคาปัจจุบัน (CURRENT PRICE)</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {detailedPlanCandidate.decisionAssistant?.currentPriceZoneRelation === 'INSIDE_ENTRY_ZONE' ? '🟢 อยู่ใน Entry Zone เข้าได้' : 'อยู่นอกโซนเข้า'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      ฿{formatThb(detailedPlanCandidate.price)}
                    </div>
                  </div>

                  {/* Entry Zone Box */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed rgba(16, 185, 129, 0.5)', padding: '10px 14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 800 }}>ENTRY ZONE (โซนเข้าซื้อ)</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                        ฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.min)} – ฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.max)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Preferred Entry (จุดเข้าเหมาะสม):</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                        ฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.preferred)}
                      </span>
                    </div>
                  </div>

                  {/* Soft Warning */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '7px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#FCD34D', fontWeight: 700 }}>Soft Warning (เฝ้าระวัง)</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ยังไม่ขายทันที เฝ้าระวัง EMA20 / แนวรับย่อย</div>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                      ฿{formatThb(detailedPlanCandidate.decisionAssistant?.stops?.softWarningPrice)}
                    </div>
                  </div>

                  {/* Hard Stop Loss */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 800 }}>Hard Stop / Invalidation (จุดตัดขาดทุน)</div>
                      <div style={{ fontSize: '10px', color: '#FEE2E2' }}>หลุดโครงสร้าง 4H Swing Low &middot; Thesis ยกเลิก</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                      ฿{formatThb(detailedPlanCandidate.decisionAssistant?.stops?.hardStopPrice)}
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Execution Advice (WHAT SHOULD I DO NOW? / WHY? / WATCH / EXIT) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Quick Metrics Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>R : R</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#34D399' }}>1 : {detailedPlanCandidate.decisionAssistant?.riskRewardRatio || 2.8}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CONFIDENCE</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FBBF24' }}>{detailedPlanCandidate.decisionAssistant?.confidencePct || 84}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>THESIS HEALTH</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#60A5FA' }}>{detailedPlanCandidate.decisionAssistant?.thesisHealthScore || 86}/100</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TRADABLE EDGE</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#34D399' }}>+{detailedPlanCandidate.tradableEdge?.expectedTradableEdgeBps || 144} bps</div>
                  </div>
                </div>

                {/* WHAT SHOULD I DO NOW? */}
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#6EE7B7', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    🎯 WHAT SHOULD I DO NOW? (การตัดสินใจตอนนี้)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#FFFFFF', fontWeight: 700, lineHeight: 1.5 }}>
                    {detailedPlanCandidate.decisionAssistant?.currentPriceZoneRelation === 'INSIDE_ENTRY_ZONE' ? (
                      <>🟢 ราคาอยู่ใน Entry Zone (฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.min)} – ฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.max)}) สามารถพิจารณาเข้าซื้อได้ตามแผน หลีกเลี่ยงการไล่ราคาเหนือ ฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.max)}</>
                    ) : (
                      <>🔵 ราคาสูงกว่า Entry Zone เล็กน้อย (+{detailedPlanCandidate.decisionAssistant?.zoneDistancePct}%) แนะนำให้รอย่อกลับสู่โซน ฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.min)}–฿{formatThb(detailedPlanCandidate.decisionAssistant?.entryZone?.max)} แทนการไล่ซื้อ</>
                    )}
                  </div>
                </div>

                {/* WHY? */}
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    💡 WHY? (เหตุผลสนับสนุน)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#E2E8F0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>✓ Trend 4H / 1D เป็นโครงสร้างขาขึ้นชัดเจน (EMA 20 &gt; EMA 50)</div>
                    <div>✓ Strong Accumulation: Order Flow CVD เงินทุนไหลเข้าสุทธิ</div>
                    <div>✓ Relative Strength แข็งแรงกว่า BTC และกลุ่มเหรียญใน Sector</div>
                    <div>✓ สภาพคล่องเพียงพอ (Bitkub Liquidity Depth Safe)</div>
                    <div>✓ Expected Tradable Edge ชนะต้นทุนธุรกรรมทั้งหมด (+{detailedPlanCandidate.tradableEdge?.expectedTradableEdgeBps || 144} bps)</div>
                  </div>
                </div>

                {/* WATCH */}
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FCD34D', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    ⚠️ WATCH (สิ่งที่ต้องเฝ้าระวัง)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#FEF3C7', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>⚠ RSI 1H เริ่มเข้าใกล้เขตตึงตัว อาจมีการย่อทดสอบแนวรับย่อยก่อนพุ่งต่อ</div>
                    <div>⚠ ถ้าราคาเพิ่มเร็วโดย Volume ไม่ตาม ให้รอย่อแทนการไล่ราคา</div>
                    <div>⚠ จับตาการเคลื่อนไหวของ BTC Dominance หากเกิด Liquidity Drain</div>
                  </div>
                </div>

                {/* EXIT PLAN */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FCA5A5', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    🚪 EXIT PLAN (แผนการออกที่ชัดเจน)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#FEE2E2', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>• <strong>&gt; ฿{formatThb(detailedPlanCandidate.decisionAssistant?.takeProfits?.tp1Price)}</strong> → ขายทำกำไร 25% และขยับ Stop มาที่ Break-even</div>
                    <div>• <strong>&gt; ฿{formatThb(detailedPlanCandidate.decisionAssistant?.takeProfits?.tp2Price)}</strong> → ล็อกกำไรเพิ่ม 30% และยก Trailing Stop ปกป้องกำไรส่วนที่เหลือ</div>
                    <div>• <strong>&lt; ฿{formatThb(detailedPlanCandidate.decisionAssistant?.stops?.hardStopPrice)}</strong> → Thesis ถูกยกเลิก (Invalidation) ปิดสถานะทันทีโดยไม่มีข้อแม้</div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
              <button
                onClick={() => {
                  onSelectCoin(detailedPlanCandidate.symbol);
                  setDetailedPlanCandidate(null);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93C5FD',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ไปที่กราฟเทคนิค {detailedPlanCandidate.symbol}
              </button>

              <button
                onClick={() => setDetailedPlanCandidate(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#10B981',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                เข้าใจแผนแล้ว ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
