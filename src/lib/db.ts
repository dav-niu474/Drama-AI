import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接
 *
 * 本地：DATABASE_URL=file:./db/custom.db → 直连 SQLite
 * Vercel：TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → adapter 连 Turso
 */

// 三重防御：next.config.ts 构建注入、db.ts 模块加载、createClient 调用前
const dbUrl = process.env.DATABASE_URL
if (!dbUrl || dbUrl === 'undefined') {
  process.env.DATABASE_URL = 'file:/tmp/drama-ai.db'
}

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

function createPrismaClient(): PrismaClient {
  // ── Turso ──
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
