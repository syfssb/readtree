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
}

/**
 * 获取章节详细内容（划线、笔记、引用）
 *
 * @param bookId    书籍 ID
 * @param chapterId 章节 ID，为 null 时不发起请求
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

    Promise.all([
      fetch(base).then((r) => r.json()),
      fetch(`${base}/highlights`).then((r) => r.json()),
      fetch(`${base}/notes`).then((r) => r.json()),
      fetch(`${base}/quotes`).then((r) => r.json()),
    ])
      .then(([chapterJson, highlightsJson, notesJson, quotesJson]) => {
        if (cancelled) return;
        setChapter(chapterJson.data ?? chapterJson);
        setHighlights(highlightsJson.data ?? highlightsJson ?? []);
        setNotes(notesJson.data ?? notesJson ?? []);
        setQuotes(quotesJson.data ?? quotesJson ?? []);
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
  }, [bookId, chapterId]);

  return { chapter, highlights, notes, quotes, isLoading };
}
