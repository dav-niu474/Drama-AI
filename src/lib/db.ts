import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// 在 Vercel 环境中，将 darma_ 前缀的 Neon 环境变量映射为 Prisma 所需的 DATABASE_URL / DIRECT_URL
// 这必须在 PrismaClient 实例化之前执行
// 注意：需要检查 DATABASE_URL 是否为有效的 PostgreSQL URL，
// 因为 .env 文件中的 DATABASE_URL=file:./db/custom.db（SQLite）会被 Next.js 加载，
// 导致 Prisma 校验失败（schema 配置的是 postgresql provider）

function isPostgresUrl(url: string | undefined): boolean {
  return !!url && (url.startsWith('postgresql://') || url.startsWith('postgres://'))
}

// 映射 DATABASE_URL（仅当当前值不是有效的 PostgreSQL URL 时才覆盖）
if (!isPostgresUrl(process.env.DATABASE_URL)) {
  if (process.env.darma_POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.darma_POSTGRES_PRISMA_URL
  } else if (process.env.darma_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.darma_DATABASE_URL
  } else if (process.env.darma_POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.darma_POSTGRES_URL
  }
}

// 映射 DIRECT_URL（仅当当前值不是有效的 PostgreSQL URL 时才覆盖）
if (!isPostgresUrl(process.env.DIRECT_URL)) {
  if (process.env.darma_POSTGRES_URL_NON_POOLING) {
    process.env.DIRECT_URL = process.env.darma_POSTGRES_URL_NON_POOLING
  } else if (process.env.darma_DATABASE_URL_UNPOOLED) {
    process.env.DIRECT_URL = process.env.darma_DATABASE_URL_UNPOOLED
  } else if (isPostgresUrl(process.env.darma_POSTGRES_URL)) {
    // 如果没有 non-pooling URL，使用 pooling URL 作为 fallback
    process.env.DIRECT_URL = process.env.darma_POSTGRES_URL
  }
}

// ── z-ai-web-dev-sdk 配置文件自动生成 ──────────────────────────
// z-ai-web-dev-sdk 的 ZAI.create() 从 .z-ai-config 文件读取配置，搜索路径：
//   1. cwd/.z-ai-config  (Vercel: /var/task — 只读)
//   2. ~/.z-ai-config    (Vercel: /home/... — 可能只读)
//   3. /etc/.z-ai-config (只读)
// 解决方案：将 HOME 环境变量重写为 /tmp，然后在 /tmp 写入配置文件。
// 这样 SDK 的路径 2 就变成 /tmp/.z-ai-config，可以正常读写。
if (process.env.ZAI_API_KEY) {
  try {
    // Redirect home directory to /tmp so SDK can find the config there
    const configDir = '/tmp'
    if (process.env.HOME !== configDir) {
      process.env.HOME = configDir
    }
    const config = {
      baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai',
      apiKey: process.env.ZAI_API_KEY,
    }
    writeFileSync(join(configDir, '.z-ai-config'), JSON.stringify(config), 'utf-8')
  } catch {
    // Silently ignore — if write fails, ZAI.create() will throw its own error
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
