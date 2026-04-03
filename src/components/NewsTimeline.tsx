import React from "react";
import { Clock } from "lucide-react";
import { NewsItem } from "../types";
import { useTranslation } from "react-i18next";

interface NewsTimelineProps {
  news: NewsItem[];
}

export const NewsTimeline: React.FC<NewsTimelineProps> = ({ news }) => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="font-medium uppercase tracking-wider text-xs opacity-60">
          {t("marketTimeline")}
        </h2>
        <span className="text-[10px] opacity-40 uppercase">{t("today")}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-4 bottom-4 w-[1px] bg-[var(--border)]" />

        {[...news]
          .sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0))
          .map((item) => (
          <div key={item.id} className="relative pl-8 group">
            {/* Dot */}
            <div className="absolute left-[21px] top-1.5 w-2 h-2 rounded-full z-10 border-2 border-[var(--background)] bg-gray-500" />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-mono opacity-50">
                <Clock size={10} />
                {item.time}
                <span className="px-1.5 py-0.5 bg-[var(--foreground)]/5 border border-[var(--border)]">
                  {item.category}
                </span>
              </div>
              <h3 className="text-sm font-medium transition-colors">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 focus:outline-none focus:text-blue-400"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="group-hover:text-blue-400">
                    {item.title}
                  </span>
                )}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
