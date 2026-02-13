import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SponsorsScreen() {
  const router = useRouter();

  // Dummy Data for Sponsors
  const sponsorTiers = [
    {
      tier: "Title Sponsor",
      size: "large",
      items: [
        { id: 1, name: "TechNova Systems", industry: "Cloud Infrastructure", color: "#3b82f6" }
      ]
    },
    {
      tier: "Platinum Sponsors",
      size: "medium",
      items: [
        { id: 2, name: "Aura Energy", industry: "Renewable Tech", color: "#10b981" },
        { id: 3, name: "Nexus Labs", industry: "AI Research", color: "#8b5cf6" }
      ]
    },
    {
      tier: "Gold Sponsors",
      size: "small",
      items: [
        { id: 4, name: "Vertex Finance", industry: "FinTech", color: "#f59e0b" },
        { id: 5, name: "Swift Logistics", industry: "Delivery", color: "#ef4444" },
        { id: 6, name: "CodeBase", industry: "Education", color: "#06b6d4" }
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-white text-2xl font-bold">Our Partners</Text>
          <Text className="text-[#FF6B00] text-xs uppercase tracking-widest">Verge 2026</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-slate-400 text-sm leading-5 mb-8">
          The success of Verge 2026 is made possible by the generous support of our industry partners and sponsors.
        </Text>

        {sponsorTiers.map((tierGroup, index) => (
          <View key={index} className="mb-10">
            {/* Tier Title */}
            <View className="flex-row items-center mb-6">
              <View className="h-[1px] flex-1 bg-slate-900" />
              <Text className="mx-4 text-[#FF6B00] font-bold uppercase text-[10px] tracking-[3px]">
                {tierGroup.tier}
              </Text>
              <View className="h-[1px] flex-1 bg-slate-900" />
            </View>

            {/* Sponsor Cards Grid */}
            <View className="flex-row flex-wrap justify-between">
              {tierGroup.items.map((sponsor) => (
                <View 
                  key={sponsor.id} 
                  style={{ width: tierGroup.size === 'large' ? '100%' : tierGroup.size === 'medium' ? '48%' : '31%' }}
                  className="mb-4 aspect-square bg-slate-900/50 border border-slate-800 rounded-3xl items-center justify-center p-4"
                >
                  <View 
                    style={{ backgroundColor: `${sponsor.color}20`, borderColor: `${sponsor.color}40` }}
                    className="w-12 h-12 rounded-2xl items-center justify-center border mb-3"
                  >
                    <Ionicons name="business" size={24} color={sponsor.color} />
                  </View>
                  <Text className="text-white font-bold text-center text-xs" numberOfLines={1}>
                    {sponsor.name}
                  </Text>
                  <Text className="text-slate-500 text-[8px] uppercase font-bold mt-1 text-center">
                    {sponsor.industry}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* CTA Section */}
        <TouchableOpacity 
          className="mt-4 mb-12 bg-blue-600/10 border border-blue-500/20 p-8 rounded-[40px] items-center"
        >
          <Ionicons name="rocket-outline" size={32} color="#3b82f6" />
          <Text className="text-[#FF6B00] font-bold text-lg mt-4">Partner with us</Text>
          <Text className="text-slate-500 text-center text-xs mt-2 leading-5">
            Want to showcase your brand to 10,000+ students?{"\n"}Join the Verge 2026 network.
          </Text>
          <View className="mt-6 bg-blue-600 px-6 py-2 rounded-full">
            <Text className="text-white font-bold text-xs">Contact Outreach</Text>
          </View>
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}