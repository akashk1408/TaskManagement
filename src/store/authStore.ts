// src/store/authStore.ts
import { create } from 'zustand';
import { firebaseAuthService } from '../services/auth';
import { firestoreService, UserProfile } from '../services/firestoreService';

// User type definition
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role?: 'admin' | 'user';
}

// Auth result type
interface AuthResult {
  success: boolean;
  user: User;
}

// Password reset result type
interface PasswordResetResult {
  success: boolean;
  message: string;
}

// Auth store state type
interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initializeAuth: () => (() => void) | undefined;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<PasswordResetResult>;
  getCurrentUser: () => any;
  clearError: () => void;
  loadUserProfile: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Load user profile from Firestore
  loadUserProfile: async (uid: string): Promise<void> => {
    try {
      const profile = await firestoreService.getUserProfile(uid);
      set({ userProfile: profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  },

  // Initialize auth state listener
  initializeAuth: () => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        // Load user profile from Firestore
        try {
          const profile = await firestoreService.getUserProfile(user.uid);
          set({
            user: {
              ...user,
              role: profile?.role || 'user',
            },
            userProfile: profile,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading profile:', error);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({
          user: null,
          userProfile: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
    return unsubscribe;
  },

  // Sign in with email and password
  login: async (email: string, password: string): Promise<AuthResult> => {
    set({ isLoading: true, error: null });
    try {
      const result = await firebaseAuthService.signIn(email, password);
      
      // Load user profile from Firestore
      const profile = await firestoreService.getUserProfile(result.user.uid);
      
      set({
        user: {
          ...result.user,
          role: profile?.role || 'user',
        },
        userProfile: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign up with email and password
  signup: async (email: string, password: string, displayName: string = ''): Promise<AuthResult> => {
    set({ isLoading: true, error: null });
    try {
      const result = await firebaseAuthService.signUp(email, password, displayName);
      
      // Load the newly created user profile
      const profile = await firestoreService.getUserProfile(result.user.uid);
      
      set({
        user: {
          ...result.user,
          role: profile?.role || 'user',
        },
        userProfile: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign out
  logout: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await firebaseAuthService.signOut();
      set({
        user: null,
        userProfile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email: string): Promise<PasswordResetResult> => {
    set({ isLoading: true, error: null });
    try {
      const result = await firebaseAuthService.resetPassword(email);
      set({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return firebaseAuthService.getCurrentUser();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));