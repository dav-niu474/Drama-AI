import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// 判断是否使用 Turso（Vercel 部署环境）
const isTurso = !!process.env.TURSO_DATABASE_URL || (process.env.DATABASE_URL?.startsWith('libsql:'))

function createPrismaClient() {
  if (isTurso) {
    // Vercel / Turso 环境：使用 libSQL adapter
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  } else {
    // 本地开发：直接使用 SQLite
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
