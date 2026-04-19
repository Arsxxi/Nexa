import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function ApproveModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get the specific request
  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r) => r._id === id);
  const processRedeem = useMutation(api.coins.processRedeem);

  const handleApprove = async () => {
    if (!request) return;

    try {
      await processRedeem({ redeemId: request._id, status: 'approved' });
      Alert.alert('Success', 'Redeem request approved successfully');
      router.back();
      router.back(); // Go back to the list
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve request');
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
            <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 18 }}>✓</Text>
          </View>
          <View>
            <Text style={styles.title}>APPROVE?</Text>
            <Text style={styles.subTitle}>REQ #{request._id.slice(-8)} ACTION REQUIRED</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>RINGKASAN REQUEST</Text>
          <Text style={styles.summaryValueBig}>{request.userName}</Text>
          <Text style={styles.summaryValueSmall}>{request.coinAmount.toLocaleString()} coin → Rp {request.rupiahAmount.toLocaleString()}</Text>

          <View style={styles.divider} />

          <Text style={styles.summaryLabel}>TUJUAN TRANSFER</Text>
          <Text style={styles.summaryDetail}>BANK: {request.bankName}</Text>
          <Text style={styles.summaryDetail}>NO. REK: {request.bankAccount}</Text>
          <Text style={styles.summaryDetail}>NAMA: {request.userName.toUpperCase()}</Text>
        </View>

        <TouchableOpacity style={styles.btnConfirm} onPress={handleApprove}>
          <Text style={styles.btnConfirmText}>✓ APPROVE SEKARANG</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 40, height: 40, backgroundColor: '#D1FAE5', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#18181B' },
  subTitle: { fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 1 },
  
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 32,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 1, marginBottom: 8 },
  summaryValueBig: { fontSize: 18, fontWeight: '800', color: '#18181B', marginBottom: 4 },
  summaryValueSmall: { fontSize: 14, color: '#059669', fontWeight: '600', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E4E4E7', marginBottom: 16 },
  summaryDetail: { fontSize: 12, fontWeight: '600', color: '#3F3F46', marginBottom: 6 },
  loadingText: { fontSize: 16, color: '#6b7280', textAlign: 'center', padding: 20 },

  btnConfirm: { backgroundColor: '#FFC800', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  btnConfirmText: { color: '#18181B', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  btnCancel: { paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { color: '#71717A', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
