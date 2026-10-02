interface RateLimitConfig {
  windowMs: number;
  maxEvents: number;
}

class SocketRateLimiter {
  // Key format: `${userId}:${action}` -> array of epoch timestamps
  private records = new Map<string, number[]>();

  constructor() {
    // Run garbage collection every 60 seconds to purge idle keys and save RAM
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.records.entries()) {
        const activeTimestamps = timestamps.filter((t) => now - t < 60000);
        if (activeTimestamps.length === 0) {
          this.records.delete(key);
        } else {
          this.records.set(key, activeTimestamps);
        }
      }
    }, 60000).unref(); // .unref() ensures this timer does not prevent process termination
  }

  /**
   * Consumes an action budget. Returns true if allowed, false if rate limited.
   */
  public checkLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const timestamps = this.records.get(key) || [];

    // Filter out timestamps outside the sliding window
    const windowStart = now - config.windowMs;
    const recentTimestamps = timestamps.filter((t) => t > windowStart);

    if (recentTimestamps.length >= config.maxEvents) {
      return false; // Exceeded budget
    }

    recentTimestamps.push(now);
    this.records.set(key, recentTimestamps);
    return true;
  }
}

export const socketLimiter = new SocketRateLimiter();