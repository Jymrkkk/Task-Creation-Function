/**
 * Unit tests for TaskHistoryManager class
 * Tests CRUD operations, sorting, and data integrity
 */

describe('TaskHistoryManager', () => {
  let historyManager;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    historyManager = new TaskHistoryManager();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  describe('addTask', () => {
    test('should add a task with generated UUID', () => {
      const taskData = {
        taskName: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe'
      };
      const messageId = '123456789';
      
      const taskId = historyManager.addTask(taskData, messageId);
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      
      const retrievedTask = historyManager.getTask(taskId);
      expect(retrievedTask.taskName).toBe(taskData.taskName);
      expect(retrievedTask.messageId).toBe(messageId);
    });
  });
  
  describe('updateTask', () => {
    test('should update existing task while preserving ID and messageId', () => {
      const taskData = {
        taskName: 'Original Task',
        description: 'Original Description',
        priority: 'Low',
        assignedTo: 'Marketing Team',
        user: 'Jane Doe'
      };
      const messageId = '123456789';
      
      const taskId = historyManager.addTask(taskData, messageId);
      
      const updatedData = {
        taskName: 'Updated Task',
        description: 'Updated Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'Jane Doe'
      };
      
      historyManager.updateTask(taskId, updatedData);
      
      const retrievedTask = historyManager.getTask(taskId);
      expect(retrievedTask.id).toBe(taskId);
      expect(retrievedTask.messageId).toBe(messageId);
      expect(retrievedTask.taskName).toBe(updatedData.taskName);
      expect(retrievedTask.description).toBe(updatedData.description);
    });
  });
  
  describe('deleteTask', () => {
    test('should remove task from storage', () => {
      const taskData = {
        taskName: 'Task to Delete',
        description: 'Description',
        priority: 'Medium',
        assignedTo: 'Operations Team',
        user: 'Bob Smith'
      };
      
      const taskId = historyManager.addTask(taskData, '123456789');
      expect(historyManager.getTask(taskId)).toBeDefined();
      
      historyManager.deleteTask(taskId);
      expect(historyManager.getTask(taskId)).toBeNull();
    });
  });
  
  describe('getAllTasks', () => {
    test('should return tasks in reverse chronological order', () => {
      // Add tasks with slight delays to ensure different timestamps
      const task1Id = historyManager.addTask({
        taskName: 'First Task',
        description: 'First',
        priority: 'Low',
        assignedTo: 'Marketing Team',
        user: 'User1'
      }, 'msg1');
      
      const task2Id = historyManager.addTask({
        taskName: 'Second Task',
        description: 'Second',
        priority: 'Medium',
        assignedTo: 'Development Team',
        user: 'User2'
      }, 'msg2');
      
      const tasks = historyManager.getAllTasks();
      
      expect(tasks.length).toBe(2);
      expect(tasks[0].id).toBe(task2Id); // Most recent first
      expect(tasks[1].id).toBe(task1Id);
    });
  });
});
