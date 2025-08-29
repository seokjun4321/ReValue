import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface AddressSearchProps {
  onSelect: (address: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function AddressSearch({ onSelect }: AddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location.LocationGeocodedAddress[]>([]);
  const [loading, setLoading] = useState(false);

  // 주소 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const addresses = await Promise.all(
          results.map(result =>
            Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            })
          )
        );
        setSearchResults(addresses.flat());
      } else {
        Alert.alert('알림', '검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('주소 검색 실패:', error);
      Alert.alert('오류', '주소 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주소 포맷팅
  const formatAddress = (address: Location.LocationGeocodedAddress): string => {
    const components = [
      address.region, // 시/도
      address.subregion, // 시/군/구
      address.street, // 도로명
    ].filter(Boolean);
    
    return components.join(' ');
  };

  // 현재 위치 가져오기
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('알림', '위치 권한이 필요합니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (addresses.length > 0) {
        const formattedAddress = formatAddress(addresses[0]);
        onSelect({
          address: formattedAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        setSearchResults([]);
      }
    } catch (error) {
      console.error('현재 위치 가져오기 실패:', error);
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 주소 검색 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="주소를 입력하세요"
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="search" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* 현재 위치 버튼 */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={20} color="#22c55e" />
        <Text style={styles.locationButtonText}>현재 위치 사용</Text>
      </TouchableOpacity>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultContainer}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItem}
              onPress={() => {
                const address = formatAddress(result);
                if (result.latitude && result.longitude) {
                  onSelect({
                    address,
                    latitude: result.latitude,
                    longitude: result.longitude
                  });
                }
                setSearchResults([]);
                setSearchQuery('');
              }}
            >
              <Ionicons name="location" size={20} color="#22c55e" />
              <Text style={styles.resultText}>{formatAddress(result)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fdf8',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    color: '#374151',
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  resultContainer: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  resultText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
});