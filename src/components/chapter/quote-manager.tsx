'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ManualQuote } from '@/types/api';

export interface QuoteManagerProps {
  bookId: string;
  chapterId: string;
  initialQuotes: ManualQuote[];
}

/**
 * 手动引用管理器
 * 支持添加/删除引用，操作后刷新列表
 */
export function QuoteManager({ bookId, chapterId, initialQuotes }: QuoteManagerProps) {
  const [quotes, setQuotes] = useState<ManualQuote[]>(initialQuotes);
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const baseUrl = `/api/books/${bookId}/chapters/${chapterId}/quotes`;

  const handleAdd = async () => {
    const text = inputText.trim();
    if (!text || isAdding) return;

    setIsAdding(true);
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, chapterId }),
      });
      const json = await res.json();
      if (res.ok) {
        const newQuote: ManualQuote = json.data ?? json;
        setQuotes((prev) => [...prev, newQuote]);
        setInputText('');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(baseUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: id }),
      });
      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 引用列表 */}
      {quotes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {quotes.map((quote) => (
            <li
              key={quote.id}
              className="flex items-start gap-2 group"
            >
              <p className="flex-1 font-serif text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {quote.text}
              </p>
              <button
                aria-label="删除引用"
                disabled={deletingId === quote.id}
                onClick={() => handleDelete(quote.id)}
                className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded text-[var(--color-text-subtle)] hover:text-red-500 hover:bg-red-50 transition-colors duration-150 opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-30"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 添加区域 */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="添加引用文字..."
            className="text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!inputText.trim() || isAdding}
          onClick={handleAdd}
        >
          添加
        </Button>
      </div>
    </div>
  );
}
