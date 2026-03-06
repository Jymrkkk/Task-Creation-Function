# Design Document: Task Management Enhancements

## Overview

This design transforms the existing single-page task creation form into a comprehensive task management interface with persistent state, visual feedback, and bidirectional Discord synchronization. The enhancement maintains the current single-file HTML architecture while adding LocalStorage-based task history, modal notifications, and support for editing previously submitted tasks with Discord message updates.

The system will continue to use the existing Google Apps Script backend as the intermediary between the web form and Discord API, but will extend the backend contract to support PATCH operations for message editing. The frontend will manage task history entirely in the browser using LocalStorage, providing a lightweight solution without requiring a database.

Key architectural decisions:
- Single HTML file architecture preserved for simplicity
- LocalStorage for client-side persistence (no server-side database)
- Modal library integration for improved UX (SweetAlert2 recommended)
- Form state machine for create/update mode switching
- Backward-compatible backend API extensions

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Task Form Interface                        │ │
│  │  - Input fields (name, desc, priority, team, user)     │ │
│  │  - Submit/Update button (mode-aware)                   │ │
│  │  - Create Another Task button                          │ │
│  │  - Modal notifications (success/error)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Task History Display                          │ │
│  │  - List of submitted tasks (reverse chronological)     │ │
│  │  - Edit/Delete buttons per task                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         LocalStorage Manager                            │ │
│  │  - CRUD operations on task records                     │ │
│  │  - JSON serialization/deserialization                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (fetch API)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Google Apps Script Backend                          │
│  - Receives POST (create) or PATCH (update) requests        │
│  - Routes to Discord API with appropriate method            │
│  - Returns Message_ID and status                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Discord API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Discord Channel                           │
│  - Displays task messages                                    │
│  - Messages can be edited via API                            │
└─────────────────────────────────────────────────────────────┘
```

### Form State Machine

The form operates in two distinct modes:

```
┌─────────────┐
│   CREATE    │ (Initial state)
│   MODE      │
└──────┬──────┘
       │
       │ User clicks Edit on history item
       ▼
┌─────────────┐
│   UPDATE    │
│   MODE      │
└──────┬──────┘
       │
       │ User clicks "Create Another Task" or submits update
       ▼
┌─────────────┐
│   CREATE    │
│   MODE      │
└─────────────┘
```

State transitions:
- CREATE → UPDATE: When edit button clicked, populate form with task data, store task ID in hidden state
- UPDATE → CREATE: After successful update submission or when "Create Another Task" clicked
- Form button text changes: "Submit Task" (CREATE) vs "Update Task" (UPDATE)

## Components and Interfaces

### Frontend Components

#### 1. TaskFormManager
Manages form state, validation, and mode switching.

```javascript
class TaskFormManager {
  constructor() {
    this.mode = 'create'; // 'create' | 'update'
    this.currentTaskId = null; // UUID of task being edited
  }
  
  // Switch to update mode with task data
  enterUpdateMode(taskRecord) { }
  
  // Switch back to create mode
  enterCreateMode() { }
  
  // Validate form fields
  validateForm() { }
  
  // Get form data as object
  getFormData() { }
  
  // Populate form with task data
  populateForm(taskRecord) { }
  
  // Clear all form fields
  clearForm() { }
}
```

#### 2. TaskHistoryManager
Handles LocalStorage operations for task persistence.

```javascript
class TaskHistoryManager {
  constructor() {
    this.storageKey = 'taskHistory';
  }
  
  // Add new task to history
  addTask(taskData, messageId) { }
  
  // Update existing task in history
  updateTask(taskId, taskData) { }
  
  // Delete task from history
  deleteTask(taskId) { }
  
  // Get all tasks (sorted by timestamp desc)
  getAllTasks() { }
  
  // Get single task by ID
  getTask(taskId) { }
}
```

#### 3. ModalManager
Displays success/error notifications using modal dialogs.

```javascript
class ModalManager {
  // Show success modal with task name
  showSuccess(taskName) { }
  
  // Show error modal with message
  showError(message, details) { }
  
  // Show confirmation dialog (returns promise)
  showConfirmation(message) { }
  
