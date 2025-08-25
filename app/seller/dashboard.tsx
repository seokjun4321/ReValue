import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Deal, Order, Store } from '../../lib/types';
import { auth, db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';

interface StoreStats {
  totalDeals: number;
  activeDeals: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageDiscount: number;
}

// 판매자의 매장 정보 가져오기
const getSellerStore = async (userId: string): Promise<Store | null> => {
  try {
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const storeDoc = querySnapshot.docs[0];
    return {
      id: storeDoc.id,
      ...storeDoc.data()
    } as Store;
  } catch (error) {
    console.error('매장 정보 조회 실패:', error);
    return null;
  }
};

// 판매자의 통계 정보 가져오기
const getStoreStats = async (storeId: string): Promise<StoreStats> => {
  try {
    // 떨이 통계
    const dealsRef = collection(db, 'deals');
    const dealsQuery = query(dealsRef, where('storeId', '==', storeId));
    const dealsSnapshot = await getDocs(dealsQuery);
    const deals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalDeals = deals.length;
    const activeDeals = deals.filter(deal => deal.status === 'active').length;
    
    // 주문 통계
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(ordersRef, where('storeId', '==', storeId));
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.totalPrice, 0);
    
    // 평균 할인율
    const totalDiscountRate = deals.reduce((sum, deal) => sum + deal.discountRate, 0);
    const averageDiscount = totalDeals > 0 ? totalDiscountRate / totalDeals : 0;

    return {
      totalDeals,
      activeDeals,
      totalOrders,
      completedOrders,
      totalRevenue,
      averageDiscount
    };
  } catch (error) {
    console.error('통계 정보 조회 실패:', error);
    throw error;
  }
};

// 판매자의 떨이 목록 가져오기
const getDealsByStoreId = async (storeId: string): Promise<Deal[]> => {
  try {
    const dealsRef = collection(db, 'deals');
    const q = query(
      dealsRef,
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      expiryDate: doc.data().expiryDate?.toDate()
    })) as Deal[];
  } catch (error) {
    console.error('떨이 목록 조회 실패:', error);
    return [];
  }
};

// 판매자의 주문 목록 가져오기
const getOrdersBySeller = async (storeId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('storeId', '==', storeId),
      orderBy('orderedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      orderedAt: doc.data().orderedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate()
    })) as Order[];
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    return [];
  }
};

