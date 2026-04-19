import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoin } from '@/hooks/useCoin';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

type FilterType = 'SEMUA' | 'MASUK' | 'KELUAR';

export default function WalletTabScreen() {
  const router = useRouter();
  const { balance, transactions, loading } = useCoin();
  const [filter, setFilter] = useState<FilterType>('SEMUA');
  const resetCoinBalance = useMutation(api.coins.resetCoinBalance);

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleResetBalance = async () => {
    Alert.alert(
      'Reset Saldo',
      'Apakah Anda yakin ingin mereset saldo koin menjadi 0? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetCoinBalance();
              Alert.alert('Berhasil', 'Saldo koin telah direset menjadi 0');
            } catch (error) {
              Alert.alert('Error', 'Gagal mereset saldo');
            }
          },
        },
      ]
    );
  };

  const filteredTransactions = transactions?.filter((tx) => {
    if (filter === 'MASUK') return ['course_complete', 'quiz_bonus', 'streak_bonus'].includes(tx.type);
    if (filter === 'KELUAR') return ['redeem', 'expired'].includes(tx.type);
    return true;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const currentBalance = balance || 0;
  const fiatEquivalent = currentBalance * 10;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.walletCard}>
        <Text style={styles.cardSubtitle}>SALDO KOIN • NEXA WALLET</Text>
        <Text style={styles.balanceText}>{formatNumber(currentBalance)}</Text>
        <Text style={styles.fiatText}>≈ Rp {formatNumber(fiatEquivalent)}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.redeemBtn} onPress={() => router.push('/wallet/redeem')}>
            <Text style={styles.redeemBtnText}>REDEEM</Text>
            <Ionicons name="arrow-forward" size={16} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>RIWAYAT</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetBalance}>
          <Text style={styles.resetBtnText}>Reset Saldo (Debug)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>KURS KONVERSI</Text>
      <View style={styles.conversionBox}>
        <View style={styles.conversionIconWrapper}>
          <Ionicons name="sync" size={20} color="#854d0e" />
        </View>
        <View style={styles.conversionContent}>
          <Text style={styles.conversionCoin}>100 KOIN</Text>
          <Text style={styles.conversionEquals}>=</Text>
          <Text style={styles.conversionFiat}>Rp 1.000</Text>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <View style={styles.bulletIcon} />
        <Text style={styles.historyTitle}>RIWAYAT TRANSAKSI</Text>
      </View>

      <View style={styles.filterRow}>
        {(['SEMUA', 'MASUK', 'KELUAR'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f && styles.filterChipTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.transactionList}>
        {filteredTransactions?.map((tx) => {
          const isEarn = ['course_complete', 'quiz_bonus', 'streak_bonus'].includes(tx.type);
          return (
            <View key={tx._id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View style={styles.transactionIconWrapper}>
                  <Ionicons
                    name={isEarn ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={isEarn ? '#10b981' : '#ef4444'}
                  />
                </View>
                <View style={styles.transactionTextGroup}>
                  <Text style={styles.transactionDesc}>{tx.note}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                styles.transactionAmount,
                isEarn ? styles.textEarn : styles.textSpend,
              ]}
              >
                {isEarn ? '+' : '-'}{tx.amount}
              </Text>
            </View>
          );
        })}

        {filteredTransactions?.length === 0 && (
          <Text style={styles.emptyText}>Belum ada transaksi.</Text>
        )}
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  walletCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceText: {
    color: '#FFC700',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  fiatText: {
    color: '#E4E4E7',
    fontSize: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  redeemBtn: {
    backgroundColor: '#FFC700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  redeemBtnText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyBtn: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  historyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resetBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetBtnText: {
    color: '#71717A',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  sectionLabel: {
    fontSize: 12,
    color: '#71717A',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 12,
  },
  conversionBox: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  conversionIconWrapper: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  conversionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversionCoin: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181B',
  },
  conversionEquals: {
    marginHorizontal: 16,
    fontSize: 16,
    color: '#A1A1AA',
  },
  conversionFiat: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181B',
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulletIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#A16207',
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181B',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    backgroundColor: '#F4F4F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#18181B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    padding: 16,
    borderRadius: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIconWrapper: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTextGroup: {
    gap: 4,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#18181B',
  },
  transactionDate: {
    fontSize: 12,
    color: '#71717A',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textEarn: {
    color: '#10B981',
  },
  textSpend: {
    color: '#DC2626',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A1A1AA',
    marginTop: 20,
    fontStyle: 'italic',
  },
});