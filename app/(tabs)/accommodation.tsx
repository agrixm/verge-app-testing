import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { authService } from '../../src/services/auth';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

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

const HOSTELS = [
  {
    id: 'B1',
    name: 'COMMANDER BLOCK A',
    gender: 'Boys',
    type: 'AC DELUXE',
    price: '₹600',
    capacity: '2 BEDS',
    description: 'High-tier quarters with climate control and network access.',
  },
  {
    id: 'B2',
    name: 'TROOPER BARRACKS',
    gender: 'Boys',
    type: 'NON-AC STANDARD',
    price: '₹400',
    capacity: '4 BEDS',
    description: 'Standard infantry housing. Efficient and rugged.',
  },
  {
    id: 'B3',
    name: 'SECTOR 7 OUTPOST',
    gender: 'Boys',
    type: 'DORMITORY',
    price: '₹250',
    capacity: '8 BEDS',
    description: 'Large scale deployment accommodation. Essential amenities.',
  },
  {
    id: 'G1',
    name: 'VALKYRIE WING A',
    gender: 'Girls',
    type: 'AC SUITE',
    price: '₹650',
    capacity: '2 BEDS',
    description: 'Premium suite with enhanced security and comfort protocols.',
  },
  {
    id: 'G2',
    name: 'SIREN ENCLAVE',
    gender: 'Girls',
    type: 'AC STANDARD',
    price: '₹500',
    capacity: '3 BEDS',
    description: 'Balanced comfort for tactical operations.',
  },
  {
    id: 'G3',
    name: 'ATHENA HUB',
    gender: 'Girls',
    type: 'NON-AC',
    price: '₹350',
    capacity: '4 BEDS',
    description: 'Standard quarters. Reliable and secure.',
  },
];

const SECTORS = [
  { id: 'Boys', title: 'MALE SECTOR', sub: 'Tactical Barracks' },
  { id: 'Girls', title: 'FEMALE SECTOR', sub: 'High-Security Wing' },
];

