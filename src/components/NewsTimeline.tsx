import React from 'react';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { NewsItem } from '../types';
import { cn } from '../lib/utils';

interface NewsTimelineProps {
  news: NewsItem[];
}

export const NewsTimeline: React.FC<NewsTimelineProps> = ({ news }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="font-medium uppercase tracking-wider text-xs opacity-60">Market Timeline</h2>
        <span className="text-[10px] opacity-40 uppercase">Today</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-4 bottom-4 w-[1px] bg-white/10" />

        {news.map((item) => (
          <div key={item.id} className="relative pl-8 group">
            {/* Dot */}
            <div className={cn(
              "absolute left-[21px] top-1.5 w-2 h-2 rounded-full z-10 border-2 border-[#0a0a0a]",
              item.impact === 'positive' ? "bg-green-500" : 
              item.impact === 'negative' ? "bg-red-500" : "bg-gray-500"
            )} />
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-mono opacity-50">
                <Clock size={10} />
                {item.time}
                <span className="px-1.5 py-0.5 bg-white/5 border border-white/10">
                  {item.category}
                </span>
              </div>
              <h3 className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs opacity-60 leading-relaxed">
                {item.summary}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {item.impact === 'positive' && <TrendingUp size={12} className="text-green-500" />}
                {item.impact === 'negative' && <TrendingDown size={12} className="text-red-500" />}
                {item.impact === 'neutral' && <Minus size={12} className="text-gray-500" />}
                <span className={cn(
                  "text-[10px] uppercase font-bold tracking-tighter",
                  item.impact === 'positive' ? "text-green-500" : 
                  item.impact === 'negative' ? "text-red-500" : "text-gray-500"
                )}>
                  {item.impact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
