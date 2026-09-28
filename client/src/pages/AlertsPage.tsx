import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { AlertItem, TickerData } from '../types/index.js';
import { Bell, Plus, CheckCircle, AlertCircle, ShieldAlert, Clock, Trash2, Volume2 } from 'lucide-react';

interface AlertsPageProps {
  currency: 'THB' | 'USDT';
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ currency }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [coins, setCoins] = useState<TickerData[]>([]);

  // Form State
  const [selectedCoin, setSelectedCoin] = useState('SOL');
  const [alertType, setAlertType] = useState('Price');
  const [threshold, setThreshold] = useState('200');
  const [severity, setSeverity] = useState<'info' | 'watch' | 'important' | 'critical'>('important');
  const [note, setNote] = useState('เตือนเมื่อเบรคทะลุแนวต้าน 200');

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    api.getRecentAlerts().then(setAlerts);
    api.getCoins().then(setCoins);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.createAlert({
        symbol: selectedCoin,
        alertType,
        descriptionTh: `${selectedCoin} ${note}`,
        currentValue: threshold,
        severity,
        status: 'active',
      });
      setAlerts((prev) => [created, ...prev]);
      playNotificationChime();
      setSuccessToast(`บันทึกการแจ้งเตือนสำหรับ ${selectedCoin} สำเร็จแล้ว`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to create alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await api.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setSuccessToast('ลบการแจ้งเตือนเรียบร้อยแล้ว');
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span style={{ color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>Critical</span>;
      case 'important':
        return <span style={{ color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>Important</span>;
      case 'watch':
        return <span style={{ color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>Watch</span>;
      default:
        return <span style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>Info</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="alerts-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
            Alert Center (ศูนย์ควบคุมการแจ้งเตือนอัจฉริยะ)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ตั้งการแจ้งเตือนตาม Price, Volume Spike, Technical Score, Breakout, หรือ Signal Change
          </p>
        </div>
        <button
          onClick={playNotificationChime}
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
          title="ทดสอบเสียงกริ่งสัญญาณ"
        >
          <Volume2 size={14} color="var(--neon-cyan)" />
          <span>ทดสอบเสียงแจ้งเตือน</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--neon-green-light)',
            fontSize: '12.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} color="#10B981" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="alerts-center-grid">
        {/* Create Alert Form */}
        <div className="crypto-card">
          <div className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
            <Plus size={16} color="var(--neon-cyan)" />
            สร้างการแจ้งเตือนใหม่ (New Alert)
          </div>

          <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                เหรียญที่ต้องการเฝ้าระวัง:
              </label>
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0F182B', colorScheme: 'dark', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                {coins.map((c) => (
                  <option key={c.symbol} value={c.symbol} style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>
                    {c.symbol} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ประเภทเงื่อนไข (Alert Type):
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0F182B', colorScheme: 'dark', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Price Above" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>ราคามากกว่า (Price &gt;)</option>
                <option value="Price Below" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>ราคาต่ำกว่า (Price &lt;)</option>
                <option value="Breakout" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Breakout ทะลุแนวต้าน</option>
                <option value="Volume Spike" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Volume พุ่งเกิน 200%</option>
                <option value="RSI Overbought" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>RSI Overbought (&gt; 70)</option>
                <option value="EMA Cross" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>EMA Golden Cross (20/50)</option>
                <option value="Technical Score" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Technical Score &gt; 85</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ค่าเป้าหมาย (Threshold):
              </label>
              <input
                type="text"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="เช่น 185.00"
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0F182B', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ระดับความสำคัญ (Severity):
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0F182B', colorScheme: 'dark', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="info" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Info (ข้อมูลทั่วไป)</option>
                <option value="watch" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Watch (เฝ้าระวัง)</option>
                <option value="important" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Important (สำคัญ)</option>
                <option value="critical" style={{ backgroundColor: '#0B101E', color: '#F8FAFC' }}>Critical (จุดตัดสินใจวิกฤต)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                บันทึกข้อความ (Note):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '6px', justifyContent: 'center' }}>
              <Bell size={15} />
              <span>บันทึกการแจ้งเตือน</span>
            </button>
          </form>
        </div>

        {/* Alerts Feed */}
        <div className="crypto-card">
          <div className="card-header-row">
            <div className="card-title">
              รายการแจ้งเตือนที่ทำงานอยู่ ({alerts.length})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((a) => (
              <div
                key={a.id}
                className="alert-feed-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={16} color="var(--neon-cyan)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#FFF' }}>{a.symbol}</strong>
                      {getSeverityBadge(a.severity)}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({a.alertType})</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {a.descriptionTh}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neon-cyan)' }}>{a.currentValue}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{a.time}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(a.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
