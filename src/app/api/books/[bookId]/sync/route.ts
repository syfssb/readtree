/**
 * POST /api/books/[bookId]/sync — 同步划线和笔记
 */

import { NextRequest } from 'next/server';
import { WeReadClient } from '@/lib/weread/client';
import { mapBookmarkToHighlight, mapReviewToNote } from '@/lib/weread/parser';
import * as bookRepo from '@/repositories/book.repository';
import * as chapterRepo from '@/repositories/chapter.repository';
import * as highlightRepo from '@/repositories/highlight.repository';
import * as noteRepo from '@/repositories/note.repository';
import * as configRepo from '@/repositories/config.repository';
import { BookNotFoundError } from '@/lib/utils/errors';
import { successResponse, errorResponse, handleError } from '@/lib/utils/response';
import type { HighlightCreateInput } from '@/types/highlight';
import type { NoteCreateInput } from '@/types/note';

type RouteParams = { params: Promise<{ bookId: string }> };

/** 构建 chapterUid → chapterId 的映射 */
async function buildChapterMap(bookId: string): Promise<Map<number, string>> {
  const chapters = await chapterRepo.findByBookId(bookId);
  return chapters.reduce((map, ch) => {
    map.set(ch.chapterUid, ch.id);
    return map;
  }, new Map<number, string>());
}

export async function POST(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { bookId } = await params;

    const book = await bookRepo.findById(bookId);
    if (!book) throw new BookNotFoundError(bookId);

    const config = await configRepo.getConfig();
    if (!config) {
      return errorResponse('CONFIG_NOT_FOUND', '请先配置微信读书 Cookie', 400);
    }

    const client = new WeReadClient(config.wereadCookie);
    const chapterIdMap = await buildChapterMap(bookId);

    // 并行拉取划线和笔记
    const [bookmarkResp, reviewResp] = await Promise.all([
      client.getBookmarks(book.wereadBookId),
      client.getReviews(book.wereadBookId),
    ]);

    // 转换 + 过滤 null
    const highlights = bookmarkResp.updated
      .map((bm) => mapBookmarkToHighlight(bm, chapterIdMap))
      .filter((h): h is HighlightCreateInput => h !== null);

    const notes = reviewResp.reviews
      .map((rv) => mapReviewToNote(rv, chapterIdMap))
      .filter((n): n is NoteCreateInput => n !== null);

    // 批量 upsert
    await Promise.all([
      highlightRepo.upsertMany(highlights),
      noteRepo.upsertMany(notes),
    ]);

    return successResponse({
      highlightsCount: highlights.length,
      notesCount: notes.length,
    });
  } catch (err) {
    return handleError(err);
  }
}
