import { headers } from "next/headers";

/**
 * Minimal in-memory rate limiter for server actions.
 *
 * Suitable for a single-instance deployment; swap for Redis/Upstash when
 * running multiple instances behind a load balancer.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Returns true when the request is within the limit, false when throttled. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/** Best-effort client IP from forwarded headers (used for limit keys). */
export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function limitKey(action: string): Promise<string> {
  return `${action}:${await clientIp()}`;
}
