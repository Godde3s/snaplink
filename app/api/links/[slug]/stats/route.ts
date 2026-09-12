import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/links/:slug/stats → totals + last 14 days + top referrers. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const link = await db.link.findUnique({ where: { slug: params.slug } })
  if (!link) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000)
  const [total, visits, referrerRows] = await Promise.all([
    db.visit.count({ where: { linkId: link.id } }),
    db.visit.findMany({
      where: { linkId: link.id, createdAt: { gte: since } },
      select: { createdAt: true, referrer: true },
    }),
    db.visit.groupBy({
      by: ['referrer'],
      where: { linkId: link.id },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 5,
    }),
  ])

  // bucket per day (UTC) for the sparkline
  const byDay: Record<string, number> = {}
  for (const v of visits) {
    const key = v.createdAt.toISOString().slice(0, 10)
    byDay[key] = (byDay[key] ?? 0) + 1
  }

  return NextResponse.json({
    link: { slug: link.slug, url: link.url, title: link.title },
    total,
    byDay,
    topReferrers: referrerRows.map((r) => ({
      referrer: r.referrer ?? 'direct',
      count: r._count.referrer,
    })),
  })
}
