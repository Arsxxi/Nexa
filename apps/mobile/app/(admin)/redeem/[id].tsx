import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { StatusBadge } from '../../../components/admin/StatusBadge';

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
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r: any) => r._id === id);

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' · ' + new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const rows = [
    { label: 'USER ID', value: `USR-${request.userId.slice(-6).toUpperCase()}` },
    { label: 'KOIN', value: `${request.coinAmount.toLocaleString('id-ID')}` },
    { label: 'NOMINAL', value: `Rp ${request.rupiahAmount.toLocaleString('id-ID')}` },
    { label: 'BANK', value: request.bankName },
    { label: 'NO. REKENING', value: request.accountNumber },
    { label: 'NAMA REK', value: request.accountHolderName },
    { label: 'TGL REQUEST', value: formatDate(request.requestedAt) },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeArea} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.reqLabel}>DETAIL REQUEST · #{request._id.slice(-6).toUpperCase()}</Text>

        <View style={styles.usernameSection}>
          <Text style={styles.username}>@{request.userName}</Text>
          <StatusBadge status={request.status as any} />
        </View>

        <View style={styles.darkCard}>
          {rows.map((row, i) => (
            <View key={i} style={styles.darkRow}>
              <Text style={styles.darkLabel}>{row.label}</Text>
              <Text style={[styles.darkValue, row.label === 'TGL REQUEST' && styles.darkValueMuted]}>
                {row.value}
              </Text>
            </View>
          ))}
          {request.status === 'rejected' && request.rejectionReason && (
            <View style={styles.darkRow}>
              <Text style={styles.darkLabel}>ALASAN</Text>
              <Text style={[styles.darkValue, styles.darkValueMuted]}>{request.rejectionReason}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.tutupBtn} onPress={() => router.back()}>
          <Text style={styles.tutupBtnText}>TUTUP</Text>
        </TouchableOpacity>

        {request.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => router.push(`/(admin)/redeem/reject/${request._id}` as any)}
            >
              <Text style={styles.rejectBtnText}>✕ REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => router.push(`/(admin)/redeem/approve/${request._id}` as any)}
            >
              <Text style={styles.approveBtnText}>✓ APPROVE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  closeArea: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  reqLabel: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 2,
    marginBottom: 12, textAlign: 'center',
  },
  usernameSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20,
  },
  username: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 18, fontWeight: '800', color: COLORS.dark,
  },
  darkCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  darkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#3f3f46',
  },
  darkLabel: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 1,
  },
  darkValue: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 12, fontWeight: '700', color: COLORS.primary,
  },
  darkValueMuted: { color: '#A1A1AA', fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadingText: { fontSize: 16, color: COLORS.muted },
  tutupBtn: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  tutupBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 1,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.danger, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  rejectBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '800', color: COLORS.danger, letterSpacing: 1,
  },
  approveBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  approveBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 1,
  },
});