'use client'

import { useCallback, useEffect, useState } from 'react'

type Link = {
  id: string
  slug: string
  url: string
  title: string | null
  createdAt: string
  _count: { visits: number }
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [links, setLinks] = useState<Link[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/links')
    if (res.ok) setLinks((await res.json()).links)
  }, [])

  useEffect(() => { load() }, [load])

  async function shorten(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'something went wrong')
      setUrl(''); setTitle('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container">
      <h1>
        Snap<span className="accent">link</span>
      </h1>
      <p className="tagline">Short links, real analytics — self-hosted.</p>

      <form onSubmit={shorten} className="form">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/your/very/long/url"
          type="url"
          required
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Label (optional)"
          className="title-input"
        />
        <button disabled={busy} type="submit">
          {busy ? '…' : 'Shorten'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <section className="list">
        {links.map((l) => (
          <article key={l.id} className="card">
            <div className="card-head">
              <a href={`/r/${l.slug}`} target="_blank" rel="noreferrer" className="slug">
                /r/{l.slug}
              </a>
              <span className="clicks">{l._count.visits} clicks</span>
            </div>
            <p className="dest" title={l.url}>{l.url}</p>
            <a className="stats" href={`/api/links/${l.slug}/stats`}>view stats →</a>
          </article>
        ))}
        {links.length === 0 && (
          <p className="empty">No links yet — paste a URL above to create the first one.</p>
        )}
      </section>

      <footer className="footer">
        Built with Next.js 14, Prisma &amp; SQLite —{' '}
        <a href="https://github.com/Godde3s/snaplink">source on GitHub</a>
      </footer>
    </main>
  )
}
