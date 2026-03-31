/**
 * 数据库环境变量预处理
 *
 * 必须在任何 import '@prisma/client' 之前被导入。
 * 单独文件确保 ES module 的 import 顺序：本文件 → db.ts → @prisma/client
 *
 * 解决问题：Vercel 上 DATABASE_URL 可能是字面量 "undefined"、空字符串、或缺失，
 * Prisma 引擎在校验时直接报 URL_INVALID。
 */

const dbUrl = process.env.DATABASE_URL

if (!dbUrl || dbUrl === 'undefined' || dbUrl.length === 0) {
  // 占位 URL — Prisma schema provider=sqlite 要求 file: 开头
  // 实际 Turso 连接由 adapter 管理，此值不会被使用
  process.env.DATABASE_URL = 'file:/tmp/drama-ai.db'
}
