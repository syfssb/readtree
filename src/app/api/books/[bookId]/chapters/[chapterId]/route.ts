/**
 * GET /api/books/[bookId]/chapters/[chapterId] — 获取章节详情 + 划线 + 笔记
 */

import { NextRequest } from 'next/server';
import { successResponse, handleError, errorResponse } from '@/lib/utils/response';
import * as chapterRepo from '@/repositories/chapter.repository';
import * as highlightRepo from '@/repositories/highlight.repository';
import * as noteRepo from '@/repositories/note.repository';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> },
): Promise<Response> {
  try {
    const { chapterId } = await params;

    const chapter = await chapterRepo.findById(chapterId);
    if (!chapter) {
      return errorResponse('NOT_FOUND', '章节不存在', 404);
    }

    const [highlights, notes] = await Promise.all([
      highlightRepo.findByChapterId(chapterId),
      noteRepo.findByChapterId(chapterId),
    ]);

    return successResponse({ chapter, highlights, notes });
  } catch (err) {
    return handleError(err);
  }
}
