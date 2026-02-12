import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
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

const EVENTS_BY_DAY = SCHEDULE_DATA.reduce<Record<number, Event[]>>((acc, event) => {
  if (!acc[event.day]) acc[event.day] = [];
  acc[event.day].push(event);
  return acc;
}, {});

Object.values(EVENTS_BY_DAY).forEach((events) => {
  events.sort((a, b) => a.time.localeCompare(b.time));
});

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);

  const filteredEvents = useMemo(() => EVENTS_BY_DAY[selectedDay] || [], [selectedDay]);

  const currentVessel = useMemo(() => 
    MISSION_PHASES[selectedDay - 1] || "No Mission Active", 
    [selectedDay]
  );

  // --- JOYSTICK LOGIC ---
  const translateX = useSharedValue(0);
  const hasChanged = useSharedValue(false);
  const glowSide = useSharedValue<0 | -1 | 1>(0);
  const leftGlowOpacity = useSharedValue(0);
  const rightGlowOpacity = useSharedValue(0);
  const MAX_SLIDE = 40;
  const TRIGGER_THRESHOLD = 20;
  const GLOW_TRIGGER = 8;

  const changeDay = useCallback((direction: 'next' | 'prev') => {
    setSelectedDay((prev) => {
      if (direction === 'next') return prev === 3 ? 1 : prev + 1;
      return prev === 1 ? 3 : prev - 1;
    });
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const clampedX = Math.max(-MAX_SLIDE, Math.min(MAX_SLIDE, e.translationX));
      translateX.value = clampedX;

      // Keep directional preview glow while dragging before a switch is triggered.
      if (!hasChanged.value) {
        let nextGlowSide: 0 | -1 | 1 = 0;
        if (clampedX <= -GLOW_TRIGGER) nextGlowSide = -1;
        if (clampedX >= GLOW_TRIGGER) nextGlowSide = 1;

        // Avoid spawning timing animations on every frame.
        if (nextGlowSide !== glowSide.value) {
          glowSide.value = nextGlowSide;
          if (nextGlowSide === -1) {
            leftGlowOpacity.value = withTiming(1, { duration: 110 });
            rightGlowOpacity.value = withTiming(0, { duration: 110 });
          } else if (nextGlowSide === 1) {
            rightGlowOpacity.value = withTiming(1, { duration: 110 });
            leftGlowOpacity.value = withTiming(0, { duration: 110 });
          } else {
            leftGlowOpacity.value = withTiming(0, { duration: 140 });
            rightGlowOpacity.value = withTiming(0, { duration: 140 });
          }
        }

        // Once day actually switches, force the glow to full on that side.
        if (e.translationX > TRIGGER_THRESHOLD) {
          rightGlowOpacity.value = 1;
          leftGlowOpacity.value = 0;
          glowSide.value = 1;
          runOnJS(changeDay)('next');
          hasChanged.value = true;
        } else if (e.translationX < -TRIGGER_THRESHOLD) {
          leftGlowOpacity.value = 1;
          rightGlowOpacity.value = 0;
          glowSide.value = -1;
          runOnJS(changeDay)('prev');
          hasChanged.value = true;
        }
      }
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, { damping: 15 });
      leftGlowOpacity.value = withTiming(0, { duration: 1000 });
      rightGlowOpacity.value = withTiming(0, { duration: 1000 });
      glowSide.value = 0;
      hasChanged.value = false;
    });

  const animatedMoonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedLeftGlowStyle = useAnimatedStyle(() => ({
    opacity: leftGlowOpacity.value,
  }));

  const animatedRightGlowStyle = useAnimatedStyle(() => ({
    opacity: rightGlowOpacity.value,
  }));

  const renderTimelineItem = useCallback(({ item, index }: { item: Event; index: number }) => {
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
  }, []);

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

        <ImageBackground
          source={require('../../assets/schedule-bg.png')}
          style={styles.mainCard}
          resizeMode="cover"
          imageStyle={{ transform: [{ scale: 1.15 }] }}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
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
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }}
            pointerEvents="none"
          />
        </ImageBackground>

        <View style={styles.navControl}>
          <View style={styles.joystickBase}>
            <View pointerEvents="none" style={[styles.joystickHint, styles.joystickHintLeft]}>
              <Image
                source={require('../../assets/chevron-l.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
            <View pointerEvents="none" style={[styles.joystickHint, styles.joystickHintRight]}>
              <Image
                source={require('../../assets/chevron-r.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.moonJoystick, animatedMoonStyle]}>
                <View style={styles.moonInner}>
                  <Image
                    source={require('../../assets/moon.png')}
                    style={styles.moonImage}
                    resizeMode="cover"
                  />
                  <View style={styles.moonVignette} />
                </View>
                <Animated.View pointerEvents="none" style={[styles.moonArcOverlay, animatedLeftGlowStyle]}>
                  <Svg width="100%" height="100%" viewBox="0 0 100 100">
                    <Defs>
                      <SvgGradient id="moonLeftArcGlow" x1="50%" y1="0%" x2="50%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9B2A" stopOpacity="0" />
                        <Stop offset="32%" stopColor="#FF9B2A" stopOpacity="0.38" />
                        <Stop offset="50%" stopColor="#FF9B2A" stopOpacity="0.95" />
                        <Stop offset="68%" stopColor="#FF9B2A" stopOpacity="0.38" />
                        <Stop offset="100%" stopColor="#FF9B2A" stopOpacity="0" />
                      </SvgGradient>
                      <SvgGradient id="moonLeftArcCore" x1="50%" y1="0%" x2="50%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9B2A" stopOpacity="0" />
                        <Stop offset="50%" stopColor="#FF9B2A" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#FF9B2A" stopOpacity="0" />
                      </SvgGradient>
                    </Defs>
                    <Path
                      d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7"
                      stroke="url(#moonLeftArcGlow)"
                      strokeWidth={14}
                      strokeOpacity={0.08}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7"
                      stroke="url(#moonLeftArcGlow)"
                      strokeWidth={11}
                      strokeOpacity={0.12}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7"
                      stroke="url(#moonLeftArcGlow)"
                      strokeWidth={8}
                      strokeOpacity={0.18}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7"
                      stroke="url(#moonLeftArcGlow)"
                      strokeWidth={5}
                      strokeOpacity={0.26}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7"
                      stroke="url(#moonLeftArcCore)"
                      strokeWidth={2.1}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                </Animated.View>
                <Animated.View pointerEvents="none" style={[styles.moonArcOverlay, animatedRightGlowStyle]}>
                  <Svg width="100%" height="100%" viewBox="0 0 100 100">
                    <Defs>
                      <SvgGradient id="moonRightArcGlow" x1="50%" y1="0%" x2="50%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9B2A" stopOpacity="0" />
                        <Stop offset="32%" stopColor="#FF9B2A" stopOpacity="0.38" />
                        <Stop offset="50%" stopColor="#FF9B2A" stopOpacity="0.95" />
                        <Stop offset="68%" stopColor="#FF9B2A" stopOpacity="0.38" />
                        <Stop offset="100%" stopColor="#FF9B2A" stopOpacity="0" />
                      </SvgGradient>
                      <SvgGradient id="moonRightArcCore" x1="50%" y1="0%" x2="50%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9B2A" stopOpacity="0" />
                        <Stop offset="50%" stopColor="#FF9B2A" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#FF9B2A" stopOpacity="0" />
                      </SvgGradient>
                    </Defs>
                    <Path
                      d="M 76.4 12.3 A 46 46 0 0 1 76.4 87.7"
                      stroke="url(#moonRightArcGlow)"
                      strokeWidth={14}
                      strokeOpacity={0.08}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 76.4 12.3 A 46 46 0 0 1 76.4 87.7"
                      stroke="url(#moonRightArcGlow)"
                      strokeWidth={11}
                      strokeOpacity={0.12}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 76.4 12.3 A 46 46 0 0 1 76.4 87.7"
                      stroke="url(#moonRightArcGlow)"
                      strokeWidth={8}
                      strokeOpacity={0.18}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 76.4 12.3 A 46 46 0 0 1 76.4 87.7"
                      stroke="url(#moonRightArcGlow)"
                      strokeWidth={5}
                      strokeOpacity={0.26}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d="M 76.4 12.3 A 46 46 0 0 1 76.4 87.7"
                      stroke="url(#moonRightArcCore)"
                      strokeWidth={2.1}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                </Animated.View>
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
    fontFamily: 'Guardians',
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

  navControl: { height: 140, justifyContent: 'center', alignItems: 'center' },
  joystickBase: {
    width: 160,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  joystickHint: {
    position: 'absolute',
    width: 18,
    height: 18,
    opacity: 0.55,
  },
  joystickHintLeft: {
    left: 10,
    top: 56,
  },
  joystickHintRight: {
    right: 10,
    top: 56,
  },
  moonJoystick: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'visible',
    backgroundColor: 'transparent',
    shadowColor: '#ff3d2f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  moonInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: '#120c0a',
  },
  moonArcOverlay: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 102,
    height: 102,
    zIndex: 3,
  },
  moonImage: {
    width: '120%',
    height: '120%',
    position: 'absolute',
    top: '-10%',
    left: '-10%',},
  moonVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});
