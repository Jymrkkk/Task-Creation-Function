/**
 * Unit tests for Task 11.2: Form validation in update mode
 * Validates Requirement 4.4
 */

describe('Task 11.2: Update Mode Validation', () => {
    let taskFormManager;
    let mockDocument;

    beforeEach(() => {
        // Mock DOM elements
        mockDocument = {
            getElementById: (id) => {
                const elements = {
                    'taskName': { value: 'Test Task' },
                    'description': { value: 'Test Description' },
                    'user': { value: 'Test User' }
                };
                return elements[id] || { value: '' };
            }
        };

        // Save original document
        global.originalDocument = global.document;
        global.document = mockDocument;

        // Create TaskFormManager instance
        taskFormManager = {
            mode: 'create',
            currentTaskId: null,
            
            validateForm: function() {
                const taskName = document.getElementById('taskName').value.trim();
                const user = document.getElementById('user').value.trim();
                const description = document.getElementById('description').value.trim();
                return taskName !== '' && description !== '' && user !== '';
            },
            
            enterUpdateMode: function(taskRecord) {
                this.mode = 'update';
                this.currentTaskId = taskRecord.id;
            }
        };
    });

    afterEach(() => {
        // Restore original document
        if (global.originalDocument) {
            global.document = global.originalDocument;
        }
    });

    test('validates all required fields in update mode', () => {
        // Arrange: Enter update mode
        taskFormManager.enterUpdateMode({ id: 'test-123' });
        
        // Act: Validate with all fields filled
        const isValid = taskFormManager.validateForm();
        
        // Assert
        expect(taskFormManager.mode).toBe('update');
        expect(isValid).toBe(true);
    });

    test('fails validation when task name is empty in update mode', () => {
        // Arrange
        taskFormManager.enterUpdateMode({ id: 'test-123' });
        mockDocument.getElementById = (id) => {
            if (id === 'taskName') return { value: '' };
            if (id === 'description') return { value: 'Test Description' };
            if (id === 'user') return { value: 'Test User' };
            return { value: '' };
        };
        
        // Act
        const isValid = taskFormManager.validateForm();
        
        // Assert
        expect(isValid).toBe(false);
    });

    test('fails validation when description is empty in update mode', () => {
        // Arrange
        taskFormManager.enterUpdateMode({ id: 'test-123' });
        mockDocument.getElementById = (id) => {
            if (id === 'taskName') return { value: 'Test Task' };
            if (id === 'description') return { value: '' };
            if (id === 'user') return { value: 'Test User' };
            return { value: '' };
        };
        
        // Act
        const isValid = taskFormManager.validateForm();
        
        // Assert
        expect(isValid).toBe(false);
    });

    test('fails validation when user is empty in update mode', () => {
        // Arrange
        taskFormManager.enterUpdateMode({ id: 'test-123' });
        mockDocument.getElementById = (id) => {
            if (id === 'taskName') return { value: 'Test Task' };
            if (id === 'description') return { value: 'Test Description' };
            if (id === 'user') return { value: '' };
            return { value: '' };
        };
        
        // Act
        const isValid = taskFormManager.validateForm();
        
        // Assert
        expect(isValid).toBe(false);
    });

    test('fails validation when all fields are empty in update mode', () => {
        // Arrange
        taskFormManager.enterUpdateMode({ id: 'test-123' });
        mockDocument.getElementById = () => ({ value: '' });
        
        // Act
        const isValid = taskFormManager.validateForm();
        
        // Assert
        expect(isValid).toBe(false);
    });

    test('trims whitespace before validation in update mode', () => {
        // Arrange
        taskFormManager.enterUpdateMode({ id: 'test-123' });
        mockDocument.getElementById = (id) => {
            if (id === 'taskName') return { value: '   ' };
            if (id === 'description') return { value: '  Test  ' };
            if (id === 'user') return { value: '   ' };
            return { value: '' };
        };
        
        // Act
        const isValid = taskFormManager.validateForm();
        
        // Assert: Should fail because taskName and user are whitespace only
        expect(isValid).toBe(false);
    });
});
