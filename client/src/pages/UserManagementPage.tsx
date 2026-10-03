import React, { useState, useEffect, useCallback, Component, ErrorInfo } from 'react';
import {
  Users, Search, Shield, UserX, UserCheck, Trash2, RefreshCw,
  ChevronDown, CheckCircle2, XCircle, Clock, Filter,
  PlusCircle, X, AlertTriangle, Activity, WifiOff, KeyRound,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type UserRole = 'free' | 'gold' | 'premium' | 'platinum' | 'admin';
type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  status: UserStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Tier Config ─────────────────────────────────────────────────────────────
const ROLE_ORDER: UserRole[] = ['admin', 'platinum', 'premium', 'gold', 'free'];

const TIER_LABEL: Record<UserRole, string> = {
  admin: 'Admin', platinum: 'Platinum', premium: 'Premium', gold: 'Gold', free: 'Free',
};
const TIER_COLOR: Record<UserRole, string> = {
  admin: '#F43F5E', platinum: '#A78BFA', premium: '#38BDF8', gold: '#F59E0B', free: '#94A3B8',
};
const TIER_BG: Record<UserRole, string> = {
  admin: 'rgba(244,63,94,0.15)', platinum: 'rgba(167,139,250,0.15)',
  premium: 'rgba(56,189,248,0.15)', gold: 'rgba(245,158,11,0.15)', free: 'rgba(148,163,184,0.1)',
};
const TIER_BORDER: Record<UserRole, string> = {
  admin: 'rgba(244,63,94,0.4)', platinum: 'rgba(167,139,250,0.4)',
  premium: 'rgba(56,189,248,0.4)', gold: 'rgba(245,158,11,0.4)', free: 'rgba(148,163,184,0.3)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseStats(raw: unknown): Record<UserRole, number> {
  const def: Record<UserRole, number> = { free: 0, gold: 0, premium: 0, platinum: 0, admin: 0 };
  if (!raw) return def;
  if (Array.isArray(raw)) {
    (raw as Array<{ role: string; count: number }>).forEach(item => {
      if (item?.role && item?.count !== undefined) {
        def[item.role as UserRole] = Number(item.count) || 0;
      }
    });
    return def;
  }
  return { ...def, ...(raw as Record<string, number>) };
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error('[UserManagementPage]', e, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#F87171' }}>
          <AlertTriangle size={36} />
          <div style={{ fontSize: 16, fontWeight: 700, margin: '12px 0 6px' }}>
            เกิดข้อผิดพลาดในหน้านี้
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
            {this.state.error}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.4)',
              color: '#F87171', cursor: 'pointer',
            }}
          >
            ลองใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 7, fontSize: 11, fontWeight: 800,
    background: TIER_BG[role], border: `1px solid ${TIER_BORDER[role]}`,
    color: TIER_COLOR[role],
  }}>
    {TIER_LABEL[role]}
  </span>
);

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const cfg = {
    ACTIVE:  { icon: <CheckCircle2 size={11} />, label: 'ใช้งาน',   color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
    BLOCKED: { icon: <XCircle size={11} />,       label: 'ระงับ',    color: '#F87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'  },
    PENDING: { icon: <Clock size={11} />,          label: 'รอยืนยัน', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  };
  const s = cfg[status] ?? cfg.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 7, fontSize: 11, fontWeight: 700,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      {s.icon} {s.label}
    </span>
  );
};

