import React, { useState } from 'react';
import { Shield, Key, Sliders, Globe, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

interface SettingsPageProps {
  currency: 'THB' | 'USDT';
  setCurrency: (c: 'THB' | 'USDT') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currency, setCurrency }) => {
  const [bitkubKey, setBitkubKey] = useState('bk_live_38891084810293847');
  const [bitkubSecret, setBitkubSecret] = useState('••••••••••••••••••••••••••••••••');
  const [binanceKey, setBinanceKey] = useState('bn_live_9928172938471928');
  const [binanceSecret, setBinanceSecret] = useState('••••••••••••••••••••••••••••••••');
  const [defaultRiskPct, setDefaultRiskPct] = useState(2);
  const [defaultTf, setDefaultTf] = useState('1D');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
          การตั้งค่าระบบ &amp; Exchange API Keys
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          จัดการ API Keys ของ Exchange ต่างๆ (เข้ารหัสความปลอดภัย AES-256) และตั้งค่าส่วนบุคคล
        </p>
      </div>

      {/* Exchange API Keys Card (Sections 31, 39) */}
      <div className="crypto-card">
        <div className="card-header-row">
          <div className="card-title">
            <Key size={17} color="var(--neon-cyan)" />
            Exchange API Connection (การเชื่อมต่อ Exchange)
          </div>
          <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} /> ข้อมูลถูกเข้ารหัส Secret ไม่บันทึกเป็น Plain Text
          </span>
        </div>

        {/* Bitkub API */}
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <strong style={{ fontSize: '14px' }}>Bitkub (Exchange หลัก)</strong>
            </div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>● เชื่อมต่อแล้ว (Connected)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Bitkub API Key:
              </label>
              <input
                type="text"
                value={bitkubKey}
                onChange={(e) => setBitkubKey(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Bitkub API Secret:
              </label>
              <input
                type="password"
                value={bitkubSecret}
                onChange={(e) => setBitkubSecret(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        {/* Binance API */}
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <strong style={{ fontSize: '14px' }}>Binance (คู่เหรียญสากล USDT)</strong>
            </div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>● เชื่อมต่อแล้ว (Connected)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Binance API Key:
              </label>
              <input
                type="text"
                value={binanceKey}
                onChange={(e) => setBinanceKey(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Binance API Secret:
              </label>
              <input
                type="password"
                value={binanceSecret}
                onChange={(e) => setBinanceSecret(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Preferences (Section 38) */}
      <div className="crypto-card">
        <div className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
          <Sliders size={17} color="var(--neon-blue-light)" />
          การตั้งค่าส่วนบุคคล (User Preferences)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              สกุลเงินหลักที่ใช้แสดงผล (Default Currency):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrency('THB')}
                className={currency === 'THB' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                บาทไทย (THB)
              </button>
              <button
                onClick={() => setCurrency('USDT')}
                className={currency === 'USDT' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                ดอลลาร์ (USDT)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Timeframe หลักเริ่มต้น:
            </label>
            <select
              value={defaultTf}
              onChange={(e) => setDefaultTf(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
            >
              <option value="1D">1D (Daily - Main Trend)</option>
              <option value="4H">4H (4 Hours - Trading Setup)</option>
              <option value="1H">1H (1 Hour - Entry Timing)</option>
              <option value="15m">15m (15 Minutes - Fine Entry)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              ความเสี่ยงสูงสุดต่อไม้เริ่มต้น (% Risk):
            </label>
            <input
              type="number"
              value={defaultRiskPct}
              onChange={(e) => setDefaultRiskPct(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              ภาษาแสดงผล (Language):
            </label>
            <select
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
            >
              <option value="th">ไทย (Thai - แนะนำ)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            การตั้งค่าทั้งหมดจะถูกบันทึกลง Local Configuration
          </span>
          <button onClick={handleSave} className="btn-primary" style={{ padding: '8px 20px' }}>
            {isSaved ? <CheckCircle2 size={15} /> : <RefreshCw size={15} />}
            <span>{isSaved ? 'บันทึกสำเร็จ!' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
