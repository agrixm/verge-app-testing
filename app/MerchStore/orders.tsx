import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

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
};

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getSession();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      if (!user?.uid) return;
      const response = await fetch(`${SERVER_URL}/api/orders/my-orders/${user.uid}`);
      const json = await response.json();

      if (Array.isArray(json)) {
        setOrders(json);
      } else if (json.data && Array.isArray(json.data)) {
        setOrders(json.data);
      } else if (json.orders && Array.isArray(json.orders)) {
        setOrders(json.orders);
      }
    } catch (error) {
      if (__DEV__) console.error("Fetch Orders Error");
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.label}>ORDER REFERENCE</Text>
          <Text style={styles.value}>{item.orderId}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.orderStatus === 'delivered' ? styles.statusDelivered : styles.statusPending
        ]}>
          <Text style={[
            styles.statusText,
            item.orderStatus === 'delivered' ? { color: THEME.success } : { color: THEME.accent }
          ]}>
            {item.orderStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {item.items.map((prod: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{prod.quantity}x {prod.name}</Text>
            <Text style={styles.itemPrice}>₹{prod.variant.price * prod.quantity}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.paymentText}>PAID VIA RAZORPAY</Text>
        <Ionicons name="checkmark-done-circle" size={18} color={THEME.success} />
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/merch')} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>ORDER HISTORY</Text>
            <Text style={styles.headerSubtitle}>Your purchases</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={THEME.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Ionicons name="receipt-outline" size={48} color={THEME.border} />
               <Text style={styles.emptyText}>NO DATA LOGS FOUND</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={fetchOrders} tintColor={THEME.accent} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
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
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  value: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusDelivered: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: 'rgba(0, 200, 83, 0.3)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    color: THEME.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemPrice: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  paymentText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});