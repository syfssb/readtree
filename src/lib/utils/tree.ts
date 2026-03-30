import type { Chapter, ChapterTreeNode } from '@/types/chapter';

/**
 * 将扁平章节列表构建为树形结构
 *
 * 算法：栈式遍历，按 orderIndex 排序后，根据 level 维护祖先栈，
 * 处理 level 不连续的情况（如从 1 直接跳到 3）。
 *
 * @param chapters 按 orderIndex 排序的扁平章节列表
 * @returns 树形章节节点数组（仅包含顶级节点）
 */
export function buildChapterTree(chapters: Chapter[]): ChapterTreeNode[] {
  const sorted = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  const roots: ChapterTreeNode[] = [];

  // stack[i] 存储 level = i+1 的最近节点（可变，构建阶段临时结构）
  const stack: Array<{ node: ChapterTreeNode; mutableChildren: ChapterTreeNode[] }> = [];

  for (const chapter of sorted) {
    const mutableChildren: ChapterTreeNode[] = [];
    const node: ChapterTreeNode = {
      ...chapter,
      get children() {
        return mutableChildren as readonly ChapterTreeNode[];
      },
    };

    // 找到合适的父节点：弹出 level >= 当前 level 的节点
    while (stack.length > 0 && stack[stack.length - 1].node.level >= chapter.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // 没有父节点，作为根节点
      roots.push(node);
    } else {
      // 添加到最近祖先节点的 children
      stack[stack.length - 1].mutableChildren.push(node);
    }

    stack.push({ node, mutableChildren });
  }

  return roots;
}

/**
 * 将树形结构展平为顺序列表（前序遍历）
 *
 * @param tree 树形章节节点数组
 * @returns 展平后的章节列表
 */
export function flattenTree(tree: ChapterTreeNode[]): Chapter[] {
  const result: Chapter[] = [];

  function traverse(nodes: readonly ChapterTreeNode[]): void {
    for (const node of nodes) {
      const { children: _children, ...chapter } = node;
      result.push(chapter as Chapter);
      traverse(node.children);
    }
  }

  traverse(tree);
  return result;
}

/**
 * 在树中根据 ID 查找节点（深度优先）
 *
 * @param tree 树形章节节点数组
 * @param id   目标节点 ID
 * @returns 找到的节点，未找到返回 null
 */
export function findNodeById(
  tree: ChapterTreeNode[],
  id: string
): ChapterTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNodeById(node.children as ChapterTreeNode[], id);
    if (found) return found;
  }
  return null;
}
