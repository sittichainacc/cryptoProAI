import { pool } from './db.js';

export interface UserSettingsRow {
  id: string;
  user_id: string;
  default_currency: 'THB' | 'USDT';
  default_timeframe: string;
  default_risk_pct: number | string;
  language: 'th' | 'en';
  sound_enabled: boolean;
  theme: 'dark' | 'light';
  bitkub_api_key?: string | null;
  bitkub_api_secret?: string | null;
  binance_api_key?: string | null;
  binance_api_secret?: string | null;
  line_notify_token?: string | null;
  telegram_chat_id?: string | null;
  telegram_bot_token?: string | null;
  notify_whale_alerts: boolean;
  notify_price_alerts: boolean;
  notify_buy_signals: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientSafeUserSettings {
  id: string;
  userId: string;
  defaultCurrency: 'THB' | 'USDT';
  defaultTimeframe: string;
  defaultRiskPct: number;
  language: 'th' | 'en';
  soundEnabled: boolean;
  theme: 'dark' | 'light';
  bitkubApiKey: string;
  bitkubApiSecretMasked: string;
  hasBitkubSecret: boolean;
  binanceApiKey: string;
  binanceApiSecretMasked: string;
  hasBinanceSecret: boolean;
  lineNotifyTokenMasked: string;
  hasLineNotifyToken: boolean;
  telegramChatId: string;
  telegramBotTokenMasked: string;
  hasTelegramBotToken: boolean;
  notifyWhaleAlerts: boolean;
  notifyPriceAlerts: boolean;
  notifyBuySignals: boolean;
  updatedAt: string;
}

function maskSecret(val?: string | null): string {
  if (!val || val.length === 0) return '';
  if (val.length <= 8) return '••••••••';
  const last4 = val.slice(-4);
  return '••••••••••••••••' + last4;
}

export class SettingsService {
  /**
   * Transform DB Row to Client Safe format
   */
  private static toSafeSettings(row: UserSettingsRow): ClientSafeUserSettings {
    return {
      id: row.id,
      userId: row.user_id,
      defaultCurrency: row.default_currency || 'THB',
      defaultTimeframe: row.default_timeframe || '1D',
      defaultRiskPct: Number(row.default_risk_pct) || 2.0,
      language: row.language || 'th',
      soundEnabled: row.sound_enabled ?? true,
      theme: row.theme || 'dark',
      bitkubApiKey: row.bitkub_api_key || '',
      bitkubApiSecretMasked: maskSecret(row.bitkub_api_secret),
      hasBitkubSecret: !!(row.bitkub_api_secret && row.bitkub_api_secret.trim().length > 0),
      binanceApiKey: row.binance_api_key || '',
      binanceApiSecretMasked: maskSecret(row.binance_api_secret),
      hasBinanceSecret: !!(row.binance_api_secret && row.binance_api_secret.trim().length > 0),
      lineNotifyTokenMasked: maskSecret(row.line_notify_token),
      hasLineNotifyToken: !!(row.line_notify_token && row.line_notify_token.trim().length > 0),
      telegramChatId: row.telegram_chat_id || '',
      telegramBotTokenMasked: maskSecret(row.telegram_bot_token),
      hasTelegramBotToken: !!(row.telegram_bot_token && row.telegram_bot_token.trim().length > 0),
      notifyWhaleAlerts: row.notify_whale_alerts ?? true,
      notifyPriceAlerts: row.notify_price_alerts ?? true,
      notifyBuySignals: row.notify_buy_signals ?? true,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get user settings (or create default row in PostgreSQL if not found)
   */
  static async getUserSettings(userId: string): Promise<ClientSafeUserSettings> {
    let res = await pool.query<UserSettingsRow>(
      'SELECT * FROM public.user_settings WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (res.rows.length === 0) {
      // Auto seed default settings row
      const insertRes = await pool.query<UserSettingsRow>(
        `INSERT INTO public.user_settings (
          user_id, default_currency, default_timeframe, default_risk_pct, language, sound_enabled, theme,
          notify_whale_alerts, notify_price_alerts, notify_buy_signals
         ) VALUES ($1, 'THB', '1D', 2.00, 'th', true, 'dark', true, true, true)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING *`,
        [userId]
      );
      if (insertRes.rows.length > 0) {
        return this.toSafeSettings(insertRes.rows[0]);
      }
      res = await pool.query<UserSettingsRow>(
        'SELECT * FROM public.user_settings WHERE user_id = $1 LIMIT 1',
        [userId]
      );
    }

    return this.toSafeSettings(res.rows[0]);
  }

  /**
   * Update user settings in PostgreSQL
   */
  static async updateUserSettings(userId: string, payload: any): Promise<ClientSafeUserSettings> {
    // 1. Fetch current settings
    const currentRes = await pool.query<UserSettingsRow>(
      'SELECT * FROM public.user_settings WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    const current = currentRes.rows[0];

    const defaultCurrency = payload.defaultCurrency || payload.currency || current?.default_currency || 'THB';
    const defaultTimeframe = payload.defaultTimeframe || payload.defaultTf || current?.default_timeframe || '1D';
    const defaultRiskPct = payload.defaultRiskPct !== undefined ? Number(payload.defaultRiskPct) : (current?.default_risk_pct ? Number(current.default_risk_pct) : 2.0);
    const language = payload.language || current?.language || 'th';
    const soundEnabled = payload.soundEnabled !== undefined ? Boolean(payload.soundEnabled) : (current?.sound_enabled ?? true);
    const theme = payload.theme || current?.theme || 'dark';

    // API Keys & Secrets (ignore if client sends masked string containing '••••')
    let bitkubKey = payload.bitkubApiKey !== undefined ? payload.bitkubApiKey : (payload.bitkubKey !== undefined ? payload.bitkubKey : current?.bitkub_api_key);
    let bitkubSecret = current?.bitkub_api_secret;
    const incomingBkSecret = payload.bitkubApiSecret ?? payload.bitkubSecret;
    if (incomingBkSecret && !incomingBkSecret.includes('••••')) {
      bitkubSecret = incomingBkSecret;
    }

    let binanceKey = payload.binanceApiKey !== undefined ? payload.binanceApiKey : (payload.binanceKey !== undefined ? payload.binanceKey : current?.binance_api_key);
    let binanceSecret = current?.binance_api_secret;
    const incomingBnSecret = payload.binanceApiSecret ?? payload.binanceSecret;
    if (incomingBnSecret && !incomingBnSecret.includes('••••')) {
      binanceSecret = incomingBnSecret;
    }

    // Notifications
    let lineToken = current?.line_notify_token;
    if (payload.lineNotifyToken && !payload.lineNotifyToken.includes('••••')) {
      lineToken = payload.lineNotifyToken;
    }
    const telegramChatId = payload.telegramChatId !== undefined ? payload.telegramChatId : current?.telegram_chat_id;
    let telegramBotToken = current?.telegram_bot_token;
    if (payload.telegramBotToken && !payload.telegramBotToken.includes('••••')) {
      telegramBotToken = payload.telegramBotToken;
    }

    const notifyWhale = payload.notifyWhaleAlerts !== undefined ? Boolean(payload.notifyWhaleAlerts) : (current?.notify_whale_alerts ?? true);
    const notifyPrice = payload.notifyPriceAlerts !== undefined ? Boolean(payload.notifyPriceAlerts) : (current?.notify_price_alerts ?? true);
    const notifyBuy = payload.notifyBuySignals !== undefined ? Boolean(payload.notifyBuySignals) : (current?.notify_buy_signals ?? true);

    const updateRes = await pool.query<UserSettingsRow>(
      `INSERT INTO public.user_settings (
        user_id, default_currency, default_timeframe, default_risk_pct, language, sound_enabled, theme,
        bitkub_api_key, bitkub_api_secret, binance_api_key, binance_api_secret,
        line_notify_token, telegram_chat_id, telegram_bot_token,
        notify_whale_alerts, notify_price_alerts, notify_buy_signals, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
       ON CONFLICT (user_id) DO UPDATE
        SET default_currency = EXCLUDED.default_currency,
            default_timeframe = EXCLUDED.default_timeframe,
            default_risk_pct = EXCLUDED.default_risk_pct,
            language = EXCLUDED.language,
            sound_enabled = EXCLUDED.sound_enabled,
            theme = EXCLUDED.theme,
            bitkub_api_key = EXCLUDED.bitkub_api_key,
            bitkub_api_secret = EXCLUDED.bitkub_api_secret,
            binance_api_key = EXCLUDED.binance_api_key,
            binance_api_secret = EXCLUDED.binance_api_secret,
            line_notify_token = EXCLUDED.line_notify_token,
            telegram_chat_id = EXCLUDED.telegram_chat_id,
            telegram_bot_token = EXCLUDED.telegram_bot_token,
            notify_whale_alerts = EXCLUDED.notify_whale_alerts,
            notify_price_alerts = EXCLUDED.notify_price_alerts,
            notify_buy_signals = EXCLUDED.notify_buy_signals,
            updated_at = NOW()
       RETURNING *`,
      [
        userId, defaultCurrency, defaultTimeframe, defaultRiskPct, language, soundEnabled, theme,
        bitkubKey, bitkubSecret, binanceKey, binanceSecret,
        lineToken, telegramChatId, telegramBotToken,
        notifyWhale, notifyPrice, notifyBuy
      ]
    );

    return this.toSafeSettings(updateRes.rows[0]);
  }

  /**
   * Test Exchange API Connection (Bitkub / Binance)
   */
  static async testConnection(exchange: 'bitkub' | 'binance'): Promise<{
    exchange: string;
    status: 'online' | 'error' | 'timeout';
    latencyMs: number;
    message: string;
    timestamp: string;
  }> {
    const start = Date.now();
    try {
      if (exchange === 'bitkub') {
        const resp = await fetch('https://api.bitkub.com/api/servertime', { signal: AbortSignal.timeout(6000) });
        const latency = Date.now() - start;
        if (resp.ok) {
          return {
            exchange: 'bitkub',
            status: 'online',
            latencyMs: latency,
            message: `เชื่อมต่อกับ Bitkub API สำเร็จ (${latency} ms)`,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          exchange: 'bitkub',
          status: 'error',
          latencyMs: latency,
          message: `Bitkub API ตอบสนองด้วย HTTP ${resp.status}`,
          timestamp: new Date().toISOString(),
        };
      } else {
        const resp = await fetch('https://api.binance.com/api/v3/ping', { signal: AbortSignal.timeout(6000) });
        const latency = Date.now() - start;
        if (resp.ok) {
          return {
            exchange: 'binance',
            status: 'online',
            latencyMs: latency,
            message: `เชื่อมต่อกับ Binance API สำเร็จ (${latency} ms)`,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          exchange: 'binance',
          status: 'error',
          latencyMs: latency,
          message: `Binance API ตอบสนองด้วย HTTP ${resp.status}`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      const latency = Date.now() - start;
      return {
        exchange,
        status: 'error',
        latencyMs: latency,
        message: `ข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
