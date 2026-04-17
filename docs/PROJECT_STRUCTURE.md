# Project Structure

## Overview

This is a single-page task management web app that lets users create, edit, complete, and delete tasks. It posts notifications to Discord via webhooks and syncs task data to a Google Sheets spreadsheet through a Google Apps Script backend.

---

## Architecture

```
Browser (Frontend)
    │
    │  HTTP POST/GET (fetch API)
    ▼
Google Apps Script Web App (Backend)
    │
    ├── Discord API (webhook POST/PATCH) → Discord Channels
    └── Google Sheets (SpreadsheetApp)  → Dashboard Sheet
```

- The frontend is a single `index.html` file with embedded JavaScript classes.
- All configuration (webhook URLs, backend URL, spreadsheet ID) is stored in the browser's `localStorage`.
- The backend is a Google Apps Script (`Code.gs`) deployed as a Web App.
- No traditional server or database — Google Sheets acts as the data store.

---

## File & Folder Structure

```
/
├── index.html                        # Main app — all UI + frontend JS in one file
├── styles.css                        # All CSS styles
├── .gitignore
├── README.md
├── CHANGELOG.md
├── SETUP_GUIDE.md
│
├── backend/
│   ├── Code.gs                       # Google Apps Script backend (deploy this to GAS)
│   ├── README.md                     # Backend overview
│   ├── DEPLOYMENT.md                 # Step-by-step deployment guide
│   ├── FRONTEND_INTEGRATION.md       # How frontend connects to backend
│   ├── SCRIPT_PROPERTIES_SETUP.md   # (Legacy) Script Properties config guide
│   └── TEST_BACKEND.md               # Manual backend testing guide
│
├── docs/
│   ├── API.md                        # Full API reference (endpoints, request/response shapes)
│   └── PROJECT_STRUCTURE.md          # This file
│
├── presets/
│   └── READY-PRESETS.json            # Pre-built Discord webhook preset configurations
│
└── tests/
    ├── README.md
    ├── unit/                         # Vitest unit tests for frontend JS classes
    │   ├── BackendClient.test.js
    │   ├── DashboardClient.test.js
    │   ├── TaskHistoryManager.test.js
    │   ├── TaskFormManager.test.js
    │   ├── HistoryRenderer.test.js
    │   ├── ModalManager.test.js
    │   ├── broadcastToDiscord.test.js
    │   ├── createDiscordEmbed.test.js
    │   ├── determineRouting.test.js
    │   ├── errorHandling.test.js
    │   ├── responseHandling.test.js
    │   ├── sendToDiscord.test.js
    │   ├── updateBroadcastMessages.test.js
    │   └── updateModeValidation.test.js
    │
    ├── property/                     # Property-based tests using fast-check
    │   ├── taskStorage.property.test.js
    │   ├── formPersistence.property.test.js
    │   ├── historyRendering.property.test.js
    │   ├── modalNotifications.property.test.js
    │   └── backendIntegration.property.test.js
    │
    └── manual/                       # HTML test pages for manual browser testing
        ├── test-complete-create-flow.html
        ├── test-delete-functionality.html
        ├── test-discord-sync-error.html
        ├── test-network-error-handling.html
        ├── test-update-validation.html
        └── verify-update-validation.html
```

---

## Frontend Classes (index.html)

All frontend logic lives inside `<script>` tags in `index.html`.

| Class | Responsibility |
|---|---|
| `TaskHistoryManager` | CRUD operations on tasks in `localStorage` |
| `DashboardClient` | Fetches task data from the Google Sheets Dashboard via GET |
| `BackendClient` | Sends create/update/complete task requests to the GAS backend via POST |
| `ModalManager` | Controls the create/edit task modal (open, close, mode switching) |
| `TaskFormManager` | Reads and validates form field values |
| `HistoryRenderer` | Renders task cards in the Task History panel |
| `ConfigStore` | Reads/writes admin config (URL, spreadsheet ID, channels) to `localStorage` |
| `ConfigLoader` | Applies saved config to `BackendClient` and `DashboardClient` on init |
| `AdminDashboard` | Manages the Admin Settings modal (webhooks, presets, save/reset) |

### Key Global Functions

| Function | Description |
|---|---|
| `populateAssignedTo()` | Builds the multi-select channel dropdown from saved channels |
| `getSelectedChannels()` | Returns array of checked channel names |
| `getSelectedChannelObjects()` | Returns array of `{name, url}` for checked channels |
| `sendTestTask()` | Handles create/edit form submission |
| `submitCompleteTask()` | Handles task completion with optional message |
| `refreshHistoryDisplay()` | Fetches from Dashboard sheet, falls back to localStorage |
| `showNotification()` | Shows the custom notification modal (success/error/warning) |

---

## Backend (backend/Code.gs)

