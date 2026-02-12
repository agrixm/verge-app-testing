import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Text,
  View,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Dimensions,
  PanResponder,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  Layout,
} from 'react-native-reanimated';

import { useCart } from '../../src/context/CartContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  bg: '#050505',
  cardBg: '#121212',
  accent: '#FF6B00',
  text: '#FFFFFF',
  textMuted: '#888888',
  border: '#1F1F1F',
};

// Layout Constants - Tuned for adjacent visibility + subtle fan rotation
const CARD_WIDTH = SCREEN_WIDTH * 0.6;
const CARD_HEIGHT = 350;
const CARD_SPACING = 5;
const CARD_TOTAL = CARD_WIDTH + CARD_SPACING;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const CATEGORIES = ['all', 'tshirt', 'hoodie', 'accessory'] as const;
const CATEGORY_ICONS: Record<string, any> = {
  all: 'apps-outline',
  tshirt: 'shirt-outline',
  hoodie: 'layers-outline',
  accessory: 'watch-outline',
};

// ── Carousel Card ──────────────────────────────────────────────────
const CarouselCard = memo(({ item, index, scrollX, onPress }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * CARD_TOTAL,
      index * CARD_TOTAL,
      (index + 1) * CARD_TOTAL,
    ];

    // 1. Rotation Logic (Rotate around the bottom)
    // Left card tilts right (positive), Right card tilts left (negative)
    const rotation = interpolate(
      scrollX.value,
      input,
      [8, 0, -8], // Reduced from 10 for flatter, more visible cards
      Extrapolation.CLAMP
    );

    // 2. The "Arc" Height
    // Side cards sit lower than the center card to form a circle
    const translateY = interpolate(
      scrollX.value,
      input,
      [30, -10, 30],
      Extrapolation.CLAMP
    );

    // 3. Horizontal Squeeze
    const translateX = interpolate(
      scrollX.value,
      input,
      [-10, 0, 10], 
      Extrapolation.CLAMP
    );

    const scale = interpolate(scrollX.value, input, [0.88, 1, 0.88], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1000 },
        { translateY: CARD_HEIGHT / 2 }, // Move "hinge" to center
        { rotateZ: `${rotation}deg` },   // Rotate on the Z plane (the fan)
        { rotateY: `${rotation * -1.5}deg` }, // 3D tilt inwards
        { translateY: -CARD_HEIGHT / 2 }, // Move back up
        { translateY }, // Apply the arc offset
        { translateX }, // Apply the horizontal squeeze
        { scale },
      ],
      zIndex: interpolate(scrollX.value, input, [1, 10, 1], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, input, [0.7, 1, 0.7], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[styles.carouselCard, animatedStyle]}>
      <Pressable onPress={() => onPress(item._id)} style={styles.cardPressable}>
        <View style={styles.cardContainer}>
          <Image
            source={{ uri: item.images?.[0] }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.cardOverlay}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPriceTypography}>₹{item.price.toLocaleString()}</Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ── Fixed Point-to-Select Joystick ──────────────────────────────
const ARC_RADIUS = 160;
const ITEM_SIZE = 50;

const JoystickButton = ({ activeCategory, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);

  const menuPositions = useMemo(() => {
    return CATEGORIES.map((cat, i) => {
      const angle = (100 / (CATEGORIES.length - 1)) * i + 40;
      const rad = (180 - angle) * (Math.PI / 180);
      return { cat, x: Math.cos(rad) * ARC_RADIUS, y: -Math.sin(rad) * ARC_RADIUS };
    });
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setIsOpen(true),
    onPanResponderMove: (_, g) => {
      const angleDeg = Math.atan2(-g.dy, g.dx) * (180 / Math.PI);
      const dist = Math.hypot(g.dx, g.dy);
      
      let closest = null;
      if (dist > 20) { // Detection starts once thumb moves 20px
        let minDiff = Infinity;
        menuPositions.forEach(pos => {
          const posAngleDeg = Math.atan2(-pos.y, pos.x) * (180 / Math.PI);
          const diff = Math.abs(angleDeg - posAngleDeg);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pos.cat;
          }
        });
      }
      if (hoverRef.current !== closest) {
        hoverRef.current = closest;
        setActiveHover(closest);
      }
    },
    onPanResponderRelease: () => {
      if (hoverRef.current) onSelect(hoverRef.current);
      setIsOpen(false);
      setActiveHover(null);
      hoverRef.current = null;
    },
    onPanResponderTerminate: () => {
      setIsOpen(false);
      setActiveHover(null);
    }
  }), [menuPositions, onSelect]);

  return (
    <View style={styles.joystickWrapper}>
      {isOpen && (
        <View style={styles.orbitalContainer}>
          {menuPositions.map((pos) => (
            <Animated.View 
              key={pos.cat} 
              entering={FadeIn.duration(150)}
              style={[styles.menuItem, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}
            >
              <BlurView intensity={25} tint="dark" style={[
                styles.itemCircle, 
                activeHover === pos.cat && styles.itemCircleActive,
                activeCategory === pos.cat && !activeHover && styles.activeIndicator
              ]}>
                <Ionicons name={CATEGORY_ICONS[pos.cat]} size={22} color={activeHover === pos.cat ? '#000' : '#FFF'} />
              </BlurView>
              <Text style={styles.itemLabel}>{pos.cat.toUpperCase()}</Text>
            </Animated.View>
          ))}
        </View>
      )}

      <View {...panResponder.panHandlers} style={[styles.mainOrb, isOpen && styles.orbActive]}>
        <LinearGradient colors={['#1A1A1A', '#000']} style={styles.orbGradient}>
          <Image 
            source={require('../../assets/moon.png')} 
            style={{ width: '100%', height: '100%', opacity: isOpen ? 1 : 0.6 }}
            resizeMode="cover"
          />
        </LinearGradient>
      </View>
    </View>
  );
};

