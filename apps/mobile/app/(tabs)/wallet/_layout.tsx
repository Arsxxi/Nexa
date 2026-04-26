import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="redeem"
        options={{
          presentation: 'transparentModal', // 
          headerShown: false,
          animation: 'fade', 
        }}
      />
    </Stack>
  );
}