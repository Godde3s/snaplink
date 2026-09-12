import { describe, expect, it } from 'vitest'
import { generateSlug, isValidUrl, referrerBucket } from '@/lib/links'

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
