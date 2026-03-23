# Task Manager

A task management web app that posts tasks to Discord channels and syncs with Google Sheets. Fully configurable — no hardcoded channels or webhooks.

## ✨ Features

- 📋 **Create, Edit, Delete Tasks** — full task lifecycle management
- ✅ **Mark as Completed** — sends a completion message to Discord and updates the sheet
- 🎯 **Dynamic Discord Channels** — add any number of channels with custom names and webhooks
- 📊 **Google Sheets Sync** — all tasks saved and updated automatically
- 🔔 **Real-time Dashboard** — refresh to pull latest data from the sheet
- 💾 **Webhook Presets** — save, load, export and import channel configurations
- ⚙️ **Admin Settings** — configure everything from the UI, no code editing needed

## 🚀 Quick Start

1. Deploy `backend/Code.gs` as a Google Apps Script Web App (see `backend/DEPLOYMENT.md`)
2. Open the app and click the ⚙️ gear icon
3. Enter your Web App URL and Spreadsheet ID
4. Add your Discord channels and webhook URLs
5. Save Settings — you're ready to go

## ⚙️ Admin Settings Guide

Click the gear icon (⚙️) in the top right to open Admin Settings.

### Backend Configuration
- **Web App URL** — the deployed Google Apps Script URL
- **Spreadsheet ID** — your Google Sheet ID or full URL

### Discord Webhooks
Channels are fully customizable — add as many as you need.

- Click **+ Add Channel** to add a new row
- Enter a channel name (e.g. `Marketing Team`) and its Discord webhook URL
- Click 🗑️ to remove a channel
- Click **Save Settings** to apply — the "Assigned To" dropdown in the task form updates automatically

### Webhook Presets
Since channel configs are saved to your browser's localStorage, they won't carry over to other devices. Use presets to back them up.

- **Save Preset** — saves your current channels under a name (stored in localStorage)
- **Load** — restores a saved preset's channels into the form
- **↓ Export Presets** — downloads all presets as a `.json` file you can save anywhere
- **↑ Import Presets** — loads presets from a `.json` file and merges them with existing ones

> ⚠️ Always export your presets before clearing browser data or switching devices.

## 📦 Ready-to-Use Preset

A sample preset file is included in the `presets/` folder:

```
presets/READY-PRESETS.json
```

> ⚠️ The webhook URLs in this file are examples — replace them with your own before using.

### How to use it:
1. Download `presets/task-manager-presets.json` from this repo
2. Open the app → click ⚙️ gear icon
3. In the **Discord Webhooks** section, click **↑ Import Presets**
4. Select the downloaded file
5. Your channels will appear — update the webhook URLs to your own
6. Click **Save Settings**

## 📁 Project Structure

```
├── index.html                  # Main application (frontend + logic)
├── styles.css                  # All styles
├── backend/
│   ├── Code.gs                 # Google Apps Script backend
│   ├── DEPLOYMENT.md           # Deployment instructions
│   └── SCRIPT_PROPERTIES_SETUP.md
├── presets/
│   └── task-manager-presets.json   # Sample preset file
├── tests/                      # Unit and property tests
├── SETUP_GUIDE.md              # Full setup guide
└── README.md                   # This file
```

## 🔧 Requirements

- Google Account (Apps Script + Sheets)
- Discord server with webhook access
- Any modern browser

## 📖 More Documentation

- `SETUP_GUIDE.md` — full setup walkthrough
- `backend/DEPLOYMENT.md` — how to deploy the backend
- `backend/SCRIPT_PROPERTIES_SETUP.md` — legacy Script Properties setup

## 📝 License

For internal use.
