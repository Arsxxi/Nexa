import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  darkCard: '#27272A',
  pendingBg: '#FFF9E6',
  approvedBg: '#D1FAE5',
  approvedText: '#065F46',
  rejectedBg: '#FEE2E2',
  rejectedText: '#991B1B',
  pendingText: '#92400E',
  border: '#E4E4E7',
  searchBg: '#F0EDE8',
  pillDefault: '#F0EDE8',
};

type TabType = 'all' | 'pending' | 'approved' | 'rejected';
type SortType = 'terbaru' | 'tertua' | 'nilai_terbesar';

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

export default function RedeemAllScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ tab?: TabType }>();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.tab as TabType) || 'all');
  const [activeSort, setActiveSort] = useState<SortType>('terbaru');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useQuery(api.coins.getRedeemStats);
  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });

  useEffect(() => {
    if (searchParams.tab) {
      setActiveTab(searchParams.tab as TabType);
    }
  }, [searchParams.tab]);

  const filteredAndSorted = useMemo(() => {
    if (!allRequests) return [];

    let result = [...allRequests];

    if (activeTab !== 'all') {
      result = result.filter(r => r.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.userName.toLowerCase().includes(q) ||
        r.accountNumber.includes(q) ||
        r.userEmail.toLowerCase().includes(q)
      );
    }

    switch (activeSort) {
      case 'terbaru':
        result.sort((a, b) => b.requestedAt - a.requestedAt);
        break;
      case 'tertua':
        result.sort((a, b) => a.requestedAt - b.requestedAt);
        break;
      case 'nilai_terbesar':
        result.sort((a, b) => b.rupiahAmount - a.rupiahAmount);
        break;
    }

    return result;
  }, [allRequests, activeTab, activeSort, searchQuery]);

  const tabCounts = useMemo(() => {
    if (!allRequests) return { all: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      all: allRequests.length,
      pending: allRequests.filter((r: RedeemRequest) => r.status === 'pending').length,
      approved: allRequests.filter((r: RedeemRequest) => r.status === 'approved').length,
      rejected: allRequests.filter((r: RedeemRequest) => r.status === 'rejected').length,
    };
  }, [allRequests]);

  const renderItem = ({ item }: { item: RedeemRequest }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(admin)/redeem/${item._id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>#{item._id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.cardUsername}>@{item.userName}</Text>
      </View>

      <View style={styles.cardMiddle}>
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
        <StatusBadge status={item.status} />
      </View>
    </TouchableOpacity>
  );

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'pending', label: 'PENDING' },
    { key: 'approved', label: 'APPROVED' },
    { key: 'rejected', label: 'REJECTED' },
  ];

  const sorts: { key: SortType; label: string }[] = [
    { key: 'terbaru', label: 'TERBARU' },
    { key: 'tertua', label: 'TERTUA' },
    { key: 'nilai_terbesar', label: 'NILAI TERBESAR' },
  ];

  if (!allRequests || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
                <Text style={styles.pendingBadgeText}>{tabCounts.pending} PENDING</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
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

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.key !== 'all' && tabCounts[tab.key] > 0 && (
                <View style={[
                  styles.tabBadge,
                  tab.key === 'pending' && styles.tabBadgePending,
                  tab.key === 'rejected' && styles.tabBadgeRejected,
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    tab.key === 'pending' && styles.tabBadgePendingText,
                    tab.key === 'rejected' && styles.tabBadgeRejectedText,
                  ]}>
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              )}
              {activeTab === tab.key && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            <Text style={styles.statNumber}>{tabCounts.all}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statNumber}>{tabCounts.pending}</Text>
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
          <View style={styles.statCard}>
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
          {filteredAndSorted.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>Tidak ada request</Text>
            </View>
          ) : (
            filteredAndSorted.map((item) => (
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
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  tabsScroll: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, paddingTop: 4, backgroundColor: COLORS.card },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12, position: 'relative',
  },
  tabText: { fontSize: 12, fontWeight: '700', color: COLORS.muted, letterSpacing: 1 },
  tabTextActive: { color: COLORS.dark },
  tabBadge: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, marginLeft: 4,
  },
  tabBadgePending: { backgroundColor: COLORS.primary },
  tabBadgeRejected: { backgroundColor: COLORS.rejectedBg },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.dark },
  tabBadgePendingText: { color: COLORS.dark },
  tabBadgeRejectedText: { color: COLORS.rejectedText },
  tabDot: {
    position: 'absolute', bottom: 0, left: '50%', marginLeft: -3,
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary,
  },
  sortRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: COLORS.card,
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 1,
  },
  cardUsername: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 13, fontWeight: '700', color: COLORS.dark,
  },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCoin: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
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
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, color: COLORS.muted,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 13, color: COLORS.muted, fontWeight: '600',
  },
});