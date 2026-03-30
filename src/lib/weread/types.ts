/**
 * 微信读书 API 原始响应类型
 *
 * 这些类型直接映射 API 返回的 JSON 结构，与应用内部领域类型（src/types/）保持独立。
 * 转换逻辑集中在 parser.ts，确保边界清晰。
 */

/** 书籍基础信息 */
export interface WeReadBookInfo {
  readonly bookId: string;
  readonly title: string;
  readonly author: string;
  readonly cover: string;
  readonly isbn?: string;
  readonly category?: string;
  readonly publishTime?: string;
  readonly wordCount?: number;
}

/** 章节信息 */
export interface WeReadChapterInfo {
  readonly chapterUid: number;
  readonly chapterIdx: number;
  readonly title: string;
  readonly level: number;
  readonly wordCount?: number;
  readonly price?: number;
  readonly isMPChapter?: number;
  readonly updateTime?: number;
}

/** 划线（书签）*/
export interface WeReadBookmark {
  readonly bookmarkId: string;
  readonly bookId: string;
  readonly chapterUid: number;
  readonly markText: string;
  readonly range?: string;
  readonly style?: number;
  readonly colorStyle: number;
  readonly createTime: number;
}

/** 想法（评论）*/
export interface WeReadReview {
  readonly reviewId: string;
  readonly bookId: string;
  readonly chapterUid: number;
  readonly content: string;
  readonly abstract?: string;
  readonly createTime: number;
}

// ---------- 复合响应类型 ----------

/** GET /book/chapterInfos 响应 */
export interface WeReadChapterResponse {
  readonly data: ReadonlyArray<{
    readonly book: { readonly bookId: string };
    readonly updated: readonly WeReadChapterInfo[];
  }>;
}

/** GET /book/bookmarklist 响应 */
export interface WeReadBookmarkResponse {
  readonly updated: readonly WeReadBookmark[];
  readonly chapters: ReadonlyArray<{
    readonly chapterUid: number;
    readonly title: string;
  }>;
  readonly book: {
    readonly author: string;
    readonly title: string;
    readonly cover: string;
  };
}

/** GET /review/list 响应 */
export interface WeReadReviewResponse {
  readonly reviews: readonly WeReadReview[];
  readonly totalCount: number;
}
