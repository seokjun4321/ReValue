import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPopularDeals, getUserStats } from '../../lib/firestore';
import { Deal } from '../../lib/types';
import "../global.css";
import { getPopularDummyDeals } from '../../lib/dummyData';

type RankingPeriod = 'daily' | 'weekly' | 'monthly';
type RankingCategory = 'all' | 'stores' | 'users';

export default function Ranking() {
  const router = useRouter();
  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [category, setCategory] = useState<RankingCategory>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);

  // 랭킹 데이터 로드
  const loadRankingData = async () => {
    try {
      setLoading(true);
      const deals = await getPopularDeals(20);
      // Firestore 데이터가 없으면 더미 데이터 사용
      setTopDeals(deals.length > 0 ? deals : getPopularDummyDeals(20) as Deal[]);
    } catch (error) {
      console.error('랭킹 데이터 로드 실패:', error);
      // 에러 발생 시에도 더미 데이터 표시
      setTopDeals(getPopularDummyDeals(20) as Deal[]);
    } finally {
      setLoading(false);
    }
  };

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRankingData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRankingData();
  }, [period, category]);

  // 메달 아이콘 렌더링
  const renderMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  // 랭킹 배경색
  const getRankBackgroundColor = (rank: number) => {
    if (rank === 1) return '#fff9db';
    if (rank === 2) return '#f0f0f0';
    if (rank === 3) return '#fff5e6';
    return '#ffffff';
  };

  // 시간 포맷팅
  const formatTimeUntilExpiry = (expiryDate: any): string => {
    if (!expiryDate) return "마감됨";
    
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "마감됨";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일`;
    } else if (hours > 0) {
      return `${hours}시간`;
    } else {
      return `${minutes}분`;
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 떨이 랭킹</Text>
        <Text style={styles.headerSubtitle}>인기 많은 떨이를 확인하세요</Text>
      </View>

      {/* 기간 필터 */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, period === 'daily' && styles.filterButtonActive]}
              onPress={() => setPeriod('daily')}
            >
              <Text style={[styles.filterButtonText, period === 'daily' && styles.filterButtonTextActive]}>
                오늘
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, period === 'weekly' && styles.filterButtonActive]}
              onPress={() => setPeriod('weekly')}
            >
              <Text style={[styles.filterButtonText, period === 'weekly' && styles.filterButtonTextActive]}>
                이번 주
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, period === 'monthly' && styles.filterButtonActive]}
              onPress={() => setPeriod('monthly')}
            >
              <Text style={[styles.filterButtonText, period === 'monthly' && styles.filterButtonTextActive]}>
                이번 달
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.categoryFilterSection}>
        <TouchableOpacity
          style={[styles.categoryFilterButton, category === 'all' && styles.categoryFilterButtonActive]}
          onPress={() => setCategory('all')}
        >
          <Ionicons 
            name="trophy" 
            size={18} 
            color={category === 'all' ? '#22c55e' : '#8b95a1'} 
          />
          <Text style={[styles.categoryFilterText, category === 'all' && styles.categoryFilterTextActive]}>
            전체 랭킹
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryFilterButton, category === 'stores' && styles.categoryFilterButtonActive]}
          onPress={() => setCategory('stores')}
        >
          <Ionicons 
            name="storefront" 
            size={18} 
            color={category === 'stores' ? '#22c55e' : '#8b95a1'} 
          />
          <Text style={[styles.categoryFilterText, category === 'stores' && styles.categoryFilterTextActive]}>
            매장별
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryFilterButton, category === 'users' && styles.categoryFilterButtonActive]}
          onPress={() => setCategory('users')}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={category === 'users' ? '#22c55e' : '#8b95a1'} 
          />
          <Text style={[styles.categoryFilterText, category === 'users' && styles.categoryFilterTextActive]}>
            헌터별
          </Text>
        </TouchableOpacity>
      </View>

      {/* 랭킹 리스트 */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>랭킹을 불러오는 중...</Text>
          </View>
        ) : category === 'all' ? (
          <View style={styles.rankingList}>
            {/* 상위 3명 특별 카드 */}
            <View style={styles.topThreeSection}>
              {topDeals.slice(0, 3).map((deal, index) => (
                <TouchableOpacity
                  key={deal.id}
                  style={[
                    styles.topThreeCard,
                    index === 0 && styles.topOneCard,
                  ]}
                  onPress={() => router.push(`/deal/${deal.id}`)}
                >
                  <View style={styles.topThreeMedal}>
                    <Text style={styles.medalEmoji}>{renderMedal(index + 1)}</Text>
                  </View>
                  <View style={styles.topThreeImageContainer}>
                    <Ionicons name="flame" size={48} color="#22c55e" />
                  </View>
                  <Text style={styles.topThreeTitle} numberOfLines={2}>
                    {deal.title}
                  </Text>
                  <Text style={styles.topThreeStore}>{deal.storeName}</Text>
                  <View style={styles.topThreePriceContainer}>
                    <Text style={styles.topThreePrice}>{deal.discountedPrice.toLocaleString()}원</Text>
                    <Text style={styles.topThreeDiscount}>{deal.discountRate}%</Text>
                  </View>
                  <View style={styles.topThreeStats}>
                    <View style={styles.topThreeStat}>
                      <Ionicons name="heart" size={14} color="#fa5252" />
                      <Text style={styles.topThreeStatText}>1.2k</Text>
                    </View>
                    <View style={styles.topThreeStat}>
                      <Ionicons name="eye" size={14} color="#228be6" />
                      <Text style={styles.topThreeStatText}>3.4k</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 나머지 순위 */}
            <View style={styles.regularRankingSection}>
              <Text style={styles.regularRankingTitle}>4위 ~ 20위</Text>
              {topDeals.slice(3).map((deal, index) => {
                const rank = index + 4;
                return (
                  <TouchableOpacity
                    key={deal.id}
                    style={[
                      styles.rankingItem,
                      { backgroundColor: getRankBackgroundColor(rank) }
                    ]}
                    onPress={() => router.push(`/deal/${deal.id}`)}
                  >
                    <View style={styles.rankingRank}>
                      <Text style={styles.rankingRankText}>{rank}</Text>
                    </View>
                    <View style={styles.rankingImagePlaceholder}>
                      <Ionicons name="restaurant" size={28} color="#22c55e" />
                    </View>
                    <View style={styles.rankingInfo}>
                      <Text style={styles.rankingTitle} numberOfLines={1}>
                        {deal.title}
                      </Text>
                      <Text style={styles.rankingStore}>{deal.storeName}</Text>
                      <View style={styles.rankingPriceRow}>
                        <Text style={styles.rankingPrice}>
                          {deal.discountedPrice.toLocaleString()}원
                        </Text>
                        <Text style={styles.rankingDiscount}>{deal.discountRate}%</Text>
                      </View>
                    </View>
                    <View style={styles.rankingStatsContainer}>
                      <View style={styles.rankingStatItem}>
                        <Ionicons name="heart" size={14} color="#fa5252" />
                        <Text style={styles.rankingStatText}>847</Text>
                      </View>
                      <View style={styles.rankingStatItem}>
                        <Ionicons name="time" size={14} color="#22c55e" />
                        <Text style={styles.rankingStatText}>
                          {formatTimeUntilExpiry(deal.expiryDate)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : category === 'stores' ? (
          // 매장별 랭킹
          <View style={styles.storeRankingSection}>
            <Text style={styles.sectionTitle}>🏪 인기 매장 TOP 10</Text>
            {[
              { name: '이마트24 강남점', score: 35456, deals: 127, badge: '🥇' },
              { name: 'GS25 서초점', score: 30124, deals: 98, badge: '🥈' },
              { name: 'CU 역삼점', score: 26422, deals: 85, badge: '🥉' },
              { name: '세븐일레븐 논현점', score: 21090, deals: 67 },
              { name: '이마트24 신사점', score: 17987, deals: 54 },
            ].map((store, index) => (
              <View key={index} style={styles.storeRankCard}>
                <View style={styles.storeRankLeft}>
                  <Text style={styles.storeRankNumber}>
                    {store.badge || `${index + 1}위`}
                  </Text>
                  <View>
                    <Text style={styles.storeRankName}>{store.name}</Text>
                    <Text style={styles.storeRankDeals}>등록 {store.deals}개</Text>
                  </View>
                </View>
                <View style={styles.storeRankRight}>
                  <Text style={styles.storeRankScore}>{store.score.toLocaleString()}</Text>
                  <Text style={styles.storeRankLabel}>포인트</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          // 사용자별 랭킹
          <View style={styles.userRankingSection}>
            <Text style={styles.sectionTitle}>👥 떨이 헌터 TOP 10</Text>
            {[
              { name: '음전동', score: 35456, saved: 245, badge: '🥇' },
              { name: '친선동', score: 30124, saved: 198, badge: '🥈' },
              { name: '행경동', score: 26422, saved: 167, badge: '🥉' },
              { name: '동천동', score: 21090, saved: 142 },
              { name: '성북동', score: 17987, saved: 123 },
              { name: '김석준', score: 16878, saved: 109 },
            ].map((user, index) => (
              <View key={index} style={styles.userRankCard}>
                <View style={styles.userRankLeft}>
                  <Text style={styles.userRankNumber}>
                    {user.badge || `${index + 1}위`}
                  </Text>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color="#22c55e" />
                  </View>
                  <View>
                    <Text style={styles.userRankName}>{user.name}</Text>
                    <Text style={styles.userRankSaved}>절약 {user.saved}건</Text>
                  </View>
                </View>
                <View style={styles.userRankRight}>
                  <Text style={styles.userRankScore}>{user.score.toLocaleString()}</Text>
                  <Text style={styles.userRankLabel}>포인트</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  filterButtonActive: {
    backgroundColor: '#22c55e',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b95a1',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  categoryFilterSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#dcfce7',
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b95a1',
    marginLeft: 6,
  },
  categoryFilterTextActive: {
    color: '#22c55e',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    color: '#8b95a1',
    marginTop: 16,
    fontWeight: '500',
  },
  rankingList: {
    paddingBottom: 20,
  },
  topThreeSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  topThreeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topOneCard: {
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  topThreeMedal: {
    marginBottom: 12,
  },
  medalEmoji: {
    fontSize: 32,
  },
  topThreeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  topThreeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191f28',
    textAlign: 'center',
    marginBottom: 4,
    height: 32,
  },
  topThreeStore: {
    fontSize: 11,
    color: '#8b95a1',
    marginBottom: 8,
  },
  topThreePriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  topThreePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
    marginRight: 4,
  },
  topThreeDiscount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fa5252',
  },
  topThreeStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  topThreeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topThreeStatText: {
    fontSize: 11,
    color: '#8b95a1',
    fontWeight: '500',
  },
  regularRankingSection: {
    paddingHorizontal: 20,
  },
  regularRankingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
  },
  rankingImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  rankingStore: {
    fontSize: 13,
    color: '#8b95a1',
    marginBottom: 6,
  },
  rankingPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rankingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22c55e',
    marginRight: 6,
  },
  rankingDiscount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fa5252',
  },
  rankingStatsContainer: {
    alignItems: 'flex-end',
  },
  rankingStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankingStatText: {
    fontSize: 12,
    color: '#8b95a1',
    marginLeft: 4,
    fontWeight: '500',
  },
  // 매장별 랭킹
  storeRankingSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  storeRankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeRankNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 16,
    minWidth: 40,
  },
  storeRankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  storeRankDeals: {
    fontSize: 13,
    color: '#8b95a1',
  },
  storeRankRight: {
    alignItems: 'flex-end',
  },
  storeRankScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 2,
  },
  storeRankLabel: {
    fontSize: 12,
    color: '#8b95a1',
  },
  // 사용자별 랭킹
  userRankingSection: {
    padding: 20,
  },
  userRankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userRankNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
    minWidth: 40,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userRankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  userRankSaved: {
    fontSize: 13,
    color: '#8b95a1',
  },
  userRankRight: {
    alignItems: 'flex-end',
  },
  userRankScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 2,
  },
  userRankLabel: {
    fontSize: 12,
    color: '#8b95a1',
  },
});

