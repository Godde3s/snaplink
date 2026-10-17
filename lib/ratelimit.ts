/**
 * Minimal fixed-window rate limiter for the public create endpoint.
 *
 * A shortener is a free anonymous write API: without a limit one script can
 * fill the table with phishing links and burn the database. The counter lives
 * in process memory, which is exactly right for the single-instance / SQLite
 * setup this project targets; behind several replicas each instance keeps its
 * own window (still bounded, just looser).
 */

type Window = { count: number; resetAt: number }

const buckets = new Map<string, Window>()

export const CREATE_LIMIT = 10
export const CREATE_WINDOW_MS = 60_000

export type RateResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * Records one hit for `key` and reports whether it fits the window.
 * Expired entries are dropped as they are seen, so the map cannot grow
 * without bound on a busy node.
 */
export function checkRateLimit(
  key: string,
  limit: number = CREATE_LIMIT,
  windowMs: number = CREATE_WINDOW_MS,
  now: number = Date.now(),
): RateResult {
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }
  current.count += 1
  buckets.set(key, current)
  return { allowed: true, remaining: limit - current.count, retryAfterSec: 0 }
}

/** Test hook — clears every bucket. */
export function resetRateLimits(): void {
  buckets.clear()
}

/** Best-effort client IP for rate limiting behind a proxy. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip') ?? 'unknown'
}
