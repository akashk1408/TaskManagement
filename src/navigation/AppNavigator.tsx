import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { TaskDashboardScreen } from '../screens/TaskDashboardScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const { subscribeToConnectivity } = useSyncStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    initializeAuth();
    const unsubscribe = subscribeToConnectivity();
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#121212' : '#f5f5f5' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="TaskDashboard" component={TaskDashboardScreen} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

