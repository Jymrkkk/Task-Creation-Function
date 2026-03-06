# Task Management System with Multi-Channel Discord Routing

A task management system that routes tasks to different Discord channels based on team assignment and automatically syncs with Google Sheets.

## ✨ Features

- 🎯 **Multi-Channel Routing** - Tasks route to different Discord channels based on team
- 📊 **Google Sheets Integration** - All tasks automatically saved to Google Sheets
- 🔄 **Smart Updates** - Edits update existing rows (no duplicates)
- 📱 **Responsive Design** - Two-column layout that works on all devices
- 🔔 **Real-time Dashboard** - View all tasks from Google Sheets
- ⚡ **Broadcast Support** - "Everyone" tasks post to all channels

## 🚀 Quick Start

1. **Read the Setup Guide**: Open `SETUP_GUIDE.md`
2. **Follow the steps**: Takes 15-20 minutes
3. **Test it**: Create and edit tasks

## 📁 Project Structure

```
├── index.html              # Main application
├── backend/
│   ├── Code.gs            # Google Apps Script backend
│   ├── DEPLOYMENT.md      # Deployment instructions
│   └── SCRIPT_PROPERTIES_SETUP.md
├── tests/                 # Test files
├── .kiro/specs/          # Feature specifications
├── SETUP_GUIDE.md        # Complete setup guide
└── README.md             # This file
```

## 🎯 How It Works

### Creating a Task
1. Fill out the form
2. Select team (Marketing, Creatives, Development, Operations, Everyone)
3. Submit
4. Task posts to Discord channel
5. Task saves to Google Sheets
6. Dashboard updates

### Editing a Task
1. Click "Edit" on any task
2. Modify the details
3. Submit
4. Discord message updates
5. **Same row in Google Sheets updates** (no duplicate!)
6. Dashboard refreshes

## 🔧 Setup Requirements

- Google Account (for Apps Script and Sheets)
- Discord Server with admin access
- 5 Discord channels (one per team)
- 15-20 minutes for setup

## 📖 Documentation

- **`SETUP_GUIDE.md`** - Complete setup instructions
- **`backend/DEPLOYMENT.md`** - Backend deployment guide
- **`backend/SCRIPT_PROPERTIES_SETUP.md`** - Webhook configuration
- **`tests/manual/`** - Manual testing guides

## 🆘 Support

Check the troubleshooting section in `SETUP_GUIDE.md` for common issues.

## 📝 License

This project is for internal use.

---

**Start here:** Open `SETUP_GUIDE.md` to begin setup!
