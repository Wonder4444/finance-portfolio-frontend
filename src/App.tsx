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
  Loader2
} from 'lucide-react';
import { Watchlist } from './components/Watchlist';
import { Portfolio } from './components/Portfolio';
import { NewsTimeline } from './components/NewsTimeline';
import { AIChat } from './components/AIChat';
import { CandlestickChart } from './components/CandlestickChart';
import { MarketSummary } from './components/MarketSummary';
import { Asset, Holding, NewsItem } from './types';
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

// Static crypto / fund fallbacks (not available from the stock API)
const STATIC_CRYPTO_ASSETS: Asset[] = [
  { id: 'crypto-btc', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 64231.50, change: -1200, changePercent: -1.8 },
  { id: 'crypto-eth', symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3452.10, change: 45, changePercent: 1.3 },
];

const STATIC_FUND_ASSETS: Asset[] = [
  { id: 'fund-vti', symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'fund', price: 254.12, change: 0.8, changePercent: 0.32 },
];

// Fallback mock data in case the API fails
const FALLBACK_ASSETS: Asset[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 182.63, change: 1.2, changePercent: 0.65 },
  { id: '2', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 64231.50, change: -1200, changePercent: -1.8 },
  { id: '3', symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3452.10, change: 45, changePercent: 1.3 },
  { id: '4', symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', price: 175.43, change: -4.2, changePercent: -2.3 },
  { id: '5', symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'fund', price: 254.12, change: 0.8, changePercent: 0.32 },
  { id: '6', symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'stock', price: 178.25, change: 2.1, changePercent: 1.19 },
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
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchlist' | 'news' | 'ai'>('dashboard');
  const [assets, setAssets] = useState<Asset[]>(FALLBACK_ASSETS);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(FALLBACK_ASSETS[0]);
  const [newsData, setNewsData] = useState<NewsItem[]>(MOCK_NEWS);
  const [chartData, setChartData] = useState<OHLCBar[]>(FALLBACK_CHART_DATA);
  const [chartDataMap, setChartDataMap] = useState<Map<string, OHLCBar[]>>(new Map());
  const [tickerSummaries, setTickerSummaries] = useState<TickerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  // Fetch live data from the Portfolio Manager API
  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      setIsLoading(true);
      try {
        const dataMap = await fetchAllTickers();
        if (cancelled) return;

        // Build summaries and assets from live data
        const summaries: TickerSummary[] = [];
        const newChartMap = new Map<string, OHLCBar[]>();
        const liveAssets: Asset[] = [];

        let idx = 0;
        for (const ticker of AVAILABLE_TICKERS) {
          const raw = dataMap.get(ticker);
          if (raw) {
            const summary = toTickerSummary(raw);
            summaries.push(summary);
            liveAssets.push(summaryToAsset(summary, idx));
            newChartMap.set(ticker, toOHLCBars(raw));
            idx++;
          }
        }

        // Append crypto / fund assets (not from this API)
        const allAssets = [...liveAssets, ...STATIC_CRYPTO_ASSETS, ...STATIC_FUND_ASSETS];

        setTickerSummaries(summaries);
        setChartDataMap(newChartMap);
        setAssets(allAssets);

        // Build holdings from the first 3 live assets
        if (liveAssets.length >= 3) {
          const newHoldings: Holding[] = liveAssets.slice(0, 3).map((a, i) => ({
            ...a,
            amount: [10, 5, 3][i],
            avgCost: a.price * (1 - [0.15, 0.10, 0.08][i]),
            totalValue: a.price * [10, 5, 3][i],
            profit: a.price * [10, 5, 3][i] * [0.15, 0.10, 0.08][i],
            profitPercent: [15, 10, 8][i],
          }));
          setHoldings(newHoldings);
        }

        // Set initial selected asset and chart
        if (allAssets.length > 0) {
          setSelectedAsset(allAssets[0]);
          const firstChart = newChartMap.get(allAssets[0].symbol);
          if (firstChart) setChartData(firstChart);
        }
      } catch (err) {
        console.error('Failed to load live data from Portfolio Manager API:', err);
        // Keep fallback data
        setHoldings([
          { ...FALLBACK_ASSETS[0], amount: 10, avgCost: 150, totalValue: 1826.3, profit: 326.3, profitPercent: 21.75 },
          { ...FALLBACK_ASSETS[3], amount: 5, avgCost: 150, totalValue: 877.15, profit: -127.15, profitPercent: -12.67 },
          { ...FALLBACK_ASSETS[5], amount: 3, avgCost: 160, totalValue: 534.75, profit: 54.75, profitPercent: 11.41 },
        ]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLiveData();
    return () => { cancelled = true; };
  }, []);

  // Update chart when selected asset changes
  const handleSelectAsset = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    const assetChart = chartDataMap.get(asset.symbol);
    if (assetChart) {
      setChartData(assetChart);
    }
  }, [chartDataMap]);

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

  // Compute the display price/change for the selected asset
  const selectedSummary = tickerSummaries.find(s => s.ticker === selectedAsset.symbol);
  const displayPrice = selectedSummary?.latestPrice ?? selectedAsset.price;
  const displayChange = selectedSummary?.change ?? selectedAsset.change;
  const displayChangePercent = selectedSummary?.changePercent ?? selectedAsset.changePercent;

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
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<BarChart3 size={20} />}
            label="Watchlist"
            active={activeTab === 'watchlist'}
            onClick={() => setActiveTab('watchlist')}
          />
          <NavItem
            icon={<Newspaper size={20} />}
            label="News"
            active={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
          />
          <NavItem
            icon={<MessageSquare size={20} />}
            label="AI Advisor"
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          />
        </nav>

        {/* Data source badge */}
        <div className="px-3 pb-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-[9px] font-mono uppercase tracking-wider opacity-40">
            <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400")} />
            {isLoading ? 'Loading live data...' : 'Live · Portfolio Manager API'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-8 glass-panel border-none z-40">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
              <input
                type="text"
                placeholder="Search assets, news, or ask AI..."
                className="w-full bg-[var(--foreground)]/5 border border-[var(--border)] p-2 pl-10 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
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
                <p className="text-xs font-bold">Alex Chen</p>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">Premium Plan</p>
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
                  <span className="opacity-60">Fetching live data from Portfolio Manager API...</span>
                </div>
              )}

              <section>
                <h2 className="text-xs font-mono uppercase opacity-40 mb-4 tracking-widest">Portfolio Overview</h2>
                <Portfolio holdings={holdings} />
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">Market Analysis</h2>
                    <div className="flex gap-2">
                      {['1D', '1W', '1M', '1Y', 'ALL'].map(t => (
                        <button key={t} className="text-[10px] px-2 py-1 glass-button">{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="glass-panel flex-1 min-h-[400px] p-4 flex flex-col">
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
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">Recent Activity</h2>
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
                <MarketSummary theme={theme} tickerSummaries={tickerSummaries} isLoading={isLoading} />
              </section>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-80 border-r border-[var(--border)] glass-panel border-none">
                <Watchlist
                  assets={assets}
                  onSelect={handleSelectAsset}
                  selectedId={selectedAsset.id}
                />
              </div>
              <div className="flex-1 p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                    <span className="px-2 py-1 bg-[var(--foreground)]/5 border border-[var(--border)] text-[10px] uppercase font-mono">{selectedAsset.type}</span>
                    {tickerSummaries.find(s => s.ticker === selectedAsset.symbol) && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono">LIVE</span>
                    )}
                  </div>
                  <button className="glass-button px-6 py-2 text-sm">Trade</button>
                </div>
                <div className="glass-panel flex-1 p-6 flex flex-col">
                  <div className="flex-1 min-h-0 relative w-full">
                    <div className="absolute inset-0">
                      <CandlestickChart data={chartData} containerId="watchlist-chart" theme={theme} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <StatBox label="Latest Price" value={`$${displayPrice.toFixed(2)}`} />
                  <StatBox label="Change" value={`${displayChange >= 0 ? '+' : ''}${displayChangePercent.toFixed(2)}%`} positive={displayChange >= 0} />
                  <StatBox label="Day High" value={selectedSummary ? `$${selectedSummary.dayHigh.toFixed(2)}` : '—'} />
                  <StatBox label="Day Low" value={selectedSummary ? `$${selectedSummary.dayLow.toFixed(2)}` : '—'} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-8">
                <h2 className="text-3xl font-bold tracking-tighter">MARKET NEWS</h2>
                <div className="glass-panel">
                  <NewsTimeline news={newsData} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex-1 p-8 flex flex-col">
              <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-bold tracking-tighter">AI INVESTMENT ADVISOR</h2>
                  <p className="text-sm opacity-40">Discuss your strategy, analyze assets, or get market insights.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <AIChat />
                </div>
              </div>
            </div>
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
