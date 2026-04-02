export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: "stock" | "crypto" | "fund";
  price: number;
  change: number;
  changePercent: number;
  isLive?: boolean;
  marketCap?: number;
  peRatio?: number;
  psRatio?: number;
  pbRatio?: number;
  industry?: string;
}

export interface Holding extends Asset {
  amount: number;
  avgCost: number;
  totalValue: number;
  profit: number;
  profitPercent: number;
}

export interface NewsItem {
  id: string;
  time: string;
  title: string;
  category: string;
  link?: string;
  summary?: string;
  impact?: "positive" | "negative" | "neutral" | string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  accountPlan: string;
}
