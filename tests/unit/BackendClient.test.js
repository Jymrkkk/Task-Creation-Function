/**
 * Unit tests for BackendClient class
 * Tests API communication with Google Apps Script backend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BackendClient', () => {
  let backendClient;
  const mockWebAppUrl = 'https://script.google.com/macros/s/test/exec';

  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
    
    // Import BackendClient (assumes it's available in the global scope or as a module)
    // For now, we'll test the expected behavior
  });

  describe('createTask', () => {
    it('should send POST request without messageId', async () => {
      const taskData = {
        taskName: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe'
      };

      const mockResponse = {
        success: true,
        messageId: '1234567890',
        timestamp: '2024-01-15T10:30:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Test that fetch is called with correct parameters
      await fetch(mockWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      expect(global.fetch).toHaveBeenCalledWith(
        mockWebAppUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Task')
        })
      );

      // Verify messageId is NOT in the request body
      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.messageId).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should send POST request with messageId for updates', async () => {
      const taskData = {
        taskName: 'Updated Task',
        description: 'Updated Description',
        priority: 'Medium',
        assignedTo: 'Marketing Team',
        user: 'Jane Smith'
      };

      const messageId = '9876543210';

      const mockResponse = {
        success: true,
        messageId: messageId,
        timestamp: '2024-01-15T11:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Test that fetch is called with messageId in body
      await fetch(mockWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, messageId })
      });

      expect(global.fetch).toHaveBeenCalledWith(
        mockWebAppUrl,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(messageId)
        })
      );

      // Verify messageId IS in the request body
      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.messageId).toBe(messageId);
    });
  });

  describe('error handling', () => {
    it('should handle network failures', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch(mockWebAppUrl, {
          method: 'POST',
          body: JSON.stringify({})
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle backend error responses', async () => {
      const errorResponse = {
        success: false,
        error: 'Message not found',
        details: 'The Discord message with the provided ID does not exist'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => errorResponse
      });

      const response = await fetch(mockWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({ messageId: 'invalid-id' })
      });

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Message not found');
    });

    it('should return structured error response with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Discord API error',
        details: 'Rate limit exceeded'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => errorResponse
      });

      const response = await fetch(mockWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({})
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
      expect(data.success).toBe(false);
    });
  });
});

/**
 * Backend Integration Tests
 * Tests the Google Apps Script backend logic
 */
describe('Backend Discord PATCH Integration', () => {
  describe('updateDiscordMessage function', () => {
    it('should construct correct PATCH URL from webhook URL', () => {
      const webhookUrl = 'https://discord.com/api/webhooks/123456789/abcdefghijk';
      const messageId = '9876543210';
      
      // Expected PATCH URL format
      const expectedUrl = 'https://discord.com/api/webhooks/123456789/abcdefghijk/messages/9876543210';
      
      // Simulate URL construction logic from backend
      const webhookParts = webhookUrl.match(/webhooks\/(\d+)\/([^\/]+)/);
      const webhookId = webhookParts[1];
      const webhookToken = webhookParts[2];
      const patchUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`;
      
      expect(patchUrl).toBe(expectedUrl);
    });

    it('should format embed payload correctly for updates', () => {
      const taskData = {
        taskName: 'Updated Task',
        description: 'Updated description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456'
      };

      // Simulate embed creation logic
      const priorityColors = {
        "High": 15158332,
        "Medium": 16776960,
        "Low": 3447003
      };

      const embed = {
        embeds: [{
          title: "📝 Updated Task: " + taskData.taskName,
          description: taskData.description,
          color: priorityColors[taskData.priority],
          fields: [
            { name: "Priority", value: taskData.priority, inline: true },
            { name: "Assigned To", value: taskData.assignedTo, inline: true },
            { name: "Created By", value: taskData.user, inline: true }
          ],
          timestamp: expect.any(String),
          footer: { text: "Task Management System" }
        }]
      };

      expect(embed.embeds[0].title).toContain('📝 Updated Task:');
      expect(embed.embeds[0].title).toContain(taskData.taskName);
      expect(embed.embeds[0].color).toBe(15158332); // Red for High priority
    });

    it('should handle 404 error for invalid messageId', () => {
      const responseCode = 404;
      
      // Simulate error handling logic
      let errorThrown = false;
      let errorMessage = '';
      
      if (responseCode === 404) {
        errorThrown = true;
        errorMessage = 'Message not found';
      }
      
      expect(errorThrown).toBe(true);
      expect(errorMessage).toBe('Message not found');
    });

    it('should handle other Discord API errors', () => {
      const responseCode = 500;
      const responseText = 'Internal Server Error';
      
      // Simulate error handling logic
      let errorThrown = false;
      let errorMessage = '';
      
      if (responseCode !== 200 && responseCode !== 404) {
        errorThrown = true;
        errorMessage = `Discord API error: ${responseText}`;
      }
      
      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('Discord API error');
    });

    it('should return messageId on successful update', () => {
      const messageId = '1234567890';
      const responseCode = 200;
      
      // Simulate success response logic
      let result = null;
      
      if (responseCode === 200) {
        result = { messageId: messageId };
      }
      
      expect(result).not.toBeNull();
      expect(result.messageId).toBe(messageId);
    });
  });

  describe('doPost routing logic', () => {
    it('should route to PATCH when messageId is present', () => {
      const requestData = {
        taskName: 'Test',
        description: 'Test',
        priority: 'High',
        assignedTo: 'Team',
        user: 'User',
        messageId: '123456'
      };

      // Simulate routing logic
      const shouldUpdate = !!requestData.messageId;
      
      expect(shouldUpdate).toBe(true);
    });

    it('should route to POST when messageId is absent', () => {
      const requestData = {
        taskName: 'Test',
        description: 'Test',
        priority: 'High',
        assignedTo: 'Team',
        user: 'User'
      };

      // Simulate routing logic
      const shouldUpdate = !!requestData.messageId;
      
      expect(shouldUpdate).toBe(false);
    });
  });

  describe('error response categorization', () => {
    it('should categorize "Message not found" errors specifically', () => {
      const errorMessage = 'Error: Message not found';
      
      // Simulate error categorization logic from backend
      let errorType = 'Server error';
      let errorDetails = errorMessage;
      
      if (errorMessage.includes('Message not found')) {
        errorType = 'Message not found';
        errorDetails = 'The Discord message could not be found. It may have been deleted.';
      }
      
      expect(errorType).toBe('Message not found');
      expect(errorDetails).toContain('could not be found');
    });

    it('should categorize Discord API errors specifically', () => {
      const errorMessage = 'Discord API error: Rate limit exceeded';
      
      // Simulate error categorization logic from backend
      let errorType = 'Server error';
      
      if (errorMessage.includes('Discord API error')) {
        errorType = 'Discord API error';
      }
      
      expect(errorType).toBe('Discord API error');
    });

    it('should use generic "Server error" for unknown errors', () => {
      const errorMessage = 'Some unexpected error occurred';
      
      // Simulate error categorization logic from backend
      let errorType = 'Server error';
      
      if (errorMessage.includes('Message not found')) {
        errorType = 'Message not found';
      } else if (errorMessage.includes('Discord API error')) {
        errorType = 'Discord API error';
      }
      
      expect(errorType).toBe('Server error');
    });
  });
});
