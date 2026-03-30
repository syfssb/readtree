import { useState, useEffect } from 'react';
import type { Chapter } from '@/types/chapter';

interface UseChaptersResult {
  chapters: Chapter[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 获取书籍的章节列表
 *
 * @param bookId 书籍 ID
 */
export function useChapters(bookId: string): UseChaptersResult {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = json.data ?? json;
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
  }, [bookId]);

  return { chapters, isLoading, error };
}
