import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CoinBadge } from '@/components/CoinBadge';

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Replace with Convex query
    setBalance(150);
    setTransactions([
      { id: '1', type: 'earn', amount: 50, description: 'Completed lesson', date: '2024-01-15' },
      { id: '2', type: 'earn', amount: 100, description: 'Daily streak bonus', date: '2024-01-14' },
      { id: '3', type: 'spend', amount: 30, description: 'Premium course discount', date: '2024-01-13' },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Coin Balance</Text>
        <CoinBadge coins={balance} size="large" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Ionicons
                name={tx.type === 'earn' ? 'arrow-up' : 'arrow-down'}
                size={20}
                color={tx.type === 'earn' ? '#10b981' : '#ef4444'}
              />
              <View style={styles.transactionText}>
                <Text style={styles.transactionDesc}>{tx.description}</Text>
                <Text style={styles.transactionDate}>{tx.date}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                tx.type === 'earn' ? styles.earn : styles.spend,
              ]}
            >
              {tx.type === 'earn' ? '+' : '-'}{tx.amount}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.redeemButton}>
        <Text style={styles.redeemButtonText}>Redeem Coins</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionText: {
    gap: 2,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  earn: {
    color: '#10b981',
  },
  spend: {
    color: '#ef4444',
  },
  redeemButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
