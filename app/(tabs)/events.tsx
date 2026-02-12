import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import { useSavedStore } from '../../src/store/useSavedStore';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;
const CATEGORIES = ['all', 'tech', 'non-tech', 'workshop', 'other'];

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

interface Event {
  _id: string;
  title: string;
  category: 'tech' | 'non-tech' | 'workshop' | 'other';
  venue: string;
  date: string;
  time: string;
  registrationFee: number;
  requiresTeam: boolean;
  status: 'active' | 'inactive';
}

// ─── 1. Smart Event Card (Self-Contained Logic) ─────────────────────
type EventCardProps = {
  item: Event;
  onPress: (id: string) => void;
};

const EventCard = memo(({ item, onPress }: EventCardProps) => {
  const isSaved = useSavedStore(useCallback((state) => state.savedIds.includes(item._id), [item._id]));
  const toggleSave = useSavedStore((state) => state.toggleSave);
  const scale = useSharedValue(1);

  const eventDate = useMemo(() => 
    new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), 
  [item.date]);
  
  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(scale.value, [0.98, 1], [0.3, 0]),
  }));

  const handlePress = useCallback(() => onPress(item._id), [onPress, item._id]);
  const handleSave = useCallback(() => toggleSave(item._id), [toggleSave, item._id]);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tagContainer}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{item.category.toUpperCase()}</Text>
            </View>
            {item.requiresTeam && (
              <View style={styles.tagPillMuted}>
                <Text style={styles.tagTextMuted}>TEAM</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleSave} hitSlop={12}>
            <Ionicons 
              name={isSaved ? 'bookmark' : 'bookmark-outline'} 
              size={18} 
              color={isSaved ? THEME.accent : THEME.textMuted} 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.cardInfoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={THEME.textMuted} />
            <Text style={styles.infoText}>{eventDate} • {item.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={THEME.textMuted} />
            <Text style={styles.infoText}>{item.venue}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>
            {item.registrationFee > 0 ? `₹${item.registrationFee}` : 'FREE ACCESS'}
          </Text>
          
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>INITIALIZE</Text>
            <Ionicons name="arrow-forward" size={14} color={THEME.accent} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) => prev.item._id === next.item._id);

// ─── 3. Category Pill ───────────────────────────────────────────────
const CategoryPill = memo(({ item, active, onPress }: { item: string; active: boolean; onPress: (cat: string) => void }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(item)}
      style={[
        styles.pillContainer, 
        active ? styles.pillActive : styles.pillInactive
      ]}
    >
      <Text style={[
        styles.pillText, 
        { color: active ? '#000000' : 'rgba(255, 255, 255, 0.6)' }
      ]}>
        {item.replace('-', ' ').toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
});

