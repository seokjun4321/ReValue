// Firestore 데이터베이스 유틸리티 함수들

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { validateImageSize } from './imageUtils';
import { Deal, Store, User, Order, Review, collections, CategoryType } from './types';

// ===== DEAL 관련 함수 =====

/**
 * 새로운 떨이 등록
 */
export const addDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, collections.deals), {
      ...dealData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating deal:', error);
    return null;
  }
};

/**
 * 떨이 이미지 업로드 (개선된 버전)
 */
export const uploadDealImages = async (dealId: string, imageUris: string[]): Promise<string[]> => {
  try {
    // 현재 로그인한 사용자 확인
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('사용자가 로그인되어 있지 않습니다.');
    }

    const uploadedUrls: string[] = [];

    // 각 이미지 처리
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      console.log(`이미지 처리 중 ${i + 1}/${imageUris.length}`);

      // 이미지 크기 검증
      await validateImageSize(uri);
      uploadedUrls.push(uri);
    }

    console.log(`총 ${uploadedUrls.length}개 이미지 처리 완료`);
    return uploadedUrls;
  } catch (error: any) {
    console.error('떨이 이미지 처리 실패:', error);
    throw error;
  }
};

/**
 * 활성화된 떨이 목록 조회 (단순 쿼리)
 */
export const getActiveDeals = async (limitCount: number = 20): Promise<Deal[]> => {
  try {
    // 단순 쿼리로 변경 (인덱스 불필요)
    const q = query(
      collection(db, collections.deals),
      where('status', '==', 'active'),
      limit(limitCount * 2) // 필터링을 위해 더 많이 가져옴
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    
    // 클라이언트에서 필터링 및 정렬
    const deals = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Timestamp를 Date로 변환
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }) as Deal)
      .filter(deal => 
        deal.remainingQuantity > 0 && 
        deal.expiryDate && 
        deal.expiryDate > now
      )
      .sort((a, b) => b.createdAt?.getTime() - a.createdAt?.getTime())
      .slice(0, limitCount);
    
    return deals;
  } catch (error) {
    console.error('Error getting active deals:', error);
    return [];
  }
};

/**
 * 카테고리별 떨이 조회 (단순 쿼리)
 */
export const getDealsByCategory = async (category: string, limitCount: number = 20): Promise<Deal[]> => {
  try {
    // 단순 쿼리로 변경 (복합 인덱스 불필요)
    const q = query(
      collection(db, collections.deals),
      where('category', '==', category),
      limit(limitCount * 2)
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    
    // 클라이언트에서 필터링 및 정렬
    const deals = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }) as Deal)
      .filter(deal => 
        deal.status === 'active' &&
        deal.remainingQuantity > 0 &&
        deal.expiryDate && 
        deal.expiryDate > now
      )
      .sort((a, b) => b.createdAt?.getTime() - a.createdAt?.getTime())
      .slice(0, limitCount);
    
    return deals;
  } catch (error) {
    console.error('Error getting deals by category:', error);
    return [];
  }
};

/**
 * 떨이 정보 업데이트
 */
