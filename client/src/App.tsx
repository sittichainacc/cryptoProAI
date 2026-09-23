import React, { useEffect, useState, useCallback } from 'react';
import { api } from './services/api.js';
import { 
  AlertItem, 
  Candle, 
  CryptoNewsItem, 
  MarketOverviewKPIs, 
  PortfolioSummary, 
  SectorTopItem, 
  TickerData, 
  Top3OverallItem,
  BuyNowCandidateItem,
  FocusResponse,
  FocusCoinData
} from './types/index.js';

import { Sidebar } from './components/Sidebar.js';
import { Topbar } from './components/Topbar.js';
import { KpiCards } from './components/KpiCards.js';
import { ResizableTradingWorkspace } from './components/ResizableTradingWorkspace.js';
import { Top5BuyNowWidget } from './components/Top5BuyNowWidget.js';
import { TopMoversCard } from './components/TopMoversCard.js';
import { MainChartWidget } from './components/MainChartWidget.js';
import { AISignalsCard } from './components/AISignalsCard.js';
import { WatchlistMiniCard } from './components/WatchlistMiniCard.js';
import { CollapsibleSection } from './components/CollapsibleSection.js';
import { Activity, Layers, Award, BarChart3, Target } from 'lucide-react';
import { PortfolioWidgets } from './components/PortfolioWidgets.js';
import { RecentAlertsCard } from './components/RecentAlertsCard.js';
import { AIScannerQuickCard } from './components/AIScannerQuickCard.js';
import { CryptoNewsCard } from './components/CryptoNewsCard.js';
import { QuoteBannerCard } from './components/QuoteBannerCard.js';
import { Sector24Grid } from './components/Sector24Grid.js';
import { Top3OverallCard } from './components/Top3OverallCard.js';
import { CoinRankingTable } from './components/CoinRankingTable.js';
import { CoinAnalysisModal } from './components/CoinAnalysisModal.js';
import { FocusRightSidebar } from './components/FocusRightSidebar.js';
import { FocusAddModal } from './components/FocusAddModal.js';
import { FocusCompareModal } from './components/FocusCompareModal.js';
import { realtimeService } from './services/realtime.js';
import { setGlobalUsdThbRate } from './utils/currency.js';

// Dedicated Subpages
import { MarketOverviewPage } from './pages/MarketOverviewPage.js';
import { CoinScreenerPage } from './pages/CoinScreenerPage.js';
import { CoinAnalysisPage } from './pages/CoinAnalysisPage.js';
import { AISignalsPage } from './pages/AISignalsPage.js';
import { PortfolioPage } from './pages/PortfolioPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { StrategyPage } from './pages/StrategyPage.js';
import { NewsPage } from './pages/NewsPage.js';
import { Top5Page } from './pages/Top5Page.js';
import { FocusPage } from './pages/FocusPage.js';
import { WatchlistPage } from './pages/WatchlistPage.js';

