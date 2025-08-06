// app/history.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
// import { getOrdersByBuyer } from '../../lib/firestore';
// import { auth } from '../../firebase';
import { Order } from '../../lib/types';

// --- UI 확인을 위한 가상 데이터 및 함수 ---
const getOrdersByBuyer = async (userId: string): Promise<Order[]> => {
  console.log(`Fetching orders for buyer: ${userId}`);
  return [
    { id: 'order1', dealTitle: '유기농 케이크 3종 세트', storeName: '해피 베이커리', totalPrice: 15000, orderedAt: new Date(), status: 'completed' },
    { id: 'order2', dealTitle: '샐러드 팩', storeName: '프레시 가든', totalPrice: 8000, orderedAt: new Date(new Date().setDate(new Date().getDate() - 2)), status: 'completed' }
  ].sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());
};
const auth = { currentUser: { uid: 'buyer_user_456' }};
// ------------------------------------

export default function HistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!auth.currentUser) return;
    try {
      const userOrders = await getOrdersByBuyer(auth.currentUser.uid);
      setOrders(userOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };
  
  const formatOrderDate = (date: Date): string => {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>거래 내역</Text>
      </View>
      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {orders.length === 0 ? (
            <View style={styles.placeholder}>
              <Ionicons name="receipt-outline" size={60} color="#9ca3af" />
              <Text style={styles.placeholderText}>아직 거래 내역이 없습니다.</Text>
            </View>
          ) : (
            orders.map(order => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderDate}>{formatOrderDate(order.orderedAt)}</Text>
                  <Text style={styles.orderTitle}>{order.dealTitle}</Text>
                  <Text style={styles.orderStore}>{order.storeName}</Text>
                </View>
                <View style={styles.orderPriceContainer}>
                  <Text style={styles.orderPrice}>{order.totalPrice.toLocaleString()}원</Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginLeft: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  placeholderText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  orderInfo: {},
  orderDate: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  orderTitle: { fontSize: 16, fontWeight: 'bold', color: '#166534', marginBottom: 2 },
  orderStore: { fontSize: 14, color: '#16a34a' },
  orderPriceContainer: { alignItems: 'flex-end' },
  orderPrice: { fontSize: 16, fontWeight: 'bold', color: '#166534' },
  orderStatus: { fontSize: 12, color: '#16a34a', marginTop: 4 },
});