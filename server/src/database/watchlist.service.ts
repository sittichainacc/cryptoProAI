import { pool } from './db.js';
import { MarketStore } from './store.js';
import { TickerData } from '../types/index.js';

export interface WatchlistRow {
  id: string;
  user_id: string;
  symbol: string;
  target_buy_price?: number | null;
  target_sell_price?: number | null;
  priority: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchlistTickerItem extends TickerData {
  watchlistId: string;
  targetBuyPrice?: number | null;
  targetSellPrice?: number | null;
  watchlistNotes?: string | null;
  watchlistPriority?: number;
}

export class WatchlistService {
  /**
   * Get user's watchlist with combined live market ticker data
   */
  static async getUserWatchlist(userId: string, store: MarketStore): Promise<{ items: WatchlistTickerItem[]; quota: { used: number; max: number } }> {
    // 1. Get user profile for quota check
    const userRes = await pool.query(
      'SELECT id, role, max_watchlists FROM public.user_profiles WHERE id = $1',
      [userId]
    );
    const maxWatchlists = userRes.rows[0]?.max_watchlists || 15;

    // 2. Fetch watchlist rows
    let rowsRes = await pool.query<WatchlistRow>(
      'SELECT * FROM public.watchlists WHERE user_id = $1 ORDER BY priority ASC, created_at ASC',
      [userId]
    );

    // If new user and 0 coins in DB, seed top initial coins for this user
    if (rowsRes.rows.length === 0) {
      const initialSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      for (let i = 0; i < initialSymbols.length; i++) {
        await pool.query(
          `INSERT INTO public.watchlists (user_id, symbol, priority) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (user_id, symbol) DO NOTHING`,
          [userId, initialSymbols[i], i + 1]
        );
      }
      rowsRes = await pool.query<WatchlistRow>(
        'SELECT * FROM public.watchlists WHERE user_id = $1 ORDER BY priority ASC, created_at ASC',
        [userId]
      );
    }

    // 3. Map with live store tickers
    const items: WatchlistTickerItem[] = [];
    for (const row of rowsRes.rows) {
      const symbol = row.symbol.toUpperCase();
      let ticker = store.getTicker(symbol);
      
      const baseTicker: TickerData = ticker || {
        symbol,
        name: symbol,
        sector: 'core',
        price: Number(row.target_buy_price) || 0,
        currency: 'USDT',
        change1h: 0,
        change24h: 0,
        change7d: 0,
        volume24h: 0,
        marketCap: 0,
        high24h: 0,
        low24h: 0,
        rsi: 50,
        trend: 'Neutral',
        signal: 'NEUTRAL',
        signalLabelTh: 'เป็นกลาง',
        signalReasonTh: '',
        aiScore: 70,
        technicalScore: 70,
        scoreGrade: 'B',
        riskLevel: 'Medium',
        sparkline: [0, 0, 0, 0, 0],
        isWatchlist: true,
        lastUpdated: new Date().toISOString(),
      };

      items.push({
        ...baseTicker,
        symbol,
        name: baseTicker.name || symbol,
        isWatchlist: true,
        watchlistId: row.id,
        targetBuyPrice: row.target_buy_price ? Number(row.target_buy_price) : null,
        targetSellPrice: row.target_sell_price ? Number(row.target_sell_price) : null,
        watchlistNotes: row.notes,
        watchlistPriority: row.priority,
      });
    }

    return {
      items,
      quota: {
        used: rowsRes.rows.length,
        max: maxWatchlists,
      },
    };
  }