export const App: React.FC = () => {
  // Navigation State
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [activeTopTab, setActiveTopTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currency, setCurrency] = useState<'THB' | 'USDT'>('THB');
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'investor'>('analyst');
  const [isSyncing, setIsSyncing] = useState(false);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarNavigation = useCallback((tabId: string) => {
    setActiveSidebarTab(tabId);
    setIsMobileSidebarOpen(false); // auto-close on mobile after navigation
    if (tabId === 'dashboard' || tabId === 'market') setActiveTopTab('overview');
    else if (tabId === 'screener') setActiveTopTab('screener');
    else if (tabId === 'technical' || tabId === 'analysis') setActiveTopTab('chart');
    else if (tabId === 'signals') setActiveTopTab('signals');
    else if (tabId === 'portfolio' || tabId === 'strategy') setActiveTopTab('portfolio');
    else if (tabId === 'alerts') setActiveTopTab('alerts');
    else if (tabId === 'reports' || tabId === 'news') setActiveTopTab('reports');
    else setActiveTopTab('');
  }, []);

  // Market Data State
  const [kpis, setKpis] = useState<MarketOverviewKPIs | null>(null);
  const [movers, setMovers] = useState<{ gainers: TickerData[]; losers: TickerData[]; volume: TickerData[] }>({
    gainers: [],
    losers: [],
    volume: [],
  });
  const [signals, setSignals] = useState<TickerData[]>([]);
  const [watchlist, setWatchlist] = useState<TickerData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [news, setNews] = useState<CryptoNewsItem[]>([]);
  const [sector24, setSector24] = useState<SectorTopItem[]>([]);
  const [top3Overall, setTop3Overall] = useState<Top3OverallItem[]>([]);
  const [allCoins, setAllCoins] = useState<TickerData[]>([]);
  const [buyNowCandidates, setBuyNowCandidates] = useState<BuyNowCandidateItem[]>([]);
  const [focusData, setFocusData] = useState<FocusResponse | null>(null);
  const [isFocusSidebarOpen, setIsFocusSidebarOpen] = useState(false);
  const [isFocusSidebarPinned, setIsFocusSidebarPinned] = useState(false);
  const [isFocusSidebarCollapsed, setIsFocusSidebarCollapsed] = useState(false);
  const [isFocusAddModalOpen, setIsFocusAddModalOpen] = useState(false);
  const [isFocusCompareModalOpen, setIsFocusCompareModalOpen] = useState(false);

  // Selected Active Coin for Chart & Analysis
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [chartCandles, setChartCandles] = useState<Candle[]>([]);
  const [selectedCoinData, setSelectedCoinData] = useState<TickerData | undefined>();
  const [analysisModalCoin, setAnalysisModalCoin] = useState<TickerData | null>(null);

  // Sync Top Tab with Sidebar Tab
  const handleTopTabChange = (tabId: string) => {
    setActiveTopTab(tabId);
    if (tabId === 'overview') setActiveSidebarTab('dashboard');
    else if (tabId === 'screener') setActiveSidebarTab('screener');
    else if (tabId === 'chart') setActiveSidebarTab('technical');
    else if (tabId === 'signals') setActiveSidebarTab('signals');
    else if (tabId === 'portfolio') setActiveSidebarTab('portfolio');
    else if (tabId === 'alerts') setActiveSidebarTab('alerts');
    else if (tabId === 'reports') setActiveSidebarTab('reports');
  };

  const handleSidebarTabChange = handleSidebarNavigation;

  // Initial Data Fetching
  const loadMarketData = async () => {
    try {
      const [
        kpisData,
        moversData,
        signalsData,
        watchlistData,
        portfolioData,
        alertsData,
        newsData,
        sector24Data,
        top3Data,
        coinsData,
        buyNowData,
        focusRes,
      ] = await Promise.all([
        api.getKPIs(),
        api.getMovers(),
        api.getTopAISignals(),
        api.getWatchlist(),
        api.getPortfolio(),
        api.getRecentAlerts(),
        api.getNews(),
        api.get24Recommended(),
        api.getTop3Overall(),
        api.getCoins(),
        api.getBuyNow(),
        api.getFocusList(),
      ]);

      if (kpisData?.usdThbRate) {
        setGlobalUsdThbRate(kpisData.usdThbRate);
      }
      setKpis(kpisData);
      setMovers(moversData);
      setSignals(signalsData);
      setWatchlist(watchlistData);
      setPortfolio(portfolioData);
      setAlerts(alertsData);
      setNews(newsData);
      setSector24(sector24Data);
      setTop3Overall(top3Data);
      setAllCoins(coinsData);
      if (buyNowData?.candidates) {
        setBuyNowCandidates(buyNowData.candidates);
      }
      if (focusRes) {
        setFocusData(focusRes);
      }
    } catch (err) {
      console.error('Failed to load market data:', err);
    }
  };

  const handleRecalculateBuyNow = async () => {
    try {
      const res = await api.recalculateBuyNow();
      if (res?.candidates) {
        setBuyNowCandidates(res.candidates);
      }
    } catch (err) {
      console.error('Failed to recalculate Buy Now:', err);
    }
  };

  const handleToggleFocus = async (symbol: string) => {
    try {
      const isFocused = focusData?.items.some((i) => i.symbol === symbol);
      if (isFocused) {
        await api.removeFocus(symbol);
      } else {
        await api.addFocus({ symbol });
      }
      const updated = await api.getFocusList();
      setFocusData(updated);
    } catch (err) {
      console.error('Failed to toggle focus:', err);
    }
  };

  const handleRecalculateFocus = async () => {
    try {
      const res = await api.recalculateFocus();
      setFocusData(res);
    } catch (err) {
      console.error('Failed to recalculate Focus:', err);
    }
  };

  // Load Chart for Selected Symbol
  const loadChart = async (symbol: string) => {
    try {
      const data = await api.getChartData(symbol);
      setChartCandles(data.candles);
      setSelectedCoinData(data.ticker);
    } catch (err) {
      console.error(`Failed to load chart for ${symbol}:`, err);
    }
  };

  useEffect(() => {
    loadMarketData();
    loadChart(selectedSymbol);

    // Refresh background data every 20 seconds
    const interval = setInterval(() => {
      loadMarketData();
    }, 20000);

    // Real-time sub-second price streaming from Binance Public WebSocket!
    const unsubTicks = realtimeService.subscribeTicks((ticks) => {
      setAllCoins((prev) => {
        if (!prev || prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((c) => {
          const t = ticks[c.symbol];
          if (t && t.price !== c.price) {
            changed = true;
            return {
              ...c,
              price: t.price,
              change24h: t.change24h,
              high24h: t.high24h,
              low24h: t.low24h,
              volume24h: t.quoteVolume24h,
            };
          }
          return c;
        });
        return changed ? next : prev;
      });

      setSelectedCoinData((prev) => {
        if (!prev) return prev;
        const t = ticks[prev.symbol];
        if (t && t.price !== prev.price) {
          return {
            ...prev,
            price: t.price,
            change24h: t.change24h,
            high24h: t.high24h,
            low24h: t.low24h,
            volume24h: t.quoteVolume24h,
          };
        }
        return prev;
      });

      setMovers((prev) => {
        if (!prev) return prev;
        const updateMovers = (list: TickerData[]) =>
          list.map((c) => {
            const t = ticks[c.symbol];
            return t ? { ...c, price: t.price, change24h: t.change24h } : c;
          });
        return {
          gainers: updateMovers(prev.gainers),
          losers: updateMovers(prev.losers),
          volume: updateMovers(prev.volume),
        };
      });

      setWatchlist((prev) =>
        prev.map((c) => {
          const t = ticks[c.symbol];
          return t ? { ...c, price: t.price, change24h: t.change24h } : c;
        })
      );
    });

    return () => {
      clearInterval(interval);
      unsubTicks();
    };
  }, []);

  const handleSelectCoin = (symbol: string) => {
    setSelectedSymbol(symbol);
    loadChart(symbol);
    const found = allCoins.find((c) => c.symbol === symbol);
    if (found) {
      setSelectedCoinData(found);
    }
  };

  const handleOpenAnalysis = (symbol: string) => {
    const found = allCoins.find((c) => c.symbol === symbol) || selectedCoinData;
    if (found) {
      setAnalysisModalCoin(found);
    }
  };

  const handleToggleWatchlist = async (symbol: string) => {
    await api.toggleWatchlist(symbol);
    const updated = await api.getWatchlist();
    setWatchlist(updated);
    setAllCoins((prev) =>
      prev.map((c) => (c.symbol === symbol ? { ...c, isWatchlist: !c.isWatchlist } : c))
    );
  };

  const handleRunScanner = async (mode: string) => {
    const scanned = await api.runScanner(mode);
    setAllCoins(scanned);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await api.triggerSync();
      await loadMarketData();
    } catch (err) {
      console.error('Failed to sync market data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const isCurrentInWatchlist = watchlist.some((c) => c.symbol === selectedSymbol);

  // Render Page Content based on active navigation
  const renderMainContent = () => {
    switch (activeSidebarTab) {
      case 'focus':
        return (
          <FocusPage
            currency={currency}
            initialSymbol={selectedSymbol}
            onSelectCoinToChart={(sym) => {
              handleSelectCoin(sym);
              setActiveSidebarTab('dashboard');
            }}
            allCoins={allCoins}
          />
        );
      case 'top5':
        return (
          <Top5Page
            currency={currency}
            onSelectCoin={handleSelectCoin}
            onOpenAnalysis={handleOpenAnalysis}
          />
        );
      case 'market':
        return (
          <MarketOverviewPage
            onSelectCoin={(sym) => {
              handleSelectCoin(sym);
              setActiveSidebarTab('dashboard');
            }}
            currency={currency}
          />
        );
      case 'screener':
        return (
          <CoinScreenerPage
            onSelectCoin={handleSelectCoin}
            onToggleWatchlist={handleToggleWatchlist}
            currency={currency}
          />
        );
      case 'analysis':
      case 'technical':
        return (
          <CoinAnalysisPage
            selectedSymbol={selectedSymbol}
            onSelectCoin={handleSelectCoin}
            currency={currency}
          />
        );
      case 'signals':
        return (
          <AISignalsPage
            onSelectCoin={(sym) => {
              handleSelectCoin(sym);
              setActiveSidebarTab('dashboard');
            }}
            currency={currency}
          />
        );
      case 'watchlist':
        return (
          <WatchlistPage
            watchlist={watchlist}
            allCoins={allCoins}
            onSelectCoin={(sym) => {
              handleSelectCoin(sym);
              setActiveSidebarTab('dashboard');
            }}
            onToggleWatchlist={handleToggleWatchlist}
            onOpenAnalysis={handleOpenAnalysis}
            currency={currency}
            onToggleFocus={handleToggleFocus}
            focusSymbols={focusData?.items.map((i) => i.symbol) || []}
          />
        );
      case 'portfolio':
        return <PortfolioPage onSelectCoin={handleSelectCoin} currency={currency} />;
      case 'alerts':
        return <AlertsPage currency={currency} />;
      case 'reports':
        return <ReportsPage kpis={kpis} coins={allCoins} currency={currency} />;
      case 'strategy':
        return <StrategyPage onSelectCoin={handleSelectCoin} currency={currency} />;
      case 'settings':
        return <SettingsPage currency={currency} setCurrency={setCurrency} />;
      case 'news':
        return (
          <NewsPage
            onSelectCoin={(sym) => {
              handleSelectCoin(sym);
              setActiveSidebarTab('dashboard');
            }}
          />
        );

      case 'dashboard':
      default:
        return (
          <>
            {/* Row 1: KPI Cards */}
            <KpiCards kpis={kpis} currency={currency} />

            {/* Row 2: Main Trading Section — แบบชิดกัน ปรับสัดส่วนด้วยเมาส์ (Resizable Docked Workspace) */}
            <ResizableTradingWorkspace
              movers={movers}
              watchlist={watchlist}
              buyNowCandidates={buyNowCandidates}
              selectedSymbol={selectedSymbol}
              selectedCoinData={selectedCoinData}
              chartCandles={chartCandles}
              signals={signals}
              currency={currency}
              isCurrentInWatchlist={isCurrentInWatchlist}
              onSelectCoin={handleSelectCoin}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenAnalysis={handleOpenAnalysis}
              onViewAllWatchlist={() => setActiveSidebarTab('watchlist')}
            />

            {/* Special Module: Top 5 Buy Now — เหรียญที่มีจังหวะเข้าซื้อได้ ณ เวลานี้ (ซ่อนอัตโนมัติหากไม่มีเหรียญผ่านเกณฑ์) */}
            <Top5BuyNowWidget
              candidates={buyNowCandidates}
              currency={currency}
              onSelectCoin={handleSelectCoin}
              onOpenAnalysis={handleOpenAnalysis}
              onRecalculate={handleRecalculateBuyNow}
            />

            {/* Quick Section Guide Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-color)',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  ส่วนประกอบวิเคราะห์เพิ่มเติม (ด้านล่างกราฟ)
                </span>
                <span>• คลิกที่หัวข้อแต่ละส่วนเพื่อ ย่อ/ขยาย (Collapse / Expand) เปิด-ปิด ได้อย่างอิสระ</span>
              </div>
            </div>

            {/* Row 3: Bottom Intelligence Grid (Portfolio, Alerts, AI Scanner, News, Quote) */}
            <CollapsibleSection
              id="intelligence_widgets"
              title="ศูนย์วิเคราะห์พอร์ต ข่าว และเรดาร์อัจฉริยะ"
              subtitle="การจัดสรรพอร์ต, การแจ้งเตือนสัญญาณ, AI Scanner สแกนเหรียญสด, ข่าวกรองตลาด"
              badge="5 วิดเจ็ต"
              badgeColor="var(--neon-cyan)"
              icon={<Activity size={18} color="var(--neon-cyan)" />}
              defaultOpen={true}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                <PortfolioWidgets portfolio={portfolio} currency={currency} />
                <RecentAlertsCard alerts={alerts} onViewAll={() => setActiveSidebarTab('alerts')} />
                <AIScannerQuickCard onRunScanner={handleRunScanner} currency={currency} />
                <CryptoNewsCard news={news} onViewAll={() => setActiveSidebarTab('news')} />
                <QuoteBannerCard />
              </div>
            </CollapsibleSection>

            {/* Row 4: 24 เหรียญแนะนำ (8 สาย สายละ 3 ตัว) - Section 25 & Image 2 */}
            <CollapsibleSection
              id="sector_24"
              title="24 เหรียญแนะนำตามกลุ่มอุตสาหกรรม (8 สาย สายละ 3 ตัว)"
              subtitle="คัดกรองตามคะแนน AI และโครงสร้างทางเทคนิค จัดกลุ่ม Core, L1/L2, DeFi, AI, RWA, Meme, GameFi, Emerging"
              badge="24 เหรียญ"
              badgeColor="var(--neon-blue)"
              icon={<Layers size={18} color="var(--neon-blue)" />}
              action={{ label: 'ดูภาพรวมตลาด', onClick: () => setActiveSidebarTab('market') }}
              defaultOpen={true}
            >
              <Sector24Grid
                items={sector24}
                onSelectCoin={handleSelectCoin}
                onViewAll={() => setActiveSidebarTab('market')}
                hideHeader={true}
              />
            </CollapsibleSection>

            {/* Row 5: ตัวเด่นที่สุดตอนนี้ (Top 3 Overall) - Section 26 & Image 2 */}
            <CollapsibleSection
              id="top3_overall"
              title="ตัวเด่นที่สุดตอนนี้ (Top 3 Overall - Gold, Silver, Bronze)"
              subtitle="เหรียญที่มี Momentum เชิงบวกสูง ทะลุแนวต้านสำคัญ และได้คะแนน AI สูงสุดในตลาด"
              badge="Top 3"
              badgeColor="var(--neon-amber)"
              icon={<Award size={18} color="var(--neon-amber)" />}
              action={{ label: 'ดูบทวิเคราะห์เหรียญเด่น', onClick: () => handleOpenAnalysis(top3Overall[0]?.symbol || 'SOL') }}
              defaultOpen={true}
            >
              <Top3OverallCard
                items={top3Overall}
                onSelectCoin={handleSelectCoin}
                onViewAll={() => handleOpenAnalysis(top3Overall[0]?.symbol || 'SOL')}
                currency={currency}
                hideHeader={true}
              />
            </CollapsibleSection>

            {/* Row 6: Complete Crypto Ranking Table - Section 7 */}
            <CollapsibleSection
              id="coin_ranking"
              title="ตารางจัดอันดับเหรียญคริปโตทั้งหมด (Crypto Screener & Ranking)"
              subtitle="ข้อมูลสตรีมมิ่งสด 100% พร้อมตัวชี้วัดทางเทคนิค RSI, EMA, AI Score และสัญญาณการลงทุน"
              badge={`${allCoins.length} เหรียญ`}
              badgeColor="var(--neon-green)"
              icon={<BarChart3 size={18} color="var(--neon-green)" />}
              defaultOpen={true}
            >
              <CoinRankingTable
                coins={allCoins}
                onSelectCoin={handleSelectCoin}
                onToggleWatchlist={handleToggleWatchlist}
                currency={currency}
                hideCardWrapper={true}
                watchlist={watchlist}
              />
            </CollapsibleSection>
          </>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Mobile sidebar backdrop overlay */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeSidebarTab}
        setActiveTab={handleSidebarTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
      />

      {/* Main Content Viewport */}
      <div className="main-content">
        <Topbar
          currency={currency}
          setCurrency={setCurrency}
          coins={allCoins}
          onSearchSelect={handleSelectCoin}
          activeTopTab={activeTopTab}
          setActiveTopTab={handleTopTabChange}
          userRole={userRole}
          setUserRole={setUserRole}
          onMobileMenuToggle={() => setIsMobileSidebarOpen((p) => !p)}
        />

        <div className="content-body">
          {/* Investor Mode Notice Banner */}
          {userRole === 'investor' && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.14), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>🟢</span>
                <span style={{ fontWeight: 700, color: '#34D399' }}>โหมดนักลงทุน (Investor Mode):</span>
                <span style={{ color: '#CBD5E1' }}>
                  ระบบคัดกรองเฉพาะสัญญาณซื้อขายที่ชัดเจน พร้อมคำนวณเป้าหมายกำไรและจุดตัดขาดทุนให้เข้าใจง่าย
                </span>
              </div>
              <button
                onClick={() => setUserRole('analyst')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFF',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                สลับเป็นโหมดนักวิเคราะห์
              </button>
            </div>
          )}

          {/* Admin Mode Telemetry Banner */}
          {userRole === 'admin' && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.16), rgba(59, 130, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px' }}>⚡</span>
                <span style={{ fontWeight: 700, color: '#A78BFA' }}>โหมดผู้ดูแลระบบ (Admin Mode):</span>
                <span style={{ color: '#CBD5E1' }}>
                  Backend Poller: <strong style={{ color: '#34D399' }}>● Live (20s)</strong> | Bitkub: Connected | Binance: Connected
                </span>
              </div>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="btn-secondary"
                style={{ padding: '4px 12px', fontSize: '11.5px', backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: '#8B5CF6' }}
              >
                {isSyncing ? 'กำลังซิงค์...' : '🔄 ซิงค์ข้อมูล Bitkub/Binance เดี๋ยวนี้'}
              </button>
            </div>
          )}

          {renderMainContent()}
        </div>
      </div>

      {/* Modal for Deep Coin Analysis */}
      <CoinAnalysisModal
        coin={analysisModalCoin}
        onClose={() => setAnalysisModalCoin(null)}
        currency={currency}
      />

      {/* Focus Right Sidebar Drawer */}
      <FocusRightSidebar
        isOpen={isFocusSidebarOpen}
        onToggleOpen={() => setIsFocusSidebarOpen(!isFocusSidebarOpen)}
        isPinned={isFocusSidebarPinned}
        onTogglePin={() => setIsFocusSidebarPinned(!isFocusSidebarPinned)}
        isCollapsed={isFocusSidebarCollapsed}
        onToggleCollapse={() => setIsFocusSidebarCollapsed(!isFocusSidebarCollapsed)}
        focusCoins={focusData?.items || []}
        selectedSymbol={selectedSymbol}
        onSelectCoin={handleSelectCoin}
        onOpenAddModal={() => setIsFocusAddModalOpen(true)}
        onOpenCompareModal={() => setIsFocusCompareModalOpen(true)}
        onRecalculate={handleRecalculateFocus}
        onOpenFocusPage={(sym) => {
          if (sym) handleSelectCoin(sym);
          setActiveSidebarTab('focus');
        }}
        currency={currency}
      />

      {/* Focus Add Modal */}
      <FocusAddModal
        isOpen={isFocusAddModalOpen}
        onClose={() => setIsFocusAddModalOpen(false)}
        coins={allCoins}
        existingFocusSymbols={focusData?.items.map((i) => i.symbol) || []}
        onAddFocus={async (payload) => {
          await api.addFocus(payload);
          await handleRecalculateFocus();
        }}
        currency={currency}
      />

      {/* Focus Compare Modal */}
      {focusData && (
        <FocusCompareModal
          isOpen={isFocusCompareModalOpen}
          onClose={() => setIsFocusCompareModalOpen(false)}
          focusCoins={focusData.items}
          currency={currency}
          onSelectCoin={(sym) => {
            handleSelectCoin(sym);
            setActiveSidebarTab('focus');
          }}
        />
      )}
    </div>
  );
};

export default App;
