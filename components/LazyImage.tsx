import React, { useState, useEffect } from 'react';
import { 
  Image, 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  ImageStyle, 
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LazyImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: () => void;
  loadingIndicatorColor?: string;
}

export default function LazyImage({
  source,
  style,
  containerStyle,
  placeholder,
  fallback,
  resizeMode = 'cover',
  onLoad,
  onError,
  loadingIndicatorColor = '#22c55e'
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트되면 이미지 로딩 시작
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 100); // 100ms 지연으로 레이아웃 최적화

    return () => clearTimeout(timer);
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const renderContent = () => {
    if (!shouldLoad) {
      // 로딩 시작 전 플레이스홀더
      return placeholder || (
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color={loadingIndicatorColor} />
        </View>
      );
    }

    if (hasError) {
      // 에러 발생 시 fallback
      return fallback || (
        <View style={styles.errorContainer}>
          <Ionicons name="image-outline" size={32} color="#9ca3af" />
        </View>
      );
    }

    return (
      <>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={loadingIndicatorColor} />
          </View>
        )}
        <Image
          source={source}
          style={[style, isLoading && styles.hiddenImage]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      </>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    zIndex: 1,
  },
  hiddenImage: {
    opacity: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});