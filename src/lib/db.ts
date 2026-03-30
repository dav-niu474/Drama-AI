import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * 数据库连接初始化
 *
 * 关键：Prisma schema 中 datasource.url = env("DATABASE_URL")
 * Prisma 客户端初始化时**始终**会解析这个值，哪怕是 adapter 模式。
 * 所以在 Vercel 上如果用户只配了 TURSO_DATABASE_URL，必须在此处
 * 提前注入 process.env.DATABASE_URL，否则 Prisma 直接报 URL_INVALID。
 */

// ── 预处理：Turso URL 注入到 DATABASE_URL ──
// 这样 Prisma schema 的 env("DATABASE_URL") 就不会拿到 undefined
const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (tursoUrl && tursoUrl.startsWith('libsql:')) {
  const dbUrl = process.env.DATABASE_URL
  // 仅在 DATABASE_URL 无效或缺失时覆盖
  if (!dbUrl || dbUrl === 'undefined' || dbUrl.startsWith('file:')) {
    process.env.DATABASE_URL = tursoUrl
  }
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL

  // ── 路径 1: Turso (libSQL 适配器) ──
  if (tursoUrl && tursoUrl.startsWith('libsql:')) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // ── 路径 2: 本地 SQLite ──
  if (dbUrl && dbUrl !== 'undefined' && dbUrl.length > 0) {
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }

  // ── 路径 3: 配置缺失 ──
  throw new Error(
    '[DramaAI] 数据库未配置！\n' +
    '本地开发: 在 .env 中设置 DATABASE_URL=file:./db/custom.db\n' +
    'Vercel部署: 在环境变量中设置 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN\n' +
    '注册 Turso: https://turso.tech (免费额度)'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
