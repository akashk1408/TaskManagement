// src/config/firebase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyCK_S7IFiMIHyFN0xTZfEMsRvj6sfXkd1Y",
    authDomain: "task-management-app-b9f69.firebaseapp.com",
    projectId: "task-management-app-b9f69",
    storageBucket: "task-management-app-b9f69.firebasestorage.app",
    messagingSenderId: "267549354888",
    appId: "1:267549354888:web:5da62c190145af0ae2a83d"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export { app, auth, db };

