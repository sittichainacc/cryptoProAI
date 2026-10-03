import { pool } from './db.js';
import { MarketStore } from './store.js';
import { AlertItem } from '../types/index.js';

export interface PriceAlertRow {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: string;
  condition_value: number | string | null;
  description_th: string | null;
  severity: 'info' | 'watch' | 'important' | 'critical';
  status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED';
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export class AlertsService {
  /**
   * Helper to format human-readable relative time
   */
  private static formatTimeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  }

  /**
   * Get all price alerts for user from Supabase PostgreSQL
   */
  static async getUserAlerts(
    userId: string,
    store?: MarketStore
  ): Promise<{ items: AlertItem[]; quota: { used: number; max: number } }> {
    // 1. Get user profile & quota
    const userRes = await pool.query(
      'SELECT id, role, max_alerts FROM public.user_profiles WHERE id = $1',
      [userId]
    );
    const maxAlerts = userRes.rows[0]?.max_alerts || 10;

    // 2. Query alerts
    let rowsRes = await pool.query<PriceAlertRow>(
      'SELECT * FROM public.price_alerts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // If new user and 0 alerts in DB, seed realistic initial alerts for this user
    if (rowsRes.rows.length === 0) {
      const initialAlerts = [
        {
          symbol: 'BTC',
          alert_type: 'Breakout',
          condition_value: 85000,
          description_th: 'BTC จ่อทดสอบแนวต้าน All-Time High $85,000 พร้อม Volume สะสม',
          severity: 'critical' as const,
        },
        {
          symbol: 'ETH',
          alert_type: 'RSI Overbought',
          condition_value: 70,
          description_th: 'ETH เกิดสัญญาณ RSI Divergence ระดับ 4H เตรียมย่อพักฐาน',
          severity: 'important' as const,
        },
        {
          symbol: 'SOL',
          alert_type: 'Price Above',
          condition_value: 120,
          description_th: 'SOL ทะลุแนวต้านจิตวิทยา $120.00 สัญญาณ Bullish Continuation',
          severity: 'watch' as const,
        },
      ];

      for (const a of initialAlerts) {
        await pool.query(
          `INSERT INTO public.price_alerts 
           (user_id, symbol, alert_type, condition_value, description_th, severity, status, is_triggered)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', false)`,
          [userId, a.symbol, a.alert_type, a.condition_value, a.description_th, a.severity]
        );
      }

      rowsRes = await pool.query<PriceAlertRow>(
        'SELECT * FROM public.price_alerts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    }

    // 3. Optional: Check trigger against live store prices
    if (store) {
      for (const row of rowsRes.rows) {
        if (row.status === 'ACTIVE' && !row.is_triggered) {
          const ticker = store.getTicker(row.symbol);
          if (ticker) {
            const condVal = Number(row.condition_value) || 0;
            let triggered = false;

            if (row.alert_type === 'Price Above' && ticker.price >= condVal && condVal > 0) {
              triggered = true;
            } else if (row.alert_type === 'Price Below' && ticker.price <= condVal && condVal > 0) {
              triggered = true;
            } else if (row.alert_type === 'RSI Overbought' && ticker.rsi >= 70) {
              triggered = true;
            }

            if (triggered) {
              await pool.query(
                `UPDATE public.price_alerts 
                 SET status = 'TRIGGERED', is_triggered = true, triggered_at = NOW(), updated_at = NOW() 
                 WHERE id = $1`,
                [row.id]
              );
              row.status = 'TRIGGERED';
              row.is_triggered = true;
              row.triggered_at = new Date().toISOString();
            }
          }
        }
      }
    }

    // 4. Map to AlertItem format
    const items: AlertItem[] = rowsRes.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      alertType: row.alert_type,
      descriptionTh: row.description_th || `${row.symbol} ${row.alert_type}`,
      currentValue: row.condition_value ? String(row.condition_value) : '-',
      severity: row.severity,
      status: row.status === 'TRIGGERED' ? 'triggered' : 'active',
      time: this.formatTimeAgo(row.triggered_at || row.created_at),
    }));

    return {
      items,
      quota: {
        used: rowsRes.rows.length,
        max: maxAlerts,
      },
    };
  }

  /**
   * Create new alert in PostgreSQL for user with quota enforcement
   */
  static async createAlert(
    userId: string,
    data: {
      symbol: string;
      alertType: string;
      conditionValue: number | string;
      descriptionTh?: string;
      severity?: 'info' | 'watch' | 'important' | 'critical';
    }
  ): Promise<AlertItem> {
    const symbol = data.symbol.trim().toUpperCase();

    // Check user quota
    const userRes = await pool.query(
      'SELECT role, max_alerts FROM public.user_profiles WHERE id = $1',
      [userId]
    );
    const maxAlerts = userRes.rows[0]?.max_alerts || 10;

    const countRes = await pool.query<{ c: number }>(
      'SELECT count(*)::int as c FROM public.price_alerts WHERE user_id = $1',
      [userId]
    );
    const currentCount = countRes.rows[0]?.c || 0;

    if (currentCount >= maxAlerts) {
      throw new Error(
        `คุณตั้งการแจ้งเตือนครบโควต้าแล้ว (${maxAlerts} รายการ) สำหรับสมาชิก ${userRes.rows[0]?.role?.toUpperCase() || 'FREE'} กรุณาอัปเกรดระดับสมาชิก`
      );
    }

    const validSeverities = ['info', 'watch', 'important', 'critical'];
    const severity = validSeverities.includes(data.severity || '') ? data.severity! : 'important';
    const conditionValue = data.conditionValue !== undefined && data.conditionValue !== null && data.conditionValue !== ''
      ? Number(data.conditionValue)
      : null;

    const res = await pool.query<PriceAlertRow>(
      `INSERT INTO public.price_alerts 
       (user_id, symbol, alert_type, condition_value, description_th, severity, status, is_triggered)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', false)
       RETURNING *`,
      [
        userId,
        symbol,
        data.alertType,
        conditionValue,
        data.descriptionTh || `${symbol} ${data.alertType} ${data.conditionValue}`,
        severity,
      ]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      symbol: row.symbol,
      alertType: row.alert_type,
      descriptionTh: row.description_th || `${row.symbol} ${row.alert_type}`,
      currentValue: row.condition_value ? String(row.condition_value) : '-',
      severity: row.severity,
      status: 'active',
      time: 'เมื่อสักครู่',
    };
  }

  /**
   * Delete alert from PostgreSQL
   */
  static async deleteAlert(userId: string, alertId: string): Promise<boolean> {
    const res = await pool.query(
      'DELETE FROM public.price_alerts WHERE id = $1 AND user_id = $2',
      [alertId, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Toggle alert status (ACTIVE <-> DISABLED)
   */
  static async toggleAlertStatus(userId: string, alertId: string): Promise<AlertItem | null> {
    const check = await pool.query<PriceAlertRow>(
      'SELECT * FROM public.price_alerts WHERE id = $1 AND user_id = $2',
      [alertId, userId]
    );
    if (check.rows.length === 0) return null;

    const nextStatus = check.rows[0].status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    const update = await pool.query<PriceAlertRow>(
      'UPDATE public.price_alerts SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [nextStatus, alertId, userId]
    );
    const row = update.rows[0];
    return {
      id: row.id,
      symbol: row.symbol,
      alertType: row.alert_type,
      descriptionTh: row.description_th || '',
      currentValue: row.condition_value ? String(row.condition_value) : '-',
      severity: row.severity,
      status: row.status === 'TRIGGERED' ? 'triggered' : 'active',
      time: this.formatTimeAgo(row.created_at),
    };
  }
}
