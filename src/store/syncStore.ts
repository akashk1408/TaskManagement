import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { SyncState, OfflineAction } from '../types';
import { syncService } from '../services/sync';

interface SyncStore extends SyncState {
  checkConnectivity: () => Promise<void>;
  subscribeToConnectivity: () => () => void;
  addOfflineAction: (action: OfflineAction) => Promise<void>;
  clearPendingActions: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  isOnline: true,
  pendingActions: [],
  isSyncing: false,

  checkConnectivity: async () => {
    const isConnected = await syncService.checkConnectivity();
    const actions = await syncService.getOfflineActions();
    set({ isOnline: isConnected, pendingActions: actions });
  },

  subscribeToConnectivity: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      set({ isOnline: isConnected });

      // Auto-sync when coming back online
      if (isConnected && get().pendingActions.length > 0) {
        // Trigger sync in task store (lazy import to avoid circular dependency)
        import('./taskStore')
          .then(({ useTaskStore }) => {
            return import('./authStore').then(({ useAuthStore }) => {
              const taskStore = useTaskStore.getState();
              const authStore = useAuthStore.getState();
              if (authStore.user) {
                taskStore.syncTasks(authStore.user.id);
              }
            });
          })
          .catch((error) => {
            console.error('Error syncing tasks:', error);
          });
      }
    });

    // Initial check
    get().checkConnectivity();

    return unsubscribe;
  },

  addOfflineAction: async (action: OfflineAction) => {
    await syncService.saveOfflineAction(action);
    const actions = await syncService.getOfflineActions();
    set({ pendingActions: actions });
  },

  clearPendingActions: async () => {
    await syncService.clearOfflineActions();
    set({ pendingActions: [] });
  },
}));

