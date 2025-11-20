// src/store/taskStore.ts
import { create } from 'zustand';
import { firestoreService } from '../services/firestoreService'; // our Firestore-backed service
import { syncService } from '../services/sync';
import { taskService } from '../services/tasks'; // keep existing service (fallback)
import { Task, TaskState, TaskStatus } from '../types';

interface TaskStore extends TaskState {
  fetchTasks: () => Promise<void>; // Removed userId parameter
  createTask: (
    title: string,
    description: string,
    userId: string,
    dueDate?: string
  ) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  syncTasks: () => Promise<void>; // Removed userId parameter
  filterTasks: (
    searchQuery: string,
    sortBy: 'assignedDate' | 'dueDate' | 'title',
    filterByStatus?: TaskStatus
  ) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  // FETCH ALL TASKS (no userId filtering)
  fetchTasks: async () => {
    debugger;
    try {
      set({ isLoading: true, error: null });

      // prefer firestoreService - fetch ALL tasks
      try {
        const tasks = await firestoreService.fetchAllTasks(); // Fetch all tasks
        set({ tasks, isLoading: false });
        return;
      } catch (fsErr) {
        console.warn('[useTaskStore] fetchTasks firestore failed, falling back to taskService:', fsErr);
        // continue to fallback
      }

      const tasks = await taskService.getAllTasks(); // Remove userId parameter
      set({ tasks, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false,
      });
    }
  },

  // CREATE
  createTask: async (title: string, description: string, userId: string, dueDate?: string) => {
    try {
      set({ error: null });

      // prefer firestoreService
      try {
        const newTask = await firestoreService.createTask(title, description, userId, dueDate);
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        return;
      } catch (fsErr) {
        console.warn('[useTaskStore] createTask firestore failed, falling back to taskService:', fsErr);
      }

      // fallback to existing service
      const newTask = await taskService.createTask(title, description, userId, dueDate);
      set((state) => ({
        tasks: [...state.tasks, newTask],
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
      });
      throw error;
    }
  },

  // UPDATE
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      set({ error: null });

      // prefer firestoreService (it returns void in our implementation)
      try {
        await firestoreService.updateTask(taskId, {
          title: updates.title as any,
          description: updates.description as any,
          status: updates.status as any,
          dueDate: (updates.dueDate as any) ?? undefined,
          userId: updates.userId as any,
          completed: updates.completed as any,
          assignedDate: (updates.assignedDate as any) ?? undefined,
        });
      } catch (fsErr) {
        console.warn('[useTaskStore] updateTask firestore failed, falling back to taskService:', fsErr);
        // fallback: attempt to use existing service if available and returns updated task
        try {
          const updatedFromService = await taskService.updateTask(taskId, updates);
          // if taskService returned full task, update state and return
          if (updatedFromService) {
            set((state) => ({
              tasks: state.tasks.map((task) => (task.id === taskId ? updatedFromService : task)),
            }));
            return;
          }
        } catch (svcErr) {
          console.warn('[useTaskStore] updateTask fallback service also failed:', svcErr);
        }
      }

      // If firestore succeeded (or service fallback didn't return full task), update local copy by merging updates
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
      });
      throw error;
    }
  },

  // DELETE
  deleteTask: async (taskId: string) => {
    try {
      set({ error: null });

      // prefer firestoreService
      try {
        await firestoreService.deleteTask(taskId);
      } catch (fsErr) {
        console.warn('[useTaskStore] deleteTask firestore failed, falling back to taskService:', fsErr);
        await taskService.deleteTask(taskId);
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
      });
      throw error;
    }
  },

  // TOGGLE COMPLETE
  toggleTaskComplete: async (taskId: string) => {
    try {
      set({ error: null });

      // find current task
      const existing = get().tasks.find((t) => t.id === taskId);
      if (!existing) throw new Error('Task not found');

      const newCompleted = !existing.completed;

      // prefer firestoreService
      try {
        await firestoreService.updateTask(taskId, { completed: newCompleted });
      } catch (fsErr) {
        console.warn('[useTaskStore] toggleTaskComplete firestore failed, falling back to taskService:', fsErr);
        await taskService.toggleTaskComplete(taskId);
      }

      // update local state
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, completed: newCompleted } : task)),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle task',
      });
      throw error;
    }
  },

  // UPDATE STATUS
  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    try {
      set({ error: null });

      // prefer firestoreService
      try {
        await firestoreService.updateTask(taskId, { status });
      } catch (fsErr) {
        console.warn('[useTaskStore] updateTaskStatus firestore failed, falling back to taskService:', fsErr);
        await taskService.updateTaskStatus(taskId, status);
      }

      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task status',
      });
      throw error;
    }
  },

  // SYNC ALL TASKS
  syncTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const isOnline = await syncService.checkConnectivity();

      if (isOnline) {
        const tasks = get().tasks;
        const syncedTasks = await syncService.syncTasks(tasks);
        const processedTasks = await syncService.processOfflineActions(syncedTasks);
        set({ tasks: processedTasks, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sync tasks',
        isLoading: false,
      });
    }
  },

  // FILTER
  filterTasks: (
    searchQuery: string,
    sortBy: 'assignedDate' | 'dueDate' | 'title',
    filterByStatus?: TaskStatus
  ) => {
    let filtered = [...get().tasks];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterByStatus) {
      filtered = filtered.filter((task) => task.status === filterByStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'assignedDate':
          return (
            new Date(a.assignedDate ?? 0).getTime() -
            new Date(b.assignedDate ?? 0).getTime()
          );
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  },
}));