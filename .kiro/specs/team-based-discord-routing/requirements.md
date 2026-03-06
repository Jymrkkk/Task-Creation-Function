# Requirements Document

## Introduction

This feature enables automatic routing of tasks to different Discord channels based on the team selected in the "Assigned To" dropdown. Currently, all tasks are posted to a single Discord channel using one webhook URL. This enhancement will support multiple Discord channels (one per team) and intelligently route task notifications based on team assignment.

The system must handle both new task creation and task updates, including scenarios where the assigned team changes during an update (cross-channel updates).

## Glossary

- **Task_Router**: The backend component responsible for determining which Discord channel(s) should receive a task notification
- **Webhook_Manager**: The component that stores and retrieves Discord webhook URLs for different teams
- **Discord_Notifier**: The component that sends task data to Discord channels via webhook URLs
- **Task_Data**: The complete task information including taskName, description, priority, assignedTo, user, and optional messageId
- **Team**: One of the predefined groups: Marketing Team, Creatives Team, Development Team, Operations Team, or Everyone
- **Channel_Mapping**: The association between a Team and its corresponding Discord webhook URL
- **Cross_Channel_Update**: A task update where the assignedTo team differs from the original team, requiring notification to a different Discord channel
- **Message_ID**: The unique Discord message identifier returned when a task is posted to Discord
- **Backend**: The Google Apps Script (Code.gs) that processes task submissions
- **Script_Properties**: Google Apps Script's key-value storage mechanism for configuration data

## Requirements

### Requirement 1: Store Multiple Webhook URLs

**User Story:** As a system administrator, I want to configure separate Discord webhook URLs for each team, so that tasks can be routed to the appropriate channels.

#### Acceptance Criteria

1. THE Webhook_Manager SHALL store webhook URLs for Marketing Team, Creatives Team, Development Team, Operations Team, and Everyone in Script_Properties
2. WHEN a webhook URL is requested for a Team, THE Webhook_Manager SHALL return the corresponding webhook URL from Script_Properties
3. IF a webhook URL is not configured for a Team, THEN THE Webhook_Manager SHALL return an error indicating the missing configuration
4. THE Webhook_Manager SHALL maintain backward compatibility by supporting the legacy DISCORD_WEBHOOK_URL property as a fallback for the Everyone team

### Requirement 2: Route New Tasks to Team Channels

**User Story:** As a user, I want new tasks to automatically appear in the Discord channel for the assigned team, so that the right people are notified.

#### Acceptance Criteria

1. WHEN a new task is created with assignedTo set to Marketing Team, THE Task_Router SHALL route the task to the marketing channel
2. WHEN a new task is created with assignedTo set to Creatives Team, THE Task_Router SHALL route the task to the creatives channel
3. WHEN a new task is created with assignedTo set to Development Team, THE Task_Router SHALL route the task to the development channel
4. WHEN a new task is created with assignedTo set to Operations Team, THE Task_Router SHALL route the task to the operations channel
5. WHEN a new task is created with assignedTo set to Everyone, THE Task_Router SHALL route the task to the general channel
6. WHEN Task_Data is sent to Discord, THE Discord_Notifier SHALL return the Message_ID from the Discord API response

### Requirement 3: Handle Task Updates Within Same Channel

**User Story:** As a user, I want task updates to modify the original Discord message when the team assignment hasn't changed, so that the conversation history is preserved.

#### Acceptance Criteria

1. WHEN a task update includes a Message_ID and the assignedTo team has not changed, THE Backend SHALL update the existing Discord message using the PATCH endpoint
2. WHEN updating an existing message, THE Discord_Notifier SHALL preserve the original Message_ID in the response
3. IF the Discord message cannot be found during update, THEN THE Backend SHALL return an error with message "Message not found"

### Requirement 4: Handle Cross-Channel Task Updates

**User Story:** As a user, I want the system to handle team reassignments gracefully, so that the new team is notified even if the original message was in a different channel.

