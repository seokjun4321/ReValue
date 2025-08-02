import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { registerForPushNotificationsAsync, addNotificationListeners } from '../lib/notifications';
import SplashScreen from '../components/SplashScreen';
import './global.css';

export default function RootLayout() {
  const [isShowingSplash, setIsShowingSplash] = useState(true);

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

  const handleSplashFinish = () => {
    setIsShowingSplash(false);
  };

  // 스플래시 화면 표시 중
  if (isShowingSplash) {
    return <SplashScreen onAnimationFinish={handleSplashFinish} />;
  }

  // 메인 앱 화면
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="seller/upload" options={{ headerShown: false }} />
      <Stack.Screen name="seller/dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}
