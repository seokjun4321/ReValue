import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Deal, AIRecommendation, UserPreferences, CategoryType } from '../lib/types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../lib/types';

interface PersonalizedFeedProps {
  userId: string;
}

export default function PersonalizedFeed({ userId }: PersonalizedFeedProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    loadPersonalizedContent();
  }, [userId]);

  const loadPersonalizedContent = async () => {
    try {
      setLoading(true);
      // TODO: Firestore에서 데이터 로드
      // const userPrefs = await getUserPreferences(userId);
      // const recommendations = await getAIRecommendations(userId);
      // const deals = await getPersonalizedDeals(userId);
      
      // 테스트용 더미 데이터
      const dummyRecommendations: AIRecommendation[] = [
        {
          id: '1',
          userId,
          type: 'deal',
          score: 0.95,
          reason: '자주 구매하는 카테고리의 높은 할인율 상품',
          targetId: 'deal1',
          category: 'food',
          basedOn: {
            purchaseHistory: true,
            preferences: true,
          },
          shown: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        // ... 더 많은 추천 항목
      ];

      const dummyDeals: Deal[] = [
        {
          id: 'deal1',
          title: '신선한 제철 과일 세트',
          description: '오늘 입고된 신선한 제철 과일 모음',
          category: 'food',
          images: [],
          originalPrice: 30000,
          discountedPrice: 15000,
          discountRate: 50,
          totalQuantity: 10,
          remainingQuantity: 5,
          expiryDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          storeId: 'store1',
          storeName: '착한청과',
          location: {
            latitude: 37.5665,
            longitude: 126.978,
          },
          status: 'active',
          viewCount: 150,
          favoriteCount: 25,
          orderCount: 5,
        },
        // ... 더 많은 상품
      ];

      setRecommendations(dummyRecommendations);
      setDeals(dummyDeals);
    } catch (error) {
      console.error('개인화 콘텐츠 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPersonalizedContent();
    setRefreshing(false);
  };

  const renderCategoryFilters = () => {
    const categories: (CategoryType | 'all')[] = ['all', 'food', 'clothing', 'household', 'electronics', 'books', 'sports', 'beauty'];
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilters}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected,
              category !== 'all' && { backgroundColor: CATEGORY_COLORS[category] + '10' },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            {category !== 'all' && (
              <Ionicons
                name={CATEGORY_ICONS[category] as any}
                size={16}
                color={selectedCategory === category ? '#ffffff' : CATEGORY_COLORS[category]}
                style={styles.categoryIcon}
              />
            )}
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category && styles.categoryLabelSelected,
                category !== 'all' && { color: CATEGORY_COLORS[category] },
              ]}
            >
              {category === 'all' ? '전체' : CATEGORY_LABELS[category]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderDealCard = (deal: Deal) => {
    const timeLeft = new Date(deal.expiryDate).getTime() - Date.now();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <TouchableOpacity
        key={deal.id}
        style={styles.dealCard}
        onPress={() => router.push('/deal/' + deal.id)}
      >
        <View style={styles.dealImageContainer}>
          {deal.images.length > 0 ? (
            <Image
              source={{ uri: deal.images[0] }}
              style={styles.dealImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.dealImage, styles.dealImagePlaceholder]}>
              <Ionicons name={CATEGORY_ICONS[deal.category]} size={32} color="#e5e7eb" />
            </View>
          )}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{deal.discountRate}%</Text>
          </View>
        </View>
        
        <View style={styles.dealInfo}>
          <Text style={styles.storeName}>{deal.storeName}</Text>
          <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.discountedPrice}>
              {deal.discountedPrice.toLocaleString()}원
            </Text>
            <Text style={styles.originalPrice}>
              {deal.originalPrice.toLocaleString()}원
            </Text>
          </View>
          
          <View style={styles.dealFooter}>
            <View style={styles.timeLeft}>
              <Ionicons name="time" size={14} color="#22c55e" />
              <Text style={styles.timeLeftText}>
                {hoursLeft > 0 ? `${hoursLeft}시간 ` : ''}{minutesLeft}분 남음
              </Text>
            </View>
            <View style={styles.dealStats}>
              <Text style={styles.statText}>♥ {deal.favoriteCount}</Text>
              <Text style={styles.statText}>👁️ {deal.viewCount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {renderCategoryFilters()}
      
      <View style={styles.dealsGrid}>
        {deals
          .filter(deal => selectedCategory === 'all' || deal.category === selectedCategory)
          .map(renderDealCard)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  categoryFilters: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  categoryFiltersContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  categoryChipSelected: {
    backgroundColor: '#22c55e',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  categoryLabelSelected: {
    color: '#ffffff',
  },
  dealsGrid: {
    padding: 16,
  },
  dealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  dealImagePlaceholder: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dealInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 14,
    color: '#868e96',
    marginBottom: 4,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#adb5bd',
    textDecorationLine: 'line-through',
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLeftText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  dealStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#868e96',
    marginLeft: 8,
  },
});
