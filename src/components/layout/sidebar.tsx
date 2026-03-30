'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
}

/**
 * 侧边栏组件
 * - 固定在左侧，顶部从 Header（h-14）下方开始
 * - 宽度 320px（w-80），可滚动
 */
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ children, className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        'fixed left-0 top-14 w-80 h-[calc(100vh-3.5rem)]',
        'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
        'overflow-y-auto p-4',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
);

Sidebar.displayName = 'Sidebar';
