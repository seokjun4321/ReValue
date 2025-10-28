// 리얼한 음식 떨이 더미 데이터 추가 스크립트
// Web SDK 사용으로 변경 (firebase.js의 설정 재사용)
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase 설정 (firebase.ts에서 가져온 설정)
const firebaseConfig = {
  apiKey: "AIzaSyA9_0HZFsgKOEBBF0T4Y0VLFgEzIJqHUxA",
  authDomain: "revalue-c0668.firebaseapp.com",
  projectId: "revalue-c0668",
  storageBucket: "revalue-c0668.firebasestorage.app",
  messagingSenderId: "186014092742",
  appId: "1:186014092742:web:e11bd9c8965e4b39fc10d6",
  measurementId: "G-7GT7FZ5E0K"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 서울 주요 편의점/마트 위치 (실제 좌표)
const stores = [
  { name: '이마트24 강남점', lat: 37.4979, lon: 127.0276 },
  { name: 'GS25 서초점', lat: 37.4833, lon: 127.0322 },
  { name: 'CU 역삼점', lat: 37.5007, lon: 127.0374 },
  { name: '세븐일레븐 논현점', lat: 37.5104, lon: 127.0220 },
  { name: '이마트24 신사점', lat: 37.5244, lon: 127.0205 },
  { name: 'GS25 삼성점', lat: 37.5133, lon: 127.0554 },
  { name: 'CU 압구정점', lat: 37.5274, lon: 127.0283 },
  { name: '세븐일레븐 청담점', lat: 37.5248, lon: 127.0474 },
  { name: '이마트24 한남점', lat: 37.5342, lon: 127.0022 },
  { name: 'GS25 이태원점', lat: 37.5347, lon: 126.9946 },
];

// 리얼한 음식 데이터 (카테고리별로 세분화)
const foodDeals = [
  // 빵/베이커리
  {
    category: 'bakery',
    items: [
      { title: '크로아상 4개입', original: 6800, discount: 40, quantity: 8 },
      { title: '베이글 6개 세트', original: 8500, discount: 50, quantity: 5 },
      { title: '단팥빵 5개입', original: 5000, discount: 45, quantity: 10 },
      { title: '식빵 1.5근', original: 4500, discount: 35, quantity: 15 },
      { title: '바게트 2개입', original: 5500, discount: 40, quantity: 8 },
      { title: '모닝빵 8개입', original: 4800, discount: 50, quantity: 12 },
      { title: '크림빵 4개입', original: 6000, discount: 45, quantity: 7 },
      { title: '소보로빵 6개입', original: 7200, discount: 40, quantity: 9 },
    ]
  },
  // 과자/간식
  {
    category: 'snacks',
    items: [
      { title: '새우깡 대용량', original: 3800, discount: 30, quantity: 20 },
      { title: '포카칩 3개입', original: 5400, discount: 40, quantity: 15 },
      { title: '오레오 패밀리팩', original: 6900, discount: 35, quantity: 12 },
      { title: '허니버터칩 2개입', original: 4600, discount: 45, quantity: 18 },
      { title: '초코파이 12개입', original: 5800, discount: 40, quantity: 10 },
      { title: '꼬북칩 4개입', original: 6200, discount: 35, quantity: 14 },
      { title: '새콤달콤 대용량', original: 4200, discount: 50, quantity: 16 },
      { title: '칸쵸 3개입', original: 3900, discount: 40, quantity: 20 },
    ]
  },
  // 유제품
  {
    category: 'dairy',
    items: [
      { title: '서울우유 2.3L', original: 5800, discount: 30, quantity: 10 },
      { title: '요플레 8개입', original: 7200, discount: 40, quantity: 8 },
      { title: '치즈 200g 3개입', original: 9800, discount: 35, quantity: 6 },
      { title: '떠먹는 요거트 4개', original: 4800, discount: 45, quantity: 12 },
      { title: '아이스크림 6개입', original: 8900, discount: 50, quantity: 7 },
      { title: '크림치즈 200g 2개', original: 7600, discount: 40, quantity: 9 },
      { title: '모짜렐라치즈 500g', original: 12000, discount: 35, quantity: 5 },
      { title: '그릭요거트 4개입', original: 6400, discount: 45, quantity: 10 },
    ]
  },
  // 냉동식품
  {
    category: 'frozen',
    items: [
      { title: '냉동만두 1kg 2봉', original: 15000, discount: 40, quantity: 8 },
      { title: '냉동피자 3판', original: 18000, discount: 45, quantity: 6 },
      { title: '닭가슴살 1kg', original: 9800, discount: 35, quantity: 10 },
      { title: '냉동김밥 10개입', original: 12000, discount: 50, quantity: 7 },
      { title: '냉동감자튀김 2kg', original: 8500, discount: 40, quantity: 12 },
      { title: '새우튀김 500g 2팩', original: 14000, discount: 45, quantity: 5 },
      { title: '냉동볶음밥 4개입', original: 10000, discount: 40, quantity: 9 },
      { title: '냉동돈까스 10개입', original: 13500, discount: 35, quantity: 8 },
    ]
  },
  // 즉석/간편식
  {
    category: 'instant',
    items: [
      { title: '컵라면 6개입', original: 4800, discount: 30, quantity: 20 },
      { title: '볶음밥 4인분', original: 8900, discount: 45, quantity: 10 },
      { title: '즉석국 10개입', original: 9800, discount: 40, quantity: 8 },
      { title: '도시락 3개 세트', original: 12000, discount: 50, quantity: 6 },
      { title: '컵밥 6개입', original: 15000, discount: 45, quantity: 7 },
      { title: '샌드위치 4개입', original: 10000, discount: 40, quantity: 12 },
      { title: '삼각김밥 10개', original: 11000, discount: 35, quantity: 15 },
      { title: '햄버거 5개입', original: 14000, discount: 50, quantity: 5 },
    ]
  },
  // 음료
  {
    category: 'beverage',
    items: [
      { title: '탄산음료 1.5L 6개', original: 7200, discount: 40, quantity: 15 },
      { title: '오렌지주스 1L 4개', original: 10000, discount: 45, quantity: 10 },
      { title: '생수 2L 12개입', original: 8900, discount: 30, quantity: 20 },
      { title: '커피믹스 100개입', original: 12000, discount: 35, quantity: 8 },
      { title: '아이스아메리카노 4개', original: 11000, discount: 50, quantity: 12 },
      { title: '스무디 6개입', original: 15000, discount: 45, quantity: 7 },
      { title: '녹차 500ml 12개', original: 9800, discount: 40, quantity: 10 },
      { title: '에너지드링크 8개입', original: 13000, discount: 35, quantity: 9 },
    ]
  },
  // 과일
  {
    category: 'fruit',
    items: [
      { title: '사과 10입', original: 15000, discount: 40, quantity: 8 },
      { title: '바나나 1.5kg', original: 5800, discount: 35, quantity: 15 },
      { title: '딸기 2팩', original: 12000, discount: 50, quantity: 6 },
      { title: '포도 2송이', original: 18000, discount: 45, quantity: 5 },
      { title: '귤 5kg', original: 20000, discount: 40, quantity: 7 },
      { title: '배 6개입', original: 16000, discount: 35, quantity: 8 },
      { title: '수박 1통', original: 25000, discount: 50, quantity: 4 },
      { title: '오렌지 2kg', original: 14000, discount: 40, quantity: 10 },
    ]
  },
  // 채소
  {
    category: 'vegetable',
    items: [
      { title: '양파 3kg', original: 6000, discount: 35, quantity: 12 },
      { title: '당근 2kg', original: 5000, discount: 40, quantity: 15 },
      { title: '상추 3단', original: 4500, discount: 50, quantity: 10 },
      { title: '브로콜리 3개', original: 7200, discount: 45, quantity: 8 },
      { title: '무 2개', original: 5500, discount: 40, quantity: 12 },
      { title: '배추 1포기', original: 4000, discount: 35, quantity: 10 },
      { title: '파프리카 500g', original: 6800, discount: 50, quantity: 9 },
      { title: '양배추 2통', original: 7500, discount: 40, quantity: 7 },
    ]
  },
  // 육류
  {
    category: 'meat',
    items: [
      { title: '삼겹살 1kg', original: 18000, discount: 35, quantity: 6 },
      { title: '닭가슴살 2kg', original: 16000, discount: 40, quantity: 8 },
      { title: '소고기 불고기용 500g', original: 22000, discount: 30, quantity: 5 },
      { title: '돼지고기 목살 1kg', original: 15000, discount: 45, quantity: 7 },
      { title: '닭다리살 1.5kg', original: 12000, discount: 40, quantity: 10 },
      { title: '소세지 1kg', original: 9800, discount: 50, quantity: 12 },
      { title: '베이컨 500g 2팩', original: 14000, discount: 35, quantity: 8 },
      { title: '훈제오리 500g', original: 13000, discount: 40, quantity: 6 },
    ]
  },
  // 수산물
  {
    category: 'seafood',
    items: [
      { title: '고등어 4마리', original: 12000, discount: 45, quantity: 8 },
      { title: '삼치 2마리', original: 15000, discount: 40, quantity: 6 },
      { title: '냉동새우 500g 2팩', original: 18000, discount: 50, quantity: 5 },
      { title: '오징어 1kg', original: 14000, discount: 35, quantity: 7 },
      { title: '조기 5마리', original: 16000, discount: 40, quantity: 6 },
      { title: '갈치 3마리', original: 19000, discount: 45, quantity: 5 },
      { title: '연어 500g', original: 22000, discount: 35, quantity: 4 },
      { title: '꽃게 1kg', original: 25000, discount: 50, quantity: 3 },
    ]
  },
  // 델리/반찬
  {
    category: 'deli',
    items: [
      { title: '김치 3kg', original: 18000, discount: 40, quantity: 10 },
      { title: '장조림 500g', original: 12000, discount: 45, quantity: 8 },
      { title: '멸치볶음 300g', original: 8000, discount: 35, quantity: 12 },
      { title: '나물무침 5종', original: 15000, discount: 50, quantity: 7 },
      { title: '계란말이 2팩', original: 9000, discount: 40, quantity: 10 },
      { title: '깍두기 2kg', original: 14000, discount: 35, quantity: 8 },
      { title: '콩자반 400g', original: 10000, discount: 45, quantity: 9 },
      { title: '무생채 600g', original: 7000, discount: 40, quantity: 12 },
    ]
  },
  // 조미료/양념
  {
    category: 'seasoning',
    items: [
      { title: '간장 1.8L 2병', original: 15000, discount: 35, quantity: 10 },
      { title: '고추장 3kg', original: 18000, discount: 40, quantity: 7 },
      { title: '된장 2kg', original: 12000, discount: 45, quantity: 8 },
      { title: '참기름 500ml 2병', original: 22000, discount: 30, quantity: 6 },
      { title: '올리브유 1L 2병', original: 25000, discount: 35, quantity: 5 },
      { title: '식초 1.8L', original: 8000, discount: 50, quantity: 12 },
      { title: '설탕 3kg', original: 9000, discount: 40, quantity: 15 },
      { title: '소금 5kg', original: 10000, discount: 35, quantity: 10 },
    ]
  },
];

// 랜덤 날짜 생성 (오늘부터 3일 이내 마감)
function getRandomExpiryDate() {
  const now = new Date();
  const hours = Math.floor(Math.random() * 72) + 1; // 1~72시간
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

// 더미 데이터 추가
async function addRealisticFoodDeals() {
  console.log('리얼한 음식 떨이 더미 데이터 추가 시작...\n');

  let totalAdded = 0;

  // 각 카테고리별로 처리
  for (const categoryData of foodDeals) {
    const { category, items } = categoryData;
    console.log(`\n[${category}] 카테고리 처리 중...`);

    for (const item of items) {
      // 랜덤 매장 선택
      const store = stores[Math.floor(Math.random() * stores.length)];
      
      // 할인 가격 계산
      const discountedPrice = Math.round(item.original * (100 - item.discount) / 100);
      
      // Deal 데이터 생성
      const dealData = {
        title: item.title,
        description: `신선도 보장! ${item.title} 떨이 특가`,
        originalPrice: item.original,
        discountedPrice: discountedPrice,
        discountRate: item.discount,
        category: category,
        storeName: store.name,
        storeId: 'dummy_store_' + Math.random().toString(36).substr(2, 9),
        location: {
          latitude: store.lat,
          longitude: store.lon,
          address: `서울특별시 ${store.name}`
        },
        quantity: item.quantity,
        remainingQuantity: item.quantity,
        expiryDate: Timestamp.fromDate(getRandomExpiryDate()),
        status: 'active',
        images: [],
        tags: [category, '떨이', '할인', '신선식품'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        viewCount: Math.floor(Math.random() * 500),
        likeCount: Math.floor(Math.random() * 50),
        orderCount: Math.floor(Math.random() * item.quantity * 0.3),
      };

      // Firestore에 추가
      try {
        await addDoc(collection(db, 'deals'), dealData);
        totalAdded++;
        
        if (totalAdded % 10 === 0) {
          console.log(`  → ${totalAdded}개 등록 완료...`);
        }
      } catch (error) {
        console.error(`  ✗ ${item.title} 등록 실패:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ 총 ${totalAdded}개의 리얼한 음식 떨이가 추가되었습니다!`);
  console.log(`\n카테고리별 분포:`);
  
  foodDeals.forEach(({ category, items }) => {
    console.log(`  - ${category}: ${items.length}개`);
  });
  
  process.exit(0);
}

// 실행
addRealisticFoodDeals().catch((error) => {
  console.error('오류 발생:', error);
  process.exit(1);
});

