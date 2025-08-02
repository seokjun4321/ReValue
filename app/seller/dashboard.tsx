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
import { getStoreStats, getDealsByCategory, updateDeal } from '../../lib/firestore';
import { Deal } from '../../lib/types';
import { auth } from '../../firebase';

interface StoreStats {
  totalDeals: number;
  activeDeals: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageDiscount: number;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 임시 매장 ID (실제로는 현재 사용자의 매장 ID를 가져와야 함)
  const storeId = 'temp_store_id';

  // 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 통계와 떨이 목록 로드
      const [storeStats, activeDeals] = await Promise.all([
        getStoreStats(storeId),
        loadStoreDeals()
      ]);
      
      setStats(storeStats);
      setDeals(activeDeals);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 매장의 떨이 목록 로드
  const loadStoreDeals = async (): Promise<Deal[]> => {
    // 임시로 모든 떨이를 가져와서 매장 ID로 필터링
    // 실제로는 storeId로 쿼리해야 함
    const allDeals = await getDealsByCategory('food', 20);
    return allDeals.filter(deal => deal.storeId === storeId);
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
        // 로컬 상태 업데이트
        setDeals(deals.map(deal => 
          deal.id === dealId ? { ...deal, status: newStatus } : deal
        ));
        
        // 통계 새로고침
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
                      
                      <TouchableOpacity style={styles.actionButtonSmall}>
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
  
  // 통계 카드
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
  
  // 빠른 액션
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
  
  // 떨이 목록
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
});