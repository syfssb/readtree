'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils/cn';

export interface SummaryEditorProps {
  bookId: string;
  chapterId: string;
  initialSummary: string | null;
}

type SaveState = 'idle' | 'saving' | 'saved';

/**
 * 章节总结编辑器
 * 防抖 1000ms 自动保存，右上角显示保存状态
 */
export function SummaryEditor({ bookId, chapterId, initialSummary }: SummaryEditorProps) {
  const [summary, setSummary] = useState(initialSummary ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const isFirstRender = useRef(true);
  const debouncedSummary = useDebounce(summary, 1000);

  // 当切换章节时重置内容
  useEffect(() => {
    setSummary(initialSummary ?? '');
    setSaveState('idle');
    isFirstRender.current = true;
  }, [chapterId, initialSummary]);

  // 防抖值变化时触发保存（跳过首次渲染）
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveState('saving');

    fetch(`/api/books/${bookId}/chapters/${chapterId}/summary`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: debouncedSummary }),
    })
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('idle'));
  }, [bookId, chapterId, debouncedSummary]);

  const statusText = {
    idle: '',
    saving: '保存中...',
    saved: '已保存',
  }[saveState];

  return (
    <div className="relative">
      {statusText && (
        <span
          className={cn(
            'absolute top-0 right-0 font-sans text-xs',
            saveState === 'saving'
              ? 'text-[var(--color-text-subtle)]'
              : 'text-[#788c5d]'
          )}
        >
          {statusText}
        </span>
      )}
      <Textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="为这一节写下你的总结..."
        minRows={4}
        className="font-serif text-sm"
      />
    </div>
  );
}
