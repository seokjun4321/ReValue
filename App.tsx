import 'react-native-reanimated';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AccessibilityProvider } from './components/common/AccessibilityManager';

export default function App() {
  return (
    <AccessibilityProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </AccessibilityProvider>
  );
}
