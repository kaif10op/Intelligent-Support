# Complete Guide: Ticket Details + Human-in-Loop Chat

## 🎯 ACCESSING TICKET DETAILS

### How to Get There:

**Option 1: From Tickets List**
1. Login as SUPPORT_AGENT or ADMIN
2. Go to `/tickets` or `/support-queue`
3. See all tickets in grid view
4. **Click any ticket card** → Opens full details page

**Option 2: Direct URL**
- Go to: `http://localhost:3000/ticket/[ticket-id]`
- Replace `[ticket-id]` with actual ticket ID

---

## 📋 WHAT YOU SEE ON TICKET DETAILS PAGE

### **Left Section (Main Content)**

#### **1. Ticket Overview Tab** ✅
Shows:
- Full ticket title and description
- Created & updated dates
- **Status buttons** - Click to change status: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- Problem description with full context

#### **2. Customer Chats Tab** ✅
Shows:
- Contact list with customer's chat history
- Click a chat to view full conversation
- Inside chat view you see:
  - All messages between customer and AI
  - **Your message input box** (for support agents only)
  - **Transfer button** - Move chat to another agent
  - **AI Help button** - Get suggestions for responses

#### **3. Other Tickets Tab** ✅
Shows:
- All previous tickets from same customer
- Click any to switch to that ticket
- Helps understand customer's history

#### **4. Notes Tab** ✅
Shows:
- All notes added to this ticket
- Timestamped entries
- History of actions taken

### **Right Sidebar**
- **Quick Actions** - Direct links to all sections
- **Assigned To** - Who's handling this ticket
- **Ticket Meta** - ID, User ID for reference

---

## 💬 HUMAN-IN-LOOP CHAT (Taking Over from AI)

### **When is it Used?**
- Customer needs urgent help beyond AI capability
- Customer is escalating
- Complex issue requiring human judgment
- Payment/sensitive information

### **Step by Step:**

**Step 1: Click "View Customer Chat"**
- From ticket details, click the chat icon
- Or go to "Chats" tab
- Select customer's existing chat

**Step 2: You'll See Chat History**
```
Customer: "How do I reset my password?"
[AI Response]: "To reset your password, go to Settings..."
← Chat is currently handled by AI
```

**Step 3: Take Over the Chat**
Scroll down to see:
```
┌─────────────────────────────────────────┐
│ Transfer  │  AI Help                    │
├─────────────────────────────────────────┤
│ [Your message input box]      [Send]    │
└─────────────────────────────────────────┘
```

**Step 4: Send Your Message**
```
Your: "I'm taking over to help you personally. Let me guide you through this."
[Send]
```

Message appears in chat with your name:
```
👨‍💼 Support Agent (You): "I'm taking over..."
```

---

## 🔄 TRANSFER CHAT TO ANOTHER AGENT

### **When to Transfer?**
- You're getting too many chats
- Another agent specializes in this
- You need a break
- Time zone handoff

### **How:**

**Step 1: Click "Transfer" Button**
- Shows list of available agents

**Step 2: Select Agent**
```
John Smith (Support Agent) [Click]
Sarah Johnson (Support Agent) [Click]
admin@company.com (Admin) [Click]
Cancel
```

**Step 3: System Does:**
- Chat reassigns to selected agent
- System message: "Chat transferred to John Smith"
- John can now see this ticket and chat
- You're freed up for other tickets

---

## 💡 GET AI SUGGESTIONS

### **When to Use:**
- Not sure how to respond
- Customer asking technical question
- Need inspiration for reply

### **How:**

**Step 1: Click "AI Help" Button**

**Step 2: See Toast Notification**
```
✓ AI Suggestion: "Based on the customer's issue regarding billing, I recommend explaining our invoice generation process and offering a manual download option if automated isn't working."
```

**Step 3: Copy or Adapt**
- You can copy the suggestion
- Modify it for your style
- Paste into message box

---

## 📊 CUSTOMER CONTEXT YOU GET

### **On the Ticket Details Page:**

#### **Customer Profile Card**
```
Name: John Doe
Email: john@example.com
Member Since: January 15, 2024
Picture: [Profile pic]
```

#### **Chat History**
- All conversations this customer has had
- With AI or other agents
- Quick understanding: "Ah, they asked about billing on 3/20"

#### **Previous Tickets**
- Ticket 1: "Can't login" (RESOLVED)
- Ticket 2: "Billing issue" (IN_PROGRESS)
- Ticket 3: "Feature request" (OPEN) ← Current

#### **Ticket Notes**
- All actions taken
- All agent comments
- Complete history

---

## 🎬 FULL WORKFLOW EXAMPLE

### **Scenario: Customer Creates Support Ticket**

