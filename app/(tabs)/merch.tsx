import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Text,
  View,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';

import { useCart } from '../../src/context/CartContext';
import { authService } from '../../src/services/auth';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

interface Product {
  _id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  category: 'tshirt' | 'hoodie' | 'accessory' | 'other';
  status: 'active' | 'inactive';
}

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Carousel constants ───────────────────────────────────────────────
const CARD_WIDTH = SCREEN_WIDTH * 0.58;
const CARD_SPACING = 14;
const CARD_TOTAL = CARD_WIDTH + CARD_SPACING;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const CATEGORIES = ['all', 'tshirt', 'hoodie', 'accessory'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  all: 'apps',
  tshirt: 'shirt',
  hoodie: 'cloudy',
  accessory: 'watch',
};

// ── Price wheel constants (matching HTML prototype) ──────────────────
const WHEEL_WIDTH = SCREEN_WIDTH - 40;
const TICK_GAP = 12; // px per tick slot (CSS --tick-gap)
const WHEEL_STEP = 50; // value per tick
const TICKS_PER_MAJOR = 10; // major tick every 10 ticks (every 500 units)
const TICKS_PER_MID = 5; // mid tick every 5 ticks (every 250 units)
const WHEEL_HEIGHT = 80;

// ─── Animated Price Display (UI-thread, zero re-renders) ─────────────
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
Animated.addWhitelistedNativeProps({ text: true });

const PriceDisplay = ({ priceSV }: { priceSV: Animated.SharedValue<number> }) => {
  const animatedProps = useAnimatedProps(() => ({
    text: `₹${Math.round(priceSV.value)}`,
  } as any));

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value="₹0"
      style={styles.priceTagText}
      animatedProps={animatedProps}
    />
  );
};

// ── Joystick constants ───────────────────────────────────────────────
const JOYSTICK_SIZE = 56;
const ARC_RADIUS = 82;
const ARC_ITEM_SIZE = 44;
const ARC_ANGLES_DEG = [160, 115, 65, 20];

// ─── Carousel Card ──────────────────────────────────────────────────
const CarouselCard = memo(({
  item,
  index,
  scrollX,
  onPress,
}: {
  item: Product;
  index: number;
  scrollX: Animated.SharedValue<number>;
  onPress: (id: string) => void;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const center = index * CARD_TOTAL;
    const input = [center - CARD_TOTAL, center, center + CARD_TOTAL];

    const scale = interpolate(scrollX.value, input, [0.78, 1, 0.78], Extrapolation.CLAMP);
    const rotateY = interpolate(scrollX.value, input, [28, 0, -28], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, input, [18, 0, 18], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, input, [0.4, 1, 0.4], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 800 },
        { rotateY: `${rotateY}deg` },
        { scale },
        { translateY },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(500)}
      style={[styles.carouselCard, animatedStyle]}
    >
      <Pressable onPress={() => onPress(item._id)} style={styles.cardPressable}>
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          <View style={styles.cardImageWrap}>
            <Image
              source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.cardGradient}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardPrice}>₹{item.price}</Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
});

// ─── Category Pill ──────────────────────────────────────────────────
const CategoryPill = memo(({
  cat,
  isActive,
  onPress,
}: {
  cat: string;
  isActive: boolean;
  onPress: (c: string) => void;
}) => (
  <Pressable
    onPress={() => onPress(cat)}
    style={[styles.pill, isActive ? styles.pillOn : styles.pillOff]}
  >
    <Text style={[styles.pillText, { color: isActive ? '#000' : THEME.textMuted }]}>
      {cat.toUpperCase()}
    </Text>
  </Pressable>
));

