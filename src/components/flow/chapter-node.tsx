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
  /** 隐藏的子节点数量（折叠时显示 badge） */
  hiddenChildCount?: number;
  /** 是否被选中 */
  isSelected?: boolean;
}

interface ChapterNodeProps {
  data: ChapterNodeData;
  selected: boolean;
}

/** 根据层级返回标题样式类名 */
function getTitleClassName(level: number): string {
  if (level === 1) return 'font-serif text-base font-semibold text-[var(--color-text-primary)] truncate flex-1 leading-snug';
  if (level === 2) return 'font-serif text-sm font-medium text-[var(--color-text-primary)] truncate flex-1 leading-snug';
  return 'font-serif text-sm font-normal text-[var(--color-text-primary)] truncate flex-1 leading-snug';
}

/** 根据层级返回节点背景样式类名 */
function getNodeBgClassName(level: number): string {
  if (level === 1) return 'bg-[var(--color-secondary)]';
  return 'bg-[var(--color-card)]';
}

/**
 * React Flow 自定义节点 — 章节卡片
 * - 左侧层级色条（颜色随层级变化）
 * - 章节标题（层级不同字号/字重不同）
 * - 子节点展开/折叠图标（放大 + hover 圆形背景）
 * - 折叠状态的隐藏子节点数量 badge
 * - 笔记/划线数 badge
 */
export const ChapterNode = memo(function ChapterNode({ data, selected }: ChapterNodeProps) {
  const {
    title,
    level,
    hasChildren,
    isExpanded,
    highlightCount = 0,
    noteCount = 0,
    hiddenChildCount = 0,
    isSelected = false,
  } = data;

  const levelColor = LEVEL_COLORS[level] ?? DEFAULT_LEVEL_COLOR;
  const badgeCount = highlightCount + noteCount;
  // selected 来自 React Flow 内部，isSelected 来自外部传入（父组件选中状态）
  const isHighlighted = selected || isSelected;

  return (
    <div
      className={cn(
        // 基础样式
        'relative flex items-center gap-2 overflow-hidden',
        getNodeBgClassName(level),
        'border border-[var(--color-border)]',
        'rounded-lg cursor-pointer select-none',
        'transition-shadow duration-200',
        // 阴影
        isHighlighted
          ? 'shadow-[var(--shadow-composer)]'
          : 'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-composer)]',
        // 选中边框高亮
        isHighlighted && 'border-[#ae5630]'
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
        <span className={getTitleClassName(level)}>
          {title}
        </span>

        {/* 笔记/划线数 badge */}
        {badgeCount > 0 && (
          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-secondary)] font-sans text-[10px] text-[var(--color-text-muted)]">
            {badgeCount}
          </span>
        )}

        {/* 展开/折叠图标区域 */}
        {hasChildren && (
          <span
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
              'text-[var(--color-text-subtle)]',
              'hover:bg-[var(--color-secondary)] transition-colors duration-150'
            )}
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
        )}
      </div>

      {/* 折叠时显示隐藏子节点数量 badge（底部右下角） */}
      {hasChildren && !isExpanded && hiddenChildCount > 0 && (
        <span
          className={cn(
            'absolute bottom-[3px] right-[6px]',
            'inline-flex items-center justify-center min-w-[16px] h-[14px] px-1 rounded-full',
            'bg-[var(--color-secondary)] font-sans text-[9px] text-[var(--color-text-muted)]'
          )}
        >
          +{hiddenChildCount}
        </span>
      )}
    </div>
  );
});
