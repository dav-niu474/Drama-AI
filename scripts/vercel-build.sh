#!/bin/bash
set -e

echo "=== DramaAI Build ==="

echo "[Prisma] Generating client..."
npx prisma generate

echo "[Prisma] Pushing schema to database..."
npx prisma db push --accept-data-loss 2>/dev/null || echo "[Prisma] db push skipped (may already be up to date)"

echo "[Next] Building..."
npx next build

echo "=== Build Complete ==="
