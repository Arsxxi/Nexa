import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { StatusBadge } from '../../components/admin/StatusBadge';

interface RedeemRequest {
  _id: Id<'redeemRequests'>;
  userId: Id<'users'>;
  userName: string;
  userEmail: string;
  coinAmount: number;
  rupiahAmount: number;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  rejectionReason?: string;
  disburseReference?: string;
  disburseStatus?: string;
  disburseError?: string;
}

type TabType = 'all' | 'pending' | 'approved' | 'rejected';

export default function RedeemAdminScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const stats = useQuery(api.coins.getRedeemStats);
  const allRequests = useQuery(api.coins.getAllRedeems, { status: activeTab === 'all' ? 'all' : activeTab });
  const processRedeem = useMutation(api.coins.processRedeem);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getTabCount = (tab: TabType) => {
    if (!allRequests) return 0;
    if (tab === 'all') return allRequests.length;
    return allRequests.filter(r => r.status === tab).length;
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
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.userEmail}>{item.userEmail}</Text>
        </View>
        <StatusBadge status={item.status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED'} />
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
          {item.bankName} - {item.accountNumber} ({item.accountHolderName})
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

      {item.rejectionReason && (
        <View style={styles.rejectionReason}>
          <Ionicons name="information-circle" size={16} color="#ef4444" />
          <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => router.push(`/redeem/${item._id}`)}
      >
        <Ionicons name="eye" size={16} color="#6366f1" />
        <Text style={styles.detailButtonText}>Lihat Detail</Text>
      </TouchableOpacity>

      {item.status === 'pending' && (
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
      )}
    </View>
  );

  const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'pending', label: 'Pending', icon: 'time' },
    { key: 'approved', label: 'Approved', icon: 'checkmark-circle' },
    { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
  ];

  if (!allRequests || !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRequests || 0}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPending || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Rp {(stats.totalPendingValue || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending Value</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon} size={18} color={activeTab === tab.key ? '#FFC800' : '#A1A1AA'} />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {getTabCount(tab.key) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{getTabCount(tab.key)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={allRequests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No requests found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  statLabel: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomColor: '#FFC800',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  activeTabLabel: {
    color: '#18181B',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#FFC800',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#18181B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  userEmail: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  amountItem: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 4,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bankText: {
    fontSize: 12,
    color: '#3F3F46',
    fontWeight: '500',
    flex: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#71717A',
  },
  rejectionReason: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  rejectionText: {
    fontSize: 12,
    color: '#7F1D1D',
    fontWeight: '500',
    flex: 1,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 12,
    gap: 6,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
});
