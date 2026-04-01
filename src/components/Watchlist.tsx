import React from 'react';
import { Asset } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WatchlistProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  selectedId?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  assets,
  onSelect,
  selectedId,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="font-medium uppercase tracking-wider text-xs opacity-60">{t('watchlist')}</h2>
        <div className="flex gap-2">
          <button className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase font-mono">{t('page')} {currentPage}/{totalPages}</button>
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

      {/* Pagination Controls */}
      {totalPages >= 1 && (
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--foreground)]/5 shrink-0">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="p-1 glass-button disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="opacity-40">...</span>}
                  <button
                    onClick={() => onPageChange?.(p)}
                    className={cn(
                      "w-6 h-6 text-[10px] flex items-center justify-center font-mono transition-all",
                      currentPage === p ? "bg-blue-500 text-white" : "opacity-40 hover:opacity-100 hover:bg-[var(--foreground)]/10"
                    )}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))
            }
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            className="p-1 glass-button disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
