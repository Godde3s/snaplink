import { describe, expect, it } from 'vitest'
import { MAX_URL_LENGTH, generateSlug, isValidUrl, referrerBucket } from '@/lib/links'
import { CREATE_LIMIT, checkRateLimit, resetRateLimits } from '@/lib/ratelimit'

describe('isValidUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://sub.domain.io/a/b?x=1#frag')).toBe(true)
  })
  it('rejects junk, relative URLs and non-http schemes', () => {
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('/relative/path')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
    expect(isValidUrl('ftp://files.example.com')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
  it('rejects credentials, private hosts and oversized URLs', () => {
    expect(isValidUrl('https://user:pass@example.com')).toBe(false)
    expect(isValidUrl('http://localhost:3000/internal')).toBe(false)
    expect(isValidUrl('http://127.0.0.1/admin')).toBe(false)
    expect(isValidUrl('http://10.0.0.5/')).toBe(false)
    expect(isValidUrl('http://172.20.1.1/')).toBe(false)
    expect(isValidUrl('http://192.168.1.1/')).toBe(false)
    expect(isValidUrl('http://169.254.169.254/latest/meta-data')).toBe(false)
    expect(isValidUrl('http://[::1]/')).toBe(false)
    expect(isValidUrl(`https://example.com/${'a'.repeat(MAX_URL_LENGTH)}`)).toBe(false)
  })
})

describe('checkRateLimit', () => {
  it('allows up to the limit then blocks with a retry hint', () => {
    resetRateLimits()
    const now = 1_000_000
    for (let i = 0; i < CREATE_LIMIT; i++) {
      expect(checkRateLimit('1.2.3.4', CREATE_LIMIT, 60_000, now).allowed).toBe(true)
    }
    const blocked = checkRateLimit('1.2.3.4', CREATE_LIMIT, 60_000, now)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it('keeps clients isolated and expires the window', () => {
    resetRateLimits()
    const now = 2_000_000
    for (let i = 0; i < CREATE_LIMIT; i++) checkRateLimit('a', CREATE_LIMIT, 60_000, now)
    expect(checkRateLimit('a', CREATE_LIMIT, 60_000, now).allowed).toBe(false)
    expect(checkRateLimit('b', CREATE_LIMIT, 60_000, now).allowed).toBe(true)
    expect(checkRateLimit('a', CREATE_LIMIT, 60_000, now + 60_001).allowed).toBe(true)
  })
})

describe('generateSlug', () => {
  it('produces only unambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug()
      expect(slug).toMatch(/^[23456789abcdefghijkmnpqrstuvwxyz]{7}$/)
    }
  })
  it('honors custom length and is random', () => {
    expect(generateSlug(10)).toHaveLength(10)
    expect(generateSlug()).not.toBe(generateSlug())
  })
})

describe('referrerBucket', () => {
  it('buckets hostnames and direct traffic', () => {
    expect(referrerBucket('https://www.google.com/search?q=x')).toBe('google.com')
    expect(referrerBucket(null)).toBe('direct')
    expect(referrerBucket('garbage')).toBe('other')
  })
})
