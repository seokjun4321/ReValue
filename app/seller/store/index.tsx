import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Store } from '../../../lib/types';

export default function StoreList() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      // TODO: Firestore에서 매장 목록 로드
      // const storeList = await getStoresByOwner(userId);
      // setStores(storeList);
    } catch (error) {
      console.error('매장 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#191f28" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 매장 관리</Text>
        <TouchableOpacity onPress={() => router.push('/seller/register')}>
          <Ionicons name="add" size={24} color="#191f28" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#e03131" style={styles.loading} />
        ) : stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>등록된 매장이 없습니다</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/seller/register')}
            >
              <Text style={styles.registerButtonText}>매장 등록하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              onPress={() => router.push('/seller/store/' + store.id)}
            >
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeCategory}>{store.category}</Text>
                <Text style={styles.storeAddress}>{store.address}</Text>
              </View>
              <View style={styles.storeStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{store.rating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>평점</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{store.totalDeals}</Text>
                  <Text style={styles.statLabel}>떨이</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{store.totalSold}</Text>
                  <Text style={styles.statLabel}>판매</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
  },
  content: {
    flex: 1,
  },
  loading: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  registerButton: {
    backgroundColor: '#e03131',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storeInfo: {
    marginBottom: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  storeCategory: {
    fontSize: 14,
    color: '#e03131',
    marginBottom: 8,
  },
  storeAddress: {
    fontSize: 14,
    color: '#495057',
  },
  storeStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#868e96',
  },
});
