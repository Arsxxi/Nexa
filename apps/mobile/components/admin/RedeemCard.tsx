import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBadge } from './StatusBadge';

type RedeemCardProps = {
  data: any;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPress?: () => void;
};

export function RedeemCard({ data, showActions, onApprove, onReject, onPress }: RedeemCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
      {/* Header Card */}
      <View style={styles.header}>
        <Text style={styles.idText}>ID: {data.id}</Text>
        {!showActions && <StatusBadge status={data.status} />}
        {showActions && <StatusBadge status="PENDING" />}
      </View>

      {/* User & Info */}
      <View style={styles.userRow}>
        <Text style={styles.username}>{data.username}</Text>
      </View>

      {/* Koin -> Rupiah */}
      <View style={styles.amountRow}>
        <Text style={styles.coinText}>🪙 {data.coin} KOIN</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.rupiahText}>{data.rupiah}</Text>
      </View>

      {/* Bank Info */}
      <View style={styles.bankRow}>
        <Text style={styles.bankText}>🏦 {data.bank} · {data.rekening} · {data.nama}</Text>
      </View>

      <Text style={styles.dateText}>{data.date}</Text>

      {/* Actions (Muncul di tab Pending) */}
      {showActions && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnApprove} onPress={onApprove}>
            <Text style={styles.btnApproveText}>✓ APPROVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnReject} onPress={onReject}>
            <Text style={styles.btnRejectText}>✕ REJECT</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: 1,
  },
  userRow: { marginBottom: 12 },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  arrow: {
    marginHorizontal: 8,
    color: '#A1A1AA',
  },
  rupiahText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  bankRow: {
    backgroundColor: '#F4F4F5',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  bankText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3F3F46',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  btnApprove: {
    flex: 1,
    backgroundColor: '#FFC800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnApproveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: 1,
  },
  btnReject: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnRejectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 1,
  },
});