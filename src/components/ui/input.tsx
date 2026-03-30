'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 输入框标签文字 */
  label?: string;
  /** 错误提示文字 */
  error?: string;
  className?: string;
}

/** 输入框基础样式 */
const inputBaseStyles =
  'w-full bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 font-sans text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] outline-none transition-colors duration-200 focus:border-[#141413] focus:ring-1 focus:ring-[#141413] disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Anthropic 设计风格输入框组件
 *
 * @example
 * <Input label="书名" placeholder="请输入书名" error="书名不能为空" />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? `input-${label}` : undefined);

    return (
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={inputId}
            className="font-sans text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputBaseStyles,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-600 text-sm mt-1 font-sans">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
