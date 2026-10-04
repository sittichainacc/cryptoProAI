import React, { useState } from 'react';
import { TickerData } from '../types/index.js';
import { CoinRankingTable } from '../components/CoinRankingTable.js';
import { CryptoIcon } from '../components/CryptoIcon.js';
import { 
  Star, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Plus, 
  ChevronRight, 
  Eye, 
  Layers, 
  Activity, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Zap 
} from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { PriceCell } from '../components/PriceCell.js';
import { api } from '../services/api.js';
import { Edit3, Save, Database, AlertCircle, X } from 'lucide-react';

interface WatchlistPageProps {
  watchlist: TickerData[];
  allCoins: TickerData[];
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  onOpenAnalysis: (symbol: string) => void;
  currency: 'THB' | 'USDT';
  onToggleFocus?: (symbol: string) => void;
  focusSymbols?: string[];
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  watchlist,
  allCoins,
  onSelectCoin,
  onToggleWatchlist,
  onOpenAnalysis,
  currency,
  onToggleFocus,
  focusSymbols = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState<TickerData | null>(null);
  const [targetBuy, setTargetBuy] = useState<string>('');
  const [targetSell, setTargetSell] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [priority, setPriority] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('cryptopro_auth_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();
  const userRole = currentUser?.role || 'free';
  const maxQuota = currentUser?.maxWatchlists || (userRole === 'admin' ? 999 : userRole === 'platinum' ? 100 : userRole === 'premium' ? 30 : userRole === 'gold' ? 15 : 5);
  const roleBadgeColor = userRole === 'admin' ? '#F43F5E' : userRole === 'platinum' ? '#A78BFA' : userRole === 'premium' ? '#38BDF8' : userRole === 'gold' ? '#F59E0B' : '#94A3B8';

  const handleOpenEdit = (coin: TickerData) => {
    setEditingCoin(coin);
    setTargetBuy((coin as any).targetBuyPrice ? String((coin as any).targetBuyPrice) : '');
    setTargetSell((coin as any).targetSellPrice ? String((coin as any).targetSellPrice) : '');
    setNotes((coin as any).watchlistNotes || '');
    setPriority((coin as any).watchlistPriority || 1);
    setStatusMsg('');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoin) return;
    setIsSaving(true);
    setStatusMsg('');
    try {
      await api.saveWatchlistDetails({
        symbol: editingCoin.symbol,
        targetBuyPrice: targetBuy ? Number(targetBuy) : null,
        targetSellPrice: targetSell ? Number(targetSell) : null,
        notes: notes || null,
        priority: Number(priority) || 1,
      });
      (editingCoin as any).targetBuyPrice = targetBuy ? Number(targetBuy) : null;
      (editingCoin as any).targetSellPrice = targetSell ? Number(targetSell) : null;
      (editingCoin as any).watchlistNotes = notes || null;
      setStatusMsg('✅ บันทึกลงฐานข้อมูล Supabase สำเร็จ!');
      setTimeout(() => {
        setEditingCoin(null);
        setStatusMsg('');
      }, 1000);
    } catch (err: any) {
      setStatusMsg('❌ บันทึกล้มเหลว: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Metrics
  const totalCount = watchlist.length;
  const strongBuyCount = watchlist.filter((c) => c.signal === 'STRONG_BUY' || c.signal === 'BUY').length;
  const avgChange24h = totalCount
    ? watchlist.reduce((sum, c) => sum + (c.change24h || 0), 0) / totalCount
    : 0;
  const avgAiScore = totalCount
    ? Math.round(watchlist.reduce((sum, c) => sum + (c.aiScore || 0), 0) / totalCount)
    : 0;
  const positiveCoinsCount = watchlist.filter((c) => (c.change24h || 0) >= 0).length;
  const bullishRatio = totalCount ? Math.round((positiveCoinsCount / totalCount) * 100) : 0;

  // Best Conviction Setups in Watchlist (Sorted by AI Score)
  const topConviction = (Array.isArray(watchlist) ? [...watchlist] : []).sort((a, b) => b.aiScore - a.aiScore).slice(0, 3);

  // Coins available to add
  const availableToAdd = (allCoins || []).filter(
    (c) => !(Array.isArray(watchlist) && watchlist.some((w) => w.symbol === c.symbol)) &&
      (c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Quick Add */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={18} fill="#F59E0B" color="#F59E0B" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              รายการเฝ้าดูของฉัน (Watchlist Intelligence Hub)
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ติดตามการเคลื่อนไหว สัญญาณ AI และกรอบราคาของสินทรัพย์ที่คุณคัดสรรอย่างใกล้ชิด
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: `${roleBadgeColor}20`, color: roleBadgeColor, fontWeight: 800, border: `1px solid ${roleBadgeColor}50` }}>
              👤 {currentUser?.name || currentUser?.username || 'ผู้ใช้งานทั่วไป'} ({userRole.toUpperCase()})
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              📊 โควต้าที่ใช้: {totalCount} / {maxQuota} เหรียญ
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Database size={11} /> ซิงก์กับ Supabase PostgreSQL อัตโนมัติ
            </span>
          </div>
        </div>

        {/* Quick Add Dropdown Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                width: '240px',
              }}
            >
              <Search size={14} color="var(--text-muted)" style={{ marginRight: '6px' }} />
              <input
                type="text"
                placeholder="ค้นหาเหรียญเพื่อเพิ่ม..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsAddMenuOpen(true);
                }}
                onFocus={() => setIsAddMenuOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Autocomplete Popup */}
          {isAddMenuOpen && searchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '280px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 90,
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '6px',
              }}
            >
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', padding: '4px 8px' }}>
                เหรียญที่พร้อมเพิ่มเข้า Watchlist ({availableToAdd.length})
              </div>
              {availableToAdd.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  ไม่พบเหรียญที่ตรงกัน
                </div>
              ) : (
                availableToAdd.slice(0, 8).map((c) => (
                  <div
                    key={c.symbol}
                    onClick={() => {
                      onToggleWatchlist(c.symbol);
                      setSearchQuery('');
                      setIsAddMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-inner)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.symbol}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.name}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: '10.5px', padding: '3px 8px', gap: '3px' }}
                    >
                      <Plus size={11} /> เพิ่ม
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Watchlist KPI Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* KPI 1: Total Coins */}
        <div className="crypto-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              เหรียญที่เฝ้าดูทั้งหมด
            </span>
            <Star size={16} fill="#F59E0B" color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900 }}>{totalCount}</span>
            <span style={{ fontSize: '11px', color: 'var(--neon-green-light)', fontWeight: 700 }}>
              {strongBuyCount} สัญญาณซื้อ
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            อัปเดตราคาแบบ Real-time ตลอด 24 ชม.
          </div>
        </div>

        {/* KPI 2: 24h Average Return */}
        <div className="crypto-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              ผลตอบแทนเฉลี่ย 24h
            </span>
            <TrendingUp size={16} color={avgChange24h >= 0 ? '#10B981' : '#EF4444'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: avgChange24h >= 0 ? 'var(--neon-green-light)' : 'var(--neon-red)',
              }}
            >
              {avgChange24h >= 0 ? `+${avgChange24h.toFixed(2)}%` : `${avgChange24h.toFixed(2)}%`}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เฉลี่ยพอร์ต</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            บวก {positiveCoinsCount} / ลบ {totalCount - positiveCoinsCount} เหรียญ
          </div>
        </div>

        {/* KPI 3: Average AI Score */}
        <div className="crypto-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              คะแนนเฉลี่ย AI Score
            </span>
            <Sparkles size={16} color="var(--neon-cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--neon-cyan)' }}>
              {avgAiScore}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {avgAiScore >= 75 ? 'ความแข็งแกร่งระดับสูง (Grade A)' : 'ความแข็งแกร่งระดับปานกลาง (Grade B)'}
          </div>
        </div>

        {/* KPI 4: Bullish Ratio */}
        <div className="crypto-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              สัดส่วนเชิงบวก (Bullish Bias)
            </span>
            <Zap size={16} color="var(--neon-amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900 }}>{bullishRatio}%</span>
            <span style={{ fontSize: '11px', color: bullishRatio >= 50 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
              {bullishRatio >= 50 ? 'โมเมนตัมบวก' : 'โมเมนตัมชะลอ'}
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            ประเมินตามการเคลื่อนไหวรายวัน
          </div>
        </div>
      </div>

      {/* Top Conviction Highlights in Watchlist */}
      {topConviction.length > 0 && (
        <div className="crypto-card" style={{ padding: '16px 20px' }}>
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div className="card-title" style={{ fontSize: '14px' }}>
              <Target size={16} color="var(--neon-green-light)" />
              <span>เหรียญเด่นที่มีคะแนน AI สูงสุดใน Watchlist (Top Conviction Setups)</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              คัดเลือกตามสัญญาณความพร้อมในการเทรด
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {topConviction.map((coin) => {
              const entry = coin.price;
              const target = coin.high24h > coin.price ? coin.high24h * 1.05 : coin.price * 1.12;
              const stopLoss = coin.low24h < coin.price ? coin.low24h * 0.98 : coin.price * 0.95;
              const rr = stopLoss < entry ? ((target - entry) / (entry - stopLoss)).toFixed(1) : '2.0';


              return (
                <div
                  key={coin.symbol}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CryptoIcon symbol={coin.symbol} size={22} />
                        <div>
                          <strong style={{ fontSize: '15px', color: '#FFF' }}>{coin.symbol}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{coin.name}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>
                        <PriceCell price={coin.price * multiplier} prefix={prefix} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-strong-buy" style={{ fontSize: '10px' }}>
                        {coin.signalLabelTh || 'สัญญาณบวก'}
                      </span>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--neon-cyan)', marginTop: '3px' }}>
                        AI {coin.aiScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Levels Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>แนวรับ (SL)</span>
                      <div style={{ fontWeight: 700, color: '#EF4444' }}>
                        {prefix}{(stopLoss * multiplier).toLocaleString(undefined, { maximumFractionDigits: stopLoss < 1 ? 4 : 2 })}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>เป้าหมาย (TP)</span>
                      <div style={{ fontWeight: 700, color: '#10B981' }}>
                        {prefix}{(target * multiplier).toLocaleString(undefined, { maximumFractionDigits: target < 1 ? 4 : 2 })}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>R:R Ratio</span>
                      <div style={{ fontWeight: 800, color: 'var(--neon-green-light)' }}>
                        1:{rr}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => onSelectCoin(coin.symbol)}
                      className="btn-primary"
                      style={{ flex: 1, fontSize: '11px', padding: '5px 8px', justifyContent: 'center' }}
                    >
                      <Activity size={12} />
                      <span>เปิดดูกราฟ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAnalysis(coin.symbol)}
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: '11px', padding: '5px 8px', justifyContent: 'center' }}
                    >
                      <Eye size={12} />
                      <span>วิเคราะห์</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Table or Empty State */}
      {watchlist.length === 0 ? (
        <div
          className="crypto-card"
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={28} color="#F59E0B" />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF' }}>
              ยังไม่มีเหรียญในรายการเฝ้าดูของคุณ
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px' }}>
              กดที่รูปดาว ⭐ หน้ารายชื่อเหรียญใดก็ได้ในตาราง หรือกดเพิ่มเหรียญยอดนิยมด้านล่างเพื่อเริ่มเฝ้าดูทันที:
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            {['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP'].map((sym) => (
              <button
                key={sym}
                onClick={() => onToggleWatchlist(sym)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
              >
                <Plus size={13} color="var(--neon-green)" />
                <CryptoIcon symbol={sym} size={15} />
                <span>เพิ่ม {sym}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              ตารางเหรียญที่เฝ้าดูทั้งหมด ({watchlist.length} เหรียญ)
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              คลิก ⭐ เพื่อถอดออกจากรายการ • คลิกที่แถวเพื่อเปิดกราฟ
            </span>
          </div>

          <CoinRankingTable
            coins={watchlist}
            onSelectCoin={onSelectCoin}
            onToggleWatchlist={onToggleWatchlist}
            currency={currency}
            watchlist={watchlist}
            onToggleFocus={onToggleFocus}
            focusSymbols={focusSymbols}
          />
        </div>
      )}
          {/* Edit Target & Personal Strategy Notes Modal */}
      {editingCoin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="crypto-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CryptoIcon symbol={editingCoin.symbol} size={24} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
                  ตั้งค่าเป้าหมาย & โน้ตกลยุทธ์ ({editingCoin.symbol})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoin(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    ราคาเป้าหมายซื้อ (Target Buy {prefix})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="เช่น 65000"
                    value={targetBuy}
                    onChange={(e) => setTargetBuy(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-card-inner)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    ราคาเป้าหมายขาย (Target Sell {prefix})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="เช่น 78000"
                    value={targetSell}
                    onChange={(e) => setTargetSell(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-card-inner)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  บันทึกกลยุทธ์ส่วนตัว (Personal Trading Notes)
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ซื้อสะสมเมื่อย่อแตะ EMA50, Stop Loss หากหลุดแนวรับ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {statusMsg && (
                <div style={{ fontSize: '12px', fontWeight: 600, padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  {statusMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCoin(null)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 16px', gap: '6px' }}
                >
                  <Save size={13} />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกลง Supabase DB'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
