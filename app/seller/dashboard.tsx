import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { Store, SellerAnalytics, CustomerProfile } from '../../lib/types';

const screenWidth = Dimensions.get('window').width;

function SellerDashboard() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // 테스트용 더미 데이터
      const dummyStore: Store = {
        id: 'test-store',
        name: '테스트 매장',
        description: '테스트 매장입니다.',
        address: '서울시 강남구',
        location: { latitude: 37.5665, longitude: 126.978 },
        ownerId: 'test-owner',
        category: 'food',
        images: [],
        businessHours: {
          open: '09:00',
          close: '21:00',
        },
        contactInfo: {
          phone: '02-1234-5678',
          email: 'test@example.com',
        },
        inventory: {
          items: [
            { id: '1', name: '상품1', category: 'food', quantity: 10, unit: '개', costPrice: 1000, regularPrice: 2000, minimumStock: 5 },
            { id: '2', name: '상품2', category: 'food', quantity: 3, unit: '개', costPrice: 2000, regularPrice: 4000, minimumStock: 5 },
            { id: '3', name: '상품3', category: 'food', quantity: 8, unit: '개', costPrice: 3000, regularPrice: 6000, minimumStock: 5, expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
          ],
          alerts: {
            lowStock: true,
            expiryWarning: true,
            reorderNeeded: true,
          },
        },
        rating: 4.5,
        totalDeals: 150,
        totalSold: 1200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dummyAnalytics: SellerAnalytics = {
        storeId: 'test-store',
        revenue: {
          daily: 500000,
          weekly: 3500000,
          monthly: 15000000,
          yearToDate: 180000000,
          growth: {
            daily: 15,
            weekly: 10,
            monthly: 8,
          },
        },
        hourlyStats: {
          '12:00': {
            averageOrders: 25,
            averageRevenue: 250000,
            peakDays: ['금요일', '토요일'],
          },
        },
        productStats: {
          bestSellers: [
            { dealId: '1', title: '인기상품1', totalSold: 100, revenue: 1000000 },
          ],
          categories: {
            food: { totalSold: 500, revenue: 5000000, averageDiscount: 20 },
            clothing: { totalSold: 0, revenue: 0, averageDiscount: 0 },
            household: { totalSold: 0, revenue: 0, averageDiscount: 0 },
            electronics: { totalSold: 0, revenue: 0, averageDiscount: 0 },
            books: { totalSold: 0, revenue: 0, averageDiscount: 0 },
            sports: { totalSold: 0, revenue: 0, averageDiscount: 0 },
            beauty: { totalSold: 0, revenue: 0, averageDiscount: 0 },
            other: { totalSold: 0, revenue: 0, averageDiscount: 0 },
          },
        },
        inventory: {
          totalItems: 50,
          lowStock: 5,
          expiringItems: 3,
          wasteRate: 2.5,
          turnoverRate: 8.5,
        },
        customerStats: {
          totalCustomers: 500,
          regularCustomers: 150,
          averageOrderValue: 25000,
          customerRetention: 75,
          newCustomers: {
            daily: 10,
            weekly: 50,
            monthly: 200,
          },
        },
        competitorAnalysis: {
          averagePrices: {
            food: 15000,
          },
          marketPosition: 'medium',
          priceCompetitiveness: 95,
        },
        predictions: {
          expectedRevenue: 550000,
          expectedOrders: 55,
          suggestedDiscounts: [
            { category: 'food', optimalRate: 25, expectedSales: 30 },
          ],
          peakHours: ['12:00', '18:00'],
          lowDemandHours: ['15:00', '20:00'],
        },
        lastUpdated: new Date(),
      };

      setStore(dummyStore);
      setAnalytics(dummyAnalytics);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderRevenueChart = () => {
    if (!analytics) return null;

    const data = [
      { value: analytics.revenue.daily, dataPointText: '월' },
      { value: analytics.revenue.daily * 0.8, dataPointText: '화' },
      { value: analytics.revenue.daily * 1.2, dataPointText: '수' },
      { value: analytics.revenue.daily * 0.9, dataPointText: '목' },
      { value: analytics.revenue.daily * 1.5, dataPointText: '금' },
      { value: analytics.revenue.daily * 1.3, dataPointText: '토' },
      { value: analytics.revenue.daily * 0.7, dataPointText: '일' },
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>매출 추이</Text>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
          spacing={40}
          initialSpacing={20}
          color="#e03131"
          thickness={2}
          startFillColor="#e03131"
          endFillColor="#fff5f5"
          startOpacity={0.9}
          endOpacity={0.2}
          backgroundColor="#ffffff"
          showDataPoints
          dataPointsColor="#e03131"
          textColor="#191f28"
          textFontSize={12}
          textShiftY={-20}
          textShiftX={-10}
          hideRules
          hideYAxisText
          curved
        />
      </View>
    );
  };

  const renderInventoryStatus = () => {
    if (!store?.inventory) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>재고 현황</Text>
        <View style={styles.inventoryGrid}>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryValue}>{store.inventory.items.length}</Text>
            <Text style={styles.inventoryLabel}>총 상품</Text>
          </View>
          <View style={styles.inventoryItem}>
            <Text style={[styles.inventoryValue, { color: '#e03131' }]}>
              {store.inventory.items.filter(item => item.quantity <= item.minimumStock).length}
            </Text>
            <Text style={styles.inventoryLabel}>부족 재고</Text>
          </View>
          <View style={styles.inventoryItem}>
            <Text style={[styles.inventoryValue, { color: '#e8590c' }]}>
              {store.inventory.items.filter(item => 
                item.expiryDate && new Date(item.expiryDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
              ).length}
            </Text>
            <Text style={styles.inventoryLabel}>유통기한 임박</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSalesInsights = () => {
    if (!analytics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>매출 인사이트</Text>
        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>최고 매출 시간</Text>
            <Text style={styles.insightValue}>
              {analytics.predictions.peakHours[0]}
            </Text>
            <Text style={styles.insightChange}>
              평균 대비 +45% ↑
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>추천 할인율</Text>
            <Text style={styles.insightValue}>
              {analytics.predictions.suggestedDiscounts[0]?.optimalRate}%
            </Text>
            <Text style={styles.insightChange}>
              예상 매출 +30% ↑
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerStats = () => {
    if (!analytics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>고객 분석</Text>
        <View style={styles.customerStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#e03131" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {analytics.customerStats.totalCustomers}명
              </Text>
              <Text style={styles.statLabel}>총 고객</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color="#e8590c" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {analytics.customerStats.regularCustomers}명
              </Text>
              <Text style={styles.statLabel}>단골 고객</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={24} color="#2f9e44" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>
                {analytics.customerStats.customerRetention}%
              </Text>
              <Text style={styles.statLabel}>고객 유지율</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCompetitorAnalysis = () => {
    if (!analytics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>경쟁사 분석</Text>
        <View style={styles.competitorCard}>
          <View style={styles.competitorHeader}>
            <Text style={styles.competitorTitle}>가격 경쟁력</Text>
            <View style={[
              styles.positionBadge,
              { backgroundColor: analytics.competitorAnalysis.marketPosition === 'low' ? '#e03131' :
                analytics.competitorAnalysis.marketPosition === 'medium' ? '#e8590c' : '#2f9e44' }
            ]}>
              <Text style={styles.positionText}>
                {analytics.competitorAnalysis.marketPosition === 'low' ? '저가' :
                 analytics.competitorAnalysis.marketPosition === 'medium' ? '중가' : '고가'}
              </Text>
            </View>
          </View>
          <Text style={styles.competitorScore}>
            {analytics.competitorAnalysis.priceCompetitiveness.toFixed(1)}점
          </Text>
          <Text style={styles.competitorDesc}>
            주변 매장 대비 {(analytics.competitorAnalysis.priceCompetitiveness - 100).toFixed(1)}% 
            {analytics.competitorAnalysis.priceCompetitiveness > 100 ? ' 높음' : ' 낮음'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#191f28" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대시보드</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#191f28" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e03131" style={styles.loading} />
        ) : (
          <>
            {renderRevenueChart()}
            {renderInventoryStatus()}
            {renderSalesInsights()}
            {renderCustomerStats()}
            {renderCompetitorAnalysis()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
  },
  content: {
    flex: 1,
  },
  loading: {
    marginTop: 40,
  },
  chartContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  inventoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inventoryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  inventoryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 4,
  },
  inventoryLabel: {
    fontSize: 14,
    color: '#495057',
  },
  insightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  insightTitle: {
    fontSize: 14,
    color: '#e03131',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 4,
  },
  insightChange: {
    fontSize: 14,
    color: '#2f9e44',
  },
  customerStats: {
    backgroundColor: '#ffffff',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  statInfo: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#495057',
  },
  competitorCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
  },
  competitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  competitorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
  },
  positionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  competitorScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 8,
  },
  competitorDesc: {
    fontSize: 14,
    color: '#495057',
  },
});

export default SellerDashboard;