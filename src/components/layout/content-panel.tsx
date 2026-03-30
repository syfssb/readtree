'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ContentPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

/**
 * 主内容区域组件
 * - 左侧留出侧边栏宽度（ml-80），顶部留出 Header 高度（pt-14）
 * - 内部最大宽度 768px，水平居中
 */
export const ContentPanel = React.forwardRef<HTMLDivElement, ContentPanelProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'ml-80 pt-14 min-h-screen bg-[var(--color-page-bg)]',
        className
      )}
      {...props}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  )
);

ContentPanel.displayName = 'ContentPanel';
