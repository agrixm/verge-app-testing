import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  FadeInUp,
  FadeInDown,
  StretchInX,
  Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// --- THEME ---
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

type Category = 'Tech' | 'Cult' | 'Workshop' | 'Pro-Show';

type Event = {
  id: string;
  time: string;
  title: string;
  category: Category;
  location: string;
  day: number;
};

// --- DATA ---
const SCHEDULE_DATA: Event[] = [
  { id: '1', day: 1, time: '09:00 AM', title: 'Inauguration Ceremony', category: 'Cult', location: 'Main Auditorium' },
  { id: '2', day: 1, time: '10:30 AM', title: 'Hackathon Kickoff', category: 'Tech', location: 'Lab Complex A' },
  { id: '3', day: 1, time: '02:00 PM', title: 'RoboWars: Round 1', category: 'Tech', location: 'Open Arena' },
  { id: '4', day: 1, time: '04:00 PM', title: 'Photography Workshop', category: 'Workshop', location: 'Seminar Hall 2' },
  { id: '5', day: 1, time: '07:00 PM', title: 'Battle of Bands', category: 'Cult', location: 'Main Stage' },
  { id: '6', day: 2, time: '09:00 AM', title: 'Coding Marathon', category: 'Tech', location: 'Computer Center' },
  { id: '7', day: 2, time: '11:00 AM', title: 'Guest Speaker: AI Future', category: 'Workshop', location: 'Main Auditorium' },
  { id: '8', day: 2, time: '02:00 PM', title: 'Dance Off (Solo)', category: 'Cult', location: 'Amphitheater' },
  { id: '9', day: 2, time: '06:00 PM', title: 'Fashion Show', category: 'Cult', location: 'Main Stage' },
  { id: '10', day: 3, time: '10:00 AM', title: 'Treasure Hunt', category: 'Pro-Show', location: 'Campus Wide' },
  { id: '11', day: 3, time: '01:00 PM', title: 'Gaming Finals', category: 'Tech', location: 'E-Sports Arena' },
  { id: '12', day: 3, time: '05:00 PM', title: 'Closing Ceremony', category: 'Cult', location: 'Main Auditorium' },
  { id: '13', day: 3, time: '08:00 PM', title: 'DJ Night', category: 'Pro-Show', location: 'Main Ground' },
];

