# Backend Deployment Guide

This guide explains how to deploy the updated Google Apps Script backend that returns JSON responses with Discord message IDs.

## What Changed

The backend has been updated to:
- Return JSON responses instead of plain text
- Include the Discord `messageId` in the success response
- Include a `timestamp` in the success response
- Provide structured error responses
- **Support optional `messageId` in request payload for message updates**
- **Route to PATCH endpoint when `messageId` is present (update existing message)**
- **Route to POST endpoint when `messageId` is absent (create new message)**

## Deployment Steps

### 1. Open Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Open your existing Task Management project, or create a new one

### 2. Update the Code

1. In your Google Apps Script project, open the `Code.gs` file
2. **Replace the entire contents** with the code from `backend/Code.gs`
3. Save the file (Ctrl+S or Cmd+S)

### 3. Configure Script Properties

The backend needs your Discord webhook URL to be stored securely:

1. Click on **Project Settings** (gear icon in the left sidebar)
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Enter:
   - **Property**: `DISCORD_WEBHOOK_URL`
   - **Value**: Your Discord webhook URL (e.g., `https://discord.com/api/webhooks/...`)
5. Click **Save script properties**

### 4. Deploy the Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Task Management Backend v2 - JSON responses"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Authorize** the script if prompted (review permissions and click "Allow")
6. **Copy the Web App URL** that appears

### 5. Update Your Frontend

The Web App URL needs to be updated in your `index.html` file:

1. Open `index.html`
2. Find the line with `const webAppUrl = "..."`
3. Replace the URL with your new Web App URL from step 4
4. Save the file

## Testing the Backend

### Test Creating a New Task (POST)

You can test creating a new task using curl or Postman:

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "taskName": "Test Task",
    "description": "Testing the new backend",
    "priority": "Medium",
    "assignedTo": "Development Team",
    "user": "Test User"
  }'
```

### Test Updating an Existing Task (PATCH)

To test updating an existing task, include the `messageId` in the request:

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "taskName": "Updated Test Task",
    "description": "Testing the update functionality",
    "priority": "High",
    "assignedTo": "Development Team",
    "user": "Test User",
    "messageId": "1234567890123456789"
  }'
```

Note: Replace `1234567890123456789` with an actual Discord message ID from a previous task creation.

### Expected Response

**Success:**
```json
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Invalid request",
  "details": "Task name and user are required"
}
```

## Troubleshooting

### "Discord webhook URL not configured"

- Make sure you added the `DISCORD_WEBHOOK_URL` script property
- Check that the property name is exactly `DISCORD_WEBHOOK_URL` (case-sensitive)
- Verify the webhook URL is valid

### "Authorization required"

- Make sure you authorized the script during deployment
- Try redeploying and authorizing again

### "Discord API error"

- Check that your Discord webhook URL is valid and active
- Verify the webhook hasn't been deleted in Discord
- Check the Discord server permissions

### "Message not found" (when updating)

- The `messageId` provided doesn't exist or has been deleted
- Verify the message ID is correct
- The message may have been deleted from Discord manually
- Frontend should handle this error and offer to create a new message

### CORS Issues

- Google Apps Script handles CORS automatically for web apps
- Make sure you're using `Content-Type: text/plain` in the frontend fetch request
- The backend sets the correct MIME type for JSON responses

## Response Format Reference

### Success Response

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `messageId` | string | The Discord message ID (used for editing messages later) |
| `timestamp` | string | ISO 8601 timestamp of when the response was created |

### Error Response

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error` | string | Error type (e.g., "Invalid request", "Server error") |
| `details` | string | Detailed error message for debugging |

## Next Steps

After deploying this backend update:

1. ✅ Backend returns JSON with messageId (Task 2.1)
2. ✅ Add support for optional messageId in request (Task 2.2)
3. ✅ Implement Discord PATCH endpoint for editing messages (Task 2.3)
4. ⏭️ Next: Add structured error response handling (Task 2.4)

The backend now supports both creating new messages and updating existing messages based on the presence of `messageId` in the request payload.
