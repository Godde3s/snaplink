/** URL + slug validation and code generation. */

const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i
const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz'   // no 0/O/1/l — URL-safe when read aloud

export function isValidUrl(value: string): boolean {
  try {
    return URL_RE.test(value) && new URL(value).hostname.includes('.')
  } catch {
    return false
  }
}

/** Random, unambiguous short code (default 7 chars ≈ 78B combinations). */
export function generateSlug(length = 7): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function normalizeUrl(value: string): string {
  return value.trim()
}

export function referrerBucket(referrer: string | null | undefined): string {
  if (!referrer) return 'direct'
  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return 'other'
  }
}
