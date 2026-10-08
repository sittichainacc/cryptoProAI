// ============================================================================
// Multi-Channel Notification Dispatcher Engine (Phase 10)
// ============================================================================

import { pool } from '../../../database/db.js';
import { realtimeSSEService } from '../realtime/realtime_sse.service.js';
import crypto from 'crypto';

export type NotificationChannelType = 'telegram' | 'discord' | 'line' | 'webhook';
export type NotificationSeverity = 'INFO' | 'HIGH' | 'CRITICAL';
export type NotificationDeliveryStatus = 'DELIVERED' | 'FAILED' | 'SIMULATED';

export interface NotificationChannel {
  id: string;
  channelType: NotificationChannelType;
  channelName: string;
  webhookUrl?: string;
  botToken?: string;
  chatId?: string;
  isActive: boolean;
  subscribedEvents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  channelId?: string;
  channelType: NotificationChannelType;
  eventType: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  status: NotificationDeliveryStatus;
  errorMessage?: string;
  sentAt: string;
}

export interface DispatchPayload {
  eventType: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationDispatcherService {
  private inMemoryChannels: Map<string, NotificationChannel> = new Map();
  private inMemoryLogs: NotificationLog[] = [];
  private isDbAvailable: boolean = true;

  constructor() {
    this.seedDefaultChannels();
  }

  private seedDefaultChannels() {
    // Seed default simulated channels for immediate demo and testing
    const defaultDiscord: NotificationChannel = {
      id: 'chan_discord_default',
      channelType: 'discord',
      channelName: 'Institutional Trading Room (Discord)',
      webhookUrl: 'https://discord.com/api/webhooks/mock/institutional-alerts',
      isActive: true,
      subscribedEvents: ['CIRCUIT_BREAKER', 'RED_TEAM_VETO', 'CIO_BUY', 'MACRO_SHOCK'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const defaultTelegram: NotificationChannel = {
      id: 'chan_telegram_default',
      channelType: 'telegram',
      channelName: 'Risk Desk Telegram Alerts',
      botToken: '123456:MOCK_TOKEN_DEMO',
      chatId: '-1001234567890',
      isActive: true,
      subscribedEvents: ['CIRCUIT_BREAKER', 'RED_TEAM_VETO', 'CIO_BUY'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inMemoryChannels.set(defaultDiscord.id, defaultDiscord);
    this.inMemoryChannels.set(defaultTelegram.id, defaultTelegram);
  }

  /**
   * Retrieves all notification channels (from DB with memory fallback)
   */
  public async getChannels(): Promise<NotificationChannel[]> {
    try {
      const res = await pool.query(
        'SELECT * FROM public.notification_channels ORDER BY created_at ASC'
      );
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          channelType: row.channel_type as NotificationChannelType,
          channelName: row.channel_name,
          webhookUrl: row.webhook_url,
          botToken: row.bot_token,
          chatId: row.chat_id,
          isActive: row.is_active,
          subscribedEvents: row.subscribed_events || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }
    } catch {
      this.isDbAvailable = false;
    }

    return Array.from(this.inMemoryChannels.values());
  }

  /**
   * Register or update a notification channel
   */
  public async saveChannel(input: Partial<NotificationChannel>): Promise<NotificationChannel> {
    const id = input.id || `chan_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const channel: NotificationChannel = {
      id,
      channelType: input.channelType || 'webhook',
      channelName: input.channelName || 'Custom Channel',
      webhookUrl: input.webhookUrl || '',
      botToken: input.botToken || '',
      chatId: input.chatId || '',
      isActive: input.isActive !== undefined ? input.isActive : true,
      subscribedEvents: input.subscribedEvents || ['CIRCUIT_BREAKER', 'RED_TEAM_VETO', 'CIO_BUY'],
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.inMemoryChannels.set(id, channel);

    try {
      await pool.query(
        `INSERT INTO public.notification_channels 
         (id, channel_type, channel_name, webhook_url, bot_token, chat_id, is_active, subscribed_events, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO UPDATE SET
           channel_type = EXCLUDED.channel_type,
           channel_name = EXCLUDED.channel_name,
           webhook_url = EXCLUDED.webhook_url,
           bot_token = EXCLUDED.bot_token,
           chat_id = EXCLUDED.chat_id,
           is_active = EXCLUDED.is_active,
           subscribed_events = EXCLUDED.subscribed_events,
           updated_at = NOW()`,
        [
          channel.id,
          channel.channelType,
          channel.channelName,
          channel.webhookUrl,
          channel.botToken,
          channel.chatId,
          channel.isActive,
          channel.subscribedEvents
        ]
      );
    } catch (e: any) {
      console.warn('[NotificationDispatcher] DB saveChannel fallback to memory:', e.message);
    }

    return channel;
  }

  /**
   * Delete a notification channel
   */
  public async deleteChannel(id: string): Promise<boolean> {
    this.inMemoryChannels.delete(id);
    try {
      await pool.query('DELETE FROM public.notification_channels WHERE id = $1', [id]);
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Dispatch payload to all active subscribed channels and SSE stream
   */
  public async dispatch(payload: DispatchPayload): Promise<{ delivered: number; failed: number; channels: string[] }> {
    // 1. Unconditionally broadcast to all SSE clients for real-time browser alerts
    realtimeSSEService.broadcast('notification_alert', {
      eventType: payload.eventType,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      data: payload.data
    });

    const channels = await this.getChannels();
    const activeChannels = channels.filter(c => 
      c.isActive && (c.subscribedEvents.includes(payload.eventType) || c.subscribedEvents.includes('*'))
    );

    let delivered = 0;
    let failed = 0;
    const dispatchedChannelNames: string[] = [];

    for (const channel of activeChannels) {
      try {
        const result = await this.deliverToChannel(channel, payload);
        if (result.success) {
          delivered++;
          dispatchedChannelNames.push(channel.channelName);
          await this.logDelivery(channel, payload, 'DELIVERED');
        } else {
          failed++;
          await this.logDelivery(channel, payload, 'FAILED', result.error);
        }
      } catch (err: any) {
        failed++;
        await this.logDelivery(channel, payload, 'FAILED', err.message);
      }
    }

    return { delivered, failed, channels: dispatchedChannelNames };
  }

  /**
   * Low-level channel delivery adapter
   */
  private async deliverToChannel(channel: NotificationChannel, payload: DispatchPayload): Promise<{ success: boolean; error?: string }> {
    // Check if it's a simulated or mock channel
    const isMock = !channel.webhookUrl || 
                   channel.webhookUrl.includes('mock') || 
                   (channel.channelType === 'telegram' && (!channel.botToken || channel.botToken.includes('MOCK')));

    if (isMock) {
      // Return simulated success
      return { success: true };
    }

    try {
      if (channel.channelType === 'discord' && channel.webhookUrl) {
        const color = payload.severity === 'CRITICAL' ? 0xEF4444 : payload.severity === 'HIGH' ? 0xF59E0B : 0x10B981;
        const res = await fetch(channel.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'CryptoPro AI Risk Terminal',
            embeds: [{
              title: `${payload.severity === 'CRITICAL' ? '🚨' : payload.severity === 'HIGH' ? '⚠️' : 'ℹ️'} ${payload.title}`,
              description: payload.message,
              color,
              timestamp: new Date().toISOString(),
              footer: { text: 'CryptoPro AI Autonomous Risk Engine' }
            }]
          })
        });
        return { success: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
      }

      if (channel.channelType === 'telegram' && channel.botToken && channel.chatId) {
        const emoji = payload.severity === 'CRITICAL' ? '🚨' : payload.severity === 'HIGH' ? '⚠️' : 'ℹ️';
        const text = `${emoji} *${payload.title}*\n\n${payload.message}\n\n_Time: ${new Date().toISOString()}_`;
        const url = `https://api.telegram.org/bot${channel.botToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channel.chatId,
            text,
            parse_mode: 'Markdown'
          })
        });
        return { success: res.ok, error: res.ok ? undefined : `Telegram HTTP ${res.status}` };
      }

      if (channel.channelType === 'webhook' && channel.webhookUrl) {
        const res = await fetch(channel.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return { success: res.ok, error: res.ok ? undefined : `Webhook HTTP ${res.status}` };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Log delivery result into DB and memory
   */
  private async logDelivery(channel: NotificationChannel, payload: DispatchPayload, status: NotificationDeliveryStatus, errorMessage?: string) {
    const log: NotificationLog = {
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      channelId: channel.id,
      channelType: channel.channelType,
      eventType: payload.eventType,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      status,
      errorMessage,
      sentAt: new Date().toISOString()
    };

    this.inMemoryLogs.unshift(log);
    if (this.inMemoryLogs.length > 100) this.inMemoryLogs.pop();

    try {
      await pool.query(
        `INSERT INTO public.notification_logs 
         (id, channel_id, channel_type, event_type, severity, title, message, status, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [log.id, log.channelId, log.channelType, log.eventType, log.severity, log.title, log.message, log.status, log.errorMessage]
      );
    } catch {}
  }

  /**
   * Fetch recent audit delivery logs
   */
  public async getLogs(limit: number = 30): Promise<NotificationLog[]> {
    try {
      const res = await pool.query(
        'SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT $1',
        [limit]
      );
      if (res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          channelId: row.channel_id,
          channelType: row.channel_type,
          eventType: row.event_type,
          severity: row.severity,
          title: row.title,
          message: row.message,
          status: row.status,
          errorMessage: row.error_message,
          sentAt: row.sent_at
        }));
      }
    } catch {}

    return this.inMemoryLogs.slice(0, limit);
  }

  // --- Specialized High-Level Event Senders ---

  public async notifyCircuitBreaker(level: number, drawdownPct: number, action: string) {
    return this.dispatch({
      eventType: 'CIRCUIT_BREAKER',
      severity: level === 3 ? 'CRITICAL' : 'HIGH',
      title: `Circuit Breaker Level ${level} Triggered (-${(drawdownPct * 100).toFixed(2)}%)`,
      message: `🚨 การควบคุมความเสี่ยงพอร์ตทำงาน: Drawdown แตะ ${(drawdownPct * 100).toFixed(2)}% | การดำเนินการ: ${action}`,
      data: { level, drawdownPct, action }
    });
  }

  public async notifyRedTeamVeto(ticker: string, mScore: number, reasons: string[]) {
    return this.dispatch({
      eventType: 'RED_TEAM_VETO',
      severity: 'CRITICAL',
      title: `RED TEAM VETO ACTIVATED: ${ticker}`,
      message: `🛑 ทีมตรวจสอบฝ่ายค้านสั่งยับยั้งการซื้อหุ้น ${ticker} อย่างเด็ดขาด (Beneish M-Score: ${mScore.toFixed(2)}) | เหตุผล: ${reasons.slice(0, 2).join(', ')}`,
      data: { ticker, mScore, reasons }
    });
  }

  public async notifyCIOApproval(ticker: string, action: string, confidencePct: number, targetPrice?: number) {
    return this.dispatch({
      eventType: 'CIO_BUY',
      severity: 'HIGH',
      title: `Supreme AI-CIO Consensus: ${action} ${ticker}`,
      message: `🏛️ มติสภา 41 AI Agents อนุมัติ ${action} หุ้น ${ticker} ด้วยความเชื่อมั่น ${confidencePct.toFixed(1)}% | ราคาเป้าหมาย: $${targetPrice?.toFixed(2) || 'N/A'}`,
      data: { ticker, action, confidencePct, targetPrice }
    });
  }

  public async notifyMacroShock(metric: string, value: number, baseline: number) {
    return this.dispatch({
      eventType: 'MACRO_SHOCK',
      severity: 'HIGH',
      title: `Macro Volatility Surge: ${metric}`,
      message: `⚡ ตรวจพบการพุ่งขึ้นผิดปกติของตัวชี้วัดมหภาค ${metric}: ปัจจุบัน ${value.toFixed(2)} (เกณฑ์อ้างอิง: ${baseline.toFixed(2)})`,
      data: { metric, value, baseline }
    });
  }
}

// Global Singleton Instance
export const notificationDispatcher = new NotificationDispatcherService();
