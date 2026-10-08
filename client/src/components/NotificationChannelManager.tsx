// ============================================================================
// Phase 10: Real-Time SSE Streaming & Multi-Channel Notification Manager
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Radio,
  Send,
  ShieldAlert,
  AlertTriangle,
  Scale,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Activity,
  Zap,
  Info,
  ExternalLink
} from 'lucide-react';

export interface NotificationChannel {
  id: string;
  channelType: 'telegram' | 'discord' | 'line' | 'webhook';
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
  channelType: string;
  eventType: string;
  severity: 'INFO' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  status: 'DELIVERED' | 'FAILED' | 'SIMULATED';
  errorMessage?: string;
  sentAt: string;
}

export interface NotificationChannelManagerProps {
  sseConnected: boolean;
  sseStats?: { activeClients: number; totalBroadcasts: number; uptimeSeconds: number };
  onRefreshData?: () => void;
}

export const NotificationChannelManager: React.FC<NotificationChannelManagerProps> = ({
  sseConnected,
  sseStats,
  onRefreshData
}) => {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Channel Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelType, setNewChannelType] = useState<'discord' | 'telegram' | 'webhook'>('discord');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');
  const [newBotToken, setNewBotToken] = useState<string>('');
  const [newChatId, setNewChatId] = useState<string>('');

  const fetchChannelsAndLogs = async () => {
    setIsLoading(true);
    try {
      const [chanRes, logRes] = await Promise.all([
        fetch('/api/stocks/notifications/channels'),
        fetch('/api/stocks/notifications/logs?limit=25')
      ]);

      if (chanRes.ok) {
        const chanJson = await chanRes.json();
        setChannels(chanJson.data || []);
      }
      if (logRes.ok) {
        const logJson = await logRes.json();
        setLogs(logJson.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load notifications data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelsAndLogs();
  }, []);

  const handleTestAlert = async (channelName: string, channelType: string) => {
    setIsTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/stocks/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, channelType })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg({ text: `✅ ส่งข้อความทดสอบไปยัง ${channelName} สำเร็จ!`, type: 'success' });
        await fetchChannelsAndLogs();
        onRefreshData?.();
      } else {
        setStatusMsg({ text: `❌ ส่งข้อความทดสอบล้มเหลว: ${json.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ เกิดข้อผิดพลาด: ${err.message}`, type: 'error' });
    } finally {
      setIsTesting(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch('/api/stocks/notifications/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelType: newChannelType,
          channelName: newChannelName.trim(),
          webhookUrl: newWebhookUrl.trim(),
          botToken: newBotToken.trim(),
          chatId: newChatId.trim(),
          isActive: true,
          subscribedEvents: ['CIRCUIT_BREAKER', 'RED_TEAM_VETO', 'CIO_BUY', 'MACRO_SHOCK']
        })
      });

      if (res.ok) {
        setStatusMsg({ text: `✅ เพิ่มช่องทาง ${newChannelName} เรียบร้อย!`, type: 'success' });
        setShowAddForm(false);
        setNewChannelName('');
        setNewWebhookUrl('');
        setNewBotToken('');
        setNewChatId('');
        await fetchChannelsAndLogs();
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ ไม่สามารถเพิ่มช่องทางได้: ${err.message}`, type: 'error' });
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบช่องทางแจ้งเตือน "${name}"?`)) return;

    try {
      const res = await fetch(`/api/stocks/notifications/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg({ text: `🗑️ ลบช่องทาง ${name} สำเร็จ`, type: 'success' });
        await fetchChannelsAndLogs();
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ เกิดข้อผิดพลาด: ${err.message}`, type: 'error' });
    }
  };

  const handleBroadcastTestTick = async () => {
    try {
      const res = await fetch('/api/stocks/stream/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'market_tick',
          data: {
            symbol: 'NVDA',
            price: 238.50,
            changePercent: 4.15,
            message: 'Live tick stream test via SSE'
          }
        })
      });
      if (res.ok) {
        setStatusMsg({ text: '⚡ กระจายข้อมูล Live Tick ผ่าน SSE เรียบร้อย!', type: 'success' });
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ บรอดแคสต์ล้มเหลว: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner Status */}
      {statusMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: SSE Streaming Telemetry & Multi-Channel Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Card 1: Server-Sent Events (SSE) Live Pipeline */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: 10, borderRadius: 12, color: '#60a5fa' }}>
                <Radio size={22} className={sseConnected ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Server-Sent Events (SSE) Stream
                </h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Real-time Browser Event Channel</span>
              </div>
            </div>
            <span
              style={{
                background: sseConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                color: sseConnected ? '#34d399' : '#facc15',
                border: `1px solid ${sseConnected ? '#10b981' : '#eab308'}`,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {sseConnected ? 'STREAM ACTIVE 🟢' : 'RECONNECTING 🟡'}
            </span>
          </div>

          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            ท่อส่งข้อมูลสตรีมมิ่งทางเดียวความเร็วสูงผ่าน HTTP/SSE (`/api/stocks/stream`) ทำหน้าที่บรอดแคสต์ราคาหุ้นสด, ค่าความผันผวนมหภาค (VIX), และสัญญาณเตือนวิกฤตพอร์ตเข้าสู่เบราว์เซอร์อัตโนมัติ โดยไม่ต้องกดรีเฟรช
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>ACTIVE CLIENTS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                {sseStats?.activeClients ?? 1} เครื่อง
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>BROADCASTS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {sseStats?.totalBroadcasts ?? 0} ครั้ง
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>PING INTERVAL</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa', marginTop: 4 }}>
                15 วินาที
              </div>
            </div>
          </div>

          <button
            onClick={handleBroadcastTestTick}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <Zap size={15} />
            <span>ทดสอบยิง Real-Time Tick ผ่าน SSE</span>
          </button>
        </div>

        {/* Card 2: Notification Gateways Overview */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: 10, borderRadius: 12, color: '#34d399' }}>
                <Bell size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  ช่องทางแจ้งเตือนอัตโนมัติ (Alert Gateways)
                </h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Telegram, Discord & Custom Webhooks</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Plus size={14} />
              <span>{showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มช่องทาง'}</span>
            </button>
          </div>

          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            ส่งสัญญาณเตือนแบบ Multi-Channel ทันทีเมื่อเกิดวิกฤต เช่น Drawdown แตะระดับ Circuit Breaker, ฝ่ายค้าน Red Team สั่ง VETO หรือสภา AI-CIO มีมติเอกฉันท์อนุมัติเข้าซื้อหุ้น Supermajority ($\ge 67\%$)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8' }}>
              <ShieldAlert size={15} color="#ef4444" />
              <span><strong>CRITICAL:</strong> Circuit Breaker L1–L3, Emergency Kill Switch, Red Team VETO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8' }}>
              <Scale size={15} color="#f59e0b" />
              <span><strong>HIGH:</strong> Supreme AI-CIO Supermajority Buy, Macro Volatility Shock (VIX &gt; 25)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8' }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span><strong>INFO:</strong> Paper Trade Order Filled, Daily Morning Briefing Summary</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Channel Modal/Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddChannel}
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
              เพิ่มช่องทางแจ้งเตือนใหม่ (Register Channel)
            </h4>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>รองรับ Discord, Telegram และ HTTP Webhook</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>ประเภทช่องทาง</label>
              <select
                value={newChannelType}
                onChange={(e) => setNewChannelType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: 13
                }}
              >
                <option value="discord">Discord Webhook</option>
                <option value="telegram">Telegram Bot</option>
                <option value="webhook">Custom Webhook (JSON)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>ชื่อช่องทาง / ป้ายกำกับ</label>
              <input
                type="text"
                placeholder="เช่น ห้องวิเคราะห์เทรด VIP"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: 13
                }}
              />
            </div>

            {newChannelType === 'discord' && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Discord Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: 13
                  }}
                />
              </div>
            )}

            {newChannelType === 'telegram' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Telegram Bot Token</label>
                  <input
                    type="password"
                    placeholder="เช่น 123456789:ABCdefGhI..."
                    value={newBotToken}
                    onChange={(e) => setNewBotToken(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Telegram Chat ID</label>
                  <input
                    type="text"
                    placeholder="เช่น -1001234567890"
                    value={newChatId}
                    onChange={(e) => setNewChatId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: 13
                    }}
                  />
                </div>
              </>
            )}

            {newChannelType === 'webhook' && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Endpoint Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://api.my-domain.com/v1/alerts"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: 13
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              บันทึกช่องทาง
            </button>
          </div>
        </form>
      )}

      {/* Active Channels Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="#60a5fa" />
          <span>รายการช่องทางแจ้งเตือนที่เชื่อมต่ออยู่ ({channels.length} ช่องทาง)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {channels.map((chan) => (
            <div
              key={chan.id}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{chan.channelName}</h4>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: chan.channelType === 'discord' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                        color: chan.channelType === 'discord' ? '#a5b4fc' : '#7dd3fc',
                        fontWeight: 600
                      }}
                    >
                      {chan.channelType}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteChannel(chan.id, chan.channelName)}
                    title="ลบช่องทาง"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 4,
                      opacity: 0.7
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                  <strong>เหตุการณ์ที่สมัครรับ:</strong> {chan.subscribedEvents.join(', ')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleTestAlert(chan.channelName, chan.channelType)}
                  disabled={isTesting}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Send size={13} />
                  <span>ส่งข้อความทดสอบ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Delivery Logs */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 20
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="#10b981" />
            <span>สมุดบันทึกประวัติการส่งแจ้งเตือน (Delivery Audit Logs)</span>
          </h3>
          <button
            onClick={fetchChannelsAndLogs}
            disabled={isLoading}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 13 }}>
            ยังไม่มีประวัติการส่งแจ้งเตือนในระบบ
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#e2e8f0' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 12px' }}>เวลาส่ง</th>
                  <th style={{ padding: '10px 12px' }}>ระดับความเสี่ยง</th>
                  <th style={{ padding: '10px 12px' }}>เหตุการณ์ (Event)</th>
                  <th style={{ padding: '10px 12px' }}>ช่องทาง</th>
                  <th style={{ padding: '10px 12px' }}>หัวข้อ & สรุป</th>
                  <th style={{ padding: '10px 12px' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.sentAt).toLocaleTimeString('th-TH')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            log.severity === 'CRITICAL'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : log.severity === 'HIGH'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                          color:
                            log.severity === 'CRITICAL'
                              ? '#f87171'
                              : log.severity === 'HIGH'
                              ? '#fbbf24'
                              : '#60a5fa'
                        }}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{log.eventType}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#cbd5e1' }}>
                      {log.channelType}
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 350 }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.message}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background:
                            log.status === 'DELIVERED'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : log.status === 'FAILED'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(148, 163, 184, 0.2)',
                          color:
                            log.status === 'DELIVERED'
                              ? '#34d399'
                              : log.status === 'FAILED'
                              ? '#f87171'
                              : '#94a3b8'
                        }}
                      >
                        {log.status === 'DELIVERED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
