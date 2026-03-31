#!/bin/bash
set -e

echo "=== DramaAI Build ==="

# DATABASE_URL 可能是字面量 "undefined"，必须显式判断
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "undefined" ]; then
  export DATABASE_URL="file:/tmp/drama-ai.db"
fi

echo "[DB] DATABASE_URL=${DATABASE_URL}"

echo "[Prisma] Generating client..."
npx prisma generate

echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
