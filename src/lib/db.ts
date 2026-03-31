import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接
 *
 * 本地开发：DATABASE_URL=file:./db/custom.db → 直连 SQLite
 * Vercel：  TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → adapter 连 Turso
 *           DATABASE_URL 由 next.config.ts 注入兜底值 file:/tmp/drama-ai.db
 *           （仅用于 Prisma 原生引擎校验，adapter 覆盖实际连接）
 */

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

function createPrismaClient(): PrismaClient {
  // ── Turso (adapter 模式) ──
  if (tursoUrl && tursoUrl.startsWith('libsql:')) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // ── 本地 SQLite ──
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
