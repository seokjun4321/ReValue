import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, View, Text, Platform, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveDeals } from '../../lib/firestore';
import { Deal, CategoryType, CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/types';
import { sendDealNotification, NOTIFICATION_TYPES } from '../../lib/notifications';

export default function MapScreen() {
  // 웹에서는 지도 대신 플레이스홀더를 표시
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>지도</Text>
          <Text style={styles.subTitle}>주변 떨이를 확인해보세요</Text>
        </View>
        <View style={styles.webPlaceholder}>
          <Ionicons name="map" size={80} color="#22c55e" />
          <Text style={styles.webPlaceholderText}>지도는 모바일 앱에서 이용 가능합니다</Text>
        </View>
      </View>
    );
  }

  // 모바일에서만 지도 컴포넌트 렌더링
  return <MobileMapScreen />;
}

// 모바일 전용 지도 컴포넌트
function MobileMapScreen() {
  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');
  const [selectedMarker, setSelectedMarker] = useState<Deal | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // 실시간 떨이 데이터 로드
  const loadDeals = async () => {
    try {
      setLoading(true);
      const activeDeals = await getActiveDeals(50); // 지도에서는 더 많은 데이터 표시
      setDeals(activeDeals);
    } catch (error) {
      console.error('지도 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDeals();
    
    // 30초마다 자동 새로고침 (실시간 업데이트)
    const interval = setInterval(loadDeals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkerPress = (deal: Deal) => {
    setSelectedMarker(deal);
    setShowPreview(true);
  };

  const getMarkerIcon = (category: CategoryType) => {
    return CATEGORY_ICONS[category] || 'location';
  };

  // 거리 계산 (임시)
  const formatDistance = (deal: Deal): string => {
    // 실제로는 사용자 위치와 계산해야 함
    const distances = ['150m', '300m', '500m', '800m', '1.2km'];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  // 마감 시간 표시
  const formatTimeUntilExpiry = (expiryDate: Date): string => {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    
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

  const toggleNotification = async () => {
    const newState = !notificationEnabled;
    setNotificationEnabled(newState);
    
    if (newState) {
      // 알림이 활성화되면 테스트 알림 전송
      await sendDealNotification(
        NOTIFICATION_TYPES.NEW_DEAL_NEARBY,
        '테스트 떨이',
        '테스트 매장',
        '100m',
        70
      );
      console.log('500m 반경 알림이 활성화되었습니다.');
    } else {
      console.log('500m 반경 알림이 비활성화되었습니다.');
    }
    
    // TODO: 실제 알림 설정을 Firestore에 저장
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>지도</Text>
        <Text style={styles.subTitle}>주변 떨이를 확인해보세요</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={toggleNotification}
        >
          <Ionicons 
            name={notificationEnabled ? "notifications" : "notifications-off"} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.notificationText}>
            500m 알림 {notificationEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
        
        {/* 새로고침 버튼 */}
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadDeals}
          disabled={loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>떨이를 찾는 중...</Text>
          </View>
        )}
        
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.5665,
            longitude: 126.9780,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {deals.map((deal) => (
            <Marker
              key={deal.id}
              coordinate={{
                latitude: deal.location.latitude,
                longitude: deal.location.longitude
              }}
              onPress={() => handleMarkerPress(deal)}
              pinColor={CATEGORY_COLORS[deal.category]}
            />
          ))}
        </MapView>
      </View>

      {/* 제품 미리보기 모달 */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewCard}>
            {selectedMarker && (
              <>
                <View style={styles.previewHeader}>
                  <View style={styles.categoryBadge}>
                    <Ionicons 
                      name={getMarkerIcon(selectedMarker.category) as any} 
                      size={16} 
                      color={CATEGORY_COLORS[selectedMarker.category]} 
                    />
                    <Text style={[styles.categoryText, { color: CATEGORY_COLORS[selectedMarker.category] }]}>
                      {selectedMarker.category}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowPreview(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.previewTitle}>{selectedMarker.title}</Text>
                <Text style={styles.previewDescription}>{selectedMarker.description}</Text>
                
                <View style={styles.priceSection}>
                  <Text style={styles.currentPrice}>
                    {selectedMarker.discountedPrice.toLocaleString()}원
                  </Text>
                  <Text style={styles.originalPrice}>
                    {selectedMarker.originalPrice.toLocaleString()}원
                  </Text>
                  <Text style={styles.discountBadge}>
                    {selectedMarker.discountRate}% 할인
                  </Text>
                </View>
                
                <View style={styles.infoSection}>
                  <Text style={styles.distanceText}>
                    📍 {formatDistance(selectedMarker)}
                  </Text>
                  <Text style={styles.timeText}>
                    ⏰ {formatTimeUntilExpiry(selectedMarker.expiryDate)}
                  </Text>
                  <Text style={styles.quantityText}>
                    📦 남은 수량: {selectedMarker.remainingQuantity}개
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={20} color="#ef4444" />
                    <Text style={styles.favoriteButtonText}>찜하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>구매하기</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: '#dcfce7', // Light green text
    marginBottom: 12,
  },
  
  // 웹 플레이스홀더
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderStyle: 'dashed',
  },
  webPlaceholderText: {
    fontSize: 18,
    color: '#166534',
    marginTop: 16,
    textAlign: 'center',
  },
  
  // 지도 컨테이너
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#22c55e',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  
  // 알림 버튼
  notificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // 새로고침 버튼
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginTop: 8,
    marginLeft: 8,
  },
  
  // 로딩 오버레이
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 253, 244, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 16,
    color: '#166534',
    marginTop: 12,
    fontWeight: 'bold',
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fdf8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  // 정보 섹션
  infoSection: {
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#16a34a',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#16a34a',
  },
  
  // 버튼 행
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  favoriteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
  },
  detailButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});