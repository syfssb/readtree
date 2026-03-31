import { useState, useEffect } from 'react';
import type { Chapter } from '@/types/chapter';
import type { Highlight } from '@/types/highlight';
import type { Note } from '@/types/note';
import type { ManualQuote } from '@/types/api';

interface UseChapterContentResult {
  chapter: Chapter | null;
  highlights: Highlight[];
  notes: Note[];
  quotes: ManualQuote[];
  isLoading: boolean;
  refresh: () => void;
}

/**
 * 获取章节详细内容（划线、笔记、引用）
 */
export function useChapterContent(
  bookId: string,
  chapterId: string | null
): UseChapterContentResult {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quotes, setQuotes] = useState<ManualQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!bookId || !chapterId) {
      setChapter(null);
      setHighlights([]);
      setNotes([]);
      setQuotes([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const base = `/api/books/${bookId}/chapters/${chapterId}`;

    // 章节详情（含 highlights + notes）和 quotes 并行请求
    Promise.all([
      fetch(base).then((r) => r.json()),
      fetch(`${base}/quotes`).then((r) => r.json()),
    ])
      .then(([chapterJson, quotesJson]) => {
        if (cancelled) return;
        const data = chapterJson.data ?? chapterJson;
        setChapter(data.chapter ?? data);
        setHighlights(data.highlights ?? []);
        setNotes(data.notes ?? []);
        setQuotes(quotesJson.data ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setHighlights([]);
        setNotes([]);
        setQuotes([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, chapterId, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return { chapter, highlights, notes, quotes, isLoading, refresh };
}
