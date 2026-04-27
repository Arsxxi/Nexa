import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FFC800',
  border: '#E4E4E7',
  card: '#FFFFFF',
};

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon as any} size={22} color={focused ? COLORS.primary : '#9ca3af'} />
      </View>
      {focused && (
        <View style={styles.dotContainer}>
          <View style={styles.dotGlow} />
        </View>
      )}
    </View>
  );
}

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: COLORS.border, height: 55, paddingBottom: 8, backgroundColor: COLORS.card },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'All', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'list' : 'list-outline'} /> }}
      />
      <Tabs.Screen
        name="pending"
        options={{ title: 'Pending', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'time' : 'time-outline'} /> }}
      />
      <Tabs.Screen
        name="admin-profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? 'person' : 'person-outline'} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, position: 'relative' },
  iconWrapper: { alignItems: 'center', justifyContent: 'center' },
  dotContainer: { position: 'absolute', bottom: 0, alignItems: 'center', justifyContent: 'center' },
  dotGlow: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
});