import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LegalScreen() {
  const router = useRouter();
  const [modalType, setModalType] = useState<'none' | 'legal' | 'privacy'>('none');

  const LegalContent = () => (
    <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-lg font-bold mb-4">Intellectual Property, Usage Restrictions & Legal Notice</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        This application, including but not limited to its software architecture, source code, user interface, design elements, logos, content, databases, backend services, documentation, and all related digital assets (collectively referred to as “the Application”), is the exclusive intellectual property of the VERGE Organising Committee and the VERGE App Development Team, SRM University, Delhi-NCR, Sonepat. {"\n"}{"\n"}
        All rights, title, and interest in and to the Application are fully reserved. The Application is provided solely for authorized use in connection with VERGE and its associated events.
      </Text>

      <Text className="text-white text-lg font-bold mb-4">Prohibited Activities</Text>
      <Text className="text-slate-400 leading-6 mb-4">
        Users and third parties are strictly prohibited from engaging in any of the following activities, whether directly or indirectly:{"\n"}{"\n"}
        • Unauthorized access to the Application, its servers, APIs, databases, or internal systems{"\n"}
        • Copying, reproducing, modifying, distributing, publishing, sublicensing, or selling any part of the Application{"\n"}
        • Reverse engineering, decompiling, disassembling, or attempting to derive the source code or underlying structure of the Application{"\n"}
        • Tampering with security mechanisms, authentication flows, payment systems, or notification services{"\n"}
        • Creating derivative works or unauthorized versions of the Application{"\n"}
        • Using the Application for any unlawful, malicious, or non-approved purpose
      </Text>

      <Text className="text-white text-lg font-bold mb-4">Security & Monitoring</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        The VERGE Organising Committee reserves the right to monitor usage of the Application to ensure compliance with these terms. Any suspicious activity, security breach attempt, or misuse may result in immediate restriction or termination of access without prior notice.
      </Text>

      <Text className="text-white text-lg font-bold mb-4">Disciplinary & Legal Consequences</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        Any violation of this notice or misuse of the Application may lead to:{"\n"}{"\n"}
        • Disciplinary action under the rules, regulations, and code of conduct of SRM University, Delhi-NCR, Sonepat{"\n"}
        • Suspension or permanent revocation of access to the Application{"\n"}
        • Legal action under applicable Indian laws, including but not limited to provisions of the Information Technology Act, 2000, Indian Copyright Act, the Indian Penal Code, and other relevant cyber laws and regulations{"\n"}{"\n"}
        The Organising Committee reserves the right to initiate civil or criminal proceedings where deemed necessary.
      </Text>

      <Text className="text-white text-lg font-bold mb-4">No License Granted</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        Nothing contained in this Application or these terms shall be construed as granting any license or right, express or implied, to use, copy, or exploit any part of the Application except as explicitly permitted for personal, non-commercial use related to VERGE.
      </Text>

      <Text className="text-white text-lg font-bold mb-4">Governing Authority</Text>
      <Text className="text-slate-400 leading-6 mb-10">
        This Application is operated under the authority of VERGE Organising Committee and the VERGE Development Team SRM University, Delhi-NCR, Sonepat, and any disputes arising from its use shall be subject to the jurisdiction of the competent courts as determined by applicable university policies and Indian law.
      </Text>
    </ScrollView>
  );

  const PrivacyContent = () => (
    <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-xl font-bold mb-4">Privacy Policy</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        This Privacy Policy describes how the VERGE Tech Fest App (“the App”) collects, uses, stores, and protects user information. The App is officially operated by the VERGE Organising Committee, SRM University, Delhi-NCR, Sonepat.{"\n"}{"\n"}
        By using this App, you agree to the collection and use of information in accordance with this Privacy Policy.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">1. Information We Collect</Text>
      <Text className="text-slate-400 leading-6 mb-4">
        We collect only the information necessary to provide core app functionality.{"\n"}{"\n"}
        <Text className="font-bold text-slate-200">a) Personal Information</Text>{"\n"}
        Name and email address obtained through Google Sign-In. Profile information required for event participation, bookings, and purchases.{"\n"}{"\n"}
        <Text className="font-bold text-slate-200">b) Transaction Information</Text>{"\n"}
        Hostel booking details, Merchandise order details, Payment status and order history. (Payment processing is handled by authorized third-party payment gateways. The App does not store card or UPI credentials.){"\n"}{"\n"}
        <Text className="font-bold text-slate-200">c) Usage & Technical Data</Text>{"\n"}
        Device information (such as OS version). Notification tokens for sending updates and alerts.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">2. How We Use Your Information</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        Collected information is used strictly for: user authentication, event registration, hostel/merchandise fulfillment, sending important announcements, improving app performance, and resolving support queries. We do not use user data for advertising or commercial profiling.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">3. Data Sharing & Disclosure</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        User data is not sold or rented. Information may be shared only with authorized organizers, trusted third-party services (auth, payments, analytics), or when required by law.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">4. Data Storage & Security</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        Reasonable safeguards are implemented to protect user data against unauthorized access. Access is restricted to authorized personnel only.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">5. Data Retention</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        User data is retained only as long as necessary to conduct events, fulfill transactions, or meet legal requirements.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">7. Notifications</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        The App sends event updates, schedule changes, and emergency alerts. Users may manage permissions in device settings.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">8. Children’s Privacy</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        The App is intended for students and does not knowingly collect data from children.
      </Text>

      <Text className="text-white text-lg font-bold mb-2">9. Changes to This Policy</Text>
      <Text className="text-slate-400 leading-6 mb-6">
        This policy may be updated. Continued use indicates acceptance of revised terms.
      </Text>

      <View className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-10">
        <Text className="text-white font-bold mb-2">Contact Us</Text>
        <Text className="text-slate-400 text-xs">Email: verge@srmuniversity.ac.in</Text>
        <Text className="text-slate-400 text-xs">Organising Committee: VERGE, SRM University, Delhi-NCR, Sonepat</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center px-6 py-4 border-b border-slate-900">
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold ml-3">Legals & Privacy</Text>
      </View>

      <View className="flex-1 px-6 justify-center">
        <View className="bg-slate-900/50 p-6 rounded-[40px] border border-slate-800">
          <Ionicons name="shield-checkmark" size={40} color="gold" style={{ alignSelf: 'center', marginBottom: 20 }} />
          <Text className="text-slate-400 text-center mb-8">Please review our official protocols.</Text>

          <TouchableOpacity onPress={() => setModalType('legal')} className="bg-slate-800 p-5 rounded-2xl flex-row justify-between mb-4">
            <Text className="text-white font-bold">Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalType('privacy')} className="bg-slate-800 p-5 rounded-2xl flex-row justify-between">
            <Text className="text-white font-bold">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalType !== 'none'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalType('none')}
      >
        <SafeAreaView className="flex-1 bg-slate-950">
          <View className="flex-row justify-between items-center p-6 border-b border-slate-900">
            <Text className="text-white text-xl font-bold">
              {modalType === 'legal' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <TouchableOpacity onPress={() => setModalType('none')}>
              <Ionicons name="close-circle" size={32} color="#475569" />
            </TouchableOpacity>
          </View>

          <View className="flex-1">
            {modalType === 'legal' ? <LegalContent /> : <PrivacyContent />}
          </View>
          
          <View className="p-6 border-t border-slate-900">
            <TouchableOpacity onPress={() => setModalType('none')} className="bg-blue-600 py-4 rounded-2xl items-center">
              <Text className="text-white font-bold">I Have Read & Understood</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}