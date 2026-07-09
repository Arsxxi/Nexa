import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#F5F3EF',
  primary: '#FFC800',
  dark: '#18181B',
  muted: '#71717A',
  card: '#FFFFFF',
  border: '#E4E4E7',
};

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <Ionicons
          name={icon as any}
          size={22}
          color={focused ? COLORS.primary : '#9ca3af'}
        />
      </View>
      {focused && (
        <View style={styles.dotContainer}>
          <View style={styles.dotGlow} />
        </View>
      )}
    </View>
  );
}

function Unauthorized() {
  return (
    <View style={styles.unauthorized}>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>You don&apos;t have permission to access this area.</Text>
    </View>
  );
}

export default function AdminLayout() {
  const userData = useQuery(api.users.getCurrentUser);

  if (!userData) {
    return <Loading />;
  }

  if (userData.role !== 'admin') {
    return <Unauthorized />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="redeem"
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="redeem/[id]"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="redeem/approve/[id]"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="redeem/reject/[id]"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  unauthorized: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
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
    backgroundColor: COLORS.primary,
  },
});