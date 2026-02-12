import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { View, Text, Dimensions, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Defs, Path, Circle, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Countdown } from '../src/components/Countdown';

const { width, height } = Dimensions.get('window');

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

// --- Configuration ---
const ITEM_SIZE = 80;
const HALF_ITEM = ITEM_SIZE / 2;

const NAV_ITEMS = [
  { id: 'events', label: 'Events', icon: 'calendar-clear-outline', offsetX: -130, offsetY: 0 },
  { id: 'schedule', label: 'Schedule', icon: 'time-outline', offsetX: -65, offsetY: -15 },
  { id: 'merch', label: 'Merch', icon: 'bag-handle-outline', offsetX: 0, offsetY: -25 },
  { id: 'stay', label: 'Stay', icon: 'bed-outline', offsetX: 65, offsetY: -15 },
  { id: 'profile', label: 'Profile', icon: 'person-outline', offsetX: 130, offsetY: 0 },
];

const DRAWER_LINKS = [
  { id: 'maps', label: 'Maps', sub: 'NAV', icon: 'map-outline' },
  { id: 'epc', label: 'EPC Blog', sub: 'READ', icon: 'newspaper-outline' },
  { id: 'hpc', label: 'HPC Blog', sub: 'TECH', icon: 'code-slash-outline' },
  { id: 'sponsors', label: 'Sponsors', sub: 'PARTNERS', icon: 'diamond-outline' },
  { id: 'contact', label: 'Contact Us', sub: 'CONNECT', icon: 'chatbubble-ellipses-outline' },
  { id: 'developers', label: 'Developers', sub: 'TEAM', icon: 'terminal-outline' },
];

// --- Bezier Math (Heavy calc - kept outside or memoized) ---
const bezier = (t: number, p0: {x: number; y: number}, p1: {x: number; y: number}, p2: {x: number; y: number}, p3: {x: number; y: number}) => {
  'worklet';
  const cX = 3 * (p1.x - p0.x);
  const bX = 3 * (p2.x - p1.x) - cX;
  const aX = p3.x - p0.x - cX - bX;
  const cY = 3 * (p1.y - p0.y);
  const bY = 3 * (p2.y - p1.y) - cY;
  const aY = p3.y - p0.y - cY - bY;
  const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
  const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;
  return { x, y };
};

const generateOptimizedPath = (w: number, h: number, menuCount: number) => {
  const startX = 40;
  const startY = 80;
  const drawerWidth = w;
  let d = `M ${startX},${startY}`;
  const input: number[] = [];
  const outputX: number[] = [];
  const outputY: number[] = [];
  const outputAngle: number[] = [];
  const menuTriggers: { x: number; y: number; trigger: number }[] = [];
  let prevX = startX;
  let prevY = startY;
  const availableHeight = h - 140;
  const segmentH = availableHeight / (menuCount + 0.5);
  const SAMPLES_PER_SEGMENT = 40;
  let globalT = 0;
  const totalSamples = (menuCount + 1) * SAMPLES_PER_SEGMENT;
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < menuCount; i++) {
    const isEven = i % 2 === 0;
    const wave = isEven ? (drawerWidth * 0.08) : (drawerWidth * 0.22);
    const randomX = (seededRandom(i * 42) * 30) - 15;
    const targetX = Math.max(40, Math.min(drawerWidth * 0.35, wave + randomX));
    const targetY = startY + ((i + 1) * segmentH);
    
    const p0 = { x: prevX, y: prevY };
    const cp1X = prevX + (targetX - prevX) * 0.5;
    const cp1Y = prevY + (segmentH * 0.8);
    const cp2X = targetX;
    const cp2Y = targetY - (segmentH * 0.5);
    const intensity = 50;
    const cp1X_adj = cp1X + (isEven ? intensity : -intensity);
    const cp2X_adj = cp2X + (isEven ? -intensity : intensity);
    const p1 = { x: cp1X_adj, y: cp1Y };
    const p2 = { x: cp2X_adj, y: cp2Y };
    const p3 = { x: targetX, y: targetY };
    
    d += ` C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
    
    for (let j = 0; j < SAMPLES_PER_SEGMENT; j++) {
      const t = j / SAMPLES_PER_SEGMENT;
      const point = bezier(t, p0, p1, p2, p3);
      const nextT = (j + 1) / SAMPLES_PER_SEGMENT;
      const nextPoint = bezier(nextT, p0, p1, p2, p3);
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI) + 90;
      input.push(globalT / totalSamples);
      outputX.push(point.x);
      outputY.push(point.y);
      outputAngle.push(angle);
      globalT++;
    }
    menuTriggers.push({ x: targetX, y: targetY, trigger: (globalT - 10) / totalSamples });
    prevX = targetX;
    prevY = targetY;
  }

  const finalX = startX + 15;
  const finalY = h - 60;
  const p0 = { x: prevX, y: prevY };
  const p1 = { x: prevX, y: prevY + 60 };
  const p2 = { x: finalX, y: finalY - 40 };
  const p3 = { x: finalX, y: finalY };
  
  d += ` C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
  
  for (let j = 0; j < SAMPLES_PER_SEGMENT; j++) {
    const t = j / SAMPLES_PER_SEGMENT;
    const point = bezier(t, p0, p1, p2, p3);
    const nextT = (j + 1) / SAMPLES_PER_SEGMENT;
    const nextPoint = bezier(nextT, p0, p1, p2, p3);
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI) + 90;
    input.push(globalT / totalSamples);
    outputX.push(point.x);
    outputY.push(point.y);
    outputAngle.push(angle);
    globalT++;
  }

  input.push(1);
  outputX.push(finalX);
  outputY.push(finalY);
  outputAngle.push(outputAngle[outputAngle.length - 1]);
  return { d, animationData: { input, outputX, outputY, outputAngle }, menuTriggers };
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Static Components ───
const StaticDot = memo(({ size = 6 }: { size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: THEME.accent, opacity: 0.8 }} />
));

