import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { signInWithGoogle, configureGoogleSignIn } from '../lib/socialAuth';
import { createOrUpdateUserProfile } from '../lib/firestore';
import "./global.css";

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    // Google 소셜 로그인 초기화
    if (Platform.OS !== 'web') {
      configureGoogleSignIn();
    }
  }, []);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('로그인 성공:', user.email);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('로그인 실패:', error);
      let errorMessage = '로그인에 실패했습니다.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '존재하지 않는 계정입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 사용자 프로필 생성
      await createOrUpdateUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        userType: 'buyer',
        notificationSettings: {
          newDealsNearby: true,
          favoriteStoreUpdates: true,
          expiryAlerts: true,
          priceDrops: true
        }
      });
      
      console.log('회원가입 성공:', user.email);
      Alert.alert('회원가입 성공', '계정이 생성되었습니다!', [
        { text: '확인', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.';
      }
      
      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        console.log('Google 로그인 성공');
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('로그인 실패', result.error || 'Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      Alert.alert('로그인 실패', 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logo}>ReValue</Text>
        <Text style={styles.subtitle}>지구를 지키는 떨이 플랫폼</Text>
      </View>

      {/* 로그인/회원가입 폼 */}
      <View style={styles.formContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>회원가입</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail" size={20} color="#22c55e" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed" size={20} color="#22c55e" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#22c55e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* 이메일 로그인/회원가입 버튼 */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={isLogin ? handleEmailLogin : handleEmailRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLogin ? '로그인' : '회원가입'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 구분선 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 소셜 로그인 버튼들 */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={handleGoogleLogin}
            disabled={socialLoading}
          >
            {socialLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#ffffff" />
                <Text style={styles.socialButtonText}>Google로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            disabled
          >
            <Ionicons name="logo-apple" size={20} color="#ffffff" />
            <Text style={styles.socialButtonText}>Apple로 계속하기 (준비중)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            disabled
          >
            <Text style={[styles.socialButtonText, { color: '#3c1e1e' }]}>
              카카오로 계속하기 (준비중)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 약관 동의 텍스트 */}
        {!isLogin && (
          <Text style={styles.termsText}>
            회원가입 시 <Text style={styles.linkText}>이용약관</Text>과{' '}
            <Text style={styles.linkText}>개인정보처리방침</Text>에 동의하게 됩니다.
          </Text>
        )}
      </View>

      {/* 하단 링크 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <Text
            style={styles.linkText}
            onPress={() => setIsLogin(!isLogin)}
          >
            {isLogin ? '회원가입' : '로그인'}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22c55e',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#dcfce7',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#22c55e',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  activeTabText: {
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fdf8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#166534',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#4285f4',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  kakaoButton: {
    backgroundColor: '#fee500',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#dcfce7',
  },
});