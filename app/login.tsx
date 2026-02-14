import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/auth';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  FadeInDown,
} from 'react-native-reanimated';
import { THEME } from '../src/constants/Theme';
import { VergeButton } from '../src/components/VergeButton';

const FULL_TEXT = "HEY.\nWELCOME TO\nVERGE";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    let typingInterval: NodeJS.Timeout;
    
    const startTimeout = setTimeout(() => {
      typingInterval = setInterval(() => {
        if (currentIndex < FULL_TEXT.length) {
          setDisplayedText(FULL_TEXT.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 100);
    }, 600);

    return () => {
      clearTimeout(startTimeout);
      if (typingInterval) clearInterval(typingInterval);
    };
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
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeText}>
            {displayedText}
            <Text style={{ color: cursorVisible ? THEME.colors.accent : 'transparent' }}>_</Text>
          </Text>
        </View>

        <Animated.View entering={FadeInDown.duration(800)} style={styles.buttonContainer}>
          <VergeButton 
            label="Continue with Google"
            onPress={handleLogin}
            loading={loading}
            icon={<Ionicons name="logo-google" size={18} color="#000" />}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bgImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 1.0,
  },
  buttonContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  titleContainer: {
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontFamily: THEME.fonts.primaryBold,
    fontSize: 34,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 40,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 107, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
});
