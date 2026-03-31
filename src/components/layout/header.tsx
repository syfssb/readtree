'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/providers/theme-provider';
import { Sun, Moon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface HeaderProps {
  className?: string;
}

/**
 * 顶部导航栏
 * - 左侧：品牌名 "ReadTree"
 * - 右侧：暗色模式切换 + 设置入口
 */
export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className }, ref) => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
      <header
        ref={ref}
        className={cn(
          'fixed top-0 w-full h-14 z-40',
          'bg-[var(--color-page-bg)] border-b border-[var(--color-border)]',
          'flex items-center justify-between px-6',
          className
        )}
      >
        {/* 左侧：品牌名 */}
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-[var(--color-text-primary)] hover:opacity-80 transition-opacity duration-200"
        >
          ReadTree
        </Link>

        {/* 右侧：操作按钮组 */}
        <div className="flex items-center gap-2">
          {/* 暗色模式切换 */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
              'hover:bg-[var(--color-secondary)] transition-colors duration-200',
              'cursor-pointer'
            )}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* 设置入口 */}
          <Link
            href="/settings"
            aria-label="设置"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
              'hover:bg-[var(--color-secondary)] transition-colors duration-200'
            )}
          >
            <Settings size={16} />
          </Link>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
