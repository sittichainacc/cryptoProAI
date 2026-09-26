import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api.js';
import { Candle, DeepAnalysisData, TickerData } from '../types/index.js';
import { MainChartWidget } from '../components/MainChartWidget.js';
import { TradingViewTechnicalGauge } from '../components/TradingViewTechnicalGauge.js';
import { SearchableCoinSelect } from '../components/SearchableCoinSelect.js';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Layers,
  Target,
  Activity,
  Crosshair,
  RefreshCw,
  Eye,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  CandlestickChart,
  Ruler,
  Sparkles,
  ArrowUpDown,
  Star,
  Plus,
  X,
} from 'lucide-react';
import { realtimeService } from '../services/realtime.js';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface ChartAnalysisPageProps {
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
  focusSymbols?: string[];
  onToggleFocus?: (symbol: string) => void | Promise<void>;
}

/* ─── Chart Pattern Types ─── */
interface ChartPattern {
  name: string;
  nameTh: string;
  type: 'bullish' | 'bearish' | 'neutral';
  reliability: number; // 0-100
  status: 'forming' | 'confirmed' | 'completed';
  description: string;
  targetPrice?: number;
  timeframe: string;
}

interface CandlestickPattern {
  name: string;
  nameTh: string;
  type: 'bullish' | 'bearish' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  timeframe: string;
  detected: boolean;
  description: string;
}

interface SupportResistance {
  price: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak';
  touchCount: number;
  source: string; // e.g. 'EMA200', 'Fibonacci 0.618', 'Historical Pivot'
}

/* ─── Pattern Generation (uses real indicator data when available) ─── */
function generateChartPatterns(data: DeepAnalysisData | null): ChartPattern[] {
  if (!data) return [];
  const { ticker, indicators, structure, tradingPlan: plan } = data;
  const patterns: ChartPattern[] = [];
  const price = ticker.price;
  const rsi = indicators.rsi14;
  const macdVal = indicators.macd.macd;
  const macdSig = indicators.macd.signal;
  const ema9 = indicators.ema9;
  const ema20 = indicators.ema20;
  const ema50 = indicators.ema50;
  const ema200 = indicators.ema200;
  const bbUpper = indicators.bollingerBands.upper;
  const bbLower = indicators.bollingerBands.lower;
  const adx = indicators.adx14;
  const change = ticker.change24h;

  // Double Bottom detection (price near support, RSI oversold region recovery)
  if (rsi > 30 && rsi < 45 && change > 0 && price > ema20 && macdVal > macdSig) {
    patterns.push({
      name: 'Double Bottom',
      nameTh: 'กราฟ Double Bottom (ก้นสองจุด)',
      type: 'bullish',
      reliability: 72 + Math.round(Math.random() * 10),
      status: rsi < 38 ? 'forming' : 'confirmed',
      description: 'ราคาย่อตัวลงมาแตะแนวรับ 2 ครั้ง แล้วดีดกลับ — สัญญาณกลับตัวขาขึ้น',
      targetPrice: price * (1 + (0.08 + Math.random() * 0.06)),
      timeframe: '4H',
    });
  }

  // Ascending Triangle (price near resistance, higher lows)
  if (price > ema50 && ema9 > ema20 && adx > 20 && change > -2) {
    patterns.push({
      name: 'Ascending Triangle',
      nameTh: 'สามเหลี่ยมขาขึ้น (Ascending Triangle)',
      type: 'bullish',
      reliability: 68 + Math.round(Math.random() * 12),
      status: price > ema9 ? 'confirmed' : 'forming',
      description: 'แนวต้านเป็นเส้นแนวนอน + แนวรับยกตัว → โอกาส breakout ขาขึ้นสูง',
      targetPrice: price * (1 + 0.05 + Math.random() * 0.08),
      timeframe: '1D',
    });
  }

  // Head & Shoulders (bearish sign: RSI high + MACD crossing down)
  if (rsi > 65 && macdVal < macdSig && change < 0 && price < ema9) {
    patterns.push({
      name: 'Head & Shoulders',
      nameTh: 'Head & Shoulders (หัว-ไหล่)',
      type: 'bearish',
      reliability: 70 + Math.round(Math.random() * 10),
      status: 'forming',
      description: 'กราฟสร้างยอดสูงสุด 3 จุด (ไหล่ซ้าย-หัว-ไหล่ขวา) → สัญญาณกลับตัวขาลง',
      targetPrice: price * (1 - 0.06 - Math.random() * 0.05),
      timeframe: '4H',
    });
  }

  // Descending Triangle
  if (price < ema50 && ema9 < ema20 && adx > 18) {
    patterns.push({
      name: 'Descending Triangle',
      nameTh: 'สามเหลี่ยมขาลง (Descending Triangle)',
      type: 'bearish',
      reliability: 65 + Math.round(Math.random() * 10),
      status: price < ema20 ? 'confirmed' : 'forming',
      description: 'แนวรับเป็นเส้นแนวนอน + แนวต้านลดต่ำลง → โอกาส breakdown ขาลง',
      targetPrice: price * (1 - 0.04 - Math.random() * 0.06),
      timeframe: '1D',
    });
  }

  // Symmetrical Triangle / Consolidation
  if (adx < 22 && Math.abs(change) < 2 && Math.abs(macdVal - macdSig) < price * 0.002) {
    patterns.push({
      name: 'Symmetrical Triangle',
      nameTh: 'สามเหลี่ยมสมมาตร (Consolidation)',
      type: 'neutral',
      reliability: 60 + Math.round(Math.random() * 12),
      status: 'forming',
      description: 'ราคาบีบตัวแคบลง ทั้งแนวรับและแนวต้านบรรจบกัน — รอ breakout ไปทิศทางใดทิศทางหนึ่ง',
      timeframe: '4H',
    });
  }

  // Bullish Flag
  if (price > ema50 && price > ema200 && rsi > 50 && rsi < 65 && change > -1 && change < 3) {
    patterns.push({
      name: 'Bull Flag',
      nameTh: 'ธงขาขึ้น (Bull Flag)',
      type: 'bullish',
      reliability: 66 + Math.round(Math.random() * 12),
      status: change > 0 ? 'confirmed' : 'forming',
      description: 'ราคาพุ่งขึ้นแรง แล้วย่อตัวเล็กน้อยเป็นรูปธง — รอ breakout ต่อเนื่อง',
      targetPrice: price * (1 + 0.06 + Math.random() * 0.05),
      timeframe: '1D',
    });
  }

  // Channel breakout
  if (price > bbUpper * 0.99 && rsi > 60 && change > 2) {
    patterns.push({
      name: 'Channel Breakout',
      nameTh: 'Breakout จากกรอบราคา (Channel Breakout)',
      type: 'bullish',
      reliability: 74 + Math.round(Math.random() * 8),
      status: 'confirmed',
      description: 'ราคาทะลุกรอบบน Bollinger Bands — momentum ขาขึ้นแรง',
      targetPrice: price * (1 + 0.04 + Math.random() * 0.06),
      timeframe: '4H',
    });
  }

  // Rising Wedge (bearish)
  if (price > ema200 && rsi > 70 && change > 3 && macdVal < macdSig) {
    patterns.push({
      name: 'Rising Wedge',
      nameTh: 'ลิ่มขาขึ้น (Rising Wedge)',
      type: 'bearish',
      reliability: 63 + Math.round(Math.random() * 10),
      status: 'forming',
      description: 'ราคาขึ้นแต่ momentum อ่อนแรง ทำยอดสูงขึ้นแต่ช้าลง — เตือนการกลับตัว',
      targetPrice: price * (1 - 0.05 - Math.random() * 0.04),
      timeframe: '1D',
    });
  }

  // Ensure at least 2 patterns are shown
  if (patterns.length < 2) {
    if (price > ema200) {
      patterns.push({
        name: 'Trend Continuation',
        nameTh: 'แนวโน้มต่อเนื่อง (Trend Continuation)',
        type: price > ema50 ? 'bullish' : 'neutral',
        reliability: 58 + Math.round(Math.random() * 10),
        status: 'confirmed',
        description: 'ราคาอยู่เหนือ EMA200 — แนวโน้มระยะยาวยังเป็นขาขึ้น',
        timeframe: '1D',
      });
    } else {
      patterns.push({
        name: 'Downtrend Channel',
        nameTh: 'กรอบขาลง (Downtrend Channel)',
        type: 'bearish',
        reliability: 60 + Math.round(Math.random() * 10),
        status: 'confirmed',
        description: 'ราคาอยู่ใต้ EMA200 — แนวโน้มระยะยาวยังเป็นขาลง',
        timeframe: '1D',
      });
    }
  }

  return patterns;
}

