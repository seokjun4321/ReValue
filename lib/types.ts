// ReValue 앱의 핵심 데이터 타입 정의

// 판매자 승인 상태
export type SellerApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// 판매자 승인 요청
export interface SellerApprovalRequest {
  id: string;
  userId: string;
  businessName: string;
  businessLicense: string;
  registrationNumber: string;
  representativeName: string;
  phoneNumber: string;
  address: string;
  
  // 필수 서류
  documents: {
    businessLicenseImage: string;  // 사업자등록증
    idCardImage: string;          // 신분증
    storeImages: string[];        // 매장 사진
    additionalDocs?: string[];    // 추가 서류
  };
  
  // 승인 정보
  status: SellerApprovalStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  comments?: string;
  
  // 수정 요청 정보
  revisionRequired?: {
    required: boolean;
    items: string[];
    deadline: Date;
  };
}

// 환경 보호 활동 타입
export type EcoActivityType = 
  | 'reusable_container'  // 다회용기 사용
  | 'no_disposables'      // 일회용품 미사용
  | 'tree_planting'       // 나무 심기 참여
  | 'eco_review'          // 환경 보호 리뷰 작성
  | 'eco_challenge';      // 환경 보호 챌린지 참여

// 환경 보호 효과
export interface EcoImpact {
  co2Reduced: number;     // 감소된 CO2 (kg)
  treesPlanted: number;   // 심은 나무 수
  plasticReduced: number; // 절약한 플라스틱 (kg)
  waterSaved: number;     // 절약한 물 (L)
}

// 에코 포인트 활동
export interface EcoActivity {
  id: string;
  userId: string;
  type: EcoActivityType;
  points: number;
  impact: Partial<EcoImpact>;
  timestamp: Date;
  verifiedBy?: string;    // 판매자 ID (검증한 경우)
  proof?: string;         // 인증 사진 URL
}

// 에코 챌린지
export interface EcoChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  impact: Partial<EcoImpact>;
  startDate: Date;
  endDate: Date;
  participants: number;
  targetGoal: number;     // 목표 참여자 수
  currentProgress: number; // 현재 달성률
}

// 나무 심기 프로젝트
export interface TreeProject {
  id: string;
  title: string;
  description: string;
  location: string;
  targetTrees: number;    // 목표 나무 수
  plantedTrees: number;   // 심은 나무 수
  pointsPerTree: number;  // 나무 1그루당 포인트
  startDate: Date;
  endDate: Date;
  images: string[];
  participants: string[]; // 참여자 ID 목록
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  profileImage?: string;
  userType: 'buyer' | 'seller' | 'both' | 'admin';
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
  sellerStatus?: SellerApprovalStatus;
  approvalRequestId?: string;
  
  // 환경 보호 정보
  ecoPoints: number;
  ecoActivities: EcoActivity[];
  ecoImpact: EcoImpact;
  participatingChallenges: string[];  // 참여 중인 챌린지 ID
  plantedTrees: number;
  
  // 설정
  notificationSettings?: {
    newDealsNearby: boolean;
    favoriteStoreUpdates: boolean;
    expiryAlerts: boolean;
    priceDrops: boolean;
    ecoActivities: boolean;    // 환경 보호 활동 알림
    challengeUpdates: boolean; // 챌린지 업데이트 알림
  };
}

// 판매자 분석 데이터
export interface SellerAnalytics {
  storeId: string;
  
