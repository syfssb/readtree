'use client';

import React, { useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export interface DialogProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
}

export interface DialogSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * 对话框组件
 * - ESC 键关闭
 * - 点击遮罩关闭
 *
 * @example
 * <Dialog open={open} onClose={() => setOpen(false)}>
 *   <DialogTitle>确认操作</DialogTitle>
 *   <DialogBody>此操作不可逆，确定继续？</DialogBody>
 *   <DialogFooter>
 *     <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
 *     <Button variant="cta">确认</Button>
 *   </DialogFooter>
 * </Dialog>
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onClose, children, className }, ref) => {
    // ESC 键关闭
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose]
    );

    useEffect(() => {
      if (open) {
        document.addEventListener('keydown', handleKeyDown);
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
      /* 遮罩层 */
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        {/* 面板：阻止点击事件冒泡到遮罩 */}
        <div
          ref={ref}
          className={cn(
            'bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-lg',
            'shadow-[var(--shadow-modal)] relative',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }
);
Dialog.displayName = 'Dialog';

/** 对话框标题 */
export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogSectionProps>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        'font-serif text-xl font-semibold text-[var(--color-text-primary)] mb-4',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
);
DialogTitle.displayName = 'DialogTitle';

/** 对话框主体内容 */
export const DialogBody = React.forwardRef<HTMLDivElement, DialogSectionProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-[var(--color-text-secondary)] font-sans', className)}
      {...props}
    >
      {children}
    </div>
  )
);
DialogBody.displayName = 'DialogBody';

/** 对话框底部操作区 */
export const DialogFooter = React.forwardRef<HTMLDivElement, DialogSectionProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-6 flex items-center justify-end gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DialogFooter.displayName = 'DialogFooter';
