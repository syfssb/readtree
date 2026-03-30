export interface Chapter {
  readonly id: string;
  readonly bookId: string;
  readonly chapterUid: number;
  readonly title: string;
  readonly level: number;
  readonly orderIndex: number;
  readonly summary: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChapterCreateInput {
  readonly bookId: string;
  readonly chapterUid: number;
  readonly title: string;
  readonly level: number;
  readonly orderIndex: number;
}

export interface ChapterTreeNode extends Chapter {
  readonly children: readonly ChapterTreeNode[];
}

export interface ChapterWithContent extends Chapter {
  readonly highlightCount: number;
  readonly noteCount: number;
  readonly quoteCount: number;
}
