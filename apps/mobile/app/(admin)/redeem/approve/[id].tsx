import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

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
  success: '#059669',
};

export default function ApproveModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r: any) => r._id === id);
  const processRedeem = useMutation(api.coins.processRedeem);

  const handleApprove = async () => {
    if (!request) return;
    try {
      await processRedeem({ redeemId: request._id, status: 'approved' });
      router.back();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  const formattedAccount = request.accountNumber.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeArea} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>APPROVE?</Text>
        <Text style={styles.subtitle}>CONFIRM REDEEM TRANSACTION</Text>

        <View style={styles.darkCard}>
          <View style={styles.darkRow}>
            <Text style={styles.darkLabel}>REQUESTER</Text>
            <Text style={styles.darkValue}>@{request.userName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.darkRow}>
            <Text style={styles.darkLabel}>REQUESTED KOIN</Text>
            <Text style={[styles.darkValue, styles.darkValuePrimary]}>{request.coinAmount.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.darkRow}>
            <Text style={styles.darkLabel}>NOMINAL OUTPUT</Text>
            <Text style={[styles.darkValue, styles.darkValuePrimary]}>Rp {request.rupiahAmount.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.darkRow}>
            <Text style={styles.darkLabel}>BANK DESTINATION</Text>
            <Text style={[styles.darkValue, styles.darkValuePrimary]}>{request.bankName} ({request.bankCode})</Text>
          </View>
          <View style={styles.darkRow}>
            <Text style={styles.darkLabel}>REKENING / ACCOUNT NUMBER</Text>
            <Text style={[styles.darkValue, styles.darkValuePrimary]}>{formattedAccount}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
          <Text style={styles.approveBtnText}>✓ APPROVE SEKARANG</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>BATAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: 24,
  },
  darkCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  darkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  darkLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 1,
  },
  darkValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.card,
    textAlign: 'right',
  },
  darkValuePrimary: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#3f3f46',
    marginVertical: 8,
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: 1,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
  },
});