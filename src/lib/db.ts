import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// 检测运行环境
const isVercel = !!process.env.VERCEL

// Turso 环境变量是否存在
const hasTursoUrl = !!(
  process.env.TURSO_DATABASE_URL &&
  process.env.TURSO_DATABASE_URL.startsWith('libsql:')
)

// 本地 DATABASE_URL 是否有效（非 undefined、非空）
const hasLocalDb = !!(
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== 'undefined' &&
  process.env.DATABASE_URL.length > 0
)

function createPrismaClient(): PrismaClient {
  // ── 路径 1: Turso (Vercel 生产环境推荐) ──
  if (isVercel || hasTursoUrl) {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL
    if (!url || url === 'undefined') {
      throw new Error(
        '[DramaAI] 数据库配置缺失！\n' +
        'Vercel 部署需要配置 Turso 数据库。请在 Vercel 项目设置中添加以下环境变量：\n' +
        '  TURSO_DATABASE_URL = libsql://your-db-name-your-org.turso.io\n' +
        '  TURSO_AUTH_TOKEN = your-auth-token\n' +
        '注册 Turso: https://turso.tech (免费额度足够使用)\n' +
        '创建数据库: turso db create drama-ai\n' +
        '获取连接URL: turso db show drama-ai --url\n' +
        '生成认证Token: turso db tokens create drama-ai'
      )
    }

    const libsql = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // ── 路径 2: 本地开发 SQLite ──
  if (hasLocalDb) {
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }

  // ── 路径 3: 都没有 → 报错 ──
  throw new Error(
    '[DramaAI] DATABASE_URL 未配置！\n' +
    '请复制 .env.example 为 .env 并设置 DATABASE_URL：\n' +
    '  本地开发: DATABASE_URL=file:./db/custom.db\n' +
    '  Vercel部署: 配置 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
