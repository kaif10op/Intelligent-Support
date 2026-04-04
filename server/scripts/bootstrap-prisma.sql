create extension if not exists pgcrypto;

do $$ begin
  create type "TicketStatus" as enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "Priority" as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
exception when duplicate_object then null;
end $$;

create table if not exists "KnowledgeBase" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  "userId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "KnowledgeBase_userId_fkey" foreign key ("userId") references "User"(id) on delete cascade
);

create table if not exists "KBVersion" (
  id text primary key default gen_random_uuid()::text,
  "kbId" text not null,
  "versionNumber" integer not null,
  title text not null,
  description text not null,
  "docCount" integer not null,
  "docIds" text[] not null,
  changelog text not null default '',
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "KBVersion_kbId_fkey" foreign key ("kbId") references "KnowledgeBase"(id) on delete cascade,
  constraint "KBVersion_kbId_versionNumber_key" unique ("kbId", "versionNumber")
);

create table if not exists "Document" (
  id text primary key default gen_random_uuid()::text,
  filename text not null,
  type text not null,
  size integer not null,
  "kbId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Document_kbId_fkey" foreign key ("kbId") references "KnowledgeBase"(id) on delete cascade
);

create table if not exists "DocumentChunk" (
  id text primary key default gen_random_uuid()::text,
  content text not null,
  embedding double precision[] not null,
  "docId" text not null,
  constraint "DocumentChunk_docId_fkey" foreign key ("docId") references "Document"(id) on delete cascade
);

create table if not exists "Chat" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  "userId" text not null,
  "kbId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Chat_userId_fkey" foreign key ("userId") references "User"(id) on delete cascade,
  constraint "Chat_kbId_fkey" foreign key ("kbId") references "KnowledgeBase"(id) on delete cascade
);

create table if not exists "Message" (
  id text primary key default gen_random_uuid()::text,
  role text not null,
  content text not null,
  sources jsonb,
  confidence double precision,
  rating integer,
  feedback text,
  "chatId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Message_chatId_fkey" foreign key ("chatId") references "Chat"(id) on delete cascade
);

create table if not exists "Ticket" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text not null,
  status "TicketStatus" not null default 'OPEN',
  priority "Priority" not null default 'MEDIUM',
  "userId" text not null,
  "assignedToId" text,
  "chatId" text,
  "dueAt" timestamp(3),
  "isOverdue" boolean not null default false,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Ticket_userId_fkey" foreign key ("userId") references "User"(id) on delete cascade,
  constraint "Ticket_assignedToId_fkey" foreign key ("assignedToId") references "User"(id),
  constraint "Ticket_chatId_fkey" foreign key ("chatId") references "Chat"(id)
);

create table if not exists "TicketNote" (
  id text primary key default gen_random_uuid()::text,
  content text not null,
  role text not null default 'admin',
  "adminId" text,
  "userId" text,
  "ticketId" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "TicketNote_ticketId_fkey" foreign key ("ticketId") references "Ticket"(id) on delete cascade,
  constraint "TicketNote_userId_fkey" foreign key ("userId") references "User"(id)
);

create table if not exists "AuditLog" (
  id text primary key default gen_random_uuid()::text,
  "adminId" text not null,
  action text not null,
  "resourceId" text,
  "resourceType" text,
  changes jsonb,
  description text,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "AuditLog_adminId_fkey" foreign key ("adminId") references "User"(id) on delete cascade
);

create table if not exists "Plugin" (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  "displayName" text not null,
  version text not null,
  description text,
  enabled boolean not null default false,
  "webhookUrl" text,
  config jsonb,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);