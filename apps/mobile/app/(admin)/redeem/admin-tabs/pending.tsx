import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '@convex/_generated/api';
import { StatusBadge } from '../../../../components/admin/StatusBadge';
import { Id } from '@convex/_generated/dataModel';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

const COLORS = {
  bg: '#F5F3EF',
  primary: '#FFC800',
  dark: '#18181B',
  muted: '#71717A',
  card: '#FFFFFF',
  pendingBg: '#FFF9E6',
  pendingText: '#92400E',
  border: '#E4E4E7',
  searchBg: '#F0EDE8',
  pillDefault: '#F0EDE8',
  danger: '#DC2626',
  success: '#059669',
};

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
}

export default function PendingRedeemScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<'terbaru' | 'tertua' | 'nilai_terbesar'>('terbaru');

  const stats = useQuery(api.coins.getRedeemStats);
  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });

  const pendingRequests = useMemo(() => {
    if (!allRequests) return [];
    let result = allRequests.filter((r: RedeemRequest) => r.status === 'pending');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: RedeemRequest) =>
        r.userName.toLowerCase().includes(q) ||
        r.accountNumber.includes(q) ||
        r.userEmail.toLowerCase().includes(q)
      );
    }

    switch (activeSort) {
      case 'terbaru':
        result.sort((a: RedeemRequest, b: RedeemRequest) => b.requestedAt - a.requestedAt);
        break;
      case 'tertua':
        result.sort((a: RedeemRequest, b: RedeemRequest) => a.requestedAt - b.requestedAt);
        break;
      case 'nilai_terbesar':
        result.sort((a: RedeemRequest, b: RedeemRequest) => b.rupiahAmount - a.rupiahAmount);
        break;
    }

    return result;
  }, [allRequests, searchQuery, activeSort]);

  const sorts: { key: 'terbaru' | 'tertua' | 'nilai_terbesar'; label: string }[] = [
    { key: 'terbaru', label: 'TERBARU' },
    { key: 'tertua', label: 'TERTUA' },
    { key: 'nilai_terbesar', label: 'NILAI TERBESAR' },
  ];

  const renderItem = ({ item }: { item: RedeemRequest }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/redeem/${item._id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>#{item._id.slice(-6).toUpperCase()}</Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardMiddle}>
        <Text style={styles.cardUsername}>@{item.userName}</Text>
      </View>

      <View style={styles.cardAmountRow}>
        <Text style={styles.cardCoin}>{item.coinAmount.toLocaleString('id-ID')} KOIN</Text>
        <Text style={styles.cardRupiah}>Rp {item.rupiahAmount.toLocaleString('id-ID')}</Text>
      </View>

      <View style={styles.cardBank}>
        <Text style={styles.cardBankText}>{item.bankName} · {item.accountNumber.slice(-4)}</Text>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.cardDate}>
          {new Date(item.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => router.push(`/(admin)/redeem/reject/${item._id}` as any)}
        >
          <Ionicons name="close" size={14} color={COLORS.danger} />
          <Text style={styles.rejectBtnText}>REJECT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => router.push(`/(admin)/redeem/approve/${item._id}` as any)}
        >
          <Ionicons name="checkmark" size={14} color={COLORS.dark} />
          <Text style={styles.approveBtnText}>APPROVE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!allRequests || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const pendingCount = allRequests.filter((r: RedeemRequest) => r.status === 'pending').length;

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
            <View>
              <Text style={styles.headerSubtitle}>MANAJEMEN REDEEM</Text>
              <Text style={styles.headerTitle}>REDEEM REQ.</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount} PENDING</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="CARI USERNAME ATAU NO. REKENING..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Sort Pills */}
        <View style={styles.sortRow}>
          {sorts.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortPill, activeSort === s.key && styles.sortPillActive]}
              onPress={() => setActiveSort(s.key)}
            >
              <Text style={[styles.sortPillText, activeSort === s.key && styles.sortPillTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <View style={styles.statDot} />
            <Text style={styles.statNumber}>
              {stats.totalPendingValue > 1000000
                ? `${(stats.totalPendingValue / 1000000).toFixed(1)}JT`
                : stats.totalPendingValue > 1000
                ? `${(stats.totalPendingValue / 1000).toFixed(0)}RB`
                : stats.totalPendingValue.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.statLabel}>NILAI</Text>
          </View>
        </View>

        {/* Card List */}
        <View style={styles.listContainer}>
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>Tidak ada request pending</Text>
            </View>
          ) : (
            pendingRequests.map((item: RedeemRequest) => (
              <View key={item._id}>{renderItem({ item } as any)}</View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 22, fontWeight: '800', color: COLORS.dark, letterSpacing: -0.5,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingBadge: {
    backgroundColor: COLORS.pendingBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
  },
  pendingBadgeText: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 10, fontWeight: '800', color: COLORS.pendingText, letterSpacing: 1,
  },
  searchContainer: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.searchBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    flex: 1, fontSize: 12, color: COLORS.dark, padding: 0,
  },
  sortRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.card, gap: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sortPill: {
    backgroundColor: COLORS.pillDefault,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  sortPillActive: { backgroundColor: COLORS.primary },
  sortPillText: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5,
  },
  sortPillTextActive: { color: COLORS.dark },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statCardHighlight: { backgroundColor: COLORS.pendingBg, borderColor: COLORS.primary, borderLeftWidth: 3 },
  statDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 4,
  },
  statNumber: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 18, fontWeight: '800', color: COLORS.dark, marginBottom: 2,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 9, fontWeight: '700', color: COLORS.muted, letterSpacing: 1,
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardId: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 1,
  },
  cardMiddle: { marginBottom: 8 },
  cardUsername: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 14, fontWeight: '600', color: COLORS.dark,
  },
  cardAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCoin: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 12, fontWeight: '600', color: COLORS.muted,
  },
  cardRupiah: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 14, fontWeight: '800', color: COLORS.dark,
  },
  cardBank: { marginBottom: 8 },
  cardBankText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, color: COLORS.muted,
  },
  cardBottom: { marginBottom: 12 },
  cardDate: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, color: COLORS.muted,
  },
  actionRow: {
    flexDirection: 'row', gap: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12,
  },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.danger, borderRadius: 8,
    paddingVertical: 10, gap: 6,
  },
  rejectBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 11, fontWeight: '800', color: COLORS.danger, letterSpacing: 0.5,
  },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, gap: 6,
  },
  approveBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 11, fontWeight: '800', color: COLORS.dark, letterSpacing: 0.5,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 13, color: COLORS.muted, fontWeight: '600',
  },
});