Deployed as a Google Apps Script Web App. Handles all server-side logic.

### Endpoints

| Method | Trigger | Description |
|---|---|---|
| `GET` | `doGet(e)` | Returns all rows from the Dashboard sheet as JSON |
| `POST` | `doPost(e)` | Creates/updates a task or marks it complete |

### POST Actions

The POST body is JSON. The backend checks `action` and `messageId` fields to determine behavior:

| Condition | Behavior |
|---|---|
| `action === 'completeTask'` | Updates sheet status to "Completed", sends completion Discord message |
| `messageId` present | Attempts Discord PATCH (update existing message), falls back to POST |
| No `messageId` | Creates new Discord message via POST |

### Key Functions

| Function | Description |
|---|---|
| `doGet(e)` | Entry point for GET requests |
| `doPost(e)` | Entry point for POST requests |
| `handleCompleteTask(data)` | Marks task complete in sheet + sends Discord notification |
| `saveTaskToSheet(data, msgId)` | Appends or updates a row in the Dashboard sheet |
| `buildDiscordMessage(data)` | Builds the plain-text Discord message body |
| `sendToDiscord(url, payload)` | POSTs to a Discord webhook with `?wait=true` |
| `updateDiscordMessage(url, msgId, payload)` | PATCHes an existing Discord message |

---

## Data Flow

### Create Task
```
User fills form → selects channel(s) → clicks "Create Task"
  → frontend validates form
  → BackendClient.createTask({ ...taskData, webhookUrls: [{name, url}] })
  → GAS doPost() → sendToDiscord() for each webhook
  → returns { success, messageId, timestamp }
  → frontend saves to localStorage + refreshes history
```

### Edit Task
```
User clicks Edit on a task card → modal opens pre-filled
  → user edits fields → clicks "Update Task"
  → BackendClient.updateTask({ ...taskData, messageId, webhookUrls })
  → GAS doPost() → updateDiscordMessage() (or sendToDiscord() if 404)
  → frontend updates localStorage record
```

### Complete Task
```
User clicks "✅ Mark Done" → completion modal opens
  → user adds optional message → clicks "Mark as Done"
  → BackendClient.completeTask({ ...taskData, messageId, webhookUrls, completionMessage })
  → GAS handleCompleteTask() → updates sheet status + sends Discord notification
  → frontend updates localStorage status to "Completed"
```

### Load History
```
Page load / Refresh button
  → DashboardClient.fetchDashboardData() → GET ?action=getDashboard
  → GAS doGet() → reads Dashboard sheet → returns rows as JSON
  → HistoryRenderer.renderTasks(data)
  → on failure: falls back to localStorage tasks
```

---

## localStorage Keys

| Key | Type | Description |
|---|---|---|
| `taskHistory` | JSON object | `{ tasks: [...TaskRecord] }` — local task history |
| `adminConfig.webAppUrl` | string | GAS Web App URL |
| `adminConfig.spreadsheetId` | string | Google Sheets spreadsheet ID |
| `adminConfig.channels` | JSON array | `[{ name, url }]` — Discord webhook channels |
| `adminConfig.presets` | JSON array | `[{ name, channels }]` — saved webhook presets |

---

## Google Sheets Schema

Sheet name: `Dashboard`

| Column | Header | Description |
|---|---|---|
| A | Timestamp | Formatted date string |
| B | Task Name | Task title |
| C | Description | Task description |
| D | Priority | Low / Medium / High |
| E | Requester | Created by (user name) |
| F | Assigned To | Comma-separated channel names |
| G | Status | In Progress / Completed |
| H | messageId | Discord message ID(s), prefixed with `'` |

---

## Configuration

All configuration is done through the Admin Settings modal (gear icon ⚙️ in the header).

| Setting | Description |
|---|---|
| Web App URL | The deployed GAS Web App URL |
| Spreadsheet ID | Google Sheets ID or full URL |
| Discord Webhooks | List of `{ name, url }` channel entries |
| Presets | Named groups of webhook channels (save/load/export/import) |

---

## Backend Integration Points

When replacing or extending the backend, the frontend expects:

**POST request body:**
```json
{
  "taskName": "string",
  "description": "string",
  "priority": "Low|Medium|High",
  "assignedTo": "Channel Name(s)",
  "user": "string",
  "webhookUrls": [{ "name": "string", "url": "string" }],
  "messageId": "string (optional, for updates)",
  "action": "completeTask (optional)",
  "completionMessage": "string (optional)"
}
```

**POST success response:**
```json
{ "success": true, "messageId": "string|array", "timestamp": "ISO8601" }
```

**POST error response:**
```json
{ "success": false, "error": "string", "details": "string" }
```

**GET success response:**
```json
{ "success": true, "data": [ {...rowObject} ], "timestamp": "ISO8601" }
```

See `docs/API.md` for the full API reference.
