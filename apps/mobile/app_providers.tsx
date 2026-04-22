import { ReactNode } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { ActivityIndicator, View } from 'react-native';

const CONVEX_URL = 'https://limitless-ermine-877.convex.cloud';
const CLERK_KEY = 'pk_test_Y3J1Y2lhbC1pbnNlY3QtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA';

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

// Simple in-memory token cache (works without native modules)
const tokenCache = {
  getToken: async () => null,
  saveToken: async () => {},
};

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
      <ActivityIndicator size="large" color="#FFC800" />
    </View>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) {
    return <LoadingFallback />;
  }
  
  return <>{children}</>;
}

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
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