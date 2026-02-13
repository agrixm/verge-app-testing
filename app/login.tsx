import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/auth';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

const THEME = {
  bg: '#050505',
  accent: '#d65214',
  text: '#FFFFFF',
  border: '#1F1F1F',
};

const FULL_TEXT = "HEY.\nWELCOME TO\nVERGE";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Reanimated shared value for button scale
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < FULL_TEXT.length) {
        setDisplayedText(FULL_TEXT.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 60);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await authService.signIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Image
        source={require('../assets/astronaut.png')}
        style={styles.bgImageFill}
        resizeMode="cover"
      />
      <Image
        source={require('../assets/astronaut.png')}
        style={styles.bgImage}
        resizeMode="contain"
      />

      <View pointerEvents="none" style={styles.topOverlay} />
      <View pointerEvents="none" style={styles.bottomOverlay} />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeText}>
            {displayedText}
            <Text style={{ color: cursorVisible ? THEME.accent : 'transparent' }}>_</Text>
          </Text>
        </View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable
            onPress={handleLogin}
            onPressIn={() => {
              buttonScale.value = withSpring(0.98);
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1);
            }}
            disabled={loading}
          >
            <LinearGradient
              colors={[THEME.accent, THEME.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#e2e1e1" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="logo-google" size={18} color="#e2e1e1" />
                  <Text style={styles.buttonText}>Continue with Google</Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  buttonContainer: {
    bottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonGradient: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e1e1',
    letterSpacing: 0.5,
  },
  titleContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontFamily: 'Guardians',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 32,
    letterSpacing: -1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 107, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
