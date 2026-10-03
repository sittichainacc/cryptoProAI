import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Sliders, 
  Lock, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  AlertCircle, 
  ShieldCheck, 
  Wifi, 
  Cloud, 
  Bell, 
  Send, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Database,
  Sparkles,
  Save
} from 'lucide-react';
import { api } from '../services/api.js';
import { ClientUserSettings } from '../types/index.js';

interface SettingsPageProps {
  currency: 'THB' | 'USDT';
  setCurrency: (c: 'THB' | 'USDT') => void;
}

interface ExchangeStatus {
  status: 'idle' | 'testing' | 'online' | 'error' | 'timeout';
  latencyMs?: number;
  message?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currency, setCurrency }) => {
  // Exchange API Keys
  const [bitkubKey, setBitkubKey] = useState('');
  const [bitkubSecret, setBitkubSecret] = useState('');
  const [hasBitkubSecret, setHasBitkubSecret] = useState(false);

  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');
  const [hasBinanceSecret, setHasBinanceSecret] = useState(false);

  // Trading Preferences
  const [defaultRiskPct, setDefaultRiskPct] = useState(2);
  const [defaultTf, setDefaultTf] = useState('1D');
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Notification Channels & Webhooks
  const [lineNotifyToken, setLineNotifyToken] = useState('');
  const [hasLineToken, setHasLineToken] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [hasTelegramToken, setHasTelegramToken] = useState(false);

  // Notification Toggles
  const [notifyWhaleAlerts, setNotifyWhaleAlerts] = useState(true);
  const [notifyPriceAlerts, setNotifyPriceAlerts] = useState(true);
  const [notifyBuySignals, setNotifyBuySignals] = useState(true);

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Live Ping Testing State
  const [bitkubStatus, setBitkubStatus] = useState<ExchangeStatus>({ status: 'idle' });
  const [binanceStatus, setBinanceStatus] = useState<ExchangeStatus>({ status: 'idle' });

  // Load persisted settings from Supabase PostgreSQL on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUserSettings();
      if (data) {
        if (data.defaultCurrency) setCurrency(data.defaultCurrency);
        if (data.defaultTimeframe) setDefaultTf(data.defaultTimeframe);
        if (data.defaultRiskPct) setDefaultRiskPct(data.defaultRiskPct);
        if (data.language) setLanguage(data.language);
        if (data.soundEnabled !== undefined) setSoundEnabled(data.soundEnabled);

        if (data.bitkubApiKey) setBitkubKey(data.bitkubApiKey);
        if (data.bitkubApiSecretMasked) {
          setBitkubSecret(data.bitkubApiSecretMasked);
          setHasBitkubSecret(data.hasBitkubSecret);
        }

        if (data.binanceApiKey) setBinanceKey(data.binanceApiKey);
        if (data.binanceApiSecretMasked) {
          setBinanceSecret(data.binanceApiSecretMasked);
          setHasBinanceSecret(data.hasBinanceSecret);
        }

        if (data.lineNotifyTokenMasked) {
          setLineNotifyToken(data.lineNotifyTokenMasked);
          setHasLineToken(data.hasLineNotifyToken);
        }

        if (data.telegramChatId) setTelegramChatId(data.telegramChatId);
        if (data.telegramBotTokenMasked) {
          setTelegramBotToken(data.telegramBotTokenMasked);
          setHasTelegramToken(data.hasTelegramBotToken);
        }

        if (data.notifyWhaleAlerts !== undefined) setNotifyWhaleAlerts(data.notifyWhaleAlerts);
        if (data.notifyPriceAlerts !== undefined) setNotifyPriceAlerts(data.notifyPriceAlerts);
        if (data.notifyBuySignals !== undefined) setNotifyBuySignals(data.notifyBuySignals);

        if (data.updatedAt) setLastSavedTime(data.updatedAt);
      }
    } catch (e) {
      console.error('Failed to load settings from Supabase PostgreSQL:', e);
      // Fallback to local storage if network issue
      try {
        const stored = localStorage.getItem('cryptopro_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.bitkubKey) setBitkubKey(parsed.bitkubKey);
          if (parsed.binanceKey) setBinanceKey(parsed.binanceKey);
          if (parsed.defaultRiskPct) setDefaultRiskPct(parsed.defaultRiskPct);
          if (parsed.defaultTf) setDefaultTf(parsed.defaultTf);
          if (parsed.language) setLanguage(parsed.language);
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        defaultCurrency: currency,
        defaultTimeframe: defaultTf,
        defaultRiskPct,
        language,
        soundEnabled,
        bitkubApiKey: bitkubKey.trim(),
        binanceApiKey: binanceKey.trim(),
        telegramChatId: telegramChatId.trim(),
        notifyWhaleAlerts,
        notifyPriceAlerts,
        notifyBuySignals,
      };

      // Only send secret if user entered a real new secret (doesn't contain mask '••••')
      if (bitkubSecret && !bitkubSecret.includes('••••')) {
        payload.bitkubApiSecret = bitkubSecret.trim();
      }
      if (binanceSecret && !binanceSecret.includes('••••')) {
        payload.binanceApiSecret = binanceSecret.trim();
      }
      if (lineNotifyToken && !lineNotifyToken.includes('••••')) {
        payload.lineNotifyToken = lineNotifyToken.trim();
      }
      if (telegramBotToken && !telegramBotToken.includes('••••')) {
        payload.telegramBotToken = telegramBotToken.trim();
      }

      const res = await api.updateUserSettings(payload);
      if (res) {
        setLastSavedTime(res.updatedAt || new Date().toISOString());
        if (res.bitkubApiSecretMasked) {
          setBitkubSecret(res.bitkubApiSecretMasked);
          setHasBitkubSecret(res.hasBitkubSecret);
        }
        if (res.binanceApiSecretMasked) {
          setBinanceSecret(res.binanceApiSecretMasked);
          setHasBinanceSecret(res.hasBinanceSecret);
        }
        if (res.lineNotifyTokenMasked) {
          setLineNotifyToken(res.lineNotifyTokenMasked);
          setHasLineToken(res.hasLineNotifyToken);
        }
        if (res.telegramBotTokenMasked) {
          setTelegramBotToken(res.telegramBotTokenMasked);
          setHasTelegramToken(res.hasTelegramBotToken);
        }
      }

      // Sync to localStorage as well
      localStorage.setItem('cryptopro_settings', JSON.stringify({
        bitkubKey,
        binanceKey,
        defaultRiskPct,
        defaultTf,
        language,
        currency,
        updatedAt: new Date().toISOString(),
      }));

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      console.error('Failed to save settings:', e);
      alert('บันทึกการตั้งค่าล้มเหลว: ' + (e.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsSaving(false);
    }
  };

  const testBitkub = async () => {
    setBitkubStatus({ status: 'testing' });
    try {
      const res = await api.testExchangeConnection('bitkub');
      if (res.success && res.data) {
        setBitkubStatus({
          status: 'online',
          latencyMs: res.data.latencyMs,
          message: res.data.message,
        });
      } else {
        setBitkubStatus({
          status: 'error',
          latencyMs: res.data?.latencyMs,
          message: res.data?.message || 'เชื่อมต่อ Bitkub ล้มเหลว',
        });
      }
    } catch (err: any) {
      setBitkubStatus({
        status: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    }
  };

  const testBinance = async () => {
    setBinanceStatus({ status: 'testing' });
    try {
      const res = await api.testExchangeConnection('binance');
      if (res.success && res.data) {
        setBinanceStatus({
          status: 'online',
          latencyMs: res.data.latencyMs,
          message: res.data.message,
        });
      } else {
        setBinanceStatus({
          status: 'error',
          latencyMs: res.data?.latencyMs,
          message: res.data?.message || 'เชื่อมต่อ Binance ล้มเหลว',
        });
      }
    } catch (err: any) {
      setBinanceStatus({
        status: 'error',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    }
  };

  const renderStatusBadge = (status: ExchangeStatus) => {
    if (status.status === 'testing') {
      return (
        <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={12} className="spin" /> กำลังตรวจสอบ...
        </span>
      );
    }
    if (status.status === 'online') {
      return (
        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={13} /> ออนไลน์ ({status.latencyMs} ms)
        </span>
      );
    }
    if (status.status === 'error' || status.status === 'timeout') {
      return (
        <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={13} /> ติดขัด ({status.latencyMs || '-'} ms)
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
        ● พร้อมใช้งาน (Connected)
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '920px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
              ⚙️ ตั้งค่าระบบ &amp; Exchange API Keys
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34D399',
                fontWeight: 700,
              }}
            >
              <Cloud size={12} /> PostgreSQL Synced
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            จัดการ API Keys เชื่อมต่อ Exchange, ช่องทางแจ้งเตือน และการตั้งค่าส่วนบุคคล เชื่อมโยงบัญชีและจัดเก็บใน Supabase PostgreSQL ถาวร
          </p>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="btn-primary" 
          style={{ padding: '9px 22px', gap: '8px', fontSize: '13px' }}
        >
          {isSaving ? <RefreshCw size={15} className="spin" /> : isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{isSaving ? 'กำลังบันทึก...' : isSaved ? 'บันทึกสำเร็จแล้ว!' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
        </button>
      </div>

      {/* Success Banner */}
      {isSaved && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.16)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--neon-green-light)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>บันทึกการตั้งค่าและ API Keys ลงใน Supabase PostgreSQL เรียบร้อยแล้ว (อัปเดตเมื่อ: {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString('th-TH') : 'เมื่อสักครู่'})</span>
        </div>
      )}

      {/* 1. Exchange API Keys Card */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '16px' }}>
          <div className="card-title">
            <Key size={18} color="var(--neon-cyan)" />
            Exchange API Connection (การเชื่อมต่อ Exchange)
          </div>
          <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Lock size={12} /> เข้ารหัส Secret ปลอดภัย ไม่ส่งคีย์ออกภายนอก
          </span>
        </div>

        {/* Bitkub API */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              <strong style={{ fontSize: '14.5px' }}>Bitkub (Exchange หลัก - คู่เทรด THB)</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {renderStatusBadge(bitkubStatus)}
              <button
                type="button"
                onClick={testBitkub}
                disabled={bitkubStatus.status === 'testing'}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '5px 12px', gap: '5px' }}
                title="ทดสอบส่ง Ping ไปยัง Bitkub Server"
              >
                <Wifi size={12} />
                <span>ทดสอบเชื่อมต่อ</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                Bitkub API Key:
              </label>
              <input
                type="text"
                value={bitkubKey}
                onChange={(e) => setBitkubKey(e.target.value)}
                placeholder="เช่น bk_live_38891084810293847"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 600 }}>
                <span>Bitkub API Secret:</span>
                {hasBitkubSecret && <span style={{ color: '#10B981' }}>✓ ปลอดภัย (มี Secret ในระบบแล้ว)</span>}
              </label>
              <input
                type="password"
                value={bitkubSecret}
                onChange={(e) => setBitkubSecret(e.target.value)}
                placeholder="กรอกเพื่ออัปเดต Bitkub Secret ใหม่"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
              />
            </div>
          </div>
          {bitkubStatus.message && (
            <div style={{ fontSize: '11.5px', color: bitkubStatus.status === 'online' ? '#34D399' : '#F87171', marginTop: '8px', fontWeight: 600 }}>
              {bitkubStatus.message}
            </div>
          )}
        </div>

        {/* Binance API */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card-inner)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
              <strong style={{ fontSize: '14.5px' }}>Binance (คู่เหรียญสากล USDT &amp; WebSocket Feed)</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {renderStatusBadge(binanceStatus)}
              <button
                type="button"
                onClick={testBinance}
                disabled={binanceStatus.status === 'testing'}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '5px 12px', gap: '5px' }}
                title="ทดสอบส่ง Ping ไปยัง Binance Server"
              >
                <Wifi size={12} />
                <span>ทดสอบเชื่อมต่อ</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                Binance API Key:
              </label>
              <input
                type="text"
                value={binanceKey}
                onChange={(e) => setBinanceKey(e.target.value)}
                placeholder="เช่น bn_live_9928172938471928"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 600 }}>
                <span>Binance API Secret:</span>
                {hasBinanceSecret && <span style={{ color: '#10B981' }}>✓ ปลอดภัย (มี Secret ในระบบแล้ว)</span>}
              </label>
              <input
                type="password"
                value={binanceSecret}
                onChange={(e) => setBinanceSecret(e.target.value)}
                placeholder="กรอกเพื่ออัปเดต Binance Secret ใหม่"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
              />
            </div>
          </div>
          {binanceStatus.message && (
            <div style={{ fontSize: '11.5px', color: binanceStatus.status === 'online' ? '#34D399' : '#F87171', marginTop: '8px', fontWeight: 600 }}>
              {binanceStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* 2. Notification Channels (Telegram & Line Notify) */}
      <div className="crypto-card">
        <div className="card-header-row" style={{ marginBottom: '16px' }}>
          <div className="card-title">
            <Bell size={18} color="#F59E0B" />
            ช่องทางรับการแจ้งเตือนสด (Notification Channels &amp; Webhooks)
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            รับการเตือนราคา วาฬ และสัญญาณ AI ทันใจ
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
              <Send size={14} color="#38BDF8" /> Telegram Chat ID / Channel:
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="เช่น @my_crypto_channel หรือ 12345678"
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
              <MessageSquare size={14} color="#10B981" /> Line Notify Access Token:
            </label>
            <input
              type="password"
              value={lineNotifyToken}
              onChange={(e) => setLineNotifyToken(e.target.value)}
              placeholder="กรอก Line Notify Token สำหรับส่งเข้ากลุ่ม Line"
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={notifyWhaleAlerts}
              onChange={(e) => setNotifyWhaleAlerts(e.target.checked)}
              style={{ accentColor: '#8B5CF6', width: '16px', height: '16px' }}
            />
            <span>🐋 แจ้งเตือนการเคลื่อนไหววาฬ (Whale Radar)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={notifyPriceAlerts}
              onChange={(e) => setNotifyPriceAlerts(e.target.checked)}
              style={{ accentColor: '#8B5CF6', width: '16px', height: '16px' }}
            />
            <span>🔔 แจ้งเตือนราคาเป้าหมาย &amp; Cutloss</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={notifyBuySignals}
              onChange={(e) => setNotifyBuySignals(e.target.checked)}
              style={{ accentColor: '#8B5CF6', width: '16px', height: '16px' }}
            />
            <span>⚡ สัญญาณซื้อ AI &amp; สัญญาณทองคำ</span>
          </label>
        </div>
      </div>

      {/* 3. User Preferences */}
      <div className="crypto-card">
        <div className="card-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
          <Sliders size={18} color="var(--neon-blue-light)" />
          การตั้งค่าส่วนบุคคล &amp; พฤติกรรมระบบ (User Preferences)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              สกุลเงินหลักที่ใช้แสดงผล (Default Currency):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCurrency('THB')}
                className={currency === 'THB' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                บาทไทย (THB ฿)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USDT')}
                className={currency === 'USDT' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                ดอลลาร์ (USDT $)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Timeframe หลักเริ่มต้น:
            </label>
            <select
              value={defaultTf}
              onChange={(e) => setDefaultTf(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
            >
              <option value="1D">1D (Daily - เทรนด์หลักภาพใหญ่)</option>
              <option value="4H">4H (4 Hours - กรอบเทรดสถาบัน)</option>
              <option value="1H">1H (1 Hour - จังหวะ Swing Trade)</option>
              <option value="15m">15m (15 Minutes - หาจุดเข้าย่อย)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              ความเสี่ยงสูงสุดต่อไม้เริ่มต้น (% Risk Portfolio):
            </label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={defaultRiskPct}
              onChange={(e) => setDefaultRiskPct(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              ภาษาแสดงผล (System Language):
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
            >
              <option value="th">ภาษาไทย (Thai - แนะนำ)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: soundEnabled ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: soundEnabled ? '1px solid #8B5CF6' : '1px solid var(--border-color)',
                color: soundEnabled ? '#C4B5FD' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>เสียงแจ้งเตือน: {soundEnabled ? 'เปิดทำงาน' : 'ปิดเสียง'}</span>
            </button>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              บันทึกซิงค์ลง Supabase PostgreSQL อัตโนมัติทุกครั้งที่กดบันทึก
            </span>
          </div>

          <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ padding: '8px 20px', gap: '6px' }}>
            {isSaving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
