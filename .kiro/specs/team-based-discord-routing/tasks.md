# Implementation Plan: Team-Based Discord Routing

## Overview

This implementation extends the existing Google Apps Script backend (Code.gs) to support multi-channel Discord routing based on team assignment. The system will route tasks to different Discord channels, handle cross-channel updates, broadcast to all channels for "Everyone" tasks, and maintain backward compatibility with the existing single-webhook configuration.

The implementation follows a modular approach, building new components (Webhook Manager, Task Router) while preserving existing functionality. Testing is integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up Script Properties for team webhooks
  - Configure Script Properties with the provided webhook URLs
  - Add properties: DISCORD_WEBHOOK_MARKETING_TEAM, DISCORD_WEBHOOK_CREATIVES_TEAM, DISCORD_WEBHOOK_DEVELOPMENT_TEAM, DISCORD_WEBHOOK_OPERATIONS_TEAM, DISCORD_WEBHOOK_EVERYONE
  - Keep existing DISCORD_WEBHOOK_URL for backward compatibility
  - _Requirements: 1.1, 1.4_

- [ ] 2. Implement Webhook Manager component
  - [x] 2.1 Create getWebhookUrl function
    - Implement function to retrieve webhook URL for a specific team from Script Properties
    - Use naming convention: DISCORD_WEBHOOK_<TEAM> (uppercase with underscores)
    - Implement fallback to legacy DISCORD_WEBHOOK_URL for "Everyone" team
    - _Requirements: 1.2, 1.4_
  
  - [ ] 2.2 Create getAllWebhookUrls function
    - Implement function to retrieve all configured webhook URLs
    - Return object mapping team names to webhook URLs
    - _Requirements: 1.1_
  
  - [x] 2.3 Create validateWebhookConfig function
    - Implement validation to check if webhook URL exists for a team
    - Validate webhook URL format matches Discord pattern: webhooks/{id}/{token}
    - Return object with {valid: boolean, error: string|null}
    - _Requirements: 1.3, 6.1, 6.2, 8.2_
  
  - [ ]* 2.4 Write property test for Webhook Manager
    - **Property 1: Webhook Configuration Round-Trip**
    - **Validates: Requirements 1.2**
    - Test that storing and retrieving webhook URLs returns the same value
  
  - [ ]* 2.5 Write property test for missing webhook errors
    - **Property 2: Missing Webhook Error Handling**
    - **Validates: Requirements 1.3, 6.1, 6.2**
    - Test that missing webhooks return configuration errors

- [ ] 3. Implement Task Router component
  - [x] 3.1 Create determineRouting function
    - Implement routing logic to determine strategy (single/broadcast/cross-channel)
    - Detect new tasks (no messageId) vs updates (has messageId)
    - Detect cross-channel updates (messageId present, assignedTo changed)
    - Return routing decision object with strategy, targetTeams, isUpdate, requiresNewMessage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 4.1, 5.1_
  
  - [ ]* 3.2 Write property test for team-based routing
    - **Property 3: Team-Based Routing Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    - Test that tasks route to correct channels for all team assignments

- [x] 4. Checkpoint - Verify routing logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Enhance Discord Notifier for broadcast operations
  - [x] 5.1 Update sendToDiscord function
    - Ensure wait=true parameter is included in POST requests
    - Parse and return messageId from Discord response
    - _Requirements: 2.6, 8.3_
  
  - [x] 5.2 Create broadcastToDiscord function
    - Implement function to post message to multiple webhook URLs
    - Collect all message IDs and errors
    - Continue processing all channels even if one fails
    - Return {messageIds: Array<string>, errors: Array<Object>}
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 5.3 Create updateBroadcastMessages function
    - Implement function to update messages in multiple channels
    - Accept array of {webhookUrl, messageId} objects
    - Continue processing all channels even if one fails
    - Return {messageIds: Array<string>, errors: Array<Object>}
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 5.4 Write property test for broadcast operations
    - **Property 10: Broadcast to All Channels**
    - **Validates: Requirements 5.1, 5.2**
    - Test that "Everyone" tasks post to all configured channels
  
  - [ ]* 5.5 Write property test for broadcast updates
    - **Property 11: Broadcast Update Preserves All Messages**
    - **Validates: Requirements 5.3**
    - Test that broadcast updates preserve all message IDs
  
  - [ ]* 5.6 Write property test for partial broadcast failures
    - **Property 12: Partial Broadcast Failure Handling**
    - **Validates: Requirements 5.4**
    - Test that partial failures are handled gracefully

- [ ] 6. Update createDiscordEmbed for cross-channel indicators
  - [x] 6.1 Add options parameter to createDiscordEmbed
    - Add optional second parameter for options (isCrossChannel, originalTeam)
    - When isCrossChannel is true, add reassignment field to embed
    - Field format: {name: "⚠️ Reassigned", value: "This task was reassigned from {originalTeam}", inline: false}
    - _Requirements: 4.3_
  
  - [ ]* 6.2 Write property test for reassignment indicator
    - **Property 8: Cross-Channel Reassignment Indicator**
    - **Validates: Requirements 4.3**
    - Test that cross-channel updates include reassignment field

