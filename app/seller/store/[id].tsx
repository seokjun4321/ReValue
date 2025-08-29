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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Store } from '../../../lib/types';

export default function StoreDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreData();
  }, [id]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      // TODO: Firestore에서 매장 데이터 로드
      // const storeData = await getStoreById(id as string);
      // setStore(storeData);
    } catch (error) {
      console.error('매장 데이터 로드 실패:', error);
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
        <Text style={styles.headerTitle}>매장 정보</Text>
        <TouchableOpacity onPress={() => router.push('/seller/edit/' + id)}>
          <Ionicons name="create-outline" size={24} color="#191f28" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#e03131" style={styles.loading} />
        ) : store ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              <View style={styles.infoItem}>
                <Text style={styles.label}>매장명</Text>
                <Text style={styles.value}>{store.name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>카테고리</Text>
                <Text style={styles.value}>{store.category}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>주소</Text>
                <Text style={styles.value}>{store.address}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>운영 정보</Text>
              <View style={styles.infoItem}>
                <Text style={styles.label}>영업 시간</Text>
                <Text style={styles.value}>{store.businessHours.open} - {store.businessHours.close}</Text>
              </View>
              {store.businessHours.closed && (
                <View style={styles.infoItem}>
                  <Text style={styles.label}>휴무일</Text>
                  <Text style={styles.value}>{store.businessHours.closed.join(', ')}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>연락처</Text>
              <View style={styles.infoItem}>
                <Text style={styles.label}>전화번호</Text>
                <Text style={styles.value}>{store.contactInfo.phone}</Text>
              </View>
              {store.contactInfo.email && (
                <View style={styles.infoItem}>
                  <Text style={styles.label}>이메일</Text>
                  <Text style={styles.value}>{store.contactInfo.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>통계</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{store.rating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>평점</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{store.totalDeals}</Text>
                  <Text style={styles.statLabel}>총 떨이</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{store.totalSold}</Text>
                  <Text style={styles.statLabel}>총 판매</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={48} color="#e03131" />
            <Text style={styles.errorText}>매장 정보를 찾을 수 없습니다.</Text>
          </View>
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#868e96',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#191f28',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e03131',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#495057',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#e03131',
    marginTop: 16,
    fontWeight: '500',
  },
});
