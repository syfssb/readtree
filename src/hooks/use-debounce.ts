import { useState, useEffect } from 'react';

/**
 * 防抖 Hook — 在值停止变化后指定延迟才更新返回值
 *
 * @param value 需要防抖的值
 * @param delay 防抖延迟（ms）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