**Time: 9:00 AM - Customer Johns Creates Ticket**
```
Title: "I can't download my invoice"
Description: "I need my March invoice for tax purposes but download keeps failing"
Priority: MEDIUM
```

**Time: 9:15 AM - You (Support Agent) Login**
- Go to `/tickets`
- See new OPEN ticket
- Click on it → Opens TicketDetails page

**What You See:**
```
┌─ Ticket Details ─────────────────────────┐
│ "I can't download my invoice"           │
│ Status: [OPEN] [IN_PROGRESS] ...        │
│                                          │
│ Tabs: Overview | Chats | Tickets | Notes│
└──────────────────────────────────────────┘

Customer Profile:
- Name: John
- Email: john@example.com
- Member Since: 2024
- Previous Tickets: 2 (both resolved)
- Chat History: 1 conversation with AI

All customer context loaded → You understand them
```

**Time: 9:20 AM - You Take Over**
1. Click "Chats" tab
2. Click on their chat
3. See: Customer already asked AI same question, got generic response
4. Click "AI Help" → Get suggestion
5. Type your response: "John, I see the issue. Let me check your account settings..."
6. Click Send → Message appears with your name

**Time: 9:25 AM - Customer Replies**
```
👤 Customer: "Thanks! It's working now!"
👨‍💼 You: "Great! Is there anything else I can help?"
```

**Time: 9:30 AM - Close or Transfer**
- If done: Change status to RESOLVED
- If complex: Click Transfer → Delegate to specialist
- If uncertain: Click AI Help → Get guidance

---

## 🚨 COMMON ACTIONS IN TICKET DETAILS

| Action | Location | Result |
|--------|----------|--------|
| View chat | Click "Chats" tab | See full conversation |
| Send message | Type in input box | Appears as your message in chat |
| Change status | Click status buttons | Ticket updates immediately |
| Transfer chat | Click Transfer button | Another agent takes over |
| Get AI help | Click AI Help button | Toast shows suggestion |
| View history | Click "Tickets" tab | See all customer's tickets |
| Read notes | Click "Notes" tab | See all actions taken |
| Update priority | Via quick actions | Reflects in list view |

---

## ⚡ KEYBOARD SHORTCUTS

In message input box:
- **Enter** = Send message
- **Shift+Enter** = New line (when implemented)
- **Escape** = Close some modals

---

## 🔒 PERMISSIONS

| Role | Can Do |
|------|--------|
| USER | Create tickets, chat with AI, view own ticket |
| SUPPORT_AGENT | View all tickets, update status, send human messages, transfer, get AI suggestions |
| ADMIN | Everything + assign tickets, auto-assign, manage users |

---

## ✅ VERIFY IT'S WORKING

**Test Checklist:**

- [ ] 1. Login as SUPPORT_AGENT
- [ ] 2. Go to `/tickets`
- [ ] 3. Click a ticket → Details page opens
- [ ] 4. See customer profile card
- [ ] 5. Click "Chats" tab → Previous customer chat shows
- [ ] 6. Click "Tickets" tab → Other tickets from same customer shown
- [ ] 7. Change ticket status → Updates shown
- [ ] 8. Click chat message → Input box appears
- [ ] 9. Type test message → Can send (status changes to IN_PROGRESS)
- [ ] 10. Click "Transfer" → See agent list
- [ ] 11. Click "AI Help" → See suggestion toast

**If any fails**, check browser DevTools → Network tab for API errors

---

## 🐛 TROUBLESHOOTING

### **"Ticket not found"**
- Ticket ID doesn't exist
- Check the URL - should be `/ticket/[valid-id]`

### **"Can't see customer chat"**
- Customer hasn't chatted yet
- Or chat was deleted
- Check "Tickets" tab to confirm customer history

### **"Transfer button doesn't work"**
- Check if there are other agents
- Go to `/admin/dashboard` → Users
- Make sure other SUPPORT_AGENT accounts exist

### **"Message didn't send"**
- Check API endpoint: POST `/api/chat/human/:chatId/message`
- Check token in DevTools → Network → Authorization header
- Check console for full error

---

## 🎓 BEST PRACTICES

### **For Support Agents:**

1. **Read customer context first** before replying
2. **Be empathetic** - use their name, reference their history
3. **Don't repeat AI** - offer something better
4. **Use AI Help** when unsure
5. **Transfer quickly** if it's not your specialty
6. **Close chats** when fully resolved
7. **Add notes** for next agent

### **For Admins:**

1. **Auto-assign tickets** to balance load
2. **Monitor agent response time** via metrics
3. **Escalate quickly** to specialists
4. **Review closed tickets** for quality
5. **Use transfer data** to find bottlenecks

---

**Summary:** You now have complete visibility into each customer + ability to take over chats from AI. Use this to provide genuinely human support! 🚀
