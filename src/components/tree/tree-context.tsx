'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

interface TreeContextValue {
  /** 已展开的节点 ID 集合 */
  expandedIds: Set<string>;
  /** 当前选中的节点 ID */
  selectedId: string | null;
  /** 切换节点展开/折叠状态 */
  toggleNode: (id: string) => void;
  /** 选中节点 */
  selectNode: (id: string) => void;
  /** 展开所有节点 */
  expandAll: (allIds: string[]) => void;
  /** 折叠所有节点 */
  collapseAll: () => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

export interface TreeProviderProps {
  children: React.ReactNode;
  /** 默认展开的第一级节点 ID 列表 */
  defaultExpandedIds?: string[];
}

/**
 * 树形组件状态提供者
 * 默认展开第一级节点
 */
export function TreeProvider({ children, defaultExpandedIds = [] }: TreeProviderProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const expandAll = useCallback((allIds: string[]) => {
    setExpandedIds(new Set(allIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <TreeContext.Provider
      value={{ expandedIds, selectedId, toggleNode, selectNode, expandAll, collapseAll }}
    >
      {children}
    </TreeContext.Provider>
  );
}

/**
 * 获取树形组件上下文
 */
export function useTreeContext(): TreeContextValue {
  const ctx = useContext(TreeContext);
  if (!ctx) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }
  return ctx;
}
