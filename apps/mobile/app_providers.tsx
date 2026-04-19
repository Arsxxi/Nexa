import { useState, useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import * as SecureStore from 'expo-secure-store';

const CONVEX_URL = 'https://limitless-ermine-877.convex.cloud';
const CLERK_KEY = 'pk_test_Y3J1Y2lhbC1pbnNlY3QtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA';

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
  
  if (!isLoaded) {
    return null;
  }
  
  return <>{children}</>;
}

export function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [hasWindow, setHasWindow] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasWindow(true);
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthGuard>
          {children}
        </AuthGuard>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}