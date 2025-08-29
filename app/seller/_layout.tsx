import { Stack } from 'expo-router';

export default function SellerLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="upload"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="store/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="store/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
