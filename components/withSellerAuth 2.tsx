import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { hasSellerPermission, isSellerProfileComplete } from '../lib/userUtils';
import { auth } from '../firebase';

/**
 * 판매자 권한이 필요한 컴포넌트를 감싸는 HOC
 * @param WrappedComponent 권한이 필요한 컴포넌트
 * @param requireCompleteProfile 완성된 프로필이 필요한지 여부
 */
export function withSellerAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireCompleteProfile: boolean = true
) {
  return function WithSellerAuthComponent(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
      checkPermission();
    }, []);

    const checkPermission = async () => {
      try {
        // 로그인 체크
        if (!auth.currentUser) {
          router.push('/login');
          return;
        }

        // 판매자 권한 체크
        const hasSeller = await hasSellerPermission();
        if (!hasSeller) {
          router.push('/seller/register');
          return;
        }

        // 프로필 완성도 체크
        if (requireCompleteProfile) {
          const isComplete = await isSellerProfileComplete();
          if (!isComplete) {
            router.push('/seller/store/edit');
            return;
          }
        }

        setHasPermission(true);
      } catch (error) {
        console.error('Error checking seller permission:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      );
    }

    if (!hasPermission) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
