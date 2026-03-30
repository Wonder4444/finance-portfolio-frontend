import React, { useState, useEffect } from 'react';
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
  Moon
} from 'lucide-react';
import { Watchlist } from './components/Watchlist';
import { Portfolio } from './components/Portfolio';
import { NewsTimeline } from './components/NewsTimeline';
import { AIChat } from './components/AIChat';
import { CandlestickChart } from './components/CandlestickChart';
import { MarketSummary } from './components/MarketSummary';
import { Asset, Holding, NewsItem } from './types';
import { cn } from './lib/utils';

// Mock Data
const MOCK_ASSETS: Asset[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 182.63, change: 1.2, changePercent: 0.65 },
  { id: '2', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 64231.50, change: -1200, changePercent: -1.8 },
  { id: '3', symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3452.10, change: 45, changePercent: 1.3 },
  { id: '4', symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', price: 875.28, change: 12.5, changePercent: 1.45 },
  { id: '5', symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'fund', price: 254.12, change: 0.8, changePercent: 0.32 },
  { id: '6', symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', price: 175.43, change: -4.2, changePercent: -2.3 },
];

const MOCK_HOLDINGS: Holding[] = [
  { ...MOCK_ASSETS[0], amount: 10, avgCost: 150, totalValue: 1826.3, profit: 326.3, profitPercent: 21.75 },
  { ...MOCK_ASSETS[1], amount: 0.05, avgCost: 45000, totalValue: 3211.57, profit: 961.57, profitPercent: 42.7 },
  { ...MOCK_ASSETS[3], amount: 5, avgCost: 600, totalValue: 4376.4, profit: 1376.4, profitPercent: 45.88 },
];

const MOCK_NEWS: NewsItem[] = [
  { id: '1', time: '09:30 AM', title: 'Market Open: Tech Stocks Lead Gains', summary: 'Nasdaq opens higher as NVIDIA and Apple show strong momentum in pre-market trading.', impact: 'positive', category: 'Market' },
  { id: '2', time: '11:15 AM', title: 'Fed Signals Potential Rate Hold', summary: 'Jerome Powell hints that interest rates might remain steady for the next quarter.', impact: 'neutral', category: 'Economy' },
  { id: '3', time: '01:45 PM', title: 'Crypto Regulation Update', summary: 'New bill introduced in Congress aims to clarify stablecoin oversight.', impact: 'negative', category: 'Crypto' },
  { id: '4', time: '03:00 PM', title: 'Oil Prices Surge on Supply Concerns', summary: 'Global oil benchmarks rise 2% following reports of production cuts.', impact: 'negative', category: 'Commodity' },
];

const MOCK_CHART_DATA = Array.from({ length: 50 }, (_, i) => ({
  time: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  open: 150 + Math.random() * 50,
  high: 210 + Math.random() * 20,
  low: 140 + Math.random() * 20,
  close: 160 + Math.random() * 50,
}));

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'watchlist' | 'news' | 'ai'>('dashboard');
  const [selectedAsset, setSelectedAsset] = useState<Asset>(MOCK_ASSETS[0]);
  const [newsData, setNewsData] = useState<NewsItem[]>(MOCK_NEWS);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    // Fetch dynamic news from CryptoCompare (Free, No API Key, CORS Enabled)
    fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN')
      .then(res => res.json())
      .then(data => {
        if (data && data.Data) {
          const formattedNews = data.Data.slice(0, 15).map((item: any) => {
            // Determine impact implicitly from upvotes vs downvotes, or assign neutral
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
              <section>
                <h2 className="text-xs font-mono uppercase opacity-40 mb-4 tracking-widest">Portfolio Overview</h2>
                <Portfolio holdings={MOCK_HOLDINGS} />
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
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-mono">182.63</p>
                        <p className="text-xs text-green-400 font-mono">+1.25 (0.68%)</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 relative w-full">
                      <div className="absolute inset-0">
                        <CandlestickChart data={MOCK_CHART_DATA} containerId="main-chart" theme={theme} />
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
                <MarketSummary theme={theme} />
              </section>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-80 border-r border-[var(--border)] glass-panel border-none">
                <Watchlist
                  assets={MOCK_ASSETS}
                  onSelect={setSelectedAsset}
                  selectedId={selectedAsset.id}
                />
              </div>
              <div className="flex-1 p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                    <span className="px-2 py-1 bg-[var(--foreground)]/5 border border-[var(--border)] text-[10px] uppercase font-mono">{selectedAsset.type}</span>
                  </div>
                  <button className="glass-button px-6 py-2 text-sm">Trade</button>
                </div>
                <div className="glass-panel flex-1 p-6 flex flex-col">
                  <div className="flex-1 min-h-0 relative w-full">
                    <div className="absolute inset-0">
                      <CandlestickChart data={MOCK_CHART_DATA} containerId="watchlist-chart" theme={theme} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <StatBox label="Market Cap" value="2.84T" />
                  <StatBox label="P/E Ratio" value="28.42" />
                  <StatBox label="Dividend Yield" value="0.52%" />
                  <StatBox label="52W High" value="199.62" />
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

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-[10px] uppercase opacity-40 font-mono mb-1">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
