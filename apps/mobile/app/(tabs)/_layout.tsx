import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TAB_ICONS = {
  index: 'home',
  'my-courses': 'book',
  wallet: 'wallet',
  profile: 'person',
};

const DOT_ACTIVE = require('../../assets/images/dot_state.png');

function TabBarIcon({ focused, routeName }: { focused: boolean; routeName: string }) {
  const iconName = TAB_ICONS[routeName as keyof typeof TAB_ICONS] || 'help-circle';
  
  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <Ionicons 
          name={iconName as any} 
          size={22} 
          color={focused ? '#FFC800' : '#9ca3af'} 
        />
      </View>
      
      {focused && (
        <View style={styles.dotContainer}>
          <View style={styles.dotGlow}>
            {/* Using View as placeholder for dot - actual image requires native */}
          </View>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 55,
          paddingBottom: 8,
          backgroundColor: '#fff',
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} routeName="index" />,
        }}
      />
      <Tabs.Screen
        name="my-courses"
        options={{
          title: 'My Courses',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} routeName="my-courses" />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} routeName="wallet" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} routeName="profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    position: 'relative',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC800',
  },
});