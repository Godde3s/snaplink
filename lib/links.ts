/** URL + slug validation and code generation. */

const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i
const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz'   // no 0/O/1/l — URL-safe when read aloud
export const MAX_URL_LENGTH = 2048

// Loopback/private/link-local targets. A public shortener has no legitimate
// reason to point at them, and doing so turns every redirect into a probe of
// the visitor's own machine or LAN.
const PRIVATE_HOST = /^(localhost|.*\.localhost|.*\.local|.*\.internal|0\.0\.0\.0|\[::1\]|\[?::\]?)$/i

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (PRIVATE_HOST.test(host)) return true
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    return false
  }
  // IPv6 literals: block loopback, unique-local (fc00::/7) and link-local (fe80::/10).
  if (host.startsWith('[') || host.includes(':')) {
    const bare = host.replace(/^\[|\]$/g, '')
    return bare === '::1' || bare === '::' || /^f[cd]/i.test(bare) || /^fe[89ab]/i.test(bare)
  }
  return false
}

export function isValidUrl(value: string): boolean {
  if (!value || value.length > MAX_URL_LENGTH) return false
  try {
    if (!URL_RE.test(value)) return false
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (parsed.username || parsed.password) return false   // no creds in the URL
    if (!parsed.hostname.includes('.')) return false
    if (isPrivateHost(parsed.hostname)) return false
    return true
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
