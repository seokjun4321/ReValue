import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { collections } from '../../../lib/types';
import { updateDeal } from '../../../lib/firestore';

export default function EditDealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // 폼 데이터
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [remainingQuantity, setRemainingQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    loadDealData();
  }, [id]);

  const loadDealData = async () => {
    try {
      const dealRef = doc(db, collections.deals, id as string);
      const dealSnap = await getDoc(dealRef);
      
      if (!dealSnap.exists()) {
        Alert.alert('오류', '떨이 정보를 찾을 수 없습니다.');
        router.back();
        return;
      }

      const data = dealSnap.data();
      setTitle(data.title);
      setDescription(data.description);
      setOriginalPrice(data.originalPrice.toString());
      setDiscountedPrice(data.discountedPrice.toString());
      setTotalQuantity(data.totalQuantity.toString());
      setRemainingQuantity(data.remainingQuantity.toString());
      setExpiryDate(data.expiryDate.toDate());
      setImages(data.images || []);
      setCategory(data.category);
    } catch (error) {
      console.error('떨이 정보 로드 실패:', error);
      Alert.alert('오류', '떨이 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setImages(result.assets.map(asset => asset.uri));
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 입력값 검증
      if (!title.trim()) throw new Error('제목을 입력해주세요.');
      if (!description.trim()) throw new Error('설명을 입력해주세요.');
      if (!originalPrice || !discountedPrice) throw new Error('가격을 입력해주세요.');
      if (!totalQuantity || !remainingQuantity) throw new Error('수량을 입력해주세요.');
      if (!category) throw new Error('카테고리를 선택해주세요.');
      if (images.length === 0) throw new Error('최소 1장의 이미지가 필요합니다.');

      const updates = {
        title: title.trim(),
        description: description.trim(),
        originalPrice: parseInt(originalPrice),
        discountedPrice: parseInt(discountedPrice),
        totalQuantity: parseInt(totalQuantity),
        remainingQuantity: parseInt(remainingQuantity),
        expiryDate,
        category,
        updatedAt: new Date()
      };

      await updateDeal(id as string, updates, images);
      Alert.alert('성공', '떨이가 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '떨이 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>떨이 수정</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 이미지 섹션 */}
        <View style={styles.imageSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.image}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={handleImagePick}>
              <Ionicons name="add" size={40} color="#22c55e" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="떨이 제목"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="떨이 상품에 대한 설명"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>원래 가격</Text>
              <TextInput
                style={styles.input}
                value={originalPrice}
                onChangeText={setOriginalPrice}
                placeholder="원래 가격"
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>할인 가격</Text>
              <TextInput
                style={styles.input}
                value={discountedPrice}
                onChangeText={setDiscountedPrice}
                placeholder="할인 가격"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>총 수량</Text>
              <TextInput
                style={styles.input}
                value={totalQuantity}
                onChangeText={setTotalQuantity}
                placeholder="총 수량"
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>남은 수량</Text>
              <TextInput
                style={styles.input}
                value={remainingQuantity}
                onChangeText={setRemainingQuantity}
                placeholder="남은 수량"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.categoryContainer}>
              {['식사', '음료', '디저트', '간식', '기타'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>마감 시간</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  // iOS의 경우 기본 날짜/시간 선택 UI 사용
                  Alert.alert(
                    '마감 시간 설정',
                    '날짜와 시간을 입력해주세요',
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '확인',
                        onPress: () => {
                          const now = new Date();
                          const tomorrow = new Date(now.setDate(now.getDate() + 1));
                          setExpiryDate(tomorrow);
                        }
                      }
                    ]
                  );
                } else {
                  // Android의 경우 기본 날짜/시간 선택 UI 사용
                  const now = new Date();
                  const tomorrow = new Date(now.setDate(now.getDate() + 1));
                  setExpiryDate(tomorrow);
                }
              }}
            >
              <Text style={styles.dateButtonText}>
                {expiryDate.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
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
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  categoryButtonActive: {
    backgroundColor: '#22c55e',
  },
  categoryButtonText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  dateButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },

});
