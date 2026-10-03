import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { AlertItem, TickerData } from '../types/index.js';
import { Bell, Plus, CheckCircle, AlertCircle, ShieldAlert, Clock, Trash2, Volume2, Database, Power, Filter } from 'lucide-react';

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
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered'>('all');

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('cryptopro_auth_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();
  const userRole = currentUser?.role || 'free';
  const maxQuota = currentUser?.maxAlerts || (userRole === 'admin' ? 999 : userRole === 'platinum' ? 100 : userRole === 'premium' ? 25 : userRole === 'gold' ? 10 : 3);
  const roleBadgeColor = userRole === 'admin' ? '#F43F5E' : userRole === 'platinum' ? '#A78BFA' : userRole === 'premium' ? '#38BDF8' : userRole === 'gold' ? '#F59E0B' : '#94A3B8';

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await api.toggleAlertStatus(id);
      if (updated) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a)));
        setSuccessToast(`เปลี่ยนสถานะการแจ้งเตือนเป็น ${updated.status === 'active' ? 'เปิดใช้งาน (ACTIVE)' : 'ปิดชั่วคราว'} เรียบร้อย`);
        setTimeout(() => setSuccessToast(null), 2500);
      }
    } catch (err: any) {
      setErrorToast(err.message || 'เปลี่ยนสถานะไม่สำเร็จ');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

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
      setSuccessToast(`บันทึกการแจ้งเตือนสำหรับ ${selectedCoin} สำเร็จแล้ว (บันทึกลง Supabase DB)`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to create alert:', err);
      setErrorToast(err.message || 'บันทึกการแจ้งเตือนไม่สำเร็จ');
      setTimeout(() => setErrorToast(null), 4500);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: `${roleBadgeColor}20`, color: roleBadgeColor, fontWeight: 800, border: `1px solid ${roleBadgeColor}50` }}>
              👤 {currentUser?.name || currentUser?.username || 'ผู้ใช้งานทั่วไป'} ({userRole.toUpperCase()})
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              📊 โควต้าที่ใช้: {alerts.length} / {maxQuota} รายการ
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Database size={11} /> ซิงก์กับ Supabase PostgreSQL อัตโนมัติ
            </span>
          </div>
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

      {/* Success & Error Notification Banners */}
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
      {errorToast && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#F87171',
            fontSize: '12.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} color="#EF4444" />
          <span>{errorToast}</span>
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
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                {coins.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
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
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Price Above">ราคามากกว่า (Price &gt;)</option>
                <option value="Price Below">ราคาต่ำกว่า (Price &lt;)</option>
                <option value="Breakout">Breakout ทะลุแนวต้าน</option>
                <option value="Volume Spike">Volume พุ่งเกิน 200%</option>
                <option value="RSI Overbought">RSI Overbought (&gt; 70)</option>
                <option value="EMA Cross">EMA Golden Cross (20/50)</option>
                <option value="Technical Score">Technical Score &gt; 85</option>
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
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ระดับความสำคัญ (Severity):
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="info">Info (ข้อมูลทั่วไป)</option>
                <option value="watch">Watch (เฝ้าระวัง)</option>
                <option value="important">Important (สำคัญ)</option>
                <option value="critical">Critical (จุดตัดสินใจวิกฤต)</option>
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
                style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
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
          <div className="card-header-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-title">
              รายการแจ้งเตือนที่ทำงานอยู่ ({alerts.length})
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'active', 'triggered'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterStatus(mode)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: filterStatus === mode ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: filterStatus === mode ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: filterStatus === mode ? 700 : 500,
                  }}
                >
                  {mode === 'all' ? 'ทั้งหมด' : mode === 'active' ? 'เฝ้าระวัง' : 'แจ้งเตือนแล้ว'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts
              .filter((a) => filterStatus === 'all' || a.status === filterStatus)
              .map((a) => (
              <div
                key={a.id}
                className="alert-feed-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-color)',
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
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{a.symbol}</strong>
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
                    onClick={() => handleToggleStatus(a.id)}
                    title={a.status === 'active' ? 'คลิกเพื่อปิดชั่วคราว' : 'คลิกเพื่อเปิดใช้งาน'}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: a.status === 'active' ? '#10B981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Power size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(a.id)}
                    title="ลบการแจ้งเตือนนี้"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
