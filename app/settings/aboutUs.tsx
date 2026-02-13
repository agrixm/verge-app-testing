import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutUs() {
  const router = useRouter();

  const ObjectiveItem = ({ title, desc, icon }: { title: string, desc: string, icon: any }) => (
    <View className="flex-row items-start mb-6">
      <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center border border-blue-500/20">
        <Ionicons name={icon} size={20} color="#3b82f6" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-white font-bold text-base mb-1">{title}</Text>
        <Text className="text-slate-400 text-sm leading-5">{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold ml-3">About Verge</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Intro Section */}
        <View className="mb-8">
          <Text className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-2 text-center">The Extravaganza</Text>
          <Text className="text-white text-3xl font-black mb-4 text-center uppercase">Verge 2026</Text>
          <Text className="text-slate-300 text-base leading-6">
            Verge 2026 is the flagship annual festival of SRM University Delhi-NCR, designed to be a confluence of technological innovation, industry leadership, and creative expression. 
          </Text>
        </View>

        {/* Story Section */}
        <View className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mb-8">
          <Text className="text-slate-300 text-sm leading-6 italic">
            "Building on the success of Verge 2025, which achieved a social media reach of 1M+, Verge 2026 aims to set a new benchmark for university festivals in North India."
          </Text>
        </View>

        {/* Mission Statement */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-6">Key Objectives</Text>
          
          <ObjectiveItem 
            icon="bulb-outline"
            title="Innovation"
            desc="Provide a high-stakes platform for students to solve real-world problems through hackathons and ideathons."
          />
          <ObjectiveItem 
            icon="briefcase-outline"
            title="Industry Integration"
            desc="Bridge the gap between academia and industry via panel discussions, workshops, and startup expos."
          />
          <ObjectiveItem 
            icon="trending-up-outline"
            title="Holistic Growth"
            desc="Combine technical rigor with cultural vibrancy to foster teamwork and creativity."
          />
        </View>

        {/* Experience Section */}
        <View className="bg-blue-600 rounded-[32px] p-8 mb-8">
          <Text className="text-white text-2xl font-black mb-4">The Experience</Text>
          <Text className="text-white/90 text-sm leading-6 mb-6">
            Experience two days of innovation, technology, and creativity with thrilling competitions, hands-on workshops, and inspiring talks from industry leaders.
          </Text>
          
          <View className="flex-row flex-wrap gap-2">
            {['Innovation Hub', 'Tech Workshops', 'Expert Talks', 'Networking Events'].map((tag) => (
              <View key={tag} className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
                <Text className="text-white text-xs font-bold">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Closing Note */}
        <View className="mb-10 px-2">
          <Text className="text-slate-400 text-sm leading-6 text-center">
            Verge serves as a dynamic platform for students to exhibit their talents, engage with cutting-edge technology, and celebrate diverse cultural expressions at SRM University, Delhi-NCR, Sonepat.
          </Text>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}