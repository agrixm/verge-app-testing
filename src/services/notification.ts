import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNotificationStore } from '../store/useNotificationStore';

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  setupNotificationListeners: () => {
    // Listen for incoming notifications while the app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      useNotificationStore.getState().addNotification({
        title: title || 'New Notification',
        body: body || '',
        data: data,
      });
    });

    // Also handle background/killed state if needed, though usually handled by tapping the notif
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
       const { title, body, data } = response.notification.request.content;
       // We can also choose to add it here if it wasn't caught by the received listener
       // or navigate to a specific screen based on data
    });
    
    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  },

  registerForPushNotificationsAsync: async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.log('Failed to get push token for push notification!');
      return;
    }
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      if (__DEV__) console.log('Project ID not found - push notifications disabled');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      if (__DEV__) console.log('Expo Push Token obtained:', token);
    } catch (e: any) {
      if (__DEV__) console.error('Error fetching push token:', e?.message || e);
    }
    // } else {
    //   console.log('Must use physical device for Push Notifications');
    // }

    return token;
  },

  // Pushing the token to the backend server
  sendTokenToBackend: async (token: string, user: any) => {
    try {
      const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/expo/register`;
      if (__DEV__) console.log('Sending push token to backend');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          platform: Platform.OS,
          firebaseUid: user.uid,
          userId: user._id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      if (__DEV__) console.log('Push token registered successfully');
    } catch (error: any) {
      if (__DEV__) console.error('Error sending push token to backend');
    }
  },
};