  /**
   * Toggle symbol in watchlist for given user
   */
  static async toggleWatchlist(userId: string, rawSymbol: string): Promise<{ symbol: string; isWatchlist: boolean; message: string; quota: { used: number; max: number } }> {
    const symbol = rawSymbol.trim().toUpperCase();

    // Check existing
    const existing = await pool.query(
      'SELECT id FROM public.watchlists WHERE user_id = $1 AND UPPER(symbol) = $2',
      [userId, symbol]
    );

    // Get user quota
    const userRes = await pool.query(
      'SELECT id, role, max_watchlists FROM public.user_profiles WHERE id = $1',
      [userId]
    );
    const maxWatchlists = userRes.rows[0]?.max_watchlists || 15;

    if (existing.rows.length > 0) {
      // Remove
      await pool.query('DELETE FROM public.watchlists WHERE id = $1', [existing.rows[0].id]);
      const countRes = await pool.query('SELECT count(*)::int as c FROM public.watchlists WHERE user_id = $1', [userId]);
      return {
        symbol,
        isWatchlist: false,
        message: `ลบ ${symbol} ออกจากรายการเฝ้าดูของคุณแล้ว`,
        quota: { used: countRes.rows[0].c, max: maxWatchlists },
      };
    } else {
      // Check quota before adding
      const countRes = await pool.query('SELECT count(*)::int as c FROM public.watchlists WHERE user_id = $1', [userId]);
      const currentCount = countRes.rows[0].c;

      if (currentCount >= maxWatchlists) {
        throw new Error(`คุณบันทึกรายการเฝ้าดูครบโควต้าแล้ว (${maxWatchlists} เหรียญ) สมาชิก ${userRes.rows[0]?.role?.toUpperCase() || 'FREE'} บันทึกได้สูงสุด ${maxWatchlists} รายการ กรุณาอัปเกรดระดับสมาชิก`);
      }

      await pool.query(
        'INSERT INTO public.watchlists (user_id, symbol, priority) VALUES ($1, $2, $3)',
        [userId, symbol, currentCount + 1]
      );

      return {
        symbol,
        isWatchlist: true,
        message: `เพิ่ม ${symbol} ในรายการเฝ้าดูของคุณเรียบร้อยแล้ว`,
        quota: { used: currentCount + 1, max: maxWatchlists },
      };
    }
  }

  /**
   * Add or update watchlist coin with target prices and personal notes
   */
  static async saveWatchlistDetails(
    userId: string,
    data: {
      symbol: string;
      targetBuyPrice?: number | null;
      targetSellPrice?: number | null;
      notes?: string | null;
      priority?: number;
    }
  ): Promise<WatchlistRow> {
    const symbol = data.symbol.trim().toUpperCase();

    // Check if exists
    const existing = await pool.query<WatchlistRow>(
      'SELECT * FROM public.watchlists WHERE user_id = $1 AND UPPER(symbol) = $2',
      [userId, symbol]
    );

    if (existing.rows.length > 0) {
      // Update
      const res = await pool.query<WatchlistRow>(
        `UPDATE public.watchlists 
         SET target_buy_price = COALESCE($3, target_buy_price),
             target_sell_price = COALESCE($4, target_sell_price),
             notes = COALESCE($5, notes),
             priority = COALESCE($6, priority),
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [existing.rows[0].id, userId, data.targetBuyPrice ?? null, data.targetSellPrice ?? null, data.notes ?? null, data.priority ?? null]
      );
      return res.rows[0];
    } else {
      // Check quota
      const userRes = await pool.query('SELECT max_watchlists FROM public.user_profiles WHERE id = $1', [userId]);
      const maxWatchlists = userRes.rows[0]?.max_watchlists || 15;
      const countRes = await pool.query('SELECT count(*)::int as c FROM public.watchlists WHERE user_id = $1', [userId]);
      if (countRes.rows[0].c >= maxWatchlists) {
        throw new Error(`คุณบันทึกรายการเฝ้าดูครบโควต้าแล้ว (${maxWatchlists} เหรียญ)`);
      }

      const res = await pool.query<WatchlistRow>(
        `INSERT INTO public.watchlists (user_id, symbol, target_buy_price, target_sell_price, notes, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, symbol, data.targetBuyPrice ?? null, data.targetSellPrice ?? null, data.notes ?? null, data.priority ?? 1]
      );
      return res.rows[0];
    }
  }

  /**
   * Delete specific coin from watchlist
   */
  static async removeCoin(userId: string, rawSymbol: string): Promise<boolean> {
    const symbol = rawSymbol.trim().toUpperCase();
    const res = await pool.query(
      'DELETE FROM public.watchlists WHERE user_id = $1 AND UPPER(symbol) = $2',
      [userId, symbol]
    );
    return (res.rowCount || 0) > 0;
  }
}
