import 'react-native-get-random-values';

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
  const [fontsLoaded, error] = useFonts(FONT_FILES);
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const userData = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (!isLoaded || userData === undefined || !fontsLoaded) return;

    // 1. Cek folder group saat ini
    const inAuthGroup = pathname.startsWith('/(auth)');
    const inTabsGroup = pathname.startsWith('/(tabs)');
    const inAdminGroup = pathname.startsWith('/(admin)');

    // 2. Jika BELUM login, paksa ke login (kecuali sudah di sana)
    if (!isSignedIn) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } 
    // 3. Jika SUDAH login
    else {
      const role = userData?.role ?? 'user';
      
      // Jika user sudah di halaman login/register tapi sudah punya session, pindahkan
      if (inAuthGroup) {
        if (role === 'admin') {
          router.replace('/(admin)/redeem');
        } else {
          router.replace('/(tabs)');
        }
      }
      
      // Proteksi Role (Admin tidak boleh ke tabs user, dan sebaliknya)
      if (role === 'admin' && inTabsGroup) {
        router.replace('/(admin)/redeem');
      } else if (role === 'user' && inAdminGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isSignedIn, isLoaded, userData, fontsLoaded, pathname]); // Hapus navigasi manual jika sudah di rute yang benar

  if (!fontsLoaded || !isLoaded || userData === undefined) {
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