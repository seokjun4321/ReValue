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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addDeal, uploadDealImages } from '../../lib/firestore';
import { CategoryType, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/types';
import { auth } from '../../firebase';
import * as ImageManipulator from 'expo-image-manipulator';

export default function SellerUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const processImage = async (uri: string): Promise<string | null> => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        // Resize the image to have a maximum width of 800 pixels.
        // The height will be adjusted automatically to maintain the aspect ratio.
        [{ resize: { width: 800 } }], 
        { 
          compress: 0.7, // Compress the image to 70% quality.
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true, // THIS IS THE KEY PART: request the Base64 data.
        }
      );
      return manipulatedImage.base64 || null;
    } catch (error) {
      console.error("Error processing image:", error);
      return null;
    }
  };

  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // 이미지 선택
  // MODIFIED pickImage function
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('알림', '최대 3장까지 업로드 가능합니다.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 업로드를 위해 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // Start with full quality, compression is handled by the manipulator
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true); // Show a loading indicator
      const base64String = await processImage(result.assets[0].uri);
      setLoading(false); // Hide loading indicator
      
      if (base64String) {
        setImages([...images, base64String]);
      } else {
        Alert.alert('오류', '이미지를 처리하는 중 오류가 발생했습니다.');
      }
    }
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 할인율 계산
  const calculateDiscountRate = () => {
    const original = parseFloat(originalPrice);
    const discounted = parseFloat(discountedPrice);
    if (original && discounted && original > discounted) {
      return Math.round(((original - discounted) / original) * 100);
    }
    return 0;
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
    if (!expiryDate || !expiryTime) {
      Alert.alert('입력 오류', '마감 일시를 설정해주세요.');
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

      // 마감 날짜/시간 파싱
      const [year, month, day] = expiryDate.split('-').map(Number);
      const [hour, minute] = expiryTime.split(':').map(Number);
      const expiryDateTime = new Date(year, month - 1, day, hour, minute);

      if (expiryDateTime <= new Date()) {
        Alert.alert('입력 오류', '마감 시간은 현재 시간보다 이후여야 합니다.');
        return;
      }

      // 떨이 데이터 생성
      const dealData = {
        title: title.trim(),
        description: description.trim(),
        category,
        images: images, // 업로드 후 URL로 업데이트
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
        discountRate: calculateDiscountRate(),
        totalQuantity: parseInt(quantity),
        remainingQuantity: parseInt(quantity),
        expiryDate: expiryDateTime,
        storeId: 'temp_store_id', // TODO: 실제 매장 ID
        storeName: '테스트 매장', // TODO: 실제 매장 이름
        location: {
          latitude: 37.5665,
          longitude: 126.9780
        }, // TODO: 실제 매장 위치
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
        // 떨이 데이터에 이미지 URL 업데이트
        // TODO: updateDeal 함수 호출하여 images 필드 업데이트
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

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>떨이 등록</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사진 업로드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상품 사진 (최대 3장)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color="#22c55e" />
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
            <Text style={styles.label}>상품명 *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="예: 케이크 3개 세트"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>상품 설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="상품에 대한 간단한 설명을 입력해주세요."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>카테고리 *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      category === key && styles.categoryButtonActive,
                      { borderColor: CATEGORY_COLORS[key as CategoryType] }
                    ]}
                    onPress={() => setCategory(key as CategoryType)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === key && styles.categoryTextActive,
                        { color: category === key ? '#ffffff' : CATEGORY_COLORS[key as CategoryType] }
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
          
          <View style={styles.priceRow}>
            <View style={styles.priceInputGroup}>
              <Text style={styles.label}>원가 *</Text>
              <TextInput
                style={styles.input}
                value={originalPrice}
                onChangeText={setOriginalPrice}
                placeholder="10,000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.priceInputGroup}>
              <Text style={styles.label}>할인가 *</Text>
              <TextInput
                style={styles.input}
                value={discountedPrice}
                onChangeText={setDiscountedPrice}
                placeholder="3,000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {originalPrice && discountedPrice && (
            <View style={styles.discountInfo}>
              <Text style={styles.discountRate}>
                할인율: {calculateDiscountRate()}%
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>수량 *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="3"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* 마감 시간 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>마감 시간</Text>
          
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeInputGroup}>
              <Text style={styles.label}>날짜 *</Text>
              <TextInput
                style={styles.input}
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="2024-12-25"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={styles.dateTimeInputGroup}>
              <Text style={styles.label}>시간 *</Text>
              <TextInput
                style={styles.input}
                value={expiryTime}
                onChangeText={setExpiryTime}
                placeholder="18:00"
                placeholderTextColor="#9ca3af"
              />
            </View>
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
              <Text style={styles.submitButtonText}>떨이 등록하기</Text>
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
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
  },
  addImageText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  categoryButtonActive: {
    backgroundColor: '#22c55e',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  discountInfo: {
    alignItems: 'center',
    marginVertical: 8,
  },
  discountRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeInputGroup: {
    flex: 1,
    marginRight: 8,
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