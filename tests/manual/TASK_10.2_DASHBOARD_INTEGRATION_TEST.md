# Task 10.2 - Google Sheets Dashboard Integration Test Guide

## Overview
This guide helps verify that the Google Sheets Dashboard integration is working correctly, including data fetching, display, loading states, and error handling.

## Prerequisites
1. Google Apps Script backend deployed with `doGet` endpoint
2. Google Sheets with a "Dashboard" sheet containing task data
3. Dashboard sheet should have headers: id, taskName, description, priority, assignedTo, user, timestamp, lastModified, messageId

## Test Scenarios

### Test 1: Successful Dashboard Data Fetch
**Objective**: Verify that dashboard data is fetched and displayed correctly

**Steps**:
1. Open `index.html` in a browser
2. Observe the right column (Task History)
3. Wait for the data to load

**Expected Results**:
- ✅ Loading spinner appears initially with text "Loading dashboard data..."
- ✅ After loading, tasks from the Dashboard sheet are displayed
- ✅ Source indicator shows "📊 Data from Dashboard Sheet"
- ✅ Each task shows: task name, description, priority badge, assigned to, created by, timestamp
- ✅ Edit and Delete buttons are present for each task
- ✅ "🔄 Refresh Dashboard" button is visible at the top

**Pass Criteria**: All expected results are met

---

### Test 2: Empty Dashboard Sheet
**Objective**: Verify behavior when Dashboard sheet has no data (only headers)

**Steps**:
1. Clear all data rows from the Dashboard sheet (keep headers)
2. Refresh the page or click "🔄 Refresh Dashboard"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ After loading, message displays: "No tasks yet. Create your first task!"
- ✅ Source indicator shows "📊 Data from Dashboard Sheet"
- ✅ No error messages appear

**Pass Criteria**: All expected results are met

---

### Test 3: Dashboard Sheet Not Found
**Objective**: Verify error handling when Dashboard sheet doesn't exist

**Steps**:
1. Rename the "Dashboard" sheet to something else (e.g., "Dashboard_Backup")
2. Refresh the page or click "🔄 Refresh Dashboard"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Error message displays: "❌ Configuration error"
- ✅ "Retry" button is visible
- ✅ Console shows error: "Error fetching Dashboard data: Configuration error"
- ✅ System falls back to localStorage data
- ✅ Source indicator shows "💾 Data from Local Storage"

**Pass Criteria**: All expected results are met

---

### Test 4: Network Failure
**Objective**: Verify error handling when network request fails

**Steps**:
1. Open browser DevTools > Network tab
2. Enable "Offline" mode
3. Click "🔄 Refresh Dashboard"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Error is caught and logged to console
- ✅ System falls back to localStorage data
- ✅ Source indicator shows "💾 Data from Local Storage"
- ✅ No unhandled errors or crashes

**Pass Criteria**: All expected results are met

---

### Test 5: Refresh Button Functionality
**Objective**: Verify the refresh button re-fetches data

**Steps**:
1. Load the page and wait for initial data load
2. Add a new row to the Dashboard sheet manually
3. Click "🔄 Refresh Dashboard" button

**Expected Results**:
- ✅ Loading spinner appears
- ✅ New task appears in the history list
- ✅ All existing tasks remain visible
- ✅ Source indicator shows "📊 Data from Dashboard Sheet"

**Pass Criteria**: All expected results are met

---

### Test 6: Loading State Display
**Objective**: Verify loading state is shown during fetch

**Steps**:
1. Open browser DevTools > Network tab
2. Throttle network to "Slow 3G"
3. Click "🔄 Refresh Dashboard"

**Expected Results**:
- ✅ Loading spinner (⏳) appears immediately
- ✅ Text shows "Loading dashboard data..."
- ✅ Loading state is visible for the duration of the request
- ✅ Loading state is replaced by data when fetch completes

**Pass Criteria**: All expected results are met

---

### Test 7: Data Format Compatibility
**Objective**: Verify Dashboard data is rendered correctly with all fields

**Steps**:
1. Ensure Dashboard sheet has at least one task with all fields populated
2. Load the page

