#!/bin/bash

# Startup script for Render.com deployment - Simple and Robust
# Goal: Start server FAST, skip database migration by default

echo "🚀 Starting Customer Support Agent on Render..."

# Ensure we're in the server directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# CRITICAL: Clear DATABASE_URL if not explicitly production
# This prevents loading unreachable credentials from .env
if [ "$NODE_ENV" != "production" ]; then
  unset DATABASE_URL
  echo "ℹ️  Non-production mode - DATABASE_URL cleared"
fi

# On Render, never attempt auto-migration to avoid hangs
# User must manually run: npx prisma db push after setting DATABASE_URL
echo "✅ Starting server (database migrations are manual)"
echo "   To migrate: Set DATABASE_URL on Render dashboard, then redeploy"

# Start server directly - avoid npm path issues
exec node dist/index.js
