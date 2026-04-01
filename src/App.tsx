import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Newspaper,
  MessageSquare,
  Search,
  Bell,
  UserCircle,
  TrendingUp,
  Sun,
  Moon,
  Loader2,
  Languages
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Watchlist } from './components/Watchlist';
import { Portfolio } from './components/Portfolio';
import { NewsTimeline } from './components/NewsTimeline';
import { AIChat } from './components/AIChat';
import { CandlestickChart } from './components/CandlestickChart';
import { MarketSummary } from './components/MarketSummary';
import { Asset, Holding, NewsItem, User } from './types';
import { cn } from './lib/utils';
import {
  fetchAllTickers,
  toTickerSummary,
  toOHLCBars,
  AVAILABLE_TICKERS,
  TICKER_META,
  type RawPriceData,
  type TickerSummary,
  type OHLCBar,
} from './services/priceApi';

import { getBackendAssets, getBackendAssetsPaginated, getBackendHoldings, getUser } from './services/backendApi';
import { HoldingsEditor } from './components/HoldingsEditor';

// Static fund fallbacks (not available from the stock API or current backend)
const STATIC_FUND_ASSETS: Asset[] = [
  { id: 'fund-vti', symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'fund', price: 254.12, change: 0.8, changePercent: 0.32 },
];

const FALLBACK_CHART_DATA = Array.from({ length: 50 }, (_, i) => ({
  time: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  open: 150 + Math.random() * 50,
  high: 210 + Math.random() * 20,
  low: 140 + Math.random() * 20,
  close: 160 + Math.random() * 50,
}));

const MOCK_NEWS: NewsItem[] = [
  { id: '1', time: '09:30 AM', title: 'Market Open: Tech Stocks Lead Gains', summary: 'Nasdaq opens higher as NVIDIA and Apple show strong momentum in pre-market trading.', impact: 'positive', category: 'Market' },
  { id: '2', time: '11:15 AM', title: 'Fed Signals Potential Rate Hold', summary: 'Jerome Powell hints that interest rates might remain steady for the next quarter.', impact: 'neutral', category: 'Economy' },
  { id: '3', time: '01:45 PM', title: 'Crypto Regulation Update', summary: 'New bill introduced in Congress aims to clarify stablecoin oversight.', impact: 'negative', category: 'Crypto' },
  { id: '4', time: '03:00 PM', title: 'Oil Prices Surge on Supply Concerns', summary: 'Global oil benchmarks rise 2% following reports of production cuts.', impact: 'negative', category: 'Commodity' },
];

/**
 * Convert a TickerSummary to Asset type for use in the watchlist / portfolio
 */
function summaryToAsset(s: TickerSummary, index: number): Asset {
  return {
    id: `api-${s.ticker}-${index}`,
    symbol: s.ticker,
    name: s.name,
    type: s.type,
    price: s.latestPrice,
    change: s.change,
    changePercent: s.changePercent,
    isLive: true,
  };
}

function updatedAssetsFromBackend(backendAssets: Asset[], summaries: TickerSummary[]): Asset[] {
  return backendAssets.map(ba => {
    const live = summaries.find(s => s.ticker === ba.symbol);
    if (live) {
      return {
        ...ba,
        price: live.latestPrice,
        change: live.change,
        changePercent: live.changePercent,
        isLive: true,
      };
    }
    return { ...ba, isLive: false };
  });
}

