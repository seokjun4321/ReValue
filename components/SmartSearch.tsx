import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { searchDeals } from '../lib/firestore';
import { Deal } from '../lib/types';

interface SmartSearchProps {
  onSelect: (deal: Deal) => void;
}

export default function SmartSearch({ onSelect }: SmartSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchResults, setSearchResults] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);

  const popularTags = [
    '한식', '중식', '일식', '양식',
    '채식', '디저트', '카페',
    '50% 이상', '신규', '1시간 내 마감',
    '1km 이내', '인기매장'
  ];

  // 음성 검색 시작
  const startVoiceSearch = async () => {
    try {
      setIsListening(true);
      const isAvailable = await Speech.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('알림', '음성 검색을 사용할 수 없습니다.');
        setIsListening(false);
        return;
      }

      await Speech.speak('무엇을 찾으시나요?', {
        language: 'ko-KR',
        pitch: 1,
        rate: 0.9,
        onDone: () => {
          // 실제 앱에서는 여기에 음성 인식 API를 연동해야 합니다
          // 현재는 데모 목적으로 타이머 사용
          setTimeout(() => {
            setIsListening(false);
            setSearchTerm('근처 맛집');
            handleSearch('근처 맛집');
          }, 2000);
        },
        onError: (error) => {
          console.error('음성 출력 오류:', error);
          setIsListening(false);
          Alert.alert('오류', '음성 검색 중 문제가 발생했습니다.');
        }
      });
    } catch (error) {
      console.error('음성 검색 오류:', error);
      setIsListening(false);
      Alert.alert('오류', '음성 검색을 시작할 수 없습니다.');
    }
  };

  // 검색 실행
  const handleSearch = async (term: string) => {
    if (!term.trim() && selectedTags.length === 0) return;

    setLoading(true);
    try {
      const results = await searchDeals(term, 20);
      // 태그 기반 필터링
      const filteredResults = results.filter(deal => {
        if (selectedTags.length === 0) return true;
        return selectedTags.some(tag => {
          switch (tag) {
            case '50% 이상':
              return deal.discountRate >= 50;
            case '신규':
              return deal.isNew;
            case '1시간 내 마감':
              return (deal.expiryDate.getTime() - new Date().getTime()) <= 3600000;
            case '1km 이내':
              return deal.distance <= 1;
            case '인기매장':
              return deal.popularity >= 4.5;
            default:
              return deal.category === tag || deal.tags?.includes(tag);
          }
        });
      });
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 검색어 변경시 자동 검색
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm || selectedTags.length > 0) {
        handleSearch(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, selectedTags]);

  return (
    <View style={styles.container}>
      {/* 검색 입력 */}
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="상품명, 매장명, 태그로 검색"
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchTerm)}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startVoiceSearch} disabled={isListening}>
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={20}
              color={isListening ? "#e03131" : "#9ca3af"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 태그 선택 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagScroll}
      >
        <TouchableOpacity
          style={styles.tagButton}
          onPress={() => setShowTagModal(true)}
        >
          <Ionicons name="pricetag" size={16} color="#9ca3af" />
          <Text style={styles.tagButtonText}>태그 선택</Text>
        </TouchableOpacity>
        {selectedTags.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, styles.selectedTag]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={styles.selectedTagText}>{tag}</Text>
            <Ionicons name="close" size={16} color="#e03131" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 태그 선택 모달 */}
      <Modal
        visible={showTagModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>태그 선택</Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagContainer}>
              {popularTags.map(tag => (
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
        </View>
      </Modal>

      {/* 검색 결과 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e03131" />
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map(deal => (
            <TouchableOpacity
              key={deal.id}
              style={styles.resultItem}
              onPress={() => onSelect(deal)}
            >
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{deal.title}</Text>
                <Text style={styles.resultStore}>{deal.storeName}</Text>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultPrice}>
                    {deal.discountedPrice.toLocaleString()}원
                  </Text>
                  <Text style={styles.resultDiscount}>
                    {deal.discountRate}% 할인
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : searchTerm || selectedTags.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 12,
    color: '#374151',
  },
  tagScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tagButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  resultStore: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e03131',
    marginRight: 8,
  },
  resultDiscount: {
    fontSize: 14,
    color: '#e03131',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
