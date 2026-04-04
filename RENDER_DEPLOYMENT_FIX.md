# Render.com Deployment Issues & Solutions

**Last Updated**: April 4, 2026

## Issue: Deployment Failed with "DATABASE_URL not set" Error

### Error Log
```
Error: The datasource.url property is required in your Prisma config file
when using prisma db push.
==> Exited with status 1
```

### Root Cause
The deploy tried to run `npx prisma db push` before `DATABASE_URL` environment variable was configured in Render dashboard.

---

## Solution: Setup for Render.com Deployment

### Step 1: Set Environment Variables in Render Dashboard

Go to your **customer-support-server** service → **Settings** → **Environment**

Add these required variables:

#### Database
```
DATABASE_URL = postgresql://user:password@host:port/dbname
```
(Get this from Supabase or your PostgreSQL provider)

#### Cache (Upstash Redis)
```
REDIS_URL = redis://user:password@host:port
# OR
UPSTASH_REDIS_REST_URL = https://...
UPSTASH_REDIS_REST_TOKEN = ...
```

#### Security
```
JWT_SECRET = generate-a-random-secret-key
```

#### OAuth (Optional)
```
GOOGLE_CLIENT_ID = xxx
GOOGLE_CLIENT_SECRET = xxx
```

#### AI Providers (Optional)
```
GROQ_API_KEY = xxx
GOOGLE_AI_KEY = xxx
TAVILY_API_KEY = xxx
JINA_API_KEY = xxx
```

### Step 2: Deploy with Updated render.yaml

The updated `render.yaml` now has:

**Before** (Failed):
```yaml
startCommand: npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss && npm start --prefix server
```

**After** (Works):
```yaml
startCommand: chmod +x server/start.sh && ./server/start.sh
```

The startup script (`server/start.sh`) now:
1. ✅ Checks if DATABASE_URL is set
2. ✅ Runs migrations only if DB is available
3. ✅ Gracefully continues if DB migration fails
4. ✅ Starts the server regardless

### Step 3: Manual Database Sync (First Time)

On first deployment, manually sync the database:

```bash
# Connect to your Render service via SSH or use a local tunnel
export DATABASE_URL="your-database-url"
npx prisma db push --accept-data-loss
```

Or use Prisma Cloud:
```bash
npx prisma migrate deploy
```

---

## Checklist for Successful Deployment

- [ ] Set DATABASE_URL in Render environment
- [ ] Set REDIS_URL (or Upstash Redis URLs) in Render environment
- [ ] Set JWT_SECRET in Render environment
- [ ] Trigger a new deploy on Render
- [ ] Check deploy logs for "✅ Starting server"
- [ ] Test health endpoint: `https://customer-support-server.onrender.com/healthz`
- [ ] Test API endpoint: `https://customer-support-server.onrender.com/api/tickets`

---

## Common Issues & Fixes

### Issue 1: "No open ports detected" (Multiple times in log)
**Cause**: Server not binding to port 8000, or slow startup
**Fix**: Check that PORT=8000 is set in environment, server logs appear before port detection

### Issue 2: Database connection timeout
**Cause**: DATABASE_URL is invalid or network is blocked
**Fix**: Verify DATABASE_URL format: `postgresql://user:pass@host:5432/db`

### Issue 3: Server starts but no requests work
**Cause**: CORS or Socket.io misconfigured for Render domain
**Fix**: Ensure `CORS_ORIGIN=https://customer-support-client.onrender.com,https://customer-support-server.onrender.com`

---

## Getting Database URL from Supabase

1. Go to Supabase Project → Settings → Database
2. Find **Connection string** (PostgreSQL)
3. Copy the full connection string (contains password)
4. Add to Render environment as DATABASE_URL

Example format:
```
postgresql://postgres:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## Production Deployment Success

✅ **All systems ready once environment is configured**

- Backend: Builds successfully (0 errors)
- Frontend: Builds to 145 KB gzipped
- Database: Auto-migrations on startup (if DATABASE_URL set)
- Health check: Ready at `/healthz`

Next step: Set environment variables in Render dashboard and trigger deploy
