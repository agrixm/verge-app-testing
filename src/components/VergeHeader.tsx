import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/Theme';
import Animated, { FadeIn } from 'react-native-reanimated';

interface VergeHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const VergeHeader = ({ title, showBack = true, onBack, rightElement }: VergeHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={THEME.colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        </View>

        <View style={styles.headerActions}>
          {rightElement}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  titleContainer: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.display,
    color: THEME.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default VergeHeader;
