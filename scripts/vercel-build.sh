#!/bin/bash
set -e

echo "=== DramaAI Build ==="

# 将 darma_ 前缀的 Neon 环境变量映射为 Prisma 所需的 DATABASE_URL / DIRECT_URL
# 注意：必须覆盖 .env 文件中的 SQLite URL（file:./db/custom.db），
# 否则 Prisma 会因 provider=postgresql 但 URL 不是 postgresql:// 而校验失败

# 检查 DATABASE_URL 是否为有效的 PostgreSQL URL
is_postgres_url() {
  [[ "$1" == postgresql://* ]] || [[ "$1" == postgres://* ]]
}

# 映射 DATABASE_URL
if is_postgres_url "$darma_POSTGRES_PRISMA_URL"; then
  export DATABASE_URL="$darma_POSTGRES_PRISMA_URL"
  echo "[Env] DATABASE_URL mapped from darma_POSTGRES_PRISMA_URL"
elif is_postgres_url "$darma_DATABASE_URL"; then
  export DATABASE_URL="$darma_DATABASE_URL"
  echo "[Env] DATABASE_URL mapped from darma_DATABASE_URL"
elif is_postgres_url "$darma_POSTGRES_URL"; then
  export DATABASE_URL="$darma_POSTGRES_URL"
  echo "[Env] DATABASE_URL mapped from darma_POSTGRES_URL"
fi

# 映射 DIRECT_URL
if is_postgres_url "$darma_POSTGRES_URL_NON_POOLING"; then
  export DIRECT_URL="$darma_POSTGRES_URL_NON_POOLING"
  echo "[Env] DIRECT_URL mapped from darma_POSTGRES_URL_NON_POOLING"
elif is_postgres_url "$darma_DATABASE_URL_UNPOOLED"; then
  export DIRECT_URL="$darma_DATABASE_URL_UNPOOLED"
  echo "[Env] DIRECT_URL mapped from darma_DATABASE_URL_UNPOOLED"
elif is_postgres_url "$darma_POSTGRES_URL"; then
  export DIRECT_URL="$darma_POSTGRES_URL"
  echo "[Env] DIRECT_URL mapped from darma_POSTGRES_URL"
fi

# 覆盖 .env 文件中的 SQLite URL，确保 Next.js 构建和运行时也能读取到正确的 PostgreSQL URL
if [ -f .env ] && is_postgres_url "$DATABASE_URL"; then
  echo "[Env] Overwriting .env with PostgreSQL URLs for Next.js build"
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env
  if is_postgres_url "$DIRECT_URL"; then
    sed -i "s|^DIRECT_URL=.*|DIRECT_URL=$DIRECT_URL|" .env
  fi
fi

echo "[Prisma] Generating client..."
npx prisma generate

echo "[Prisma] Pushing schema to database..."
npx prisma db push 2>/dev/null || echo "[Prisma] db push skipped (may already be up to date)"

echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
