import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Key, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  LogIn, 
  RefreshCw,
  Info,
  CheckCircle2,
  Ban
} from 'lucide-react';
import { api } from '../services/api.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { username: string; name: string; role: 'admin' }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check initial lockout status on mount or open
  useEffect(() => {
    if (isOpen) {
      // Check localStorage for local lockout cache
      const localLocked = localStorage.getItem('cryptopro_ip_locked') === 'true';
      const localAttempts = Number(localStorage.getItem('cryptopro_login_attempts') || '0');
      if (localLocked) {
        setIsLocked(true);
        setAttempts(3);
      } else {
        setAttempts(localAttempts);
      }

      // Query server for server-side IP status
      api.getAuthStatus().then((res) => {
        if (res && res.data) {
          setIpAddress(res.data.ip);
          if (res.data.isLocked || res.data.attempts >= 3) {
            setIsLocked(true);
            setAttempts(res.data.attempts || 3);
            localStorage.setItem('cryptopro_ip_locked', 'true');
            localStorage.setItem('cryptopro_login_attempts', '3');
          } else {
            setAttempts(Math.max(localAttempts, res.data.attempts));
          }
        }
      }).catch((e) => console.error('Error fetching auth status:', e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;

    if (!username.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.login(username.trim(), password.trim());

      if (res.success && res.user) {
        // Success
        setShowSuccess(true);
        setAttempts(0);
        setIsLocked(false);
        localStorage.removeItem('cryptopro_ip_locked');
        localStorage.removeItem('cryptopro_login_attempts');
        localStorage.setItem('cryptopro_auth_role', 'admin');
        localStorage.setItem('cryptopro_auth_user', JSON.stringify(res.user));

        setTimeout(() => {
          setShowSuccess(false);
          onLoginSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        // Failed
        const currentAttempts = res.attempts || attempts + 1;
        setAttempts(currentAttempts);
        localStorage.setItem('cryptopro_login_attempts', String(currentAttempts));

        if (res.isLocked || currentAttempts >= 3) {
          setIsLocked(true);
          localStorage.setItem('cryptopro_ip_locked', 'true');
          setErrorMessage(
            res.message || `รหัสผ่านไม่ถูกต้อง (ครั้งที่ 3/3) ไอพีเครื่องของท่านถูกระงับการเข้าสู่ระบบ ทุกปุ่มถูกปิดการใช้งาน`
          );
        } else {
          setErrorMessage(res.message || `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ครั้งที่ ${currentAttempts}/3)`);
        }
      }
    } catch (err: any) {
      // In case server responded with 403 or 401
      const currentAttempts = attempts + 1;
      setAttempts(currentAttempts);
      localStorage.setItem('cryptopro_login_attempts', String(currentAttempts));

      if (currentAttempts >= 3) {
        setIsLocked(true);
        localStorage.setItem('cryptopro_ip_locked', 'true');
        setErrorMessage(`รหัสผ่านไม่ถูกต้อง (ครั้งที่ 3/3) ไอพีเครื่องของท่านถูกระงับการเข้าสู่ระบบ ทุกปุ่มถูกปิดการใช้งาน`);
      } else {
        setErrorMessage(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ครั้งที่ ${currentAttempts}/3)`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevResetLock = async () => {
    try {
      await api.resetAuthLock();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('cryptopro_ip_locked');
    localStorage.removeItem('cryptopro_login_attempts');
    setIsLocked(false);
    setAttempts(0);
    setErrorMessage('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={() => {
        // Only allow background click close if NOT locked, or user can close to view public dashboard
        if (!isLocked) onClose();
      }}
    >
      <div
        className="crypto-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderColor: isLocked ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.4)',
          boxShadow: isLocked
            ? '0 20px 40px rgba(239, 68, 68, 0.25), 0 0 30px rgba(0, 0, 0, 0.4)'
            : 'var(--shadow-card)',
          padding: '28px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (disabled when locked) */}
        <button
          onClick={onClose}
          disabled={isLocked}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: isLocked ? 'var(--text-muted)' : 'var(--text-muted)',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            padding: '4px',
            borderRadius: '6px',
          }}
          title={isLocked ? 'ปุ่มปิดถูกระงับการใช้งานเนื่องจากไอพีถูกแบน' : 'ปิดหน้าต่าง'}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              margin: '0 auto 12px auto',
              background: isLocked
                ? 'linear-gradient(135deg, #EF4444, #991B1B)'
                : 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isLocked
                ? '0 0 20px rgba(239, 68, 68, 0.6)'
                : '0 0 20px rgba(245, 158, 11, 0.4)',
            }}
          >
            {isLocked ? <Ban size={28} color="#FFFFFF" /> : <Lock size={28} color="#FFFFFF" />}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            {isLocked ? 'ระบบระงับการเข้าสู่ระบบ (IP Locked)' : 'เข้าสู่ระบบในฐานะ Premium'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {isLocked
              ? 'ไอพีเครื่องนี้พยายามล็อกอินผิดพลาดเกิน 3 ครั้ง'
              : 'ปลดล็อก TRADING WORKSPACE, Top 5 Premium และโมดูลวิเคราะห์ครบวงจร (เพียงเดือนละ 10 บาท / ปีละ 110 บาท)'}
          </p>
        </div>

        {/* Locked Out Red Banner */}
        {isLocked && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid #EF4444',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#F87171', fontWeight: 800, fontSize: '13px' }}>
              <ShieldAlert size={16} />
              <span>ตรวจพบการกรอกรหัสผ่านผิดพลาดครบ 3/3 ครั้ง</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              ระบบได้ทำการบันทึกและระงับไอพีเครื่องของท่าน ({ipAddress || 'Client IP'}) เรียบร้อยแล้ว <strong>ปุ่มและแบบฟอร์มทั้งหมดถูกปิดการใช้งาน (Disabled)</strong> เพื่อความปลอดภัยสูงสุด
            </div>
          </div>
        )}

        {/* Attempts Status Indicator */}
        {!isLocked && attempts > 0 && (
          <div
            style={{
              backgroundColor: attempts === 2 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${attempts === 2 ? '#EF4444' : '#F59E0B'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: attempts === 2 ? '#F87171' : '#FBBF24', fontWeight: 700 }}>
              <AlertTriangle size={14} />
              <span>ความพยายามเข้าสู่ระบบ:</span>
            </div>
            <span
              style={{
                fontWeight: 900,
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: attempts === 2 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                color: attempts === 2 ? '#F87171' : '#FDE047',
              }}
            >
              {attempts} / 3 ครั้ง
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && !isLocked && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#F87171',
              fontSize: '11.5px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success message */}
        {showSuccess && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#34D399',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ระบบ Premium...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 600 }}>
              ชื่อผู้ใช้ (Username)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card-inner)',
                border: isLocked ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
              }}
            >
              <User size={15} color={isLocked ? 'var(--text-muted)' : 'var(--text-muted)'} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLocked || isLoading}
                placeholder="กรอกชื่อผู้ใช้..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  cursor: isLocked ? 'not-allowed' : 'text',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 600 }}>
              รหัสผ่าน (Password)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card-inner)',
                border: isLocked ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
              }}
            >
              <Key size={15} color={isLocked ? 'var(--text-muted)' : 'var(--text-muted)'} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked || isLoading}
                placeholder="กรอกรหัสผ่าน..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  cursor: isLocked ? 'not-allowed' : 'text',
                }}
              />
            </div>
          </div>

          {/* Security Notice (no credentials displayed) */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '7px',
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={13} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
            <span>
              ระบบรักษาความปลอดภัย: บัญชีสมาชิก Premium (สมัครสมาชิกเดือนละ 10 บาท / ปีละ 110 บาท)
            </span>
          </div>

          {/* Action Buttons: ALL DISABLED WHEN LOCKED */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={isLocked || isLoading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                background: isLocked
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'linear-gradient(135deg, #F59E0B, #8B5CF6)',
                border: 'none',
                color: isLocked ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF',
                fontWeight: 800,
                fontSize: '13px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isLocked ? 'none' : '0 0 15px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : isLocked ? (
                <>
                  <Ban size={15} />
                  <span>ปุ่มถูกระงับการใช้งาน (Disabled)</span>
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบในฐานะ Premium</span>
                </>
              )}
            </button>

            {/* Cancel Button (disabled when locked) */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLocked}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: isLocked ? 'rgba(255, 255, 255, 0.15)' : 'var(--text-muted)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
            >
              ยกเลิก / ปิดหน้าต่าง
            </button>

            {/* Dev Reset Lock Button (for testing recovery if locked) */}
            {isLocked && (
              <button
                type="button"
                onClick={handleDevResetLock}
                style={{
                  marginTop: '6px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px dashed rgba(245, 158, 11, 0.3)',
                  color: '#FBBF24',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                title="ปุ่มรีเซ็ตปลดล็อกไอพีสำหรับการทดสอบ (Dev Unlock)"
              >
                [Dev Reset] ปลดล็อก IP สำหรับการทดสอบใหม่อีกครั้ง
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
