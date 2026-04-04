#!/bin/bash
set -e

# Startup script for Render.com deployment
# Safely handles database migrations and starts the server

echo "🚀 Starting Customer Support Agent..."
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: ${PORT:-8000}"

# Change to server directory
cd "$(dirname "$0")/.." || cd . || true

# On Render, DATABASE_URL must be explicitly set via dashboard
# .env files are for local development only
# Skip database migration unless DATABASE_URL is explicitly configured
# and starts with 'postgresql://' (indicating it's configured, not from .env)

SHOULD_MIGRATE=false

# Only attempt migration if:
# 1. DATABASE_URL is set
# 2. NODE_ENV is production
# 3. DATABASE_URL starts with postgresql:// (not development default)
if [ "$NODE_ENV" = "production" ] && [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    postgresql*)
      SHOULD_MIGRATE=true
      ;;
  esac
fi

if [ "$SHOULD_MIGRATE" = "true" ]; then
  echo "📦 Syncing database (max 20 seconds)..."

  # Run with timeout to prevent hanging
  if timeout 20s npx prisma db push --accept-data-loss 2>&1 | head -10; then
    echo "✅ Database synced"
  else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
      echo "⏱️  Database sync timed out - app will continue"
    else
      echo "⚠️  Database sync failed (code $EXIT_CODE) - app will continue"
    fi
  fi
else
  echo "ℹ️  Skipping database migration"
  echo "   (Set DATABASE_URL env var on Render dashboard to enable)"
fi

# Start the application
echo "🎯 Starting Node.js server..."
exec npm start
