import { Stack } from 'expo-router';

export default function AdminRedeemTabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="admin-tabs"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}