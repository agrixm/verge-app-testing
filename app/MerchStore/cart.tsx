import React from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/context/CartContext';

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

export default function Cart() {
  const router = useRouter();

  const { cart, setCart, removeFromCart, clearCart } = useCart() as any;

  const subtotal = cart?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const platformFee = cart?.length > 0 ? 20 : 0;
  const finalTotal = subtotal + platformFee;

  const internalRemove = (id: string) => {
    if (removeFromCart) {
      removeFromCart(id);
    } else {
      setCart((prev: any[]) => prev.filter(item => item._id !== id));
    }
  };

  const internalClear = () => {
    if (clearCart) {
      clearCart();
    } else {
      setCart([]);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    router.push("MerchStore/checkout" as any);
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.itemImage}
        resizeMode="cover"
      />

      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemQty}>
          QTY: {item.quantity}
        </Text>
        <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
      </View>

      <TouchableOpacity
        onPress={() => internalRemove(item._id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={18} color={THEME.textMuted} />
      </TouchableOpacity>
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
            <Text style={styles.headerTitle}>CART</Text>
            <Text style={styles.headerSubtitle}>Review your gear</Text>
          </View>
          {cart?.length > 0 && (
            <TouchableOpacity onPress={internalClear}>
              <Text style={styles.clearText}>CLEAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {cart?.length > 0 ? (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUBTOTAL</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>PLATFORM FEE</Text>
              <Text style={styles.summaryValue}>₹{platformFee}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>₹{finalTotal}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              style={styles.checkoutButton}
            >
              <LinearGradient
                colors={[THEME.accent, '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <Ionicons name="card-outline" color="#000" size={18} />
                <Text style={styles.checkoutText}>
                  CHECKOUT
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="bag-handle" size={64} color={THEME.border} />
          </View>
          <Text style={styles.emptyTitle}>YOUR BAG IS EMPTY</Text>
          <Text style={styles.emptyDesc}>
            Acquire official Verge gear from the Supply Depot to see them here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/merch" as any)}
            style={styles.goStoreButton}
          >
            <Text style={styles.goStoreText}>GO TO STORE</Text>
          </TouchableOpacity>
        </View>
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
  clearText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cartItem: {
    backgroundColor: THEME.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: THEME.surface,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemQty: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemPrice: {
    color: THEME.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  summaryContainer: {
    backgroundColor: THEME.cardBg,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: THEME.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryValue: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    marginBottom: 24,
  },
  totalLabel: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: THEME.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  checkoutText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
  },
  goStoreButton: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  goStoreText: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});