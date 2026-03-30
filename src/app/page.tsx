'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { UrlInput } from '@/components/book/url-input';
import { BookCard } from '@/components/book/book-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/types/book';

/**
 * 首页
 * 顶部输入框 + 已有书籍网格列表
 */
export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/books')
      .then((r) => r.json())
      .then((json) => setBooks(json.data ?? json ?? []))
      .catch(() => setBooks([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <Header />

      <main className="pt-14">
        {/* Hero 区域 */}
        <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="font-serif text-4xl font-bold text-[var(--color-text-primary)] mb-3">
            ReadTree
          </h1>
          <p className="font-sans text-base text-[var(--color-text-muted)] mb-10 max-w-md">
            把碎片化的划线笔记，长成一棵有结构的知识树
          </p>
          <div className="w-full max-w-2xl">
            <UrlInput />
          </div>
        </section>

        {/* 书籍列表 */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height="96px" className="rounded-xl" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <p className="text-center font-sans text-sm text-[var(--color-text-subtle)] py-8">
              还没有添加书籍，粘贴链接开始吧
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
