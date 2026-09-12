import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSlug, isValidUrl, normalizeUrl } from '@/lib/links'

export const dynamic = 'force-dynamic'

/** POST /api/links  { url, title? } → { link } */
export async function POST(req: NextRequest) {
  let body: { url?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const url = normalizeUrl(body.url ?? '')
  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: 'url must be a valid absolute http(s) URL' },
      { status: 400 },
    )
  }

  // retry on the (astronomically rare) slug collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug()
    try {
      const link = await db.link.create({
        data: { slug, url, title: body.title?.slice(0, 120) || null },
      })
      return NextResponse.json({ link }, { status: 201 })
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code !== 'P2002') throw e        // P2002 = unique constraint
    }
  }
  return NextResponse.json({ error: 'could not allocate slug' }, { status: 500 })
}

/** GET /api/links → dashboard feed with per-link click totals. */
export async function GET() {
  const links = await db.link.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { visits: true } } },
  })
  return NextResponse.json({ links })
}