// ─── Price Wheel (HTML prototype replica) ───────────────────────────
const PriceWheel = memo(({
  minPrice,
  maxPrice,
  currentPrice,
  onPriceChange,
  priceSV,
}: {
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
  onPriceChange: (p: number) => void;
  priceSV: Animated.SharedValue<number>;
}) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const isUserScrolling = useSharedValue(false);
  const lastSyncedPrice = useRef(-1);

  // Derived from HTML: totalTicks = (MAX - MIN) / STEP
  const totalTicks = Math.max(1, Math.round((maxPrice - minPrice) / WHEEL_STEP));
  const totalWidth = totalTicks * TICK_GAP;
  const halfView = WHEEL_WIDTH / 2;

  // Generate ticks exactly like the HTML prototype
  const ticks = useMemo(() => {
    const arr: { val: number; type: 'major' | 'mid' | 'minor' }[] = [];
    for (let i = 0; i <= totalTicks; i++) {
      const val = minPrice + i * WHEEL_STEP;
      const type =
        i % TICKS_PER_MAJOR === 0 ? 'major' :
        i % TICKS_PER_MID === 0 ? 'mid' : 'minor';
      arr.push({ val, type });
    }
    return arr;
  }, [minPrice, totalTicks]);

  const priceToX = useCallback(
    (p: number) => totalWidth > 0
      ? ((p - minPrice) / (maxPrice - minPrice)) * totalWidth
      : 0,
    [minPrice, maxPrice, totalWidth],
  );

  // UI-thread scroll handler — no JS bridge overhead
  const wheelScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x;
      // Exactly like HTML: rawIndex = scrollLeft / tickWidth; price = index * STEP
      const rawIndex = x / TICK_GAP;
      const index = Math.round(rawIndex);
      const price = Math.min(maxPrice, Math.max(minPrice, minPrice + index * WHEEL_STEP));

      // Update shared value on UI thread — instant, zero re-renders
      priceSV.value = price;

      // Drive carousel only when user is actively scrolling
      if (isUserScrolling.value) {
        runOnJS(onPriceChange)(price);
      }
    },
    onBeginDrag: () => {
      isUserScrolling.value = true;
    },
    onMomentumEnd: () => {
      isUserScrolling.value = false;
    },
  });

  // Sync wheel to carousel price — instant snap (no slow animation)
  useEffect(() => {
    if (isUserScrolling.value) return;
    if (currentPrice === lastSyncedPrice.current) return;
    lastSyncedPrice.current = currentPrice;
    (scrollRef.current as any)?.scrollTo({ x: priceToX(currentPrice), animated: false });
  }, [currentPrice, priceToX]);

  return (
    <View style={styles.wheelContainer}>
      <View style={styles.wheelOuter}>
        <LinearGradient
          colors={['rgba(5,5,5,1)', 'rgba(5,5,5,0)', 'rgba(5,5,5,0)', 'rgba(5,5,5,1)']}
          locations={[0, 0.2, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.wheelEdgeFade}
          pointerEvents="none"
        />

        <View style={styles.wheelPointer} pointerEvents="none">
          <View style={styles.wheelTriangle} />
          <View style={styles.wheelLine} />
        </View>

        <View style={styles.wheelPointerBottom} pointerEvents="none">
          <View style={styles.wheelLineBottom} />
          <View style={styles.wheelTriangleBottom} />
        </View>

        <Animated.ScrollView
          ref={scrollRef as any}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_GAP}
          bounces={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: halfView }}
          onScroll={wheelScrollHandler}
        >
          {ticks.map((t, i) => (
            <View key={i} style={styles.tickCell}>
              <View
                style={[
                  styles.tickLine,
                  t.type === 'major'
                    ? styles.tickMajor
                    : t.type === 'mid'
                      ? styles.tickMid
                      : styles.tickMinor,
                ]}
              />
            </View>
          ))}
        </Animated.ScrollView>
      </View>

      <View style={styles.wheelRange}>
        <Text style={styles.wheelRangeText}>₹{minPrice}</Text>
        <Text style={styles.wheelRangeText}>₹{maxPrice}</Text>
      </View>
    </View>
  );
});