// 떨이 상태 업데이트
const updateDeal = async (dealId: string, data: Partial<Deal>): Promise<boolean> => {
  try {
    const dealRef = doc(db, 'deals', dealId);
    await updateDoc(dealRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('떨이 상태 업데이트 실패:', error);
    return false;
  }
};


export default function SellerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // 판매 내역 상태 추가
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [store, setStore] = useState<Store | null>(null);

  // 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 현재 로그인한 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('로그인이 필요합니다.');
        router.replace('/login');
        return;
      }

      // 판매자의 매장 정보 로드
      const sellerStore = await getSellerStore(currentUser.uid);
      if (!sellerStore) {
        console.error('매장 정보를 찾을 수 없습니다.');
        return;
      }
      setStore(sellerStore);
      
      // 병렬로 통계, 떨이 목록, 주문 내역 로드
      const [storeStats, storeDeals, storeOrders] = await Promise.all([
        getStoreStats(sellerStore.id),
        getDealsByStoreId(sellerStore.id),
        getOrdersBySeller(sellerStore.id)
      ]);
      
      setStats(storeStats);
      setDeals(storeDeals);
      setOrders(storeOrders);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // 떨이 상태 변경
  const handleDealStatusChange = async (dealId: string, newStatus: Deal['status']) => {
    try {
      const success = await updateDeal(dealId, { status: newStatus });
      if (success) {
        setDeals(deals.map(deal => 
          deal.id === dealId ? { ...deal, status: newStatus } : deal
        ));
        const newStats = await getStoreStats(storeId);
        setStats(newStats);
      }
    } catch (error) {
      console.error('떨이 상태 변경 실패:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>대시보드 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>판매자 대시보드</Text>
        <TouchableOpacity onPress={() => router.push('/seller/upload')}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 통계 카드들 */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="bag" size={32} color="#22c55e" />
                <Text style={styles.statValue}>{stats.totalDeals}</Text>
                <Text style={styles.statLabel}>총 떨이</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flash" size={32} color="#3b82f6" />
                <Text style={styles.statValue}>{stats.activeDeals}</Text>
                <Text style={styles.statLabel}>활성 떨이</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="receipt" size={32} color="#f59e0b" />
                <Text style={styles.statValue}>{stats.totalOrders}</Text>
                <Text style={styles.statLabel}>총 주문</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={32} color="#10b981" />
                <Text style={styles.statValue}>
                  {(stats.totalRevenue / 10000).toFixed(1)}만원
                </Text>
                <Text style={styles.statLabel}>총 매출</Text>
              </View>
            </View>
            
            <View style={styles.fullStatCard}>
              <View style={styles.fullStatContent}>
                <Ionicons name="trending-down" size={32} color="#ef4444" />
                <View style={styles.fullStatInfo}>
                  <Text style={styles.fullStatValue}>
                    {stats.averageDiscount.toFixed(1)}%
                  </Text>
                  <Text style={styles.fullStatLabel}>평균 할인율</Text>
                </View>
                <Text style={styles.fullStatDescription}>
                  완료된 주문: {stats.completedOrders}건
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 빠른 액션 */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>빠른 액션</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/seller/upload')}
            >
              <Ionicons name="add-circle" size={24} color="#22c55e" />
              <Text style={styles.actionButtonText}>새 떨이 등록</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="bar-chart" size={24} color="#3b82f6" />
              <Text style={styles.actionButtonText}>매출 분석</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="people" size={24} color="#f59e0b" />
              <Text style={styles.actionButtonText}>고객 관리</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- 최근 판매 내역 섹션 추가 --- */}
        <View style={styles.recentSalesSection}>
          <Text style={styles.sectionTitle}>최근 판매 내역</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>아직 판매 내역이 없습니다.</Text>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.salesItem}>
                <View>
                  <Text style={styles.salesTitle}>{order.dealTitle}</Text>
                  <Text style={styles.salesDate}>{order.orderedAt.toLocaleDateString()}</Text>
                </View>
                <Text style={styles.salesPrice}>{order.totalPrice.toLocaleString()}원</Text>
              </View>
            ))
          )}
        </View>

        {/* 활성 떨이 목록 */}
        <View style={styles.activeDealsSection}>
          <Text style={styles.sectionTitle}>내 떨이 관리</Text>
          
          {deals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>등록된 떨이가 없습니다</Text>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => router.push('/seller/upload')}
              >
                <Text style={styles.emptyActionButtonText}>첫 떨이 등록하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            deals.map((deal) => (
              <View key={deal.id} style={styles.dealCard}>
                <View style={styles.dealImagePlaceholder}>
                  <Ionicons name="image" size={32} color="#dcfce7" />
                </View>
                
                <View style={styles.dealInfo}>
                  <Text style={styles.dealTitle}>{deal.title}</Text>
                  <Text style={styles.dealCategory}>{deal.category}</Text>
                  <View style={styles.dealPriceContainer}>
                    <Text style={styles.dealPrice}>
                      {deal.discountedPrice.toLocaleString()}원
                    </Text>
                    <Text style={styles.dealOriginalPrice}>
                      {deal.originalPrice.toLocaleString()}원
                    </Text>
                    <Text style={styles.dealDiscount}>{deal.discountRate}% 할인</Text>
                  </View>
                  <Text style={styles.dealQuantity}>
                    남은 수량: {deal.remainingQuantity}/{deal.totalQuantity}
                  </Text>
                </View>
                
                <View style={styles.dealActions}>
                  <View style={[
                    styles.statusBadge,
                    deal.status === 'active' && styles.statusActive,
                    deal.status === 'expired' && styles.statusExpired,
                    deal.status === 'sold_out' && styles.statusSoldOut
                  ]}>
                    <Text style={styles.statusText}>
                      {deal.status === 'active' && '활성'}
                      {deal.status === 'expired' && '마감'}
                      {deal.status === 'sold_out' && '품절'}
                      {deal.status === 'cancelled' && '취소'}
                    </Text>
                  </View>
                  
                  {deal.status === 'active' && (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.actionButtonSmall}
                        onPress={() => handleDealStatusChange(deal.id, 'cancelled')}
                      >
                        <Ionicons name="pause-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButtonSmall}
                        onPress={() => router.push(`/seller/edit/${deal.id}`)}
                      >
                        <Ionicons name="create" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  loadingText: {
    fontSize: 16,
    color: '#166534',
    marginTop: 12,
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
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 4,
  },
  fullStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginTop: 12,
  },
  fullStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullStatInfo: {
    flex: 1,
    marginLeft: 16,
  },
  fullStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
  },
  fullStatLabel: {
    fontSize: 14,
    color: '#16a34a',
    marginTop: 2,
  },
  fullStatDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 16,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  activeDealsSection: {
    marginBottom: 40,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyActionButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  emptyActionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  dealImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  dealCategory: {
    fontSize: 12,
    color: '#16a34a',
    marginBottom: 6,
  },
  dealPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    marginRight: 8,
  },
  dealOriginalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  dealDiscount: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  dealQuantity: {
    fontSize: 12,
    color: '#16a34a',
  },
  dealActions: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusExpired: {
    backgroundColor: '#fee2e2',
  },
  statusSoldOut: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
  },
  actionButtonSmall: {
    padding: 6,
    marginHorizontal: 2,
  },
  // --- 최근 판매 내역 스타일 ---
  recentSalesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  salesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  salesTitle: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '500',
  },
  salesDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  salesPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
});