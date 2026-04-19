import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

export default function RejectModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  // Get the specific request
  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r) => r._id === id);
  const processRedeem = useMutation(api.coins.processRedeem);

  const reasons = [
    'Rekening tidak valid',
    'Data tidak lengkap',
    'Batas harian tercapai',
  ];

  const handleReject = async () => {
    if (!request) return;

    const rejectionReason = selectedReason || customReason;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await processRedeem({
        redeemId: request._id,
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      });
      Alert.alert('Success', 'Redeem request rejected successfully');
      router.back();
      router.back(); // Go back to the list
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.sheet}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>⚠</Text>
          </View>
          <View>
            <Text style={styles.title}>REJECT?</Text>
            <Text style={styles.subTitle}>REQ #{request._id.slice(-8)} ACTION REQUIRED</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>QUICK SELECT REASON</Text>
        <View style={styles.pillRow}>
          {reasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonPill, selectedReason === reason && styles.reasonPillSelected]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                {reason.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ALASAN PENOLAKAN</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Provide specific details for rejection..."
          placeholderTextColor="#A1A1AA"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={customReason}
          onChangeText={setCustomReason}
        />

        <TouchableOpacity style={styles.btnConfirm} onPress={handleReject}>
          <Text style={styles.btnConfirmText}>✕ KONFIRMASI REJECT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()}>
          <Text style={styles.btnCancelText}>BATAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#E4E4E7', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  iconBox: { width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#18181B' },
  subTitle: { fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 1, marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  reasonPill: { backgroundColor: '#F4F4F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  reasonPillSelected: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  reasonText: { fontSize: 10, fontWeight: '600', color: '#3F3F46', letterSpacing: 0.5 },
  reasonTextSelected: { color: '#DC2626' },
  textArea: { backgroundColor: '#F4F4F5', borderRadius: 8, padding: 16, fontSize: 14, minHeight: 100, marginBottom: 32 },
  btnConfirm: { backgroundColor: '#B91C1C', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  btnConfirmText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  btnCancel: { paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { color: '#71717A', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  loadingText: { fontSize: 16, color: '#6b7280', textAlign: 'center', padding: 20 },
});
