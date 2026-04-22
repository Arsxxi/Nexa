import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Modal, TextInput } from 'react-native';

const BADGE_ICONS: Record<string, any> = {
  pemula: require('../../assets/images/pemula.png'),
  streak: require('../../assets/images/Streakmaster.png'),
  quiz: require('../../assets/images/quiz.png'),
  explore: require('../../assets/images/explore.png'),
  coin: require('../../assets/images/coin.png'),
};
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

const FONT = {
  h1: 'SpaceGrotesk-Bold',
  h2: 'nimbus-mono.regular',
  h3: 'LiberationSans-Regular',
};

// --- TEMA WARNA NEXA ---
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const profileData = useQuery(api.users.getCurrentUserProfile);
  const updateProfile = useMutation(api.users.updateProfile);

  // Populate stats from realtime profile data
  const profile = profileData?.user || null;
  const badges = profileData?.badges || [];
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
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [avatarInput, setAvatarInput] = useState(profile?.avatarUrl || '');

  useEffect(() => {
    setNameInput(profile?.name || '');
    setAvatarInput(profile?.avatarUrl || '');
  }, [profile]);

  const handleSignOut = async () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Keluar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Gagal keluar. Silakan coba lagi.');
          }
        }
      },
    ]);
  };

  // Fungsi untuk mendapatkan 2 huruf inisial (Contoh: John Doe -> JD)
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
      await updateProfile({ userId: profile._id, name: nameInput, avatarUrl: avatarInput });
      setEditModalVisible(false);
    } catch (err) {
      console.error('Update profile failed', err);
      Alert.alert('Error', 'Gagal memperbarui profil');
    }
  };

  // Level/progress calculation
  const xpPerLevel = 1250;
  const currentLevel = profile?.level ?? Math.floor((stats.xp || 0) / xpPerLevel) + 1;
  const xpInto = (stats.xp || 0) - (currentLevel - 1) * xpPerLevel;
  const xpNeeded = xpPerLevel;
  const progressPercent = Math.min(100, Math.max(0, (xpInto / xpNeeded) * 100));

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
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarCircle} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{getInitials()}</Text>
          </View>
        )}
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
              {/* compute progress to next level */}
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
            <Text style={styles.settingsItemText}>Bahasa</Text>
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
      {/* Modals for settings */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profil</Text>
            <TextInput value={nameInput} onChangeText={setNameInput} placeholder="Nama" style={styles.input} />
            <TextInput value={avatarInput} onChangeText={setAvatarInput} placeholder="Avatar URL" style={styles.input} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalButton}>
                <Text>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProfile} style={[styles.modalButton, { backgroundColor: COLORS.primary, marginLeft: 8 }]}>
                <Text style={{ fontWeight: '800' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bahasa</Text>
            <TouchableOpacity style={{ paddingVertical: 8 }} onPress={() => { Alert.alert('Bahasa', 'Bahasa diubah ke Bahasa Indonesia'); setLangModalVisible(false); }}>
              <Text>Bahasa Indonesia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 8 }} onPress={() => { Alert.alert('Language', 'Switched to English'); setLangModalVisible(false); }}>
              <Text>English</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLangModalVisible(false)} style={[styles.modalButton, { alignSelf: 'flex-end', marginTop: 12 }]}>
              <Text>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
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

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 24, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1.5, marginTop: 2 },
  settingsBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Profile Section ---
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatarBox: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 24, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  profileDetails: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 18, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONT.h3,
    fontWeight: '400', marginBottom: 8 },
  memberBadge: {
    backgroundColor: COLORS.bgBadge,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memberBadgeText: { fontSize: 9, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },

  // --- Section General ---
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FONT.h1,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 16,
  },

  // --- Statistik ---
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: { fontSize: 9, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
  statIcon: { fontSize: 14 },
  statValue: { fontSize: 16, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  statSub: { fontSize: 10, fontFamily: FONT.h3,
    fontWeight: '400', color: COLORS.textSecondary },

  // --- Menu Pengaturan ---
  menuContainer: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 14,
    fontFamily: FONT.h1,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 12,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  /* New styles for updated layout */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 8,
  },
  unitText: { fontSize: 12, fontFamily: FONT.h1,
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
  avatarInitial: { fontSize: 28, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.dark },
  nameBlock: { flex: 1 },
  displayName: { fontSize: 22, fontFamily: FONT.h1,
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
  pillText: { fontSize: 11, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.textSecondary },

  levelCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelTitle: { fontSize: 12, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.textSecondary },
  levelXp: { fontSize: 11, color: COLORS.textSecondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressDot: { width: 14, height: 14, borderRadius: 4, marginRight: 8 },
  progressDotFilled: { backgroundColor: '#6B5B00' },
  progressDotEmpty: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF' },
  progressBarBackground: { height: 12, backgroundColor: '#F3F3F4', borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: 12, backgroundColor: '#6B5B00' },

  streakCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallTitle: { fontSize: 11, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  streakBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  streakNumber: { fontSize: 56, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.primary, width: 90, textAlign: 'center' },
  streakLabel: { fontSize: 14, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.text, paddingTop: 10 },
  streakWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekItem: { alignItems: 'center', flex: 1 },
  weekLetter: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 6 },
  weekDot: { width: 10, height: 10, backgroundColor: '#6B5B00', borderRadius: 2 },

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
  badgeLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', fontFamily: FONT.h1, fontWeight: '700' },

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
  settingsItemText: { fontSize: 14, fontFamily: FONT.h1, fontWeight: '700', color: COLORS.text },
  logoutBtn: { alignSelf: 'center', marginTop: 18 },
  logoutText: { color: COLORS.danger, fontFamily: FONT.h1,
    fontWeight: '700', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 16, fontFamily: FONT.h1,
    fontWeight: '700', color: COLORS.dark },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  modalButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.bgBadge },
});