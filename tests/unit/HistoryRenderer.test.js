/**
 * Unit tests for HistoryRenderer class
 * Tests DOM manipulation and event binding
 */

describe('HistoryRenderer', () => {
  let historyRenderer;
  let containerElement;
  
  beforeEach(() => {
    document.body.innerHTML = '<div id="historyContainer"></div>';
    containerElement = document.getElementById('historyContainer');
    historyRenderer = new HistoryRenderer(containerElement);
  });
  
  describe('render', () => {
    test('should render all tasks', () => {
      const tasks = [
        {
          id: 'task-1',
          taskName: 'Task 1',
          description: 'Description 1',
          priority: 'High',
          assignedTo: 'Development Team',
          user: 'User 1',
          messageId: 'msg1',
          timestamp: '2024-01-15T10:00:00Z',
          lastModified: '2024-01-15T10:00:00Z'
        },
        {
          id: 'task-2',
          taskName: 'Task 2',
          description: 'Description 2',
          priority: 'Low',
          assignedTo: 'Marketing Team',
          user: 'User 2',
          messageId: 'msg2',
          timestamp: '2024-01-15T09:00:00Z',
          lastModified: '2024-01-15T09:00:00Z'
        }
      ];
      
      historyRenderer.render(tasks);
      
      const renderedItems = containerElement.querySelectorAll('.task-item');
      expect(renderedItems.length).toBe(2);
    });
    
    test('should display empty message when no tasks', () => {
      historyRenderer.render([]);
      
      expect(containerElement.textContent).toContain('No tasks');
    });
  });
  
  describe('renderTaskItem', () => {
    test('should render task with all fields', () => {
      const task = {
        id: 'task-1',
        taskName: 'Test Task',
        description: 'Test Description',
        priority: 'Medium',
        assignedTo: 'Operations Team',
        user: 'John Doe',
        messageId: 'msg123',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      const taskElement = historyRenderer.renderTaskItem(task);
      
      expect(taskElement.textContent).toContain('Test Task');
      expect(taskElement.textContent).toContain('Test Description');
      expect(taskElement.textContent).toContain('Medium');
      expect(taskElement.textContent).toContain('Operations Team');
      expect(taskElement.textContent).toContain('John Doe');
    });
    
    test('should include edit and delete buttons', () => {
      const task = {
        id: 'task-1',
        taskName: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'Jane Doe',
        messageId: 'msg123',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      const taskElement = historyRenderer.renderTaskItem(task);
      
      const editButton = taskElement.querySelector('.edit-btn');
      const deleteButton = taskElement.querySelector('.delete-btn');
      
      expect(editButton).toBeTruthy();
      expect(deleteButton).toBeTruthy();
    });
  });
  
  describe('attachEventListeners', () => {
    test('should attach click handlers to buttons', () => {
      const tasks = [
        {
          id: 'task-1',
          taskName: 'Task 1',
          description: 'Description 1',
          priority: 'High',
          assignedTo: 'Development Team',
          user: 'User 1',
          messageId: 'msg1',
          timestamp: '2024-01-15T10:00:00Z',
          lastModified: '2024-01-15T10:00:00Z'
        }
      ];
      
      historyRenderer.render(tasks);
      historyRenderer.attachEventListeners();
      
      const editButton = containerElement.querySelector('.edit-btn');
      const deleteButton = containerElement.querySelector('.delete-btn');
      
      expect(editButton.onclick).toBeDefined();
      expect(deleteButton.onclick).toBeDefined();
    });
  });
});
