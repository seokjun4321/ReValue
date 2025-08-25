// 이미지 크기 검증 함수 (3MB 제한)
export const validateImageSize = async (uri: string): Promise<boolean> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const maxSize = 3 * 1024 * 1024; // 3MB
    
    if (blob.size > maxSize) {
      throw new Error(`이미지 크기가 3MB를 초과합니다 (현재: ${(blob.size / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    return true;
  } catch (error) {
    console.error('이미지 크기 검증 실패:', error);
    throw error;
  }
};