import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const diagnostics: Record<string, unknown> = {};

  // 检查环境变量映射
  diagnostics.envMapping = {
    DATABASE_URL: process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.substring(0, 30)}...)` : "NOT SET",
    DIRECT_URL: process.env.DIRECT_URL ? `set (${process.env.DIRECT_URL.substring(0, 30)}...)` : "NOT SET",
    darma_POSTGRES_PRISMA_URL: process.env.darma_POSTGRES_PRISMA_URL ? `set (${process.env.darma_POSTGRES_PRISMA_URL.substring(0, 30)}...)` : "NOT SET",
    darma_POSTGRES_URL_NON_POOLING: process.env.darma_POSTGRES_URL_NON_POOLING ? `set (${process.env.darma_POSTGRES_URL_NON_POOLING.substring(0, 30)}...)` : "NOT SET",
    darma_DATABASE_URL: process.env.darma_DATABASE_URL ? `set (${process.env.darma_DATABASE_URL.substring(0, 30)}...)` : "NOT SET",
    darma_DATABASE_URL_UNPOOLED: process.env.darma_DATABASE_URL_UNPOOLED ? `set (${process.env.darma_DATABASE_URL_UNPOOLED.substring(0, 30)}...)` : "NOT SET",
  };

  // 测试数据库连接
  try {
    await db.$connect();
    diagnostics.dbConnect = "SUCCESS";
  } catch (error: unknown) {
    diagnostics.dbConnect = "FAILED";
    diagnostics.dbConnectError = error instanceof Error ? error.message : String(error);
  }

  // 测试查询
  try {
    const count = await db.dramaProject.count();
    diagnostics.queryTest = "SUCCESS";
    diagnostics.projectCount = count;
  } catch (error: unknown) {
    diagnostics.queryTest = "FAILED";
    diagnostics.queryError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
