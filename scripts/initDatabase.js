const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDcReJ2gI9LQwEgYZnTkG2yTFAtJT1uW8k",
  authDomain: "revalue-e8246.firebaseapp.com",
  projectId: "revalue-e8246",
  storageBucket: "revalue-e8246.appspot.com",
  messagingSenderId: "816141764936",
  appId: "1:816141764936:web:91449f39be7f7118bf4b7d",
  measurementId: "G-MG63RFB1H1"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 컬렉션 이름
const collections = {
  users: 'users',
  stores: 'stores',
  deals: 'deals',
  orders: 'orders',
  reviews: 'reviews'
};

// 테스트 매장 데이터
const testStore = {
  id: 'test_store_1',
  name: '해피 베이커리',
  description: '신선한 빵과 케이크를 판매하는 베이커리입니다.',
  address: '서울시 강남구 역삼동 123-45',
  location: {
    latitude: 37.5665,
    longitude: 126.9780
  },
  ownerId: 'test_seller_1',
  category: 'food',
  images: [],
  businessHours: {
    open: '09:00',
    close: '21:00',
    closed: ['일요일']
  },
  contactInfo: {
    phone: '02-1234-5678',
    email: 'happy@bakery.com'
  },
  rating: 4.5,
  totalDeals: 0,
  totalSold: 0,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

// 테스트 사용자 데이터
const testSeller = {
  id: 'test_seller_1',
  email: 'seller@test.com',
  displayName: '판매자',
  userType: 'seller',
  storeId: 'test_store_1',
  businessLicense: '123-45-67890',
  phoneNumber: '010-1234-5678',
  notificationSettings: {
    newDealsNearby: true,
    favoriteStoreUpdates: true,
    expiryAlerts: true,
    priceDrops: true
  },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

const testBuyer = {
  id: 'test_buyer_1',
  email: 'buyer@test.com',
  displayName: '구매자',
  userType: 'buyer',
  favoriteStores: [],
  favoriteDeals: [],
  totalOrders: 0,
  totalSaved: 0,
  notificationSettings: {
    newDealsNearby: true,
    favoriteStoreUpdates: true,
    expiryAlerts: true,
    priceDrops: true
  },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

// 테스트 떨이 데이터
const testDeal = {
  id: 'test_deal_1',
  title: '오늘의 빵 세트',
  description: '오늘 만든 신선한 빵 3종 세트입니다. 저녁 8시까지만 판매합니다!',
  category: 'food',
  images: [],
  originalPrice: 15000,
  discountedPrice: 9000,
  discountRate: 40,
  totalQuantity: 10,
  remainingQuantity: 10,
  expiryDate: Timestamp.fromDate(new Date(new Date().setHours(20, 0, 0, 0))), // 오늘 저녁 8시
  storeId: 'test_store_1',
  storeName: '해피 베이커리',
  location: {
    latitude: 37.5665,
    longitude: 126.9780
  },
  status: 'active',
  viewCount: 0,
  favoriteCount: 0,
  orderCount: 0,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  try {
    // 매장 데이터 추가
    const storeRef = doc(db, collections.stores, testStore.id);
    await setDoc(storeRef, testStore);
    console.log('매장 데이터 추가 완료');

    // 사용자 데이터 추가
    const sellerRef = doc(db, collections.users, testSeller.id);
    await setDoc(sellerRef, testSeller);
    const buyerRef = doc(db, collections.users, testBuyer.id);
    await setDoc(buyerRef, testBuyer);
    console.log('사용자 데이터 추가 완료');

    // 떨이 데이터 추가
    const dealRef = doc(db, collections.deals, testDeal.id);
    await setDoc(dealRef, testDeal);
    console.log('떨이 데이터 추가 완료');

    console.log('데이터베이스 초기화 완료');
    process.exit(0);
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
initializeDatabase();