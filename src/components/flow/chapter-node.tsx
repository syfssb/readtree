'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** 各层级左侧色条颜色 */
const LEVEL_COLORS: Record<number, string> = {
  1: '#ae5630',
  2: '#c6613f',
  3: '#d97757',
};

const DEFAULT_LEVEL_COLOR = '#d97757';

export interface ChapterNodeData extends Record<string, unknown> {
  /** 章节标题 */
  title: string;
  /** 层级（1-3+） */
  level: number;
  /** 是否有子节点 */
  hasChildren: boolean;
  /** 是否已展开 */
  isExpanded: boolean;
  /** 划线数量 */
  highlightCount?: number;
  /** 笔记数量 */
  noteCount?: number;
}

interface ChapterNodeProps {
  data: ChapterNodeData;
  selected: boolean;
}

/**
 * React Flow 自定义节点 — 章节卡片
 * - 左侧层级色条
 * - 章节标题（serif 字体，截断）
 * - 子节点指示器（展开/折叠图标）
 * - 笔记数 badge
 */
export const ChapterNode = memo(function ChapterNode({ data, selected }: ChapterNodeProps) {
  const {
    title,
    level,
    hasChildren,
    isExpanded,
    highlightCount = 0,
    noteCount = 0,
  } = data;

  const levelColor = LEVEL_COLORS[level] ?? DEFAULT_LEVEL_COLOR;
  const badgeCount = highlightCount + noteCount;

  return (
    <div
      className={cn(
        // 基础样式
        'relative flex items-center gap-2 overflow-hidden',
        'bg-[var(--color-card)] border border-[var(--color-border)]',
        'rounded-lg cursor-pointer select-none',
        'transition-shadow duration-200',
        // 阴影
        selected
          ? 'shadow-[var(--shadow-composer)]'
          : 'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-composer)]',
        // 选中边框高亮
        selected && 'border-[var(--color-accent)]'
      )}
      style={{ width: 220, height: 56 }}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[var(--color-border-hover)] !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[var(--color-border-hover)] !border-0"
      />

      {/* 左侧层级色条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ backgroundColor: levelColor }}
      />

      {/* 主体内容区 */}
      <div className="flex items-center gap-2 pl-3 pr-2 w-full min-w-0">
        {/* 章节标题 */}
        <span className="font-serif text-sm text-[var(--color-text-primary)] truncate flex-1 leading-snug">
          {title}
        </span>

        {/* 笔记数 badge */}
        {badgeCount > 0 && (
          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-secondary)] font-sans text-[10px] text-[var(--color-text-muted)]">
            {badgeCount}
          </span>
        )}

        {/* 展开/折叠图标 */}
        {hasChildren && (
          <span className="flex-shrink-0 text-[var(--color-text-subtle)]">
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </span>
        )}
      </div>
    </div>
  );
});