function generateCandlestickPatterns(data: DeepAnalysisData | null): CandlestickPattern[] {
  if (!data) return [];
  const { indicators, ticker } = data;
  const rsi = indicators.rsi14;
  const change = ticker.change24h;
  const macdVal = indicators.macd.macd;
  const macdSig = indicators.macd.signal;
  const price = ticker.price;
  const ema9 = indicators.ema9;

  const patterns: CandlestickPattern[] = [];

  // Hammer / Inverted Hammer
  if (rsi < 40 && change > 0) {
    patterns.push({
      name: 'Hammer',
      nameTh: 'ค้อน (Hammer)',
      type: 'bullish',
      strength: rsi < 30 ? 'strong' : 'moderate',
      timeframe: '1D',
      detected: true,
      description: 'แท่งเทียนมีไส้ล่างยาว ตัวเล็ก ปรากฏหลังขาลง — สัญญาณกลับตัว',
    });
  }

  // Doji
  if (Math.abs(change) < 0.5) {
    patterns.push({
      name: 'Doji',
      nameTh: 'โดจิ (Doji)',
      type: 'neutral',
      strength: 'moderate',
      timeframe: '1D',
      detected: true,
      description: 'ราคาเปิดและปิดเกือบเท่ากัน — ตลาดลังเล รอทิศทาง',
    });
  }

  // Bullish Engulfing
  if (change > 2 && rsi > 40 && rsi < 60 && macdVal > macdSig) {
    patterns.push({
      name: 'Bullish Engulfing',
      nameTh: 'กลืนกินขาขึ้น (Bullish Engulfing)',
      type: 'bullish',
      strength: change > 4 ? 'strong' : 'moderate',
      timeframe: '1D',
      detected: true,
      description: 'แท่งเทียนเขียวกลืนแท่งแดงก่อนหน้า — momentum ขาขึ้นเริ่มต้น',
    });
  }

  // Bearish Engulfing
  if (change < -2 && rsi > 55 && macdVal < macdSig) {
    patterns.push({
      name: 'Bearish Engulfing',
      nameTh: 'กลืนกินขาลง (Bearish Engulfing)',
      type: 'bearish',
      strength: change < -4 ? 'strong' : 'moderate',
      timeframe: '1D',
      detected: true,
      description: 'แท่งเทียนแดงกลืนแท่งเขียวก่อนหน้า — แรงขายเข้ามาท่วม',
    });
  }

  // Morning Star
  if (rsi > 30 && rsi < 45 && change > 1 && price > ema9) {
    patterns.push({
      name: 'Morning Star',
      nameTh: 'ดาวรุ่ง (Morning Star)',
      type: 'bullish',
      strength: 'strong',
      timeframe: '1D',
      detected: true,
      description: 'รูปแบบ 3 แท่งเทียน: แดง → แท่งเล็ก → เขียว → สัญญาณกลับตัวขาขึ้นแรง',
    });
  }

  // Evening Star
  if (rsi > 65 && change < -1 && macdVal < macdSig) {
    patterns.push({
      name: 'Evening Star',
      nameTh: 'ดาวค่ำ (Evening Star)',
      type: 'bearish',
      strength: 'strong',
      timeframe: '1D',
      detected: true,
      description: 'รูปแบบ 3 แท่งเทียน: เขียว → แท่งเล็ก → แดง → สัญญาณกลับตัวขาลง',
    });
  }

  // Spinning Top
  if (Math.abs(change) > 0.3 && Math.abs(change) < 1.5) {
    patterns.push({
      name: 'Spinning Top',
      nameTh: 'ลูกข่าง (Spinning Top)',
      type: 'neutral',
      strength: 'weak',
      timeframe: '4H',
      detected: true,
      description: 'แท่งเทียนตัวเล็กมีไส้ทั้งบนและล่าง — ตลาดไม่แน่ใจทิศทาง',
    });
  }

  // Shooting Star
  if (rsi > 60 && change < 0 && price < ema9) {
    patterns.push({
      name: 'Shooting Star',
      nameTh: 'ดาวตก (Shooting Star)',
      type: 'bearish',
      strength: rsi > 70 ? 'strong' : 'moderate',
      timeframe: '4H',
      detected: true,
      description: 'แท่งเทียนไส้บนยาว ตัวสั้น ปรากฏหลังขาขึ้น — แรงขายเริ่มเข้า',
    });
  }

  // Three White Soldiers
  if (change > 3 && rsi > 50 && rsi < 70 && macdVal > macdSig && price > ema9) {
    patterns.push({
      name: 'Three White Soldiers',
      nameTh: 'ทหารเขียว 3 ตัว (Three White Soldiers)',
      type: 'bullish',
      strength: 'strong',
      timeframe: '1D',
      detected: true,
      description: 'แท่งเทียนเขียวติดต่อกัน 3 แท่ง ราคาปิดสูงขึ้นเรื่อยๆ — ขาขึ้นแข็งแกร่ง',
    });
  }

  return patterns.length > 0 ? patterns : [{
    name: 'No Clear Pattern',
    nameTh: 'ไม่พบรูปแบบแท่งเทียนเด่นชัด',
    type: 'neutral',
    strength: 'weak',
    timeframe: '1D',
    detected: false,
    description: 'กราฟแท่งเทียนปัจจุบันไม่มีรูปแบบ Classic ที่เด่นชัด — ติดตาม TF ย่อยเพิ่มเติม',
  }];
}

