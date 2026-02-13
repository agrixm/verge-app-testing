import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Platform, 
  Switch,
  AppState,
  AppStateStatus
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);

  // 1. Function to check the ACTUAL OS notification status
  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsEnabled(status === 'granted');
  };

  // 2. Sync state on mount and when returning from phone settings
  useEffect(() => {
    // Initial check
    checkPermission();

    // Listen for app foregrounding
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        checkPermission();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        {
          key: 'android.provider.extra.APP_PACKAGE',
          value: 'com.verge.converge', 
        },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-white text-2xl font-black italic uppercase tracking-tighter">
            Notification Settings
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 mb-8">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-4">
              <Text className="text-white font-black uppercase italic tracking-widest text-sm">
                Notification Permission
              </Text>
              <Text className="text-slate-500 text-[10px] mt-1 uppercase font-bold">
                {isEnabled ? "Notifications are enabled" : "Notifications are disabled"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#1e293b', true: '#3b82f6' }}
              thumbColor={isEnabled ? '#ffffff' : '#475569'}
              ios_backgroundColor="#1e293b"
              onValueChange={openSystemSettings} // Always open settings to change permission
              value={isEnabled}
            />
          </View>
        </View>

        <View className="gap-y-3 px-2">
          <Text className="text-blue-500 font-bold text-xs mb-1">
            Why we need these permissions:
          </Text>

          {/* 1. Live Updates */}
          <View className="flex-row items-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center">
              <Ionicons name="flash-outline" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-bold text-sm">Instant & Live Updates</Text>
              <Text className="text-slate-500 text-xs mt-1">Get real-time news about the festival and events.</Text>
            </View>
          </View>

          {/* 2. Purchases */}
          <View className="flex-row items-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <View className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center">
              <Ionicons name="cart-outline" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-bold text-sm">Your Purchases</Text>
              <Text className="text-slate-500 text-xs mt-1">Get alerts for your orders and merch delivery.</Text>
            </View>
          </View>

          {/* 3. Bookings */}
          <View className="flex-row items-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <View className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center">
              <Ionicons name="bed-outline" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-bold text-sm">Your Bookings</Text>
              <Text className="text-slate-500 text-xs mt-1">Stay updated on your stay and room information.</Text>
            </View>
          </View>

          {/* 4. Schedule Changes */}
          <View className="flex-row items-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <View className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center">
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-bold text-sm">Schedule Changes</Text>
              <Text className="text-slate-500 text-xs mt-1">Know instantly if an event is moved or cancelled.</Text>
            </View>
          </View>

          {/* 5. Security */}
          <View className="flex-row items-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <View className="w-10 h-10 bg-red-500/10 rounded-xl items-center justify-center">
              <Ionicons name="shield-checkmark-outline" size={20} color="#ef4444" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-red-500 font-bold text-sm">Security Alerts</Text>
              <Text className="text-slate-500 text-xs mt-1">Important notices about your account and safety.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={openSystemSettings}
          className="mt-12 bg-blue-600/10 border border-blue-500/30 p-5 rounded-2xl flex-row items-center justify-center"
        >
          <Ionicons name="settings-outline" size={20} color="#3b82f6" />
          <Text className="text-blue-500 font-black uppercase italic ml-3 text-xs tracking-widest">
            Open System Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="p-8">
        <View className="h-[1px] bg-slate-900 w-full mb-4" />
        <Text className="text-slate-500 text-[8px] font-mono uppercase text-center tracking-[4px]">
          VERGE 2026
        </Text>
      </View>
    </SafeAreaView>
  );
}