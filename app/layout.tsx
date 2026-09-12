import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Snaplink — short links, real analytics',
  description:
    'Self-hosted URL shortener with real-time click analytics. Next.js 14 + Prisma + SQLite.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
