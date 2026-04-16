#!/usr/bin/env node
/**
 * Database migration script - Creates all tables matching the Prisma schema.
 * Uses the `pg` library directly (no Prisma CLI needed).
 * Safe to run multiple times (uses IF NOT EXISTS).
 *
 * Usage: DATABASE_URL="..." node scripts/migrate.mjs
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Skipping migration.');
  process.exit(0); // Exit cleanly so server can still start
}

// For Supabase: swap port 6543 (transaction pooler) to 5432 (session mode) for DDL support
const migrationUrl = DATABASE_URL.replace(':6543', ':5432');

console.log('📦 Running database migration...');
console.log(`   Using URL: ${migrationUrl.replace(/:[^:@]+@/, ':***@')}`); // Mask password

const pool = new pg.Pool({
  connectionString: migrationUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const SQL = `
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPPORT_AGENT', 'USER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "googleId" TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  picture TEXT,
  role "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- KnowledgeBase
CREATE TABLE IF NOT EXISTS "KnowledgeBase" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- KBVersion
CREATE TABLE IF NOT EXISTS "KBVersion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kbId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "docCount" INTEGER NOT NULL,
  "docIds" TEXT[] NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KBVersion_kbId_fkey" FOREIGN KEY ("kbId") REFERENCES "KnowledgeBase"(id) ON DELETE CASCADE,
  CONSTRAINT "KBVersion_kbId_versionNumber_key" UNIQUE ("kbId", "versionNumber")
);

-- Document
CREATE TABLE IF NOT EXISTS "Document" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  filename TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  "kbId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_kbId_fkey" FOREIGN KEY ("kbId") REFERENCES "KnowledgeBase"(id) ON DELETE CASCADE
);

-- DocumentChunk
CREATE TABLE IF NOT EXISTS "DocumentChunk" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content TEXT NOT NULL,
  embedding DOUBLE PRECISION[] NOT NULL,
  "docId" TEXT NOT NULL,
  CONSTRAINT "DocumentChunk_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"(id) ON DELETE CASCADE
);

-- Chat
CREATE TABLE IF NOT EXISTS "Chat" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kbId" TEXT NOT NULL,
  "assignedAgentId" TEXT,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "closedAt" TIMESTAMP(3),
  "closedBy" TEXT,
  metadata JSONB,
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "Chat_kbId_fkey" FOREIGN KEY ("kbId") REFERENCES "KnowledgeBase"(id) ON DELETE CASCADE,
  CONSTRAINT "Chat_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- Message
CREATE TABLE IF NOT EXISTS "Message" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  confidence DOUBLE PRECISION,
  rating INTEGER,
  feedback TEXT,
  "chatId" TEXT NOT NULL,
  "userId" TEXT,
  "senderName" TEXT,
  "senderRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"(id) ON DELETE CASCADE,
  CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- Ticket
CREATE TABLE IF NOT EXISTS "Ticket" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status "TicketStatus" NOT NULL DEFAULT 'OPEN',
  priority "Priority" NOT NULL DEFAULT 'MEDIUM',
  "userId" TEXT NOT NULL,
  "assignedToId" TEXT,
  "chatId" TEXT,
  "dueAt" TIMESTAMP(3),
  "isOverdue" BOOLEAN NOT NULL DEFAULT false,
  "escalationLevel" INTEGER NOT NULL DEFAULT 0,
  "escalationReason" TEXT,
  "escalatedAt" TIMESTAMP(3),
  "escalatedToId" TEXT,
  "queueStatus" TEXT NOT NULL DEFAULT 'inbox',
  "slaBreach" BOOLEAN NOT NULL DEFAULT false,
  "slaBreachAt" TIMESTAMP(3),
  "internalNotes" TEXT,
  "autoSuggestedReplyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"(id),
  CONSTRAINT "Ticket_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"(id)
);

-- TicketNote
CREATE TABLE IF NOT EXISTS "TicketNote" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  "adminId" TEXT,
  "userId" TEXT,
  "ticketId" TEXT NOT NULL,
  "isAutoSuggested" BOOLEAN NOT NULL DEFAULT false,
  "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"(id) ON DELETE CASCADE,
  CONSTRAINT "TicketNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id)
);

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminId" TEXT NOT NULL,
  action TEXT NOT NULL,
  "resourceId" TEXT,
  "resourceType" TEXT,
  changes JSONB,
  description TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Webhook
CREATE TABLE IF NOT EXISTS "Webhook" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT,
  "retryPolicy" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WebhookDelivery
CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "webhookId" TEXT NOT NULL,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "responseCode" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"(id) ON DELETE CASCADE
);

-- ConversationTag
CREATE TABLE IF NOT EXISTS "ConversationTag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tag TEXT NOT NULL,
  category TEXT NOT NULL,
  "chatId" TEXT,
  "messageId" TEXT,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL DEFAULT 'ai_analysis',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationTag_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"(id) ON DELETE CASCADE,
  CONSTRAINT "ConversationTag_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"(id) ON DELETE CASCADE
);

-- TicketTemplate
CREATE TABLE IF NOT EXISTS "TicketTemplate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AdminQueueItem
CREATE TABLE IF NOT EXISTS "AdminQueueItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ticketId" TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Plugin
CREATE TABLE IF NOT EXISTS "Plugin" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  "webhookUrl" TEXT,
  config JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (using IF NOT EXISTS where supported, or DO blocks)
CREATE INDEX IF NOT EXISTS "Chat_userId_idx" ON "Chat"("userId");
CREATE INDEX IF NOT EXISTS "Chat_kbId_idx" ON "Chat"("kbId");
CREATE INDEX IF NOT EXISTS "Chat_assignedAgentId_idx" ON "Chat"("assignedAgentId");
CREATE INDEX IF NOT EXISTS "Chat_isClosed_idx" ON "Chat"("isClosed");
CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_idx" ON "Chat"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Chat_kbId_createdAt_idx" ON "Chat"("kbId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Message_chatId_idx" ON "Message"("chatId");
CREATE INDEX IF NOT EXISTS "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt" ASC);
CREATE INDEX IF NOT EXISTS "Message_role_idx" ON "Message"(role);
CREATE INDEX IF NOT EXISTS "Message_userId_idx" ON "Message"("userId");
CREATE INDEX IF NOT EXISTS "Message_senderRole_idx" ON "Message"("senderRole");
CREATE INDEX IF NOT EXISTS "Message_confidence_idx" ON "Message"(confidence);

CREATE INDEX IF NOT EXISTS "Ticket_userId_idx" ON "Ticket"("userId");
CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "Ticket"(status);
CREATE INDEX IF NOT EXISTS "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");
CREATE INDEX IF NOT EXISTS "Ticket_queueStatus_idx" ON "Ticket"("queueStatus");
CREATE INDEX IF NOT EXISTS "Ticket_userId_status_createdAt_idx" ON "Ticket"("userId", status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Ticket_status_createdAt_idx" ON "Ticket"(status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Ticket_isOverdue_idx" ON "Ticket"("isOverdue");
CREATE INDEX IF NOT EXISTS "Ticket_priority_createdAt_idx" ON "Ticket"(priority, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "TicketNote_ticketId_idx" ON "TicketNote"("ticketId");
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");

CREATE INDEX IF NOT EXISTS "Webhook_active_idx" ON "Webhook"(active);
CREATE INDEX IF NOT EXISTS "Webhook_createdAt_idx" ON "Webhook"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_idx" ON "WebhookDelivery"(status);
CREATE INDEX IF NOT EXISTS "WebhookDelivery_event_idx" ON "WebhookDelivery"(event);
CREATE INDEX IF NOT EXISTS "WebhookDelivery_wh_status_created_idx" ON "WebhookDelivery"("webhookId", status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ConversationTag_tag_idx" ON "ConversationTag"(tag);
CREATE INDEX IF NOT EXISTS "ConversationTag_chatId_idx" ON "ConversationTag"("chatId");
CREATE INDEX IF NOT EXISTS "ConversationTag_messageId_idx" ON "ConversationTag"("messageId");
CREATE INDEX IF NOT EXISTS "ConversationTag_category_idx" ON "ConversationTag"(category);

CREATE INDEX IF NOT EXISTS "TicketTemplate_category_idx" ON "TicketTemplate"(category);
CREATE INDEX IF NOT EXISTS "AdminQueueItem_status_idx" ON "AdminQueueItem"(status);
CREATE INDEX IF NOT EXISTS "AdminQueueItem_priorityScore_idx" ON "AdminQueueItem"("priorityScore");
`;

try {
  const client = await pool.connect();
  console.log('✅ Connected to database');
  
  await client.query(SQL);
  console.log('✅ All tables and indexes created successfully');
  
  // Verify by listing tables
  const result = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `);
  console.log(`✅ Tables in database: ${result.rows.map(r => r.tablename).join(', ')}`);
  
  client.release();
  await pool.end();
  console.log('✅ Migration complete');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  await pool.end().catch(() => {});
  // Don't exit with error code - let the server start anyway
  process.exit(0);
}
