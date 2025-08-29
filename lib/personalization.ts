import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  setDoc,
  Timestamp,
  GeoPoint
} from 'firebase/firestore';
import { 
  Deal, 
  UserPreferences, 
  PurchaseHistory, 
  AIRecommendation,
  CategoryType
} from './types';

// 사용자 선호도 가져오기
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error('사용자 선호도 로드 실패:', error);
    return null;
  }
};

// 구매 이력 가져오기
export const getPurchaseHistory = async (userId: string): Promise<PurchaseHistory | null> => {
  try {
    const docRef = doc(db, 'purchaseHistory', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PurchaseHistory;
    }
    return null;
  } catch (error) {
    console.error('구매 이력 로드 실패:', error);
    return null;
  }
};

// AI 추천 가져오기
export const getAIRecommendations = async (userId: string): Promise<AIRecommendation[]> => {
  try {
    const q = query(
      collection(db, 'recommendations'),
      where('userId', '==', userId),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('expiresAt'),
      orderBy('score', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as AIRecommendation);
  } catch (error) {
    console.error('AI 추천 로드 실패:', error);
    return [];
  }
};

// 개인화된 떨이 목록 가져오기
export const getPersonalizedDeals = async (
  userId: string,
  userPrefs?: UserPreferences,
  purchaseHistory?: PurchaseHistory
): Promise<Deal[]> => {
  try {
    // 사용자 데이터가 없으면 로드
    if (!userPrefs) {
      userPrefs = await getUserPreferences(userId);
    }
    if (!purchaseHistory) {
      purchaseHistory = await getPurchaseHistory(userId);
    }

    // 선호 카테고리 기반 쿼리
    const preferredCategories = userPrefs?.categories
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.category) || [];

    // 선호 가격대 기반 필터
    const maxPrice = userPrefs?.customization?.maxPrice || Infinity;
    const minDiscountRate = userPrefs?.customization?.minDiscountRate || 0;

    // 위치 기반 필터
    const userLocations = userPrefs?.locations || [];
    const maxDistance = userPrefs?.customization?.maxDistance || 10; // km

    // 기본 쿼리
    const q = query(
      collection(db, 'deals'),
      where('status', '==', 'active'),
      where('discountRate', '>=', minDiscountRate),
      where('discountedPrice', '<=', maxPrice),
      orderBy('discountRate', 'desc'),
      limit(20)
    );

    const deals = await getDocs(q);
    let personalizedDeals = deals.docs.map(doc => doc.data() as Deal);

    // 위치 기반 필터링
    if (userLocations.length > 0 && userPrefs?.customization?.useLocation) {
      personalizedDeals = personalizedDeals.filter(deal => {
        // 사용자의 모든 관심 위치에 대해 거리 체크
        return userLocations.some(location => {
          const distance = calculateDistance(
            location.coordinates.latitude,
            location.coordinates.longitude,
            deal.location.latitude,
            deal.location.longitude
          );
          return distance <= maxDistance;
        });
      });
    }

    // 선호도 기반 정렬
    personalizedDeals.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 카테고리 선호도
      const categoryScoreA = preferredCategories.indexOf(a.category);
      const categoryScoreB = preferredCategories.indexOf(b.category);
      scoreA += categoryScoreA > -1 ? (3 - categoryScoreA) * 2 : 0;
      scoreB += categoryScoreB > -1 ? (3 - categoryScoreB) * 2 : 0;

      // 할인율
      scoreA += a.discountRate / 100;
      scoreB += b.discountRate / 100;

      // 구매 이력 기반 점수
      if (purchaseHistory) {
        const categoryStatsA = purchaseHistory.categoryStats[a.category];
        const categoryStatsB = purchaseHistory.categoryStats[b.category];
        
        if (categoryStatsA) {
          scoreA += categoryStatsA.orderCount * 0.5;
        }
        if (categoryStatsB) {
          scoreB += categoryStatsB.orderCount * 0.5;
        }

        const storeStatsA = purchaseHistory.storeStats[a.storeId];
        const storeStatsB = purchaseHistory.storeStats[b.storeId];
        
        if (storeStatsA) {
          scoreA += storeStatsA.orderCount;
        }
        if (storeStatsB) {
          scoreB += storeStatsB.orderCount;
        }
      }

      return scoreB - scoreA;
    });

    return personalizedDeals;
  } catch (error) {
    console.error('개인화된 떨이 로드 실패:', error);
    return [];
  }
};

// 거리 계산 함수 (Haversine formula)
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

// 구매 패턴 분석 및 업데이트
export const analyzePurchasePatterns = async (userId: string): Promise<void> => {
  try {
    const purchaseHistory = await getPurchaseHistory(userId);
    if (!purchaseHistory) return;

    // 카테고리별 구매 빈도 분석
    const frequentCategories = Object.entries(purchaseHistory.categoryStats)
      .sort(([, a], [, b]) => b.orderCount - a.orderCount)
      .slice(0, 3)
      .map(([category]) => category as CategoryType);

    // 자주 방문하는 매장 분석
    const frequentStores = Object.entries(purchaseHistory.storeStats)
      .sort(([, a], [, b]) => b.orderCount - a.orderCount)
      .slice(0, 5)
      .map(([storeId]) => storeId);

    // 시간대별 구매 패턴 분석
    const usualPurchaseTimes = Object.entries(purchaseHistory.timeStats.hourly)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    // 선호도 업데이트
    const userPrefs = await getUserPreferences(userId);
    if (userPrefs) {
      await updateDoc(doc(db, 'userPreferences', userId), {
        'purchasePatterns.frequentCategories': frequentCategories,
        'purchasePatterns.frequentStores': frequentStores,
        'purchasePatterns.usualPurchaseTimes': usualPurchaseTimes,
        'purchasePatterns.lastAnalyzed': Timestamp.now(),
        'purchasePatterns.averageOrderValue': purchaseHistory.stats.averageOrderValue,
      });
    }
  } catch (error) {
    console.error('구매 패턴 분석 실패:', error);
  }
};

// 선호도 업데이트
export const updateUserPreferences = async (
  userId: string,
  updates: Partial<UserPreferences>
): Promise<void> => {
  try {
    const docRef = doc(db, 'userPreferences', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('선호도 업데이트 실패:', error);
  }
};

// 추천 결과 추적
export const trackRecommendation = async (
  recommendationId: string,
  action: 'click' | 'purchase'
): Promise<void> => {
  try {
    const docRef = doc(db, 'recommendations', recommendationId);
    const updates = action === 'click'
      ? { clickedAt: Timestamp.now() }
      : { purchasedAt: Timestamp.now() };
    
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('추천 추적 실패:', error);
  }
};
