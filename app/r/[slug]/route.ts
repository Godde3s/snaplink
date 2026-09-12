import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { referrerBucket } from '@/lib/links'

export const dynamic = 'force-dynamic'

/**
 * GET /r/:slug — the redirect endpoint.
 * Records a visit (best-effort) and 302s to the destination.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const link = await db.link.findUnique({ where: { slug: params.slug } })
  if (!link) {
    return NextResponse.redirect(new URL('/?notfound=' + params.slug, req.url), 302)
  }

  // Never let analytics failure break the redirect.
  try {
    await db.visit.create({
      data: {
        linkId: link.id,
        referrer: referrerBucket(req.headers.get('referer')),
        userAgent: req.headers.get('user-agent')?.slice(0, 250) ?? null,
      },
    })
  } catch {
    /* analytics is best-effort */
  }

  return NextResponse.redirect(link.url, 302)
}
