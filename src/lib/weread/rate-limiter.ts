/**
 * 令牌桶（Token Bucket）限流器
 *
 * 以固定速率补充令牌，acquire() 在令牌耗尽时等待至下一个令牌可用。
 * 用于控制对 WeRead API 的请求频率，避免触发风控。
 */

export class RateLimiter {
  private readonly tokensPerSecond: number;
  private readonly maxTokens: number;
  private tokens: number;
  private lastRefillTime: number;

  /**
   * @param tokensPerSecond 每秒补充的令牌数，默认 2
   * @param maxTokens       令牌桶容量上限，默认 5
   */
  constructor(tokensPerSecond = 2, maxTokens = 5) {
    this.tokensPerSecond = tokensPerSecond;
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefillTime = Date.now();
  }

  /** 按照时间流逝补充令牌（不超过 maxTokens） */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000;
    const newTokens = elapsed * this.tokensPerSecond;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  /**
   * 获取一个令牌；令牌不足时等待至令牌可用后再返回。
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // 计算需要等待多少毫秒才能获得 1 个令牌
    const waitMs = Math.ceil(((1 - this.tokens) / this.tokensPerSecond) * 1000);
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));

    this.refill();
    this.tokens -= 1;
  }
}
