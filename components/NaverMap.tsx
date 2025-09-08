import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import NaverMapView, { 
  Marker,
  Circle,
  Polyline,
  Polygon
} from '@wayne-kim/react-native-nmap';
import * as Location from 'expo-location';

interface NaverMapProps {
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    category?: string;
    discountRate?: number;
    isNew?: boolean;
  }>;
  onMarkerPress?: (markerId: string) => void;
  currentLocation?: Location.LocationObject | null;
  style?: any;
}

export default function NaverMap({ 
  markers = [], 
  onMarkerPress, 
  currentLocation,
  style 
}: NaverMapProps) {
  
  // 기본 지도 중심 좌표 (서울 시청)
  const defaultCenter = {
    latitude: 37.5665,
    longitude: 126.9780,
    zoom: 15,
  };

  // 현재 위치가 있으면 해당 위치로, 없으면 기본 위치
  const mapCenter = currentLocation ? {
    latitude: currentLocation.coords.latitude,
    longitude: currentLocation.coords.longitude,
    zoom: 15,
  } : defaultCenter;

  // 카테고리별 마커 색상
  const getMarkerColor = (category?: string, isNew?: boolean) => {
    if (isNew) return '#22c55e'; // 신규 매장은 메인 Green
    
    switch (category) {
      case 'food': return '#f59e0b';
      case 'clothing': return '#8b5cf6';
      case 'household': return '#06b6d4';
      case 'electronics': return '#ef4444';
      case 'books': return '#84cc16';
      case 'sports': return '#f97316';
      case 'beauty': return '#ec4899';
      default: return '#22c55e'; // 기본 Green
    }
  };

  return (
    <View style={[styles.container, style]}>
      <NaverMapView
        style={styles.map}
        center={mapCenter}
        zoomControl={true}
        locationButtonEnable={true}
        showsMyLocationButton={true}
        compass={true}
        scaleBar={true}
        mapType={0} // 0: 기본, 1: 위성, 2: 하이브리드
        onTouch={() => console.log('지도 터치')}
        onCameraChange={(event) => {
          console.log('카메라 변경:', event);
        }}
      >
        {/* 현재 위치 마커로 표시 */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            pinColor="#3b82f6"
            caption={{
              text: "현재 위치",
              textSize: 12,
              color: '#ffffff',
              haloColor: '#3b82f6',
              requestedWidth: 80,
              minZoom: 10,
              maxZoom: 21,
            }}
          />
        )}

        {/* 마커들 표시 */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            pinColor={getMarkerColor(marker.category, marker.isNew)}
            alpha={1}
            flat={false}
            rotation={0}
            anchor={{ x: 0.5, y: 1 }}
            caption={{
              text: marker.title,
              textSize: 12,
              color: '#000000',
              haloColor: '#ffffff',
              requestedWidth: 100,
              minZoom: 10,
              maxZoom: 21,
            }}
            subCaption={marker.discountRate && marker.discountRate >= 50 ? {
              text: `${marker.discountRate}% 할인`,
              textSize: 10,
              color: '#22c55e',
              haloColor: '#ffffff',
              requestedWidth: 80,
              minZoom: 12,
              maxZoom: 21,
            } : undefined}
            onClick={() => {
              console.log('마커 클릭:', marker.id);
              if (onMarkerPress) {
                onMarkerPress(marker.id);
              }
            }}
          />
        ))}
      </NaverMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
