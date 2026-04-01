'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
}

function BookFlowInner({ tree, stats, onNodeSelect }: BookFlowInnerProps) {
  const { fitView } = useReactFlow();
  const { nodes, edges, toggleExpand, expandedIds } = useTreeLayout({ tree, stats });

  // expandedIds 变化后重新适配视图，使用 requestAnimationFrame 等待布局稳定
  const prevExpandedCount = useRef(expandedIds.size);
  useEffect(() => {
    if (prevExpandedCount.current !== expandedIds.size) {
      prevExpandedCount.current = expandedIds.size;
      requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.2 });
      });
    }
  }, [expandedIds.size, fitView]);

  // 节点点击：切换展开/折叠 + 通知父组件选中
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as ChapterNodeData;
      if (data.hasChildren) {
        toggleExpand(node.id);
      }
      onNodeSelect?.(node.id);
    },
    [toggleExpand, onNodeSelect]
  );

  return (
    <ReactFlow
      nodes={nodes as unknown as Node[]}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      connectionLineType={ConnectionLineType.SmoothStep}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: {
          stroke: 'var(--color-border-hover)',
          strokeWidth: 1.5,
        },
      }}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
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
      <Controls
        className="!shadow-[var(--shadow-card)]"
        showInteractive={false}
      />
      <MiniMap
        nodeColor="var(--color-secondary)"
        maskColor="var(--color-page-bg)cc"
        className="!shadow-[var(--shadow-card)]"
      />
    </ReactFlow>
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
}

/**
 * 书籍目录 Flow 画布
 *
 * 包裹 ReactFlowProvider，以便内部可使用 useReactFlow hook。
 * 容器需由调用方提供明确的宽高（如 h-[calc(100vh-3.5rem)]）。
 */
export function BookFlow({ chapters, stats, onNodeSelect }: BookFlowProps) {
  return (
    <ReactFlowProvider>
      <BookFlowInner tree={chapters} stats={stats} onNodeSelect={onNodeSelect} />
    </ReactFlowProvider>
  );
}
