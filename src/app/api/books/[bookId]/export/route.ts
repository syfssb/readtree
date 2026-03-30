/**
 * GET /api/books/[bookId]/export — 导出书籍 Markdown
 */

import { NextRequest } from 'next/server';
import * as bookRepo from '@/repositories/book.repository';
import * as chapterRepo from '@/repositories/chapter.repository';
import * as highlightRepo from '@/repositories/highlight.repository';
import * as noteRepo from '@/repositories/note.repository';
import * as quoteRepo from '@/repositories/quote.repository';
import { BookNotFoundError } from '@/lib/utils/errors';
import { handleError } from '@/lib/utils/response';
import { generateMarkdown } from '@/lib/utils/markdown';
import type { Highlight } from '@/types/highlight';
import type { Note } from '@/types/note';
import type { ManualQuote } from '@/types/api';

type RouteParams = { params: Promise<{ bookId: string }> };

/** 并行获取书籍所有章节的 highlights、notes、quotes */
async function fetchAllContent(chapterIds: string[]): Promise<{
  highlights: Highlight[];
  notes: Note[];
  quotes: ManualQuote[];
}> {
  const [highlightArrays, noteArrays, quoteArrays] = await Promise.all([
    Promise.all(chapterIds.map((id) => highlightRepo.findByChapterId(id))),
    Promise.all(chapterIds.map((id) => noteRepo.findByChapterId(id))),
    Promise.all(chapterIds.map((id) => quoteRepo.findByChapterId(id))),
  ]);

  return {
    highlights: highlightArrays.flat(),
    notes: noteArrays.flat(),
    quotes: quoteArrays.flat(),
  };
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { bookId } = await params;

    const book = await bookRepo.findById(bookId);
    if (!book) throw new BookNotFoundError(bookId);

    const chapters = await chapterRepo.findByBookId(bookId);
    const chapterIds = chapters.map((ch) => ch.id);

    const { highlights, notes, quotes } = await fetchAllContent(chapterIds);

    const markdown = generateMarkdown(book, chapters, highlights, notes, quotes);

    const filename = encodeURIComponent(`${book.title}.md`);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
