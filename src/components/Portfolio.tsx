import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

  const chartData = holdings.map(h => ({
    name: h.symbol,
    value: h.totalValue
  }));

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
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    fontSize: '12px',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
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
