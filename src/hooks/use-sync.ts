import { useState, useCallback } from 'react';
import type { SyncResult } from '@/types/api';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface UseSyncResult {
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  result: SyncResult | null;
}

/**
 * 触发书籍笔记同步
 *
 * @param bookId 书籍 ID
 */
export function useSync(bookId: string): UseSyncResult {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);

  const triggerSync = useCallback(async () => {
    if (!bookId || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setResult(null);

    try {
      const res = await fetch(`/api/books/${bookId}/sync`, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error?.message ?? `同步失败 (${res.status})`);
      }

      setResult(json.data ?? json);
      setSyncStatus('success');
    } catch {
      setSyncStatus('error');
    }
  }, [bookId, syncStatus]);

  return { syncStatus, triggerSync, result };
}
