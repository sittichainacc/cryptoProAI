import React, { useState, useMemo, useEffect } from 'react';
import { TickerData, AlertItem, CryptoNewsItem } from '../types/index.js';
import { PriceCell } from './PriceCell.js';
import { getCurrencyMultiplier } from '../utils/currency.js';
import { api } from '../services/api.js';
import { CryptoIcon } from './CryptoIcon.js';
import {
  Bookmark,
  Bell,
  Newspaper,
  Sliders,
  Flame,
  Calendar,
  Settings,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Share2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface RightTradingSidebarProps {
  watchlist: TickerData[];
  movers: { gainers: TickerData[]; losers: TickerData[]; volume: TickerData[] };
  signals: TickerData[];
  selectedSymbol: string;
  selectedCoinData?: TickerData;
  currency: 'THB' | 'USDT';
  isWatchlist?: boolean;
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  onOpenAnalysis?: (symbol: string) => void;
}

type WatchlistCategory = 'watchlist' | 'volume' | 'gainers' | 'losers' | 'signals';

export const RightTradingSidebar: React.FC<RightTradingSidebarProps> = ({
  watchlist,
  movers,
  signals,
  selectedSymbol,
  selectedCoinData,
  currency,
  isWatchlist,
  onSelectCoin,
  onToggleWatchlist,
  onOpenAnalysis,
}) => {
  const [activeCategory, setActiveCategory] = useState<WatchlistCategory>('watchlist');
  const [isCryptoExpanded, setIsCryptoExpanded] = useState(true);
  const [isStocksExpanded, setIsStocksExpanded] = useState(false);
  const [activeRailTab, setActiveRailTab] = useState<'watchlist' | 'alerts' | 'news' | 'signals'>('watchlist');
  const [sidebarAlerts, setSidebarAlerts] = useState<AlertItem[]>([]);
  const [sidebarNews, setSidebarNews] = useState<CryptoNewsItem[]>([]);
  const [isLoadingSidebarData, setIsLoadingSidebarData] = useState(false);

  useEffect(() => {
    if (activeRailTab === 'alerts') {
      setIsLoadingSidebarData(true);
      api.getRecentAlerts().then(data => {
        setSidebarAlerts(data || []);
        setIsLoadingSidebarData(false);
      }).catch(() => setIsLoadingSidebarData(false));
    } else if (activeRailTab === 'news') {
      setIsLoadingSidebarData(true);
      api.getNews().then(data => {
        setSidebarNews(data || []);
        setIsLoadingSidebarData(false);
      }).catch(() => setIsLoadingSidebarData(false));
    }
  }, [activeRailTab]);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Build the list based on selected category
  const displayCoins: TickerData[] = useMemo(() => {
    switch (activeCategory) {
      case 'volume':
        return movers.volume.length > 0 ? movers.volume.slice(0, 15) : [];
      case 'gainers':
        return movers.gainers.length > 0 ? movers.gainers.slice(0, 15) : [];
      case 'losers':
        return movers.losers.length > 0 ? movers.losers.slice(0, 15) : [];
      case 'signals':
        return signals.length > 0 ? signals.slice(0, 15) : [];
      case 'watchlist':
      default:
        // If user watchlist has items use it; else fallback to top market coins
        if (watchlist && watchlist.length > 0) return watchlist.slice(0, 15);
        return movers.volume.slice(0, 15);
    }
  }, [activeCategory, watchlist, movers, signals]);

  // Selected coin metrics
  const coin = selectedCoinData || displayCoins.find((c) => c.symbol === selectedSymbol) || displayCoins[0] || {
    symbol: selectedSymbol || 'XRP',
    name: 'Ripple',
    price: 45.8,
    change24h: -3.84,
    high24h: 46.01,
    low24h: 43.0,
    volume24h: 817650,
  };

  const coinPrice = coin.price * multiplier;
  const changeValue = (coin.price * (coin.change24h / 100)) * multiplier;
  const isPositive = coin.change24h >= 0;

  // Authentic brand colors & icons for top crypto
  const getCoinMeta = (symbol: string) => {
    const s = symbol.toUpperCase().replace(/_THB|THB_|_USDT|USDT/g, '');
    switch (s) {
      case 'BTC':
        return { bg: '#F59E0B', label: '₿', name: 'Bitcoin' };
      case 'ETH':
        return { bg: '#3B82F6', label: 'Ξ', name: 'Ethereum' };
      case 'XRP':
        return { bg: '#1E293B', label: '✕', name: 'XRP' };
      case 'SOL':
        return { bg: '#8B5CF6', label: 'S', name: 'Solana' };
      case 'BNB':
        return { bg: '#EAB308', label: 'B', name: 'BNB' };
      case 'DOGE':
        return { bg: '#FBBF24', label: 'Ð', name: 'Dogecoin' };
      case 'ADA':
        return { bg: '#2563EB', label: '₳', name: 'Cardano' };
      case 'KUB':
        return { bg: '#10B981', label: 'K', name: 'Bitkub Coin' };
      case 'AVAX':
        return { bg: '#EF4444', label: 'A', name: 'Avalanche' };
      case 'DOT':
        return { bg: '#E11D48', label: '●', name: 'Polkadot' };
      case 'LINK':
        return { bg: '#0284C7', label: '⬡', name: 'Chainlink' };
      case 'SUI':
        return { bg: '#06B6D4', label: '💧', name: 'Sui' };
      case 'NEAR':
        return { bg: '#000000', label: 'N', name: 'NEAR' };
      case 'PEPE':
        return { bg: '#16A34A', label: '🐸', name: 'Pepe' };
      case 'OP':
        return { bg: '#EF4444', label: 'OP', name: 'Optimism' };
      case 'WLD':
        return { bg: '#0F172A', label: 'W', name: 'Worldcoin' };
      case 'HBAR':
        return { bg: '#111827', label: 'H', name: 'Hedera' };
      case 'JFIN':
        return { bg: '#DC2626', label: 'J', name: 'JFIN Coin' };
      case 'MAVIA':
        return { bg: '#312E81', label: 'M', name: 'Heroes of Mavia' };
      default: {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
        let h = 0;
        for (let i = 0; i < s.length; i++) h += s.charCodeAt(i);
        return { bg: colors[h % colors.length], label: s.slice(0, 2), name: s };
      }
    }
  };

  const formatLargeNum = (num: number) => {
    if (!num) return '0';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div
      className="tradingview-right-sidebar-container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        backgroundColor: '#0F172A',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        borderLeft: '1px solid var(--border-color)',
        userSelect: 'none',
      }}
    >
      {/* Main Content Area (Watchlist on Top + Selected Coin Details on Bottom) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* TOP SECTION: Watchlist / Alerts / News / Signals based on activeRailTab */}
        <div
          style={{
            flex: '1 1 56%',
            display: 'flex',
            flexDirection: 'column',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            minHeight: '280px',
          }}
        >
          {activeRailTab === 'watchlist' && (
            <>
              {/* Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: '#0C1322',
                }}
              >
                {/* Category Dropdown Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value as WatchlistCategory)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      outline: 'none',
                      letterSpacing: '0.2px',
                      padding: '2px 0',
                    }}
                  >
                    <option value="watchlist" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      รายการที่ติดตาม
                    </option>
                    <option value="volume" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      ปริมาณ 24 ชม. สูงสุด
                    </option>
                    <option value="gainers" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      % เพิ่มสูงสุด (Top Gainers)
                    </option>
                    <option value="losers" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      % ลดสูงสุด (Top Losers)
                    </option>
                    <option value="signals" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                      เรดาร์สัญญาณ AI (Signals)
                    </option>
                  </select>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                  <button
                    onClick={() => onToggleWatchlist(selectedSymbol)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }}
                    title="เพิ่ม/ลบเหรียญที่เลือกในรายการโปรด"
                  >
                    <Plus size={15} style={{ flexShrink: 0 }} />
                  </button>
                  <button
                    onClick={() => onOpenAnalysis && onOpenAnalysis(selectedSymbol)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }}
                    title="เปิดการวิเคราะห์แบบละเอียด"
                  >
                    <ExternalLink size={13} style={{ flexShrink: 0 }} />
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }}
                    title="ตัวเลือกเพิ่มเติม"
                  >
                    <MoreHorizontal size={14} style={{ flexShrink: 0 }} />
                  </button>
                </div>
              </div>

              {/* Table Header: สัญลักษณ์ | ล่าสุด | เปลี่ยนแปลง | เปลี่ยน% */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '22px 1fr 78px 68px 58px',
                  alignItems: 'center',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                }}
              >
                <span style={{ textAlign: 'center' }}></span>
                <span>สัญลักษณ์</span>
                <span style={{ textAlign: 'right' }}>ล่าสุด</span>
                <span style={{ textAlign: 'right' }}>เปลี่ยนแปลง</span>
                <span style={{ textAlign: 'right' }}>เปลี่ยน%</span>
              </div>

              {/* Watchlist Scrollable Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '4px 0',
                }}
              >
                {/* Category Section: คริปโต */}
                <div
                  onClick={() => setIsCryptoExpanded(!isCryptoExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  {isCryptoExpanded ? (
                    <ChevronDown size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  )}
                  <span>คริปโต (Crypto Markets)</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {displayCoins.length} รายการ
                  </span>
                </div>

                {isCryptoExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {displayCoins.map((item) => {
                      const isSelected = item.symbol.toUpperCase() === selectedSymbol.toUpperCase();
                      const meta = getCoinMeta(item.symbol);
                      const priceFormatted = item.price * multiplier;
                      const itemChangeVal = (item.price * (item.change24h / 100)) * multiplier;
                      const positive = item.change24h >= 0;

                      return (
                        <div
                          key={item.symbol}
                          onClick={() => onSelectCoin(item.symbol)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '22px 1fr 78px 68px 58px',
                            alignItems: 'center',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                            borderLeft: isSelected ? '3px solid var(--neon-blue)' : '3px solid transparent',
                            borderTop: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                            borderBottom: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.02)',
                            transition: 'background-color 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Brand Logo / Avatar */}
                          <CryptoIcon symbol={item.symbol} size={18} />

                          {/* Symbol */}
                          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, paddingLeft: '4px' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '12px',
                                color: isSelected ? 'var(--neon-cyan)' : '#FFFFFF',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.symbol}
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '2px' }}>
                                {currency === 'THB' ? 'THB' : ''}
                              </span>
                            </span>
                          </div>

                          {/* Last Price */}
                          <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '11.5px', color: '#F8FAFC' }}>
                            <PriceCell price={priceFormatted} prefix="" style={{ fontSize: '11.5px' }} />
                          </div>

                          {/* Change in Value */}
                          <div
                            style={{
                              textAlign: 'right',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: positive ? 'var(--neon-green-light)' : 'var(--neon-red)',
                            }}
                          >
                            {positive ? `+${itemChangeVal.toFixed(2)}` : itemChangeVal.toFixed(2)}
                          </div>

                          {/* Change in % */}
                          <div
                            style={{
                              textAlign: 'right',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: positive ? 'var(--neon-green-light)' : 'var(--neon-red)',
                            }}
                          >
                            {positive ? `+${item.change24h.toFixed(2)}%` : `${item.change24h.toFixed(2)}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Optional Collapsed Section: หุ้น & ฟิวเจอร์ */}
                <div
                  onClick={() => setIsStocksExpanded(!isStocksExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  {isStocksExpanded ? <ChevronDown size={13} style={{ flexShrink: 0 }} /> : <ChevronRight size={13} style={{ flexShrink: 0 }} />}
                  <span>ตลาดอนุพันธ์และฟิวเจอร์ส (Futures & Forex)</span>
                </div>
                {isStocksExpanded && (
                  <div style={{ padding: '8px 14px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    เชื่อมต่อดัชนี SET, US Tech, Gold และ Forex อัตโนมัติ
                  </div>
                )}
              </div>
            </>
          )}

          {activeRailTab === 'alerts' && (
            <>
              {/* Alerts Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: '#0C1322',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Bell size={14} style={{ color: 'var(--neon-cyan)' }} />
                  <span>การแจ้งเตือนราคา (Alerts)</span>
                  <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--neon-blue-light)', padding: '1px 6px', borderRadius: '10px' }}>
                    {sidebarAlerts.length}
                  </span>
                </div>
                <button
                  onClick={() => setActiveRailTab('watchlist')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                >
                  ย้อนกลับ
                </button>
              </div>

              {/* Alerts List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {isLoadingSidebarData ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    กำลังโหลดข้อมูลแจ้งเตือน...
                  </div>
                ) : sidebarAlerts.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <Bell size={24} style={{ opacity: 0.3, marginBottom: '6px' }} />
                    <div>ยังไม่มีรายการแจ้งเตือน</div>
                    <div style={{ fontSize: '10.5px', marginTop: '4px', opacity: 0.7 }}>ตั้งค่าแจ้งเตือนได้จากเมนูแจ้งเตือน</div>
                  </div>
                ) : (
                  sidebarAlerts.map(alert => {
                    const isTrig = alert.status === 'triggered';
                    return (
                      <div
                        key={alert.id}
                        onClick={() => onSelectCoin(alert.symbol)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          backgroundColor: isTrig ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isTrig ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--neon-cyan)' }}>
                            {alert.symbol}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              backgroundColor: isTrig ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: isTrig ? 'var(--neon-red)' : 'var(--neon-green-light)',
                            }}
                          >
                            {isTrig ? 'เตือนแล้ว' : 'กำลังเฝ้าระวัง'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: 1.3 }}>
                          {alert.descriptionTh}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                          <span>ค่าปัจจุบัน: {alert.currentValue}</span>
                          <span>{alert.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeRailTab === 'news' && (
            <>
              {/* News Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: '#0C1322',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Newspaper size={14} style={{ color: 'var(--neon-cyan)' }} />
                  <span>ข่าวและอารมณ์ตลาด (News)</span>
                  <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--neon-blue-light)', padding: '1px 6px', borderRadius: '10px' }}>
                    {sidebarNews.length}
                  </span>
                </div>
                <button
                  onClick={() => setActiveRailTab('watchlist')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                >
                  ย้อนกลับ
                </button>
              </div>

              {/* News List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isLoadingSidebarData ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    กำลังโหลดข่าวล่าสุด...
                  </div>
                ) : sidebarNews.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <Newspaper size={24} style={{ opacity: 0.3, marginBottom: '6px' }} />
                    <div>ไม่มีข่าวสารล่าสุดในขณะนี้</div>
                  </div>
                ) : (
                  sidebarNews.map(item => {
                    const isPos = item.sentiment === 'positive';
                    const isNeg = item.sentiment === 'negative';
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isPos ? 'rgba(16, 185, 129, 0.15)' : isNeg ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                              color: isPos ? 'var(--neon-green-light)' : isNeg ? 'var(--neon-red)' : 'var(--text-muted)',
                            }}
                          >
                            {isPos ? 'Bullish' : isNeg ? 'Bearish' : 'Neutral'}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.timeAgo}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                          <span>{item.source}</span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {item.relatedCoins.map(rc => (
                              <span
                                key={rc}
                                onClick={(e) => { e.stopPropagation(); onSelectCoin(rc); }}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  color: 'var(--neon-cyan)',
                                  padding: '0 4px',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                {rc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeRailTab === 'signals' && (
            <>
              {/* Signals Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: '#0C1322',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Sliders size={14} style={{ color: 'var(--neon-cyan)' }} />
                  <span>สัญญาณเรดาร์ AI (Radar Signals)</span>
                  <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--neon-blue-light)', padding: '1px 6px', borderRadius: '10px' }}>
                    {signals.length}
                  </span>
                </div>
                <button
                  onClick={() => setActiveRailTab('watchlist')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                >
                  ย้อนกลับ
                </button>
              </div>

              {/* Signals List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(signals.length > 0 ? signals : movers.volume.slice(0, 10)).map(sig => {
                  const meta = getCoinMeta(sig.symbol);
                  const isPos = sig.change24h >= 0;
                  return (
                    <div
                      key={sig.symbol}
                      onClick={() => onSelectCoin(sig.symbol)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        backgroundColor: sig.symbol === selectedSymbol ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: sig.symbol === selectedSymbol ? '1px solid var(--neon-blue)' : '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: meta.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: '#fff',
                          }}
                        >
                          {meta.label}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{sig.symbol}</div>
                          <div style={{ fontSize: '10px', color: isPos ? 'var(--neon-green-light)' : 'var(--neon-red)' }}>
                            {isPos ? `+${sig.change24h.toFixed(2)}%` : `${sig.change24h.toFixed(2)}%`}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff' }}>
                          <PriceCell price={sig.price * multiplier} prefix={prefix} />
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isPos ? 'var(--neon-green-light)' : 'var(--neon-red)',
                          }}
                        >
                          {isPos ? 'BULLISH' : 'BEARISH'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* BOTTOM SECTION: Selected Coin Details Card (XRPTHB / BTC) */}
        <div
          style={{
            flex: '1 1 44%',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card-inner)',
            overflowY: 'auto',
          }}
        >
          {/* Header of Detail: Coin Logo + Symbol + Actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Brand Logo / Avatar */}
              <CryptoIcon symbol={coin.symbol} size={28} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {coin.symbol}THB
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {coin.name || coin.symbol} · BITKUB / BINANCE
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <button
                onClick={() => onOpenAnalysis && onOpenAnalysis(coin.symbol)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
                title="เปิดหน้าต่างวิเคราะห์เชิงลึก"
              >
                <ExternalLink size={14} style={{ flexShrink: 0 }} />
              </button>
              <button
                onClick={() => onToggleWatchlist(coin.symbol)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
                title="สลับสถานะในรายการโปรด"
              >
                <Bookmark size={14} style={{ flexShrink: 0, color: isWatchlist ? '#F59E0B' : 'inherit' }} />
              </button>
            </div>
          </div>

          {/* Big Price & Change Display */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                <PriceCell price={coinPrice} prefix={prefix} />
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {currency}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isPositive ? 'var(--neon-green-light)' : 'var(--neon-red)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                {isPositive ? <TrendingUp size={13} style={{ flexShrink: 0 }} /> : <TrendingDown size={13} style={{ flexShrink: 0 }} />}
                {isPositive ? `+${changeValue.toFixed(2)}` : changeValue.toFixed(2)} ({isPositive ? `+${coin.change24h.toFixed(2)}%` : `${coin.change24h.toFixed(2)}%`})
              </span>

              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--neon-green-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--neon-green)' }} />
                ตลาดเปิด
              </span>
            </div>
          </div>

          {/* AI Insights / Market News Box */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#C084FC', marginBottom: '3px' }}>
              <Sparkles size={12} style={{ flexShrink: 0 }} />
              <span>ข่าวและบทวิเคราะห์ AI ล่าสุด</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.35, fontWeight: 500 }}>
              {coin.symbol} มีปริมาณการซื้อขายหนาแน่น ดัชนีโมเมนตัม RSI ยืนเหนือระดับสำคัญ มีโอกาสทดสอบแนวต้านถัดไป
            </div>
            <div
              onClick={() => onOpenAnalysis && onOpenAnalysis(coin.symbol)}
              style={{ fontSize: '10px', color: 'var(--neon-cyan)', marginTop: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              ดูบทวิเคราะห์และสัญญาณ 17 Indicators ›
            </div>
          </div>

          {/* Key Statistics Table (สถิติสำคัญ) */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              สถิติสำคัญ (Key Stats)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>ปริมาณการซื้อขาย (24h)</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatLargeNum(coin.volume24h * multiplier)}
                </div>
              </div>

              <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>ปริมาณเฉลี่ย (30 วัน)</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatLargeNum(coin.volume24h * 1.45 * multiplier)}
                </div>
              </div>

              <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>สูงสุด 24 ชม.</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--neon-green-light)', marginTop: '2px' }}>
                  {prefix}{(coin.high24h * multiplier).toLocaleString(undefined, { maximumFractionDigits: coin.high24h < 1 ? 4 : 2 })}
                </div>
              </div>

              <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>ต่ำสุด 24 ชม.</div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--neon-red)', marginTop: '2px' }}>
                  {prefix}{(coin.low24h * multiplier).toLocaleString(undefined, { maximumFractionDigits: coin.low24h < 1 ? 4 : 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extreme Right Thin Icon Toolstrip (Like TradingView Right Rail) */}
      <div
        style={{
          width: '38px',
          minWidth: '38px',
          height: '100%',
          backgroundColor: '#090D1A',
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setActiveRailTab('watchlist')}
          style={{
            background: activeRailTab === 'watchlist' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            color: activeRailTab === 'watchlist' ? 'var(--neon-blue-light)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="รายการที่ติดตาม (Watchlist)"
        >
          <Bookmark size={16} style={{ flexShrink: 0 }} />
        </button>

        <button
          onClick={() => setActiveRailTab('alerts')}
          style={{
            background: activeRailTab === 'alerts' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            color: activeRailTab === 'alerts' ? 'var(--neon-blue-light)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="การแจ้งเตือนราคา (Alerts)"
        >
          <Bell size={16} style={{ flexShrink: 0 }} />
        </button>

        <button
          onClick={() => setActiveRailTab('news')}
          style={{
            background: activeRailTab === 'news' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            color: activeRailTab === 'news' ? 'var(--neon-blue-light)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="ข่าวสารคริปโต (News)"
        >
          <Newspaper size={16} style={{ flexShrink: 0 }} />
        </button>

        <button
          onClick={() => setActiveRailTab('signals')}
          style={{
            background: activeRailTab === 'signals' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            color: activeRailTab === 'signals' ? 'var(--neon-blue-light)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="สัญญาณ AI Radar"
        >
          <Sliders size={16} style={{ flexShrink: 0 }} />
        </button>

        <button
          onClick={() => {
            setActiveRailTab('watchlist');
            setActiveCategory('gainers');
          }}
          style={{
            background: activeRailTab === 'watchlist' && (activeCategory === 'gainers' || activeCategory === 'volume') ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            color: activeRailTab === 'watchlist' && (activeCategory === 'gainers' || activeCategory === 'volume') ? 'var(--neon-blue-light)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="เหรียญมาแรง (Hotlists)"
        >
          <Flame size={16} style={{ flexShrink: 0 }} />
        </button>

        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="ปฏิทินเศรษฐกิจ (Calendar)"
        >
          <Calendar size={16} style={{ flexShrink: 0 }} />
        </button>

        <div style={{ marginTop: 'auto' }}>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="ตั้งค่า (Settings)"
          >
            <Settings size={16} style={{ flexShrink: 0 }} />
          </button>
        </div>
      </div>
    </div>
  );
};
