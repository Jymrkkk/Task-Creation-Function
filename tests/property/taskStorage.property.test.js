/**
 * Property-based tests for task storage and history management
 * Feature: task-management-enhancements
 */

describe('Task Storage Properties', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  // Feature: task-management-enhancements, Property 6: Task Storage Round Trip
  // Validates: Requirements 3.1, 3.5
  test('Property 6: any submitted task should be retrievable from LocalStorage with messageId', () => {
    fc.assert(
      fc.property(
        fc.record({
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team', 'Operations Team', 'Everyone'),
          user: fc.string({ minLength: 1, maxLength: 50 })
        }),
        fc.string({ minLength: 10, maxLength: 20 }),
        (taskData, messageId) => {
          const historyManager = new TaskHistoryManager();
          
          // Add task to storage
          const taskId = historyManager.addTask(taskData, messageId);
          
          // Retrieve task from storage
          const retrievedTask = historyManager.getTask(taskId);
          
          // Assert all fields match
          expect(retrievedTask).toBeDefined();
          expect(retrievedTask.taskName).toBe(taskData.taskName);
          expect(retrievedTask.description).toBe(taskData.description);
          expect(retrievedTask.priority).toBe(taskData.priority);
          expect(retrievedTask.assignedTo).toBe(taskData.assignedTo);
          expect(retrievedTask.user).toBe(taskData.user);
          expect(retrievedTask.messageId).toBe(messageId);
          expect(retrievedTask.id).toBe(taskId);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 7: LocalStorage Persistence
  // Validates: Requirements 3.2
  test('Property 7: any task should persist after simulated page reload', () => {
    fc.assert(
      fc.property(
        fc.record({
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team', 'Operations Team', 'Everyone'),
          user: fc.string({ minLength: 1, maxLength: 50 })
        }),
        fc.string({ minLength: 10, maxLength: 20 }),
        (taskData, messageId) => {
          const historyManager1 = new TaskHistoryManager();
          
          // Add task to storage
          const taskId = historyManager1.addTask(taskData, messageId);
          
          // Simulate page reload by creating new instance
          const historyManager2 = new TaskHistoryManager();
          
          // Retrieve task from storage with new instance
          const retrievedTask = historyManager2.getTask(taskId);
          
          // Assert task persisted
          expect(retrievedTask).toBeDefined();
          expect(retrievedTask.taskName).toBe(taskData.taskName);
          expect(retrievedTask.messageId).toBe(messageId);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 8: History Chronological Ordering
  // Validates: Requirements 3.3
  test('Property 8: tasks should be displayed in reverse chronological order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            taskName: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            priority: fc.constantFrom('Low', 'Medium', 'High'),
            assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
            user: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (taskDataArray) => {
          const historyManager = new TaskHistoryManager();
          const taskIds = [];
          
          // Add tasks with slight delays to ensure different timestamps
          for (let i = 0; i < taskDataArray.length; i++) {
            const taskId = historyManager.addTask(taskDataArray[i], `msg${i}`);
            taskIds.push(taskId);
          }
          
          // Get all tasks
          const allTasks = historyManager.getAllTasks();
          
          // Assert tasks are in reverse chronological order
          for (let i = 0; i < allTasks.length - 1; i++) {
            const currentTimestamp = new Date(allTasks[i].timestamp).getTime();
            const nextTimestamp = new Date(allTasks[i + 1].timestamp).getTime();
            expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
  
  // Feature: task-management-enhancements, Property 14: Update Modifies Storage
  // Validates: Requirements 4.5
  test('Property 14: updating any task should modify storage while preserving ID and messageId', () => {
    fc.assert(
      fc.property(
        fc.record({
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
          user: fc.string({ minLength: 1, maxLength: 50 })
        }),
        fc.record({
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
          user: fc.string({ minLength: 1, maxLength: 50 })
        }),
        fc.string({ minLength: 10, maxLength: 20 }),
        (originalData, updatedData, messageId) => {
          const historyManager = new TaskHistoryManager();
          
          // Add original task
          const taskId = historyManager.addTask(originalData, messageId);
          
          // Update task
          historyManager.updateTask(taskId, updatedData);
          
          // Retrieve updated task
          const retrievedTask = historyManager.getTask(taskId);
          
          // Assert updated data is stored
          expect(retrievedTask.taskName).toBe(updatedData.taskName);
          expect(retrievedTask.description).toBe(updatedData.description);
          expect(retrievedTask.priority).toBe(updatedData.priority);
          
          // Assert ID and messageId are preserved
          expect(retrievedTask.id).toBe(taskId);
          expect(retrievedTask.messageId).toBe(messageId);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 21: Confirmed Deletion Removes Task
  // Validates: Requirements 8.3
  test('Property 21: deleting any task should remove it from LocalStorage', () => {
    fc.assert(
      fc.property(
        fc.record({
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
          user: fc.string({ minLength: 1, maxLength: 50 })
        }),
        fc.string({ minLength: 10, maxLength: 20 }),
        (taskData, messageId) => {
          const historyManager = new TaskHistoryManager();
          
          // Add task
          const taskId = historyManager.addTask(taskData, messageId);
          
          // Verify task exists
          expect(historyManager.getTask(taskId)).toBeDefined();
          
          // Delete task
          historyManager.deleteTask(taskId);
          
          // Verify task is removed
          expect(historyManager.getTask(taskId)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
