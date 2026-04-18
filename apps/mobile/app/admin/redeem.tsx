import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface RedeemRequest {
  _id: string;
  userId: string;
  coinAmount: number;
  rupiahAmount: number;
  bankAccount: string;
  bankName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  userName?: string;
  userEmail?: string;
}

export default function RedeemAdminScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const pendingRequests = useQuery(api.coins.getAllPendingRedeems);
  const processRedeem = useMutation(api.coins.processRedeem);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleApprove = async (request: RedeemRequest) => {
    Alert.alert(
      'Approve Request',
      `Approve redemption of ${request.coinAmount.toLocaleString()} coin to ${request.bankName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await processRedeem({ redeemId: request._id, status: 'approved' });
              Alert.alert('Success', 'Redeem request approved');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (request: RedeemRequest) => {
    Alert.alert(
      'Reject Request',
      `Reject redemption of ${request.coinAmount.toLocaleString()} coin? Coin will be returned to user.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await processRedeem({ redeemId: request._id, status: 'rejected' });
              Alert.alert('Success', 'Redeem request rejected');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: RedeemRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.userName || 'User'}</Text>
          <Text style={styles.userEmail}>{item.userEmail || item.userId}</Text>
        </View>
        <View style={[styles.statusBadge, styles.pendingBadge]}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Coin</Text>
          <Text style={styles.amountValue}>{item.coinAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Rupiah</Text>
          <Text style={styles.amountValue}>Rp {item.rupiahAmount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.bankInfo}>
        <Ionicons name="card" size={16} color="#6b7280" />
        <Text style={styles.bankText}>
          {item.bankName} - {item.bankAccount}
        </Text>
      </View>

      <View style={styles.dateInfo}>
        <Ionicons name="time" size={16} color="#6b7280" />
        <Text style={styles.dateText}>
          {new Date(item.requestedAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item)}
        >
          <Ionicons name="close" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Redemption Requests</Text>
        <Text style={styles.subtitle}>
          {pendingRequests?.length || 0} pending request(s)
        </Text>
      </View>

      {!pendingRequests ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : pendingRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySubtext}>All redemption requests have been processed</Text>
        </View>
      ) : (
        <FlatList
          data={pendingRequests as RedeemRequest[]}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bankText: {
    fontSize: 14,
    color: '#374151',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});