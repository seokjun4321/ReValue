import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../../lib/types';
import * as ImagePicker from 'expo-image-picker';
import { createPost, getPosts } from '../../lib/firestore';
import { auth } from '../../firebase';

export default function CommunityScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Post['category']>('tips');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 게시글 작성 상태
  const [postDraft, setPostDraft] = useState({
    title: '',
    content: '',
    images: [] as string[],
    tags: [] as string[],
    category: selectedCategory,
    location: null as {
      name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    } | null,
  });

  // 카테고리가 변경될 때 postDraft의 category도 업데이트
  useEffect(() => {
    setPostDraft(prev => ({ ...prev, category: selectedCategory }));
  }, [selectedCategory]);

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const loadedPosts = await getPosts(selectedCategory);
      setPosts(loadedPosts || []); // null이나 undefined인 경우 빈 배열로 처리
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      Alert.alert('오류', '게시글을 불러오는 중 문제가 발생했습니다.');
      setPosts([]); // 오류 발생 시 빈 배열로 초기화
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setPostDraft(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }));
    }
  };

  const renderCategoryChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryChips}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === 'tips' && styles.categoryChipActive
        ]}
        onPress={() => setSelectedCategory('tips')}
      >
        <Ionicons 
          name="bulb" 
          size={16} 
          color={selectedCategory === 'tips' ? '#e03131' : '#495057'} 
        />
        <Text style={[
          styles.categoryChipText,
          selectedCategory === 'tips' && styles.categoryChipTextActive
        ]}>떨이 꿀팁</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === 'restaurants' && styles.categoryChipActive
        ]}
        onPress={() => setSelectedCategory('restaurants')}
      >
        <Ionicons 
          name="restaurant" 
          size={16} 
          color={selectedCategory === 'restaurants' ? '#e03131' : '#495057'} 
        />
        <Text style={[
          styles.categoryChipText,
          selectedCategory === 'restaurants' && styles.categoryChipTextActive
        ]}>맛집 정보</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === 'eco' && styles.categoryChipActive
        ]}
        onPress={() => setSelectedCategory('eco')}
      >
        <Ionicons 
          name="leaf" 
          size={16} 
          color={selectedCategory === 'eco' ? '#e03131' : '#495057'} 
        />
        <Text style={[
          styles.categoryChipText,
          selectedCategory === 'eco' && styles.categoryChipTextActive
        ]}>환경 보호</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === 'general' && styles.categoryChipActive
        ]}
        onPress={() => setSelectedCategory('general')}
      >
        <Ionicons 
          name="chatbubbles" 
          size={16} 
          color={selectedCategory === 'general' ? '#e03131' : '#495057'} 
        />
        <Text style={[
          styles.categoryChipText,
          selectedCategory === 'general' && styles.categoryChipTextActive
        ]}>자유 토크</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={styles.authorImage}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>작성자 이름</Text>
            <Text style={styles.postTime}>
              {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      {post.images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.postImages}
        >
          {post.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.postImage}
            />
          ))}
        </ScrollView>
      )}

      {post.location && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#e03131" />
          <Text style={styles.locationText}>{post.location.name}</Text>
        </View>
      )}

      {post.ecoImpact && (
        <View style={styles.ecoImpact}>
          <Ionicons name="leaf" size={16} color="#22c55e" />
          <Text style={styles.ecoImpactText}>
            {post.ecoImpact.savedAmount}{post.ecoImpact.unit} 절약
          </Text>
        </View>
      )}

      <View style={styles.postTags}>
        {post.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="heart-outline" size={20} color="#6b7280" />
          <Text style={styles.footerButtonText}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.footerButtonText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="share-outline" size={20} color="#6b7280" />
          <Text style={styles.footerButtonText}>{post.shares}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
        <TouchableOpacity 
          style={styles.writeButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="create" size={20} color="#ffffff" />
          <Text style={styles.writeButtonText}>글쓰기</Text>
        </TouchableOpacity>
      </View>

      {renderCategoryChips()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e03131" style={styles.loading} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>아직 게시글이 없어요</Text>
            <Text style={styles.emptyStateSubText}>첫 게시글을 작성해보세요!</Text>
          </View>
        ) : (
          posts.map(post => renderPost(post))
        )}
      </ScrollView>

      {/* 글쓰기 모달 */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>게시글 작성</Text>
            <TouchableOpacity
              onPress={async () => {
                if (!postDraft.title.trim()) {
                  Alert.alert('알림', '제목을 입력해주세요.');
                  return;
                }
                if (!postDraft.content.trim()) {
                  Alert.alert('알림', '내용을 입력해주세요.');
                  return;
                }
                if (!auth.currentUser) {
                  Alert.alert('알림', '로그인이 필요합니다.');
                  return;
                }

                try {
                  await createPost({
                    title: postDraft.title,
                    content: postDraft.content,
                    images: postDraft.images,
                    tags: postDraft.tags,
                    category: postDraft.category,
                    location: postDraft.location,
                    authorId: auth.currentUser.uid,
                    authorName: auth.currentUser.displayName || '익명',
                    authorImage: auth.currentUser.photoURL || 'https://via.placeholder.com/40',
                  });

                  Alert.alert('성공', '게시글이 작성되었습니다.');
                  setShowCreateModal(false);
                  setPostDraft({
                    title: '',
                    content: '',
                    images: [],
                    tags: [],
                    category: 'tips',
                    location: null,
                  });
                  loadPosts();
                } catch (error) {
                  console.error('게시글 작성 실패:', error);
                  Alert.alert('오류', '게시글 작성 중 문제가 발생했습니다.');
                }
              }}
            >
              <Text style={styles.modalSubmit}>완료</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="제목을 입력하세요"
              value={postDraft.title}
              onChangeText={(text) => setPostDraft(prev => ({ ...prev, title: text }))}
            />

            <TextInput
              style={styles.contentInput}
              placeholder="내용을 입력하세요"
              multiline
              value={postDraft.content}
              onChangeText={(text) => setPostDraft(prev => ({ ...prev, content: text }))}
            />

            {postDraft.images.length > 0 && (
              <ScrollView 
                horizontal 
                style={styles.draftImages}
                showsHorizontalScrollIndicator={false}
              >
                {postDraft.images.map((image, index) => (
                  <View key={index} style={styles.draftImageContainer}>
                    <Image source={{ uri: image }} style={styles.draftImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setPostDraft(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#e03131" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.toolBar}>
              <TouchableOpacity 
                style={styles.toolButton}
                onPress={handleImagePick}
              >
                <Ionicons name="image" size={24} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="location" size={24} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="pricetag" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e03131',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryChips: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipActive: {
    backgroundColor: '#fff5f5',
    borderColor: '#e03131',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 6,
    fontWeight: '600',
  },
  categoryChipTextActive: {
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 15,
    color: '#6b7280',
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  moreButton: {
    padding: 4,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImages: {
    marginBottom: 12,
  },
  postImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#e03131',
    marginLeft: 4,
  },
  ecoImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  ecoImpactText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#e03131',
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  footerButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
  },
  modalSubmit: {
    fontSize: 16,
    color: '#e03131',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    color: '#495057',
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  draftImages: {
    marginBottom: 16,
  },
  draftImageContainer: {
    marginRight: 8,
    position: 'relative',
  },
  draftImage: {
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
  toolBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 16,
  },
  toolButton: {
    marginRight: 20,
  },
});
