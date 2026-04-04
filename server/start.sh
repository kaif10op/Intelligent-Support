#!/bin/bash

# Startup script for deployed application
# Handles database migrations and starts the server

echo "🚀 Starting Customer Support Agent..."

# If DATABASE_URL is set, run migrations
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Syncing database schema..."
  npx prisma db push --accept-data-loss 2>&1 | grep -E "Your database|already in sync|Error" || true

  if [ $? -ne 0 ]; then
    echo "⚠️  Database migration warning (continuing anyway)..."
  fi
else
  echo "⚠️  DATABASE_URL not set - skipping database migration"
  echo "   Please set DATABASE_URL in your environment variables"
fi

# Start the application
echo "✅ Starting server on port ${PORT:-8000}..."
exec npm start
