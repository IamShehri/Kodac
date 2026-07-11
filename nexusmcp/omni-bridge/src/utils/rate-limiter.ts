// OmniBridge — Distributed Rate Limiter
// Per-tenant request rate limiting. Supports Redis backend for multi-instance deployments.

import { Redis } from 'ioredis';

export interface RateLimitConfig {
  windowMs: number;
  max: number; // requests per window
  skipSuccessfulRequests?: boolean;
}

export class RateLimiter {
  private redis?: Redis;
  private memoryStore: Map<string, { count: number; resetAt: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 2000),
      });
    }
  }

  async check(tenantId: string): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
    // Reuse memory store if no Redis (development mode)
    const key = `omni:ratelimit:${tenantId}`;
    const now = Date.now();
    const windowEnd = now % this.config.windowMs === 0 ? now + this.config.windowMs : now + (this.config.windowMs - (now % this.config.windowMs));

    if (this.redis) {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.pexpire(key, this.config.windowMs);
      }
      const ttl = await this.redis.pttl(key);
      return {
        allowed: count <= this.config.max,
        remaining: Math.max(0, this.config.max - count),
        resetMs: ttl > 0 ? ttl : this.config.windowMs,
      };
    }

    // Memory-backed implementation (dev only — NOT suitable for multi-instance production)
    const current = this.memoryStore.get(key);
    if (!current || current.resetAt <= now) {
      this.memoryStore.set(key, { count: 1, resetAt: windowEnd });
      return { allowed: true, remaining: this.config.max - 1, resetMs: windowEnd - now };
    }

    if (current.count >= this.config.max) {
      return { allowed: false, remaining: 0, resetMs: current.resetAt - now };
    }

    current.count++;
    return {
      allowed: true,
      remaining: this.config.max - current.count,
      resetMs: current.resetAt - now,
    };
  }

  async recordSuccess(tenantId: string): Promise<void> {
    if (!this.config.skipSuccessfulRequests && this.redis) {
      // Could decrement here if skipSuccessfulRequests was enabled; keeping simple for v0.1
    }
  }

  async reset(tenantId: string): Promise<void> {
    const key = `omni:ratelimit:${tenantId}`;
    if (this.redis) {
      await this.redis.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }
}
