/**
 * Unit tests for ModalManager class
 * Tests modal display logic and user interactions
 */

describe('ModalManager', () => {
  let modalManager;
  
  beforeEach(() => {
    modalManager = new ModalManager();
    // Mock SweetAlert2
    global.Swal = {
      fire: jest.fn().mockResolvedValue({ isConfirmed: true })
    };
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('showSuccess', () => {
    test('should display success modal with task name', async () => {
      const taskName = 'Test Task';
      
      await modalManager.showSuccess(taskName);
      
      expect(global.Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success',
          title: expect.stringContaining(taskName)
        })
      );
    });
  });
  
  describe('showError', () => {
    test('should display error modal with message and details', async () => {
      const message = 'Error occurred';
      const details = 'Network connection failed';
      
      await modalManager.showError(message, details);
      
      expect(global.Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: message,
          text: details
        })
      );
    });
  });
  
  describe('showConfirmation', () => {
    test('should display confirmation dialog and return result', async () => {
      const message = 'Are you sure?';
      
      global.Swal.fire.mockResolvedValue({ isConfirmed: true });
      
      const result = await modalManager.showConfirmation(message);
      
      expect(global.Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'warning',
          title: message,
          showCancelButton: true
        })
      );
      
      expect(result).toBe(true);
    });
    
    test('should return false when user cancels', async () => {
      const message = 'Are you sure?';
      
      global.Swal.fire.mockResolvedValue({ isConfirmed: false });
      
      const result = await modalManager.showConfirmation(message);
      
      expect(result).toBe(false);
    });
  });
  
  describe('showSyncError', () => {
    test('should display sync error with recovery options', async () => {
      const taskName = 'Failed Task';
      const options = ['Create new message', 'Cancel'];
      
      await modalManager.showSyncError(taskName, options);
      
      expect(global.Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: expect.stringContaining('sync'),
          showCancelButton: true
        })
      );
    });
  });
});
