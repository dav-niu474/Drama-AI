/**
 * Next.js Instrumentation
 * 在所有 serverless 函数执行之前运行，确保 DATABASE_URL 有效。
 *
 * Prisma 原生引擎在读取 env("DATABASE_URL") 时要求合法的 file: URL。
 * Vercel 上如果 DATABASE_URL 未设置或是字面量 "undefined"，会导致校验失败。
 * 这里提前修正，保证 Prisma 拿到合法值。
 */
export async function register() {
  const url = process.env.DATABASE_URL
  if (!url || url === 'undefined' || url.length === 0) {
    process.env.DATABASE_URL = 'file:/tmp/drama-ai.db'
  }
}
