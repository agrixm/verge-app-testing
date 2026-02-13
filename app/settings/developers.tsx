import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Linking, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- TEAM DATA ---
const TEAM = [
  {
    id: 1,
    name: "Sanskar Bhadani",
    role: "App Developer",
    image: "https://via.placeholder.com/150", // Replace with your actual image
    quote: "Code is like humor. When you have to explain it, it’s bad.",
    about: "Full-stack mobile developer specializing in React Native and high-performance backend systems. Passionate about building seamless user experiences for Verge 2026. Dedicated to creating robust architectures that scale.",
    socials: {
      instagram: "https://instagram.com/sanskarbhadani08",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/"
    }
  },
  {
    id: 2,
    name: "Agrim",
    role: "Web Developer",
    image: "https://via.placeholder.com/150",
    quote: "First, solve the problem. Then, write the code.",
    about: "Expert in frontend architecture and reactive design. Handling the core web infrastructure and dashboard systems for the festival to ensure a smooth digital experience for all participants.",
    socials: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/"
    }
  },
  
  {
    id: 3,
    name: "Anmol Sinha",
    role: "Developer",
    image: "https://via.placeholder.com/150", // Replace with your actual image
    quote: "7+7=77",
    about: "Full-stack mobile developer specializing in React Native and high-performance backend systems. Passionate about building seamless user experiences for Verge 2026. Dedicated to creating robust architectures that scale.",
    socials: {
      instagram: "https://instagram.com/sanskarbhadani08",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/"
    }
  }

];

export default function Developers() {
  const router = useRouter();
  const [selectedDev, setSelectedDev] = useState<typeof TEAM[0] | null>(null);

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-white text-2xl font-black uppercase tracking-tighter">
            VERGE DEVELOPERS
          </Text>
          <Text className="text-[#FF6B00] text-[8px] font-black uppercase tracking-[3px]">
            System Architects
          </Text>
        </View>
      </View>

      {/* Main List */}
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {TEAM.map((dev) => (
          <TouchableOpacity 
            key={dev.id}
            onPress={() => setSelectedDev(dev)}
            activeOpacity={0.9}
            className="flex-row bg-slate-900/40 border border-slate-800 rounded-[32px] p-5 mb-4 overflow-hidden"
          >
            {/* Left side dev pic */}
            <Image 
              source={{ uri: dev.image }} 
              className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700"
            />

            {/* Right side info */}
            <View className="ml-5 flex-1 justify-center">
              <View className="bg-[#FF6B00] self-start px-2 py-0.5 rounded-md mb-1">
                <Text className="text-white text-[9px] font-black uppercase italic">
                  {dev.role}
                </Text>
              </View>
              <Text className="text-white text-xl font-black uppercase italic tracking-tight mb-3">
                {dev.name}
              </Text>

              {/* Social Links */}
              <View className="flex-row gap-x-5">
                <TouchableOpacity onPress={() => openLink(dev.socials.instagram)}>
                  <Ionicons name="logo-instagram" size={18} color="#FF6B00" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLink(dev.socials.linkedin)}>
                  <Ionicons name="logo-linkedin" size={18} color="#FF6B00" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLink(dev.socials.github)}>
                  <Ionicons name="logo-github" size={18} color="#FF6B00" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View className="h-10" />
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={!!selectedDev}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDev(null)}
      >
        <View className="flex-1 justify-end bg-black/90">
          <View className="bg-slate-950 h-full rounded-t-[40px] border-t border-blue-500/30 overflow-hidden">
            
            {/* Top Down Arrow Box */}
            <View className="items-center mt-6 mb-2">
              <TouchableOpacity 
                onPress={() => setSelectedDev(null)}
                className="bg-slate-900 w-14 h-14 rounded-2xl items-center justify-center border border-slate-800 shadow-2xl"
              >
                <Ionicons name="chevron-down" size={28} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
              
              {/* Profile Header Block */}
              <View className="flex-row items-center mb-10">
                <Image 
                  source={{ uri: selectedDev?.image }} 
                  className="w-32 h-32 rounded-[32px] bg-slate-800 border-2 border-slate-800"
                />
                
                <View className="ml-6 flex-1">
                  <View className="bg-[#FF6B00] self-start px-2 py-0.5 rounded-md mb-2">
                    <Text className="text-white text-[10px] font-black uppercase italic">
                      {selectedDev?.role}
                    </Text>
                  </View>
                  <Text className="text-white text-3xl font-black italic uppercase tracking-tighter mb-4">
                    {selectedDev?.name}
                  </Text>
                  
                  <View className="flex-row gap-x-6">
                    <TouchableOpacity onPress={() => openLink(selectedDev?.socials.instagram || '')}>
                      <Ionicons name="logo-instagram" size={22} color="#FF6B00" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink(selectedDev?.socials.linkedin || '')}>
                      <Ionicons name="logo-linkedin" size={22} color="#FF6B00" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink(selectedDev?.socials.github || '')}>
                      <Ionicons name="logo-github" size={22} color="#FF6B00" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Quote Section (Cursive) */}
              <View className="mb-8 px-4">
                <Text 
                  style={{ 
                    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
                    fontSize: 22 
                  }}
                  className="text-blue-400 text-center italic"
                >
                  "{selectedDev?.quote}"
                </Text>
              </View>

              {/* Separator Line */}
              <View className="h-[1px] bg-slate-900 w-full mb-10" />

              {/* About Section */}
              <View className="mb-12">
                <Text className="text-slate-500 font-black uppercase text-[12px] tracking-[4px] mb-4">
                  Biography // Profile
                </Text>
                <Text className="text-slate-300 text-base leading-7 text-justify">
                  {selectedDev?.about}
                </Text>
              </View>

              {/* Decorative Footer */}
              <View className="items-center mb-16 opacity-30">
                  <Text className="text-slate-500 text-[8px] font-mono uppercase tracking-[6px]">
                      VERGE 2026
                  </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}