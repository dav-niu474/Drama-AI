import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接
 *
 * 本地开发：DATABASE_URL=file:./db/custom.db → 直连 SQLite
 * Vercel：  TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → adapter 连 Turso
 *           构建时 DATABASE_URL=file:/tmp/drama-ai.db（占位，不实际使用）
 *
 * 重要：adapter 模式下不能传 datasourceUrl，连接由 adapter 管理。
 */

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

// 确保 DATABASE_URL 是合法的 file: URL（Prisma schema 验证需要）
const currentDbUrl = process.env.DATABASE_URL
if (!currentDbUrl || currentDbUrl === 'undefined' || currentDbUrl.length === 0) {
  process.env.DATABASE_URL = 'file:/tmp/drama-ai.db'
}

function createPrismaClient(): PrismaClient {
  // ── Turso (adapter 模式) ──
  if (tursoUrl && tursoUrl.startsWith('libsql:')) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
    const adapter = new PrismaLibSql(libsql)

    // adapter 模式只传 adapter，不传 datasourceUrl
    return new PrismaClient({ adapter })
  }

  // ── 本地 SQLite ──
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && dbUrl !== 'undefined' && dbUrl.length > 0) {
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }

  throw new Error(
    '[DramaAI] 数据库未配置！\n' +
    '本地开发: .env 中设置 DATABASE_URL=file:./db/custom.db\n' +
    'Vercel: 设置 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
