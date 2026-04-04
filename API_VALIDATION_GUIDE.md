# API Validation & Testing Guide

## Status: ✅ All APIs Fixed & Ready for Testing

### Critical Fixes Applied
1. ✅ **Standardized Response Format**: All list endpoints now return `{data: [...], pagination: {...}}`
2. ✅ **Fixed closeChat Bug**: chatId now read from URL params instead of request body
3. ✅ **Removed Duplicate Routes**: Human-in-loop endpoints consolidated under `/api/chat/human/*`
4. ✅ **Support Agent Access**: Support agents can now update ticket status
5. ✅ **Frontend Updated**: All clients updated to handle new response format

---

## TESTING CHECKLIST

### **PHASE 1: Setup & Authentication**
- [ ] Server running on `http://localhost:8000`
- [ ] Client running on `http://localhost:3000`
- [ ] Create 3 test users via Google login:
  - **User 1**: Regular USER role (tests chat & tickets)
  - **User 2**: SUPPORT_AGENT role (tests agent features)
  - **User 3**: ADMIN role (tests admin features)

**How to assign roles:**
1. Login as User 3 (ADMIN)
2. Go to `/admin/dashboard`
3. Click on each user → Edit → Change Role
4. Save changes

---

### **PHASE 2: Ticket Routes - Test All Variants**

#### 2a. **Create Ticket** ✅
```bash
curl -X POST http://localhost:8000/api/tickets \
  -H "x-token: YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "description": "This is a test",
    "priority": "HIGH"
  }'
```
**Expected Response**: `{id, title, status: "OPEN", assignedToId: null, ...}`

#### 2b. **Get All Tickets** ✅
```bash
# USER view (sees only own tickets)
curl http://localhost:8000/api/tickets \
  -H "x-token: USER_TOKEN"

# SUPPORT_AGENT view (sees ALL tickets)
curl http://localhost:8000/api/tickets \
  -H "x-token: SUPPORT_AGENT_TOKEN"

# ADMIN view (sees ALL tickets + admin features)
curl http://localhost:8000/api/tickets \
  -H "x-token: ADMIN_TOKEN"
```
**Expected Response** (NEW FORMAT):
```json
{
  "data": [
    {
      "id": "ticket-id",
      "title": "Test Ticket",
      "status": "OPEN",
      "priority": "HIGH",
      "assignedToId": null,
      "createdAt": "2026-04-05T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### 2c. **Update Ticket Status (Support Agent)** ✅ NEW
```bash
# Support agent updates status
curl -X PUT http://localhost:8000/api/tickets/TICKET_ID \
  -H "x-token: SUPPORT_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```
**Expected**: `{id, status: "IN_PROGRESS", ...}`
**Should NOT fail with 403 anymore**

#### 2d. **Auto-Assign Tickets (Admin)** ✅
```bash
curl -X POST http://localhost:8000/api/tickets/admin/auto-assign \
  -H "x-token: ADMIN_TOKEN"
```
**Expected Response**:
```json
{
  "success": true,
  "assigned": 2,
  "failed": 0,
  "message": "Successfully assigned tickets..."
}
```

#### 2e. **Get Assignment Metrics (Admin)** ✅
```bash
curl http://localhost:8000/api/tickets/admin/assignment-metrics \
  -H "x-token: ADMIN_TOKEN"
```
**Expected**: Returns agent workload metrics with load scores

---

### **PHASE 3: Chat Routes - Test Standardized Response**

#### 3a. **Get Recent Chats** ✅ FIXED
```bash
curl http://localhost:8000/api/chat/recent \
  -H "x-token: USER_TOKEN"
```
**Expected Response** (NEW FORMAT):
```json
{
  "data": [
    {
      "id": "chat-id",
      "title": "First chat",
      "userId": "user-123",
      "updatedAt": "2026-04-05T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### 3b. **Get All Chats** ✅
```bash
curl http://localhost:8000/api/chat \
  -H "x-token: USER_TOKEN"
