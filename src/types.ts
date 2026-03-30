export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'fund';
  price: number;
  change: number;
  changePercent: number;
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
  summary: string;
  impact: 'positive' | 'negative' | 'neutral';
  category: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
