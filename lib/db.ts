import { PrismaClient } from '@prisma/client'

// Prisma promotes hot-reloading in dev to exhaust database connections;
// the singleton pattern below is the documented fix.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
