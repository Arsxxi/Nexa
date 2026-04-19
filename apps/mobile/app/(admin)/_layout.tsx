import { Stack } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

export default function AdminLayout() {
  const userData = useQuery(api.users.getCurrentUser);

  if (!userData) {
    return <Loading />;
  }

  if (userData.role !== 'admin') {
    return (
      <View style={styles.unauthorized}>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>You don't have permission to access this area.</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="redeem" />
      <Stack.Screen name="redeem/[id]" />
      <Stack.Screen name="redeem/approve/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="redeem/reject/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
