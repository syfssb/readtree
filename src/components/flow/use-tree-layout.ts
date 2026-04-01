'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { ChapterTreeNode } from '@/types/chapter';
import type { ChapterNodeData } from './chapter-node';

/** 节点宽高常量 */
const NODE_WIDTH = 220;
const NODE_HEIGHT = 56;

/** dagre 布局方向 */
type Direction = 'LR' | 'TB';

// ---------------------------------------------------------------------------
// 布局函数
// ---------------------------------------------------------------------------

/**
 * 用 dagre 计算节点坐标，返回带位置信息的节点数组。
 * dagre 的位置是节点中心点，ReactFlow 使用左上角锚点，需偏移。
 */
function getLayoutedElements(
  nodes: Node<ChapterNodeData>[],
  edges: Edge[],
  direction: Direction = 'LR',
  nodeWidth = NODE_WIDTH,
  nodeHeight = NODE_HEIGHT
): { nodes: Node<ChapterNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 20,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        // 中心点 → 左上角偏移
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ---------------------------------------------------------------------------
// 辅助：收集一个节点的所有后代 ID
// ---------------------------------------------------------------------------
function collectDescendantIds(
  nodeId: string,
  childMap: Map<string, string[]>
): Set<string> {
  const result = new Set<string>();
  const queue = childMap.get(nodeId) ?? [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.add(id);
    (childMap.get(id) ?? []).forEach((cid) => queue.push(cid));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 辅助：收集指定节点的直接子节点下的所有后代数量（用于隐藏 badge）
// ---------------------------------------------------------------------------
function countAllDescendants(
  nodeId: string,
  childMap: Map<string, string[]>
): number {
  return collectDescendantIds(nodeId, childMap).size;
}

// ---------------------------------------------------------------------------
// 辅助：收集前两层节点 ID（level 1 和 level 2）
// ---------------------------------------------------------------------------
function collectFirstTwoLayerIds(tree: readonly ChapterTreeNode[]): Set<string> {
  const ids = new Set<string>();
  // level 1 节点（根节点）
  for (const node of tree) {
    ids.add(node.id);
    // level 2 节点（根节点的直接子节点）
    for (const child of node.children) {
      ids.add(child.id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// 主 Hook
// ---------------------------------------------------------------------------

export interface TreeLayoutStats {
  [chapterId: string]: { highlightCount: number; noteCount: number };
}

export interface UseTreeLayoutOptions {
  tree: ChapterTreeNode[];
  stats?: TreeLayoutStats;
  direction?: Direction;
}

export interface UseTreeLayoutReturn {
  nodes: Node<ChapterNodeData>[];
  edges: Edge[];
  expandedIds: Set<string>;
  toggleExpand: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

/**
 * 将树形章节数据 → React Flow nodes + edges，并管理展开/折叠状态。
 *
 * 策略：
 * - expandedIds 保存当前展开节点集合
 * - 默认展开前两层（level 1 和 level 2），保证首次渲染节点数量适中
 * - 每次渲染时，仅把展开节点的子节点纳入 nodes/edges
 * - toggleExpand 折叠时同步删除所有后代
 * - hiddenChildCount 记录折叠节点下隐藏的后代总数，传递给节点 data 以显示 badge
 */
export function useTreeLayout({
  tree,
  stats,
  direction = 'LR',
}: UseTreeLayoutOptions): UseTreeLayoutReturn {
  // 默认展开前两层节点（level 1 + level 2）
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => collectFirstTwoLayerIds(tree)
  );

  // 当 tree 引用变化时（如书籍切换或同步后数据更新），重置为前两层展开
  useEffect(() => {
    setExpandedIds(collectFirstTwoLayerIds(tree));
  }, [tree]);

  // 构建 id → 子节点 id 列表的映射，用于折叠时删除后代
  const childMap = useMemo<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>();
    function traverse(nodes: readonly ChapterTreeNode[]) {
      for (const node of nodes) {
        map.set(node.id, node.children.map((c) => c.id));
        traverse(node.children);
      }
    }
    traverse(tree);
    return map;
  }, [tree]);

  // 所有节点 id 集合（用于 expandAll）
  const allIds = useMemo<string[]>(() => {
    const ids: string[] = [];
    function traverse(nodes: readonly ChapterTreeNode[]) {
      for (const node of nodes) {
        ids.push(node.id);
        traverse(node.children);
      }
    }
    traverse(tree);
    return ids;
  }, [tree]);

  // 将树转为 nodes + edges（只递归展开的节点的子节点）
  const { nodes, edges } = useMemo<{
    nodes: Node<ChapterNodeData>[];
    edges: Edge[];
  }>(() => {
    const resultNodes: Node<ChapterNodeData>[] = [];
    const resultEdges: Edge[] = [];

    function traverse(nodes: readonly ChapterTreeNode[], parentId: string | null) {
      for (const node of nodes) {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const nodeStats = stats?.[node.id];

        // 折叠时计算隐藏的后代数量
        const hiddenChildCount =
          hasChildren && !isExpanded
            ? countAllDescendants(node.id, childMap)
            : 0;

        resultNodes.push({
          id: node.id,
          type: 'chapterNode',
          position: { x: 0, y: 0 }, // dagre 后覆盖
          data: {
            title: node.title,
            level: node.level,
            hasChildren,
            isExpanded,
            highlightCount: nodeStats?.highlightCount ?? 0,
            noteCount: nodeStats?.noteCount ?? 0,
            hiddenChildCount,
          },
        });

        if (parentId) {
          resultEdges.push({
            id: `e-${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'smoothstep',
          });
        }

        // 只在展开状态下递归子节点
        if (hasChildren && isExpanded) {
          traverse(node.children, node.id);
        }
      }
    }

    traverse(tree, null);
    return { nodes: resultNodes, edges: resultEdges };
  }, [tree, expandedIds, stats, childMap]);

  // 用 dagre 计算布局
  const layouted = useMemo(
    () => getLayoutedElements(nodes, edges, direction),
    [nodes, edges, direction]
  );

  // 切换展开/折叠
  const toggleExpand = useCallback(
    (nodeId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          // 折叠：同时删除所有后代
          next.delete(nodeId);
          const descendants = collectDescendantIds(nodeId, childMap);
          descendants.forEach((id) => next.delete(id));
        } else {
          next.add(nodeId);
        }
        return next;
      });
    },
    [childMap]
  );

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(allIds));
  }, [allIds]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return {
    nodes: layouted.nodes,
    edges: layouted.edges,
    expandedIds,
    toggleExpand,
    expandAll,
    collapseAll,
  };
}
