import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { useState } from 'react';
import { Holding } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PortfolioProps {
  holdings: Holding[];
  onManageClick?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Portfolio: React.FC<PortfolioProps> = ({ holdings, onManageClick }) => {
  const { t } = useTranslation();
  const totalValue = holdings.reduce((acc, h) => acc + h.totalValue, 0);
  const totalProfit = holdings.reduce((acc, h) => acc + h.profit, 0);
  const totalProfitPercent = (totalValue - totalProfit) !== 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;

  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  const chartData = holdings.map(h => ({
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
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={(props: any) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                    return (
                        <g>
                            <Sector
                                cx={cx}
                                cy={cy}
                                innerRadius={innerRadius}
                                outerRadius={outerRadius + 6}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={fill}
                            />
                        </g>
                    );
                  }}
                  data={chartData}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, index, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 12;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="var(--foreground)"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-[10px] font-mono font-bold opacity-60 pointer-events-none"
                      >
                        {name}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: 'var(--border)', strokeWidth: 1, opacity: 0.2 }}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none cursor-pointer" />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={30} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Content */}
            <div className="absolute top-[41%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[9px] uppercase opacity-40 font-mono tracking-widest mb-0.5">{t('totalValue', 'Total Value')}</p>
                <p className="text-xl font-light tracking-tighter leading-none">{formatCurrency(totalValue)}</p>
                <p className="text-[8px] opacity-30 font-mono mt-1">{holdings.length} Assets</p>
            </div>

            {/* Float Tooltip (Fixed Position to avoid overlap) */}
            {activeData && (
                <div className="absolute top-0 right-0 bg-slate-900/95 border border-white/20 p-3 shadow-2xl z-[100] min-w-[160px] animate-in slide-in-from-right-2 fade-in duration-200 backdrop-blur-md rounded-xl pointer-events-none">
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm leading-none text-white tracking-tight">{activeData.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded font-mono font-bold leading-none">
                            {activeData.percentage.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-[10px] text-white/50 mb-2 truncate font-medium">{activeData.fullName}</p>
                    <div className="pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] gap-2">
                            <span className="text-white/40 uppercase font-mono tracking-widest whitespace-nowrap">Balance</span>
                            <span className="text-white font-mono font-bold ml-auto">{formatCurrency(activeData.value)}</span>
                        </div>
                    </div>
                </div>
            )}
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
              {holdings.map((h) => (
                <tr key={h.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold">{h.symbol}</span>
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
