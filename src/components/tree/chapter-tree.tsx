'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Chapter } from '@/types/chapter';
import { buildChapterTree, flattenTree } from '@/lib/utils/tree';
import { TreeProvider, useTreeContext } from './tree-context';
import { TreeNode } from './tree-node';

export interface ChapterTreeProps {
  chapters: Chapter[];
  chapterStats?: Map<string, { highlights: number; notes: number }>;
  /** 选中章节时的回调 */
  onSelect?: (chapterId: string) => void;
}

/**
 * 工具栏 — 需要 TreeContext，单独抽出
 */
function TreeToolbar({ tree }: { tree: ReturnType<typeof buildChapterTree> }) {
  const { expandAll, collapseAll } = useTreeContext();

  const allIds = useMemo(() => flattenTree(tree).map((c) => c.id), [tree]);

  return (
    <div className="flex items-center gap-1 mb-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-2 py-1 h-auto"
        onClick={() => expandAll(allIds)}
      >
        全部展开
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-2 py-1 h-auto"
        onClick={() => collapseAll()}
      >
        全部折叠
      </Button>
    </div>
  );
}

/**
 * 章节树主组件
 * 包含工具栏（展开/折叠全部）和递归节点列表
 */
export function ChapterTree({ chapters, chapterStats, onSelect }: ChapterTreeProps) {
  const tree = useMemo(() => buildChapterTree(chapters), [chapters]);

  /** 默认展开第一级节点（level === 1） */
  const defaultExpandedIds = useMemo(
    () => chapters.filter((c) => c.level === 1).map((c) => c.id),
    [chapters]
  );

  if (chapters.length === 0) {
    return (
      <div className="py-8 text-center font-sans text-sm text-[var(--color-text-subtle)]">
        暂无章节
      </div>
    );
  }

  return (
    <TreeProvider defaultExpandedIds={defaultExpandedIds}>
      <div role="tree" aria-label="章节目录">
        <TreeToolbar tree={tree} />
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            chapterStats={chapterStats}
            onSelect={onSelect}
          />
        ))}
      </div>
    </TreeProvider>
  );
}
