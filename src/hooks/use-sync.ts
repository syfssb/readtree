import { useState, useCallback } from 'react';
import type { SyncResult } from '@/types/api';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface UseSyncResult {
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  result: SyncResult | null;
  errorMessage: string | null;
}

/**
 * 触发书籍笔记同步
 *
 * @param bookId 书籍 ID
 */
export function useSync(bookId: string): UseSyncResult {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerSync = useCallback(async () => {
    if (!bookId || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/books/${bookId}/sync`, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error?.message ?? `同步失败 (${res.status})`);
      }

      setResult(json.data ?? json);
      setSyncStatus('success');
    } catch (err: unknown) {
      // 区分 cookie 过期（401）与网络错误，给出具体提示
      let msg = '同步失败，请稍后重试';
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
          msg = '登录已过期，请重新扫码登录';
        } else if (err.name === 'TypeError' || err.message.toLowerCase().includes('fetch')) {
          msg = '网络错误，请检查网络连接';
        } else if (err.message) {
          msg = err.message;
        }
      }
      setErrorMessage(msg);
      setSyncStatus('error');
    }
  }, [bookId, syncStatus]);

  return { syncStatus, triggerSync, result, errorMessage };
}
