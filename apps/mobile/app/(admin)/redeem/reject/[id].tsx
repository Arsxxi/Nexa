import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

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
  dangerBg: '#FEE2E2',
  dangerText: '#991B1B',
  pillDefault: '#F0EDE8',
};

const QUICK_REASONS = [
  'REKENING TIDAK VALID',
  'DATA TIDAK LENGKAP',
  'BATAS HARIAN TERCAPAI',
];

export default function RejectModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r: any) => r._id === id);
  const processRedeem = useAction(api.coins.processRedeem);

  const handleReject = async () => {
    if (!request) return;
    const rejectionReason = selectedReason || customReason;
    if (!rejectionReason.trim()) return;

    try {
      await processRedeem({
        redeemId: request._id,
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      router.back();
    } catch (error: any) {
      console.error('Reject error:', error);
      Alert.alert('Error', error.message || 'Gagal menolak request. Silakan coba lagi.');
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeArea} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
          </View>
          <View>
            <Text style={styles.title}>REJECT?</Text>
            <Text style={styles.subtitle}>REQ #{request._id.slice(-6).toUpperCase()} ACTION REQUIRED</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pillContainer}>
          {QUICK_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonPill, isSelected && styles.reasonPillSelected]}
                onPress={() => {
                  setSelectedReason(isSelected ? '' : reason);
                  setCustomReason('');
                }}
              >
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>ALASAN PENOLAKAN</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Provide specific details for rejection..."
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={customReason}
          onChangeText={(text) => {
            setCustomReason(text);
            setSelectedReason('');
          }}
        />

        <TouchableOpacity
          style={[styles.rejectBtn, !selectedReason && !customReason.trim() && styles.rejectBtnDisabled]}
          onPress={handleReject}
          disabled={!selectedReason && !customReason.trim()}
        >
          <Text style={styles.rejectBtnText}>✕ KONFIRMASI REJECT</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.danger,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  pillScroll: {
    marginBottom: 16,
  },
  pillContainer: {
    gap: 8,
    paddingRight: 16,
  },
  reasonPill: {
    backgroundColor: COLORS.pillDefault,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reasonPillSelected: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  reasonText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  reasonTextSelected: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
  textArea: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    backgroundColor: COLORS.pillDefault,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: COLORS.dark,
    minHeight: 100,
    marginBottom: 24,
  },
  rejectBtn: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectBtnDisabled: {
    opacity: 0.5,
  },
  rejectBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    padding: 20,
  },
});