// ─── Hostel Card Component ──────────────────────────────────────────
const HostelCard = ({ item, onPress }: { item: typeof HOSTELS[0]; onPress: (id: string) => void }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => onPress(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.tagPill, { borderColor: item.gender === 'Girls' ? '#FF6B9D' : THEME.accent }]}>
            <Text style={[styles.tagText, { color: item.gender === 'Girls' ? '#FF6B9D' : THEME.accent }]}>
              {item.type}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={14} color={THEME.textMuted} />
            <Text style={styles.infoText}>{item.capacity}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={14} color={THEME.textMuted} />
            <Text style={[styles.infoText, { color: THEME.text }]}>{item.price} <Text style={{ color: THEME.textMuted }}>/ NIGHT</Text></Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function Accommodation() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [selectedGender, setSelectedGender] = useState('Boys');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      const currentUser = authService.getSession();
      if (isMounted) setUser(currentUser);
    };
    fetchSession();
    return () => { isMounted = false; };
  }, []);

  const handleBooking = (id: string) => {
    if (!user) {
      Alert.alert("Link Lost", "Please establish session to reserve pod.");
      router.replace("/login");
      return;
    }
    router.push({
      pathname: "/(Hostel)/HostelRegister" as any,
      params: { id: id, userId: user.uid }
    });
  };

  const filteredHostels = useMemo(() => {
    return HOSTELS.filter(h => 
      h.gender === selectedGender && 
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedGender, searchQuery]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {

      if (viewableItems.length > 0) {

        const index = viewableItems[0].index;

        if (index !== null && index !== undefined) {

          setSelectedGender(SECTORS[index].id);

        }

      }

    }).current;

  

    return (

      <SafeAreaView edges={['top']} style={styles.container}>

        <LinearGradient

          colors={[THEME.bg, '#0A0A0A', THEME.bg]}

          style={StyleSheet.absoluteFill}

        />

        

        {/* Header */}

        <View style={styles.header}>

          <View style={styles.headerRow}>

            <TouchableOpacity onPress={() => router.back()} style={styles.minimalBack}>

               <Ionicons name="chevron-back" size={22} color={THEME.text} />

            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>

              <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>ACCOMMODATION</Text>

              <Text style={styles.headerSubtitle}>SECURE BARRACKS</Text>

            </View>

            <TouchableOpacity 

              onPress={() => router.push('/(Hostel)/BookedHostel' as any)}

              style={styles.myPodButton}

            >

              <Ionicons name="bed" size={20} color={THEME.accent} />

            </TouchableOpacity>

          </View>

        </View>

  

        {/* Search Bar */}

        <View style={styles.searchContainer}>

          <View style={styles.searchBar}>

            <Ionicons name="search" size={16} color={THEME.textMuted} />

            <TextInput

              style={styles.searchInput}

              placeholder="SEARCH SECTORS..."

              placeholderTextColor={THEME.textMuted}

              value={searchQuery}

              onChangeText={setSearchQuery}

            />

          </View>

        </View>

  

        <FlatList

          data={filteredHostels}

          keyExtractor={(item) => item.id}

          renderItem={({ item }) => <HostelCard item={item} onPress={handleBooking} />}

          contentContainerStyle={styles.listContent}

          showsVerticalScrollIndicator={false}

          ListHeaderComponent={<Text style={styles.sectionTitle}>CHOOSE ROOM</Text>}

          ListEmptyComponent={

            <Text style={styles.emptyText}>NO QUARTERS AVAILABLE</Text>

          }

        />

  

        {/* Footer Sector Slider */}

        <View style={styles.footerSection}>

          <View style={styles.separator} />

          <FlatList

            data={SECTORS}

            horizontal

            pagingEnabled

            showsHorizontalScrollIndicator={false}

            onViewableItemsChanged={onViewableItemsChanged}

            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}

            decelerationRate="fast"

            snapToInterval={width}

            keyExtractor={(item) => item.id}

            renderItem={({ item }) => (

              <View style={styles.sectorCardContainer}>

                <View style={styles.bigSectorCard}>

                  <LinearGradient

                    colors={['rgba(255, 107, 0, 0.1)', 'rgba(0,0,0,0.8)']}

                    style={StyleSheet.absoluteFill}

                  />

                  <Text style={styles.sectorTitle}>{item.title}</Text>

                  <Text style={styles.sectorSub}>{item.sub}</Text>

                  <View style={styles.indicatorContainer}>

                    <View style={[styles.dot, selectedGender === 'Boys' ? styles.dotActive : styles.dotInactive]} />

                    <View style={[styles.dot, selectedGender === 'Girls' ? styles.dotActive : styles.dotInactive]} />

                  </View>

                </View>

              </View>

            )}

          />

        </View>

      </SafeAreaView>

    );

  }

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.bg 
  },
  
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: THEME.bg,
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
    fontSize: 22, 
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: { 
    fontSize: 10, 
    color: THEME.textMuted,
    marginTop: 0,
    letterSpacing: 1,
    fontWeight: '700',
  },
  myPodButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: THEME.text,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '800',
    color: THEME.text,
    marginTop: 12,
    marginBottom: 16,
    letterSpacing: 1,
  },

  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },

  cardContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 12,
  },
  cardInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
  },

  separator: {
    height: 1,
    backgroundColor: THEME.border,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  footerSection: {
    paddingBottom: 20,
  },
  sectorCardContainer: {
    width: width,
    paddingHorizontal: 20,
  },
  bigSectorCard: {
    height: 180,
    backgroundColor: '#000000',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sectorTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 2,
  },
  sectorSub: {
    fontSize: 10,
    color: THEME.accent,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 20,
    backgroundColor: THEME.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: THEME.borderLight,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.textMuted,
    marginTop: 40,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});