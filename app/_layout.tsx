import 'expo-dev-client';
import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Internal Imports
import { authService, Session } from '../src/services/auth'; 
import { notificationService } from '../src/services/notification'; 
import { CartProvider } from '../src/context/CartContext'; 
import { useFonts, Orbitron_400Regular, Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
    'Anurati': require('../assets/fonts/Anurati-Regular.otf'),
    'Guardians': require('../assets/fonts/Guardians.ttf'),
  });

  const [user, setUser] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
      if (currentUser) {
        await authService.syncUserWithBackend(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !authInitialized) return;
    const onLoginPage = segments[0] === 'login';

    if (!user && !onLoginPage) {
      router.replace('/login');
    } else if (user && onLoginPage) {
      router.replace('/dashboard');
    }
  }, [user, segments, fontsLoaded, authInitialized, router]);

  useEffect(() => {
    const registerNotifications = async () => {
      if (user) {
        const token = await notificationService.registerForPushNotificationsAsync();
        if (token) {
          await notificationService.sendTokenToBackend(token, user);
        }
      }
    };
    registerNotifications();
  }, [user]);

  useEffect(() => {
    const cleanup = notificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  if (!fontsLoaded || !authInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="dashboard" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="MerchStore/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}
