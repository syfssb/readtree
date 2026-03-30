'use client';

import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'> {
  /** 标签文字 */
  label?: string;
  /** 错误提示文字 */
  error?: string;
  /** 最小行数，默认 3 */
  minRows?: number;
  className?: string;
  /** onInput 回调 */
  onInput?: React.FormEventHandler<HTMLTextAreaElement>;
}

/** 文本域基础样式（与 Input 风格一致） */
const textareaBaseStyles =
  'w-full bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 font-sans text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] outline-none transition-colors duration-200 focus:border-[#141413] focus:ring-1 focus:ring-[#141413] disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden';

/**
 * Anthropic 设计风格文本域组件，支持自动增高
 *
 * @example
 * <Textarea label="备注" minRows={3} placeholder="请输入备注内容" />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, minRows = 3, className, id, onInput, style, ...props }, ref) => {
    const textareaId = id ?? (label ? `textarea-${label}` : undefined);

    // 支持外部 ref 与内部 ref 共存
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = (node: HTMLTextAreaElement | null) => {
      (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    };

    /** 自动增高处理 */
    const handleAutoResize = useCallback(
      (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        onInput?.(e);
      },
      [onInput]
    );

    return (
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-sans text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={combinedRef}
          id={textareaId}
          rows={minRows}
          onInput={handleAutoResize}
          className={cn(
            textareaBaseStyles,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          style={style}
          {...props}
        />
        {error && (
          <p className="text-red-600 text-sm mt-1 font-sans">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
