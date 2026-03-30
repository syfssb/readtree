/**
 * WeReadClient — 微信读书 API 客户端
 *
 * 封装所有对 i.weread.qq.com 的 HTTP 请求，统一处理：
 * - 请求头注入（Cookie / User-Agent）
 * - 限流（令牌桶）
 * - Cookie 过期检测（errCode -2012 / -2010）
 * - 非 2xx 响应错误抛出
 */

import type {
  WeReadBookInfo,
  WeReadChapterResponse,
  WeReadBookmarkResponse,
  WeReadReviewResponse,
} from './types';
import { RateLimiter } from './rate-limiter';
import { CookieExpiredError, WeReadApiError } from '@/lib/utils/errors';

const BASE_URL = 'https://i.weread.qq.com';

/** WeRead API 响应中可能携带的错误码 */
const COOKIE_EXPIRED_CODES = new Set([-2012, -2010]);

/** 模拟真实浏览器的 User-Agent */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

/** API 响应基础结构（errCode 字段） */
interface WeReadBaseResponse {
  errCode?: number;
}

export class WeReadClient {
  private readonly cookie: string;
  private readonly rateLimiter: RateLimiter;

  constructor(cookie: string) {
    this.cookie = cookie;
    this.rateLimiter = new RateLimiter();
  }

  // ---------- 私有辅助方法 ----------

  /** 构造通用请求头 */
  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Cookie: this.cookie,
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      ...extra,
    };
  }

  /**
   * 通用 fetch 封装：限流 → 发请求 → 检测 Cookie 过期 → 返回 JSON
   *
   * @throws {CookieExpiredError} errCode 为 -2012 或 -2010
   * @throws {WeReadApiError}     HTTP 非 2xx 或其他 API 错误
   */
  private async request<T>(
    url: string,
    init?: RequestInit,
  ): Promise<T> {
    await this.rateLimiter.acquire();

    const response = await fetch(url, {
      ...init,
      headers: {
        ...this.buildHeaders(),
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      throw new WeReadApiError(
        `WeRead API 请求失败：${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as T & WeReadBaseResponse;

    if (data.errCode !== undefined && COOKIE_EXPIRED_CODES.has(data.errCode)) {
      throw new CookieExpiredError();
    }

    return data;
  }

  // ---------- 公开 API 方法 ----------

  /** 获取书籍基础信息 */
  async getBookInfo(bookId: string): Promise<WeReadBookInfo> {
    const url = `${BASE_URL}/book/info?bookId=${encodeURIComponent(bookId)}`;
    return this.request<WeReadBookInfo>(url);
  }

  /** 获取书籍章节列表 */
  async getChapters(bookId: string): Promise<WeReadChapterResponse> {
    const url = `${BASE_URL}/book/chapterInfos`;
    return this.request<WeReadChapterResponse>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds: [bookId], synckeys: [0] }),
    });
  }

  /** 获取书籍划线列表 */
  async getBookmarks(bookId: string): Promise<WeReadBookmarkResponse> {
    const url = `${BASE_URL}/book/bookmarklist?bookId=${encodeURIComponent(bookId)}`;
    return this.request<WeReadBookmarkResponse>(url);
  }

  /** 获取书籍想法（评论）列表 */
  async getReviews(bookId: string): Promise<WeReadReviewResponse> {
    const url =
      `${BASE_URL}/review/list?bookId=${encodeURIComponent(bookId)}` +
      `&listType=11&mine=1&synckey=0`;
    return this.request<WeReadReviewResponse>(url);
  }
}
