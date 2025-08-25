import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  signInWithGoogle, 
  signInWithKakao, 
  signInWithApple,
  configureGoogleSignIn 
} from '../lib/socialAuth';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { createOrUpdateUserProfile } from '../lib/firestore';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입
  
  // 이메일 로그인 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 컴포넌트 마운트 시 Google 로그인 설정
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // 로그인 성공 시 처리
  const handleLoginSuccess = (user: any) => {
    console.log('로그인 성공:', user);
    
    // 로그인 성공 시 애니메이션 효과와 함께 알림
    const userName = user.displayName || user.email?.split('@')[0] || '게스트';
    
    Alert.alert(
      '🎉 환영합니다!',
      `${userName}님, ReValue에 오신 것을 환영합니다.\n\n지금 바로 주변의 떨이 상품을 확인해보세요!`,
      [
        {
          text: '시작하기',
          onPress: () => router.replace('/(tabs)'),
          style: 'default'
        }
      ],
      {
        cancelable: false,
      }
    );
  };

  // Google 로그인 처리
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        handleLoginSuccess(result.user);
      } else {
        Alert.alert('로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      Alert.alert('오류', '로그인 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인 처리
  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithKakao();
      if (result.success && result.user) {
        // 카카오는 Firebase와 직접 연동이 안되므로 임시 처리
        Alert.alert('카카오 로그인', '카카오 로그인 기능은 준비 중입니다.');
      } else {
        Alert.alert('로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      Alert.alert('오류', '로그인 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Apple 로그인 처리
  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithApple();
      if (result.success && result.user) {
        handleLoginSuccess(result.user);
      } else {
        Alert.alert('로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Apple 로그인 오류:', error);
      Alert.alert('오류', '로그인 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이메일 로그인/회원가입 처리
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      
      if (isLogin) {
        // 로그인
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // 회원가입
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 사용자 프로필 생성
        await createOrUpdateUserProfile(userCredential.user.uid, {
          email: email,
          displayName: email.split('@')[0], // 이메일 앞부분을 기본 이름으로
          profileImage: '',
          userType: 'buyer',
          notificationSettings: {
            newDealsNearby: true,
            favoriteStoreUpdates: true,
            expiryAlerts: true,
            priceDrops: true
          }
        });
      }

      handleLoginSuccess(userCredential.user);
    } catch (error: any) {
      console.error('이메일 인증 오류:', error);
      
      let errorMessage = '로그인에 실패했습니다.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '존재하지 않는 계정입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호는 6자 이상이어야 합니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바른 이메일 형식이 아닙니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          break;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 재설정
  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('이메일 입력', '비밀번호를 재설정할 이메일을 입력해주세요.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        '비밀번호 재설정',
        '비밀번호 재설정 링크를 이메일로 발송했습니다.',
        [{ text: '확인' }]
      );
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error);
      Alert.alert('오류', '비밀번호 재설정에 실패했습니다.');
    }
  };

  // 게스트로 계속하기
  const handleGuestContinue = () => {
    Alert.alert(
      '게스트 모드',
      '일부 기능이 제한될 수 있습니다.\n나중에 로그인하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '게스트로 계속', 
          onPress: () => router.replace('/(tabs)') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 로고 섹션 */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo-nobackground.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.appName}>ReValue</Text>
            <Text style={styles.tagline}>음식물 낭비를 줄이고, 할인 혜택을 누리세요</Text>
            <View style={styles.decorativeLine}>
              <View style={styles.line} />
              <View style={styles.circle} />
              <View style={styles.line} />
            </View>
          </View>

          {/* 이메일 로그인 섹션 */}
          <View style={styles.emailSection}>
            <View style={styles.toggleSection}>
              <TouchableOpacity 
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  로그인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  회원가입
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호 확인"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {isLogin ? '로그인' : '회원가입'}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handlePasswordReset}
              >
                <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
              </TouchableOpacity>
            )}

            {/* 구분선 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>다른 방법으로 로그인</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 소셜 로그인 섹션 */}
            <View style={styles.socialButtonsContainer}>
              {/* Google 로그인 */}
              <TouchableOpacity 
                style={[styles.socialIconButton, styles.googleButton]}
                onPress={() => Alert.alert('준비 중', 'Google 로그인 기능은 현재 준비 중입니다.')}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={24} color="#ffffff" />
                <Text style={styles.preparingText}>(준비중)</Text>
              </TouchableOpacity>

              {/* 카카오 로그인 */}
              <TouchableOpacity 
                style={[styles.socialIconButton, styles.kakaoButton]}
                onPress={() => Alert.alert('준비 중', '카카오 로그인 기능은 현재 준비 중입니다.')}
                disabled={loading}
              >
                <Ionicons name="chatbubble" size={24} color="#000000" />
                <Text style={[styles.preparingText, { color: '#000000' }]}>(준비중)</Text>
              </TouchableOpacity>

              {/* Apple 로그인 (iOS만) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={[styles.socialIconButton, styles.appleButton]}
                  onPress={() => Alert.alert('준비 중', 'Apple 로그인 기능은 현재 준비 중입니다.')}
                  disabled={loading}
                >
                  <Ionicons name="logo-apple" size={24} color="#ffffff" />
                  <Text style={styles.preparingText}>(준비중)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 이전 이메일 로그인 섹션 제거 */}
          {false && (
            <View style={styles.emailSection}>
              <View style={styles.toggleSection}>
                <TouchableOpacity 
                  style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                    로그인
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                    회원가입
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="이메일"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 확인"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {isLogin ? '로그인' : '회원가입'}
                </Text>
              </TouchableOpacity>

              {isLogin && (
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={handlePasswordReset}
                >
                  <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.backToSocial}
                onPress={() => setShowEmailLogin(false)}
              >
                <Text style={styles.backToSocialText}>← 다른 방법으로 로그인</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 하단 섹션 */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={handleGuestContinue}
              disabled={loading}
            >
              <Text style={styles.guestButtonText}>게스트로 둘러보기</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              로그인하면 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
              <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
            </Text>
          </View>

          {/* 로딩 인디케이터 */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>로그인 중...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  decorativeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    width: '80%',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#22c55e',
    opacity: 0.3,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginHorizontal: 8,
  },
  preparingText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 8,
    opacity: 0.8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 22,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  socialIconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  preparingText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#ea4335',
    borderColor: '#ea4335',
  },
  googleText: {
    color: '#ffffff',
  },
  kakaoButton: {
    backgroundColor: '#fee500',
    borderColor: '#fee500',
  },
  kakaoText: {
    color: '#000000',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleText: {
    color: '#ffffff',
  },
  emailButton: {
    backgroundColor: '#ffffff',
    borderColor: '#22c55e',
  },
  emailText: {
    color: '#22c55e',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dcfce7',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  emailSection: {
    marginBottom: 40,
  },
  toggleSection: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#22c55e',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#22c55e',
    textDecorationLine: 'underline',
  },
  backToSocial: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToSocialText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  guestButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  guestButtonText: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#22c55e',
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#166534',
    marginTop: 12,
  },
});
