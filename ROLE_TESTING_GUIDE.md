# Role-Based Testing Guide

## 🎯 Objective
Test all three role-based dashboards by logging in with different Google/Clerk accounts and assigning different roles to each.

---

## ✅ PREREQUISITES

### Development Environment Running:
```bash
# Terminal 1: Backend
cd /Users/deepstacker/WorkSpace/customerSupportAgent/server
npm run dev

# Terminal 2: Frontend
cd /Users/deepstacker/WorkSpace/customerSupportAgent/client
npm run dev
```

### Access Points:
- Frontend: http://localhost:3002 (with hot reload)
- Backend: http://localhost:8000 (API)
- Database: PostgreSQL with Prisma

---

## 📋 TESTING WORKFLOW

### Step 1: Create Test Accounts
You need **at least 3 Google/Clerk accounts** for testing (or 3 different browsers/incognito windows):

1. **Account A** - Will be ADMIN
2. **Account B** - Will be SUPPORT_AGENT
3. **Account C** - Will be USER (default)

### Step 2: Initial Setup

#### 2.1 Login With First Account (Admin Setup)
1. Open http://localhost:3002
2. Click "Login with Google" (or Clerk)
3. Complete authentication
4. System auto-detects first user and may assign as USER (default)

#### 2.2 Assign First Account as ADMIN
1. Two options:
   - **Option A:** Use DB directly (via Prisma studio or SQL)
   - **Option B:** Use Admin Dashboard once admin account exists

**Using Prisma Studio (Easiest):**
```bash
cd /Users/deepstacker/WorkSpace/customerSupportAgent/server
npx prisma studio
# Open browser to http://localhost:5555
# Find your user record
# Change role to "ADMIN"
# Click Save
```

#### 2.3 Login with Admin Account (Account A)
1. Logout from current account
2. Login with Account A (Google/Clerk)
3. ✅ Should auto-redirect to `/admin/dashboard`

### Step 3: Create Support Agent Account

#### 3.1 Login With Account A (Admin)
- You should be in the Admin Dashboard

#### 3.2 Add New Support Agent User
1. Click **Admin Dashboard → Users tab**
2. Search for Account B's email (if already logged in once)
3. Or wait for Account B to login first

#### 3.3 Login With Account B First (Auto-Register)
1. Open new incognito window or different browser
2. Go to http://localhost:3002
3. Login with Account B (Google/Clerk)
4. You'll land on User Dashboard (default role)
5. Logout

#### 3.4 Assign Account B as Support Agent
1. Switch back to Account A (Admin browser)
2. Go to Admin Dashboard → Users tab
3. Find Account B's entry
4. Click **Edit** button
5. Select **Support Agent** role
6. Click **Save**
7. ✅ Role updated (see success toast)

#### 3.5 Verify Support Agent Dashboard
1. Switch to Account B browser
2. Login again
3. ✅ Should auto-redirect to `/support-queue`
4. See Support Agent Dashboard with ticket queue

### Step 4: Create User Account

#### 4.1 Login With Account C First
1. Open another incognito window
2. Go to http://localhost:3002
3. Login with Account C (Google/Clerk)
4. Auto-redirects to `/dashboard` (default USER role)
5. Logout

#### 4.2 Verify Default Dashboard
1. Login with Account C again
2. ✅ Should show User Dashboard
3. See knowledge bases, recent chats, activity

---

## 🔍 DASHBOARD VERIFICATION CHECKLIST

### Admin Dashboard (Account A)
**Route:** `/admin/dashboard`

**Tab 1: Overview**
- [ ] System health stats (4 cards: Users, KBs, Docs, Chats)
- [ ] Quick actions buttons
- [ ] Analytics charts (confidence distribution, feedback quality)
- [ ] Top tickets list

**Tab 2: Users**
- [ ] User stats cards (clickable for filtering)
- [ ] Search bar works
- [ ] Export button present
- [ ] User table with columns: Name, Email, Role, Joined, Actions
- [ ] Edit button opens modal to change role
- [ ] Role dropdown shows ADMIN / Support Agent / User
- [ ] Save button updates role (shows success toast)

**Tab 3: Activity**
- [ ] Quick insights cards (growth, resolution rate, accuracy)
- [ ] Recent activity feed
- [ ] Last activity timestamp

**Navigation Sidebar:**
- [ ] Shows "Admin" section with "Dashboard" and "Portal" links
- [ ] Does NOT show "Support Queue" link

---

### Support Agent Dashboard (Account B)
**Route:** `/support-queue`

**Tab 1: All Tickets**
- [ ] Ticket list displays
- [ ] Each ticket shows: title, priority badge, status icon, user info
- [ ] Priority coded by colors (red for urgent, orange for high, etc.)

**Tab 2: Open**
- [ ] Shows only OPEN status tickets
- [ ] Count matches stats card

**Tab 3: In Progress**
- [ ] Shows only IN_PROGRESS tickets
- [ ] Count matches stats card

**Tab 4: Resolved**
- [ ] Shows only RESOLVED/CLOSED tickets
- [ ] Count matches stats card

**Stats Cards (Top)**
- [ ] Total: shows all tickets count
- [ ] Open: count of open tickets
- [ ] In Progress: count of in-progress tickets
- [ ] Resolved: count of resolved tickets

**Search & Filtering**
- [ ] Search by ticket title works
- [ ] Search by description works
- [ ] Search by ticket ID works

