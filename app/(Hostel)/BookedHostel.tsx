import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth';
import QRCode from 'react-native-qrcode-svg';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

const THEME = {
  bg: '#050505',
  cardBg: '#121212',
  accent: '#FF6B00',
  text: '#FFFFFF',
  textMuted: '#888888',
  border: '#1F1F1F',
  borderLight: '#2A2A2A',
  surface: '#0A0A0A',
  success: '#00C853',
  warning: '#FFB300',
};

interface Booking {
  verified: boolean;
  allottedRoomNumber?: string;
  days: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | string;
  qrToken?: string;
  verifiedAt?: string;
  hostelName: string;
}

export default function BookedHostel() {
  const router = useRouter();
  const user = authService.getSession();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setErrorMsg(null);
      const response = await fetch(`${SERVER_URL}/api/accommodation/my?firebaseUid=${user.uid}`);

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType?.includes("application/json")) {
        const result = await response.json();
        setBooking(result.data);
      } else {
        const text = await response.text();
        try {
          const errJson = JSON.parse(text);
          setErrorMsg(errJson.message || "No deployment data found.");
        } catch {
          setErrorMsg("Uplink error.");
        }
        setBooking(null);
      }
    } catch (error: any) {
      if (__DEV__) console.error("Fetch booking error");
      setErrorMsg("Network offline.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooking();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME.accent} size="large" />
        <Text style={styles.loadingText}>SYNCING DATA...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.bg, '#0A0A0A', THEME.bg]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>DEPLOYMENT INFO</Text>
            <Text style={styles.headerSubtitle}>Personal assignment briefing</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accent} />}
      >
        {booking ? (
          <View style={styles.briefingContainer}>
            {/* Status Bar */}
            <View style={styles.statusBanner}>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: booking.verified ? THEME.success : THEME.warning }
              ]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>OPERATIONAL STATUS</Text>
                <Text style={[
                  styles.statusValue, 
                  { color: booking.verified ? THEME.success : THEME.warning }
                ]}>
                  {booking.verified ? 'ACCESS VERIFIED' : 'PENDING CLEARANCE'}
                </Text>
              </View>
              <Ionicons 
                name={booking.verified ? "shield-checkmark" : "warning"} 
                size={24} 
                color={booking.verified ? THEME.success : THEME.warning} 
              />
            </View>

            {/* Main Info Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardSection}>
                <Text style={styles.label}>DEPLOYMENT SECTOR</Text>
                <Text style={styles.hostelName}>{booking.hostelName.toUpperCase()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardSection}>
                <Text style={styles.label}>UNIT ASSIGNMENT</Text>
                <Text style={styles.roomNumber}>
                  {booking.allottedRoomNumber || 'PENDING ALLOTMENT'}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>{booking.days} DAYS</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PAYMENT</Text>
                  <Text style={[
                    styles.statValue, 
                    { color: booking.paymentStatus === 'paid' ? THEME.success : THEME.accent }
                  ]}>
                    {booking.paymentStatus.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* QR Section */}
            <View style={styles.qrBriefing}>
              <Text style={styles.qrLabel}>IDENTITY TOKEN</Text>
              <Text style={styles.qrSubLabel}>Present for entry authorization</Text>
              
              <View style={styles.qrFrame}>
                <View style={styles.qrInnerFrame}>
                  {booking.qrToken ? (
                    <QRCode 
                      value={booking.qrToken} 
                      size={180} 
                      backgroundColor="#FFF"
                      color="#000"
                    />
                  ) : (
                    <ActivityIndicator color={THEME.accent} />
                  )}
                </View>
                {/* Corner Accents */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {booking.verifiedAt && (
              <View style={styles.logFooter}>
                <Ionicons name="time-outline" size={12} color={THEME.textMuted} />
                <Text style={styles.logText}>
                  LAST SYNC: {new Date(booking.verifiedAt).toLocaleString().toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="alert-circle-outline" size={48} color={THEME.borderLight} />
            </View>
            <Text style={styles.emptyTitle}>NO DEPLOYMENT DATA</Text>
            <Text style={styles.emptyDesc}>
              {errorMsg || "You have no active accommodation assignments recorded in the system."}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/accommodation')}
              style={styles.exploreButton}
            >
              <Text style={styles.exploreButtonText}>ACQUIRE QUARTERS</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: THEME.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 0,
    letterSpacing: 0.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  briefingContainer: {
    gap: 20,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 16,
  },
  statusIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  cardSection: {
    padding: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  hostelName: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 0.5,
  },
  roomNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.accent,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  statItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.text,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: THEME.border,
  },
  qrBriefing: {
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 2,
  },
  qrSubLabel: {
    fontSize: 9,
    color: THEME.textMuted,
    marginTop: 4,
    marginBottom: 24,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  qrFrame: {
    padding: 12,
    position: 'relative',
  },
  qrInnerFrame: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: THEME.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  logText: {
    fontSize: 8,
    color: THEME.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyDesc: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
