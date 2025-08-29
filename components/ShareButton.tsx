import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Clipboard } from 'react-native';
import * as Linking from 'expo-linking';
import { Deal } from '../lib/types';

interface ShareButtonProps {
  deal: Deal;
  style?: any;
}

export default function ShareButton({ deal, style }: ShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  // 공유 URL 생성
  const getShareUrl = () => {
    const baseUrl = 'https://revalue.app/deal/';
    return `${baseUrl}${deal.id}`;
  };

  // 공유 메시지 생성
  const getShareMessage = () => {
    return `[ReValue] ${deal.title}\n\n${deal.storeName}의 특별한 떨이!\n${deal.discountRate}% 할인된 가격으로 만나보세요.\n\n${getShareUrl()}`;
  };

  // 기본 공유
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: getShareMessage(),
        url: getShareUrl(), // iOS only
        title: `[ReValue] ${deal.title}`, // Android only
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('공유 완료:', result.activityType);
        }
      }
    } catch (error) {
      Alert.alert('공유 실패', '공유하는 중에 오류가 발생했습니다.');
    }
  };

  // 링크 복사
  const copyLink = async () => {
    try {
      Clipboard.setString(getShareUrl());
      Alert.alert('복사 완료', '링크가 클립보드에 복사되었습니다.');
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('복사 실패', '링크를 복사하는 중에 오류가 발생했습니다.');
    }
  };

  // SNS 공유
  const shareToSNS = async (platform: string) => {
    const url = getShareUrl();
    const message = getShareMessage();

    try {
      switch (platform) {
        case 'kakao':
          // 카카오톡 공유하기 (실제로는 카카오 SDK 필요)
          await Linking.openURL(`kakaolink://send?text=${encodeURIComponent(message)}`);
          break;
        case 'facebook':
          await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          break;
        case 'twitter':
          await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`);
          break;
        case 'instagram':
          // 인스타그램 스토리 공유 (실제로는 인스타그램 SDK 필요)
          await Linking.openURL('instagram://story-camera');
          break;
      }
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('공유 실패', `${platform}로 공유하는 중에 오류가 발생했습니다.`);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.shareButton, style]}
        onPress={() => setShowShareModal(true)}
      >
        <Ionicons name="share-outline" size={24} color="#374151" />
      </TouchableOpacity>

      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>공유하기</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptions}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSNS('kakao')}
              >
                <View style={[styles.shareIcon, { backgroundColor: '#FEE500' }]}>
                  <Ionicons name="chatbubble" size={24} color="#000000" />
                </View>
                <Text style={styles.shareText}>카카오톡</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSNS('facebook')}
              >
                <View style={[styles.shareIcon, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={24} color="#ffffff" />
                </View>
                <Text style={styles.shareText}>페이스북</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSNS('twitter')}
              >
                <View style={[styles.shareIcon, { backgroundColor: '#1DA1F2' }]}>
                  <Ionicons name="logo-twitter" size={24} color="#ffffff" />
                </View>
                <Text style={styles.shareText}>트위터</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSNS('instagram')}
              >
                <View style={[styles.shareIcon, { backgroundColor: '#E4405F' }]}>
                  <Ionicons name="logo-instagram" size={24} color="#ffffff" />
                </View>
                <Text style={styles.shareText}>인스타그램</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#374151" />
              <Text style={styles.actionButtonText}>다른 앱으로 공유</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={copyLink}
            >
              <Ionicons name="link" size={24} color="#374151" />
              <Text style={styles.actionButtonText}>링크 복사</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    padding: 8,
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
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareText: {
    fontSize: 12,
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
});
