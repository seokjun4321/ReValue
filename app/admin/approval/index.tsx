import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SellerApprovalRequest, SellerApprovalStatus } from '../../../lib/types';

export default function AdminApprovalDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<SellerApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<SellerApprovalStatus | 'all'>('pending');

  useEffect(() => {
    loadRequests();
  }, [selectedStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // TODO: Firestore에서 승인 요청 목록 로드
      // const requestList = await getSellerApprovalRequests(selectedStatus);
      // setRequests(requestList);
    } catch (error) {
      console.error('승인 요청 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: SellerApprovalRequest) => {
    try {
      // TODO: 승인 처리
      // await approveSellerRequest(request.id);
      Alert.alert('승인 완료', '판매자 승인이 완료되었습니다.');
      loadRequests();
    } catch (error) {
      console.error('승인 처리 실패:', error);
      Alert.alert('오류', '승인 처리에 실패했습니다.');
    }
  };

  const handleReject = async (request: SellerApprovalRequest) => {
    Alert.prompt(
      '승인 거절',
      '거절 사유를 입력해주세요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async (reason) => {
            try {
              // TODO: 거절 처리
              // await rejectSellerRequest(request.id, reason);
              Alert.alert('처리 완료', '판매자 승인이 거절되었습니다.');
              loadRequests();
            } catch (error) {
              console.error('거절 처리 실패:', error);
              Alert.alert('오류', '거절 처리에 실패했습니다.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleRevision = async (request: SellerApprovalRequest) => {
    Alert.prompt(
      '수정 요청',
      '수정이 필요한 항목을 입력해주세요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async (items) => {
            try {
              // TODO: 수정 요청 처리
              // await requestRevision(request.id, items.split(','));
              Alert.alert('처리 완료', '수정 요청이 전송되었습니다.');
              loadRequests();
            } catch (error) {
              console.error('수정 요청 실패:', error);
              Alert.alert('오류', '수정 요청 처리에 실패했습니다.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#191f28" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>판매자 승인 관리</Text>
        <TouchableOpacity onPress={loadRequests}>
          <Ionicons name="refresh" size={24} color="#191f28" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterText, selectedStatus === 'all' && styles.filterTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 'pending' && styles.filterChipActive]}
            onPress={() => setSelectedStatus('pending')}
          >
            <Text style={[styles.filterText, selectedStatus === 'pending' && styles.filterTextActive]}>
              대기중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 'approved' && styles.filterChipActive]}
            onPress={() => setSelectedStatus('approved')}
          >
            <Text style={[styles.filterText, selectedStatus === 'approved' && styles.filterTextActive]}>
              승인됨
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedStatus === 'rejected' && styles.filterChipActive]}
            onPress={() => setSelectedStatus('rejected')}
          >
            <Text style={[styles.filterText, selectedStatus === 'rejected' && styles.filterTextActive]}>
              거절됨
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#e03131" style={styles.loading} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>승인 요청이 없습니다</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.businessName}>{request.businessName}</Text>
                  <Text style={styles.requestDate}>
                    신청일: {new Date(request.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  request.status === 'approved' && styles.statusApproved,
                  request.status === 'rejected' && styles.statusRejected,
                  request.status === 'pending' && styles.statusPending,
                ]}>
                  <Text style={styles.statusText}>
                    {request.status === 'approved' ? '승인됨' :
                     request.status === 'rejected' ? '거절됨' :
                     request.status === 'pending' ? '대기중' : '검토중'}
                  </Text>
                </View>
              </View>

              <View style={styles.requestInfo}>
                <Text style={styles.infoText}>사업자번호: {request.registrationNumber}</Text>
                <Text style={styles.infoText}>대표자: {request.representativeName}</Text>
                <Text style={styles.infoText}>연락처: {request.phoneNumber}</Text>
                <Text style={styles.infoText}>주소: {request.address}</Text>
              </View>

              {request.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request)}
                  >
                    <Text style={styles.actionButtonText}>승인</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.revisionButton]}
                    onPress={() => handleRevision(request)}
                  >
                    <Text style={styles.actionButtonText}>수정 요청</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request)}
                  >
                    <Text style={styles.actionButtonText}>거절</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
  filterSection: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#fff5f5',
  },
  filterText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#e03131',
  },
  content: {
    flex: 1,
    padding: 20,
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
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    color: '#868e96',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  statusApproved: {
    backgroundColor: '#ebfbee',
  },
  statusRejected: {
    backgroundColor: '#fff5f5',
  },
  statusPending: {
    backgroundColor: '#fff9db',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  requestInfo: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#37b24d',
  },
  revisionButton: {
    backgroundColor: '#f59f00',
  },
  rejectButton: {
    backgroundColor: '#e03131',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
