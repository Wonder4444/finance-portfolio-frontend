import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { ChatMessage } from "../types";
import { cn } from "../lib/utils";
import { useTranslation } from "react-i18next";

export const AIChat: React.FC = () => {
  const { t, i18n } = useTranslation();

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: t("aiGreeting"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/finance-portfolio/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 2,
          chatId: chatId,
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.chatId && !chatId) {
        setChatId(data.chatId);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || t("aiError"),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error in AI chat:", error);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: t("aiError"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden glass-panel border-none">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 max-w-[95%] md:max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === "user"
                  ? "bg-blue-500/20 text-blue-500"
                  : "bg-blue-500/20",
              )}
            >
              {msg.role === "user" ? (
                <User size={16} />
              ) : (
                <Bot size={16} className="text-blue-400" />
              )}
            </div>
            <div
              className={cn(
                "p-4 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-blue-500/10 text-[var(--foreground)] rounded-2xl rounded-tr-sm"
                  : "bg-[var(--foreground)]/5 border border-[var(--border)]/10 rounded-2xl rounded-tl-sm shadow-sm",
              )}
            >
              <div className="prose dark:prose-invert prose-sm max-w-none w-full overflow-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table({ children, ...props }: any) {
                      return (
                        <div className="overflow-x-auto my-4 w-full glass-panel">
                          <table
                            className="min-w-full text-left text-sm"
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children, ...props }: any) {
                      return (
                        <thead
                          className="bg-[var(--foreground)]/5 border-b border-[var(--border)]/10"
                          {...props}
                        >
                          {children}
                        </thead>
                      );
                    },
                    th({ children, ...props }: any) {
                      return (
                        <th
                          className="px-4 py-3 font-mono uppercase opacity-50 text-xs"
                          {...props}
                        >
                          {children}
                        </th>
                      );
                    },
                    td({ children, ...props }: any) {
                      return (
                        <td
                          className="px-4 py-3 border-t border-[var(--border)]/5"
                          {...props}
                        >
                          {children}
                        </td>
                      );
                    },
                    code({ className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const language = match ? match[1].toLowerCase() : "";
                      const isChartLang =
                        language === "chart" || language === "recharts";
                      const isJsonLang = language === "json";

                      let isChart = isChartLang;
                      let config: any = null;

                      if (isChartLang || isJsonLang) {
                        try {
                          const parsed = JSON.parse(
                            String(children).replace(/\n$/, ""),
                          );
                          if (isChartLang) {
                            config = parsed;
                            isChart = true;
                          } else if (
                            isJsonLang &&
                            parsed &&
                            typeof parsed === "object" &&
                            typeof parsed.type === "string" &&
                            Array.isArray(parsed.data)
                          ) {
                            if (
                              ["bar", "line", "pie", "area"].includes(
                                parsed.type.toLowerCase(),
                              )
                            ) {
                              config = parsed;
                              isChart = true;
                            }
                          }
                        } catch (e) {
                          // Ignore parse errors, fallback will trigger later
                        }
                      }

                      if (isChart && config) {
                        try {
                          const type = (config.type || "line").toLowerCase();
                          const data = config.data || [];
                          const xKey = config.xKey || "name";
                          const yKeys =
                            config.yKeys ||
                            (config.yKey ? [config.yKey] : ["value"]);

                          return (
                            <div className="h-[250px] w-full my-4 bg-[var(--background)] p-4 rounded border border-[var(--border)] overflow-hidden">
                              <ResponsiveContainer width="100%" height="100%">
                                {type === "bar" ? (
                                  <BarChart data={data}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      opacity={0.2}
                                    />
                                    <XAxis
                                      dataKey={xKey}
                                      tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: "var(--background)",
                                        borderColor: "var(--border)",
                                        color: "var(--foreground)",
                                      }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {yKeys.map((key: string, idx: number) => (
                                      <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={COLORS[idx % COLORS.length]}
                                      />
                                    ))}
                                  </BarChart>
                                ) : type === "pie" ? (
                                  <PieChart>
                                    <Pie
                                      data={data}
                                      dataKey={yKeys[0]}
                                      nameKey={xKey}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      label={{ fontSize: 12 }}
                                    >
                                      {data.map((_: any, idx: number) => (
                                        <Cell
                                          key={`cell-${idx}`}
                                          fill={COLORS[idx % COLORS.length]}
                                        />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: "var(--background)",
                                        borderColor: "var(--border)",
                                        color: "var(--foreground)",
                                      }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                  </PieChart>
                                ) : (
                                  <LineChart data={data}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      opacity={0.2}
                                    />
                                    <XAxis
                                      dataKey={xKey}
                                      tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: "var(--background)",
                                        borderColor: "var(--border)",
                                        color: "var(--foreground)",
                                      }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {yKeys.map((key: string, idx: number) => (
                                      <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={COLORS[idx % COLORS.length]}
                                        activeDot={{ r: 8 }}
                                      />
                                    ))}
                                  </LineChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="bg-red-500/10 border border-red-500 p-2 text-red-500 rounded my-2 text-xs">
                              Failed to render chart: Invalid JSON configuration
                            </div>
                          );
                        }
                      }
                      return (
                        <code
                          className={className}
                          style={{
                            backgroundColor: "var(--foreground)",
                            color: "var(--background)",
                            padding: "0.2rem 0.4rem",
                            borderRadius: "0.2rem",
                            fontSize: "0.875rem",
                          }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[95%] md:max-w-[85%]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-500/20 mt-1">
              <Loader2 size={16} className="text-blue-400 animate-spin" />
            </div>
            <div className="p-4 text-sm leading-relaxed bg-[var(--foreground)]/5 border border-[var(--border)]/10 rounded-2xl rounded-tl-sm shadow-sm animate-pulse">
              {t("aiThinking")}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("askAIPlaceholder")}
            className="flex-1 bg-[var(--foreground)]/5 border border-[var(--border)] p-3 px-5 rounded-full text-sm focus:outline-none focus:border-blue-500/50 focus:bg-[var(--foreground)]/10 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="glass-button !p-3 !px-5 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-500/10 transition-colors"
          >
            <Send
              size={18}
              className={input.trim() ? "text-blue-500" : "opacity-50"}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
