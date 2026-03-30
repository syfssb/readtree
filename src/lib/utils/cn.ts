/**
 * 合并 Tailwind CSS 类名的工具函数
 * 过滤掉 falsy 值，返回空格分隔的类名字符串
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