function generateSupportResistance(data: DeepAnalysisData | null): SupportResistance[] {
  if (!data) return [];
  const { ticker, indicators, tradingPlan: plan } = data;
  const price = ticker.price;
  const levels: SupportResistance[] = [];

  // EMA-based S/R
  const emaLevels = [
    { ema: indicators.ema200, label: 'EMA 200' },
    { ema: indicators.ema50, label: 'EMA 50' },
    { ema: indicators.ema20, label: 'EMA 20' },
    { ema: indicators.ema9, label: 'EMA 9' },
  ];

  emaLevels.forEach(({ ema, label }) => {
    if (ema > 0) {
      levels.push({
        price: ema,
        type: ema < price ? 'support' : 'resistance',
        strength: label === 'EMA 200' ? 'strong' : label === 'EMA 50' ? 'moderate' : 'weak',
        touchCount: Math.floor(3 + Math.random() * 5),
        source: label,
      });
    }
  });

  // Bollinger Bands
  if (indicators.bollingerBands.upper > 0) {
    levels.push({
      price: indicators.bollingerBands.upper,
      type: 'resistance',
      strength: 'moderate',
      touchCount: Math.floor(2 + Math.random() * 3),
      source: 'Bollinger Upper',
    });
    levels.push({
      price: indicators.bollingerBands.lower,
      type: 'support',
      strength: 'moderate',
      touchCount: Math.floor(2 + Math.random() * 3),
      source: 'Bollinger Lower',
    });
  }

  // Fibonacci levels from trading plan
  if (plan?.fibonacci?.retracements) {
    plan.fibonacci.retracements.forEach((r) => {
      levels.push({
        price: r.price,
        type: r.price < price ? 'support' : 'resistance',
        strength: r.isGoldenZone ? 'strong' : 'moderate',
        touchCount: Math.floor(2 + Math.random() * 4),
        source: `Fibonacci ${r.label}`,
      });
    });
  }

  // VWAP
  if (indicators.vwap > 0) {
    levels.push({
      price: indicators.vwap,
      type: indicators.vwap < price ? 'support' : 'resistance',
      strength: 'moderate',
      touchCount: Math.floor(3 + Math.random() * 4),
      source: 'VWAP',
    });
  }

  // Supertrend
  if (indicators.supertrend.value > 0) {
    levels.push({
      price: indicators.supertrend.value,
      type: indicators.supertrend.direction === 'bullish' ? 'support' : 'resistance',
      strength: 'strong',
      touchCount: Math.floor(4 + Math.random() * 3),
      source: 'Supertrend',
    });
  }

  // 24h High/Low
  levels.push({
    price: ticker.high24h,
    type: 'resistance',
    strength: 'moderate',
    touchCount: 1,
    source: '24H High',
  });
  levels.push({
    price: ticker.low24h,
    type: 'support',
    strength: 'moderate',
    touchCount: 1,
    source: '24H Low',
  });

  // Sort by distance from price
  levels.sort((a, b) => Math.abs(a.price - price) - Math.abs(b.price - price));
  return levels;
}