- [ ] 7. Refactor doPost handler to use new routing system
  - [x] 7.1 Add routing logic to doPost
    - Call determineRouting to get routing decision
    - Validate webhook configuration for target teams
    - Handle single-channel, broadcast, and cross-channel strategies
    - Add logging for routing decisions and cross-channel updates
    - _Requirements: 2.1-2.6, 3.1-3.3, 4.1-4.4, 5.1-5.4, 9.1-9.4_
  
  - [x] 7.2 Update response handling for broadcast operations
    - Return array of message IDs for "Everyone" tasks
    - Return single message ID for team-specific tasks
    - Maintain existing response structure for backward compatibility
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 7.3 Add comprehensive error handling
    - Handle configuration errors with descriptive messages
    - Handle Discord API errors (404, 5xx)
    - Handle partial broadcast failures
    - Return HTTP 200 with success: false for all errors
    - _Requirements: 6.1-6.4, 7.2_
  
  - [ ]* 7.4 Write property test for message ID return
    - **Property 4: Message ID Return on Send**
    - **Validates: Requirements 2.6**
    - Test that all successful sends return message IDs
  
  - [ ]* 7.5 Write property test for same-channel updates
    - **Property 5: Same-Channel Update Preserves Message ID**
    - **Validates: Requirements 3.1, 3.2**
    - Test that same-channel updates preserve message IDs
  
  - [ ]* 7.6 Write property test for message not found errors
    - **Property 6: Message Not Found Error**
    - **Validates: Requirements 3.3**
    - Test that invalid message IDs return appropriate errors
  
  - [ ]* 7.7 Write property test for cross-channel updates
    - **Property 7: Cross-Channel Update Creates New Message**
    - **Validates: Requirements 4.1, 4.2**
    - Test that cross-channel updates create new messages
  
  - [ ]* 7.8 Write property test for response formats
    - **Property 15: Success Response Structure**
    - **Property 16: Error Response Structure**
    - **Property 17: Broadcast Response Format**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Test that all responses have correct structure

- [x] 8. Checkpoint - Verify backend integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add logging throughout the system
  - [x] 9.1 Add logging to Webhook Manager
    - Log webhook retrieval status for each team
    - Log configuration validation results
    - Format: [WebhookManager] Action: Details
    - _Requirements: 9.1, 9.3_
  
  - [x] 9.2 Add logging to Task Router
    - Log routing strategy and target teams
    - Log cross-channel update detection with old and new teams
    - Format: [TaskRouter] Action: Details
    - _Requirements: 9.1, 9.2_
  
  - [x] 9.3 Add logging to Discord Notifier
    - Log broadcast operation results (success/failure per channel)
    - Log API errors with full response details
    - Format: [DiscordNotifier] Action: Details
    - _Requirements: 9.4_

- [ ] 10. Update frontend for two-column layout and history
  - [x] 10.1 Implement two-column layout in index.html
    - Create left column for task creation form
    - Create right column for task history display
    - Ensure responsive design for mobile devices
    - _User requirement: Two-column layout_
  
  - [x] 10.2 Add Google Sheets integration for history
    - Implement function to fetch data from "Dashboard" sheet
    - Display fetched data in the history column
    - Handle loading states and errors
    - _User requirement: Fetch Dashboard data_
  
  - [x] 10.3 Update frontend to handle array message IDs
    - Store array of message IDs for "Everyone" tasks
    - Send array of message IDs when updating "Everyone" tasks
    - Display which channels a task was posted to (optional enhancement)
    - _Requirements: 5.2, 5.3, 7.3_

- [ ] 11. Final integration testing
  - [x] 11.1 Test all team routing scenarios
    - Test new task creation for each team (Marketing, Creatives, Development, Operations, Everyone)
    - Verify tasks appear in correct Discord channels
    - Verify message IDs are returned correctly
    - _Requirements: 2.1-2.6_
  
  - [x] 11.2 Test update scenarios
    - Test same-channel updates (team unchanged)
    - Test cross-channel updates (team changed)
    - Test "Everyone" broadcast updates
    - Verify original messages are preserved during cross-channel updates
    - _Requirements: 3.1-3.3, 4.1-4.4, 5.3_
  
  - [x] 11.3 Test error handling
    - Test with missing webhook configuration
    - Test with invalid message IDs
    - Test with invalid webhook URL format
    - Verify error responses have correct structure
    - _Requirements: 6.1-6.4, 7.2_
  
  - [x] 11.4 Test backward compatibility
    - Test with only legacy DISCORD_WEBHOOK_URL configured
    - Verify existing functionality still works
    - _Requirements: 1.4, 7.4_

- [x] 12. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation maintains backward compatibility with existing single-webhook configuration
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples and edge cases
- All code changes are in backend/Code.gs and index.html
- Script Properties must be configured before testing (task 1)