  // Show message sync error with recovery options
  showSyncError(taskName, options) { }
}
```

#### 4. BackendClient
Handles communication with Google Apps Script backend.

```javascript
class BackendClient {
  constructor(webAppUrl) {
    this.webAppUrl = webAppUrl;
  }
  
  // Create new task (POST)
  async createTask(taskData) { }
  
  // Update existing task (PATCH)
  async updateTask(taskData, messageId) { }
}
```

#### 5. HistoryRenderer
Renders task history list in the UI.

```javascript
class HistoryRenderer {
  constructor(containerElement) {
    this.container = containerElement;
  }
  
  // Render all tasks
  render(tasks) { }
  
  // Render single task item
  renderTaskItem(task) { }
  
  // Attach event listeners to edit/delete buttons
  attachEventListeners() { }
}
```

### Backend API Contract

#### Endpoint
The existing Google Apps Script Web App URL remains the same.

#### Request Format

**Create Task (POST)**
```json
{
  "taskName": "string",
  "description": "string",
  "priority": "Low" | "Medium" | "High",
  "assignedTo": "string",
  "user": "string"
}
```

**Update Task (POST with messageId)**
```json
{
  "taskName": "string",
  "description": "string",
  "priority": "Low" | "Medium" | "High",
  "assignedTo": "string",
  "user": "string",
  "messageId": "string"
}
```

Note: The backend will detect the presence of `messageId` field to determine whether to POST (create) or PATCH (update) to Discord.

#### Response Format

**Success Response**
```json
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response**
```json
{
  "success": false,
  "error": "Message not found" | "Invalid request" | "Discord API error",
  "details": "string"
}
```

### LocalStorage Schema

**Storage Key:** `taskHistory`

**Data Structure:**
```json
{
  "tasks": [
    {
      "id": "uuid-v4-string",
      "taskName": "string",
      "description": "string",
      "priority": "Low" | "Medium" | "High",
      "assignedTo": "string",
      "user": "string",
      "messageId": "discord-message-id",
      "timestamp": "ISO-8601-datetime",
      "lastModified": "ISO-8601-datetime"
    }
  ]
}
```

## Data Models

### TaskRecord
Represents a single task in the history.

```typescript
interface TaskRecord {
  id: string;              // UUID v4
  taskName: string;        // Required, non-empty
  description: string;     // Required, non-empty
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;      // Team name
  user: string;            // Creator name, required
  messageId: string;       // Discord message ID
  timestamp: string;       // ISO 8601 format, creation time
  lastModified: string;    // ISO 8601 format, last update time
}
```

### FormState
Represents the current state of the form.

```typescript
interface FormState {
  mode: 'create' | 'update';
  currentTaskId: string | null;  // null in create mode
}
```

### BackendRequest
Request payload sent to Google Apps Script.

```typescript
interface BackendRequest {
  taskName: string;
  description: string;
  priority: string;
  assignedTo: string;
  user: string;
  messageId?: string;  // Optional, present only for updates
}
```

### BackendResponse
Response from Google Apps Script.