// ─── MAIN SCREEN ────────────────────────────────────────────────────
export default function Events() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const savedCount = useSavedStore(state => state.savedIds.length);
  const savedIds = useSavedStore(state => state.savedIds);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSavedModalVisible, setIsSavedModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimStyle = useAnimatedStyle(() => {
    return { opacity: 1, transform: [{ translateY: 0 }] };
  });

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/events`);
      const result = await response.json();
      if (response.ok) setEvents(result.data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = !searchQuery || event.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      return matchesSearch && matchesCategory && event.status === 'active';
    });
  }, [events, searchQuery, selectedCategory]);

  const savedEventsList = useMemo(() => events.filter((event) => savedIds.includes(event._id)), [events, savedIds]);

  const handleEventPress = useCallback((id: string) => {
    router.push({ pathname: 'EventDetails/[id]', params: { id } });
  }, [router]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace('/dashboard');
  }, [navigation, router]);

  const renderEventItem = useCallback(({ item }: { item: Event }) => (
    <EventCard item={item} onPress={handleEventPress} />
  ), [handleEventPress]);

  const ListHeader = useMemo(() => (
    <View>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.actionBar}>
        <TouchableOpacity
          onPress={() => setSearchVisible(p => !p)}
          style={[styles.iconButton, searchVisible && { backgroundColor: THEME.accent, borderColor: THEME.accent }]}
        >
          <Ionicons name="search" size={18} color={searchVisible ? '#000000' : THEME.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setIsSavedModalVisible(true)}
          style={[styles.iconButton, savedCount > 0 && { borderColor: THEME.accent }]}
        >
          <View>
            <Ionicons name={savedCount > 0 ? 'bookmark' : 'bookmark-outline'} size={18} color={savedCount > 0 ? THEME.accent : THEME.text} />
            {savedCount > 0 && (
              <View style={[styles.badge, { backgroundColor: THEME.accent }]}>
                <Text style={styles.badgeText}>{savedCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
      </Animated.View>

      {searchVisible && (
         <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={THEME.textMuted} />
              <TextInput
                placeholder="SEARCH EVENTS..."
                placeholderTextColor={THEME.textMuted}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={16} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>
         </Animated.View>
      )}

      <View style={styles.catSelectorContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={categoryKeyExtractor}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <CategoryPill item={item} active={selectedCategory === item} onPress={setSelectedCategory} />
          )}
          ItemSeparatorComponent={CategorySeparator}
        />
      </View>
    </View>
  ), [searchVisible, searchQuery, savedCount, selectedCategory]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[{ paddingHorizontal: 20, paddingBottom: 8, backgroundColor: THEME.bg }, headerAnimStyle]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.minimalBack}>
             <Ionicons name="chevron-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>EVENTS</Text>
            <Text style={styles.headerSubtitle}>Choose your mission</Text>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
           <Text style={styles.loadingText}>INITIALIZING...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredEvents}
          keyExtractor={eventKeyExtractor}
          renderItem={renderEventItem}
          contentContainerStyle={[styles.listContent, { paddingTop: 0 }]}
          onScroll={scrollHandler}
          scrollEventThrottle={64}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEvents} tintColor={THEME.accent} />}
          initialNumToRender={4}
          maxToRenderPerBatch={3}
          windowSize={5}
          updateCellsBatchingPeriod={100}
          removeClippedSubviews={true}
          ListHeaderComponent={ListHeader}
        />
      )}

      {/* Saved Modal */}
      <Modal visible={isSavedModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsSavedModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: THEME.accent }]}>Saved Logs</Text>
            <TouchableOpacity onPress={() => setIsSavedModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={THEME.accent} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={savedEventsList}
            keyExtractor={(item) => item._id}
            renderItem={renderEventItem}
            contentContainerStyle={{ padding: 20 }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stable helpers (outside render cycle) ─────────────────────────
const eventKeyExtractor = (item: Event) => item._id;
const categoryKeyExtractor = (item: string) => item;
const CategorySeparator = memo(() => <View style={{ width: 8 }} />);

// ─── STYLES ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.bg 
  },
  
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  minimalBack: {
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
    paddingHorizontal: 20, 
    paddingBottom: 100 
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    fontSize: 10, 
    letterSpacing: 2, 
    color: THEME.textMuted 
  },

  // Event Card
  cardContainer: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12, // Sharper than chips
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    // For animated highlight
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  tagText: {
    color: THEME.text,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagPillMuted: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tagTextMuted: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  cardInfoSection: {
    marginBottom: 20,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.accent,
    letterSpacing: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  ctaText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1,
  },

  // Categories
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    marginTop: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBg,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  catSelectorContainer: {
    marginBottom: 12,
  },
  pillContainer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25, // Highly rounded
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  pillInactive: {
    backgroundColor: THEME.cardBg,
    borderColor: THEME.border,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Search
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: THEME.text,
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '600',
  },

  // Modal
  modalContainer: { 
    flex: 1, 
    backgroundColor: THEME.bg 
  },
  modalHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: THEME.border,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: THEME.accent,
    letterSpacing: 1,
  },
  closeButton: {
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: THEME.cardBg,
    borderWidth: 1, 
    borderColor: THEME.border, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
});