'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 宽度，如 '100%' 或 '200px' */
  width?: string | number;
  /** 高度，如 '1rem' 或 '24px' */
  height?: string | number;
  className?: string;
}

/**
 * 骨架屏占位组件，用于加载状态
 *
 * @example
 * <Skeleton width="100%" height="1rem" />
 * <Skeleton className="w-24 h-24 rounded-full" />
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-[var(--color-secondary)] rounded-lg animate-pulse',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  )
);

Skeleton.displayName = 'Skeleton';
