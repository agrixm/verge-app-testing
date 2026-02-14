import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Pressable,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { authService } from '../../src/services/auth';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  { id: 'Boys', title: 'MALE SECTOR' },
  { id: 'Girls', title: 'FEMALE SECTOR' },
];

const HostelCard = React.memo(({ item, index, onPress }: { item: typeof HOSTELS[0]; index: number; onPress: (id: string) => void }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => { scale.value = withTiming(0.98, { duration: 150 }); };
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scale.value }] };
  });

  const isGirls = item.gender === 'Girls';
  const accentColor = isGirls ? '#FF2D55' : THEME.colors.accent;

  return (
    <Animated.View 
      entering={FadeInDown.duration(300).delay(index * 30)}
      style={styles.cardWrapper}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => onPress(item.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardContainer}
        >
          <View style={styles.cardMain}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={[styles.typePill, { backgroundColor: accentColor + '15' }]}>
                  <Text style={[styles.typeText, { color: accentColor }]}>{item.type}</Text>
                </View>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceValue}>{item.price}</Text>
                <Text style={styles.priceUnit}>/ night</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>{item.description}</Text>

            <View style={styles.cardFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="people-outline" size={16} color={THEME.colors.textSecondary} />
                <Text style={styles.featureText}>{item.capacity}</Text>
              </View>
              <View style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={14} color={accentColor} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

export default function Accommodation() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [selectedGender, setSelectedGender] = useState('Boys');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasExistingBooking, setHasExistingBooking] = useState(false);

  const checkExistingBooking = async (uid: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/accommodation/my?firebaseUid=${uid}`);
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setHasExistingBooking(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing booking:', error);
    }
  };

  useEffect(() => {
    const currentUser = authService.getSession();
    setUser(currentUser);
    
    if (currentUser) {
      checkExistingBooking(currentUser.uid).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleBooking = useCallback((id: string) => {
    if (!user) {
      Alert.alert('Link Lost', 'Please establish session to reserve pod.');
      router.replace("/login");
      return;
    }

    if (hasExistingBooking) {
      Alert.alert(
        'Deployment Active',
        'You already have an active accommodation assignment or pending request. Please check your deployment info.',
        [
          { text: 'View Deployment', onPress: () => router.push('/(Hostel)/BookedHostel' as any) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    router.push({
      pathname: "/(Hostel)/HostelRegister" as any,
      params: { id: id, userId: user.uid }
    });
  }, [user, router, hasExistingBooking]);

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
    <View style={{ flex: 1, backgroundColor: THEME.colors.bg }}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <VergeHeader 
          title="STAY" 
          rightElement={
            !loading && (
              <TouchableOpacity 
                onPress={() => router.push('/(Hostel)/BookedHostel' as any)}
                activeOpacity={0.7}
                style={styles.myPodButton}
              >
                <Ionicons name="bed-outline" size={20} color={THEME.colors.accent} />
              </TouchableOpacity>
            )
          }
        />

        {loading ? (
          <VergeLoader message="LOCATING PODS" />
        ) : (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search available units..."
                  placeholderTextColor={THEME.colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  selectionColor={THEME.colors.accent}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredHostels}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <HostelCard item={item} index={index} onPress={handleBooking} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                ListHeaderComponent={<Text style={styles.sectionTitle}>Available Units</Text>}
                ListEmptyComponent={<Text style={styles.emptyText}>No quarters found in this sector</Text>}
              />
              
              <LinearGradient
                colors={['transparent', THEME.colors.bg]}
                style={styles.listGradient}
                pointerEvents="none"
              />
            </View>

            <View style={styles.footerSection}>
              <FlatList
                data={SECTORS}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                decelerationRate="fast"
                snapToInterval={SCREEN_WIDTH}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.sectorCardContainer}>
                    <View style={styles.sectorCard}>
                      <Image 
                        source={item.id === 'Boys' ? require('../../assets/boys.png') : require('../../assets/girls.png')} 
                        style={styles.sectorImage}
                        resizeMode="cover"
                      />
                      <LinearGradient 
                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']} 
                        style={StyleSheet.absoluteFill} 
                      />
                      <View style={styles.sectorContent}>
                        <Text style={styles.sectorTitle}>{item.title}</Text>
                        <View style={styles.indicatorContainer}>
                          <View style={[styles.dot, selectedGender === 'Boys' ? styles.dotActive : styles.dotInactive]} />
                          <View style={[styles.dot, selectedGender === 'Girls' ? styles.dotActive : styles.dotInactive]} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  myPodButton: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchContainer: { paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: { flex: 1, height: '100%', color: THEME.colors.text, fontSize: 15, marginLeft: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.colors.textSecondary, marginTop: 20, marginBottom: 16, marginLeft: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  cardWrapper: { marginBottom: 16 },
  cardContainer: { 
    backgroundColor: '#111', borderRadius: 24, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  cardMain: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text, marginBottom: 6 },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  priceTag: { alignItems: 'flex-end' },
  priceValue: { fontSize: 20, fontWeight: '900', color: THEME.colors.text },
  priceUnit: { fontSize: 10, color: THEME.colors.textMuted, marginTop: -2 },
  cardDesc: { fontSize: 13, color: THEME.colors.textSecondary, lineHeight: 20, marginTop: 16, marginBottom: 20 },
  cardFeatures: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textSecondary },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: THEME.colors.text },

  listGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 10 },
  footerSection: { paddingBottom: 24, paddingTop: 10 },
  sectorCardContainer: { width: SCREEN_WIDTH, paddingHorizontal: 20 },
  sectorCard: { height: 140, backgroundColor: '#000', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  sectorImage: { width: '100%', height: '100%', position: 'absolute' },
  sectorContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  sectorTitle: { fontSize: 22, fontWeight: '900', color: THEME.colors.text, letterSpacing: 1 },
  indicatorContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 24, backgroundColor: THEME.colors.accent },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.45)' },
  emptyText: { textAlign: 'center', color: THEME.colors.textMuted, marginTop: 40, fontSize: 13, fontWeight: '600' },
});
