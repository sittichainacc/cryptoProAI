import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  TickerData, 
  Candle,
  BuyNowCandidateItem
} from '../types/index.js';
import { TopMoversCard } from './TopMoversCard.js';
import { MainChartWidget } from './MainChartWidget.js';
import { RightTradingSidebar } from './RightTradingSidebar.js';
import { 
  Columns, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen,
  Maximize2,
  Sliders,
  MoveHorizontal
} from 'lucide-react';

interface ResizableTradingWorkspaceProps {
  movers: { gainers: TickerData[]; losers: TickerData[]; volume: TickerData[] };
  watchlist: TickerData[];
  buyNowCandidates?: BuyNowCandidateItem[];
  selectedSymbol: string;
  selectedCoinData?: TickerData;
  chartCandles: Candle[];
  signals: TickerData[];
  currency: 'THB' | 'USDT';
  isCurrentInWatchlist: boolean;
  onSelectCoin: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  onOpenAnalysis: (symbol: string) => void;
  onViewAllWatchlist: () => void;
}

const STORAGE_KEY = 'cryptopro_docked_workspace_layout_v2';
const DEFAULT_LEFT_PCT = 20;
const DEFAULT_RIGHT_PCT = 28;
const MIN_PANEL_PCT = 14;
const MAX_PANEL_PCT = 48;

