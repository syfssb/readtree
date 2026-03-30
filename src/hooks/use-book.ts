import { useState, useEffect, useCallback } from 'react';
import type { Book } from '@/types/book';
import type { Chapter } from '@/types/chapter';

interface UseBookResult {
  book: Book | null;
  chapters: Chapter[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

/**
 * 获取单本书籍详情及章节列表
 *
 * @param bookId 书籍 ID
 */
export function useBook(bookId: string): UseBookResult {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const mutate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!bookId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/books/${bookId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? `请求失败 (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        // API 响应格式：{ success: true, data: { ...book, chapters: [...] } }
        const data = json.data ?? json;
        setBook({
          id: data.id,
          title: data.title,
          author: data.author,
          coverUrl: data.coverUrl ?? null,
          wereadBookId: data.wereadBookId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        setChapters(data.chapters ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '未知错误');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, refreshKey]);

  return { book, chapters, isLoading, error, mutate };
}