  // 매출 분석
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearToDate: number;
    growth: {
      daily: number;  // 전일 대비 성장률
      weekly: number; // 전주 대비 성장률
      monthly: number; // 전월 대비 성장률
    };
  };

  // 시간대별 분석
  hourlyStats: {
    [hour: string]: {  // "09:00"
      averageOrders: number;
      averageRevenue: number;
      peakDays: string[];  // ["월요일", "금요일"]
    };
  };

  // 상품 분석
  productStats: {
    bestSellers: Array<{
      dealId: string;
      title: string;
      totalSold: number;
      revenue: number;
    }>;
    categories: {
      [category in CategoryType]: {
        totalSold: number;
        revenue: number;
        averageDiscount: number;
      };
    };
  };

  // 재고 분석
  inventory: {
    totalItems: number;
    lowStock: number;  // 부족 재고 수
    expiringItems: number;  // 유통기한 임박 상품 수
    wasteRate: number;  // 폐기율
    turnoverRate: number;  // 재고 회전율
  };

  // 고객 분석
  customerStats: {
    totalCustomers: number;
    regularCustomers: number;  // 단골 고객 수
    averageOrderValue: number;
    customerRetention: number;  // 고객 유지율
    newCustomers: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };

  // 경쟁 분석
  competitorAnalysis: {
    averagePrices: {
      [category in CategoryType]?: number;
    };
    marketPosition: 'low' | 'medium' | 'high';  // 가격 포지셔닝
    priceCompetitiveness: number;  // 가격 경쟁력 지수
  };

  // 예측 분석
  predictions: {
    expectedRevenue: number;
    expectedOrders: number;
    suggestedDiscounts: Array<{
      category: CategoryType;
      optimalRate: number;
      expectedSales: number;
    }>;
    peakHours: string[];  // ["12:00", "18:00"]
    lowDemandHours: string[];
  };

  lastUpdated: Date;
}

// 고객 관리
export interface CustomerProfile {
  id: string;
  storeId: string;
  userId: string;
  
  // 기본 정보
  visitCount: number;
  totalSpent: number;
  firstVisit: Date;
  lastVisit: Date;
  
  // 선호도 분석
  preferences: {
    categories: Array<{
      category: CategoryType;
      purchaseCount: number;
    }>;
    visitTimes: string[];  // ["12:00", "18:00"]
    averageOrderValue: number;
  };
  
  // 구매 패턴
  purchasePattern: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
    preferredDays: string[];  // ["월요일", "금요일"]
    preferredPaymentMethod: string;
  };
  
  // 프로모션 참여
  promotions: Array<{
    id: string;
    type: string;
    usedAt: Date;
    discount: number;
  }>;
  
  // 고객 등급
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  
  // 커뮤니케이션
  notificationPreferences: {
    deals: boolean;
    events: boolean;
    reminders: boolean;
  };
  
  // 피드백
  feedback: Array<{
    date: Date;
    rating: number;
    comment: string;
    resolved: boolean;
  }>;
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
  
  // 재고 관리
  inventory: {
    items: Array<{
      id: string;
      name: string;
      category: CategoryType;
      quantity: number;
      unit: string;
      costPrice: number;
      regularPrice: number;
      expiryDate?: Date;
      minimumStock: number;
      reorderPoint: number;
      supplier?: string;
    }>;
    alerts: {
      lowStock: boolean;
      expiryWarning: boolean;
      reorderNeeded: boolean;
    };
  };
  
  // 프로모션 관리
  promotions: Array<{
    id: string;
    title: string;
    description: string;
    type: 'discount' | 'bundle' | 'loyalty' | 'flash_sale';
    startDate: Date;
    endDate: Date;
    conditions: {
      minPurchase?: number;
      targetCustomers?: string[];  // ['new', 'regular', 'all']
      limitPerCustomer?: number;
    };
    benefits: {
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      bonusItems?: string[];
    };
    status: 'active' | 'scheduled' | 'ended';
    performance?: {
      redemptions: number;
      revenue: number;
      customerAcquisition: number;
    };
  }>;
  
  // 통계
  rating: number;
  totalDeals: number;
  totalSold: number;
  analytics?: SellerAnalytics;
  customerProfiles?: CustomerProfile[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  distance?: number;
  popularity?: number;
  tags?: string[];
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
  
  // 신규 매장 여부
  isNew?: boolean;
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
  estimatedArrivalTime?: Date;
  
  // 연락처 (픽업용)
  buyerContact: string;
  
  // 리뷰
  reviewed: boolean;
  reviewId?: string;

  // 간편 주문 관련
  isQuickOrder: boolean;
  quickOrderPreferences?: {
    preferredPickupTime?: string;  // "18:00"
    preferredPaymentMethod?: string;
    specialInstructions?: string;
  };

  // 재주문 관련
  isReorder: boolean;
  originalOrderId?: string;
}

