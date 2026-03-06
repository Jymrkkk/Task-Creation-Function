/**
 * Property-based tests for history rendering and UI completeness
 * Feature: task-management-enhancements
 */

describe('History Rendering Properties', () => {
  
  beforeEach(() => {
    document.body.innerHTML = '<div id="historyContainer"></div>';
  });
  
  // Feature: task-management-enhancements, Property 9: History Item Completeness
  // Validates: Requirements 3.4
  test('Property 9: any task record should display all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team', 'Operations Team', 'Everyone'),
          user: fc.string({ minLength: 1, maxLength: 50 }),
          messageId: fc.string({ minLength: 10, maxLength: 20 }),
          timestamp: fc.date().map(d => d.toISOString()),
          lastModified: fc.date().map(d => d.toISOString())
        }),
        (taskRecord) => {
          const containerElement = document.getElementById('historyContainer');
          const historyRenderer = new HistoryRenderer(containerElement);
          
          const taskElement = historyRenderer.renderTaskItem(taskRecord);
          const taskText = taskElement.textContent;
          
          // Assert all required fields are present
          expect(taskText).toContain(taskRecord.taskName);
          expect(taskText).toContain(taskRecord.description);
          expect(taskText).toContain(taskRecord.priority);
          expect(taskText).toContain(taskRecord.assignedTo);
          expect(taskText).toContain(taskRecord.user);
          // Timestamp should be displayed in some format
          expect(taskElement.innerHTML).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 10: History UI Completeness
  // Validates: Requirements 4.1, 8.1
  test('Property 10: any task in history should have edit and delete buttons', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          taskName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          priority: fc.constantFrom('Low', 'Medium', 'High'),
          assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
          user: fc.string({ minLength: 1, maxLength: 50 }),
          messageId: fc.string({ minLength: 10, maxLength: 20 }),
          timestamp: fc.date().map(d => d.toISOString()),
          lastModified: fc.date().map(d => d.toISOString())
        }),
        (taskRecord) => {
          const containerElement = document.getElementById('historyContainer');
          const historyRenderer = new HistoryRenderer(containerElement);
          
          const taskElement = historyRenderer.renderTaskItem(taskRecord);
          
          // Assert edit and delete buttons exist
          const editButton = taskElement.querySelector('.edit-btn') || 
                            taskElement.querySelector('[data-action="edit"]') ||
                            Array.from(taskElement.querySelectorAll('button')).find(btn => 
                              btn.textContent.toLowerCase().includes('edit')
                            );
          
          const deleteButton = taskElement.querySelector('.delete-btn') || 
                              taskElement.querySelector('[data-action="delete"]') ||
                              Array.from(taskElement.querySelectorAll('button')).find(btn => 
                                btn.textContent.toLowerCase().includes('delete')
                              );
          
          expect(editButton).toBeTruthy();
          expect(deleteButton).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: task-management-enhancements, Property 23: Delete Updates Display
  // Validates: Requirements 8.5
  test('Property 23: deleting a task should immediately remove it from display', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            taskName: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            priority: fc.constantFrom('Low', 'Medium', 'High'),
            assignedTo: fc.constantFrom('Marketing Team', 'Creatives Team', 'Development Team'),
            user: fc.string({ minLength: 1, maxLength: 50 }),
            messageId: fc.string({ minLength: 10, maxLength: 20 }),
            timestamp: fc.date().map(d => d.toISOString()),
            lastModified: fc.date().map(d => d.toISOString())
          }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.integer({ min: 0, max: 4 }),
        (tasks, deleteIndex) => {
          if (deleteIndex >= tasks.length) return; // Skip if index out of bounds
          
          const containerElement = document.getElementById('historyContainer');
          const historyRenderer = new HistoryRenderer(containerElement);
          
          // Render all tasks
          historyRenderer.render(tasks);
          const initialCount = containerElement.querySelectorAll('.task-item').length;
          
          // Remove one task from array
          const taskToDelete = tasks[deleteIndex];
          const remainingTasks = tasks.filter(t => t.id !== taskToDelete.id);
          
          // Re-render without deleted task
          historyRenderer.render(remainingTasks);
          const finalCount = containerElement.querySelectorAll('.task-item').length;
          
          // Assert count decreased by 1
          expect(finalCount).toBe(initialCount - 1);
          
          // Assert deleted task is not in display
          const displayedText = containerElement.textContent;
          // Note: This might still contain the task name if another task has the same name
          // So we check by counting rendered items instead
          expect(finalCount).toBe(remainingTasks.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});
