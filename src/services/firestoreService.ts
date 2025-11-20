// src/services/firestoreService.ts
import {
  addDoc,
  collection,
  deleteField,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Task, TaskStatus } from '../types';

/**
 * User profile interface and create input remain the same
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  emailVerified: boolean;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
}

interface CreateUserProfileInput {
  uid: string;
  email: string;
  displayName: string;
  role?: 'admin' | 'user';
  emailVerified?: boolean;
}

/**
 * FirestoreService: includes both user profile methods AND task methods
 */
class FirestoreService {
  private readonly usersCollection = 'users';
  private readonly tasksCollection = 'tasks';

  /**********************
   * User profile methods
   **********************/
  async createUserProfile(userData: CreateUserProfileInput): Promise<UserProfile> {
    console.log('🔵 Firestore: Creating user profile...');
    console.log('🔵 User data:', userData);

    try {
      const userRef = doc(db, this.usersCollection, userData.uid);
      console.log('🔵 Document reference created:', `${this.usersCollection}/${userData.uid}`);

      const userProfile: UserProfile = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role || 'user',
        emailVerified: userData.emailVerified || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('🔵 Writing to Firestore...');
      await setDoc(userRef, userProfile);
      console.log('✅ Firestore document created successfully!');

      return {
        ...userProfile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    } catch (error) {
      console.error('❌ Firestore Error Details:');
      console.error('Error type:', error instanceof Error ? error.constructor.name : 'unknown');
      console.error('Error code:', error instanceof Error ? error.message : 'unknown');
      console.error('Error message:', error instanceof Error ? error.message : 'unknown');
      console.error('Full error:', error);

      throw new Error(error instanceof Error ? error.message : 'Failed to create user profile');
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, this.usersCollection, uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get user profile');
    }
  }

  async updateUserProfile(uid: string, updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, uid);

      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user profile');
    }
  }

  async userProfileExists(uid: string): Promise<boolean> {
    try {
      const userRef = doc(db, this.usersCollection, uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    } catch (error) {
      console.error('Error checking user profile:', error);
      return false;
    }
  }

  /**********************
   * Task helper + methods
   **********************/
  // Helper: convert Firestore Timestamp | Date | string => ISO string | undefined
  private toISO(val: any): string | undefined {
    if (!val && val !== 0) return undefined;
    if (val instanceof Timestamp && typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'string') return val;
    try {
      const dt = new Date(val);
      if (!isNaN(dt.getTime())) return dt.toISOString();
    } catch {}
    return undefined;
  }

  /**
   * createTask(title, description, ownerId, dueDateISO?)
   * returns created Task (with id)
   */
  async createTask(
    title: string,
    description: string,
    ownerId: string,
    dueDateISO?: string
  ): Promise<Task> {
    const tasksCol = collection(db, this.tasksCollection);
    const payload: DocumentData = {
      title,
      description: description ?? '',
      ownerId,
      userId: ownerId, // default assigned user = owner
      status: 'not_started' as TaskStatus,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
   debugger
    if (dueDateISO) payload.dueDate = dueDateISO;

    const docRef = await addDoc(tasksCol, payload);
    const snap = await getDoc(docRef);
    const data = snap.data() || {};

    return {
      id: docRef.id,
      title: (data.title as string) ?? title,
      description: (data.description as string) ?? description,
      status: (data.status as TaskStatus) ?? 'not_started',
      dueDate: this.toISO(data.dueDate),
      ownerId: (data.ownerId as string) ?? ownerId,
      userId: (data.userId as string) ?? ownerId,
      completed: typeof data.completed === 'boolean' ? data.completed : false,
      assignedDate: this.toISO(data.assignedDate),
      createdAt: data.createdAt?.toDate?.() ?? null,
      updatedAt: data.updatedAt?.toDate?.() ?? null,
    } as Task;
  }

  /**
   * updateTask(taskId, updates)
   * - to remove dueDate pass `dueDate: null`
   */
  async updateTask(
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      dueDate: string | null;
      userId?: string;
      completed?: boolean;
      assignedDate?: string | null;
    }>
  ): Promise<void> {
    if (!taskId) throw new Error('taskId required');

    const taskDoc = doc(db, this.tasksCollection, taskId);
    const payload: DocumentData = {
      updatedAt: serverTimestamp(),
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (typeof updates.completed === 'boolean') payload.completed = updates.completed;
    if (updates.userId !== undefined) payload.userId = updates.userId;

    if (Object.prototype.hasOwnProperty.call(updates, 'dueDate')) {
      if (updates.dueDate === null) {
        payload.dueDate = deleteField();
      } else {
        payload.dueDate = updates.dueDate;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'assignedDate')) {
      if (updates.assignedDate === null) {
        payload.assignedDate = deleteField();
      } else {
        payload.assignedDate = updates.assignedDate;
      }
    }

    await updateDoc(taskDoc, payload);
  }

  /**
   * fetchAllTasks()
   * Returns ALL tasks from the database ordered by createdAt desc
   * No filtering by ownerId - all users see all tasks
   */
  async fetchAllTasks(): Promise<Task[]> {
    const tasksCol = collection(db, this.tasksCollection);
    const q = query(tasksCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const tasks: Task[] = snapshot.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: (data.title as string) ?? '',
        description: (data.description as string) ?? '',
        status: (data.status as TaskStatus) ?? 'not_started',
        dueDate: this.toISO(data.dueDate),
        ownerId: (data.ownerId as string) ?? '',
        userId: (data.userId as string) ?? ((data.ownerId as string) ?? ''),
        completed: typeof data.completed === 'boolean' ? data.completed : false,
        assignedDate: this.toISO(data.assignedDate),
        createdAt: data.createdAt?.toDate?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
      } as Task;
    });

    return tasks;
  }

  /**
   * fetchTasks(ownerId) - DEPRECATED
   * Keep this method for backward compatibility if needed
   * Consider removing if not used elsewhere in the codebase
   */
  async fetchTasks(ownerId: string): Promise<Task[]> {
    const tasksCol = collection(db, this.tasksCollection);
    const q = query(tasksCol, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const tasks: Task[] = snapshot.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: (data.title as string) ?? '',
        description: (data.description as string) ?? '',
        status: (data.status as TaskStatus) ?? 'not_started',
        dueDate: this.toISO(data.dueDate),
        ownerId: (data.ownerId as string) ?? '',
        userId: (data.userId as string) ?? ((data.ownerId as string) ?? ''),
        completed: typeof data.completed === 'boolean' ? data.completed : false,
        assignedDate: this.toISO(data.assignedDate),
        createdAt: data.createdAt?.toDate?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
      } as Task;
    });

    return tasks;
  }

  /**
   * deleteTask(taskId)
   * soft-delete (sets deletedAt) — switch to hard delete if desired
   */
  async deleteTask(taskId: string): Promise<void> {
    const taskDoc = doc(db, this.tasksCollection, taskId);
    await updateDoc(taskDoc, { deletedAt: serverTimestamp() });
    // or to hard delete: await deleteDoc(taskDoc);
  }
}

export const firestoreService = new FirestoreService();
export default firestoreService;