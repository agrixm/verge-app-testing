import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function InfoScreen() {
  const router = useRouter();

  const InfoSection = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <View className="mb-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 bg-blue-500/10 rounded-lg items-center justify-center">
          <Ionicons name={icon} size={20} color="#3b82f6" />
        </View>
        <Text className="text-white font-bold text-lg ml-3">{title}</Text>
      </View>
      {children}
    </View>
  );

  const TimeRow = ({ label, time }: { label: string, time: string }) => (
    <View className="flex-row justify-between py-2 border-b border-slate-800/50">
      <Text className="text-slate-300 text-sm font-medium">{label}</Text>
      <Text className="text-blue-400 text-sm font-bold">{time}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold ml-3">Campus Info</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

        <InfoSection title="Medical Center" icon="medkit-outline">
          <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Weekday Hours</Text>
          <TimeRow label="Morning" time="9:00 AM - 12:30 PM" />
          <TimeRow label="Evening" time="1:30 PM - 4:00 PM" />
          
          <Text className="text-slate-500 text-xs font-bold uppercase mt-4 mb-2">Specialists</Text>
          <TimeRow label="Dentist (Sat)" time="4:00 PM - 7:00 PM" />
          <TimeRow label="ENT (Mon & Thu)" time="5:00 PM - 6:30 PM" />
          <TimeRow label="Homeopathic (Tue)" time="5:30 PM - 6:30 PM" />
        </InfoSection>
        
        {/* Mess Timings */}
        <InfoSection title="Mess Timings" icon="restaurant-outline">
          <TimeRow label="Breakfast" time="7:30 AM - 9:30 AM" />
          <TimeRow label="Lunch" time="11:30 AM - 1:30 PM" />
          <TimeRow label="Dinner" time="6:30 PM - 8:00 PM" />
        </InfoSection>

        {/* Food Outlets */}
        <InfoSection title="Food Outlets" icon="fast-food-outline">
          <TimeRow label="Bunny's Kitchen" time="8:30 AM - 10:00 PM" />
          <TimeRow label="Cafe Ryana" time="8:30 AM - 10:00 PM" />
          <TimeRow label="Gags Cafe" time="9:00 AM - 4:30 PM" />
          <TimeRow label="Royal Cafe" time="9:00 AM - 4:30 PM" />
          <View className="mt-3 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
            <Text className="text-slate-400 text-xs leading-5">
              Note: Food stalls are functional throughout the Fest
            </Text>
          </View>
        </InfoSection>

        {/* Shopping */}
        <InfoSection title="Akshay (BITS-COOP)" icon="cart-outline">
          <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Supermarket</Text>
          <TimeRow label="Morning" time="9:00 AM - 2:00 PM" />
          <TimeRow label="Evening" time="3:30 PM - 8:30 PM" />
          <Text className="text-slate-500 text-xs font-bold uppercase mt-4 mb-2">Vegetable Section</Text>
          <TimeRow label="Morning" time="9:00 AM - 2:00 PM" />
          <TimeRow label="Evening" time="3:00 PM - 6:30 PM" />
        </InfoSection>

        {/* Stationery */}
        <InfoSection title="S-9 (Stationery)" icon="pencil-outline">
          <Text className="text-slate-500 text-[10px] mb-3">Location: Vyas Bhawan Warden House</Text>
          <TimeRow label="Mon - Sat" time="9:00 AM - 8:00 PM" />
          <TimeRow label="Sunday" time="9:00 AM - 5:00 PM" />
        </InfoSection>

        {/* Medical Center */}
        

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}