// 사용자 알림 설정
export interface NotificationPreferences {
  userId: string;
  
  // 매장별 설정
  storeNotifications: {
    [storeId: string]: {
      enabled: boolean;
      newDeals: boolean;
      specialOffers: boolean;
      lastNotificationSent?: Date;
    };
  };

  // 주문 관련 알림
  orderNotifications: {
    orderConfirmation: boolean;
    pickupReminder: boolean;
    arrivalReminder: boolean;
    reminderTiming: number;  // 픽업 몇 분 전에 알림을 받을지 (기본값: 10분)
  };

  // 할인 알림
  dealNotifications: {
    nearbyDeals: boolean;
    favoriteItemDeals: boolean;
    lastMinuteDeals: boolean;
    minDiscountRate: number;  // 몇 % 이상 할인시 알림을 받을지
    maxDistance: number;      // 몇 km 이내의 떨이 알림을 받을지
  };
}

// 자주 구매하는 상품
export interface FrequentPurchase {
  userId: string;
  items: Array<{
    dealId: string;
    storeId: string;
    purchaseCount: number;
    lastPurchased: Date;
    averageQuantity: number;
    preferredPickupTime?: string;
  }>;
  stores: Array<{
    storeId: string;
    visitCount: number;
    lastVisited: Date;
    favoriteItems: string[];  // dealIds
    averageSpending: number;
  }>;
}

// 스마트 알림
export interface SmartNotification {
  id: string;
  userId: string;
  type: 'order_status' | 'pickup_reminder' | 'arrival_reminder' | 'new_deal' | 'last_minute_deal';
  title: string;
  message: string;
  data: {
    orderId?: string;
    dealId?: string;
    storeId?: string;
    arrivalTime?: Date;
    discountRate?: number;
    expiryTime?: Date;
  };
  status: 'pending' | 'sent' | 'read' | 'acted_upon';
  scheduledFor: Date;
  sentAt?: Date;
  readAt?: Date;
  actedAt?: Date;
}

export interface Review {
  id: string;
  orderId: string;
  dealId: string;
  storeId: string;
  buyerId: string;
  
  // 평가 항목
  ratings: {
    overall: number;      // 전체 평점 (1-5)
    freshness: number;    // 신선도
    value: number;        // 가격 만족도
    service: number;      // 서비스
  };
  comment: string;
  images: string[];      // 필수 사진 리뷰
  tags: string[];        // 리뷰 태그 (#신선해요, #친절해요 등)
  
  // 리뷰 상태
  isVerified: boolean;   // 구매 인증 리뷰
  helpfulCount: number;  // 도움이 됐어요 수
  
  // 응답
  storeReply?: string;
  storeRepliedAt?: Date;
  
  // 보상 정보
  rewardPoints: number;  // 리뷰 보상 포인트
  
  createdAt: Date;
  updatedAt: Date;
}

// 리뷰어 뱃지 시스템
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'reviews' | 'photos' | 'helpful' | 'eco';
    count: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// 커뮤니티 게시글
export interface Post {
  id: string;
  authorId: string;
  category: 'tips' | 'restaurants' | 'eco' | 'general';
  title: string;
  content: string;
  images: string[];
  tags: string[];
  
  // 위치 정보 (맛집 정보의 경우)
  location?: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // 상호작용
  likes: number;
  comments: number;
  shares: number;
  
