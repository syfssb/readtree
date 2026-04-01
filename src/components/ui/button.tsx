'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

/** 按钮变体 */
type ButtonVariant = 'primary' | 'cta' | 'ghost' | 'outline';

/** 按钮尺寸 */
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** 变体样式映射 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-text-primary)] text-[var(--color-page-bg)] hover:opacity-80',
  cta:
    'bg-[#c6613f] text-[#faf9f5] hover:bg-[#d97757]',
  ghost:
    'bg-transparent border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[var(--color-text-primary)]',
  outline:
    'bg-transparent border border-[var(--color-text-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-page-bg)]',
};

/** 尺寸样式映射 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

/** 基础样式（所有变体共享） */
const baseStyles =
  'inline-flex items-center justify-center rounded-lg font-sans transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

/**
 * Anthropic 设计风格按钮组件
 *
 * @example
 * <Button variant="primary" size="md">确认</Button>
 * <Button variant="cta" size="lg">开始使用</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', className, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
