import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { createOrUpdateUserProfile } from '../lib/firestore';
import "./global.css";

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [locationService, setLocationService] = useState(true);
  const [autoLogin, setAutoLogin] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);

  // 설정 변경 처리
  const handleSettingChange = async (setting: string, value: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      switch (setting) {
        case 'darkMode':
          setDarkMode(value);
          break;
        case 'locationService':
          setLocationService(value);
          if (!value) {
            Alert.alert(
              '위치 서비스 비활성화',
              '위치 서비스를 끄면 주변 떨이 검색이 제한됩니다.',
              [
                { text: '취소', onPress: () => setLocationService(true) },
                { text: '확인' }
              ]
            );
          }
          break;
        case 'autoLogin':
          setAutoLogin(value);
          break;
        case 'biometricLogin':
          setBiometricLogin(value);
          if (value) {
            // TODO: 생체인식 설정
            Alert.alert(
              '생체인식 로그인',
              '준비 중인 기능입니다.',
              [{ text: '확인', onPress: () => setBiometricLogin(false) }]
            );
          }
          break;
        case 'saveHistory':
          setSaveHistory(value);
          break;
      }

      // Firestore에 설정 저장
      await createOrUpdateUserProfile(user.uid, {
        settings: {
          darkMode,
          locationService,
          autoLogin,
          biometricLogin,
          saveHistory
        }
      });

    } catch (error) {
      console.error('설정 변경 실패:', error);
      Alert.alert('오류', '설정 변경에 실패했습니다.');
    }
  };

  // 계정 삭제
  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              // TODO: Firestore 데이터 삭제
              await user.delete();
              router.replace('/login');
            } catch (error) {
              console.error('계정 삭제 실패:', error);
              Alert.alert('오류', '계정 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* 일반 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일반</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={24} color="#22c55e" />
              <Text style={styles.settingLabel}>다크 모드</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(value) => handleSettingChange('darkMode', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={darkMode ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={24} color="#22c55e" />
              <Text style={styles.settingLabel}>위치 서비스</Text>
            </View>
            <Switch
              value={locationService}
              onValueChange={(value) => handleSettingChange('locationService', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={locationService ? '#22c55e' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* 보안 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>보안</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="log-in" size={24} color="#22c55e" />
              <Text style={styles.settingLabel}>자동 로그인</Text>
            </View>
            <Switch
              value={autoLogin}
              onValueChange={(value) => handleSettingChange('autoLogin', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={autoLogin ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          {Platform.OS !== 'web' && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print" size={24} color="#22c55e" />
                <Text style={styles.settingLabel}>생체인식 로그인</Text>
              </View>
              <Switch
                value={biometricLogin}
                onValueChange={(value) => handleSettingChange('biometricLogin', value)}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={biometricLogin ? '#22c55e' : '#f3f4f6'}
              />
            </View>
          )}
        </View>

        {/* 데이터 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="time" size={24} color="#22c55e" />
              <Text style={styles.settingLabel}>검색 기록 저장</Text>
            </View>
            <Switch
              value={saveHistory}
              onValueChange={(value) => handleSettingChange('saveHistory', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={saveHistory ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => Alert.alert(
              '검색 기록 삭제',
              '모든 검색 기록을 삭제하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { 
                  text: '삭제', 
                  style: 'destructive',
                  onPress: () => Alert.alert('완료', '검색 기록이 삭제되었습니다.')
                }
              ]
            )}
          >
            <Ionicons name="trash" size={24} color="#dc2626" />
            <Text style={styles.dangerButtonText}>검색 기록 삭제</Text>
          </TouchableOpacity>
        </View>

        {/* 계정 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={24} color="#dc2626" />
            <Text style={styles.dangerButtonText}>계정 삭제</Text>
          </TouchableOpacity>
        </View>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#dc2626',
    marginLeft: 12,
  },
});