#### Acceptance Criteria

1. WHEN a task update includes a Message_ID and the assignedTo team has changed, THE Task_Router SHALL create a new message in the new team's channel
2. WHEN creating a new message for a Cross_Channel_Update, THE Backend SHALL return a new Message_ID corresponding to the new channel
3. WHEN a Cross_Channel_Update occurs, THE Backend SHALL include an indicator in the Discord embed that this task was reassigned from another team
4. THE Backend SHALL not attempt to delete or modify the original message in the old channel during Cross_Channel_Update

### Requirement 5: Broadcast to Multiple Channels

**User Story:** As a user, I want tasks assigned to "Everyone" to be visible across all team channels, so that all teams are aware of organization-wide tasks.

#### Acceptance Criteria

1. WHEN a new task is created with assignedTo set to Everyone, THE Task_Router SHALL post the task to all configured team channels
2. WHEN posting to multiple channels, THE Discord_Notifier SHALL return an array of Message_IDs, one for each channel
3. WHEN a task assigned to Everyone is updated, THE Backend SHALL update the message in all channels where it was originally posted
4. IF any channel update fails during a broadcast update, THE Backend SHALL continue updating remaining channels and report which updates succeeded

### Requirement 6: Validate Team Configuration

**User Story:** As a developer, I want the system to validate webhook configuration at runtime, so that configuration errors are caught early with clear error messages.

#### Acceptance Criteria

1. WHEN the Backend receives Task_Data, THE Webhook_Manager SHALL verify that a webhook URL exists for the specified assignedTo team
2. IF a webhook URL is missing for the assignedTo team, THEN THE Backend SHALL return an error response with details indicating which team configuration is missing
3. WHEN validating Everyone team configuration, THE Webhook_Manager SHALL verify that all team webhook URLs are configured
4. THE Backend SHALL return HTTP 200 with success false and descriptive error details for configuration errors

### Requirement 7: Maintain Response Format Compatibility

**User Story:** As a frontend developer, I want the backend API response format to remain consistent, so that existing frontend code continues to work without modification.

#### Acceptance Criteria

1. WHEN a task is successfully posted to Discord, THE Backend SHALL return a JSON response containing success true, messageId, and timestamp fields
2. WHEN an error occurs, THE Backend SHALL return a JSON response containing success false, error, and details fields
3. FOR tasks assigned to Everyone, THE Backend SHALL return the messageId as an array of Message_IDs
4. THE Backend SHALL maintain the existing response structure for all success and error cases

### Requirement 8: Parse and Format Webhook URLs

**User Story:** As a system component, I want to correctly parse Discord webhook URLs to construct API endpoints, so that both POST and PATCH operations work correctly.

#### Acceptance Criteria

1. WHEN constructing a PATCH URL, THE Discord_Notifier SHALL extract the webhook ID and token from the webhook URL using the pattern webhooks/{id}/{token}
2. IF a webhook URL does not match the expected Discord format, THEN THE Discord_Notifier SHALL return an error indicating invalid webhook URL format
3. WHEN sending a new message, THE Discord_Notifier SHALL append the wait=true query parameter to receive the Message_ID in the response
4. THE Discord_Notifier SHALL construct PATCH URLs in the format https://discord.com/api/webhooks/{id}/{token}/messages/{messageId}

### Requirement 9: Log Routing Decisions

**User Story:** As a system administrator, I want routing decisions and errors to be logged, so that I can troubleshoot configuration and routing issues.

#### Acceptance Criteria

1. WHEN the Task_Router determines the target channel for a task, THE Backend SHALL log the assignedTo team and the selected channel
2. WHEN a Cross_Channel_Update is detected, THE Backend SHALL log both the original and new team assignments
3. IF a webhook URL is missing for a team, THE Backend SHALL log the missing team name
4. WHEN posting to multiple channels for Everyone, THE Backend SHALL log the success or failure status for each channel
