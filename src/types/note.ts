export interface Note {
  readonly id: string;
  readonly chapterId: string;
  readonly text: string;
  readonly abstract: string | null;
  readonly wereadReviewId: string;
  readonly createdAt: string;
}

export interface NoteCreateInput {
  readonly chapterId: string;
  readonly text: string;
  readonly abstract?: string | null;
  readonly wereadReviewId: string;
}
