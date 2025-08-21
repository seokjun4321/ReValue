import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  getActiveDeals, 
  getDealsByCategory, 
  getOrdersByBuyer, 
  getPopularDeals,
  getExpiringDeals,
  getUserStats,
  searchDeals
} from '../../lib/firestore';
import { Deal, Order, CategoryType, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/types';
import { auth } from '../../firebase';
import "../global.css";

export default function Home() {
  const router = useRouter();
  const [todaysDeals, setTodaysDeals] = useState<Deal[]>([]);
  const [popularDeals, setPopularDeals] = useState<Deal[]>([]);
  const [expiringDeals, setExpiringDeals] = useState<Deal[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 검색 관련 상태
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Deal[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 여러 데이터 로드
      const [deals, popular, expiring] = await Promise.all([
        getActiveDeals(10),
        getPopularDeals(5),
        getExpiringDeals(5)
      ]);
      
      setTodaysDeals(deals);
      setPopularDeals(popular);
      setExpiringDeals(expiring);

      // 사용자가 로그인되어 있으면 주문 내역과 통계 로드
      const user = auth.currentUser;
      if (user) {
        const [orders, stats] = await Promise.all([
          getOrdersByBuyer(user.uid),
          getUserStats(user.uid)
        ]);
        
        setRecentOrders(orders.slice(0, 3)); // 최근 3개만
        setUserStats(stats);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 데이터 로드
  const loadCategoryData = async (category: CategoryType) => {
    try {
      setLoading(true);
      const deals = await getDealsByCategory(category, 10);
      setTodaysDeals(deals);
    } catch (error) {
      console.error('카테고리 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 기능
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // 카테고리 선택
  const handleCategorySelect = (category: CategoryType | 'all') => {
    setSelectedCategory(category);
    if (category === 'all') {
      loadData();
    } else {
      loadCategoryData(category);
    }
  };

  // 거리 계산
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 거리 포맷
  const formatDistance = (deal: Deal): string => {
    // 현재 위치 (임시로 서울 시청 좌표 사용)
    const currentLocation = {
      latitude: 37.5665,
      longitude: 126.9780
    };

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      deal.location.latitude,
      deal.location.longitude
    );

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  // 마감 시간 포맷
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

  // 주문 날짜 포맷
  const formatOrderDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  };

  // 검색 실행
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchDeals(term, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색어 변경 처리 (디바운싱)
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // 검색 모달 열기
  const openSearchModal = () => {
    setSearchModalVisible(true);
  };

  // 검색 모달 닫기
  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  // 화면이 포커스될 때마다 데이터 새로고침
  useEffect(() => {
    loadData();
  }, []);



  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ReValue</Text>
        <Text style={styles.subTitle}>오늘의 떨이를 찾아보세요!</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 환영 섹션 */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>🎯 떨이 헌터님, 안녕하세요!</Text>
            <Text style={styles.welcomeText}>주변 매장의 특가 상품을 찾아보세요</Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={openSearchModal}>
            <Ionicons name="search" size={20} color="#22c55e" />
            <Text style={styles.actionButtonText}>검색하기</Text>
          </TouchableOpacity>
        </View>

        {/* 카테고리 섹션 */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === 'all' && styles.categoryButtonActive
                ]}
                onPress={() => handleCategorySelect('all')}
              >
                <Ionicons name="apps" size={24} color={selectedCategory === 'all' ? '#ffffff' : '#22c55e'} />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === 'all' && styles.categoryButtonTextActive
                ]}>전체</Text>
              </TouchableOpacity>

              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryButton,
                    selectedCategory === key && styles.categoryButtonActive
                  ]}
                  onPress={() => handleCategorySelect(key as CategoryType)}
                >
                  <Ionicons 
                    name={CATEGORY_ICONS[key as CategoryType] as any} 
                    size={24} 
                    color={selectedCategory === key ? '#ffffff' : CATEGORY_COLORS[key as CategoryType]} 
                  />
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === key && styles.categoryButtonTextActive,
                    { color: selectedCategory === key ? '#ffffff' : CATEGORY_COLORS[key as CategoryType] }
                  ]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 오늘의 떨이 섹션 */}
        <View style={styles.todaysDealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? '🔥 오늘의 떨이' : `${CATEGORY_LABELS[selectedCategory]} 떨이`}
            </Text>
            <TouchableOpacity>
              <Text style={styles.moreButton}>더보기</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>떨이를 찾는 중...</Text>
            </View>
          ) : todaysDeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="sad-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>아직 등록된 떨이가 없어요</Text>
              <Text style={styles.emptyStateSubText}>새로운 떨이가 곧 등록될 예정입니다!</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dealsContainer}>
  {todaysDeals.map((deal) => (
    // TouchableOpacity에 onPress 이벤트 추가
    <TouchableOpacity 
      key={deal.id} 
      style={styles.dealCard}
      onPress={() => router.push(`/deal/${deal.id}`)} // 이 부분을 추가!
    >
      <View style={styles.dealImagePlaceholder}>
        <Ionicons name="image" size={40} color="#dcfce7" />
      </View>
      <View style={styles.dealInfo}>
        <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
        <Text style={styles.dealStore}>{deal.storeName}</Text>
        <View style={styles.dealPriceContainer}>
          <Text style={styles.dealPrice}>{deal.discountedPrice.toLocaleString()}원</Text>
          <Text style={styles.dealOriginalPrice}>{deal.originalPrice.toLocaleString()}원</Text>
        </View>
        <Text style={styles.dealDiscount}>{deal.discountRate}% 할인</Text>
        <Text style={styles.dealDistance}>📍 {formatDistance(deal)}</Text>
        <Text style={styles.dealTime}>⏰ {formatTimeUntilExpiry(deal.expiryDate)}</Text>
      </View>
    </TouchableOpacity>
  ))}
