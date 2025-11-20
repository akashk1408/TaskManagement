import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, OfflineAction } from '../types';
import { storage } from './storage';

const OFFLINE_ACTIONS_KEY = '@offline_actions';

export const syncService = {
  async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actionsData = await AsyncStorage.getItem(OFFLINE_ACTIONS_KEY);
      return actionsData ? JSON.parse(actionsData) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  },

  async saveOfflineAction(action: OfflineAction): Promise<void> {
    try {
      const actions = await this.getOfflineActions();
      actions.push(action);
      await AsyncStorage.setItem(
        OFFLINE_ACTIONS_KEY,
        JSON.stringify(actions)
      );
    } catch (error) {
      console.error('Error saving offline action:', error);
      throw error;
    }
  },

  async clearOfflineActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_ACTIONS_KEY);
    } catch (error) {
      console.error('Error clearing offline actions:', error);
    }
  },

  async removeOfflineAction(actionId: string): Promise<void> {
    try {
      const actions = await this.getOfflineActions();
      const filtered = actions.filter((a) => a.id !== actionId);
      await AsyncStorage.setItem(
        OFFLINE_ACTIONS_KEY,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Error removing offline action:', error);
    }
  },

  async checkConnectivity(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  },

  async syncTasks(tasks: Task[]): Promise<Task[]> {
    // Mock sync with backend
    // In real implementation, this would sync with Firebase/Supabase
    // For now, we'll just simulate a network delay and return the tasks
    
    const isOnline = await this.checkConnectivity();
    
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In real app, this would make API calls to sync with backend
    // For now, we'll just save locally
    await storage.saveTasks(tasks);

    return tasks;
  },

  async processOfflineActions(tasks: Task[]): Promise<Task[]> {
    const actions = await this.getOfflineActions();
    let updatedTasks = [...tasks];

    for (const action of actions) {
      switch (action.type) {
        case 'CREATE':
          if ('id' in action.payload) {
            updatedTasks.push(action.payload as Task);
          }
          break;
        case 'UPDATE':
          if ('id' in action.payload) {
            const task = action.payload as Task;
            const index = updatedTasks.findIndex((t) => t.id === task.id);
            if (index !== -1) {
              updatedTasks[index] = task;
            }
          }
          break;
        case 'DELETE':
          updatedTasks = updatedTasks.filter(
            (t) => t.id !== (action.payload as { id: string }).id
          );
          break;
      }
    }

    // Clear offline actions after processing
    await this.clearOfflineActions();

    return updatedTasks;
  },
};

