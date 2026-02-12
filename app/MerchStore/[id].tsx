import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, Modal, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { setCart, addToCart } = useCart() as any;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/products/${id}`);
        const json = await response.json();
        if (json.status && json.data) {
          setProduct(json.data);
        } else {
          router.back();
        }
      } catch {
        if (__DEV__) console.error("Detail Fetch Error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductDetails();
  }, [id, SERVER_URL, router]);

  const handleAddToCart = () => {
    if (addToCart) {
      addToCart({ ...product, quantity });
    } else {
      setCart((prevCart: any[]) => {
        const existingItem = prevCart.find(item => item._id === product._id);
        if (existingItem) {
          return prevCart.map(item =>
            item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prevCart, { ...product, quantity }];
      });
    }
    setShowSuccess(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  if (!product) return null;

  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/400';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>PRODUCT</Text>
        
        <TouchableOpacity
          onPress={() => router.push('MerchStore/cart' as any)}
          style={styles.cartButton}
        >
          <Ionicons name="bag-outline" size={20} color={THEME.text} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', aspectRatio: 1 }}
            resizeMode="cover"
          />
        </View>

        {/* Product Info */}
        <View style={{ paddingHorizontal: 20 }}>
          {/* Category */}
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>
              {product.category.toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {product.title}
          </Text>

          {/* Price */}
          <Text style={styles.price}>
            ₹{product.price}
          </Text>

          {/* Description */}
          <View style={styles.descriptionBox}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="information-circle-outline" size={14} color={THEME.textMuted} />
                <Text style={styles.sectionLabel}>DESCRIPTION</Text>
             </View>
             <Text style={styles.descriptionText}>
                {product.description || "Premium quality merchandise from Verge Technical Festival. Exclusive design with high-quality materials."}
             </Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>QUANTITY</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.qtyButton}
              >
                <Ionicons name="remove" size={18} color={THEME.text} />
              </TouchableOpacity>
              
              <Text style={styles.qtyText}>{quantity}</Text>
              
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={styles.qtyButton}
              >
                <Ionicons name="add" size={18} color={THEME.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={styles.ctaButton}
        >
          <Ionicons name="bag-add" size={18} color="#000" />
          <Text style={styles.ctaText}>
            ADD TO BAG — ₹{product.price * quantity}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal animationType="fade" transparent visible={showSuccess}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color="#000" />
            </View>
            
            <Text style={styles.modalTitle}>ADDED TO BAG</Text>
            
            <Text style={styles.modalSubtitle}>
              {quantity}x {product.title}
            </Text>

            <TouchableOpacity
              onPress={() => { setShowSuccess(false); router.push("MerchStore/cart" as any); }}
              style={styles.modalPrimaryButton}
            >
              <Text style={styles.modalPrimaryText}>VIEW BAG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSuccess(false)}
              style={styles.modalSecondaryButton}
            >
              <Text style={styles.modalSecondaryText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cartButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: { 
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    marginBottom: 12,
    backgroundColor: THEME.surface,
  },
  tagText: { 
    color: THEME.text, 
    fontSize: 10, 
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: { 
    color: THEME.text, 
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  price: { 
    color: THEME.accent, 
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: 1,
  },
  descriptionBox: {
    backgroundColor: THEME.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
  },
  sectionLabel: {
    color: THEME.textMuted, 
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  descriptionText: { 
    color: THEME.text, 
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
  },
  quantityContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
  },
  quantityLabel: { 
    color: THEME.textMuted, 
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  qtyButton: { 
    width: 32, 
    height: 32, 
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { 
    color: THEME.text, 
    fontSize: 16,
    fontWeight: '700',
  },
  bottomBar: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5,5,5,0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  ctaButton: { 
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: { 
    color: '#000', 
    fontSize: 12, 
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32 
  },
  modalContent: { 
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  successIcon: { 
    backgroundColor: THEME.accent,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: { 
    color: THEME.text, 
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalSubtitle: { 
    color: THEME.textMuted, 
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  modalPrimaryButton: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  modalPrimaryText: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalSecondaryButton: {
    paddingVertical: 12,
  },
  modalSecondaryText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
