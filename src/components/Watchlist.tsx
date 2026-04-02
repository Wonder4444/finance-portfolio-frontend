import React from 'react';
import { Asset } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Search, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WatchlistProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  selectedId?: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchResults: Asset[];
  onAddFavorite: (asset: Asset) => void;
  onRemoveFavorite: (asset: Asset) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  assets,
  onSelect,
  selectedId,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onAddFavorite,
  onRemoveFavorite,
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium uppercase tracking-wider text-xs opacity-60">{t('watchlist')}</h2>
          <span className="text-[10px] opacity-40 font-mono">{assets.length}</span>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="搜索标的并收藏"
            className="w-full bg-[var(--foreground)]/5 border border-[var(--border)] p-2 pl-9 pr-2 text-xs focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {searchQuery.trim() && (
          <div className="max-h-44 overflow-y-auto border border-[var(--border)] bg-[var(--background)]">
            {searchResults.length === 0 ? (
              <div className="px-3 py-2 text-xs opacity-50">未找到匹配标的</div>
            ) : (
              searchResults.map((asset) => (
                <div
                  key={`search-${asset.id}`}
                  className="px-3 py-2 border-b border-[var(--border)]/30 last:border-b-0 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{asset.symbol}</div>
                    <div className="text-[10px] opacity-50 truncate">{asset.name}</div>
                  </div>
                  <button
                    onClick={() => onAddFavorite(asset)}
                    className="glass-button p-1.5"
                    title="收藏"
                    aria-label={`收藏 ${asset.symbol}`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {assets.length === 0 ? (
          <div className="p-4 text-xs opacity-50">暂无自选，请先在上方搜索后点击 + 收藏</div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelect(asset)}
              className={cn(
                'p-4 border-b border-[var(--border)]/5 cursor-pointer transition-all duration-200 flex items-center justify-between gap-2',
                selectedId === asset.id ? 'bg-[var(--foreground)]/10 border-l-2 border-l-blue-500' : 'hover:bg-[var(--foreground)]/5'
              )}
            >
              <div className="flex flex-col min-w-0">
                <span className="font-bold tracking-tight">{asset.symbol}</span>
                <span className="text-[10px] opacity-40 truncate max-w-[100px]">{asset.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm">{formatCurrency(asset.price)}</span>
                  <div className={cn(
                    'flex items-center gap-1 text-[10px] font-mono',
                    asset.change >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {asset.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {formatPercent(asset.changePercent)}
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveFavorite(asset);
                  }}
                  className="glass-button p-1.5"
                  title="取消自选"
                  aria-label={`取消自选 ${asset.symbol}`}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
