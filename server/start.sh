#!/bin/bash

# Startup script for Render.com deployment - Simple and Robust
# Goal: Start server FAST, skip database migration by default

echo "🚀 Starting Customer Support Agent on Render..."
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: ${PORT:-8000}"
echo "   PWD: $(pwd)"
echo "   Files in dist/: $(ls -1 dist/ 2>/dev/null | wc -l) items"

# Ensure we're in the server directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
echo "   Changed to: $(pwd)"

# Verify dist/index.js exists
if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: dist/index.js not found!"
  echo "   Expected at: $(pwd)/dist/index.js"
  echo "   Available files:"
  ls -la dist/ 2>/dev/null || echo "   dist/ directory missing"
  exit 1
fi

# CRITICAL: Clear DATABASE_URL if not explicitly production
# This prevents loading unreachable credentials from .env
if [ "$NODE_ENV" != "production" ]; then
  unset DATABASE_URL
  echo "ℹ️  Non-production mode - DATABASE_URL cleared"
fi

# Push schema to database (creates tables if they don't exist)
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Syncing database schema with prisma db push..."
  # Supabase pooler port 6543 (transaction mode) doesn't support DDL.
  # Use port 5432 (session mode) for schema push instead.
  MIGRATION_URL=$(echo "$DATABASE_URL" | sed 's/:6543/:5432/g')
  DATABASE_URL="$MIGRATION_URL" npx prisma db push --skip-generate 2>&1 || {
    echo "⚠️  prisma db push failed, but continuing server startup..."
  }
else
  echo "⚠️  DATABASE_URL not set - skipping schema sync"
fi

echo "✅ Starting Node.js server..."
echo "   Running: node dist/index.js"

# Start server directly with error output
# Use 2>&1 to capture stderr as well as stdout
exec node dist/index.js 2>&1
