import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addDeal, uploadDealImages } from '../../lib/firestore';
import { CategoryType, CATEGORY_LABELS, CATEGORY_COLORS, Store } from '../../lib/types';
import { auth } from '../../firebase';
import * as ImageManipulator from 'expo-image-manipulator';
import { withSellerAuth } from '../../components/withSellerAuth';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SellerUploadProps {
  store: Store;
}

function SellerUpload({ store }: SellerUploadProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('10000');
  const [discountedPrice, setDiscountedPrice] = useState('5000');
  const [discountRate, setDiscountRate] = useState(50);
  const [quantity, setQuantity] = useState('3');
  const [category, setCategory] = useState<CategoryType>('food');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [images, setImages] = useState<string[]>([]);
  
  // 모달 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 가격 슬라이더 핸들러
  const handleDiscountRateChange = (rate: number) => {
    setDiscountRate(rate);
    const original = parseInt(originalPrice);
    if (!isNaN(original)) {
      const discounted = Math.round(original * (1 - rate / 100));
      setDiscountedPrice(discounted.toString());
    }
  };

  const handleOriginalPriceChange = (price: string) => {
    setOriginalPrice(price);
    const original = parseInt(price);
    if (!isNaN(original)) {
      const discounted = Math.round(original * (1 - discountRate / 100));
      setDiscountedPrice(discounted.toString());
    }
  };

  // 날짜/시간 선택 핸들러
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentTime = expiryDate;
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setExpiryDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(expiryDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setExpiryDate(newDate);
    }
  };

  // 이미지 처리
  const processImage = async (uri: string): Promise<string | null> => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      return manipulatedImage.base64 || null;
    } catch (error) {
      console.error("이미지 처리 오류:", error);
      return null;
    }
  };

  // 이미지 선택
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('알림', '최대 3장까지 업로드 가능합니다.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 업로드를 위해 갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const base64String = await processImage(result.assets[0].uri);
        if (base64String) {
          setImages([...images, `data:image/jpeg;base64,${base64String}`]);
        } else {
          Alert.alert('오류', '이미지를 처리하는 중 오류가 발생했습니다.');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
      setLoading(false);
    }
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 떨이 등록
  const handleSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      Alert.alert('입력 오류', '제품명을 입력해주세요.');
      return;
    }
    if (!originalPrice || !discountedPrice) {
      Alert.alert('입력 오류', '가격을 입력해주세요.');
      return;
    }
    if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
      Alert.alert('입력 오류', '할인가는 원가보다 낮아야 합니다.');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('입력 오류', '수량을 입력해주세요.');
      return;
    }
    if (expiryDate <= new Date()) {
      Alert.alert('입력 오류', '마감 시간은 현재 시간보다 이후여야 합니다.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('입력 오류', '최소 1장의 사진을 업로드해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 떨이 데이터 생성
      const dealData = {
        title: title.trim(),
        description: description.trim(),
        category,
        images,
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
        discountRate,
        totalQuantity: parseInt(quantity),
        remainingQuantity: parseInt(quantity),
        expiryDate,
        storeId: store.id,
        storeName: store.name,
        location: store.location,
        status: 'active' as const,
        viewCount: 0,
        favoriteCount: 0,
        orderCount: 0
      };

      // 떨이 등록
      const dealId = await addDeal(dealData);
      if (!dealId) {
        throw new Error('떨이 등록에 실패했습니다.');
      }

      // 이미지 업로드
      console.log(`${images.length}개 이미지 업로드 시작...`);
      const imageUrls = await uploadDealImages(dealId, images);
      
      if (imageUrls.length === 0) {
        Alert.alert('경고', '이미지 업로드에 실패했지만 떨이는 등록되었습니다. 나중에 이미지를 추가해주세요.');
      } else {
        console.log(`${imageUrls.length}개 이미지 업로드 성공`);
      }

      Alert.alert(
        '등록 완료',
        `떨이가 성공적으로 등록되었습니다!${imageUrls.length > 0 ? ` (이미지 ${imageUrls.length}장 포함)` : ''}`,
        [
          {
            text: '확인',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('떨이 등록 오류:', error);
      Alert.alert('오류', '떨이 등록 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜/시간 포맷 함수
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#dc2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>떨이 등록</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사진 업로드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상품 사진</Text>
          <Text style={styles.sectionSubtitle}>최대 3장까지 등록 가능</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color="#dc2626" />
                  <Text style={styles.addImageText}>사진 추가</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>상품명</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="예: 케이크 3개 세트"
              placeholderTextColor="#868e96"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>상품 설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="상품에 대한 간단한 설명을 입력해주세요."
              placeholderTextColor="#868e96"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      category === key && styles.categoryButtonActive
                    ]}
                    onPress={() => setCategory(key as CategoryType)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === key && styles.categoryTextActive
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 가격 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>가격 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>원가</Text>
            <TextInput
              style={styles.input}
              value={originalPrice}
              onChangeText={handleOriginalPriceChange}
              placeholder="10,000"
              placeholderTextColor="#868e96"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.discountSliderHeader}>
              <Text style={styles.label}>할인율</Text>
              <Text style={styles.discountRateText}>{discountRate}%</Text>
            </View>
            <Slider
              style={styles.discountSlider}
              minimumValue={10}
              maximumValue={90}
              step={5}
              value={discountRate}
              onValueChange={handleDiscountRateChange}
              minimumTrackTintColor="#dc2626"
              maximumTrackTintColor="#e5e5e5"
              thumbTintColor="#dc2626"
            />
            <View style={styles.discountResult}>
              <Text style={styles.discountedPriceLabel}>할인가</Text>
              <Text style={styles.discountedPrice}>
                {parseInt(discountedPrice).toLocaleString()}원
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>수량</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const current = parseInt(quantity);
                  if (!isNaN(current) && current > 1) {
                    setQuantity((current - 1).toString());
                  }
                }}
              >
                <Ionicons name="remove" size={24} color="#dc2626" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const current = parseInt(quantity);
                  if (!isNaN(current)) {
                    setQuantity((current + 1).toString());
                  }
                }}
              >
                <Ionicons name="add" size={24} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 마감 시간 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>마감 시간</Text>
          
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={24} color="#dc2626" />
              <Text style={styles.dateTimeText}>
                {formatDate(expiryDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={24} color="#dc2626" />
              <Text style={styles.dateTimeText}>
                {formatTime(expiryDate)}
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
              <Text style={styles.submitButtonText}>떨이 등록하기</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 날짜 선택기 */}
      {showDatePicker && (
        <DateTimePicker
          value={expiryDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* 시간 선택기 */}
      {showTimePicker && (
        <DateTimePicker
          value={expiryDate}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          minuteInterval={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#868e96',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#191f28',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#dc2626',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f8',
  },
  addImageText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  categoryButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191f28',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  discountSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountRateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  discountSlider: {
    height: 40,
    marginTop: 8,
  },
  discountResult: {
    backgroundColor: '#fff8f8',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  discountedPriceLabel: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 4,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2626',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
    marginHorizontal: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#191f28',
    marginLeft: 8,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 24,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#868e96',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default withSellerAuth(SellerUpload);