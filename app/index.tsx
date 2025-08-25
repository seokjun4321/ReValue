import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator,
  StyleSheet 
} from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import "./global.css";

export default function IndexScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 확인
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 사용자가 로그인되어 있으면 메인 화면으로
        console.log('사용자 로그인 상태:', user.email);
        router.replace('/(tabs)/home');
      } else {
        // 로그인되어 있지 않으면 로그인 화면으로
        console.log('사용자 미로그인 상태');
        router.replace('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 로딩 중 화면
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.logoText}>🎯</Text>
        <Text style={styles.appName}>ReValue</Text>
        <ActivityIndicator size="large" color="#22c55e" style={styles.loader} />
        <Text style={styles.loadingText}>앱을 시작하는 중...</Text>
      </View>
    );
  }

  // 인증 상태 확인 후 자동 리디렉트되므로 이 화면은 보이지 않음
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 60,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#16a34a',
    textAlign: 'center',
  },
});