const MISSION_PHASES = [
  "PROTOCOL: INITIATION",
  "PROTOCOL: ENGAGEMENT",
  "PROTOCOL: TERMINATION"
];

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);

  const filteredEvents = useMemo(() => {
    return SCHEDULE_DATA
      .filter(e => e.day === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDay]);

  const currentVessel = useMemo(() => 
    MISSION_PHASES[selectedDay - 1] || "No Mission Active", 
    [selectedDay]
  );

  // --- JOYSTICK LOGIC ---
  const translateX = useSharedValue(0);
  const hasChanged = useSharedValue(false);
  const MAX_SLIDE = 40;
  const TRIGGER_THRESHOLD = 20;

  const changeDay = (direction: 'next' | 'prev') => {
    setSelectedDay((prev) => {
      if (direction === 'next') return prev === 3 ? 1 : prev + 1;
      return prev === 1 ? 3 : prev - 1;
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.max(-MAX_SLIDE, Math.min(MAX_SLIDE, e.translationX));
      
      if (!hasChanged.value) {
        if (e.translationX > TRIGGER_THRESHOLD) {
          runOnJS(changeDay)('next');
          hasChanged.value = true;
        } else if (e.translationX < -TRIGGER_THRESHOLD) {
          runOnJS(changeDay)('prev');
          hasChanged.value = true;
        }
      }
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, { damping: 15 });
      hasChanged.value = false;
    });

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const renderTimelineItem = ({ item, index }: { item: Event; index: number }) => {
    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 100).springify()} 
        layout={Layout.springify()}
        style={styles.eventContainer}
      >
        {/* Accent Dot */}
        <View style={[styles.eventDot, { backgroundColor: THEME.accent, shadowColor: THEME.accent }]} />
        
        {/* Header: Time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[styles.eventTime, { color: THEME.accent }]}>{item.time}</Text>
        </View>

        {/* Title */}
        <Text style={styles.eventTitle}>{item.title}</Text>
        
        {/* Location */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="location-outline" size={12} color="#ffffff" style={{ opacity: 0.6 }} />
          <Text style={[styles.eventLocation, { color: '#ffffff', opacity: 0.6 }]}>{item.location}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <LinearGradient
          colors={[THEME.bg, '#0A0A0A', THEME.bg]}
          style={StyleSheet.absoluteFill}
        />

        {/* Keeping the new Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.minimalBack}>
              <Ionicons name="chevron-back" size={22} color={THEME.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>SCHEDULE</Text>
              <Text style={styles.headerSubtitle}>Mission Timeline</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[1, 2, 3].map((day) => (
            <Pressable 
              key={day} 
              onPress={() => setSelectedDay(day)}
              style={[styles.tab, selectedDay === day && styles.tabActive]}
            >
              <Text style={[styles.tabName, selectedDay === day && styles.textWhite]}>DAY {day}</Text>
              <Text style={[styles.tabDate, selectedDay === day && styles.textAccent]}>
                {day === 1 ? '14' : day === 2 ? '15' : '16'} FEB
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.vehicleSection}>
          <Text style={styles.vLabel}>Current Protocol</Text>
          <Text 
            style={styles.vTitle}
            numberOfLines={1}
          >
            {currentVessel}
          </Text>
        </View>

        <View style={styles.mainCard}>
          {/* Vertical Line with Gradient & Glow */}
          <View style={styles.timelineLineContainer}>
            <LinearGradient
              colors={['rgba(255, 107, 0, 0.3)', 'rgba(255, 107, 0, 0.1)', 'transparent']}
              style={styles.timelineGlow}
            />
            <LinearGradient
              colors={[THEME.accent, 'rgba(255, 107, 0, 0.4)', 'transparent']}
              style={styles.timelineLine}
            />
          </View>
          
          <FlatList
            data={filteredEvents}
            renderItem={renderTimelineItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingVertical: 30 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ marginTop: 40, paddingLeft: 60 }}>
                <Text style={{ color: THEME.textMuted }}>No mission data for Day {selectedDay}</Text>
              </View>
            }
          />
        </View>

        <View style={styles.navControl}>
          <View style={styles.joystickBase}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.joystickKnob, animatedKnobStyle]}>
                <Text style={styles.joystickIcon}>{'<>'}</Text>
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// --- CONSTANTS ---
const LINE_OFFSET = 30; 
const DOT_SIZE = 9;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: THEME.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: THEME.border,
    backgroundColor: THEME.cardBg
  },
  tabActive: {
    borderColor: THEME.accent,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  tabName: { fontSize: 10, fontWeight: '700', color: THEME.textMuted, marginBottom: 2 },
  tabDate: { fontSize: 8, color: '#555', fontWeight: '500' },
  textWhite: { color: '#fff' },
  textAccent: { color: THEME.accent },
  
  vehicleSection: { marginBottom: 25, paddingHorizontal: 20 },
  vLabel: { fontSize: 9, color: THEME.accent, letterSpacing: 3, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  vTitle: { fontSize: 24, color: THEME.text, fontWeight: '200', letterSpacing: -0.5 },

  mainCard: {
    flex: 1, 
    marginHorizontal: 20,
    borderRadius: 24, 
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.cardBg,
    overflow: 'hidden'
  },
  timelineLineContainer: {
    position: 'absolute',
    left: LINE_OFFSET,
    top: 0,
    bottom: 0,
    width: 20,
    marginLeft: -10, 
    alignItems: 'center',
    zIndex: 0,
  },
  timelineGlow: {
    position: 'absolute',
    width: 6,
    top: 0,
    bottom: 0,
    opacity: 0.4,
  },
  timelineLine: {
    width: 1,
    height: '100%',
    zIndex: 1,
  },
  eventContainer: { 
    paddingLeft: LINE_OFFSET + 25, 
    paddingRight: 20,
    marginBottom: 35, 
    justifyContent: 'center'
  },
  eventDot: {
    position: 'absolute', 
    left: LINE_OFFSET - (DOT_SIZE / 2),
    top: 4,
    width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE/2,
    shadowRadius: 8, shadowOpacity: 0.8,
    zIndex: 1,
    borderWidth: 2, borderColor: '#000'
  },
  eventTime: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginRight: 8 },
  eventTitle: { fontSize: 16, color: THEME.text, fontWeight: '400', lineHeight: 22 },
  eventLocation: { fontSize: 11, color: THEME.textMuted, marginLeft: 4 },

  navControl: { height: 100, justifyContent: 'center', alignItems: 'center' },
  joystickBase: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 1, borderColor: THEME.border,
    backgroundColor: THEME.cardBg,
    justifyContent: 'center', alignItems: 'center'
  },
  joystickKnob: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: THEME.text,
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  joystickIcon: { color: '#000', fontWeight: 'bold', fontSize: 16, marginTop: -2 }
});