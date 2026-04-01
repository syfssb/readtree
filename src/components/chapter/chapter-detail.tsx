'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useChapterContent } from '@/hooks/use-chapter-content';
import { SummaryEditor } from './summary-editor';
import { HighlightList } from './highlight-list';
import { NoteList } from './note-list';
import { QuoteManager } from './quote-manager';

export interface ChapterDetailProps {
  bookId: string;
  chapterId: string | null;
  /** 用于面包屑导航的书名 */
  bookTitle?: string;
}

/** 区块标题样式 */
const sectionTitleClass =
  'font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)] mb-3';

/**
 * 章节详情主区域
 * - 无选中时显示引导提示
 * - 有选中时展示总结、划线、笔记、引用
 */
export function ChapterDetail({ bookId, chapterId, bookTitle }: ChapterDetailProps) {
  const { chapter, highlights, notes, quotes, isLoading } = useChapterContent(
    bookId,
    chapterId
  );

  // 未选中状态
  if (!chapterId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-sans text-base text-[var(--color-text-subtle)]">
          ← 点击左侧目录选择章节
        </p>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height="2rem" width="60%" />
        <Skeleton height="8rem" />
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 面包屑导航 */}
      {chapter && (
        <nav
          aria-label="面包屑"
          className="flex items-center gap-1.5 font-sans text-xs text-[var(--color-text-muted)] flex-wrap"
        >
          {bookTitle && (
            <>
              <span className="truncate max-w-[10rem]">{bookTitle}</span>
              <span aria-hidden="true" className="text-[var(--color-text-disabled)]">›</span>
            </>
          )}
          <span className="text-[var(--color-text-secondary)] font-medium truncate max-w-[16rem]">
            {chapter.title}
          </span>
        </nav>
      )}

      {/* 总结区块 */}
      <Card className="p-4">
        <CardHeader className="mb-2 p-0">
          <p className={sectionTitleClass}>总结</p>
        </CardHeader>
        <CardBody>
          {chapter && (
            <SummaryEditor
              bookId={bookId}
              chapterId={chapter.id}
              initialSummary={chapter.summary}
            />
          )}
        </CardBody>
      </Card>

      {/* 划线区块 */}
      <Card className="p-4">
        <CardHeader className="mb-2 p-0">
          <p className={sectionTitleClass}>
            划线
            {highlights.length > 0 && (
              <span className="ml-1.5 font-sans normal-case tracking-normal text-[var(--color-text-disabled)]">
                {highlights.length}
              </span>
            )}
          </p>
        </CardHeader>
        <CardBody>
          <HighlightList highlights={highlights} />
        </CardBody>
      </Card>

      {/* 笔记区块 */}
      <Card className="p-4">
        <CardHeader className="mb-2 p-0">
          <p className={sectionTitleClass}>
            笔记
            {notes.length > 0 && (
              <span className="ml-1.5 font-sans normal-case tracking-normal text-[var(--color-text-disabled)]">
                {notes.length}
              </span>
            )}
          </p>
        </CardHeader>
        <CardBody>
          <NoteList notes={notes} />
        </CardBody>
      </Card>

      {/* 引用区块 */}
      <Card className="p-4">
        <CardHeader className="mb-2 p-0">
          <p className={sectionTitleClass}>手动引用</p>
        </CardHeader>
        <CardBody>
          {chapter && (
            <QuoteManager
              bookId={bookId}
              chapterId={chapter.id}
              initialQuotes={quotes}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
