import { PrismaClient } from '@prisma/client'

// 在 Vercel 环境中，将 darma_ 前缀的 Neon 环境变量映射为 Prisma 所需的 DATABASE_URL / DIRECT_URL
// 这必须在 PrismaClient 实例化之前执行
if (!process.env.DATABASE_URL && process.env.darma_POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.darma_POSTGRES_PRISMA_URL
}
if (!process.env.DATABASE_URL && process.env.darma_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.darma_DATABASE_URL
}
if (!process.env.DIRECT_URL && process.env.darma_POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_URL = process.env.darma_POSTGRES_URL_NON_POOLING
}
if (!process.env.DIRECT_URL && process.env.darma_DATABASE_URL_UNPOOLED) {
  process.env.DIRECT_URL = process.env.darma_DATABASE_URL_UNPOOLED
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
