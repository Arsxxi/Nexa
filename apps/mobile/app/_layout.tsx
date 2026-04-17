import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';

function getEnv(key: string, fallback: string): string {
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key] as string;
  }
  return fallback;
}

const CONVEX_URL = getEnv('CONVEX_URL', 'https://limitless-ermine-877.convex.cloud');
const CLERK_KEY = getEnv('CLERK_PUBLISHABLE_KEY', 'pk_test_Y3J1Y2lhbC1pbnNlY3QtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA');

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded]);

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [clerkKey] = useState(() => getEnv('CLERK_PUBLISHABLE_KEY', 'pk_test_Y3J1Y2lhbC1pbnNlY3QtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA'));
  
  return (
    <ClerkProvider
      publishableKey={clerkKey}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
