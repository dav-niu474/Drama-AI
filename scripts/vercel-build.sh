#!/bin/bash
set -e

echo "=== DramaAI Build ==="

# 确保 DATABASE_URL 是合法的 file: URL
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "undefined" ]; then
  export DATABASE_URL="file:/tmp/drama-ai.db"
fi

echo "[Prisma] Generating client..."
npx prisma generate

echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
