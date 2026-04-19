import { View, Text, StyleSheet } from 'react-native';

export function StatsBar() {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.label}>TOTAL REQ</Text>
        <Text style={styles.value}>36</Text>
      </View>
      <View style={[styles.box, styles.boxActive]}>
        <Text style={styles.label}>PENDING</Text>
        <Text style={styles.value}>12</Text>
        <View style={styles.dot} />
      </View>
      <View style={styles.box}>
        <Text style={styles.label}>NILAI EST</Text>
        <Text style={styles.value}>1.2JT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  box: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  boxActive: {
    backgroundColor: '#FAF5E3', // Sedikit kekuningan untuk highlight
    borderColor: '#FDE047',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '500',
    color: '#18181B',
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
});