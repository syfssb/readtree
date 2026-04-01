'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type FlowTab = 'flow' | 'detail';

export interface FlowTabsProps {
  activeTab: FlowTab;
  onTabChange: (tab: FlowTab) => void;
  className?: string;
}

const TAB_CONFIG: { id: FlowTab; label: string }[] = [
  { id: 'flow', label: '树形图' },
  { id: 'detail', label: '章节详情' },
];

/**
 * Anthropic 风格 Pill Tab 切换组件
 *
 * 样式：外层胶囊背景 + 活跃 Tab 白色浮层
 */
export function FlowTabs({ activeTab, onTabChange, className }: FlowTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-full bg-[var(--color-secondary)] p-[3px]',
        className
      )}
    >
      {TAB_CONFIG.map(({ id, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              'px-4 py-1.5 rounded-full font-sans text-xs font-medium transition-all duration-200',
              isActive
                ? 'bg-[var(--color-card)] shadow-sm text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
