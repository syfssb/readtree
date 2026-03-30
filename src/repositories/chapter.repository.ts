/**
 * Chapter Repository
 * 负责 chapters 表的所有数据访问操作
 */
import { eq, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { chapters } from '@/lib/db/schema';
import type { Chapter, ChapterCreateInput } from '@/types/chapter';

/** 查询某本书的所有章节，按 orderIndex 升序 */
export async function findByBookId(bookId: string): Promise<Chapter[]> {
  return getDb()
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(asc(chapters.orderIndex)) as Promise<Chapter[]>;
}

/** 按主键查询章节，不存在返回 null */
export async function findById(id: string): Promise<Chapter | null> {
  const rows = await getDb()
    .select()
    .from(chapters)
    .where(eq(chapters.id, id));
  return (rows[0] ?? null) as Chapter | null;
}

/** 批量创建章节，自动为每条记录生成 nanoid 主键 */
export async function createMany(inputs: ChapterCreateInput[]): Promise<Chapter[]> {
  if (inputs.length === 0) return [];

  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(chapters)
    .values(
      inputs.map((input) => ({
        id: nanoid(),
        bookId: input.bookId,
        chapterUid: input.chapterUid,
        title: input.title,
        level: input.level,
        orderIndex: input.orderIndex,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .returning();
  return rows as Chapter[];
}

/** 更新章节摘要，同时刷新 updatedAt */
export async function updateSummary(id: string, summary: string): Promise<Chapter> {
  const rows = await getDb()
    .update(chapters)
    .set({ summary, updatedAt: new Date().toISOString() })
    .where(eq(chapters.id, id))
    .returning();

  if (rows.length === 0) {
    throw new Error(`Chapter not found: ${id}`);
  }
  return rows[0] as Chapter;
}

/** 删除某本书的所有章节 */
export async function deleteByBookId(bookId: string): Promise<void> {
  await getDb().delete(chapters).where(eq(chapters.bookId, bookId));
}
