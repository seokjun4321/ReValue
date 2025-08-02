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
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
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
 * 떨이 이미지 업로드
 */
export const uploadDealImages = async (dealId: string, imageUris: string[]): Promise<string[]> => {
  try {
    const uploadPromises = imageUris.map(async (uri, index) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `deals/${dealId}/image_${index}.jpg`);
      await uploadBytes(imageRef, blob);
      return getDownloadURL(imageRef);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading images:', error);
    return [];
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
export const updateDeal = async (dealId: string, updates: Partial<Deal>): Promise<boolean> => {
  try {
    const dealRef = doc(db, collections.deals, dealId);
    await updateDoc(dealRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating deal:', error);
    return false;
  }
};

// ===== ORDER 관련 함수 =====

/**
 * 새 주문 생성
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'orderedAt'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, collections.orders), {
      ...orderData,
      orderedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
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