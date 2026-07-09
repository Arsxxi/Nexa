import { View, Text, StyleSheet } from 'react-native';

export function StatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'pending' | 'approved' | 'rejected' }) {
  const normalized = status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED';
  const getStyle = () => {
    switch (normalized) {
      case 'APPROVED': return { bg: '#D1FAE5', text: '#065F46' };
      case 'REJECTED': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#FFF9E6', text: '#92400E' };
    }
  };
  const { bg, text } = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{normalized}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});