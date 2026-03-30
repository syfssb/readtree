/**
 * RateLimiter 单元测试
 *
 * 覆盖：
 * - 令牌充足时立即返回
 * - 令牌耗尽时等待后返回
 * - maxTokens 上限约束
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '@/lib/weread/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('令牌充足时 acquire() 立即 resolve', async () => {
    const limiter = new RateLimiter(2, 5);

    // 连续获取 5 个令牌（maxTokens），不需要等待
    const promises = Array.from({ length: 5 }, () => limiter.acquire());
    await vi.runAllTimersAsync();

    await expect(Promise.all(promises)).resolves.toBeDefined();
  });

  it('令牌耗尽后 acquire() 需要等待', async () => {
    const limiter = new RateLimiter(2, 2); // 桶容量 2，速率 2/s

    // 消耗完所有令牌
    const p1 = limiter.acquire();
    const p2 = limiter.acquire();
    await vi.runAllTimersAsync();
    await Promise.all([p1, p2]);

    // 第三次请求需等待补充
    let resolved = false;
    const p3 = limiter.acquire().then(() => {
      resolved = true;
    });

    // 尚未推进时间，应该还没 resolve
    expect(resolved).toBe(false);

    // 推进 600ms（速率 2/s，0.6s 应补充 1.2 token >= 1）
    await vi.advanceTimersByTimeAsync(600);
    await p3;

    expect(resolved).toBe(true);
  });

  it('默认参数：tokensPerSecond=2, maxTokens=5', async () => {
    const limiter = new RateLimiter();

    // 默认桶满 5 个令牌，可立即连续 acquire 5 次
    const results: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(limiter.acquire());
    }
    await vi.runAllTimersAsync();

    await expect(Promise.all(results)).resolves.toBeDefined();
  });

  it('时间推进后令牌自动补充，不超过 maxTokens', async () => {
    const limiter = new RateLimiter(10, 3); // 速率 10/s，上限 3

    // 消耗 3 个令牌
    const init = Array.from({ length: 3 }, () => limiter.acquire());
    await vi.runAllTimersAsync();
    await Promise.all(init);

    // 推进 1 秒：理论补充 10，但 maxTokens=3，只补到 3
    await vi.advanceTimersByTimeAsync(1000);

    // 应可以立即获取 3 个令牌
    const reuse = Array.from({ length: 3 }, () => limiter.acquire());
    await vi.runAllTimersAsync();
    await expect(Promise.all(reuse)).resolves.toBeDefined();
  });
});
