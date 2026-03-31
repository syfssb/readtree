/**
 * WeRead 数据解析与转换层
 *
 * - extractBookId: 从 URL 提取 bookId
 * - mapChapterInfoToChapter: WeReadChapterInfo → ChapterCreateInput
 * - mapBookmarkToHighlight: WeReadBookmark → HighlightCreateInput | null
 * - mapReviewToNote: WeReadReview → NoteCreateInput | null
 *
 * 所有转换函数均为纯函数，不产生副作用。
 */

import type { ChapterCreateInput } from '@/types/chapter';
import type { HighlightCreateInput } from '@/types/highlight';
import type { NoteCreateInput } from '@/types/note';
import type { WeReadChapterInfo, WeReadBookmark, WeReadReview } from './types';
import { ValidationError } from '@/lib/utils/errors';

// 支持的 URL 路径模式
const READER_PATH_PATTERN = /\/web\/reader\/([^/?#]+)/;
const BOOK_DETAIL_PATTERN = /\/web\/bookDetail\/([^/?#]+)/;

/**
 * 从微信读书 URL 中提取路径编码串（非真实 bookId）
 *
 * @throws {ValidationError} URL 无效
 */
export function extractUrlSlug(url: string): string {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new ValidationError(`无效的 URL：${url}`);
  }

  if (!parsed.hostname.includes('weread.qq.com')) {
    throw new ValidationError('请输入微信读书链接（weread.qq.com）');
  }

  const readerMatch = READER_PATH_PATTERN.exec(parsed.pathname);
  if (readerMatch) return readerMatch[1];

  const detailMatch = BOOK_DETAIL_PATTERN.exec(parsed.pathname);
  if (detailMatch) return detailMatch[1];

  throw new ValidationError('无法从 URL 中提取书籍 ID，请检查链接格式');
}

/**
 * 从微信读书页面 HTML 中提取真实的 bookId（数字格式）。
 *
 * WeRead URL 路径中的编码串不是 API 使用的 bookId，
 * 真实 bookId 嵌在页面 HTML 的 __INITIAL_STATE__ 中。
 */
export async function resolveBookId(url: string): Promise<string> {
  const slug = extractUrlSlug(url);

  const res = await fetch(`https://weread.qq.com/web/reader/${slug}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new ValidationError('无法访问该书籍页面，请检查链接');
  }

  const html = await res.text();
  const match = /"bookId":"(\d+)"/.exec(html);

  if (!match) {
    throw new ValidationError('无法从页面中解析书籍 ID');
  }

  return match[1];
}

/** 向后兼容：同步提取（仅返回 slug，不是真实 bookId） */
export function extractBookId(url: string): string {
  return extractUrlSlug(url);
}

/**
 * 将 WeReadChapterInfo 转换为 ChapterCreateInput
 *
 * @param info    WeRead 原始章节数据
 * @param bookId  应用内部书籍 ID
 * @param index   顺序索引（用于 orderIndex）
 */
export function mapChapterInfoToChapter(
  info: WeReadChapterInfo,
  bookId: string,
  index: number,
): ChapterCreateInput {
  return {
    bookId,
    chapterUid: info.chapterUid,
    title: info.title,
    level: info.level,
    orderIndex: index,
  };
}

/**
 * 将 WeReadBookmark 转换为 HighlightCreateInput
 *
 * @param bookmark      WeRead 原始划线数据
 * @param chapterIdMap  chapterUid → 应用内部 chapterId 的映射
 * @returns HighlightCreateInput，或 null（chapterUid 找不到映射时）
 */
export function mapBookmarkToHighlight(
  bookmark: WeReadBookmark,
  chapterIdMap: Map<number, string>,
): HighlightCreateInput | null {
  const chapterId = chapterIdMap.get(bookmark.chapterUid);
  if (!chapterId) return null;

  return {
    chapterId,
    text: bookmark.markText,
    range: bookmark.range ?? null,
    colorStyle: bookmark.colorStyle,
    wereadBookmarkId: bookmark.bookmarkId,
  };
}

/**
 * 将 WeReadReview 转换为 NoteCreateInput
 *
 * @param review        WeRead 原始想法数据
 * @param chapterIdMap  chapterUid → 应用内部 chapterId 的映射
 * @returns NoteCreateInput，或 null（chapterUid 找不到映射时）
 */
export function mapReviewToNote(
  review: WeReadReview,
  chapterIdMap: Map<number, string>,
): NoteCreateInput | null {
  const chapterId = chapterIdMap.get(review.chapterUid);
  if (!chapterId) return null;

  return {
    chapterId,
    text: review.content,
    abstract: review.abstract ?? null,
    wereadReviewId: review.reviewId,
  };
}
