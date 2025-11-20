export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  status: TaskStatus;
  assignedDate: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Task | { id: string };
  timestamp: string;
}

export interface SyncState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  isSyncing: boolean;
}

