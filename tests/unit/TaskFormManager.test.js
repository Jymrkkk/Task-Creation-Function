/**
 * Unit tests for TaskFormManager class
 * Tests form state management, validation, and mode switching
 */

describe('TaskFormManager', () => {
  let formManager;
  
  beforeEach(() => {
    // Set up minimal DOM structure
    document.body.innerHTML = `
      <input type="text" id="taskName" />
      <textarea id="description"></textarea>
      <select id="priority">
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select id="assignedTo">
        <option value="Marketing Team">Marketing Team</option>
        <option value="Development Team">Development Team</option>
      </select>
      <input type="text" id="user" />
      <button id="submitBtn">Submit Task</button>
    `;
    
    formManager = new TaskFormManager();
  });
  
  describe('mode switching', () => {
    test('should start in create mode', () => {
      expect(formManager.mode).toBe('create');
      expect(formManager.currentTaskId).toBeNull();
    });
    
    test('should switch to update mode with task data', () => {
      const taskRecord = {
        id: 'task-123',
        taskName: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      formManager.enterUpdateMode(taskRecord);
      
      expect(formManager.mode).toBe('update');
      expect(formManager.currentTaskId).toBe('task-123');
    });
    
    test('should switch back to create mode', () => {
      formManager.currentTaskId = 'task-123';
      formManager.mode = 'update';
      
      formManager.enterCreateMode();
      
      expect(formManager.mode).toBe('create');
      expect(formManager.currentTaskId).toBeNull();
    });
    
    test('should change button text to "Update Task" in update mode', () => {
      const taskRecord = {
        id: 'task-123',
        taskName: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      const submitBtn = document.getElementById('submitBtn');
      expect(submitBtn.innerText).toBe('Submit Task');
      
      formManager.enterUpdateMode(taskRecord);
      
      expect(submitBtn.innerText).toBe('Update Task');
    });
    
    test('should change button text to "Submit Task" in create mode', () => {
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.innerText = 'Update Task';
      
      formManager.enterCreateMode();
      
      expect(submitBtn.innerText).toBe('Submit Task');
    });
  });
  
  describe('form validation', () => {
    test('should validate required fields', () => {
      document.getElementById('taskName').value = '';
      document.getElementById('user').value = '';
      
      const isValid = formManager.validateForm();
      expect(isValid).toBe(false);
    });
    
    test('should pass validation with all required fields', () => {
      document.getElementById('taskName').value = 'Valid Task';
      document.getElementById('description').value = 'Valid Description';
      document.getElementById('user').value = 'John Doe';
      
      const isValid = formManager.validateForm();
      expect(isValid).toBe(true);
    });
    
    // Task 11.2: Ensure form validation in update mode
    // Property 13: Update Mode Validation - Validates Requirement 4.4
    test('should validate required fields in update mode', () => {
      const taskRecord = {
        id: 'task-123',
        taskName: 'Original Task',
        description: 'Original Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      // Enter update mode
      formManager.enterUpdateMode(taskRecord);
      expect(formManager.mode).toBe('update');
      
      // Clear a required field
      document.getElementById('taskName').value = '';
      
      // Validation should fail
      const isValid = formManager.validateForm();
      expect(isValid).toBe(false);
    });
    
    test('should prevent submission when validation fails in update mode', () => {
      const taskRecord = {
        id: 'task-123',
        taskName: 'Original Task',
        description: 'Original Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      // Enter update mode
      formManager.enterUpdateMode(taskRecord);
      
      // Clear all required fields
      document.getElementById('taskName').value = '';
      document.getElementById('description').value = '';
      document.getElementById('user').value = '';
      
      // Validation should fail
      const isValid = formManager.validateForm();
      expect(isValid).toBe(false);
    });
    
    test('should pass validation in update mode with all fields filled', () => {
      const taskRecord = {
        id: 'task-123',
        taskName: 'Original Task',
        description: 'Original Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      // Enter update mode
      formManager.enterUpdateMode(taskRecord);
      
      // Fill all required fields
      document.getElementById('taskName').value = 'Updated Task';
      document.getElementById('description').value = 'Updated Description';
      document.getElementById('user').value = 'Jane Doe';
      
      // Validation should pass
      const isValid = formManager.validateForm();
      expect(isValid).toBe(true);
    });
    
    test('should trim whitespace before validation in update mode', () => {
      const taskRecord = {
        id: 'task-123',
        taskName: 'Original Task',
        description: 'Original Description',
        priority: 'High',
        assignedTo: 'Development Team',
        user: 'John Doe',
        messageId: '123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };
      
      // Enter update mode
      formManager.enterUpdateMode(taskRecord);
      
      // Set fields with only whitespace
      document.getElementById('taskName').value = '   ';
      document.getElementById('description').value = '  ';
      document.getElementById('user').value = '   ';
      
      // Validation should fail (whitespace-only is invalid)
      const isValid = formManager.validateForm();
      expect(isValid).toBe(false);
    });
  });
  
  describe('form data operations', () => {
    test('should get form data as object', () => {
      document.getElementById('taskName').value = 'Test Task';
      document.getElementById('description').value = 'Test Description';
      document.getElementById('priority').value = 'High';
      document.getElementById('assignedTo').value = 'Development Team';
      document.getElementById('user').value = 'Jane Doe';
      
      const formData = formManager.getFormData();
      
      expect(formData.taskName).toBe('Test Task');
      expect(formData.description).toBe('Test Description');
      expect(formData.priority).toBe('High');
      expect(formData.assignedTo).toBe('Development Team');
      expect(formData.user).toBe('Jane Doe');
    });
    
    test('should populate form with task data', () => {
      const taskRecord = {
        taskName: 'Populated Task',
        description: 'Populated Description',
        priority: 'Medium',
        assignedTo: 'Marketing Team',
        user: 'Bob Smith'
      };
      
      formManager.populateForm(taskRecord);
      
      expect(document.getElementById('taskName').value).toBe('Populated Task');
      expect(document.getElementById('description').value).toBe('Populated Description');
      expect(document.getElementById('priority').value).toBe('Medium');
      expect(document.getElementById('assignedTo').value).toBe('Marketing Team');
      expect(document.getElementById('user').value).toBe('Bob Smith');
    });
    
    test('should clear all form fields', () => {
      document.getElementById('taskName').value = 'Test';
      document.getElementById('description').value = 'Test';
      document.getElementById('user').value = 'Test';
      
      formManager.clearForm();
      
      expect(document.getElementById('taskName').value).toBe('');
      expect(document.getElementById('description').value).toBe('');
      expect(document.getElementById('user').value).toBe('');
    });
  });
});