const SeamlessBackground = memo(() => {
  const player = useVideoPlayer(require('../assets/home-bg.mp4'), (player) => {
    player.loop = true;
    player.play();
    player.muted = true;
  });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />
    </View>
  );
});

// ─── Nav Item (Memoized & Optimized) ───
const NavItem = memo(({
  item,
  onPress,
  disabled,
  index,
  exit,
  entered,
  totalItems,
}: {
  item: typeof NAV_ITEMS[0];
  onPress: (id: string) => void;
  disabled: boolean;
  index: number;
  exit: SharedValue<number>;
  entered: SharedValue<number>;
  totalItems: number;
}) => {
  const insets = useSafeAreaInsets();
  const BASELINE_Y = height - insets.bottom - 210;
  const cx = width / 2 + item.offsetX;
  const cy = BASELINE_Y + item.offsetY;

  const pressed = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    // Single entrance fade — no infinite withRepeat loop
    breathe.value = withDelay(index * 400,
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.sin) })
    );
  }, [index, breathe]);

  const entranceOrder = Math.abs(index - Math.floor(totalItems / 2));
  const entranceStyle = useAnimatedStyle(() => {
    'worklet';
    const stagger = entranceOrder * 0.1;
    const t = Math.min(1, Math.max(0, (entered.value - stagger) / (1 - stagger * 0.5)));
    return {
      opacity: t,
      transform: [
        { translateY: interpolate(t, [0, 1], [50, 0]) },
        { scale: interpolate(t, [0, 1], [0.3, 1]) },
      ],
    };
  });

  const exitStyle = useAnimatedStyle(() => {
    'worklet';
    const delay = index * 0.06;
    const t = Math.min(1, Math.max(0, (exit.value - delay) / (1 - delay)));
    return {
      opacity: 1 - t,
      transform: [
        { translateY: interpolate(t, [0, 1], [0, 30]) },
        { scale: interpolate(t, [0, 1], [1, 0.5]) },
      ],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.85]) }],
    };
  });

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: cx - HALF_ITEM,
      top: cy - HALF_ITEM,
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30,
    }, entranceStyle, exitStyle]}>
      <AnimatedPressable
        onPress={() => onPress(item.id)}
        onPressIn={() => { pressed.value = withSpring(1, { damping: 12, stiffness: 400 }); }}
        onPressOut={() => { pressed.value = withSpring(0, { damping: 12, stiffness: 400 }); }}
        disabled={disabled}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View style={[{
          width: 48,
          height: 48,
          borderRadius: 16,
          borderWidth: 1,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          backgroundColor: 'rgba(20, 20, 20, 0.5)',
          borderColor: 'rgba(255,255,255,0.1)'
        }, iconStyle]}>
          <Ionicons name={item.icon as any} size={20} color={THEME.text} />
        </Animated.View>

        <Text style={{
          color: THEME.text,
          fontSize: 8,
          fontFamily: 'Orbitron_700Bold',
          letterSpacing: 1,
          textAlign: 'center',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>
          {item.label}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Drawer Item ───
const MenuItem = memo(({
  data,
  pos,
  progress,
  onPress,
}: {
  data: typeof DRAWER_LINKS[0];
  pos: { x: number; y: number; trigger: number };
  progress: Animated.SharedValue<number>;
  onPress: (id: string) => void;
}) => {
  const rStyle = useAnimatedStyle(() => {
    'worklet';
    const isVisible = progress.value > pos.trigger;
    return {
      opacity: withTiming(isVisible ? 1 : 0, { duration: 250 }),
      transform: [
        { translateX: withTiming(isVisible ? 32 : -10, { duration: 350, easing: Easing.out(Easing.back(1)) }) },
        { translateY: -25 },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', zIndex: 30, right: 20, left: pos.x, top: pos.y }, rStyle]}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 }}
        onPress={() => onPress(data.id)}
        activeOpacity={0.6}
      >
        <View style={{
          width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.accent, marginRight: 14, marginLeft: -30,
          shadowColor: THEME.accent, shadowOpacity: 0.6, shadowRadius: 8
        }} />
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={{ color: THEME.textMuted, fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 3, marginBottom: 3 }}>
            {data.sub}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={data.icon as any} size={16} color={THEME.text} />
            <Text style={{ color: THEME.text, fontSize: 16, fontFamily: 'Orbitron_400Regular', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {data.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Menu Button (Optimized) ───
const SpaceCommandButton = memo(({
  menuProgress,
  onPress,
}: {
  menuProgress: SharedValue<number>;
  onPress: () => void;
}) => {
  const orbitAngle = useSharedValue(0);

  useEffect(() => {
    orbitAngle.value = withRepeat(withTiming(360, { duration: 5000, easing: Easing.linear }), -1, false);
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitAngle.value}deg` }],
    borderColor: THEME.accent,
    opacity: interpolate(menuProgress.value, [0, 1], [0.3, 0.8]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: THEME.text,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ 
        width: 46, height: 46, borderRadius: 12, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}
    >
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={[{
          position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 1,
          borderColor: 'transparent', borderTopColor: THEME.accent, borderRightColor: 'rgba(255, 107, 0, 0.3)',
        }, outerRingStyle]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
           <Ionicons name="grid-outline" size={18} color={THEME.text} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Dashboard ───
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Memoized path generation - runs once
  const { d, animationData, menuTriggers } = useMemo(() => {
    return generateOptimizedPath(width, height, DRAWER_LINKS.length);
  }, []);

  const progress = useSharedValue(0);
  const drawerOpacity = useSharedValue(0);
  const menuProgress = useSharedValue(0);
  const navExit = useSharedValue(0);
  const navEntered = useSharedValue(0);
  const headerEnter = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      navExit.value = 0;
      navEntered.value = 0;
      headerEnter.value = 0;
      headerEnter.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
      navEntered.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    }, [])
  );

  const toggleDrawer = useCallback(() => {
    setIsOpen(prev => {
      const nextState = !prev;
      if (nextState) {
        drawerOpacity.value = withTiming(1, { duration: 250 });
        progress.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) });
        menuProgress.value = withTiming(1, { duration: 200 });
      } else {
        drawerOpacity.value = withTiming(0, { duration: 200 });
        progress.value = withTiming(0, { duration: 250 });
        menuProgress.value = withTiming(0, { duration: 150 });
      }
      return nextState;
    });
  }, []);

  const handleNavPress = useCallback((id: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    const routes: any = {
      events: '/(tabs)/events',
      schedule: '/(tabs)/schedule',
      merch: '/(tabs)/merch',
      stay: '/(tabs)/accommodation',
      profile: '/(tabs)/profile',
    };
    navExit.value = withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) });
    setTimeout(() => {
      router.push(routes[id] || '/(tabs)/events');
      setIsNavigating(false);
    }, 520);
  }, [isNavigating, router]);

  const handleDrawerItemPress = useCallback((id: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setIsOpen(false);
    drawerOpacity.value = withTiming(0, { duration: 200 });
    progress.value = withTiming(0, { duration: 200 });
    menuProgress.value = withTiming(0, { duration: 200 });
    const drawerRoutes: Record<string, string> = {
      maps: '/maps',
      epc: '/epc-blog',
      hpc: '/hpc-blog',
      sponsors: '/sponsors',
      contact: '/contact',
      developers: '/developers',
    };
    setTimeout(() => {
      router.push(drawerRoutes[id] || '/');
      setIsNavigating(false);
    }, 350);
  }, [isNavigating, router]);

  const pathProps = useAnimatedProps(() => ({
    strokeDasharray: [1, 14],
    strokeDashoffset: interpolate(progress.value, [0, 1], [2500, 0]),
  }));

  const rocketStyle = useAnimatedStyle(() => {
    'worklet';
    if (progress.value < 0.01) return { opacity: 0 };
    const tx = interpolate(progress.value, animationData.input, animationData.outputX);
    const ty = interpolate(progress.value, animationData.input, animationData.outputY);
    const rot = interpolate(progress.value, animationData.input, animationData.outputAngle);
    return {
      opacity: 1,
      transform: [{ translateX: tx - 16 }, { translateY: ty - 16 }, { rotate: `${rot}deg` }],
    };
  });

  const drawerContainerStyle = useAnimatedStyle(() => ({ opacity: drawerOpacity.value }));
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerEnter.value,
    transform: [{ translateY: interpolate(headerEnter.value, [0, 1], [-30, 0]) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerEnter.value, [0, 0.8, 1], [0, 1, 0.8]),
    letterSpacing: interpolate(headerEnter.value, [0, 1], [2, 8]),
    transform: [{ translateY: interpolate(headerEnter.value, [0, 1], [10, 0]) }],
  }));

  const yearStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerEnter.value, [0, 0.8, 1], [0, 0, 1]),
    transform: [
      { translateY: interpolate(headerEnter.value, [0, 0.8, 1], [20, 20, 0]) },
      { scale: interpolate(headerEnter.value, [0.8, 1], [0.8, 1]) },
    ],
  }));

  const navExitHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(navExit.value, [0, 1], [1, 0]),
    transform: [
      { translateY: interpolate(navExit.value, [0, 1], [0, -24]) },
      { scale: interpolate(navExit.value, [0, 1], [1, 0.92]) },
    ],
  }));

  const toggleExitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(navExit.value, [0, 1], [1, 0]),
    transform: [
      { translateY: interpolate(navExit.value, [0, 1], [0, -10]) },
      { scale: interpolate(navExit.value, [0, 1], [1, 0.85]) },
    ],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar style="light" />
      <SeamlessBackground />

      <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
        <Animated.View style={[{ alignItems: 'center', width: '100%', marginTop: insets.top + 120 }, headerStyle, navExitHeaderStyle]}>
          <View>
            <Animated.Text style={[{
              position: 'absolute', top: 0, left: 0, right: 0, 
              fontFamily: 'Anurati', fontSize: 56,
              color: THEME.text, letterSpacing: 12, textAlign: 'center', lineHeight: 74,
              textShadowColor: THEME.accent, textShadowRadius: 10,
            }, { opacity: 0.1 }]}>
              VERGE
            </Animated.Text>
            <Text style={{ fontFamily: 'Anurati', fontSize: 56, color: THEME.text, letterSpacing: 12, textAlign: 'center', lineHeight: 74 }}>
              VERGE
            </Text>
          </View>

          <Animated.Text style={[{
            fontFamily: 'Orbitron_700Bold', fontSize: 10, color: THEME.accent, marginTop: 16, textTransform: 'uppercase',
            textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4,
          }, subtitleStyle]}>
            JOURNEY BEYOND
          </Animated.Text>

          <Animated.View style={[{ marginTop: 24 }, yearStyle]}>
            <Countdown />
          </Animated.View>
        </Animated.View>

        {NAV_ITEMS.map((item, index) => (
          <NavItem
            key={item.id}
            item={item}
            onPress={handleNavPress}
            disabled={isNavigating || isOpen}
            index={index}
            exit={navExit}
            entered={navEntered}
            totalItems={NAV_ITEMS.length}
          />
        ))}
      </View>

      <Animated.View style={[{ position: 'absolute', left: 18, zIndex: 300, top: insets.top + 14 }, toggleExitStyle]}>
        <SpaceCommandButton menuProgress={menuProgress} onPress={toggleDrawer} />
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFillObject, { zIndex: 200 }, drawerContainerStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}
        renderToHardwareTextureAndroid
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]} />

        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={THEME.accent} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={THEME.accent} stopOpacity="0.4" />
            </SvgGradient>
          </Defs>
          <AnimatedPath
            d={d}
            stroke="rgba(255, 107, 0, 0.3)"
            strokeWidth={1.5}
            fill="none"
            animatedProps={pathProps}
            strokeLinecap="round"
          />
        </Svg>

        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: 32, height: 32, zIndex: 25 }, rocketStyle]}>
          <Svg width={32} height={32} viewBox="0 0 24 24">
            <Defs>
              <SvgGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
              </SvgGradient>
            </Defs>
            <Path d="M12 2L15 8L15 15C15 15 17 17 17 19L12 17L7 19C7 17 9 15 9 15L9 8L12 2Z" fill="white" stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} />
            <Circle cx="12" cy="10" r="1.5" fill="#000" />
            <Path d="M9 15L7 19L5 21L7 22L12 20L17 22L19 21L17 19L15 15" fill="url(#flameGrad)" opacity={0.7} />
          </Svg>
        </Animated.View>

        {menuTriggers.map((pos, i) => (
          <MenuItem
            key={DRAWER_LINKS[i].id}
            data={DRAWER_LINKS[i]}
            pos={pos}
            progress={progress}
            onPress={handleDrawerItemPress}
          />
        ))}
      </Animated.View>
    </View>
  );
}

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: THEME.bg },
// });