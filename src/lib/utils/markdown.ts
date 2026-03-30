/**
 * Markdown 导出生成器
 *
 * 将书籍结构化数据（章节、划线、笔记、引用）渲染为 Markdown 字符串。
 * 采用纯函数设计，无副作用，便于单元测试。
 */

import type { Book } from '@/types/book';
import type { Chapter } from '@/types/chapter';
import type { Highlight } from '@/types/highlight';
import type { Note } from '@/types/note';
import type { ManualQuote } from '@/types/api';

/** 按 chapterId 分组任意实体 */
function groupById<T extends { chapterId: string }>(
  items: readonly T[],
): Map<string, T[]> {
  return items.reduce((acc, item) => {
    const list = acc.get(item.chapterId) ?? [];
    list.push(item);
    acc.set(item.chapterId, list);
    return acc;
  }, new Map<string, T[]>());
}

/** 渲染单个章节块 */
function renderChapter(
  chapter: Chapter,
  highlights: Highlight[],
  notes: Note[],
  quotes: ManualQuote[],
): string {
  const lines: string[] = [];

  lines.push(`## ${chapter.title}`);

  if (chapter.summary) {
    lines.push('', '### 我的总结', '', chapter.summary);
  }

  if (highlights.length > 0) {
    lines.push('', '### 划线');
    highlights.forEach((h) => lines.push('', `> ${h.text}`));
  }

  if (notes.length > 0) {
    lines.push('', '### 笔记');
    notes.forEach((n) => lines.push('', `- ${n.text}`));
  }

  if (quotes.length > 0) {
    lines.push('', '### 引用');
    quotes.forEach((q) => lines.push('', `> ${q.text}`));
  }

  return lines.join('\n');
}

/**
 * 生成书籍 Markdown 导出内容
 *
 * @param book       书籍基础信息
 * @param chapters   章节列表（已按 orderIndex 排序）
 * @param highlights 书籍所有划线
 * @param notes      书籍所有笔记
 * @param quotes     书籍所有手动引用
 * @returns 完整 Markdown 字符串
 */
export function generateMarkdown(
  book: Book,
  chapters: readonly Chapter[],
  highlights: readonly Highlight[],
  notes: readonly Note[],
  quotes: readonly ManualQuote[],
): string {
  const highlightsByChapter = groupById(highlights);
  const notesByChapter = groupById(notes);
  const quotesByChapter = groupById(quotes);

  const chapterBlocks = chapters.map((chapter) =>
    renderChapter(
      chapter,
      highlightsByChapter.get(chapter.id) ?? [],
      notesByChapter.get(chapter.id) ?? [],
      quotesByChapter.get(chapter.id) ?? [],
    ),
  );

  return [`# ${book.title} - ${book.author}`, '', ...chapterBlocks].join('\n');
}
