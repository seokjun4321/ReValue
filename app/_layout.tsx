import { Stack } from "expo-router";
import { useEffect } from 'react';
import { registerForPushNotificationsAsync, addNotificationListeners } from '../lib/notifications';
import './global.css';

export default function RootLayout() {
  useEffect(() => {
    // 푸시 알림 초기화
    const initializeNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('푸시 토큰 등록 완료:', token);
          // TODO: 서버에 토큰 저장
        }
      } catch (error) {
        console.error('푸시 알림 초기화 실패:', error);
      }
    };

    initializeNotifications();
    
    // 알림 리스너 등록
    const notificationListeners = addNotificationListeners();
    
    return () => {
      notificationListeners.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="seller/upload" options={{ headerShown: false }} />
    </Stack>
  );
}
