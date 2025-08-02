import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import "../global.css";

export default function Profile() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: Firebase 로그아웃 처리
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#22c55e" />
          </View>
          <Text style={styles.userName}>사용자님</Text>
          <Text style={styles.userEmail}>user@example.com</Text>
          
          {/* 환경 기여 지표 */}
          <View style={styles.ecoStatsContainer}>
            <View style={styles.ecoStat}>
              <Ionicons name="leaf" size={20} color="#22c55e" />
              <Text style={styles.ecoStatValue}>12.3kg</Text>
              <Text style={styles.ecoStatLabel}>절약한 CO₂</Text>
            </View>
            <View style={styles.ecoStat}>
              <Ionicons name="bag" size={20} color="#22c55e" />
              <Text style={styles.ecoStatValue}>47개</Text>
              <Text style={styles.ecoStatLabel}>구매한 떨이</Text>
            </View>
            <View style={styles.ecoStat}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
              <Text style={styles.ecoStatValue}>Lv.3</Text>
              <Text style={styles.ecoStatLabel}>에코 레벨</Text>
            </View>
          </View>
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="receipt" size={24} color="#22c55e" />
              <Text style={styles.menuText}>거래 내역</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="star" size={24} color="#22c55e" />
              <Text style={styles.menuText}>내 후기</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          {/* 판매자 전환 버튼 */}
          <TouchableOpacity 
            style={styles.sellerModeButton}
            onPress={() => router.push('/seller/upload')}
          >
            <View style={styles.menuContent}>
              <Ionicons name="storefront" size={24} color="#3b82f6" />
              <Text style={styles.sellerModeText}>판매자 전환</Text>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="settings" size={24} color="#22c55e" />
              <Text style={styles.menuText}>설정</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="notifications" size={24} color="#22c55e" />
              <Text style={styles.menuText}>알림 설정</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="help-circle" size={24} color="#22c55e" />
              <Text style={styles.menuText}>도움말</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="information-circle" size={24} color="#22c55e" />
              <Text style={styles.menuText}>앱 정보</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#dc2626" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background
  },
  header: {
    backgroundColor: '#22c55e', // Green header
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // 프로필 섹션
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#16a34a',
    marginBottom: 20,
  },
  
  // 환경 기여 지표
  ecoStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    paddingTop: 16,
  },
  ecoStat: {
    alignItems: 'center',
    flex: 1,
  },
  ecoStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 4,
  },
  ecoStatLabel: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 2,
  },
  
  // 메뉴 섹션
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    overflow: 'hidden',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#166534',
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  
  // 판매자 전환 버튼
  sellerModeButton: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
  },
  sellerModeText: {
    fontSize: 16,
    color: '#1e40af',
    flex: 1,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  
  // 로그아웃 버튼
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f87171',
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});