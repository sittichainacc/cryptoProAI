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
  Top3OverallItem 
} from './types/index.js';

import { Sidebar } from './components/Sidebar.js';
import { Topbar } from './components/Topbar.js';
import { KpiCards } from './components/KpiCards.js';
import { TopMoversCard } from './components/TopMoversCard.js';
import { MainChartWidget } from './components/MainChartWidget.js';
import { AISignalsCard } from './components/AISignalsCard.js';
import { WatchlistMiniCard } from './components/WatchlistMiniCard.js';
import { PortfolioWidgets } from './components/PortfolioWidgets.js';
import { RecentAlertsCard } from './components/RecentAlertsCard.js';
import { AIScannerQuickCard } from './components/AIScannerQuickCard.js';
import { CryptoNewsCard } from './components/CryptoNewsCard.js';
import { QuoteBannerCard } from './components/QuoteBannerCard.js';
import { Sector24Grid } from './components/Sector24Grid.js';
import { Top3OverallCard } from './components/Top3OverallCard.js';
import { CoinRankingTable } from './components/CoinRankingTable.js';
import { CoinAnalysisModal } from './components/CoinAnalysisModal.js';
import { TradingViewTickerTape } from './components/TradingViewTickerTape.js';
import { realtimeService } from './services/realtime.js';

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

export const App: React.FC = () => {
  // Navigation State
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [activeTopTab, setActiveTopTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currency, setCurrency] = useState<'THB' | 'USDT'>('USDT');
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
    if (tabId === 'dashboard') setActiveTopTab('overview');
    else if (tabId === 'screener') setActiveTopTab('screener');
    else if (tabId === 'technical' || tabId === 'analysis') setActiveTopTab('chart');
    else if (tabId === 'signals') setActiveTopTab('signals');
    else if (tabId === 'portfolio') setActiveTopTab('portfolio');
    else if (tabId === 'alerts') setActiveTopTab('alerts');
    else if (tabId === 'reports') setActiveTopTab('reports');
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
      ]);

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
    } catch (err) {
      console.error('Failed to load market data:', err);
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
      case 'market':
        return <MarketOverviewPage onSelectCoin={handleSelectCoin} currency={currency} />;
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
        return <AISignalsPage onSelectCoin={handleSelectCoin} currency={currency} />;
      case 'watchlist':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>รายการเฝ้าดูของฉัน (Watchlist)</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                เหรียญที่คุณติดตามอย่างใกล้ชิด พร้อมแจ้งเตือนการเปลี่ยนแปลงของสัญญาณและระดับราคา
              </p>
            </div>
            <CoinRankingTable
              coins={watchlist}
              onSelectCoin={handleSelectCoin}
              onToggleWatchlist={handleToggleWatchlist}
              currency={currency}
            />
          </div>
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
      case 'dashboard':
      default:
        return (
          <>
            {/* Row 1: KPI Cards */}
            <KpiCards kpis={kpis} />

            {/* Row 2: Main Trading Section (Top Movers + Main Chart + AI Signals & Watchlist) */}
            <div className="trading-main-grid">
              {/* Left: Top 10 Movers (24h) */}
              <TopMoversCard
                gainers={movers.gainers}
                losers={movers.losers}
                volume={movers.volume}
                selectedSymbol={selectedSymbol}
                onSelectCoin={handleSelectCoin}
                currency={currency}
              />

              {/* Center: Main Candlestick Chart */}
              <MainChartWidget
                symbol={selectedSymbol}
                ticker={selectedCoinData}
                candles={chartCandles}
                currency={currency}
                isWatchlist={isCurrentInWatchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Right: AI Signals (Top) & Watchlist (Bottom) */}
              <div className="right-signals-column" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <AISignalsCard
                  signals={signals}
                  onSelectCoin={handleSelectCoin}
                  onViewAll={() => handleOpenAnalysis(signals[0]?.symbol || 'SOL')}
                />
                <WatchlistMiniCard
                  watchlist={watchlist}
                  onSelectCoin={handleSelectCoin}
                  onViewAll={() => setActiveSidebarTab('watchlist')}
                  currency={currency}
                />
              </div>
            </div>

            {/* Row 3: Bottom Intelligence Grid (Portfolio, Alerts, AI Scanner, News, Quote) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <PortfolioWidgets portfolio={portfolio} currency={currency} />
              <RecentAlertsCard alerts={alerts} onViewAll={() => setActiveSidebarTab('alerts')} />
              <AIScannerQuickCard onRunScanner={handleRunScanner} />
              <CryptoNewsCard news={news} onViewAll={() => setActiveSidebarTab('news')} />
              <QuoteBannerCard />
            </div>

            {/* Row 4: 24 เหรียญแนะนำ (8 สาย สายละ 3 ตัว) - Section 25 & Image 2 */}
            <Sector24Grid
              items={sector24}
              onSelectCoin={handleSelectCoin}
              onViewAll={() => setActiveSidebarTab('market')}
            />

            {/* Row 5: ตัวเด่นที่สุดตอนนี้ (Top 3 Overall) - Section 26 & Image 2 */}
            <Top3OverallCard
              items={top3Overall}
              onSelectCoin={handleSelectCoin}
              onViewAll={() => handleOpenAnalysis(top3Overall[0]?.symbol || 'SOL')}
              currency={currency}
            />

            {/* Row 6: Complete Crypto Ranking Table - Section 7 */}
            <CoinRankingTable
              coins={allCoins}
              onSelectCoin={handleSelectCoin}
              onToggleWatchlist={handleToggleWatchlist}
              currency={currency}
            />
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
          {/* Live Real-Time Internet Ticker Tape (Binance / Bitkub stream via TradingView) */}
          <TradingViewTickerTape theme="dark" />

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
    </div>
  );
};

export default App;