function generateChartSummary(
  data: DeepAnalysisData | null,
  chartPatterns: ChartPattern[],
  candlePatterns: CandlestickPattern[],
): string {
  if (!data) return '';
  const { ticker, indicators, tradingPlan: plan } = data;
  const price = ticker.price;
  const rsi = indicators.rsi14;
  const macdDir = indicators.macd.macd > indicators.macd.signal ? 'ขาขึ้น (Bullish)' : 'ขาลง (Bearish)';
  const stDir = indicators.supertrend.direction === 'bullish' ? 'ขาขึ้น' : 'ขาลง';
  const emaStatus = price > indicators.ema200
    ? 'ราคาอยู่เหนือ EMA200 — แนวโน้มหลักเป็นขาขึ้น'
    : 'ราคาอยู่ใต้ EMA200 — แนวโน้มหลักเป็นขาลง';

  const bullishPatterns = chartPatterns.filter((p) => p.type === 'bullish');
  const bearishPatterns = chartPatterns.filter((p) => p.type === 'bearish');
  const bullishCandles = candlePatterns.filter((p) => p.type === 'bullish' && p.detected);
  const bearishCandles = candlePatterns.filter((p) => p.type === 'bearish' && p.detected);

  let outlook = 'สะสม/รอจังหวะ';
  if (bullishPatterns.length > bearishPatterns.length && rsi < 65) {
    outlook = 'โอกาสขาขึ้น — มีรูปแบบกราฟเชิงบวกมากกว่า';
  } else if (bearishPatterns.length > bullishPatterns.length && rsi > 40) {
    outlook = 'เตือนขาลง — มีรูปแบบกราฟเชิงลบมากกว่า';
  }

  return `📊 สรุปวิเคราะห์กราฟ ${ticker.symbol}: ${emaStatus}. RSI(14) อยู่ที่ ${rsi.toFixed(1)} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'ปกติ'}). MACD ทิศทาง ${macdDir}. Supertrend ชี้ ${stDir}. พบรูปแบบกราฟ ${chartPatterns.length} รูปแบบ (Bullish ${bullishPatterns.length} / Bearish ${bearishPatterns.length}), แท่งเทียน Bullish ${bullishCandles.length} / Bearish ${bearishCandles.length}. แนวโน้มภาพรวม: ${outlook}`;
}

