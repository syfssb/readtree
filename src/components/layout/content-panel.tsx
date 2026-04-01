'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ContentPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /**
   * 全宽模式：不限制最大宽度，减少内边距。
   * 适用于 React Flow 画布等需要全宽渲染的场景。
   */
  fullWidth?: boolean;
}

/**
 * 主内容区域组件
 * - 左侧留出侧边栏宽度（ml-80），顶部留出 Header 高度（pt-14）
 * - fullWidth=false（默认）: 内部最大宽度 768px，水平居中
 * - fullWidth=true: 全宽无约束，适用于画布类内容
 */
export const ContentPanel = React.forwardRef<HTMLDivElement, ContentPanelProps>(
  ({ children, className, fullWidth = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'ml-80 pt-14 min-h-screen bg-[var(--color-page-bg)]',
        className
      )}
      {...props}
    >
      {fullWidth ? (
        // 全宽模式：直接渲染子内容，不加 max-w 约束
        <div className="w-full h-full">
          {children}
        </div>
      ) : (
        // 标准模式：居中限宽
        <div className="max-w-3xl mx-auto px-6 py-8">
          {children}
        </div>
      )}
    </div>
  )
);

ContentPanel.displayName = 'ContentPanel';