function updateHoldingsWithLivePrices(holdings: Holding[], summaries: TickerSummary[]): Holding[] {
  return holdings.map(h => {
    const live = summaries.find(s => s.ticker === h.symbol);
    if (live) {
      const totalValue = live.latestPrice * h.amount;
      const totalCost = h.avgCost * h.amount;
      const profit = totalValue - totalCost;
      const profitPercent = totalCost !== 0 ? (profit / totalCost) * 100 : 0;
      return {
        ...h,
        price: live.latestPrice,
        change: live.change,
        changePercent: live.changePercent,
        totalValue,
        profit,
        profitPercent,
        isLive: true,
      };
    }
    return { ...h, isLive: false };
  });
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchlist' | 'news' | 'ai' | 'holdings_edit'>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>(MOCK_NEWS);
  const [chartData, setChartData] = useState<OHLCBar[]>(FALLBACK_CHART_DATA);
  const [chartDataMap, setChartDataMap] = useState<Map<string, OHLCBar[]>>(new Map());
  const [tickerSummaries, setTickerSummaries] = useState<TickerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [watchlistTotalPages, setWatchlistTotalPages] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1M');
  const [rawChartDataMap, setRawChartDataMap] = useState<Map<string, RawPriceData>>(new Map());

  // Fetch live data from the Portfolio Manager API and backend database
  const updateAssetsState = useCallback((backendAssets: Asset[], summaries: TickerSummary[]) => {
    const updatedAssets = updatedAssetsFromBackend(backendAssets, summaries);
    const allAssets = [...updatedAssets, ...STATIC_FUND_ASSETS];
    setAssets(allAssets);

    // Set initial selected asset and chart if not already set
    if (allAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(allAssets[0]);
    }
  }, [selectedAsset]);

  // Fetch live prices and initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tickerDataMap, paginatedAssets, backendHoldings, userData] = await Promise.all([
        fetchAllTickers(),
        getBackendAssetsPaginated(1, 20),
        getBackendHoldings(),
        getUser(2),
      ]);

      const summaries: TickerSummary[] = [];
      const newChartMap = new Map<string, OHLCBar[]>();

      for (const ticker of AVAILABLE_TICKERS) {
        const raw = tickerDataMap.get(ticker);
        if (raw) {
          summaries.push(toTickerSummary(raw));
          newChartMap.set(ticker, toOHLCBars(raw));
        }
      }

      setTickerSummaries(summaries);
      setChartDataMap(newChartMap);
      setRawChartDataMap(tickerDataMap);
      setWatchlistPage(paginatedAssets.current);
      setWatchlistTotalPages(paginatedAssets.pages);
      setHoldings(updateHoldingsWithLivePrices(backendHoldings, summaries));
      setUser(userData);

      updateAssetsState(paginatedAssets.records, summaries);

      // Auto-select first asset chart
      if (paginatedAssets.records.length > 0) {
        const firstChart = newChartMap.get(paginatedAssets.records[0].symbol);
        if (firstChart && !selectedAsset) setChartData(firstChart);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsset, updateAssetsState]);

  const loadWatchlistPage = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const paginatedAssets = await getBackendAssetsPaginated(page, 20);
      setWatchlistPage(paginatedAssets.current);
      setWatchlistTotalPages(paginatedAssets.pages);
      updateAssetsState(paginatedAssets.records, tickerSummaries);
    } catch (err) {
      console.error('Failed to load watchlist page:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tickerSummaries, updateAssetsState]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter chart data based on selected time range
  const updateChartData = useCallback((asset: Asset | null, range: string) => {
    if (!asset) return;
    const rawData = rawChartDataMap.get(asset.symbol);
    if (!rawData) {
      // Fallback to static if no raw data available
      const fallback = chartDataMap.get(asset.symbol);
      if (fallback) setChartData(fallback);
      return;
    }

    const { price_data } = rawData;
    const n = price_data.timestamp.length;
    if (n === 0) return;

    let filteredIntradayIndices: number[] = [];
    let isIntraday = false;

    if (range === '1D') {
      isIntraday = true;
      const lastDayString = price_data.timestamp[n - 1].split(' ')[0];
      for (let i = 0; i < n; i++) {
        if (price_data.timestamp[i].startsWith(lastDayString)) {
          filteredIntradayIndices.push(i);
        }
      }
    }

    if (isIntraday) {
      const bars: OHLCBar[] = filteredIntradayIndices.map(i => ({
        time: (new Date(price_data.timestamp[i]).getTime() / 1000) as any,
        open: price_data.open[i],
        high: price_data.high[i],
        low: price_data.low[i],
        close: price_data.close[i],
        volume: price_data.volume[i],
      }));
      setChartData(bars);
      return;
    }

    // For 1W, 1M, 1Y, ALL we use daily bars
    const dailyBars = toOHLCBars(rawData);
    if (range === 'ALL') {
      setChartData(dailyBars);
      return;
    }

    const lastDateStr = dailyBars[dailyBars.length - 1]?.time;
    if (!lastDateStr) return;
    const lastDate = new Date(lastDateStr);

    let days = 30;
    if (range === '1W') days = 7;
    else if (range === '1M') days = 30;
    else if (range === '1Y') days = 365;

    const cutoffDate = new Date(lastDate.getTime() - days * 24 * 60 * 60 * 1000);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const filtered = dailyBars.filter(b => b.time >= cutoffString);
    setChartData(filtered);
  }, [rawChartDataMap, chartDataMap]);

  // Update chart when selected asset or time range changes
  useEffect(() => {
    updateChartData(selectedAsset, timeRange);
  }, [selectedAsset, timeRange, updateChartData]);

  const handleSelectAsset = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  // Fetch dynamic news from CryptoCompare
  useEffect(() => {
    fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN')
      .then(res => res.json())
      .then(data => {
        if (data && data.Data) {
          const formattedNews = data.Data.slice(0, 15).map((item: any) => {
            let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (item.upvotes > item.downvotes + 2) impact = 'positive';
            else if (item.downvotes > item.upvotes + 2) impact = 'negative';

            return {
              id: item.id,
              time: new Date(item.published_on * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: item.title,
              summary: item.body.split('. ')[0] + '.',
              impact,
              category: item.source_info?.name || 'Crypto'
            };
          });
          setNewsData(formattedNews);
        }
      })
      .catch(err => console.error("Could not fetch news", err));
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleLanguage = () => {
    const nextLng = i18n.language.startsWith('en') ? 'zh' : 'en';
    i18n.changeLanguage(nextLng);
  };

  // Compute the display price/change for the selected asset
  const selectedSummary = selectedAsset ? tickerSummaries.find(s => s.ticker === selectedAsset.symbol) : null;
  const displayPrice = selectedAsset ? (selectedSummary?.latestPrice ?? selectedAsset.price) : 0;
  const displayChange = selectedAsset ? (selectedSummary?.change ?? selectedAsset.change) : 0;
  const displayChangePercent = selectedAsset ? (selectedSummary?.changePercent ?? selectedAsset.changePercent) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-[var(--border)] flex flex-col glass-panel border-none z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <h1 className="hidden lg:block font-bold tracking-tighter text-xl">WEALTHWISE</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label={t('dashboard')}
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<BarChart3 size={20} />}
            label={t('watchlist')}
            active={activeTab === 'watchlist'}
            onClick={() => setActiveTab('watchlist')}
          />
          <NavItem
            icon={<Newspaper size={20} />}
            label={t('news')}
            active={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
          />
          <NavItem
            icon={<TrendingUp size={20} />}
            label={t('manageHoldings')}
            active={activeTab === 'holdings_edit'}
            onClick={() => setActiveTab('holdings_edit')}
          />
          <NavItem
            icon={<MessageSquare size={20} />}
            label={t('aiAdvisor')}
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          />
        </nav>

        {/* Data source badge */}
        <div className="px-3 pb-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-[9px] font-mono uppercase tracking-wider opacity-40">
            <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400")} />
            {isLoading ? t('loadingLiveData') : t('liveMode')}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-8 glass-panel border-none z-40">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} /> */}
              {/* <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full bg-[var(--foreground)]/5 border border-[var(--border)] p-2 pl-10 text-sm focus:outline-none focus:border-blue-500/50"
              /> */}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 flex items-center gap-2 glass-button text-[10px] font-bold uppercase tracking-widest transition-all"
              aria-label="Toggle language"
            >
              <Languages size={14} />
              {i18n.language.startsWith('en') ? 'EN' : 'CN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 glass-button rounded-full hover:scale-110 transition-transform"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="relative opacity-60 hover:opacity-100 transition-opacity">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-[var(--border)]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">{user?.username || t('loadingLiveData')}</p>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">{user?.accountPlan || t('standardAccount')}</p>
              </div>
              <UserCircle size={32} className="opacity-60" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'dashboard' && (
            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              {isLoading && (
                <div className="flex items-center gap-3 glass-panel p-4 text-sm">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="opacity-60">{t('fetchingLiveData')}</span>
                </div>
              )}

              <section>
                <h2 className="text-xs font-mono uppercase opacity-40 mb-4 tracking-widest">{t('portfolioOverview')}</h2>
                <Portfolio holdings={holdings} onManageClick={() => setActiveTab('holdings_edit')} />
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">{t('marketAnalysis')}</h2>
                    <div className="flex gap-2">
                      {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setTimeRange(t)}
                          className={cn(
                            "text-[10px] px-2 py-1 glass-button transition-colors",
                            timeRange === t ? "bg-[var(--foreground)]/20 border-white/30 font-bold" : ""
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="glass-panel flex-1 min-h-[400px] p-4 flex flex-col">
                    {selectedAsset ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold">{selectedAsset.symbol}</span>
                            <span className="text-sm opacity-40">{selectedAsset.name}</span>
                            {!isLoading && tickerSummaries.find(s => s.ticker === selectedAsset.symbol) && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono">LIVE</span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-mono">{displayPrice.toFixed(2)}</p>
                            <p className={cn("text-xs font-mono", displayChange >= 0 ? "text-green-400" : "text-red-400")}>
                              {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)} ({displayChangePercent >= 0 ? '+' : ''}{displayChangePercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 min-h-0 relative w-full">
                          <div className="absolute inset-0">
                            <CandlestickChart data={chartData} containerId="main-chart" theme={theme} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center opacity-40">
                        <Loader2 className="animate-spin mr-2" size={16} />
                        <span>{t('initializingMarketData')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">{t('recentActivity')}</h2>
                  <div className="glass-panel flex-1 min-h-[400px] flex flex-col">
                    <div className="flex-1 min-h-0 relative w-full">
                      <div className="absolute inset-0 overflow-hidden">
                        <NewsTimeline news={newsData} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <section>
                <MarketSummary theme={theme} assets={assets} isLoading={isLoading} />
              </section>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-80 h-full border-r border-[var(--border)] glass-panel border-none flex flex-col">
                <Watchlist
                  assets={assets}
                  onSelect={handleSelectAsset}
                  selectedId={selectedAsset?.id || ''}
                  currentPage={watchlistPage}
                  totalPages={watchlistTotalPages}
                  onPageChange={(page) => loadWatchlistPage(page)}
                />
              </div>
              <div className="flex-1 p-8 flex flex-col gap-6">
                {selectedAsset ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                        <span className="px-2 py-1 bg-[var(--foreground)]/5 border border-[var(--border)] text-[10px] uppercase font-mono">{selectedAsset.type}</span>
                        {tickerSummaries.find(s => s.ticker === selectedAsset.symbol) && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono">LIVE</span>
                        )}
                      </div>
                      <button className="glass-button px-6 py-2 text-sm">{t('trade')}</button>
                    </div>
                    <div className="glass-panel flex-1 p-6 flex flex-col">
                      <div className="flex-1 min-h-0 relative w-full">
                        <div className="absolute inset-0">
                          <CandlestickChart data={chartData} containerId="watchlist-chart" theme={theme} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <StatBox label={t('latestPrice')} value={`$${displayPrice.toFixed(2)}`} />
                      <StatBox label={t('change')} value={`${displayChange >= 0 ? '+' : ''}${displayChangePercent.toFixed(2)}%`} positive={displayChange >= 0} />
                      <StatBox label={t('dayHigh')} value={selectedSummary ? `$${selectedSummary.dayHigh.toFixed(2)}` : '—'} />
                      <StatBox label={t('dayLow')} value={selectedSummary ? `$${selectedSummary.dayLow.toFixed(2)}` : '—'} />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center opacity-40">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    <span>{t('loadingAssetDetails')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-8">
                <h2 className="text-3xl font-bold tracking-tighter uppercase font-mono">{t('marketNews')}</h2>
                <div className="glass-panel">
                  <NewsTimeline news={newsData} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex-1 p-8 flex flex-col min-h-0">
              <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex flex-col gap-1 shrink-0">
                  <h2 className="text-3xl font-bold tracking-tighter uppercase font-mono">{t('aiAdvisor')}</h2>
                  <p className="text-sm opacity-40 font-mono">{t('aiAdvisorDescription')}</p>
                </div>
                <div className="flex-1 min-h-0">
                  <AIChat />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'holdings_edit' && (
            <HoldingsEditor
              assets={assets}
              holdings={holdings}
              onRefresh={loadInitialData}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 transition-all duration-200 group text-[var(--foreground)]",
        active ? "bg-[var(--foreground)]/10" : "opacity-40 hover:opacity-100 hover:bg-[var(--foreground)]/5"
      )}
    >
      <span className={cn(active ? "text-blue-500" : "group-hover:text-[var(--foreground)]")}>{icon}</span>
      <span className="hidden lg:block text-sm font-medium">{label}</span>
      {active && <div className="hidden lg:block ml-auto w-1 h-4 bg-blue-500" />}
    </button>
  );
}

function StatBox({ label, value, positive }: { label: string, value: string, positive?: boolean }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-[10px] uppercase opacity-40 font-mono mb-1">{label}</p>
      <p className={cn(
        "text-lg font-bold tracking-tight",
        positive !== undefined ? (positive ? "text-green-400" : "text-red-400") : ""
      )}>{value}</p>
    </div>
  );
}
