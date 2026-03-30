import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接初始化
 *
 * 核心问题：Prisma schema 中 datasource.url = env("DATABASE_URL")
 * PrismaClient 构造器初始化时会验证这个值，即使传了 adapter 也绕不过。
 *
 * 方案：
 *   1. 运行前注入 DATABASE_URL（module-level）
 *   2. 构造器传 datasourceUrl 覆盖 schema 中的 env()
 *   3. 用户仍需在 Vercel 设 DATABASE_URL = TURSO_DATABASE_URL（最可靠）
 */

// ── 模块加载时立即注入 DATABASE_URL（赶在 PrismaClient 之前）──
const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (tursoUrl && tursoUrl.startsWith('libsql:')) {
  const current = process.env.DATABASE_URL
  if (!current || current === 'undefined' || current.length === 0) {
    process.env.DATABASE_URL = tursoUrl
  }
}

// ── 判断是否走 Turso ──
const useTurso = !!(tursoUrl && tursoUrl.startsWith('libsql:'))

function createPrismaClient(): PrismaClient {
  if (useTurso) {
    const libsql = createClient({
      url: tursoUrl!,
      authToken: tursoToken,
    })
    const adapter = new PrismaLibSql(libsql)

    // datasourceUrl 覆盖 schema 中的 env("DATABASE_URL")，彻底绕过验证
    return new PrismaClient({
      adapter,
      datasourceUrl: tursoUrl!,
    })
  }

  // 本地开发 SQLite
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && dbUrl !== 'undefined' && dbUrl.length > 0) {
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }

  throw new Error(
    '[DramaAI] 数据库未配置！\n' +
    '本地开发: 在 .env 中设置 DATABASE_URL=file:./db/custom.db\n' +
    'Vercel: 设置 DATABASE_URL 和 TURSO_DATABASE_URL 为同一个 libsql URL'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
