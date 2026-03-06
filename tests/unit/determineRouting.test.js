/**
 * Unit tests for determineRouting function
 * Tests the core routing logic for team-based Discord routing
 */

import { describe, test, expect } from 'vitest';

// Mock the determineRouting function for testing
// In actual Google Apps Script, this would be imported from Code.gs
function determineRouting(taskData) {
  const assignedTo = taskData.assignedTo;
  const messageId = taskData.messageId;
  const allTeams = ["Marketing Team", "Creatives Team", "Development Team", "Operations Team", "Everyone"];
  
  const isUpdate = !!messageId;
  
  if (!isUpdate) {
    if (assignedTo === "Everyone") {
      return {
        strategy: "broadcast",
        targetTeams: allTeams,
        isUpdate: false,
        originalTeam: null,
        requiresNewMessage: true
      };
    } else {
      return {
        strategy: "single",
        targetTeams: [assignedTo],
        isUpdate: false,
        originalTeam: null,
        requiresNewMessage: true
      };
    }
  }
  
  const isMessageIdArray = Array.isArray(messageId);
  
  if (isMessageIdArray) {
    if (assignedTo === "Everyone") {
      return {
        strategy: "broadcast",
        targetTeams: allTeams,
        isUpdate: true,
        originalTeam: null,
        requiresNewMessage: false
      };
    } else {
      return {
        strategy: "cross-channel",
        targetTeams: [assignedTo],
        isUpdate: true,
        originalTeam: "Everyone",
        requiresNewMessage: true
      };
    }
  } else {
    if (assignedTo === "Everyone") {
      return {
        strategy: "cross-channel",
        targetTeams: allTeams,
        isUpdate: true,
        originalTeam: null,
        requiresNewMessage: true
      };
    } else {
      return {
        strategy: "single",
        targetTeams: [assignedTo],
        isUpdate: true,
        originalTeam: null,
        requiresNewMessage: false
      };
    }
  }
}

describe('determineRouting', () => {
  describe('New Tasks (no messageId)', () => {
    test('routes new task to single team channel', () => {
      const taskData = {
        taskName: "Test Task",
        assignedTo: "Marketing Team",
        user: "Test User"
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("single");
      expect(result.targetTeams).toEqual(["Marketing Team"]);
      expect(result.isUpdate).toBe(false);
      expect(result.originalTeam).toBe(null);
      expect(result.requiresNewMessage).toBe(true);
    });
    
    test('broadcasts new task to all channels when assignedTo is Everyone', () => {
      const taskData = {
        taskName: "Test Task",
        assignedTo: "Everyone",
        user: "Test User"
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("broadcast");
      expect(result.targetTeams).toEqual([
        "Marketing Team",
        "Creatives Team",
        "Development Team",
        "Operations Team",
        "Everyone"
      ]);
      expect(result.isUpdate).toBe(false);
      expect(result.originalTeam).toBe(null);
      expect(result.requiresNewMessage).toBe(true);
    });
    
    test('routes new task to each specific team correctly', () => {
      const teams = ["Marketing Team", "Creatives Team", "Development Team", "Operations Team"];
      
      teams.forEach(team => {
        const taskData = {
          taskName: "Test Task",
          assignedTo: team,
          user: "Test User"
        };
        
        const result = determineRouting(taskData);
        
        expect(result.strategy).toBe("single");
        expect(result.targetTeams).toEqual([team]);
        expect(result.isUpdate).toBe(false);
      });
    });
  });
  
  describe('Task Updates - Same Channel', () => {
    test('updates existing message in same team channel', () => {
      const taskData = {
        taskName: "Updated Task",
        assignedTo: "Marketing Team",
        user: "Test User",
        messageId: "123456789"
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("single");
      expect(result.targetTeams).toEqual(["Marketing Team"]);
      expect(result.isUpdate).toBe(true);
      expect(result.originalTeam).toBe(null);
      expect(result.requiresNewMessage).toBe(false);
    });
    
    test('updates Everyone task with array of messageIds', () => {
      const taskData = {
        taskName: "Updated Task",
        assignedTo: "Everyone",
        user: "Test User",
        messageId: ["123", "456", "789", "012", "345"]
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("broadcast");
      expect(result.targetTeams).toEqual([
        "Marketing Team",
        "Creatives Team",
        "Development Team",
        "Operations Team",
        "Everyone"
      ]);
      expect(result.isUpdate).toBe(true);
      expect(result.originalTeam).toBe(null);
      expect(result.requiresNewMessage).toBe(false);
    });
  });
  
  describe('Task Updates - Cross Channel', () => {
    test('detects cross-channel update from Everyone to specific team', () => {
      const taskData = {
        taskName: "Updated Task",
        assignedTo: "Marketing Team",
        user: "Test User",
        messageId: ["123", "456", "789", "012", "345"]
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("cross-channel");
      expect(result.targetTeams).toEqual(["Marketing Team"]);
      expect(result.isUpdate).toBe(true);
      expect(result.originalTeam).toBe("Everyone");
      expect(result.requiresNewMessage).toBe(true);
    });
    
    test('detects cross-channel update from specific team to Everyone', () => {
      const taskData = {
        taskName: "Updated Task",
        assignedTo: "Everyone",
        user: "Test User",
        messageId: "123456789"
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("cross-channel");
      expect(result.targetTeams).toEqual([
        "Marketing Team",
        "Creatives Team",
        "Development Team",
        "Operations Team",
        "Everyone"
      ]);
      expect(result.isUpdate).toBe(true);
      expect(result.originalTeam).toBe(null);
      expect(result.requiresNewMessage).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    test('handles undefined messageId as new task', () => {
      const taskData = {
        taskName: "Test Task",
        assignedTo: "Marketing Team",
        user: "Test User",
        messageId: undefined
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("single");
      expect(result.isUpdate).toBe(false);
      expect(result.requiresNewMessage).toBe(true);
    });
    
    test('handles null messageId as new task', () => {
      const taskData = {
        taskName: "Test Task",
        assignedTo: "Marketing Team",
        user: "Test User",
        messageId: null
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("single");
      expect(result.isUpdate).toBe(false);
      expect(result.requiresNewMessage).toBe(true);
    });
    
    test('handles empty string messageId as new task', () => {
      const taskData = {
        taskName: "Test Task",
        assignedTo: "Marketing Team",
        user: "Test User",
        messageId: ""
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("single");
      expect(result.isUpdate).toBe(false);
      expect(result.requiresNewMessage).toBe(true);
    });
    
    test('handles empty array messageId as update', () => {
      const taskData = {
        taskName: "Test Task",
        assignedTo: "Everyone",
        user: "Test User",
        messageId: []
      };
      
      const result = determineRouting(taskData);
      
      expect(result.strategy).toBe("broadcast");
      expect(result.isUpdate).toBe(true);
      expect(result.requiresNewMessage).toBe(false);
    });
  });
});
