import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { registerForPushNotificationsAsync, addNotificationListeners } from '../lib/notifications';
import { configureGoogleSignIn } from '../lib/socialAuth';
import { auth } from '../firebase';
import SplashScreen from '../components/SplashScreen';
import './global.css';

export default function RootLayout() {
  const [isShowingSplash, setIsShowingSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Google 로그인 설정
    configureGoogleSignIn();

    // 인증 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      console.log('인증 상태 변화:', user ? `로그인됨 (${user.email})` : '로그아웃됨');
    });

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
      unsubscribe();
      notificationListeners.remove();
    };
  }, []);

  const handleSplashFinish = () => {
    // 약간의 지연을 주어 애니메이션이 완료된 후 상태 업데이트
    setTimeout(() => {
      setIsShowingSplash(false);
    }, 100);
  };

  // 스플래시 화면 표시 중
  if (isShowingSplash) {
    return <SplashScreen onAnimationFinish={handleSplashFinish} />;
  }

  // 인증 상태 확인 중
  if (!isAuthReady) {
    return <SplashScreen onAnimationFinish={() => {}} />;
  }

  // 메인 앱 화면
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="seller/upload" options={{ headerShown: false }} />
      <Stack.Screen name="seller/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="deal/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
    </Stack>
  );
}
