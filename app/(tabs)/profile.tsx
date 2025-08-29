import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase';
import { signOutFromSocial, getCurrentSocialProvider } from '../../lib/socialAuth';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfileImage } from '../../lib/firestore';
import "../global.css";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    const socialProvider = getCurrentSocialProvider();
    const providerName = socialProvider === 'google' ? 'Google' : 
                        socialProvider === 'apple' ? 'Apple' : 
                        socialProvider === 'facebook' ? 'Facebook' : '이메일';

    Alert.alert(
      '로그아웃',
      `${providerName} 계정에서 로그아웃하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: performLogout 
        }
      ]
    );
  };

  const performLogout = async () => {
    setLoading(true);
    try {
      const result = await signOutFromSocial();
      if (result.success) {
        console.log('로그아웃 성공');
        router.replace('/login');
      } else {
        Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로필 이미지 변경
  const handleChangeProfileImage = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        
        try {
          const downloadUrl = await uploadProfileImage(user.uid, imageUri);
          if (downloadUrl) {
            await updateProfile(user, { photoURL: downloadUrl });
            Alert.alert('성공', '프로필 이미지가 변경되었습니다.');
          } else {
            Alert.alert('오류', '이미지 업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('프로필 이미지 업로드 오류:', error);
          Alert.alert('오류', '이미지 업로드 중 문제가 발생했습니다.');
        }
      }
    } catch (error) {
      console.error('프로필 이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 문제가 발생했습니다.');
    } finally {
      setImageLoading(false);
    }
  };

  // 닉네임 변경
  const handleUpdateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) {
      Alert.alert('입력 오류', '닉네임을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await updateProfile(user, { displayName: newDisplayName.trim() });
      setIsEditingName(false);
      Alert.alert('성공', '닉네임이 변경되었습니다.');
    } catch (error) {
      console.error('닉네임 변경 오류:', error);
      Alert.alert('오류', '닉네임 변경 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangeProfileImage}
            disabled={imageLoading}
          >
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.profileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.defaultAvatarText}>
                  {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </Text>
              </View>
            )}
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
            <View style={styles.editImageBadge}>
              <Ionicons name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nameContainer}
            onPress={() => {
              setNewDisplayName(user?.displayName || '');
              setIsEditingName(true);
            }}
          >
            <Text style={styles.userName}>
              {user?.displayName || user?.email?.split('@')[0] || '사용자'}
            </Text>
            <Ionicons name="pencil" size={16} color="#dc2626" />
          </TouchableOpacity>

          <Text style={styles.userEmail}>
            {user?.email || 'guest@revalue.kr'}
          </Text>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={24} color="#dc2626" />
            <Text style={styles.statValue}>12.3kg</Text>
            <Text style={styles.statLabel}>절약한 CO₂</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bag" size={24} color="#dc2626" />
            <Text style={styles.statValue}>47개</Text>
            <Text style={styles.statLabel}>구매한 떨이</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#dc2626" />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>평균 평점</Text>
          </View>
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/history')}>
            <Ionicons name="receipt" size={24} color="#dc2626" />
            <Text style={styles.menuText}>거래 내역</Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/reviews')}>
            <Ionicons name="star" size={24} color="#dc2626" />
            <Text style={styles.menuText}>내 후기</Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* 판매자 메뉴 */}
        <View style={styles.sellerSection}>
          <TouchableOpacity 
            style={styles.sellerButton}
            onPress={() => router.push('/seller/dashboard')}
          >
            <View style={styles.sellerButtonContent}>
              <View style={styles.sellerButtonLeft}>
                <Ionicons name="analytics" size={24} color="#dc2626" />
                <Text style={styles.sellerButtonText}>판매자 대시보드</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#dc2626" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sellerButton}
            onPress={() => router.push('/seller/upload')}
          >
            <View style={styles.sellerButtonContent}>
              <View style={styles.sellerButtonLeft}>
                <Ionicons name="add-circle" size={24} color="#dc2626" />
                <Text style={styles.sellerButtonText}>떨이 등록</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#dc2626" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 설정 메뉴 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
            <Ionicons name="settings" size={24} color="#dc2626" />
            <Text style={styles.menuText}>설정</Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications" size={24} color="#dc2626" />
            <Text style={styles.menuText}>알림 설정</Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help')}>
            <Ionicons name="help-circle" size={24} color="#dc2626" />
            <Text style={styles.menuText}>도움말</Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about')}>
            <Ionicons name="information-circle" size={24} color="#dc2626" />
            <Text style={styles.menuText}>앱 정보</Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity 
          style={[styles.logoutButton, loading && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out" size={24} color="#dc2626" />
          <Text style={styles.logoutText}>
            {loading ? '로그아웃 중...' : '로그아웃'}
          </Text>
        </TouchableOpacity>

        {/* 닉네임 변경 모달 */}
        <Modal
          visible={isEditingName}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>닉네임 변경</Text>
              <TextInput
                style={styles.nameInput}
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                placeholder="새로운 닉네임을 입력하세요"
                maxLength={20}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditingName(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleUpdateDisplayName}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>변경</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#dc2626',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
    marginRight: 8,
  },
  userEmail: {
    fontSize: 15,
    color: '#868e96',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    margin: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#868e96',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#191f28',
    marginLeft: 12,
  },
  sellerSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  sellerButton: {
    backgroundColor: '#fff8f8',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  sellerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sellerButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerButtonText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f8',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 20,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  cancelButtonText: {
    color: '#191f28',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});