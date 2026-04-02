import React, { useState, useMemo, useEffect } from 'react';
import {
    TrendingUp,
    Trash2,
    Plus,
    Search,
    Star,
    ChevronUp,
    ChevronDown,
    Loader2,
    Check,
    X,
    PlusCircle,
    MinusCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Asset, Holding } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { addHolding, updateHolding, deleteHolding, getBackendAssets } from '../services/backendApi';

interface HoldingsEditorProps {
    assets: Asset[];
    holdings: Holding[];
    onRefresh: () => void;
    onAssetClick?: (symbol: string) => void;
    isLoading?: boolean;
}

export function HoldingsEditor({ assets, holdings, onRefresh, onAssetClick, isLoading }: HoldingsEditorProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [quantity, setQuantity] = useState<number>(0);
    const [avgCost, setAvgCost] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [editAvgCost, setEditAvgCost] = useState<number>(0);

    // Local state for pinned holdings (persisted in localStorage)
    const [pinnedHoldings, setPinnedHoldings] = useState<string[]>(() => {
        const saved = localStorage.getItem('pinnedHoldings');
        return saved ? JSON.parse(saved) : [];
    });

    const togglePin = (id: string) => {
        const newPinned = pinnedHoldings.includes(id)
            ? pinnedHoldings.filter(p => p !== id)
            : [...pinnedHoldings, id];
        setPinnedHoldings(newPinned);
        localStorage.setItem('pinnedHoldings', JSON.stringify(newPinned));
    };

    const [allAssets, setAllAssets] = useState<Asset[]>([]);

    useEffect(() => {
        if (isAdding && allAssets.length === 0) {
            getBackendAssets().then(setAllAssets).catch(console.error);
        }
    }, [isAdding, allAssets.length]);

    const filteredAssets = useMemo(() => {
        if (!searchQuery) return [];
        const sourceAssets = allAssets.length > 0 ? allAssets : assets;
        return sourceAssets.filter(a =>
            a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [assets, allAssets, searchQuery]);

    const sortedHoldings = useMemo(() => {
        return [...holdings].sort((a, b) => {
            const aPinned = pinnedHoldings.includes(a.id);
            const bPinned = pinnedHoldings.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
        });
    }, [holdings, pinnedHoldings]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId || quantity <= 0) return;

        setIsSubmitting(true);
        try {
            // Backend asset ID is like 'backend-1', we need the number
            const assetId = parseInt(selectedAssetId.replace('backend-', ''));
            const success = await addHolding(2, assetId, quantity, avgCost);
            if (success) {
                setIsAdding(false);
                setSearchQuery('');
                setSelectedAssetId('');
                setQuantity(0);
                setAvgCost(0);
                onRefresh();
            }
        } catch (err) {
            console.error('Failed to add holding:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (holdingId: string) => {
        setIsSubmitting(true);
        try {
            const id = parseInt(holdingId.replace('holding-', ''));
            const success = await updateHolding(id, editQuantity, editAvgCost);
            if (success) {
                setEditingId(null);
                onRefresh();
            }
        } catch (err) {
            console.error('Failed to update holding:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (holdingId: string) => {
        if (!confirm(t('confirmDelete'))) return;

        setIsSubmitting(true);
        try {
            const id = parseInt(holdingId.replace('holding-', ''));
            const success = await deleteHolding(id);
            if (success) {
                onRefresh();
            }
        } catch (err) {
            console.error('Failed to delete holding:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (h: Holding) => {
        setEditingId(h.id);
        setEditQuantity(h.amount);
        setEditAvgCost(h.avgCost);
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tighter uppercase font-mono">{t('manageHoldings')}</h2>
                    <p className="text-sm opacity-40 font-mono">Increase, decrease, or restructure your portfolio.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "px-6 py-2 flex items-center gap-2 transition-all duration-200 uppercase text-xs font-bold tracking-widest",
                        isAdding ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                    )}
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                    {isAdding ? t('cancel') : t('addPosition')}
                </button>
            </div>

            {isAdding && (
                <div className="glass-panel p-8 animate-in fade-in slide-in-from-top-4 duration-300 relative z-20">
                    <form onSubmit={handleAddSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase opacity-40 font-mono tracking-widest block">{t('selectAsset')}</label>
                                <div className="relative z-30">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('searchPlaceholder')}
                                        className="w-full bg-[var(--foreground)]/5 border border-[var(--border)] p-3 pl-10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                    {filteredAssets.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--background)] border border-[var(--border)] p-1 z-[100] glass-panel animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                                            {filteredAssets.map(asset => (
                                                <button
                                                    key={asset.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAssetId(asset.id);
                                                        setSearchQuery(asset.symbol);
                                                        setAvgCost(asset.price);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 text-left hover:bg-[var(--foreground)]/5 transition-colors",
                                                        selectedAssetId === asset.id ? "bg-[var(--foreground)]/10" : ""
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight">{asset.symbol}</span>
                                                        <span className="text-[10px] opacity-40">{asset.name}</span>
                                                    </div>
                                                    <span className="text-xs font-mono opacity-60">{formatCurrency(asset.price)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase opacity-40 font-mono tracking-widest block">{t('quantity')}</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={quantity || ''}
                                        onChange={(e) => setQuantity(parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full bg-[var(--foreground)]/5 border border-[var(--border)] p-3 text-sm font-mono focus:outline-none focus:border-blue-500/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase opacity-40 font-mono tracking-widest block">{t('avgCost')} (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={avgCost || ''}
                                        onChange={(e) => setAvgCost(parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full bg-[var(--foreground)]/5 border border-[var(--border)] p-3 text-sm font-mono focus:outline-none focus:border-blue-500/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-[var(--border)]/10">
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedAssetId || quantity <= 0}
                                className="bg-blue-600 text-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-blue-600/10"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                                {t('establishPosition')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">{t('activeHoldings')} ({holdings.length})</h2>
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--foreground)]/5 border-b border-[var(--border)]">
                            <tr className="font-mono text-[10px] uppercase opacity-40">
                                <th className="p-4 pl-8">{t('asset')}</th>
                                <th className="p-4">{t('quantity')}</th>
                                <th className="p-4">{t('avgCost')}</th>
                                <th className="p-4">{t('currentPrice')}</th>
                                <th className="p-4">{t('pnlYield')}</th>
                                <th className="p-4 pr-8 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto opacity-20" />
                                    </td>
                                </tr>
                            ) : holdings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center opacity-30 italic font-mono text-xs">
                                        {t('noActivePositions')}
                                    </td>
                                </tr>
                            ) : sortedHoldings.map((h) => (
                                <tr key={h.id} className={cn(
                                    "hover:bg-[var(--foreground)]/5 transition-colors group",
                                    pinnedHoldings.includes(h.id) ? "bg-blue-500/5" : ""
                                )}>
                                    <td className="p-4 pl-8">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => togglePin(h.id)}
                                                className={cn(
                                                    "opacity-20 group-hover:opacity-100 transition-opacity",
                                                    pinnedHoldings.includes(h.id) ? "opacity-100 text-blue-500" : "hover:text-blue-500"
                                                )}
                                            >
                                                <Star size={16} fill={pinnedHoldings.includes(h.id) ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => onAssetClick?.(h.symbol)}
                                                className="flex flex-col text-left hover:text-blue-500 transition-colors group/asset"
                                            >
                                                <span className="font-bold tracking-tight text-base leading-none mb-1 flex items-center gap-1.5 underline-offset-4 decoration-blue-500/30 group-hover/asset:underline">
                                                    {h.symbol}
                                                </span>
                                                <span className="text-[10px] opacity-40 uppercase tracking-wider">{h.name}</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono">
                                        {editingId === h.id ? (
                                            <input
                                                type="number"
                                                value={editQuantity}
                                                onChange={(e) => setEditQuantity(parseFloat(e.target.value))}
                                                className="bg-[var(--foreground)]/5 border border-[var(--border)] p-1 w-24 text-xs focus:outline-none"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span>{h.amount}</span>
                                                <div className="hidden group-hover:flex items-center gap-1 opacity-40">
                                                    <button onClick={() => { setEditingId(h.id); setEditQuantity(h.amount + 1); setEditAvgCost(h.avgCost); }} className="hover:text-blue-500"><PlusCircle size={10} /></button>
                                                    <button onClick={() => { setEditingId(h.id); setEditQuantity(Math.max(0, h.amount - 1)); setEditAvgCost(h.avgCost); }} className="hover:text-blue-500"><MinusCircle size={10} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono">
                                        {editingId === h.id ? (
                                            <input
                                                type="number"
                                                value={editAvgCost}
                                                onChange={(e) => setEditAvgCost(parseFloat(e.target.value))}
                                                className="bg-[var(--foreground)]/5 border border-[var(--border)] p-1 w-24 text-xs focus:outline-none"
                                            />
                                        ) : (
                                            formatCurrency(h.avgCost)
                                        )}
                                    </td>
                                    <td className="p-4 font-mono">
                                        <div className="flex flex-col">
                                            <span>{formatCurrency(h.price)}</span>
                                            <span className={cn("text-[10px]", h.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                                                {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono">
                                        <div className="flex flex-col">
                                            <span className={cn("font-bold", h.profit >= 0 ? "text-green-400" : "text-red-400")}>
                                                {h.profit >= 0 ? '+' : ''}{formatCurrency(h.profit)}
                                            </span>
                                            <span className={cn("text-[10px]", h.profit >= 0 ? "text-green-400" : "text-red-400")}>
                                                {h.profit >= 0 ? '+' : ''}{formatPercent(h.profitPercent)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 pr-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {editingId === h.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdate(h.id)}
                                                        className="bg-green-500/10 text-green-400 p-2 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                                                        title="Save changes"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="bg-red-500/10 text-red-400 p-2 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                        title="Cancel edit"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditing(h)}
                                                        className="p-2 opacity-30 hover:opacity-100 hover:bg-[var(--foreground)]/5 text-blue-400 border border-transparent hover:border-blue-500/20 transition-all"
                                                        title="Edit position"
                                                    >
                                                        <ChevronUp size={16} className="rotate-90" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(h.id)}
                                                        className="p-2 opacity-30 hover:opacity-100 hover:bg-[var(--foreground)]/5 text-red-500 border border-transparent hover:border-red-500/20 transition-all"
                                                        title="Remove position"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-6 bg-[var(--foreground)]/5 border-t border-[var(--border)]">
                        <div className="flex items-center gap-6 justify-end text-xs font-mono">
                            <div className="flex flex-col items-end">
                                <span className="opacity-40 uppercase text-[10px]">{t('totalEquity')}</span>
                                <span className="font-bold text-lg">{formatCurrency(holdings.reduce((acc, h) => acc + h.totalValue, 0))}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="opacity-40 uppercase text-[10px]">{t('totalCost')}</span>
                                <span className="font-bold text-lg opacity-60">{formatCurrency(holdings.reduce((acc, h) => acc + (h.avgCost * h.amount), 0))}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="opacity-40 uppercase text-[10px]">{t('overallPL')}</span>
                                {(() => {
                                    const value = holdings.reduce((acc, h) => acc + h.totalValue, 0);
                                    const cost = holdings.reduce((acc, h) => acc + (h.avgCost * h.amount), 0);
                                    const profit = value - cost;
                                    const percent = cost !== 0 ? (profit / cost) * 100 : 0;
                                    return (
                                        <span className={cn("font-bold text-lg", profit >= 0 ? "text-green-400" : "text-red-400")}>
                                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
