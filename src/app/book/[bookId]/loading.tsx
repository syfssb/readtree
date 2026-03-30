import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 书籍页骨架屏
 * 模拟 Header + Sidebar + ContentPanel 三栏布局
 */
export default function BookLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      {/* Header 骨架 */}
      <div className="fixed top-0 w-full h-14 z-40 bg-[var(--color-page-bg)] border-b border-[var(--color-border)] flex items-center justify-between px-6">
        <Skeleton width="100px" height="1.25rem" />
        <div className="flex gap-2">
          <Skeleton width="32px" height="32px" className="rounded-lg" />
          <Skeleton width="32px" height="32px" className="rounded-lg" />
        </div>
      </div>

      {/* Sidebar 骨架 */}
      <aside className="fixed left-0 top-14 w-80 h-[calc(100vh-3.5rem)] bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4">
        {/* 书籍信息骨架 */}
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton height="1rem" width="80%" />
          <Skeleton height="0.75rem" width="50%" />
          <Skeleton height="2rem" className="mt-1 rounded-lg" />
        </div>

        <div className="border-t border-[var(--color-border)] mb-3" />

        {/* 目录骨架 */}
        <div className="flex flex-col gap-2">
          {[80, 65, 70, 55, 75, 60].map((w, i) => (
            <Skeleton key={i} height="1.5rem" width={`${w}%`} />
          ))}
        </div>
      </aside>

      {/* Content 骨架 */}
      <div className="ml-80 pt-14 min-h-screen bg-[var(--color-page-bg)]">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
          <Skeleton height="2rem" width="60%" />
          <Skeleton height="8rem" />
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
          <Skeleton height="4rem" />
        </div>
      </div>
    </div>
  );
}