**Expected Results**:
- ✅ Task name is displayed as a heading
- ✅ Description is shown below the task name
- ✅ Priority badge shows correct color:
  - High = Red (#dc3545)
  - Medium = Yellow (#ffc107)
  - Low = Green (#28a745)
- ✅ "Assigned to" field shows the team name
- ✅ "Created by" field shows the user name
- ✅ Timestamp is formatted as locale string
- ✅ If lastModified differs from timestamp, "(edited: ...)" is shown

**Pass Criteria**: All expected results are met

---

### Test 8: Fallback to localStorage
**Objective**: Verify localStorage fallback when Dashboard fetch fails

**Steps**:
1. Create a task using the form (this stores it in localStorage)
2. Temporarily break the backend URL (change it to an invalid URL)
3. Refresh the page

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Dashboard fetch fails (logged to console)
- ✅ System automatically falls back to localStorage
- ✅ Tasks from localStorage are displayed
- ✅ Source indicator shows "💾 Data from Local Storage"
- ✅ No unhandled errors

**Pass Criteria**: All expected results are met

---

### Test 9: Retry Button After Error
**Objective**: Verify retry button re-attempts the fetch

**Steps**:
1. Cause a Dashboard fetch error (e.g., rename the sheet)
2. Wait for error message to appear
3. Fix the issue (rename sheet back to "Dashboard")
4. Click the "Retry" button

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Data is successfully fetched
- ✅ Error message is replaced with task list
- ✅ Source indicator shows "📊 Data from Dashboard Sheet"

**Pass Criteria**: All expected results are met

---

### Test 10: Integration with Task Creation
**Objective**: Verify new tasks appear after creation and refresh

**Steps**:
1. Load the page with Dashboard data visible
2. Create a new task using the form
3. Observe the history column

**Expected Results**:
- ✅ After task creation, `refreshHistoryDisplay()` is called
- ✅ Loading spinner appears briefly
- ✅ Dashboard is re-fetched
- ✅ New task appears in the history list (if backend writes to Dashboard sheet)
- ✅ Source indicator shows "📊 Data from Dashboard Sheet"

**Pass Criteria**: All expected results are met

---

## Backend Verification

### Verify doGet Endpoint
**Steps**:
1. Open the deployed Web App URL in a browser with `?action=getDashboard` parameter
2. Example: `https://script.google.com/.../exec?action=getDashboard`

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "taskName": "...",
      "description": "...",
      "priority": "...",
      "assignedTo": "...",
      "user": "...",
      "timestamp": "...",
      "lastModified": "...",
      "messageId": "..."
    }
  ],
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Pass Criteria**: Response matches expected format

---

## Summary Checklist

- [ ] Test 1: Successful Dashboard Data Fetch
- [ ] Test 2: Empty Dashboard Sheet
- [ ] Test 3: Dashboard Sheet Not Found
- [ ] Test 4: Network Failure
- [ ] Test 5: Refresh Button Functionality
- [ ] Test 6: Loading State Display
- [ ] Test 7: Data Format Compatibility
- [ ] Test 8: Fallback to localStorage
- [ ] Test 9: Retry Button After Error
- [ ] Test 10: Integration with Task Creation
- [ ] Backend Verification

## Notes
- The implementation already includes all required functionality:
  - ✅ DashboardClient class with fetchDashboardData() method
  - ✅ Loading state display in HistoryRenderer
  - ✅ Error handling with fallback to localStorage
  - ✅ Refresh button functionality
  - ✅ Source indicator showing data origin
  - ✅ Backend doGet endpoint with getDashboardData() function

## Troubleshooting

### Issue: "Configuration error: Dashboard sheet not found"
**Solution**: Ensure your Google Sheets has a sheet named exactly "Dashboard" (case-sensitive)

### Issue: "Network failure: Unable to reach the server"
**Solution**: 
1. Check that the Web App URL in `initializeApp()` is correct
2. Verify the Web App is deployed and accessible
3. Check browser console for CORS errors

### Issue: Data not updating after refresh
**Solution**:
1. Check that the Dashboard sheet has the correct headers
2. Verify the backend is reading from the correct spreadsheet
3. Check Apps Script logs for errors

### Issue: Falls back to localStorage every time
**Solution**:
1. Verify the backend doGet endpoint is working (test in browser)
2. Check that the Web App has proper permissions
3. Ensure the spreadsheet is bound to the script
