import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addStoreRecommendation } from '../lib/firestore';

interface StoreRecommendationProps {
  onClose: () => void;
}

export default function StoreRecommendation({ onClose }: StoreRecommendationProps) {
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const recommendationTags = [
    '맛집', '가성비', '친절한', '청결한',
    '분위기 좋은', '주차 편리', '단체 모임',
    '조용한', '뷰 좋은', '신선한', '특별한 메뉴'
  ];

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 추천 제출
  const handleSubmit = async () => {
    if (!storeName.trim()) {
      Alert.alert('알림', '매장 이름을 입력해주세요.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('알림', '주소를 입력해주세요.');
      return;
    }

    try {
      await addStoreRecommendation({
        storeName: storeName.trim(),
        address: address.trim(),
        reason: reason.trim(),
        tags: selectedTags,
        createdAt: new Date(),
      });

      Alert.alert(
        '추천 완료',
        '매장 추천이 성공적으로 등록되었습니다.\n더 나은 서비스를 위해 노력하겠습니다.',
        [{ text: '확인', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('오류', '매장 추천 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>매장 추천하기</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>매장 이름 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="추천하실 매장의 이름을 입력해주세요"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>주소 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="매장의 주소를 입력해주세요"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>추천 이유</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="이 매장을 추천하시는 이유를 자유롭게 작성해주세요"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>매장 특징</Text>
              <View style={styles.tagContainer}>
                {recommendationTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.selectedTag
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.selectedTagText
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>추천하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#e03131',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedTag: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e03131',
  },
  tagText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedTagText: {
    color: '#e03131',
  },
  submitButton: {
    backgroundColor: '#e03131',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
