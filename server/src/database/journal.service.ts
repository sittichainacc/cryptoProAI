import { pool } from './db.js';

export interface TradingJournalItem {
  id: string;
  userId: string;
  tradeDate: string;
  title: string;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE' | string;
  dailySummaryTh: string;
  lessonsLearned: string;
  winTrades: number;
  lossTrades: number;
  netPnl: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPerformanceReport {
  userId: string;
  userRole: string;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winTrades: number;
  lossTrades: number;
  winRatePct: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalPnl: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  journalCount: number;
  recentJournals: TradingJournalItem[];
  performanceBySymbol: {
    symbol: string;
    tradesCount: number;
    realizedPnl: number;
    winRatePct: number;
  }[];
}

export class JournalService {
  /**
   * Seed initial starter journal entry if user has none
   */
  private async seedStarterJournal(userId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const sql = `
      INSERT INTO public.trading_journals 
      (user_id, trade_date, title, market_sentiment, daily_summary_th, lessons_learned, win_trades, loss_trades, net_pnl, created_at, updated_at)
      VALUES 
      ($1, $2, 'บันทึกการเทรดแรก: วางแผนการเข้าซื้อสะสม Core Assets', 'BULLISH', 'ตลาดคริปโตเริ่มมีสัญญาณ Breakout ตามแนวโน้มขาขึ้นของบิตคอยน์ ทำการเปิดสถานะสะสม BTC และ SOL ตามสัญญาณ AI Gold Signal ควบคุมความเสี่ยงไม่เกิน 2% ต่อไม้', 'การรอจังหวะ Re-test แนวรับช่วยลด Drawdown ได้อย่างมีประสิทธิภาพ และหลีกเลี่ยงการไล่ราคาช่วง FOMO', 1, 0, 520.50, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
    `;
    await pool.query(sql, [userId, today]);
  }

