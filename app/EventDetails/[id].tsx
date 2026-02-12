import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

interface Club {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  category: string;
  venue: string;
  date: string;
  time: string;
  maxParticipants: number;
  registrationFee: number;
  requiresTeam: boolean;
  status: string;
  unstopLink?: string;
  club?: string | null;
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

// ─── Detail Block ─────────────────────────────────────────────────────
const DetailBlock = ({ icon, label, value, index }: { icon: any; label: string; value: string; index: number }) => {
  return (
    <Animated.View
      entering={FadeInUp.delay(300 + index * 80).duration(500).easing(Easing.out(Easing.cubic))}
      style={{
        width: '48%',
        backgroundColor: THEME.cardBg,
        borderWidth: 1,
        borderColor: THEME.border,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <Ionicons name={icon} size={14} color={THEME.textMuted} />
        <Text style={{ color: THEME.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: THEME.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
        {value}
      </Text>
    </Animated.View>
  );
};

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/events/${id}`);
      const json = await response.json();
      if (json.status === true && json.data) {
        setEvent(json.data);
        if (json.data.club) {
          fetchClubDetails(json.data.club);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubDetails = async (clubId: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/clubs/${clubId}`);
      const json = await response.json();
      if (json.status === true && json.data) {
        setClub(json.data);
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching club details');
    }
  };

  const handleRegister = async () => {
    const unstopUrl = event?.unstopLink || 'https://unstop.com/';
    await Linking.openURL(unstopUrl);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: THEME.textMuted, fontSize: 10, letterSpacing: 2 }}>INITIALIZING...</Text>
      </View>
    );
  }

  if (!event) return null;

  const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 4,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Ionicons name="chevron-back" size={22} color={THEME.text} />
          </Pressable>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: THEME.text, letterSpacing: 0.5 }}>
              DETAILS
            </Text>
            <Text style={{ fontSize: 11, color: THEME.textMuted, marginTop: 0 }}>Mission briefing</Text>
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 10 }}>
          {/* Category badge */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(450).easing(Easing.out(Easing.cubic))}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            <View
              style={{
                backgroundColor: THEME.surface,
                borderWidth: 1,
                borderColor: THEME.borderLight,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: THEME.text, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                {event.category.toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            entering={FadeInDown.delay(180).duration(500).easing(Easing.out(Easing.cubic))}
            style={{
              color: THEME.text,
              fontSize: 32,
              fontWeight: '900',
              marginTop: 16,
              lineHeight: 40,
              letterSpacing: -0.5,
            }}
          >
            {event.title}
          </Animated.Text>

          {/* Price Highlight */}
          <Animated.View entering={FadeInDown.delay(220)} style={{ marginTop: 12 }}>
            <Text style={{ color: THEME.accent, fontWeight: '800', fontSize: 18, letterSpacing: 1 }}>
              {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'FREE ACCESS'}
            </Text>
          </Animated.View>

          {/* Detail grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 32 }}>
            <DetailBlock icon="calendar-outline" label="Date" value={eventDate} index={0} />
            <DetailBlock icon="time-outline" label="Time" value={event.time} index={1} />
            <DetailBlock icon="location-outline" label="Venue" value={event.venue} index={2} />
            <DetailBlock icon="people-outline" label="Type" value={event.requiresTeam ? 'Team' : 'Solo'} index={3} />
            <DetailBlock icon="person-add-outline" label="Slots" value={event.maxParticipants.toString()} index={4} />
            <DetailBlock icon="shield-checkmark-outline" label="Status" value="ACTIVE" index={5} />
          </View>

          {/* Description section */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(500).easing(Easing.out(Easing.cubic))}
            style={{ marginTop: 28 }}
          >
            <View style={{ height: 1, backgroundColor: THEME.border, marginBottom: 24 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Ionicons name="document-text-outline" size={16} color={THEME.textMuted} />
              <Text style={{ color: THEME.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                DESCRIPTION
              </Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 24, fontWeight: '500' }}>
              {event.description || 'No tactical briefing provided for this event. Prepare for standard operational procedures.'}
            </Text>
          </Animated.View>

          {/* Club section */}
          {club && (
            <Animated.View
              entering={FadeInUp.delay(700).duration(500).easing(Easing.out(Easing.cubic))}
              style={{ marginTop: 28 }}
            >
              <View style={{ height: 1, backgroundColor: THEME.border, marginBottom: 24 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Ionicons name="flag-outline" size={16} color={THEME.textMuted} />
                <Text style={{ color: THEME.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                  ORGANIZED BY
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: THEME.cardBg,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: THEME.text, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>
                    {club.name.toUpperCase()}
                  </Text>
                  {club.description && (
                    <Text style={{ color: THEME.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      {club.description}
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Register CTA */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(600).easing(Easing.out(Easing.cubic))}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 36,
            paddingTop: 16,
            backgroundColor: 'rgba(5, 5, 5, 0.8)',
          }}
        >
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              backgroundColor: THEME.surface,
              borderWidth: 1,
              borderColor: THEME.borderLight,
              borderRadius: 12,
              paddingVertical: 18,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            })}
          >
            <Text style={{ color: THEME.text, fontWeight: '800', fontSize: 14, letterSpacing: 2 }}>
              REGISTER NOW
            </Text>
            <Ionicons name="arrow-forward" size={18} color={THEME.accent} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
