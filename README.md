# Snaplink

<p align="center">
  <strong>Short links, real analytics — a self-hosted URL shortener<br>
  with per-click stats, referrer buckets and 14-day trends.</strong>
</p>

<p align="center">
  Next.js 14 (App Router) · TypeScript · Prisma · SQLite · Tailwind CSS
</p>

---

## Why

Every "free" link shortener trades your data for the privilege. Snaplink
is a complete, self-hosted alternative you can read line by line: a
**full-stack Next.js app** where the same codebase serves the API, the
redirect edge and the dashboard. It is intentionally small enough to
understand in one sitting and real enough to run for a community.

## Features

- 🔗 **Shorten any URL** — 7-char slugs from an ambiguity-free alphabet
  (no `0/O/1/l`), collision-safe creation with retry
- 📊 **Click analytics** — per-link totals, top referrers, 14-day buckets
- ⚡ **Fast redirect path** — `/r/:slug` records the visit best-effort and
  302s immediately; analytics can never break a redirect
- 🗄 **SQLite by default** — zero setup; switch to Postgres by changing one
  Prisma provider line
- 🎨 **Tailwind UI** — dark, keyboard-friendly, responsive

## Quick start

```bash
git clone https://github.com/Godde3s/snaplink && cd snaplink
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db"
npm run db:push               # create tables
npm run dev                   # → http://localhost:3000
```

Create a link from the terminal:

```bash
curl -X POST localhost:3000/api/links \
  -H 'content-type: application/json' \
  -d '{"url":"https://github.com/Godde3s","title":"my github"}'
# {"link":{"slug":"k7mp2ax","url":"https://github.com/Godde3s",...}}

curl -I localhost:3000/r/k7mp2ax              # → 302 with a visit recorded
curl localhost:3000/api/links/k7mp2ax/stats   # → totals, byDay, topReferrers
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/links` | Create a short link `{url, title?}` |
| `GET` | `/api/links` | Dashboard feed with click counts |
| `GET` | `/r/:slug` | Redirect + visit recording |
| `GET` | `/api/links/:slug/stats` | Totals, 14-day histogram, top referrers |

## Design notes

- **Slug safety** — `crypto.getRandomValues` over a 32-char alphabet:
  7 chars ≈ 34 billion combinations, all read-aloud-safe.
- **Validation** — only absolute `http(s)` URLs with a real hostname;
  `javascript:` and friends are rejected before the database.
- **Analytics as a side-effect** — the redirect route isolates visit
  recording in try/catch: metrics degrade silently, links never break.
- **One-line production switch** — Prisma's provider abstraction means
  Postgres is a config change, not a rewrite.

## Testing

```bash
npm test          # vitest: URL validation, slug generation, referrer bucketing
npx tsc --noEmit  # strict type check
```

## Roadmap

- [ ] QR codes per link
- [ ] Optional auth (single-admin mode)
- [ ] UTM campaign reports
- [ ] Docker image + one-click deploy templates

## License

MIT © Reza Bazdar (Godde3s)
