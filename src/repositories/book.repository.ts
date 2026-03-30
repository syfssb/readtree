/**
 * Book Repository
 * 负责 books 表的所有数据访问操作
 */
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { books } from '@/lib/db/schema';
import type { Book, BookCreateInput } from '@/types/book';

/** 查询所有书籍，按创建时间倒序 */
export async function findAll(): Promise<Book[]> {
  return getDb().select().from(books) as Promise<Book[]>;
}

/** 按主键查询书籍，不存在返回 null */
export async function findById(id: string): Promise<Book | null> {
  const rows = await getDb().select().from(books).where(eq(books.id, id));
  return (rows[0] ?? null) as Book | null;
}

/** 按微信读书 bookId 查询，不存在返回 null */
export async function findByWereadId(wereadBookId: string): Promise<Book | null> {
  const rows = await getDb()
    .select()
    .from(books)
    .where(eq(books.wereadBookId, wereadBookId));
  return (rows[0] ?? null) as Book | null;
}

/** 创建书籍，自动生成 nanoid 主键 */
export async function create(data: BookCreateInput): Promise<Book> {
  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(books)
    .values({
      id: nanoid(),
      title: data.title,
      author: data.author,
      coverUrl: data.coverUrl ?? null,
      wereadBookId: data.wereadBookId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return rows[0] as Book;
}

/** 按主键删除书籍（级联删除关联数据） */
export async function deleteById(id: string): Promise<void> {
  await getDb().delete(books).where(eq(books.id, id));
}
