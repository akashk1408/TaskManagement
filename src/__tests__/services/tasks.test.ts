import { taskService } from '../../services/tasks';
import { storage } from '../../services/storage';
import { syncService } from '../../services/sync';

// Mock dependencies
jest.mock('../../services/storage');
jest.mock('../../services/sync');

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getTasks as jest.Mock).mockResolvedValue([]);
    (storage.saveTasks as jest.Mock).mockResolvedValue(undefined);
    (syncService.checkConnectivity as jest.Mock).mockResolvedValue(true);
    (syncService.syncTasks as jest.Mock).mockResolvedValue([]);
    (syncService.saveOfflineAction as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      const title = 'Test Task';
      const description = 'Test Description';
      const userId = 'user1';
      const dueDate = '2024-12-31';

      const task = await taskService.createTask(
        title,
        description,
        userId,
        dueDate
      );

      expect(task).toHaveProperty('id');
      expect(task.title).toBe(title);
      expect(task.description).toBe(description);
      expect(task.userId).toBe(userId);
      expect(task.dueDate).toBe(dueDate);
      expect(task.completed).toBe(false);
      expect(task.status).toBe('not_started');
      expect(storage.saveTasks).toHaveBeenCalled();
    });

    it('should queue action when offline', async () => {
      (syncService.checkConnectivity as jest.Mock).mockResolvedValue(false);

      const task = await taskService.createTask(
        'Test Task',
        'Description',
        'user1'
      );

      expect(task).toBeDefined();
      expect(syncService.saveOfflineAction).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const existingTask = {
        id: 'task1',
        title: 'Original Title',
        description: 'Original Description',
        completed: false,
        status: 'not_started' as const,
        assignedDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        userId: 'user1',
      };

      (storage.getTasks as jest.Mock).mockResolvedValue([existingTask]);

      const updatedTask = await taskService.updateTask('task1', {
        title: 'Updated Title',
        completed: true,
        status: 'completed' as const,
      });

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.completed).toBe(true);
      expect(updatedTask.status).toBe('completed');
      expect(storage.saveTasks).toHaveBeenCalled();
    });

    it('should throw error if task not found', async () => {
      (storage.getTasks as jest.Mock).mockResolvedValue([]);

      await expect(
        taskService.updateTask('nonexistent', { title: 'New Title' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Description',
        completed: false,
        status: 'not_started' as const,
        assignedDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        userId: 'user1',
      };

      (storage.getTasks as jest.Mock).mockResolvedValue([task]);

      await taskService.deleteTask('task1');

      expect(storage.saveTasks).toHaveBeenCalledWith([]);
    });

    it('should throw error if task not found', async () => {
      (storage.getTasks as jest.Mock).mockResolvedValue([]);

      await expect(taskService.deleteTask('nonexistent')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('toggleTaskComplete', () => {
    it('should toggle task completion status', async () => {
      const task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Description',
        completed: false,
        status: 'not_started' as const,
        assignedDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        userId: 'user1',
      };

      (storage.getTasks as jest.Mock).mockResolvedValue([task]);

      const updatedTask = await taskService.toggleTaskComplete('task1');

      expect(updatedTask.completed).toBe(true);
      expect(updatedTask.status).toBe('completed');
      expect(storage.saveTasks).toHaveBeenCalled();
    });
  });
});

