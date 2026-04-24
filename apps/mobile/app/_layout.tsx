import { Slot, useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConvexClerkProvider } from '../app_providers';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState, useRef } from 'react';
import { useFonts } from 'expo-font';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

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

function AppShell() {
  const [fontsError, setFontsError] = useState(false);
  const [fontsLoaded, error] = useFonts(FONT_FILES);
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const userData = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      setFontsError(true);
    }
  }, [error]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      if (!pathname.startsWith('/(auth)')) {
        router.replace('/(auth)/login');
      }
      hasRedirectedRef.current = false;
      return;
    }

    if (isSignedIn && !hasRedirectedRef.current && userData !== undefined) {
      hasRedirectedRef.current = true;
      const role = userData?.role ?? 'user';
      if (role === 'admin') {
        router.replace('/(admin)/redeem');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isSignedIn, pathname, isLoaded, userData]);

  if ((!fontsLoaded && !fontsError) || !isLoaded) {
    return <Loading />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexClerkProvider>
        <AppShell />
      </ConvexClerkProvider>
    </GestureHandlerRootView>
  );
}