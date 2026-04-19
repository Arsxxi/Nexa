import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { ConvexClerkProvider } from '../app_providers';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedRoute = ['admin', '(admin)', 'course', 'payment'].includes(String(segments[0]));

    // Redirect unsigned users to login
    if (!isSignedIn) {
      if (inAuthGroup) {
        // Already in auth group, stay there
        return;
      }
      // Redirect to login if trying to access protected routes
      router.replace('/(auth)/login');
      return;
    }

    // Redirect signed-in users away from auth pages
    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }
  }, [isSignedIn, segments, isLoaded]);

  if (!isLoaded) {
    return <Loading />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ConvexClerkProvider>
      <AuthGuard>
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </AuthGuard>
    </ConvexClerkProvider>
  );
}