```
**Expected**: Uses standard `{data, pagination}` format

---

### **PHASE 4: Human-in-Loop Chat Routes** ✅ CONSOLIDATED

All human-in-loop routes are now under `/api/chat/human/*` prefix:

#### 4a. **Add Human Message** ✅
```bash
curl -X POST http://localhost:8000/api/chat/human/CHAT_ID/message \
  -H "x-token: SUPPORT_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I'm taking over - how can I help?"
  }'
```
**Expected**: `{success: true, message: {role: "human", content: "...", senderName: "..."}}`

#### 4b. **Request AI Suggestion** ✅
```bash
curl -X POST http://localhost:8000/api/chat/human/CHAT_ID/assistant/suggest \
  -H "x-token: SUPPORT_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Customer asked about pricing"
  }'
```
**Expected**: `{success: true, suggestion: "I recommend mentioning our enterprise plan..."}`

#### 4c. **Transfer Chat to Another Agent** ✅
```bash
curl -X POST http://localhost:8000/api/chat/human/CHAT_ID/transfer/TARGET_AGENT_ID \
  -H "x-token: SUPPORT_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Transferring to specialist"
  }'
```
**Expected**: `{success: true, chat: {assignedAgentId: "..."}}`

#### 4d. **Get Chat Transcript** ✅
```bash
curl http://localhost:8000/api/chat/human/CHAT_ID/transcript \
  -H "x-token: SUPPORT_AGENT_TOKEN"
```
**Expected**: Returns full chat with AI and human messages

#### 4e. **Close Chat** ✅ FIXED
```bash
curl -X POST http://localhost:8000/api/chat/human/CHAT_ID/close \
  -H "x-token: SUPPORT_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Resolved pricing question",
    "satisfaction": 5
  }'
```
**Expected**: `{success: true, chat: {isClosed: true, closedAt: "...", closedBy: "..."}}`

---

### **PHASE 5: Admin Routes - Standardized Format**

#### 5a. **Get All Users** ✅ FIXED
```bash
curl http://localhost:8000/api/admin/users \
  -H "x-token: ADMIN_TOKEN"
```
**Expected Response** (NEW FORMAT):
```json
{
  "data": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2026-04-05T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### 5b. **Change User Role** ✅
```bash
curl -X PUT http://localhost:8000/api/admin/users/USER_ID/role \
  -H "x-token: ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "SUPPORT_AGENT"
  }'
```
**Expected**: Updated user object with new role

---

## FULL END-TO-END WORKFLOW TEST

### Scenario: User Creates Ticket → Support Agent Joins → Admin Reviews

**Step 1: Regular User Creates Ticket**
- Login as USER
- Click "Create Support Request"
- Fill ticket form
- Submit → Ticket appears in `/tickets`

**Step 2: Support Agent Views & Updates**
- Login as SUPPORT_AGENT
- Go to `/support-queue` or `/tickets`
- See the newly created ticket
- Click ticket → Status changes possible now ✅ (was 403 before)
- Update status to "IN_PROGRESS"

**Step 3: Support Agent Takes Over Chat**
- From same ticket, navigate to Chat context
- Fill "Support Agent Response" input
- Click Send
- Message appears with role label "(SUPPORT_AGENT)"

**Step 4: Support Agent Transfers**
- Click "Transfer" button in chat
- Select another agent or admin
- Chat reassigns to that person

**Step 5: Admin Auto-Assigns All**
- Login as ADMIN
- Go to `/admin/dashboard` → Tickets tab
- Click "Auto-Assign All Tickets"
- System distributes based on agent load

---

## Known Working Routes

| Route | Method | Auth | Status |
|-------|--------|------|--------|
| `/api/tickets` | POST | requireAuth | ✅ |
| `/api/tickets` | GET | requireAuth | ✅ |
| `/api/tickets/:id` | PUT | requireSupportAgent | ✅ NEW |
| `/api/tickets/admin/auto-assign` | POST | requireAdmin | ✅ |
| `/api/tickets/admin/assignment-metrics` | GET | requireAdmin | ✅ |
| `/api/chat` | GET | requireAuth | ✅ |
| `/api/chat/recent` | GET | requireAuth | ✅ FIXED |
| `/api/chat/human/:id/message` | POST | requireAuth | ✅ |
| `/api/chat/human/:id/transfer/:targetId` | POST | requireAuth | ✅ |
| `/api/chat/human/:id/close` | POST | requireAuth | ✅ FIXED |
| `/api/admin/users` | GET | requireAdmin | ✅ FIXED |
| `/api/admin/users/:id/role` | PUT | requireAdmin | ✅ |

---

## Response Format Comparison

### Before (Inconsistent)
```json
// Chat recent endpoint
{ "chats": [...], "total": 5 }

// Admin users
{ "users": [...] }

// Some other endpoints
{ "data": [...], "pagination": {...} }
```

### After (Standardized) ✅
```json
// All list endpoints
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Testing with Frontend

### 1. Dashboard Loads Data Correctly
- Chats load without "Cannot read property 'chats' of undefined"
- Users load in admin panel without errors
- Recent chats shown properly

### 2. Ticket Assignment Works
- Admin can click "Auto-Assign" button
- Tickets distribute to support agents
- Support agents see assigned tickets

### 3. Human-in-Loop Chat Works
- Support agents see "Support Agent Response" input
- Sending message adds to chat scroll
- Transfer button shows agent list
- AI Help button provides suggestions

---

## Debugging Commands

```bash
# Test server is responding
curl http://localhost:8000/api/auth/me -H "x-token: ANY_TOKEN"

# Check if token format is correct
# Should return: { "error": "Not authorized, token failed" }
# NOT: { "error": "Not authorized, no token" }

# List all tickets (debug support agent access)
curl http://localhost:8000/api/tickets -H "x-token: AGENT_TOKEN" | jq '.data | length'

# Verify response format
curl http://localhost:8000/api/chat/recent -H "x-token: USER_TOKEN" | jq '.pagination'
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `server/src/controllers/chatHuman.ts` | Fixed closeChat to read chatId from params | 🔧 Critical bug fix |
| `server/src/routes/chat.ts` | Removed human-in-loop imports | 🧹 Cleanup |
| `server/src/routes/chatHuman.ts` | Consistent `/api/chat/human/*` prefix | ✅ Clean API |
| `server/src/controllers/chat.ts` | Fixed getRecentChats response format | ✅ Standardized |
| `server/src/controllers/admin.ts` | Fixed getAllUsers response format | ✅ Standardized |
| `server/src/routes/ticket.ts` | Added requireSupportAgent for PUT | ✅ New permission |
| `server/src/controllers/ticket.ts` | Added self-assign restriction for agents | ✅ Security |
| `client/src/pages/*.tsx` | Updated to use `res.data.data` | ✅ Fixed frontend |

