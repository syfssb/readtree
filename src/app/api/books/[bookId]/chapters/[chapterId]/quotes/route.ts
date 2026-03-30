/**
 * GET    /api/books/[bookId]/chapters/[chapterId]/quotes — 获取手动引用列表
 * POST   /api/books/[bookId]/chapters/[chapterId]/quotes — 创建手动引用
 * DELETE /api/books/[bookId]/chapters/[chapterId]/quotes — 删除手动引用
 */

import { NextRequest } from 'next/server';
import { manualQuoteSchema } from '@/lib/validators';
import { z } from 'zod';
import * as quoteRepo from '@/repositories/quote.repository';
import { successResponse, handleError } from '@/lib/utils/response';

type RouteParams = { params: Promise<{ bookId: string; chapterId: string }> };

const deleteQuoteSchema = z.object({
  quoteId: z.string().min(1, 'quoteId 不能为空'),
});

// ---------- GET ----------

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { chapterId } = await params;
    const quotes = await quoteRepo.findByChapterId(chapterId);
    return successResponse(quotes);
  } catch (err) {
    return handleError(err);
  }
}

// ---------- POST ----------

export async function POST(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { chapterId } = await params;

    const body = await req.json();
    const { text } = manualQuoteSchema.parse(body);

    const quote = await quoteRepo.create({ chapterId, text });

    return successResponse(quote, 201);
  } catch (err) {
    return handleError(err);
  }
}

// ---------- DELETE ----------

export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    // bookId/chapterId 可供未来权限校验使用，暂时只解析 quoteId
    await params;

    const body = await req.json();
    const { quoteId } = deleteQuoteSchema.parse(body);

    await quoteRepo.deleteById(quoteId);

    return successResponse({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
