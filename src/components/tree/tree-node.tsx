'use client';

import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ChapterTreeNode } from '@/types/chapter';
import { useTreeContext } from './tree-context';

export interface TreeNodeProps {
  node: ChapterTreeNode;
  depth: number;
  /** 章节统计信息（用于显示笔记圆点） */
  chapterStats?: Map<string, { highlights: number; notes: number }>;
  /** 点击节点时的回调 */
  onSelect?: (id: string) => void;
}

/**
 * 树节点组件 — 递归渲染章节树
 */
export function TreeNode({ node, depth, chapterStats, onSelect }: TreeNodeProps) {
  const { expandedIds, selectedId, toggleNode, selectNode } = useTreeContext();

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const paddingLeft = depth * 16 + 8;

  const stats = chapterStats?.get(node.id);
  const hasNotes = (stats?.notes ?? 0) > 0;

  const handleClick = () => {
    if (hasChildren) {
      toggleNode(node.id);
    }
    selectNode(node.id);
    onSelect?.(node.id);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(node.id);
  };

  return (
    <div>
      {/* 节点行 */}
      <div
        className={cn(
          'relative flex items-center gap-1.5 py-1.5 pr-3 cursor-pointer',
          'transition-colors duration-150',
          isSelected
            ? 'bg-[var(--color-secondary)]'
            : 'hover:bg-[var(--color-secondary)]'
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {/* 选中态左侧竖条 */}
        {isSelected && (
          <span
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ae5630] rounded-r-sm"
            aria-hidden="true"
          />
        )}

        {/* 展开/折叠图标 */}
        <span
          className={cn(
            'shrink-0 w-4 h-4 flex items-center justify-center',
            'text-[var(--color-text-subtle)]',
            hasChildren && 'hover:text-[var(--color-text-primary)]'
          )}
          onClick={hasChildren ? handleChevronClick : undefined}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            // 叶子节点占位，保持缩进对齐
            <span className="w-3.5" />
          )}
        </span>

        {/* 章节标题 */}
        <span
          className={cn(
            'flex-1 font-serif text-sm leading-5 truncate',
            isSelected
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]'
          )}
        >
          {node.title}
        </span>

        {/* 笔记圆点指示器 */}
        {hasNotes && (
          <span
            className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
            aria-label="有笔记"
          />
        )}
      </div>

      {/* 子节点（展开时渲染） */}
      {hasChildren && isExpanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child as ChapterTreeNode}
              depth={depth + 1}
              chapterStats={chapterStats}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
