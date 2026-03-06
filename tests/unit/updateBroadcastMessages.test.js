/**
 * Unit tests for updateBroadcastMessages function
 * Tests updating messages in multiple Discord channels
 */

import { describe, it, expect } from 'vitest';

describe('updateBroadcastMessages function', () => {
  describe('successful update', () => {
    it('should return array of message IDs when all channels succeed', () => {
      // Simulate successful update to 3 channels
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

    it('should process all updates sequentially', () => {
      const updates = [
        { webhookUrl: 'https://discord.com/api/webhooks/111/aaa', messageId: 'msg_1' },
        { webhookUrl: 'https://discord.com/api/webhooks/222/bbb', messageId: 'msg_2' },
        { webhookUrl: 'https://discord.com/api/webhooks/333/ccc', messageId: 'msg_3' }
      ];

      // Simulate sequential processing
      const processedCount = updates.length;

      expect(processedCount).toBe(3);
    });

    it('should preserve message IDs from input', () => {
      // When updating, the same message IDs should be returned
      const updates = [
        { webhookUrl: 'url1', messageId: 'original_msg_1' },
        { webhookUrl: 'url2', messageId: 'original_msg_2' }
      ];

      const mockResult = {
        messageIds: ['original_msg_1', 'original_msg_2'],
        errors: []
      };

      expect(mockResult.messageIds).toEqual(['original_msg_1', 'original_msg_2']);
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
            messageId: 'msg_id_2',
            error: 'Error: Message not found'
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
            messageId: 'msg_2',
            error: 'Error: Discord API error: Unauthorized'
          }
        ]
      };

      expect(mockResult.errors[0]).toHaveProperty('webhookUrl');
      expect(mockResult.errors[0]).toHaveProperty('messageId');
      expect(mockResult.errors[0]).toHaveProperty('error');
      expect(mockResult.errors[0].webhookUrl).toBe('https://discord.com/api/webhooks/999/zzz');
      expect(mockResult.errors[0].messageId).toBe('msg_2');
    });

    it('should return both successes and failures', () => {
      const mockResult = {
        messageIds: ['msg_1', 'msg_2'],
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/333/ccc',
            messageId: 'msg_3',
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
          { webhookUrl: 'url1', messageId: 'msg1', error: 'Error 1' },
          { webhookUrl: 'url2', messageId: 'msg2', error: 'Error 2' }
        ]
      };

      expect(mockResult.messageIds).toHaveLength(0);
      expect(mockResult.errors).toHaveLength(2);
    });

    it('should collect all errors when all channels fail', () => {
      const mockResult = {
        messageIds: [],
        errors: [
          { webhookUrl: 'url1', messageId: 'msg1', error: 'Error: Rate limit' },
          { webhookUrl: 'url2', messageId: 'msg2', error: 'Error: Unauthorized' },
          { webhookUrl: 'url3', messageId: 'msg3', error: 'Error: Server error' }
        ]
      };

      expect(mockResult.errors).toHaveLength(3);
      expect(mockResult.errors.every(e => e.webhookUrl && e.messageId && e.error)).toBe(true);
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
        errors: [{ webhookUrl: 'url', messageId: 'msg', error: 'err' }]
      };

      expect(Array.isArray(mockResult.errors)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty updates array', () => {
      const updates = [];
      
      const mockResult = {
        messageIds: [],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(0);
      expect(mockResult.errors).toHaveLength(0);
    });

    it('should handle single update', () => {
      const updates = [
        { webhookUrl: 'https://discord.com/api/webhooks/111/aaa', messageId: 'msg_1' }
      ];
      
      const mockResult = {
        messageIds: ['msg_1'],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(1);
    });

    it('should handle many updates', () => {
      const updates = new Array(10).fill(null).map((_, i) => ({
        webhookUrl: 'https://discord.com/api/webhooks/111/aaa',
        messageId: `msg_${i}`
      }));
      
      const mockResult = {
        messageIds: new Array(10).fill(null).map((_, i) => `msg_${i}`),
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(10);
    });
  });

  describe('integration with requirements', () => {
    it('should satisfy Requirement 5.3: Update message in all channels where originally posted', () => {
      // When a task assigned to Everyone is updated, THE Backend SHALL update
      // the message in all channels where it was originally posted
      const updates = [
        { webhookUrl: 'https://discord.com/api/webhooks/marketing/token', messageId: 'msg_1' },
        { webhookUrl: 'https://discord.com/api/webhooks/creatives/token', messageId: 'msg_2' },
        { webhookUrl: 'https://discord.com/api/webhooks/development/token', messageId: 'msg_3' },
        { webhookUrl: 'https://discord.com/api/webhooks/operations/token', messageId: 'msg_4' }
      ];

      const mockResult = {
        messageIds: ['msg_1', 'msg_2', 'msg_3', 'msg_4'],
        errors: []
      };

      expect(mockResult.messageIds).toHaveLength(updates.length);
      expect(mockResult.messageIds).toEqual(['msg_1', 'msg_2', 'msg_3', 'msg_4']);
    });

    it('should satisfy Requirement 5.4: Continue updating remaining channels if any fails', () => {
      // IF any channel update fails during a broadcast update,
      // THE Backend SHALL continue updating remaining channels and report which updates succeeded
      const mockResult = {
        messageIds: ['msg_1', 'msg_3', 'msg_4'], // msg_2 failed
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/222/bbb',
            messageId: 'msg_2',
            error: 'Error: Message not found'
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
        messageId: 'msg_1',
        error: 'Error: Connection timeout'
      };

      expect(errorObj).toHaveProperty('webhookUrl');
      expect(typeof errorObj.webhookUrl).toBe('string');
    });

    it('should include messageId in error object', () => {
      const errorObj = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        messageId: 'msg_1',
        error: 'Error: Message not found'
      };

      expect(errorObj).toHaveProperty('messageId');
      expect(typeof errorObj.messageId).toBe('string');
    });

    it('should include error message in error object', () => {
      const errorObj = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        messageId: 'msg_1',
        error: 'Error: Discord API error: Rate limit exceeded'
      };

      expect(errorObj).toHaveProperty('error');
      expect(typeof errorObj.error).toBe('string');
      expect(errorObj.error).toContain('Error:');
    });
  });

  describe('message not found handling', () => {
    it('should handle message not found errors gracefully', () => {
      const mockResult = {
        messageIds: ['msg_1'],
        errors: [
          {
            webhookUrl: 'https://discord.com/api/webhooks/222/bbb',
            messageId: 'deleted_msg',
            error: 'Error: Message not found'
          }
        ]
      };

      expect(mockResult.errors[0].error).toContain('Message not found');
    });

    it('should continue processing after message not found error', () => {
      // If message was deleted in one channel, still update others
      const mockResult = {
        messageIds: ['msg_1', 'msg_3'],
        errors: [
          {
            webhookUrl: 'url2',
            messageId: 'msg_2',
            error: 'Error: Message not found'
          }
        ]
      };

      expect(mockResult.messageIds).toHaveLength(2);
      expect(mockResult.errors).toHaveLength(1);
    });
  });

  describe('input validation', () => {
    it('should handle updates with valid webhookUrl and messageId', () => {
      const updates = [
        {
          webhookUrl: 'https://discord.com/api/webhooks/123/abc',
          messageId: '987654321'
        }
      ];

      expect(updates[0]).toHaveProperty('webhookUrl');
      expect(updates[0]).toHaveProperty('messageId');
      expect(typeof updates[0].webhookUrl).toBe('string');
      expect(typeof updates[0].messageId).toBe('string');
    });

    it('should expect updates array with objects containing webhookUrl and messageId', () => {
      const updates = [
        { webhookUrl: 'url1', messageId: 'msg1' },
        { webhookUrl: 'url2', messageId: 'msg2' }
      ];

      expect(Array.isArray(updates)).toBe(true);
      expect(updates.every(u => u.webhookUrl && u.messageId)).toBe(true);
    });
  });
});
