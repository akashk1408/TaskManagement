import { Task, TaskStatus } from '../types';
import { storage } from './storage';
import { syncService } from './sync';

export const taskService = {
  /**
   * getAllTasks() - Fetch ALL tasks without filtering by userId
   * All users will see all tasks in the system
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const tasks = await storage.getTasks();
      return tasks; // Return all tasks without filtering
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  /**
   * getTasksByUserId(userId) - OPTIONAL: Keep for specific user filtering if needed
   * This can be used for user-specific views if required
   */
  async getTasksByUserId(userId: string): Promise<Task[]> {
    try {
      const tasks = await storage.getTasks();
      return tasks.filter((task) => task.userId === userId);
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  },

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const tasks = await storage.getTasks();
      return tasks.find((task) => task.id === id) || null;
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  },

  async createTask(
    title: string,
    description: string,
    userId: string,
    dueDate?: string
  ): Promise<Task> {
    try {
      const now = new Date().toISOString();
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        description,
        completed: false,
        status: 'not_started',
        assignedDate: now,
        dueDate,
        createdAt: now,
        updatedAt: now,
        userId,
      };

      const tasks = await storage.getTasks();
      tasks.push(newTask);
      await storage.saveTasks(tasks);

      // Try to sync if online
      const isOnline = await syncService.checkConnectivity();
      if (isOnline) {
        try {
          await syncService.syncTasks(tasks);
        } catch (error) {
          // If sync fails, queue the action
          await syncService.saveOfflineAction({
            id: Date.now().toString(),
            type: 'CREATE',
            payload: newTask,
            timestamp: now,
          });
        }
      } else {
        // Queue for offline sync
        await syncService.saveOfflineAction({
          id: Date.now().toString(),
          type: 'CREATE',
          payload: newTask,
          timestamp: now,
        });
      }

      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const tasks = await storage.getTasks();
      const index = tasks.findIndex((t) => t.id === taskId);

      if (index === -1) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...tasks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      tasks[index] = updatedTask;
      await storage.saveTasks(tasks);

      // Try to sync if online
      const isOnline = await syncService.checkConnectivity();
      if (isOnline) {
        try {
          await syncService.syncTasks(tasks);
        } catch (error) {
          // If sync fails, queue the action
          await syncService.saveOfflineAction({
            id: Date.now().toString(),
            type: 'UPDATE',
            payload: updatedTask,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Queue for offline sync
        await syncService.saveOfflineAction({
          id: Date.now().toString(),
          type: 'UPDATE',
          payload: updatedTask,
          timestamp: new Date().toISOString(),
        });
      }

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      const tasks = await storage.getTasks();
      const filteredTasks = tasks.filter((t) => t.id !== taskId);

      if (tasks.length === filteredTasks.length) {
        throw new Error('Task not found');
      }

      await storage.saveTasks(filteredTasks);

      // Try to sync if online
      const isOnline = await syncService.checkConnectivity();
      if (isOnline) {
        try {
          await syncService.syncTasks(filteredTasks);
        } catch (error) {
          // If sync fails, queue the action
          await syncService.saveOfflineAction({
            id: Date.now().toString(),
            type: 'DELETE',
            payload: { id: taskId },
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Queue for offline sync
        await syncService.saveOfflineAction({
          id: Date.now().toString(),
          type: 'DELETE',
          payload: { id: taskId },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async toggleTaskComplete(taskId: string): Promise<Task> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const newStatus: TaskStatus = task.completed ? 'not_started' : 'completed';
    return await this.updateTask(taskId, {
      completed: !task.completed,
      status: newStatus,
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    return await this.updateTask(taskId, {
      status,
      completed: status === 'completed',
    });
  },
};