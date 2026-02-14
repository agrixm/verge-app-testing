import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../src/context/CartContext';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { setCart, addToCart } = useCart() as any;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/products/${id}`);
        const json = await response.json();
        if (json.status && json.data) setProduct(json.data);
        else router.back();
      } catch {
        if (__DEV__) console.error("Detail Fetch Error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductDetails();
  }, [id, SERVER_URL]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
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
    Alert.alert('ADDED TO BAG', `${quantity}x ${product.title}`, [
      { text: 'VIEW BAG', onPress: () => router.push('MerchStore/cart' as any) },
      { text: 'CONTINUE', style: 'cancel' }
    ]);
  }, [product, quantity, addToCart, setCart]);

  const adjustQuantity = useCallback((amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  }, []);

  if (loading) return (
    <View style={[styles.container, { backgroundColor: THEME.colors.bg }]}>
      <VergeLoader message="SYNCING PRODUCT" />
    </View>
  );
  if (!product) return null;

  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/400';

  return (
    <View style={{ flex: 1, backgroundColor: THEME.colors.bg }}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <VergeHeader 
          title="PRODUCT" 
          rightElement={
            <TouchableOpacity
              onPress={() => router.push('MerchStore/cart' as any)}
              style={styles.cartButton}
            >
              <Ionicons name="bag-outline" size={20} color={THEME.colors.text} />
            </TouchableOpacity>
          }
        />

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 120 }}
          removeClippedSubviews={true}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{product.category.toUpperCase()}</Text>
            </View>

            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>₹{product.price}</Text>

            <View style={styles.descriptionBox}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="information-circle-outline" size={14} color={THEME.colors.textMuted} />
                  <Text style={styles.sectionLabel}>DESCRIPTION</Text>
               </View>
               <Text style={styles.descriptionText}>
                  {product.description || "Premium quality merchandise from Verge Technical Festival."}
               </Text>
            </View>

            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>QUANTITY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <TouchableOpacity onPress={() => adjustQuantity(-1)} style={styles.qtyButton}>
                  <Ionicons name="remove" size={18} color={THEME.colors.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={() => adjustQuantity(1)} style={styles.qtyButton}>
                  <Ionicons name="add" size={18} color={THEME.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleAddToCart} style={styles.ctaButton}>
            <Ionicons name="bag-add" size={18} color="#000" />
            <Text style={styles.ctaText}>ADD TO BAG — ₹{product.price * quantity}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cartButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: THEME.colors.surfaceElevated, borderWidth: 1, borderColor: THEME.colors.border, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { marginHorizontal: 20, marginBottom: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: THEME.colors.surface, borderWidth: 1, borderColor: THEME.colors.border },
  tagPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: THEME.colors.borderLight, marginBottom: 12, backgroundColor: THEME.colors.surface },
  tagText: { color: THEME.colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { color: THEME.colors.text, fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  price: { color: THEME.colors.accent, fontSize: 24, fontWeight: '900', marginBottom: 24, letterSpacing: 1 },
  descriptionBox: { backgroundColor: THEME.colors.cardBg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 24 },
  sectionLabel: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  descriptionText: { color: THEME.colors.text, fontSize: 13, lineHeight: 22, fontWeight: '500' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.colors.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 24 },
  quantityLabel: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  qtyButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: THEME.colors.surface, borderWidth: 1, borderColor: THEME.colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: THEME.colors.text, fontSize: 16, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(5,5,5,0.95)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, borderTopWidth: 1, borderTopColor: THEME.colors.border },
  ctaButton: { backgroundColor: THEME.colors.accent, paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
