import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Modal, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const BADGE_ICONS: Record<string, any> = {
  pemula: require('../../assets/images/pemula.png'),
  streak: require('../../assets/images/Streakmaster.png'),
  quiz: require('../../assets/images/quiz.png'),
  explore: require('../../assets/images/explore.png'),
  coin: require('../../assets/images/coin.png'),
};
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

const COLORS = {
  primary: '#FFC800',
  dark: '#18181B',
  border: '#E4E4E7',
  text: '#18181B',
  textSecondary: '#71717A',
  bgMain: '#FAFAFA',
  bgCard: '#FFFFFF',
  bgBadge: '#F4F4F5',
  danger: '#DC2626',
};

const getStorageUrl = (storageId?: string): string | undefined => {
  if (!storageId) return undefined;
  
  if (storageId.startsWith('http://') || storageId.startsWith('https://')) {
    return storageId;
  }
  
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.warn('Missing EXPO_PUBLIC_CONVEX_URL environment variable');
    return undefined;
  }
  
  const baseUrl = convexUrl.replace(/\/$/, '');
  return `${baseUrl}/api/storage/${storageId}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const profileData = useQuery(api.users.getCurrentUserProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

  // Populate stats from realtime profile data
  const profile = profileData?.user || null;
  const badges = profileData?.badges || [];
  
  // Local state untuk immediate UI update
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  
  const stats = {
    xp: profile?.xp ?? 0,
    streak: profile?.streak ?? 0,
    coursesCompleted: 8,
    coins: profile?.coinBalance ?? 0,
  };

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setNameInput(profile?.name || '');
    setAvatarError(false);
    setLocalAvatarUrl(null); // Reset local state saat profile berubah
  }, [profile]);

  const handleSignOut = () => setLogoutConfirmVisible(true);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setIsUploading(true);

        try {
          console.log('🔄 Starting avatar upload...');
          console.log('📁 File URI:', file.uri);
          
          // Step 1: Get upload URL from Convex
          console.log('1️⃣ Requesting upload URL from Convex...');
          const uploadUrl = await generateAvatarUploadUrl();
          
          if (!uploadUrl) {
            throw new Error('generateAvatarUploadUrl returned empty result');
          }
          
          console.log('✅ Got upload URL');

          // Step 2: Fetch file and convert to Blob
          console.log('2️⃣ Converting file to blob...');
          const response = await fetch(file.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log(`✅ Blob created: ${blob.size} bytes, type: ${blob.type}`);

          // Step 3: Upload blob to the URL Convex provided
          console.log('3️⃣ Uploading to Convex storage...');
          console.log('   Upload URL:', uploadUrl);
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Content-Type': blob.type || 'image/jpeg',
            },
            body: blob,
          });

          console.log('Upload response status:', uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload failed:', errorText);
            throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
          }

          const uploadData = await uploadResponse.json();
          console.log('✅ Upload successful. Response:', uploadData);
          
          const storageId = uploadData?.storageId;
          if (!storageId) {
            throw new Error('No storageId in response: ' + JSON.stringify(uploadData));
          }

          // Step 4: Update profile with storage ID
          if (profile?._id) {
            console.log('4️⃣ Updating profile with storageId:', storageId);
            
            // Immediately show new avatar locally
            const newAvatarUrl = getStorageUrl(storageId);
            setLocalAvatarUrl(newAvatarUrl);
            
            const result = await updateProfile({ 
              userId: profile._id, 
              avatarUrl: storageId 
            });
            
            console.log('✅ updateProfile result:', result);
            
            setAvatarError(false);
            
            // Wait for Convex query to update
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Close modal to trigger re-render
            if (editModalVisible) {
              setEditModalVisible(false);
            }
            
            Alert.alert('Success', 'Avatar updated successfully! 🎉');
            console.log('✅ Profile updated and UI refreshed');
          }
        } catch (uploadErr) {
          console.error('❌ Upload error:', uploadErr);
          const errorMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          Alert.alert(
            'Upload Failed', 
            `Error: ${errorMsg}\n\nDebug: Check console logs for more details.`
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.error('❌ Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const confirmSignOut = async () => {
    setLogoutConfirmVisible(false);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    if (first && last) return (first + last).toUpperCase();
    return (user.firstName || user.emailAddresses[0]?.emailAddress || 'U').substring(0, 2).toUpperCase();
  };

  const saveProfile = async () => {
    if (!profile) return;
    try {
      await updateProfile({ 
        userId: profile._id, 
        name: nameInput 
      });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      console.error('Update profile failed', err);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // Level/progress calculation
  const xpPerLevel = 1250;
  const currentLevel = profile?.level ?? Math.floor((stats.xp || 0) / xpPerLevel) + 1;
  const xpInto = (stats.xp || 0) - (currentLevel - 1) * xpPerLevel;
  const xpNeeded = xpPerLevel;
  const progressPercent = Math.min(100, Math.max(0, (xpInto / xpNeeded) * 100));

  // Use local avatar first, then fallback to profile avatar, then use initials
  const profileAvatarUrl = localAvatarUrl || (profile?.avatarUrl ? getStorageUrl(profile.avatarUrl) : undefined);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.unitText}>UNIT_01_USER</Text>
        <TouchableOpacity style={styles.qrBtn}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Profile top */}
      <View style={styles.profileTop}>
        <TouchableOpacity onPress={pickImage} disabled={isUploading} style={styles.avatarContainer}>
          {profileAvatarUrl && !avatarError ? (
            <Image 
              source={{ uri: profileAvatarUrl }}
              style={styles.avatarCircle}
              onError={(e) => {
                console.log('❌ Image load error:', e.nativeEvent.error);
                console.log('   Attempted URL:', profileAvatarUrl);
                setAvatarError(true);
              }}
              onLoadStart={() => console.log('📸 Loading avatar...')}
              onLoadEnd={() => console.log('✅ Avatar loaded')}
            />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.editAvatarBtn}>
            <Ionicons 
              name={isUploading ? "hourglass" : "camera"} 
              size={16} 
              color={COLORS.dark} 
            />
          </View>
        </TouchableOpacity>
        <View style={styles.nameBlock}>
          <Text style={styles.displayName}>{(profile?.name || user?.fullName || 'ANDI R.').toUpperCase()}</Text>
          <Text style={styles.handle}>@{(user?.username || 'andirx_99')}</Text>
          <View style={styles.pillsRow}>
            <View style={styles.pill}><Text style={styles.pillText}>▣ {stats.xp.toLocaleString('id-ID')} XP</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>🔥 {stats.streak} HARI</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>🌑 {stats.coins}</Text></View>
          </View>
        </View>
      </View>

      {/* Level progress card */}
      <View style={styles.section}>
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>LEVEL {profile?.level ?? 1} · EXPLORER</Text>
              <Text style={styles.levelXp}>{Math.max(0, xpInto)} / {xpNeeded} XP</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
      </View>

      {/* Streak card */}
      <View style={styles.section}>
        <View style={styles.streakCard}>
          <Text style={styles.smallTitle}>STREAK</Text>
          <View style={styles.streakBody}>
            <Text style={styles.streakNumber}>{stats.streak}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakLabel}>HARI{"\n"}BERTURUT-TURUT</Text>
            </View>
          </View>
          <View style={styles.streakWeekRow}>
            {['S','S','R','K','J','S','M'].map((d, idx) => (
              <View key={idx} style={styles.weekItem}>
                <Text style={styles.weekLetter}>{d}</Text>
                <View style={styles.weekDot} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PENCAPAIAN BADGE</Text>
          <View style={styles.badgeGrid}>
            {(badges || []).map((b: any) => (
              <TouchableOpacity key={b.id} style={[styles.badgeBox, b.isEarned && styles.badgeBoxActive]}>
                {BADGE_ICONS[b.icon] && (
                  <Image 
                    source={BADGE_ICONS[b.icon]} 
                    style={[styles.badgeIcon, !b.isEarned && styles.badgeIconInactive]} 
                  />
                )}
                <Text style={[styles.badgeLabel, b.isEarned && { color: COLORS.dark }]}>{b.name.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
      </View>

      {/* Pengaturan Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PENGATURAN</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.settingsItemText}>Edit Profil</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setNotifModalVisible(true)}>
            <Text style={styles.settingsItemText}>Notifikasi</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setLangModalVisible(true)}>
            <Text style={styles.settingsItemText}>Bahasa Indonesia</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setHelpModalVisible(true)}>
            <Text style={styles.settingsItemText}>Bantuan</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>KELUAR</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.editModalCard}>
            <Text style={styles.editModalTitle}>Edit Profil</Text>
            <TouchableOpacity onPress={pickImage} disabled={isUploading} style={styles.avatarUploadBtn}>
              {profileAvatarUrl && !avatarError ? (
                <Image 
                  source={{ uri: profileAvatarUrl }}
                  style={styles.avatarUploadImg}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <View style={styles.avatarUploadPlaceholder}>
                  <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
                  <Text style={styles.avatarUploadText}>Pilih Foto</Text>
                </View>
              )}
            </TouchableOpacity>
            <TextInput 
              value={nameInput} 
              onChangeText={setNameInput} 
              placeholder="Nama" 
              style={styles.input} 
              editable={!isUploading}
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)} 
                style={styles.editModalCancel}
                disabled={isUploading}
              >
                <Text style={styles.editModalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={saveProfile} 
                style={[styles.editModalSave, isUploading && { opacity: 0.6 }]}
                disabled={isUploading}
              >
                <Text style={styles.editModalSaveText}>{isUploading ? 'Uploading...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Other Modals */}
      <Modal visible={notifModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifikasi</Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Pengaturan notifikasi akan datang di versi berikutnya.</Text>
            <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={[styles.modalButton, { alignSelf: 'flex-end', marginTop: 12 }]}>
              <Text>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={langModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.langModalCard}>
            <Text style={styles.langModalTitle}>Bahasa</Text>
            <TouchableOpacity style={styles.langOption} onPress={() => { setLangModalVisible(false); }}>
              <Text style={styles.langOptionText}>Bahasa Indonesia</Text>
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.langOption} onPress={() => { setLangModalVisible(false); }}>
              <Text style={styles.langOptionText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLangModalVisible(false)} style={styles.langCloseBtn}>
              <Text style={styles.langCloseBtnText}>Tutup</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={helpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bantuan</Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Hubungi support@example.com untuk bantuan.</Text>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={[styles.modalButton, { alignSelf: 'flex-end', marginTop: 12 }]}>
              <Text>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={logoutConfirmVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLogoutConfirmVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.logoutModalCard}>
            <Text style={styles.logoutModalTitle}>Keluar?</Text>
            <Text style={styles.logoutModalDesc}>Apakah Anda yakin ingin keluar?</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                onPress={() => setLogoutConfirmVisible(false)}
                style={styles.logoutModalCancel}
              >
                <Text style={styles.logoutModalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSignOut}
                style={styles.logoutModalConfirm}
              >
                <Text style={styles.logoutModalConfirmText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 8,
  },
  unitText: { fontSize: 12, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.dark },
  qrBtn: { padding: 6 },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
    marginRight: 16,
  },
  avatarContainer: {
    position: 'relative',
    zIndex: 10,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.bgMain,
    zIndex: 20,
  },
  avatarInitial: { fontSize: 28, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.dark },
  nameBlock: { flex: 1 },
  displayName: { fontSize: 22, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  handle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  pillText: { fontSize: 11, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.textSecondary },

  levelCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelTitle: { fontSize: 12, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.textSecondary },
  levelXp: { fontSize: 11, color: COLORS.textSecondary },
  progressBarBackground: { height: 12, backgroundColor: '#F3F3F4', borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: 12, backgroundColor: '#6B5B00' },

  streakCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallTitle: { fontSize: 11, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  streakBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  streakNumber: { fontSize: 56, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.primary, width: 90, textAlign: 'center' },
  streakLabel: { fontSize: 14, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.text, paddingTop: 10 },
  streakWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekItem: { alignItems: 'center', flex: 1 },
  weekLetter: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 6 },
  weekDot: { width: 10, height: 10, backgroundColor: '#6B5B00', borderRadius: 2 },

  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 16,
  },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  badgeBox: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.bgBadge,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginBottom: 12,
  },
  badgeBoxActive: { backgroundColor: '#FFF6D6' },
  badgeIcon: {
    width: 25,
    height: 25,
    marginBottom: 3,
  },
  badgeIconInactive: {
    opacity: 0.3,
  },
  badgeLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', fontFamily: TYPOGRAPHY.h1.fontFamily, fontWeight: '700' },

  settingsList: { marginTop: 6 },
  settingsItem: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsItemText: { fontSize: 14, fontFamily: TYPOGRAPHY.h1.fontFamily, fontWeight: '700', color: COLORS.text },
  logoutBtn: { alignSelf: 'center', marginTop: 18 },
  logoutText: { color: COLORS.danger, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 16, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.dark },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  modalButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.bgBadge },

  logoutModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  logoutModalDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bgBadge,
    alignItems: 'center',
  },
  logoutModalCancelText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutModalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  logoutModalConfirmText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '600',
    color: COLORS.dark,
  },
  editModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  editModalTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarUploadBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatarUploadImg: {
    width: '100%',
    height: '100%',
  },
  avatarUploadPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.bgBadge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUploadText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bgBadge,
    alignItems: 'center',
  },
  editModalCancelText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '600',
    color: COLORS.text,
  },
  editModalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  editModalSaveText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '600',
    color: COLORS.dark,
  },
  langModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  langModalTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  langOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  langCloseBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 14,
  },
  langCloseBtnText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});