/**
 * Highlight Repository
 * 负责 highlights 表的所有数据访问操作
 */
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { highlights, chapters } from '@/lib/db/schema';
import type { Highlight, HighlightCreateInput } from '@/types/highlight';

/** 查询某章节的所有划线 */
export async function findByChapterId(chapterId: string): Promise<Highlight[]> {
  return getDb()
    .select()
    .from(highlights)
    .where(eq(highlights.chapterId, chapterId)) as Promise<Highlight[]>;
}

/** 查询某本书的所有划线（通过 JOIN chapters 表） */
export async function findByBookId(bookId: string): Promise<Highlight[]> {
  const rows = await getDb()
    .select({
      id: highlights.id,
      chapterId: highlights.chapterId,
      text: highlights.text,
      range: highlights.range,
      colorStyle: highlights.colorStyle,
      wereadBookmarkId: highlights.wereadBookmarkId,
      createdAt: highlights.createdAt,
    })
    .from(highlights)
    .innerJoin(chapters, eq(highlights.chapterId, chapters.id))
    .where(eq(chapters.bookId, bookId));
  return rows as Highlight[];
}

/**
 * 批量 upsert 划线
 * 基于 wereadBookmarkId 去重，冲突时忽略（保留已有数据）
 */
export async function upsertMany(inputs: HighlightCreateInput[]): Promise<void> {
  if (inputs.length === 0) return;

  const now = new Date().toISOString();
  await getDb()
    .insert(highlights)
    .values(
      inputs.map((input) => ({
        id: nanoid(),
        chapterId: input.chapterId,
        text: input.text,
        range: input.range ?? null,
        colorStyle: input.colorStyle,
        wereadBookmarkId: input.wereadBookmarkId,
        createdAt: now,
      }))
    )
    .onConflictDoNothing();
}

/** 统计某章节的划线数量 */
export async function countByChapterId(chapterId: string): Promise<number> {
  const rows = await getDb()
    .select({ count: count() })
    .from(highlights)
    .where(eq(highlights.chapterId, chapterId));
  return rows[0]?.count ?? 0;
}
