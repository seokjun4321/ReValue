import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { auth } from '../firebase';
import { getUserStore } from '../lib/firestore';
import { Store } from '../lib/types';

export function withSellerAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function WithSellerAuthWrapper(props: T) {
    const router = useRouter();
    const segments = useSegments();
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<Store | null>(null);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const user = auth.currentUser;
          
          if (!user) {
            router.replace('/login');
            return;
          }

          // 판매자 정보 확인
          const userStore = await getUserStore(user.uid);
          
          if (!userStore) {
            // 판매자 등록 페이지로 리다이렉트
            router.replace('/seller/register');
            return;
          }

          setStore(userStore);
          setLoading(false);
        } catch (error) {
          console.error('판매자 인증 확인 실패:', error);
          router.replace('/seller/register');
        }
      };

      checkAuth();
    }, []);

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#16a34a' }}>
            판매자 정보를 확인하는 중...
          </Text>
        </View>
      );
    }

    // store 정보를 props로 전달
    return <WrappedComponent {...props} store={store} />;
  };
}
