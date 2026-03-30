/**
 * GET    /api/books/[bookId] — 书籍详情（含章节及内容计数）
 * DELETE /api/books/[bookId] — 删除书籍
 */

import { NextRequest } from 'next/server';
import * as bookRepo from '@/repositories/book.repository';
import * as chapterRepo from '@/repositories/chapter.repository';
import * as highlightRepo from '@/repositories/highlight.repository';
import * as noteRepo from '@/repositories/note.repository';
import * as quoteRepo from '@/repositories/quote.repository';
import { BookNotFoundError } from '@/lib/utils/errors';
import { successResponse, handleError } from '@/lib/utils/response';
import type { ChapterWithContent } from '@/types/chapter';

type RouteParams = { params: Promise<{ bookId: string }> };

// ---------- GET /api/books/[bookId] ----------

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { bookId } = await params;

    const book = await bookRepo.findById(bookId);
    if (!book) throw new BookNotFoundError(bookId);

    const chapters = await chapterRepo.findByBookId(bookId);

    // 并行获取所有章节的内容计数
    const chaptersWithCount: ChapterWithContent[] = await Promise.all(
      chapters.map(async (chapter) => {
        const [highlightCount, noteCount, quoteCount] = await Promise.all([
          highlightRepo.countByChapterId(chapter.id),
          noteRepo.countByChapterId(chapter.id),
          quoteRepo.countByChapterId(chapter.id),
        ]);
        return { ...chapter, highlightCount, noteCount, quoteCount };
      }),
    );

    return successResponse({ book, chapters: chaptersWithCount });
  } catch (err) {
    return handleError(err);
  }
}

// ---------- DELETE /api/books/[bookId] ----------

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { bookId } = await params;

    const book = await bookRepo.findById(bookId);
    if (!book) throw new BookNotFoundError(bookId);

    await bookRepo.deleteById(bookId);

    return successResponse({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