```typescript
interface BackendResponse {
  success: boolean;
  messageId?: string;      // Present on success
  timestamp?: string;      // Present on success
  error?: string;          // Present on failure
  details?: string;        // Present on failure
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Form Persistence After Submission

For any valid task data, when a task submission completes successfully, all form field values should remain populated with the submitted data.

**Validates: Requirements 1.1**

### Property 2: Create Another Task Clears Form

For any form state with populated fields, when the "Create Another Task" button is clicked, all form fields should be cleared to their default values.

**Validates: Requirements 1.3**

### Property 3: Success Modal Displays Task Name

For any task name, when a task submission completes successfully, the success modal should contain the submitted task name.

**Validates: Requirements 2.1, 2.2**

### Property 4: Modal Dismissal Preserves Form State

For any task data, when a task is submitted successfully and the success modal is dismissed, the form fields should still contain the submitted task data.

**Validates: Requirements 2.4**

### Property 5: No Text-Based Success Messages

For any successful task submission, the status text element should not contain success indicators (✅ or "success" text).

**Validates: Requirements 2.5**

### Property 6: Task Storage Round Trip

For any valid task data, when a task is submitted successfully, retrieving the task from LocalStorage should return equivalent task data including the messageId.

**Validates: Requirements 3.1, 3.5**

### Property 7: LocalStorage Persistence

For any task stored in LocalStorage, after simulating a page reload (clearing in-memory state), the task should still be retrievable from LocalStorage with all fields intact.

**Validates: Requirements 3.2**

### Property 8: History Chronological Ordering

For any set of tasks with different timestamps, the history display should show tasks in reverse chronological order (newest first).

**Validates: Requirements 3.3**

### Property 9: History Item Completeness

For any task record, the rendered history item should contain all required fields: task name, description, priority, assigned team, creator name, and submission timestamp.

**Validates: Requirements 3.4**

### Property 10: History UI Completeness

For any task record in the history, the rendered history item should include both an edit button and a delete button.

**Validates: Requirements 4.1, 8.1**

### Property 11: Edit Populates Form

For any task in history, when its edit button is clicked, all form fields should be populated with that task's data.

**Validates: Requirements 4.2**

### Property 12: Update Mode Button Change

For any task being edited, the form submit button text should change to indicate update mode (e.g., "Update Task" instead of "Submit Task").

**Validates: Requirements 4.3**

### Property 13: Update Mode Validation

For any form in update mode with invalid data (empty required fields), clicking the update button should trigger validation errors and prevent submission.

**Validates: Requirements 4.4**

### Property 14: Update Modifies Storage

For any task being edited, when valid updated data is submitted successfully, the task record in LocalStorage should reflect the new values while preserving the original ID and messageId.

**Validates: Requirements 4.5**

### Property 15: Backend Response Includes Message ID

For any successful task submission, the backend response should include a messageId field with a non-empty string value.

**Validates: Requirements 5.1**

### Property 16: Update Request Includes Message ID

For any task being edited, when the update is submitted, the request payload should include the messageId field from the original task record.

**Validates: Requirements 5.3**

### Property 17: Sync Error Displays Modal

For any task update that fails due to a Discord sync error, an error modal should be displayed with error details.

**Validates: Requirements 7.1**

### Property 18: Failed Update Preserves Original Data

For any task update that fails, the task record in LocalStorage should remain unchanged from its pre-update state.

**Validates: Requirements 7.2**

### Property 19: Recovery Flow Updates Message ID

For any task update that fails with "message not found" error, when the user chooses to create a new message, the task record should be updated with the new messageId.

**Validates: Requirements 7.4**

### Property 20: Delete Confirmation Required

For any task in history, when the delete button is clicked, a confirmation dialog should appear before the deletion occurs.

**Validates: Requirements 8.2**

### Property 21: Confirmed Deletion Removes Task

For any task in history, when deletion is confirmed, the task should no longer exist in LocalStorage.

**Validates: Requirements 8.3**

### Property 22: Delete Does Not Call Backend

For any task deletion operation, no network requests should be made to the backend API.

**Validates: Requirements 8.4**

### Property 23: Delete Updates Display

For any task in history, when it is deleted and confirmed, the task should immediately disappear from the history display.

**Validates: Requirements 8.5**

## Error Handling

### Frontend Error Scenarios

1. **Network Failure During Submission**
   - Detection: fetch() throws or returns non-ok status
   - Handling: Display error modal with retry option, preserve form data
   - User Action: Retry submission or edit data

2. **Invalid Form Data**
   - Detection: Client-side validation before submission
   - Handling: Display inline validation errors, prevent submission
   - User Action: Correct invalid fields

3. **Backend Returns Error Response**
   - Detection: response.success === false
   - Handling: Display error modal with error message from backend
   - User Action: Acknowledge error, retry if appropriate

4. **Discord Message Not Found (Update Failure)**
   - Detection: Backend returns error "Message not found"
   - Handling: Display special error modal with two options:
     - Create new message (POST new task, update messageId in storage)
     - Cancel (keep local record unchanged)
   - User Action: Choose recovery option

5. **LocalStorage Quota Exceeded**
   - Detection: localStorage.setItem() throws QuotaExceededError
   - Handling: Display error modal suggesting to delete old tasks
   - User Action: Delete old tasks to free space

6. **LocalStorage Data Corruption**
   - Detection: JSON.parse() throws during history load
   - Handling: Log error, initialize empty history, notify user
   - User Action: Acknowledge data loss

### Backend Error Scenarios

1. **Discord API Rate Limit**
   - Response: { success: false, error: "Rate limited", details: "..." }
   - Frontend: Display error modal with retry suggestion after delay

2. **Discord API Authentication Failure**
   - Response: { success: false, error: "Authentication failed", details: "..." }
   - Frontend: Display error modal, suggest contacting administrator

3. **Invalid Message ID for Update**
   - Response: { success: false, error: "Message not found", details: "..." }
   - Frontend: Trigger recovery flow (offer to create new message)

4. **Malformed Request**
   - Response: { success: false, error: "Invalid request", details: "..." }
   - Frontend: Display error modal with details, log for debugging

### Error Recovery Strategies

1. **Optimistic UI Updates**: Update LocalStorage immediately, rollback on failure
2. **Retry Logic**: Offer retry button for transient network failures
3. **Graceful Degradation**: If history fails to load, allow form submission to continue
4. **User Notification**: Always inform user of errors with actionable next steps

## Testing Strategy

### Dual Testing Approach

This feature will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomization

Unit tests should focus on:
- Specific examples that demonstrate correct behavior (e.g., submitting a specific task)
- Integration points between components (e.g., form submission triggering storage update)
- Edge cases (e.g., empty LocalStorage, corrupted data)
- Error conditions (e.g., network failures, validation errors)

Property tests should focus on:
- Universal properties that hold for all inputs (e.g., any task submitted should appear in history)
- Comprehensive input coverage through randomization (e.g., random task names, descriptions)

### Property-Based Testing Configuration

**Library Selection**: fast-check (JavaScript property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: task-management-enhancements, Property {number}: {property_text}`

