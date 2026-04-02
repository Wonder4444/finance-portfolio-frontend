import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { Holding, Asset } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AssetDetailModal } from './AssetDetailModal';

interface PortfolioProps {
  holdings: Holding[];
  onManageClick?: () => void;
  onAssetClick?: (symbol: string) => void;
  theme?: 'light' | 'dark';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PieAny = Pie as any;

export const Portfolio: React.FC<PortfolioProps> = ({ holdings, onManageClick, onAssetClick, theme = 'dark' }) => {
  const { t } = useTranslation();
  
  // Sort holdings by total value descending
  const sortedHoldings = [...holdings].sort((a, b) => b.totalValue - a.totalValue);
  
  const totalValue = sortedHoldings.reduce((acc, h) => acc + h.totalValue, 0);
  const totalProfit = sortedHoldings.reduce((acc, h) => acc + h.profit, 0);
  const totalProfitPercent = (totalValue - totalProfit) !== 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;

  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  const chartData = sortedHoldings.map(h => ({
    name: h.symbol,
    value: h.totalValue,
    fullName: h.name,
    percentage: totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0
  }));

  const activeData = activeIndex >= 0 ? chartData[activeIndex] : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase opacity-50 font-mono">{t('totalBalance')}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light tracking-tight">{formatCurrency(totalValue)}</span>
            <Wallet size={16} className="opacity-30" />
          </div>
        </div>
        <div className="glass-panel p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase opacity-50 font-mono">{t('totalProfitLoss')}</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-2xl font-light tracking-tight",
              totalProfit >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </span>
            {totalProfit >= 0 ? <ArrowUpRight size={16} className="text-green-400" /> : <ArrowDownRight size={16} className="text-red-400" />}
          </div>
        </div>
        <div className="glass-panel p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase opacity-50 font-mono">{t('returnRate')}</span>
          <span className={cn(
            "text-2xl font-light tracking-tight",
            totalProfitPercent >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {totalProfitPercent >= 0 ? '+' : ''}{formatPercent(totalProfitPercent)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] uppercase opacity-50 font-mono">{t('assetAllocation')}</h3>
            {onManageClick && (
              <button
                onClick={onManageClick}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-mono uppercase tracking-widest border border-blue-400/20 px-2 py-0.5 rounded transition-colors"
              >
                {t('manage')}
              </button>
            )}
          </div>
          <div className="h-[320px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <PieAny
                  activeIndex={activeIndex}
                  activeShape={(props: any) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                    return (
                        <g>
                            <Sector
                                cx={cx}
                                cy={cy}
                                innerRadius={innerRadius}
                                outerRadius={outerRadius + 8}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={fill}
                                onClick={() => onAssetClick?.(props.payload.name)}
                                className="cursor-pointer"
                            />
                        </g>
                    );
                  }}
                  data={chartData}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                        onAssetClick?.(data.activePayload[0].name);
                    }
                  }}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, index, name }: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 18;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="var(--foreground)"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-[11px] font-mono font-bold opacity-60 pointer-events-none tracking-tight"
                      >
                        {name}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: 'var(--border)', strokeWidth: 1.5, opacity: 0.2 }}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none cursor-pointer" />
                  ))}
                </PieAny>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Content - Perfectly Centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                <p className="text-[10px] uppercase opacity-40 font-mono tracking-[0.2em] mb-1">{t('totalValue')}</p>
                <p className="text-2xl font-bold tracking-tighter leading-none">{formatCurrency(totalValue)}</p>
                <p className="text-[10px] opacity-30 font-mono mt-2 uppercase tracking-widest">{holdings.length} Assets</p>
            </div>

            {/* Float Tooltip - Shown on Hover/Interaction */}
            {activeData && (
                <div 
                    className="absolute top-4 right-4 bg-[var(--background)]/95 border border-[var(--border)] p-4 shadow-2xl z-[100] min-w-[200px] animate-in slide-in-from-right-4 fade-in duration-300 backdrop-blur-xl rounded-xl cursor-pointer"
                    onClick={() => onAssetClick?.(activeData.name)}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-base leading-none tracking-tight">{activeData.name}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg font-mono font-bold leading-none">
                            {activeData.percentage.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-xs opacity-40 mb-3 truncate font-medium">{activeData.fullName}</p>
                    <div className="pt-3 border-t border-[var(--border)]">
                        <div className="flex justify-between items-center text-xs">
                            <span className="opacity-40 uppercase font-mono tracking-widest">Balance</span>
                            <span className="font-mono font-bold">{formatCurrency(activeData.value)}</span>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Custom Responsive Legend - Outside the Chart to avoid centering issues */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 px-4">
             {chartData.map((entry, index) => (
               <div 
                 key={`legend-${index}`} 
                 className="flex items-center gap-2 cursor-pointer group"
                 onMouseEnter={() => setActiveIndex(index)}
                 onMouseLeave={() => setActiveIndex(-1)}
                 onClick={() => onAssetClick?.(entry.name)}
               >
                 <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                 <span className={cn(
                   "text-[11px] font-mono font-bold uppercase transition-all",
                   activeIndex === index ? "text-blue-500 scale-105" : "opacity-40 hover:opacity-100"
                 )}>
                   {entry.name}
                 </span>
               </div>
             ))}
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--foreground)]/5 border-b border-[var(--border)]">
              <tr>
                <th className="p-3 font-mono uppercase opacity-50">{t('asset')}</th>
                <th className="p-3 font-mono uppercase opacity-50">{t('amount')}</th>
                <th className="p-3 font-mono uppercase opacity-50">{t('value')}</th>
                <th className="p-3 font-mono uppercase opacity-50">{t('pnlYield')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/10">
              {sortedHoldings.map((h) => (
                <tr key={h.id} className="group hover:bg-[var(--foreground)]/5 transition-colors cursor-default">
                  <td className="p-3">
                    <div 
                      className="flex flex-col cursor-pointer group-hover:text-blue-400 transition-colors"
                      onClick={() => onAssetClick?.(h.symbol)}
                    >
                      <span className="font-bold border-b border-transparent group-hover:border-blue-400/30 w-fit">{h.symbol}</span>
                      <span className="opacity-40 text-[10px]">{h.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono">{h.amount}</td>
                  <td className="p-3 font-mono">{formatCurrency(h.totalValue)}</td>
                  <td className={cn(
                    "p-3 font-mono",
                    h.profit >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {h.profit >= 0 ? '+' : ''}{formatPercent(h.profitPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