// ─── Joystick Button ────────────────────────────────────────────────
const JoystickButton = ({
  activeCategory,
  onSelect,
}: {
  activeCategory: string;
  onSelect: (c: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const hovRef = useRef<string | null>(null);

  const positions = useMemo(
    () =>
      CATEGORIES.map((cat, i) => {
        const rad = ARC_ANGLES_DEG[i] * (Math.PI / 180);
        return {
          cat,
          dx: ARC_RADIUS * Math.cos(rad),
          dy: ARC_RADIUS * Math.sin(rad),
        };
      }),
    [],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setOpen(true),
        onPanResponderMove: (_, g) => {
          let best: string | null = null;
          let bestD = Infinity;
          positions.forEach(({ cat, dx, dy }) => {
            const d = Math.hypot(g.dx - dx, g.dy + dy);
            if (d < bestD && d < 60) {
              bestD = d;
              best = cat;
            }
          });
          hovRef.current = best;
          setHovered(best);
        },
        onPanResponderRelease: () => {
          if (hovRef.current) onSelect(hovRef.current);
          setOpen(false);
          setHovered(null);
          hovRef.current = null;
        },
        onPanResponderTerminate: () => {
          setOpen(false);
          setHovered(null);
          hovRef.current = null;
        },
      }),
    [positions, onSelect],
  );

  return (
    <View style={styles.joystickArea}>
      {/* Radial glow behind arc */}
      {open && <View style={styles.joystickGlow} />}

      {/* Arc category items */}
      {open &&
        positions.map(({ cat, dx, dy }) => {
          const isHov = hovered === cat;
          const isCur = activeCategory === cat;
          return (
            <Animated.View
              key={cat}
              entering={FadeIn.duration(150)}
              style={[
                styles.arcItem,
                {
                  left: SCREEN_WIDTH / 2 + dx - ARC_ITEM_SIZE / 2,
                  bottom: 10 + JOYSTICK_SIZE / 2 + dy - ARC_ITEM_SIZE / 2,
                  backgroundColor: isHov
                    ? THEME.accent
                    : isCur
                      ? 'rgba(255,107,0,0.15)'
                      : 'rgba(18,18,18,0.95)',
                  borderColor: isHov
                    ? THEME.accent
                    : isCur
                      ? 'rgba(255,107,0,0.4)'
                      : THEME.borderLight,
                  transform: [{ scale: isHov ? 1.2 : 1 }],
                },
              ]}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat] as any}
                size={16}
                color={isHov ? '#000' : isCur ? THEME.accent : THEME.text}
              />
              <Text
                style={[
                  styles.arcText,
                  { color: isHov ? '#000' : isCur ? THEME.accent : THEME.textMuted },
                ]}
              >
                {cat === 'all' ? 'ALL' : cat.slice(0, 5).toUpperCase()}
              </Text>
            </Animated.View>
          );
        })}

      {/* Connecting lines from joystick to arc items */}
      {open &&
        positions.map(({ cat, dx, dy }) => (
          <View
            key={`line-${cat}`}
            style={[
              styles.arcLine,
              {
                left: SCREEN_WIDTH / 2,
                bottom: 10 + JOYSTICK_SIZE / 2,
                width: Math.hypot(dx, dy) - JOYSTICK_SIZE / 2 - ARC_ITEM_SIZE / 2 + 4,
                transform: [
                  { rotate: `${-Math.atan2(dy, dx) * (180 / Math.PI)}deg` },
                  { translateX: JOYSTICK_SIZE / 2 - 2 },
                ],
              },
            ]}
          />
        ))}

      {/* Main joystick button */}
      <View
        {...pan.panHandlers}
        style={[styles.joystick, open && styles.joystickOpen]}
      >
        <View style={[styles.joystickRing, open && styles.joystickRingOpen]}>
          <Ionicons
            name={open ? 'grid' : 'apps'}
            size={18}
            color={open ? THEME.accent : THEME.textMuted}
          />
        </View>
      </View>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
