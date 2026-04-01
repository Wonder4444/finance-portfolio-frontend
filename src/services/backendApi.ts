
import type { Asset, Holding, User } from '../types';

const BASE_URL = '/finance-portfolio/api';

export interface ApiResult<T> {
    code: number;
    message: string;
    data: T;
}

export interface PageResult<T> {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
}

export interface BackendUser {
    id: number;
    userName: string;
    email: string;
    accountPlan?: string;
}

export interface BackendAsset {
    id: number;
    symbol: string;
    fullName: string;
    assetType: 'STOCK' | 'CRYPTO';
    currentPrice: number;
    createTime: string;
    updateTime: string;
}

export interface BackendHolding {
    id: number;
    userId: number;
    assetId: number;
    quantity: number;
    avgCost: number;
}

/**
 * Fetch assets from the backend database with pagination
 */
export async function getBackendAssetsPaginated(current: number, size: number): Promise<PageResult<Asset>> {
    const response = await fetch(`${BASE_URL}/assets/page?current=${current}&size=${size}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
    }
    const result: ApiResult<PageResult<BackendAsset>> = await response.json();

    // MyBatis-Plus might not return current/pages directly depending on config or version
    // So we calculate them as fallbacks
    const total = result.data.total ?? 0;
    const totalPages = result.data.pages ?? Math.ceil(total / size);
    const currentPage = result.data.current ?? current;

    return {
        ...result.data,
        current: currentPage,
        pages: totalPages > 0 ? totalPages : 1,
        records: result.data.records.map(asset => ({
            id: `backend-${asset.id}`,
            symbol: asset.symbol,
            name: asset.fullName,
            type: asset.assetType.toLowerCase() as 'stock' | 'crypto',
            price: asset.currentPrice,
            change: 0,
            changePercent: 0,
        }))
    };
}

/**
 * Fetch all assets from the backend database
 */
export async function getBackendAssets(): Promise<Asset[]> {
    const response = await fetch(`${BASE_URL}/assets`);
    if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
    }
    const result: ApiResult<BackendAsset[]> = await response.json();

    // Convert to our internal Asset type
    return result.data.map(asset => ({
        id: `backend-${asset.id}`,
        symbol: asset.symbol,
        name: asset.fullName,
        type: asset.assetType.toLowerCase() as 'stock' | 'crypto',
        price: asset.currentPrice,
        change: 0, // Placeholder as backend doesn't seem to have change data
        changePercent: 0, // Placeholder
    }));
}

/**
 * Fetch user holdings from the backend database for a specific user.
 * We also fetch the asset details to join the data.
 */
export async function getBackendHoldings(): Promise<Holding[]> {
    const response = await fetch(`${BASE_URL}/holdings`);
    if (!response.ok) {
        throw new Error(`Failed to fetch holdings: ${response.statusText}`);
    }
    const result: ApiResult<BackendHolding[]> = await response.json();

    // To properly display holdings, we need the asset details.
    // Fetching all assets for a simple "join" operation (could be optimized).
    const assets = await getBackendAssets();
    const assetMap = new Map(assets.map(a => [a.id.replace('backend-', ''), a]));

    return result.data.map(h => {
        const asset = assetMap.get(h.assetId.toString());
        if (!asset) {
            return {
                id: `holding-${h.id}`,
                symbol: `ID:${h.assetId}`,
                name: 'Unknown Asset',
                type: 'stock',
                price: 0,
                change: 0,
                changePercent: 0,
                amount: h.quantity,
                avgCost: h.avgCost,
                totalValue: 0 * h.quantity,
                profit: 0,
                profitPercent: 0,
            };
        }

        const totalValue = asset.price * h.quantity;
        const totalCost = h.avgCost * h.quantity;
        const profit = totalValue - totalCost;
        const profitPercent = totalCost !== 0 ? (profit / totalCost) * 100 : 0;

        return {
            ...asset,
            id: `holding-${h.id}`,
            amount: h.quantity,
            avgCost: h.avgCost,
            totalValue,
            profit,
            profitPercent,
        };
    });
}

/**
 * Add a new holding to the backend
 */
export async function addHolding(userId: number, assetId: number, quantity: number, avgCost: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, assetId, quantity, avgCost })
    });
    const result: ApiResult<any> = await response.json();
    return result.code === 200;
}

/**
 * Update an existing holding in the backend
 */
export async function updateHolding(holdingId: number, quantity: number, avgCost: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/holdings/${holdingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, avgCost })
    });
    const result: ApiResult<any> = await response.json();
    return result.code === 200;
}

/**
 * Delete a holding from the backend
 */
export async function deleteHolding(holdingId: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/holdings/${holdingId}`, {
        method: 'DELETE'
    });
    const result: ApiResult<any> = await response.json();
    return result.code === 200;
}

/**
 * Fetch a specific user from the backend database
 */
export async function getUser(userId: number): Promise<User> {
    const response = await fetch(`${BASE_URL}/users/${userId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch user ${userId}: ${response.statusText}`);
    }
    const result: ApiResult<BackendUser> = await response.json();
    return {
        id: result.data.id,
        username: result.data.userName || 'Unknown User',
        email: result.data.email || 'N/A',
        accountPlan: result.data.accountPlan || 'Premium Plan'
    };
}
