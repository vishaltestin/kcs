/**
 * URL validation for user-supplied links (tracking URLs, image paths, logos).
 *
 * `z.string().url()` accepts any scheme `new URL()` parses — including
 * `javascript:` and `data:` — so a tracking link rendered into an `<a href>`
 * could execute script. Everything that ends up in an href must go through
 * `isHttpUrl`; everything that ends up in an `img src` or `href` path must go
 * through `isSafeAssetPath`.
 */

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

/** True for absolute http(s) URLs only. */
export function isHttpUrl(value: string): boolean {
  if (!value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return HTTP_PROTOCOLS.has(url.protocol) && Boolean(url.hostname);
}

/**
 * True for in-app asset paths: "/uploads/x.webp", "/api/uploads/x.webp".
 * Rejects protocol-relative ("//evil.com"), traversal ("/../"), and any
 * value containing a scheme or an encoded scheme.
 */
export function isSafeAssetPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  const lower = value.toLowerCase();
  if (lower.includes("..")) return false;
  if (lower.includes("\\")) return false;
  // No scheme smuggled in after normalisation, and no encoded separators.
  if (/^\/[a-z0-9+.-]+:/i.test(value)) return false;
  if (/%2e%2e|%2f%2f|%3a%2f%2f/i.test(value)) return false;
  return true;
}

/** Absolute http(s) URL or an in-app "/…" asset path (either is acceptable). */
export function isHttpUrlOrAssetPath(value: string): boolean {
  return isHttpUrl(value) || isSafeAssetPath(value);
}

/**
 * Sanitises a `?next=` return path.
 *
 * `window.location.assign(next)` with `next=//evil.com` is a protocol-relative
 * hop off-site, so only same-origin in-app paths are allowed through; anything
 * else falls back to `fallback`.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !isSafeAssetPath(value)) return fallback;
  return value;
}
