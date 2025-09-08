import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs,
  getDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  setDoc,
  Timestamp,
  limit 
} from 'firebase/firestore';
import { Deal, Order, Store } from './types';

// 사용자 프로필 생성/업데이트
export const createOrUpdateUserProfile = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('사용자 프로필 업데이트 실패:', error);
    throw error;
  }
};

// 판매자 매장 정보 가져오기
export const getUserStore = async (userId: string): Promise<Store | null> => {
  try {
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, where('ownerId', '==', userId), limit(1));
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
    console.error('매장 정보 로드 실패:', error);
    throw error;
  }
};



// 떨이 검색
export const searchDeals = async (term: string, limitCount: number = 20) => {
  try {
    const dealsRef = collection(db, 'deals');
    const q = query(
      dealsRef,
      where('isActive', '==', true),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Deal[];
    
    // 클라이언트 사이드 검색 및 정렬
    return deals
      .filter(deal => 
        deal.title.toLowerCase().includes(term.toLowerCase()) ||
        deal.storeName.toLowerCase().includes(term.toLowerCase())
      )
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('떨이 검색 실패:', error);
    throw error;
  }
};

// 활성화된 떨이 가져오기
export const getActiveDeals = async (limitCount: number = 20) => {
  try {
    const dealsRef = collection(db, 'deals');
    const q = query(
      dealsRef,
      where('isActive', '==', true),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => ({
        id: doc.id,
      ...doc.data()
    })) as Deal[];
    
    // 클라이언트 사이드에서 정렬
    return deals.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('떨이 로드 실패:', error);
    throw error;
  }
};

// 인기 떨이 가져오기
export const getPopularDeals = async (limitCount: number = 5) => {
  try {
    const dealsRef = collection(db, 'deals');
    const q = query(
      dealsRef,
      where('isActive', '==', true),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Deal[];
    
    // 클라이언트 사이드에서 정렬하고 제한
    return deals
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limitCount);
  } catch (error) {
    console.error('인기 떨이 로드 실패:', error);
    throw error;
  }
};

// 마감 임박 떨이 가져오기
export const getExpiringDeals = async (limitCount: number = 5) => {
  try {
    const dealsRef = collection(db, 'deals');
    const now = Timestamp.now();
    const q = query(
      dealsRef,
      where('isActive', '==', true),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Deal[];
    
    // 클라이언트 사이드에서 필터링, 정렬, 제한
    return deals
      .filter(deal => deal.expiryDate > now)
      .sort((a, b) => a.expiryDate.toMillis() - b.expiryDate.toMillis())
      .slice(0, limitCount);
  } catch (error) {
    console.error('마감 임박 떨이 로드 실패:', error);
    throw error;
  }
};

// 찜한 떨이 가져오기
export const getFavoriteDeals = async (userId: string, limitCount: number = 20) => {
  try {
    const userFavoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(userFavoritesRef, limit(limitCount));
    const favoritesSnapshot = await getDocs(q);
    
    const favoriteIds = favoritesSnapshot.docs.map(doc => doc.id);
    if (favoriteIds.length === 0) return [];
    
    const dealsRef = collection(db, 'deals');
    const deals: Deal[] = [];
    
    // 찜한 떨이들을 하나씩 가져옴
    for (const dealId of favoriteIds) {
      const dealDoc = await getDoc(doc(dealsRef, dealId));
      if (dealDoc.exists()) {
        deals.push({
          id: dealDoc.id,
          ...dealDoc.data()
        } as Deal);
      }
    }
    
    return deals;
  } catch (error) {
    console.error('찜 목록 로드 실패:', error);
    throw error;
  }
};

// 찜한 매장 가져오기
export const getFavoriteStores = async (userId: string, limitCount: number = 20) => {
  try {
    const userFavoriteStoresRef = collection(db, 'users', userId, 'favoriteStores');
    const q = query(userFavoriteStoresRef, limit(limitCount));
    const favoritesSnapshot = await getDocs(q);
    
    const favoriteIds = favoritesSnapshot.docs.map(doc => doc.id);
    if (favoriteIds.length === 0) return [];
    
    const storesRef = collection(db, 'stores');
    const stores: Store[] = [];
    
    // 찜한 매장들을 하나씩 가져옴
    for (const storeId of favoriteIds) {
      const storeDoc = await getDoc(doc(storesRef, storeId));
      if (storeDoc.exists()) {
        stores.push({
          id: storeDoc.id,
          ...storeDoc.data()
        } as Store);
      }
    }
    
    return stores;
  } catch (error) {
    console.error('찜한 매장 로드 실패:', error);
    throw error;
  }
};

// 찜하기 토글 (떨이)
export const toggleDealFavorite = async (userId: string, dealId: string, value: boolean) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'favorites', dealId);
    if (value) {
      await setDoc(favoriteRef, {
        addedAt: Timestamp.now(),
        notificationsEnabled: true
      });
    } else {
      // 찜 해제는 나중에 구현
    }
  } catch (error) {
    console.error('찜하기 토글 실패:', error);
    throw error;
  }
};

// 찜하기 토글 (매장)
export const toggleStoreFavorite = async (userId: string, storeId: string, value: boolean) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'favoriteStores', storeId);
    if (value) {
      await setDoc(favoriteRef, {
        addedAt: Timestamp.now(),
        notificationsEnabled: true
      });
    } else {
      // 찜 해제는 나중에 구현
    }
  } catch (error) {
    console.error('매장 찜하기 토글 실패:', error);
    throw error;
  }
};

// 구매자별 주문 내역 가져오기
export const getOrdersByBuyer = async (buyerId: string, limitCount: number = 20) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('buyerId', '==', buyerId),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
      ...doc.data()
    })) as Order[];
    
    // 클라이언트 사이드에서 정렬
    return orders.sort((a, b) => b.orderedAt.toMillis() - a.orderedAt.toMillis());
  } catch (error) {
    console.error('주문 내역 로드 실패:', error);
    throw error;
  }
};

// 사용자 통계 가져오기
export const getUserStats = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('사용자 통계 로드 실패:', error);
    throw error;
  }
};