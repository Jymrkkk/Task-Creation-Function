# Script Properties Setup Guide

This guide explains how to configure Discord webhook URLs in Google Apps Script for team-based routing.

## Overview

The task management system supports routing tasks to different Discord channels based on team assignment. This requires configuring webhook URLs for each team in Script Properties.

## Required Properties

### Team-Specific Webhooks

Configure these properties to enable multi-channel routing:

| Property Name | Description | Example |
|--------------|-------------|---------|
| `DISCORD_WEBHOOK_MARKETING_TEAM` | Webhook URL for Marketing Team channel | `https://discord.com/api/webhooks/123.../abc...` |
| `DISCORD_WEBHOOK_CREATIVES_TEAM` | Webhook URL for Creatives Team channel | `https://discord.com/api/webhooks/123.../abc...` |
| `DISCORD_WEBHOOK_DEVELOPMENT_TEAM` | Webhook URL for Development Team channel | `https://discord.com/api/webhooks/123.../abc...` |
| `DISCORD_WEBHOOK_OPERATIONS_TEAM` | Webhook URL for Operations Team channel | `https://discord.com/api/webhooks/123.../abc...` |
| `DISCORD_WEBHOOK_EVERYONE` | Webhook URL for Everyone/general channel | `https://discord.com/api/webhooks/123.../abc...` |

### Backward Compatibility

| Property Name | Description | Example |
|--------------|-------------|---------|
| `DISCORD_WEBHOOK_URL` | Legacy webhook URL (fallback for Everyone team) | `https://discord.com/api/webhooks/123.../abc...` |

## Setup Instructions

### Step 1: Create Discord Webhooks

For each team channel in Discord:

1. Open Discord and navigate to the channel
2. Click the gear icon (Edit Channel)
3. Go to Integrations > Webhooks
4. Click "New Webhook"
5. Give it a name (e.g., "Task Management - Marketing")
6. Copy the webhook URL
7. Click "Save Changes"

Repeat this process for all five team channels:
- Marketing Team channel
- Creatives Team channel
- Development Team channel
- Operations Team channel
- Everyone/general channel

### Step 2: Configure Script Properties

1. Open your Google Apps Script project (script.google.com)
2. Click the gear icon (Project Settings) in the left sidebar
3. Scroll down to "Script Properties"
4. Click "Add script property"
5. Add each property:
   - **Property**: `DISCORD_WEBHOOK_MARKETING_TEAM`
   - **Value**: Paste the webhook URL for Marketing Team
   - Click "Add script property"
6. Repeat for all team webhooks:
   - `DISCORD_WEBHOOK_CREATIVES_TEAM`
   - `DISCORD_WEBHOOK_DEVELOPMENT_TEAM`
   - `DISCORD_WEBHOOK_OPERATIONS_TEAM`
   - `DISCORD_WEBHOOK_EVERYONE`
7. (Optional) Add legacy webhook for backward compatibility:
   - `DISCORD_WEBHOOK_URL`

### Step 3: Verify Configuration

After adding all properties, you should see them listed in Script Properties:

```
DISCORD_WEBHOOK_MARKETING_TEAM = https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_CREATIVES_TEAM = https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_DEVELOPMENT_TEAM = https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_OPERATIONS_TEAM = https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_EVERYONE = https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/... (optional)
```

## Routing Behavior

### With Team-Specific Webhooks Configured

- Tasks assigned to "Marketing Team" → Marketing channel
- Tasks assigned to "Creatives Team" → Creatives channel
- Tasks assigned to "Development Team" → Development channel
- Tasks assigned to "Operations Team" → Operations channel
- Tasks assigned to "Everyone" → Everyone channel (or all channels if broadcast is enabled)

### Legacy Mode (Only DISCORD_WEBHOOK_URL Configured)

- All tasks → Single channel specified by `DISCORD_WEBHOOK_URL`
- Maintains backward compatibility with existing deployments

## Troubleshooting

### Error: "Discord webhook URL not configured"

**Cause**: The required webhook property is missing for the assigned team.

**Solution**: 
1. Check which team the task is assigned to
2. Verify the corresponding property exists in Script Properties
3. Ensure the property name matches exactly (case-sensitive, underscores)

### Error: "Invalid webhook URL format"

**Cause**: The webhook URL doesn't match Discord's expected format.

**Solution**:
1. Verify the URL starts with `https://discord.com/api/webhooks/`
2. Ensure the URL contains both webhook ID and token
3. Copy the URL directly from Discord (don't modify it)

### Tasks Not Appearing in Discord

**Possible causes**:
1. Webhook URL is incorrect or expired
2. Bot/webhook was removed from the Discord channel
3. Discord channel permissions changed

**Solution**:
1. Test the webhook URL manually using a tool like Postman
2. Recreate the webhook in Discord if necessary
3. Update the Script Property with the new webhook URL

## Security Notes

- **Keep webhook URLs secret**: Anyone with a webhook URL can post to your Discord channel
- **Script Properties are secure**: They're not exposed to the frontend or visible in the web app
- **Regenerate webhooks if compromised**: If a webhook URL is leaked, delete it in Discord and create a new one
- **Use "Execute as: Me"**: When deploying the web app, ensure it executes as you (the owner) to protect Script Properties

## Next Steps

After configuring Script Properties:

1. Deploy or redeploy your web app
2. Test task creation for each team
3. Verify tasks appear in the correct Discord channels
4. Test task updates and cross-channel reassignments

For more information, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [TEST_BACKEND.md](./TEST_BACKEND.md) - Testing instructions
- [Design Document](../.kiro/specs/team-based-discord-routing/design.md) - Technical details
