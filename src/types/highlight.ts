export interface Highlight {
  readonly id: string;
  readonly chapterId: string;
  readonly text: string;
  readonly range: string | null;
  readonly colorStyle: number;
  readonly wereadBookmarkId: string;
  readonly createdAt: string;
}

export interface HighlightCreateInput {
  readonly chapterId: string;
  readonly text: string;
  readonly range?: string | null;
  readonly colorStyle: number;
  readonly wereadBookmarkId: string;
}
