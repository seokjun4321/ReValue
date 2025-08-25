// app/help.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>도움말</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 앱 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 ReValue 소개</Text>
          <Text style={styles.description}>
            ReValue는 음식점과 카페에서 남은 음식을 할인된 가격에 판매하는 
            음식물 낭비 방지 플랫폼입니다. 맛있는 음식을 저렴하게 드시면서 
            환경 보호에도 기여하세요!
          </Text>
        </View>

        {/* 사용법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 사용법</Text>
          
          <View style={styles.helpItem}>
            <Ionicons name="search" size={24} color="#22c55e" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>떨이 찾기</Text>
              <Text style={styles.helpDescription}>
                홈 화면에서 주변 매장의 할인 상품을 확인하고, 카테고리별로 원하는 떨이를 찾아보세요.
              </Text>
            </View>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="heart" size={24} color="#ef4444" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>찜하기</Text>
              <Text style={styles.helpDescription}>
                마음에 드는 떨이를 찜해두고 나중에 쉽게 찾아보세요. 찜 목록은 즐겨찾기 탭에서 확인할 수 있습니다.
              </Text>
            </View>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="bag" size={24} color="#22c55e" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>주문하기</Text>
              <Text style={styles.helpDescription}>
                떨이 상세 페이지에서 수량을 선택하고 주문하세요. 픽업 시간을 확인하고 매장에 방문해주세요.
              </Text>
            </View>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="location" size={24} color="#3b82f6" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>매장 찾기</Text>
              <Text style={styles.helpDescription}>
                지도 화면에서 주변 매장들의 위치를 확인하고, 가까운 매장부터 둘러보세요.
              </Text>
            </View>
          </View>
        </View>

        {/* 떨이란? */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ 떨이란?</Text>
          <Text style={styles.description}>
            '떨이'는 매장에서 남은 음식이나 마감 임박 상품을 할인된 가격에 판매하는 것을 말합니다. 
            원래 가격보다 30-70% 저렴하게 구매할 수 있으며, 음식물 낭비를 줄이는 
            친환경적인 소비 방법입니다.
          </Text>
        </View>

        {/* 혜택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ ReValue 혜택</Text>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitTitle}>💰 경제적 혜택</Text>
            <Text style={styles.benefitDescription}>
              원가 대비 최대 70% 할인된 가격으로 맛있는 음식을 즐길 수 있습니다.
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitTitle}>🌱 환경 보호</Text>
            <Text style={styles.benefitDescription}>
              음식물 낭비를 줄여 지구 환경 보호에 기여할 수 있습니다.
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitTitle}>🏪 매장 지원</Text>
            <Text style={styles.benefitDescription}>
              지역 소상공인의 손실을 줄이고 지역 경제 활성화에 도움이 됩니다.
            </Text>
          </View>
        </View>

        {/* 주의사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 주의사항</Text>
          
          <View style={styles.warningItem}>
            <Ionicons name="time" size={20} color="#ef4444" />
            <Text style={styles.warningText}>
              떨이는 마감 시간이 정해져 있으니 시간을 꼭 확인하세요.
            </Text>
          </View>

          <View style={styles.warningItem}>
            <Ionicons name="checkmark-circle" size={20} color="#ef4444" />
            <Text style={styles.warningText}>
              주문 후 지정된 픽업 시간 내에 매장에 방문해주세요.
            </Text>
          </View>

          <View style={styles.warningItem}>
            <Ionicons name="refresh" size={20} color="#ef4444" />
            <Text style={styles.warningText}>
              떨이 특성상 환불이나 교환이 어려울 수 있습니다.
            </Text>
          </View>
        </View>

        {/* 문의하기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 문의하기</Text>
          
          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="mail" size={24} color="#22c55e" />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>이메일 문의</Text>
              <Text style={styles.contactDescription}>support@revalue.kr</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="call" size={24} color="#22c55e" />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>전화 문의</Text>
              <Text style={styles.contactDescription}>1588-1234 (평일 9:00-18:00)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="chatbubble" size={24} color="#22c55e" />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>카카오톡 문의</Text>
              <Text style={styles.contactDescription}>@ReValue</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>ReValue v1.0.0</Text>
          <Text style={styles.versionDescription}>최신 버전입니다</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0fdf4' 
  },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 16,
  },
  content: { 
    flex: 1, 
    padding: 20 
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  benefitItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 14,
    color: '#374151',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  versionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 4,
  },
  versionDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
});