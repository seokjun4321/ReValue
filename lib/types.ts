// ReValue 앱의 핵심 데이터 타입 정의

export interface User {
  id: string;
  email: string;
  displayName: string;
  profileImage?: string;
  userType: 'buyer' | 'seller' | 'both';
  createdAt: Date;
  updatedAt: Date;
  
  // 구매자 정보
  favoriteStores?: string[]; // Store IDs
  favoriteDeals?: string[]; // Deal IDs
  totalOrders?: number;
  totalSaved?: number; // 절약한 금액
  
  // 판매자 정보
  storeId?: string;
  businessLicense?: string;
  phoneNumber?: string;
  
  // 설정
  notificationSettings?: {
    newDealsNearby: boolean;
    favoriteStoreUpdates: boolean;
    expiryAlerts: boolean;
    priceDrops: boolean;
  };
}

export interface Store {
  id: string;
  name: string;
  description: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  ownerId: string; // User ID
  category: CategoryType;
  images: string[];
  
  // 운영 정보
  businessHours: {
    open: string; // "09:00"
    close: string; // "21:00"
    closed?: string[]; // ["일요일"]
  };
  contactInfo: {
    phone: string;
    email?: string;
  };
  
  // 통계
  rating: number;
  totalDeals: number;
  totalSold: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  images: string[];
  
  // 가격 정보
  originalPrice: number;
  discountedPrice: number;
  discountRate: number; // 할인율 (%)
  
  // 재고 정보
  totalQuantity: number;
  remainingQuantity: number;
  
  // 시간 정보
  expiryDate: Date; // 마감 시간
  createdAt: Date;
  updatedAt: Date;
  
  // 위치 정보
  storeId: string;
  storeName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  
  // 상태
  status: 'active' | 'expired' | 'sold_out' | 'cancelled';
  
  // 통계
  viewCount: number;
  favoriteCount: number;
  orderCount: number;
}

export interface Order {
  id: string;
  dealId: string;
  dealTitle: string;
  buyerId: string;
  sellerId: string;
  storeId: string;
  
  // 주문 정보
  quantity: number;
  totalPrice: number;
  originalPrice: number;
  savedAmount: number;
  
  // 상태 및 시간
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  orderedAt: Date;
  pickupTime?: Date;
  completedAt?: Date;
  
  // 연락처 (픽업용)
  buyerContact: string;
  
  // 리뷰
  reviewed: boolean;
  reviewId?: string;
}

export interface Review {
  id: string;
  orderId: string;
  dealId: string;
  storeId: string;
  buyerId: string;
  
  // 평가
  rating: number; // 1-5
  comment: string;
  images?: string[];
  
  // 응답
  storeReply?: string;
  storeRepliedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// 카테고리 타입
export type CategoryType = 'food' | 'clothing' | 'household' | 'electronics' | 'books' | 'sports' | 'beauty' | 'other';

// 카테고리 한글 라벨
export const CATEGORY_LABELS: Record<CategoryType, string> = {
  food: '음식',
  clothing: '의류',
  household: '생활용품',
  electronics: '전자제품',
  books: '도서',
  sports: '스포츠',
  beauty: '뷰티',
  other: '기타'
};

// 카테고리별 색상
export const CATEGORY_COLORS: Record<CategoryType, string> = {
  food: '#ef4444',      // 빨강
  clothing: '#3b82f6',  // 파랑
  household: '#8b5cf6', // 보라
  electronics: '#06b6d4', // 청록
  books: '#f59e0b',     // 주황
  sports: '#10b981',    // 녹색
  beauty: '#ec4899',    // 핑크
  other: '#6b7280'      // 회색
};

// 카테고리별 아이콘
export const CATEGORY_ICONS: Record<CategoryType, string> = {
  food: 'restaurant',
  clothing: 'shirt',
  household: 'home',
  electronics: 'phone-portrait',
  books: 'book',
  sports: 'football',
  beauty: 'flower',
  other: 'ellipsis-horizontal'
};

// Firestore 컬렉션 이름
export const collections = {
  users: 'users',
  stores: 'stores',
  deals: 'deals',
  orders: 'orders',
  reviews: 'reviews'
} as const;