/**
 * parser.ts 单元测试
 *
 * 覆盖：
 * - extractBookId: 各种合法 URL 格式、无效 URL、非 WeRead 域名
 * - mapChapterInfoToChapter: 正常映射
 * - mapBookmarkToHighlight: 正常映射、chapterUid 缺失返回 null
 * - mapReviewToNote: 正常映射、chapterUid 缺失返回 null
 */

import { describe, it, expect } from 'vitest';
import {
  extractBookId,
  mapChapterInfoToChapter,
  mapBookmarkToHighlight,
  mapReviewToNote,
} from '@/lib/weread/parser';
import { ValidationError } from '@/lib/utils/errors';
import type { WeReadChapterInfo, WeReadBookmark, WeReadReview } from '@/lib/weread/types';

// ---------- extractBookId ----------

describe('extractBookId', () => {
  it('从 /web/reader/ 路径提取 bookId', () => {
    const url = 'https://weread.qq.com/web/reader/abc123def456';
    expect(extractBookId(url)).toBe('abc123def456');
  });

  it('从 /web/bookDetail/ 路径提取 bookId', () => {
    const url = 'https://weread.qq.com/web/bookDetail/xyz789';
    expect(extractBookId(url)).toBe('xyz789');
  });

  it('忽略 URL 中的查询参数', () => {
    const url = 'https://weread.qq.com/web/reader/bookId123?foo=bar&baz=1';
    expect(extractBookId(url)).toBe('bookId123');
  });

  it('忽略 URL 中的 hash 片段', () => {
    const url = 'https://weread.qq.com/web/reader/bookId456#chapter1';
    expect(extractBookId(url)).toBe('bookId456');
  });

  it('非法 URL 字符串抛出 ValidationError', () => {
    expect(() => extractBookId('not-a-url')).toThrow(ValidationError);
  });

  it('非 weread.qq.com 域名抛出 ValidationError', () => {
    expect(() => extractBookId('https://example.com/web/reader/abc')).toThrow(
      ValidationError,
    );
  });

  it('weread.qq.com 但路径不匹配任何模式时抛出 ValidationError', () => {
    expect(() =>
      extractBookId('https://weread.qq.com/unknown/path'),
    ).toThrow(ValidationError);
  });

  it('空字符串抛出 ValidationError', () => {
    expect(() => extractBookId('')).toThrow(ValidationError);
  });
});

// ---------- mapChapterInfoToChapter ----------

describe('mapChapterInfoToChapter', () => {
  const chapterInfo: WeReadChapterInfo = {
    chapterUid: 42,
    chapterIdx: 3,
    title: '第三章',
    level: 1,
    wordCount: 5000,
  };

  it('正确映射所有字段', () => {
    const result = mapChapterInfoToChapter(chapterInfo, 'book-id-1', 2);
    expect(result).toEqual({
      bookId: 'book-id-1',
      chapterUid: 42,
      title: '第三章',
      level: 1,
      orderIndex: 2,
    });
  });

  it('使用传入的 index 作为 orderIndex', () => {
    const result = mapChapterInfoToChapter(chapterInfo, 'book-id-1', 99);
    expect(result.orderIndex).toBe(99);
  });

  it('返回不可变的新对象（不修改原始数据）', () => {
    const result = mapChapterInfoToChapter(chapterInfo, 'book-id-1', 0);
    expect(result).not.toBe(chapterInfo);
  });
});

// ---------- mapBookmarkToHighlight ----------

describe('mapBookmarkToHighlight', () => {
  const bookmark: WeReadBookmark = {
    bookmarkId: 'bm-001',
    bookId: 'book-001',
    chapterUid: 10,
    markText: '这是一段划线内容',
    range: 'chapter_10_start_100',
    colorStyle: 1,
    createTime: 1700000000,
  };

  const chapterIdMap = new Map<number, string>([[10, 'chapter-internal-id']]);

  it('正确映射到 HighlightCreateInput', () => {
    const result = mapBookmarkToHighlight(bookmark, chapterIdMap);
    expect(result).toEqual({
      chapterId: 'chapter-internal-id',
      text: '这是一段划线内容',
      range: 'chapter_10_start_100',
      colorStyle: 1,
      wereadBookmarkId: 'bm-001',
    });
  });

  it('chapterUid 找不到映射时返回 null', () => {
    const emptyMap = new Map<number, string>();
    expect(mapBookmarkToHighlight(bookmark, emptyMap)).toBeNull();
  });

  it('缺少 range 字段时，range 为 null', () => {
    const bookmarkNoRange: WeReadBookmark = { ...bookmark, range: undefined };
    const result = mapBookmarkToHighlight(bookmarkNoRange, chapterIdMap);
    expect(result?.range).toBeNull();
  });
});

// ---------- mapReviewToNote ----------

describe('mapReviewToNote', () => {
  const review: WeReadReview = {
    reviewId: 'rv-001',
    bookId: 'book-001',
    chapterUid: 20,
    content: '这是一条想法',
    abstract: '被标注的原文摘要',
    createTime: 1700000001,
  };

  const chapterIdMap = new Map<number, string>([[20, 'chapter-internal-id-2']]);

  it('正确映射到 NoteCreateInput', () => {
    const result = mapReviewToNote(review, chapterIdMap);
    expect(result).toEqual({
      chapterId: 'chapter-internal-id-2',
      text: '这是一条想法',
      abstract: '被标注的原文摘要',
      wereadReviewId: 'rv-001',
    });
  });

  it('chapterUid 找不到映射时返回 null', () => {
    const emptyMap = new Map<number, string>();
    expect(mapReviewToNote(review, emptyMap)).toBeNull();
  });

  it('缺少 abstract 字段时，abstract 为 null', () => {
    const reviewNoAbstract: WeReadReview = { ...review, abstract: undefined };
    const result = mapReviewToNote(reviewNoAbstract, chapterIdMap);
    expect(result?.abstract).toBeNull();
  });
});
