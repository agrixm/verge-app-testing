import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { authService } from '../../src/services/auth';
import RazorpayCheckout from 'react-native-razorpay';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;
const RAZORPAY_KEY_ID = 'rzp_test_Pv16gbH3ZJn5YP'; 

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, clearCart } = useCart() as any;
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEstablishingConnection, setIsEstablishingConnection] = useState(false);

  const user = authService.getSession();

  const [form, setForm] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  const subtotal = cart?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const platformFee = cart?.length > 0 ? 20 : 0;
  const finalAmount = subtotal + platformFee;

  const handlePlaceOrder = () => {
    if (!form.phone || !form.address || !form.city || !form.pincode) {
      Alert.alert('Required', 'Please fill in all shipping details.');
      return;
    }
    setShowPaymentModal(true);
  };

  const startRazorpayPayment = async () => {
    setShowPaymentModal(false);
    setIsEstablishingConnection(true);

    setTimeout(() => {
      setIsEstablishingConnection(false);

      const options = {
        description: 'VERGE 2026 Official Merchandise',
        image: 'https://your-logo-url.com/logo.png',
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: Math.round(finalAmount * 100), 
        name: 'VERGE 2026',
        prefill: {
          email: form.email,
          contact: form.phone,
          name: form.name
        },
        theme: { color: THEME.colors.accent }
      };

      RazorpayCheckout.open(options).then((data: any) => {
        handleFinalizeOrder(data.razorpay_payment_id);
      }).catch((error: any) => {
        const errorMessage = error.description || error.message || JSON.stringify(error);
        Alert.alert('Payment Failed', `Reason: ${errorMessage}`);
      });
    }, 3000);
  };

  const handleFinalizeOrder = async (paymentId: string) => {
    setLoading(true);
    try {
      const orderPayload = {
        userId: user?.uid,
        items: cart.map((item: any) => ({
          productId: item._id,
          name: item.title,
          variant: {
            size: item.selectedSize || "Free Size",
            color: item.selectedColor || "Default",
            price: item.price
          },
          paddingHorizontal: 20,
          quantity: item.quantity
        })),
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode
        },
        paymentId: paymentId,
        orderId: `ORD-${Date.now()}`,
        paymentStatus: "paid",
        orderStatus: "processing"
      };

      const response = await fetch(`${SERVER_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderPayload,
          shippingInfo: {
            pickupLocation: "Main Gate",
          }
        }),
      });

      const responseData = await response.json().catch(() => ({ message: "Invalid server response" }));

      if (response.ok) {
        clearCart();
        router.replace({
          pathname: '/MerchStore/order-status',
          params: {
            status: 'success',
            orderId: orderPayload.orderId,
            paymentId: paymentId
          }
        });
      } else {
        throw new Error(responseData.message || "Server verification failed");
      }
    } catch (error: any) {
      Alert.alert(
        'Sync Error',
        `Payment successful, but order creation failed: ${error.message}. Please contact support with Payment ID: ${paymentId}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <VergeHeader title="CHECKOUT" onBack={() => router.back()} />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Review Items Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>REVIEW ITEMS</Text>
              <View style={styles.card}>
                {cart?.map((item: any, index: number) => (
                  <View key={item._id} style={[styles.itemRow, index === 0 && { borderTopWidth: 0 }]}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemPrice}>x{item.quantity}  ₹{item.price * item.quantity}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL BILL</Text>
                  <Text style={styles.totalValue}>₹{finalAmount}</Text>
                </View>
              </View>
            </View>

            {/* Shipping Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SHIPPING DETAILS</Text>
              <View style={styles.card}>
                <TextInput 
                  style={styles.input} 
                  value={form.name} 
                  onChangeText={(t) => setForm({ ...form, name: t })} 
                  placeholder="NAME" 
                  placeholderTextColor={THEME.colors.textMuted} 
                />
                <TextInput 
                  style={styles.input} 
                  keyboardType="phone-pad" 
                  value={form.phone} 
                  onChangeText={(t) => setForm({ ...form, phone: t })} 
                  placeholder="PHONE NUMBER" 
                  placeholderTextColor={THEME.colors.textMuted} 
                />
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  numberOfLines={3} 
                  value={form.address} 
                  onChangeText={(t) => setForm({ ...form, address: t })} 
                  placeholder="DETAILED ADDRESS" 
                  placeholderTextColor={THEME.colors.textMuted} 
                />
                <View style={styles.row}>
                  <TextInput 
                    style={[styles.input, { flex: 1, borderRightWidth: 1, borderBottomWidth: 0 }]} 
                    value={form.city} 
                    onChangeText={(t) => setForm({ ...form, city: t })} 
                    placeholder="CITY" 
                    placeholderTextColor={THEME.colors.textMuted} 
                  />
                  <TextInput 
                    style={[styles.input, { flex: 1, borderBottomWidth: 0 }]} 
                    keyboardType="number-pad" 
                    value={form.pincode} 
                    onChangeText={(t) => setForm({ ...form, pincode: t })} 
                    placeholder="PINCODE" 
                    placeholderTextColor={THEME.colors.textMuted} 
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            disabled={loading || cart?.length === 0}
            onPress={handlePlaceOrder}
            style={({ pressed }) => [
              styles.payButton,
              (pressed || loading || cart?.length === 0) && styles.payButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={['#FF8C00', THEME.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.payButtonContent}>
                  <Ionicons name="lock-closed" size={16} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.payButtonText}>PAY ₹{finalAmount}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" style={{ marginLeft: 8 }} />
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Payment Modal */}
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
            <View style={styles.modalSummary}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>SUBTOTAL</Text>
                <Text style={styles.modalValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>PLATFORM FEE</Text>
                <Text style={styles.modalValue}>₹{platformFee}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: THEME.colors.accent }]}>PAYABLE</Text>
                <Text style={[styles.modalValue, { color: THEME.colors.accent, fontSize: 20 }]}>₹{finalAmount}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={startRazorpayPayment} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>PROCEED TO GATEWAY</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Connection Modal */}
      <Modal
        visible={isEstablishingConnection}
        transparent
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <View style={{ backgroundColor: THEME.colors.cardBg, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: THEME.colors.border }}>
            <Text style={[styles.modalTitle, { marginBottom: 10 }]}>SECURE GATEWAY</Text>
            <Text style={[styles.modalLabel, { marginBottom: 20 }]}>DO NOT BACK OR CLOSE APP</Text>
            <View style={styles.loaderContent}>
              <ActivityIndicator size="large" color={THEME.colors.accent} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  itemName: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  totalLabel: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: THEME.colors.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  input: {
    padding: 16,
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: THEME.colors.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    zIndex: 20,
    elevation: 20,
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: THEME.colors.cardBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.text,
    letterSpacing: 1,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalSummary: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalValue: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  modalDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  modalButton: {
    backgroundColor: THEME.colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalClose: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loaderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.95)',
  },
  loaderContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
