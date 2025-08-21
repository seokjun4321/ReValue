import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Deal, Order } from '../../lib/types';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, increment, Timestamp, collection, setDoc } from 'firebase/firestore';
import { collections } from '../../lib/types';

// 떨이 정보 가져오기
const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    const dealRef = doc(db, collections.deals, id);
    const dealSnap = await getDoc(dealRef);
    
    if (!dealSnap.exists()) {
      return null;
    }

    // 조회수 증가
    await updateDoc(dealRef, {
      viewCount: increment(1)
    });

    const data = dealSnap.data();
    return {
      id: dealSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      expiryDate: data.expiryDate?.toDate()
    } as Deal;
  } catch (error) {
    console.error('떨이 정보 조회 실패:', error);
    return null;
  }
};

// 주문 생성
const createOrder = async (orderData: Partial<Order>): Promise<boolean> => {
  try {
    // 떨이 정보 다시 확인
    const dealRef = doc(db, collections.deals, orderData.dealId!);
    const dealSnap = await getDoc(dealRef);
    
    if (!dealSnap.exists()) {
      throw new Error('존재하지 않는 떨이입니다.');
    }

    const dealData = dealSnap.data();
    
    // 재고 확인
    if (dealData.remainingQuantity < orderData.quantity!) {
      throw new Error('남은 수량이 부족합니다.');
    }

    // 마감 시간 확인
    const expiryDate = dealData.expiryDate.toDate();
    if (expiryDate <= new Date()) {
      throw new Error('마감된 떨이입니다.');
    }

    // 주문 생성
    const orderRef = doc(collection(db, collections.orders));
    await setDoc(orderRef, {
      ...orderData,
      id: orderRef.id,
      orderedAt: Timestamp.now(),
      status: 'pending',
      savedAmount: dealData.originalPrice - dealData.discountedPrice
    });

    // 떨이 정보 업데이트
    await updateDoc(dealRef, {
      remainingQuantity: increment(-orderData.quantity!),
      orderCount: increment(1),
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('주문 생성 실패:', error);
    throw error;
  }
};


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
    if (!deal || !auth.currentUser) {
      Alert.alert('오류', '로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    setPurchasing(true);
    try {
      // 주문 데이터 생성
      const orderData: Partial<Order> = {
        dealId: deal.id,
        dealTitle: deal.title,
        buyerId: auth.currentUser.uid,
        sellerId: deal.storeId,
        storeId: deal.storeId,
        quantity: 1,
        totalPrice: deal.discountedPrice,
        originalPrice: deal.originalPrice,
        savedAmount: deal.originalPrice - deal.discountedPrice,
        buyerContact: auth.currentUser.phoneNumber || auth.currentUser.email || '',
        reviewed: false
      };
      
      try {
        const orderId = await createOrder(orderData);

        if (orderId) {
          Alert.alert(
            "구매 완료", 
            "상품을 성공적으로 구매했습니다.\n판매자가 주문을 확인하면 알림을 보내드립니다.", 
            [
              { text: "주문 내역 보기", onPress: () => router.replace('/history') },
              { text: "계속 쇼핑하기", onPress: () => router.back() }
            ]
          );
        } else {
          throw new Error("주문 생성에 실패했습니다.");
        }
      } catch (error: any) {
        if (error.message === 'Not enough quantity available') {
          Alert.alert("구매 실패", "죄송합니다. 현재 재고가 부족합니다.");
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("구매 실패:", error);
      Alert.alert(
        "구매 실패", 
        error.message || "구매 중 문제가 발생했습니다. 다시 시도해주세요."
      );
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
        {deal.images && deal.images.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: deal.images[0] }}
              style={styles.image}
              contentFit="cover"
            />
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#dcfce7" />
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

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
  imageContainer: {
    height: 300,
    backgroundColor: '#f0fdf4',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
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