import React from 'react';
import { Asset } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface WatchlistProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  selectedId?: string;
}

export const Watchlist: React.FC<WatchlistProps> = ({ assets, onSelect, selectedId }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="font-medium uppercase tracking-wider text-xs opacity-60">Watchlist</h2>
        <div className="flex gap-2">
          <button className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase">Edit</button>
          <button className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase">+</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {assets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => onSelect(asset)}
            className={cn(
              "p-4 border-b border-[var(--border)]/5 cursor-pointer transition-all duration-200 flex items-center justify-between",
              selectedId === asset.id ? "bg-[var(--foreground)]/10 border-l-2 border-l-blue-500" : "hover:bg-[var(--foreground)]/5"
            )}
          >
            <div className="flex flex-col">
              <span className="font-bold tracking-tight">{asset.symbol}</span>
              <span className="text-[10px] opacity-40 truncate max-w-[100px]">{asset.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-sm">{formatCurrency(asset.price)}</span>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-mono",
                asset.change >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {asset.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {formatPercent(asset.changePercent)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
