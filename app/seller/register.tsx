import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase';
import { registerStore } from '../../lib/firestore';
import AddressSearch from '../../components/AddressSearch';

export default function SellerRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');

  // 판매자 등록
  const handleSubmit = async () => {
    // 유효성 검사
    if (!storeName.trim()) {
      Alert.alert('입력 오류', '매장명을 입력해주세요.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('입력 오류', '주소를 입력해주세요.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('입력 오류', '전화번호를 입력해주세요.');
      return;
    }
    if (!businessNumber.trim()) {
      Alert.alert('입력 오류', '사업자 등록번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        router.replace('/login');
        return;
      }

      if (!location) {
        Alert.alert('위치 오류', '주소를 선택해주세요.');
        return;
      }

      const { latitude, longitude } = location;

      // 매장 등록
      const storeData = {
        name: storeName.trim(),
        description: description.trim(),
        address: address.trim(),
        location: { latitude, longitude },
        phoneNumber: phoneNumber.trim(),
        businessNumber: businessNumber.trim(),
        ownerId: user.uid,
        rating: 0,
        reviewCount: 0,
        status: 'pending' as const,
      };

      await registerStore(storeData);

      Alert.alert(
        '등록 완료',
        '판매자 등록이 완료되었습니다. 관리자 승인 후 이용하실 수 있습니다.',
        [
          {
            text: '확인',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error) {
      console.error('판매자 등록 오류:', error);
      Alert.alert('오류', '판매자 등록 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>판매자 등록</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>매장명 *</Text>
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="예: 파리바게트 강남점"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>매장 설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="매장에 대한 간단한 설명을 입력해주세요."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* 위치 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>위치 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>주소 *</Text>
            <AddressSearch
              onSelect={({ address: selectedAddress, latitude, longitude }) => {
                setAddress(selectedAddress);
                setLocation({ latitude, longitude });
              }}
            />
            {address && (
              <View style={styles.selectedAddress}>
                <Ionicons name="location" size={16} color="#22c55e" />
                <Text style={styles.selectedAddressText}>{address}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호 *</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="예: 02-1234-5678"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* 사업자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사업자 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>사업자 등록번호 *</Text>
            <TextInput
              style={styles.input}
              value={businessNumber}
              onChangeText={setBusinessNumber}
              placeholder="예: 123-45-67890"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* 등록 버튼 */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.submitButtonText}>판매자 등록하기</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  selectedAddressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#166534',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f8fdf8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
