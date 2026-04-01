'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  type NodeTypes,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import type { ChapterTreeNode } from '@/types/chapter';
import { ChapterNode, type ChapterNodeData } from './chapter-node';
import { useTreeLayout, type TreeLayoutStats } from './use-tree-layout';
import { Button } from '@/components/ui/button';

/** nodeTypes 必须在模块顶层定义，避免每次渲染重建引用导致 React Flow 重置 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: NodeTypes = {
  chapterNode: ChapterNode as React.ComponentType<any>,
};

// ---------------------------------------------------------------------------
// 内部画布组件（可使用 useReactFlow hook）
// ---------------------------------------------------------------------------

interface BookFlowInnerProps {
  tree: ChapterTreeNode[];
  stats?: TreeLayoutStats;
  onNodeSelect?: (chapterId: string) => void;
  selectedChapterId?: string;
}

function BookFlowInner({ tree, stats, onNodeSelect, selectedChapterId }: BookFlowInnerProps) {
  const { fitView } = useReactFlow();
  const { nodes, edges, toggleExpand, expandedIds, expandAll, collapseAll } = useTreeLayout({ tree, stats });

  // expandedIds 变化后重新适配视图，使用 requestAnimationFrame 等待布局稳定
  const prevExpandedCount = useRef(expandedIds.size);
  useEffect(() => {
    if (prevExpandedCount.current !== expandedIds.size) {
      prevExpandedCount.current = expandedIds.size;
      requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.3, maxZoom: 1 });
      });
    }
  }, [expandedIds.size, fitView]);

  // 将 selectedChapterId 注入每个节点的 data.isSelected 字段
  const nodesWithSelection = useMemo<Node[]>(
    () =>
      (nodes as unknown as Node[]).map((node) => ({
        ...node,
        data: {
          ...(node.data as ChapterNodeData),
          isSelected: node.id === selectedChapterId,
        },
      })),
    [nodes, selectedChapterId]
  );

  // 单击节点：展开/折叠子节点（不切换 Tab）
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as ChapterNodeData;
      if (data.hasChildren) {
        toggleExpand(node.id);
      }
    },
    [toggleExpand]
  );

  // 双击节点：选中章节 + 切换到详情 Tab
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node.id);
    },
    [onNodeSelect]
  );

  // 展开全部后适配视图
  const handleExpandAll = useCallback(() => {
    expandAll();
  }, [expandAll]);

  // 折叠全部后适配视图
  const handleCollapseAll = useCallback(() => {
    collapseAll();
  }, [collapseAll]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: 'var(--color-text-disabled)',
            strokeWidth: 1.5,
          },
        }}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        className="bg-[var(--color-page-bg)]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--color-border)"
        />
        <MiniMap
          nodeColor="var(--color-secondary)"
          maskColor="var(--color-page-bg)cc"
          className="!shadow-[var(--shadow-card)]"
        />
      </ReactFlow>

      {/* 左上角工具栏：展开全部 / 折叠全部 */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpandAll}
          className="h-7 px-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:bg-[var(--color-secondary)]"
        >
          展开全部
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCollapseAll}
          className="h-7 px-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:bg-[var(--color-secondary)]"
        >
          折叠全部
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 导出组件（包裹 ReactFlowProvider）
// ---------------------------------------------------------------------------

export interface BookFlowProps {
  /** 扁平章节列表（将自动构建树形结构） */
  chapters: ChapterTreeNode[];
  /** 可选：各章节划线/笔记统计 */
  stats?: TreeLayoutStats;
  /** 点击节点时的回调 */
  onNodeSelect?: (chapterId: string) => void;
  /** 当前选中的章节 ID */
  selectedChapterId?: string;
}

/**
 * 书籍目录 Flow 画布
 *
 * 包裹 ReactFlowProvider，以便内部可使用 useReactFlow hook。
 * 容器需由调用方提供明确的宽高（如 h-[calc(100vh-3.5rem)]）。
 */
export function BookFlow({ chapters, stats, onNodeSelect, selectedChapterId }: BookFlowProps) {
  return (
    <ReactFlowProvider>
      <BookFlowInner
        tree={chapters}
        stats={stats}
        onNodeSelect={onNodeSelect}
        selectedChapterId={selectedChapterId}
      />
    </ReactFlowProvider>
  );
}
