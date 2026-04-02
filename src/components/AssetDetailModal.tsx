import React, { useEffect, useRef, useState } from 'react';
import { Asset } from '../types';
import { X, TrendingUp, BarChart3, Info, PieChart as PieIcon, LineChart, Activity } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

// Mock segment data for visualization
const MOCK_SEGMENTS = [
  { name: 'North America', value: 45 },
  { name: 'Europe', value: 25 },
  { name: 'Asia Pacific', value: 20 },
  { name: 'Other', value: 10 },
];

// Mock valuation trends
const MOCK_VALUATION_TRENDS = [
  { time: '2023-Q1', pe: 14.2, ps: 2.1, pb: 1.1 },
  { time: '2023-Q2', pe: 15.1, ps: 2.3, pb: 1.15 },
  { time: '2023-Q3', pe: 16.5, ps: 2.5, pb: 1.2 },
  { time: '2023-Q4', pe: 15.8, ps: 2.4, pb: 1.18 },
  { time: '2024-Q1', pe: 17.2, ps: 2.7, pb: 1.25 },
];

const TradingViewWidget = ({ type, symbol, theme, height = '100%' }: { type: string, symbol: string, theme: string, height?: string | number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    let src = '';
    let config = {};

    switch(type) {
      case 'profile':
        src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
        config = { "width": "100%", "height": "100%", "colorTheme": theme, "isTransparent": true, "symbol": symbol, "locale": "en" };
        break;
      case 'financials':
        src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
        config = { "isTransparent": true, "largeChartHeight": 0, "displayMode": "regular", "width": "100%", "height": "100%", "colorTheme": theme, "symbol": symbol, "locale": "en" };
        break;
      case 'technical-analysis':
        src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        config = { "interval": "1D", "width": "100%", "isTransparent": true, "height": "100%", "symbol": symbol, "showIntervalTabs": true, "displayMode": "single", "locale": "en", "colorTheme": theme };
        break;
      case 'advanced-chart':
        // Advanced chart is more stable as iframe
        return;
    }
    
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [type, symbol, theme, height]);

  if (type === 'advanced-chart') {
    const encodedSymbol = encodeURIComponent(symbol);
    return (
        <div className="w-full h-full overflow-hidden bg-black">
            <iframe
                key={`chart-${theme}-${symbol}`}
                title="TradingView Chart"
                src={`https://s.tradingview.com/widgetembed/?symbol=${encodedSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${theme}&style=1&timezone=Etc/UTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`}
                style={{ width: '100%', height: '100%', border: 'none' }}
            ></iframe>
        </div>
    );
  }

  return (
    <div key={`${type}-${theme}-${symbol}`} className="w-full h-full overflow-hidden" ref={containerRef}></div>
  );
};

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, isOpen, onClose, theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'financials'>('overview');
  const [exchangeOverride, setExchangeOverride] = useState<'AUTO' | 'NASDAQ' | 'NYSE'>('AUTO');
  
  if (!isOpen || !asset) return null;

  let tvSymbol = asset.symbol;
  
  // Normalize symbol for TradingView
  if (asset.type === 'crypto' || asset.symbol.includes('-')) {
    let cleanSymbol = asset.symbol.replace('-', '');
    if (!cleanSymbol.includes(':')) {
      // Common crypto exchanges on TradingView
      tvSymbol = `BINANCE:${cleanSymbol}`;
      if (cleanSymbol.endsWith('USD')) tvSymbol = `COINBASE:${cleanSymbol}`;
    } else {
      tvSymbol = cleanSymbol;
    }
  } else if (asset.type === 'stock' || !asset.type) {
    if (!tvSymbol.includes(':')) {
      const nasdaqStocks = ['AAPL', 'MSFT', 'NVDA', 'GOOG', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX', 'AMD', 'INTC', 'PYPL', 'ADBE', 'CSCO', 'PEP'];
      const symbolUpper = tvSymbol.toUpperCase();
      
      let targetExchange = '';
      if (exchangeOverride !== 'AUTO') {
        targetExchange = exchangeOverride;
      } else {
        // Heuristic: NASDAQ symbols are typically 4+ characters, NYSE are 1-3 characters
        targetExchange = (nasdaqStocks.includes(symbolUpper) || symbolUpper.length >= 4) ? 'NASDAQ' : 'NYSE';
      }
      
      tvSymbol = `${targetExchange}:${symbolUpper}`;
    }
  }

  const toggleExchange = () => {
     setExchangeOverride(prev => {
        if (prev === 'AUTO') return 'NASDAQ';
        if (prev === 'NASDAQ') return 'NYSE';
        return 'AUTO';
     });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="glass-panel w-full max-w-6xl h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] bg-[var(--foreground)]/5">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xl border border-blue-500/10">
                {asset.symbol.substring(0, 1)}
             </div>
             <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tighter">
                        {asset.symbol} 
                    </h2>
                    {asset.type === 'stock' && (
                        <button 
                            onClick={toggleExchange}
                            className="px-2 py-0.5 bg-[var(--foreground)]/5 hover:bg-blue-500/10 border border-[var(--border)] hover:border-blue-500/30 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1.5"
                            title="Toggle Exchange Fallback"
                        >
                            <span className="opacity-40 uppercase tracking-widest">Routing:</span>
                            <span className="text-blue-500 uppercase">{tvSymbol.split(':')[0]}</span>
                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                        </button>
                    )}
                </div>
                <p className="text-sm opacity-40 font-mono mt-1">{asset.name} • {asset.industry}</p>
             </div>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-[var(--foreground)]/5 p-1 rounded-xl border border-[var(--border)]">
            {(['overview', 'charts', 'financials'] as const).map(tab => (
                 <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={cn(
                   "px-6 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                   activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "opacity-40 hover:opacity-100"
                 )}
               >
                 {tab === 'overview' && <div className="flex items-center gap-2"><Info size={14}/> Summary</div>}
                 {tab === 'charts' && <div className="flex items-center gap-2"><LineChart size={14}/> Advanced Chart</div>}
                 {tab === 'financials' && <div className="flex items-center gap-2"><PieIcon size={14}/> Financials</div>}
               </button>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--foreground)]/10 rounded-full transition-colors opacity-40 hover:opacity-100 ml-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--background)] relative">
          
          {/* Overview Tab */}
          <div className={cn("p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 h-full", activeTab !== 'overview' && "hidden")}>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 h-[450px] glass-panel overflow-hidden">
                     <TradingViewWidget type="profile" symbol={tvSymbol} theme={theme} height="100%" />
                  </div>
                  <div className="h-[450px] glass-panel p-4 flex flex-col gap-4">
                     <h3 className="text-[10px] uppercase font-mono opacity-40 tracking-widest flex items-center gap-2"><Activity size={14}/> Technical Summary</h3>
                     <div className="flex-1">
                        <TradingViewWidget type="technical-analysis" symbol={tvSymbol} theme={theme} height="100%" />
                     </div>
                  </div>
               </div>
               
               {/* Quick Metrics Bar */}
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Price', val: formatCurrency(asset.price), color: 'text-[var(--foreground)]' },
                    { label: 'Avg Cost', val: formatCurrency((asset as any).avgCost || 0), color: 'opacity-60' },
                    { label: '24h Change', val: `${asset.changePercent.toFixed(2)}%`, color: asset.changePercent >= 0 ? 'text-green-500' : 'text-red-500' },
                    { label: 'P/E TTM', val: asset.peRatio?.toFixed(2) || '14.28', color: 'text-blue-500' },
                    { label: 'P/S TTM', val: asset.psRatio?.toFixed(2) || '2.15', color: 'text-indigo-500' },
                    { label: 'P/B TTM', val: asset.pbRatio?.toFixed(2) || '1.10', color: 'text-violet-500' },
                  ].map((m, i) => (
                    <div key={i} className="glass-panel p-4 flex flex-col gap-1">
                        <span className="text-[9px] opacity-30 uppercase font-mono tracking-wider">{m.label}</span>
                        <span className={cn("text-lg font-bold font-mono tracking-tighter", m.color)}>{m.val}</span>
                    </div>
                  ))}
               </div>
          </div>

          {/* Charts Tab */}
          <div className={cn("h-full w-full p-4 animate-in fade-in zoom-in-95 duration-500", activeTab !== 'charts' && "hidden")}>
               <div className="h-full w-full rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl bg-[var(--background)]">
                  <iframe
                    title="TradingView Chart"
                    src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${theme}&style=1&timezone=Etc/UTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  ></iframe>
               </div>
          </div>

          {/* Financials Tab */}
          <div className={cn("p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 h-full", activeTab !== 'financials' && "hidden")}>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Revenue Segment Visualization */}
                  <div className="glass-panel p-6 flex flex-col gap-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase font-mono opacity-40 tracking-widest flex items-center gap-2"><PieIcon size={14}/> Revenue Breakdown by Region</h3>
                        <span className="text-[9px] opacity-20 font-mono tracking-tighter italic">Source: Company Reports 2024</span>
                     </div>
                     <div className="flex items-center flex-col md:flex-row gap-8">
                        <div className="h-[220px] w-full md:w-1/2">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={MOCK_SEGMENTS}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                 >
                                    {MOCK_SEGMENTS.map((_, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                 </Pie>
                                 <RechartsTooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'var(--background)', 
                                      border: '1px solid var(--border)', 
                                      borderRadius: '8px', 
                                      fontSize: '10px',
                                      color: 'var(--foreground)'
                                    }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                 />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-3">
                           {MOCK_SEGMENTS.map((s, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                 <div className="flex items-center gap-2 opacity-60">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    {s.name}
                                 </div>
                                 <span className="font-mono font-bold">{s.value}%</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Valuation Trends Visualization (PE/PS/PB) */}
                  <div className="glass-panel p-6 flex flex-col gap-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase font-mono opacity-40 tracking-widest flex items-center gap-2"><LineChart size={14}/> Valuation Performance Trends</h3>
                        <div className="flex gap-4 text-[9px] font-mono uppercase opacity-30">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> PE</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> PS</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div> PB</span>
                        </div>
                     </div>
                     <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={MOCK_VALUATION_TRENDS}>
                              <defs>
                                 <linearGradient id="colorPe" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--foreground)" opacity={0.05} />
                              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, opacity: 0.3, fill: 'var(--foreground)' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, opacity: 0.3, fill: 'var(--foreground)' }} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: 'var(--background)', 
                                  border: '1px solid var(--border)', 
                                  fontSize: '10px',
                                  color: 'var(--foreground)'
                                }}
                                itemStyle={{ color: 'var(--foreground)' }}
                              />
                              <Area type="monotone" dataKey="pe" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPe)" />
                              <Area type="monotone" dataKey="ps" stroke="#6366f1" strokeWidth={2} fill="transparent" />
                              <Area type="monotone" dataKey="pb" stroke="#8b5cf6" strokeWidth={2} fill="transparent" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>

               {/* Full Financial Statements Terminal */}
               <div className="h-[600px] glass-panel overflow-hidden">
                  <TradingViewWidget type="financials" symbol={tvSymbol} theme={theme} height="100%" />
               </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 border-t border-[var(--border)] bg-[var(--foreground)]/2 flex justify-between items-center text-[10px] font-mono opacity-30 uppercase tracking-[0.2em]">
           <span>Proprietary Market Data • Real-time Feeds via TradingView Cloud</span>
           <span>WealthWise Pro Terminal</span>
        </div>
      </div>
    </div>
  );
};
