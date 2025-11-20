import { syncService } from '../../services/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { storage } from '../../services/storage';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../services/storage');

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (storage.saveTasks as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getOfflineActions', () => {
    it('should return empty array when no actions stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const actions = await syncService.getOfflineActions();

      expect(actions).toEqual([]);
    });

    it('should return parsed actions when stored', async () => {
      const mockActions = [
        {
          id: 'action1',
          type: 'CREATE' as const,
          payload: { id: 'task1', title: 'Test' },
          timestamp: '2024-01-01',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockActions)
      );

      const actions = await syncService.getOfflineActions();

      expect(actions).toEqual(mockActions);
    });
  });

  describe('saveOfflineAction', () => {
    it('should save an offline action', async () => {
      const action = {
        id: 'action1',
        type: 'CREATE' as const,
        payload: { id: 'task1', title: 'Test' },
        timestamp: '2024-01-01',
      };

      await syncService.saveOfflineAction(action);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('checkConnectivity', () => {
    it('should return true when online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      const isOnline = await syncService.checkConnectivity();

      expect(isOnline).toBe(true);
    });

    it('should return false when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      const isOnline = await syncService.checkConnectivity();

      expect(isOnline).toBe(false);
    });
  });

  describe('syncTasks', () => {
    it('should sync tasks when online', async () => {
      const tasks = [
        {
          id: 'task1',
          title: 'Test',
          description: 'Description',
          completed: false,
          status: 'not_started' as const,
          assignedDate: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
        },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      const result = await syncService.syncTasks(tasks);

      expect(storage.saveTasks).toHaveBeenCalledWith(tasks);
      expect(result).toEqual(tasks);
    });

    it('should throw error when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      await expect(syncService.syncTasks([])).rejects.toThrow(
        'No internet connection'
      );
    });
  });

  describe('processOfflineActions', () => {
    it('should process CREATE actions', async () => {
      const tasks: any[] = [];
      const actions = [
        {
          id: 'action1',
          type: 'CREATE' as const,
          payload: {
            id: 'task1',
            title: 'New Task',
            description: 'Description',
            completed: false,
            status: 'not_started' as const,
            assignedDate: '2024-01-01',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            userId: 'user1',
          },
          timestamp: '2024-01-01',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(actions)
      );

      const result = await syncService.processOfflineActions(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task1');
    });

    it('should process UPDATE actions', async () => {
      const tasks = [
        {
          id: 'task1',
          title: 'Original',
          description: 'Description',
          completed: false,
          status: 'not_started' as const,
          assignedDate: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
        },
      ];

      const actions = [
        {
          id: 'action1',
          type: 'UPDATE' as const,
          payload: {
            ...tasks[0],
            title: 'Updated',
          },
          timestamp: '2024-01-01',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(actions)
      );

      const result = await syncService.processOfflineActions(tasks);

      expect(result[0].title).toBe('Updated');
    });

    it('should process DELETE actions', async () => {
      const tasks = [
        {
          id: 'task1',
          title: 'Task 1',
          description: 'Description',
          completed: false,
          status: 'not_started' as const,
          assignedDate: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
        },
        {
          id: 'task2',
          title: 'Task 2',
          description: 'Description',
          completed: false,
          status: 'not_started' as const,
          assignedDate: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
        },
      ];

      const actions = [
        {
          id: 'action1',
          type: 'DELETE' as const,
          payload: { id: 'task1' },
          timestamp: '2024-01-01',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(actions)
      );

      const result = await syncService.processOfflineActions(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task2');
    });
  });
});

