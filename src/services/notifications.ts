import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Configure Android channel first
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Try to get the push token
      // Note: This requires a projectId in app.json or expo config
      // For now, we'll catch the error gracefully since Firebase isn't configured yet
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: undefined, // Will use from app.json if available
        });
        const token = tokenData.data;
        console.log('Push token:', token);
        return token;
      } catch (tokenError: any) {
        // If projectId is missing, that's okay - we'll handle it when Firebase is integrated
        if (tokenError.message?.includes('projectId')) {
          console.log('Push notifications require projectId. Will be configured when Firebase is integrated.');
          return null;
        }
        throw tokenError;
      }
    } catch (error) {
      // Don't log as error - this is expected until Firebase is configured
      console.log('Push notifications not available:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  },

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: trigger || null, // null means show immediately
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  // This will be used when Firebase Cloud Messaging is integrated
  // async initializeFCM() {
  //   // Firebase Cloud Messaging initialization code will go here
  // },
};

