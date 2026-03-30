/**
 * PUT /api/books/[bookId]/chapters/[chapterId]/summary — 更新章节总结
 */

import { NextRequest } from 'next/server';
import { summaryUpdateSchema } from '@/lib/validators';
import * as chapterRepo from '@/repositories/chapter.repository';
import { successResponse, handleError } from '@/lib/utils/response';

type RouteParams = { params: Promise<{ bookId: string; chapterId: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { chapterId } = await params;

    const body = await req.json();
    const { summary } = summaryUpdateSchema.parse(body);

    const chapter = await chapterRepo.updateSummary(chapterId, summary);

    return successResponse(chapter);
  } catch (err) {
    return handleError(err);
  }
}