  // 에코 실천 관련
  ecoImpact?: {
    category: 'waste' | 'energy' | 'water' | 'etc';
    savedAmount: number;  // 절약한 양
    unit: string;        // 단위 (kg, L 등)
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 댓글
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  
  // 대댓글
  parentId?: string;
  replies?: number;
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

// AI 추천 시스템
export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'deal' | 'store' | 'category';
  score: number;  // 추천 점수 (0-1)
  reason: string; // 추천 이유
  
  // 추천 대상 정보
  targetId: string;  // dealId 또는 storeId
  category?: CategoryType;
  
  // 추천 기준
  basedOn: {
    purchaseHistory?: boolean;
    preferences?: boolean;
    location?: boolean;
    trending?: boolean;
    similar?: boolean;
  };
  
  // 추천 결과 추적
  shown: boolean;
  clickedAt?: Date;
  purchasedAt?: Date;
  
  createdAt: Date;
  expiresAt: Date;
}

// 사용자 선호도
export interface UserPreferences {
  userId: string;
  
  // 카테고리 선호도
  categories: Array<{
    category: CategoryType;
    score: number;  // 0-1
    lastInteraction: Date;
  }>;
  
  // 가격대 선호도
  priceRanges: Array<{
    min: number;
    max: number;
    score: number;
  }>;
  
  // 시간대 선호도
  timePreferences: {
    preferredDays: Array<{
      day: string;  // "월요일"
      score: number;
    }>;
    preferredHours: Array<{
      hour: string;  // "18:00"
      score: number;
    }>;
  };
  
  // 위치 선호도
  locations: Array<{
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    radius: number;  // km
    score: number;
    type: 'home' | 'work' | 'favorite';
  }>;
  
  // 매장 선호도
  stores: Array<{
    storeId: string;
    score: number;
    lastVisit: Date;
    visitCount: number;
  }>;
  
  // 구매 패턴
  purchasePatterns: {
    averageOrderValue: number;
    frequentCategories: CategoryType[];
    frequentStores: string[];
    usualPurchaseTimes: string[];
    lastAnalyzed: Date;
  };
  
  // 맞춤 설정
  customization: {
    showRecommendations: boolean;
    showTrending: boolean;
    useLocation: boolean;
    maxDistance: number;  // km
    minDiscountRate: number;
    maxPrice: number;
  };
  
  updatedAt: Date;
}

// 구매 이력 분석
export interface PurchaseHistory {
  userId: string;
  
  // 전체 구매 통계
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    totalSaved: number;
    firstPurchase: Date;
    lastPurchase: Date;
  };
  
  // 카테고리별 구매
  categoryStats: {
    [category in CategoryType]: {
      orderCount: number;
      totalSpent: number;
      lastPurchase: Date;
    };
  };
  
  // 매장별 구매
  storeStats: {
    [storeId: string]: {
      orderCount: number;
      totalSpent: number;
      lastPurchase: Date;
      averageDiscount: number;
    };
  };
  
  // 시간대별 구매
  timeStats: {
    hourly: {
      [hour: string]: number;  // 시간대별 주문 수
    };
    daily: {
      [day: string]: number;  // 요일별 주문 수
    };
    monthly: {
      [month: string]: number;  // 월별 주문 수
    };
  };
  
  // 최근 구매 목록 (최근 30개)
  recentPurchases: Array<{
    orderId: string;
    dealId: string;
    storeId: string;
    category: CategoryType;
    price: number;
    discount: number;
    purchaseDate: Date;
  }>;
  
  updatedAt: Date;
}

// Firestore 컬렉션 이름
export const collections = {
  users: 'users',
  stores: 'stores',
  deals: 'deals',
  orders: 'orders',
  reviews: 'reviews',
  favorites: 'favorites',
  recommendations: 'recommendations',
  userPreferences: 'userPreferences',
  purchaseHistory: 'purchaseHistory'
} as const;