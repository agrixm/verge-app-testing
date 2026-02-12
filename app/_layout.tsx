import 'expo-dev-client';
import '../global.css';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Internal Imports
import { authService, Session } from '../src/services/auth'; 
import { notificationService } from '../src/services/notification'; 
import { CartProvider } from '../src/context/CartContext'; 
import { useFonts, Orbitron_400Regular, Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron';
import * as Font from 'expo-font';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
    'Anurati': require('../assets/fonts/Anurati-Regular.otf'),
  });

  const [isBooting, setIsBooting] = useState(true);
  const [user, setUser] = useState<Session | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await authService.syncUserWithBackend(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      // Small delay to ensure initialization
      const timer = setTimeout(() => setIsBooting(false), 500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isBooting || !fontsLoaded) return;
    const onLoginPage = segments[0] === 'login';

    if (!user && !onLoginPage) {
      router.replace('/login');
    } else if (user && onLoginPage) {
      router.replace('/dashboard');
    }
  }, [user, segments, isBooting, router]);

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

  if (isBooting) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' }}>
          <Text style={{ color: '#888888', fontSize: 10, letterSpacing: 2, fontWeight: '800' }}>INITIALIZING...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="MerchStore/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}
