// app/reviews.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Review, Badge, Post } from '../lib/types';
import * as ImagePicker from 'expo-image-picker';

export default function ReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 리뷰 작성 상태
  const [reviewDraft, setReviewDraft] = useState({
    ratings: {
      overall: 0,
      freshness: 0,
      value: 0,
      service: 0
    },
    comment: '',
    images: [] as string[],
    tags: [] as string[]
  });

  useEffect(() => {
    loadReviews();
    loadBadges();
  }, []);

  const loadReviews = async () => {
    // TODO: Firestore에서 리뷰 데이터 로드
    setLoading(false);
  };

  const loadBadges = async () => {
    // TODO: 사용자의 뱃지 데이터 로드
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setReviewDraft(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }));
    }
  };

  const renderRatingStars = (rating: number, onRate: (rating: number) => void) => (
    <View style={styles.ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate(star)}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={24}
            color="#e03131"
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBadges = () => (
    <View style={styles.badgesSection}>
      <Text style={styles.sectionTitle}>나의 뱃지</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <View style={[styles.badgeIcon, { backgroundColor: getBadgeColor(badge.tier) }]}>
              <Ionicons name={badge.icon as any} size={24} color="#ffffff" />
            </View>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 후기</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 뱃지 섹션 */}
        {badges.length > 0 && renderBadges()}

        {/* 리뷰 목록 */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>작성한 후기</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#e03131" />
          ) : reviews.length === 0 ? (
            <View style={styles.placeholder}>
              <Ionicons name="star-outline" size={60} color="#9ca3af" />
              <Text style={styles.placeholderText}>작성한 후기가 여기에 표시됩니다.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <TouchableOpacity
                key={review.id}
                style={styles.reviewCard}
                onPress={() => {
                  setSelectedReview(review);
                  setShowReviewModal(true);
                }}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.ratings.overall ? "star" : "star-outline"}
                        size={16}
                        color="#e03131"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {review.images.length > 0 && (
                  <ScrollView horizontal style={styles.reviewImages}>
                    {review.images.map((image, index) => (
                      <Image
                        key={index}
                        source={{ uri: image }}
                        style={styles.reviewImage}
                      />
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.reviewComment} numberOfLines={3}>
                  {review.comment}
                </Text>

                <View style={styles.reviewTags}>
                  {review.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.reviewFooter}>
                  <TouchableOpacity style={styles.helpfulButton}>
                    <Ionicons name="thumbs-up-outline" size={16} color="#e03131" />
                    <Text style={styles.helpfulText}>
                      도움됐어요 {review.helpfulCount}
                    </Text>
                  </TouchableOpacity>
                  {review.rewardPoints > 0 && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>+{review.rewardPoints}P</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 리뷰 상세 모달 */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color="#191f28" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>리뷰 상세</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedReview && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.ratingDetails}>
                <RatingItem 
                  label="전체 평점" 
                  rating={selectedReview.ratings.overall} 
                />
                <RatingItem 
                  label="신선도" 
                  rating={selectedReview.ratings.freshness} 
                />
                <RatingItem 
                  label="가격 만족도" 
                  rating={selectedReview.ratings.value} 
                />
                <RatingItem 
                  label="서비스" 
                  rating={selectedReview.ratings.service} 
                />
              </View>

              <View style={styles.imageGallery}>
                {selectedReview.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.galleryImage}
                  />
                ))}
              </View>

              <Text style={styles.reviewDetailText}>
                {selectedReview.comment}
              </Text>

              {selectedReview.storeReply && (
                <View style={styles.storeReply}>
                  <Text style={styles.storeReplyTitle}>사장님 답변</Text>
                  <Text style={styles.storeReplyText}>
                    {selectedReview.storeReply}
                  </Text>
                  <Text style={styles.storeReplyDate}>
                    {new Date(selectedReview.storeRepliedAt!).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// 평점 아이템 컴포넌트
const RatingItem = ({ label, rating }: { label: string; rating: number }) => (
  <View style={styles.ratingItem}>
    <Text style={styles.ratingLabel}>{label}</Text>
    <View style={styles.ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={16}
          color="#e03131"
        />
      ))}
    </View>
  </View>
);

// 뱃지 색상 helper
const getBadgeColor = (tier: string) => {
  switch (tier) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    default: return '#6b7280';
  }
};

// 스타일은 history.tsx와 동일하게 사용합니다.
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  header: {
    backgroundColor: '#e03131',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 16,
  },
  content: { 
    flex: 1, 
    padding: 20 
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },

  // 뱃지 섹션 스타일
  badgesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 16,
  },
  badgeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191f28',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  // 리뷰 카드 스타일
  reviewsSection: {
    flex: 1,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewImages: {
    marginBottom: 12,
  },
  reviewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  reviewComment: {
    fontSize: 15,
    color: '#191f28',
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewTags: {
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
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  helpfulText: {
    fontSize: 13,
    color: '#e03131',
    fontWeight: '600',
    marginLeft: 6,
  },
  rewardBadge: {
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 13,
    color: '#e03131',
    fontWeight: '600',
  },

  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  ratingDetails: {
    marginBottom: 24,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 15,
    color: '#191f28',
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  galleryImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    margin: '1%',
  },
  reviewDetailText: {
    fontSize: 15,
    color: '#191f28',
    lineHeight: 24,
    marginBottom: 24,
  },
  storeReply: {
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  storeReplyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e03131',
    marginBottom: 8,
  },
  storeReplyText: {
    fontSize: 14,
    color: '#191f28',
    lineHeight: 22,
    marginBottom: 8,
  },
  storeReplyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
});