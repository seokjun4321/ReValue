import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SellerApprovalRequest } from '../../../lib/types';

export default function SellerApprovalRequestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    registrationNumber: '',
    representativeName: '',
    phoneNumber: '',
    address: '',
    documents: {
      businessLicenseImage: '',
      idCardImage: '',
      storeImages: [] as string[],
      additionalDocs: [] as string[],
    },
  });

  const handleImagePick = async (type: 'businessLicense' | 'idCard' | 'store') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'businessLicense') {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            businessLicenseImage: result.assets[0].uri,
          },
        }));
      } else if (type === 'idCard') {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            idCardImage: result.assets[0].uri,
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            storeImages: [...prev.documents.storeImages, result.assets[0].uri],
          },
        }));
      }
    }
  };

  const handleSubmit = async () => {
    // 필수 항목 검증
    if (!formData.businessName || !formData.registrationNumber || 
        !formData.representativeName || !formData.phoneNumber || 
        !formData.address || !formData.documents.businessLicenseImage || 
        !formData.documents.idCardImage || formData.documents.storeImages.length === 0) {
      Alert.alert('입력 오류', '모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      // TODO: Firestore에 승인 요청 저장
      // const request = await submitSellerApprovalRequest(formData);
      
      Alert.alert(
        '제출 완료',
        '판매자 승인 요청이 제출되었습니다. 검토 후 결과를 알려드리겠습니다.',
        [{ text: '확인', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('승인 요청 제출 실패:', error);
      Alert.alert('오류', '승인 요청 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#191f28" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>판매자 승인 신청</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사업자 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>상호명 *</Text>
            <TextInput
              style={styles.input}
              value={formData.businessName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
              placeholder="상호명을 입력하세요"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>사업자등록번호 *</Text>
            <TextInput
              style={styles.input}
              value={formData.registrationNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
              placeholder="000-00-00000"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>대표자명 *</Text>
            <TextInput
              style={styles.input}
              value={formData.representativeName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, representativeName: text }))}
              placeholder="대표자명을 입력하세요"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>연락처 *</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
              placeholder="000-0000-0000"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>사업장 주소 *</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="사업장 주소를 입력하세요"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>필수 서류</Text>

          <View style={styles.documentGroup}>
            <Text style={styles.label}>사업자등록증 *</Text>
            <TouchableOpacity
              style={[
                styles.documentUpload,
                formData.documents.businessLicenseImage ? styles.documentUploaded : null
              ]}
              onPress={() => handleImagePick('businessLicense')}
            >
              {formData.documents.businessLicenseImage ? (
                <Text style={styles.documentText}>업로드 완료</Text>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#e03131" />
                  <Text style={styles.documentText}>파일 선택</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.documentGroup}>
            <Text style={styles.label}>신분증 *</Text>
            <TouchableOpacity
              style={[
                styles.documentUpload,
                formData.documents.idCardImage ? styles.documentUploaded : null
              ]}
              onPress={() => handleImagePick('idCard')}
            >
              {formData.documents.idCardImage ? (
                <Text style={styles.documentText}>업로드 완료</Text>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#e03131" />
                  <Text style={styles.documentText}>파일 선택</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.documentGroup}>
            <Text style={styles.label}>매장 사진 *</Text>
            <View style={styles.imageGrid}>
              {formData.documents.storeImages.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <TouchableOpacity
                    style={styles.imageRemove}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          storeImages: prev.documents.storeImages.filter((_, i) => i !== index)
                        }
                      }));
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#e03131" />
                  </TouchableOpacity>
                  <Text style={styles.imageText}>이미지 {index + 1}</Text>
                </View>
              ))}
              {formData.documents.storeImages.length < 5 && (
                <TouchableOpacity
                  style={styles.imageUpload}
                  onPress={() => handleImagePick('store')}
                >
                  <Ionicons name="add-circle" size={24} color="#e03131" />
                  <Text style={styles.imageUploadText}>사진 추가</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>승인 요청하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191f28',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#191f28',
  },
  documentGroup: {
    marginBottom: 20,
  },
  documentUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e03131',
    borderStyle: 'dashed',
  },
  documentUploaded: {
    backgroundColor: '#f8f9fa',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
  },
  documentText: {
    fontSize: 14,
    color: '#e03131',
    marginLeft: 8,
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imagePreview: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: '1%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  imageText: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 4,
  },
  imageUpload: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    margin: '1%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e03131',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 12,
    color: '#e03131',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#e03131',
    marginHorizontal: 20,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