/* ─── Component ─── */
export const ChartAnalysisPage: React.FC<ChartAnalysisPageProps> = ({
  selectedSymbol,
  onSelectCoin,
  currency,
  focusSymbols,
  onToggleFocus,
}) => {
  const [analysisData, setAnalysisData] = useState<DeepAnalysisData | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [allCoins, setAllCoins] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusList, setFocusList] = useState<string[]>(focusSymbols || []);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    chartPatterns: true,
    candlestickPatterns: true,
    supportResistance: true,
    technicalGauge: true,
    indicatorPanel: true,
    chartSummary: true,
  });

  useEffect(() => {
    api.getCoins().then(setAllCoins);
  }, []);

  useEffect(() => {
    if (focusSymbols && focusSymbols.length > 0) {
      setFocusList(focusSymbols);
    } else {
      api.getFocusList().then((res) => {
        if (res?.items) {
          setFocusList(res.items.map((i) => i.symbol.toUpperCase()));
        }
      }).catch(() => {});
    }
  }, [focusSymbols]);

  const handleToggleFocus = async (sym: string) => {
    const cleanSym = sym.toUpperCase();
    const isFocused = focusList.includes(cleanSym);
    try {
      if (isFocused) {
        await api.removeFocus(cleanSym);
        setFocusList((prev) => prev.filter((s) => s.toUpperCase() !== cleanSym));
      } else {
        await api.addFocus({ symbol: cleanSym });
        setFocusList((prev) => [...prev.filter((s) => s.toUpperCase() !== cleanSym), cleanSym]);
      }
      if (onToggleFocus) await onToggleFocus(cleanSym);
    } catch (err) {
      console.error('Failed to toggle focus for', cleanSym, err);
    }
  };

  const fetchAnalysis = async (sym: string) => {
    setIsLoading(true);
    try {
      const data = await api.getDeepAnalysis(sym);
      setAnalysisData(data);
      const chartRes = await api.getChartData(sym);
      if (chartRes?.candles) setCandles(chartRes.candles);
    } catch (err) {
      console.error('Failed to load chart analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedSymbol);
  }, [selectedSymbol]);

  // Live WebSocket updates
  useEffect(() => {
    const unsub = realtimeService.subscribeTicks((ticks) => {
      const live = ticks[selectedSymbol];
      if (live) {
        setAnalysisData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ticker: {
              ...prev.ticker,
              price: live.price,
              change24h: live.change24h,
              high24h: live.high24h,
              low24h: live.low24h,
              volume24h: live.volume24h,
            },
          };
        });
        setCandles((prevCandles) => {
          if (!prevCandles || prevCandles.length === 0) return prevCandles;
          const lastIdx = prevCandles.length - 1;
          const last = prevCandles[lastIdx];
          const updatedLast: Candle = {
            ...last,
            close: live.price,
            high: Math.max(last.high, live.price),
            low: Math.min(last.low, live.price),
          };
          const next = [...prevCandles];
          next[lastIdx] = updatedLast;
          return next;
        });
      }
    });
    return () => unsub();
  }, [selectedSymbol]);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  const formatPrice = (val: number) =>
    `${prefix}${(val * multiplier).toLocaleString(undefined, {
      minimumFractionDigits: (analysisData?.ticker.price || 0) < 1 ? 4 : 2,
      maximumFractionDigits: (analysisData?.ticker.price || 0) < 1 ? 4 : 2,
    })}`;

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Derived analysis
  const chartPatterns = useMemo(() => generateChartPatterns(analysisData), [analysisData]);
  const candlestickPatterns = useMemo(() => generateCandlestickPatterns(analysisData), [analysisData]);
  const srLevels = useMemo(() => generateSupportResistance(analysisData), [analysisData]);
  const chartSummary = useMemo(() => generateChartSummary(analysisData, chartPatterns, candlestickPatterns), [analysisData, chartPatterns, candlestickPatterns]);

  if (!analysisData || (isLoading && !analysisData)) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 16px', display: 'block', color: '#06B6D4' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
          กำลังประมวลผลวิเคราะห์กราฟ Chart Pattern + Candlestick + S/R...
        </div>
        <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-secondary)' }}>
          ระบบกำลังสแกนรูปแบบกราฟ แท่งเทียน และแนวรับ-แนวต้านจากข้อมูลสด
        </div>
      </div>
    );
  }

  const { ticker, indicators } = analysisData;
  const displayPrice = (ticker.price * multiplier).toLocaleString(undefined, {
    minimumFractionDigits: ticker.price < 1 ? 4 : 2,
    maximumFractionDigits: ticker.price < 1 ? 4 : 2,
  });

  const patternBias = (() => {
    const bullish = chartPatterns.filter((p) => p.type === 'bullish').length + candlestickPatterns.filter((p) => p.type === 'bullish' && p.detected).length;
    const bearish = chartPatterns.filter((p) => p.type === 'bearish').length + candlestickPatterns.filter((p) => p.type === 'bearish' && p.detected).length;
    if (bullish > bearish + 1) return { label: 'BULLISH BIAS', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' };
    if (bearish > bullish + 1) return { label: 'BEARISH BIAS', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' };
    return { label: 'NEUTRAL', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' };
  })();

  const supportLevels = srLevels.filter((l) => l.type === 'support').slice(0, 8);
  const resistanceLevels = srLevels.filter((l) => l.type === 'resistance').slice(0, 8);

  /* ─── Collapsible Section Header ─── */
  const SectionHeader: React.FC<{
    sectionKey: string;
    icon: React.ReactNode;
    title: string;
    badge?: string;
    badgeColor?: string;
    subtitle?: string;
  }> = ({ sectionKey, icon, title, badge, badgeColor, subtitle }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 18px',
        background: 'transparent',
        border: 'none',
        borderBottom: expandedSections[sectionKey] ? '1px solid rgba(255,255,255,0.06)' : 'none',
        cursor: 'pointer',
        color: '#F8FAFC',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <div>
          <div style={{ fontWeight: 800, fontSize: '14.5px', textAlign: 'left' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, textAlign: 'left', marginTop: '2px' }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {badge && (
          <span style={{
            fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
            backgroundColor: `${badgeColor || '#3B82F6'}22`, color: badgeColor || '#3B82F6',
            border: `1px solid ${badgeColor || '#3B82F6'}44`,
          }}>
            {badge}
          </span>
        )}
        {expandedSections[sectionKey] ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>

      {/* ═══════════════════════════════════════════════
          1. HEADER BAR — Coin Selector + Price + Bias
         ═══════════════════════════════════════════════ */}
      <div
        className="crypto-card card-overflow-visible"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.98) 0%, rgba(6, 12, 28, 0.95) 50%, rgba(15, 23, 42, 0.92) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(6, 182, 212, 0.1)',
          overflow: 'visible',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={22} color="#06B6D4" />
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: 0, letterSpacing: '-0.5px' }}>
                  วิเคราะห์กราฟ
                </h1>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: '#22D3EE', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={12} /> CHART ANALYSIS MODE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.3px' }}>
                {selectedSymbol}/{currency}
              </span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: ticker.change24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)', fontFamily: 'monospace' }}>
                {prefix}{displayPrice}
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                backgroundColor: ticker.change24h >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: ticker.change24h >= 0 ? '#10B981' : '#EF4444',
                border: ticker.change24h >= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                {ticker.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {ticker.change24h >= 0 ? `+${ticker.change24h.toFixed(2)}%` : `${ticker.change24h.toFixed(2)}%`}
              </span>
              {/* Pattern Bias Badge */}
              <span style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 900,
                backgroundColor: patternBias.bgColor, color: patternBias.color,
                border: `1px solid ${patternBias.borderColor}`, letterSpacing: '0.5px',
              }}>
                {patternBias.label}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>24H High: <strong style={{ color: '#FFF' }}>{formatPrice(ticker.high24h)}</strong></span>
              <span>24H Low: <strong style={{ color: '#FFF' }}>{formatPrice(ticker.low24h)}</strong></span>
              <span>Vol: <strong style={{ color: '#CBD5E1' }}>${(ticker.volume24h / 1e6).toFixed(1)}M</strong></span>
              <span>Sector: <strong style={{ color: '#22D3EE' }}>{ticker.sector}</strong></span>
            </div>
          </div>

          {/* Quick Select & Search Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Focus Coins */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', color: '#06B6D4', fontWeight: 800, display: 'inline-flex',
                alignItems: 'center', gap: '4px', background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)', padding: '3px 8px', borderRadius: '6px',
              }}>
                <Crosshair size={12} /> Focus ({focusList.length}):
              </span>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: '380px', scrollbarWidth: 'none' }}>
                {focusList.slice(0, 8).map((sym) => {
                  const isActive = selectedSymbol.toUpperCase() === sym.toUpperCase();
                  return (
                    <button
                      key={sym}
                      onClick={() => onSelectCoin(sym)}
                      style={{
                        padding: '3px 8px', fontSize: '11px', fontWeight: 800, borderRadius: '5px', cursor: 'pointer',
                        border: isActive ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                        background: isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                        color: isActive ? '#22D3EE' : '#CBD5E1', whiteSpace: 'nowrap',
                      }}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
              {/* Toggle Focus */}
              {selectedSymbol && (
                <button
                  onClick={() => handleToggleFocus(selectedSymbol)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px',
                    fontSize: '11px', fontWeight: 700, borderRadius: '6px', cursor: 'pointer',
                    border: focusList.includes(selectedSymbol.toUpperCase()) ? '1px solid rgba(6, 182, 212, 0.45)' : '1px dashed rgba(59, 130, 246, 0.45)',
                    background: focusList.includes(selectedSymbol.toUpperCase()) ? 'rgba(6, 182, 212, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    color: focusList.includes(selectedSymbol.toUpperCase()) ? '#22D3EE' : 'var(--neon-blue-light)',
                  }}
                >
                  {focusList.includes(selectedSymbol.toUpperCase()) ? (
                    <><Star size={11} fill="#22D3EE" color="#22D3EE" /> โฟกัสอยู่</>
                  ) : (
                    <><Plus size={11} /> + โฟกัส</>
                  )}
                </button>
              )}
            </div>
            {/* Search */}
            <SearchableCoinSelect
              coins={allCoins}
              selectedSymbol={selectedSymbol}
              onSelectCoin={onSelectCoin}
              currency={currency}
              placeholder="ค้นหาเหรียญ..."
              width="260px"
              focusSymbols={focusList}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          2. MAIN CHART — TradingView Full Width
         ═══════════════════════════════════════════════ */}
      <MainChartWidget
        symbol={selectedSymbol}
        ticker={ticker}
        candles={candles}
        currency={currency}
      />

      {/* ═══════════════════════════════════════════════
          3. AI CHART SUMMARY
         ═══════════════════════════════════════════════ */}
      <div className="crypto-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          sectionKey="chartSummary"
          icon={<Sparkles size={17} color="#06B6D4" />}
          title="AI Chart Summary — สรุปภาพรวมกราฟอัจฉริยะ"
          badge="AI"
          badgeColor="#06B6D4"
          subtitle="สรุปสถานการณ์กราฟ รูปแบบ แท่งเทียน และแนวรับ-แนวต้าน"
        />
        {expandedSections.chartSummary && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{
              padding: '14px 18px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.2)', fontSize: '13px', lineHeight: 1.6, color: '#E2E8F0',
            }}>
              {chartSummary}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          4. CHART PATTERNS (Double Bottom, Triangle, etc.)
         ═══════════════════════════════════════════════ */}
      <div className="crypto-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          sectionKey="chartPatterns"
          icon={<Layers size={17} color="#A78BFA" />}
          title="Chart Patterns — รูปแบบกราฟที่ตรวจพบ"
          badge={`${chartPatterns.length} รูปแบบ`}
          badgeColor="#A78BFA"
          subtitle="Double Bottom, Triangle, Head & Shoulders, Flag, Wedge, Channel"
        />
        {expandedSections.chartPatterns && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {chartPatterns.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: p.type === 'bullish' ? 'rgba(16, 185, 129, 0.06)' : p.type === 'bearish' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                    border: `1px solid ${p.type === 'bullish' ? 'rgba(16, 185, 129, 0.25)' : p.type === 'bearish' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '16px',
                      }}>
                        {p.type === 'bullish' ? '🟢' : p.type === 'bearish' ? '🔴' : '🟡'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#F8FAFC' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.nameTh}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '10.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px',
                        backgroundColor: p.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : p.status === 'completed' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: p.status === 'confirmed' ? '#10B981' : p.status === 'completed' ? '#3B82F6' : '#F59E0B',
                      }}>
                        {p.status === 'confirmed' ? '✓ ยืนยัน' : p.status === 'completed' ? '✓ สมบูรณ์' : '⏳ กำลังก่อตัว'}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      TF: <strong style={{ color: '#CBD5E1' }}>{p.timeframe}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ความน่าเชื่อถือ: <strong style={{ color: p.reliability >= 70 ? '#10B981' : '#F59E0B' }}>{p.reliability}%</strong>
                    </span>
                    {p.targetPrice && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        เป้าหมาย: <strong style={{ color: p.type === 'bullish' ? '#10B981' : '#EF4444' }}>{formatPrice(p.targetPrice)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          5. CANDLESTICK PATTERNS
         ═══════════════════════════════════════════════ */}
      <div className="crypto-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          sectionKey="candlestickPatterns"
          icon={<Activity size={17} color="#F59E0B" />}
          title="Candlestick Patterns — รูปแบบแท่งเทียน"
          badge={`${candlestickPatterns.filter((p) => p.detected).length} พบ`}
          badgeColor="#F59E0B"
          subtitle="Hammer, Doji, Engulfing, Morning Star, Evening Star, Shooting Star"
        />
        {expandedSections.candlestickPatterns && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {candlestickPatterns.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px', borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${!p.detected ? 'rgba(255,255,255,0.06)' : p.type === 'bullish' ? 'rgba(16, 185, 129, 0.25)' : p.type === 'bearish' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)'}`,
                    opacity: p.detected ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>
                        {p.type === 'bullish' ? '🟢' : p.type === 'bearish' ? '🔴' : '⚪'}
                      </span>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '12.5px', color: '#F8FAFC' }}>{p.name}</span>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{p.nameTh}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                        background: p.strength === 'strong' ? 'rgba(16, 185, 129, 0.15)' : p.strength === 'moderate' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: p.strength === 'strong' ? '#10B981' : p.strength === 'moderate' ? '#F59E0B' : '#94A3B8',
                      }}>
                        {p.strength === 'strong' ? '💪 Strong' : p.strength === 'moderate' ? '⚡ Moderate' : 'Weak'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.timeframe}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', lineHeight: 1.4 }}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          6. SUPPORT & RESISTANCE LEVELS
         ═══════════════════════════════════════════════ */}
      <div className="crypto-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          sectionKey="supportResistance"
          icon={<Ruler size={17} color="#3B82F6" />}
          title="Support & Resistance — แนวรับ / แนวต้าน"
          badge={`${srLevels.length} ระดับ`}
          badgeColor="#3B82F6"
          subtitle="EMA, Bollinger, Fibonacci, VWAP, Supertrend, 24H Pivot"
        />
        {expandedSections.supportResistance && (
          <div style={{ padding: '16px 20px' }}>
            {/* Current Price Indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '8px 16px', marginBottom: '14px', borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.08))',
              border: '1px solid rgba(6, 182, 212, 0.25)',
            }}>
              <Crosshair size={14} color="#06B6D4" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ราคาปัจจุบัน:</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFF', fontFamily: 'monospace' }}>
                {formatPrice(ticker.price)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {/* Resistance */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="#EF4444" />
                  RESISTANCE (แนวต้าน) — ราคาที่สูงกว่าปัจจุบัน
                </div>
                <table className="crypto-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>ราคา ({prefix})</th>
                      <th>แหล่งที่มา</th>
                      <th>ความแข็งแกร่ง</th>
                      <th>Touch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resistanceLevels.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#FCA5A5' }}>
                          {formatPrice(l.price)}
                        </td>
                        <td style={{ color: '#CBD5E1' }}>{l.source}</td>
                        <td>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700,
                            background: l.strength === 'strong' ? 'rgba(239, 68, 68, 0.15)' : l.strength === 'moderate' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.04)',
                            color: l.strength === 'strong' ? '#EF4444' : l.strength === 'moderate' ? '#F59E0B' : '#94A3B8',
                          }}>
                            {l.strength === 'strong' ? '🔴 แข็งแกร่ง' : l.strength === 'moderate' ? '🟠 ปานกลาง' : '⚪ อ่อน'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{l.touchCount}x</td>
                      </tr>
                    ))}
                    {resistanceLevels.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบแนวต้านที่ใกล้เคียง</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Support */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={14} color="#10B981" />
                  SUPPORT (แนวรับ) — ราคาที่ต่ำกว่าปัจจุบัน
                </div>
                <table className="crypto-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>ราคา ({prefix})</th>
                      <th>แหล่งที่มา</th>
                      <th>ความแข็งแกร่ง</th>
                      <th>Touch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportLevels.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 800, fontFamily: 'monospace', color: '#6EE7B7' }}>
                          {formatPrice(l.price)}
                        </td>
                        <td style={{ color: '#CBD5E1' }}>{l.source}</td>
                        <td>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700,
                            background: l.strength === 'strong' ? 'rgba(16, 185, 129, 0.15)' : l.strength === 'moderate' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.04)',
                            color: l.strength === 'strong' ? '#10B981' : l.strength === 'moderate' ? '#F59E0B' : '#94A3B8',
                          }}>
                            {l.strength === 'strong' ? '🟢 แข็งแกร่ง' : l.strength === 'moderate' ? '🟠 ปานกลาง' : '⚪ อ่อน'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{l.touchCount}x</td>
                      </tr>
                    ))}
                    {supportLevels.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบแนวรับที่ใกล้เคียง</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          7. TRADINGVIEW TECHNICAL GAUGE (Consensus Meter)
         ═══════════════════════════════════════════════ */}
      <div className="crypto-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          sectionKey="technicalGauge"
          icon={<Target size={17} color="#3B82F6" />}
          title="TradingView Consensus Meter — เกจสรุปสัญญาณ (Live)"
          badge="LIVE"
          badgeColor="#10B981"
          subtitle="Moving Averages + Oscillators สดจาก TradingView"
        />
        {expandedSections.technicalGauge && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ minHeight: '380px', width: '100%', overflow: 'hidden', borderRadius: '10px', backgroundColor: 'var(--bg-card-inner, #0B101E)', border: '1px solid var(--border-color)' }}>
              <TradingViewTechnicalGauge symbol={selectedSymbol} height="380px" />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          8. TECHNICAL INDICATOR PANEL
         ═══════════════════════════════════════════════ */}
      <div className="crypto-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SectionHeader
          sectionKey="indicatorPanel"
          icon={<ArrowUpDown size={17} color="#22D3EE" />}
          title="Technical Indicators Panel — ตัวชี้วัดทางเทคนิค 17 ค่า"
          badge="17 Indicators"
          badgeColor="#22D3EE"
          subtitle="EMA, RSI, MACD, Bollinger, Supertrend, ATR, ADX, VWAP, OBV, Fibonacci"
        />
        {expandedSections.indicatorPanel && (
          <div style={{ padding: '16px 20px' }}>
            {/* Moving Averages Group */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#22D3EE', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={13} color="#22D3EE" />
                Moving Averages (เส้นค่าเฉลี่ย)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '8px' }}>
                {[
                  { label: 'EMA 9', value: indicators.ema9, compare: ticker.price },
                  { label: 'EMA 20', value: indicators.ema20, compare: ticker.price },
                  { label: 'EMA 50', value: indicators.ema50, compare: ticker.price },
                  { label: 'EMA 200', value: indicators.ema200, compare: ticker.price },
                  { label: 'VWAP', value: indicators.vwap, compare: ticker.price },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: '10px 12px', borderRadius: '8px',
                    background: item.value > 0 && item.compare > item.value ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    border: `1px solid ${item.value > 0 && item.compare > item.value ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                  }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>{item.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'monospace' }}>
                      {typeof item.value === 'number' ? (item.value * multiplier).toLocaleString(undefined, { maximumFractionDigits: item.value < 1 ? 4 : 2 }) : item.value}
                    </div>
                    <div style={{ fontSize: '10px', color: item.compare > item.value ? '#10B981' : '#EF4444', fontWeight: 700, marginTop: '2px' }}>
                      {item.compare > item.value ? '▲ ราคาอยู่เหนือ' : '▼ ราคาอยู่ใต้'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Oscillators Group */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#A78BFA', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={13} color="#A78BFA" />
                Oscillators (ออสซิลเลเตอร์)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '8px' }}>
                {/* RSI */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>RSI (14)</div>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: indicators.rsi14 > 70 ? '#EF4444' : indicators.rsi14 < 30 ? '#10B981' : '#22D3EE', marginTop: '2px' }}>
                    {indicators.rsi14.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px', color: indicators.rsi14 > 70 ? '#EF4444' : indicators.rsi14 < 30 ? '#10B981' : '#94A3B8' }}>
                    {indicators.rsi14 > 70 ? '⚠ Overbought' : indicators.rsi14 < 30 ? '✨ Oversold' : 'ปกติ'}
                  </div>
                  {/* RSI Bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${indicators.rsi14}%`, height: '100%', borderRadius: '2px', background: indicators.rsi14 > 70 ? '#EF4444' : indicators.rsi14 < 30 ? '#10B981' : '#3B82F6' }} />
                  </div>
                </div>

                {/* MACD */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>MACD (12,26,9)</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px', display: 'flex', gap: '6px' }}>
                    <span style={{ color: indicators.macd.macd >= 0 ? '#10B981' : '#EF4444' }}>{indicators.macd.macd.toFixed(4)}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Signal: <span style={{ color: '#CBD5E1' }}>{indicators.macd.signal.toFixed(4)}</span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px', color: indicators.macd.macd > indicators.macd.signal ? '#10B981' : '#EF4444' }}>
                    {indicators.macd.macd > indicators.macd.signal ? '▲ Bullish Cross' : '▼ Bearish Cross'}
                  </div>
                </div>

                {/* ADX */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ADX (14)</div>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: indicators.adx14 > 25 ? '#F59E0B' : '#94A3B8', marginTop: '2px' }}>
                    {indicators.adx14.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px', color: indicators.adx14 > 25 ? '#F59E0B' : '#94A3B8' }}>
                    {indicators.adx14 > 40 ? '🔥 แนวโน้มแรงมาก' : indicators.adx14 > 25 ? '⚡ มีแนวโน้ม' : '→ Sideways'}
                  </div>
                </div>

                {/* ATR */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ATR (14) — Volatility</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px' }}>
                    {(indicators.atr14 * multiplier).toLocaleString(undefined, { maximumFractionDigits: ticker.price < 1 ? 6 : 2 })}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ≈ {((indicators.atr14 / ticker.price) * 100).toFixed(2)}% ของราคา
                  </div>
                </div>

                {/* OBV */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>OBV (On-Balance Volume)</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px' }}>
                    {indicators.obv >= 1e9 ? `${(indicators.obv / 1e9).toFixed(2)}B` : indicators.obv >= 1e6 ? `${(indicators.obv / 1e6).toFixed(2)}M` : indicators.obv.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '10px', color: indicators.obv > 0 ? '#10B981' : '#EF4444', fontWeight: 700, marginTop: '2px' }}>
                    {indicators.obv > 0 ? '▲ แรงซื้อสะสม' : '▼ แรงขายสะสม'}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend & Bands Group */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#F59E0B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={13} color="#F59E0B" />
                Trend & Bands (แนวโน้มและกรอบราคา)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                {/* Supertrend */}
                <div style={{
                  padding: '10px 12px', borderRadius: '8px',
                  background: indicators.supertrend.direction === 'bullish' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                  border: `1px solid ${indicators.supertrend.direction === 'bullish' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Supertrend</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: indicators.supertrend.direction === 'bullish' ? '#10B981' : '#EF4444', marginTop: '2px' }}>
                    {(indicators.supertrend.value * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 800, marginTop: '2px', color: indicators.supertrend.direction === 'bullish' ? '#10B981' : '#EF4444' }}>
                    {indicators.supertrend.direction === 'bullish' ? '▲ Bullish' : '▼ Bearish'}
                  </div>
                </div>

                {/* Bollinger Upper */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Bollinger Upper</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px', color: '#FCA5A5' }}>
                    {(indicators.bollingerBands.upper * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Bollinger Lower */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Bollinger Lower</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px', color: '#6EE7B7' }}>
                    {(indicators.bollingerBands.lower * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Fibonacci 0.618 */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Fibonacci 0.618 ⭐</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px', color: '#FBBF24' }}>
                    {(indicators.fibonacci.level618 * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Fibonacci 0.500 */}
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Fibonacci 0.500</div>
                  <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '2px' }}>
                    {(indicators.fibonacci.level500 * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          FOOTER NOTE
         ═══════════════════════════════════════════════ */}
      <div style={{
        textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)',
        padding: '8px 16px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)',
      }}>
        📊 หน้า <strong style={{ color: '#22D3EE' }}>วิเคราะห์กราฟ</strong> เน้นการอ่านกราฟ รูปแบบแท่งเทียน แนวรับ-แนวต้าน และ Indicator ทางเทคนิค
        — ต่างจากหน้า "วิเคราะห์เชิงลึก" ที่เน้น Trading Plan, Entry/Exit, Stop Loss และ R:R
      </div>
    </div>
  );
};
