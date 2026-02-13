import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ContactUs() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL('mailto:verge@srmuniversity.ac.in');
  };

  const ContactCard = ({ icon, title, value, onPress, color }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 mb-4 flex-row items-center"
    >
      <View className="w-12 h-12 rounded-2xl items-center justify-center bg-blue-500/10 border border-blue-500/20">
        <Ionicons name={icon} size={24} color={color || "#3b82f6"} />
      </View>
      <View className="ml-5 flex-1">
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</Text>
        <Text className="text-white font-bold text-base">{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#1e293b" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-white text-2xl font-black italic uppercase tracking-tighter">
            Contact Us
          </Text>
          <Text className="text-[#FF6B00] text-[8px] font-black uppercase tracking-[3px]">
            Support & Inquiry
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-slate-400 text-sm leading-6 mb-8">
          Have a question or need assistance regarding Verge 2026? Reach out to our team through any of the channels below.
        </Text>

        {/* Email Card */}
        <ContactCard
          color="#FF6B00" 
          icon="mail-outline"
          title="Official Email"
          value="verge@srmuniversity.ac.in"
          onPress={handleEmail}
        />

        {/* Social Support Section */}
        <View className="mt-8 mb-4">
          <Text className="text-slate-500 font-black uppercase text-[10px] tracking-[4px] mb-4">
            Connect With Us
          </Text>
          <View className="flex-row gap-x-4">
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://instagram.com/verge.srmuh')}
              className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 items-center justify-center flex-1"
            >
              <Ionicons name="logo-instagram" size={28} color="#FF6B00" />
              <Text className="text-slate-400 text-[8px] font-bold uppercase mt-2">Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.linkedin.com/company/verge-srmuh/')}
              className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 items-center justify-center flex-1"
            >
              <Ionicons name="logo-linkedin" size={28} color="#FF6B00" />
              <Text className="text-slate-400 text-[8px] font-bold uppercase mt-2">LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Section */}
        <View className="mt-10 p-6 bg-blue-600/5 border border-blue-500/10 rounded-[32px]">
          <Text className="text-slate-500 text-[10px] leading-5 text-center">
            Our team usually responds to emails within 24-48 hours during the festival season. For immediate assistance, please use our official social channels.
          </Text>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}