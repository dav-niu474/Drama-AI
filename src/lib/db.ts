import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接
 *
 * 关键约束：Prisma schema provider=sqlite 时，env("DATABASE_URL") 必须是
 * 合法的 file: URL，否则构造器直接报错。即使用了 adapter 也绕不过这个验证。
 *
 * 方案：
 *   本地开发  DATABASE_URL=file:./db/custom.db → 直连 SQLite（不需要 adapter）
 *   Vercel    用户配 TURSO_DATABASE_URL        → adapter 连 Turso
 *             但仍需设 DATABASE_URL=file:/tmp/drama-ai.db 作为占位符
 *             （仅让 Prisma 构造器通过验证，实际连接走 adapter）
 */

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

// ── 预处理：确保 DATABASE_URL 合法 ──
// Vercel 上如果用户只配了 TURSO_DATABASE_URL，补一个 file: 占位 URL
const currentDbUrl = process.env.DATABASE_URL
if ((!currentDbUrl || currentDbUrl === 'undefined' || currentDbUrl.length === 0) && tursoUrl) {
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

    // datasourceUrl 覆盖 schema 中的 env("DATABASE_URL")
    // 传一个合法的 libsql: URL，这样 Prisma 构造器验证能通过
    return new PrismaClient({
      adapter,
      datasourceUrl: tursoUrl,
    })
  }

  // ── 本地 SQLite ──
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && dbUrl !== 'undefined' && dbUrl.length > 0 && dbUrl.startsWith('file:')) {
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }

  throw new Error(
    '[DramaAI] 数据库未配置！\n' +
    '本地开发: 在 .env 中设置 DATABASE_URL=file:./db/custom.db\n' +
    'Vercel: 设置 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN\n' +
    '同时设置 DATABASE_URL=file:/tmp/drama-ai.db（占位，实际走 Turso）'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
