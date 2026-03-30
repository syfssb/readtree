/**
 * Chapter Repository 单元测试
 * 使用内存 SQLite 数据库隔离测试环境
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

vi.mock('@/lib/db', () => ({ getDb: vi.fn() }));

import { getDb } from '@/lib/db';
import * as bookRepo from '@/repositories/book.repository';
import * as chapterRepo from '@/repositories/chapter.repository';

// ----------------------------------------------------------------
// 建表 SQL
// ----------------------------------------------------------------
const CREATE_BOOKS_SQL = `
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT,
    weread_book_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const CREATE_CHAPTERS_SQL = `
  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_uid INTEGER NOT NULL,
    title TEXT NOT NULL,
    level INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(CREATE_BOOKS_SQL);
  sqlite.exec(CREATE_CHAPTERS_SQL);
  return drizzle(sqlite, { schema });
}

// ----------------------------------------------------------------
// 测试辅助：创建一本书用于外键关联
// ----------------------------------------------------------------
async function seedBook(suffix = '1') {
  return bookRepo.create({
    title: `书${suffix}`,
    author: `作者${suffix}`,
    wereadBookId: `wid-${suffix}`,
  });
}

// ----------------------------------------------------------------
// 测试
// ----------------------------------------------------------------
describe('chapterRepository', () => {
  beforeEach(() => {
    const db = createTestDb();
    vi.mocked(getDb).mockReturnValue(db as ReturnType<typeof getDb>);
  });

  describe('findByBookId', () => {
    it('空数据库时返回空数组', async () => {
      const book = await seedBook();
      const result = await chapterRepo.findByBookId(book.id);
      expect(result).toEqual([]);
    });

    it('返回指定书籍的章节，按 orderIndex 升序', async () => {
      const book = await seedBook();
      await chapterRepo.createMany([
        { bookId: book.id, chapterUid: 3, title: '第三章', level: 1, orderIndex: 3 },
        { bookId: book.id, chapterUid: 1, title: '第一章', level: 1, orderIndex: 1 },
        { bookId: book.id, chapterUid: 2, title: '第二章', level: 1, orderIndex: 2 },
      ]);

      const result = await chapterRepo.findByBookId(book.id);
      expect(result).toHaveLength(3);
      expect(result.map((c) => c.orderIndex)).toEqual([1, 2, 3]);
    });

    it('不返回其他书籍的章节', async () => {
      const bookA = await seedBook('A');
      const bookB = await seedBook('B');

      await chapterRepo.createMany([
        { bookId: bookA.id, chapterUid: 1, title: 'A章节', level: 1, orderIndex: 1 },
      ]);
      await chapterRepo.createMany([
        { bookId: bookB.id, chapterUid: 1, title: 'B章节', level: 1, orderIndex: 1 },
      ]);

      const resultA = await chapterRepo.findByBookId(bookA.id);
      expect(resultA).toHaveLength(1);
      expect(resultA[0].title).toBe('A章节');
    });
  });

  describe('findById', () => {
    it('存在时返回对应章节', async () => {
      const book = await seedBook();
      const [chapter] = await chapterRepo.createMany([
        { bookId: book.id, chapterUid: 1, title: '目标章节', level: 1, orderIndex: 1 },
      ]);

      const found = await chapterRepo.findById(chapter.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('目标章节');
    });

    it('不存在时返回 null', async () => {
      const result = await chapterRepo.findById('no-such-id');
      expect(result).toBeNull();
    });
  });

  describe('createMany', () => {
    it('空数组时返回空数组', async () => {
      const result = await chapterRepo.createMany([]);
      expect(result).toEqual([]);
    });

    it('批量插入并返回所有记录', async () => {
      const book = await seedBook();
      const inputs = [
        { bookId: book.id, chapterUid: 1, title: '第一章', level: 1, orderIndex: 1 },
        { bookId: book.id, chapterUid: 2, title: '第二章', level: 2, orderIndex: 2 },
      ];

      const result = await chapterRepo.createMany(inputs);
      expect(result).toHaveLength(2);
      result.forEach((c) => {
        expect(c.id).toBeDefined();
        expect(c.bookId).toBe(book.id);
        expect(c.createdAt).toBeDefined();
        expect(c.updatedAt).toBeDefined();
      });
    });

    it('为每个章节生成唯一 id', async () => {
      const book = await seedBook();
      const result = await chapterRepo.createMany([
        { bookId: book.id, chapterUid: 1, title: 'C1', level: 1, orderIndex: 1 },
        { bookId: book.id, chapterUid: 2, title: 'C2', level: 1, orderIndex: 2 },
      ]);
      expect(result[0].id).not.toBe(result[1].id);
    });
  });

  describe('updateSummary', () => {
    it('更新摘要并返回最新记录', async () => {
      const book = await seedBook();
      const [chapter] = await chapterRepo.createMany([
        { bookId: book.id, chapterUid: 1, title: '章节', level: 1, orderIndex: 1 },
      ]);

      const originalUpdatedAt = chapter.updatedAt;
      // 确保时间戳有变化
      await new Promise((r) => setTimeout(r, 5));

      const updated = await chapterRepo.updateSummary(chapter.id, '这是摘要');
      expect(updated.summary).toBe('这是摘要');
      expect(updated.id).toBe(chapter.id);
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('不存在的 id 时抛出错误', async () => {
      await expect(chapterRepo.updateSummary('ghost-id', '摘要')).rejects.toThrow();
    });
  });

  describe('deleteByBookId', () => {
    it('删除指定书籍的所有章节', async () => {
      const book = await seedBook();
      await chapterRepo.createMany([
        { bookId: book.id, chapterUid: 1, title: 'C1', level: 1, orderIndex: 1 },
        { bookId: book.id, chapterUid: 2, title: 'C2', level: 1, orderIndex: 2 },
      ]);

      await chapterRepo.deleteByBookId(book.id);

      const result = await chapterRepo.findByBookId(book.id);
      expect(result).toEqual([]);
    });

    it('只删除目标书籍的章节，不影响其他书', async () => {
      const bookA = await seedBook('A');
      const bookB = await seedBook('B');

      await chapterRepo.createMany([
        { bookId: bookA.id, chapterUid: 1, title: 'A章节', level: 1, orderIndex: 1 },
      ]);
      await chapterRepo.createMany([
        { bookId: bookB.id, chapterUid: 1, title: 'B章节', level: 1, orderIndex: 1 },
      ]);

      await chapterRepo.deleteByBookId(bookA.id);

      expect(await chapterRepo.findByBookId(bookA.id)).toHaveLength(0);
      expect(await chapterRepo.findByBookId(bookB.id)).toHaveLength(1);
    });
  });
});
