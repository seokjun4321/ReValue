import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator,

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
import { dummyFoodDeals, getDummyDealsByCategory, getPopularDummyDeals, getExpiringDummyDeals } from '../../lib/dummyData';

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
      
      // Firestore 데이터가 없으면 더미 데이터 사용
      setTodaysDeals(deals.length > 0 ? deals : dummyFoodDeals as Deal[]);
      setPopularDeals(popular.length > 0 ? popular : getPopularDummyDeals(5) as Deal[]);
      setExpiringDeals(expiring.length > 0 ? expiring : getExpiringDummyDeals(5) as Deal[]);

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
      // 에러 발생 시에도 더미 데이터 표시
      setTodaysDeals(dummyFoodDeals as Deal[]);
      setPopularDeals(getPopularDummyDeals(5) as Deal[]);
      setExpiringDeals(getExpiringDummyDeals(5) as Deal[]);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 데이터 로드
  const loadCategoryData = async (category: CategoryType) => {
    try {
      setLoading(true);
      const deals = await getDealsByCategory(category, 10);
      // Firestore 데이터가 없으면 더미 데이터 사용
      setTodaysDeals(deals.length > 0 ? deals : getDummyDealsByCategory(category) as Deal[]);
    } catch (error) {
      console.error('카테고리 데이터 로드 실패:', error);
      // 에러 발생 시에도 더미 데이터 표시
      setTodaysDeals(getDummyDealsByCategory(category) as Deal[]);
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
  const formatTimeUntilExpiry = (expiryDate: any): string => {
    if (!expiryDate) return "마감됨";
    
    // Firestore Timestamp를 Date 객체로 변환
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
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
  const formatOrderDate = (date: any): string => {
    if (!date) return '';
    
    // Firestore Timestamp를 Date 객체로 변환
    const orderDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now.getTime() - orderDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    return orderDate.toLocaleDateString();
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
      {/* 🥕 당근마켓 스타일 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>ReValue</Text>
            <Text style={styles.headerLocation}>📍 우리동네</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.searchButton} onPress={openSearchModal}>
              <Ionicons name="search" size={24} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#22c55e" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subTitle}>환경을 생각하는 똑똑한 소비 🌱</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 🥕 당근마켓 스타일 환영 섹션 */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>
              {auth.currentUser ? `${auth.currentUser.displayName || '떨이 헌터'}님 안녕하세요! 👋` : '안녕하세요! 👋'} 
            </Text>
            <Text style={styles.welcomeText}>우리동네 착한 가격을 찾아보세요</Text>
            <TouchableOpacity style={styles.actionButton} onPress={openSearchModal}>
              <Ionicons name="search" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>떨이 검색하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 에코 임팩트 섹션 */}
        <View style={styles.ecoSection}>
          <View style={styles.ecoHeader}>
            <View>
              <Text style={styles.ecoTitle}>🌱 나의 환경 보호 활동</Text>
              <Text style={styles.ecoPoints}>{userStats?.ecoPoints || 0} 포인트</Text>
            </View>
            <TouchableOpacity style={styles.ecoHistoryButton}>
              <Text style={styles.ecoHistoryText}>전체보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#22c55e" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.ecoStatsScroll}
          >
            <View style={styles.ecoStatCard}>
              <View style={[styles.ecoIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="leaf" size={24} color="#22c55e" />
              </View>
              <Text style={styles.ecoStatValue}>
                {(userStats?.ecoImpact?.co2Reduced || 0).toFixed(1)}kg
              </Text>
              <Text style={styles.ecoStatLabel}>감소된 CO2</Text>
            </View>

            <View style={styles.ecoStatCard}>
              <View style={[styles.ecoIcon, { backgroundColor: '#fff9db' }]}>
                <Ionicons name="water" size={24} color="#f59f00" />
              </View>
              <Text style={styles.ecoStatValue}>
                {(userStats?.ecoImpact?.waterSaved || 0).toFixed(1)}L
              </Text>
              <Text style={styles.ecoStatLabel}>절약한 물</Text>
            </View>

            <View style={styles.ecoStatCard}>
              <View style={[styles.ecoIcon, { backgroundColor: '#fff5f5' }]}>
                <Ionicons name="trash-bin" size={24} color="#e03131" />
              </View>
              <Text style={styles.ecoStatValue}>
                {(userStats?.ecoImpact?.plasticReduced || 0).toFixed(1)}kg
              </Text>
              <Text style={styles.ecoStatLabel}>절약한 플라스틱</Text>
            </View>

            <View style={styles.ecoStatCard}>
              <View style={[styles.ecoIcon, { backgroundColor: '#e7f5ff' }]}>
                <Ionicons name="leaf" size={24} color="#228be6" />
              </View>
              <Text style={styles.ecoStatValue}>
                {userStats?.plantedTrees || 0}그루
              </Text>
              <Text style={styles.ecoStatLabel}>심은 나무</Text>
            </View>
          </ScrollView>



          {/* 나무 심기 프로젝트 */}
          <TouchableOpacity style={styles.treeProjectCard}>
            <View style={[styles.treeProjectImage, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="leaf" size={48} color="#22c55e" />
            </View>
            <View style={styles.treeProjectContent}>
              <View style={styles.treeProjectHeader}>
                <Text style={styles.treeProjectTitle}>🌳 나무 심기 프로젝트</Text>
                <Text style={styles.treeProjectProgress}>75%</Text>
              </View>
              <Text style={styles.treeProjectDesc}>
                1,000그루 목표 달성까지 250그루 남았어요!
              </Text>
              <View style={styles.treeProgressBar}>
                <View style={[styles.treeProgressFill, { width: '75%' }]} />
              </View>
            </View>
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
                <Ionicons name="apps" size={24} color={selectedCategory === 'all' ? '#22c55e' : '#8b95a1'} />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === 'all' && styles.categoryButtonTextActive
                ]}>전체</Text>
              </TouchableOpacity>

              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const categoryColor = CATEGORY_COLORS[key as CategoryType];
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      selectedCategory === key && { ...styles.categoryButtonActive, backgroundColor: categoryColor + '20' }
                    ]}
                    onPress={() => handleCategorySelect(key as CategoryType)}
                  >
                    <Ionicons 
                      name={CATEGORY_ICONS[key as CategoryType] as any} 
                      size={24} 
                      color={selectedCategory === key ? categoryColor : '#8b95a1'} 
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === key && { ...styles.categoryButtonTextActive, color: categoryColor }
                    ]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
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
              <ActivityIndicator size="large" color="#228be6" />
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
    <TouchableOpacity 
      key={deal.id} 
      style={styles.dealCard}
      onPress={() => router.push(`/deal/${deal.id}`)}
    >
      <View style={styles.dealImagePlaceholder}>
        <Ionicons name="restaurant" size={48} color="#22c55e" />
        <View style={styles.dealDiscountBadge}>
          <Text style={styles.dealDiscountBadgeText}>{deal.discountRate}%</Text>
        </View>
      </View>
      <View style={styles.dealInfo}>
        <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
        <Text style={styles.dealStore}>{deal.storeName}</Text>
        <View style={styles.dealPriceContainer}>
          <Text style={styles.dealPrice}>{deal.discountedPrice.toLocaleString()}원</Text>
          <Text style={styles.dealOriginalPrice}>{deal.originalPrice.toLocaleString()}원</Text>
        </View>
        <View style={styles.dealMetaContainer}>
          <View style={styles.dealMetaItem}>
            <Ionicons name="location" size={14} color="#8b95a1" />
            <Text style={styles.dealMetaText}>{formatDistance(deal)}</Text>
          </View>
          <View style={styles.dealMetaItem}>
            <Ionicons name="time" size={14} color="#22c55e" />
            <Text style={styles.dealMetaText}>{formatTimeUntilExpiry(deal.expiryDate)}</Text>
          </View>
        </View>
        <View style={styles.dealStatsContainer}>
          <View style={styles.dealStatItem}>
            <Ionicons name="heart" size={14} color="#fa5252" />
            <Text style={styles.dealStatText}>{deal.likeCount || 0}</Text>
          </View>
          <View style={styles.dealStatItem}>
            <Ionicons name="eye" size={14} color="#228be6" />
            <Text style={styles.dealStatText}>{deal.viewCount || 0}</Text>
          </View>
        </View>
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
                          {recentOrders.map((order: Order) => (
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
              <Ionicons name="arrow-back" size={24} color="#228be6" />
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
                <ActivityIndicator size="large" color="#228be6" />
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
                {searchResults.map((deal: Deal) => (
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
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
    marginRight: 12,
  },
  headerLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  subTitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcomeCard: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#dcfce7',
    fontWeight: '500',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // 에코 섹션 스타일
  ecoSection: {
    margin: 20,
    marginTop: 0,
  },
  ecoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ecoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 8,
  },
  ecoPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecoPoints: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 8,
  },
  ecoHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ecoHistoryText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginRight: 4,
  },
  ecoStatsScroll: {
    marginBottom: 20,
  },
  ecoStatsContent: {
    paddingHorizontal: 4,
  },
  ecoStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 8,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ecoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ecoStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 6,
  },
  ecoStatLabel: {
    fontSize: 14,
    color: '#868e96',
    fontWeight: '500',
  },

  treeProjectCard: {
    backgroundColor: '#f0fdf4',
    margin: 20,
    marginTop: 0,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  treeProjectContent: {
    padding: 24,
  },
  treeProjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  treeProjectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeProjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginLeft: 8,
  },
  treeProjectProgress: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
  },
  treeProjectDesc: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 20,
    fontWeight: '500',
  },
  treeProgressBar: {
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  treeProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 6,
  },
  subTitle: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dealImage: {
    height: 120,
    width: '100%', // Make it fill the placeholder area
    borderRadius: 8,
    marginBottom: 12,
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 84,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#f0fdf4',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    color: '#495057',
  },
  categoryButtonTextActive: {
    color: '#22c55e',
  },
  todaysDealsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  moreButton: {
    color: '#228be6',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#4a5568',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 15,
    color: '#8b95a1',
    marginTop: 8,
    fontWeight: '500',
  },
  dealsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  dealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dealImagePlaceholder: {
    height: 160,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  dealDiscountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dealDiscountBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dealInfo: {
    flex: 1,
  },
  dealTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 6,
    lineHeight: 24,
  },
  dealStore: {
    fontSize: 14,
    color: '#8b95a1',
    marginBottom: 12,
    fontWeight: '500',
  },
  dealPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  dealPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191f28',
    marginRight: 8,
  },
  dealOriginalPrice: {
    fontSize: 15,
    color: '#8b95a1',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  dealMetaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  dealMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealMetaText: {
    fontSize: 13,
    color: '#8b95a1',
    fontWeight: '500',
  },
  dealStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealStatText: {
    fontSize: 13,
    color: '#8b95a1',
    fontWeight: '500',
  },
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 6,
    lineHeight: 22,
  },
  orderDate: {
    fontSize: 13,
    color: '#8b95a1',
    fontWeight: '500',
  },
  orderPrice: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 13,
    color: '#4a5568',
    fontWeight: '500',
  },

  // 검색 모달 스타일
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    borderBottomColor: '#f1f3f5',
  },
  searchCloseButton: {
    padding: 8,
  },
  searchHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
  },
  searchHeaderRight: {
    width: 40,
  },
  searchInputContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#191f28',
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
    fontSize: 15,
    color: '#4a5568',
    marginTop: 16,
    fontWeight: '500',
  },
  searchEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  searchEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginTop: 16,
    marginBottom: 8,
  },
  searchEmptyDescription: {
    fontSize: 15,
    color: '#8b95a1',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  searchResultsList: {
    paddingBottom: 20,
  },
  searchResultsHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  searchResultItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 6,
    lineHeight: 22,
  },
  searchResultStore: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 12,
    fontWeight: '500',
  },
  searchResultPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  searchResultPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191f28',
    marginRight: 8,
  },
  searchResultOriginalPrice: {
    fontSize: 14,
    color: '#8b95a1',
    textDecorationLine: 'line-through',
    marginRight: 8,
    fontWeight: '500',
  },
  searchResultDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fa5252',
  },
  searchResultTime: {
    fontSize: 13,
    color: '#fa5252',
    fontWeight: '600',
  },
});