import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  Pressable,
  View,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  BackHandler,
  Platform,
  AlertButton,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../src/services/auth';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

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
};

export default function Profile() {
  const router = useRouter();
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    collegeName: '',
    studentId: '',
    aadhaarNumber: '',
    aadhaarImage: '',
    studentIdImage: '',
    firebaseUid: '',
    role: 'visitor',
  });

  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const session = await authService.getSession();
      if (!session) return;
      setGooglePhoto(session.photoURL);

      const response = await fetch(`${SERVER_URL}/api/users/get?firebaseUid=${session.uid}`);
      let loadedProfile;

      if (response.ok) {
        const data = await response.json();
        const apiData = data.data || {};
        loadedProfile = {
          ...profile,
          ...apiData,
          phone: apiData.phone ? String(apiData.phone) : '',
          aadhaarNumber: apiData.aadhaarNumber ? String(apiData.aadhaarNumber) : '',
          firebaseUid: session.uid,
          aadhaarImage: apiData.aadhaarImage || '',
          studentIdImage: apiData.studentIdImage || ''
        };
      } else {
        loadedProfile = {
          ...profile,
          name: session.displayName || '',
          email: session.email || '',
          firebaseUid: session.uid,
        };
      }
      setProfile(loadedProfile);
      setSavedProfile(loadedProfile);
    } catch (error) {
      Alert.alert('Transmission Error', 'Failed to sync personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Clean and validate data
    const cleanedProfile = {
      ...profile,
      phone: String(profile.phone || '').trim(),
      aadhaarNumber: String(profile.aadhaarNumber || '').trim(),
    };

    const phoneRegex = /^[0-9]{10}$/;
    if (cleanedProfile.phone && !phoneRegex.test(cleanedProfile.phone)) {
      Alert.alert('Validation Error', 'Enter valid comms frequency (10 digits)');
      return;
    }

    const aadhaarRegex = /^[0-9]{12}$/;
    if (cleanedProfile.aadhaarNumber && !aadhaarRegex.test(cleanedProfile.aadhaarNumber)) {
      Alert.alert('Validation Error', 'Enter valid sector ID (12 digits)');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedProfile),
      });

      if (response.ok) {
        Alert.alert('System Updated', 'Personnel data has been synced.');
        setProfile(cleanedProfile);
        setSavedProfile(cleanedProfile);
        setIsEditing(false);
      } else {
        Alert.alert('Update Failed', 'Central hub rejected the update.');
      }
    } catch (error: any) {
      Alert.alert('Sync Error', 'Uplink failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutPress = () => {
    const buttons: AlertButton[] = [
      { text: "Logout", onPress: async () => await authService.signOut() },
      { text: "Cancel", style: 'cancel' }
    ];
    if (Platform.OS === 'android') {
      buttons.unshift({ text: "Exit Station", onPress: () => BackHandler.exitApp(), style: 'destructive' });
    }
    Alert.alert("Airlock Control", "Detach from station or logout?", buttons);
  };

  const pickImage = async (field: 'aadhaarImage' | 'studentIdImage') => {
    Alert.alert(
      "Optical Scan",
      "Source selection",
      [
        { text: "Camera Sensor", onPress: () => launchCamera(field) },
        { text: "Data Archive", onPress: () => launchGallery(field) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const launchCamera = async (field: 'aadhaarImage' | 'studentIdImage') => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
      });
      handleImageResult(result, field);
    } catch (error) { Alert.alert("Sensor Error", "Camera offline"); }
  };

  const launchGallery = async (field: 'aadhaarImage' | 'studentIdImage') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
      });
      handleImageResult(result, field);
    } catch (error) { Alert.alert("Archive Error", "Gallery access denied"); }
  };

  const handleImageResult = (result: ImagePicker.ImagePickerResult, field: 'aadhaarImage' | 'studentIdImage') => {
    if (!result.canceled && result.assets[0].base64) {
      setProfile((prev) => ({ ...prev, [field]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
      if (!isEditing) setIsEditing(true);
    }
  };

  const completionPercent = useMemo(() => {
    const fields = ['name', 'email', 'phone', 'gender', 'dob', 'collegeName', 'aadhaarNumber', 'aadhaarImage', 'studentId', 'studentIdImage'];
    const filled = fields.filter((field) => !!profile[field as keyof typeof profile]);
    return Math.round((filled.length / fields.length) * 100);
  }, [profile]);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={THEME.accent} size="large" />
    </View>
  );

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
            <Text style={styles.headerTitle}>PROFILE</Text>
            <Text style={styles.headerSubtitle}>Personnel Data</Text>
          </View>
          
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
               <Ionicons name="pencil" size={14} color={THEME.accent} />
               <Text style={styles.actionButtonText}>EDIT</Text>
            </TouchableOpacity>
          ) : (
             <View style={{ flexDirection: 'row', gap: 8 }}>
               <TouchableOpacity onPress={() => { setProfile(savedProfile); setIsEditing(false); }} style={styles.cancelButton}>
                 <Text style={styles.cancelButtonText}>CANCEL</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                 <Ionicons name="checkmark" size={14} color="#000" />
                 <Text style={styles.saveButtonText}>{saving ? 'SAVING' : 'SAVE'}</Text>
               </TouchableOpacity>
             </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.cardContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View>
              <View style={styles.avatarContainer}>
                {googlePhoto ? (
                  <Image source={{ uri: googlePhoto }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={32} color={THEME.textMuted} />
                )}
              </View>
              {completionPercent === 100 && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#000" />
                </View>
              )}
            </View>
            
            <View style={{ flex: 1, marginLeft: 16 }}>
              {isEditing ? (
                <TextInput
                  style={styles.nameInput}
                  value={profile.name}
                  onChangeText={(t) => setProfile({ ...profile, name: t })}
                  placeholder="ENTER NAME"
                  placeholderTextColor={THEME.textMuted}
                />
              ) : (
                <Text style={styles.profileName} numberOfLines={1}>{profile.name || 'UNKNOWN'}</Text>
              )}
              
              <Text style={styles.profileEmail} numberOfLines={1}>{profile.email}</Text>
              
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
              </View>
            </View>

            {!isEditing && (
              <TouchableOpacity onPress={() => setShowQRCode(true)} style={styles.qrButton}>
                <Ionicons name="qr-code-outline" size={20} color={THEME.accent} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.progressBarContainer}>
             <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{completionPercent}% COMPLETE</Text>
        </View>

        {/* Sections */}
        <Section title="CONTACT">
          <FieldRow 
            icon="call-outline" 
            label="PHONE NUMBER" 
            value={profile.phone} 
            isEditing={isEditing}
            onChange={(t) => setProfile({ ...profile, phone: t })}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="10-DIGIT NUMBER"
            prefix="+91"
          />
        </Section>

        <Section title="PERSONAL">
          <View style={styles.fieldRow}>
            <Ionicons name="person-outline" size={16} color={THEME.textMuted} />
            <Text style={styles.fieldLabel}>GENDER</Text>
            {isEditing ? (
              <View style={{ flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                {['Male', 'Female', 'Others'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setProfile({ ...profile, gender: opt })}
                    style={[
                      styles.optionButton,
                      profile.gender === opt && styles.optionButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.gender === opt && { color: THEME.accent }
                    ]}>{opt.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{profile.gender || '—'}</Text>
            )}
          </View>
          <View style={styles.divider} />
          
          <Pressable 
            onPress={() => isEditing && setShowDatePicker(true)}
            style={styles.fieldRow}
          >
            <Ionicons name="calendar-outline" size={16} color={THEME.textMuted} />
            <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
            <Text style={styles.fieldValue}>
              {profile.dob || (isEditing ? 'SELECT DATE' : '—')}
            </Text>
            {isEditing && <Ionicons name="chevron-forward" size={14} color={THEME.textMuted} />}
          </Pressable>
        </Section>

        <Section title="ACADEMIC">
          <FieldRow 
            icon="school-outline" 
            label="COLLEGE" 
            value={profile.collegeName} 
            isEditing={isEditing}
            onChange={(t) => setProfile({ ...profile, collegeName: t })}
            placeholder="COLLEGE NAME"
            hasBorder
          />
          <FieldRow 
            icon="id-card-outline" 
            label="STUDENT ID" 
            value={profile.studentId} 
            isEditing={isEditing}
            onChange={(t) => setProfile({ ...profile, studentId: t })}
            placeholder="ID NUMBER"
          />
        </Section>

        <Section title="VERIFICATION">
           <FieldRow 
            icon="shield-checkmark-outline" 
            label="AADHAAR" 
            value={profile.aadhaarNumber} 
            isEditing={isEditing}
            onChange={(t) => setProfile({ ...profile, aadhaarNumber: t })}
            keyboardType="number-pad"
            maxLength={12}
            placeholder="12-DIGIT NUMBER"
          />
          <View style={styles.divider} />
          
          <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={() => pickImage('aadhaarImage')}
              style={styles.uploadBox}
            >
              {profile.aadhaarImage ? (
                <Image source={{ uri: profile.aadhaarImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="add-circle-outline" size={24} color={THEME.textMuted} />
                  <Text style={styles.uploadText}>AADHAAR</Text>
                </View>
              )}
            </TouchableOpacity>
             <TouchableOpacity
              onPress={() => pickImage('studentIdImage')}
              style={styles.uploadBox}
            >
              {profile.studentIdImage ? (
                <Image source={{ uri: profile.studentIdImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="add-circle-outline" size={24} color={THEME.textMuted} />
                  <Text style={styles.uploadText}>COLLEGE ID</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Section>

        <TouchableOpacity onPress={handleLogoutPress} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color={THEME.text} />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>

      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={profile.dob ? new Date(profile.dob) : new Date()}
          mode="date"
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setProfile({ ...profile, dob: d.toISOString().split('T')[0] })
          }}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      )}

      {/* QR Code Modal */}
      <Modal visible={showQRCode} transparent={true} animationType="fade" onRequestClose={() => setShowQRCode(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>IDENTITY TAG</Text>
            <View style={styles.qrCodeBox}>
              <QRCode value={profile.firebaseUid || 'MISSING_ID'} size={200} />
            </View>
            <Text style={styles.uidText}>{profile.firebaseUid || 'ID NOT ASSIGNED'}</Text>
            <TouchableOpacity onPress={() => setShowQRCode(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const FieldRow = ({ icon, label, value, isEditing, onChange, keyboardType, maxLength, placeholder, hasBorder, prefix }: {
  icon: IconName;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (t: string) => void;
  keyboardType?: any;
  maxLength?: number;
  placeholder?: string;
  hasBorder?: boolean;
  prefix?: string;
}) => (
  <>
    <View style={styles.fieldRow}>
      <Ionicons name={icon} size={16} color={THEME.textMuted} />
      <Text style={styles.fieldLabel}>{label}</Text>
      
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
        {value || isEditing ? (
          <>
            {prefix && <Text style={[styles.fieldValue, { flex: 0 }]}>{prefix} </Text>}
            {isEditing ? (
              <TextInput
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType}
                maxLength={maxLength}
                placeholder={placeholder}
                placeholderTextColor={THEME.textMuted}
                style={[styles.fieldInput, { flex: 1, paddingVertical: 0, margin: 0 }]}
              />
            ) : (
              <Text style={[styles.fieldValue, { flex: 0 }]} numberOfLines={1}>
                {value}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.fieldValue, { color: THEME.textMuted }]}>—</Text>
        )}
      </View>
    </View>
    {hasBorder && <View style={styles.divider} />}
  </>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  loadingContainer: { flex: 1, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center' },
  
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 8, backgroundColor: THEME.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  minimalBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: THEME.text, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 11, color: THEME.textMuted, marginTop: 0, letterSpacing: 0.3 },
  
  actionButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.cardBg,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight, gap: 6,
  },
  actionButtonText: { fontSize: 10, fontWeight: '800', color: THEME.accent, letterSpacing: 1 },
  
  cancelButton: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelButtonText: { fontSize: 10, fontWeight: '800', color: THEME.textMuted, letterSpacing: 1 },
  
  saveButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.accent,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6,
  },
  saveButtonText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 1 },

  scrollContent: { padding: 20, paddingBottom: 100 },

  // Profile Card
  cardContainer: {
    backgroundColor: THEME.cardBg, borderRadius: 12, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: THEME.border, shadowColor: THEME.accent, shadowOffset: { width: 0, height: 4 }, shadowRadius: 15, elevation: 4,
  },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: THEME.surface, borderWidth: 2, borderColor: THEME.accent, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: THEME.success, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.cardBg },
  
  profileName: { fontSize: 20, fontWeight: '700', color: THEME.text, letterSpacing: -0.5 },
  nameInput: { fontSize: 20, fontWeight: '700', color: THEME.text, borderBottomWidth: 1, borderBottomColor: THEME.accent, paddingVertical: 0, margin: 0, flex: 1 },
  profileEmail: { fontSize: 12, color: THEME.textMuted, marginTop: 4 },
  
  roleBadge: { marginTop: 8, backgroundColor: THEME.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: THEME.borderLight },
  roleText: { fontSize: 9, fontWeight: '800', color: THEME.accent, letterSpacing: 1 },
  
  qrButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.surface, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight },
  
  progressBarContainer: { height: 4, backgroundColor: THEME.surface, borderRadius: 2, marginTop: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: THEME.accent },
  progressText: { fontSize: 9, fontWeight: '700', color: THEME.textMuted, marginTop: 8, letterSpacing: 1, textAlign: 'right' },

  // Sections
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: THEME.textMuted, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: THEME.cardBg, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  divider: { height: 1, backgroundColor: THEME.border },
  
  fieldLabel: { fontSize: 11, fontWeight: '700', color: THEME.textMuted, letterSpacing: 0.5 },
  fieldValue: { fontSize: 13, fontWeight: '600', color: THEME.text, flex: 1, textAlign: 'right' },
  fieldInput: { fontSize: 13, fontWeight: '600', color: THEME.text, flex: 1, textAlign: 'right' },

  optionButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: THEME.borderLight, backgroundColor: THEME.surface },
  optionButtonActive: { borderColor: THEME.accent, backgroundColor: 'rgba(255, 107, 0, 0.1)' },
  optionText: { fontSize: 10, fontWeight: '700', color: THEME.textMuted },
  
  uploadBox: { flex: 1, height: 100, backgroundColor: THEME.surface, borderRadius: 8, borderWidth: 1, borderColor: THEME.borderLight, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 9, fontWeight: '700', color: THEME.textMuted, marginTop: 8, letterSpacing: 1 },

  logoutButton: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8, marginTop: 12 },
  logoutText: { fontSize: 12, fontWeight: '800', color: THEME.text, letterSpacing: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  qrContainer: { width: '100%', backgroundColor: THEME.cardBg, borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  qrTitle: { fontSize: 18, fontWeight: '900', color: THEME.text, letterSpacing: 2, marginBottom: 24 },
  qrCodeBox: { padding: 16, backgroundColor: '#FFF', borderRadius: 12 },
  uidText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: THEME.textMuted, marginTop: 20, letterSpacing: 1 },
  closeButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: THEME.accent, borderRadius: 8 },
  closeButtonText: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 1 },
});