**Navigation Sidebar:**
- [ ] Shows "Support" section with "Support Queue" link
- [ ] Does NOT show "Admin" section
- [ ] Shows common "Main" navigation (Dashboard, Chats, KBs)

---

### User Dashboard (Account C)
**Route:** `/dashboard`

**Tab 1: Overview**
- [ ] Knowledge base cards display
- [ ] Quick stat cards show counts
- [ ] Create KB button works
- [ ] Recent chats list shows

**Tab 2: Knowledge Bases**
- [ ] List all KBs
- [ ] Create new KB button
- [ ] Upload documents
- [ ] Search KBs

**Tab 3: Activity**
- [ ] Recent chat history
- [ ] Document uploads
- [ ] Activity timeline

**Navigation Sidebar:**
- [ ] Shows "Main" section only
- [ ] Does NOT show "Admin" or "Support" sections
- [ ] Shows: Dashboard, Recent Chats, Knowledge Bases, Tickets, Search

---

## 🔄 ROLE SWITCHING TEST

### Test Scenario: Demote Admin to User

1. Login as **Account A (Admin)**
2. Go to Admin Dashboard → Users tab
3. Find your own user (Account A)
4. Click Edit
5. Try to change role to USER
6. **Expected:** ❌ Error toast: "Cannot remove your own admin privileges"
7. Change role to SUPPORT_AGENT
8. **Expected:** ❌ Error toast (if only admin): "Cannot remove the last admin"

### Test Scenario: Promote User to Admin

1. Login as **Account A (Admin)**
2. Go to Users tab
3. Find Account C (regular user)
4. Click Edit → Select ADMIN
5. **Expected:** ✅ Success toast "User role updated to ADMIN"
6. Have Account C login again
7. **Expected:** Auto-redirects to `/admin/dashboard`

---

## 🔐 CACHING BEHAVIOR TEST

### Test Auth Caching

1. **Initial Login:**
   - Login with Account A
   - Should land on correct dashboard
   - Notice no loading splash (cached, or fast API response)

2. **Page Refresh:**
   - Press F5 to refresh page
   - **Expected:** Dashboard appears instantly (cached from localStorage)
   - Fresh data fetches in background
   - User stays logged in

3. **Logout/Login:**
   - Click Logout
   - **Expected:** Cache clears, localStorage empty
   - Login again
   - Fresh cache created

### Test Data Caching

1. **Dashboard Load:**
   - Dashboard loads with cached data first
   - Stats appear instantly
   - Fresh data fetches after
   - No loading splash (or very brief)

2. **Refresh Button:**
   - Click "Refresh" button on dashboard
   - **Expected:** Always fetches fresh data (bypasses cache)
   - 5-minute TTL applies to auto-fetches

3. **Navigate Away & Back:**
   - Go to another page → return to Dashboard
   - **Expected:** Cached data loads instantly first time

---

## 🐛 TROUBLESHOOTING

### Issue: Login Redirects to Wrong Dashboard

**Symptoms:** Admin account goes to user dashboard

**Solution:**
```bash
# Check user role in database
npx prisma studio
# Find user, verify role = ADMIN (not USER)
# Refresh browser
```

### Issue: 404 on /api/tickets

**Solution:**
- Backend needs restart with new code
- Kill process: `lsof -ti:8000 | xargs kill -9`
- Restart: `npm run dev`

### Issue: Role Changes Not Taking Effect

**Symptoms:** Change role in admin panel, user still sees old dashboard

**Solution:**
1. User must logout completely
2. Clear browser cache/cookies (or incognito window)
3. Login again with fresh session

### Issue: Hot Reload Not Working

**Symptoms:** Changes don't appear after file save

**Solution:**
1. Check Vite dev server is running: `npm run dev` in client directory
2. Check HMR is enabled in vite.config.ts (should be)
3. Browser console should show HMR connection messages
4. Try manual refresh (F5)

---

## ✅ SUCCESS CRITERIA

All tests pass when:

- [ ] 3 different roles properly redirect to correct dashboards
- [ ] Admin can manage user roles
- [ ] Role changes take effect immediately on next login
- [ ] Navigation sidebars show role-appropriate links
- [ ] Each dashboard loads cached data instantly
- [ ] Refresh button always fetches fresh data
- [ ] Logout completely clears session/cache
- [ ] No TypeScript errors in console
- [ ] No 404 errors for API endpoints
- [ ] Hot reload works (changes appear in real-time)

---

## 📊 PERFORMANCE BENCHMARKS

**Expected Times:**
- First dashboard load: ~0.1s (with cache) vs ~2-3s (without)
- Page refresh: instant (cached data loads first)
- API call background fetch: ~200-500ms
- Role change effect: next login (immediate dashboard switch)

---

## 📝 NOTES FOR TESTING

1. **Use Incognito Windows:** Each browser/incognito = separate login session
2. **Clear Cache Between Tests:** If having issues, use DevTools → Application → Clear Cache
3. **Check Console:** F12 → Console tab for error messages
4. **Network Tab:** F12 → Network tab to verify API calls
5. **LocalStorage:** F12 → Application → Local Storage to verify cached data
   - `auth_user` – cached user profile
   - `auth_session` – session flag

---

## 🎬 QUICK START

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev

# Then in browser:
# 1. http://localhost:3002
# 2. Login with first Google account
# 3. Use Prisma Studio to make them ADMIN: npx prisma studio
# 4. Logout and login again
# 5. Should see Admin Dashboard
# 6. Create tickets, test other roles
```

---

**Last Updated:** April 5, 2026
**Status:** Ready for Testing ✅