export const updateDeal = async (dealId: string, updates: Partial<Deal>, newImages?: string[]): Promise<boolean> => {
  try {
    // 현재 로그인한 사용자 확인
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('사용자가 로그인되어 있지 않습니다.');
    }

    // 떨이 정보 가져오기
    const dealRef = doc(db, collections.deals, dealId);
    const dealSnap = await getDoc(dealRef);
    
    if (!dealSnap.exists()) {
      throw new Error('존재하지 않는 떨이입니다.');
    }

    const dealData = dealSnap.data();
    
    // 권한 확인
    if (dealData.sellerId !== currentUser.uid) {
      throw new Error('이 떨이를 수정할 권한이 없습니다.');
    }

    // 이미지가 있다면 이미지 처리
    let imageUrls = dealData.images || [];
    if (newImages && newImages.length > 0) {
      // 이미지 크기 검증
      for (const imageUri of newImages) {
        await validateImageSize(imageUri);
      }
      imageUrls = newImages;
    }

    // 업데이트할 데이터 준비
    const updateData = {
      ...updates,
      images: imageUrls,
      updatedAt: serverTimestamp()
    };

    // 가격 유효성 검사
    if (updates.originalPrice !== undefined && updates.discountedPrice !== undefined) {
      if (updates.discountedPrice >= updates.originalPrice) {
        throw new Error('할인 가격은 원래 가격보다 낮아야 합니다.');
      }
    } else if (updates.discountedPrice !== undefined && updates.discountedPrice >= dealData.originalPrice) {
      throw new Error('할인 가격은 원래 가격보다 낮아야 합니다.');
    } else if (updates.originalPrice !== undefined && dealData.discountedPrice >= updates.originalPrice) {
      throw new Error('할인 가격은 원래 가격보다 낮아야 합니다.');
    }

    // 수량 유효성 검사
    if (updates.remainingQuantity !== undefined && updates.totalQuantity !== undefined) {
      if (updates.remainingQuantity > updates.totalQuantity) {
        throw new Error('남은 수량은 총 수량을 초과할 수 없습니다.');
      }
    } else if (updates.remainingQuantity !== undefined && updates.remainingQuantity > dealData.totalQuantity) {
      throw new Error('남은 수량은 총 수량을 초과할 수 없습니다.');
    }

    // 마감 시간 유효성 검사
    if (updates.expiryDate) {
      const expiryDate = updates.expiryDate instanceof Date ? updates.expiryDate : updates.expiryDate.toDate();
      if (expiryDate <= new Date()) {
        throw new Error('마감 시간은 현재 시간 이후여야 합니다.');
      }
    }

    // 데이터 업데이트
    await updateDoc(dealRef, updateData);
    return true;
  } catch (error: any) {
    console.error('떨이 수정 실패:', error);
    throw error;
  }
};

// ===== ORDER 관련 함수 =====

/**
 * 새 주문 생성
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'orderedAt'>): Promise<string | null> => {
  try {
    // Get the deal document reference
    const dealRef = doc(db, collections.deals, orderData.dealId);
    const dealDoc = await getDoc(dealRef);

    if (!dealDoc.exists()) {
      throw new Error('Deal not found');
    }

    const dealData = dealDoc.data();
    if (dealData.remainingQuantity < orderData.quantity) {
      throw new Error('Not enough quantity available');
    }

    // Create order and update deal quantity in a batch
    const batch = writeBatch(db);
    
    // Create new order
    const orderRef = doc(collection(db, collections.orders));
    batch.set(orderRef, {
      ...orderData,
      orderedAt: serverTimestamp()
    });

    // Update deal's remaining quantity
    batch.update(dealRef, {
      remainingQuantity: dealData.remainingQuantity - orderData.quantity,
      orderCount: (dealData.orderCount || 0) + 1,
      updatedAt: serverTimestamp()
    });

    // Commit the batch
    await batch.commit();
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * 구매자의 주문 내역 조회 (단순 쿼리)
 */
export const getOrdersByBuyer = async (buyerId: string): Promise<Order[]> => {
  try {
    // 단순 쿼리로 변경 (단일 필드 where절만 사용)
    const q = query(
      collection(db, collections.orders),
      where('buyerId', '==', buyerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // 클라이언트에서 정렬
    const orders = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderedAt: doc.data().orderedAt?.toDate(),
        pickupTime: doc.data().pickupTime?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      }) as Order)
      .sort((a, b) => b.orderedAt?.getTime() - a.orderedAt?.getTime());
    
    return orders;
  } catch (error) {
    console.error('Error getting orders by buyer:', error);
    return [];
  }
};

/**
 * 주문 상태 업데이트
 */
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  try {
    const orderRef = doc(db, collections.orders, orderId);
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    }
    
    await updateDoc(orderRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
};

// ===== USER 관련 함수 =====

/**
 * 프로필 이미지 업로드
 */
