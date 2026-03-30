'use client';

import React from 'react';
import type { Note } from '@/types/note';

export interface NoteListProps {
  notes: Note[];
}

/**
 * 笔记列表
 * 每条笔记显示正文和可选的原文摘要（blockquote 样式）
 */
export function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="font-sans text-sm text-[var(--color-text-subtle)] py-2">
        暂无笔记
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {notes.map((note) => (
        <li key={note.id} className="flex flex-col gap-2">
          {/* 原文摘要（可选） */}
          {note.abstract && (
            <blockquote className="border-l-2 border-[var(--color-border-hover)] pl-3 font-serif text-sm italic text-[var(--color-text-muted)] leading-relaxed">
              {note.abstract}
            </blockquote>
          )}
          {/* 笔记正文 */}
          <p className="font-serif text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {note.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
