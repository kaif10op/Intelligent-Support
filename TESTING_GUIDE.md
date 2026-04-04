# Testing Guide - AI Customer Support Agent

## 🚀 Development Environment

**Frontend:** http://localhost:3002 (with hot reload)
**Backend API:** http://localhost:8000
**Features:** Caching enabled, role-based routing, admin dashboard

---

## ✅ WHAT'S WORKING

### 1. Hot Reloading
- Edit any `.tsx`, `.ts`, or `.css` file
- Changes appear instantly in browser
- State preserved during reload
- No manual refresh needed

**Test:** Change button text in Admin.tsx → See it update instantly in browser

### 2. Chat Interface
- Messages only scroll, header/input fixed
- Smooth scroll behavior with keyboard enter
- File uploads work
- Feedback buttons functional

**Test:** Navigate to Chat → Send messages → Scroll should work smoothly

### 3. Role-Based Routing
- Admin login → Auto-redirects to `/admin/dashboard`
- Support Agent login → Auto-redirects to `/support-queue`
- Regular User login → Auto-redirects to `/dashboard`

**Test:**
1. Open browser DevTools Network tab
2. Click "Refresh" in admin dashboard
3. Check network logs for API calls

### 4. Frontend Caching
- User cached in localStorage on auth
- Dashboard/Admin data cached for 5 minutes
- Page loads instantly with cached data
- Fresh data fetches in background

**Test:**
1. Refresh page after login → appears instantly
2. Check browser localStorage → you'll see `auth_user` and `auth_session`
3. Logout → localStorage cleared
4. Check console for `[Cache] HIT` and `[Cache] MISS` logs

### 5. API Endpoints ✅ FIXED
```
GET  /api/tickets        ← Default lists user's tickets
GET  /api/tickets/my     ← User's tickets
GET  /api/tickets/all    ← All tickets (admin only)
GET  /api/chat/recent    ← Recent chats
PUT  /api/admin/users/:id/role ← Update user role
```

---

## ⚠️ WHAT NEEDS TESTING

### 1. Admin Role Updates
**Status:** API ready, frontend enhanced with logging

**To Test:**
1. Login as admin user
2. Go to Admin Dashboard
3. Click "Users" tab
4. Click "Edit" button on any user row
5. Select new role from dropdown
6. Click "Save"
7. Check browser console for logs:
   - Should see: `Updating role: {userId, newRole}`
   - Should see: `Role update response: {...}`
   - Should see: `User role updated to [ROLE]` toast message

**If it fails:**
1. Check Network tab → PUT `/api/admin/users/{id}/role`
2. Look for error response
3. Check browser console for error logs
4. Check backend logs (terminal where server runs)

---

## 🔧 MANUAL TESTING CHECKLIST

### Prerequisites
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3002
- [ ] Google login working (via Clerk)
- [ ] Two test user accounts (with different roles)

### Test Cases

#### Authentication & Caching
- [ ] **Login with admin account**
  - Redirects to `/admin/dashboard`
  - Shows admin dashboard
  - User data shows in localStorage

- [ ] **Refresh page after admin login**
  - Page appears instantly (uses cached data)
  - Dashboard shows cached data first
  - Fresh data updates after API responds

- [ ] **Logout**
  - localStorage cleared
  - Cache cleared
  - Redirected to login

- [ ] **Login with support agent account**
  - Redirects to `/support-queue`
  - Shows ticket queue interface

- [ ] **Login with regular user account**
  - Redirects to `/dashboard`
  - Shows KB and chat interface

#### Admin Dashboard
- [ ] **View System Statistics**
  - Total Users: shows number
  - Tickets Today: shows number
  - Knowledge Bases: shows number
  - System Status: shows "Healthy"

- [ ] **View Charts**
  - AI Confidence Distribution: bar chart displays
  - User Feedback Quality: pie chart displays

- [ ] **Quick Actions**
  - "Manage Roles" button → switches to Users tab
  - "Add New User" → shows "coming soon" toast
  - "Export Report" → shows "coming soon" toast
  - "View Logs" → navigates to Help page

#### User Management
- [ ] **Users Tab**
  - Shows list of all users
  - Search box filters by name/email
  - Role badges color-coded (red=admin, blue=support, gray=user)
  - Can see user join dates

- [ ] **Edit User Role** (Main Test)
  - Click "Edit" on any user
  - Modal opens with role options
  - Select different role
  - Click "Save"
  - Role updates in table
  - Success toast shown
  - Check console for logs

- [ ] **Export Users**
  - Click "Export" button
  - Should trigger download (if implemented)

#### Chat Interface
- [ ] **Chat Scrolling**
  - Send multiple messages
  - Messages area scrolls
  - Header stays fixed
  - Input box stays fixed

- [ ] **File Upload**
  - Click paperclip icon
  - Select a file
  - File preview shows
  - Can click X to remove file

#### Tickets
- [ ] **View Tickets**
  - Click "Tickets" in sidebar
  - Shows list of tickets
  - Can filter by status
  - Can search

---

## 📊 QUICK DEBUG COMMANDS

### Check If Servers Running
```bash
curl http://localhost:8000/health
curl http://localhost:3002/
```

### View Frontend Logs
```javascript
// In browser console:
localStorage.getItem('auth_user')
localStorage.getItem('auth_session')

// Check cache hits
// Look for [Cache] HIT / MISS in console
```

### View Backend Logs
```bash
# Terminal where server is running should show:
# [INFO] Starting server initialization...
# [INFO] ✅ Redis connected
# [INFO] All routes registered
```

### Kill Port If Stuck
```bash
# Port 3002 (frontend):
lsof -ti:3002 | xargs kill -9

# Port 8000 (backend):
lsof -ti:8000 | xargs kill -9
```

---

## 🐛 KNOWN ISSUES

### 1. UserManagement Component
- May have rendering issues with users array
- Admin.tsx includes this component
- Workaround: Edit user role directly from the table below

### 2. Button Placeholders
- "Add New User" not implemented
- "Export Report" not implemented
- Just show "coming soon" toasts

### 3. Missing Features
- Admin user creation UI
- Advanced filtering/sorting
- Bulk user actions
- Email notifications (coming soon)

---

## ✅ SUCCESS INDICATORS

**You know everything is working when:**
1. ✅ Admin logs in → auto-redirects to admin dashboard
2. ✅ Support agent logs in → auto-redirects to support queue
3. ✅ Page refresh → data appears instantly (from cache)
4. ✅ Edit user role → role updates and success toast shows
5. ✅ Console shows `[Cache]` logs during page loads
6. ✅ No TypeScript errors in build
7. ✅ All network requests return 200-201 status codes

---

## 🎯 NEXT STEPS AFTER TESTING

1. Fix any remaining errors from testing
2. Create test user accounts with different roles
3. Test end-to-end role-based workflows
4. Implement "Export" functionality (if desired)
5. Add "Add User" functionality (if desired)
6. Performance testing under load
7. Mobile responsiveness verification

---

**Questions?** Check browser console and network tab first - most issues are visible there!
