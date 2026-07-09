import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

const COLORS = {
  bg: '#F5F3EF',
  card: '#FFFFFF',
  dark: '#18181B',
  muted: '#71717A',
  border: '#E4E4E7',
  darkCard: '#27272A',
  primary: '#FFC800',
  danger: '#DC2626',
  pillDefault: '#F0EDE8',
};

export default function AdminProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const userData = useQuery(api.users.getCurrentUser);
  const stats = useQuery(api.coins.getRedeemStats);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const handleTerminate = () => {
    setLogoutConfirmVisible(true);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const adminName = userData?.name || userData?.email?.split('@')[0] || 'Sys_Admin_01';
  const initials = getInitials(adminName);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>ADMIN_PROFILE</Text>
          </View>
        </View>

        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.adminName}>{adminName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ROOT_OPERATOR</Text>
          </View>
        </View>

        {/* Password Indicator */}
        <View style={styles.passwordRow}>
          <Ionicons name="lock-closed" size={14} color={COLORS.muted} />
          <View style={styles.dotRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.passwordDot} />
            ))}
          </View>
        </View>

        {/* Activity Card */}
        <View style={styles.darkCard}>
          <Text style={styles.darkCardLabel}>USER ACTIVITY</Text>
          <View style={styles.activityRows}>
            <View style={styles.activityRow}>
              <Text style={styles.activityKey}>TOTAL_REDEEM</Text>
              <Text style={styles.activityValue}>
                {stats?.totalRequests
                  ? stats.totalRequests > 1000
                    ? `${(stats.totalRequests / 1000).toFixed(0)}RB`
                    : stats.totalRequests.toLocaleString('id-ID')
                  : '0'}
              </Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityRow}>
              <Text style={styles.activityKey}>LOGIN_USER</Text>
              <Text style={styles.activityValue}>
                {stats?.totalRequests ? Math.min(stats.totalRequests, 10).toString() : '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Terminate Button */}
        <TouchableOpacity style={styles.terminateBtn} onPress={handleTerminate}>
          <Text style={styles.terminateBtnText}>LOGOUT</Text>
        </TouchableOpacity>
        <Text style={styles.terminateHint}>END ACTIVE OPERATOR CREDENTIALS</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={logoutConfirmVisible} transparent animationType="fade">
        <View style={styles.logoutModalOverlay} pointerEvents="box-none">
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="warning" size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.logoutModalTitle}>KELUAR?</Text>
            <Text style={styles.logoutModalDesc}>AKANMengakhiriSESIOPERATOR</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutModalBtn, { backgroundColor: COLORS.pillDefault }]}
                onPress={() => setLogoutConfirmVisible(false)}
              >
                <Text style={styles.logoutModalBtnText}>BATAL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutModalBtn, { backgroundColor: COLORS.danger }]}
                onPress={confirmSignOut}
              >
                <Text style={[styles.logoutModalBtnText, { color: '#fff' }]}>KELUAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 2,
  },
  profileSection: {
    alignItems: 'center', paddingVertical: 32,
    backgroundColor: COLORS.card, marginBottom: 8,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarInitials: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 28, fontWeight: '800', color: COLORS.dark, letterSpacing: -0.5,
  },
  adminName: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 20, fontWeight: '800', color: COLORS.dark, marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.pillDefault,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16,
  },
  roleBadgeText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 11, fontWeight: '700', color: COLORS.dark, letterSpacing: 1,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, paddingVertical: 16, marginBottom: 16, gap: 10,
  },
  dotRow: { flexDirection: 'row', gap: 6 },
  passwordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.dark },
  darkCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 12,
    padding: 20, marginHorizontal: 20, marginBottom: 24,
  },
  darkCardLabel: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 2, marginBottom: 16,
  },
  activityRows: {},
  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8,
  },
  activityKey: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '600', color: '#71717A',
  },
  activityValue: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 28, fontWeight: '800', color: COLORS.primary,
  },
  activityDivider: { height: 1, backgroundColor: '#3f3f46', marginVertical: 4 },
  terminateBtn: {
    backgroundColor: COLORS.danger, borderRadius: 8, paddingVertical: 16,
    alignItems: 'center', marginHorizontal: 20, marginBottom: 8,
  },
  terminateBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '600', color: '#FFFFFF', letterSpacing: 1,
  },
  terminateHint: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '400', color: COLORS.muted, textAlign: 'center', marginBottom: 24,
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  logoutIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 8,
  },
  logoutModalDesc: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, color: COLORS.muted, marginBottom: 24, textAlign: 'center',
  },
  logoutModalButtons: {
    flexDirection: 'row', gap: 12, width: '100%',
  },
  logoutModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutModalBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '600', color: COLORS.dark,
  },
});