import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import { authService } from '../../src/services/auth';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;
const RAZORPAY_KEY_ID = 'rzp_test_Pv16gbH3ZJn5YP';
const PRICE_PER_DAY = 150;

const THEME = {
  bg: '#050505',
  cardBg: '#121212',
  accent: '#FF6B00',
  text: '#FFFFFF',
  textMuted: '#888888',
  border: '#1F1F1F',
  borderLight: '#2A2A2A',
  surface: '#0A0A0A',
  success: '#00C853',
  error: '#FF3D00',
};

export default function HostelRegister() {
  const router = useRouter();
  const { id: hostelName } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEstablishingConnection, setIsEstablishingConnection] = useState(false);

  const [form, setForm] = useState({
    name: '',
    gender: '',
    collegeName: '',
    email: '',
    phone: '',
    days: 3,
    mongoUserId: '',
    firebaseUid: '',
  });

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const session = authService.getSession();
      if (!session) return;

      const response = await fetch(`${SERVER_URL}/api/users/get?firebaseUid=${session.uid}`);

      if (response.ok) {
        const result = await response.json();
        const userData = result.data;

        setForm((prev) => ({
          ...prev,
          name: userData.name || session.displayName || '',
          gender: userData.gender || '',
          collegeName: userData.collegeName || '',
          email: userData.email || session.email || '',
          mongoUserId: userData._id,
          firebaseUid: session.uid,
        }));
      }
    } catch {
      if (__DEV__) console.error('Error fetching user for hostel');
    } finally {
      setLoading(false);
    }
  };

  const isProfileIncomplete = !form.gender || !form.collegeName || !form.name;
  const totalAmount = form.days * PRICE_PER_DAY;

  const isGenderMismatched = () => {
    if (!form.gender || !hostelName) return false;
    const hName = String(hostelName).toLowerCase();
    const uGender = form.gender.toLowerCase();
    if (hName.includes('girls') && uGender === 'male') return true;
    if (hName.includes('boys') && uGender === 'female') return true;
    return false;
  };

  const handlePreCheck = () => {
    if (isGenderMismatched()) {
      Alert.alert('Access Denied', 'Gender mismatch with selected hostel.');
      return;
    }

    if (!form.phone || form.phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid WhatsApp number.');
      return;
    }

    setShowPaymentModal(true);
  };

  const startRazorpayPayment = () => {
    setShowPaymentModal(false);
    setIsEstablishingConnection(true);

    setTimeout(() => {
      setIsEstablishingConnection(false);

      const options = {
        description: `Accommodation at ${hostelName}`,
        image: 'https://your-logo-url.com/logo.png', // Replace with valid URL if needed
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: totalAmount * 100, // in paise
        name: 'VERGE 2026 Accommodation',
        prefill: {
          email: form.email,
          contact: form.phone,
          name: form.name
        },
        theme: { color: THEME.accent }
      };

      RazorpayCheckout.open(options).then((data: any) => {
        if (__DEV__) console.log("Payment processing started");
        handleFinalizeBooking(data.razorpay_payment_id);
      }).catch((error: any) => {
        if (__DEV__) console.error("Razorpay Error");
        Alert.alert('Payment Failed', `Reason: ${error.description || error.message}`);
      });
    }, 2000);
  };

  const handleFinalizeBooking = async (paymentId: string) => {
    setSubmitting(true);
    try {
      const qrHash = `${form.firebaseUid}_${Date.now()}`;

      const payload = {
        userId: form.mongoUserId,
        days: form.days,
        qrTokenHash: qrHash,
        hostelName: hostelName,
      };

      const response = await fetch(`${SERVER_URL}/api/accommodation/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitting(false);
        Alert.alert('Booking Confirmed', 'Your accommodation has been secured.', [
          { text: 'View Ticket', onPress: () => router.replace('/(Hostel)/BookedHostel' as any) },
        ]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save booking");
      }
    } catch (error: any) {
      setSubmitting(false);
      Alert.alert(
        'Sync Error',
        `Payment successful but booking failed: ${error.message}. Contact support with Payment ID: ${paymentId}`,
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              onPress={() => router.push('/accommodation')} 
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color={THEME.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>REGISTRATION</Text>
              <Text style={styles.headerSubtitle}>Secure your spot</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {isProfileIncomplete ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={48} color={THEME.error} />
                <Text style={styles.errorTitle}>PROFILE INCOMPLETE</Text>
                <Text style={styles.errorDesc}>
                  You need to complete your profile to continue booking
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile' as any)}
                  style={styles.errorButton}
                >
                  <Text style={styles.errorButtonText}>COMPLETE PROFILE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.label}>ASSIGNED SECTOR</Text>
                  <Text style={styles.hostelName}>{hostelName}</Text>
                  {isGenderMismatched() && (
                    <Text style={styles.mismatchText}>GENDER MISMATCH DETECTED</Text>
                  )}
                </View>

                <View style={styles.formContainer}>
                  <ReadOnlyField label="CANDIDATE NAME" value={form.name} />

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <ReadOnlyField label="GENDER" value={form.gender} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ReadOnlyField label="DURATION" value={`${form.days} DAYS`} />
                    </View>
                  </View>

                  <View style={styles.costBox}>
                    <View>
                      <Text style={styles.label}>TOTAL COST</Text>
                      <Text style={styles.totalAmount}>₹{totalAmount}</Text>
                    </View>
                    <View style={styles.dividerVertical} />
                    <View>
                      <Text style={styles.label}>RATE</Text>
                      <Text style={styles.rateText}>₹{PRICE_PER_DAY} / DAY</Text>
                    </View>
                  </View>

                  <View>
                    <Text style={styles.label}>WHATSAPP COMMS</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="phone-pad"
                      placeholder="+91 00000 00000"
                      placeholderTextColor={THEME.textMuted}
                      value={form.phone}
                      onChangeText={(t) => setForm({ ...form, phone: t })}
                    />
                  </View>
                </View>
              </>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Pressable>

        {!isProfileIncomplete && (
          <View style={styles.footer}>
            <TouchableOpacity
              disabled={submitting || !!isGenderMismatched()}
              onPress={handlePreCheck}
              style={[
                styles.payButton,
                (submitting || !!isGenderMismatched()) && { opacity: 0.5 }
              ]}
            >
              {submitting ? <ActivityIndicator color="#000" /> : (
                <LinearGradient
                  colors={[THEME.accent, '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  <Ionicons name="card-outline" size={20} color="#000" />
                  <Text style={styles.payText}>PAY ₹{totalAmount}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>PAYMENT SUMMARY</Text>
            <View style={styles.summaryList}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ACCOMMODATION</Text>
                <Text style={styles.summaryValue}>{hostelName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>DURATION</Text>
                <Text style={styles.summaryValue}>{form.days} DAYS</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: THEME.accent }]}>PAYABLE</Text>
                <Text style={[styles.summaryValue, { color: THEME.accent, fontSize: 18 }]}>₹{totalAmount}</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={startRazorpayPayment} style={styles.modalPrimaryButton}>
                <Text style={styles.modalPrimaryText}>PAY NOW</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secure Connection Modal */}
      <Modal
        visible={isEstablishingConnection}
        transparent
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <View style={{ backgroundColor: THEME.cardBg, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: THEME.border }}>
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>SECURE GATEWAY</Text>
            <Text style={[styles.summaryLabel, { marginBottom: 20 }]}>DO NOT CLOSE</Text>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={THEME.accent} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.readOnlyBox}>
      <Text style={styles.readOnlyText}>{value || 'UNSPECIFIED'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: THEME.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 0,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    alignItems: 'center',
    marginTop: 20,
  },
  errorTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 1,
  },
  errorDesc: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: THEME.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
  },
  label: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  hostelName: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mismatchText: {
    color: THEME.error,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 1,
  },
  formContainer: {
    gap: 4,
  },
  readOnlyBox: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  readOnlyText: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
  },
  totalAmount: {
    color: THEME.success,
    fontSize: 24,
    fontWeight: '900',
  },
  dividerVertical: {
    width: 1,
    height: '100%',
    backgroundColor: THEME.border,
    marginHorizontal: 16,
  },
  rateText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 16,
    color: THEME.text,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  footer: {
    padding: 20,
    backgroundColor: THEME.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  payText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: THEME.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.borderLight,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: 1,
  },
  summaryList: {
    gap: 12,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValue: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '900',
  },
  modalDivider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 4,
  },
  modalActions: {
    gap: 12,
  },
  modalPrimaryButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  modalSecondaryButton: {
    backgroundColor: THEME.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  modalSecondaryText: {
    color: THEME.textMuted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  loaderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,5,0.9)',
  },
  loaderBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
});
