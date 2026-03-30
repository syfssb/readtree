export type ApiResponse<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ApiError };

export interface ApiError {
  readonly code: string;
  readonly message: string;
}

export interface SyncResult {
  readonly highlightsCount: number;
  readonly notesCount: number;
}

export interface ManualQuote {
  readonly id: string;
  readonly chapterId: string;
  readonly text: string;
  readonly createdAt: string;
}

export interface ManualQuoteCreateInput {
  readonly chapterId: string;
  readonly text: string;
}

export interface UserConfig {
  readonly id: string;
  readonly wereadCookie: string;
  readonly updatedAt: string;
}
