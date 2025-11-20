// src/services/firebaseAuth.js
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { firestoreService } from './firestoreService';

class FirebaseAuthService {
  /**
   * Sign up a new user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} displayName - User's display name (optional)
   * @returns {Promise<Object>} User credential
   */
  async signUp(email: string, password: string, displayName: string = '') {
    console.log('🔵 Starting signup process...');
    
    try {
      // Step 1: Create Firebase Auth user
      console.log('🔵 Step 1: Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log('✅ Firebase Auth user created:', userCredential.user.uid);

      // Step 2: Update user profile with display name
      if (displayName && userCredential.user) {
        console.log('🔵 Step 2: Updating display name...');
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
        console.log('✅ Display name updated');
      }

      // Step 3: Create user profile in Firestore (CRITICAL)
      if (userCredential.user) {
        console.log('🔵 Step 3: Creating Firestore profile...');
        console.log('User data to store:', {
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: displayName || email.split('@')[0],
          role: 'user',
        });
        
        try {
          await firestoreService.createUserProfile({
            uid: userCredential.user.uid,
            email: userCredential.user.email || email,
            displayName: displayName || email.split('@')[0],
            role: 'user',
            emailVerified: userCredential.user.emailVerified,
          });
          console.log('✅ Firestore profile created successfully!');
        } catch (firestoreError) {
          console.error('❌ FIRESTORE ERROR:', firestoreError);
          console.error('Error code:', firestoreError instanceof Error ? firestoreError.message : 'unknown');
          console.error('Error message:', firestoreError instanceof Error ? firestoreError.message : 'unknown');
          
          // Alert but don't fail the signup  
          alert('Warning: User created but profile storage failed. Please contact support.');
        }
      }

      // Step 4: Send email verification
      if (userCredential.user) {
        console.log('🔵 Step 4: Sending verification email...');
        try {
          await sendEmailVerification(userCredential.user);
          console.log('✅ Verification email sent');
        } catch (emailError) {
          console.warn('⚠️ Email verification failed:', emailError);
        }
      }

      console.log('✅ Signup process completed successfully!');
      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          emailVerified: userCredential.user.emailVerified,
        },
      };
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in an existing user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} User credential
   */
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          emailVerified: userCredential.user.emailVerified,
        },
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User's email
   * @returns {Promise<Object>}
   */
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent successfully',
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback: any) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Handle Firebase authentication errors
   * @param {Error} error - Firebase error
   * @returns {Error} Formatted error
   */
  handleAuthError(error: any) {
    let message = 'An error occurred during authentication';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      default:
        message = error.message || message;
    }

    const formattedError = new Error(message);
    formattedError.message = error.code;
    return formattedError;
  }
}

export const firebaseAuthService = new FirebaseAuthService();