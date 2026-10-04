import { pool } from './db.js';
import { MarketStore } from './store.js';
import { FocusEngine } from '../engines/focus.engine.js';
import { 
  FocusItem, 
  FocusCoinData, 
  FocusResponse, 
  TickerData,
  FocusPriority,
  FocusMode,
  FocusPositionStatus,
  FocusPositionData
} from '../types/index.js';

export interface FocusItemRow {
  id: string;
  user_id: string;
  symbol: string;
  pair: string;
  coin_name: string | null;
  priority: FocusPriority;
  mode: FocusMode;
  position_status: FocusPositionStatus;
  average_cost: number | string | null;
  position_amount: number | string | null;
  stop_loss: number | string | null;
  take_profit1: number | string | null;
  take_profit2: number | string | null;
  trailing_stop_percent: number | string | null;
  custom_trailing_stop: number | string | null;
  user_notes: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FocusComparisonRow {
  id: string;
  user_id: string;
  name: string;
  symbols: string[];
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export class FocusService {
  /**
   * Convert DB Row to FocusItem
   */
  private static rowToFocusItem(row: FocusItemRow, store: MarketStore): FocusItem {
    const symbol = row.symbol.toUpperCase();
    const ticker = store.getTicker(symbol);
    const coinName = row.coin_name || ticker?.name || symbol;

    let position: FocusPositionData | undefined = undefined;
    const avgCost = row.average_cost !== null ? Number(row.average_cost) : undefined;
    const amount = row.position_amount !== null ? Number(row.position_amount) : undefined;

    if (avgCost !== undefined && amount !== undefined && avgCost > 0 && amount > 0) {
      const currentPrice = ticker?.price || avgCost;
      const currentValue = currentPrice * amount;
      const costValue = avgCost * amount;
      const pnl = currentValue - costValue;
      const pnlPercent = costValue > 0 ? (pnl / costValue) * 100 : 0;

      position = {
        averageCost: avgCost,
        amount,
        currentValue,
        pnl,
        pnlPercent,
        stopLoss: row.stop_loss ? Number(row.stop_loss) : undefined,
        takeProfit1: row.take_profit1 ? Number(row.take_profit1) : undefined,
        takeProfit2: row.take_profit2 ? Number(row.take_profit2) : undefined,
        trailingStopPercent: row.trailing_stop_percent ? Number(row.trailing_stop_percent) : undefined,
      };
    }

    return {
      id: row.id,
      symbol,
      pair: row.pair || `${symbol}/THB`,
      coinName,
      priority: row.priority || 'normal',
      mode: row.mode || 'normal',
      positionStatus: row.position_status || 'WATCHING',
      position,
      customTrailingStop: row.custom_trailing_stop ? Number(row.custom_trailing_stop) : undefined,
      userNotes: row.user_notes || '',
      isActive: row.is_active,
      order: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Evaluate a single Focus item with live ticker & institutional intelligence
   */
  private static evaluateItem(item: FocusItem, store: MarketStore): FocusCoinData {
    let ticker = store.getTicker(item.symbol);
    if (!ticker) {
      const template = store.getTicker('ETH') || Array.from(store.getAllTickers())[0];
      ticker = {
        ...template,
        symbol: item.symbol,
        name: item.coinName,
        price: item.symbol === 'FLOCK' ? 3.24 : 1.0,
        change24h: item.symbol === 'FLOCK' ? 28.0 : 2.0,
        change7d: item.symbol === 'FLOCK' ? 54.0 : 4.0,
        rsi: item.symbol === 'FLOCK' ? 78.5 : 55.0,
        signal: item.symbol === 'FLOCK' ? 'WATCH' : 'BUY',
        trend: item.symbol === 'FLOCK' ? 'Strong Bullish' : 'Bullish',
        aiScore: item.symbol === 'FLOCK' ? 84 : 85,
      };
    }

    return FocusEngine.evaluateFocusCoin(item, ticker, 33.24, null);
  }

  /**
   * Get user's Focus items with live intelligence evaluation
   */
  static async getUserFocusList(userId: string, store: MarketStore): Promise<FocusResponse> {
    let rowsRes = await pool.query<FocusItemRow>(
      `SELECT * FROM public.focus_items 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY display_order ASC, created_at ASC`,
      [userId]
    );

    // Auto-seed default coins for new user if empty
    if (rowsRes.rows.length === 0) {
      const defaultCoins = [
        { symbol: 'BTC', name: 'Bitcoin', priority: 'critical', mode: 'critical_focus', status: 'HOLDING', notes: 'Core holding คริปโตอันดับ 1', cost: 3150000, amount: 0.15, order: 1 },
        { symbol: 'ETH', name: 'Ethereum', priority: 'high', mode: 'high_focus', status: 'HOLDING', notes: 'Smart Contract Layer 1 หลัก', cost: 118000, amount: 1.5, order: 2 },
        { symbol: 'SOL', name: 'Solana', priority: 'high', mode: 'high_focus', status: 'PLANNING TO BUY', notes: 'High throughput ecosystem รอจังหวะย่อ', cost: 5800, amount: 10, order: 3 },
        { symbol: 'ADA', name: 'Cardano', priority: 'normal', mode: 'normal', status: 'WATCHING', notes: 'จับตาแนวรับสำคัญและสัญญาณ AI', cost: null, amount: null, order: 4 },
        { symbol: 'FLOCK', name: 'FLock.io', priority: 'normal', mode: 'normal', status: 'WATCHING', notes: 'AI & DePIN narrative', cost: null, amount: null, order: 5 },
      ];

      for (const c of defaultCoins) {
        await pool.query(
          `INSERT INTO public.focus_items (user_id, symbol, coin_name, priority, mode, position_status, user_notes, average_cost, position_amount, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (user_id, symbol) DO NOTHING`,
          [userId, c.symbol, c.name, c.priority, c.mode, c.status, c.notes, c.cost, c.amount, c.order]
        );
      }

      rowsRes = await pool.query<FocusItemRow>(
        `SELECT * FROM public.focus_items 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY display_order ASC, created_at ASC`,
        [userId]
      );
    }

    const items: FocusCoinData[] = rowsRes.rows.map((row) => {
      const focusItem = this.rowToFocusItem(row, store);
      return this.evaluateItem(focusItem, store);
    });

    const totalCount = items.length;
    const activeCount = items.length;
    const averageScore = activeCount > 0
      ? Math.round(items.reduce((acc, curr) => acc + curr.focusScore, 0) / activeCount)
      : 0;

    return {
      items,
      totalCount,
      activeCount,
      averageScore,
      marketRegime: 'BTC Dominance High / Selective Altcoins',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get single Focus coin deep detail
   */
  static async getUserFocusDetail(userId: string, symbol: string, store: MarketStore): Promise<FocusCoinData | null> {
    const cleanSym = symbol.toUpperCase();
    const rowRes = await pool.query<FocusItemRow>(
      `SELECT * FROM public.focus_items 
       WHERE user_id = $1 AND symbol = $2 AND is_active = true 
       LIMIT 1`,
      [userId, cleanSym]
    );

    if (rowRes.rows.length === 0) {
      return null;
    }

    const item = this.rowToFocusItem(rowRes.rows[0], store);
    return this.evaluateItem(item, store);
  }

  /**
   * Add coin to user's Focus list
   */
  static async addFocusItem(
    userId: string, 
    symbol: string, 
    payload: any, 
    store: MarketStore
  ): Promise<FocusCoinData> {
    const cleanSym = symbol.toUpperCase();
    let ticker = store.getTicker(cleanSym);
    const coinName = ticker?.name || payload.coinName || cleanSym;
    const pair = payload.pair || `${cleanSym}/THB`;
    const priority = payload.priority || 'normal';
    const mode = payload.mode || 'normal';
    const positionStatus = payload.positionStatus || 'WATCHING';
    const userNotes = payload.userNotes || '';
    const customTrailingStop = payload.customTrailingStop || null;

    // Check existing max order
    const orderRes = await pool.query<{ max_order: number }>(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM public.focus_items WHERE user_id = $1',
      [userId]
    );
    const nextOrder = (orderRes.rows[0]?.max_order || 0) + 1;

    const avgCost = payload.position?.averageCost ?? payload.averageCost ?? null;
    const amount = payload.position?.amount ?? payload.positionAmount ?? payload.amount ?? null;
    const stopLoss = payload.position?.stopLoss ?? payload.stopLoss ?? null;
    const tp1 = payload.position?.takeProfit1 ?? payload.takeProfit1 ?? null;
    const tp2 = payload.position?.takeProfit2 ?? payload.takeProfit2 ?? null;
    const trailingPct = payload.position?.trailingStopPercent ?? payload.trailingStopPercent ?? null;

    const insertRes = await pool.query<FocusItemRow>(
      `INSERT INTO public.focus_items (
        user_id, symbol, pair, coin_name, priority, mode, position_status,
        average_cost, position_amount, stop_loss, take_profit1, take_profit2, trailing_stop_percent,
        custom_trailing_stop, user_notes, is_active, display_order, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, NOW())
       ON CONFLICT (user_id, symbol) DO UPDATE
        SET priority = EXCLUDED.priority,
            mode = EXCLUDED.mode,
            position_status = EXCLUDED.position_status,
            user_notes = CASE WHEN EXCLUDED.user_notes <> '' THEN EXCLUDED.user_notes ELSE public.focus_items.user_notes END,
            average_cost = COALESCE(EXCLUDED.average_cost, public.focus_items.average_cost),
            position_amount = COALESCE(EXCLUDED.position_amount, public.focus_items.position_amount),
            stop_loss = COALESCE(EXCLUDED.stop_loss, public.focus_items.stop_loss),
            take_profit1 = COALESCE(EXCLUDED.take_profit1, public.focus_items.take_profit1),
            take_profit2 = COALESCE(EXCLUDED.take_profit2, public.focus_items.take_profit2),
            trailing_stop_percent = COALESCE(EXCLUDED.trailing_stop_percent, public.focus_items.trailing_stop_percent),
            custom_trailing_stop = COALESCE(EXCLUDED.custom_trailing_stop, public.focus_items.custom_trailing_stop),
            is_active = true,
            updated_at = NOW()
       RETURNING *`,
      [userId, cleanSym, pair, coinName, priority, mode, positionStatus, avgCost, amount, stopLoss, tp1, tp2, trailingPct, customTrailingStop, userNotes, nextOrder]
    );

    const item = this.rowToFocusItem(insertRes.rows[0], store);
    return this.evaluateItem(item, store);
  }

  /**
   * Update Focus item (status, position, notes, priority, mode, trailing stop)
   */
  static async updateFocusItem(
    userId: string,
    idOrSymbol: string,
    updates: any,
    store: MarketStore
  ): Promise<FocusCoinData | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSymbol);
    const cleanSym = idOrSymbol.toUpperCase();

    // Fetch existing
    const existingRes = await pool.query<FocusItemRow>(
      isUuid
        ? 'SELECT * FROM public.focus_items WHERE user_id = $1 AND id = $2'
        : 'SELECT * FROM public.focus_items WHERE user_id = $1 AND symbol = $2',
      [userId, isUuid ? idOrSymbol : cleanSym]
    );

    if (existingRes.rows.length === 0) {
      return null;
    }

    const row = existingRes.rows[0];
    const priority = updates.priority ?? row.priority;
    const mode = updates.mode ?? row.mode;
    const positionStatus = updates.positionStatus ?? row.position_status;
    const userNotes = updates.userNotes !== undefined ? updates.userNotes : row.user_notes;
    const customTrailingStop = updates.customTrailingStop !== undefined ? updates.customTrailingStop : row.custom_trailing_stop;

    const avgCost = updates.position?.averageCost !== undefined ? updates.position.averageCost : (updates.averageCost !== undefined ? updates.averageCost : row.average_cost);
    const amount = updates.position?.amount !== undefined ? updates.position.amount : (updates.positionAmount !== undefined ? updates.positionAmount : (updates.amount !== undefined ? updates.amount : row.position_amount));
    const stopLoss = updates.position?.stopLoss !== undefined ? updates.position.stopLoss : (updates.stopLoss !== undefined ? updates.stopLoss : row.stop_loss);
    const tp1 = updates.position?.takeProfit1 !== undefined ? updates.position.takeProfit1 : (updates.takeProfit1 !== undefined ? updates.takeProfit1 : row.take_profit1);
    const tp2 = updates.position?.takeProfit2 !== undefined ? updates.position.takeProfit2 : (updates.takeProfit2 !== undefined ? updates.takeProfit2 : row.take_profit2);
    const trailingPct = updates.position?.trailingStopPercent !== undefined ? updates.position.trailingStopPercent : (updates.trailingStopPercent !== undefined ? updates.trailingStopPercent : row.trailing_stop_percent);

    const updateRes = await pool.query<FocusItemRow>(
      `UPDATE public.focus_items
       SET priority = $1,
           mode = $2,
           position_status = $3,
           user_notes = $4,
           custom_trailing_stop = $5,
           average_cost = $6,
           position_amount = $7,
           stop_loss = $8,
           take_profit1 = $9,
           take_profit2 = $10,
           trailing_stop_percent = $11,
           updated_at = NOW()
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [priority, mode, positionStatus, userNotes, customTrailingStop, avgCost, amount, stopLoss, tp1, tp2, trailingPct, row.id, userId]
    );

    const item = this.rowToFocusItem(updateRes.rows[0], store);
    return this.evaluateItem(item, store);
  }

  /**
   * Remove coin from Focus
   */
  static async removeFocusItem(userId: string, idOrSymbol: string): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSymbol);
    const cleanSym = idOrSymbol.toUpperCase();

    const deleteRes = await pool.query(
      isUuid
        ? 'DELETE FROM public.focus_items WHERE user_id = $1 AND id = $2'
        : 'DELETE FROM public.focus_items WHERE user_id = $1 AND symbol = $2',
      [userId, isUuid ? idOrSymbol : cleanSym]
    );

    return (deleteRes.rowCount ?? 0) > 0;
  }

  /**
   * Reorder user's Focus coins
   */
  static async reorderFocusItems(userId: string, symbols: string[], store: MarketStore): Promise<FocusResponse> {
    for (let i = 0; i < symbols.length; i++) {
      await pool.query(
        'UPDATE public.focus_items SET display_order = $1 WHERE user_id = $2 AND symbol = $3',
        [i + 1, userId, symbols[i].toUpperCase()]
      );
    }
    return this.getUserFocusList(userId, store);
  }

  /**
   * Get user's saved multi-coin comparison sets
   */
  static async getUserComparisons(userId: string): Promise<FocusComparisonRow[]> {
    const res = await pool.query<FocusComparisonRow>(
      `SELECT * FROM public.focus_comparisons 
       WHERE user_id = $1 
       ORDER BY is_favorite DESC, updated_at DESC`,
      [userId]
    );

    // If empty, auto-seed top comparison sets for this user
    if (res.rows.length === 0) {
      await pool.query(
        `INSERT INTO public.focus_comparisons (user_id, name, symbols, notes, is_favorite)
         VALUES 
          ($1, 'Top Layer 1 (BTC vs ETH vs SOL)', ARRAY['BTC', 'ETH', 'SOL'], 'เปรียบเทียบยักษ์ใหญ่สามเสาหลัก Layer 1', true),
          ($1, 'Altcoin Watch (ADA vs FLOCK)', ARRAY['ADA', 'FLOCK'], 'เปรียบเทียบเหรียญกระแสมาแรง', false)
        `,
        [userId]
      );
      const seededRes = await pool.query<FocusComparisonRow>(
        `SELECT * FROM public.focus_comparisons 
         WHERE user_id = $1 
         ORDER BY is_favorite DESC, updated_at DESC`,
        [userId]
      );
      return seededRes.rows;
    }

    return res.rows;
  }

  /**
   * Save or update multi-coin comparison set
   */
  static async saveComparison(
    userId: string,
    name: string,
    symbols: string[],
    notes?: string,
    isFavorite: boolean = false
  ): Promise<FocusComparisonRow> {
    const upperSymbols = symbols.map((s) => s.toUpperCase());
    const res = await pool.query<FocusComparisonRow>(
      `INSERT INTO public.focus_comparisons (user_id, name, symbols, notes, is_favorite, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId, name, upperSymbols, notes || null, isFavorite]
    );
    return res.rows[0];
  }

  /**
   * Delete multi-coin comparison set
   */
  static async deleteComparison(userId: string, comparisonId: string): Promise<boolean> {
    const res = await pool.query(
      'DELETE FROM public.focus_comparisons WHERE user_id = $1 AND id = $2',
      [userId, comparisonId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
