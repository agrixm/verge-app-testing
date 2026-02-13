import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Organisers() {
  const router = useRouter();

  const CommitteeCard = ({ name, role, department }: { name: string, role: string, department: string }) => (
    <View className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 mb-4 flex-row items-center">
      <View className="w-12 h-12 bg-blue-600/10 rounded-2xl items-center justify-center border border-blue-500/20">
        <Ionicons name="person-outline" size={24} color="#3b82f6" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-white font-bold text-base">{name}</Text>
        <Text className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{role}</Text>
        <Text className="text-slate-500 text-[9px] uppercase mt-1">{department}</Text>
      </View>
    </View>
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
            Organisers
          </Text>
          <Text className="text-blue-500 text-[8px] font-black uppercase tracking-[3px]">
            Leadership Council
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Intro */}
        <View className="mb-8">
          <Text className="text-slate-400 text-sm leading-6">
            Verge 2026 is hosted under the authority of the Organising Committee at <Text className="text-white font-bold">SRM University, Delhi-NCR, Sonepat.</Text> Meet the visionaries leading the charge.
          </Text>
        </View>

        {/* Core Leadership Section */}
        <Text className="text-slate-500 font-black uppercase text-[10px] tracking-[4px] mb-4">
          Faculty Mentors
        </Text>
        <CommitteeCard 
          name="Dr. Sanjay Viswanathan" 
          role="Convenor // Verge 2026" 
          department="Department of Computer Science"
        />
        <CommitteeCard 
          name="Prof. Anita Sharma" 
          role="Co-Convenor" 
          department="School of Management"
        />

        <View className="h-[1px] bg-slate-900 my-6" />

        {/* Student Committee Section */}
        <Text className="text-slate-500 font-black uppercase text-[10px] tracking-[4px] mb-4">
          Student Leads
        </Text>
        <CommitteeCard 
          name="Aaryan Malhotra" 
          role="Student Secretary" 
          department="Core Committee"
        />
        <CommitteeCard 
          name="Isha Kapoor" 
          role="Joint Secretary" 
          department="Events & Operations"
        />
        <CommitteeCard 
          name="Rohit Verma" 
          role="Technical Head" 
          department="Innovation Wing"
        />

        {/* Footer Note */}
        <View className="mt-10 mb-12 p-6 bg-blue-600/5 border border-blue-500/10 rounded-[32px]">
          <Text className="text-slate-400 text-[10px] leading-5 text-center italic">
            "The VERGE Organising Committee is committed to fostering a culture of technical excellence and creative leadership."
          </Text>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Institutional Footer */}
      <View className="p-8 border-t border-slate-900">
        <Text className="text-slate-800 text-[8px] font-mono uppercase text-center tracking-[5px]">
          SRM UNIVERSITY DELHI-NCR // 2026
        </Text>
      </View>
    </SafeAreaView>
  );
}