</View>
            </ScrollView>
          )}
        </View>

        {/* 최근 거래 내역 */}
        {recentOrders.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>📦 최근 거래</Text>
            {recentOrders.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle}>{order.dealTitle}</Text>
                  <Text style={styles.orderDate}>{formatOrderDate(order.orderedAt)}</Text>
                </View>
                <View style={styles.orderPrice}>
                  <Text style={styles.itemPrice}>{order.totalPrice.toLocaleString()}원</Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 검색 모달 */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSearchModal}
      >
        <View style={styles.searchModalContainer}>
          {/* 검색 헤더 */}
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={closeSearchModal} style={styles.searchCloseButton}>
              <Ionicons name="arrow-back" size={24} color="#22c55e" />
            </TouchableOpacity>
            <Text style={styles.searchHeaderTitle}>떨이 검색</Text>
            <View style={styles.searchHeaderRight} />
          </View>

          {/* 검색 입력 */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="상품명, 매장명으로 검색하세요"
                placeholderTextColor="#9ca3af"
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(searchTerm)}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 검색 결과 */}
          <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.searchLoadingText}>검색 중...</Text>
              </View>
            ) : searchTerm.length === 0 ? (
              <View style={styles.searchEmptyState}>
                <Ionicons name="search" size={64} color="#dcfce7" />
                <Text style={styles.searchEmptyTitle}>검색어를 입력하세요</Text>
                <Text style={styles.searchEmptyDescription}>
                  상품명이나 매장명으로 원하는 떨이를 찾아보세요
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.searchEmptyState}>
                <Ionicons name="sad-outline" size={64} color="#dcfce7" />
                <Text style={styles.searchEmptyTitle}>검색 결과가 없습니다</Text>
                <Text style={styles.searchEmptyDescription}>
                  다른 검색어로 다시 시도해보세요
                </Text>
              </View>
            ) : (
              <View style={styles.searchResultsList}>
                <Text style={styles.searchResultsHeader}>
                  검색 결과 {searchResults.length}개
                </Text>
                {searchResults.map((deal) => (
                  <TouchableOpacity
                    key={deal.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      closeSearchModal();
                      router.push(`/deal/${deal.id}`);
                    }}
                  >
                    <View style={styles.searchResultImagePlaceholder}>
                      <Ionicons name="image" size={32} color="#dcfce7" />
                    </View>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultTitle} numberOfLines={2}>
                        {deal.title}
                      </Text>
                      <Text style={styles.searchResultStore}>{deal.storeName}</Text>
                      <View style={styles.searchResultPriceContainer}>
                        <Text style={styles.searchResultPrice}>
                          {deal.discountedPrice.toLocaleString()}원
                        </Text>
                        <Text style={styles.searchResultOriginalPrice}>
                          {deal.originalPrice.toLocaleString()}원
                        </Text>
                        <Text style={styles.searchResultDiscount}>
                          {deal.discountRate}% 할인
                        </Text>
                      </View>
                      <Text style={styles.searchResultTime}>
                        ⏰ {formatTimeUntilExpiry(deal.expiryDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf8', // Light green background
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#16a34a',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#22c55e',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  categoryButton: {
    backgroundColor: '#f8fdf8',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: '#166534',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  todaysDealsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moreButton: {
    color: '#22c55e',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#166534',
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  dealsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  dealCard: {
    backgroundColor: '#f8fdf8',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  dealImagePlaceholder: {
    height: 120,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dealInfo: {
    flex: 1,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  dealStore: {
    fontSize: 14,
    color: '#16a34a',
    marginBottom: 8,
  },
  dealPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dealPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
    marginRight: 8,
  },
  dealOriginalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  dealDiscount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  dealDistance: {
    fontSize: 12,
    color: '#16a34a',
    marginBottom: 2,
  },
  dealTime: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  orderPrice: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 12,
    color: '#16a34a',
  },

  // 검색 모달 스타일
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#f8fdf8',
  },
  searchHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  searchCloseButton: {
    padding: 8,
  },
  searchHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  searchHeaderRight: {
    width: 40,
  },
  searchInputContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    marginRight: 8,
  },
  searchResults: {
    flex: 1,
    padding: 20,
  },
  searchLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  searchLoadingText: {
    fontSize: 16,
    color: '#166534',
    marginTop: 12,
  },
  searchEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  searchEmptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  searchEmptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchResultsList: {
    paddingBottom: 20,
  },
  searchResultsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
  },
  searchResultItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  searchResultImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  searchResultStore: {
    fontSize: 14,
    color: '#16a34a',
    marginBottom: 8,
  },
  searchResultPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    marginRight: 8,
  },
  searchResultOriginalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  searchResultDiscount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  searchResultTime: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
});