export default function Merch() {
  const router = useRouter();
  const { cart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [centeredIdx, setCenteredIdx] = useState(0);

  const scrollX = useSharedValue(0);
  const wheelPriceSV = useSharedValue(0);
  const carouselRef = useRef<FlatList<Product>>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      const idx = Math.max(0, Math.round(e.contentOffset.x / CARD_TOTAL));
      runOnJS(setCenteredIdx)(idx);
    },
  });

  const cartCount = useMemo(
    () => cart?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0,
    [cart],
  );

  // ── Data fetching ───────────────────────────────────────────────
  const fetchUserOrders = useCallback(async () => {
    try {
      const s = authService.getSession();
      if (!s?.uid) return;
      const r = await fetch(`${SERVER_URL}/api/orders/my-orders/${s.uid}`);
      const ct = r.headers.get('content-type');
      if (r.ok && ct?.includes('application/json')) {
        const j = await r.json();
        if (j.status === true && j.data) setOrders(j.data);
      }
    } catch {
      if (__DEV__) console.error('Error fetching orders');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch(`${SERVER_URL}/api/products`);
      const j = await r.json();
      if (j.status === true && j.data) setProducts(j.data);
    } catch {
      if (__DEV__) console.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchUserOrders();
  }, [fetchProducts, fetchUserOrders]);

  // ── Derived data ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) &&
          (activeTab === 'all' || p.category === activeTab) &&
          p.status === 'active',
      )
      .sort((a, b) => a.price - b.price);
  }, [searchQuery, products, activeTab]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (!filteredProducts.length) return { minPrice: 0, maxPrice: 1000 };
    const prices = filteredProducts.map((p) => p.price);
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
  }, [filteredProducts]);

  const currentPrice = filteredProducts[centeredIdx]?.price ?? minPrice;

  // Keep shared value in sync when carousel drives the price
  useEffect(() => {
    wheelPriceSV.value = currentPrice;
  }, [currentPrice]);

  // Wheel → Carousel: scroll carousel to nearest product by price
  const handleWheelPrice = useCallback(
    (price: number) => {
      if (!filteredProducts.length) return;
      let bestIdx = 0;
      let bestDiff = Infinity;
      filteredProducts.forEach((p, i) => {
        const d = Math.abs(p.price - price);
        if (d < bestDiff) {
          bestDiff = d;
          bestIdx = i;
        }
      });
      (carouselRef.current as any)?.scrollToOffset({
        offset: bestIdx * CARD_TOTAL,
        animated: true,
      });
    },
    [filteredProducts],
  );

  // ── Navigation & actions ────────────────────────────────────────
  const handleProductPress = useCallback(
    (id: string) => router.push(`MerchStore/${id}` as any),
    [router],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <CarouselCard
        item={item}
        index={index}
        scrollX={scrollX}
        onPress={handleProductPress}
      />
    ),
    [scrollX, handleProductPress],
  );

  const handleBack = useCallback(() => router.back(), [router]);
  const handleOrders = useCallback(
    () => router.push('MerchStore/orders' as any),
    [router],
  );
  const handleCart = useCallback(
    () => router.push('MerchStore/cart' as any),
    [router],
  );
  const clearSearch = useCallback(() => setSearchQuery(''), []);

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Ionicons name="cube-outline" size={48} color={THEME.border} />
        <Text style={styles.emptyText}>NO PRODUCTS FOUND</Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={THEME.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>STORE</Text>
            <Text style={styles.headerSub}>Official Merchandise</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={handleOrders} style={styles.iconBtn}>
              <Ionicons name="receipt-outline" size={18} color={THEME.textMuted} />
              {orders.length > 0 && <View style={styles.dot} />}
            </Pressable>
            <Pressable
              onPress={handleCart}
              style={[styles.iconBtn, cartCount > 0 && styles.iconBtnActive]}
            >
              <Ionicons
                name={cartCount > 0 ? 'bag-handle' : 'bag-handle-outline'}
                size={18}
                color={cartCount > 0 ? THEME.accent : THEME.textMuted}
              />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Search & Category Pills ────────────────────────────── */}
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={THEME.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH PRODUCTS..."
            placeholderTextColor={THEME.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={16} color={THEME.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c}
              cat={c}
              isActive={activeTab === c}
              onPress={setActiveTab}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* ── Body ───────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={THEME.accent} />
          <Text style={styles.loadingText}>LOADING INVENTORY...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Carousel */}
          <View style={styles.carouselArea}>
            <Animated.FlatList
              ref={carouselRef as any}
              data={filteredProducts}
              horizontal
              keyExtractor={(item: Product) => item._id}
              renderItem={renderItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SIDE_PADDING,
                alignItems: 'center' as const,
              }}
              snapToInterval={CARD_TOTAL}
              snapToAlignment={'start' as const}
              decelerationRate="fast"
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              ListEmptyComponent={emptyComponent}
              getItemLayout={(_: any, index: number) => ({
                length: CARD_TOTAL,
                offset: CARD_TOTAL * index,
                index,
              })}
            />
          </View>

          {/* Price Wheel */}
          <View style={styles.priceSection}>
            <View style={styles.priceTag}>
              <PriceDisplay priceSV={wheelPriceSV} />
            </View>
            <PriceWheel
              minPrice={minPrice}
              maxPrice={maxPrice}
              currentPrice={currentPrice}
              onPriceChange={handleWheelPrice}
              priceSV={wheelPriceSV}
            />
          </View>

          {/* Joystick */}
          <JoystickButton activeCategory={activeTab} onSelect={setActiveTab} />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // ── Header ──────────────────────────────────────────────────────
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
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
  headerSub: { fontSize: 11, color: THEME.textMuted, letterSpacing: 0.3 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBg,
  },
  iconBtnActive: { borderColor: THEME.accent },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.accent,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: THEME.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: { fontSize: 9, fontWeight: '900', color: '#000' },

  // ── Controls ────────────────────────────────────────────────────
  controls: { paddingHorizontal: 20, marginTop: 8, marginBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: THEME.text,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pillRow: { gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillOn: { backgroundColor: THEME.accent, borderColor: THEME.accent },
  pillOff: { backgroundColor: THEME.cardBg, borderColor: THEME.border },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginHorizontal: 20,
    marginBottom: 4,
  },

  // ── Carousel ────────────────────────────────────────────────────
  carouselArea: { flex: 1, justifyContent: 'center' },
  carouselCard: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  cardPressable: {},
  cardBlur: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  cardInfo: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    color: THEME.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Price Wheel ─────────────────────────────────────────────────
  priceSection: {
    marginTop: 6,
    paddingHorizontal: 20,
  },
  priceTag: {
    alignSelf: 'center',
    backgroundColor: THEME.accent,
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  wheelContainer: {
    paddingHorizontal: 0,
  },
  wheelOuter: {
    height: WHEEL_HEIGHT,
    borderRadius: 40,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  wheelEdgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  wheelPointer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
  },
  wheelTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: THEME.accent,
  },
  wheelLine: {
    width: 1.5,
    height: 18,
    backgroundColor: 'rgba(255,107,0,0.3)',
    borderRadius: 1,
  },
  wheelPointerBottom: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
  },
  wheelLineBottom: {
    width: 1.5,
    height: 18,
    backgroundColor: 'rgba(255,107,0,0.3)',
    borderRadius: 1,
  },
  wheelTriangleBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: THEME.accent,
  },
  wheelRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  wheelRangeText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.5,
  },
  tickCell: {
    width: TICK_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
  },
  tickLine: { borderRadius: 2 },
  tickMajor: {
    width: 2.5,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tickMid: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tickMinor: {
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ── Loading / Empty ─────────────────────────────────────────────
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    marginTop: 12,
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    width: SCREEN_WIDTH - SIDE_PADDING * 2,
  },
  emptyText: {
    marginTop: 12,
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Joystick ────────────────────────────────────────────────────
  joystickArea: {
    height: ARC_RADIUS + ARC_ITEM_SIZE / 2 + JOYSTICK_SIZE / 2 + 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    overflow: 'visible',
  },
  joystickGlow: {
    position: 'absolute',
    bottom: 10 + JOYSTICK_SIZE / 2 - 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,107,0,0.06)',
    alignSelf: 'center',
  },
  arcItem: {
    position: 'absolute',
    width: ARC_ITEM_SIZE,
    height: ARC_ITEM_SIZE,
    borderRadius: ARC_ITEM_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  arcText: {
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  arcLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,107,0,0.1)',
    transformOrigin: 'left center',
  },
  joystick: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: THEME.cardBg,
    borderWidth: 2,
    borderColor: THEME.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  joystickOpen: {
    borderColor: THEME.accent,
    backgroundColor: '#0C0C0C',
    shadowColor: THEME.accent,
    shadowOpacity: 0.25,
  },
  joystickRing: {
    width: JOYSTICK_SIZE - 12,
    height: JOYSTICK_SIZE - 12,
    borderRadius: (JOYSTICK_SIZE - 12) / 2,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  joystickRingOpen: {
    borderColor: 'rgba(255,107,0,0.4)',
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
});
