/**
 * Unit tests for createDiscordEmbed function
 * Tests the cross-channel reassignment indicator feature
 * Requirements: 4.3
 */

import { describe, it, expect } from 'vitest';

// Simulate the createDiscordEmbed function logic from backend/Code.gs
function createDiscordEmbed(taskData, options) {
  const priorityColors = {
    "High": 15158332,
    "Medium": 16776960,
    "Low": 3447003
  };
  
  const color = priorityColors[taskData.priority] || 3447003;
  const titlePrefix = taskData.messageId ? "📝 Updated Task: " : "📋 New Task: ";
  
  const fields = [
    { name: "Priority", value: taskData.priority, inline: true },
    { name: "Assigned To", value: taskData.assignedTo, inline: true },
    { name: "Created By", value: taskData.user, inline: true }
  ];
  
  if (options && options.isCrossChannel && options.originalTeam) {
    fields.push({
      name: "⚠️ Reassigned",
      value: "This task was reassigned from " + options.originalTeam,
      inline: false
    });
  }
  
  return {
    embeds: [{
      title: titlePrefix + taskData.taskName,
      description: taskData.description || "No description provided",
      color: color,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: { text: "Task Management System" }
    }]
  };
}

describe('createDiscordEmbed', () => {
  const mockTaskData = {
    taskName: 'Test Task',
    description: 'Test description',
    priority: 'High',
    assignedTo: 'Marketing Team',
    user: 'Test User'
  };

  describe('backward compatibility', () => {
    it('should create embed without options parameter', () => {
      const embed = createDiscordEmbed(mockTaskData);
      
      expect(embed).toBeDefined();
      expect(embed.embeds).toHaveLength(1);
      expect(embed.embeds[0].title).toContain('Test Task');
      expect(embed.embeds[0].fields).toHaveLength(3);
    });

    it('should create embed with empty options parameter', () => {
      const embed = createDiscordEmbed(mockTaskData, {});
      
      expect(embed).toBeDefined();
      expect(embed.embeds[0].fields).toHaveLength(3);
    });
  });

  describe('cross-channel reassignment indicator', () => {
    it('should add reassignment field when isCrossChannel is true', () => {
      const options = {
        isCrossChannel: true,
        originalTeam: 'Development Team'
      };
      
      const embed = createDiscordEmbed(mockTaskData, options);
      
      expect(embed.embeds[0].fields).toHaveLength(4);
      
      const reassignmentField = embed.embeds[0].fields[3];
      expect(reassignmentField.name).toBe('⚠️ Reassigned');
      expect(reassignmentField.value).toBe('This task was reassigned from Development Team');
      expect(reassignmentField.inline).toBe(false);
    });

    it('should not add reassignment field when isCrossChannel is false', () => {
      const options = {
        isCrossChannel: false,
        originalTeam: 'Development Team'
      };
      
      const embed = createDiscordEmbed(mockTaskData, options);
      
      expect(embed.embeds[0].fields).toHaveLength(3);
    });

    it('should not add reassignment field when originalTeam is missing', () => {
      const options = {
        isCrossChannel: true
      };
      
      const embed = createDiscordEmbed(mockTaskData, options);
      
      expect(embed.embeds[0].fields).toHaveLength(3);
    });

    it('should handle cross-channel update with Everyone team', () => {
      const options = {
        isCrossChannel: true,
        originalTeam: 'Everyone'
      };
      
      const embed = createDiscordEmbed(mockTaskData, options);
      const reassignmentField = embed.embeds[0].fields[3];
      
      expect(reassignmentField.value).toBe('This task was reassigned from Everyone');
    });

    it('should handle cross-channel update from specific team', () => {
      const options = {
        isCrossChannel: true,
        originalTeam: 'Operations Team'
      };
      
      const embed = createDiscordEmbed(mockTaskData, options);
      const reassignmentField = embed.embeds[0].fields[3];
      
      expect(reassignmentField.name).toBe('⚠️ Reassigned');
      expect(reassignmentField.value).toBe('This task was reassigned from Operations Team');
      expect(reassignmentField.inline).toBe(false);
    });
  });

  describe('embed structure', () => {
    it('should handle different priority colors', () => {
      const highPriorityTask = { ...mockTaskData, priority: 'High' };
      const mediumPriorityTask = { ...mockTaskData, priority: 'Medium' };
      const lowPriorityTask = { ...mockTaskData, priority: 'Low' };
      
      const highEmbed = createDiscordEmbed(highPriorityTask);
      const mediumEmbed = createDiscordEmbed(mediumPriorityTask);
      const lowEmbed = createDiscordEmbed(lowPriorityTask);
      
      expect(highEmbed.embeds[0].color).toBe(15158332);
      expect(mediumEmbed.embeds[0].color).toBe(16776960);
      expect(lowEmbed.embeds[0].color).toBe(3447003);
    });

    it('should show correct title prefix for new tasks', () => {
      const embed = createDiscordEmbed(mockTaskData);
      
      expect(embed.embeds[0].title).toBe('📋 New Task: Test Task');
    });

    it('should show correct title prefix for updated tasks', () => {
      const taskWithMessageId = { ...mockTaskData, messageId: '123456789' };
      const embed = createDiscordEmbed(taskWithMessageId);
      
      expect(embed.embeds[0].title).toBe('📝 Updated Task: Test Task');
    });

    it('should include all required fields in correct order', () => {
      const embed = createDiscordEmbed(mockTaskData);
      const fields = embed.embeds[0].fields;
      
      expect(fields[0].name).toBe('Priority');
      expect(fields[0].value).toBe('High');
      expect(fields[0].inline).toBe(true);
      
      expect(fields[1].name).toBe('Assigned To');
      expect(fields[1].value).toBe('Marketing Team');
      expect(fields[1].inline).toBe(true);
      
      expect(fields[2].name).toBe('Created By');
      expect(fields[2].value).toBe('Test User');
      expect(fields[2].inline).toBe(true);
    });

    it('should include timestamp and footer', () => {
      const embed = createDiscordEmbed(mockTaskData);
      
      expect(embed.embeds[0]).toHaveProperty('timestamp');
      expect(embed.embeds[0].footer).toEqual({ text: 'Task Management System' });
    });
  });

  describe('integration with requirements', () => {
    it('should satisfy Requirement 4.3: Include reassignment indicator for cross-channel updates', () => {
      // When a Cross_Channel_Update occurs, the Backend SHALL include an indicator
      // in the Discord embed that this task was reassigned from another team
      const options = {
        isCrossChannel: true,
        originalTeam: 'Development Team'
      };
      
      const embed = createDiscordEmbed(mockTaskData, options);
      
      // Verify reassignment field exists
      const reassignmentField = embed.embeds[0].fields.find(f => f.name === '⚠️ Reassigned');
      expect(reassignmentField).toBeDefined();
      expect(reassignmentField.value).toContain('reassigned from Development Team');
      expect(reassignmentField.inline).toBe(false);
    });
  });
});
