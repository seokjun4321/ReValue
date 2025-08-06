import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
// import { getDealById, createOrder } from '../../lib/firestore'; // (가상) Firestore 함수
// import { auth } from '../../firebase';
import { Deal } from '../../lib/types';

// --- 실제 구현 시 주석 해제 ---
// const { getDealById, createOrder } = require('../../lib/firestore');
// const { auth } = require('../../firebase');

// --- 아래는 UI 확인을 위한 가상 데이터 및 함수입니다 ---
const getDealById = async (id: string): Promise<Deal | null> => {
  console.log(`Fetching deal with id: ${id}`);
  return {
    id: id,
    title: '유기농 케이크 3종 세트',
    description: '오늘 만든 신선한 유기농 케이크입니다. 딸기, 초코, 치즈 세가지 맛으로 구성되어 있어요. 오후 10시까지 판매합니다!',
    images: [], // 실제로는 이미지 URL 배열
    category: 'bakery',
    originalPrice: 25000,
    discountedPrice: 15000,
    discountRate: 40,
    totalQuantity: 5,
    remainingQuantity: 3,
    expiryDate: new Date(new Date().getTime() + 5 * 60 * 60 * 1000), // 5시간 후 만료
    storeId: 'seller_store_123',
    storeName: '해피 베이커리',
    location: { latitude: 37.5665, longitude: 126.9780 },
    status: 'active',
    viewCount: 102,
    favoriteCount: 12,
    orderCount: 2,
  };
};
const createOrder = async (orderData: any) => {
  console.log("Creating order with data:", orderData);
  return true; // 성공 시 true 반환
};
const auth = { currentUser: { uid: 'buyer_user_456' }};
// -----------------------------------------------------------


export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchDeal = async () => {
        try {
          setLoading(true);
          const dealData = await getDealById(id);
          setDeal(dealData);
        } catch (error) {
          console.error("Failed to fetch deal:", error);
          Alert.alert("오류", "상품 정보를 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchDeal();
    }
  }, [id]);

  const handlePurchase = () => {
    if (!deal) return;

    Alert.alert(
      "구매 확인",
      `'${deal.title}' 상품을 ${deal.discountedPrice.toLocaleString()}원에 구매하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "구매하기", onPress: () => processPurchase() }
      ]
    );
  };

  const processPurchase = async () => {
    if (!deal || !auth.currentUser) return;
    setPurchasing(true);
    try {
      const orderData = {
        dealId: deal.id,
        dealTitle: deal.title,
        totalPrice: deal.discountedPrice,
        quantity: 1, // 1개 구매로 단순화
        buyerId: auth.currentUser.uid,
        sellerId: deal.storeId,
        storeName: deal.storeName,
        orderedAt: new Date(),
        status: 'completed',
      };
      
      const success = await createOrder(orderData);

      if (success) {
        Alert.alert("구매 완료", "상품을 성공적으로 구매했습니다. 거래 내역으로 이동합니다.", [
          { text: "확인", onPress: () => router.replace('/history') }
        ]);
      } else {
        throw new Error("Order creation failed");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      Alert.alert("오류", "구매 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setPurchasing(false);
    }
  };

  const formatTimeUntilExpiry = (expiryDate: Date): string => {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    if (diff <= 0) return "마감됨";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분 후 마감`;
  };

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#22c55e" /></View>;
  }

  if (!deal) {
    return <View style={styles.centerContainer}><Text>상품 정보를 찾을 수 없습니다.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={80} color="#dcfce7" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.storeName}>{deal.storeName}</Text>
          <Text style={styles.title}>{deal.title}</Text>
          
          <View style={styles.priceSection}>
            <Text style={styles.discountRate}>{deal.discountRate}%</Text>
            <Text style={styles.discountedPrice}>{deal.discountedPrice.toLocaleString()}원</Text>
            <Text style={styles.originalPrice}>{deal.originalPrice.toLocaleString()}원</Text>
          </View>

          <Text style={styles.description}>{deal.description}</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#ef4444" />
              <Text style={styles.infoText}>마감까지 <Text style={{fontWeight: 'bold'}}>{formatTimeUntilExpiry(deal.expiryDate)}</Text></Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={20} color="#22c55e" />
              <Text style={styles.infoText}>남은 수량 <Text style={{fontWeight: 'bold'}}>{deal.remainingQuantity}개</Text></Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={28} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.purchaseButton, purchasing && styles.disabledButton]} 
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing 
            ? <ActivityIndicator color="#fff" /> 
            : <Text style={styles.purchaseButtonText}>구매하기</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: {
    height: 300,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: { position: 'absolute', top: 50, left: 16 },
  content: { padding: 20 },
  storeName: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#166534', marginBottom: 16 },
  priceSection: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  discountRate: { fontSize: 28, fontWeight: 'bold', color: '#ef4444', marginRight: 8 },
  discountedPrice: { fontSize: 28, fontWeight: 'bold', color: '#166534', marginRight: 8 },
  originalPrice: { fontSize: 18, color: '#9ca3af', textDecorationLine: 'line-through' },
  description: { fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 24 },
  infoBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  infoText: { fontSize: 16, color: '#16a34a', marginLeft: 12 },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginRight: 12,
  },
  purchaseButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { backgroundColor: '#9ca3af' },
  purchaseButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});