/**
 * POST /api/books — 添加书籍
 * GET  /api/books — 书架列表
 */

import { NextRequest } from 'next/server';
import { addBookSchema } from '@/lib/validators';
import { extractBookId, mapChapterInfoToChapter } from '@/lib/weread/parser';
import { WeReadClient } from '@/lib/weread/client';
import * as bookRepo from '@/repositories/book.repository';
import * as chapterRepo from '@/repositories/chapter.repository';
import * as configRepo from '@/repositories/config.repository';
import { ValidationError } from '@/lib/utils/errors';
import { successResponse, errorResponse, handleError } from '@/lib/utils/response';

// ---------- GET /api/books ----------

export async function GET(): Promise<Response> {
  try {
    const books = await bookRepo.findAll();
    return successResponse(books);
  } catch (err) {
    return handleError(err);
  }
}

// ---------- POST /api/books ----------

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { url } = addBookSchema.parse(body);

    const bookId = extractBookId(url);

    // 防止重复添加
    const existing = await bookRepo.findByWereadId(bookId);
    if (existing) {
      return errorResponse('BOOK_ALREADY_EXISTS', '该书籍已添加', 409);
    }

    // 获取 Cookie
    const config = await configRepo.getConfig();
    if (!config) {
      return errorResponse('CONFIG_NOT_FOUND', '请先配置微信读书 Cookie', 400);
    }

    const client = new WeReadClient(config.wereadCookie);

    // 并行获取书籍信息和章节
    const [bookInfo, chaptersResp] = await Promise.all([
      client.getBookInfo(bookId),
      client.getChapters(bookId),
    ]);

    // 入库书籍
    const book = await bookRepo.create({
      title: bookInfo.title,
      author: bookInfo.author,
      coverUrl: bookInfo.cover ?? null,
      wereadBookId: bookId,
    });

    // 提取章节列表（取第一个 book 的数据）
    const chapterInfos = chaptersResp.data[0]?.updated ?? [];
    const chapterInputs = chapterInfos.map((info, index) =>
      mapChapterInfoToChapter(info, book.id, index),
    );

    const chapters = await chapterRepo.createMany(chapterInputs);

    return successResponse({ book, chapters }, 201);
  } catch (err) {
    return handleError(err);
  }
}
