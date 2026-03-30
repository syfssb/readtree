'use client';

import React from 'react';
import type { Highlight } from '@/types/highlight';

export interface HighlightListProps {
  highlights: Highlight[];
}

/**
 * 划线列表
 * 每条划线左侧显示 2px accent 竖线
 */
export function HighlightList({ highlights }: HighlightListProps) {
  if (highlights.length === 0) {
    return (
      <p className="font-sans text-sm text-[var(--color-text-subtle)] py-2">
        暂无划线
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {highlights.map((highlight) => (
        <li key={highlight.id} className="flex gap-3">
          {/* 左侧竖线 */}
          <span
            className="shrink-0 w-0.5 rounded-full bg-[#d97757] self-stretch"
            aria-hidden="true"
          />
          {/* 划线原文 */}
          <p className="font-serif text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {highlight.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
