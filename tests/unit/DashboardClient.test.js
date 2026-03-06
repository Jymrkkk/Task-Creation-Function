/**
 * Unit tests for DashboardClient class
 * Tests Google Sheets Dashboard integration
 */

describe('DashboardClient', () => {
  let dashboardClient;
  const mockWebAppUrl = 'https://script.google.com/test';
  
  beforeEach(() => {
    dashboardClient = new DashboardClient(mockWebAppUrl);
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('fetchDashboardData', () => {
    test('should fetch dashboard data successfully', async () => {
      const mockData = [
        {
          id: 'task-1',
          taskName: 'Task 1',
          description: 'Description 1',
          priority: 'High',
          assignedTo: 'Development Team',
          user: 'User 1',
          timestamp: '2024-01-15T10:00:00Z'
        },
        {
          id: 'task-2',
          taskName: 'Task 2',
          description: 'Description 2',
          priority: 'Low',
          assignedTo: 'Marketing Team',
          user: 'User 2',
          timestamp: '2024-01-15T09:00:00Z'
        }
      ];
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData,
          timestamp: '2024-01-15T10:00:00Z'
        })
      });
      
      const result = await dashboardClient.fetchDashboardData();
      
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockWebAppUrl}?action=getDashboard`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual(mockData);
    });
    
    test('should handle empty dashboard data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          timestamp: '2024-01-15T10:00:00Z'
        })
      });
      
      const result = await dashboardClient.fetchDashboardData();
      
      expect(result).toEqual([]);
    });
    
    test('should throw error when response is not ok', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });
      
      await expect(dashboardClient.fetchDashboardData()).rejects.toThrow('HTTP error! status: 500');
    });
    
    test('should throw error when backend returns success: false', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Configuration error',
          details: 'Dashboard sheet not found'
        })
      });
      
      await expect(dashboardClient.fetchDashboardData()).rejects.toThrow('Configuration error');
    });
    
    test('should handle network failure', async () => {
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
      
      await expect(dashboardClient.fetchDashboardData()).rejects.toThrow('Network failure');
    });
    
    test('should construct correct URL with action parameter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          timestamp: '2024-01-15T10:00:00Z'
        })
      });
      
      await dashboardClient.fetchDashboardData();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?action=getDashboard'),
        expect.any(Object)
      );
    });
  });
});
