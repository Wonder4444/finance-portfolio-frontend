import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, ShieldCheck, Cloud, Zap, ChevronDown, Sparkles } from "lucide-react";
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
  const [selectedModel, setSelectedModel] = useState("llama3.2");
  const [hasAgreed, setHasAgreed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MODELS = [
    { 
      id: "llama3.2", 
      labelKey: "modelLocalLabel", 
      fullName: "Llama 3.2",
      isCloud: false,
      infoKey: "modelLocalInfo",
      icon: ShieldCheck
    },
    { 
      id: "gpt-oss:120b-cloud", 
      labelKey: "modelCloudGPTLabel", 
      fullName: "GPT-OSS 120B",
      isCloud: true,
      infoKey: "modelCloudGPTInfo",
      icon: Zap
    },
    { 
      id: "kimi-k2.5:cloud", 
      labelKey: "modelCloudKimiLabel", 
      fullName: "Kimi v2.5",
      isCloud: true,
      infoKey: "modelCloudKimiInfo",
      icon: Cloud
    },
  ];

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
          model: selectedModel,
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
    <div className="absolute inset-0 flex flex-col overflow-hidden glass-panel border-none">
      {!hasAgreed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-(--background)/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-(--border)/50 shadow-2xl flex flex-col gap-4 max-h-[90%] overflow-y-auto">
            <h3 className="text-lg font-semibold flex items-center gap-2 shrink-0">
              <span className="text-yellow-500 text-xl">⚠️</span>{" "}
              {t("aiPrivacyTitle")}
            </h3>
            <p className="text-sm text-(--foreground)/80 leading-relaxed overflow-y-auto whitespace-pre-wrap">
              {t("aiPrivacyWarning")}
            </p>
            <div className="flex justify-end gap-3 mt-4 shrink-0">
              <button
                onClick={() => setHasAgreed(true)}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                {t("agree")}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  ? "bg-blue-500/10 text-(--foreground) rounded-2xl rounded-tr-sm"
                  : "bg-(--foreground)/5 border border-(--border)/10 rounded-2xl rounded-tl-sm shadow-sm",
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
                          className="bg-(--foreground)/5 border-b border-(--border)/10"
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
                          className="px-4 py-3 border-t border-(--border)/5"
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
                            typeof parsed.type === "string"
                          ) {
                            const isNewFormat =
                              Array.isArray(parsed.series) &&
                              Array.isArray(parsed.categories);
                            const isOldFormat = Array.isArray(parsed.data);

                            if (isNewFormat || isOldFormat) {
                              if (
                                ["bar", "line", "pie", "area"].includes(
                                  parsed.type.toLowerCase(),
                                )
                              ) {
                                config = parsed;
                                isChart = true;
                              }
                            }
                          }
                        } catch (e) {
                          // Ignore parse errors, fallback will trigger later
                        }
                      }

                      if (isChart && config) {
                        try {
                          const type = (config.type || "line").toLowerCase();
                          let data = config.data || [];
                          let xKey = config.xKey || "name";
                          let yKeys =
                            config.yKeys ||
                            (config.yKey ? [config.yKey] : ["value"]);
                          const isStacked = config.stacked === true;
                          const orientation = config.orientation || "vertical";

                          // Handle new format (series/categories)
                          if (
                            config.series &&
                            config.categories &&
                            Array.isArray(config.series) &&
                            Array.isArray(config.categories)
                          ) {
                            xKey = "category";
                            yKeys = config.series.map((s: any) => s.name);
                            data = config.categories.map(
                              (cat: string, catIdx: number) => {
                                const entry: any = { category: cat };
                                config.series.forEach((s: any) => {
                                  if (Array.isArray(s.value)) {
                                    entry[s.name] = s.value[catIdx];
                                  } else {
                                    // Fallback for single value or if value is just a number
                                    entry[s.name] = s.value;
                                  }
                                });
                                return entry;
                              },
                            );
                          } else if (
                            config.series &&
                            !config.categories &&
                            type === "pie"
                          ) {
                            // Special case for pie chart with series format
                            data = config.series;
                            xKey = "name";
                            yKeys = ["value"];
                          }

                          return (
                            <div className="h-75 w-full my-4 bg-(--background) p-4 rounded border border-(--border) overflow-hidden">
                              {config.title && (
                                <div className="text-xs font-semibold mb-2 opacity-70 text-center">
                                  {config.title}
                                </div>
                              )}
                              <ResponsiveContainer
                                width="100%"
                                height={config.title ? "90%" : "100%"}
                              >
                                {type === "bar" ? (
                                  <BarChart
                                    data={data}
                                    layout={
                                      orientation === "horizontal"
                                        ? "vertical"
                                        : "horizontal"
                                    }
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      opacity={0.1}
                                      vertical={orientation === "horizontal"}
                                      horizontal={orientation !== "horizontal"}
                                    />
                                    <XAxis
                                      type={
                                        orientation === "horizontal"
                                          ? "number"
                                          : "category"
                                      }
                                      dataKey={
                                        orientation === "horizontal"
                                          ? undefined
                                          : xKey
                                      }
                                      tick={{ fontSize: 10 }}
                                      hide={false}
                                    />
                                    <YAxis
                                      type={
                                        orientation === "horizontal"
                                          ? "category"
                                          : "number"
                                      }
                                      dataKey={
                                        orientation === "horizontal"
                                          ? xKey
                                          : undefined
                                      }
                                      tick={{ fontSize: 10 }}
                                      label={
                                        config.yAxis?.label
                                          ? {
                                              value: config.yAxis.label,
                                              angle: -90,
                                              position: "insideLeft",
                                              style: {
                                                fontSize: 10,
                                                fill: "var(--foreground)",
                                                opacity: 0.5,
                                              },
                                            }
                                          : undefined
                                      }
                                      domain={[
                                        config.yAxis?.min ?? "auto",
                                        config.yAxis?.max ?? "auto",
                                      ]}
                                    />
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: "var(--background)",
                                        borderColor: "var(--border)",
                                        color: "var(--foreground)",
                                        fontSize: "12px",
                                        borderRadius: "8px",
                                      }}
                                    />
                                    <Legend
                                      wrapperStyle={{
                                        fontSize: 10,
                                        paddingTop: 10,
                                      }}
                                    />
                                    {yKeys.map((key: string, idx: number) => (
                                      <Bar
                                        key={key}
                                        dataKey={key}
                                        stackId={isStacked ? "a" : undefined}
                                        fill={COLORS[idx % COLORS.length]}
                                        radius={isStacked ? 0 : [4, 4, 0, 0]}
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
                                      label={{ fontSize: 10 }}
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
                                        fontSize: "12px",
                                        borderRadius: "8px",
                                      }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                  </PieChart>
                                ) : (
                                  <LineChart data={data}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      opacity={0.1}
                                    />
                                    <XAxis
                                      dataKey={xKey}
                                      tick={{ fontSize: 10 }}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 10 }}
                                      label={
                                        config.yAxis?.label
                                          ? {
                                              value: config.yAxis.label,
                                              angle: -90,
                                              position: "insideLeft",
                                              style: {
                                                fontSize: 10,
                                                fill: "var(--foreground)",
                                                opacity: 0.5,
                                              },
                                            }
                                          : undefined
                                      }
                                    />
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: "var(--background)",
                                        borderColor: "var(--border)",
                                        color: "var(--foreground)",
                                        fontSize: "12px",
                                        borderRadius: "8px",
                                      }}
                                    />
                                    <Legend
                                      wrapperStyle={{
                                        fontSize: 10,
                                        paddingTop: 10,
                                      }}
                                    />
                                    {yKeys.map((key: string, idx: number) => (
                                      <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={COLORS[idx % COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                      />
                                    ))}
                                  </LineChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          );
                        } catch (e) {
                          console.error("Chart render error:", e);
                          return (
                            <div className="bg-red-500/10 border border-red-500 p-2 text-red-500 rounded my-2 text-xs">
                              Failed to render chart:{" "}
                              {e instanceof Error
                                ? e.message
                                : "Invalid configuration"}
                            </div>
                          );
                        }
                      }
                      return (
                        <code
                          className={className}
                          style={{
                            backgroundColor: "rgba(0,0,0,0.1)",
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
            <div className="p-4 text-sm leading-relaxed bg-(--foreground)/5 border border-(--border)/10 rounded-2xl rounded-tl-sm shadow-sm animate-pulse">
              {t("aiThinking")}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-(--border) bg-(--background)/50 backdrop-blur-md">
        <div className="flex flex-wrap gap-2 mb-4">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              title={t(m.infoKey)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300",
                selectedModel === m.id
                  ? "bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20"
                  : "bg-(--foreground)/5 border-(--border) hover:border-blue-500/30 hover:bg-(--foreground)/10"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                selectedModel === m.id ? "bg-blue-500 text-white" : "bg-(--foreground)/10 text-(--foreground)/60 group-hover:text-blue-500"
              )}>
                <m.icon size={14} />
              </div>
              <div className="flex flex-col items-start">
                <span className={cn(
                  "text-[10px] font-medium leading-none mb-0.5",
                  selectedModel === m.id ? "text-blue-500" : "text-(--foreground)/40"
                )}>
                  {m.isCloud ? "Cloud AI" : "Local AI"}
                </span>
                <span className={cn(
                  "text-xs font-semibold leading-none",
                  selectedModel === m.id ? "text-(--foreground)" : "text-(--foreground)/70"
                )}>
                  {t(m.labelKey)}
                </span>
              </div>
              
              {selectedModel === m.id && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles size={8} className="text-blue-500 animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("askAIPlaceholder")}
            className="flex-1 bg-(--foreground)/5 border border-(--border) p-3 px-6 rounded-2xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-(--foreground)/10 transition-all placeholder:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="group relative p-3! px-6! rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500 opacity-10 group-hover:opacity-20 transition-opacity" />
            <Send
              size={18}
              className={cn(
                "transition-all",
                input.trim() ? "text-blue-500 scale-110" : "opacity-30"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
