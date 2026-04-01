import React, { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export const AIChat: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('aiGreeting'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/finance-portfolio/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 2,
          chatId: chatId,
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.chatId && !chatId) {
        setChatId(data.chatId);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply || t('aiError'),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: t('aiError'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel border-none">
      <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
        <Bot size={20} className="text-blue-400" />
        <h2 className="font-medium uppercase tracking-wider text-xs opacity-60">{t('aiAdvisor')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-[var(--foreground)]/10" : "bg-blue-500/20"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-blue-400" />}
            </div>
            <div className={cn(
              "p-3 text-sm leading-relaxed",
              msg.role === 'user' ? "bg-[var(--foreground)]/5" : "bg-[var(--foreground)]/5 border border-[var(--border)]/5"
            )}>
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-blue-500/20">
              <Loader2 size={16} className="text-blue-400 animate-spin" />
            </div>
            <div className="p-3 text-sm bg-[var(--foreground)]/5 animate-pulse">{t('aiThinking')}</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('askAIPlaceholder')}
            className="flex-1 bg-[var(--foreground)]/5 border border-[var(--border)] p-2 text-sm focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="glass-button p-2 px-4 flex items-center justify-center disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