  /**
   * Get all journals for user
   */
  async getJournals(userId: string): Promise<TradingJournalItem[]> {
    const countCheck = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM public.trading_journals WHERE user_id = $1`,
      [userId]
    );

    if (parseInt(countCheck.rows[0]?.count || '0', 10) === 0) {
      await this.seedStarterJournal(userId);
    }

    const res = await pool.query(
      `SELECT * FROM public.trading_journals WHERE user_id = $1 ORDER BY trade_date DESC, created_at DESC`,
      [userId]
    );

    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      tradeDate: r.trade_date ? new Date(r.trade_date).toISOString().slice(0, 10) : '',
      title: r.title,
      marketSentiment: r.market_sentiment || 'NEUTRAL',
      dailySummaryTh: r.daily_summary_th || '',
      lessonsLearned: r.lessons_learned || '',
      winTrades: r.win_trades ?? 0,
      lossTrades: r.loss_trades ?? 0,
      netPnl: parseFloat(r.net_pnl) || 0,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  /**
   * Create new trading journal entry
   */
  async createJournal(
    userId: string,
    data: {
      title: string;
      tradeDate?: string;
      marketSentiment?: string;
      dailySummaryTh?: string;
      lessonsLearned?: string;
      winTrades?: number;
      lossTrades?: number;
      netPnl?: number;
    }
  ): Promise<TradingJournalItem> {
    if (!data.title || !data.title.trim()) {
      throw new Error('กรุณาระบุหัวข้อบันทึก (Title)');
    }

    const tradeDate = data.tradeDate || new Date().toISOString().slice(0, 10);
    const marketSentiment = data.marketSentiment || 'NEUTRAL';
    const dailySummaryTh = data.dailySummaryTh || '';
    const lessonsLearned = data.lessonsLearned || '';
    const winTrades = Number(data.winTrades || 0);
    const lossTrades = Number(data.lossTrades || 0);
    const netPnl = Number(data.netPnl || 0);

    const res = await pool.query(
      `INSERT INTO public.trading_journals
       (user_id, trade_date, title, market_sentiment, daily_summary_th, lessons_learned, win_trades, loss_trades, net_pnl, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        tradeDate,
        data.title.trim(),
        marketSentiment,
        dailySummaryTh,
        lessonsLearned,
        winTrades,
        lossTrades,
        netPnl,
      ]
    );

    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      tradeDate: r.trade_date ? new Date(r.trade_date).toISOString().slice(0, 10) : tradeDate,
      title: r.title,
      marketSentiment: r.market_sentiment,
      dailySummaryTh: r.daily_summary_th,
      lessonsLearned: r.lessons_learned,
      winTrades: r.win_trades,
      lossTrades: r.loss_trades,
      netPnl: parseFloat(r.net_pnl),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  /**
   * Update an existing journal entry
   */
  async updateJournal(
    userId: string,
    id: string,
    data: {
      title?: string;
      tradeDate?: string;
      marketSentiment?: string;
      dailySummaryTh?: string;
      lessonsLearned?: string;
      winTrades?: number;
      lossTrades?: number;
      netPnl?: number;
    }
  ): Promise<TradingJournalItem> {
    const res = await pool.query(
      `UPDATE public.trading_journals
       SET title = COALESCE($1, title),
           trade_date = COALESCE($2, trade_date),
           market_sentiment = COALESCE($3, market_sentiment),
           daily_summary_th = COALESCE($4, daily_summary_th),
           lessons_learned = COALESCE($5, lessons_learned),
           win_trades = COALESCE($6, win_trades),
           loss_trades = COALESCE($7, loss_trades),
           net_pnl = COALESCE($8, net_pnl),
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        data.title?.trim() ?? null,
        data.tradeDate ?? null,
        data.marketSentiment ?? null,
        data.dailySummaryTh ?? null,
        data.lessonsLearned ?? null,
        data.winTrades !== undefined ? Number(data.winTrades) : null,
        data.lossTrades !== undefined ? Number(data.lossTrades) : null,
        data.netPnl !== undefined ? Number(data.netPnl) : null,
        id,
        userId,
      ]
    );

    if (res.rows.length === 0) {
      throw new Error('ไม่พบบันทึกที่ต้องการแก้ไข');
    }

    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      tradeDate: r.trade_date ? new Date(r.trade_date).toISOString().slice(0, 10) : '',
      title: r.title,
      marketSentiment: r.market_sentiment,
      dailySummaryTh: r.daily_summary_th,
      lessonsLearned: r.lessons_learned,
      winTrades: r.win_trades,
      lossTrades: r.loss_trades,
      netPnl: parseFloat(r.net_pnl),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  /**
   * Delete journal entry
   */
  async deleteJournal(userId: string, id: string): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM public.trading_journals WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Get aggregate performance report from both paper trades and journals
   */
  async getUserPerformanceReport(userId: string): Promise<UserPerformanceReport> {
    // 1. Get user role
    const userProfileRes = await pool.query<{ role: string }>(
      `SELECT role FROM public.user_profiles WHERE id = $1`,
      [userId]
    );
    const userRole = userProfileRes.rows[0]?.role || 'free';

    // 2. Query paper trades
    const tradesRes = await pool.query(
      `SELECT * FROM public.paper_trades WHERE user_id = $1 ORDER BY opened_at DESC`,
      [userId]
    );

    const trades = tradesRes.rows;
    const openTrades = trades.filter((t) => t.status === 'OPEN');
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');

    let totalRealizedPnl = 0;
    let winTrades = 0;
    let lossTrades = 0;
    let grossWin = 0;
    let grossLoss = 0;
    let largestWin = 0;
    let largestLoss = 0;

    const symbolStats = new Map<
      string,
      { tradesCount: number; realizedPnl: number; winCount: number }
    >();

    for (const t of closedTrades) {
      const pnl = parseFloat(t.realized_pnl) || 0;
      totalRealizedPnl += pnl;

      if (pnl > 0) {
        winTrades++;
        grossWin += pnl;
        if (pnl > largestWin) largestWin = pnl;
      } else if (pnl < 0) {
        lossTrades++;
        grossLoss += Math.abs(pnl);
        if (pnl < largestLoss) largestLoss = pnl;
      }

      // Group by symbol
      const current = symbolStats.get(t.symbol) || { tradesCount: 0, realizedPnl: 0, winCount: 0 };
      current.tradesCount++;
      current.realizedPnl += pnl;
      if (pnl > 0) current.winCount++;
      symbolStats.set(t.symbol, current);
    }

    const winRatePct =
      closedTrades.length > 0 ? Number(((winTrades / closedTrades.length) * 100).toFixed(1)) : 100;
    const profitFactor =
      grossLoss > 0 ? Number((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 9.99 : 0;
    const avgWin = winTrades > 0 ? Number((grossWin / winTrades).toFixed(2)) : 0;
    const avgLoss = lossTrades > 0 ? Number((grossLoss / lossTrades).toFixed(2)) : 0;

    // 3. Get recent journals
    const journals = await this.getJournals(userId);

    const performanceBySymbol = Array.from(symbolStats.entries()).map(([symbol, stat]) => ({
      symbol,
      tradesCount: stat.tradesCount,
      realizedPnl: Number(stat.realizedPnl.toFixed(2)),
      winRatePct:
        stat.tradesCount > 0 ? Number(((stat.winCount / stat.tradesCount) * 100).toFixed(1)) : 0,
    }));

    return {
      userId,
      userRole,
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winTrades,
      lossTrades,
      winRatePct,
      totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
      totalUnrealizedPnl: 0,
      totalPnl: Number(totalRealizedPnl.toFixed(2)),
      profitFactor,
      largestWin: Number(largestWin.toFixed(2)),
      largestLoss: Number(largestLoss.toFixed(2)),
      avgWin,
      avgLoss,
      journalCount: journals.length,
      recentJournals: journals.slice(0, 5),
      performanceBySymbol,
    };
  }
}

export const journalService = new JournalService();
