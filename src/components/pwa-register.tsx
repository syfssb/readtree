'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker 注册组件
 * 在客户端挂载后异步注册 SW，不影响首屏渲染性能
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {
        // SW 注册失败不影响应用正常运行，静默处理
      });
  }, []);

  return null;
}
