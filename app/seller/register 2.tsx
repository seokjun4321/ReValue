import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { collections, Store } from '../../lib/types';
import * as ImagePicker from 'expo-image-picker';
import { uploadDealImages } from '../../lib/firestore';
import { getCurrentUserType } from '../../lib/userUtils';

export default function SellerRegister() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);

  const handleTimeChange = (event: any, selectedDate: Date | undefined, isOpenTime: boolean) => {
    if (Platform.OS === 'android') {
      setShowOpenTimePicker(false);
      setShowCloseTimePicker(false);
    }

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      if (isOpenTime) {
        setOpenTime(timeString);
      } else {
        setCloseTime(timeString);
      }
    }
  };
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // 필수 필드 검증
      if (!storeName || !description || !address || !phone || !businessLicense) {
        Alert.alert('오류', '모든 필수 항목을 입력해주세요.');
        return;
      }

      // 이미지 업로드
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        const tempStoreId = 'temp_' + Date.now(); // 임시 ID로 이미지 업로드
        uploadedImages = await uploadDealImages(tempStoreId, images);
      }

      // 매장 정보 저장
      const storeData: Partial<Store> = {
        name: storeName,
        description,
        address,
        location: location || {
          latitude: 37.5665, // 기본값: 서울시청
          longitude: 126.9780,
        },
        ownerId: user.uid,
        category: 'other',
        images: uploadedImages,
        businessHours: {
          open: openTime,
          close: closeTime,
        },
        contactInfo: {
          phone,
          email: email || null,
        },
        rating: 0,
        totalDeals: 0,
        totalSold: 0,
      };

      const storeRef = await addDoc(collection(db, collections.stores), storeData);

      // 사용자 정보 업데이트
      await updateDoc(doc(db, collections.users, user.uid), {
        userType: 'seller',
        businessLicense,
        phoneNumber: phone,
      });

      Alert.alert('성공', '판매자 등록이 완료되었습니다. 이제 매장을 등록해주세요.', [
        {
          text: '확인',
          onPress: () => router.push('/seller/store/register'),
        },
      ]);
    } catch (error) {
      console.error('Error registering seller:', error);
      Alert.alert('오류', '판매자 등록 중 오류가 발생했습니다.');
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
        {/* 안내 메시지 */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <Text style={styles.infoText}>
            판매자 등록 후 매장 정보를 등록하면{'\n'}
            바로 상품을 등록할 수 있어요
          </Text>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>사업자 등록번호 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={businessLicense}
              onChangeText={setBusinessLicense}
              placeholder="사업자 등록번호를 입력하세요"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="연락처를 입력하세요"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* 매장 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매장 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>매장명 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="매장 이름을 입력하세요"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>매장 설명 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="매장 설명을 입력하세요"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>주소 <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={() => setShowLocationPicker(true)}
            >
              {location ? (
                <Text style={styles.locationText}>{address}</Text>
              ) : (
                <Text style={styles.locationPlaceholder}>지도에서 위치 선택</Text>
              )}
              <Ionicons name="location" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* 위치 선택 모달 */}
          <Modal
            visible={showLocationPicker}
            animationType="slide"
            onRequestClose={() => setShowLocationPicker(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowLocationPicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>위치 선택</Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (location) {
                      setShowLocationPicker(false);
                    } else {
                      Alert.alert('알림', '위치를 선택해주세요.');
                    }
                  }}
                  style={styles.modalDoneButton}
                >
                  <Text style={styles.modalDoneText}>완료</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mapContainer}>
                {Platform.OS !== 'web' && (
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: 37.5665,
                      longitude: 126.9780,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                    onPress={async (e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setLocation({ latitude, longitude });
                      
                      try {
                        const result = await Location.reverseGeocodeAsync(
                          { latitude, longitude },
                          { language: "ko" }
                        );
                        
                        if (result && result[0]) {
                          const { region, city, district, street, name } = result[0];
                          const addressParts = [
                            region, // 시/도
                            city, // 시/군/구
                            district, // 동/읍/면
                            street, // 도로명
                            name // 건물명
                          ].filter(Boolean);
                          
                          setAddress(addressParts.join(' '));
                        } else {
                          setAddress(`위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`);
                        }
                      } catch (error) {
                        console.error('Error getting address:', error);
                        setAddress(`위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`);
                      }
                    }}
                  >
                    {location && (
                      <Marker
                        coordinate={location}
                        title="선택된 위치"
                      />
                    )}
                  </MapView>
                )}
              </View>
            </View>
          </Modal>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>영업 시간</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowOpenTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>{openTime}</Text>
                <Ionicons name="time" size={20} color="#6b7280" />
              </TouchableOpacity>

              <Text style={styles.timeSeparator}>~</Text>

              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowCloseTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>{closeTime}</Text>
                <Ionicons name="time" size={20} color="#6b7280" />
              </TouchableOpacity>

              {showOpenTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${openTime}`)}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={(event, date) => handleTimeChange(event, date, true)}
                />
              )}

              {showCloseTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${closeTime}`)}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={(event, date) => handleTimeChange(event, date, false)}
                />
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>매장 사진</Text>
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={handleImagePick}
            >
              <Ionicons name="camera" size={24} color="#6b7280" />
              <Text style={styles.imageButtonText}>
                사진 추가 ({images.length}/5)
              </Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1e40af',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  imageButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  imageButtonText: {
    color: '#6b7280',
    fontSize: 16,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
  },
  locationPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDoneButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
