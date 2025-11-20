// App.tsx
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notifications';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';

const App: React.FC = () => {
  const { isDark } = useThemeStore();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize Firebase auth state listener
    const unsubscribeAuth = initializeAuth();

    // Initialize push notifications
    notificationService.registerForPushNotifications().catch((error: Error) => {
      console.error('Failed to register for push notifications:', error);
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, [initializeAuth]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;