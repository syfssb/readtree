export interface Book {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly coverUrl: string | null;
  readonly wereadBookId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BookCreateInput {
  readonly title: string;
  readonly author: string;
  readonly coverUrl?: string | null;
  readonly wereadBookId: string;
}

export interface BookWithChapters extends Book {
  readonly chapters: readonly Chapter[];
}

// Avoid circular — re-export from chapter.ts at usage site
import type { Chapter } from './chapter';
