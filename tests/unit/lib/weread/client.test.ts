/**
 * WeReadClient 单元测试
 *
 * 通过 vi.stubGlobal 模拟 global fetch，避免真实网络请求。
 *
 * 覆盖：
 * - getBookInfo: 正常返回、Cookie 过期
 * - getChapters: POST 请求体构造、Cookie 过期
 * - getBookmarks: 正常返回
 * - getReviews: 正常返回
 * - HTTP 非 2xx 时抛出 WeReadApiError
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeReadClient } from '@/lib/weread/client';
import { CookieExpiredError, WeReadApiError } from '@/lib/utils/errors';

// ---------- 工具函数 ----------

/** 构造成功的 fetch Response mock */
function mockFetchSuccess(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(body),
    }),
  );
}

/** 构造 HTTP 错误的 fetch Response mock */
function mockFetchHttpError(status: number, statusText: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText,
      json: () => Promise.resolve({}),
    }),
  );
}

// ---------- 测试套件 ----------

describe('WeReadClient', () => {
  const COOKIE = 'test-cookie-value';
  let client: WeReadClient;

  beforeEach(() => {
    // 每个测试前替换 RateLimiter，使 acquire() 立即返回
    client = new WeReadClient(COOKIE);
    // 用 spy 跳过真实限流等待
    vi.spyOn(
      (client as unknown as { rateLimiter: { acquire: () => Promise<void> } })
        .rateLimiter,
      'acquire',
    ).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ---------- getBookInfo ----------

  describe('getBookInfo', () => {
    it('正常返回书籍信息', async () => {
      const bookInfo = {
        bookId: 'book-001',
        title: '深度学习',
        author: 'Ian Goodfellow',
        cover: 'https://cover.url/img.jpg',
      };
      mockFetchSuccess(bookInfo);

      const result = await client.getBookInfo('book-001');
      expect(result).toEqual(bookInfo);
    });

    it('请求 URL 包含正确的 bookId', async () => {
      mockFetchSuccess({ bookId: 'book-001', title: 'test', author: 'test', cover: '' });

      await client.getBookInfo('book-001');

      const fetchMock = vi.mocked(fetch);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('bookId=book-001');
    });

    it('请求头包含 Cookie', async () => {
      mockFetchSuccess({ bookId: 'b1', title: 't', author: 'a', cover: '' });

      await client.getBookInfo('b1');

      const fetchMock = vi.mocked(fetch);
      const calledInit = fetchMock.mock.calls[0][1] as RequestInit;
      expect((calledInit.headers as Record<string, string>)['Cookie']).toBe(COOKIE);
    });

    it('errCode -2012 时抛出 CookieExpiredError', async () => {
      mockFetchSuccess({ errCode: -2012 });
      await expect(client.getBookInfo('book-001')).rejects.toThrow(CookieExpiredError);
    });

    it('errCode -2010 时抛出 CookieExpiredError', async () => {
      mockFetchSuccess({ errCode: -2010 });
      await expect(client.getBookInfo('book-001')).rejects.toThrow(CookieExpiredError);
    });

    it('HTTP 500 时抛出 WeReadApiError', async () => {
      mockFetchHttpError(500, 'Internal Server Error');
      await expect(client.getBookInfo('book-001')).rejects.toThrow(WeReadApiError);
    });
  });

  // ---------- getChapters ----------

  describe('getChapters', () => {
    it('使用 POST 方法', async () => {
      mockFetchSuccess({ data: [] });

      await client.getChapters('book-002');

      const fetchMock = vi.mocked(fetch);
      const calledInit = fetchMock.mock.calls[0][1] as RequestInit;
      expect(calledInit.method).toBe('POST');
    });

    it('请求体包含 bookId 和 synckeys', async () => {
      mockFetchSuccess({ data: [] });

      await client.getChapters('book-002');

      const fetchMock = vi.mocked(fetch);
      const calledInit = fetchMock.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(calledInit.body as string);
      expect(body).toEqual({ bookIds: ['book-002'], synckeys: [0] });
    });

    it('正常返回章节数据', async () => {
      const chaptersResp = {
        data: [
          {
            book: { bookId: 'book-002' },
            updated: [{ chapterUid: 1, chapterIdx: 0, title: '第一章', level: 1 }],
          },
        ],
      };
      mockFetchSuccess(chaptersResp);

      const result = await client.getChapters('book-002');
      expect(result.data).toHaveLength(1);
    });

    it('errCode -2012 时抛出 CookieExpiredError', async () => {
      mockFetchSuccess({ errCode: -2012, data: [] });
      await expect(client.getChapters('book-002')).rejects.toThrow(CookieExpiredError);
    });
  });

  // ---------- getBookmarks ----------

  describe('getBookmarks', () => {
    it('正常返回划线数据', async () => {
      const bookmarksResp = {
        updated: [
          {
            bookmarkId: 'bm-1',
            bookId: 'book-003',
            chapterUid: 5,
            markText: '划线内容',
            colorStyle: 1,
            createTime: 1700000000,
          },
        ],
        chapters: [],
        book: { author: '作者', title: '书名', cover: 'cover.jpg' },
      };
      mockFetchSuccess(bookmarksResp);

      const result = await client.getBookmarks('book-003');
      expect(result.updated).toHaveLength(1);
      expect(result.updated[0].markText).toBe('划线内容');
    });

    it('请求 URL 包含正确的 bookId', async () => {
      mockFetchSuccess({ updated: [], chapters: [], book: { author: '', title: '', cover: '' } });

      await client.getBookmarks('book-003');

      const fetchMock = vi.mocked(fetch);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('bookId=book-003');
    });
  });

  // ---------- getReviews ----------

  describe('getReviews', () => {
    it('正常返回想法数据', async () => {
      const reviewsResp = {
        reviews: [
          {
            reviewId: 'rv-1',
            bookId: 'book-004',
            chapterUid: 7,
            content: '这是想法',
            createTime: 1700000002,
          },
        ],
        totalCount: 1,
      };
      mockFetchSuccess(reviewsResp);

      const result = await client.getReviews('book-004');
      expect(result.reviews).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('请求 URL 包含 listType=11 和 mine=1', async () => {
      mockFetchSuccess({ reviews: [], totalCount: 0 });

      await client.getReviews('book-004');

      const fetchMock = vi.mocked(fetch);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('listType=11');
      expect(calledUrl).toContain('mine=1');
    });

    it('HTTP 403 时抛出 WeReadApiError', async () => {
      mockFetchHttpError(403, 'Forbidden');
      await expect(client.getReviews('book-004')).rejects.toThrow(WeReadApiError);
    });
  });
});
