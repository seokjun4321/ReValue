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
    if (!user) return;

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
        const downloadUrl = await uploadProfileImage(user.uid, imageUri);
        
        if (downloadUrl) {
          await updateProfile(user, { photoURL: downloadUrl });
          Alert.alert('성공', '프로필 이미지가 변경되었습니다.');
        } else {
          Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('프로필 이미지 변경 오류:', error);
      Alert.alert('오류', '프로필 이미지 변경 중 문제가 발생했습니다.');
    } finally {
      setImageLoading(false);
    }
  };

  // 닉네임 변경
  const handleUpdateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>
      
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
              <Ionicons name="person-circle" size={80} color="#22c55e" />
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
              {user?.displayName || user?.email?.split('@')[0] || '사용자'}님
            </Text>
            <Ionicons name="pencil" size={16} color="#22c55e" style={styles.editNameIcon} />
          </TouchableOpacity>

          <Text style={styles.userEmail}>
            {user?.email || 'guest@revalue.kr'}
          </Text>

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
          
          <View style={styles.ecoStatsContainer}>
            <View style={styles.ecoStat}>
              <Ionicons name="leaf" size={20} color="#22c55e" />
              <Text style={styles.ecoStatValue}>12.3kg</Text>
              <Text style={styles.ecoStatLabel}>절약한 CO₂</Text>
            </View>
            <View style={styles.ecoStat}>
              <Ionicons name="bag" size={20} color="#22c55e" />
              <Text style={styles.ecoStatValue}>47개</Text>
              <Text style={styles.ecoStatLabel}>구매한 떨이</Text>
            </View>
            <View style={styles.ecoStat}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
              <Text style={styles.ecoStatValue}>Lv.3</Text>
              <Text style={styles.ecoStatLabel}>에코 레벨</Text>
            </View>
          </View>
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          {/* ----- 아래 메뉴들에 onPress 이벤트 추가 ----- */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/history')}>
            <View style={styles.menuContent}>
              <Ionicons name="receipt" size={24} color="#22c55e" />
              <Text style={styles.menuText}>거래 내역</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/reviews')}>
            <View style={styles.menuContent}>
              <Ionicons name="star" size={24} color="#22c55e" />
              <Text style={styles.menuText}>내 후기</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 판매자 모드 섹션 */}
        <View style={styles.sellerMenuSection}>
            <TouchableOpacity 
              style={styles.sellerModeButton}
              onPress={() => router.push('/seller/dashboard')}
            >
              <View style={styles.menuContent}>
                <Ionicons name="analytics" size={24} color="#3b82f6" />
                <Text style={styles.sellerModeText}>판매자 대시보드</Text>
                <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sellerUploadButton}
              onPress={() => router.push('/seller/upload')}
            >
              <View style={styles.menuContent}>
                <Ionicons name="add-circle" size={24} color="#22c55e" />
                <Text style={styles.sellerUploadText}>떨이 등록</Text>
                <Ionicons name="chevron-forward" size={20} color="#22c55e" />
              </View>
            </TouchableOpacity>
        </View>

        {/* 설정 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
            <View style={styles.menuContent}>
              <Ionicons name="settings" size={24} color="#22c55e" />
              <Text style={styles.menuText}>설정</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
            <View style={styles.menuContent}>
              <Ionicons name="notifications" size={24} color="#22c55e" />
              <Text style={styles.menuText}>알림 설정</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help')}>
            <View style={styles.menuContent}>
              <Ionicons name="help-circle" size={24} color="#22c55e" />
              <Text style={styles.menuText}>도움말</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about')}>
            <View style={styles.menuContent}>
              <Ionicons name="information-circle" size={24} color="#22c55e" />
              <Text style={styles.menuText}>앱 정보</Text>
              <Ionicons name="chevron-forward" size={20} color="#16a34a" />
            </View>
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
      </ScrollView>
    </View>
  );
}

// 스타일은 기존과 동일하지만, 구분을 위해 sellerMenuSection 등을 추가했습니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    backgroundColor: '#22c55e',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22c55e',
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
    marginBottom: 4,
  },
  editNameIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  cancelButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#16a34a',
    marginBottom: 20,
  },
  ecoStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    paddingTop: 16,
  },
  ecoStat: {
    alignItems: 'center',
    flex: 1,
  },
  ecoStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 4,
  },
  ecoStatLabel: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    overflow: 'hidden',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#166534',
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  sellerMenuSection: {
    marginBottom: 20,
    gap: 12,
  },
  sellerModeButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  sellerModeText: {
    fontSize: 16,
    color: '#1e40af',
    flex: 1,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  sellerUploadButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  sellerUploadText: {
    fontSize: 16,
    color: '#166534',
    flex: 1,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f87171',
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
});