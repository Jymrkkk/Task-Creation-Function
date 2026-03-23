# Changelog

## Latest Update

### New Features

**Task Completion**
- Added "✅ Mark Done" button on each task card
- Opens a completion modal where you can write an optional thank-you or completion message
- Sends a completion notification to the assigned Discord channel
- Updates the task status in Google Sheets to "Completed" (green chip)
- Task card updates instantly — green border, strikethrough name, disabled "Completed" button

**Dynamic Discord Webhooks**
- Removed hardcoded team channels (Marketing, Creatives, Development, Operations, Everyone)
- You can now add, edit, and delete any number of channels with custom names
- "Assigned To" dropdown in the task form auto-updates based on your saved channels
- No more Script Properties needed for webhook configuration — URLs are sent directly from the frontend

**Webhook Presets**
- Save your current channel setup as a named preset
- Load any saved preset back into the form
- Delete presets you no longer need
- Export all presets as a `.json` file to back them up or share across devices
- Import presets from a `.json` file — merges with existing presets, no duplicates
- A ready-to-use preset file is included in `presets/READY-PRESETS.json`

**Admin Settings Improvements**
- X close button fixed and styled to match the modal header
- Success notification now stays visible for 4 seconds (was too fast before)
- Reset to Defaults now shows a confirmation and success message, then closes the modal
- All notifications (success, error, warning) now always appear on top of all modals

### Bug Fixes

- Fixed edit and delete buttons being clipped on desktop (overflow hidden removed)
- Fixed border radius on Create Task panel header
- Fixed task cards overflowing on mobile
- Fixed date format — now shows `March 23, 2026 at 11:15 AM` everywhere (cards + sheet)
- Fixed Discord message format — plain text with bold markdown fields instead of embeds
- Fixed "Mark as Done" showing a false network error even when the sheet and Discord updated correctly
- Fixed sheet status not updating to Completed — now searches by messageId with task name fallback, and clears dropdown validation before writing

### How to Get Started with Presets

1. Download `presets/READY-PRESETS.json` from this repo
2. Open the app → click the ⚙️ gear icon
3. In Discord Webhooks, click **↑ Import Presets**
4. Select the file — your channels will load in
5. Update the webhook URLs to your own
6. Click **Save Settings**