const RoleDropdown: React.FC<{ user: UserProfile; onRefresh: (msg: string) => void }> = ({ user, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = async (role: UserRole) => {
    if (role === user.role) { setOpen(false); return; }
    setBusy(true); setOpen(false);
    try {
      const r = await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const res = await r.json();
      onRefresh(res.message || 'อัปเดตสิทธิ์แล้ว');
    } catch { onRefresh('เกิดข้อผิดพลาด'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', borderRadius: 8,
          background: TIER_BG[user.role],
          border: `1px solid ${TIER_BORDER[user.role]}`,
          color: TIER_COLOR[user.role],
          fontSize: 11, fontWeight: 800,
          cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {TIER_LABEL[user.role]} <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 201,
            background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: 6, minWidth: 160,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}>
            {ROLE_ORDER.map(r => (
              <button
                key={r}
                onClick={() => pick(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 10px', borderRadius: 7,
                  background: user.role === r ? TIER_BG[r] : 'transparent',
                  border: user.role === r ? `1px solid ${TIER_BORDER[r]}` : '1px solid transparent',
                  color: user.role === r ? TIER_COLOR[r] : '#CBD5E1',
                  fontSize: 12, fontWeight: user.role === r ? 800 : 500,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {TIER_LABEL[r]}
                {user.role === r && <CheckCircle2 size={11} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Toast: React.FC<{ msg: string; ok: boolean }> = ({ msg, ok }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 12,
    background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
    border: `1px solid ${ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
    color: ok ? '#10B981' : '#F87171',
    fontSize: 13, fontWeight: 700,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.3s ease',
  }}>
    {ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg}
  </div>
);

const ConfirmDeleteModal: React.FC<{ username: string; onCancel: () => void; onConfirm: () => void }> = ({ username, onCancel, onConfirm }) => (
  <div
    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={onCancel}
  >
    <div
      style={{ background: '#0F172A', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 16, padding: 28, width: 360, maxWidth: '95vw' }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <AlertTriangle size={20} color="#F87171" />
        <span style={{ fontWeight: 800, fontSize: 16, color: '#FFF' }}>ยืนยันการลบ</span>
      </div>
      <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20 }}>
        ลบผู้ใช้งาน <strong style={{ color: '#F87171' }}>{username}</strong> ออกจากระบบ? ไม่สามารถย้อนกลับได้
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', cursor: 'pointer' }}>ยกเลิก</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}>ลบออก</button>
      </div>
    </div>
  </div>
);

const CreateUserModal: React.FC<{ onClose: () => void; onCreated: (msg: string) => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', role: 'free' as UserRole, notes: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) { setErr('กรุณากรอก Username และ Email'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const res = await r.json();
      if (res.success) { onCreated(res.message || 'สร้างสำเร็จ'); onClose(); }
      else setErr(res.message || 'ไม่สามารถสร้างได้');
    } catch { setErr('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
    finally { setBusy(false); }
  };

  const fields: { k: keyof typeof form; l: string; t: string; p: string }[] = [
    { k: 'username',  l: 'Username *',   t: 'text',     p: 'เช่น john_doe' },
    { k: 'email',     l: 'Email *',       t: 'email',    p: 'เช่น john@email.com' },
    { k: 'full_name', l: 'ชื่อ-นามสกุล', t: 'text',     p: 'ไม่บังคับ' },
    { k: 'password',  l: 'รหัสผ่าน (เว้นว่างเพื่อใช้ค่าเริ่มต้น)', t: 'password', p: 'เว้นว่างไว้ใช้ Ss@crypto' },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 420, maxWidth: '96vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusCircle size={18} color="#10B981" /> เพิ่มผู้ใช้งานใหม่
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={submit}>
          {fields.map(f => (
            <div key={f.k} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>{f.l}</label>
              <input
                type={f.t}
                value={form[f.k] as string}
                onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                placeholder={f.p}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>ระดับสิทธิ์</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none' }}
            >
              {ROLE_ORDER.map(r => <option key={r} value={r}>{TIER_LABEL[r]}</option>)}
            </select>
          </div>

          {err && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} /> {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" disabled={busy} style={{ flex: 2, padding: 10, borderRadius: 8, background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangePasswordModal: React.FC<{ user: UserProfile; onClose: () => void; onUpdated: (msg: string) => void }> = ({ user, onClose, onUpdated }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.trim().length < 4) {
      setErr('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const res = await r.json();
      if (res.success) {
        onUpdated(res.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
        onClose();
      } else {
        setErr(res.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch {
      setErr('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 400, maxWidth: '96vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={17} color="#F59E0B" /> เปลี่ยนรหัสผ่าน ({user.username})
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
          รหัสผ่านใหม่จะถูกบันทึกและเข้ารหัสความปลอดภัยในฐานข้อมูล PostgreSQL ทันที
        </p>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>รหัสผ่านใหม่</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>
          {err && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} /> {err}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" disabled={busy} style={{ flex: 2, padding: 10, borderRadius: 8, background: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const UserManagementInner: React.FC = () => {
  const [users,       setUsers]       = useState<UserProfile[]>([]);
  const [stats,       setStats]       = useState<Record<UserRole, number>>({ free: 0, gold: 0, premium: 0, platinum: 0, admin: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterRole,  setFilterRole]  = useState('');
  const [filterStatus,setFilterStatus]= useState('');
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [delUser,     setDelUser]     = useState<UserProfile | null>(null);
  const [pwUser,      setPwUser]      = useState<UserProfile | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams();
      if (search)       p.set('search', search);
      if (filterRole)   p.set('role',   filterRole);
      if (filterStatus) p.set('status', filterStatus);

      const r = await fetch(`/api/users?${p}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const res = await r.json();

      if (res?.success) {
        setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
        setStats(parseStats(res.data?.stats));
      } else {
        setError(res?.message || 'โหลดข้อมูลไม่สำเร็จ');
        setUsers([]);
      }
    } catch (e: unknown) {
      setError('ไม่สามารถเชื่อมต่อ API ได้ — ตรวจสอบว่า Backend รันอยู่ที่ port 5000');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterStatus]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleStatus = async (u: UserProfile) => {
    const ns: UserStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const r = await fetch(`/api/users/${u.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ns }),
      });
      const res = await r.json();
      showToast(res.message || 'อัปเดตสถานะแล้ว');
      load();
    } catch { showToast('เกิดข้อผิดพลาด', false); }
  };

  const doDelete = async () => {
    if (!delUser) return;
    try {
      const r = await fetch(`/api/users/${delUser.id}`, { method: 'DELETE' });
      const res = await r.json();
      if (res.success) { showToast(`ลบ ${delUser.username} เรียบร้อย`); load(); }
      else showToast(res.message || 'ลบไม่สำเร็จ', false);
    } catch { showToast('เกิดข้อผิดพลาด', false); }
    setDelUser(null);
  };

  const total = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);

  return (
    <div style={{ padding: '0 0 48px', maxWidth: 1400, margin: '0 auto', color: '#FFF' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} color="#A78BFA" /> บริหารจัดการผู้ใช้งาน
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#64748B' }}>
            จัดการสิทธิ์ 5 ระดับ: Free → Gold → Premium → Platinum → Admin
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: 12.5, cursor: 'pointer' }}>
            <RefreshCw size={13} /> รีเฟรช
          </button>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
            <PlusCircle size={13} /> เพิ่มผู้ใช้งาน
          </button>
        </div>
      </div>

      {/* Tier Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
        {ROLE_ORDER.map(role => {
          const cnt = Number(stats[role]) || 0;
          const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
          const active = filterRole === role;
          return (
            <div
              key={role}
              onClick={() => setFilterRole(active ? '' : role)}
              style={{
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                background: active ? TIER_BG[role] : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? TIER_BORDER[role] : 'rgba(255,255,255,0.07)'}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: TIER_COLOR[role] }}>{TIER_LABEL[role]}</span>
                {active && <CheckCircle2 size={12} color={TIER_COLOR[role]} />}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{cnt}</div>
              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>{pct}% ของทั้งหมด</div>
              <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: TIER_COLOR[role], transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={13} color="#64748B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา username, email..."
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <Filter size={12} color="#64748B" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', color: filterStatus ? '#FFF' : '#64748B', fontSize: 12.5, outline: 'none', cursor: 'pointer' }}
        >
          <option value="">สถานะทั้งหมด</option>
          <option value="ACTIVE">ใช้งานอยู่</option>
          <option value="BLOCKED">ถูกระงับ</option>
          <option value="PENDING">รอยืนยัน</option>
        </select>

        {(search || filterRole || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: 12, cursor: 'pointer' }}>
            <X size={12} /> ล้าง
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B', fontWeight: 600 }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Activity size={12} /> กำลังโหลด...</span>
            : `${users.length} รายการ`}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <WifiOff size={20} color="#F87171" />
          <div>
            <div style={{ fontWeight: 700, color: '#F87171', fontSize: 14 }}>ไม่สามารถโหลดข้อมูลได้</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{error}</div>
          </div>
          <button onClick={load} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#F87171', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
            ลองใหม่
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['ผู้ใช้งาน', 'อีเมล', 'ระดับสิทธิ์', 'สถานะ', 'วันที่สมัคร', 'จัดการ'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                    <Activity size={28} style={{ marginBottom: 10, opacity: 0.4 }} /><br />กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : !loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                    <Users size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><br />
                    {error ? 'ไม่สามารถโหลดข้อมูลได้' : 'ไม่พบผู้ใช้งาน'}
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.id || i}
                    style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: TIER_BG[u.role || 'free'], border: `1px solid ${TIER_BORDER[u.role || 'free']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: TIER_COLOR[u.role || 'free'], flexShrink: 0 }}>
                          {(u.username?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#FFF' }}>{u.username || '-'}</div>
                          {u.full_name && <div style={{ fontSize: 11, color: '#64748B' }}>{u.full_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#94A3B8', fontSize: 12.5 }}>{u.email || '-'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <RoleDropdown user={u} onRefresh={msg => { showToast(msg); load(); }} />
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <StatusBadge status={u.status || 'ACTIVE'} />
                    </td>
                    <td style={{ padding: '13px 16px', color: '#64748B', fontSize: 11.5, whiteSpace: 'nowrap' }}>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
                        : '-'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => toggleStatus(u)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 9px', borderRadius: 7,
                            background: u.status === 'ACTIVE' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            color: u.status === 'ACTIVE' ? '#F87171' : '#10B981',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          {u.status === 'ACTIVE'
                            ? <><UserX size={12} /> ระงับ</>
                            : <><UserCheck size={12} /> เปิด</>}
                        </button>
                        <button
                          onClick={() => setPwUser(u)}
                          title="เปลี่ยนรหัสผ่านในฐานข้อมูล"
                          style={{
                            padding: '5px 8px', borderRadius: 7,
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.3)',
                            color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <KeyRound size={12} />
                        </button>
                        <button
                          onClick={() => setDelUser(u)}
                          title="ลบผู้ใช้งาน"
                          style={{ padding: '5px 8px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && users.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 11.5, color: '#64748B', textAlign: 'right' }}>
          แสดง {users.length} จาก {total} รายการทั้งหมด
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={msg => { showToast(msg); load(); }} />}
      {pwUser && <ChangePasswordModal user={pwUser} onClose={() => setPwUser(null)} onUpdated={msg => { showToast(msg); }} />}
      {delUser && <ConfirmDeleteModal username={delUser.username} onCancel={() => setDelUser(null)} onConfirm={doDelete} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
};

export const UserManagementPage: React.FC = () => (
  <ErrorBoundary>
    <UserManagementInner />
  </ErrorBoundary>
);