export const uploadProfileImage = async (userId: string, imageUri: string): Promise<string | null> => {
  try {
    // 현재 로그인한 사용자 확인
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('사용자가 로그인되어 있지 않습니다.');
    }
    
    // 권한 확인
    if (currentUser.uid !== userId) {
      throw new Error('프로필 이미지를 업로드할 권한이 없습니다.');
    }

    // 이미지 크기 검증
    await validateImageSize(imageUri);
    
    // 사용자 프로필 업데이트
    const userRef = doc(db, collections.users, userId);
    await updateDoc(userRef, {
      profileImage: imageUri,
      updatedAt: serverTimestamp()
    });
    
    return imageUri;
  } catch (error: any) {
    console.error('프로필 이미지 업로드 실패:', error);
    throw error;
  }
};

/**
 * 사용자 프로필 생성/업데이트
 */
export const createOrUpdateUserProfile = async (userId: string, userData: Partial<User>): Promise<boolean> => {
  try {
    const userRef = doc(db, collections.users, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // 기존 사용자 업데이트
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } else {
      // 새 사용자 생성
      await updateDoc(userRef, {
        id: userId,
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    return false;
  }
};

/**
 * 사용자 프로필 조회
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, collections.users, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// ===== STORE 관련 함수 =====

/**
 * 매장 정보 생성
 */
export const createStore = async (storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, collections.stores), {
      ...storeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating store:', error);
    return null;
  }
};

/**
 * 매장 정보 조회
 */
export const getStore = async (storeId: string): Promise<Store | null> => {
  try {
    const storeRef = doc(db, collections.stores, storeId);
    const storeDoc = await getDoc(storeRef);
    
    if (storeDoc.exists()) {
      const data = storeDoc.data();
      return {
        id: storeDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Store;
    }
    return null;
  } catch (error) {
    console.error('Error getting store:', error);
    return null;
  }
};

// ===== 유틸리티 함수 =====

/**
 * 거리 계산 (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // km 단위
};

/**
 * Timestamp를 Date로 변환하는 헬퍼 함수
 */
export const timestampToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return undefined;
};

// ===== 고급 쿼리 함수들 =====

/**
 * 위치 기반 떨이 검색 (거리 필터링)
 */
export const getNearbyDeals = async (
  userLat: number,
  userLon: number,
  radiusKm: number = 5,
  limitCount: number = 20
): Promise<Deal[]> => {
  try {
    // 간단한 바운딩 박스 계산 (정확하지는 않지만 빠름)
    const latDelta = radiusKm / 111; // 1도 ≈ 111km
    const lonDelta = radiusKm / (111 * Math.cos(userLat * Math.PI / 180));
    
    const q = query(
      collection(db, collections.deals),
      where('status', '==', 'active'),
      limit(limitCount * 3) // 필터링을 위해 더 많이 가져옴
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    
    // 클라이언트에서 거리 필터링
    const nearbyDeals = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }) as Deal)
      .filter(deal => {
        if (deal.remainingQuantity <= 0 || !deal.expiryDate || deal.expiryDate <= now) {
          return false;
        }
        
        const distance = calculateDistance(
          userLat, userLon,
          deal.location.latitude, deal.location.longitude
        );
        return distance <= radiusKm;
      })
      .sort((a, b) => {
        // 거리순 정렬
        const distA = calculateDistance(userLat, userLon, a.location.latitude, a.location.longitude);
        const distB = calculateDistance(userLat, userLon, b.location.latitude, b.location.longitude);
        return distA - distB;
      })
      .slice(0, limitCount);
    
    return nearbyDeals;
  } catch (error) {
    console.error('Error getting nearby deals:', error);
    return [];
  }
};

/**
 * 매장별 떨이 통계 집계
 */
export const getStoreStats = async (storeId: string) => {
  try {
    const [dealsQuery, ordersQuery] = await Promise.all([
      getDocs(query(collection(db, collections.deals), where('storeId', '==', storeId))),
      getDocs(query(collection(db, collections.orders), where('storeId', '==', storeId)))
    ]);
    
    const deals = dealsQuery.docs.map(doc => doc.data());
    const orders = ordersQuery.docs.map(doc => doc.data());
    
    const stats = {
      totalDeals: deals.length,
      activeDeals: deals.filter(deal => deal.status === 'active').length,
      totalOrders: orders.length,
      completedOrders: orders.filter(order => order.status === 'completed').length,
      totalRevenue: orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.totalPrice, 0),
      averageDiscount: deals.length > 0 
        ? deals.reduce((sum, deal) => sum + deal.discountRate, 0) / deals.length 
        : 0
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting store stats:', error);
    return null;
  }
};

