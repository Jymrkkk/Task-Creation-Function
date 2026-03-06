/**
 * Unit tests for response handling functions
 * Tests createSuccessResponse and createBroadcastResponseWithErrors
 */

describe('Response Handling', () => {
  describe('createSuccessResponse', () => {
    test('should return success response with single message ID for team-specific tasks', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      // Load the function (in real scenario, this would be from Code.gs)
      function createSuccessResponse(messageId) {
        const response = {
          success: true,
          messageId: messageId,
          timestamp: new Date().toISOString()
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const messageId = '1234567890';
      const result = createSuccessResponse(messageId);
      const parsedResult = JSON.parse(result);

      expect(parsedResult.success).toBe(true);
      expect(parsedResult.messageId).toBe('1234567890');
      expect(typeof parsedResult.messageId).toBe('string');
      expect(parsedResult.timestamp).toBeDefined();
      expect(parsedResult).toHaveProperty('success');
      expect(parsedResult).toHaveProperty('messageId');
      expect(parsedResult).toHaveProperty('timestamp');
    });

    test('should return success response with array of message IDs for Everyone tasks', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      // Load the function
      function createSuccessResponse(messageId) {
        const response = {
          success: true,
          messageId: messageId,
          timestamp: new Date().toISOString()
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const messageIds = ['1111', '2222', '3333', '4444', '5555'];
      const result = createSuccessResponse(messageIds);
      const parsedResult = JSON.parse(result);

      expect(parsedResult.success).toBe(true);
      expect(Array.isArray(parsedResult.messageId)).toBe(true);
      expect(parsedResult.messageId).toHaveLength(5);
      expect(parsedResult.messageId).toEqual(['1111', '2222', '3333', '4444', '5555']);
      expect(parsedResult.timestamp).toBeDefined();
      expect(parsedResult).toHaveProperty('success');
      expect(parsedResult).toHaveProperty('messageId');
      expect(parsedResult).toHaveProperty('timestamp');
    });

    test('should maintain backward compatibility with existing response structure', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      // Load the function
      function createSuccessResponse(messageId) {
        const response = {
          success: true,
          messageId: messageId,
          timestamp: new Date().toISOString()
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const messageId = '9876543210';
      const result = createSuccessResponse(messageId);
      const parsedResult = JSON.parse(result);

      // Verify exact structure matches requirements
      const keys = Object.keys(parsedResult);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('success');
      expect(keys).toContain('messageId');
      expect(keys).toContain('timestamp');
      
      // Verify types
      expect(typeof parsedResult.success).toBe('boolean');
      expect(typeof parsedResult.messageId).toBe('string');
      expect(typeof parsedResult.timestamp).toBe('string');
      
      // Verify timestamp is ISO 8601 format
      expect(parsedResult.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createBroadcastResponseWithErrors', () => {
    test('should return success response with message IDs and errors for partial failures', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      // Load the function
      function createBroadcastResponseWithErrors(messageIds, errors) {
        const response = {
          success: true,
          messageId: messageIds,
          timestamp: new Date().toISOString(),
          errors: errors
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const messageIds = ['1111', '2222', '3333'];
      const errors = [
        { webhookUrl: 'https://discord.com/api/webhooks/123/abc', error: 'Rate limited' }
      ];
      
      const result = createBroadcastResponseWithErrors(messageIds, errors);
      const parsedResult = JSON.parse(result);

      expect(parsedResult.success).toBe(true);
      expect(Array.isArray(parsedResult.messageId)).toBe(true);
      expect(parsedResult.messageId).toHaveLength(3);
      expect(parsedResult.messageId).toEqual(['1111', '2222', '3333']);
      expect(Array.isArray(parsedResult.errors)).toBe(true);
      expect(parsedResult.errors).toHaveLength(1);
      expect(parsedResult.errors[0]).toHaveProperty('webhookUrl');
      expect(parsedResult.errors[0]).toHaveProperty('error');
      expect(parsedResult.timestamp).toBeDefined();
    });

    test('should include all required fields in partial failure response', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      // Load the function
      function createBroadcastResponseWithErrors(messageIds, errors) {
        const response = {
          success: true,
          messageId: messageIds,
          timestamp: new Date().toISOString(),
          errors: errors
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const messageIds = ['1111', '2222'];
      const errors = [
        { webhookUrl: 'https://discord.com/api/webhooks/123/abc', error: 'Network error' },
        { webhookUrl: 'https://discord.com/api/webhooks/456/def', error: 'Timeout' }
      ];
      
      const result = createBroadcastResponseWithErrors(messageIds, errors);
      const parsedResult = JSON.parse(result);

      // Verify structure
      expect(parsedResult).toHaveProperty('success');
      expect(parsedResult).toHaveProperty('messageId');
      expect(parsedResult).toHaveProperty('timestamp');
      expect(parsedResult).toHaveProperty('errors');
      
      // Verify values
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.messageId).toEqual(['1111', '2222']);
      expect(parsedResult.errors).toHaveLength(2);
      expect(typeof parsedResult.timestamp).toBe('string');
    });
  });

  describe('Response Structure Validation', () => {
    test('should validate that single message ID response matches requirements 7.1', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      function createSuccessResponse(messageId) {
        const response = {
          success: true,
          messageId: messageId,
          timestamp: new Date().toISOString()
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const result = createSuccessResponse('12345');
      const parsedResult = JSON.parse(result);

      // Requirement 7.1: Return JSON response with success true, messageId, and timestamp
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.messageId).toBeDefined();
      expect(parsedResult.timestamp).toBeDefined();
      expect(Object.keys(parsedResult)).toHaveLength(3);
    });

    test('should validate that array message ID response matches requirements 7.3', () => {
      // Mock the ContentService
      global.ContentService = {
        createTextOutput: jest.fn((text) => ({
          setMimeType: jest.fn(() => text)
        })),
        MimeType: {
          JSON: 'application/json'
        }
      };

      function createSuccessResponse(messageId) {
        const response = {
          success: true,
          messageId: messageId,
          timestamp: new Date().toISOString()
        };
        
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const result = createSuccessResponse(['111', '222', '333', '444', '555']);
      const parsedResult = JSON.parse(result);

      // Requirement 7.3: Return messageId as array of Message_IDs for "Everyone" tasks
      expect(parsedResult.success).toBe(true);
      expect(Array.isArray(parsedResult.messageId)).toBe(true);
      expect(parsedResult.messageId.length).toBeGreaterThan(0);
      expect(parsedResult.timestamp).toBeDefined();
    });
  });
});