// ── Main Merch Screen ──────────────────────────────────────────────
export default function Merch() {
  const router = useRouter();
  const { cart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollX.value = e.contentOffset.x; },
  });

  useEffect(() => {
    // Reset scroll when filters change to avoid "empty" view due to scroll offset
    // Using requestAnimationFrame ensures the list has updated before we snap it to 0
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      scrollX.value = 0;
    });
  }, [activeTab, searchQuery]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/products`);
        const j = await r.json();
        if (j.status) setProducts(j.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => products.filter(p => 
    p.status === 'active' && (activeTab === 'all' || p.category === activeTab) &&
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [products, activeTab, searchQuery]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/image.png')} 
        style={StyleSheet.absoluteFill} 
        resizeMode="cover" 
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
      
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={THEME.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>STORE</Text>
            <Text style={styles.headerSub}>Official Merchandise</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('MerchStore/orders' as any)} style={styles.iconBtn}>
              <Ionicons name="receipt-outline" size={20} color={THEME.textMuted} />
            </Pressable>
            <Pressable onPress={() => router.push('MerchStore/cart' as any)} style={[styles.iconBtn, cart?.length > 0 && styles.iconBtnActive]}>
              <Ionicons name={cart?.length > 0 ? 'bag-handle' : 'bag-handle-outline'} size={20} color={cart?.length > 0 ? THEME.accent : THEME.textMuted} />
              {cart?.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{cart.length}</Text></View>}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={THEME.textMuted} />
        <TextInput 
          placeholder="SEARCH PRODUCTS..." 
          placeholderTextColor={THEME.textMuted} 
          style={styles.searchInput} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoryTabs}>
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => setActiveTab(item)}
              style={[styles.pill, activeTab === item && styles.pillActive]}
            >
              <Ionicons 
                name={CATEGORY_ICONS[item]} 
                size={14} 
                color={activeTab === item ? '#000' : THEME.textMuted} 
              />
              <Text style={[styles.pillText, activeTab === item && styles.pillTextActive]}>
                {item.toUpperCase()}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={THEME.accent} /></View>
      ) : (
        <View style={styles.carouselWrapper}>
          <Animated.FlatList
            ref={flatListRef}
            data={filtered}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
            snapToInterval={CARD_TOTAL}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <CarouselCard 
                item={item} 
                index={index} 
                scrollX={scrollX} 
                onPress={(id: any) => router.push(`MerchStore/${id}`)} 
              />
            )}
            ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>NO ITEMS FOUND</Text></View>}
          />
          <JoystickButton activeCategory={activeTab} onSelect={setActiveTab} />
        </View>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontFamily: 'Guardians', color: THEME.text, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: THEME.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: THEME.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },
  iconBtnActive: { borderColor: THEME.accent },
  badge: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: THEME.accent, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#000' },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 15, paddingHorizontal: 16, height: 54, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  searchInput: { flex: 1, marginLeft: 12, color: '#FFF', fontWeight: '600', letterSpacing: 0.5 },

  // Category Tabs
  categoryTabs: { marginBottom: 15 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', marginRight: 8, borderWidth: 1, borderColor: THEME.border, gap: 6 },
  pillActive: { backgroundColor: THEME.accent, borderColor: THEME.accent },
  pillText: { fontSize: 10, fontWeight: '800', color: THEME.textMuted, letterSpacing: 1 },
  pillTextActive: { color: '#000' },

  // Carousel Layout - Shifted lower
  carouselWrapper: { flex: 1, paddingTop: 50, paddingBottom: 140 },
  carouselCard: { width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2, height: CARD_HEIGHT },
  cardPressable: { flex: 1 },
  cardContainer: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: '#141414', borderWidth: 1, borderColor: '#1E1E1E' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: 20 },
  cardContent: { gap: 2 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  cardPriceTypography: { color: THEME.accent, fontSize: 16, fontWeight: '700', textAlign: 'right' },

  // Joystick
  joystickWrapper: { position: 'absolute', bottom: -60, alignSelf: 'center', alignItems: 'center' },
  mainOrb: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', borderWidth: 1.5, borderColor: THEME.border },
  orbActive: { borderColor: THEME.accent, transform: [{ scale: 0.94 }] },
  orbGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbitalContainer: { position: 'absolute', bottom: 34, alignItems: 'center', justifyContent: 'center' },
  menuItem: { position: 'absolute', alignItems: 'center', width: 80 },
  itemCircle: { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemCircleActive: { backgroundColor: THEME.accent, borderColor: THEME.accent, transform: [{ scale: 1.15 }] },
  activeIndicator: { borderColor: THEME.accent, borderWidth: 1.5 },
  itemLabel: { color: '#FFF', fontSize: 8, fontWeight: '900', marginTop: 8, letterSpacing: 1 },

  empty: { width: SCREEN_WIDTH - 40, alignItems: 'center', justifyContent: 'center', height: 200 },
  emptyText: { color: THEME.textMuted, letterSpacing: 3, fontSize: 12, fontWeight: '700' }
});
