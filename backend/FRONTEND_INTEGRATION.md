# Frontend Integration Guide

This guide shows how to update your frontend code to work with the new JSON response format from the backend.

## Current Frontend Code (Before Update)

The current `index.html` expects a plain text response:

```javascript
const response = await fetch(webAppUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(taskData)
});

if (response.ok) {
    statusText.innerText = "✅ Task successfully sent to Discord!";
    // No messageId available
}
```

## Updated Frontend Code (After Backend Update)

After deploying the updated backend, you need to parse the JSON response:

```javascript
const response = await fetch(webAppUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(taskData)
});

// Parse JSON response
const result = await response.json();

if (result.success) {
    // Success! We now have the messageId and timestamp
    console.log('Message ID:', result.messageId);
    console.log('Timestamp:', result.timestamp);
    
    statusText.innerText = "✅ Task successfully sent to Discord!";
    
    // Store the messageId for future updates (Task 3.1)
    // This will be implemented in later tasks
    
} else {
    // Handle error response
    console.error('Error:', result.error);
    console.error('Details:', result.details);
    
    statusText.innerText = `❌ Error: ${result.error}`;
}
```

## Complete Example Function

Here's a complete updated version of the `sendTestTask()` function:

```javascript
async function sendTestTask() {
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("statusText");
    
    const webAppUrl = "https://script.google.com/macros/s/AKfycbw_trKU324cKIK779kmxJX5UxfQMlmdXiKHRo_X1hIOcUPEGdZtjCWPQyKvGIDE2zb-xQ/exec";

    // Validation
    const taskName = document.getElementById("taskName").value.trim();
    const user = document.getElementById("user").value.trim();
    
    if (!taskName || !user) {
        statusText.innerText = "⚠️ Please fill in the Task Name and User.";
        statusText.style.color = "orange";
        return;
    }

    // Update UI to loading state
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending...";
    statusText.innerText = "Sending... Please wait.";
    statusText.style.color = "#6a0dad";

    // Construct payload
    const taskData = {
        taskName: taskName,
        description: document.getElementById("description").value.trim(),
        priority: document.getElementById("priority").value,
        assignedTo: document.getElementById("assignedTo").value,
        user: user
    };

    // Send to backend
    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(taskData)
        });

        // Parse JSON response
        const result = await response.json();

        if (result.success) {
            // Success!
            statusText.innerText = "✅ Task successfully sent to Discord!";
            statusText.style.color = "green";
            
            // Log the messageId for debugging
            console.log('Discord Message ID:', result.messageId);
            console.log('Timestamp:', result.timestamp);
            
            // TODO: Store messageId in LocalStorage (will be implemented in Task 3.1)
            // For now, we just log it
            
            // Keep form data (Requirement 1.1)
            // Don't clear the form - this will be handled by "Create Another Task" button
            
        } else {
            // Backend returned an error
            throw new Error(result.error + ': ' + result.details);
        }
        
    } catch (err) {
        statusText.innerText = "❌ Error: " + err.message;
        statusText.style.color = "red";
        console.error('Full error:', err);
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Task";
        
        // Clear status message after 5 seconds
        setTimeout(() => {
            statusText.innerText = "";
        }, 5000);
    }
}
```

## Key Changes

1. **Parse JSON Response**: Use `response.json()` instead of checking `response.ok`
2. **Check `result.success`**: The success field indicates if the operation succeeded
3. **Access `messageId`**: Available in `result.messageId` for successful requests
4. **Access `timestamp`**: Available in `result.timestamp` for successful requests
5. **Handle Errors**: Error responses include `result.error` and `result.details`

## Response Format Reference

### Success Response
```json
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid request",
  "details": "Task name and user are required"
}
```

## Testing the Integration

1. Deploy the updated backend (see `DEPLOYMENT.md`)
2. Update your `index.html` with the new code above
3. Open the page in a browser
4. Submit a test task
5. Check the browser console for the messageId
6. Verify the task appears in Discord

## Next Steps

This update (Task 2.1) provides the foundation for:
- **Task 3.1**: Storing tasks with messageId in LocalStorage
- **Task 5.3**: Editing existing Discord messages using the messageId
- **Task 7.1**: Error handling for message sync failures

The messageId is essential for implementing the edit functionality in later tasks.
