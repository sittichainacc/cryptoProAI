import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Crown,
  Star,
  Gem,
  UserX,
  UserCheck,
  Trash2,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  PlusCircle,
  Edit3,
  X,
  AlertTriangle,
  Activity,
} from 'lucide-react';

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

interface TierStats {
  role: UserRole;
  count: number;
}

interface TierDef {
  role: UserRole;
  titleTh: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  badgeText: string;
  badgeColor: string;
}

const TIER_DEFS: TierDef[] = [
  {
    role: 'free',
    titleTh: 'ผู้ใช้ทั่วไป (Free)',
    color: '#94A3B8',
    gradient: 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(100,116,139,0.1))',
    icon: <Users size={14} />,
    badgeText: 'FREE',
    badgeColor: '#94A3B8',
  },
  {
    role: 'gold',
    titleTh: 'สมาชิก Gold',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.1))',
    icon: <Star size={14} />,
    badgeText: 'GOLD',
    badgeColor: '#F59E0B',
  },
  {
    role: 'premium',
    titleTh: 'สมาชิก Premium',
    color: '#38BDF8',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(6,182,212,0.1))',
    icon: <ShieldCheck size={14} />,
    badgeText: 'PREMIUM',
    badgeColor: '#38BDF8',
  },
  {
    role: 'platinum',
    titleTh: 'สมาชิก Platinum',
    color: '#A78BFA',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(139,92,246,0.1))',
    icon: <Gem size={14} />,
    badgeText: 'PLATINUM',
    badgeColor: '#A78BFA',
  },
  {
    role: 'admin',
    titleTh: 'ผู้ดูแลระบบ (Admin)',
    color: '#F43F5E',
    gradient: 'linear-gradient(135deg, rgba(244,63,94,0.22), rgba(225,29,72,0.1))',
    icon: <Crown size={14} />,
    badgeText: 'ADMIN',
    badgeColor: '#F43F5E',
  },
];

function getTierDef(role: UserRole): TierDef {
  return TIER_DEFS.find((t) => t.role === role) || TIER_DEFS[0];
}

function statusIcon(status: UserStatus) {
  if (status === 'ACTIVE') return <CheckCircle2 size={13} color="#10B981" />;
  if (status === 'BLOCKED') return <XCircle size={13} color="#EF4444" />;
  return <Clock size={13} color="#F59E0B" />;
}

function statusLabel(status: UserStatus) {
  if (status === 'ACTIVE') return 'ใช้งานอยู่';
  if (status === 'BLOCKED') return 'ถูกระงับ';
  return 'รอยืนยัน';
}

const BASE_API = '/api/users';

async function fetchUsers(search?: string, role?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  const res = await fetch(`${BASE_API}?${params.toString()}`);
  return res.json();
}

