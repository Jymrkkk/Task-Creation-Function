/**
 * Property-based tests for modal notifications
 * Feature: task-management-enhancements
 */

describe('Modal Notification Properties', () => {
  
  beforeEach(() => {
    // Mock SweetAlert2
    global.Swal = {
      fire: jest.fn().mockResolvedValue({ isConfirmed: true })
    };
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // Feature: task-management-enhancements, Property 3: Success Modal Displays Task Name
  // Validates: Requirements 2.1, 2.2
  test('Property 3: success modal should contain the submitted task name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (taskName) => {
          const modalManager = new ModalManager();
          
          await modalManager.showSuccess(taskName);
          
          // Assert Swal.fire was called with task name
          expect(global.Swal.fire).toHaveBeenCalled();
          const callArgs = global.Swal.fire.mock.calls[0][0];
          expect(callArgs.icon).toBe('success');
          expect(callArgs.title.toLowerCase()).toContain(taskName.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 4: Modal Dismissal Preserves Form State
  // Validates: Requirements 2.4
  test('Property 4: dismissing modal should preserve form data', () => {
    fc.assert(
      fc.property(
        fc.record({
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
          user: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (taskData) => {
          // Set up DOM
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
              <option value="Creatives Team">Creatives Team</option>
              <option value="Development Team">Development Team</option>
            </select>
            <input type="text" id="user" />
          `;
          
          // Populate form
          document.getElementById('taskName').value = taskData.taskName;
          document.getElementById('description').value = taskData.description;
          document.getElementById('priority').value = taskData.priority;
          document.getElementById('assignedTo').value = taskData.assignedTo;
          document.getElementById('user').value = taskData.user;
          
          // Show and dismiss modal
          const modalManager = new ModalManager();
          await modalManager.showSuccess(taskData.taskName);
          
          // Assert form data is still present
          expect(document.getElementById('taskName').value).toBe(taskData.taskName);
          expect(document.getElementById('description').value).toBe(taskData.description);
          expect(document.getElementById('priority').value).toBe(taskData.priority);
          expect(document.getElementById('assignedTo').value).toBe(taskData.assignedTo);
          expect(document.getElementById('user').value).toBe(taskData.user);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 5: No Text-Based Success Messages
  // Validates: Requirements 2.5
  test('Property 5: status text should not contain success indicators after modal submission', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (taskName) => {
          // Set up DOM
          document.body.innerHTML = `
            <p id="statusText"></p>
          `;
          
          const modalManager = new ModalManager();
          await modalManager.showSuccess(taskName);
          
          const statusText = document.getElementById('statusText').textContent;
          
          // Assert no text-based success indicators
          expect(statusText).not.toContain('✅');
          expect(statusText.toLowerCase()).not.toContain('success');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 20: Delete Confirmation Required
  // Validates: Requirements 8.2
  test('Property 20: delete operation should require confirmation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (taskName) => {
          const modalManager = new ModalManager();
          
          const message = `Are you sure you want to delete "${taskName}"?`;
          await modalManager.showConfirmation(message);
          
          // Assert confirmation dialog was shown
          expect(global.Swal.fire).toHaveBeenCalled();
          const callArgs = global.Swal.fire.mock.calls[0][0];
          expect(callArgs.showCancelButton).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
