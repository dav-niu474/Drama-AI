import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接
 *
 * 本地开发：DATABASE_URL=file:./db/custom.db → 直连 SQLite
 * Vercel：  TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → adapter 连 Turso
 *
 * Vercel 部署时，构建脚本将 schema 中 env("DATABASE_URL") 替换为硬编码
 * file:/tmp/drama-ai.db。生成的 Prisma 客户端内嵌此值，原生引擎校验通过。
 * 实际连接由 adapter 管理，硬编码值不参与连接。
 */

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

function createPrismaClient(): PrismaClient {
  // ── Turso (adapter) ──
  if (tursoUrl && tursoUrl.startsWith('libsql:')) {
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
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
