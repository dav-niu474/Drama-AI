#!/bin/bash
set -e

echo "=== DramaAI Build ==="

# 将 darma_ 前缀的 Neon 环境变量映射为 Prisma 所需的 DATABASE_URL / DIRECT_URL
if [ -n "$darma_POSTGRES_PRISMA_URL" ] && [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="$darma_POSTGRES_PRISMA_URL"
  echo "[Env] DATABASE_URL mapped from darma_POSTGRES_PRISMA_URL"
fi
if [ -n "$darma_POSTGRES_URL_NON_POOLING" ] && [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="$darma_POSTGRES_URL_NON_POOLING"
  echo "[Env] DIRECT_URL mapped from darma_POSTGRES_URL_NON_POOLING"
fi

# 兜底：如果有 darma_DATABASE_URL 但没有上面两个
if [ -z "$DATABASE_URL" ] && [ -n "$darma_DATABASE_URL" ]; then
  export DATABASE_URL="$darma_DATABASE_URL"
  echo "[Env] DATABASE_URL mapped from darma_DATABASE_URL"
fi
if [ -z "$DIRECT_URL" ] && [ -n "$darma_DATABASE_URL_UNPOOLED" ]; then
  export DIRECT_URL="$darma_DATABASE_URL_UNPOOLED"
  echo "[Env] DIRECT_URL mapped from darma_DATABASE_URL_UNPOOLED"
fi

echo "[Prisma] Generating client..."
npx prisma generate

echo "[Prisma] Pushing schema to database..."
npx prisma db push 2>/dev/null || echo "[Prisma] db push skipped (may already be up to date)"

echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
