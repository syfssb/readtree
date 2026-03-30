'use client';

import React, { useState } from 'react';
import { use } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { ContentPanel } from '@/components/layout/content-panel';
import { Button } from '@/components/ui/button';
import { ChapterTree } from '@/components/tree/chapter-tree';
import { ChapterDetail } from '@/components/chapter/chapter-detail';
import { useBook } from '@/hooks/use-book';
import { useSync } from '@/hooks/use-sync';
import { cn } from '@/lib/utils/cn';

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

/**
 * 书籍主页
 * 三栏布局：Header + Sidebar（目录树）+ ContentPanel（章节详情）
 */
export default function BookPage({ params }: BookPageProps) {
  const { bookId } = use(params);
  const { book, chapters, isLoading, error } = useBook(bookId);
  const { syncStatus, triggerSync } = useSync(bookId);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const syncLabel = {
    idle: '同步笔记',
    syncing: '同步中...',
    success: '同步完成',
    error: '同步失败',
  }[syncStatus];

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <Header />

      {/* 侧边栏 */}
      <Sidebar>
        {/* 书籍信息 + 同步按钮 */}
        <div className="mb-4">
          {book && (
            <div className="mb-3">
              <h2 className="font-serif text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-0.5 line-clamp-2">
                {book.title}
              </h2>
              <p className="font-sans text-xs text-[var(--color-text-muted)]">
                {book.author}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            disabled={syncStatus === 'syncing'}
            onClick={() => triggerSync()}
            className={cn(
              'w-full justify-start gap-2 text-xs',
              syncStatus === 'error' && 'text-red-500'
            )}
          >
            {syncStatus === 'success' ? (
              <CheckCircle size={13} className="text-green-600" />
            ) : syncStatus === 'error' ? (
              <AlertCircle size={13} />
            ) : (
              <RefreshCw
                size={13}
                className={syncStatus === 'syncing' ? 'animate-spin' : ''}
              />
            )}
            {syncLabel}
          </Button>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-[var(--color-border)] mb-3" />

        {/* 章节树 */}
        {isLoading ? (
          <div className="flex flex-col gap-2 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-6 rounded bg-[var(--color-secondary)] animate-pulse"
                style={{ width: `${60 + (i % 3) * 15}%` }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="font-sans text-xs text-red-500 py-2">{error}</p>
        ) : (
          <ChapterTree
            chapters={chapters}
            onSelect={(id) => setSelectedChapterId(id)}
          />
        )}
      </Sidebar>

      {/* 主内容区 */}
      <ContentPanel>
        <ChapterDetail bookId={bookId} chapterId={selectedChapterId} />
      </ContentPanel>
    </div>
  );
}
