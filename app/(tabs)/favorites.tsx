import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase';
import { getFavoriteDeals, getFavoriteStores, toggleDealFavorite, toggleStoreFavorite } from '../../lib/firestore';
import { Deal, Store } from '../../lib/types';
import { sendDealNotification, NOTIFICATION_TYPES } from '../../lib/notifications';
import "../global.css";

// 유틸리티 함수
const formatTimeUntilExpiry = (expiryDate: Date): string => {
  const now = new Date();
  const diff = new Date(expiryDate).getTime() - now.getTime();
  
  if (diff <= 0) return "마감됨";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}일 후 마감`;
  } else if (hours > 0) {
    return `${hours}시간 후 마감`;
  } else {
    return `${minutes}분 후 마감`;
  }
};

const formatDistance = (location: { latitude: number; longitude: number }): string => {
  // 현재 위치 (임시로 서울 시청 좌표 사용)
  const currentLocation = {
    latitude: 37.5665,
    longitude: 126.9780
  };

  const R = 6371; // 지구의 반지름 (km)
  const dLat = (location.latitude - currentLocation.latitude) * Math.PI / 180;
  const dLon = (location.longitude - currentLocation.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(currentLocation.latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
};

export default function Favorites() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('products'); // 'products' or 'stores'
  const [loading, setLoading] = useState(true);
  const [favoriteDeals, setFavoriteDeals] = useState<Deal[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<Store[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<{
    products: { [key: string]: boolean };
    stores: { [key: string]: boolean };
  }>({
    products: {},
    stores: {}
  });

  // 데이터 로드
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }

        const [deals, stores] = await Promise.all([
          getFavoriteDeals(user.uid),
          getFavoriteStores(user.uid)
        ]);

        setFavoriteDeals(deals);
        setFavoriteStores(stores);

        // 알림 설정 초기화
        const productSettings: { [key: string]: boolean } = {};
        const storeSettings: { [key: string]: boolean } = {};

        deals.forEach(deal => {
          productSettings[deal.id] = deal.notificationsEnabled || false;
        });
        stores.forEach(store => {
          storeSettings[store.id] = store.notificationsEnabled || false;
        });

        setNotificationSettings({
          products: productSettings,
          stores: storeSettings
        });
      } catch (error) {
        console.error('찜 목록 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // 알림 토글 핸들러
  const handleNotificationToggle = async (value: boolean, id: string, type: 'products' | 'stores') => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // UI 상태 먼저 업데이트
      setNotificationSettings(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [id]: value
        }
      }));

      // 서버에 알림 설정 저장
      if (type === 'products') {
        const deal = favoriteDeals.find(d => d.id === id);
        if (deal) {
          await toggleDealFavorite(user.uid, deal.id, value);
          if (value) {
            await sendDealNotification(
              NOTIFICATION_TYPES.DEAL_EXPIRING,
              deal.title,
              deal.storeName,
              undefined,
              deal.discountRate
            );
          }
        }
      } else {
        const store = favoriteStores.find(s => s.id === id);
        if (store) {
          await toggleStoreFavorite(user.uid, store.id, value);
          if (value) {
            await sendDealNotification(
              NOTIFICATION_TYPES.NEW_DEAL_FROM_STORE,
              store.name,
              '',
              undefined,
              undefined
            );
          }
        }
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      // 실패 시 UI 상태 롤백
      setNotificationSettings(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [id]: !value
        }
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>찜한 목록</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'products' && styles.activeTab]} 
            onPress={() => setSelectedTab('products')}
          >
            <Text style={[styles.tabText, selectedTab === 'products' && styles.activeTabText]}>찜한 제품</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'stores' && styles.activeTab]} 
            onPress={() => setSelectedTab('stores')}
          >
            <Text style={[styles.tabText, selectedTab === 'stores' && styles.activeTabText]}>찜한 매장</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>찜 목록을 불러오는 중...</Text>
          </View>
        ) : selectedTab === 'products' ? (
          <View style={styles.favoritesList}>
            {/* 유통기한 임박 알림 */}
            {favoriteDeals.some(deal => {
              const now = new Date();
              const expiryDate = new Date(deal.expiryDate);
              const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              return hoursUntilExpiry <= 24;
            }) && (
              <View style={styles.expiryNotice}>
                <Ionicons name="time" size={20} color="#ef4444" />
                <Text style={styles.expiryText}>
                  오늘 마감 임박 제품이 있습니다
                </Text>
              </View>
            )}

            {/* 찜한 제품 목록 */}
            {favoriteDeals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>찜한 제품이 없습니다</Text>
                <Text style={styles.emptyStateText}>마음에 드는 떨이 상품을 찜해보세요!</Text>
              </View>
            ) : (
              favoriteDeals.map(deal => (
                <TouchableOpacity
                  key={deal.id}
                  style={styles.favoriteItem}
                  onPress={() => router.push(`/deal/${deal.id}`)}
                >
                  <View style={styles.itemContent}>
                    {deal.images && deal.images.length > 0 ? (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${deal.images[0]}` }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="image" size={40} color="#dcfce7" />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{deal.title}</Text>
                      <Text style={styles.itemSubtitle}>{deal.storeName}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.itemPrice}>
                          {deal.discountedPrice.toLocaleString()}원
                        </Text>
                        <Text style={styles.originalPrice}>
                          {deal.originalPrice.toLocaleString()}원
                        </Text>
                      </View>
                      <Text style={styles.itemStatus}>
                        ⏰ {formatTimeUntilExpiry(deal.expiryDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <Ionicons name="heart" size={20} color="#f87171" />
                    <View style={styles.notificationToggle}>
                      <Text style={styles.toggleLabel}>알림받기</Text>
                      <Switch
                        value={notificationSettings.products[deal.id] || false}
                        onValueChange={(value) => handleNotificationToggle(value, deal.id, 'products')}
                        trackColor={{ false: '#dcfce7', true: '#22c55e' }}
                        thumbColor="#ffffff"
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {/* 찜한 매장 목록 */}
            {favoriteStores.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>찜한 매장이 없습니다</Text>
                <Text style={styles.emptyStateText}>자주 가는 매장을 찜해보세요!</Text>
              </View>
            ) : (
              favoriteStores.map(store => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.favoriteItem}
                  onPress={() => router.push(`/store/${store.id}`)}
                >
                  <View style={styles.itemContent}>
                    {store.image ? (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${store.image}` }}
                        style={styles.storeImage}
                      />
                    ) : (
                      <View style={styles.storeImagePlaceholder}>
                        <Ionicons name="storefront" size={40} color="#dcfce7" />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{store.name}</Text>
                      <Text style={styles.itemSubtitle}>{store.description}</Text>
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeStats}>
                          ⭐ {store.rating.toFixed(1)} ({store.reviewCount}개 리뷰)
                        </Text>
                        <Text style={styles.storeDistance}>
                          📍 {formatDistance(store.location)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <Ionicons name="heart" size={20} color="#f87171" />
                    <View style={styles.notificationToggle}>
                      <Text style={styles.toggleLabel}>알림받기</Text>
                      <Switch
                        value={notificationSettings.stores[store.id] || false}
                        onValueChange={(value) => handleNotificationToggle(value, store.id, 'stores')}
                        trackColor={{ false: '#dcfce7', true: '#22c55e' }}
                        thumbColor="#ffffff"
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8b95a1',
    fontWeight: '500',
  },

  // 빈 상태
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8b95a1',
    textAlign: 'center',
    fontWeight: '500',
  },

  // 이미지 스타일
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
  },
  storeImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  favoritesList: {
    flex: 1,
  },
  favoriteItem: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  storeImagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 15,
    color: '#8b95a1',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 15,
    color: '#8b95a1',
    textDecorationLine: 'line-through',
  },
  itemStatus: {
    fontSize: 13,
    color: '#228be6',
    fontWeight: '600',
  },
  storeInfo: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 16,
  },
  storeStats: {
    fontSize: 13,
    color: '#191f28',
    marginBottom: 4,
    fontWeight: '500',
  },
  storeDistance: {
    fontSize: 13,
    color: '#191f28',
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 16,
  },
  notificationToggle: {
    marginTop: 8,
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#191f28',
    fontWeight: '500',
    marginBottom: 4,
  },
  
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#e7f5ff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8b95a1',
  },
  activeTabText: {
    color: '#228be6',
    fontWeight: '600',
  },
  
  // 유통기한 알림
  expiryNotice: {
    backgroundColor: '#e7f5ff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expiryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#228be6',
    marginLeft: 12,
  },
});