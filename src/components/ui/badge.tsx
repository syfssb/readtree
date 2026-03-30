'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

/** 徽章变体 */
type BadgeVariant = 'default' | 'accent' | 'success' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
}

/** 变体样式映射 */
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#f0eee6] text-[#141413]',
  accent:  'bg-[#d9775714] text-[#c6613f]',
  success: 'bg-[#788c5d14] text-[#788c5d]',
  info:    'bg-[#6a9bcc14] text-[#6a9bcc]',
};

/** 基础样式 */
const baseStyles =
  'inline-flex items-center px-2.5 py-0.5 text-xs font-medium font-sans rounded-full';

/**
 * Anthropic 设计风格徽章组件
 *
 * @example
 * <Badge variant="accent">进行中</Badge>
 * <Badge variant="success">已完成</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';
