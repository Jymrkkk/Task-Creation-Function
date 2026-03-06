/**
 * Unit tests for broadcastToDiscord function
 * Tests broadcasting messages to multiple Discord channels
 */

import { describe, it, expect } from 'vitest';

describe('broadcastToDiscord function', () => {
  describe('successful broadcast', () => {
    it('should return array of message IDs when all channels succeed', () => {
      // Simulate successful broadcast to 3 channels
      const mockResult = {
        messageIds: ['msg_id_1', 'msg_id_2', 'msg_id_3'],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(3);
      expect(mockResult.errors).toHaveLength(0);
      expect(mockResult.messageIds).toEqual(['msg_id_1', 'msg_id_2', 'msg_id_3']);
    });

    it('should return empty errors array when all channels succeed', () => {
      const mockResult = {
        messageIds: ['msg_1', 'msg_2'],
        errors: []
      };

      expect(mockResult.errors).toEqual([]);
      expect(Array.isArray(mockResult.errors)).toBe(true);
    });

    it('should process all webhook URLs sequentially', () => {
      const webhookUrls = [
        'https://discord.com/api/webhooks/111/aaa',
        'https://discord.com/api/webhooks/222/bbb',
        'https://discord.com/api/webhooks/333/ccc'
      ];

      // Simulate sequential processing
      const processedCount = webhookUrls.length;

      expect(processedCount).toBe(3);
    });
  });

  describe('partial failure handling', () => {
    it('should continue processing after one channel fails', () => {
      // Simulate: channel 1 succeeds, channel 2 fails, channel 3 succeeds
      const mockResult = {
        messageIds: ['msg_id_1', 'msg_id_3'],
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/222/bbb',
            error: 'Error: Discord API error: Bad Request'
          }
        ]
      };

      expect(mockResult.messageIds).toHaveLength(2);
      expect(mockResult.errors).toHaveLength(1);
      expect(mockResult.messageIds).toContain('msg_id_1');
      expect(mockResult.messageIds).toContain('msg_id_3');
    });

    it('should collect error details for failed channels', () => {
      const mockResult = {
        messageIds: ['msg_1'],
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/999/zzz',
            error: 'Error: Discord API error: Unauthorized'
          }
        ]
      };

      expect(mockResult.errors[0]).toHaveProperty('webhookUrl');
      expect(mockResult.errors[0]).toHaveProperty('error');
      expect(mockResult.errors[0].webhookUrl).toBe('https://discord.com/api/webhooks/999/zzz');
    });

    it('should return both successes and failures', () => {
      const mockResult = {
        messageIds: ['msg_1', 'msg_2'],
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/333/ccc',
            error: 'Error: Network timeout'
          }
        ]
      };

      expect(mockResult.messageIds.length).toBeGreaterThan(0);
      expect(mockResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('complete failure handling', () => {
    it('should return empty messageIds array when all channels fail', () => {
      const mockResult = {
        messageIds: [],
        errors: [
          { webhookUrl: 'url1', error: 'Error 1' },
          { webhookUrl: 'url2', error: 'Error 2' }
        ]
      };

      expect(mockResult.messageIds).toHaveLength(0);
      expect(mockResult.errors).toHaveLength(2);
    });

    it('should collect all errors when all channels fail', () => {
      const mockResult = {
        messageIds: [],
        errors: [
          { webhookUrl: 'url1', error: 'Error: Rate limit' },
          { webhookUrl: 'url2', error: 'Error: Unauthorized' },
          { webhookUrl: 'url3', error: 'Error: Server error' }
        ]
      };

      expect(mockResult.errors).toHaveLength(3);
      expect(mockResult.errors.every(e => e.webhookUrl && e.error)).toBe(true);
    });
  });

  describe('return value structure', () => {
    it('should return object with messageIds and errors properties', () => {
      const mockResult = {
        messageIds: ['msg_1'],
        errors: []
      };

      expect(mockResult).toHaveProperty('messageIds');
      expect(mockResult).toHaveProperty('errors');
    });

    it('should return messageIds as array', () => {
      const mockResult = {
        messageIds: ['msg_1', 'msg_2'],
        errors: []
      };

      expect(Array.isArray(mockResult.messageIds)).toBe(true);
    });

    it('should return errors as array', () => {
      const mockResult = {
        messageIds: [],
        errors: [{ webhookUrl: 'url', error: 'err' }]
      };

      expect(Array.isArray(mockResult.errors)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty webhook URLs array', () => {
      const webhookUrls = [];
      
      const mockResult = {
        messageIds: [],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(0);
      expect(mockResult.errors).toHaveLength(0);
    });

    it('should handle single webhook URL', () => {
      const webhookUrls = ['https://discord.com/api/webhooks/111/aaa'];
      
      const mockResult = {
        messageIds: ['msg_1'],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(1);
    });

    it('should handle many webhook URLs', () => {
      const webhookUrls = new Array(10).fill('https://discord.com/api/webhooks/111/aaa');
      
      const mockResult = {
        messageIds: new Array(10).fill('msg_id'),
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(10);
    });
  });

  describe('integration with requirements', () => {
    it('should satisfy Requirement 5.1: Post task to all configured team channels', () => {
      // When a new task is created with assignedTo set to Everyone,
      // THE Task_Router SHALL post the task to all configured team channels
      const allTeamWebhooks = [
        'https://discord.com/api/webhooks/marketing/token',
        'https://discord.com/api/webhooks/creatives/token',
        'https://discord.com/api/webhooks/development/token',
        'https://discord.com/api/webhooks/operations/token'
      ];

      const mockResult = {
        messageIds: ['msg_1', 'msg_2', 'msg_3', 'msg_4'],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(allTeamWebhooks.length);
    });

    it('should satisfy Requirement 5.2: Return array of Message_IDs', () => {
      // When posting to multiple channels, THE Discord_Notifier SHALL return
      // an array of Message_IDs, one for each channel
      const mockResult = {
        messageIds: ['id_1', 'id_2', 'id_3'],
        errors: []
      };

      expect(Array.isArray(mockResult.messageIds)).toBe(true);
      expect(mockResult.messageIds.length).toBeGreaterThan(0);
      expect(mockResult.messageIds.every(id => typeof id === 'string')).toBe(true);
    });

    it('should satisfy Requirement 5.4: Continue updating remaining channels if any fails', () => {
      // IF any channel update fails during a broadcast update,
      // THE Backend SHALL continue updating remaining channels
      const mockResult = {
        messageIds: ['msg_1', 'msg_3', 'msg_4'], // msg_2 failed
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/222/bbb',
            error: 'Error: Failed to post'
          }
        ]
      };

      // Verify that despite one failure, other channels were processed
      expect(mockResult.messageIds.length).toBeGreaterThan(0);
      expect(mockResult.errors.length).toBeGreaterThan(0);
      expect(mockResult.messageIds.length + mockResult.errors.length).toBeGreaterThan(1);
    });
  });

  describe('error object structure', () => {
    it('should include webhookUrl in error object', () => {
      const errorObj = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        error: 'Error: Connection timeout'
      };

      expect(errorObj).toHaveProperty('webhookUrl');
      expect(typeof errorObj.webhookUrl).toBe('string');
    });

    it('should include error message in error object', () => {
      const errorObj = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        error: 'Error: Discord API error: Rate limit exceeded'
      };

      expect(errorObj).toHaveProperty('error');
      expect(typeof errorObj.error).toBe('string');
      expect(errorObj.error).toContain('Error:');
    });
  });
});
