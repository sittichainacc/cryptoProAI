export interface SavedChartIndicators {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  bb: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
  stochastic: boolean;
  ichimoku: boolean;
}

export const DEFAULT_CHART_INDICATORS: SavedChartIndicators = {
  ema20: true,
  ema50: true,
  ema200: true,
  bb: false,
  volume: true,
  rsi: true,
  macd: false,
  stochastic: false,
  ichimoku: false,
};

const STORAGE_KEY_GLOBAL = 'cryptopro_chart_indicators_v2';
const STORAGE_KEY_ENGINE = 'cryptopro_chart_engine_v2';
const STORAGE_KEY_TIMEFRAME = 'cryptopro_chart_timeframe_v2';

export interface IndicatorMeta {
  key: keyof SavedChartIndicators;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  tvStudyId: string;
  tvInputs?: Record<string, any>;
}

export const INDICATOR_CATALOG: IndicatorMeta[] = [
  {
    key: 'ema20',
    label: 'EMA 20 (Exponential Moving Average)',
    shortLabel: 'EMA 20',
    description: 'เส้นค่าเฉลี่ยระยะสั้น สำหรับดูแนวโน้มและจุดตามเทรนด์',
    color: '#3B82F6',
    tvStudyId: 'MAExp@tv-basicstudies',
    tvInputs: { length: 20 },
  },
  {
    key: 'ema50',
    label: 'EMA 50 (Trend Baseline)',
    shortLabel: 'EMA 50',
    description: 'เส้นค่าเฉลี่ยระยะกลาง แนวรับต้านสำคัญในรอบเดือน',
    color: '#F59E0B',
    tvStudyId: 'MAExp@tv-basicstudies',
    tvInputs: { length: 50 },
  },
  {
    key: 'ema200',
    label: 'EMA 200 (Major Trend & Golden Cross)',
    shortLabel: 'EMA 200',
    description: 'เส้นแบ่งแนวโน้มใหญ่ Bull / Bear Market',
    color: '#8B5CF6',
    tvStudyId: 'MAExp@tv-basicstudies',
    tvInputs: { length: 200 },
  },
  {
    key: 'bb',
    label: 'Bollinger Bands (20, 2)',
    shortLabel: 'BB (20,2)',
    description: 'กรอบความผันผวน ดูจุดระเบิด Volatility Breakout',
    color: '#06B6D4',
    tvStudyId: 'BB@tv-basicstudies',
  },
  {
    key: 'rsi',
    label: 'RSI 14 (Relative Strength Index)',
    shortLabel: 'RSI 14',
    description: 'ดัชนีกำลังซื้อ/ขาย ดูจุด Overbought (>70) และ Oversold (<30)',
    color: '#EC4899',
    tvStudyId: 'RSI@tv-basicstudies',
    tvInputs: { length: 14 },
  },
  {
    key: 'macd',
    label: 'MACD (12, 26, 9)',
    shortLabel: 'MACD',
    description: 'สัญญาณบอกโมเมนตัมและการตัดกันของเส้นแนวโน้ม',
    color: '#10B981',
    tvStudyId: 'MACD@tv-basicstudies',
  },
  {
    key: 'volume',
    label: 'Volume (ปริมาณการซื้อขาย)',
    shortLabel: 'Volume',
    description: 'ปริมาณการซื้อขาย ยืนยันความน่าเชื่อถือของแท่งเทียน',
    color: '#14B8A6',
    tvStudyId: 'Volume@tv-basicstudies',
  },
  {
    key: 'stochastic',
    label: 'Stochastic Oscillator (14, 3, 3)',
    shortLabel: 'Stoch',
    description: 'ตัวแกว่งโมเมนตัมรอบสั้น หาจุดกลับตัวในกรอบ Sideway',
    color: '#EAB308',
    tvStudyId: 'Stochastic@tv-basicstudies',
  },
  {
    key: 'ichimoku',
    label: 'Ichimoku Cloud (เมฆอิชิโมกุ)',
    shortLabel: 'Ichimoku',
    description: 'ระบบเมฆบอกเทรนด์ แนวรับแนวต้าน และจุดเปลี่ยนสภาวะตลาด',
    color: '#A855F7',
    tvStudyId: 'IchimokuCloud@tv-basicstudies',
  },
];

export interface IndicatorPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  indicators: SavedChartIndicators;
}

