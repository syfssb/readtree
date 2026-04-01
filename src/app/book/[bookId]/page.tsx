'use client';

import React, { useState } from 'react';
import { use } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { ContentPanel } from '@/components/layout/content-panel';
import { Button } from '@/components/ui/button';
import { ChapterTree } from '@/components/tree/chapter-tree';
import { ChapterDetail } from '@/components/chapter/chapter-detail';
import { BookFlow } from '@/components/flow/book-flow';
import { FlowTabs, type FlowTab } from '@/components/flow/flow-tabs';
import { buildChapterTree } from '@/lib/utils/tree';
import { useBook } from '@/hooks/use-book';
import { useSync } from '@/hooks/use-sync';
import { cn } from '@/lib/utils/cn';

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

/**
 * 书籍主页
 *
 * 布局：Header + Sidebar（目录树列表）+ ContentPanel（Tab 切换）
 * - Tab "树形图"：React Flow 可视化目录树
 * - Tab "章节详情"：选中章节的总结/划线/笔记
 * 点击树形图节点 → 自动切换到章节详情 Tab
 */
export default function BookPage({ params }: BookPageProps) {
  const { bookId } = use(params);
  const { book, chapters, isLoading, error } = useBook(bookId);
  const { syncStatus, triggerSync, errorMessage } = useSync(bookId);

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FlowTab>('flow');

  const tree = React.useMemo(() => buildChapterTree(chapters), [chapters]);

  const syncLabel = {
    idle: '同步笔记',
    syncing: '同步中...',
    success: '同步完成',
    error: '同步失败',
  }[syncStatus];

  /** 点击树形图节点：选中章节并切换到详情 Tab */
  const handleFlowNodeSelect = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setActiveTab('detail');
  };

  /** 点击侧边栏章节树：选中章节并切换到详情 Tab */
  const handleTreeSelect = (id: string) => {
    setSelectedChapterId(id);
    setActiveTab('detail');
  };

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

          {/* 同步失败时显示具体错误信息 */}
          {syncStatus === 'error' && errorMessage && (
            <p className="font-sans text-xs text-red-500 mt-1 px-1">{errorMessage}</p>
          )}

          {/* 导出 Markdown 按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/api/books/${bookId}/export`)}
            className="w-full justify-start gap-2 text-xs mt-1"
          >
            <Download size={13} />
            导出 Markdown
          </Button>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-[var(--color-border)] mb-3" />

        {/* 章节树（快速导航，保留原有功能） */}
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
          <ChapterTree chapters={chapters} onSelect={handleTreeSelect} />
        )}
      </Sidebar>

      {/* 主内容区 — 全宽，承载 Flow 画布 */}
      <ContentPanel fullWidth>
        {/* Tab 切换栏 */}
        <div className="flex items-center px-6 pt-4 pb-0 border-b border-[var(--color-border)]">
          <FlowTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab 内容区 */}
        <div
          className={cn(
            'relative',
            // 计算高度：总视口 - header(56px) - tab bar(~49px)
            'h-[calc(100vh-3.5rem-49px)]'
          )}
        >
          {/* Tab 1：树形图 */}
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-200',
              activeTab === 'flow' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
          >
            {!isLoading && tree.length > 0 && (
              <BookFlow
                chapters={tree}
                onNodeSelect={handleFlowNodeSelect}
              />
            )}
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <p className="font-sans text-sm text-[var(--color-text-subtle)]">加载中...</p>
              </div>
            )}
            {!isLoading && tree.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="font-sans text-sm text-[var(--color-text-subtle)]">
                  暂无章节数据，请先同步笔记
                </p>
              </div>
            )}
          </div>

          {/* Tab 2：章节详情 */}
          <div
            className={cn(
              'absolute inset-0 overflow-y-auto transition-opacity duration-200',
              activeTab === 'detail' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
          >
            <div className="max-w-3xl mx-auto px-6 py-8">
              <ChapterDetail bookId={bookId} chapterId={selectedChapterId} />
            </div>
          </div>
        </div>
      </ContentPanel>
    </div>
  );
}
