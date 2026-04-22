import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConvexClerkProvider } from '../app_providers';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';

const FONT_FILES = {
  'SpaceGrotesk-Bold': require('../assets/Fonts/SpaceGrotesk-Bold.ttf'),
  'nimbus-mono.regular': require('../assets/Fonts/nimbus-mono.regular.otf'),
  'LiberationSans-Regular': require('../assets/Fonts/LiberationSans-Regular.ttf'),
};

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
      <ActivityIndicator size="large" color="#FFC800" />
    </View>
  );
}

function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsError, setFontsError] = useState(false);
  const [fontsLoaded, error] = useFonts(FONT_FILES);

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      setFontsError(true);
    }
  }, [error]);

  if (fontsError || (!fontsLoaded && !error)) {
    return <Loading />;
  }
  
  return <>{children}</>;
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FontLoader>
        <ConvexClerkProvider>
          <AuthGuard>
            <View style={{ flex: 1 }}>
              <Slot />
            </View>
          </AuthGuard>
        </ConvexClerkProvider>
      </FontLoader>
    </GestureHandlerRootView>
  );
}