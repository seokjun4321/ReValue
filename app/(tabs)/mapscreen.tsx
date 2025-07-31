import React from 'react';
import { Dimensions, StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  // 웹에서는 지도 대신 플레이스홀더를 표시
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>지도</Text>
          <Text style={styles.subTitle}>주변 장소를 확인해보세요</Text>
        </View>
        
        <View style={styles.webPlaceholder}>
          <Ionicons name="map" size={80} color="#fbbf24" />
          <Text style={styles.placeholderTitle}>지도 기능</Text>
          <Text style={styles.placeholderText}>
            지도 기능은 모바일 앱에서만 사용할 수 있습니다.
          </Text>
          <Text style={styles.placeholderSubtext}>
            Expo Go 앱으로 스캔하여 모바일에서 지도를 확인해보세요.
          </Text>
        </View>
      </View>
    );
  }

  // 모바일에서만 지도 컴포넌트 렌더링
  return <MobileMapScreen />;
}

// 모바일 전용 지도 컴포넌트
function MobileMapScreen() {
  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>지도</Text>
        <Text style={styles.subTitle}>주변 장소를 확인해보세요</Text>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.5665,       // 서울 위도
            longitude: 126.9780,     // 서울 경도
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: 37.5665, longitude: 126.9780 }}
            title="서울"
            description="Seoul, South Korea"
          />
          <Marker
            coordinate={{ latitude: 37.4979, longitude: 127.0276 }}
            title="강남구"
            description="Gangnam-gu, Seoul"
          />
          <Marker
            coordinate={{ latitude: 37.5519, longitude: 126.9882 }}
            title="마포구"
            description="Mapo-gu, Seoul"
          />
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 12,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginTop: 20,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    margin: 20,
  },
  map: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 200,
  },
});