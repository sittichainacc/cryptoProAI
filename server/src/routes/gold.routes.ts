/**
 * 🥇 Gold Signal API Routes — /api/gold/*
 */

import { Router } from 'express';
import { GoldDecisionEngine, GoldBacktestEngine, GoldMarketDataEngine } from '../engines/gold/index.js';
import type { GoldTradingMode, TradeSide } from '../engines/gold/gold_types.js';

export const goldRouter = Router();

// อุ่นผล Validation/Backtest เบื้องหลังตอน server เริ่ม — ครั้งแรกบนเครื่องใหม่ต้องโหลดประวัติข่าว ~10 นาที
setTimeout(() => { GoldBacktestEngine.run().catch(err => console.warn('[Gold] backtest warm-up failed:', err.message)); }, 10_000);

const MODES: GoldTradingMode[] = ['XAU_USD_SPOT', 'COMEX_FUTURES', 'THAI_GOLD_BAR'];

const num = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * GET /api/gold/signal
 * ?mode=XAU_USD_SPOT|COMEX_FUTURES|THAI_GOLD_BAR
 * &entryPrice=4190&side=LONG|SHORT&stopLoss=4150&entryTime=<unix ms>   (optional — position tracking)
 */
goldRouter.get('/signal', async (req, res) => {
  try {
    const mode = MODES.includes(req.query.mode as GoldTradingMode) ? req.query.mode as GoldTradingMode : 'XAU_USD_SPOT';
    const entryPrice = num(req.query.entryPrice);
    const side: TradeSide = req.query.side === 'SHORT' ? 'SHORT' : 'LONG';
    const position = entryPrice ? { side, entryPrice, stopLoss: num(req.query.stopLoss), entryTime: num(req.query.entryTime) } : null;

    const signal = await GoldDecisionEngine.generateSignal({ mode, position });
    res.json({ success: true, data: signal });
  } catch (err: any) {
    console.error('[Gold API] signal error:', err.message);
    res.status(503).json({ success: false, error: err.message });
  }
});

/** GET /api/gold/price — ราคาอย่างเดียว (เบา) */
goldRouter.get('/price', async (_req, res) => {
  try {
    const snap = await GoldMarketDataEngine.load();
    res.json({ success: true, data: snap.price });
  } catch (err: any) {
    res.status(503).json({ success: false, error: err.message });
  }
});

/** GET /api/gold/candles?tf=1h|4h|1d&mode=... — แท่งเทียนในหน่วยราคาของโหมด (สำหรับกราฟ Entry/TP/SL) */
goldRouter.get('/candles', async (req, res) => {
  try {
    const snap = await GoldMarketDataEngine.load();
    const tfKey = req.query.tf === '15m' ? 'm15' : req.query.tf === '1h' ? 'h1' : req.query.tf === '1d' ? 'd1' : 'h4';
    const shift = req.query.mode === 'COMEX_FUTURES' ? 0 : -snap.price.comexBasis;
    const candles = (snap.tf[tfKey] || snap.tf.h4).slice(-300).map(k => ({
      time: k.time, open: k.open + shift, high: k.high + shift, low: k.low + shift, close: k.close + shift, volume: k.volume,
    }));
    res.json({ success: true, data: candles });
  } catch (err: any) {
    res.status(503).json({ success: false, error: err.message });
  }
});

/** GET /api/gold/backtest — Walk-forward validation ของ Entry Engine (cache 12 ชม.) */
goldRouter.get('/backtest', async (_req, res) => {
  try {
    const result = await GoldBacktestEngine.run();
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Gold API] backtest error:', err.message);
    res.status(503).json({ success: false, error: err.message });
  }
});
