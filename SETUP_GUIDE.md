# 🚀 Complete Setup Guide - Team-Based Discord Routing

## 📋 Quick Overview

This system routes tasks to different Discord channels based on team assignment and automatically saves everything to Google Sheets.

**What's Fixed:**
- ✅ Tasks now save to Google Sheets automatically
- ✅ Edits update existing rows (no duplicates)
- ✅ Dashboard displays data from Google Sheets

---

## 🎯 Your Question Answered

**Q: If I edit a task, will it edit the existing row or submit another row?**

**A: It will EDIT the existing row!** The system finds the row by `messageId` and updates it. No duplicates are created.

---

## 📝 Setup Steps

### Step 1: Create Discord Webhooks (5 minutes)

Create a webhook for each team channel:

1. Open Discord → Navigate to channel
2. Click gear icon (Edit Channel)
3. Go to **Integrations** → **Webhooks**
4. Click **"New Webhook"**
5. Name it (e.g., "Task Management - Marketing")
6. **Copy the webhook URL**
7. Click "Save Changes"

**Repeat for all 5 teams:**
- Marketing Team
- Creatives Team
- Development Team
- Operations Team
- Everyone

### Step 2: Configure Script Properties (3 minutes)

1. Go to [script.google.com](https://script.google.com)
2. Open your project
3. Click **gear icon** (Project Settings)
4. Scroll to **"Script Properties"**
5. Click **"Add script property"**

**Add these properties:**

| Property Name | Value |
|--------------|-------|
| `DISCORD_WEBHOOK_MARKETING_TEAM` | Your Marketing webhook URL |
| `DISCORD_WEBHOOK_CREATIVES_TEAM` | Your Creatives webhook URL |
| `DISCORD_WEBHOOK_DEVELOPMENT_TEAM` | Your Development webhook URL |
| `DISCORD_WEBHOOK_OPERATIONS_TEAM` | Your Operations webhook URL |
| `DISCORD_WEBHOOK_EVERYONE` | Your Everyone webhook URL |

### Step 3: Deploy Backend (5 minutes)

1. Copy the entire `backend/Code.gs` file
2. Paste into Google Apps Script editor
3. Click **Save** (💾)
4. Click **Deploy** → **Manage deployments**
5. Click **✏️ Edit** on existing deployment (or create new)
6. Change **Version** to "New version"
7. Set **Execute as**: Me
8. Set **Who has access**: Anyone
9. Click **Deploy**
10. **Copy the Web App URL**

### Step 4: Bind Spreadsheet (2 minutes)

**Easy Method:**
1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Paste the code there
4. This automatically binds the spreadsheet

### Step 5: Update Frontend (1 minute)

1. Open `index.html`
2. Find line ~1114: `const webAppUrl = "..."`
3. Replace with your Web App URL from Step 3
4. Save

### Step 6: Create Dashboard Sheet (1 minute)

**Option A - Auto-create:**
Just submit a task and the script creates it automatically.

**Option B - Manual:**
1. In Google Sheet, click **+** at bottom
2. Name it **"Dashboard"** (exact name)
3. Add headers in Row 1:
   - A: Timestamp
   - B: Task Name
   - C: Description
   - D: Priority
   - E: Requester
   - F: Assigned To
   - G: Status
   - H: messageId

---

## ✅ Testing

1. Open `index.html` in browser
2. Create a test task
3. Check Discord - message appears ✅
4. Check Google Sheet - new row appears ✅
5. Click "Edit" on that task
6. Change description
7. Submit
8. Check Sheet - SAME row updates ✅
9. Click "🔄 Refresh Dashboard" - task appears ✅

---

## 🔧 Troubleshooting

### "Configuration error: Webhook URL not configured"
**Fix:** Check Script Properties - property names must match exactly (case-sensitive)

### "No spreadsheet is bound to this script"
**Fix:** Open sheet → Extensions → Apps Script → Paste code there

### Tasks not saving to sheet
**Fix:** 
1. Check Apps Script logs: View → Logs
2. Look for "[saveTaskToSheet]" messages
3. Verify sheet name is "Dashboard"

### Dashboard not loading
**Fix:**
1. Click "🔄 Refresh Dashboard"
2. Check browser console (F12)
3. Verify Web App URL in `index.html`

### Duplicate rows being created
**Fix:**
1. Check that messageId is returned from Discord
2. Check that messageId is stored in localStorage
3. Check that messageId is sent when editing

---

## 📊 How It Works

### Creating a Task:
```
1. User fills form
2. Submit → Backend
3. Backend sends to Discord → Gets messageId
4. Backend saves to Google Sheets (NEW ROW)
5. Returns messageId to frontend
6. Frontend stores in localStorage
7. Dashboard refreshes
```

### Editing a Task:
```
1. User clicks Edit
2. Form fills with data (includes messageId)
3. User changes description
4. Submit → Backend (with messageId)
5. Backend updates Discord message
6. Backend finds row with messageId
7. Backend UPDATES that row (no new row!)
8. Dashboard refreshes
```

---

## 📁 Project Structure

```
project/
├── index.html                    # Main frontend
├── backend/
│   ├── Code.gs                   # Backend with Sheets integration
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── SCRIPT_PROPERTIES_SETUP.md # Detailed webhook setup
├── tests/
│   ├── manual/                   # Manual test guides
│   └── unit/                     # Unit tests
├── .kiro/specs/                  # Feature specifications
└── SETUP_GUIDE.md               # This file
```

---

## 🎉 Success Checklist

- [ ] All 5 Discord webhooks created
- [ ] All 5 Script Properties configured
- [ ] Backend deployed as Web App
- [ ] Web App URL updated in `index.html`
- [ ] Spreadsheet bound to script
- [ ] Dashboard sheet exists
- [ ] Test task creates new row in sheet
- [ ] Edit task updates same row (no duplicate)
- [ ] Dashboard loads from Google Sheets

---

## 📚 Additional Resources

- `backend/SCRIPT_PROPERTIES_SETUP.md` - Detailed webhook setup
- `backend/DEPLOYMENT.md` - Deployment instructions
- `tests/manual/TASK_10.2_DASHBOARD_INTEGRATION_TEST.md` - Testing guide
- `.kiro/specs/team-based-discord-routing/` - Full specification

---

## 💡 Key Points

1. **messageId is the key** - It's how the system knows which row to update
2. **No duplicates** - Same messageId = same row gets updated
3. **Auto-creates sheet** - If "Dashboard" doesn't exist, script creates it
4. **Graceful errors** - If Sheets fails, Discord still works
5. **Everyone tasks** - Store multiple messageIds as comma-separated

---

**Estimated Setup Time: 15-20 minutes**

**Questions?** Check the detailed guides in the `backend/` folder.
