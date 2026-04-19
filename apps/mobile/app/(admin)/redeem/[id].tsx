import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { StatusBadge } from '../../../components/admin/StatusBadge';

interface RedeemRequest {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  coinAmount: number;
  rupiahAmount: number;
  bankAccount: string;
  bankName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  rejectionReason?: string;
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Get all redeems and find the specific one
  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r: RedeemRequest) => r._id === id);

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETAIL REQUEST</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info ID & Status */}
        <View style={styles.topSection}>
          <Text style={styles.reqId}>#{request._id.slice(-8)}</Text>
          <StatusBadge status={request.status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED'} />
        </View>

        {/* User Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>USER INFO</Text>
          <View style={styles.row}>
            <View style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{request.userName}</Text>
              <Text style={styles.userEmail}>{request.userEmail}</Text>
            </View>
          </View>
        </View>

        {/* Redeem Detail */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>REDEEM DETAIL</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.detailTitle}>Koin Ditukar</Text>
            <Text style={styles.detailValue}>🪙 {request.coinAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.detailTitle}>Nilai Rupiah</Text>
            <Text style={[styles.detailValue, { color: '#059669' }]}>Rp {request.rupiahAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Bank Info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TUJUAN TRANSFER</Text>
          <View style={styles.bankBox}>
            <Text style={styles.bankName}>{request.bankName}</Text>
            <Text style={styles.bankRekening}>{request.bankAccount}</Text>
            <Text style={styles.bankOwner}>A.N. {request.userName.toUpperCase()}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TIMELINE</Text>
          <Text style={styles.timelineText}>
            • {new Date(request.requestedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} - Request Dibuat
          </Text>
          {request.processedAt && (
            <Text style={styles.timelineText}>
              • {new Date(request.processedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })} - Diperbarui ke {request.status.toUpperCase()}
            </Text>
          )}
          {request.rejectionReason && (
            <Text style={styles.timelineText}>
              Alasan: {request.rejectionReason}
            </Text>
          )}
        </View>

      </ScrollView>

      {/* Floating Actions (Hanya muncul jika Pending) */}
      {request.status === 'pending' && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={() => router.push(`/redeem/reject/${id}`)}
          >
            <Text style={[styles.actionText, { color: '#991B1B' }]}>✕ REJECT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FFC800' }]}
            onPress={() => router.push(`/redeem/approve/${id}`)}
          >
            <Text style={styles.actionText}>✓ APPROVE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E4E4E7'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 2, color: '#18181B' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  reqId: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280' },
  
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E4E4E7', marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#A1A1AA', letterSpacing: 1.5, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F4F5', marginRight: 12 },
  userName: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  userEmail: { fontSize: 12, color: '#71717A' },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  detailValue: { fontSize: 16, fontWeight: '800', color: '#18181B' },
  divider: { height: 1, backgroundColor: '#F4F4F5', marginVertical: 12 },
  
  bankBox: { backgroundColor: '#F4F4F5', padding: 12, borderRadius: 8 },
  bankName: { fontSize: 12, fontWeight: '700', color: '#3F3F46', marginBottom: 4 },
  bankRekening: { fontSize: 18, fontWeight: '800', color: '#18181B', letterSpacing: 1, marginBottom: 4 },
  bankOwner: { fontSize: 11, fontWeight: '600', color: '#71717A' },
  
  timelineText: { fontSize: 12, color: '#3F3F46', marginBottom: 8, fontWeight: '500' },

  bottomActions: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    flexDirection: 'row', padding: 24, backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, borderTopColor: '#E4E4E7', gap: 12 
  },
  actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#18181B' },
});
