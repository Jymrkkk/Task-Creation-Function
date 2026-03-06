# Implementation Plan: Task Management Enhancements

## Overview

This implementation plan transforms the existing single-page task creation form into a comprehensive task management interface. The work is organized into discrete phases: external dependencies, backend modifications, frontend core classes, LocalStorage integration, UI components, form state management, error handling, and testing. Each task builds incrementally to ensure the system remains functional throughout development.

## Tasks

- [x] 1. Set up external dependencies and testing framework
  - Add SweetAlert2 CDN link to index.html for modal notifications
  - Add fast-check library CDN link for property-based testing
  - Create test file structure (tests/ directory with unit and property test files)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. Modify Google Apps Script backend for message editing
  - [x] 2.1 Update backend to return JSON response with messageId
    - Modify doPost() to return JSON instead of plain text
    - Include messageId from Discord API response in success response
    - Include timestamp in response
    - _Requirements: 5.1, 6.4_
  
  - [x] 2.2 Add support for optional messageId in request payload
    - Check for messageId field in incoming request
    - Route to PATCH endpoint when messageId is present
    - Route to POST endpoint when messageId is absent
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 2.3 Implement Discord PATCH endpoint integration
    - Use Discord PATCH /channels/{channel_id}/messages/{message_id} endpoint
    - Format embed payload for message updates
    - Handle Discord API errors for invalid messageId
    - _Requirements: 5.4, 6.5_
  
  - [x] 2.4 Add structured error response handling
    - Return JSON error responses with success: false
    - Include error type and details in response
    - Handle "message not found" errors specifically
    - _Requirements: 5.5, 7.1_

- [x] 3. Checkpoint - Verify backend changes
  - Test backend with both create and update requests
  - Ensure all tests pass, ask the user if questions arise

- [ ] 4. Implement core frontend classes
  - [x] 4.1 Create TaskHistoryManager class for LocalStorage operations
    - Implement addTask() method with UUID generation
    - Implement updateTask() method preserving ID and messageId
    - Implement deleteTask() method
    - Implement getAllTasks() with reverse chronological sorting
    - Implement getTask() for single task retrieval
    - _Requirements: 3.1, 3.2, 4.5, 8.3_
  
  - [ ]* 4.2 Write property test for TaskHistoryManager
    - **Property 6: Task Storage Round Trip**
    - **Validates: Requirements 3.1, 3.5**
  
  - [ ]* 4.3 Write property test for LocalStorage persistence
    - **Property 7: LocalStorage Persistence**
    - **Validates: Requirements 3.2**
  
  - [x] 4.4 Create BackendClient class for API communication
    - Implement constructor with webAppUrl parameter
    - Implement createTask() method (POST without messageId)
    - Implement updateTask() method (POST with messageId)
    - Add error handling for network failures
    - _Requirements: 5.3, 6.1, 6.2, 6.3_
  
  - [ ]* 4.5 Write unit tests for BackendClient
    - Test createTask() request format
    - Test updateTask() includes messageId
    - Test error response parsing
    - Mock fetch() for network scenarios
    - _Requirements: 5.3, 6.1_
  
  - [x] 4.6 Create ModalManager class for notifications
    - Implement showSuccess() with task name display
    - Implement showError() with message and details
    - Implement showConfirmation() returning promise
    - Implement showSyncError() with recovery options
    - Integrate SweetAlert2 library
    - _Requirements: 2.1, 2.2, 2.3, 7.1, 8.2_
  
  - [ ]* 4.7 Write property test for success modal
    - **Property 3: Success Modal Displays Task Name**
    - **Validates: Requirements 2.1, 2.2**

- [ ] 5. Implement form state management
  - [x] 5.1 Create TaskFormManager class
    - Implement mode property ('create' | 'update')
    - Implement currentTaskId property
    - Implement enterUpdateMode() method
    - Implement enterCreateMode() method
    - Implement validateForm() method
    - Implement getFormData() method
    - Implement populateForm() method
    - Implement clearForm() method
    - _Requirements: 1.1, 1.3, 4.2, 4.3, 4.4_
  
  - [ ]* 5.2 Write property test for form persistence
    - **Property 1: Form Persistence After Submission**
    - **Validates: Requirements 1.1**
  
  - [ ]* 5.3 Write property test for form clearing
    - **Property 2: Create Another Task Clears Form**
    - **Validates: Requirements 1.3**
  
  - [ ]* 5.4 Write property test for edit populates form
    - **Property 11: Edit Populates Form**
    - **Validates: Requirements 4.2**
  
  - [x] 5.5 Implement form button text switching
    - Change submit button text based on mode
    - Show "Submit Task" in create mode
    - Show "Update Task" in update mode
    - _Requirements: 4.3_
  
  - [ ]* 5.6 Write property test for button text change
    - **Property 12: Update Mode Button Change**
    - **Validates: Requirements 4.3**

