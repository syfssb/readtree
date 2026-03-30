/**
 * Book Repository 单元测试
 * 使用内存 SQLite 数据库隔离测试环境
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

// --- Mock getDb() 必须在 import repository 之前 ---
vi.mock('@/lib/db', () => ({ getDb: vi.fn() }));

import { getDb } from '@/lib/db';
import * as bookRepo from '@/repositories/book.repository';

// ----------------------------------------------------------------
// 辅助：建表 SQL
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

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(CREATE_BOOKS_SQL);
  return drizzle(sqlite, { schema });
}

// ----------------------------------------------------------------
// 测试
// ----------------------------------------------------------------
describe('bookRepository', () => {
  beforeEach(() => {
    const db = createTestDb();
    vi.mocked(getDb).mockReturnValue(db as ReturnType<typeof getDb>);
  });

  describe('findAll', () => {
    it('空数据库时返回空数组', async () => {
      const result = await bookRepo.findAll();
      expect(result).toEqual([]);
    });

    it('返回所有已插入的书籍', async () => {
      await bookRepo.create({ title: '书A', author: '作者A', wereadBookId: 'wid-a' });
      await bookRepo.create({ title: '书B', author: '作者B', wereadBookId: 'wid-b' });

      const result = await bookRepo.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('存在时返回对应书籍', async () => {
      const created = await bookRepo.create({
        title: '测试书',
        author: '作者',
        wereadBookId: 'wid-1',
      });

      const found = await bookRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('测试书');
      expect(found!.id).toBe(created.id);
    });

    it('不存在时返回 null', async () => {
      const result = await bookRepo.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByWereadId', () => {
    it('存在时返回对应书籍', async () => {
      await bookRepo.create({ title: '测试书', author: '作者', wereadBookId: 'wid-x' });

      const found = await bookRepo.findByWereadId('wid-x');
      expect(found).not.toBeNull();
      expect(found!.wereadBookId).toBe('wid-x');
    });

    it('不存在时返回 null', async () => {
      const result = await bookRepo.findByWereadId('non-existent-wid');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('插入书籍并返回完整记录', async () => {
      const input = {
        title: '新书',
        author: '新作者',
        coverUrl: 'https://example.com/cover.jpg',
        wereadBookId: 'wid-new',
      };

      const result = await bookRepo.create(input);

      expect(result.id).toBeDefined();
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.title).toBe('新书');
      expect(result.author).toBe('新作者');
      expect(result.coverUrl).toBe('https://example.com/cover.jpg');
      expect(result.wereadBookId).toBe('wid-new');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('coverUrl 可为 null', async () => {
      const result = await bookRepo.create({
        title: '无封面书',
        author: '作者',
        wereadBookId: 'wid-nocover',
      });
      expect(result.coverUrl).toBeNull();
    });

    it('为每本书生成不同的 id', async () => {
      const a = await bookRepo.create({ title: 'A', author: 'A', wereadBookId: 'wa' });
      const b = await bookRepo.create({ title: 'B', author: 'B', wereadBookId: 'wb' });
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('deleteById', () => {
    it('删除存在的书籍后无法查到', async () => {
      const book = await bookRepo.create({ title: '待删', author: '作者', wereadBookId: 'wid-del' });

      await bookRepo.deleteById(book.id);

      const result = await bookRepo.findById(book.id);
      expect(result).toBeNull();
    });

    it('删除不存在的 id 不报错', async () => {
      await expect(bookRepo.deleteById('ghost-id')).resolves.toBeUndefined();
    });

    it('删除后 findAll 数量减少', async () => {
      const b1 = await bookRepo.create({ title: '书1', author: 'A', wereadBookId: 'w1' });
      await bookRepo.create({ title: '书2', author: 'B', wereadBookId: 'w2' });

      await bookRepo.deleteById(b1.id);

      const all = await bookRepo.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].wereadBookId).toBe('w2');
    });
  });
});