export const INDICATOR_PRESETS: IndicatorPreset[] = [
  {
    id: 'trend',
    name: 'ตามเทรนด์ (Trend Following)',
    icon: '📈',
    description: 'EMA 20, 50, 200 + Volume',
    indicators: {
      ema20: true,
      ema50: true,
      ema200: true,
      bb: false,
      volume: true,
      rsi: false,
      macd: false,
      stochastic: false,
      ichimoku: false,
    },
  },
  {
    id: 'momentum',
    name: 'โมเมนตัม (Momentum & Reversal)',
    icon: '⚡',
    description: 'RSI 14 + MACD + Bollinger Bands + Volume',
    indicators: {
      ema20: false,
      ema50: false,
      ema200: false,
      bb: true,
      volume: true,
      rsi: true,
      macd: true,
      stochastic: false,
      ichimoku: false,
    },
  },
  {
    id: 'scalp',
    name: 'เดย์เทรด / สกัลป์ (Daytrade & Scalp)',
    icon: '🎯',
    description: 'EMA 20 + BB + RSI + Stochastic + Volume',
    indicators: {
      ema20: true,
      ema50: false,
      ema200: false,
      bb: true,
      volume: true,
      rsi: true,
      macd: false,
      stochastic: true,
      ichimoku: false,
    },
  },
  {
    id: 'full',
    name: 'ฟูลเมทริกซ์ (Full Pro Matrix)',
    icon: '🌐',
    description: 'เปิดอินดิเคเตอร์หลักครบชุด',
    indicators: {
      ema20: true,
      ema50: true,
      ema200: true,
      bb: true,
      volume: true,
      rsi: true,
      macd: true,
      stochastic: false,
      ichimoku: false,
    },
  },
  {
    id: 'naked',
    name: 'กราฟเปล่า (Clean Price Action)',
    icon: '🧼',
    description: 'ปิดอินดิเคเตอร์ทั้งหมด โฟกัสพฤติกรรมแท่งเทียนล้วน',
    indicators: {
      ema20: false,
      ema50: false,
      ema200: false,
      bb: false,
      volume: false,
      rsi: false,
      macd: false,
      stochastic: false,
      ichimoku: false,
    },
  },
];

export function getSavedIndicators(): SavedChartIndicators {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL);
    if (!raw) return { ...DEFAULT_CHART_INDICATORS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CHART_INDICATORS, ...parsed };
  } catch (err) {
    console.error('Failed to parse saved chart indicators from localStorage:', err);
    return { ...DEFAULT_CHART_INDICATORS };
  }
}

export function saveChartIndicators(indicators: SavedChartIndicators): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(indicators));
  } catch (err) {
    console.error('Failed to save chart indicators to localStorage:', err);
  }
}

export function getSavedChartEngine(): 'tradingview' | 'lightweight' {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENGINE);
    if (raw === 'tradingview' || raw === 'lightweight') return raw;
    return 'tradingview';
  } catch {
    return 'tradingview';
  }
}

export function saveChartEngine(engine: 'tradingview' | 'lightweight'): void {
  try {
    localStorage.setItem(STORAGE_KEY_ENGINE, engine);
  } catch (err) {
    console.error('Failed to save chart engine to localStorage:', err);
  }
}

export function getSavedChartTimeframe(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMEFRAME);
    if (raw) return raw;
    return '1D';
  } catch {
    return '1D';
  }
}

export function saveChartTimeframe(tf: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_TIMEFRAME, tf);
  } catch (err) {
    console.error('Failed to save chart timeframe to localStorage:', err);
  }
}

export function toTradingViewStudies(indicators: SavedChartIndicators): Array<{ id: string; inputs?: Record<string, any> }> {
  const studies: Array<{ id: string; inputs?: Record<string, any> }> = [];
  
  for (const item of INDICATOR_CATALOG) {
    if (indicators[item.key]) {
      if (item.tvInputs) {
        studies.push({ id: item.tvStudyId, inputs: item.tvInputs });
      } else {
        studies.push({ id: item.tvStudyId });
      }
    }
  }

  return studies;
}

const STORAGE_KEY_HEIGHT = 'cryptopro_chart_height_v2';

export function getSavedChartHeight(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HEIGHT);
    if (raw) {
      const num = parseInt(raw, 10);
      if (num >= 450 && num <= 1400) return num;
    }
    return 600; // Increased default height from 450 to 600
  } catch {
    return 600;
  }
}

export function saveChartHeight(height: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_HEIGHT, height.toString());
  } catch (err) {
    console.error('Failed to save chart height to localStorage:', err);
  }
}

/**
 * Maps frontend timeframe strings ('1m', '5m', '15m', '1h', '4h', '1D', '1W')
 * to exact TradingView Widget interval resolution codes ('1', '5', '15', '60', '240', 'D', 'W')
 * Preventing "Invalid interval" errors.
 */
export function toTradingViewInterval(tf: string): string {
  const norm = (tf || '1D').toLowerCase().trim();
  switch (norm) {
    case '1m':
    case '1':
      return '1';
    case '3m':
    case '3':
      return '3';
    case '5m':
    case '5':
      return '5';
    case '15m':
    case '15':
      return '15';
    case '30m':
    case '30':
      return '30';
    case '1h':
    case '60':
      return '60';
    case '2h':
    case '120':
      return '120';
    case '4h':
    case '240':
      return '240';
    case '1d':
    case 'd':
      return 'D';
    case '1w':
    case 'w':
      return 'W';
    case '1mth':
    case 'm':
      return 'M';
    default:
      return 'D';
  }
}