- [x] 6. Checkpoint - Verify core classes
  - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Implement task history UI rendering
  - [x] 7.1 Create HistoryRenderer class
    - Implement constructor with container element
    - Implement render() method for all tasks
    - Implement renderTaskItem() for single task
    - Implement attachEventListeners() for edit/delete buttons
    - _Requirements: 3.3, 3.4, 4.1, 8.1_
  
  - [x] 7.2 Add history section to HTML
    - Create container div for task history
    - Add CSS styling for history items
    - Style edit and delete buttons
    - Add responsive layout for history cards
    - _Requirements: 3.3, 3.4_
  
  - [ ]* 7.3 Write property test for chronological ordering
    - **Property 8: History Chronological Ordering**
    - **Validates: Requirements 3.3**
  
  - [ ]* 7.4 Write property test for history item completeness
    - **Property 9: History Item Completeness**
    - **Validates: Requirements 3.4**
  
  - [ ]* 7.5 Write property test for history UI completeness
    - **Property 10: History UI Completeness**
    - **Validates: Requirements 4.1, 8.1**

- [ ] 8. Wire form submission flow
  - [x] 8.1 Implement create task submission handler
    - Validate form data
    - Call BackendClient.createTask()
    - Store task in TaskHistoryManager with messageId
    - Display success modal with task name
    - Preserve form data after submission
    - Refresh history display
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.5_
  
  - [ ]* 8.2 Write property test for modal dismissal preserves form
    - **Property 4: Modal Dismissal Preserves Form State**
    - **Validates: Requirements 2.4**
  
  - [ ]* 8.3 Write property test for no text-based success messages
    - **Property 5: No Text-Based Success Messages**
    - **Validates: Requirements 2.5**
  
  - [x] 8.2 Implement update task submission handler
    - Validate form data in update mode
    - Call BackendClient.updateTask() with messageId
    - Update task in TaskHistoryManager
    - Display success modal
    - Switch back to create mode
    - Refresh history display
    - _Requirements: 4.4, 4.5, 5.3_
  
  - [ ]* 8.3 Write property test for update mode validation
    - **Property 13: Update Mode Validation**
    - **Validates: Requirements 4.4**
  
  - [ ]* 8.4 Write property test for update modifies storage
    - **Property 14: Update Modifies Storage**
    - **Validates: Requirements 4.5**
  
  - [ ]* 8.5 Write property test for backend response includes messageId
    - **Property 15: Backend Response Includes Message ID**
    - **Validates: Requirements 5.1**
  
  - [ ]* 8.6 Write property test for update request includes messageId
    - **Property 16: Update Request Includes Message ID**
    - **Validates: Requirements 5.3**

- [ ] 9. Implement "Create Another Task" button
  - [x] 9.1 Add button to HTML (initially hidden)
    - Create button element with appropriate styling
    - Position below submit button
    - Add click event listener
    - _Requirements: 1.2_
  
  - [x] 9.2 Show button after successful submission
    - Display button when task submission succeeds
    - Hide button when form is cleared
    - _Requirements: 1.2_
  
  - [x] 9.3 Wire button to clear form and reset mode
    - Call TaskFormManager.clearForm()
    - Call TaskFormManager.enterCreateMode()
    - Hide the button after click
    - _Requirements: 1.3_

- [x] 10. Checkpoint - Verify submission flows
  - Test both create and update flows end-to-end
  - Ensure all tests pass, ask the user if questions arise

- [ ] 11. Implement edit functionality
  - [x] 11.1 Wire edit button click handler
    - Get task data from TaskHistoryManager
    - Call TaskFormManager.populateForm()
    - Call TaskFormManager.enterUpdateMode()
    - Scroll to form
    - _Requirements: 4.1, 4.2_
  
  - [x] 11.2 Ensure form validation in update mode
    - Validate all required fields before submission
    - Display validation errors inline
    - Prevent submission if validation fails
    - _Requirements: 4.4_

