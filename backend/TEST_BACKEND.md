# Backend Testing Guide

This guide helps you verify that the updated backend is working correctly.

## Manual Testing with Browser Console

The easiest way to test the backend is using your browser's developer console:

### 1. Open Browser Console

1. Open your `index.html` in a browser
2. Press F12 (or Cmd+Option+I on Mac) to open Developer Tools
3. Go to the Console tab

### 2. Test the Backend

Paste this code into the console (replace `YOUR_WEB_APP_URL` with your actual URL):

```javascript
// Test function
async function testBackend() {
    const webAppUrl = "YOUR_WEB_APP_URL_HERE";
    
    const testData = {
        taskName: "Backend Test Task",
        description: "Testing the new JSON response format",
        priority: "Medium",
        assignedTo: "Development Team",
        user: "Test User"
    };
    
    console.log("Sending test request...");
    
    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log("Response received:");
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log("✅ SUCCESS!");
            console.log("Message ID:", result.messageId);
            console.log("Timestamp:", result.timestamp);
            return result;
        } else {
            console.error("❌ ERROR!");
            console.error("Error:", result.error);
            console.error("Details:", result.details);
            return result;
        }
    } catch (error) {
        console.error("❌ NETWORK ERROR!");
        console.error(error);
        throw error;
    }
}

// Run the test
testBackend();
```

### 3. Expected Output

**Success Case:**
```
Sending test request...
Response received:
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
✅ SUCCESS!
Message ID: 1234567890123456789
Timestamp: 2024-01-15T10:30:00.000Z
```

**Error Case (missing required field):**
```
Response received:
{
  "success": false,
  "error": "Invalid request",
  "details": "Task name and user are required"
}
❌ ERROR!
Error: Invalid request
Details: Task name and user are required
```

## Testing with cURL

You can also test from the command line:

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "taskName": "cURL Test Task",
    "description": "Testing from command line",
    "priority": "High",
    "assignedTo": "Development Team",
    "user": "CLI User"
  }'
```

Expected response:
```json
{
  "success": true,
  "messageId": "1234567890123456789",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing with Postman

1. Create a new POST request
2. Set URL to your Web App URL
3. Set Headers:
   - `Content-Type`: `text/plain`
4. Set Body (raw):
```json
{
  "taskName": "Postman Test Task",
  "description": "Testing from Postman",
  "priority": "Low",
  "assignedTo": "Marketing Team",
  "user": "Postman User"
}
```
5. Click Send
6. Verify the response contains `success`, `messageId`, and `timestamp`

## Verification Checklist

After testing, verify:

- [ ] Response is valid JSON (not plain text)
- [ ] Success response contains `success: true`
- [ ] Success response contains `messageId` (string)
- [ ] Success response contains `timestamp` (ISO 8601 format)
- [ ] Task appears in Discord channel
- [ ] Error responses contain `success: false`
- [ ] Error responses contain `error` and `details` fields

## Common Issues

### "SyntaxError: Unexpected token"
- The backend is still returning plain text instead of JSON
- Make sure you deployed the updated Code.gs file
- Try creating a new deployment

### "Discord webhook URL not configured"
- Add the DISCORD_WEBHOOK_URL script property
- See DEPLOYMENT.md for instructions

### "CORS error"
- Make sure you're using `Content-Type: text/plain` in the request
- Verify the Web App is deployed with "Anyone" access

### No messageId in response
- Make sure you added `?wait=true` to the webhook URL in the backend
- Check the sendToDiscord function in Code.gs

## Next Steps

Once you've verified the backend is working:

1. ✅ Backend returns JSON with messageId (Task 2.1 - COMPLETE)
2. ⏭️ Update frontend to parse JSON response (Task 8.1)
3. ⏭️ Store messageId in LocalStorage (Task 3.1)
4. ⏭️ Implement message editing (Tasks 2.2, 2.3)
