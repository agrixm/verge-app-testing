import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../src/services/auth';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

export default function Profile() {
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
      const session = authService.getSession();
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
    } catch {
      Alert.alert('Transmission Error', 'Failed to sync personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
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
    } catch {
      Alert.alert('Sync Error', 'Uplink failed');
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const handleImageResult = useCallback((result: ImagePicker.ImagePickerResult, field: 'aadhaarImage' | 'studentIdImage') => {
    if (!result.canceled && result.assets[0].base64) {
      setProfile((prev) => ({ ...prev, [field]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
      if (!isEditing) setIsEditing(true);
    }
  }, [isEditing]);

  const launchCamera = useCallback(async (field: 'aadhaarImage' | 'studentIdImage') => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
      });
      handleImageResult(result, field);
    } catch { Alert.alert('Sensor Error', 'Camera offline'); }
  }, [handleImageResult]);

  const launchGallery = useCallback(async (field: 'aadhaarImage' | 'studentIdImage') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
      });
      handleImageResult(result, field);
    } catch { Alert.alert('Archive Error', 'Gallery access denied'); }
  }, [handleImageResult]);

  const pickImage = useCallback((field: 'aadhaarImage' | 'studentIdImage') => {
    Alert.alert('Optical Scan', 'Source selection', [
      { text: 'Camera Sensor', onPress: () => launchCamera(field) },
      { text: 'Data Archive', onPress: () => launchGallery(field) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }, [launchCamera, launchGallery]);

  const completionPercent = useMemo(() => {
    const fields = ['phone', 'gender', 'dob', 'collegeName', 'aadhaarNumber', 'aadhaarImage', 'studentId', 'studentIdImage'];
    const filled = fields.filter((field) => !!profile[field as keyof typeof profile]);
    return Math.round((filled.length / fields.length) * 100);
  }, [profile]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1, backgroundColor: THEME.colors.bg }}
    >
      <LinearGradient colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={styles.container}>
        <VergeHeader 
          title="PROFILE" 
          rightElement={
            !loading && (
              !isEditing ? (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
                  <Ionicons name="pencil" size={14} color={THEME.colors.accent} />
                  <Text style={styles.actionButtonText}>EDIT</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => { setProfile(savedProfile); setIsEditing(false); }} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Ionicons name="checkmark" size={14} color="#000" />
                    <Text style={styles.saveButtonText}>{saving ? '...' : 'SAVE'}</Text>
                  </TouchableOpacity>
                </View>
              )
            )
          }
        />

        {loading ? (
          <VergeLoader message="SYNCING PROFILE" />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.cardContainer}>
              <View style={styles.headerRow}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarContainer}>
                    {googlePhoto ? <Image source={{ uri: googlePhoto }} style={styles.avatarImage} /> : <Ionicons name="person" size={32} color={THEME.colors.textMuted} />}
                  </View>
                  {completionPercent === 100 && (
                    <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={10} color="#000" /></View>
                  )}
                </View>
                
                <View style={styles.headerInfo}>
                  {isEditing ? (
                    <TextInput
                      style={styles.nameInput}
                      value={profile.name}
                      onChangeText={(t) => setProfile({ ...profile, name: t })}
                      placeholder="ENTER NAME"
                      placeholderTextColor={THEME.colors.textMuted}
                    />
                  ) : (
                    <Text style={styles.profileName} numberOfLines={1}>{profile.name || 'UNKNOWN'}</Text>
                  )}
                  <Text style={styles.profileEmail} numberOfLines={1}>{profile.email}</Text>
                  <View style={styles.roleBadge}><Text style={styles.roleText}>{profile.role.toUpperCase()}</Text></View>
                </View>

                {!isEditing && (
                  <TouchableOpacity onPress={() => setShowQRCode(true)} style={styles.qrButton}>
                    <Ionicons name="qr-code-outline" size={20} color={THEME.colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{completionPercent}% COMPLETE</Text>
            </View>

            <Section title="CONTACT">
              <FieldRow 
                icon="call-outline" label="PHONE" value={profile.phone} isEditing={isEditing}
                onChange={(t) => setProfile({ ...profile, phone: t })}
                keyboardType="phone-pad" maxLength={10} placeholder="8888888888" prefix="+91"
              />
            </Section>

            <Section title="PERSONAL">
              <View style={styles.fieldRow}>
                <View style={styles.fieldLabelGroup}>
                  <Ionicons name="person-outline" size={16} color={THEME.colors.textMuted} />
                  <Text style={styles.fieldLabel}>GENDER</Text>
                </View>
                <View style={styles.fieldContent}>
                  {isEditing ? (
                    <View style={styles.genderOptions}>
                      {['Male', 'Female', 'Others'].map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setProfile({ ...profile, gender: opt })}
                          style={[styles.optionButton, profile.gender === opt && styles.optionButtonActive]}
                        >
                          <Text style={[styles.optionText, profile.gender === opt && { color: THEME.colors.accent }]}>{opt.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>{profile.gender || '—'}</Text>
                  )}
                </View>
              </View>
              <View style={styles.divider} />
              
              <Pressable onPress={() => isEditing && setShowDatePicker(true)} style={styles.fieldRow}>
                <View style={styles.fieldLabelGroup}>
                  <Ionicons name="calendar-outline" size={16} color={THEME.colors.textMuted} />
                  <Text style={styles.fieldLabel}>DOB</Text>
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldValue, isEditing && !profile.dob && {color: THEME.colors.textMuted}]}>
                    {profile.dob || (isEditing ? 'SELECT DATE' : '—')}
                  </Text>
                  {isEditing && <Ionicons name="chevron-forward" size={14} color={THEME.colors.textMuted} style={{ marginLeft: 4 }} />}
                </View>
              </Pressable>
            </Section>

            <Section title="ACADEMIC">
              <FieldRow 
                icon="school-outline" label="COLLEGE" value={profile.collegeName} isEditing={isEditing}
                onChange={(t) => setProfile({ ...profile, collegeName: t })}
                placeholder="UNIVERSITY NAME" hasBorder
              />
              <FieldRow 
                icon="id-card-outline" label="STUDENT ID" value={profile.studentId} isEditing={isEditing}
                onChange={(t) => setProfile({ ...profile, studentId: t })}
                placeholder="ID NUMBER"
              />
            </Section>

            <Section title="VERIFICATION">
              <FieldRow 
                icon="shield-checkmark-outline" label="AADHAAR" value={profile.aadhaarNumber} isEditing={isEditing}
                onChange={(t) => setProfile({ ...profile, aadhaarNumber: t })}
                keyboardType="number-pad" maxLength={12} placeholder="1234..." hasBorder
              />
              <View style={styles.uploadContainer}>
                <View style={styles.uploadWrapper}>
                  <Text style={styles.uploadLabel}>AADHAAR CARD</Text>
                  <TouchableOpacity onPress={() => pickImage('aadhaarImage')} style={styles.uploadBox}>
                    {profile.aadhaarImage ? <Image source={{ uri: profile.aadhaarImage }} style={styles.previewImg} /> : (
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="camera" size={20} color={THEME.colors.textMuted} />
                        <Text style={styles.uploadText}>FRONT</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.uploadWrapper}>
                  <Text style={styles.uploadLabel}>STUDENT ID</Text>
                  <TouchableOpacity onPress={() => pickImage('studentIdImage')} style={styles.uploadBox}>
                    {profile.studentIdImage ? <Image source={{ uri: profile.studentIdImage }} style={styles.previewImg} /> : (
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="camera" size={20} color={THEME.colors.textMuted} />
                        <Text style={styles.uploadText}>FRONT</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Section>

            <TouchableOpacity 
              onPress={async () => await authService.signOut()} 
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>TERMINATE SESSION</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={profile.dob ? new Date(profile.dob) : new Date()}
            mode="date"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) setProfile({ ...profile, dob: d.toISOString().split('T')[0] })
            }}
          />
        )}

        <Modal visible={showQRCode} transparent animationType="fade" onRequestClose={() => setShowQRCode(false)}>
           <Pressable style={styles.modalOverlay} onPress={() => setShowQRCode(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>IDENTITY TAG</Text>
              <View style={styles.qrWrapper}>
                <QRCode value={profile.firebaseUid || 'N/A'} size={180} />
              </View>
              <Text style={styles.uidText}>{profile.firebaseUid}</Text>
            </View>
           </Pressable>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const Section = memo(({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
));

const FieldRow = memo(({ icon, label, value, isEditing, onChange, keyboardType, maxLength, placeholder, hasBorder, prefix }: any) => (
  <>
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabelGroup}>
        <Ionicons name={icon} size={16} color={THEME.colors.textMuted} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      
      <View style={styles.fieldContent}>
        {prefix && (
            <Text style={[styles.fieldValue, { marginRight: 2 }]}>{prefix}</Text>
        )}
        {isEditing ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            maxLength={maxLength}
            placeholder={placeholder}
            placeholderTextColor={THEME.colors.textMuted}
            selectionColor={THEME.colors.accent}
            style={styles.fieldInput}
          />
        ) : (
          <Text style={styles.fieldValue} numberOfLines={1}>{value || '—'}</Text>
        )}
      </View>
    </View>
    {hasBorder && <View style={styles.divider} />}
  </>
));

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerInfo: { flex: 1 },
  avatarWrapper: { position: 'relative' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  // Header Actions
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: THEME.colors.border, gap: 6 },
  actionButtonText: { fontSize: 10, fontWeight: '800', color: THEME.colors.accent, letterSpacing: 1 },
  saveButton: { backgroundColor: THEME.colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButtonText: { fontSize: 10, fontWeight: '900', color: '#000' },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 8 },
  cancelButtonText: { fontSize: 10, fontWeight: '800', color: THEME.colors.textMuted },

  // Profile Card
  cardContainer: { backgroundColor: THEME.colors.cardBg, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: THEME.colors.border },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A1A1A', borderWidth: 1.5, borderColor: THEME.colors.accent, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: THEME.colors.success, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.colors.cardBg },
  profileName: { fontSize: 20, fontWeight: '800', color: THEME.colors.text, includeFontPadding: false, height: 26 },
  nameInput: { fontSize: 20, fontWeight: '800', color: THEME.colors.accent, borderBottomWidth: 1, borderBottomColor: THEME.colors.accent, padding: 0, height: 26, includeFontPadding: false },
  profileEmail: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
  roleBadge: { marginTop: 8, backgroundColor: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: THEME.colors.border },
  roleText: { fontSize: 8, fontWeight: '900', color: THEME.colors.accent, letterSpacing: 1 },
  qrButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: THEME.colors.border },
  
  // Progress
  progressBarContainer: { height: 4, backgroundColor: '#1A1A1A', borderRadius: 2, marginTop: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: THEME.colors.accent },
  progressText: { fontSize: 8, fontWeight: '800', color: THEME.colors.textMuted, marginTop: 6, textAlign: 'right' },

  // Sections & Rows
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: THEME.colors.textMuted, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: THEME.colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: THEME.colors.border, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 52, paddingVertical: 8 },
  fieldLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 0.4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted },
  fieldContent: { flex: 0.6, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  fieldValue: { fontSize: 13, fontWeight: '600', color: THEME.colors.text, includeFontPadding: false, textAlign: 'right' },
  fieldInput: { fontSize: 13, fontWeight: '600', color: THEME.colors.accent, textAlign: 'right', minWidth: 40, padding: 0, includeFontPadding: false, textAlignVertical: 'center' },
  divider: { height: 1, backgroundColor: THEME.colors.border },

  // Gender Toggle
  genderOptions: { flexDirection: 'row', gap: 6 },
  optionButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: THEME.colors.border },
  optionButtonActive: { borderColor: THEME.colors.accent, backgroundColor: 'rgba(255, 107, 0, 0.05)' },
  optionText: { fontSize: 9, fontWeight: '800', color: THEME.colors.textMuted },

  // Verification Uploads
  uploadContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  uploadWrapper: { flex: 1 },
  uploadLabel: { fontSize: 9, fontWeight: '800', color: THEME.colors.textMuted, marginBottom: 8, textAlign: 'center' },
  uploadBox: { height: 100, backgroundColor: '#0F0F0F', borderRadius: 8, borderWidth: 1, borderColor: THEME.colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadText: { fontSize: 8, fontWeight: '800', color: THEME.colors.textMuted, marginTop: 4 },

  // Logout
  logoutButton: { marginTop: 12, padding: 16, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)' },
  logoutText: { color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#0A0A0A', padding: 30, borderRadius: 24, width: '80%', alignItems: 'center', borderWidth: 1, borderColor: THEME.colors.accent },
  modalTitle: { color: THEME.colors.text, fontSize: 14, fontWeight: '900', marginBottom: 20, letterSpacing: 2 },
  qrWrapper: { padding: 15, backgroundColor: '#FFF', borderRadius: 16 },
  uidText: { color: THEME.colors.textMuted, fontSize: 10, marginTop: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }
});