import React, { useState, useEffect } from 'react';
import { 
  Dimensions, 
  StyleSheet, 
  View, 
  Text, 
  Platform, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { getActiveDeals, searchDeals, getPopularDeals } from '../../lib/firestore';
import { Deal, CategoryType, CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/types';
import SmartSearch from '../../components/SmartSearch';
import ShareButton from '../../components/ShareButton';
import StoreRecommendation from '../../components/StoreRecommendation';
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
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // 검색 및 필터 관련 상태
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'distance' | 'discount' | 'new' | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [routeMode, setRouteMode] = useState<'commute' | 'nearby' | null>(null);

  // 위치 권한 요청 및 현재 위치 가져오기
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          '위치 권한 필요',
          '주변 떨이를 확인하려면 위치 권한이 필요합니다.',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '설정으로 이동', 
              onPress: async () => {
                if (Platform.OS === 'ios') {
                  await Linking.openURL('app-settings:');
                } else {
                  await Linking.openSettings();
                }
              }
            }
          ]
        );
        setLocationPermission(false);
        return;
      }

      setLocationPermission(true);
      await startLocationUpdates();
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      Alert.alert('오류', '위치 정보를 가져올 수 없습니다.');
    }
  };

  // 실시간 위치 업데이트 시작
  const startLocationUpdates = async () => {
    try {
      // 먼저 현재 위치를 한 번 가져옴
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation(initialLocation);
      
      // 실시간 위치 업데이트 구독
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,  // 5초마다 업데이트
          distanceInterval: 10, // 10미터 이상 이동했을 때 업데이트
        },
        (location) => {
          setCurrentLocation(location);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      );

      // 컴포넌트 언마운트 시 구독 해제
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('위치 업데이트 시작 실패:', error);
      Alert.alert('오류', '위치 추적을 시작할 수 없습니다.');
    }
  };

  // 실시간 떨이 데이터 로드 및 필터링
  const loadDeals = async () => {
    try {
      setLoading(true);
      let activeDeals = await getActiveDeals(50); // 지도에서는 더 많은 데이터 표시

      // 필터 적용
      if (selectedFilter === 'discount') {
        activeDeals = activeDeals.sort((a, b) => b.discountRate - a.discountRate);
      } else if (selectedFilter === 'new') {
        activeDeals = activeDeals.filter(deal => deal.isNew);
      }

      // 가격 범위 필터
      activeDeals = activeDeals.filter(deal => 
        deal.discountedPrice >= priceRange[0] && deal.discountedPrice <= priceRange[1]
      );

      // 카테고리 필터
      if (selectedCategory) {
        activeDeals = activeDeals.filter(deal => deal.category === selectedCategory);
      }

      // 거리 기반 필터
      if (currentLocation) {
        if (routeMode === 'nearby') {
          // 5분 거리 (도보 기준 약 400m)
          activeDeals = activeDeals.filter(deal => {
            const distance = calculateDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              deal.location.latitude,
              deal.location.longitude
            );
            return distance <= 0.4; // 400m = 0.4km
          });
        } else if (routeMode === 'commute') {
          // 출퇴근길 2km 이내
          activeDeals = activeDeals.filter(deal => {
            const distance = calculateDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              deal.location.latitude,
              deal.location.longitude
            );
            return distance <= 2;
          });
        }
      }

      setDeals(activeDeals);
    } catch (error) {
      console.error('지도 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 처리
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      loadDeals();
      return;
    }

    try {
      setLoading(true);
      const results = await searchDeals(term);
      setDeals(results);
    } catch (error) {
      console.error('검색 실패:', error);
      Alert.alert('검색 오류', '검색 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 위치 권한 요청 및 데이터 로드
  useEffect(() => {
    const initializeLocation = async () => {
      await requestLocationPermission();
      loadDeals();
    };
    
    initializeLocation();
    
    // 30초마다 자동 새로고침 (실시간 업데이트)
    const interval = setInterval(loadDeals, 30000);
    return () => clearInterval(interval);
  }, []);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    loadDeals();
  }, [selectedFilter, selectedCategory, priceRange, routeMode]);

  // 현재 위치가 업데이트되면 지도를 해당 위치로 이동
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1500);
    }
  }, [currentLocation]);

  const handleMarkerPress = (deal: Deal) => {
    setSelectedMarker(deal);
    setShowPreview(true);
  };

  const getMarkerIcon = (category: CategoryType) => {
    return CATEGORY_ICONS[category] || 'location';
  };

  // 거리 계산 함수 (현재 위치와의 실제 거리)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // 거리 포맷팅
  const formatDistance = (deal: Deal): string => {
    if (!currentLocation) {
      return '위치 확인 중...';
    }
    
    const distance = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      deal.location.latitude,
      deal.location.longitude
    );
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
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

  // 현재 위치로 이동하는 함수
  const moveToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const mapRef = React.useRef<any>(null);

  // 새로운 스타일 추가


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>지도</Text>
        <Text style={styles.subTitle}>
          {locationPermission ? '주변 떨이를 확인해보세요' : '위치 권한을 허용해주세요'}
        </Text>

        {/* 필터 칩 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterChips}
        >
          <TouchableOpacity 
            style={[styles.filterChip, routeMode === 'commute' && styles.filterChipActive]}
            onPress={() => setRouteMode(routeMode === 'commute' ? null : 'commute')}
          >
            <Ionicons name="subway" size={16} color={routeMode === 'commute' ? '#e03131' : '#495057'} />
            <Text style={[styles.filterChipText, routeMode === 'commute' && styles.filterChipTextActive]}>
              출퇴근길
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, routeMode === 'nearby' && styles.filterChipActive]}
            onPress={() => setRouteMode(routeMode === 'nearby' ? null : 'nearby')}
          >
            <Ionicons name="walk" size={16} color={routeMode === 'nearby' ? '#e03131' : '#495057'} />
            <Text style={[styles.filterChipText, routeMode === 'nearby' && styles.filterChipTextActive]}>
              5분 거리
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'new' && styles.filterChipActive]}
            onPress={() => setSelectedFilter(selectedFilter === 'new' ? null : 'new')}
          >
            <Ionicons name="star" size={16} color={selectedFilter === 'new' ? '#e03131' : '#495057'} />
            <Text style={[styles.filterChipText, selectedFilter === 'new' && styles.filterChipTextActive]}>
              신규 매장
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'discount' && styles.filterChipActive]}
            onPress={() => setSelectedFilter(selectedFilter === 'discount' ? null : 'discount')}
          >
            <Ionicons name="pricetag" size={16} color={selectedFilter === 'discount' ? '#e03131' : '#495057'} />
            <Text style={[styles.filterChipText, selectedFilter === 'discount' && styles.filterChipTextActive]}>
              할인율 높은순
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, showFilters && styles.filterChipActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={16} color={showFilters ? '#e03131' : '#495057'} />
            <Text style={[styles.filterChipText, showFilters && styles.filterChipTextActive]}>
              필터
            </Text>
          </TouchableOpacity>
        </ScrollView>

                  {/* 스마트 검색 */}
          <SmartSearch onSelect={(deal) => handleMarkerPress(deal)} />
        
        <View style={styles.buttonRow}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleNotification}
            >
              <Ionicons 
                name={notificationEnabled ? "notifications" : "notifications-off"} 
                size={20} 
                color="#ffffff" 
              />
              <Text style={styles.actionButtonText}>
                500m 알림 {notificationEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowRecommendModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>매장 추천</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonGroup}>
            {/* 새로고침 버튼 */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={loadDeals}
              disabled={loading}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* 공유 버튼 */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                if (selectedMarker) {
                  setShowPreview(false);
                  setTimeout(() => {
                    if (selectedMarker) {
                      ShareButton({ deal: selectedMarker });
                    }
                  }, 300);
                }
              }}
              disabled={!selectedMarker}
            >
              <Ionicons name="share-social" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>떨이를 찾는 중...</Text>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: 37.5665,
                longitude: 126.9780,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={locationPermission}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              showsTraffic={false}
              onMapReady={() => {
                if (currentLocation) {
                  mapRef.current?.animateToRegion({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                }
              }}
              onUserLocationChange={(event) => {
                if (event.nativeEvent.coordinate) {
                  const { latitude, longitude } = event.nativeEvent.coordinate;
                  setCurrentLocation({
                    coords: { latitude, longitude, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
                    timestamp: Date.now()
                  });
                }
              }}
            >
              {deals.map((deal) => (
                <Marker
                  key={deal.id}
                  coordinate={{
                    latitude: deal.location.latitude,
                    longitude: deal.location.longitude,
                  }}
                  onPress={() => handleMarkerPress(deal)}
                >
                  <View style={[
                    styles.customMarker,
                    { backgroundColor: deal.isNew ? '#e03131' : '#ffffff' }
                  ]}>
                    <Ionicons 
                      name={getMarkerIcon(deal.category)} 
                      size={16} 
                      color={deal.isNew ? '#ffffff' : '#e03131'} 
                    />
                    {deal.discountRate >= 50 && (
                      <View style={styles.markerBadge}>
                        <Text style={styles.markerBadgeText}>{deal.discountRate}%</Text>
                      </View>
                    )}
                  </View>
                </Marker>
              ))}
            </MapView>

            {/* 현재 위치 버튼 */}
            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={moveToCurrentLocation}
              disabled={!currentLocation}
            >
              <Ionicons 
                name="locate" 
                size={24} 
                color={currentLocation ? "#22c55e" : "#9ca3af"} 
              />
            </TouchableOpacity>
          </>
        )}
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
                  <View style={styles.previewActions}>
                    <ShareButton deal={selectedMarker} style={styles.shareButton} />
                    <TouchableOpacity onPress={() => setShowPreview(false)}>
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
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

      {/* 매장 추천 모달 */}
      {showRecommendModal && (
        <StoreRecommendation onClose={() => setShowRecommendModal(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#e03131',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconButton: {
    backgroundColor: '#e03131',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    marginRight: 8,
  },
  // 마커 스타일
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#e03131',
  },
  markerBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e03131',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  markerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // 필터 관련 스타일
  filterChips: {
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#fff5f5',
    borderColor: '#e03131',
  },
  filterChipText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 6,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#e03131',
  },
  // 검색 관련 스타일
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#191f28',
    paddingVertical: 8,
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
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
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 15,
    color: '#8b95a1',
    marginBottom: 16,
    fontWeight: '500',
  },
  
  // 버튼 행
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  
  // 웹 플레이스홀더
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  webPlaceholderText: {
    fontSize: 15,
    color: '#8b95a1',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // 지도 컨테이너
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  
  // 알림 버튼
  notificationButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationText: {
    color: '#191f28',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // 현재 위치 버튼 (지도 위 오버레이)
  currentLocationButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  
  // 새로고침 버튼
  refreshButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // 로딩 오버레이
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 15,
    color: '#8b95a1',
    marginTop: 16,
    fontWeight: '500',
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: '#191f28',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 15,
    color: '#8b95a1',
    marginBottom: 20,
    lineHeight: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 15,
    color: '#8b95a1',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#e7f5ff',
    color: '#228be6',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  // 정보 섹션
  infoSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
  },
  distanceText: {
    fontSize: 15,
    color: '#191f28',
    marginBottom: 8,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 15,
    color: '#228be6',
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 15,
    color: '#191f28',
    fontWeight: '500',
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
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonText: {
    color: '#191f28',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailButton: {
    backgroundColor: '#228be6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});