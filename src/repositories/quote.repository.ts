/**
 * Quote Repository
 * 负责 manual_quotes 表的所有数据访问操作
 */
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { manualQuotes } from '@/lib/db/schema';
import type { ManualQuote, ManualQuoteCreateInput } from '@/types/api';

/** 查询某章节的所有手动引用 */
export async function findByChapterId(chapterId: string): Promise<ManualQuote[]> {
  return getDb()
    .select()
    .from(manualQuotes)
    .where(eq(manualQuotes.chapterId, chapterId)) as Promise<ManualQuote[]>;
}

/** 创建手动引用，自动生成 nanoid 主键 */
export async function create(data: ManualQuoteCreateInput): Promise<ManualQuote> {
  const rows = await getDb()
    .insert(manualQuotes)
    .values({
      id: nanoid(),
      chapterId: data.chapterId,
      text: data.text,
      createdAt: new Date().toISOString(),
    })
    .returning();
  return rows[0] as ManualQuote;
}

/** 按主键删除手动引用 */
export async function deleteById(id: string): Promise<void> {
  await getDb().delete(manualQuotes).where(eq(manualQuotes.id, id));
}

/** 统计某章节的手动引用数量 */
export async function countByChapterId(chapterId: string): Promise<number> {
  const rows = await getDb()
    .select({ count: count() })
    .from(manualQuotes)
    .where(eq(manualQuotes.chapterId, chapterId));
  return rows[0]?.count ?? 0;
}
