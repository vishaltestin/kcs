import { createHash } from "node:crypto";

import { headers } from "next/headers";

/**
 * Minimal in-memory rate limiter for server actions.
 *
 * Suitable for a single-instance deployment; swap for Redis/Upstash when
 * running multiple instances behind a load balancer.
 *
 * The map is bounded: buckets are swept once it grows past `MAX_BUCKETS`, so
 * an attacker cycling keys can't grow it without limit.
 */

const MAX_BUCKETS = 10_000;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Drop expired buckets; if still oversized, drop the ones expiring soonest. */
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
  if (buckets.size <= MAX_BUCKETS) return;

  const oldest = [...buckets.entries()]
    .sort((a, b) => a[1].resetAt - b[1].resetAt)
    .slice(0, buckets.size - MAX_BUCKETS);
  for (const [key] of oldest) buckets.delete(key);
}

/** Returns true when the request is within the limit, false when throttled. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Clears a bucket — call after a successful attempt (e.g. a good login). */
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is only trusted for its first hop, and only when it
 * parses as an IP — a header full of junk must not become a rate-limit key
 * every request (nor a way to dodge limits by rotating garbage).
 */
export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]!.trim();
    if (isIp(first)) return first;
  }
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp && isIp(realIp)) return realIp;
  return "unknown";
}

function isIp(value: string): boolean {
  return (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(value) ||
    /^[0-9a-f:]+$/i.test(value) // IPv6 (best effort; length-checked)
  );
}

export async function limitKey(action: string): Promise<string> {
  return `${action}:${await clientIp()}`;
}

/**
 * Per-account limiter key. The email is hashed so raw addresses never sit in
 * the bucket map (it is process memory, not a database, but still).
 */
export function accountKey(action: string, identifier: string): string {
  const digest = createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex").slice(0, 32);
  return `${action}:acct:${digest}`;
}