**Example Property Test Structure**:
```javascript
// Feature: task-management-enhancements, Property 6: Task Storage Round Trip
test('any submitted task should be retrievable from LocalStorage', () => {
  fc.assert(
    fc.property(
      fc.record({
        taskName: fc.string({ minLength: 1 }),
        description: fc.string({ minLength: 1 }),
        priority: fc.constantFrom('Low', 'Medium', 'High'),
        assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
        user: fc.string({ minLength: 1 })
      }),
      (taskData) => {
        // Submit task
        // Retrieve from LocalStorage
        // Assert equivalence
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Test Framework**: Jest or Vitest (for JavaScript)

**Test Categories**:

1. **Component Unit Tests**
   - TaskFormManager: mode switching, validation, form population
   - TaskHistoryManager: CRUD operations, sorting, data integrity
   - ModalManager: display logic, user interactions
   - BackendClient: request formatting, response parsing
   - HistoryRenderer: DOM manipulation, event binding

2. **Integration Tests**
   - Form submission → LocalStorage update → History display
   - Edit button → Form population → Update submission → Storage update
   - Delete button → Confirmation → Storage removal → Display update
   - Error response → Modal display → User action

3. **Edge Case Tests**
   - Empty LocalStorage on first load
   - Corrupted LocalStorage data
   - Very long task names/descriptions
   - Special characters in input fields
   - Rapid successive submissions
   - Network timeout scenarios

4. **Error Handling Tests**
   - Network failures during submission
   - Backend error responses
   - Message not found during update
   - LocalStorage quota exceeded
   - Invalid form data submission attempts

### Test Data Generation

For property-based tests, use fast-check arbitraries:
- `fc.string()` for text fields with constraints (minLength, maxLength)
- `fc.constantFrom()` for enum values (priority, assignedTo)
- `fc.record()` for complex objects (TaskRecord)
- `fc.array()` for task lists
- `fc.date()` for timestamps

### Mock Strategy

**Backend Mocking**:
- Mock fetch() responses for success/error scenarios
- Simulate network delays and failures
- Test all error response types

**LocalStorage Mocking**:
- Mock localStorage for quota exceeded scenarios
- Test data corruption handling
- Verify serialization/deserialization

**DOM Mocking**:
- Use jsdom or happy-dom for DOM manipulation tests
- Mock modal library (SweetAlert2) for notification tests

### Coverage Goals

- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: >95%
- Property test coverage: 100% of correctness properties

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Include tests in CI/CD pipeline
- Fail builds on test failures or coverage drops
