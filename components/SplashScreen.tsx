import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationFinish?: () => void;
}

export default function SplashScreen({ onAnimationFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const startAnimation = () => {
      // 로고 애니메이션 시퀀스
      Animated.sequence([
        // 1. 로고 페이드인 + 스케일 업
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        // 2. 잠시 대기
        Animated.delay(500),
        // 3. 텍스트 슬라이드 업
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        // 4. 추가 대기 후 완료
        Animated.delay(800),
      ]).start(() => {
        // 애니메이션 완료 후 콜백 실행
        if (onAnimationFinish) {
          onAnimationFinish();
        }
      });
    };

    // 약간의 지연 후 애니메이션 시작
    const timer = setTimeout(startAnimation, 200);
    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, onAnimationFinish]);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f0fdf4"
        translucent={false}
      />
      <View style={styles.container}>
        {/* 배경 그라데이션 효과 */}
        <View style={styles.backgroundGradient} />
        
        {/* 로고 */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        {/* 텍스트 */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>ReValue</Text>
          <Text style={styles.tagline}>지구를 지키는 떨이 플랫폼</Text>
          
          {/* 로딩 인디케이터 */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDot} />
            <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
            <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
          </View>
        </Animated.View>

        {/* 하단 브랜딩 */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.footerText}>환경을 생각하는 스마트 소비</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0fdf4',
    opacity: 0.9,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#16a34a',
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#16a34a',
    marginBottom: 8,
    fontWeight: '500',
  },
  version: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },
});