import { ReactNode, createContext, useContext } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

const CONVEX_URL = 'https://limitless-ermine-877.convex.cloud';
const CLERK_KEY = 'pk_test_Y3J1Y2lhbC1pbnNlY3QtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA';

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

const _tokenStore: Record<string, string> = {};
const tokenCache = {
  getToken: async (key: string): Promise<string | null> => _tokenStore[key] ?? null,
  saveToken: async (key: string, value: string): Promise<void> => { _tokenStore[key] = value; },
  deleteToken: async (key: string): Promise<void> => { delete _tokenStore[key]; },
};

const UserRoleContext = createContext<'admin' | 'user' | null | undefined>(undefined);

export function useUserRole() {
  return useContext(UserRoleContext);
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
      <ActivityIndicator size="large" color="#FFC800" />
    </View>
  );
}

function RoleProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const userData = useQuery(api.users.getCurrentUser);
  const role = isSignedIn ? (userData?.role ?? 'user') : null;
  return <UserRoleContext.Provider value={role}>{children}</UserRoleContext.Provider>;
}

function AuthReady({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <LoadingFallback />;
  return <RoleProvider>{children}</RoleProvider>;
}

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthReady>
          {children}
        </AuthReady>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}