async function patchRole(id: string, role: UserRole) {
  const res = await fetch(`${BASE_API}/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return res.json();
}

async function patchStatus(id: string, status: UserStatus) {
  const res = await fetch(`${BASE_API}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

async function deleteUser(id: string) {
  const res = await fetch(`${BASE_API}/${id}`, { method: 'DELETE' });
  return res.json();
}

async function createUser(payload: { username: string; email: string; full_name?: string; role: UserRole; notes?: string }) {
  const res = await fetch(BASE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── Create User Modal ───────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}
const CreateUserModal: React.FC<CreateModalProps> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', role: 'free' as UserRole, notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setError('กรุณากรอก Username และ Email');
      return;
    }
    setLoading(true);
    try {
      const res = await createUser(form);
      if (res.success) {
        onCreated();
        onClose();
      } else {
        setError(res.message || 'ไม่สามารถสร้างผู้ใช้งานได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '28px',
          width: '420px',
          maxWidth: '95vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: '16px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} color="var(--neon-green)" />
            เพิ่มผู้ใช้งานใหม่
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {(['username', 'email', 'full_name'] as const).map((field) => (
            <div key={field} style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                {field === 'username' ? 'Username *' : field === 'email' ? 'Email *' : 'ชื่อ-นามสกุล'}
              </label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                  color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
                placeholder={field === 'username' ? 'เช่น john_doe' : field === 'email' ? 'เช่น john@example.com' : 'ไม่บังคับ'}
              />
            </div>
          ))}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              ระดับสิทธิ์
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
            >
              {TIER_DEFS.map((t) => (
                <option key={t.role} value={t.role} style={{ background: '#1E293B' }}>
                  {t.titleTh}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              หมายเหตุ
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                color: '#FFF', fontSize: '13px', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
              placeholder="ไม่บังคับ"
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                color: '#CBD5E1', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: '10px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none', color: '#FFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'กำลังสร้าง...' : '✓ สร้างผู้ใช้งาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Role Dropdown ────────────────────────────────────────────────────────────
interface RoleDropdownProps {
  user: UserProfile;
  onChanged: () => void;
}
const RoleDropdown: React.FC<RoleDropdownProps> = ({ user, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tier = getTierDef(user.role);

  const handleSelect = async (role: UserRole) => {
    if (role === user.role) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      await patchRole(user.id, role);
      onChanged();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 9px', borderRadius: '8px',
          background: tier.gradient, border: `1px solid ${tier.color}55`,
          color: tier.color, fontSize: '11px', fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {tier.icon} {tier.badgeText} <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 101,
              background: '#1E293B', border: '1px solid var(--border-color)',
              borderRadius: '10px', padding: '6px', minWidth: '170px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {TIER_DEFS.map((t) => (
              <button
                key={t.role}
                onClick={() => handleSelect(t.role)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 10px', borderRadius: '7px',
                  background: user.role === t.role ? t.gradient : 'transparent',
                  border: user.role === t.role ? `1px solid ${t.color}44` : '1px solid transparent',
                  color: user.role === t.role ? t.color : '#CBD5E1',
                  fontSize: '12px', fontWeight: user.role === t.role ? 800 : 500,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ color: t.color }}>{t.icon}</span>
                {t.titleTh}
                {user.role === t.role && <CheckCircle2 size={11} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<TierStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserProfile | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUsers(search || undefined, filterRole || undefined, filterStatus || undefined);
      if (res.success) {
        setUsers(res.data.users || []);
        setStats(res.data.stats || []);
        setTotal(res.data.total || 0);
      }
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterStatus]);

  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [load]);

  const handleStatusToggle = async (user: UserProfile) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await patchStatus(user.id, newStatus);
      if (res.success) {
        showToast(res.message);
        load();
      } else {
        showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch {
      showToast('ไม่สามารถเชื่อมต่อได้', 'error');
    }
  };

  const handleDelete = async (user: UserProfile) => {
    try {
      const res = await deleteUser(user.id);
      if (res.success) {
        showToast(`ลบ ${user.username} เรียบร้อยแล้ว`);
        setConfirmDelete(null);
        load();
      } else {
        showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch {
      showToast('ไม่สามารถเชื่อมต่อได้', 'error');
    }
  };

  const totalUsers = stats.reduce((s, t) => s + Number(t.count), 0);

  return (
    <div style={{ padding: '0 0 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={22} color="#A78BFA" />
              บริหารจัดการผู้ใช้งาน
            </h1>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              จัดการสิทธิ์ผู้ใช้งาน 5 ระดับ: Free → Gold → Premium → Platinum → Admin
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => load()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: '9px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                color: '#CBD5E1', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} /> รีเฟรช
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '9px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none', color: '#FFF', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer',
              }}
            >
              <PlusCircle size={14} /> เพิ่มผู้ใช้งาน
            </button>
          </div>
        </div>
      </div>

      {/* Tier Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '22px' }}>
        {TIER_DEFS.map((t) => {
          const stat = stats.find((s) => s.role === t.role);
          const count = Number(stat?.count || 0);
          const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
          return (
            <div
              key={t.role}
              onClick={() => setFilterRole(filterRole === t.role ? '' : t.role)}
              style={{
                padding: '14px 16px', borderRadius: '12px',
                background: filterRole === t.role ? t.gradient : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filterRole === t.role ? t.color + '55' : 'var(--border-color)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: t.color, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700 }}>
                  {t.icon} {t.badgeText}
                </span>
                {filterRole === t.role && <CheckCircle2 size={12} color={t.color} />}
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>{pct}% ของทั้งหมด</div>
              {/* Progress bar */}
              <div style={{ marginTop: '8px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ height: '100%', borderRadius: '2px', width: `${pct}%`, background: t.color, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
          padding: '14px 16px', borderRadius: '12px',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้, อีเมล..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
              color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} color="var(--text-muted)" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 10px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
              color: filterStatus ? '#FFF' : 'var(--text-muted)', fontSize: '12.5px', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="ACTIVE">ใช้งานอยู่</option>
            <option value="BLOCKED">ถูกระงับ</option>
            <option value="PENDING">รอยืนยัน</option>
          </select>
        </div>

        {(search || filterRole || filterStatus) && (
          <button
            onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 10px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#F87171', fontSize: '12px', cursor: 'pointer',
            }}
          >
            <X size={12} /> ล้างตัวกรอง
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Activity size={12} style={{ animation: 'spin 1s linear infinite' }} /> กำลังโหลด...
            </span>
          ) : (
            `แสดง ${users.length} / ${total} ราย`
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                {['ผู้ใช้งาน', 'อีเมล', 'ระดับสิทธิ์', 'สถานะ', 'วันที่สมัคร', 'จัดการ'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <Activity size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
                    <br />กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <Users size={28} style={{ marginBottom: '10px', opacity: 0.3 }} />
                    <br />ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const tier = getTierDef(user.role);
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: idx < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* User */}
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                              background: tier.gradient, border: `1px solid ${tier.color}44`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 900, color: tier.color,
                            }}
                          >
                            {user.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#FFF', fontSize: '13px' }}>{user.username}</div>
                            {user.full_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.full_name}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '13px 16px', color: '#94A3B8', fontSize: '12.5px' }}>
                        {user.email}
                      </td>

                      {/* Role Dropdown */}
                      <td style={{ padding: '13px 16px' }}>
                        <RoleDropdown user={user} onChanged={() => { showToast('อัปเดตระดับสิทธิ์เรียบร้อยแล้ว'); load(); }} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                            background: user.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : user.status === 'BLOCKED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                            color: user.status === 'ACTIVE' ? '#10B981' : user.status === 'BLOCKED' ? '#F87171' : '#F59E0B',
                            border: `1px solid ${user.status === 'ACTIVE' ? 'rgba(16,185,129,0.3)' : user.status === 'BLOCKED' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          }}
                        >
                          {statusIcon(user.status)} {statusLabel(user.status)}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        {new Date(user.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleStatusToggle(user)}
                            title={user.status === 'ACTIVE' ? 'ระงับผู้ใช้' : 'เปิดใช้งาน'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '5px 9px', borderRadius: '7px',
                              background: user.status === 'ACTIVE' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              border: `1px solid ${user.status === 'ACTIVE' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                              color: user.status === 'ACTIVE' ? '#F87171' : '#10B981',
                              fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            {user.status === 'ACTIVE' ? <UserX size={12} /> : <UserCheck size={12} />}
                            {user.status === 'ACTIVE' ? 'ระงับ' : 'เปิด'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(user)}
                            title="ลบผู้ใช้"
                            style={{
                              padding: '5px 8px', borderRadius: '7px',
                              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                              color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '16px', padding: '28px', width: '360px', maxWidth: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertTriangle size={20} color="#F87171" />
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#FFF' }}>ยืนยันการลบผู้ใช้</span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '20px' }}>
              คุณต้องการลบผู้ใช้งาน <strong style={{ color: '#F87171' }}>{confirmDelete.username}</strong> ออกจากระบบ?
              <br />การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#CBD5E1', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: '#FFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                ✕ ลบออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={() => { showToast('สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว'); load(); }} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 18px', borderRadius: '12px',
            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.type === 'success' ? '#10B981' : '#F87171',
            fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.3s ease',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
