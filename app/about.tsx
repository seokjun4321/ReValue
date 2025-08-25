import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import "./global.css";

export default function AboutScreen() {
  const router = useRouter();
  const appVersion = '1.0.0';

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('링크 열기 실패:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>앱 정보</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* 앱 정보 */}
        <View style={styles.appInfoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo-nobackground.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.appName}>ReValue</Text>
          <Text style={styles.appVersion}>버전 {appVersion}</Text>
          <Text style={styles.appDescription}>
            음식물 낭비를 줄이고{'\n'}
            지구를 지키는 떨이 플랫폼
          </Text>
        </View>

        {/* 앱 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ReValue 소개</Text>
          <Text style={styles.description}>
            ReValue는 음식점과 카페에서 남은 음식을 할인된 가격에 판매하는 
            음식물 낭비 방지 플랫폼입니다. 맛있는 음식을 저렴하게 드시면서 
            환경 보호에도 기여하세요!
          </Text>
        </View>

        {/* 환경 영향 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>환경 영향</Text>
          
          <View style={styles.statItem}>
            <Ionicons name="leaf" size={32} color="#22c55e" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>1,234kg</Text>
              <Text style={styles.statLabel}>절약한 CO₂</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="restaurant" size={32} color="#22c55e" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>5,678개</Text>
              <Text style={styles.statLabel}>구한 음식</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="people" size={32} color="#22c55e" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>9,012명</Text>
              <Text style={styles.statLabel}>참여한 사용자</Text>
            </View>
          </View>
        </View>

        {/* 링크 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관련 링크</Text>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://revalue.kr')}
          >
            <Ionicons name="globe" size={24} color="#22c55e" />
            <Text style={styles.linkText}>웹사이트</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://instagram.com/revalue')}
          >
            <Ionicons name="logo-instagram" size={24} color="#22c55e" />
            <Text style={styles.linkText}>인스타그램</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://blog.revalue.kr')}
          >
            <Ionicons name="newspaper" size={24} color="#22c55e" />
            <Text style={styles.linkText}>블로그</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* 법적 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>법적 정보</Text>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => router.push({ pathname: '/(legal)/terms' } as any)}
          >
            <Text style={styles.linkText}>이용약관</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => router.push({ pathname: '/(legal)/privacy' } as any)}
          >
            <Text style={styles.linkText}>개인정보처리방침</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => router.push({ pathname: '/(legal)/licenses' } as any)}
          >
            <Text style={styles.linkText}>오픈소스 라이선스</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* 회사 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>회사 정보</Text>
          <Text style={styles.companyInfo}>
            (주)리밸류{'\n'}
            대표이사: 홍길동{'\n'}
            사업자등록번호: 123-45-67890{'\n'}
            주소: 서울특별시 강남구 테헤란로 123{'\n'}
            이메일: support@revalue.kr{'\n'}
            전화: 1588-1234
          </Text>
        </View>

        {/* 저작권 */}
        <Text style={styles.copyright}>
          © 2024 ReValue. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  appInfoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#dcfce7',
  },
  logo: {
    width: 140,
    height: 140,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statInfo: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  companyInfo: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  copyright: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
});