import React, { useState, useEffect } from 'react';
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
import { registerForPushNotificationsAsync } from '../lib/notifications';
import "./global.css";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 알림 설정 상태
  const [pushEnabled, setPushEnabled] = useState(false);
  const [newDealsNearby, setNewDealsNearby] = useState(true);
  const [favoriteStoreUpdates, setFavoriteStoreUpdates] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [priceDrops, setPriceDrops] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketingAlerts, setMarketingAlerts] = useState(false);

  // 초기 알림 설정 로드
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // TODO: Firestore에서 사용자의 알림 설정 로드
      // 현재는 기본값 사용
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    }
  };

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    setLoading(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushEnabled(true);
        console.log('푸시 토큰:', token);
        
        // Firestore에 토큰 저장
        const user = auth.currentUser;
        if (user) {
          await createOrUpdateUserProfile(user.uid, {
            pushToken: token,
            notificationSettings: {
              enabled: true,
              newDealsNearby,
              favoriteStoreUpdates,
              expiryAlerts,
              priceDrops,
              orderUpdates,
              marketingAlerts
            }
          });
        }

        Alert.alert('알림 설정', '알림이 성공적으로 활성화되었습니다.');
      } else {
        setPushEnabled(false);
        Alert.alert('알림 설정', '알림 권한이 거부되었습니다.');
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      Alert.alert('오류', '알림 설정 중 문제가 발생했습니다.');
      setPushEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  // 알림 설정 변경 처리
  const handleSettingChange = async (setting: string, value: boolean) => {
    if (!pushEnabled && value) {
      Alert.alert(
        '알림 권한 필요',
        '이 기능을 사용하려면 알림을 허용해야 합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정', onPress: requestNotificationPermission }
        ]
      );
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      switch (setting) {
        case 'newDealsNearby':
          setNewDealsNearby(value);
          break;
        case 'favoriteStoreUpdates':
          setFavoriteStoreUpdates(value);
          break;
        case 'expiryAlerts':
          setExpiryAlerts(value);
          break;
        case 'priceDrops':
          setPriceDrops(value);
          break;
        case 'orderUpdates':
          setOrderUpdates(value);
          break;
        case 'marketingAlerts':
          setMarketingAlerts(value);
          break;
      }

      // Firestore에 설정 저장
      await createOrUpdateUserProfile(user.uid, {
        notificationSettings: {
          enabled: pushEnabled,
          newDealsNearby,
          favoriteStoreUpdates,
          expiryAlerts,
          priceDrops,
          orderUpdates,
          marketingAlerts
        }
      });

    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      Alert.alert('오류', '설정 변경에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* 알림 권한 */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>푸시 알림</Text>
                <Text style={styles.settingDescription}>
                  {pushEnabled ? '알림이 활성화되어 있습니다.' : '알림을 활성화하여 중요한 소식을 받아보세요.'}
                </Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={requestNotificationPermission}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={pushEnabled ? '#22c55e' : '#f3f4f6'}
              disabled={loading}
            />
          </View>
        </View>

        {/* 떨이 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>떨이 알림</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>주변 떨이</Text>
                <Text style={styles.settingDescription}>
                  내 주변에 새로운 떨이가 등록되면 알려드립니다.
                </Text>
              </View>
            </View>
            <Switch
              value={newDealsNearby}
              onValueChange={(value) => handleSettingChange('newDealsNearby', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={newDealsNearby ? '#22c55e' : '#f3f4f6'}
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>찜한 매장</Text>
                <Text style={styles.settingDescription}>
                  찜한 매장의 새로운 떨이를 알려드립니다.
                </Text>
              </View>
            </View>
            <Switch
              value={favoriteStoreUpdates}
              onValueChange={(value) => handleSettingChange('favoriteStoreUpdates', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={favoriteStoreUpdates ? '#22c55e' : '#f3f4f6'}
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="time" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>마감 임박</Text>
                <Text style={styles.settingDescription}>
                  찜한 떨이의 마감 시간이 다가오면 알려드립니다.
                </Text>
              </View>
            </View>
            <Switch
              value={expiryAlerts}
              onValueChange={(value) => handleSettingChange('expiryAlerts', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={expiryAlerts ? '#22c55e' : '#f3f4f6'}
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="pricetag" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>가격 인하</Text>
                <Text style={styles.settingDescription}>
                  찜한 떨이의 가격이 내려가면 알려드립니다.
                </Text>
              </View>
            </View>
            <Switch
              value={priceDrops}
              onValueChange={(value) => handleSettingChange('priceDrops', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={priceDrops ? '#22c55e' : '#f3f4f6'}
              disabled={!pushEnabled}
            />
          </View>
        </View>

        {/* 주문 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 알림</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="cart" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>주문 상태</Text>
                <Text style={styles.settingDescription}>
                  주문 상태가 변경되면 알려드립니다.
                </Text>
              </View>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={(value) => handleSettingChange('orderUpdates', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={orderUpdates ? '#22c55e' : '#f3f4f6'}
              disabled={!pushEnabled}
            />
          </View>
        </View>

        {/* 마케팅 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>마케팅 알림</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="megaphone" size={24} color="#22c55e" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>혜택 및 이벤트</Text>
                <Text style={styles.settingDescription}>
                  특별 할인과 이벤트 소식을 받아보세요.
                </Text>
              </View>
            </View>
            <Switch
              value={marketingAlerts}
              onValueChange={(value) => handleSettingChange('marketingAlerts', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={marketingAlerts ? '#22c55e' : '#f3f4f6'}
              disabled={!pushEnabled}
            />
          </View>
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});