'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Book } from '@/types/book';

export interface BookCardProps {
  book: Book;
}

/**
 * 书籍卡片组件
 * 可点击，链接到 /book/[bookId]
 */
export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/book/${book.id}`}
      className={cn(
        'block group',
        'bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4',
        'shadow-[var(--shadow-card)] transition-colors duration-200',
        'hover:border-[var(--color-border-hover)]'
      )}
    >
      <div className="flex gap-3 items-start">
        {/* 封面图或首字占位 */}
        <div className="shrink-0 w-12 h-16 rounded-md overflow-hidden bg-[var(--color-secondary)] flex items-center justify-center">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-serif text-xl font-bold text-[var(--color-text-disabled)] select-none leading-none">
              {book.title.charAt(0)}
            </span>
          )}
        </div>

        {/* 书籍信息 */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="font-serif text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors duration-200">
            {book.title}
          </h3>
          <p className="font-sans text-xs text-[var(--color-text-muted)] truncate">
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
}