- [ ] 12. Implement delete functionality
  - [x] 12.1 Wire delete button click handler
    - Call ModalManager.showConfirmation()
    - On confirmation, call TaskHistoryManager.deleteTask()
    - Refresh history display
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 12.2 Write property test for delete confirmation
    - **Property 20: Delete Confirmation Required**
    - **Validates: Requirements 8.2**
  
  - [ ]* 12.3 Write property test for confirmed deletion
    - **Property 21: Confirmed Deletion Removes Task**
    - **Validates: Requirements 8.3**
  
  - [ ]* 12.4 Write property test for delete does not call backend
    - **Property 22: Delete Does Not Call Backend**
    - **Validates: Requirements 8.4**
  
  - [ ]* 12.5 Write property test for delete updates display
    - **Property 23: Delete Updates Display**
    - **Validates: Requirements 8.5**

- [ ] 13. Implement error handling
  - [x] 13.1 Add network failure error handling
    - Catch fetch errors in BackendClient
    - Display error modal with retry option
    - Preserve form data on error
    - _Requirements: 7.1_
  
  - [x] 13.2 Add Discord sync error handling
    - Detect "message not found" error from backend
    - Display sync error modal with recovery options
    - Implement "create new message" recovery flow
    - Update task with new messageId on recovery
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [ ]* 13.3 Write property test for sync error displays modal
    - **Property 17: Sync Error Displays Modal**
    - **Validates: Requirements 7.1**
  
  - [ ]* 13.4 Write property test for failed update preserves data
    - **Property 18: Failed Update Preserves Original Data**
    - **Validates: Requirements 7.2**
  
  - [ ]* 13.5 Write property test for recovery flow updates messageId
    - **Property 19: Recovery Flow Updates Message ID**
    - **Validates: Requirements 7.4**
  
  - [x] 13.3 Add LocalStorage error handling
    - Catch QuotaExceededError on storage operations
    - Display error modal suggesting to delete old tasks
    - Catch JSON parse errors on history load
    - Initialize empty history on corruption
    - _Requirements: 3.2_
  
  - [x] 13.4 Add form validation error display
    - Show inline validation errors for empty required fields
    - Prevent submission when validation fails
    - Clear validation errors when user corrects input
    - _Requirements: 4.4_

- [ ] 14. Initialize application on page load
  - [x] 14.1 Create main initialization function
    - Instantiate all manager classes
    - Load task history from LocalStorage
    - Render initial history display
    - Attach all event listeners
    - Set up form submission handlers
  
  - [x] 14.2 Add error handling for initialization
    - Handle LocalStorage corruption gracefully
    - Display error if critical initialization fails
    - Allow form submission even if history fails to load

- [ ] 15. Final checkpoint and integration testing
  - [x] 15.1 Test complete create flow
    - Submit new task
    - Verify success modal appears
    - Verify form data persists
    - Verify task appears in history
    - Verify "Create Another Task" button works
  
  - [x] 15.2 Test complete update flow
    - Click edit on history item
    - Verify form populates correctly
    - Verify button text changes
    - Submit update
    - Verify task updates in history
    - Verify Discord message updates
  
  - [x] 15.3 Test complete delete flow
    - Click delete on history item
    - Verify confirmation modal appears
    - Confirm deletion
    - Verify task removed from history
    - Verify task removed from LocalStorage
  
  - [x] 15.4 Test error scenarios
    - Test network failure during submission
    - Test message not found during update
    - Test LocalStorage quota exceeded
    - Test form validation errors
  
  - [ ]* 15.5 Run all property-based tests
    - Execute all 23 property tests
    - Verify 100+ iterations per test
    - Ensure all properties pass
  
  - [ ]* 15.6 Run all unit tests
    - Execute complete unit test suite
    - Verify >90% line coverage
    - Verify >85% branch coverage

- [x] 16. Final verification
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and integration points
- The implementation maintains the single HTML file architecture for simplicity
- Backend changes are backward-compatible (messageId is optional)
- LocalStorage provides lightweight persistence without requiring a database
