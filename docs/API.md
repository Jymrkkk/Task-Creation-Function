# Task Manager — API Reference

The backend is a **Google Apps Script Web App** that exposes a single URL handling both `GET` and `POST` requests. All responses are JSON.

---

## Base URL

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

Set this in Admin Settings (⚙️) on the Task Manager page.

---

## Authentication

No API key required. The Web App is deployed with **"Who has access: Anyone"**, so any HTTP client can call it.

---

## GET — Fetch Dashboard Tasks

Returns all tasks saved in the Google Sheets Dashboard tab.

### Request

```
GET {BASE_URL}
```

No parameters required.

### Success Response

```json
{
  "success": true,
  "timestamp": "2026-03-24T10:00:00.000Z",
  "data": [
    {
      "Timestamp": "March 24, 2026 at 10:00 AM",
      "Task Name": "Build landing page",
      "Description": "Create the homepage layout",
      "Priority": "High",
      "Requester": "John",
      "Assigned To": "Development Team",
      "Status": "In Progress",
      "messageId": "1234567890123456789"
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "error": "Configuration error",
  "details": "Dashboard sheet not found."
}
```

### Example (JavaScript)

```js
const res = await fetch('https://script.google.com/macros/s/{ID}/exec');
const json = await res.json();
console.log(json.data); // array of task objects
```

---

## POST — Create Task

Creates a new task, posts it to one or more Discord channels, and saves it to the sheet.

### Request

```
POST {BASE_URL}
Content-Type: text/plain;charset=utf-8
```

> Use `text/plain` as the Content-Type to avoid a CORS preflight. The body is still valid JSON.

### Request Body

```json
{
  "taskName": "Build landing page",
  "description": "Create the homepage layout",
  "priority": "High",
  "user": "John",
  "assignedTo": "Development Team, Marketing Team",
  "webhookUrls": [
    {
      "name": "Development Team",
      "url": "https://discord.com/api/webhooks/123456/token-here"
    },
    {
      "name": "Marketing Team",
      "url": "https://discord.com/api/webhooks/789012/token-here"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `taskName` | string | yes | Name of the task |
| `description` | string | no | Task description |
| `priority` | string | yes | `"Low"`, `"Medium"`, or `"High"` |
| `user` | string | yes | Name of the person creating the task |
| `assignedTo` | string | yes | Display label (comma-separated channel names) |
| `webhookUrls` | array | yes* | Array of `{ name, url }` objects for each target Discord channel |
| `webhookUrl` | string | no | Single webhook URL fallback (used if `webhookUrls` is absent) |

> *At least one of `webhookUrls` or `webhookUrl` must be provided.

### Success Response

```json
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

When sent to multiple channels, `messageId` is an array:

```json
{
  "success": true,
  "messageId": ["1234567890123456789", "9876543210987654321"],
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

### Error Responses

```json
{ "success": false, "error": "Invalid request", "details": "Missing required fields: taskName, user, assignedTo" }
{ "success": false, "error": "Configuration error", "details": "No webhook URL provided. Please check Admin Settings." }
{ "success": false, "error": "Discord API error", "details": "Failed to send to all selected channels." }
```

### Example (JavaScript)

```js
const res = await fetch('https://script.google.com/macros/s/{ID}/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    taskName: 'Build landing page',
    description: 'Create the homepage layout',
    priority: 'High',
    user: 'John',
    assignedTo: 'Development Team',
    webhookUrls: [
      { name: 'Development Team', url: 'https://discord.com/api/webhooks/123/token' }
    ]
  })
});
const json = await res.json();
console.log(json.messageId); // Discord message ID
```

---

## POST — Update Task

Updates an existing Discord message and the sheet row. Same endpoint as Create — just include `messageId`.

### Request Body

Same as Create Task, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `messageId` | string | yes | The Discord message ID returned when the task was created |

```json
{
  "taskName": "Build landing page",
  "description": "Updated description",
  "priority": "Medium",
  "user": "John",
  "assignedTo": "Development Team",
  "messageId": "1234567890123456789",
  "webhookUrls": [
    { "name": "Development Team", "url": "https://discord.com/api/webhooks/123/token" }
  ]
}
```

The backend will attempt to edit the existing Discord message via `PATCH`. If the message is not found (deleted), it falls back to posting a new message.

### Success Response

Same shape as Create Task.

---

## POST — Complete Task

Marks a task as **Completed** in the sheet and sends a completion notification to Discord.

### Request Body

```json
{
  "action": "completeTask",
  "taskName": "Build landing page",
  "description": "Create the homepage layout",
  "priority": "High",
  "user": "John",
  "assignedTo": "Development Team",
  "messageId": "1234567890123456789",
  "completionMessage": "Great work everyone!",
  "webhookUrls": [
    { "name": "Development Team", "url": "https://discord.com/api/webhooks/123/token" }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `action` | string | yes | Must be `"completeTask"` |
| `taskName` | string | yes | Used to find the sheet row if `messageId` lookup fails |
| `messageId` | string/array | no | Discord message ID(s) for sheet row lookup |
| `completionMessage` | string | no | Optional note appended to the Discord notification |
| `webhookUrls` | array | yes* | Channels to send the completion notification to |

### Success Response

```json
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

### Example (JavaScript)

```js
await fetch('https://script.google.com/macros/s/{ID}/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    action: 'completeTask',
    taskName: 'Build landing page',
    description: 'Create the homepage layout',
    priority: 'High',
    user: 'John',
    assignedTo: 'Development Team',
    messageId: '1234567890123456789',
    completionMessage: 'Shipped!',
    webhookUrls: [
      { name: 'Development Team', url: 'https://discord.com/api/webhooks/123/token' }
    ]
  })
});
```

---

## Discord Message Format

All messages are sent as plain text `content` (not embeds) with Discord markdown.

**New task:**
```
📌 **New Task Created**

📝 **Task:** Build landing page
📄 **Description:** Create the homepage layout

🔴 **Priority:** High
👤 **Requested By:** John
👥 **Assigned To:** Development Team
📊 **Status:** In Progress
```

**Completion:**
```
✅ **Task Completed!**

📝 **Task:** Build landing page
📄 **Description:** Create the homepage layout

👤 **Requested By:** John
👥 **Assigned To:** Development Team
📊 **Status:** Completed

💬 **Message:** Shipped!
```

---

## Google Sheets Schema

The backend auto-creates a **Dashboard** sheet with these columns:

| Column | Header | Example |
|---|---|---|
| A | Timestamp | `March 24, 2026 at 10:00 AM` |
| B | Task Name | `Build landing page` |
| C | Description | `Create the homepage layout` |
| D | Priority | `High` |
| E | Requester | `John` |
| F | Assigned To | `Development Team` |
| G | Status | `In Progress` / `Completed` |
| H | messageId | `1234567890123456789` |

---

## Error Reference

| `error` value | Meaning |
|---|---|
| `"Invalid request"` | Missing required fields or malformed JSON |
| `"Configuration error"` | No webhook URL provided, or no spreadsheet/sheet found |
| `"Discord API error"` | Discord rejected the request or all channels failed |
| `"Server error"` | Unexpected exception in the script |

---

## CORS Note

Google Apps Script Web Apps do not support CORS preflight (`OPTIONS`). To avoid it:

- Always use `Content-Type: text/plain;charset=utf-8` for POST requests
- The response will still be JSON — parse it normally
- If you use `fetch` from a browser, the response may be opaque (no-cors mode). Use a server-side proxy if you need to read the response reliably
