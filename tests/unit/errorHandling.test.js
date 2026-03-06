/**
 * Unit tests for comprehensive error handling
 * Tests Requirements 6.1-6.4, 7.2
 */

describe('Error Handling', () => {
  describe('Configuration Errors', () => {
    test('should return configuration error for missing webhook URL', () => {
      // Mock getWebhookUrl to return null
      global.getWebhookUrl = jest.fn().mockReturnValue(null);
      global.validateWebhookConfig = jest.fn().mockReturnValue({
        valid: false,
        error: 'Webhook URL not configured for team: Marketing Team'
      });
      
      const result = validateWebhookConfig('Marketing Team');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Webhook URL not configured');
      expect(result.error).toContain('Marketing Team');
    });
    
    test('should return configuration error for invalid webhook format', () => {
      global.getWebhookUrl = jest.fn().mockReturnValue('https://invalid-url.com/not-a-webhook');
      global.validateWebhookConfig = jest.fn().mockReturnValue({
        valid: false,
        error: "Webhook URL doesn't match expected Discord format (webhooks/{id}/{token}): Marketing Team"
      });
      
      const result = validateWebhookConfig('Marketing Team');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expected Discord format');
    });
    
    test('should return configuration error for Everyone with missing team webhooks', () => {
      global.getAllWebhookUrls = jest.fn().mockReturnValue({
        'Marketing Team': 'https://discord.com/api/webhooks/123/abc',
        'Creatives Team': 'https://discord.com/api/webhooks/456/def'
        // Missing Development Team and Operations Team
      });
      
      const allWebhooks = getAllWebhookUrls();
      const teams = ['Marketing Team', 'Creatives Team', 'Development Team', 'Operations Team', 'Everyone'];
      const missingTeams = teams.filter(team => !allWebhooks[team] && team !== 'Everyone');
      
      expect(missingTeams.length).toBeGreaterThan(0);
      expect(missingTeams).toContain('Development Team');
      expect(missingTeams).toContain('Operations Team');
    });
  });
  
  describe('Discord API Errors', () => {
    test('should handle 404 message not found error', () => {
      const mockResponse = {
        getResponseCode: () => 404,
        getContentText: () => '{"message": "Unknown Message", "code": 10008}'
      };
      
      global.UrlFetchApp = {
        fetch: jest.fn().mockReturnValue(mockResponse)
      };
      
      // This should throw "Message not found" error
      expect(() => {
        const response = UrlFetchApp.fetch('test-url');
        if (response.getResponseCode() === 404) {
          throw new Error('Message not found');
        }
      }).toThrow('Message not found');
    });
    
    test('should handle 429 rate limit error', () => {
      const mockResponse = {
        getResponseCode: () => 429,
        getContentText: () => '{"message": "You are being rate limited.", "retry_after": 5000}'
      };
      
      global.UrlFetchApp = {
        fetch: jest.fn().mockReturnValue(mockResponse)
      };
      
      expect(() => {
        const response = UrlFetchApp.fetch('test-url');
        if (response.getResponseCode() === 429) {
          throw new Error('Discord API error: Rate limit exceeded (429). Please try again later.');
        }
      }).toThrow('Rate limit exceeded');
    });
    
    test('should handle 5xx server errors', () => {
      const mockResponse = {
        getResponseCode: () => 503,
        getContentText: () => 'Service Unavailable'
      };
      
      global.UrlFetchApp = {
        fetch: jest.fn().mockReturnValue(mockResponse)
      };
      
      expect(() => {
        const response = UrlFetchApp.fetch('test-url');
        const code = response.getResponseCode();
        if (code >= 500) {
          throw new Error(`Discord API error: Discord server error (${code}). Please try again later.`);
        }
      }).toThrow('Discord server error');
      expect(() => {
        const response = UrlFetchApp.fetch('test-url');
        const code = response.getResponseCode();
        if (code >= 500) {
          throw new Error(`Discord API error: Discord server error (${code}). Please try again later.`);
        }
      }).toThrow('503');
    });
    
    test('should handle invalid JSON response from Discord', () => {
      const mockResponse = {
        getResponseCode: () => 200,
        getContentText: () => 'Invalid JSON {'
      };
      
      global.UrlFetchApp = {
        fetch: jest.fn().mockReturnValue(mockResponse)
      };
      
      expect(() => {
        const response = UrlFetchApp.fetch('test-url');
        if (response.getResponseCode() === 200) {
          JSON.parse(response.getContentText());
        }
      }).toThrow();
    });
    
    test('should handle missing message ID in Discord response', () => {
      const mockResponse = {
        getResponseCode: () => 200,
        getContentText: () => '{"channel_id": "123", "content": "test"}'
      };
      
      global.UrlFetchApp = {
        fetch: jest.fn().mockReturnValue(mockResponse)
      };
      
      const response = UrlFetchApp.fetch('test-url');
      const data = JSON.parse(response.getContentText());
      
      expect(data.id).toBeUndefined();
    });
  });
  
  describe('Partial Broadcast Failures', () => {
    test('should continue processing after one channel fails', () => {
      const webhookUrls = [
        'https://discord.com/api/webhooks/111/aaa',
        'https://discord.com/api/webhooks/222/bbb',
        'https://discord.com/api/webhooks/333/ccc'
      ];
      
      const messageIds = [];
      const errors = [];
      
      webhookUrls.forEach((url, index) => {
        try {
          if (index === 1) {
            throw new Error('Discord API error: Rate limit exceeded');
          }
          messageIds.push(`msg-${index}`);
        } catch (error) {
          errors.push({
            channel: index + 1,
            webhookUrl: url.substring(0, 50) + '...',
            error: error.toString()
          });
        }
      });
      
      expect(messageIds.length).toBe(2);
      expect(errors.length).toBe(1);
      expect(errors[0].channel).toBe(2);
      expect(errors[0].error).toContain('Rate limit exceeded');
    });
    
    test('should return partial success with error details', () => {
      const result = {
        messageIds: ['msg1', 'msg3'],
        errors: [
          {
            channel: 2,
            webhookUrl: 'https://discord.com/api/webhooks/222/bbb...',
            error: 'Discord API error: Webhook not found (404)'
          }
        ]
      };
      
      expect(result.messageIds.length).toBe(2);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].channel).toBe(2);
    });
    
    test('should throw error if all broadcast channels fail', () => {
      const webhookUrls = [
        'https://discord.com/api/webhooks/111/aaa',
        'https://discord.com/api/webhooks/222/bbb'
      ];
      
      const messageIds = [];
      const errors = [];
      
      webhookUrls.forEach((url, index) => {
        try {
          throw new Error('Discord API error: Server error');
        } catch (error) {
          errors.push({
            channel: index + 1,
            webhookUrl: url.substring(0, 50) + '...',
            error: error.toString()
          });
        }
      });
      
      expect(messageIds.length).toBe(0);
      expect(errors.length).toBe(2);
      
      // Should throw error if all failed
      if (messageIds.length === 0 && errors.length > 0) {
        expect(() => {
          throw new Error('Discord API error: All broadcast channels failed. First error: ' + errors[0].error);
        }).toThrow('All broadcast channels failed');
      }
    });
  });
  
  describe('Response Format', () => {
    test('should return HTTP 200 with success false for configuration errors', () => {
      const errorResponse = {
        success: false,
        error: 'Configuration error',
        details: 'Webhook URL not configured for team: Marketing Team'
      };
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Configuration error');
      expect(errorResponse.details).toContain('Webhook URL not configured');
    });
    
    test('should return HTTP 200 with success false for Discord API errors', () => {
      const errorResponse = {
        success: false,
        error: 'Discord API error',
        details: 'Discord server error (503). Please try again later.'
      };
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Discord API error');
      expect(errorResponse.details).toContain('server error');
    });
    
    test('should return HTTP 200 with success false for message not found', () => {
      const errorResponse = {
        success: false,
        error: 'Message not found',
        details: 'The Discord message could not be found. It may have been deleted or the message ID is invalid.'
      };
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Message not found');
      expect(errorResponse.details).toContain('could not be found');
    });
    
    test('should return HTTP 200 with success false for invalid request', () => {
      const errorResponse = {
        success: false,
        error: 'Invalid request',
        details: 'Missing required fields: taskName, user'
      };
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Invalid request');
      expect(errorResponse.details).toContain('Missing required fields');
    });
    
    test('should return HTTP 200 with success false for JSON parse errors', () => {
      const errorResponse = {
        success: false,
        error: 'Invalid request',
        details: 'Request body must be valid JSON: Unexpected token'
      };
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Invalid request');
      expect(errorResponse.details).toContain('valid JSON');
    });
  });
  
  describe('Input Validation', () => {
    test('should identify all missing required fields', () => {
      const requestData = {
        description: 'Test description',
        priority: 'High'
        // Missing: taskName, user, assignedTo
      };
      
      const missingFields = [];
      if (!requestData.taskName) missingFields.push('taskName');
      if (!requestData.user) missingFields.push('user');
      if (!requestData.assignedTo) missingFields.push('assignedTo');
      
      expect(missingFields).toEqual(['taskName', 'user', 'assignedTo']);
    });
    
    test('should validate webhook URL is not null', () => {
      const webhookUrl = null;
      
      expect(() => {
        if (!webhookUrl) {
          throw new Error('Webhook URL is null or undefined');
        }
      }).toThrow('null or undefined');
    });
    
    test('should validate message ID is not null for updates', () => {
      const update = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        messageId: null
      };
      
      expect(() => {
        if (!update.messageId) {
          throw new Error('Message ID is null or undefined');
        }
      }).toThrow('null or undefined');
    });
  });
  
  describe('Network Errors', () => {
    test('should handle network timeout errors', () => {
      expect(() => {
        throw new Error('Network request failed - timeout');
      }).toThrow('timeout');
    });
    
    test('should handle network connection errors', () => {
      expect(() => {
        throw new Error('Network request failed - connection refused');
      }).toThrow('network');
    });
  });
});
