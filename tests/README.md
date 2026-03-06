# Task Management Enhancements - Test Suite

This directory contains the test suite for the task management enhancements feature, implementing both unit tests and property-based tests.

## Directory Structure

```
tests/
├── unit/                           # Unit tests for specific examples and edge cases
│   ├── TaskHistoryManager.test.js  # Tests for LocalStorage operations
│   ├── BackendClient.test.js       # Tests for API communication
│   ├── TaskFormManager.test.js     # Tests for form state management
│   ├── ModalManager.test.js        # Tests for modal notifications
│   └── HistoryRenderer.test.js     # Tests for DOM rendering
│
├── property/                       # Property-based tests for universal correctness
│   ├── formPersistence.property.test.js      # Properties 1, 2, 11
│   ├── taskStorage.property.test.js          # Properties 6, 7, 8, 14, 21
│   ├── modalNotifications.property.test.js   # Properties 3, 4, 5, 20
│   ├── historyRendering.property.test.js     # Properties 9, 10, 23
│   └── backendIntegration.property.test.js   # Properties 15, 16, 17, 18, 22
│
└── README.md                       # This file
```

## Testing Approach

### Unit Tests
Unit tests verify specific examples, edge cases, and integration points:
- Specific task data examples
- Error conditions (network failures, validation errors)
- Edge cases (empty storage, corrupted data)
- Component integration

### Property-Based Tests
Property-based tests verify universal properties across all inputs:
- Run 100+ iterations with randomized inputs
- Test correctness properties from the design document
- Validate requirements hold for all valid data
- Each property test references its design document property number

## Running Tests

### Prerequisites
- Jest or Vitest test runner
- jsdom or happy-dom for DOM testing
- fast-check library (loaded via CDN in index.html)

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm test tests/unit
```

### Run Property Tests Only
```bash
npm test tests/property
```

### Run Specific Test File
```bash
npm test tests/unit/TaskHistoryManager.test.js
```

## Property Test Coverage

The test suite implements 23 correctness properties from the design document:

| Property | Description | Requirements | Test File |
|----------|-------------|--------------|-----------|
| 1 | Form Persistence After Submission | 1.1 | formPersistence.property.test.js |
| 2 | Create Another Task Clears Form | 1.3 | formPersistence.property.test.js |
| 3 | Success Modal Displays Task Name | 2.1, 2.2 | modalNotifications.property.test.js |
| 4 | Modal Dismissal Preserves Form State | 2.4 | modalNotifications.property.test.js |
| 5 | No Text-Based Success Messages | 2.5 | modalNotifications.property.test.js |
| 6 | Task Storage Round Trip | 3.1, 3.5 | taskStorage.property.test.js |
| 7 | LocalStorage Persistence | 3.2 | taskStorage.property.test.js |
| 8 | History Chronological Ordering | 3.3 | taskStorage.property.test.js |
| 9 | History Item Completeness | 3.4 | historyRendering.property.test.js |
| 10 | History UI Completeness | 4.1, 8.1 | historyRendering.property.test.js |
| 11 | Edit Populates Form | 4.2 | formPersistence.property.test.js |
| 12 | Update Mode Button Change | 4.3 | (Unit test) |
| 13 | Update Mode Validation | 4.4 | (Unit test) |
| 14 | Update Modifies Storage | 4.5 | taskStorage.property.test.js |
| 15 | Backend Response Includes Message ID | 5.1 | backendIntegration.property.test.js |
| 16 | Update Request Includes Message ID | 5.3 | backendIntegration.property.test.js |
| 17 | Sync Error Displays Modal | 7.1 | backendIntegration.property.test.js |
| 18 | Failed Update Preserves Original Data | 7.2 | backendIntegration.property.test.js |
| 19 | Recovery Flow Updates Message ID | 7.4 | (Integration test) |
| 20 | Delete Confirmation Required | 8.2 | modalNotifications.property.test.js |
| 21 | Confirmed Deletion Removes Task | 8.3 | taskStorage.property.test.js |
| 22 | Delete Does Not Call Backend | 8.4 | backendIntegration.property.test.js |
| 23 | Delete Updates Display | 8.5 | historyRendering.property.test.js |

## Coverage Goals

- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: >95%
- Property test coverage: 100% of correctness properties

## Notes

- Property tests use fast-check library for randomized input generation
- Unit tests use Jest/Vitest with jsdom for DOM testing
- All tests reference specific requirements for traceability
- Mock SweetAlert2 and fetch API for isolated testing
