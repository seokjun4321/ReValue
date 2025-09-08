// 소셜 로그인 관련 유틸리티 함수들

import { 
  signInWithCredential, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '../firebase';
import { createOrUpdateUserProfile } from './firestore';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

// 조건부 import - 플랫폼별 모듈 로드
let GoogleSignin: any = null;
let AppleAuthentication: any = null;
let KakaoLogin: any = null;

// Google Sign-In 모듈은 제거됨
console.warn('Google Sign-In module not available - removed from project');

if (Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch (error) {
    console.warn('Apple Authentication module not available');
  }
}

// 카카오 로그인은 현재 웹 기반 OAuth로만 지원
// Android/iOS 네이티브 SDK는 추후 구현 예정

// WebBrowser 설정 (OAuth 리디렉트용)
WebBrowser.maybeCompleteAuthSession();

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
    // Google Sign-In이 제거되었으므로 오류 반환
    return { 
      success: false, 
      error: 'Google 로그인은 현재 사용할 수 없습니다. 다른 로그인 방법을 사용해주세요.' 
    };
    
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
 * 카카오 로그인 구현
 */
export const signInWithKakao = async () => {
  try {
    console.log('카카오 로그인 시도...');

    if (Platform.OS === 'web') {
      // 웹용 카카오 로그인 (OAuth 2.0)
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=YOUR_KAKAO_APP_KEY&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=profile_nickname,profile_image,account_email`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === 'success') {
        const { code } = result.params;
        
        // 카카오 서버에서 액세스 토큰 받기
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'YOUR_KAKAO_APP_KEY',
            redirect_uri: redirectUri,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
          // 사용자 정보 가져오기
          const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });
          
          const userData = await userResponse.json();
          
          // Firebase Custom Token 방식 또는 임시 사용자 생성
          // 실제 구현에서는 백엔드에서 Custom Token을 생성해야 함
          console.log('카카오 사용자 정보:', userData);
          
          return {
            success: true,
            user: {
              id: userData.id,
              email: userData.kakao_account?.email,
              displayName: userData.properties?.nickname,
              profileImage: userData.properties?.profile_image,
            }
          };
        }
      }
      
      return { success: false, error: '카카오 로그인이 취소되었습니다.' };
      
    } else {
      // 모바일에서는 웹뷰 방식 사용 (향후 네이티브 SDK 구현 예정)
      Alert.alert(
        '카카오 로그인',
        '카카오 로그인 기능은 현재 준비 중입니다.\n다른 로그인 방법을 이용해주세요.',
        [{ text: '확인' }]
      );
      
      return { success: false, error: '카카오 로그인은 준비 중입니다.' };
    }
  } catch (error: any) {
    console.error('카카오 로그인 실패:', error);
    
    let errorMessage = '카카오 로그인에 실패했습니다.';
    if (error.message?.includes('cancelled') || error.message?.includes('cancel')) {
      errorMessage = '로그인이 취소되었습니다.';
    }
    
    return { success: false, error: errorMessage };
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
 * Apple 로그인 구현
 */
export const signInWithApple = async () => {
  try {
    console.log('Apple 로그인 시도...');

    if (Platform.OS === 'ios' && AppleAuthentication) {
      // iOS용 네이티브 Apple 로그인
      const { AppleAuthenticationScope, signInAsync } = AppleAuthentication;
      
      // Apple Sign-In 사용 가능 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
      }

      const credential = await signInAsync({
        requestedScopes: [
          AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Firebase Apple 인증 제공자 설정
        const provider = new OAuthProvider('apple.com');
        const appleCredential = provider.credential({
          idToken: credential.identityToken,
          rawNonce: undefined, // 실제 구현에서는 nonce 사용 권장
        });

        // Firebase에 로그인
        const result = await signInWithCredential(auth, appleCredential);
        const user = result.user;

        // 사용자 프로필 생성/업데이트
        const displayName = credential.fullName 
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : user.displayName || '';

        await createOrUpdateUserProfile(user.uid, {
          email: credential.email || user.email || '',
          displayName: displayName,
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
        throw new Error('Apple 로그인에서 인증 토큰을 받지 못했습니다.');
      }
    } else if (Platform.OS === 'web') {
      // 웹용 Apple 로그인 (Sign in with Apple JS)
      Alert.alert(
        'Apple 로그인',
        '웹에서는 Apple 로그인이 지원되지 않습니다.\n다른 로그인 방법을 사용해주세요.',
        [{ text: '확인' }]
      );
      
      return { success: false, error: '웹에서는 Apple 로그인이 지원되지 않습니다.' };
    } else {
      // Android
      Alert.alert(
        'Apple 로그인',
        'Android에서는 Apple 로그인이 지원되지 않습니다.\n다른 로그인 방법을 사용해주세요.',
        [{ text: '확인' }]
      );
      
      return { success: false, error: 'Android에서는 Apple 로그인이 지원되지 않습니다.' };
    }
  } catch (error: any) {
    console.error('Apple 로그인 실패:', error);
    
    let errorMessage = 'Apple 로그인에 실패했습니다.';
    
    if (error.code === 'ERR_REQUEST_CANCELED') {
      errorMessage = '로그인이 취소되었습니다.';
    } else if (error.code === 'ERR_INVALID_RESPONSE') {
      errorMessage = 'Apple 서버 응답이 유효하지 않습니다.';
    } else if (error.message?.includes('not available')) {
      errorMessage = '이 기기에서는 Apple 로그인을 사용할 수 없습니다.';
    }
    
    return { success: false, error: errorMessage };
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