/**
 * 사용자 구매 통계
 */
export const getUserStats = async (userId: string) => {
  try {
    const ordersQuery = await getDocs(
      query(collection(db, collections.orders), where('buyerId', '==', userId))
    );
    
    const orders = ordersQuery.docs.map(doc => ({
      ...doc.data(),
      orderedAt: doc.data().orderedAt?.toDate()
    }));
    
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    const stats = {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalSpent: completedOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      totalSaved: completedOrders.reduce((sum, order) => sum + order.savedAmount, 0),
      co2Saved: completedOrders.length * 0.25, // kg, 대략적인 계산
      ecoLevel: Math.floor(completedOrders.length / 10) + 1 // 10건당 레벨업
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

/**
 * 인기 떨이 (주문 수 기준)
 */
export const getPopularDeals = async (limitCount: number = 10): Promise<Deal[]> => {
  try {
    const q = query(
      collection(db, collections.deals),
      where('status', '==', 'active'),
      limit(limitCount * 2)
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    
    const popularDeals = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }) as Deal)
      .filter(deal => 
        deal.remainingQuantity > 0 && 
        deal.expiryDate && 
        deal.expiryDate > now
      )
      .sort((a, b) => b.orderCount - a.orderCount) // 주문 수 내림차순
      .slice(0, limitCount);
    
    return popularDeals;
  } catch (error) {
    console.error('Error getting popular deals:', error);
    return [];
  }
};

/**
 * 마감 임박 떨이 (6시간 이내)
 */
export const getExpiringDeals = async (limitCount: number = 10): Promise<Deal[]> => {
  try {
    const q = query(
      collection(db, collections.deals),
      where('status', '==', 'active'),
      limit(limitCount * 3)
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    
    const expiringDeals = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }) as Deal)
      .filter(deal => 
        deal.remainingQuantity > 0 && 
        deal.expiryDate && 
        deal.expiryDate > now &&
        deal.expiryDate <= sixHoursLater
      )
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()) // 마감 시간 순
      .slice(0, limitCount);
    
    return expiringDeals;
  } catch (error) {
    console.error('Error getting expiring deals:', error);
    return [];
  }
};

/**
 * 떨이 검색 (제목, 설명, 매장명으로 검색)
 */
export const searchDeals = async (searchTerm: string, limitCount: number = 20): Promise<Deal[]> => {
  try {
    if (!searchTerm.trim()) {
      return [];
    }

    // Firebase에서는 부분 문자열 검색이 제한적이므로 클라이언트에서 필터링
    const q = query(
      collection(db, collections.deals),
      where('status', '==', 'active'),
      limit(limitCount * 3) // 필터링을 위해 더 많이 가져옴
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    const searchTermLower = searchTerm.toLowerCase();
    
    const searchResults = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }) as Deal)
      .filter(deal => {
        // 기본 필터링
        if (deal.remainingQuantity <= 0 || !deal.expiryDate || deal.expiryDate <= now) {
          return false;
        }
        
        // 검색어 매칭
        const titleMatch = deal.title.toLowerCase().includes(searchTermLower);
        const descriptionMatch = deal.description?.toLowerCase().includes(searchTermLower);
        const storeMatch = deal.storeName.toLowerCase().includes(searchTermLower);
        
        return titleMatch || descriptionMatch || storeMatch;
      })
      .sort((a, b) => {
        // 검색 관련도 순 정렬 (제목 매칭이 우선순위)
        const aTitle = a.title.toLowerCase().includes(searchTermLower);
        const bTitle = b.title.toLowerCase().includes(searchTermLower);
        
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        
        // 그 다음은 생성일 순
        return b.createdAt?.getTime() - a.createdAt?.getTime();
      })
      .slice(0, limitCount);
    
    return searchResults;
  } catch (error) {
    console.error('Error searching deals:', error);
    return [];
  }
};