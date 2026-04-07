import { View, StyleSheet } from 'react-native';

export function SkeletonCard() {
  return (
    <View style={styles.container}>
      <View style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={[styles.line, { width: '80%' }]} />
        <View style={[styles.line, { width: '60%' }]} />
        <View style={styles.footer}>
          <View style={[styles.line, { width: '30%' }]} />
          <View style={[styles.line, { width: '20%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  line: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
