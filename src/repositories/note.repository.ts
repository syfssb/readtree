/**
 * Note Repository
 * 负责 notes 表的所有数据访问操作
 */
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import type { Note, NoteCreateInput } from '@/types/note';

/** 查询某章节的所有笔记 */
export async function findByChapterId(chapterId: string): Promise<Note[]> {
  return getDb()
    .select()
    .from(notes)
    .where(eq(notes.chapterId, chapterId)) as Promise<Note[]>;
}

/**
 * 批量 upsert 笔记
 * 基于 wereadReviewId 去重，冲突时忽略（保留已有数据）
 */
export async function upsertMany(inputs: NoteCreateInput[]): Promise<void> {
  if (inputs.length === 0) return;

  const now = new Date().toISOString();
  await getDb()
    .insert(notes)
    .values(
      inputs.map((input) => ({
        id: nanoid(),
        chapterId: input.chapterId,
        text: input.text,
        abstract: input.abstract ?? null,
        wereadReviewId: input.wereadReviewId,
        createdAt: now,
      }))
    )
    .onConflictDoNothing();
}

/** 统计某章节的笔记数量 */
export async function countByChapterId(chapterId: string): Promise<number> {
  const rows = await getDb()
    .select({ count: count() })
    .from(notes)
    .where(eq(notes.chapterId, chapterId));
  return rows[0]?.count ?? 0;
}
