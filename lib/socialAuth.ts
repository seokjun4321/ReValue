// 소셜 로그인 관련 유틸리티 함수들

import { 
  signInWithCredential, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '../firebase';
import { createOrUpdateUserProfile } from './firestore';
import { Platform } from 'react-native';

// 조건부 import - 네이티브에서만 Google Sign-In 모듈 로드
let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (error) {
    console.warn('Google Sign-In module not available');
  }
}

// Google 소셜 로그인 설정
export const configureGoogleSignIn = () => {
  if (Platform.OS !== 'web' && GoogleSignin) {
    GoogleSignin.configure({
      webClientId: '816141764936-your-web-client-id.apps.googleusercontent.com', // Firebase Console에서 가져와야 함
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }
};

/**
 * Google 소셜 로그인
 */
export const signInWithGoogle = async () => {
  try {
    if (Platform.OS === 'web') {
      // 웹에서는 Firebase의 팝업 방식 사용
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 사용자 프로필 생성/업데이트
      await createOrUpdateUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        profileImage: user.photoURL || '',
        userType: 'buyer',
        notificationSettings: {
          newDealsNearby: true,
          favoriteStoreUpdates: true,
          expiryAlerts: true,
          priceDrops: true
        }
      });
      
      return { success: true, user };
    } else {
      // 모바일에서는 react-native-google-signin 사용
      if (!GoogleSignin) {
        throw new Error('Google Sign-In이 사용할 수 없습니다. 네이티브 앱에서만 지원됩니다.');
      }
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        throw new Error('Google 로그인에서 ID 토큰을 받지 못했습니다.');
      }
      
      // Firebase 인증 자격 증명 생성
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      
      // Firebase에 로그인
      const result = await signInWithCredential(auth, googleCredential);
      const user = result.user;
      
      // 사용자 프로필 생성/업데이트
      await createOrUpdateUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        profileImage: user.photoURL || '',
        userType: 'buyer',
        notificationSettings: {
          newDealsNearby: true,
          favoriteStoreUpdates: true,
          expiryAlerts: true,
          priceDrops: true
        }
      });
      
      return { success: true, user };
    }
  } catch (error: any) {
    console.error('Google 로그인 실패:', error);
    
    let errorMessage = 'Google 로그인에 실패했습니다.';
    
    if (error.code === 'auth/network-request-failed') {
      errorMessage = '네트워크 연결을 확인해주세요.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message?.includes('cancelled')) {
      errorMessage = '로그인이 취소되었습니다.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 카카오 로그인 (웹 전용 - 실제 구현 시 카카오 SDK 필요)
 */
export const signInWithKakao = async () => {
  try {
    if (Platform.OS !== 'web') {
      throw new Error('카카오 로그인은 현재 웹에서만 지원됩니다.');
    }
    
    // TODO: 카카오 SDK 연동
    // 현재는 모의 구현
    console.log('카카오 로그인 시도...');
    
    // 임시 응답
    return { 
      success: false, 
      error: '카카오 로그인은 준비 중입니다.' 
    };
  } catch (error: any) {
    console.error('카카오 로그인 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 네이버 로그인 (웹 전용 - 실제 구현 시 네이버 SDK 필요)
 */
export const signInWithNaver = async () => {
  try {
    if (Platform.OS !== 'web') {
      throw new Error('네이버 로그인은 현재 웹에서만 지원됩니다.');
    }
    
    // TODO: 네이버 SDK 연동
    // 현재는 모의 구현
    console.log('네이버 로그인 시도...');
    
    // 임시 응답
    return { 
      success: false, 
      error: '네이버 로그인은 준비 중입니다.' 
    };
  } catch (error: any) {
    console.error('네이버 로그인 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Apple 로그인 (iOS 전용)
 */
export const signInWithApple = async () => {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple 로그인은 iOS에서만 지원됩니다.');
    }
    
    // TODO: Apple Sign-In 구현
    // expo-apple-authentication 패키지 필요
    console.log('Apple 로그인 시도...');
    
    // 임시 응답
    return { 
      success: false, 
      error: 'Apple 로그인은 준비 중입니다.' 
    };
  } catch (error: any) {
    console.error('Apple 로그인 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 소셜 로그인 로그아웃
 */
export const signOutFromSocial = async () => {
  try {
    // Firebase 로그아웃
    await auth.signOut();
    
    // Google 로그아웃 (모바일에서만)
    if (Platform.OS !== 'web' && GoogleSignin) {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
    }
    
    console.log('소셜 로그아웃 완료');
    return { success: true };
  } catch (error: any) {
    console.error('소셜 로그아웃 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 현재 로그인된 소셜 제공자 확인
 */
export const getCurrentSocialProvider = (): string | null => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const providerData = user.providerData;
  if (providerData.length === 0) return 'email'; // 이메일 로그인
  
  const providerId = providerData[0].providerId;
  
  switch (providerId) {
    case 'google.com':
      return 'google';
    case 'facebook.com':
      return 'facebook';
    case 'apple.com':
      return 'apple';
    default:
      return 'unknown';
  }
};