export const ResizableTradingWorkspace: React.FC<ResizableTradingWorkspaceProps> = ({
  movers,
  watchlist,
  buyNowCandidates = [],
  selectedSymbol,
  selectedCoinData,
  chartCandles,
  signals,
  currency,
  isCurrentInWatchlist,
  onSelectCoin,
  onToggleWatchlist,
  onOpenAnalysis,
  onViewAllWatchlist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore saved layout or defaults
  const [leftPct, setLeftPct] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.leftPct === 'number') return parsed.leftPct;
      }
    } catch {}
    return DEFAULT_LEFT_PCT;
  });

  const [rightPct, setRightPct] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.rightPct === 'number') return parsed.rightPct;
      }
    } catch {}
    return DEFAULT_RIGHT_PCT;
  });

  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return !!JSON.parse(saved).isLeftCollapsed;
    } catch {}
    return true;
  });

  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return !!JSON.parse(saved).isRightCollapsed;
    } catch {}
    return false;
  });

  const [activeDragging, setActiveDragging] = useState<'left' | 'right' | null>(null);
  const [hoveredDivider, setHoveredDivider] = useState<'left' | 'right' | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ leftPct, rightPct, isLeftCollapsed, isRightCollapsed })
      );
    } catch {}
  }, [leftPct, rightPct, isLeftCollapsed, isRightCollapsed]);

  // Reset proportions to default
  const handleResetLayout = () => {
    setLeftPct(DEFAULT_LEFT_PCT);
    setRightPct(DEFAULT_RIGHT_PCT);
    setIsLeftCollapsed(false);
    setIsRightCollapsed(false);
  };

  // Mouse Dragging for Left Divider
  const startDraggingLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isLeftCollapsed) setIsLeftCollapsed(false);
    setActiveDragging('left');
  }, [isLeftCollapsed]);

  // Mouse Dragging for Right Divider
  const startDraggingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isRightCollapsed) setIsRightCollapsed(false);
    setActiveDragging('right');
  }, [isRightCollapsed]);

  useEffect(() => {
    if (!activeDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      if (containerWidth <= 0) return;

      if (activeDragging === 'left') {
        const offsetX = e.clientX - rect.left;
        let newPct = (offsetX / containerWidth) * 100;
        newPct = Math.max(MIN_PANEL_PCT, Math.min(MAX_PANEL_PCT, newPct));
        setLeftPct(Number(newPct.toFixed(1)));
      } else if (activeDragging === 'right') {
        const offsetX = rect.right - e.clientX;
        let newPct = (offsetX / containerWidth) * 100;
        newPct = Math.max(MIN_PANEL_PCT, Math.min(MAX_PANEL_PCT, newPct));
        setRightPct(Number(newPct.toFixed(1)));
      }
    };

    const handleMouseUp = () => {
      setActiveDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [activeDragging]);

  const effectiveLeftPct = isLeftCollapsed ? 0 : leftPct;
  const effectiveRightPct = isRightCollapsed ? 0 : rightPct;
  const centerPct = Math.max(20, 100 - effectiveLeftPct - effectiveRightPct);

  return (
    <div
      className="docked-workspace-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Workspace Top Control Toolbar */}
      <div
        className="workspace-toolbar workspace-header-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-header)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--neon-green)',
                boxShadow: '0 0 8px var(--neon-green)',
              }}
            />
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
              TRADING WORKSPACE (แบบชิดกัน ปรับสัดส่วนได้อิสระ)
            </span>
          </div>

          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--neon-blue-light)',
              fontWeight: 700,
              fontSize: '11px',
            }}
          >
            {selectedSymbol}/{currency}
          </span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="workspace-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Proportion Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.03)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
            title="สัดส่วนความกว้างของหน้าจอ ซ้าย | กลาง | ขวา"
          >
            <MoveHorizontal size={13} color="var(--neon-cyan)" />
            <span>
              {isLeftCollapsed ? '0%' : `${leftPct.toFixed(0)}%`} : {centerPct.toFixed(0)}% : {isRightCollapsed ? '0%' : `${rightPct.toFixed(0)}%`}
            </span>
          </div>

          {/* Toggle Left Button */}
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            title={isLeftCollapsed ? 'เปิดแถบ Top Movers ซ้าย' : 'ซ่อนแถบ Top Movers ซ้าย'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: isLeftCollapsed ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: isLeftCollapsed ? 'var(--neon-blue-light)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {isLeftCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
            <span>{isLeftCollapsed ? 'เปิดฝั่งซ้าย' : 'ย่อฝั่งซ้าย'}</span>
          </button>

          {/* Toggle Right Button */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            title={isRightCollapsed ? 'เปิดแถบ AI Signals ขวา' : 'ซ่อนแถบ AI Signals ขวา'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: isRightCollapsed ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: isRightCollapsed ? 'var(--neon-blue-light)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {isRightCollapsed ? <PanelRightOpen size={13} /> : <PanelRightClose size={13} />}
            <span>{isRightCollapsed ? 'เปิดฝั่งขวา' : 'ย่อฝั่งขวา'}</span>
          </button>

          {/* Reset Proportions Button */}
          <button
            onClick={handleResetLayout}
            title="รีเซ็ตสัดส่วนหน้าจอเป็นค่ามาตรฐาน (23% : 54% : 23%)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RotateCcw size={12} />
            <span>รีเซ็ตสัดส่วน</span>
          </button>
        </div>
      </div>

      {/* Main Panes Row — Docked Side-by-Side (แบบชิดกัน ไม่มีช่องว่าง) */}
      <div
        ref={containerRef}
        className="docked-panes-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          width: '100%',
          minHeight: '740px',
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        {/* Left Pane: Top 10 Movers */}
        {!isLeftCollapsed && (
          <div
            className="docked-pane docked-pane-left"
            style={{
              width: `${leftPct}%`,
              minWidth: '220px',
              maxWidth: '45%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <TopMoversCard
                gainers={movers.gainers}
                losers={movers.losers}
                volume={movers.volume}
                watchlist={watchlist}
                buyNowCandidates={buyNowCandidates}
                selectedSymbol={selectedSymbol}
                onSelectCoin={onSelectCoin}
                onToggleWatchlist={onToggleWatchlist}
                currency={currency}
              />
            </div>
          </div>
        )}

        {/* Left Resizer Splitter Divider — Interactive Drag Handle */}
        {!isLeftCollapsed && (
          <div
            className={`docked-splitter ${activeDragging === 'left' ? 'is-dragging' : ''}`}
            onMouseDown={startDraggingLeft}
            onMouseEnter={() => setHoveredDivider('left')}
            onMouseLeave={() => setHoveredDivider(null)}
            onDoubleClick={() => setLeftPct(DEFAULT_LEFT_PCT)}
            title="ลากด้วยเมาส์เพื่อปรับสัดส่วนซ้าย-กลาง | ดับเบิลคลิกเพื่อรีเซ็ต"
            style={{
              position: 'relative',
              width: '8px',
              flexShrink: 0,
              cursor: 'col-resize',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                activeDragging === 'left' || hoveredDivider === 'left'
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
              transition: 'background-color 0.15s',
              zIndex: 10,
            }}
          >
            {/* Center Line (glows vibrant blue when active/hovered, like the screenshot!) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: activeDragging === 'left' || hoveredDivider === 'left' ? '2px' : '1px',
                backgroundColor:
                  activeDragging === 'left' || hoveredDivider === 'left'
                    ? '#38BDF8'
                    : 'var(--border-color)',
                boxShadow:
                  activeDragging === 'left' || hoveredDivider === 'left'
                    ? '0 0 10px #38BDF8, 0 0 4px #0284C7'
                    : 'none',
                transition: 'all 0.15s ease',
              }}
            />

            {/* Central Drag Grip Pill */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: '16px',
                height: '34px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card-inner)',
                border:
                  activeDragging === 'left' || hoveredDivider === 'left'
                    ? '1px solid #38BDF8'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow:
                  activeDragging === 'left' || hoveredDivider === 'left'
                    ? '0 0 8px rgba(56, 189, 248, 0.5)'
                    : '0 2px 4px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:
                  activeDragging === 'left' || hoveredDivider === 'left'
                    ? '#38BDF8'
                    : 'var(--text-muted)',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '-1px',
                transition: 'all 0.15s',
              }}
            >
              ◄►
            </div>
          </div>
        )}

        {/* Center Pane: Main Candlestick Chart */}
        <div
          className="docked-pane docked-pane-center"
          style={{
            flex: 1,
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <MainChartWidget
              symbol={selectedSymbol}
              ticker={selectedCoinData}
              candles={chartCandles}
              currency={currency}
              isWatchlist={isCurrentInWatchlist}
              onToggleWatchlist={onToggleWatchlist}
            />
          </div>
        </div>

        {/* Right Resizer Splitter Divider — Interactive Drag Handle */}
        {!isRightCollapsed && (
          <div
            className={`docked-splitter ${activeDragging === 'right' ? 'is-dragging' : ''}`}
            onMouseDown={startDraggingRight}
            onMouseEnter={() => setHoveredDivider('right')}
            onMouseLeave={() => setHoveredDivider(null)}
            onDoubleClick={() => setRightPct(DEFAULT_RIGHT_PCT)}
            title="ลากด้วยเมาส์เพื่อปรับสัดส่วนกลาง-ขวา | ดับเบิลคลิกเพื่อรีเซ็ต"
            style={{
              position: 'relative',
              width: '8px',
              flexShrink: 0,
              cursor: 'col-resize',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                activeDragging === 'right' || hoveredDivider === 'right'
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
              transition: 'background-color 0.15s',
              zIndex: 10,
            }}
          >
            {/* Center Line (glows vibrant blue when active/hovered, like the screenshot!) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: activeDragging === 'right' || hoveredDivider === 'right' ? '2px' : '1px',
                backgroundColor:
                  activeDragging === 'right' || hoveredDivider === 'right'
                    ? '#38BDF8'
                    : 'var(--border-color)',
                boxShadow:
                  activeDragging === 'right' || hoveredDivider === 'right'
                    ? '0 0 10px #38BDF8, 0 0 4px #0284C7'
                    : 'none',
                transition: 'all 0.15s ease',
              }}
            />

            {/* Central Drag Grip Pill */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: '16px',
                height: '34px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card-inner)',
                border:
                  activeDragging === 'right' || hoveredDivider === 'right'
                    ? '1px solid #38BDF8'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow:
                  activeDragging === 'right' || hoveredDivider === 'right'
                    ? '0 0 8px rgba(56, 189, 248, 0.5)'
                    : '0 2px 4px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:
                  activeDragging === 'right' || hoveredDivider === 'right'
                    ? '#38BDF8'
                    : 'var(--text-muted)',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '-1px',
                transition: 'all 0.15s',
              }}
            >
              ◄►
            </div>
          </div>
        )}

        {/* Right Pane: TradingView Inspector & Watchlist */}
        {!isRightCollapsed && (
          <div
            className="docked-pane docked-pane-right"
            style={{
              width: `${rightPct}%`,
              minWidth: '280px',
              maxWidth: '50%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <RightTradingSidebar
              watchlist={watchlist}
              movers={movers}
              signals={signals}
              selectedSymbol={selectedSymbol}
              selectedCoinData={selectedCoinData}
              currency={currency}
              isWatchlist={isCurrentInWatchlist}
              onSelectCoin={onSelectCoin}
              onToggleWatchlist={onToggleWatchlist}
              onOpenAnalysis={onOpenAnalysis}
            />
          </div>
        )}
      </div>
    </div>
  );
};
