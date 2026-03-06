# Manual Test Plan: Task 11.2 - Form Validation in Update Mode

## Objective
Verify that form validation works correctly in update mode according to Requirement 4.4.

## Requirements Being Tested
- **Requirement 4.4**: WHEN the update button is clicked, THE Task_Form SHALL validate all required fields before proceeding

## Test Prerequisites
1. Open `index.html` in a web browser
2. Ensure the backend is configured (or use mock mode)
3. Clear browser LocalStorage to start fresh

## Test Cases

### Test Case 1: Validation Prevents Submission with Empty Task Name

**Steps:**
1. Create a new task with all fields filled
2. Click "Edit" on the created task
3. Verify the form enters update mode (button shows "Update Task")
4. Clear the "Task Name" field
5. Click "Update Task"

**Expected Results:**
- ✅ Error modal appears with message "Please fill in all required fields"
- ✅ Modal details show "Task Name, Description, and User are required."
- ✅ Form does NOT submit
- ✅ Task in history remains unchanged
- ✅ Form stays in update mode

### Test Case 2: Validation Prevents Submission with Empty Description

**Steps:**
1. Click "Edit" on an existing task
2. Clear the "Description" field
3. Click "Update Task"

**Expected Results:**
- ✅ Error modal appears
- ✅ Form does NOT submit
- ✅ Task remains unchanged

### Test Case 3: Validation Prevents Submission with Empty User

**Steps:**
1. Click "Edit" on an existing task
2. Clear the "Created By (User)" field
3. Click "Update Task"

**Expected Results:**
- ✅ Error modal appears
- ✅ Form does NOT submit
- ✅ Task remains unchanged

### Test Case 4: Validation Prevents Submission with All Fields Empty

**Steps:**
1. Click "Edit" on an existing task
2. Clear ALL required fields (Task Name, Description, User)
3. Click "Update Task"

**Expected Results:**
- ✅ Error modal appears
- ✅ Form does NOT submit
- ✅ Task remains unchanged

### Test Case 5: Validation Rejects Whitespace-Only Fields

**Steps:**
1. Click "Edit" on an existing task
2. Set "Task Name" to only spaces: "   "
3. Click "Update Task"

**Expected Results:**
- ✅ Error modal appears (whitespace is trimmed, field is considered empty)
- ✅ Form does NOT submit

### Test Case 6: Validation Passes with All Fields Filled

**Steps:**
1. Click "Edit" on an existing task
2. Ensure all required fields have valid values
3. Modify one or more fields
4. Click "Update Task"

**Expected Results:**
- ✅ NO error modal appears
- ✅ Success modal appears with task name
- ✅ Task updates successfully in history
- ✅ Form returns to create mode
- ✅ Updated values are reflected in the history

### Test Case 7: Validation Works After Multiple Edit Attempts

**Steps:**
1. Click "Edit" on a task
2. Clear a required field and click "Update Task" (validation fails)
3. Dismiss the error modal
4. Fill in the required field
5. Click "Update Task" again

**Expected Results:**
- ✅ First attempt: Error modal appears
- ✅ Second attempt: Success modal appears
- ✅ Task updates successfully

### Test Case 8: Validation Applies to All Required Fields Simultaneously

**Steps:**
1. Click "Edit" on a task
2. Clear Task Name and Description (leave User filled)
3. Click "Update Task"

**Expected Results:**
- ✅ Error modal appears
- ✅ Form does NOT submit
- ✅ All empty required fields are validated

## Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Empty Task Name | ⬜ Pass / ⬜ Fail | |
| TC2: Empty Description | ⬜ Pass / ⬜ Fail | |
| TC3: Empty User | ⬜ Pass / ⬜ Fail | |
| TC4: All Fields Empty | ⬜ Pass / ⬜ Fail | |
| TC5: Whitespace Only | ⬜ Pass / ⬜ Fail | |
| TC6: All Fields Valid | ⬜ Pass / ⬜ Fail | |
| TC7: Multiple Attempts | ⬜ Pass / ⬜ Fail | |
| TC8: Multiple Empty Fields | ⬜ Pass / ⬜ Fail | |

## Success Criteria
All test cases must pass for Task 11.2 to be considered complete.

## Notes
- The validation logic is the same for both create and update modes
- Validation occurs at the beginning of `sendTestTask()` before mode checking
- Error messages are displayed using SweetAlert2 modal dialogs
- The validation method `validateForm()` checks: taskName, description, and user fields
