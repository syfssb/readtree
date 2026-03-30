'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
} from 'react';
import { cn } from '@/lib/utils/cn';

/** Toast 变体 */
type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** 显示一条 Toast 消息 */
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** 变体颜色映射 */
const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-[#788c5d] text-white',
  error:   'bg-[#c46686] text-white',
  info:    'bg-[#6a9bcc] text-white',
};

/** 最多同时显示的条数 */
const MAX_TOASTS = 3;

/** 自动消失时间（ms） */
const AUTO_DISMISS_MS = 3000;

/**
 * Toast 提供者，包裹应用根节点以启用全局通知
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // 用于生成唯一 id 的计数器（不依赖 useId，避免 SSR 问题）
  const counterRef = React.useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${++counterRef.current}`;
      const newItem: ToastItem = { id, message, variant };

      setToasts((prev) => {
        // 新的放最前，保持最多 MAX_TOASTS 条
        const next = [newItem, ...prev];
        return next.slice(0, MAX_TOASTS);
      });

      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast 容器：fixed 右下角，新的在上方 */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-center justify-between gap-3',
              'px-4 py-3 rounded-xl shadow-[var(--shadow-modal)]',
              'font-sans text-sm min-w-[220px] max-w-sm',
              'animate-[fadeInUp_0.2s_ease-out]',
              variantStyles[item.variant]
            )}
          >
            <span>{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              aria-label="关闭"
              className="opacity-70 hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * 获取 toast 触发函数
 *
 * @example
 * const { toast } = useToast();
 * toast('操作成功', 'success');
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
