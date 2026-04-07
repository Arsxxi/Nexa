import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CoinBadgeProps {
  coins: number;
  size?: 'small' | 'medium' | 'large';
}

export function CoinBadge({ coins, size = 'small' }: CoinBadgeProps) {
  const sizeConfig = {
    small: { iconSize: 16, fontSize: 14, padding: 6 },
    medium: { iconSize: 24, fontSize: 20, padding: 10 },
    large: { iconSize: 32, fontSize: 28, padding: 14 },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, { padding: config.padding }]}>
      <Ionicons name="diamond" size={config.iconSize} color="#f59e0b" />
      <Text style={[styles.text, { fontSize: config.fontSize }]}>{coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: 'bold',
    color: '#92400e',
  },
});
